import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Stripe webhook endpoint.
 *
 * Expects:
 * - STRIPE_WEBHOOK_SECRET in env
 *
 * Handles checkout.session.completed:
 * - reads client_reference_id or metadata.userId to find the user
 * - retrieves the subscription to read the price id (to map to a plan)
 * - updates the user's plan, stripeSubscriptionId, and stripeSubscriptionStatus
 *
 * Notes:
 * - Responds 400 on signature verification failure
 * - Returns 200 after processing even if user not found (to avoid retries)
 */

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("Stripe webhook: STRIPE_WEBHOOK_SECRET not set");
    return NextResponse.json(
      { error: "Webhook not configured" },
      { status: 500 }
    );
  }
  if (!sig) {
    console.error("Stripe webhook: missing stripe-signature header");
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  // Read raw body as text
  const body = await req.text();

  let event: any;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    console.error(
      "Stripe webhook signature verification failed:",
      err?.message || err
    );
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    const type = event.type;
    if (type === "checkout.session.completed") {
      const session = event.data.object as any;

      // Prefer client_reference_id (we set this when creating the Checkout session).
      const userId = session.client_reference_id || session.metadata?.userId;
      const metadataPlan = session.metadata?.planRequested;

      // subscription id may be available on the session; fetch subscription to read price id & status
      const subscriptionId = session.subscription as string | undefined | null;
      let priceId: string | null = null;
      let subscriptionStatus: string | null = null;

      if (subscriptionId) {
        try {
          const subscription = await stripe.subscriptions.retrieve(
            subscriptionId,
            {
              expand: ["items.data.price"],
            }
          );
          subscriptionStatus = subscription.status ?? null;
          const firstItem = subscription.items?.data?.[0];
          if (firstItem && firstItem.price && (firstItem.price as any).id) {
            priceId = (firstItem.price as any).id;
          }
        } catch (err) {
          console.error("Stripe webhook: failed to retrieve subscription", err);
        }
      }

      // Map priceId -> plan; fall back to metadata.planRequested (if provided)
      const priceToPlan = (pid: string | null | undefined) => {
        if (!pid) return null;
        if (
          process.env.STRIPE_PRICE_BUILDER &&
          pid === process.env.STRIPE_PRICE_BUILDER
        )
          return "builder";
        if (
          process.env.STRIPE_PRICE_PRO &&
          pid === process.env.STRIPE_PRICE_PRO
        )
          return "pro";
        // also support older env names if present
        if (
          process.env.STRIPE_PRICE_LIGHT &&
          pid === process.env.STRIPE_PRICE_LIGHT
        )
          return "builder";
        return null;
      };

      let plan: string | null = null;
      plan = priceToPlan(priceId);
      if (!plan && typeof metadataPlan === "string") {
        // normalize metadata plan values like "builder" | "pro" | "light"
        const mp = metadataPlan.toLowerCase();
        if (mp === "builder" || mp === "light") plan = "builder";
        if (mp === "pro") plan = "pro";
      }

      if (!userId) {
        console.warn(
          "Stripe webhook: checkout.session.completed missing client_reference_id / metadata.userId"
        );
        // still return 200 to acknowledge webhook
        return NextResponse.json({ received: true }, { status: 200 });
      }

      // Find the user and update their plan
      try {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
          console.warn("Stripe webhook: user not found for id", userId);
          return NextResponse.json({ received: true }, { status: 200 });
        }

        const data: any = {};
        if (plan) {
          data.plan = plan;
        }
        if (subscriptionId) {
          data.stripeSubscriptionId = subscriptionId;
        }
        if (subscriptionStatus) {
          data.stripeSubscriptionStatus = subscriptionStatus;
        }

        if (Object.keys(data).length > 0) {
          await prisma.user.update({
            where: { id: userId },
            data,
          });
          console.log(
            `Stripe webhook: updated user ${userId} plan=${plan} subscription=${subscriptionId} status=${subscriptionStatus}`
          );
        } else {
          console.log(
            `Stripe webhook: no updatable data for user ${userId} (plan mapping missing)`
          );
        }
      } catch (err) {
        console.error("Stripe webhook: failed to update user", err);
        // Return 500 so Stripe may retry; but be careful — missing user should not cause retry, we already handled not-found above.
        return NextResponse.json(
          { error: "Internal server error" },
          { status: 500 }
        );
      }

      return NextResponse.json({ received: true }, { status: 200 });
    } else {
      // For other event types, acknowledge but do nothing for now.
      console.log("Stripe webhook: unhandled event type", event.type);
      return NextResponse.json({ received: true }, { status: 200 });
    }
  } catch (err) {
    console.error("Stripe webhook: processing error", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
