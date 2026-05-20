"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import MangaCard from "@/components/MangaCard";

interface Genre {
  id: string;
  name: string;
  slug: string;
}

interface MangaItem {
  slug: string;
  title: string;
  coverImage: string;
  type: string;
}

export default function ExploreClient({ genres }: { genres: Genre[] }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [results, setResults] = useState<MangaItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [type, setType] = useState(searchParams.get("type") || "");
  const [genre, setGenre] = useState(searchParams.get("genre") || "");
  const [status, setStatus] = useState(searchParams.get("status") || "");
  const [sort, setSort] = useState(searchParams.get("sort") || "popular");
  const [page, setPage] = useState(parseInt(searchParams.get("page") || "1"));

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("category", sort);
      params.set("page", page.toString());
      params.set("limit", "24");
      if (query) params.set("q", query);
      if (type) params.set("type", type);
      if (genre) params.set("genre", genre);
      if (status) params.set("status", status);

      const res = await fetch(`/api/manga?${params}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.mangas);
        setTotal(data.total);
      }
      setLoading(false);
    };
    fetchResults();
  }, [query, type, genre, status, sort, page]);

  const applyFilters = () => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (type) params.set("type", type);
    if (genre) params.set("genre", genre);
    if (status) params.set("status", status);
    if (sort) params.set("sort", sort);
    router.push(`/explore?${params}`);
    setPage(1);
  };

  const totalPages = Math.ceil(total / 24);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold text-white mb-6">Advanced Search</h1>

      <div className="bg-surface rounded-xl border border-white/5 p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Search</label>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applyFilters()}
              placeholder="Title, author..."
              className="w-full bg-surface-light border border-white/5 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary/50"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Type</label>
            <select
              value={type}
              onChange={(e) => { setType(e.target.value); setPage(1); }}
              className="w-full bg-surface-light border border-white/5 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary/50"
            >
              <option value="">All Types</option>
              <option value="Manga">Manga</option>
              <option value="Manhwa">Manhwa</option>
              <option value="Manhua">Manhua</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Genre</label>
            <select
              value={genre}
              onChange={(e) => { setGenre(e.target.value); setPage(1); }}
              className="w-full bg-surface-light border border-white/5 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary/50"
            >
              <option value="">All Genres</option>
              {genres.map((g) => (
                <option key={g.id} value={g.slug}>{g.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Status</label>
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="w-full bg-surface-light border border-white/5 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary/50"
            >
              <option value="">All Status</option>
              <option value="Ongoing">Ongoing</option>
              <option value="Completed">Completed</option>
              <option value="Hiatus">Hiatus</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Sort By</label>
            <select
              value={sort}
              onChange={(e) => { setSort(e.target.value); setPage(1); }}
              className="w-full bg-surface-light border border-white/5 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary/50"
            >
              <option value="popular">Popular</option>
              <option value="top-rated">Top Rated</option>
              <option value="recently-updated">Recently Updated</option>
              <option value="recently-added">Recently Added</option>
              <option value="most-bookmarked">Most Bookmarked</option>
            </select>
          </div>
        </div>
      </div>

      <p className="text-sm text-gray-500 mb-4">{total} results found</p>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 md:gap-4">
          {results.map((m) => (
            <MangaCard key={m.slug} {...m} />
          ))}
        </div>
      )}

      {results.length === 0 && !loading && (
        <p className="text-center text-gray-500 py-12">No manga found matching your filters.</p>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          {page > 1 && (
            <button
              onClick={() => setPage(page - 1)}
              className="px-3 py-2 text-sm bg-surface-light hover:bg-surface-lighter text-gray-300 rounded-lg border border-white/5 transition-colors"
            >
              Previous
            </button>
          )}
          <span className="text-sm text-gray-500 px-3">Page {page} of {totalPages}</span>
          {page < totalPages && (
            <button
              onClick={() => setPage(page + 1)}
              className="px-3 py-2 text-sm bg-surface-light hover:bg-surface-lighter text-gray-300 rounded-lg border border-white/5 transition-colors"
            >
              Next
            </button>
          )}
        </div>
      )}
    </div>
  );
}
