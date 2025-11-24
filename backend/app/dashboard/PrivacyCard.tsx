"use client";

import React from "react";

export default function PrivacyCard({
  initialAllowDataUse,
  initialDefaultIncognito,
}: {
  initialAllowDataUse: boolean;
  initialDefaultIncognito: boolean;
}) {
  const [allowDataUse, setAllowDataUse] = React.useState<boolean>(
    initialAllowDataUse ?? false
  );
  const [defaultIncognito, setDefaultIncognito] = React.useState<boolean>(
    initialDefaultIncognito ?? false
  );
  const [pending, setPending] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);

  async function updateServer(data: Record<string, boolean>) {
    setPending(true);
    setError(null);
    setMessage(null);
    try {
      const resp = await fetch("/api/settings/privacy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!resp.ok) {
        const d = await resp.json().catch(() => ({}));
        throw new Error(d?.error || `Failed (${resp.status})`);
      }
      setMessage("Saved");
      // clear message after short delay
      setTimeout(() => setMessage(null), 2500);
    } catch (err: any) {
      console.error("Privacy update failed:", err);
      setError(err?.message || "Failed to update");
      throw err;
    } finally {
      setPending(false);
    }
  }

  const onToggleAllow = async () => {
    const previous = allowDataUse;
    setAllowDataUse(!previous);
    try {
      await updateServer({ allowDataUse: !previous });
    } catch (err) {
      setAllowDataUse(previous); // revert
    }
  };

  const onToggleIncognito = async () => {
    const previous = defaultIncognito;
    setDefaultIncognito(!previous);
    try {
      await updateServer({ defaultIncognito: !previous });
    } catch (err) {
      setDefaultIncognito(previous); // revert
    }
  };

  return (
    <div className="bg-white text-gray-900 p-6 rounded-lg shadow border">
      <h2 className="text-xl font-semibold mb-4">Privacy & Data Use</h2>

      <div className="space-y-4">
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 accent-zinc-600"
            checked={allowDataUse}
            onChange={onToggleAllow}
            disabled={pending}
          />
          <div>
            <div className="font-medium">Share anonymized prompts</div>
            <div className="text-sm text-zinc-500">
              Share anonymized prompts & refinements to improve Orbitar.
            </div>
          </div>
        </label>

        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 accent-zinc-600"
            checked={defaultIncognito}
            onChange={onToggleIncognito}
            disabled={pending}
          />
          <div>
            <div className="font-medium">Default incognito</div>
            <div className="text-sm text-zinc-500">
              Treat all refinements as incognito by default.
            </div>
          </div>
        </label>

        <div className="flex items-center gap-3">
          {pending && <div className="text-sm text-zinc-500">Saving...</div>}
          {message && <div className="text-sm text-emerald-500">{message}</div>}
          {error && <div className="text-sm text-red-500">Error: {error}</div>}
        </div>
      </div>
    </div>
  );
}
