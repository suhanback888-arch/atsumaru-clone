"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface ChapterReaderProps {
  mangaSlug: string;
  mangaTitle: string;
  chapterNumber: number;
  chapterTitle: string | null;
  pages: string[];
  prevChapterNumber: number | null;
  nextChapterNumber: number | null;
  allChapters: { number: number; title: string | null }[];
}

export default function ChapterReader({
  mangaSlug,
  mangaTitle,
  chapterNumber,
  chapterTitle,
  pages,
  prevChapterNumber,
  nextChapterNumber,
  allChapters,
}: ChapterReaderProps) {
  const router = useRouter();
  const [showNav, setShowNav] = useState(true);
  const [showChapterList, setShowChapterList] = useState(false);

  const navigateChapter = (num: number) => {
    router.push(`/manga/${mangaSlug}/chapter/${num}`);
  };

  return (
    <div className="min-h-screen bg-black relative">
      {showNav && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-surface-dark/95 backdrop-blur-sm border-b border-white/5">
          <div className="max-w-5xl mx-auto px-4 h-12 flex items-center gap-4">
            <Link href={`/manga/${mangaSlug}`} className="text-gray-400 hover:text-white transition-colors shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white truncate">{mangaTitle}</p>
              <p className="text-xs text-gray-500">
                Chapter {chapterNumber}
                {chapterTitle ? ` - ${chapterTitle}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowChapterList(!showChapterList)}
                className="text-xs bg-surface-light text-gray-300 hover:text-white px-3 py-1.5 rounded-lg border border-white/5 transition-colors"
              >
                Ch. {chapterNumber}
              </button>
              {prevChapterNumber !== null && (
                <button
                  onClick={() => navigateChapter(prevChapterNumber)}
                  className="p-1.5 text-gray-400 hover:text-white hover:bg-surface-light rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}
              {nextChapterNumber !== null && (
                <button
                  onClick={() => navigateChapter(nextChapterNumber)}
                  className="p-1.5 text-gray-400 hover:text-white hover:bg-surface-light rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {showChapterList && (
            <div className="absolute top-12 right-4 w-64 bg-surface-light border border-white/10 rounded-lg shadow-xl max-h-80 overflow-y-auto z-50">
              {allChapters.map((ch) => (
                <button
                  key={ch.number}
                  onClick={() => { navigateChapter(ch.number); setShowChapterList(false); }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-surface-lighter transition-colors ${
                    ch.number === chapterNumber ? "text-primary bg-surface-lighter" : "text-gray-300"
                  }`}
                >
                  Chapter {ch.number}
                  {ch.title ? ` - ${ch.title}` : ""}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div
        className="max-w-3xl mx-auto cursor-pointer"
        onClick={() => setShowNav(!showNav)}
      >
        <div className={showNav ? "pt-12" : ""}>
          {pages.map((page, i) => (
            <img
              key={i}
              src={page}
              alt={`Page ${i + 1}`}
              className="w-full"
              loading={i < 3 ? "eager" : "lazy"}
            />
          ))}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 flex items-center justify-between bg-surface-dark">
        {prevChapterNumber !== null ? (
          <button
            onClick={() => navigateChapter(prevChapterNumber)}
            className="flex items-center gap-2 bg-surface-light hover:bg-surface-lighter text-gray-300 px-4 py-2.5 rounded-lg transition-colors border border-white/5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Previous
          </button>
        ) : <div />}
        {nextChapterNumber !== null ? (
          <button
            onClick={() => navigateChapter(nextChapterNumber)}
            className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-2.5 rounded-lg transition-colors"
          >
            Next
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ) : (
          <Link
            href={`/manga/${mangaSlug}`}
            className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-2.5 rounded-lg transition-colors"
          >
            Back to Series
          </Link>
        )}
      </div>
    </div>
  );
}
