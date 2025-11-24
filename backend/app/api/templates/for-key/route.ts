import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { templateRegistry, PlanName } from "@/lib/templates";

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

const rank: Record<PlanName, number> = { free: 0, builder: 1, pro: 2 };

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonCors({ error: "Missing or invalid token" }, 401);
    }
    const token = authHeader.split(" ")[1];

    const apiKey = await prisma.apiKey.findFirst({
      where: { key: token, revoked: false },
      include: { user: true },
    });

    if (!apiKey || !apiKey.user) {
      return jsonCors({ error: "Invalid API key" }, 401);
    }

    const user = apiKey.user as any;
    const userPlan = (user.plan as PlanName) || "free";

    // Load user template preferences
    const prefs = await (prisma as any).userTemplatePreference.findMany({
      where: { userId: user.id },
      select: { templateId: true, enabled: true },
    });
    const prefMap: Record<string, boolean> = {};
    for (const p of prefs) prefMap[p.templateId] = !!p.enabled;

    // Compute usable templates: plan meets minPlan AND enabled != false (default true)
    const templates = Object.entries(templateRegistry)
      .filter(([id, meta]) => {
        const minPlan = (meta as any).minPlan as PlanName;
        const allowedByPlan = rank[userPlan] >= rank[minPlan];
        const enabled = prefMap[id] ?? true;
        return allowedByPlan && enabled;
      })
      .map(([id, meta]) => ({
        id,
        label: meta.label,
        description: meta.description,
        category: meta.category,
      }));

    return jsonCors({ templates }, 200);
  } catch (err) {
    console.error("Templates for-key error:", err);
    return jsonCors({ error: "Internal server error" }, 500);
  }
}
