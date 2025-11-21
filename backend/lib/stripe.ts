import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  // Do not throw here to avoid crashing dev server at import time; routes will validate and return clear errors
  console.error(
    "Stripe: STRIPE_SECRET_KEY not set. Stripe routes will fail until configured."
  );
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");
