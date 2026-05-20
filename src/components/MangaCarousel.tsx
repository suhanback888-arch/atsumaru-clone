"use client";

import { useRef } from "react";
import Link from "next/link";
import MangaCard from "./MangaCard";

interface MangaItem {
  slug: string;
  title: string;
  coverImage: string;
  type: string;
}

interface MangaCarouselProps {
  title: string;
  href: string;
  items: MangaItem[];
}

export default function MangaCarousel({ title, href, items }: MangaCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = dir === "left" ? -400 : 400;
    scrollRef.current.scrollBy({ left: amount, behavior: "smooth" });
  };

  if (!items.length) return null;

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <Link href={href} className="flex items-center gap-1 group">
          <h2 className="text-lg font-semibold text-white group-hover:text-primary transition-colors">{title}</h2>
          <svg className="w-4 h-4 text-gray-500 group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
        <div className="flex items-center gap-1">
          <Link href={href} className="text-sm text-gray-500 hover:text-primary transition-colors mr-2">
            See more
          </Link>
          <button onClick={() => scroll("left")} className="p-1 rounded-full hover:bg-surface-light text-gray-500 hover:text-white transition-colors hidden sm:block">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button onClick={() => scroll("right")} className="p-1 rounded-full hover:bg-surface-light text-gray-500 hover:text-white transition-colors hidden sm:block">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
      <div ref={scrollRef} className="flex gap-3 overflow-x-auto hide-scrollbar pb-2">
        {items.map((item) => (
          <MangaCard key={item.slug} {...item} />
        ))}
      </div>
    </section>
  );
}
