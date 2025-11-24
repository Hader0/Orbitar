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
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      Vary: "Origin",
    },
  });
}

export function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session as any)?.user?.id as string | undefined;
    if (!userId) {
      return json({ error: "Unauthorized" }, 401);
    }

    const body = await req.json().catch(() => ({}));
    const { templateId, enabled } = body || {};

    if (typeof templateId !== "string" || typeof enabled !== "boolean") {
      return json(
        {
          error:
            "Invalid body. Expected { templateId: string, enabled: boolean }",
        },
        400
      );
    }

    // Validate templateId exists in registry
    if (!(templateId in templateRegistry)) {
      return json({ error: "Unknown templateId" }, 400);
    }

    // Upsert preference row. If absent => create; else update enabled.
    const pref = await (prisma as any).userTemplatePreference.upsert({
      where: {
        userId_templateId: { userId, templateId },
      },
      update: { enabled },
      create: { userId, templateId, enabled },
      select: { templateId: true, enabled: true },
    });

    return json(pref, 200);
  } catch (err) {
    console.error("Templates/preferences error:", err);
    return json({ error: "Internal server error" }, 500);
  }
}
