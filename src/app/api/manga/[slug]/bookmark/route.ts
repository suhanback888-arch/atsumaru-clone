import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: Request,
  { params }: { params: { slug: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const manga = await prisma.manga.findUnique({ where: { slug: params.slug } });
  if (!manga) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const userId = (session.user as Record<string, unknown>).id as string;
  const existing = await prisma.bookmark.findUnique({
    where: { userId_mangaId: { userId, mangaId: manga.id } },
  });

  if (existing) {
    await prisma.bookmark.delete({ where: { id: existing.id } });
    await prisma.manga.update({
      where: { id: manga.id },
      data: { bookmarkCount: { decrement: 1 } },
    });
    return NextResponse.json({ bookmarked: false });
  }

  await prisma.bookmark.create({ data: { userId, mangaId: manga.id } });
  await prisma.manga.update({
    where: { id: manga.id },
    data: { bookmarkCount: { increment: 1 } },
  });

  return NextResponse.json({ bookmarked: true });
}

export async function GET(
  _req: Request,
  { params }: { params: { slug: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ bookmarked: false });

  const manga = await prisma.manga.findUnique({ where: { slug: params.slug } });
  if (!manga) return NextResponse.json({ bookmarked: false });

  const userId = (session.user as Record<string, unknown>).id as string;
  const bookmark = await prisma.bookmark.findUnique({
    where: { userId_mangaId: { userId, mangaId: manga.id } },
  });

  return NextResponse.json({ bookmarked: !!bookmark });
}
