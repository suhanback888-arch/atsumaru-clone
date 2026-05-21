export interface MangaResult {
  sourceId: string;
  slug: string;
  title: string;
  coverImage: string;
  url: string;
  type?: string;
  latestChapter?: number;
}

export interface MangaDetails {
  title: string;
  altTitles?: string[];
  description?: string;
  coverImage: string;
  bannerImage?: string;
  type?: string;
  status?: string;
  year?: number;
  author?: string;
  artist?: string;
  genres?: string[];
  rating?: number;
  ratingCount?: number;
  viewCount?: number;
  externalLinks?: Record<string, string>;
}

export interface ChapterInfo {
  number: number;
  title?: string;
  url: string;
  date?: Date;
}

export interface ChapterPages {
  pages: string[];
  referer?: string;
}

export interface ScraperSource {
  id: string;
  name: string;
  url: string;
  icon?: string;
  searchManga(query: string): Promise<MangaResult[]>;
  getPopular(page?: number): Promise<MangaResult[]>;
  getLatestUpdates(page?: number): Promise<MangaResult[]>;
  getMangaDetails(url: string): Promise<MangaDetails>;
  getChapterList(url: string): Promise<ChapterInfo[]>;
  getChapterPages(chapterUrl: string): Promise<ChapterPages>;
}
