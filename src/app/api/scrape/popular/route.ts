import { NextRequest, NextResponse } from "next/server";
import { getPopularFromAll, getSource } from "@/lib/scrapers";

export async function GET(req: NextRequest) {
  const page = parseInt(req.nextUrl.searchParams.get("page") || "1");
  const sourceId = req.nextUrl.searchParams.get("source");

  try {
    if (sourceId) {
      const source = getSource(sourceId);
      if (!source) {
        return NextResponse.json({ error: "Unknown source" }, { status: 400 });
      }
      const results = await source.getPopular(page);
      return NextResponse.json(results);
    }

    const results = await getPopularFromAll(page);
    return NextResponse.json(results);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch popular";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
