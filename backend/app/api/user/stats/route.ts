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
    const userId = (session as any)?.user?.id as string | undefined;

    if (!userId) {
      return jsonCors({ error: "Unauthorized" }, 401);
    }

    // total prompts
    const totalPrompts = await (prisma as any).promptEvent.count({
      where: { userId },
    });

    // last 7 days (UTC buckets). Build 7-day window inclusive of today.
    const today = new Date();
    // compute start of today in UTC then subtract 6 days
    const utcToday = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
    );
    const startDate = new Date(utcToday);
    startDate.setUTCDate(startDate.getUTCDate() - 6);

    const recentEvents = await (prisma as any).promptEvent.findMany({
      where: {
        userId,
        createdAt: {
          gte: startDate,
        },
      },
      select: {
        createdAt: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // Initialize buckets for the last 7 days
    const last7DaysMap: Record<string, number> = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(startDate);
      d.setUTCDate(startDate.getUTCDate() + i);
      const key = d.toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
      last7DaysMap[key] = 0;
    }

    // Bucket events by date (UTC)
    for (const ev of recentEvents) {
      const key = ev.createdAt.toISOString().slice(0, 10);
      if (key in last7DaysMap) last7DaysMap[key]++;
    }

    const last7Days = Object.entries(last7DaysMap).map(([date, count]) => ({
      date,
      count,
    }));

    // byCategory
    const categories = await (prisma as any).promptEvent.findMany({
      where: { userId },
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
      where: { userId },
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
        totalPrompts,
        last7Days,
        byCategory,
        byTemplate,
      },
      200
    );
  } catch (err) {
    console.error("User stats error:", err);
    return jsonCors({ error: "Internal server error" }, 500);
  }
}
