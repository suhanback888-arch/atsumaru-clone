import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") || "trending";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const type = searchParams.get("type");
  const genre = searchParams.get("genre");
  const status = searchParams.get("status");
  const q = searchParams.get("q");
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (type) where.type = type;
  if (status) where.status = status;
  if (genre) {
    where.genres = { some: { genre: { slug: genre } } };
  }
  if (q) {
    where.OR = [
      { title: { contains: q } },
      { altTitles: { contains: q } },
      { author: { contains: q } },
    ];
  }

  let orderBy: Record<string, string>;
  switch (category) {
    case "trending":
      orderBy = { viewCount: "desc" };
      break;
    case "popular":
      orderBy = { viewCount: "desc" };
      break;
    case "most-bookmarked":
      orderBy = { bookmarkCount: "desc" };
      break;
    case "top-rated":
      orderBy = { rating: "desc" };
      break;
    case "recently-updated":
      orderBy = { updatedAt: "desc" };
      break;
    case "recently-added":
      orderBy = { createdAt: "desc" };
      break;
    default:
      orderBy = { viewCount: "desc" };
  }

  const [mangas, total] = await Promise.all([
    prisma.manga.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        genres: { include: { genre: true } },
        _count: { select: { chapters: true } },
      },
    }),
    prisma.manga.count({ where }),
  ]);

  return NextResponse.json({
    mangas,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}
