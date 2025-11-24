import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      <header className="max-w-6xl mx-auto px-6 py-16">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-semibold tracking-tight">Orbitar</h1>
          <nav className="space-x-4">
            <Link
              href="/dashboard"
              className="text-sm text-slate-300 hover:text-white"
            >
              Dashboard
            </Link>
            <a
              href="#install"
              className="text-sm text-slate-300 hover:text-white"
            >
              Install
            </a>
            <Link
              href="/templates"
              className="text-sm text-slate-300 hover:text-white"
            >
              Templates
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 pb-24">
        <section className="grid gap-8 md:grid-cols-2 items-center">
          <div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
              Refine every prompt before it hits your AI.
            </h2>
            <p className="mt-4 text-slate-300 max-w-xl">
              Orbitar is an inline prompt refiner for ChatGPT and other tools,
              powered by GPT‑5‑mini. Turn messy ideas into sharp, model‑ready
              prompts and get more reliable responses — faster.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="#"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-indigo-600 hover:bg-indigo-500 font-semibold transition"
              >
                Install Chrome Extension
              </a>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-full border border-slate-700 text-sm hover:bg-slate-800"
              >
                Open Dashboard
              </Link>
            </div>
          </div>

          <div className="rounded-xl p-6 bg-slate-800/40 border border-slate-700">
            <h3 className="font-semibold text-white">How it works</h3>
            <ol className="mt-4 list-decimal list-inside text-slate-300 space-y-2 text-sm">
              <li>Type normally in ChatGPT (or any composer).</li>
              <li>Trigger Orbitar from the inline toolbar or shortcut.</li>
              <li>
                Choose a category & template (or let Orbitar suggest one).
              </li>
              <li>Send a refined, structured prompt to the model.</li>
            </ol>

            <div className="mt-6">
              <h4 className="font-medium text-white">Why it's different</h4>
              <ul className="mt-3 text-slate-300 text-sm space-y-2">
                <li>Templates tuned for devs, writers, and founders.</li>
                <li>Per-user analytics and privacy-first defaults.</li>
                <li>
                  Lightweight — single call refine that keeps latency low.
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mt-12">
          <h3 className="text-xl font-semibold">Pricing preview</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="rounded-lg p-4 bg-slate-800/40 border border-slate-700">
              <div className="flex items-baseline justify-between">
                <div>
                  <div className="text-lg font-medium">Free</div>
                  <div className="text-sm text-slate-400">
                    Good for trying Orbitar
                  </div>
                </div>
                <div className="text-2xl font-bold">Free</div>
              </div>
              <ul className="mt-3 text-sm text-slate-300 space-y-1">
                <li>Daily requests: 10</li>
                <li>Access to core templates</li>
                <li>Basic analytics</li>
              </ul>
            </div>

            <div className="rounded-lg p-4 bg-slate-800/40 border border-slate-700">
              <div className="flex items-baseline justify-between">
                <div>
                  <div className="text-lg font-medium">Builder</div>
                  <div className="text-sm text-slate-400">For heavy users</div>
                </div>
                <div className="text-2xl font-bold">75 / day</div>
              </div>
              <ul className="mt-3 text-sm text-slate-300 space-y-1">
                <li>Daily requests: 75</li>
                <li>All templates + priority support</li>
                <li>Enhanced analytics</li>
              </ul>
            </div>

            <div className="rounded-lg p-4 bg-slate-800/40 border border-slate-700">
              <div className="flex items-baseline justify-between">
                <div>
                  <div className="text-lg font-medium">Pro</div>
                  <div className="text-sm text-slate-400">
                    For teams & power users
                  </div>
                </div>
                <div className="text-2xl font-bold">500 / day</div>
              </div>
              <ul className="mt-3 text-sm text-slate-300 space-y-1">
                <li>Daily requests: 500</li>
                <li>Priority on new templates</li>
                <li>Team features (coming soon)</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mt-12 grid gap-6 md:grid-cols-2">
          <div className="rounded-xl p-6 bg-slate-800/40 border border-slate-700">
            <h4 className="font-semibold">Privacy-first by default</h4>
            <p className="mt-2 text-slate-300 text-sm">
              Text you send to Orbitar is used to generate refinements and is
              not used to train models unless you explicitly opt in. Incognito
              refinements skip logging and are excluded from analyses by
              default.
            </p>
          </div>

          <div className="rounded-xl p-6 bg-slate-800/40 border border-slate-700">
            <h4 className="font-semibold">Templates store</h4>
            <p className="mt-2 text-slate-300 text-sm">
              Browse curated templates tuned for common workflows (coding,
              writing, planning). Head to{" "}
              <Link
                href="/templates"
                className="text-indigo-300 hover:underline"
              >
                Templates
              </Link>{" "}
              to explore.
            </p>
          </div>
        </section>

        <footer className="mt-16 text-center text-sm text-slate-400">
          <div>Orbitar — inline prompt refinement for better AI results.</div>
          <div className="mt-2">Built with privacy and speed in mind.</div>
        </footer>
      </main>
    </div>
  );
}
