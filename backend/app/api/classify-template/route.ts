import { NextRequest, NextResponse } from "next/server";
import { classifyTemplate } from "@/lib/templates";

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
    const { text } = await req.json();
    if (!text || typeof text !== "string") {
      return jsonCors({ error: "Text is required" }, 400);
    }

    if (!process.env.OPENAI_API_KEY) {
      console.error("OpenAI API key not configured for classifier.");
      return jsonCors({ error: "OpenAI API key not configured." }, 500);
    }

    const result = await classifyTemplate(text);
    return jsonCors(result, 200);
  } catch (err) {
    console.error("Classifier error:", err);
    return jsonCors({ error: "Internal server error" }, 500);
  }
}
