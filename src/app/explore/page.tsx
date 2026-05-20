import { prisma } from "@/lib/prisma";
import { Suspense } from "react";
import ExploreClient from "./ExploreClient";

export const metadata = { title: "Explore - Atsumaru" };

export default async function ExplorePage() {
  const genres = await prisma.genre.findMany({ orderBy: { name: "asc" } });
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    }>
      <ExploreClient genres={genres} />
    </Suspense>
  );
}
