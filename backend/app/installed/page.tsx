import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import React from "react";
import PrivacyForm from "./PrivacyForm";

export const dynamic = "force-dynamic";

export default async function InstalledPage() {
  const session = await getServerSession(authOptions);
  const userId = (session as any)?.user?.id as string | undefined;

  let allowDataUse = false;
  let defaultIncognito = false;
  let promptLabOptIn = false;

  if (userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        allowDataUse: true,
        defaultIncognito: true,
        promptLabOptIn: true,
      },
    });
    allowDataUse = !!user?.allowDataUse;
    defaultIncognito = !!user?.defaultIncognito;
    promptLabOptIn = !!user?.promptLabOptIn;
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6 py-16 bg-[radial-gradient(1200px_800px_at_50%_-20%,rgba(255,255,255,0.12),rgba(0,0,0,0)_60%)]">
      <div className="w-full max-w-2xl rounded-2xl border border-zinc-800 bg-black/50 p-8 shadow-xl">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-white">
          Welcome to Orbitar
        </h1>
        <p className="mt-3 text-zinc-300 leading-relaxed">
          Orbitar helps you turn half‑baked ideas into sharp, model‑ready
          prompts — right inside tools like ChatGPT.
        </p>

        <div className="mt-6 rounded-lg border border-zinc-800 bg-zinc-950/60 p-4">
          <h2 className="text-lg font-medium text-white">
            How we handle your text
          </h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-zinc-300">
            <li>
              Your text is sent securely to Orbitar and our AI provider only to
              generate a refined prompt.
            </li>
            <li>
              By default, we don’t use your content to train models or build new
              templates.
            </li>
            <li>
              If you opt in, we strip common identifiers (emails, phone numbers,
              URLs, IDs) before analyzing anonymized snippets.
            </li>
            <li>Incognito refines always skip content logging.</li>
          </ul>
        </div>

        <div className="mt-6">
          {!userId ? (
            <div className="rounded-md border border-zinc-800 bg-zinc-950/60 p-4 text-zinc-300">
              Please sign in to manage your privacy settings.
            </div>
          ) : (
            <PrivacyForm
              initialAllowDataUse={allowDataUse}
              initialDefaultIncognito={defaultIncognito}
              initialPromptLabOptIn={promptLabOptIn}
            />
          )}
        </div>
        <div className="mt-6">
          <a
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-md border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
