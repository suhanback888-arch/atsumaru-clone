import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSource } from "@/lib/scrapers";
import { slugify } from "@/lib/scrapers/utils";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sourceId, mangaUrl } = body;

    if (!sourceId || !mangaUrl) {
      return NextResponse.json(
        { error: "Missing sourceId or mangaUrl" },
        { status: 400 }
      );
    }

    const source = getSource(sourceId);
    if (!source) {
      return NextResponse.json({ error: "Unknown source" }, { status: 400 });
    }

    const details = await source.getMangaDetails(mangaUrl);
    const chapters = await source.getChapterList(mangaUrl);

    const slug = slugify(details.title);

    // Ensure source exists in database
    const dbSource = await prisma.source.upsert({
      where: { name: source.name },
      update: {},
      create: {
        name: source.name,
        url: source.url,
        icon: source.icon,
      },
    });

    // Create or update genres
    const genreIds: string[] = [];
    for (const genreName of details.genres || []) {
      const genre = await prisma.genre.upsert({
        where: { slug: slugify(genreName) },
        update: {},
        create: { name: genreName, slug: slugify(genreName) },
      });
      genreIds.push(genre.id);
    }

    // Create or update manga
    const existingManga = await prisma.manga.findUnique({ where: { slug } });

    const mangaData = {
      title: details.title,
      altTitles: details.altTitles?.join(" ; ") || null,
      description: details.description || null,
      coverImage: details.coverImage,
      bannerImage: details.bannerImage || null,
      type: details.type || "Manga",
      status: details.status || "Ongoing",
      year: details.year || null,
      author: details.author || null,
      artist: details.artist || null,
      rating: details.rating || 0,
      ratingCount: details.ratingCount || 0,
      viewCount: details.viewCount || 0,
      externalLinks: details.externalLinks
        ? JSON.stringify(details.externalLinks)
        : null,
    };

    let manga;
    if (existingManga) {
      manga = await prisma.manga.update({
        where: { slug },
        data: mangaData,
      });
    } else {
      manga = await prisma.manga.create({
        data: {
          slug,
          ...mangaData,
        },
      });
    }

    // Link genres
    await prisma.mangaGenre.deleteMany({ where: { mangaId: manga.id } });
    for (const genreId of genreIds) {
      await prisma.mangaGenre.create({
        data: { mangaId: manga.id, genreId },
      });
    }

    // Link source
    await prisma.mangaSource.upsert({
      where: {
        mangaId_sourceId: { mangaId: manga.id, sourceId: dbSource.id },
      },
      update: { sourceSlug: slug, sourceUrl: mangaUrl },
      create: {
        mangaId: manga.id,
        sourceId: dbSource.id,
        sourceSlug: slug,
        sourceUrl: mangaUrl,
      },
    });

    // Import chapters (limit to first 50 for initial sync)
    const chaptersToSync = chapters.slice(0, 50);
    let synced = 0;

    for (const ch of chaptersToSync) {
      const existing = await prisma.chapter.findUnique({
        where: { mangaId_number: { mangaId: manga.id, number: ch.number } },
      });
      if (!existing) {
        await prisma.chapter.create({
          data: {
            mangaId: manga.id,
            number: ch.number,
            title: ch.title || null,
            pages: "[]",
            sourceUrl: ch.url,
            sourceName: source.name,
            createdAt: ch.date || new Date(),
          },
        });
        synced++;
      }
    }

    return NextResponse.json({
      success: true,
      manga: { id: manga.id, slug: manga.slug, title: manga.title },
      chaptersTotal: chapters.length,
      chaptersSynced: synced,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sync failed";
    console.error("Sync error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
