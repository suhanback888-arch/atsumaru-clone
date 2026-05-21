import * as cheerio from "cheerio";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

export async function fetchHTML(
  url: string,
  referer?: string
): Promise<cheerio.CheerioAPI> {
  const headers: Record<string, string> = {
    "User-Agent": USER_AGENT,
    Accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
  };
  if (referer) headers["Referer"] = referer;

  const res = await fetch(url, { headers, next: { revalidate: 300 } });
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  const html = await res.text();
  return cheerio.load(html);
}

export async function fetchJSON<T>(url: string, headers?: Record<string, string>): Promise<T> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "application/json",
      ...headers,
    },
    next: { revalidate: 300 },
  });
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return res.json();
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function parseNumber(text: string): number {
  const cleaned = text.replace(/[^0-9.]/g, "");
  return parseFloat(cleaned) || 0;
}

export function parseViewCount(text: string): number {
  const cleaned = text.trim().toLowerCase();
  const match = cleaned.match(/([\d.]+)\s*(k|m|b)?/);
  if (!match) return 0;
  const num = parseFloat(match[1]);
  switch (match[2]) {
    case "k":
      return Math.round(num * 1000);
    case "m":
      return Math.round(num * 1000000);
    case "b":
      return Math.round(num * 1000000000);
    default:
      return Math.round(num);
  }
}
