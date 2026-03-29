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
import PostDetailPanel from "@/components/PostDetailPanel";
import {
  getBookmarks,
  bookmarkPost,
  likePost,
  unlikePost,
  repostPost,
  getPost,
} from "@/services/blockidApi";
import SubscriptionBadge from "@/components/blockid/SubscriptionBadge";
import UserAvatar from "@/components/UserAvatar";

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
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [selectedPostReplies, setSelectedPostReplies] = useState<any[]>([]);
  const [replyToId, setReplyToId] = useState<number | null>(null);
  const [repostedPostIds, setRepostedPostIds] = useState<Set<number>>(
    new Set()
  );

  useEffect(() => {
    if (!selectedPost?.id) return;
    getPost(selectedPost.id)
      .then((data) => setSelectedPostReplies(data.replies ?? []))
      .catch(() => {});
  }, [selectedPost?.id]);

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
                <div
                  key={post.id}
                  className="glass-card p-4 space-y-3 cursor-pointer hover:bg-muted/5 transition-colors"
                  onClick={() => {
                    setSelectedPost(post);
                    setReplyToId(post.id);
                  }}
                >
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
                      <UserAvatar
                        avatarUrl={(post as any).avatar_url}
                        avatarType={(post as any).avatar_type}
                        avatarIsAnimated={(post as any).avatar_is_animated}
                        handle={displayHandle}
                        wallet={displayWallet}
                        size={32}
                      />
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
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveBookmark(post.id);
                      }}
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
                    <div
                      className="mt-3 rounded-xl overflow-hidden"
                      style={{
                        width: "100%",
                        maxWidth: "100%",
                        backgroundColor: "transparent",
                      }}
                    >
                      <img
                        src={post.image_url}
                        alt="Post image"
                        style={{
                          width: "100%",
                          height: "auto",
                          maxHeight: 600,
                          objectFit: "contain",
                          borderRadius: 12,
                          display: "block",
                          backgroundColor: "transparent",
                        }}
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    </div>
                  )}

                  {/* Repost original image */}
                  {!post.image_url && post.original_post?.image_url && (
                    <div
                      className="mt-3 rounded-xl overflow-hidden"
                      style={{
                        width: "100%",
                        maxWidth: "100%",
                        backgroundColor: "transparent",
                      }}
                    >
                      <img
                        src={post.original_post.image_url}
                        alt="Post image"
                        style={{
                          width: "100%",
                          height: "auto",
                          maxHeight: 600,
                          objectFit: "contain",
                          borderRadius: 12,
                          display: "block",
                          backgroundColor: "transparent",
                        }}
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    </div>
                  )}

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1 border-t border-border/50">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLike(post);
                      }}
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
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPost(post);
                        setReplyToId(post.id);
                      }}
                      className="flex items-center gap-1 hover:text-primary transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      {post.reply_count ?? 0}
                    </button>
                    <button
                      type="button"
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (!wallet) return;
                        try {
                          await repostPost(wallet, post.id);
                          setRepostedPostIds((prev) => {
                            const n = new Set(prev);
                            n.add(post.id);
                            return n;
                          });
                          setPosts((prev) =>
                            prev.map((p) =>
                              p.id === post.id
                                ? {
                                    ...p,
                                    repost_count: (p.repost_count ?? 0) + 1,
                                  }
                                : p
                            )
                          );
                        } catch (err) {
                          console.error(err);
                        }
                      }}
                      className={`flex items-center gap-1 transition-colors ${
                        repostedPostIds.has(post.id)
                          ? "text-green-400"
                          : "hover:text-green-400"
                      }`}
                    >
                      <Repeat2 className="w-3.5 h-3.5" />
                      {post.repost_count ?? 0}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/profile/${post.wallet}`);
                      }}
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

      {selectedPost && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => {
            setSelectedPost(null);
            setReplyToId(null);
          }}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            backdropFilter: "blur(2px)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth:
                selectedPost.image_url ||
                selectedPost.original_post?.image_url
                  ? 900
                  : 600,
              width: "100%",
              height: "80vh",
              display: "flex",
            }}
          >
            <PostDetailPanel
              post={selectedPost}
              replies={selectedPostReplies}
              onClose={() => {
                setSelectedPost(null);
                setReplyToId(null);
              }}
              onRepliesChange={setSelectedPostReplies}
            />
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Bookmarks;

