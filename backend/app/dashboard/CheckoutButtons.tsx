"use client";

import { useState } from "react";

type Plan = "builder" | "pro";

export function CheckoutButtons({ disabled }: { disabled?: boolean }) {
  const [loadingPlan, setLoadingPlan] = useState<Plan | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout(plan: Plan) {
    try {
      setError(null);
      setLoadingPlan(plan);
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Failed to start checkout");
      }
      const data = await res.json();
      if (!data?.url) {
        throw new Error("Checkout URL missing");
      }
      window.location.href = data.url as string;
    } catch (e: any) {
      setError(e?.message || "Checkout error");
      setLoadingPlan(null);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        onClick={() => startCheckout("builder")}
        disabled={disabled || loadingPlan !== null}
      >
        {loadingPlan === "builder" ? "Redirecting..." : "Upgrade to Builder"}
      </button>
      <button
        className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
        onClick={() => startCheckout("pro")}
        disabled={disabled || loadingPlan !== null}
      >
        {loadingPlan === "pro" ? "Redirecting..." : "Upgrade to Pro"}
      </button>
      {error && <span className="text-sm text-red-600">{error}</span>}
    </div>
  );
}
