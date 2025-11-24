import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  const userEmail = (session as any)?.user?.email as string | undefined;

  if (!userEmail) {
    redirect("/api/auth/signin");
  }

  const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@example.com";
  if (userEmail !== ADMIN_EMAIL) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <h1 className="text-2xl font-semibold mb-4">Admin — Access denied</h1>
        <p className="text-sm text-zinc-400">
          You do not have permission to view this page.
        </p>
      </div>
    );
  }

  // Gather global stats (server-side)
  const totalUsers = await prisma.user.count();
  const totalPrompts = await (prisma as any).promptEvent.count();

  // last 30 days (UTC buckets)
  const today = new Date();
  const utcToday = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
  );
  const startDate = new Date(utcToday);
  startDate.setUTCDate(startDate.getUTCDate() - 29); // 30 days inclusive

  const recentEvents = await (prisma as any).promptEvent.findMany({
    where: { createdAt: { gte: startDate } },
    select: { createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const last30DaysMap: Record<string, number> = {};
  for (let i = 0; i < 30; i++) {
    const d = new Date(startDate);
    d.setUTCDate(startDate.getUTCDate() + i);
    last30DaysMap[d.toISOString().slice(0, 10)] = 0;
  }
  for (const ev of recentEvents) {
    const key = ev.createdAt.toISOString().slice(0, 10);
    if (key in last30DaysMap) last30DaysMap[key]++;
  }
  const last30Days = Object.entries(last30DaysMap).map(([date, count]) => ({
    date,
    count,
  }));

  // byCategory
  const categories = await (prisma as any).promptEvent.findMany({
    select: { category: true },
  });
  const byCategoryMap: Record<string, number> = {};
  for (const c of categories) {
    const k =
      c.category && c.category.trim().length > 0 ? c.category : "unknown";
    byCategoryMap[k] = (byCategoryMap[k] || 0) + 1;
  }
  const byCategory = Object.entries(byCategoryMap)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);

  // byTemplate
  const templates = await (prisma as any).promptEvent.findMany({
    select: { templateId: true },
  });
  const byTemplateMap: Record<string, number> = {};
  for (const t of templates) {
    const k =
      t.templateId && t.templateId.trim().length > 0 ? t.templateId : "unknown";
    byTemplateMap[k] = (byTemplateMap[k] || 0) + 1;
  }
  const byTemplate = Object.entries(byTemplateMap)
    .map(([templateId, count]) => ({ templateId, count }))
    .sort((a, b) => b.count - a.count);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Admin — Global Stats</h1>

      <div className="grid gap-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white text-gray-900 p-6 rounded-lg shadow border">
            <div className="text-sm text-zinc-500">Total users</div>
            <div className="text-2xl font-bold mt-2">{totalUsers}</div>
          </div>

          <div className="bg-white text-gray-900 p-6 rounded-lg shadow border">
            <div className="text-sm text-zinc-500">Total prompts</div>
            <div className="text-2xl font-bold mt-2">{totalPrompts}</div>
          </div>

          <div className="bg-white text-gray-900 p-6 rounded-lg shadow border">
            <div className="text-sm text-zinc-500">Reporting period</div>
            <div className="text-2xl font-bold mt-2">Last 30 days (UTC)</div>
          </div>
        </div>

        <div className="bg-white text-gray-900 p-6 rounded-lg shadow border">
          <h2 className="text-lg font-medium mb-3">Last 30 days</h2>
          <div className="grid grid-cols-6 gap-2 text-xs">
            {last30Days.map((d) => (
              <div key={d.date} className="text-center">
                <div className="text-sm font-semibold">{d.count}</div>
                <div className="text-zinc-500">{d.date.slice(5)}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="bg-white text-gray-900 p-6 rounded-lg shadow border">
            <h3 className="font-medium mb-3">By category</h3>
            <ul className="space-y-1 text-sm">
              {byCategory.map((c) => (
                <li key={c.category} className="flex justify-between">
                  <span>{c.category}</span>
                  <span className="text-zinc-600">{c.count}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white text-gray-900 p-6 rounded-lg shadow border">
            <h3 className="font-medium mb-3">Top templates</h3>
            <ul className="space-y-1 text-sm">
              {byTemplate.slice(0, 10).map((t) => (
                <li key={t.templateId} className="flex justify-between">
                  <code className="font-mono">{t.templateId}</code>
                  <span className="text-zinc-600">{t.count}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
