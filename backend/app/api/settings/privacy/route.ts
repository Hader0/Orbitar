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
      return jsonCors({ error: "Unauthorized" }, 401);
    }

    const body = await req.json().catch(() => ({}));
    const { allowDataUse, defaultIncognito, promptLabOptIn } = body || {};

    // Validate inputs (both optional)
    const data: Record<string, any> = {};
    if (typeof allowDataUse === "boolean") data.allowDataUse = allowDataUse;
    if (typeof defaultIncognito === "boolean")
      data.defaultIncognito = defaultIncognito;
    if (typeof promptLabOptIn === "boolean")
      data.promptLabOptIn = promptLabOptIn;

    if (Object.keys(data).length === 0) {
      return jsonCors(
        {
          error:
            "No valid fields provided. Expected { allowDataUse?: boolean, defaultIncognito?: boolean }",
        },
        400
      );
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data,
    });

    const u = updated as any;

    return jsonCors(
      {
        message: "Privacy settings updated",
        user: {
          id: updated.id,
          allowDataUse: u.allowDataUse,
          defaultIncognito: u.defaultIncognito,
          promptLabOptIn: u.promptLabOptIn ?? false,
        },
      },
      200
    );
  } catch (err) {
    console.error("Privacy settings update error:", err);
    return jsonCors({ error: "Internal server error" }, 500);
  }
}
