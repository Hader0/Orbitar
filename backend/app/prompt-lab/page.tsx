import React from "react";

export const dynamic = "force-dynamic";

export default function PromptLabPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6 py-16 bg-[radial-gradient(1200px_800px_at_50%_-20%,rgba(255,255,255,0.12),rgba(0,0,0,0)_60%)]">
      <div className="w-full max-w-3xl rounded-2xl border border-zinc-800 bg-black/50 p-8 shadow-xl">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-white">
          Prompt Lab
        </h1>
        <p className="mt-3 text-zinc-300 leading-relaxed">
          Prompt Lab is Orbitar’s behind‑the‑scenes engine that tests and
          improves the prompts used by the Refine button.
        </p>

        <section className="mt-8">
          <h2 className="text-lg font-medium text-white">
            What is Prompt Lab?
          </h2>
          <p className="mt-3 text-zinc-300 leading-relaxed">
            Instead of freezing your prompts in time, Orbitar runs controlled
            experiments in the background to keep templates sharp, structured,
            and aligned with how people actually use the product.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-lg font-medium text-white">
            What happens if I opt in?
          </h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-300">
            <li>
              A small sample of your prompts may be anonymized and used in
              internal tests to make better templates.
            </li>
            <li>
              Uses a sample of your prompts to test improved prompt templates.
            </li>
            <li>Anonymized and time‑limited.</li>
            <li>Incognito refinements are never included.</li>
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="text-lg font-medium text-white">
            What Prompt Lab does not do
          </h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-300">
            <li>Expose your individual prompts or data publicly.</li>
            <li>
              Share implementation details, template names, or metrics that
              would help competitors copy the system.
            </li>
            <li>Use Incognito refinements in any experiments.</li>
          </ul>
          <p className="mt-4 text-xs text-zinc-400">
            We do not publish internal table names, exact metrics, thresholds,
            or algorithms—Prompt Lab is focused on safely improving quality for
            end users.
          </p>
        </section>

        <div className="mt-8 rounded-lg border border-zinc-800 bg-zinc-950/60 p-4">
          <p className="text-sm text-zinc-300">
            You can manage your privacy settings and opt‑in preference in the
            web app under Settings or the Installed page. Incognito refinements
            are always excluded from Prompt Lab.
          </p>
        </div>
      </div>
    </div>
  );
}
