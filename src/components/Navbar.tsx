"use client";

import Link from "next/link";
import { useState, useEffect, useRef, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

const NAV_LINKS = [
  { href: "/", label: "Home", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  { href: "/explore", label: "Advanced Search", icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" },
  { href: "/browse/popular", label: "Popular", icon: "M13 10V3L4 14h7v7l9-11h-7z" },
  { href: "/browse/top-rated", label: "Top Rated", icon: "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" },
  { href: "/browse/trending", label: "Trending", icon: "M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" },
  { href: "/browse/recently-updated", label: "Recently Updated", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
  { href: "/browse/recently-added", label: "Recently Added", icon: "M12 6v6m0 0v6m0-6h6m-6 0H6" },
  { href: "/browse/most-bookmarked", label: "Most Bookmarked", icon: "M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" },
];

const ACCOUNT_LINKS = [
  { href: "/bookmarks", label: "Bookmarks", icon: "M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" },
];

interface SearchResult {
  slug: string;
  title: string;
  type: string;
  status: string;
  year: number | null;
  coverImage: string;
  source: "local" | "mangadex";
  sourceUrl?: string;
}

function proxyImg(url: string) {
  if (url && url.startsWith("http") && !url.includes("/api/proxy")) {
    return `/api/proxy?url=${encodeURIComponent(url)}`;
  }
  return url;
}

function typeBadgeColor(type: string) {
  switch (type) {
    case "Manhwa": return "bg-blue-600";
    case "Manhua": return "bg-green-600";
    case "OEL": return "bg-orange-600";
    default: return "bg-purple-600";
  }
}

export default function Navbar() {
  const { data: session } = useSession();
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [popularResults, setPopularResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"series" | "users">("series");
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
        setSidebarOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      if (popularResults.length === 0) {
        fetch("/api/search?popular=true")
          .then((r) => r.json())
          .then((data) => setPopularResults(data))
          .catch(() => {});
      }
    }
  }, [searchOpen, popularResults.length]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setSelectedIndex(-1);
      return;
    }
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data);
          setSelectedIndex(-1);
        }
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const displayResults = query.trim() ? results : popularResults;

  const handleResultClick = useCallback(async (result: SearchResult) => {
    if (result.source === "mangadex" && result.sourceUrl) {
      setImporting(result.slug);
      try {
        const res = await fetch("/api/scrape/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sourceId: "mangadex",
            mangaUrl: result.sourceUrl,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setSearchOpen(false);
          setQuery("");
          setImporting(null);
          router.push(`/manga/${data.manga.slug}`);
          return;
        }
      } catch {
        // Fall through to slug-based navigation
      }
      setImporting(null);
    }
    setSearchOpen(false);
    setQuery("");
    router.push(`/manga/${result.slug}`);
  }, [router]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, displayResults.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < displayResults.length) {
        handleResultClick(displayResults[selectedIndex]);
      } else if (query.trim()) {
        router.push(`/explore?q=${encodeURIComponent(query)}`);
        setSearchOpen(false);
      }
    }
  }, [selectedIndex, displayResults, handleResultClick, query, router]);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-surface-dark/95 backdrop-blur-sm border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-4">
          {/* Hamburger menu button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 text-gray-400 hover:text-white transition-colors"
            aria-label="Toggle menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <Link href="/" className="text-xl font-bold tracking-wider text-white shrink-0">
            ATSUMARU
          </Link>

          {/* Search trigger */}
          <div
            className="flex-1 max-w-md relative hidden sm:block cursor-pointer"
            onClick={() => setSearchOpen(true)}
          >
            <div className="flex items-center bg-surface-light rounded-lg px-3 py-1.5 border border-white/5 hover:border-primary/30 transition-colors">
              <svg className="w-4 h-4 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="text-sm text-gray-500 flex-1">Search</span>
              <kbd className="hidden md:inline text-xs text-gray-600 bg-surface rounded px-1.5 py-0.5 ml-2">Ctrl K</kbd>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <Link href="/explore" className="p-2 text-gray-400 hover:text-primary transition-colors hidden sm:block" title="Explore">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </Link>

            {session ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-300 hidden md:inline">{session.user?.name}</span>
                <button
                  onClick={() => signOut()}
                  className="text-sm text-gray-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-surface-light transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="text-sm text-gray-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-surface-light transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/auth"
                  className="text-sm text-white bg-primary hover:bg-primary-dark px-3 py-1.5 rounded-lg transition-colors"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Search Modal Overlay */}
      {searchOpen && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[10vh]">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setSearchOpen(false); setQuery(""); }} />
          <div className="relative w-full max-w-xl mx-4 bg-surface-dark border border-white/10 rounded-xl shadow-2xl overflow-hidden">
            {/* Search input */}
            <div className="flex items-center px-4 py-3 border-b border-white/5">
              <svg className="w-5 h-5 text-gray-400 mr-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Start typing to search"
                className="bg-transparent text-white text-base outline-none flex-1 placeholder-gray-500"
                autoFocus
              />
              {loading && (
                <svg className="w-4 h-4 text-primary animate-spin ml-2" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="40" strokeLinecap="round" />
                </svg>
              )}
            </div>

            {/* Series / Users tabs */}
            <div className="flex border-b border-white/5 px-4">
              <button
                onClick={() => setActiveTab("series")}
                className={`px-3 py-2 text-sm font-medium transition-colors ${
                  activeTab === "series"
                    ? "text-white border-b-2 border-primary"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                Series
              </button>
              <button
                onClick={() => setActiveTab("users")}
                className={`px-3 py-2 text-sm font-medium transition-colors ${
                  activeTab === "users"
                    ? "text-white border-b-2 border-primary"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                Users
              </button>
            </div>

            {/* Results */}
            <section
              ref={resultsRef}
              className="max-h-[60vh] overflow-y-auto"
              aria-label={query.trim() ? "Search results" : "Popular searches"}
            >
              {activeTab === "series" ? (
                <>
                  {query.trim() && displayResults.length > 0 && (
                    <div className="px-4 py-2 text-xs text-gray-500">
                      Found {displayResults.length} result{displayResults.length !== 1 ? "s" : ""}
                    </div>
                  )}
                  {!query.trim() && popularResults.length > 0 && (
                    <div className="px-4 py-2 text-xs text-gray-500">Popular Searches</div>
                  )}
                  {query.trim() && displayResults.length === 0 && !loading && (
                    <div className="px-4 py-8 text-center text-gray-500 text-sm">No results found</div>
                  )}
                  {displayResults.map((r, i) => (
                    <button
                      key={`${r.source}-${r.slug}`}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                        i === selectedIndex ? "bg-surface-lighter" : "hover:bg-surface-light"
                      } ${importing === r.slug ? "opacity-60 pointer-events-none" : ""}`}
                      onClick={() => handleResultClick(r)}
                      data-selected={i === selectedIndex}
                    >
                      <div className="relative w-10 h-14 rounded overflow-hidden bg-surface-light shrink-0">
                        <img
                          src={proxyImg(r.coverImage)}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                        <span className={`absolute bottom-0 left-0 right-0 text-[9px] text-white text-center py-0.5 ${typeBadgeColor(r.type)}`}>
                          {r.type}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-white truncate">{r.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {r.type}
                          {r.status && r.status !== "Unknown" && <>&nbsp;&bull;&nbsp;{r.status}</>}
                          {r.year && <>&nbsp;&bull;&nbsp;{r.year}</>}
                        </p>
                      </div>
                      {importing === r.slug && (
                        <svg className="w-4 h-4 text-primary animate-spin shrink-0" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="40" strokeLinecap="round" />
                        </svg>
                      )}
                    </button>
                  ))}
                </>
              ) : (
                <div className="px-4 py-8 text-center text-gray-500 text-sm">
                  User search is not available yet
                </div>
              )}
            </section>
          </div>
        </div>
      )}

      {/* Sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setSidebarOpen(false)}>
          <div className="absolute inset-0 bg-black/50 transition-opacity" />
        </div>
      )}

      {/* Sidebar drawer */}
      <div
        className={`fixed top-0 left-0 bottom-0 w-72 bg-surface-dark border-r border-white/5 z-50 transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-14 flex items-center justify-between px-4 border-b border-white/5">
          <Link href="/" className="text-lg font-bold tracking-wider text-white" onClick={() => setSidebarOpen(false)}>
            ATSUMARU
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto h-[calc(100vh-3.5rem)] p-3">
          {/* Mobile search */}
          <div className="sm:hidden mb-3">
            <button
              onClick={() => { setSidebarOpen(false); setSearchOpen(true); }}
              className="w-full flex items-center bg-surface-light rounded-lg px-3 py-2 border border-white/5 text-sm text-gray-500"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Search...
            </button>
          </div>

          {/* Navigation links */}
          <div className="mb-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider px-3 mb-2">Browse</p>
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-3 text-sm text-gray-300 hover:text-white px-3 py-2.5 rounded-lg hover:bg-surface-light transition-colors"
                onClick={() => setSidebarOpen(false)}
              >
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={link.icon} />
                </svg>
                {link.label}
              </Link>
            ))}
          </div>

          {/* Account section */}
          {session && (
            <div className="mb-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider px-3 mb-2">Account</p>
              {ACCOUNT_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-3 text-sm text-gray-300 hover:text-white px-3 py-2.5 rounded-lg hover:bg-surface-light transition-colors"
                  onClick={() => setSidebarOpen(false)}
                >
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={link.icon} />
                  </svg>
                  {link.label}
                </Link>
              ))}
            </div>
          )}

          {/* Scraper sources info */}
          <div className="mt-4 px-3">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Sources</p>
            <div className="space-y-1">
              {["MangaDex", "Asura Scans", "MangaFire", "MangaKakalot", "Manganato", "MangaPill"].map((name) => (
                <div key={name} className="flex items-center gap-2 text-xs text-gray-500 py-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  {name}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
