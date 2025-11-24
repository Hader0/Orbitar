import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { templateRegistry } from "@/lib/templates";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function json(body: any, status = 200) {
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

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session as any)?.user?.id as string | undefined;

    if (!userId) {
      return json({ error: "Unauthorized" }, 401);
    }

    // Load user prefs (enabled overrides). If no row => enabled by default (true).
    const prefs = await (prisma as any).userTemplatePreference.findMany({
      where: { userId },
      select: { templateId: true, enabled: true },
    });
    const prefMap: Record<string, boolean> = {};
    for (const p of prefs) {
      prefMap[p.templateId] = !!p.enabled;
    }

    type TemplateWithEnabled = {
      id: string;
      label: string;
      description: string;
      category: string;
      status?: "ga" | "beta" | "experimental";
      minPlan: "free" | "builder" | "pro";
      enabled: boolean;
    };

    const templates: TemplateWithEnabled[] = Object.entries(
      templateRegistry
    ).map(([id, meta]) => ({
      id,
      label: meta.label,
      description: meta.description,
      category: meta.category,
      status: "ga",
      minPlan: (meta as any).minPlan ?? "free",
      enabled: prefMap[id] ?? true,
    }));

    return json({ templates }, 200);
  } catch (err) {
    console.error("Templates/me error:", err);
    return json({ error: "Internal server error" }, 500);
  }
}
