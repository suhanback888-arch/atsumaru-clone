import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: { slug: string } }
) {
  const manga = await prisma.manga.findUnique({
    where: { slug: params.slug },
    include: {
      genres: { include: { genre: true } },
      chapters: { orderBy: { number: "desc" } },
      _count: { select: { bookmarks: true, comments: true } },
    },
  });

  if (!manga) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.manga.update({
    where: { id: manga.id },
    data: { viewCount: { increment: 1 } },
  });

  return NextResponse.json(manga);
}
