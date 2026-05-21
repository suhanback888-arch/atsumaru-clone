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

function proxyCovers(
  items: { slug: string; title: string; coverImage: string; type: string }[]
) {
  return items.map((m) => ({
    ...m,
    coverImage:
      m.coverImage.startsWith("http") && !m.coverImage.includes("/api/proxy")
        ? `/api/proxy?url=${encodeURIComponent(m.coverImage)}`
        : m.coverImage,
  }));
}

export default async function HomePage() {
  const [trending, mostBookmarked, hotUpdates, recentlyUpdated, topRated, popular, recentlyAdded] =
    await Promise.all([
      getMangaByCategory({ viewCount: "desc" }),
      getMangaByCategory({ bookmarkCount: "desc" }),
      prisma.manga.findMany({
        orderBy: [{ updatedAt: "desc" }, { viewCount: "desc" }],
        take: 20,
        select: { slug: true, title: true, coverImage: true, type: true },
      }),
      getMangaByCategory({ updatedAt: "desc" }),
      getMangaByCategory({ rating: "desc" }),
      getMangaByCategory({ viewCount: "desc" }),
      getMangaByCategory({ createdAt: "desc" }),
    ]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <MangaCarousel title="Trending" href="/browse/trending" items={proxyCovers(trending)} />
      <MangaCarousel title="Most Bookmarked" href="/browse/most-bookmarked" items={proxyCovers(mostBookmarked)} />
      <SignupCTA />
      <MangaCarousel title="Hot Updates" href="/browse/recently-updated" items={proxyCovers(hotUpdates)} />
      <MangaCarousel title="Recently Updated" href="/browse/recently-updated" items={proxyCovers(recentlyUpdated)} />
      <MangaCarousel title="Top Rated" href="/browse/top-rated" items={proxyCovers(topRated)} />
      <MangaCarousel title="Popular" href="/browse/popular" items={proxyCovers(popular)} />
      <MangaCarousel title="Recently Added" href="/browse/recently-added" items={proxyCovers(recentlyAdded)} />
    </div>
  );
}
