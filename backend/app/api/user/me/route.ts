import { NextRequest, NextResponse } from "next/server";
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
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return jsonCors({ error: "Missing or invalid token" }, 401);
  }

  const token = authHeader.split(" ")[1];

  try {
    const apiKey = await prisma.apiKey.findFirst({
      where: {
        key: token,
        revoked: false,
      },
      include: { user: true },
    });

    if (!apiKey) {
      return jsonCors({ error: "Invalid API key" }, 401);
    }

    const PLAN_LIMITS: Record<string, number> = {
      free: 5,
      builder: 75,
      pro: 500,
    };

    const limit = PLAN_LIMITS[apiKey.user.plan] || 10;
    const now = new Date();
    const resetTime = new Date(apiKey.user.dailyUsageResetAt);

    // Return usage count (reset if needed on client side)
    const dailyUsageCount = now > resetTime ? 0 : apiKey.user.dailyUsageCount;

    return jsonCors(
      {
        plan: apiKey.user.plan,
        dailyUsageCount,
        limit,
        // expose privacy flags for potential frontend use
        allowDataUse: (apiKey.user as any).allowDataUse ?? false,
        defaultIncognito: (apiKey.user as any).defaultIncognito ?? false,
      },
      200
    );
  } catch (error) {
    console.error("User info error:", error);
    return jsonCors({ error: "Internal server error" }, 500);
  }
}
