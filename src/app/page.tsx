import { prisma } from "@/lib/prisma";
import MangaCarousel from "@/components/MangaCarousel";
import SignupCTA from "@/components/SignupCTA";

async function getMangaByCategory(orderBy: Record<string, string>, limit = 20) {
  return prisma.manga.findMany({
    orderBy,
    take: limit,
    select: { slug: true, title: true, coverImage: true, type: true },
  });
}

export default async function HomePage() {
  const [trending, mostBookmarked, hotUpdates, recentlyUpdated, topRated, popular, recentlyAdded] =
    await Promise.all([
      getMangaByCategory({ viewCount: "desc" }),
      getMangaByCategory({ bookmarkCount: "desc" }),
      getMangaByCategory({ updatedAt: "desc" }),
      getMangaByCategory({ updatedAt: "desc" }),
      getMangaByCategory({ rating: "desc" }),
      getMangaByCategory({ viewCount: "desc" }),
      getMangaByCategory({ createdAt: "desc" }),
    ]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <MangaCarousel title="Trending" href="/browse/trending" items={trending} />
      <MangaCarousel title="Most Bookmarked" href="/browse/most-bookmarked" items={mostBookmarked} />
      <SignupCTA />
      <MangaCarousel title="Hot Updates" href="/browse/recently-updated" items={hotUpdates} />
      <MangaCarousel title="Recently Updated" href="/browse/recently-updated" items={recentlyUpdated} />
      <MangaCarousel title="Top Rated" href="/browse/top-rated" items={topRated} />
      <MangaCarousel title="Popular" href="/browse/popular" items={popular} />
      <MangaCarousel title="Recently Added" href="/browse/recently-added" items={recentlyAdded} />
    </div>
  );
}
