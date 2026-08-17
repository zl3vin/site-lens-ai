import { NextRequest, NextResponse } from "next/server";
import { analyzeUrl } from "@/lib/audit";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const url = typeof body?.url === "string" ? body.url.trim() : "";

    if (!url) {
      return NextResponse.json(
        { error: "Bitte gib eine Website-URL ein." },
        { status: 400 }
      );
    }

    const result = await analyzeUrl(url);

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Bei der Analyse ist ein Fehler aufgetreten.";

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}