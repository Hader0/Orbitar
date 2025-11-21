import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

function mapPriceToPlan(
  priceId: string | null | undefined
): "builder" | "pro" | null {
  if (!priceId) return null;
  if (priceId === process.env.STRIPE_PRICE_BUILDER) return "builder";
  if (priceId === process.env.STRIPE_PRICE_PRO) return "pro";
  return null;
}

async function updateUserFromSubscription(sub: Stripe.Subscription) {
  const customerId =
    typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
  if (!customerId) return;

  const priceId = sub.items?.data?.[0]?.price?.id;
  const plan = mapPriceToPlan(priceId);

  // Cast to any to avoid transient Prisma type mismatch if client types lag schema changes during dev.
  await prisma.user.updateMany({
    where: { stripeCustomerId: customerId },
    data: {
      stripeSubscriptionId: sub.id,
      stripeSubscriptionStatus: sub.status,
      ...(plan ? { plan } : {}),
    } as any,
  });
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error("Stripe webhook secret not configured.");
      return NextResponse.json(
        { error: "Stripe not configured" },
        { status: 500 }
      );
    }

    const sig = req.headers.get("stripe-signature");
    const rawBody = await req.text();

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        sig as string,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error("Stripe webhook signature verification failed.", err);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId =
          typeof session.customer === "string"
            ? session.customer
            : session.customer?.id;
        const subscriptionId =
          typeof session.subscription === "string"
            ? session.subscription
            : (session.subscription as Stripe.Subscription)?.id;

        if (subscriptionId) {
          // Retrieve subscription to know status and price
          const sub = await stripe.subscriptions.retrieve(subscriptionId);
          await updateUserFromSubscription(sub);
        } else if (customerId) {
          // Fallback: update user with known customer id
          await prisma.user.updateMany({
            where: { stripeCustomerId: customerId },
            data: {},
          });
        }
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.created":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await updateUserFromSubscription(subscription);
        break;
      }
      default: {
        // No-op for unhandled events
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Stripe webhook error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Ensure the route is dynamic (no caching) and uses the Node runtime
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
