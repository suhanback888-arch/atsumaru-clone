import { NextRequest, NextResponse } from "next/server";
import { getSource } from "@/lib/scrapers";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url") || "";
  const sourceId = req.nextUrl.searchParams.get("source") || "";

  if (!url || !sourceId) {
    return NextResponse.json(
      { error: "Missing url or source parameter" },
      { status: 400 }
    );
  }

  const source = getSource(sourceId);
  if (!source) {
    return NextResponse.json({ error: "Unknown source" }, { status: 400 });
  }

  try {
    const chapters = await source.getChapterList(url);
    return NextResponse.json(chapters);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch chapters";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
