import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

type Plan = "builder" | "pro";

function getBaseUrl() {
  return process.env.ORBITAR_API_BASE_URL || "http://localhost:3000";
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { plan } = (await req.json()) as { plan?: Plan };
    if (!plan || (plan !== "builder" && plan !== "pro")) {
      return NextResponse.json(
        { error: "Invalid or missing plan" },
        { status: 400 }
      );
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      console.error("Stripe not configured: STRIPE_SECRET_KEY missing.");
      return NextResponse.json(
        { error: "Stripe not configured." },
        { status: 500 }
      );
    }

    const priceId =
      plan === "builder"
        ? process.env.STRIPE_PRICE_BUILDER
        : process.env.STRIPE_PRICE_PRO;
    if (!priceId) {
      console.error(`Stripe price not configured for plan: ${plan}`);
      return NextResponse.json(
        { error: "Stripe price not configured." },
        { status: 500 }
      );
    }

    // Load user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Ensure Stripe customer exists
    let stripeCustomerId = user.stripeCustomerId || null;
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        metadata: { userId: user.id },
      });
      stripeCustomerId = customer.id;
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId },
      });
    }

    const baseUrl = getBaseUrl();

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: stripeCustomerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/dashboard?checkout=success`,
      cancel_url: `${baseUrl}/dashboard?checkout=cancel`,
      allow_promotion_codes: true,
      metadata: {
        userId: user.id,
        planRequested: plan,
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (err) {
    console.error("Stripe checkout error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
