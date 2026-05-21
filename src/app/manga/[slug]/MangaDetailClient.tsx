"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Comment {
  id: string;
  content: string;
  upvotes: number;
  createdAt: string;
  user: { id: string; username: string; avatarUrl: string | null };
  replies?: Comment[];
}

export default function MangaDetailClient({
  slug,
  rating,
  ratingCount,
}: {
  slug: string;
  rating: number;
  ratingCount: number;
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const [bookmarked, setBookmarked] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [showRating, setShowRating] = useState(false);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState(0);
  const [currentRating, setCurrentRating] = useState(rating);
  const [currentRatingCount, setCurrentRatingCount] = useState(ratingCount);
  const [commentSort, setCommentSort] = useState<"relevant" | "newest">("relevant");

  useEffect(() => {
    fetch(`/api/manga/${slug}/bookmark`).then((r) => r.json()).then((d) => setBookmarked(d.bookmarked));
    fetch(`/api/manga/${slug}/comments`).then((r) => r.json()).then(setComments);
    fetch(`/api/manga/${slug}/rate`).then((r) => r.json()).then((d) => {
      if (d.userRating) setUserRating(d.userRating);
    });
  }, [slug]);

  const toggleBookmark = async () => {
    if (!session) { router.push("/auth/login"); return; }
    const res = await fetch(`/api/manga/${slug}/bookmark`, { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      setBookmarked(data.bookmarked);
    }
  };

  const submitRating = async (value: number) => {
    if (!session) { router.push("/auth/login"); return; }
    const res = await fetch(`/api/manga/${slug}/rate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value }),
    });
    if (res.ok) {
      const data = await res.json();
      setUserRating(data.userRating);
      setCurrentRating(data.rating);
      setCurrentRatingCount(data.ratingCount);
      setShowRating(false);
    }
  };

  const postComment = async (content: string, parentId?: string) => {
    if (!session) { router.push("/auth/login"); return; }
    const res = await fetch(`/api/manga/${slug}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, parentId }),
    });
    if (res.ok) {
      const updated = await fetch(`/api/manga/${slug}/comments`);
      setComments(await updated.json());
      setNewComment("");
      setReplyContent("");
      setReplyTo(null);
    }
  };

  const sortedComments = [...comments].sort((a, b) => {
    if (commentSort === "newest") {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    return b.upvotes - a.upvotes;
  });

  return (
    <div>
      {/* Bookmark button */}
      <button
        onClick={toggleBookmark}
        className={`mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium text-sm transition-colors ${
          bookmarked
            ? "bg-primary text-white"
            : "bg-surface-light text-gray-300 hover:bg-surface-lighter border border-white/5"
        }`}
      >
        <svg className="w-4 h-4" fill={bookmarked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
        {bookmarked ? "Bookmarked" : "Bookmark"}
      </button>

      {/* Rate button */}
      <div className="relative mt-2">
        <button
          onClick={() => setShowRating(!showRating)}
          className="w-full flex items-center justify-center gap-2 bg-surface-light text-gray-300 hover:bg-surface-lighter border border-white/5 py-2.5 rounded-lg font-medium text-sm transition-colors"
        >
          <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
          {userRating ? `Rated ${userRating}/10` : "Rate"}
        </button>

        {showRating && (
          <div className="absolute top-full mt-1 left-0 right-0 bg-surface-light border border-white/10 rounded-lg shadow-xl p-3 z-50">
            <div className="flex gap-1 justify-center">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <button
                  key={n}
                  onMouseEnter={() => setHoverRating(n)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => submitRating(n)}
                  className="p-0.5"
                >
                  <svg
                    className={`w-5 h-5 ${
                      (hoverRating || userRating || 0) >= n
                        ? "text-yellow-500"
                        : "text-gray-600"
                    }`}
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </button>
              ))}
            </div>
            <p className="text-center text-xs text-gray-500 mt-1">
              {hoverRating > 0 ? `${hoverRating}/10` : currentRating > 0 ? `${currentRating.toFixed(1)}/10 (${currentRatingCount} ratings)` : "Click to rate"}
            </p>
          </div>
        )}
      </div>

      {/* Comments section */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">
            Comments ({comments.length})
          </h2>
          <select
            value={commentSort}
            onChange={(e) => setCommentSort(e.target.value as "relevant" | "newest")}
            className="text-xs bg-surface-light text-gray-400 border border-white/5 rounded-lg px-2 py-1 outline-none"
          >
            <option value="relevant">Relevant</option>
            <option value="newest">Newest</option>
          </select>
        </div>

        <div className="mb-4">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={session ? "Write a comment..." : "Login to comment"}
            className="w-full bg-surface-light border border-white/5 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-500 outline-none focus:border-primary/50 resize-none"
            rows={3}
            disabled={!session}
          />
          {newComment.trim() && (
            <button
              onClick={() => postComment(newComment)}
              className="mt-2 bg-primary hover:bg-primary-dark text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              Post Comment
            </button>
          )}
        </div>

        <div className="space-y-4">
          {sortedComments.map((c) => (
            <div key={c.id} className="bg-surface rounded-lg border border-white/5 p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs text-primary font-medium">
                  {c.user.username[0].toUpperCase()}
                </div>
                <div>
                  <span className="text-sm text-gray-300 font-medium">{c.user.username}</span>
                  <span className="text-xs text-gray-600 ml-2">{timeAgo(c.createdAt)}</span>
                </div>
              </div>
              <p className="text-sm text-gray-400 mb-2">{c.content}</p>
              <div className="flex items-center gap-3">
                <button className="flex items-center gap-1 text-xs text-gray-500 hover:text-primary transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                  {c.upvotes}
                </button>
                <button
                  onClick={() => setReplyTo(replyTo === c.id ? null : c.id)}
                  className="text-xs text-gray-500 hover:text-primary transition-colors"
                >
                  Reply
                </button>
              </div>

              {replyTo === c.id && (
                <div className="mt-3 ml-4">
                  <textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Write a reply..."
                    className="w-full bg-surface-light border border-white/5 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-primary/50 resize-none"
                    rows={2}
                  />
                  {replyContent.trim() && (
                    <button
                      onClick={() => postComment(replyContent, c.id)}
                      className="mt-2 bg-primary hover:bg-primary-dark text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Reply
                    </button>
                  )}
                </div>
              )}

              {c.replies && c.replies.length > 0 && (
                <div className="mt-3 ml-4 space-y-3 border-l border-white/5 pl-4">
                  {c.replies.map((reply) => (
                    <div key={reply.id}>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] text-primary font-medium">
                          {reply.user.username[0].toUpperCase()}
                        </div>
                        <span className="text-xs text-gray-300 font-medium">{reply.user.username}</span>
                        <span className="text-xs text-gray-600">{timeAgo(reply.createdAt)}</span>
                      </div>
                      <p className="text-sm text-gray-400">{reply.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}
