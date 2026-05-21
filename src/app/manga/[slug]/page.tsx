import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import MangaDetailClient from "./MangaDetailClient";
import MangaCard from "@/components/MangaCard";

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props) {
  const manga = await prisma.manga.findUnique({
    where: { slug: params.slug },
    select: { title: true, description: true },
  });
  if (!manga) return { title: "Not Found" };
  return { title: `${manga.title} - Atsumaru`, description: manga.description };
}

function formatViewCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

export default async function MangaPage({ params }: Props) {
  const manga = await prisma.manga.findUnique({
    where: { slug: params.slug },
    include: {
      genres: { include: { genre: true } },
      chapters: { orderBy: { number: "desc" } },
      sources: { include: { source: true } },
    },
  });

  if (!manga) notFound();

  await prisma.manga.update({
    where: { id: manga.id },
    data: { viewCount: { increment: 1 } },
  });

  // Fetch similar manga based on shared genres
  const genreIds = manga.genres.map((mg) => mg.genreId);
  const similarManga = genreIds.length > 0
    ? await prisma.manga.findMany({
        where: {
          id: { not: manga.id },
          genres: { some: { genreId: { in: genreIds } } },
        },
        select: { slug: true, title: true, coverImage: true, type: true },
        take: 10,
        orderBy: { viewCount: "desc" },
      })
    : [];

  const externalLinks: Record<string, string> = manga.externalLinks
    ? JSON.parse(manga.externalLinks)
    : {};

  const typeBadgeColor: Record<string, string> = {
    Manga: "bg-blue-600",
    Manhwa: "bg-purple-600",
    Manhua: "bg-green-600",
  };

  const coverUrl = manga.coverImage.startsWith("http") && !manga.coverImage.includes("/api/proxy")
    ? `/api/proxy?url=${encodeURIComponent(manga.coverImage)}`
    : manga.coverImage;

  const bannerUrl = manga.bannerImage
    ? manga.bannerImage.startsWith("http") && !manga.bannerImage.includes("/api/proxy")
      ? `/api/proxy?url=${encodeURIComponent(manga.bannerImage)}`
      : manga.bannerImage
    : null;

  const firstChapter = manga.chapters.length > 0
    ? manga.chapters[manga.chapters.length - 1]
    : null;

  return (
    <div>
      {/* Banner */}
      {bannerUrl && (
        <div className="relative w-full h-48 md:h-64 overflow-hidden">
          <img
            src={bannerUrl}
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-surface-dark via-surface-dark/60 to-transparent" />
        </div>
      )}

      <div className={`max-w-5xl mx-auto px-4 ${bannerUrl ? "-mt-24 relative z-10" : "pt-6"}`}>
        <div className="flex flex-col md:flex-row gap-6 mb-8">
          {/* Left sidebar */}
          <div className="w-48 md:w-56 shrink-0 mx-auto md:mx-0">
            <div className="relative aspect-[3/4] rounded-xl overflow-hidden shadow-lg">
              <img src={coverUrl} alt={manga.title} className="w-full h-full object-cover" />
              <div className={`absolute top-2 right-2 ${typeBadgeColor[manga.type] || "bg-gray-600"} text-white text-xs font-medium px-2 py-0.5 rounded`}>
                {manga.type}
              </div>
            </div>

            {/* Start reading button */}
            {firstChapter && (
              <Link
                href={`/manga/${manga.slug}/chapter/${firstChapter.number}`}
                className="mt-3 w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white font-medium py-2.5 px-4 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                Chapter {firstChapter.number}
              </Link>
            )}

            <MangaDetailClient
              slug={manga.slug}
              rating={manga.rating}
              ratingCount={manga.ratingCount}
            />

            {/* Source info */}
            {manga.sources.length > 0 && (
              <div className="mt-3 text-xs text-gray-500">
                <p className="font-medium text-gray-400 mb-1">Sources</p>
                {manga.sources.map((ms) => (
                  <span key={ms.id} className="inline-block bg-surface-light rounded px-2 py-0.5 mr-1 mb-1">
                    {ms.source.name}
                  </span>
                ))}
              </div>
            )}

            {/* External links */}
            {Object.keys(externalLinks).length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-medium text-gray-400 mb-1">External Links</p>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(externalLinks).map(([name, url]) => (
                    <a
                      key={name}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs bg-surface-light hover:bg-surface-lighter text-gray-400 hover:text-primary px-2 py-1 rounded transition-colors"
                    >
                      {name}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">{manga.title}</h1>
            {manga.altTitles && (
              <p className="text-sm text-gray-500 mb-3 line-clamp-2">{manga.altTitles}</p>
            )}

            <div className="flex flex-wrap gap-2 mb-4">
              {manga.genres.map((mg) => (
                <Link
                  key={mg.genreId}
                  href={`/explore?genre=${mg.genre.slug}`}
                  className="text-xs bg-surface-light hover:bg-surface-lighter text-gray-300 px-2.5 py-1 rounded-full border border-white/5 transition-colors"
                >
                  {mg.genre.name}
                </Link>
              ))}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4">
              <div className="bg-surface-light rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500">Rating</p>
                <p className="text-sm text-white font-medium">
                  {manga.rating > 0 ? `${manga.rating.toFixed(1)} / 10` : "N/A"}
                </p>
              </div>
              <div className="bg-surface-light rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500">Views</p>
                <p className="text-sm text-white font-medium">{formatViewCount(manga.viewCount)}</p>
              </div>
              <div className="bg-surface-light rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500">Chapters</p>
                <p className="text-sm text-white font-medium">{manga.chapters.length}</p>
              </div>
              <div className="bg-surface-light rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500">Status</p>
                <p className="text-sm text-white font-medium">{manga.status}</p>
              </div>
              <div className="bg-surface-light rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500">Type</p>
                <p className="text-sm text-white font-medium">{manga.type}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 mb-4 text-sm">
              {manga.author && (
                <div><span className="text-gray-500">Author: </span><span className="text-gray-300">{manga.author}</span></div>
              )}
              {manga.artist && manga.artist !== manga.author && (
                <div><span className="text-gray-500">Artist: </span><span className="text-gray-300">{manga.artist}</span></div>
              )}
              {manga.year && (
                <div><span className="text-gray-500">Year: </span><span className="text-gray-300">{manga.year}</span></div>
              )}
            </div>

            {manga.description && (
              <p className="text-sm text-gray-400 leading-relaxed mb-4">{manga.description}</p>
            )}
          </div>
        </div>

        {/* Chapters section with tabs */}
        <ChapterTabs chapters={manga.chapters} mangaSlug={manga.slug} />

        {/* Similar Manga */}
        {similarManga.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-white mb-3">Similar Manga</h2>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {similarManga.map((m) => (
                <MangaCard
                  key={m.slug}
                  slug={m.slug}
                  title={m.title}
                  coverImage={
                    m.coverImage.startsWith("http") && !m.coverImage.includes("/api/proxy")
                      ? `/api/proxy?url=${encodeURIComponent(m.coverImage)}`
                      : m.coverImage
                  }
                  type={m.type}
                />
              ))}
            </div>
          </div>
        )}

        {/* Comments */}
        <div className="mt-8 mb-12" id="comments-section" />
      </div>
    </div>
  );
}

function ChapterTabs({
  chapters,
  mangaSlug,
}: {
  chapters: { id: string; number: number; title: string | null; createdAt: Date }[];
  mangaSlug: string;
}) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-white mb-3">
        Chapters ({chapters.length})
      </h2>
      <div className="bg-surface rounded-xl border border-white/5 divide-y divide-white/5 max-h-[600px] overflow-y-auto">
        {chapters.length === 0 ? (
          <p className="text-gray-500 text-sm p-4">No chapters available yet.</p>
        ) : (
          chapters.map((ch) => (
            <Link
              key={ch.id}
              href={`/manga/${mangaSlug}/chapter/${ch.number}`}
              className="flex items-center justify-between px-4 py-3 hover:bg-surface-light transition-colors group"
            >
              <div className="flex items-center gap-3">
                <svg className="w-4 h-4 text-gray-600 group-hover:text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <span className="text-sm text-gray-300 group-hover:text-white">
                  Chapter {ch.number}
                  {ch.title ? ` - ${ch.title}` : ""}
                </span>
              </div>
              <span className="text-xs text-gray-600">
                {timeAgo(ch.createdAt)}
              </span>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
