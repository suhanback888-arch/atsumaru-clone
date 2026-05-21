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
    const details = await source.getMangaDetails(url);
    return NextResponse.json(details);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch details";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
