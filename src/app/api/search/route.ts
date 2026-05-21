import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSource } from "@/lib/scrapers";

interface SearchResult {
  slug: string;
  title: string;
  type: string;
  status: string;
  year: number | null;
  coverImage: string;
  source: "local" | "mangadex";
  sourceUrl?: string;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const popular = searchParams.get("popular");

  if (popular === "true") {
    const mangas = await prisma.manga.findMany({
      orderBy: { viewCount: "desc" },
      select: {
        slug: true,
        title: true,
        type: true,
        status: true,
        year: true,
        coverImage: true,
      },
      take: 15,
    });
    return NextResponse.json(
      mangas.map((m) => ({ ...m, source: "local" as const }))
    );
  }

  if (!q.trim()) return NextResponse.json([]);

  const lowerQ = q.toLowerCase();

  const localResults = await prisma.manga.findMany({
    where: {
      OR: [
        { title: { contains: q } },
        { altTitles: { contains: q } },
      ],
    },
    select: {
      slug: true,
      title: true,
      type: true,
      status: true,
      year: true,
      coverImage: true,
    },
    take: 15,
  });

  const results: SearchResult[] = localResults.map((m) => ({
    ...m,
    source: "local" as const,
  }));

  if (results.length < 5) {
    try {
      const mangadex = getSource("mangadex");
      if (mangadex) {
        const scraperResults = await mangadex.searchManga(q);
        const localSlugs = new Set(results.map((r) => r.slug));
        const localTitles = new Set(results.map((r) => r.title.toLowerCase()));

        for (const sr of scraperResults) {
          if (localTitles.has(sr.title.toLowerCase())) continue;
          if (localSlugs.has(sr.slug)) continue;
          results.push({
            slug: sr.slug,
            title: sr.title,
            type: sr.type || "Manga",
            status: sr.status || "Unknown",
            year: sr.year ?? null,
            coverImage: sr.coverImage,
            source: "mangadex",
            sourceUrl: sr.url,
          });
        }
      }
    } catch {
      // MangaDex search failed, continue with local results only
    }
  }

  // Case-insensitive sort: exact prefix matches first, then contains
  results.sort((a, b) => {
    const aStart = a.title.toLowerCase().startsWith(lowerQ) ? 0 : 1;
    const bStart = b.title.toLowerCase().startsWith(lowerQ) ? 0 : 1;
    if (aStart !== bStart) return aStart - bStart;
    const aLocal = a.source === "local" ? 0 : 1;
    const bLocal = b.source === "local" ? 0 : 1;
    return aLocal - bLocal;
  });

  return NextResponse.json(results.slice(0, 15));
}
