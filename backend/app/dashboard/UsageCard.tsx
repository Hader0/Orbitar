"use client";

import React from "react";

type Last7Day = { date: string; count: number };
type ByCategory = { category: string; count: number };
type ByTemplate = { templateId: string; count: number };

export default function UsageCard() {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [total, setTotal] = React.useState<number | null>(null);
  const [last7Days, setLast7Days] = React.useState<Last7Day[] | null>(null);
  const [byCategory, setByCategory] = React.useState<ByCategory[] | null>(null);
  const [byTemplate, setByTemplate] = React.useState<ByTemplate[] | null>(null);

  React.useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    fetch("/api/user/stats", { method: "GET", credentials: "same-origin" })
      .then(async (res) => {
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          throw new Error(d?.error || `Failed (${res.status})`);
        }
        return res.json();
      })
      .then((data) => {
        if (!mounted) return;
        setTotal(data.totalPrompts ?? 0);
        setLast7Days(data.last7Days ?? []);
        setByCategory(data.byCategory ?? []);
        setByTemplate(data.byTemplate ?? []);
      })
      .catch((err) => {
        if (!mounted) return;
        console.error("Usage fetch error:", err);
        setError(err?.message || "Failed to load usage");
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="bg-white text-gray-900 p-6 rounded-lg shadow border">
      <h2 className="text-xl font-semibold mb-4">Usage</h2>

      {loading && <p className="text-sm text-gray-500">Loading usage...</p>}
      {error && <p className="text-sm text-red-500">Error: {error}</p>}

      {!loading && !error && (
        <div className="space-y-4">
          <div>
            <p className="text-3xl font-bold">{total ?? 0}</p>
            <p className="text-gray-500 text-sm">Total prompts refined</p>
          </div>

          <div>
            <h3 className="font-medium">Last 7 days</h3>
            <div className="mt-2 grid grid-cols-7 gap-2 text-xs">
              {last7Days &&
                last7Days.map((d) => (
                  <div key={d.date} className="text-center">
                    <div className="text-sm font-semibold">{d.count}</div>
                    <div className="text-zinc-500">{d.date.slice(5)}</div>
                  </div>
                ))}
            </div>
          </div>

          <div>
            <h3 className="font-medium">By category</h3>
            <ul className="mt-2 space-y-1 text-sm">
              {byCategory && byCategory.length > 0 ? (
                byCategory.map((c) => (
                  <li key={c.category} className="flex justify-between">
                    <span>{c.category}</span>
                    <span className="text-zinc-600">{c.count}</span>
                  </li>
                ))
              ) : (
                <li className="text-zinc-500">No category data</li>
              )}
            </ul>
          </div>

          <div>
            <h3 className="font-medium">Top templates</h3>
            <ul className="mt-2 space-y-1 text-sm">
              {byTemplate && byTemplate.length > 0 ? (
                byTemplate.slice(0, 5).map((t) => (
                  <li key={t.templateId} className="flex justify-between">
                    <span className="font-mono text-sm">{t.templateId}</span>
                    <span className="text-zinc-600">{t.count}</span>
                  </li>
                ))
              ) : (
                <li className="text-zinc-500">No template data</li>
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
