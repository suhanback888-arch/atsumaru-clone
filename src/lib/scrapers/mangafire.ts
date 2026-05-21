import type {
  ScraperSource,
  MangaResult,
  MangaDetails,
  ChapterInfo,
  ChapterPages,
} from "./types";
import { fetchHTML, slugify } from "./utils";

const BASE = "https://mangafire.to";

export const mangafire: ScraperSource = {
  id: "mangafire",
  name: "MangaFire",
  url: BASE,
  icon: `${BASE}/favicon.ico`,

  async searchManga(query: string): Promise<MangaResult[]> {
    const url = `${BASE}/filter?keyword=${encodeURIComponent(query)}`;
    const $ = await fetchHTML(url);
    const results: MangaResult[] = [];

    $(".unit .inner, .manga-item, .item").each((_, el) => {
      const $el = $(el);
      const link = $el.find("a").first();
      const href = link.attr("href") || "";
      const title = $el.find(".info a, h3 a, .title").first().text().trim() ||
                    link.attr("title") || "";
      const img = $el.find("img").first().attr("src") || $el.find("img").first().attr("data-src") || "";

      if (title && href) {
        const fullUrl = href.startsWith("http") ? href : `${BASE}${href}`;
        results.push({
          sourceId: "mangafire",
          slug: slugify(title),
          title,
          coverImage: img.startsWith("http") ? img : `${BASE}${img}`,
          url: fullUrl,
        });
      }
    });

    return results.slice(0, 20);
  },

  async getPopular(page = 1): Promise<MangaResult[]> {
    const url = `${BASE}/filter?sort=most_viewed&page=${page}`;
    const $ = await fetchHTML(url);
    const results: MangaResult[] = [];

    $(".unit .inner, .manga-item, .item").each((_, el) => {
      const $el = $(el);
      const link = $el.find("a").first();
      const href = link.attr("href") || "";
      const title = $el.find(".info a, h3 a, .title").first().text().trim() ||
                    link.attr("title") || "";
      const img = $el.find("img").first().attr("src") || $el.find("img").first().attr("data-src") || "";

      if (title && href) {
        const fullUrl = href.startsWith("http") ? href : `${BASE}${href}`;
        results.push({
          sourceId: "mangafire",
          slug: slugify(title),
          title,
          coverImage: img.startsWith("http") ? img : `${BASE}${img}`,
          url: fullUrl,
        });
      }
    });

    return results.slice(0, 20);
  },

  async getLatestUpdates(page = 1): Promise<MangaResult[]> {
    const url = `${BASE}/filter?sort=recently_updated&page=${page}`;
    const $ = await fetchHTML(url);
    const results: MangaResult[] = [];

    $(".unit .inner, .manga-item, .item").each((_, el) => {
      const $el = $(el);
      const link = $el.find("a").first();
      const href = link.attr("href") || "";
      const title = $el.find(".info a, h3 a, .title").first().text().trim() ||
                    link.attr("title") || "";
      const img = $el.find("img").first().attr("src") || $el.find("img").first().attr("data-src") || "";

      if (title && href) {
        const fullUrl = href.startsWith("http") ? href : `${BASE}${href}`;
        results.push({
          sourceId: "mangafire",
          slug: slugify(title),
          title,
          coverImage: img.startsWith("http") ? img : `${BASE}${img}`,
          url: fullUrl,
        });
      }
    });

    return results.slice(0, 20);
  },

  async getMangaDetails(url: string): Promise<MangaDetails> {
    const $ = await fetchHTML(url);

    const title = $("h1, .manga-name").first().text().trim();
    const coverImage = $(".poster img, .manga-cover img").first().attr("src") || "";
    const description = $(".description, .manga-desc, .summary p").first().text().trim();

    const genres: string[] = [];
    $("a[href*='/genre/'], .genre a").each((_, el) => {
      const genre = $(el).text().trim();
      if (genre && genre.length < 30) genres.push(genre);
    });

    let status = "Ongoing";
    let type = "Manga";
    let year: number | undefined;
    let author: string | undefined;

    $(".meta div, .info div, .manga-info div").each((_, el) => {
      const text = $(el).text().trim();
      if (text.includes("Status")) {
        if (text.includes("Completed") || text.includes("Finished")) status = "Completed";
        else if (text.includes("Hiatus")) status = "Hiatus";
      }
      if (text.includes("Type")) {
        if (text.includes("Manhwa")) type = "Manhwa";
        else if (text.includes("Manhua")) type = "Manhua";
      }
      if (text.includes("Year") || text.includes("Released")) {
        const yearMatch = text.match(/\d{4}/);
        if (yearMatch) year = parseInt(yearMatch[0]);
      }
      if (text.includes("Author")) {
        author = text.replace(/Author[:\s]*/i, "").trim();
      }
    });

    const altTitles: string[] = [];
    $(".alt-name span, .alternative span").each((_, el) => {
      const alt = $(el).text().trim();
      if (alt) altTitles.push(alt);
    });

    return {
      title,
      altTitles: altTitles.length > 0 ? altTitles : undefined,
      description,
      coverImage: coverImage.startsWith("http") ? coverImage : `${BASE}${coverImage}`,
      status,
      type,
      year,
      author,
      genres,
    };
  },

  async getChapterList(url: string): Promise<ChapterInfo[]> {
    const $ = await fetchHTML(url);
    const chapters: ChapterInfo[] = [];

    $("a[href*='/chapter-'], .chapter-list a, ul.chapter-list li a").each((_, el) => {
      const $el = $(el);
      const href = $el.attr("href") || "";
      const text = $el.text().trim();
      const numMatch = text.match(/Chapter\s+([\d.]+)/i) || href.match(/chapter-([\d.]+)/i);
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

    $(".read-img img, .page-img img, .reading-content img, #readerarea img").each((_, el) => {
      const src = $(el).attr("src") || $(el).attr("data-src") || "";
      if (src && !src.includes("logo") && !src.includes("icon")) {
        pages.push(src.startsWith("http") ? src : `${BASE}${src}`);
      }
    });

    return { pages, referer: BASE };
  },
};
