import { NextRequest, NextResponse } from "next/server";
import { searchAllSources, getSource } from "@/lib/scrapers";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q") || "";
  const sourceId = req.nextUrl.searchParams.get("source");

  if (!query.trim()) {
    return NextResponse.json([]);
  }

  try {
    if (sourceId) {
      const source = getSource(sourceId);
      if (!source) {
        return NextResponse.json({ error: "Unknown source" }, { status: 400 });
      }
      const results = await source.searchManga(query);
      return NextResponse.json(results);
    }

    const results = await searchAllSources(query);
    return NextResponse.json(results);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Search failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
