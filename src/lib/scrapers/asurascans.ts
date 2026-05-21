import type {
  ScraperSource,
  MangaResult,
  MangaDetails,
  ChapterInfo,
  ChapterPages,
} from "./types";
import { fetchHTML, slugify } from "./utils";

const BASE = "https://asuracomic.net";

export const asurascans: ScraperSource = {
  id: "asurascans",
  name: "Asura Scans",
  url: BASE,
  icon: `${BASE}/favicon.ico`,

  async searchManga(query: string): Promise<MangaResult[]> {
    const url = `${BASE}/series?page=1&name=${encodeURIComponent(query)}`;
    const $ = await fetchHTML(url);
    const results: MangaResult[] = [];

    $("a[href*='/series/']").each((_, el) => {
      const $el = $(el);
      const href = $el.attr("href") || "";
      if (!href.includes("/series/") || href === "/series") return;

      const title = $el.find("span.block, .text-sm, h3, h2").first().text().trim() ||
                    $el.find("img").attr("alt") || "";
      const img = $el.find("img").first().attr("src") || "";

      if (title && !results.find((r) => r.url === (href.startsWith("http") ? href : `${BASE}${href}`))) {
        results.push({
          sourceId: "asurascans",
          slug: slugify(title),
          title,
          coverImage: img.startsWith("http") ? img : `${BASE}${img}`,
          url: href.startsWith("http") ? href : `${BASE}${href}`,
          type: "Manhwa",
        });
      }
    });

    return results.slice(0, 20);
  },

  async getPopular(page = 1): Promise<MangaResult[]> {
    const url = `${BASE}/series?page=${page}&order=rating`;
    const $ = await fetchHTML(url);
    const results: MangaResult[] = [];

    $("a[href*='/series/']").each((_, el) => {
      const $el = $(el);
      const href = $el.attr("href") || "";
      if (!href.includes("/series/") || href === "/series" || href.endsWith("/series")) return;

      const title = $el.find("span.block, .text-sm, h3, h2").first().text().trim() ||
                    $el.find("img").attr("alt") || "";
      const img = $el.find("img").first().attr("src") || "";
      const fullUrl = href.startsWith("http") ? href : `${BASE}${href}`;

      if (title && !results.find((r) => r.url === fullUrl)) {
        results.push({
          sourceId: "asurascans",
          slug: slugify(title),
          title,
          coverImage: img.startsWith("http") ? img : `${BASE}${img}`,
          url: fullUrl,
          type: "Manhwa",
        });
      }
    });

    return results.slice(0, 20);
  },

  async getLatestUpdates(page = 1): Promise<MangaResult[]> {
    const url = `${BASE}/series?page=${page}&order=update`;
    const $ = await fetchHTML(url);
    const results: MangaResult[] = [];

    $("a[href*='/series/']").each((_, el) => {
      const $el = $(el);
      const href = $el.attr("href") || "";
      if (!href.includes("/series/") || href === "/series" || href.endsWith("/series")) return;

      const title = $el.find("span.block, .text-sm, h3, h2").first().text().trim() ||
                    $el.find("img").attr("alt") || "";
      const img = $el.find("img").first().attr("src") || "";
      const fullUrl = href.startsWith("http") ? href : `${BASE}${href}`;

      if (title && !results.find((r) => r.url === fullUrl)) {
        results.push({
          sourceId: "asurascans",
          slug: slugify(title),
          title,
          coverImage: img.startsWith("http") ? img : `${BASE}${img}`,
          url: fullUrl,
          type: "Manhwa",
        });
      }
    });

    return results.slice(0, 20);
  },

  async getMangaDetails(url: string): Promise<MangaDetails> {
    const $ = await fetchHTML(url);

    const title = $("h1, .text-xl.font-bold").first().text().trim();
    const coverImage = $("img[alt*='poster'], .series-img img, img.rounded").first().attr("src") || "";
    const description = $("span.font-medium.text-sm, .desc, .summary").first().text().trim();

    const genres: string[] = [];
    $("a[href*='/series?genre'], .genre-tag, button.text-white").each((_, el) => {
      const genre = $(el).text().trim();
      if (genre && genre.length < 30) genres.push(genre);
    });

    let status = "Ongoing";
    let author: string | undefined;
    let artist: string | undefined;

    $("h3.text-sm, span.text-sm").each((_, el) => {
      const text = $(el).text().trim().toLowerCase();
      const parent = $(el).parent().text().trim();
      if (text.includes("status") || parent.toLowerCase().includes("status")) {
        if (parent.toLowerCase().includes("completed") || parent.toLowerCase().includes("finished")) {
          status = "Completed";
        } else if (parent.toLowerCase().includes("hiatus")) {
          status = "Hiatus";
        }
      }
      if (text.includes("author")) {
        author = parent.replace(/author[:\s]*/i, "").trim();
      }
      if (text.includes("artist")) {
        artist = parent.replace(/artist[:\s]*/i, "").trim();
      }
    });

    return {
      title,
      description,
      coverImage: coverImage.startsWith("http") ? coverImage : `${BASE}${coverImage}`,
      status,
      author,
      artist,
      genres,
      type: "Manhwa",
    };
  },

  async getChapterList(url: string): Promise<ChapterInfo[]> {
    const $ = await fetchHTML(url);
    const chapters: ChapterInfo[] = [];

    $("a[href*='/chapter/'], .chapter-list a, a.flex").each((_, el) => {
      const $el = $(el);
      const href = $el.attr("href") || "";
      if (!href.includes("chapter")) return;

      const text = $el.text().trim();
      const numMatch = text.match(/Chapter\s+([\d.]+)/i) || href.match(/chapter[/-]([\d.]+)/i);
      const num = numMatch ? parseFloat(numMatch[1]) : 0;

      if (num > 0 && !chapters.find((c) => c.number === num)) {
        chapters.push({
          number: num,
          title: text.replace(/Chapter\s+[\d.]+\s*[-:]?\s*/i, "").trim() || undefined,
          url: href.startsWith("http") ? href : `${BASE}${href}`,
        });
      }
    });

    return chapters.sort((a, b) => b.number - a.number);
  },

  async getChapterPages(chapterUrl: string): Promise<ChapterPages> {
    const $ = await fetchHTML(chapterUrl);
    const pages: string[] = [];

    $("img[alt*='chapter'], .reading-content img, img.max-w-full, p > img").each((_, el) => {
      const src = $(el).attr("src") || $(el).attr("data-src") || "";
      if (src && !src.includes("logo") && !src.includes("icon") && !src.includes("avatar")) {
        pages.push(src.startsWith("http") ? src : `${BASE}${src}`);
      }
    });

    return { pages, referer: BASE };
  },
};
