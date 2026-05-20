import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";

  if (!q.trim()) return NextResponse.json([]);

  const results = await prisma.manga.findMany({
    where: {
      OR: [
        { title: { contains: q } },
        { altTitles: { contains: q } },
      ],
    },
    select: { slug: true, title: true, type: true, coverImage: true },
    take: 10,
  });

  return NextResponse.json(results);
}
