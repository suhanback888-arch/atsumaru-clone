import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: { slug: string } }
) {
  const manga = await prisma.manga.findUnique({ where: { slug: params.slug } });
  if (!manga) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const comments = await prisma.comment.findMany({
    where: { mangaId: manga.id, parentId: null },
    include: {
      user: { select: { id: true, username: true, avatarUrl: true } },
      replies: {
        include: {
          user: { select: { id: true, username: true, avatarUrl: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json(comments);
}

export async function POST(
  req: Request,
  { params }: { params: { slug: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const manga = await prisma.manga.findUnique({ where: { slug: params.slug } });
  if (!manga) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { content, parentId } = await req.json();
  if (!content?.trim()) {
    return NextResponse.json({ error: "Content required" }, { status: 400 });
  }

  const userId = (session.user as Record<string, unknown>).id as string;
  const comment = await prisma.comment.create({
    data: {
      content: content.trim(),
      userId,
      mangaId: manga.id,
      parentId: parentId || null,
    },
    include: {
      user: { select: { id: true, username: true, avatarUrl: true } },
    },
  });

  return NextResponse.json(comment);
}
