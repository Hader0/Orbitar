import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-slate-900 to-slate-800 text-white p-8">
      <div className="max-w-2xl text-center space-y-8">
        <h1 className="text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
          Orbitar
        </h1>
        <p className="text-xl text-slate-300">
          Your AI-powered prompt refinement assistant.
        </p>
        
        <div className="flex gap-4 justify-center">
          <Link 
            href="/dashboard"
            className="px-8 py-3 rounded-full bg-indigo-600 hover:bg-indigo-500 font-semibold transition-all shadow-lg hover:shadow-indigo-500/25"
          >
            Go to Dashboard
          </Link>
        </div>

        <div className="mt-12 p-6 bg-slate-800/50 rounded-xl border border-slate-700 text-left">
          <h3 className="font-semibold mb-2 text-indigo-300">Getting Started:</h3>
          <ol className="list-decimal list-inside space-y-2 text-slate-400 text-sm">
            <li>Go to the <strong>Dashboard</strong> and sign in (Dev Login).</li>
            <li>Generate your <strong>API Key</strong>.</li>
            <li>Click the <strong>Orbitar extension icon</strong> in your browser.</li>
            <li>Paste the key and click <strong>Save</strong>.</li>
            <li>Visit any site (e.g., Google Docs, ChatGPT) and start typing!</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
