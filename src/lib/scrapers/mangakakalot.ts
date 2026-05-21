import type {
  ScraperSource,
  MangaResult,
  MangaDetails,
  ChapterInfo,
  ChapterPages,
} from "./types";
import { fetchHTML, slugify, parseViewCount } from "./utils";

const BASE = "https://mangakakalot.com";
const CHAP_BASE = "https://chapmanganato.to";

export const mangakakalot: ScraperSource = {
  id: "mangakakalot",
  name: "MangaKakalot",
  url: BASE,
  icon: `${BASE}/favicon.ico`,

  async searchManga(query: string): Promise<MangaResult[]> {
    const searchUrl = `${BASE}/search/story/${encodeURIComponent(query.replace(/\s+/g, "_"))}`;
    const $ = await fetchHTML(searchUrl);
    const results: MangaResult[] = [];

    $(".story_item, .search-story-item").each((_, el) => {
      const $el = $(el);
      const link = $el.find("a").first();
      const href = link.attr("href") || "";
      const title = link.attr("title") || $el.find("h3 a").text().trim();
      const img = $el.find("img").first().attr("src") || "";

      if (title && href) {
        results.push({
          sourceId: "mangakakalot",
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
    const url = `${BASE}/manga_list?type=topview&category=all&state=all&page=${page}`;
    const $ = await fetchHTML(url);
    const results: MangaResult[] = [];

    $(".list-truyen-item-wrap").each((_, el) => {
      const $el = $(el);
      const link = $el.find("a").first();
      const href = link.attr("href") || "";
      const title = link.attr("title") || $el.find("h3 a").text().trim();
      const img = $el.find("img").first().attr("src") || "";

      if (title && href) {
        results.push({
          sourceId: "mangakakalot",
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
    const url = `${BASE}/manga_list?type=latest&category=all&state=all&page=${page}`;
    const $ = await fetchHTML(url);
    const results: MangaResult[] = [];

    $(".list-truyen-item-wrap").each((_, el) => {
      const $el = $(el);
      const link = $el.find("a").first();
      const href = link.attr("href") || "";
      const title = link.attr("title") || $el.find("h3 a").text().trim();
      const img = $el.find("img").first().attr("src") || "";

      if (title && href) {
        results.push({
          sourceId: "mangakakalot",
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

    const isManganato = url.includes("manganato") || url.includes("chapmanganato");

    let title = "";
    let description = "";
    let coverImage = "";
    let author: string | undefined;
    let status: string | undefined;
    let genres: string[] = [];
    let viewCount = 0;

    if (isManganato) {
      title = $(".story-info-right h1").text().trim();
      coverImage = $(".info-image img").attr("src") || "";
      description = $(".panel-story-info-description").text().replace("Description :", "").trim();

      $(".variations-tableInfo .table-value").each((i, el) => {
        const label = $(el).prev(".table-label").text().trim().toLowerCase();
        const val = $(el).text().trim();
        if (label.includes("author")) author = val;
        if (label.includes("status")) status = val;
        if (label.includes("genre")) {
          genres = val.split(" - ").map((g) => g.trim()).filter(Boolean);
        }
      });

      const viewText = $(".story-info-right-extent .stre-value").eq(1).text().trim();
      viewCount = parseViewCount(viewText);
    } else {
      title = $("ul.manga-info-text li h1, h1.manga-info-text").first().text().trim();
      coverImage = $(".manga-info-pic img").attr("src") || "";
      description = $("#noidungm, #panel-story-info-description").text().trim();

      $("ul.manga-info-text li").each((_, el) => {
        const text = $(el).text().trim();
        if (text.startsWith("Author")) author = text.replace(/Author[^:]*:\s*/, "");
        if (text.startsWith("Status")) status = text.replace(/Status[^:]*:\s*/, "");
        if (text.startsWith("Genres")) {
          genres = text
            .replace(/Genres[^:]*:\s*/, "")
            .split(",")
            .map((g) => g.trim())
            .filter(Boolean);
        }
      });
    }

    return {
      title,
      description,
      coverImage,
      author,
      status: status || "Ongoing",
      genres,
      viewCount,
      type: "Manga",
    };
  },

  async getChapterList(url: string): Promise<ChapterInfo[]> {
    const $ = await fetchHTML(url);
    const chapters: ChapterInfo[] = [];

    const isManganato = url.includes("manganato") || url.includes("chapmanganato");

    if (isManganato) {
      $(".row-content-chapter .a-h a.chapter-name").each((_, el) => {
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
    } else {
      $(".chapter-list .row a, #chapter .chapter-list a").each((_, el) => {
        const $el = $(el);
        const href = $el.attr("href") || "";
        const text = $el.text().trim();
        const numMatch = text.match(/Chapter\s+([\d.]+)/i);
        const num = numMatch ? parseFloat(numMatch[1]) : 0;

        if (num > 0) {
          chapters.push({
            number: num,
            title: text.replace(/Chapter\s+[\d.]+\s*[-:]?\s*/i, "").trim() || undefined,
            url: href,
          });
        }
      });
    }

    return chapters;
  },

  async getChapterPages(chapterUrl: string): Promise<ChapterPages> {
    const $ = await fetchHTML(chapterUrl);
    const pages: string[] = [];

    $(".container-chapter-reader img, #vungdoc img, .vung-doc img").each((_, el) => {
      const src = $(el).attr("src") || $(el).attr("data-src") || "";
      if (src && !src.includes("logo") && !src.includes("icon")) {
        pages.push(src);
      }
    });

    const referer = chapterUrl.includes("manganato") ? CHAP_BASE : BASE;
    return { pages, referer };
  },
};
