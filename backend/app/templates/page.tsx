import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { templateRegistry } from "@/lib/templates";
import TemplatesClient, { TemplateWithEnabled } from "./TemplatesClient";

export const dynamic = "force-dynamic";

export default async function TemplatesPage() {
  const session = await getServerSession(authOptions);
  const userId = (session as any)?.user?.id as string | undefined;

  if (!userId) {
    // Require auth to manage personal template preferences
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <h1 className="text-2xl font-semibold mb-4">Templates</h1>
        <div className="rounded-md border border-zinc-800 bg-zinc-950/60 p-4 text-zinc-300">
          Please{" "}
          <a
            href="/api/auth/signin"
            className="text-indigo-300 hover:underline"
          >
            sign in
          </a>{" "}
          to view and manage your templates.
        </div>
      </div>
    );
  }

  // Load user and preferences
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true },
  });

  const prefs = await (prisma as any).userTemplatePreference.findMany({
    where: { userId },
    select: { templateId: true, enabled: true },
  });
  const prefMap: Record<string, boolean> = {};
  for (const p of prefs) {
    prefMap[p.templateId] = !!p.enabled;
  }

  // Map registry to per-user enabled flags (default enabled when missing)
  const initialTemplates: TemplateWithEnabled[] = Object.entries(
    templateRegistry
  ).map(([id, meta]) => ({
    id,
    label: meta.label,
    description: meta.description,
    category: meta.category,
    status: "ga",
    enabled: prefMap[id] ?? true,
  }));

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Templates</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Choose which templates you want enabled. These preferences affect
            your experience across Orbitar.
          </p>
        </div>
        <div>
          <Link
            href="/dashboard"
            className="text-sm text-slate-300 hover:text-white"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>

      <TemplatesClient
        initialTemplates={initialTemplates}
        userPlan={(user?.plan as any) ?? "free"}
      />
    </div>
  );
}
