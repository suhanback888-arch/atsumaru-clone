import { prisma } from "@/lib/prisma";
import Link from "next/link";
import MangaCard from "@/components/MangaCard";

interface Props {
  params: { category: string };
  searchParams: { page?: string };
}

const categoryLabels: Record<string, string> = {
  trending: "Trending",
  popular: "Popular",
  "most-bookmarked": "Most Bookmarked",
  "top-rated": "Top Rated",
  "recently-updated": "Recently Updated",
  "recently-added": "Recently Added",
};

function getOrderBy(category: string): Record<string, string> {
  switch (category) {
    case "trending": return { viewCount: "desc" };
    case "popular": return { viewCount: "desc" };
    case "most-bookmarked": return { bookmarkCount: "desc" };
    case "top-rated": return { rating: "desc" };
    case "recently-updated": return { updatedAt: "desc" };
    case "recently-added": return { createdAt: "desc" };
    default: return { viewCount: "desc" };
  }
}

export function generateMetadata({ params }: Props) {
  const label = categoryLabels[params.category] || "Browse";
  return { title: `${label} - Atsumaru` };
}

export default async function BrowsePage({ params, searchParams }: Props) {
  const page = parseInt(searchParams.page || "1");
  const limit = 24;
  const skip = (page - 1) * limit;
  const label = categoryLabels[params.category] || "Browse";
  const orderBy = getOrderBy(params.category);

  const [mangas, total] = await Promise.all([
    prisma.manga.findMany({
      orderBy,
      skip,
      take: limit,
      select: { slug: true, title: true, coverImage: true, type: true },
    }),
    prisma.manga.count(),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/" className="text-gray-500 hover:text-white transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </Link>
        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <h1 className="text-xl font-bold text-white">{label}</h1>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 md:gap-4">
        {mangas.map((m) => (
          <MangaCard key={m.slug} {...m} />
        ))}
      </div>

      {mangas.length === 0 && (
        <p className="text-center text-gray-500 py-12">No manga found.</p>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          {page > 1 && (
            <Link
              href={`/browse/${params.category}?page=${page - 1}`}
              className="px-3 py-2 text-sm bg-surface-light hover:bg-surface-lighter text-gray-300 rounded-lg border border-white/5 transition-colors"
            >
              Previous
            </Link>
          )}
          <span className="text-sm text-gray-500 px-3">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`/browse/${params.category}?page=${page + 1}`}
              className="px-3 py-2 text-sm bg-surface-light hover:bg-surface-lighter text-gray-300 rounded-lg border border-white/5 transition-colors"
            >
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
