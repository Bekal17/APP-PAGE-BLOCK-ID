import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Heart, MessageSquare, MessageSquareQuote, Repeat2 } from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  likePost,
  unlikePost,
  repostPost,
  createPost,
  getPost,
} from "@/services/blockidApi";
import UserAvatar from "@/components/UserAvatar";
import LinkPreviewCard from "@/components/LinkPreviewCard";
import { linkifyContent } from "@/utils/linkify";

type SocialPost = {
  id: number;
  wallet: string;
  handle?: string | null;
  trust_score?: number | null;
  content: string;
  created_at?: string;
  likes_count?: number;
  like_count?: number;
  replies_count?: number;
  reply_count?: number;
  repost_count?: number;
  is_repost?: boolean;
  repost_of?: number | null;
  quote_content?: string | null;
  link_url?: string | null;
  link_title?: string | null;
  link_description?: string | null;
  link_image?: string | null;
  avatar_url?: string | null;
  avatar_type?: string | null;
  avatar_is_animated?: boolean;
  original_post?: {
    wallet: string;
    handle?: string | null;
    content: string;
    trust_score?: number | null;
    created_at?: string;
    image_url?: string | null;
    plan?: string;
    link_url?: string | null;
    link_title?: string | null;
    link_description?: string | null;
    link_image?: string | null;
  } | null;
  plan?: string;
  image_url?: string | null;
};

const truncateWallet = (wallet: string) =>
  wallet.length > 8 ? `${wallet.slice(0, 4)}...${wallet.slice(-4)}` : wallet;

const normalizeIso = (iso?: string): string => {
  if (!iso) return "";
  return iso.replace("+00:00", "Z").replace(/\.\d+Z$/, "Z");
};

const formatRelativeTime = (iso?: string) => {
  if (!iso) return "";
  const date = new Date(normalizeIso(iso));
  if (isNaN(date.getTime())) return "";
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

type Props = {
  post: SocialPost;
  replies: any[];
  onClose?: () => void;
  onRepliesChange?: (replies: any[]) => void;
  onReplySuccess?: (postId: number) => void;
  onLikeChange?: (postId: number, liked: boolean) => void;
  onRepostChange?: (postId: number) => void;
  onRepostUndo?: (postId: number) => void;
  onQuote?: (post: SocialPost) => void;
  initialLikedIds?: Set<number>;
  initialRepostedIds?: Set<number>;
};

export default function PostDetailPanel({
  post,
  replies,
  onClose,
  onRepliesChange,
  onReplySuccess,
  onLikeChange,
  onRepostChange,
  onRepostUndo,
  onQuote,
  initialLikedIds,
  initialRepostedIds,
}: Props) {
  const { t } = useTranslation();
  const { publicKey } = useWallet();
  const [likedIds, setLikedIds] = useState<Set<number>>(
    initialLikedIds ?? new Set()
  );
  const [localLikeCounts, setLocalLikeCounts] = useState<
    Record<number, number>
  >({});
  const [repostedIds, setRepostedIds] = useState<Set<number>>(
    initialRepostedIds ?? new Set()
  );
  const [replyContent, setReplyContent] = useState("");
  const [replyToId, setReplyToId] = useState<number>(post.id);
  const [replyLoading, setReplyLoading] = useState(false);
  const [nestedReplies, setNestedReplies] = useState<Record<number, any[]>>(
    {}
  );
  const [currentPost, setCurrentPost] = useState<SocialPost>(post);
  const [currentReplies, setCurrentReplies] = useState<any[]>(replies);
  const [repostMenuOpen, setRepostMenuOpen] = useState(false);
  const [localRepostCount, setLocalRepostCount] = useState<number>(
    post.repost_count ?? 0
  );

  useEffect(() => {
    setReplyToId(post.id);
    setReplyContent("");
  }, [post.id]);

  useEffect(() => {
    setNestedReplies({});
  }, [post.id]);

  useEffect(() => {
    setCurrentPost(post);
  }, [post.id]);

  useEffect(() => {
    setCurrentReplies(replies);
  }, [replies]);

  useEffect(() => {
    const loadNestedReplies = async () => {
      for (const reply of currentReplies) {
        if (reply.id == null) continue;
        if ((reply.reply_count ?? reply.replies_count ?? 0) > 0) {
          try {
            const data = await getPost(Number(reply.id));
            if (data.replies?.length > 0) {
              setNestedReplies((prev) => ({
                ...prev,
                [reply.id]: data.replies,
              }));
            }
          } catch {
            /* skip */
          }
        }
      }
    };
    if (currentReplies.length > 0) void loadNestedReplies();
  }, [currentReplies.length]);

  useEffect(() => {
    if (!repostMenuOpen) return;
    const handler = () => setRepostMenuOpen(false);
    setTimeout(() => document.addEventListener("click", handler), 0);
    return () => document.removeEventListener("click", handler);
  }, [repostMenuOpen]);

  useEffect(() => {
    setLocalRepostCount(post.repost_count ?? 0);
  }, [post.id, post.repost_count]);

  const originalPost = currentPost.original_post ?? null;
  const isRepost = originalPost != null || !!currentPost.is_repost;
  const isQuoteRepost = !!currentPost.quote_content;

  const displayWallet =
    isRepost && originalPost ? originalPost.wallet : currentPost.wallet ?? "";
  const displayHandle =
    isRepost && originalPost
      ? originalPost.handle ?? null
      : currentPost.handle ?? null;
  const displayContent =
    isRepost && originalPost ? originalPost.content : currentPost.content;
  const imgUrl =
    isRepost && originalPost ? originalPost.image_url : currentPost.image_url;

  const handleLine = displayHandle
    ? `@${displayHandle}`
    : truncateWallet(displayWallet);

  const handleLikeReply = (reply: any) => {
    if (!publicKey || reply.id == null) return;
    const wallet = publicKey.toBase58();
    const isLiked = likedIds.has(reply.id);
    setLikedIds((prev) => {
      const n = new Set(prev);
      if (isLiked) n.delete(reply.id);
      else n.add(reply.id);
      return n;
    });
    setLocalLikeCounts((prev) => ({
      ...prev,
      [reply.id]: isLiked
        ? Math.max(
            (prev[reply.id] ?? reply.like_count ?? reply.likes_count ?? 0) - 1,
            0
          )
        : (prev[reply.id] ?? reply.like_count ?? reply.likes_count ?? 0) + 1,
    }));
    (isLiked ? unlikePost(wallet, reply.id) : likePost(wallet, reply.id)).catch(
      console.error
    );
  };

  const handleRepostReply = async (reply: any) => {
    if (!publicKey || reply.id == null) return;
    try {
      await repostPost(publicKey.toBase58(), reply.id);
      setRepostedIds((prev) => {
        const n = new Set(prev);
        n.add(reply.id);
        return n;
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmitReply = async () => {
    if (!publicKey || !replyContent.trim()) return;
    setReplyLoading(true);
    try {
      await createPost(
        publicKey.toBase58(),
        replyContent.trim(),
        "PUBLIC",
        replyToId
      );
      setReplyContent("");
      setReplyToId(currentPost.id);
      const data = await getPost(currentPost.id);
      onRepliesChange?.(data.replies ?? []);
      onReplySuccess?.(currentPost.id);
    } catch (e) {
      console.error(e);
    } finally {
      setReplyLoading(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        width: "100%",
        height: "100%",
        borderRadius: 16,
        overflow: "hidden",
      }}
    >
      {imgUrl && (
        <div
          style={{
            flex: "0 0 55%",
            background: "#000",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            borderRadius: "16px 0 0 16px",
          }}
        >
          <img
            src={imgUrl}
            alt="Post"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
            }}
          />
        </div>
      )}

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          padding: 0,
          overflow: "hidden",
          borderRadius: imgUrl ? "0 16px 16px 0" : 16,
          background: "var(--card-bg, #1a1a2e)",
          borderLeft: imgUrl ? "1px solid rgba(255,255,255,0.08)" : "none",
          minWidth: 0,
        }}
      >
        <div
          style={{
            padding: "20px 20px 0 20px",
            flexShrink: 0,
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              style={{
                alignSelf: "flex-end",
                background: "transparent",
                border: "none",
                color: "#fff",
                fontSize: 20,
                cursor: "pointer",
                marginBottom: 8,
                lineHeight: 1,
              }}
              aria-label="Close"
            >
              ✕
            </button>
          )}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 14,
            }}
          >
            <UserAvatar
              avatarUrl={currentPost.avatar_url ?? null}
              avatarType={currentPost.avatar_type ?? null}
              avatarIsAnimated={currentPost.avatar_is_animated ?? false}
              handle={displayHandle}
              wallet={displayWallet}
              size={40}
            />
            <div>
              <div style={{ fontWeight: "bold", color: "#fff", fontSize: 15 }}>
                {handleLine}
              </div>
              <div style={{ color: "#666", fontSize: 12 }}>
                {truncateWallet(displayWallet)}
              </div>
            </div>
          </div>

          {isQuoteRepost && (
            <div
              style={{
                marginBottom: 12,
                padding: 12,
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.04)",
              }}
            >
              <p style={{ color: "#888", fontSize: 11, marginBottom: 6 }}>
                Quote
              </p>
              <p
                style={{
                  color: "#fff",
                  fontSize: 14,
                  whiteSpace: "pre-wrap",
                  lineHeight: 1.5,
                }}
              >
                {currentPost.quote_content}
              </p>
            </div>
          )}

          <p
            style={{
              color: "#fff",
              lineHeight: 1.6,
              whiteSpace: "pre-wrap",
              fontSize: 15,
              marginBottom: 12,
            }}
          >
            {linkifyContent(displayContent)}
          </p>
          {(() => {
            const linkData = isRepost && originalPost ? originalPost : currentPost;
            return (linkData as any)?.link_url ? (
              <LinkPreviewCard
                url={(linkData as any).link_url}
                title={(linkData as any).link_title}
                description={(linkData as any).link_description}
                image={(linkData as any).link_image}
              />
            ) : null;
          })()}

          <div style={{ color: "#666", fontSize: 13, marginBottom: 12 }}>
            {formatRelativeTime(currentPost.created_at)}
          </div>

          <div
            style={{
              display: "flex",
              gap: 20,
              paddingBottom: 12,
              marginBottom: 12,
            }}
          >
            <button
              type="button"
              onClick={() => {
                if (!publicKey) return;
                const id = currentPost.id;
                const isLiked = likedIds.has(id);
                setLikedIds((prev) => {
                  const n = new Set(prev);
                  if (isLiked) n.delete(id);
                  else n.add(id);
                  return n;
                });
                setLocalLikeCounts((prev) => ({
                  ...prev,
                  [id]: isLiked
                    ? Math.max(
                        (prev[id] ??
                          currentPost.like_count ??
                          currentPost.likes_count ??
                          0) - 1,
                        0
                      )
                    : (prev[id] ??
                        currentPost.like_count ??
                        currentPost.likes_count ??
                        0) + 1,
                }));
                (
                  isLiked
                    ? unlikePost(publicKey.toBase58(), id)
                    : likePost(publicKey.toBase58(), id)
                ).catch(console.error);
                onLikeChange?.(id, !isLiked);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: "none",
                border: "none",
                cursor: "pointer",
                color: likedIds.has(currentPost.id) ? "#f87171" : "#888",
                fontSize: 13,
              }}
            >
              <Heart
                className={`w-4 h-4 ${
                  likedIds.has(currentPost.id)
                    ? "fill-red-400 text-red-400"
                    : "text-zinc-500"
                }`}
              />
              {localLikeCounts[currentPost.id] ??
                currentPost.likes_count ??
                currentPost.like_count ??
                0}{" "}
              Likes
            </button>

            <span
              style={{
                color: "#888",
                fontSize: 13,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <MessageSquare className="w-4 h-4 text-zinc-500" />
              {currentPost.replies_count ?? currentPost.reply_count ?? 0}{" "}
              {t("post.replies")}
            </span>

            <div style={{ position: "relative" }}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (!publicKey) return;
                  setRepostMenuOpen(!repostMenuOpen);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: repostedIds.has(currentPost.id) ? "#4ade80" : "#888",
                  fontSize: 13,
                }}
              >
                <Repeat2
                  className={`w-4 h-4 ${
                    repostedIds.has(currentPost.id)
                      ? "text-green-400"
                      : "text-zinc-500"
                  }`}
                />
                {localRepostCount} Reposts
              </button>

              {repostMenuOpen && (
                <div
                  style={{
                    position: "absolute",
                    bottom: "100%",
                    left: 0,
                    marginBottom: 8,
                    background: "#18181b",
                    border: "1px solid #3f3f46",
                    borderRadius: 12,
                    boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                    padding: "4px 0",
                    width: 180,
                    zIndex: 50,
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {repostedIds.has(currentPost.id) && (
                    <button
                      type="button"
                      onClick={() => {
                        setRepostedIds((prev) => {
                          const n = new Set(prev);
                          n.delete(currentPost.id);
                          return n;
                        });
                        setLocalRepostCount((c) => Math.max(c - 1, 0));
                        onRepostUndo?.(currentPost.id);
                        setRepostMenuOpen(false);
                      }}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "8px 12px",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "#4ade80",
                        fontSize: 13,
                      }}
                    >
                      <Repeat2 className="w-4 h-4" />
                      {t("post.undo_repost", "Undo Repost")}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      if (!publicKey) return;
                      void (async () => {
                        try {
                          await repostPost(
                            publicKey.toBase58(),
                            currentPost.id
                          );
                          setRepostedIds((prev) => {
                            const n = new Set(prev);
                            n.add(currentPost.id);
                            return n;
                          });
                          onRepostChange?.(currentPost.id);
                          setLocalRepostCount((c) => c + 1);
                        } catch (e) {
                          console.error(e);
                        }
                      })();
                      setRepostMenuOpen(false);
                    }}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "8px 12px",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#f4f4f5",
                      fontSize: 13,
                    }}
                  >
                    <Repeat2 className="w-4 h-4 text-green-400" />
                    {t("post.repost", "Repost")}
                  </button>

                  {onQuote && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onQuote(currentPost);
                        setRepostMenuOpen(false);
                      }}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "8px 12px",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "#f4f4f5",
                        fontSize: 13,
                      }}
                    >
                      <MessageSquareQuote className="w-4 h-4 text-blue-400" />
                      {t("post.quote", "Quote")}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "0 20px 20px 20px",
          }}
        >
          <div
            style={{
              marginTop: 16,
              paddingTop: 16,
              borderTop: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            {replyToId !== currentPost.id && (
              <div
                style={{
                  fontSize: 12,
                  color: "hsl(var(--primary))",
                  marginBottom: 6,
                }}
              >
                Replying to comment —{" "}
                <button
                  type="button"
                  onClick={() => setReplyToId(currentPost.id)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#666",
                    fontSize: 12,
                    cursor: "pointer",
                    textDecoration: "underline",
                  }}
                >
                  {t("common.cancel")}
                </button>
              </div>
            )}
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <UserAvatar
                avatarUrl={currentPost.avatar_url ?? null}
                avatarType={currentPost.avatar_type ?? null}
                avatarIsAnimated={currentPost.avatar_is_animated ?? false}
                handle={currentPost.handle ?? null}
                wallet={currentPost.wallet ?? null}
                size={32}
              />
              <div style={{ flex: 1 }}>
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder={t("post.placeholder_reply")}
                  maxLength={280}
                  rows={2}
                  style={{
                    width: "100%",
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    color: "#fff",
                    fontSize: 14,
                    resize: "none",
                    fontFamily: "inherit",
                    lineHeight: 1.5,
                  }}
                />
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: 8,
                    paddingTop: 8,
                    borderTop: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <span style={{ color: "#666", fontSize: 12 }}>
                    {replyContent.length}/280
                  </span>
                  <button
                    type="button"
                    onClick={() => void handleSubmitReply()}
                    disabled={
                      !replyContent.trim() || replyLoading || !publicKey
                    }
                    style={{
                      padding: "6px 18px",
                      borderRadius: 20,
                      background: "hsl(var(--primary))",
                      border: "none",
                      color: "#fff",
                      fontSize: 13,
                      fontWeight: "bold",
                      cursor: "pointer",
                      opacity:
                        !replyContent.trim() || replyLoading || !publicKey
                          ? 0.5
                          : 1,
                    }}
                  >
                    {replyLoading ? t("post.replying") : t("post.reply")}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {currentReplies.length === 0 ? (
            <div
              style={{
                color: "#555",
                fontSize: 13,
                textAlign: "center",
                padding: "16px 0",
              }}
            >
              No replies yet. Be the first!
            </div>
          ) : (
            currentReplies.map((reply: any) => (
              <div
                key={
                  reply.id ??
                  `r-${reply.wallet ?? ""}-${reply.created_at ?? ""}`
                }
                style={{
                  padding: "10px 0",
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                  display: "flex",
                  flexDirection: "row",
                  gap: 0,
                  alignItems: "stretch",
                  cursor: "pointer",
                }}
                onClick={async (e) => {
                  // Don't navigate if clicking on a button or link
                  if ((e.target as HTMLElement).closest("button, a")) return;
                  if (!reply.id) return;
                  try {
                    const data = await getPost(reply.id);
                    if (data?.post) {
                      setCurrentPost(data.post);
                      setCurrentReplies(data.replies ?? []);
                      setReplyToId(data.post.id);
                      setReplyContent("");
                      setNestedReplies({});
                      setLikedIds(new Set());
                      setLocalLikeCounts({});
                      setRepostedIds(new Set());
                    }
                  } catch (err) {
                    console.error("Failed to load reply thread:", err);
                  }
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    flexShrink: 0,
                    width: 32,
                  }}
                >
                  <UserAvatar
                    avatarUrl={reply.avatar_url}
                    avatarType={reply.avatar_type}
                    avatarIsAnimated={reply.avatar_is_animated}
                    handle={reply.handle}
                    wallet={reply.wallet}
                    size={32}
                  />
                  <div
                    style={{
                      width: 2,
                      flex: 1,
                      background: "rgba(255,255,255,0.1)",
                      borderRadius: 1,
                      marginTop: 4,
                    }}
                  />
                </div>

                <div style={{ flex: 1, paddingLeft: 10, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      marginBottom: 4,
                      height: 32,
                    }}
                  >
                    <div style={{ color: "#fff", fontWeight: 600, fontSize: 13 }}>
                      {reply.handle
                        ? `@${reply.handle}`
                        : `${reply.wallet?.slice(0, 4)}...${reply.wallet?.slice(-4)}`}
                    </div>
                    <div style={{ color: "#666", fontSize: 11 }}>
                      {formatRelativeTime(reply.created_at)}
                    </div>
                  </div>

                  <p
                    style={{
                      color: "#e2e8f0",
                      fontSize: 14,
                      lineHeight: 1.5,
                      whiteSpace: "pre-wrap",
                      marginBottom: 8,
                    }}
                  >
                    {linkifyContent(reply.content)}
                  </p>

                  <div style={{ display: "flex", gap: 16, marginBottom: 4 }}>
                    <button
                      type="button"
                      onClick={() => handleLikeReply(reply)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: likedIds.has(reply.id) ? "#f87171" : "#666",
                        fontSize: 12,
                      }}
                    >
                      <Heart
                        className={`w-[13px] h-[13px] shrink-0 ${
                          likedIds.has(reply.id)
                            ? "fill-red-400 text-red-400"
                            : "text-zinc-500"
                        }`}
                      />
                      {localLikeCounts[reply.id] ??
                        reply.like_count ??
                        reply.likes_count ??
                        0}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (!publicKey) return;
                        setReplyToId(reply.id);
                        setReplyContent("");
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "#666",
                        fontSize: 12,
                      }}
                    >
                      <MessageSquare className="w-[13px] h-[13px] shrink-0" />
                      {reply.reply_count ?? reply.replies_count ?? 0}
                    </button>

                    <button
                      type="button"
                      onClick={() => void handleRepostReply(reply)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: repostedIds.has(reply.id) ? "#4ade80" : "#666",
                        fontSize: 12,
                      }}
                    >
                      <Repeat2 className="w-[13px] h-[13px] shrink-0" />
                      {reply.repost_count ?? 0}
                    </button>
                  </div>

                  {(nestedReplies[reply.id] ?? []).map((nested: any) => (
                    <div
                      key={
                        nested.id ??
                        `n-${nested.wallet ?? ""}-${nested.created_at ?? ""}`
                      }
                      style={{
                        marginLeft: 40,
                        marginTop: 8,
                        paddingLeft: 12,
                        borderLeft: "2px solid rgba(255,255,255,0.08)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          marginBottom: 4,
                        }}
                      >
                        <div
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: "50%",
                            background: "hsl(var(--primary) / 0.15)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "hsl(var(--primary))",
                            fontWeight: "bold",
                            fontSize: 10,
                            flexShrink: 0,
                          }}
                        >
                          {(nested.handle ?? nested.wallet ?? "?")[0]?.toUpperCase()}
                        </div>
                        <span
                          style={{ color: "#fff", fontWeight: 600, fontSize: 12 }}
                        >
                          {nested.handle
                            ? `@${nested.handle}`
                            : `${nested.wallet?.slice(0, 4)}...${nested.wallet?.slice(-4)}`}
                        </span>
                        <span style={{ color: "#666", fontSize: 11 }}>
                          {formatRelativeTime(nested.created_at)}
                        </span>
                      </div>
                      <p
                        style={{
                          color: "#e2e8f0",
                          fontSize: 13,
                          lineHeight: 1.5,
                          whiteSpace: "pre-wrap",
                          marginLeft: 30,
                        }}
                      >
                        {linkifyContent(nested.content)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}

        </div>
      </div>
    </div>
  );
}
