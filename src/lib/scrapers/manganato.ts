import type {
  ScraperSource,
  MangaResult,
  MangaDetails,
  ChapterInfo,
  ChapterPages,
} from "./types";
import { fetchHTML, slugify, parseViewCount } from "./utils";

const BASE = "https://manganato.com";
const READ_BASE = "https://chapmanganato.to";

export const manganato: ScraperSource = {
  id: "manganato",
  name: "Manganato",
  url: BASE,
  icon: `${BASE}/favicon.ico`,

  async searchManga(query: string): Promise<MangaResult[]> {
    const searchQuery = query.replace(/\s+/g, "_").toLowerCase();
    const url = `${BASE}/search/story/${encodeURIComponent(searchQuery)}`;
    const $ = await fetchHTML(url);
    const results: MangaResult[] = [];

    $(".search-story-item, .content-genres-item").each((_, el) => {
      const $el = $(el);
      const link = $el.find("a.item-img, a").first();
      const href = link.attr("href") || "";
      const title = link.attr("title") || $el.find("h3 a").text().trim();
      const img = link.find("img").attr("src") || "";

      if (title && href) {
        results.push({
          sourceId: "manganato",
          slug: slugify(title),
          title,
          coverImage: img,
          url: href,
        });
      }
    });

    return results.slice(0, 20);
  },

  async getPopular(page = 1): Promise<MangaResult[]> {
    const url = `${BASE}/genre-all/${page}?type=topview`;
    const $ = await fetchHTML(url);
    const results: MangaResult[] = [];

    $(".content-genres-item").each((_, el) => {
      const $el = $(el);
      const link = $el.find("a.genres-item-img, a").first();
      const href = link.attr("href") || "";
      const title = link.attr("title") || $el.find("h3 a").text().trim();
      const img = link.find("img").attr("src") || "";

      if (title && href) {
        results.push({
          sourceId: "manganato",
          slug: slugify(title),
          title,
          coverImage: img,
          url: href,
        });
      }
    });

    return results.slice(0, 20);
  },

  async getLatestUpdates(page = 1): Promise<MangaResult[]> {
    const url = `${BASE}/genre-all/${page}`;
    const $ = await fetchHTML(url);
    const results: MangaResult[] = [];

    $(".content-genres-item").each((_, el) => {
      const $el = $(el);
      const link = $el.find("a.genres-item-img, a").first();
      const href = link.attr("href") || "";
      const title = link.attr("title") || $el.find("h3 a").text().trim();
      const img = link.find("img").attr("src") || "";

      if (title && href) {
        results.push({
          sourceId: "manganato",
          slug: slugify(title),
          title,
          coverImage: img,
          url: href,
        });
      }
    });

    return results.slice(0, 20);
  },

  async getMangaDetails(url: string): Promise<MangaDetails> {
    const $ = await fetchHTML(url);

    const title = $(".story-info-right h1, .info-image img").first().text().trim() ||
                  $(".info-image img").attr("alt") || "";
    const coverImage = $(".info-image img").attr("src") || "";
    const description = $(".panel-story-info-description, #panel-story-info-description")
      .text()
      .replace(/Description\s*:?\s*/i, "")
      .trim();

    const genres: string[] = [];
    let status = "Ongoing";
    let author: string | undefined;
    let altTitles: string[] = [];
    let viewCount = 0;

    $(".variations-tableInfo tr, .table-value").each((_, el) => {
      const $el = $(el);
      const label = $el.find(".table-label, td:first-child").text().trim().toLowerCase();
      const value = $el.find(".table-value, td:last-child").text().trim();

      if (label.includes("alternative")) {
        altTitles = value.split(";").map((s) => s.trim()).filter(Boolean);
      }
      if (label.includes("author")) {
        author = value;
      }
      if (label.includes("status")) {
        status = value.includes("Completed") ? "Completed" : "Ongoing";
      }
      if (label.includes("genre")) {
        $el.find("a").each((_, a) => {
          const g = $(a).text().trim();
          if (g) genres.push(g);
        });
      }
    });

    $(".story-info-right-extent .stre-value").each((i, el) => {
      const text = $(el).text().trim();
      if (i === 1) viewCount = parseViewCount(text);
    });

    return {
      title,
      altTitles: altTitles.length > 0 ? altTitles : undefined,
      description,
      coverImage,
      status,
      author,
      genres,
      viewCount,
      type: "Manga",
    };
  },

  async getChapterList(url: string): Promise<ChapterInfo[]> {
    const $ = await fetchHTML(url);
    const chapters: ChapterInfo[] = [];

    $(".row-content-chapter li a.chapter-name, .chapter-list .row a").each((_, el) => {
      const $el = $(el);
      const href = $el.attr("href") || "";
      const text = $el.text().trim();
      const numMatch = text.match(/Chapter\s+([\d.]+)/i);
      const num = numMatch ? parseFloat(numMatch[1]) : 0;
      const dateText = $el.closest("li").find(".chapter-time").attr("title") || "";

      if (num > 0) {
        chapters.push({
          number: num,
          title: text.replace(/Chapter\s+[\d.]+\s*[-:]?\s*/i, "").trim() || undefined,
          url: href,
          date: dateText ? new Date(dateText) : undefined,
        });
      }
    });

    return chapters.sort((a, b) => b.number - a.number);
  },

  async getChapterPages(chapterUrl: string): Promise<ChapterPages> {
    const $ = await fetchHTML(chapterUrl);
    const pages: string[] = [];

    $(".container-chapter-reader img").each((_, el) => {
      const src = $(el).attr("src") || $(el).attr("data-src") || "";
      if (src && !src.includes("logo") && !src.includes("icon")) {
        pages.push(src);
      }
    });

    return { pages, referer: READ_BASE };
  },
};
