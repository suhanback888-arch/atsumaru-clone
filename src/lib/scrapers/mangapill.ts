import type {
  ScraperSource,
  MangaResult,
  MangaDetails,
  ChapterInfo,
  ChapterPages,
} from "./types";
import { fetchHTML, slugify } from "./utils";

const BASE = "https://mangapill.com";

export const mangapill: ScraperSource = {
  id: "mangapill",
  name: "MangaPill",
  url: BASE,
  icon: `${BASE}/favicon.ico`,

  async searchManga(query: string): Promise<MangaResult[]> {
    const url = `${BASE}/search?q=${encodeURIComponent(query)}`;
    const $ = await fetchHTML(url);
    const results: MangaResult[] = [];

    $(".my-3.grid > div").each((_, el) => {
      const $el = $(el);
      const link = $el.find("a").first();
      const href = link.attr("href") || "";
      const title = $el.find("a > div.mt-3").text().trim() || $el.find("a.text-secondary").text().trim();
      const img = $el.find("img").first().attr("src") || $el.find("img").first().attr("data-src") || "";

      if (title && href) {
        results.push({
          sourceId: "mangapill",
          slug: slugify(title),
          title,
          coverImage: img.startsWith("http") ? img : `${BASE}${img}`,
          url: href.startsWith("http") ? href : `${BASE}${href}`,
        });
      }
    });

    return results.slice(0, 20);
  },

  async getPopular(page = 1): Promise<MangaResult[]> {
    const url = page === 1 ? BASE : `${BASE}/search?page=${page}`;
    const $ = await fetchHTML(url);
    const results: MangaResult[] = [];

    $(".my-3.grid > div, .manga-card").each((_, el) => {
      const $el = $(el);
      const link = $el.find("a").first();
      const href = link.attr("href") || "";
      const title = $el.find("a > div.mt-3, .manga-title").text().trim();
      const img = $el.find("img").first().attr("src") || $el.find("img").first().attr("data-src") || "";

      if (title && href) {
        results.push({
          sourceId: "mangapill",
          slug: slugify(title),
          title,
          coverImage: img.startsWith("http") ? img : `${BASE}${img}`,
          url: href.startsWith("http") ? href : `${BASE}${href}`,
        });
      }
    });

    return results.slice(0, 20);
  },

  async getLatestUpdates(page = 1): Promise<MangaResult[]> {
    const url = `${BASE}/chapters?page=${page}`;
    const $ = await fetchHTML(url);
    const results: MangaResult[] = [];
    const seen = new Set<string>();

    $("a[href*='/manga/']").each((_, el) => {
      const $el = $(el);
      const href = $el.attr("href") || "";
      if (!href.includes("/manga/") || href.includes("/chapters")) return;

      const title = $el.text().trim();
      const img = $el.find("img").attr("src") || "";

      if (title && href && !seen.has(href)) {
        seen.add(href);
        results.push({
          sourceId: "mangapill",
          slug: slugify(title),
          title,
          coverImage: img.startsWith("http") ? img : `${BASE}${img}`,
          url: href.startsWith("http") ? href : `${BASE}${href}`,
        });
      }
    });

    return results.slice(0, 20);
  },

  async getMangaDetails(url: string): Promise<MangaDetails> {
    const $ = await fetchHTML(url);

    const title = $("h1").first().text().trim();
    const coverImage = $("img.object-cover").first().attr("src") || $(".manga-cover img").first().attr("src") || "";
    const description = $("p.text--secondary, .manga-description").first().text().trim();

    const genres: string[] = [];
    $("a[href*='/genre/']").each((_, el) => {
      const genre = $(el).text().trim();
      if (genre) genres.push(genre);
    });

    let status = "Ongoing";
    let type = "Manga";
    let year: number | undefined;
    let author: string | undefined;

    $(".grid.grid-cols-1 > div, .manga-info div").each((_, el) => {
      const text = $(el).text().trim();
      if (text.includes("Status")) {
        status = text.includes("Finished") ? "Completed" : text.includes("Publishing") ? "Ongoing" : "Ongoing";
      }
      if (text.includes("Type")) {
        if (text.includes("Manhwa")) type = "Manhwa";
        else if (text.includes("Manhua")) type = "Manhua";
        else if (text.includes("Novel")) type = "Novel";
      }
      if (text.includes("Year")) {
        const yearMatch = text.match(/\d{4}/);
        if (yearMatch) year = parseInt(yearMatch[0]);
      }
    });

    return {
      title,
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

    $("a[href*='/chapter-']").each((_, el) => {
      const $el = $(el);
      const href = $el.attr("href") || "";
      const text = $el.text().trim();
      const numMatch = text.match(/Chapter\s+([\d.]+)/i) || href.match(/chapter-([\d.]+)/i);
      const num = numMatch ? parseFloat(numMatch[1]) : 0;

      if (num > 0) {
        chapters.push({
          number: num,
          url: href.startsWith("http") ? href : `${BASE}${href}`,
        });
      }
    });

    return chapters.sort((a, b) => b.number - a.number);
  },

  async getChapterPages(chapterUrl: string): Promise<ChapterPages> {
    const $ = await fetchHTML(chapterUrl);
    const pages: string[] = [];

    $("chapter-page img, .container img[chapter-page]").each((_, el) => {
      const src = $(el).attr("src") || $(el).attr("data-src") || "";
      if (src) pages.push(src.startsWith("http") ? src : `${BASE}${src}`);
    });

    if (pages.length === 0) {
      $("img[src*='manga']").each((_, el) => {
        const src = $(el).attr("src") || "";
        if (src && !src.includes("logo")) {
          pages.push(src.startsWith("http") ? src : `${BASE}${src}`);
        }
      });
    }

    return { pages, referer: BASE };
  },
};
