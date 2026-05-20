import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import MangaDetailClient from "./MangaDetailClient";

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

export default async function MangaPage({ params }: Props) {
  const manga = await prisma.manga.findUnique({
    where: { slug: params.slug },
    include: {
      genres: { include: { genre: true } },
      chapters: { orderBy: { number: "desc" } },
    },
  });

  if (!manga) notFound();

  await prisma.manga.update({
    where: { id: manga.id },
    data: { viewCount: { increment: 1 } },
  });

  const typeBadgeColor: Record<string, string> = {
    Manga: "bg-blue-600",
    Manhwa: "bg-purple-600",
    Manhua: "bg-green-600",
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row gap-6 mb-8">
        <div className="w-48 md:w-56 shrink-0 mx-auto md:mx-0">
          <div className="relative aspect-[3/4] rounded-xl overflow-hidden shadow-lg">
            <img src={manga.coverImage} alt={manga.title} className="w-full h-full object-cover" />
            <div className={`absolute top-2 right-2 ${typeBadgeColor[manga.type] || "bg-gray-600"} text-white text-xs font-medium px-2 py-0.5 rounded`}>
              {manga.type}
            </div>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">{manga.title}</h1>
          {manga.altTitles && (
            <p className="text-sm text-gray-500 mb-3">{manga.altTitles}</p>
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

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div className="bg-surface-light rounded-lg p-3 text-center">
              <p className="text-xs text-gray-500">Status</p>
              <p className="text-sm text-white font-medium">{manga.status}</p>
            </div>
            <div className="bg-surface-light rounded-lg p-3 text-center">
              <p className="text-xs text-gray-500">Rating</p>
              <p className="text-sm text-white font-medium">{manga.rating.toFixed(1)} / 10</p>
            </div>
            <div className="bg-surface-light rounded-lg p-3 text-center">
              <p className="text-xs text-gray-500">Views</p>
              <p className="text-sm text-white font-medium">{manga.viewCount.toLocaleString()}</p>
            </div>
            <div className="bg-surface-light rounded-lg p-3 text-center">
              <p className="text-xs text-gray-500">Chapters</p>
              <p className="text-sm text-white font-medium">{manga.chapters.length}</p>
            </div>
          </div>

          {(manga.author || manga.artist) && (
            <div className="flex flex-wrap gap-4 mb-4 text-sm">
              {manga.author && (
                <div>
                  <span className="text-gray-500">Author: </span>
                  <span className="text-gray-300">{manga.author}</span>
                </div>
              )}
              {manga.artist && manga.artist !== manga.author && (
                <div>
                  <span className="text-gray-500">Artist: </span>
                  <span className="text-gray-300">{manga.artist}</span>
                </div>
              )}
            </div>
          )}

          {manga.description && (
            <p className="text-sm text-gray-400 leading-relaxed mb-4">{manga.description}</p>
          )}

          <MangaDetailClient slug={manga.slug} />
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-white mb-3">
          Chapters ({manga.chapters.length})
        </h2>
        <div className="bg-surface rounded-xl border border-white/5 divide-y divide-white/5 max-h-[600px] overflow-y-auto">
          {manga.chapters.length === 0 ? (
            <p className="text-gray-500 text-sm p-4">No chapters available yet.</p>
          ) : (
            manga.chapters.map((ch) => (
              <Link
                key={ch.id}
                href={`/manga/${manga.slug}/chapter/${ch.number}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-surface-light transition-colors group"
              >
                <div>
                  <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                    Chapter {ch.number}
                  </span>
                  {ch.title && (
                    <span className="text-sm text-gray-500 ml-2">- {ch.title}</span>
                  )}
                </div>
                <span className="text-xs text-gray-600">
                  {new Date(ch.createdAt).toLocaleDateString()}
                </span>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
