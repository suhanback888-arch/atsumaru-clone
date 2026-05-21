import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import MangaCard from "@/components/MangaCard";

export const metadata = { title: "Bookmarks - Atsumaru" };

export default async function BookmarksPage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user
    ? ((session.user as Record<string, unknown>).id as string)
    : null;

  if (!userId) redirect("/auth/login");

  const bookmarks = await prisma.bookmark.findMany({
    where: { userId },
    include: {
      manga: {
        select: { slug: true, title: true, coverImage: true, type: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold text-white mb-6">My Bookmarks</h1>

      {bookmarks.length === 0 ? (
        <p className="text-center text-gray-500 py-12">
          No bookmarks yet. Start bookmarking manga you want to read!
        </p>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 md:gap-4">
          {bookmarks.map((b) => (
            <MangaCard
              key={b.manga.slug}
              {...b.manga}
              coverImage={
                b.manga.coverImage.startsWith("http") && !b.manga.coverImage.includes("/api/proxy")
                  ? `/api/proxy?url=${encodeURIComponent(b.manga.coverImage)}`
                  : b.manga.coverImage
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
