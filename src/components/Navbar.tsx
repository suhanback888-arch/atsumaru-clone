"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const { data: session } = useSession();
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Array<{ slug: string; title: string; type: string; coverImage: string }>>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === "Escape") setSearchOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    const timer = setTimeout(async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      if (res.ok) setResults(await res.json());
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-surface-dark/95 backdrop-blur-sm border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-4">
          <Link href="/" className="text-xl font-bold tracking-wider text-white shrink-0">
            ATSUMARU
          </Link>

          <button onClick={() => setMenuOpen(!menuOpen)} className="lg:hidden p-2 text-gray-400 hover:text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="flex-1 max-w-md relative hidden sm:block" ref={searchRef}>
            <div
              className="flex items-center bg-surface-light rounded-lg px-3 py-1.5 cursor-text border border-white/5 hover:border-primary/30 transition-colors"
              onClick={() => setSearchOpen(true)}
            >
              <svg className="w-4 h-4 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {searchOpen ? (
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search..."
                  className="bg-transparent text-sm text-white outline-none flex-1"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && query.trim()) {
                      router.push(`/explore?q=${encodeURIComponent(query)}`);
                      setSearchOpen(false);
                    }
                  }}
                />
              ) : (
                <span className="text-sm text-gray-500 flex-1">Search</span>
              )}
              <kbd className="hidden md:inline text-xs text-gray-600 bg-surface rounded px-1.5 py-0.5 ml-2">Ctrl K</kbd>
            </div>

            {searchOpen && results.length > 0 && (
              <div className="absolute top-full mt-1 left-0 right-0 bg-surface-light border border-white/10 rounded-lg shadow-xl overflow-hidden max-h-80 overflow-y-auto z-50">
                {results.map((r) => (
                  <Link
                    key={r.slug}
                    href={`/manga/${r.slug}`}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-surface-lighter transition-colors"
                    onClick={() => { setSearchOpen(false); setQuery(""); }}
                  >
                    <img src={r.coverImage} alt="" className="w-8 h-11 object-cover rounded" />
                    <div>
                      <p className="text-sm text-white">{r.title}</p>
                      <p className="text-xs text-gray-500">{r.type}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <Link href="/explore" className="p-2 text-gray-400 hover:text-primary transition-colors" title="Explore">
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

      {menuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMenuOpen(false)} />
          <div className="absolute left-0 top-14 bottom-0 w-64 bg-surface-dark border-r border-white/5 p-4 overflow-y-auto">
            <div className="sm:hidden mb-4">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search..."
                className="w-full bg-surface-light rounded-lg px-3 py-2 text-sm text-white outline-none border border-white/5"
              />
            </div>
            <nav className="flex flex-col gap-1">
              {[
                { href: "/", label: "Home" },
                { href: "/browse/trending", label: "Trending" },
                { href: "/browse/popular", label: "Popular" },
                { href: "/browse/recently-updated", label: "Recently Updated" },
                { href: "/browse/top-rated", label: "Top Rated" },
                { href: "/explore", label: "Advanced Search" },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-gray-300 hover:text-white px-3 py-2 rounded-lg hover:bg-surface-light transition-colors"
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
