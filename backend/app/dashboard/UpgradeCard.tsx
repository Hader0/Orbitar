"use client";

import React from "react";

export default function UpgradeCard({ currentPlan }: { currentPlan: string }) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function startCheckout(plan: "builder" | "pro") {
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      if (!resp.ok) {
        const d = await resp.json().catch(() => ({}));
        throw new Error(d?.error || `Request failed (${resp.status})`);
      }
      const data = await resp.json();
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err: any) {
      console.error("Checkout error:", err);
      setError(err?.message || "Failed to start checkout");
    } finally {
      setLoading(false);
    }
  }

  // Determine available upgrades
  const plan = (currentPlan || "free").toLowerCase();
  const showBuilder = plan === "free";
  const showPro = plan === "free" || plan === "builder";

  return (
    <div className="bg-white text-gray-900 p-4 rounded-lg shadow border">
      <h3 className="text-lg font-medium mb-2">Upgrade</h3>
      <div className="text-sm text-zinc-600 mb-4">
        Current plan: <span className="font-medium capitalize">{plan}</span>
      </div>

      <div className="flex gap-2">
        {showBuilder && (
          <button
            onClick={() => startCheckout("builder")}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded bg-indigo-600 px-3 py-2 text-sm text-white hover:bg-indigo-500"
          >
            {loading ? "Opening…" : "Upgrade to Light (Builder)"}
          </button>
        )}

        {showPro && (
          <button
            onClick={() => startCheckout("pro")}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded border border-slate-700 px-3 py-2 text-sm hover:bg-slate-800"
          >
            {loading ? "Opening…" : "Upgrade to Pro"}
          </button>
        )}
      </div>

      {error && <div className="text-sm text-red-500 mt-3">{error}</div>}
    </div>
  );
}
