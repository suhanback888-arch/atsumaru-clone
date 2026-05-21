import type {
  ScraperSource,
  MangaResult,
  MangaDetails,
  ChapterInfo,
  ChapterPages,
} from "./types";
import { fetchJSON, slugify } from "./utils";

const BASE = "https://api.mangadex.org";

interface MdRelationship {
  id: string;
  type: string;
  attributes?: Record<string, unknown>;
}

interface MdManga {
  id: string;
  attributes: {
    title: Record<string, string>;
    altTitles?: Record<string, string>[];
    description?: Record<string, string>;
    status?: string;
    year?: number;
    contentRating?: string;
    tags?: { attributes: { name: Record<string, string>; group: string } }[];
    originalLanguage?: string;
  };
  relationships: MdRelationship[];
}

interface MdChapter {
  id: string;
  attributes: {
    chapter: string | null;
    title: string | null;
    translatedLanguage: string;
    publishAt: string;
    pages: number;
  };
}

function getTitle(titles: Record<string, string>): string {
  return titles["en"] || titles["ja-ro"] || titles["ja"] || Object.values(titles)[0] || "Unknown";
}

function getCoverUrl(mangaId: string, relationships: MdRelationship[]): string {
  const cover = relationships.find((r) => r.type === "cover_art");
  if (cover?.attributes?.["fileName"]) {
    return `https://uploads.mangadex.org/covers/${mangaId}/${cover.attributes["fileName"]}.256.jpg`;
  }
  return "";
}

function getCoverUrlFull(mangaId: string, relationships: MdRelationship[]): string {
  const cover = relationships.find((r) => r.type === "cover_art");
  if (cover?.attributes?.["fileName"]) {
    return `https://uploads.mangadex.org/covers/${mangaId}/${cover.attributes["fileName"]}`;
  }
  return "";
}

function getAuthor(relationships: MdRelationship[]): string | undefined {
  const author = relationships.find((r) => r.type === "author");
  return author?.attributes?.["name"] as string | undefined;
}

function getArtist(relationships: MdRelationship[]): string | undefined {
  const artist = relationships.find((r) => r.type === "artist");
  return artist?.attributes?.["name"] as string | undefined;
}

function getMangaType(originalLanguage?: string): string {
  switch (originalLanguage) {
    case "ja":
      return "Manga";
    case "ko":
      return "Manhwa";
    case "zh":
    case "zh-hk":
      return "Manhua";
    default:
      return "Manga";
  }
}

function mapStatus(status?: string): string {
  switch (status) {
    case "ongoing":
      return "Ongoing";
    case "completed":
      return "Completed";
    case "hiatus":
      return "Hiatus";
    case "cancelled":
      return "Cancelled";
    default:
      return "Unknown";
  }
}

export const mangadex: ScraperSource = {
  id: "mangadex",
  name: "MangaDex",
  url: "https://mangadex.org",
  icon: "https://mangadex.org/favicon.ico",

  async searchManga(query: string): Promise<MangaResult[]> {
    const url = `${BASE}/manga?title=${encodeURIComponent(query)}&limit=20&includes[]=cover_art&contentRating[]=safe&contentRating[]=suggestive`;
    const data = await fetchJSON<{ data: MdManga[] }>(url);
    return data.data.map((m) => ({
      sourceId: "mangadex",
      slug: slugify(getTitle(m.attributes.title)) + "-" + m.id.slice(0, 8),
      title: getTitle(m.attributes.title),
      coverImage: getCoverUrl(m.id, m.relationships),
      url: `https://mangadex.org/title/${m.id}`,
      type: getMangaType(m.attributes.originalLanguage),
      status: mapStatus(m.attributes.status),
      year: m.attributes.year ?? undefined,
    }));
  },

  async getPopular(page = 1): Promise<MangaResult[]> {
    const offset = (page - 1) * 20;
    const url = `${BASE}/manga?limit=20&offset=${offset}&includes[]=cover_art&contentRating[]=safe&contentRating[]=suggestive&order[followedCount]=desc`;
    const data = await fetchJSON<{ data: MdManga[] }>(url);
    return data.data.map((m) => ({
      sourceId: "mangadex",
      slug: slugify(getTitle(m.attributes.title)) + "-" + m.id.slice(0, 8),
      title: getTitle(m.attributes.title),
      coverImage: getCoverUrl(m.id, m.relationships),
      url: `https://mangadex.org/title/${m.id}`,
      type: getMangaType(m.attributes.originalLanguage),
    }));
  },

  async getLatestUpdates(page = 1): Promise<MangaResult[]> {
    const offset = (page - 1) * 20;
    const url = `${BASE}/manga?limit=20&offset=${offset}&includes[]=cover_art&contentRating[]=safe&contentRating[]=suggestive&order[latestUploadedChapter]=desc`;
    const data = await fetchJSON<{ data: MdManga[] }>(url);
    return data.data.map((m) => ({
      sourceId: "mangadex",
      slug: slugify(getTitle(m.attributes.title)) + "-" + m.id.slice(0, 8),
      title: getTitle(m.attributes.title),
      coverImage: getCoverUrl(m.id, m.relationships),
      url: `https://mangadex.org/title/${m.id}`,
      type: getMangaType(m.attributes.originalLanguage),
    }));
  },

  async getMangaDetails(url: string): Promise<MangaDetails> {
    const mangaId = url.match(/title\/([a-f0-9-]+)/)?.[1];
    if (!mangaId) throw new Error("Invalid MangaDex URL");

    const data = await fetchJSON<{ data: MdManga }>(
      `${BASE}/manga/${mangaId}?includes[]=cover_art&includes[]=author&includes[]=artist`
    );
    const m = data.data;
    const attrs = m.attributes;

    const altTitles = (attrs.altTitles || [])
      .map((at) => Object.values(at)[0])
      .filter(Boolean);

    const genres = (attrs.tags || [])
      .filter((t) => t.attributes.group === "genre" || t.attributes.group === "theme")
      .map((t) => getTitle(t.attributes.name));

    // Get MAL link
    const malLink = m.relationships.find((r) => r.type === "mal");
    const externalLinks: Record<string, string> = {};
    if (malLink) externalLinks["MyAnimeList"] = `https://myanimelist.net/manga/${malLink.id}`;

    return {
      title: getTitle(attrs.title),
      altTitles,
      description: attrs.description?.["en"] || Object.values(attrs.description || {})[0],
      coverImage: getCoverUrlFull(m.id, m.relationships),
      type: getMangaType(attrs.originalLanguage),
      status: mapStatus(attrs.status),
      year: attrs.year,
      author: getAuthor(m.relationships),
      artist: getArtist(m.relationships),
      genres,
      externalLinks,
    };
  },

  async getChapterList(url: string): Promise<ChapterInfo[]> {
    const mangaId = url.match(/title\/([a-f0-9-]+)/)?.[1];
    if (!mangaId) throw new Error("Invalid MangaDex URL");

    const chapters: ChapterInfo[] = [];
    let offset = 0;
    const limit = 100;
    let total = Infinity;

    while (offset < total && offset < 500) {
      const apiUrl = `${BASE}/manga/${mangaId}/feed?limit=${limit}&offset=${offset}&translatedLanguage[]=en&order[chapter]=desc&includes[]=scanlation_group`;
      const data = await fetchJSON<{
        data: MdChapter[];
        total: number;
      }>(apiUrl);
      total = data.total;

      for (const ch of data.data) {
        const num = parseFloat(ch.attributes.chapter || "0");
        if (num > 0 && !chapters.find((c) => c.number === num)) {
          chapters.push({
            number: num,
            title: ch.attributes.title || undefined,
            url: `https://mangadex.org/chapter/${ch.id}`,
            date: new Date(ch.attributes.publishAt),
          });
        }
      }
      offset += limit;
    }

    return chapters.sort((a, b) => b.number - a.number);
  },

  async getChapterPages(chapterUrl: string): Promise<ChapterPages> {
    const chapterId = chapterUrl.match(/chapter\/([a-f0-9-]+)/)?.[1];
    if (!chapterId) throw new Error("Invalid MangaDex chapter URL");

    const data = await fetchJSON<{
      baseUrl: string;
      chapter: { hash: string; data: string[]; dataSaver: string[] };
    }>(`${BASE}/at-home/server/${chapterId}`);

    const pages = data.chapter.data.map(
      (filename) => `${data.baseUrl}/data/${data.chapter.hash}/${filename}`
    );

    return { pages };
  },
};
