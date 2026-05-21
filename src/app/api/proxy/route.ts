import { NextRequest, NextResponse } from "next/server";

const ALLOWED_HOSTS = [
  "mangadex.org",
  "uploads.mangadex.org",
  "cmdxd98sb0x3yprd.mangadex.network",
  "mangakakalot.com",
  "chapmanganato.to",
  "manganato.com",
  "avt.mkklcdnv6temp.com",
  "mangapill.com",
  "asuracomic.net",
  "mangafire.to",
  "cdn.mangafire.to",
  "asuratoon.com",
];

function isAllowedUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ALLOWED_HOSTS.some(
      (h) => parsed.hostname === h || parsed.hostname.endsWith(`.${h}`)
    );
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  const referer = req.nextUrl.searchParams.get("referer");

  if (!url) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  if (!isAllowedUrl(url)) {
    return NextResponse.json({ error: "URL not allowed" }, { status: 403 });
  }

  try {
    const headers: Record<string, string> = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "image/webp,image/apng,image/*,*/*;q=0.8",
    };

    if (referer) {
      headers["Referer"] = referer;
      headers["Origin"] = new URL(referer).origin;
    }

    const response = await fetch(url, { headers });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Upstream returned ${response.status}` },
        { status: response.status }
      );
    }

    const contentType = response.headers.get("content-type") || "image/jpeg";
    const buffer = await response.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Proxy error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
