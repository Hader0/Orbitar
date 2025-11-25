import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type EditBucket = "none" | "light" | "heavy";

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

/**
 * POST /api/refine-events/behavior
 * Auth: session user
 *
 * Body:
 * {
 *   refineEventId: string;
 *   accepted?: boolean;         // if true, set acceptedAt = now (only if null)
 *   reverted?: boolean;         // if true, set reverted = true
 *   editDistanceBucket?: "none" | "light" | "heavy";
 * }
 *
 * Response:
 * { ok: true } on success
 * { ok: false, error: { code, message } } on failure
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session as any)?.user?.id as string | undefined;

    if (!userId) {
      return jsonCors(
        { ok: false, error: { code: "UNAUTHORIZED", message: "Unauthorized" } },
        401
      );
    }

    let payload: any = null;
    try {
      payload = await req.json();
    } catch (_e) {
      return jsonCors(
        {
          ok: false,
          error: {
            code: "INVALID_BEHAVIOR_PAYLOAD",
            message: "Missing or invalid JSON body.",
          },
        },
        400
      );
    }

    const refineEventId = payload?.refineEventId;
    const accepted = payload?.accepted;
    const reverted = payload?.reverted;
    const editDistanceBucket = payload?.editDistanceBucket as
      | EditBucket
      | undefined;

    if (!refineEventId || typeof refineEventId !== "string") {
      return jsonCors(
        {
          ok: false,
          error: {
            code: "INVALID_BEHAVIOR_PAYLOAD",
            message: "Missing or invalid refineEventId.",
          },
        },
        400
      );
    }

    if (typeof accepted !== "undefined" && typeof accepted !== "boolean") {
      return jsonCors(
        {
          ok: false,
          error: {
            code: "INVALID_BEHAVIOR_PAYLOAD",
            message: "accepted must be boolean if provided.",
          },
        },
        400
      );
    }

    if (typeof reverted !== "undefined" && typeof reverted !== "boolean") {
      return jsonCors(
        {
          ok: false,
          error: {
            code: "INVALID_BEHAVIOR_PAYLOAD",
            message: "reverted must be boolean if provided.",
          },
        },
        400
      );
    }

    if (
      typeof editDistanceBucket !== "undefined" &&
      !["none", "light", "heavy"].includes(editDistanceBucket)
    ) {
      return jsonCors(
        {
          ok: false,
          error: {
            code: "INVALID_BEHAVIOR_PAYLOAD",
            message:
              'editDistanceBucket must be one of "none" | "light" | "heavy" if provided.',
          },
        },
        400
      );
    }

    // Load event to verify ownership and current fields
    const existing = await prisma.refineEvent.findFirst({
      where: { id: refineEventId, userId },
      select: {
        id: true,
        acceptedAt: true,
        reverted: true,
        editDistanceBucket: true,
      },
    });

    if (!existing) {
      return jsonCors(
        {
          ok: false,
          error: {
            code: "REFINE_EVENT_NOT_FOUND",
            message: "Refine event not found for this user.",
          },
        },
        404
      );
    }

    const data: Record<string, any> = {};

    if (accepted === true && !existing.acceptedAt) {
      data.acceptedAt = new Date();
    }
    if (reverted === true) {
      data.reverted = true;
    }
    if (typeof editDistanceBucket !== "undefined") {
      data.editDistanceBucket = editDistanceBucket;
    }

    if (Object.keys(data).length === 0) {
      // Nothing to update
      return jsonCors({ ok: true }, 200);
    }

    try {
      await prisma.refineEvent.update({
        where: { id: refineEventId },
        data,
      });
      return jsonCors({ ok: true }, 200);
    } catch (err) {
      console.error(
        "[API /refine-events/behavior] Failed to update refine behavior",
        { refineEventId, userId, dataKeys: Object.keys(data) },
        err
      );
      return jsonCors(
        {
          ok: false,
          error: {
            code: "REFINE_BEHAVIOR_UPDATE_FAILED",
            message: "Could not update refine behavior, please try again.",
          },
        },
        500
      );
    }
  } catch (error) {
    console.error(
      "[API /refine-events/behavior] Unexpected error",
      { route: "/api/refine-events/behavior" },
      error
    );
    return jsonCors(
      {
        ok: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Unexpected error. Please try again.",
        },
      },
      500
    );
  }
}
