import { useEffect, useState } from "react";
import { Heart, MessageSquare, Repeat2 } from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  likePost,
  unlikePost,
  repostPost,
  createPost,
  getPost,
} from "@/services/blockidApi";

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
  original_post?: {
    wallet: string;
    handle?: string | null;
    content: string;
    trust_score?: number | null;
    created_at?: string;
    image_url?: string | null;
    plan?: string;
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
};

export default function PostDetailPanel({
  post,
  replies,
  onClose,
  onRepliesChange,
}: Props) {
  const { publicKey } = useWallet();
  const [likedIds, setLikedIds] = useState<Set<number>>(new Set());
  const [localLikeCounts, setLocalLikeCounts] = useState<
    Record<number, number>
  >({});
  const [repostedIds, setRepostedIds] = useState<Set<number>>(new Set());
  const [replyContent, setReplyContent] = useState("");
  const [replyToId, setReplyToId] = useState<number>(post.id);
  const [replyLoading, setReplyLoading] = useState(false);
  const [nestedReplies, setNestedReplies] = useState<Record<number, any[]>>(
    {}
  );

  useEffect(() => {
    setReplyToId(post.id);
    setReplyContent("");
  }, [post.id]);

  useEffect(() => {
    setNestedReplies({});
  }, [post.id]);

  useEffect(() => {
    const loadNestedReplies = async () => {
      for (const reply of replies) {
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
    if (replies.length > 0) void loadNestedReplies();
  }, [replies.length]);

  const originalPost = post.original_post ?? null;
  const isRepost = originalPost != null || !!post.is_repost;
  const isQuoteRepost = !!post.quote_content;

  const displayWallet =
    isRepost && originalPost ? originalPost.wallet : post.wallet ?? "";
  const displayHandle =
    isRepost && originalPost
      ? originalPost.handle ?? null
      : post.handle ?? null;
  const displayContent =
    isRepost && originalPost ? originalPost.content : post.content;
  const imgUrl =
    isRepost && originalPost ? originalPost.image_url : post.image_url;

  const avatarLetter =
    (displayHandle ?? displayWallet ?? "?")[0]?.toUpperCase() ?? "?";
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
      setReplyToId(post.id);
      const data = await getPost(post.id);
      onRepliesChange?.(data.replies ?? []);
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
          padding: 20,
          overflowY: "auto",
          borderRadius: imgUrl ? "0 16px 16px 0" : 16,
          background: "var(--card-bg, #1a1a2e)",
          borderLeft: imgUrl ? "1px solid rgba(255,255,255,0.08)" : "none",
          minWidth: 0,
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
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: "rgba(99,102,241,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#818cf8",
              fontWeight: "bold",
              fontSize: 14,
              flexShrink: 0,
            }}
          >
            {avatarLetter}
          </div>
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
              {post.quote_content}
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
          {displayContent}
        </p>

        <div style={{ color: "#666", fontSize: 13, marginBottom: 12 }}>
          {formatRelativeTime(post.created_at)}
        </div>

        <div
          style={{
            display: "flex",
            gap: 16,
            paddingBottom: 12,
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            marginBottom: 12,
          }}
        >
          <span style={{ color: "#888", fontSize: 13 }}>
            {post.likes_count ?? post.like_count ?? 0} Likes
          </span>
          <span style={{ color: "#888", fontSize: 13 }}>
            {post.replies_count ?? post.reply_count ?? 0} Replies
          </span>
          <span style={{ color: "#888", fontSize: 13 }}>
            {post.repost_count ?? 0} Reposts
          </span>
        </div>

        {replies.length === 0 ? (
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
          replies.map((reply: any) => (
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
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: "rgba(99,102,241,0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#818cf8",
                    fontWeight: "bold",
                    fontSize: 11,
                    flexShrink: 0,
                  }}
                >
                  {(reply.handle ?? reply.wallet ?? "?")[0]?.toUpperCase()}
                </div>
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
                  {reply.content}
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
                          background: "rgba(99,102,241,0.15)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#818cf8",
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
                      {nested.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}

        <div
          style={{
            marginTop: 16,
            paddingTop: 16,
            borderTop: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          {replyToId !== post.id && (
            <div
              style={{
                fontSize: 12,
                color: "#818cf8",
                marginBottom: 6,
              }}
            >
              Replying to comment —{" "}
              <button
                type="button"
                onClick={() => setReplyToId(post.id)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#666",
                  fontSize: 12,
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
              >
                cancel
              </button>
            </div>
          )}
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "rgba(99,102,241,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#818cf8",
                fontWeight: "bold",
                fontSize: 12,
                flexShrink: 0,
              }}
            >
              {publicKey?.toString()[0].toUpperCase() ?? "?"}
            </div>
            <div style={{ flex: 1 }}>
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Post your reply..."
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
                    background: "#6366f1",
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
                  {replyLoading ? "Replying..." : "Reply"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
