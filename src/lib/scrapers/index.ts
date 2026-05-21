import type { ScraperSource, MangaResult } from "./types";
import { mangadex } from "./mangadex";
import { mangakakalot } from "./mangakakalot";
import { mangapill } from "./mangapill";
import { asurascans } from "./asurascans";
import { mangafire } from "./mangafire";
import { manganato } from "./manganato";

export type { ScraperSource, MangaResult, MangaDetails, ChapterInfo, ChapterPages } from "./types";

const allSources: ScraperSource[] = [
  mangadex,
  asurascans,
  mangafire,
  mangakakalot,
  manganato,
  mangapill,
];

export function getSources(): ScraperSource[] {
  return allSources;
}

export function getSource(id: string): ScraperSource | undefined {
  return allSources.find((s) => s.id === id);
}

export async function searchAllSources(query: string): Promise<MangaResult[]> {
  const promises = allSources.map((s) =>
    s.searchManga(query).catch((err) => {
      console.error(`Search failed for ${s.name}:`, err.message);
      return [] as MangaResult[];
    })
  );
  const results = await Promise.allSettled(promises);
  const all: MangaResult[] = [];

  for (const r of results) {
    if (r.status === "fulfilled") {
      all.push(...r.value);
    }
  }

  // Deduplicate by title similarity
  const seen = new Map<string, MangaResult>();
  for (const r of all) {
    const key = r.title.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (!seen.has(key)) {
      seen.set(key, r);
    }
  }

  return Array.from(seen.values());
}

export async function getPopularFromAll(page = 1): Promise<MangaResult[]> {
  const promises = allSources.map((s) =>
    s.getPopular(page).catch((err) => {
      console.error(`Popular failed for ${s.name}:`, err.message);
      return [] as MangaResult[];
    })
  );
  const results = await Promise.allSettled(promises);
  const all: MangaResult[] = [];

  for (const r of results) {
    if (r.status === "fulfilled") {
      all.push(...r.value);
    }
  }

  return all;
}

export async function getLatestFromAll(page = 1): Promise<MangaResult[]> {
  const promises = allSources.map((s) =>
    s.getLatestUpdates(page).catch((err) => {
      console.error(`Latest failed for ${s.name}:`, err.message);
      return [] as MangaResult[];
    })
  );
  const results = await Promise.allSettled(promises);
  const all: MangaResult[] = [];

  for (const r of results) {
    if (r.status === "fulfilled") {
      all.push(...r.value);
    }
  }

  return all;
}
