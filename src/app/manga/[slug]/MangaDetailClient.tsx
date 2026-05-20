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

export default function MangaDetailClient({ slug }: { slug: string }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [bookmarked, setBookmarked] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");

  useEffect(() => {
    fetch(`/api/manga/${slug}/bookmark`).then((r) => r.json()).then((d) => setBookmarked(d.bookmarked));
    fetch(`/api/manga/${slug}/comments`).then((r) => r.json()).then(setComments);
  }, [slug]);

  const toggleBookmark = async () => {
    if (!session) { router.push("/auth/login"); return; }
    const res = await fetch(`/api/manga/${slug}/bookmark`, { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      setBookmarked(data.bookmarked);
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

  return (
    <div>
      <button
        onClick={toggleBookmark}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
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

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-white mb-4">Comments</h2>

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
          {comments.map((c) => (
            <div key={c.id} className="bg-surface rounded-lg border border-white/5 p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs text-primary font-medium">
                  {c.user.username[0].toUpperCase()}
                </div>
                <span className="text-sm text-gray-300 font-medium">{c.user.username}</span>
                <span className="text-xs text-gray-600">{new Date(c.createdAt).toLocaleDateString()}</span>
              </div>
              <p className="text-sm text-gray-400 mb-2">{c.content}</p>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-600">{c.upvotes} upvotes</span>
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
                  <button
                    onClick={() => postComment(replyContent, c.id)}
                    className="mt-1 bg-primary hover:bg-primary-dark text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Reply
                  </button>
                </div>
              )}

              {c.replies && c.replies.length > 0 && (
                <div className="mt-3 ml-4 space-y-3 border-l-2 border-white/5 pl-4">
                  {c.replies.map((r) => (
                    <div key={r.id}>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px] text-primary font-medium">
                          {r.user.username[0].toUpperCase()}
                        </div>
                        <span className="text-xs text-gray-300 font-medium">{r.user.username}</span>
                        <span className="text-xs text-gray-600">{new Date(r.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm text-gray-400">{r.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {comments.length === 0 && (
            <p className="text-sm text-gray-600 text-center py-6">No comments yet. Be the first to comment!</p>
          )}
        </div>
      </div>
    </div>
  );
}
