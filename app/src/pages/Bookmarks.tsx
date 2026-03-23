import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  Bookmark,
  Heart,
  MessageSquare,
  Repeat2,
  Shield,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import {
  getBookmarks,
  bookmarkPost,
  likePost,
  unlikePost,
} from "@/services/blockidApi";
import SubscriptionBadge from "@/components/blockid/SubscriptionBadge";

const formatRelativeTime = (dateStr?: string) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "";
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const Bookmarks = () => {
  const { publicKey } = useWallet();
  const navigate = useNavigate();
  const wallet = publicKey?.toString() ?? "";

  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [likedPostIds, setLikedPostIds] = useState<Set<number>>(new Set());
  const [likeLoading, setLikeLoading] = useState<Record<number, boolean>>({});
  useEffect(() => {
    if (!wallet) {
      setLoading(false);
      return;
    }
    getBookmarks(wallet)
      .then((data) => {
        const postsList = data.posts ?? [];
        if (postsList.length > 0) {
          console.log("First bookmark:", postsList[0]);
          console.log("image_url:", postsList[0]?.image_url);
        }
        setPosts(postsList);
      })
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, [wallet]);

  const handleRemoveBookmark = async (postId: number) => {
    if (!wallet) return;
    try {
      await bookmarkPost(wallet, postId);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (e) {
      console.error(e);
    }
  };

  const handleLike = async (post: any) => {
    if (!wallet || !post?.id) return;
    const isLiked = likedPostIds.has(post.id);
    setLikeLoading((prev) => ({ ...prev, [post.id]: true }));
    try {
      if (isLiked) {
        setLikedPostIds((prev) => {
          const next = new Set(prev);
          next.delete(post.id);
          return next;
        });
        setPosts((prev) =>
          prev.map((p) =>
            p.id === post.id
              ? {
                  ...p,
                  like_count: Math.max((p.like_count ?? 1) - 1, 0),
                  likes_count: Math.max((p.likes_count ?? p.like_count ?? 1) - 1, 0),
                }
              : p
          )
        );
        await unlikePost(wallet, post.id);
      } else {
        setLikedPostIds((prev) => {
          const next = new Set(prev);
          next.add(post.id);
          return next;
        });
        setPosts((prev) =>
          prev.map((p) =>
            p.id === post.id
              ? {
                  ...p,
                  like_count: (p.like_count ?? 0) + 1,
                  likes_count: (p.likes_count ?? p.like_count ?? 0) + 1,
                }
              : p
          )
        );
        await likePost(wallet, post.id);
      }
    } catch (e) {
      console.error("Failed to toggle like", e);
      if (isLiked) {
        setLikedPostIds((prev) => {
          const next = new Set(prev);
          next.add(post.id);
          return next;
        });
      } else {
        setLikedPostIds((prev) => {
          const next = new Set(prev);
          next.delete(post.id);
          return next;
        });
      }
    } finally {
      setLikeLoading((prev) => ({ ...prev, [post.id]: false }));
    }
  };

  if (!wallet) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
          <Bookmark className="w-12 h-12 mb-4 opacity-30" />
          <p>Connect your wallet to view bookmarks</p>
        </div>
      </DashboardLayout>
    );
  }

  const walletShort =
    wallet.length > 8 ? `${wallet.slice(0, 4)}...${wallet.slice(-4)}` : wallet;

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="px-4 py-3 border-b border-white/10 mb-4">
          <h2 className="text-xl font-bold text-white">Bookmarks</h2>
          <p className="text-sm text-slate-500">@{walletShort}</p>
        </div>

        {/* Posts */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-card p-4 animate-pulse space-y-3">
                <div className="h-3 bg-muted/50 rounded w-1/4" />
                <div className="h-3 bg-muted/40 rounded w-full" />
                <div className="h-3 bg-muted/40 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="mb-4 opacity-40"
            >
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
            <p className="text-sm">No bookmarks yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => {
              const isRepost = (post as any).is_repost === true;
              const originalPost = isRepost
                ? (post as any).original_post ?? null
                : null;

              const displayWallet =
                isRepost && originalPost
                  ? originalPost.wallet
                  : post.wallet ?? wallet;

              const displayHandle =
                isRepost && originalPost
                  ? originalPost.handle
                  : post.handle ?? null;

              const displayContent =
                isRepost && originalPost ? originalPost.content : post.content;

              const displayTrustScore = isRepost && originalPost
                ? originalPost.trust_score
                : post.trust_score;

              const isQuoteRepost =
                isRepost && !!(post as any).quote_content;

              return (
                <div key={post.id} className="glass-card p-4 space-y-3">
                  {/* Repost header */}
                  {isRepost && (
                    <div className="flex items-center gap-2 px-4 pt-3 pb-0 text-xs text-muted-foreground">
                      <Repeat2 className="w-3.5 h-3.5 text-green-400" />
                      <span>You reposted</span>
                    </div>
                  )}

                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                        {(
                          displayHandle ??
                          displayWallet ??
                          "?"
                        )[0]?.toUpperCase() ?? "?"}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground flex items-center gap-1">
                          {isRepost && originalPost
                            ? originalPost.handle
                              ? `@${originalPost.handle}`
                              : `${(originalPost.wallet ?? "").slice(0, 4)}...${(originalPost.wallet ?? "").slice(-4)}`
                            : post.handle
                            ? `@${post.handle}`
                            : `${(post.wallet ?? "").slice(0, 4)}...${(post.wallet ?? "").slice(-4)}`}
                          <SubscriptionBadge
                            plan={
                              (isRepost && originalPost
                                ? (originalPost as any)?.plan
                                : (post as any)?.plan) ?? "free"
                            }
                            size="sm"
                          />
                        </p>
                        <div className="flex items-center gap-2">
                          {displayTrustScore != null && (
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-medium flex items-center gap-1 ${
                                displayTrustScore >= 70
                                  ? "bg-emerald-500/10 text-emerald-400"
                                  : displayTrustScore >= 40
                                  ? "bg-amber-500/10 text-amber-400"
                                  : "bg-rose-500/10 text-rose-400"
                              }`}
                            >
                              <Shield className="w-3 h-3" />
                              {Math.round(displayTrustScore)}
                            </span>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {formatRelativeTime(
                              isRepost && originalPost
                                ? originalPost.created_at
                                : post.created_at
                            )}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Remove bookmark */}
                    <button
                      onClick={() => handleRemoveBookmark(post.id)}
                      className="p-1.5 rounded-lg hover:bg-muted/30 transition-colors"
                      title="Remove bookmark"
                    >
                      <Bookmark className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    </button>
                  </div>

                  {/* Quote */}
                  {isQuoteRepost && (
                    <div className="mt-1 p-3 rounded-xl border border-border bg-muted/20">
                      <p className="text-xs text-muted-foreground mb-1">
                        Quote
                      </p>
                      <p className="text-sm text-foreground">
                        {(post as any).quote_content}
                      </p>
                    </div>
                  )}

                  {/* Content */}
                  <p className="text-sm text-foreground whitespace-pre-wrap">
                    {displayContent}
                  </p>

                  {/* Post image */}
                  {post.image_url && (
                    <div className="mt-3 rounded-xl overflow-hidden">
                      <img
                        src={post.image_url}
                        alt="Post image"
                        className="w-full max-h-96 object-cover rounded-xl"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    </div>
                  )}

                  {/* Repost original image */}
                  {!post.image_url && post.original_post?.image_url && (
                    <div className="mt-3 rounded-xl overflow-hidden">
                      <img
                        src={post.original_post.image_url}
                        alt="Post image"
                        className="w-full max-h-96 object-cover rounded-xl"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    </div>
                  )}

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1 border-t border-border/50">
                    <button
                      onClick={() => handleLike(post)}
                      disabled={likeLoading[post.id]}
                      className={`flex items-center gap-1 transition-colors disabled:opacity-50 ${
                        likedPostIds.has(post.id)
                          ? "text-red-400 hover:text-red-300"
                          : "text-muted-foreground hover:text-red-400"
                      }`}
                    >
                      <Heart
                        className={`w-3.5 h-3.5 ${
                          likedPostIds.has(post.id) ? "fill-red-400" : ""
                        }`}
                      />
                      {post.like_count ?? 0}
                    </button>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5" />
                      {post.reply_count ?? 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <Repeat2 className="w-3.5 h-3.5" />
                      {post.repost_count ?? 0}
                    </span>
                    <button
                      onClick={() => navigate(`/profile/${post.wallet}`)}
                      className="ml-auto text-primary hover:underline"
                    >
                      View Profile →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Bookmarks;

