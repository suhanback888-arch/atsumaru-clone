import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import ChapterReader from "./ChapterReader";
import { getSource } from "@/lib/scrapers";

interface Props {
  params: { slug: string; number: string };
}

export async function generateMetadata({ params }: Props) {
  const manga = await prisma.manga.findUnique({
    where: { slug: params.slug },
    select: { title: true },
  });
  if (!manga) return { title: "Not Found" };
  return { title: `Chapter ${params.number} - ${manga.title} - Atsumaru` };
}

export default async function ChapterPage({ params }: Props) {
  const manga = await prisma.manga.findUnique({
    where: { slug: params.slug },
    include: {
      chapters: { orderBy: { number: "asc" } },
    },
  });

  if (!manga) notFound();

  const chapterNum = parseFloat(params.number);
  const chapter = manga.chapters.find((c) => c.number === chapterNum);
  if (!chapter) notFound();

  const currentIndex = manga.chapters.findIndex((c) => c.id === chapter.id);
  const prevChapter = currentIndex > 0 ? manga.chapters[currentIndex - 1] : null;
  const nextChapter = currentIndex < manga.chapters.length - 1 ? manga.chapters[currentIndex + 1] : null;

  let pages: string[] = JSON.parse(chapter.pages);
  let referer: string | undefined;

  // If pages are empty and we have a source URL, fetch them on-demand
  if (pages.length === 0 && chapter.sourceUrl && chapter.sourceName) {
    const sourceId = chapter.sourceName.toLowerCase().replace(/\s+/g, "");
    const sourceMap: Record<string, string> = {
      mangadex: "mangadex",
      asurascans: "asurascans",
      mangafire: "mangafire",
      mangakakalot: "mangakakalot",
      manganato: "manganato",
      mangapill: "mangapill",
    };
    const mappedId = sourceMap[sourceId] || sourceId;
    const source = getSource(mappedId);

    if (source) {
      try {
        const result = await source.getChapterPages(chapter.sourceUrl);
        pages = result.pages;
        referer = result.referer;

        // Cache the pages in the database
        if (pages.length > 0) {
          await prisma.chapter.update({
            where: { id: chapter.id },
            data: { pages: JSON.stringify(pages) },
          });
        }
      } catch (err) {
        console.error("Failed to fetch chapter pages:", err);
      }
    }
  }

  // Proxy image URLs if they're external
  const proxyPages = pages.map((page) => {
    if (page.startsWith("http") && !page.includes("/api/proxy")) {
      const proxyUrl = `/api/proxy?url=${encodeURIComponent(page)}`;
      return referer ? `${proxyUrl}&referer=${encodeURIComponent(referer)}` : proxyUrl;
    }
    return page;
  });

  return (
    <ChapterReader
      mangaSlug={manga.slug}
      mangaTitle={manga.title}
      chapterNumber={chapter.number}
      chapterTitle={chapter.title}
      pages={proxyPages}
      prevChapterNumber={prevChapter?.number ?? null}
      nextChapterNumber={nextChapter?.number ?? null}
      allChapters={manga.chapters.map((c) => ({ number: c.number, title: c.title }))}
    />
  );
}
