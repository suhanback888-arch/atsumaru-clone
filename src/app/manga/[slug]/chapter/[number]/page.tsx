import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import ChapterReader from "./ChapterReader";

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

  const pages: string[] = JSON.parse(chapter.pages);

  return (
    <ChapterReader
      mangaSlug={manga.slug}
      mangaTitle={manga.title}
      chapterNumber={chapter.number}
      chapterTitle={chapter.title}
      pages={pages}
      prevChapterNumber={prevChapter?.number ?? null}
      nextChapterNumber={nextChapter?.number ?? null}
      allChapters={manga.chapters.map((c) => ({ number: c.number, title: c.title }))}
    />
  );
}
