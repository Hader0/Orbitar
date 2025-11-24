import { NextRequest, NextResponse } from "next/server";
import { templateRegistry } from "@/lib/templates";

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

/**
 * GET /api/templates
 * Public (read-only) listing of available templates.
 *
 * Maps the internal `templateRegistry` to a stable public shape:
 * { id, label, description, category, status? }
 *
 * Status is not present in the internal registry; default to "ga" here forv0.
 */
export async function GET(_req: NextRequest) {
  try {
    const templates = Object.entries(templateRegistry).map(([id, meta]) => ({
      id,
      label: meta.label,
      description: meta.description,
      category: meta.category,
      status: "ga" as "ga" | "beta" | "experimental",
      minPlan: (meta as any).minPlan ?? "free",
    }));

    return jsonCors({ templates }, 200);
  } catch (err) {
    console.error("Templates API error:", err);
    return jsonCors({ error: "Internal server error" }, 500);
  }
}
