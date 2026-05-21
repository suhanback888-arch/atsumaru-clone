import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const session = await getServerSession(authOptions);
  const userId = session?.user
    ? ((session.user as Record<string, unknown>).id as string)
    : null;

  if (!userId) {
    return NextResponse.json({ userRating: null });
  }

  const manga = await prisma.manga.findUnique({ where: { slug: params.slug } });
  if (!manga) return NextResponse.json({ userRating: null });

  const rating = await prisma.rating.findUnique({
    where: { userId_mangaId: { userId, mangaId: manga.id } },
  });

  return NextResponse.json({ userRating: rating?.value ?? null });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const session = await getServerSession(authOptions);
  const userId = session?.user
    ? ((session.user as Record<string, unknown>).id as string)
    : null;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { value } = await req.json();
  if (typeof value !== "number" || value < 1 || value > 10) {
    return NextResponse.json({ error: "Rating must be 1-10" }, { status: 400 });
  }

  const manga = await prisma.manga.findUnique({ where: { slug: params.slug } });
  if (!manga) {
    return NextResponse.json({ error: "Manga not found" }, { status: 404 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.rating.upsert({
      where: {
        userId_mangaId: { userId, mangaId: manga.id },
      },
      update: { value },
      create: { userId, mangaId: manga.id, value },
    });

    const agg = await tx.rating.aggregate({
      where: { mangaId: manga.id },
      _avg: { value: true },
      _count: { value: true },
    });

    await tx.manga.update({
      where: { id: manga.id },
      data: {
        rating: agg._avg.value || 0,
        ratingCount: agg._count.value || 0,
      },
    });
  });

  const updated = await prisma.manga.findUnique({
    where: { id: manga.id },
    select: { rating: true, ratingCount: true },
  });

  return NextResponse.json({
    rating: updated?.rating,
    ratingCount: updated?.ratingCount,
    userRating: value,
  });
}
