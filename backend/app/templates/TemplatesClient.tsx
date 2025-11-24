"use client";

import React from "react";

export type TemplateWithEnabled = {
  id: string;
  label: string;
  description: string;
  category: string;
  status?: "ga" | "beta" | "experimental";
  minPlan?: "free" | "builder" | "pro";
  enabled: boolean;
};

export default function TemplatesClient({
  initialTemplates,
  userPlan,
}: {
  initialTemplates: TemplateWithEnabled[];
  userPlan: "free" | "builder" | "pro";
}) {
  const [templates, setTemplates] =
    React.useState<TemplateWithEnabled[]>(initialTemplates);
  const [saving, setSaving] = React.useState<Record<string, boolean>>({});
  const [error, setError] = React.useState<Record<string, string | null>>({});

  const rank = { free: 0, builder: 1, pro: 2 } as const;

  // Group by category for rendering
  const grouped = React.useMemo(() => {
    const g: Record<string, TemplateWithEnabled[]> = {};
    for (const t of templates) {
      if (!g[t.category]) g[t.category] = [];
      g[t.category].push(t);
    }
    return g;
  }, [templates]);

  function isAllowedByPlan(t: TemplateWithEnabled) {
    const minPlan = t.minPlan || "free";
    return rank[userPlan] >= rank[minPlan];
  }

  async function toggleTemplate(tid: string, nextEnabled: boolean) {
    setSaving((s) => ({ ...s, [tid]: true }));
    setError((e) => ({ ...e, [tid]: null }));

    // optimistic update
    const prev = templates;
    setTemplates((ts) =>
      ts.map((t) => (t.id === tid ? { ...t, enabled: nextEnabled } : t))
    );

    try {
      const resp = await fetch("/api/templates/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId: tid, enabled: nextEnabled }),
      });
      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        throw new Error(data?.error || `Request failed (${resp.status})`);
      }
    } catch (err: any) {
      // revert on failure
      setTemplates(prev);
      setError((e) => ({
        ...e,
        [tid]: err?.message || "Failed to save preference",
      }));
    } finally {
      setSaving((s) => ({ ...s, [tid]: false }));
    }
  }

  function StatusBadge({ status }: { status?: string }) {
    if (!status || status === "ga") return null;
    const map: Record<string, string> = {
      beta: "bg-amber-100 text-amber-800",
      experimental: "bg-red-100 text-red-700",
    };
    const cls = map[status] || "bg-zinc-100 text-zinc-700";
    const label =
      status === "beta"
        ? "BETA"
        : status === "experimental"
        ? "EXPERIMENTAL"
        : status.toUpperCase();
    return (
      <span className={`ml-2 inline-block rounded px-2 py-0.5 text-xs ${cls}`}>
        {label}
      </span>
    );
  }

  return (
    <div className="space-y-8">
      {Object.entries(grouped).map(([cat, list]) => (
        <section key={cat}>
          <h2 className="text-xl font-semibold mb-4 capitalize">{cat}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((t) => {
              const isSaving = !!saving[t.id];
              const err = error[t.id];
              const allowed = isAllowedByPlan(t);
              const minPlanBadge =
                t.minPlan === "pro"
                  ? { cls: "bg-purple-100 text-purple-700", label: "Pro" }
                  : t.minPlan === "builder"
                  ? { cls: "bg-indigo-100 text-indigo-700", label: "Builder" }
                  : { cls: "bg-zinc-100 text-zinc-700", label: "Free" };

              return (
                <div
                  key={t.id}
                  className={`rounded-lg p-4 bg-slate-800/40 border border-slate-700 ${
                    allowed ? "" : "opacity-60"
                  }`}
                  title={allowed ? undefined : "Upgrade to use this template."}
                >
                  <div className="flex items-start justify-between">
                    <div className="pr-3">
                      <div className="font-medium text-white flex items-center gap-2">
                        <span>{t.label}</span>
                        <span
                          className={`inline-block rounded px-2 py-0.5 text-xs ${minPlanBadge.cls}`}
                        >
                          {minPlanBadge.label}
                        </span>
                        <StatusBadge status={t.status} />
                      </div>
                      <div className="text-sm text-slate-300 mt-1">
                        {t.description}
                      </div>
                    </div>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-indigo-500"
                        checked={t.enabled}
                        onChange={(e) =>
                          toggleTemplate(t.id, e.currentTarget.checked)
                        }
                        disabled={isSaving || !allowed}
                        aria-label={`Enable ${t.label}`}
                      />
                      <span className="text-slate-200">
                        {allowed
                          ? isSaving
                            ? "Saving…"
                            : "Enabled"
                          : "Locked"}
                      </span>
                    </label>
                  </div>
                  {err && (
                    <div className="mt-2 text-xs text-red-400">{err}</div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
