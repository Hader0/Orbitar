import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function jsonCors(body: any, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      Vary: "Origin",
    },
  });
}

export function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userEmail = (session as any)?.user?.email as string | undefined;

    if (!userEmail) {
      return jsonCors({ error: "Unauthorized" }, 401);
    }

    const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@example.com";
    if (userEmail !== ADMIN_EMAIL) {
      return jsonCors({ error: "Forbidden" }, 403);
    }

    // total users
    const totalUsers = await prisma.user.count();

    // total prompts
    const totalPrompts = await (prisma as any).promptEvent.count();

    // last 30 days (UTC buckets)
    const today = new Date();
    const utcToday = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
    );
    const startDate = new Date(utcToday);
    startDate.setUTCDate(startDate.getUTCDate() - 29); // include today => 30 days

    const recentEvents = await (prisma as any).promptEvent.findMany({
      where: {
        createdAt: {
          gte: startDate,
        },
      },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    });

    // initialize map for 30 days
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

    // byCategory (global)
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

    // byTemplate (global)
    const templates = await (prisma as any).promptEvent.findMany({
      select: { templateId: true },
    });

    const byTemplateMap: Record<string, number> = {};
    for (const t of templates) {
      const k =
        t.templateId && t.templateId.trim().length > 0
          ? t.templateId
          : "unknown";
      byTemplateMap[k] = (byTemplateMap[k] || 0) + 1;
    }
    const byTemplate = Object.entries(byTemplateMap)
      .map(([templateId, count]) => ({ templateId, count }))
      .sort((a, b) => b.count - a.count);

    return jsonCors(
      {
        totalUsers,
        totalPrompts,
        last30Days,
        byCategory,
        byTemplate,
      },
      200
    );
  } catch (err) {
    console.error("Admin stats error:", err);
    return jsonCors({ error: "Internal server error" }, 500);
  }
}
