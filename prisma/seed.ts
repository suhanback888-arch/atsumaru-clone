import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const MANGADEX_API = "https://api.mangadex.org";

interface MdRelationship {
  id: string;
  type: string;
  attributes?: Record<string, unknown>;
}

interface MdManga {
  id: string;
  attributes: {
    title: Record<string, string>;
    altTitles?: Record<string, string>[];
    description?: Record<string, string>;
    status?: string;
    year?: number;
    tags?: { attributes: { name: Record<string, string>; group: string } }[];
    originalLanguage?: string;
  };
  relationships: MdRelationship[];
}

function getTitle(titles: Record<string, string>): string {
  return titles["en"] || titles["ja-ro"] || titles["ja"] || Object.values(titles)[0] || "Unknown";
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function getMangaType(lang?: string): string {
  switch (lang) {
    case "ko": return "Manhwa";
    case "zh": case "zh-hk": return "Manhua";
    default: return "Manga";
  }
}

function mapStatus(status?: string): string {
  switch (status) {
    case "ongoing": return "Ongoing";
    case "completed": return "Completed";
    case "hiatus": return "Hiatus";
    case "cancelled": return "Cancelled";
    default: return "Unknown";
  }
}

async function fetchMangaDex<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { "User-Agent": "AtsumaryClone/1.0" },
  });
  if (!res.ok) throw new Error(`MangaDex API error: ${res.status}`);
  return res.json();
}

async function seed() {
  console.log("Seeding database with real manga from MangaDex...");

  // Create sources
  const sources = [
    { name: "MangaDex", url: "https://mangadex.org", icon: "https://mangadex.org/favicon.ico" },
    { name: "Asura Scans", url: "https://asuracomic.net", icon: null },
    { name: "MangaFire", url: "https://mangafire.to", icon: null },
    { name: "MangaKakalot", url: "https://mangakakalot.com", icon: null },
    { name: "Manganato", url: "https://manganato.com", icon: null },
    { name: "MangaPill", url: "https://mangapill.com", icon: null },
  ];

  for (const src of sources) {
    await prisma.source.upsert({
      where: { name: src.name },
      update: {},
      create: src,
    });
  }

  const mdSource = await prisma.source.findUnique({ where: { name: "MangaDex" } });
  if (!mdSource) throw new Error("MangaDex source not created");

  // Fetch popular manga from MangaDex
  console.log("Fetching popular manga from MangaDex...");
  const popularData = await fetchMangaDex<{ data: MdManga[] }>(
    `${MANGADEX_API}/manga?limit=30&includes[]=cover_art&includes[]=author&includes[]=artist&contentRating[]=safe&contentRating[]=suggestive&order[followedCount]=desc`
  );

  let imported = 0;

  for (const m of popularData.data) {
    try {
      const title = getTitle(m.attributes.title);
      const slug = slugify(title) + "-" + m.id.slice(0, 8);

      const existing = await prisma.manga.findUnique({ where: { slug } });
      if (existing) {
        console.log(`  Skipping ${title} (already exists)`);
        continue;
      }

      // Get cover art
      const coverRel = m.relationships.find((r) => r.type === "cover_art");
      const coverFile = coverRel?.attributes?.["fileName"] as string | undefined;
      const coverImage = coverFile
        ? `https://uploads.mangadex.org/covers/${m.id}/${coverFile}`
        : "https://placehold.co/300x400/1a1a2e/7c5cfc?text=No+Cover";

      // Get author/artist
      const authorRel = m.relationships.find((r) => r.type === "author");
      const artistRel = m.relationships.find((r) => r.type === "artist");
      const author = authorRel?.attributes?.["name"] as string | undefined;
      const artist = artistRel?.attributes?.["name"] as string | undefined;

      // Get alt titles
      const altTitles = (m.attributes.altTitles || [])
        .map((at) => Object.values(at)[0])
        .filter(Boolean)
        .slice(0, 5);

      // Get genres
      const genres = (m.attributes.tags || [])
        .filter((t) => t.attributes.group === "genre" || t.attributes.group === "theme")
        .map((t) => getTitle(t.attributes.name));

      // Create genre records
      const genreIds: string[] = [];
      for (const genreName of genres) {
        const genre = await prisma.genre.upsert({
          where: { slug: slugify(genreName) },
          update: {},
          create: { name: genreName, slug: slugify(genreName) },
        });
        genreIds.push(genre.id);
      }

      // Random-ish view counts for variety
      const viewCount = Math.floor(Math.random() * 5000000) + 100000;
      const bookmarkCount = Math.floor(viewCount * (Math.random() * 0.1 + 0.02));

      // Create manga
      const manga = await prisma.manga.create({
        data: {
          slug,
          title,
          altTitles: altTitles.length > 0 ? altTitles.join(" ; ") : null,
          description: m.attributes.description?.["en"] || Object.values(m.attributes.description || {})[0] || null,
          coverImage,
          type: getMangaType(m.attributes.originalLanguage),
          status: mapStatus(m.attributes.status),
          year: m.attributes.year || null,
          author: author || null,
          artist: artist || null,
          rating: Math.round((Math.random() * 3 + 7) * 10) / 10,
          ratingCount: Math.floor(Math.random() * 10000) + 500,
          viewCount,
          bookmarkCount,
          externalLinks: JSON.stringify({
            MangaDex: `https://mangadex.org/title/${m.id}`,
          }),
        },
      });

      // Link genres
      for (const genreId of genreIds) {
        await prisma.mangaGenre.create({
          data: { mangaId: manga.id, genreId },
        });
      }

      // Link source
      await prisma.mangaSource.create({
        data: {
          mangaId: manga.id,
          sourceId: mdSource.id,
          sourceSlug: slug,
          sourceUrl: `https://mangadex.org/title/${m.id}`,
        },
      });

      // Fetch chapters from MangaDex
      console.log(`  Fetching chapters for ${title}...`);
      await new Promise((r) => setTimeout(r, 300)); // rate limit

      const chapterData = await fetchMangaDex<{
        data: {
          id: string;
          attributes: {
            chapter: string | null;
            title: string | null;
            publishAt: string;
          };
        }[];
      }>(
        `${MANGADEX_API}/manga/${m.id}/feed?limit=50&translatedLanguage[]=en&order[chapter]=desc`
      );

      const seenChapters = new Set<number>();
      let chaptersCreated = 0;

      for (const ch of chapterData.data) {
        const num = parseFloat(ch.attributes.chapter || "0");
        if (num <= 0 || seenChapters.has(num)) continue;
        seenChapters.add(num);

        await prisma.chapter.create({
          data: {
            mangaId: manga.id,
            number: num,
            title: ch.attributes.title || null,
            pages: "[]",
            sourceUrl: `https://mangadex.org/chapter/${ch.id}`,
            sourceName: "MangaDex",
            createdAt: new Date(ch.attributes.publishAt),
          },
        });
        chaptersCreated++;
      }

      imported++;
      console.log(`  Imported: ${title} (${chaptersCreated} chapters)`);

      // Rate limit
      await new Promise((r) => setTimeout(r, 500));
    } catch (err) {
      console.error(`  Error importing manga: ${err}`);
    }
  }

  console.log(`\nSeeding complete! Imported ${imported} manga from MangaDex.`);
}

seed()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
