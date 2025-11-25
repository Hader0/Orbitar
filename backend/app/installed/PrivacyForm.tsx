"use client";

import React from "react";

function CheckIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
    >
      <path
        d="M20 6L9 17l-5-5"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Spinner({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 50 50" aria-label="Loading">
      <circle
        cx="25"
        cy="25"
        r="20"
        fill="none"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray="31.4 188.4"
      >
        <animateTransform
          attributeName="transform"
          type="rotate"
          from="0 25 25"
          to="360 25 25"
          dur="0.9s"
          repeatCount="indefinite"
        />
      </circle>
    </svg>
  );
}

export default function PrivacyForm({
  initialAllowDataUse,
  initialDefaultIncognito,
  initialPromptLabOptIn,
}: {
  initialAllowDataUse: boolean;
  initialDefaultIncognito: boolean;
  initialPromptLabOptIn: boolean;
}) {
  const [allowChecked, setAllowChecked] =
    React.useState<boolean>(initialAllowDataUse);
  const [defaultIncognito, setDefaultIncognito] = React.useState<boolean>(
    initialDefaultIncognito
  );
  const [promptLabOptIn, setPromptLabOptIn] = React.useState<boolean>(
    initialPromptLabOptIn
  );
  const [pending, setPending] = React.useState<boolean>(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setMessage(null);
    setError(null);
    try {
      const resp = await fetch("/api/settings/privacy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          allowDataUse: allowChecked,
          defaultIncognito: defaultIncognito,
          promptLabOptIn: promptLabOptIn,
        }),
      });
      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        throw new Error(data?.error || `Request failed (${resp.status})`);
      }
      setMessage("Saved");
      // clear message after short delay
      setTimeout(() => setMessage(null), 2500);
    } catch (err: any) {
      setError(err?.message || "Failed to save");
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-4"
    >
      <h3 className="text-sm font-medium text-white mb-2">
        Help improve Orbitar (optional)
      </h3>

      <label className="flex items-start gap-3 text-zinc-200">
        <input
          type="checkbox"
          className="mt-1 h-4 w-4 accent-zinc-200"
          checked={allowChecked}
          onChange={(e) => setAllowChecked(e.target.checked)}
        />
        <span>
          Share anonymized prompts & refinements to improve Orbitar
          <span className="block text-xs text-zinc-400">
            We strip common identifiers (emails, phone numbers, URLs) before
            analyzing anonymized snippets. Retention is limited and data is
            never used to train models unless you opt in.
          </span>
        </span>
      </label>

      <label className="flex items-start gap-3 mt-4 text-zinc-200">
        <input
          type="checkbox"
          className="mt-1 h-4 w-4 accent-zinc-200"
          checked={defaultIncognito}
          onChange={(e) => setDefaultIncognito(e.target.checked)}
        />
        <span>
          Treat all my refinements as incognito by default
          <span className="block text-xs text-zinc-400">
            Incognito refinements are excluded from certain analyses and marked
            to avoid being surfaced in templates.
          </span>
        </span>
      </label>

      <label className="flex items-start gap-3 mt-4 text-zinc-200">
        <input
          type="checkbox"
          className="mt-1 h-4 w-4 accent-zinc-200"
          checked={promptLabOptIn}
          onChange={(e) => setPromptLabOptIn(e.target.checked)}
        />
        <span>
          Help improve Orbitar’s templates (Prompt Lab)
          <span className="block text-xs text-zinc-400">
            Opt in to allow anonymized prompts/refinements to be used for Prompt
            Lab evaluations and template improvements. Incognito refinements are
            always excluded.
          </span>
        </span>
      </label>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-md border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
        >
          {pending ? (
            <Spinner className="h-4 w-4" />
          ) : (
            <CheckIcon className="h-4 w-4" />
          )}
          Save
        </button>
        {message && <span className="text-sm text-emerald-400">{message}</span>}
        {error && <span className="text-sm text-red-400">{error}</span>}
      </div>
    </form>
  );
}
