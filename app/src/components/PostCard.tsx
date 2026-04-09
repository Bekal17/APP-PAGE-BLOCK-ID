import { type CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import { type PublicKey } from "@solana/web3.js";
import {
  Heart,
  MessageSquare,
  Repeat2,
  MessageSquareQuote,
  Flag,
  Bookmark,
  MoreVertical,
  Clock,
  Shield,
} from "lucide-react";
import WalletHoverCard from "@/components/WalletHoverCard";
import UserAvatar from "@/components/UserAvatar";
import SubscriptionBadge from "@/components/blockid/SubscriptionBadge";
import LinkPreviewCard from "@/components/LinkPreviewCard";
import { linkifyContent } from "@/utils/linkify";
import { likePost, unlikePost, repostPost } from "@/services/blockidApi";

export type SocialPost = {
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
  reposted_by_wallet?: string | null;
  reposted_by_handle?: string | null;
  link_url?: string | null;
  link_title?: string | null;
  link_description?: string | null;
  link_image?: string | null;
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
  top_reply?: {
    id: number;
    wallet: string;
    handle?: string | null;
    content: string;
    created_at?: string;
    like_count?: number;
    reply_count?: number;
    repost_count?: number;
    plan?: string;
  } | null;
};

export type WalletProfile = {
  wallet: string;
  handle?: string | null;
  trust_score?: number | null;
};

export type PostCardProps = {
  post: SocialPost;
  profile: WalletProfile;
  publicKey: PublicKey | null;
  activeTab: "explore" | "following" | "newest";
  likedPostIds: Set<number>;
  repostedPostIds: Set<number>;
  bookmarkedIds: Set<number>;
  bookmarkLoading: Record<number, boolean>;
  followedWallets: Set<string>;
  likeLoading: Record<number, boolean>;
  menuOpenId: number | null;
  repostDropdownId: number | null;
  repostTargetId: number | null;
  onPostClick: (post: SocialPost) => void;
  onLike: (post: SocialPost) => void;
  onReply: (postId: number) => void;
  onRepost: (postId: number, targetId: number) => void | Promise<void>;
  onQuote: (post: SocialPost) => void;
  onBookmark: (post: SocialPost) => void;
  onReport: (postId: number) => void;
  onMenuOpen: (postId: number | null) => void;
  onRepostDropdown: (postId: number | null, targetId: number | null) => void;
  onUndoRepost: (targetId: number) => void;
  onTopReplyClick: (reply: SocialPost["top_reply"]) => void;
  onTopReplyLike: (replyId: number) => void;
  onTopReplyRepost: (replyId: number) => void;
  onTopReplyComment: (post: SocialPost, replyId: number) => void;
};

const truncateWallet = (wallet: string) =>
  wallet.length > 8 ? `${wallet.slice(0, 4)}...${wallet.slice(-4)}` : wallet;

/** Skip opening post / reply modal when the user is selecting text in the card. */
function isSelectingText(): boolean {
  const selection = window.getSelection();
  return Boolean(selection && selection.toString().length > 0);
}

const getTrustColor = (score?: number | null) => {
  if (score == null) return "bg-muted text-muted-foreground";
  if (score >= 70) return "bg-emerald-500/10 text-emerald-400";
  if (score >= 40) return "bg-amber-500/10 text-amber-400";
  return "bg-rose-500/10 text-rose-400";
};

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

const pkStr = (pk: PublicKey | null) => pk?.toString() ?? "";

type RepostMenuProps = {
  post: SocialPost;
  isRepost: boolean;
  originalPost: SocialPost["original_post"];
  publicKey: PublicKey | null;
  repostedPostIds: Set<number>;
  repostDropdownId: number | null;
  repostTargetId: number | null;
  onRepostDropdown: (postId: number | null, targetId: number | null) => void;
  onUndoRepost: (targetId: number) => void;
  onRepost: (postId: number, targetId: number) => void | Promise<void>;
  onQuote: (post: SocialPost) => void;
};

function RepostMenu({
  post,
  isRepost,
  originalPost,
  publicKey,
  repostedPostIds,
  repostDropdownId,
  repostTargetId,
  onRepostDropdown,
  onUndoRepost,
  onRepost,
  onQuote,
}: RepostMenuProps) {
  const p = post as SocialPost & { repost_of?: number | null };
  const { t } = useTranslation();
  return (
    <div className="relative">
      <button
        type="button"
        className={`flex items-center gap-1 transition-colors text-sm ${
          repostedPostIds.has(p.repost_of ?? post.id ?? 0)
            ? "text-green-400 hover:text-green-300"
            : "text-muted-foreground hover:text-green-400"
        }`}
        onClick={(e) => {
          e.stopPropagation();
          if (!publicKey) return;
          const targetId =
            isRepost && p.repost_of ? p.repost_of : post.id ?? null;
          onRepostDropdown(
            repostDropdownId === (post.id ?? null) ? null : post.id ?? null,
            targetId
          );
        }}
      >
        <Repeat2
          className={`w-4 h-4 ${
            repostedPostIds.has(p.repost_of ?? post.id ?? 0)
              ? "fill-green-400/20"
              : ""
          }`}
        />
        {post.repost_count ?? 0}
      </button>

      {repostDropdownId === post.id && (
        <div
          className="absolute bottom-full left-0 mb-2 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl py-1 w-44 z-50"
          onClick={(e) => e.stopPropagation()}
        >
          {repostedPostIds.has(repostTargetId ?? repostDropdownId ?? 0) && (
            <button
              type="button"
              onClick={() => {
                const tid = repostTargetId ?? repostDropdownId;
                if (tid == null) return;
                onUndoRepost(tid);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-green-400 hover:bg-zinc-800 transition-colors"
            >
              <Repeat2 className="w-4 h-4" />
              Undo Repost
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              void (async () => {
                if (!publicKey) return;
                const idToRepost =
                  repostTargetId ?? repostDropdownId ?? null;
                if (idToRepost == null) return;
                await onRepost(post.id, idToRepost);
              })();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <Repeat2 className="w-4 h-4 text-green-400" />
            {t("post.repost")}
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onQuote(post);
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <MessageSquareQuote className="w-4 h-4 text-blue-400" />
            Quote
          </button>
        </div>
      )}
    </div>
  );
}

export default function PostCard({
  post,
  profile,
  publicKey,
  activeTab,
  likedPostIds,
  repostedPostIds,
  bookmarkedIds,
  bookmarkLoading,
  followedWallets,
  likeLoading,
  menuOpenId,
  repostDropdownId,
  repostTargetId,
  onPostClick,
  onLike,
  onReply,
  onRepost,
  onQuote,
  onBookmark,
  onReport,
  onMenuOpen,
  onRepostDropdown,
  onUndoRepost,
  onTopReplyClick,
  onTopReplyLike,
  onTopReplyRepost,
  onTopReplyComment,
}: PostCardProps) {
  const trustScore =
    profile?.trust_score ?? post?.trust_score ?? undefined;
  const originalPost = (post as SocialPost).original_post ?? null;
  const isRepost =
    originalPost != null ||
    (!!post.is_repost && post.is_repost !== false);

  const displayWallet =
    isRepost && originalPost ? originalPost.wallet : post.wallet ?? "";

  const displayHandle =
    isRepost && originalPost
      ? originalPost.handle
      : profile?.handle ?? post.handle ?? null;

  const isQuoteRepost = isRepost && !!post.quote_content;

  const displayContent =
    isRepost && originalPost ? originalPost.content : post.content;

  const displayTrustScore =
    isRepost && originalPost ? originalPost.trust_score : trustScore;

  const trustColor = getTrustColor(displayTrustScore);

  const walletPk = pkStr(publicKey);

  const repostLabel = isRepost ? (
    <div className="flex items-center gap-1.5 px-1 pb-1 text-xs text-muted-foreground">
      <Repeat2 className="w-3.5 h-3.5 text-green-400" />
      <span>
        {post?.handle
          ? `@${post.handle}`
          : truncateWallet(post?.wallet ?? "")}{" "}
        reposted
      </span>
    </div>
  ) : null;

  const mainPostCard = (
    <div
      className="glass-card p-4 flex flex-col gap-3 animate-slide-up cursor-pointer"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
      onClick={() => {
        // Don't open modal if user is selecting text
        if (isSelectingText()) return;
        onPostClick(post);
      }}
    >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 12,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              flexShrink: 0,
              alignSelf: "stretch",
            }}
          >
            <UserAvatar
              avatarUrl={
                isRepost && originalPost
                  ? (originalPost as any).avatar_url
                  : (post as any).avatar_url
              }
              avatarType={
                isRepost && originalPost
                  ? (originalPost as any).avatar_type
                  : (post as any).avatar_type
              }
              avatarIsAnimated={
                isRepost && originalPost
                  ? (originalPost as any).avatar_is_animated
                  : (post as any).avatar_is_animated
              }
              handle={displayHandle}
              wallet={displayWallet}
              size={36}
            />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <WalletHoverCard
                    wallet={
                      isRepost && originalPost
                        ? originalPost.wallet
                        : post.wallet ?? ""
                    }
                    handle={
                      isRepost && originalPost
                        ? (originalPost.handle ?? undefined)
                        : (profile?.handle ?? post.handle ?? undefined)
                    }
                    isFollowing={followedWallets.has(
                      isRepost && originalPost
                        ? originalPost.wallet
                        : post.wallet ?? ""
                    )}
                  >
                    <span className="text-sm font-semibold text-foreground inline-flex items-center gap-1">
                      {isRepost && originalPost
                        ? originalPost.handle
                          ? `@${originalPost.handle}`
                          : truncateWallet(originalPost.wallet ?? "")
                        : displayHandle
                          ? `@${displayHandle}`
                          : truncateWallet(post?.wallet ?? "")}
                      <SubscriptionBadge
                        plan={
                          (isRepost && originalPost
                            ? (originalPost as { plan?: string })?.plan
                            : (post as { plan?: string })?.plan) ?? "free"
                        }
                        size="sm"
                      />
                    </span>
                  </WalletHoverCard>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-medium flex items-center gap-1 ${trustColor}`}
                  >
                    <Shield className="w-3 h-3" />
                    {displayTrustScore != null
                      ? Math.round(displayTrustScore)
                      : "No score"}
                  </span>
                </div>
                {!displayHandle && (
                  <p className="text-[11px] text-muted-foreground">
                    {truncateWallet(displayWallet)}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>{formatRelativeTime(post?.created_at)}</span>
                </div>
                <div className="relative">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onMenuOpen(
                        menuOpenId === post?.id ? null : (post?.id ?? 0)
                      );
                    }}
                    className="p-1 rounded-md hover:bg-muted/30 text-muted-foreground"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {menuOpenId === post?.id && (
                    <div
                      className="absolute right-0 top-6 z-50 w-44 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl py-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        disabled={!!bookmarkLoading[post?.id ?? 0]}
                        onClick={() => {
                          onBookmark(post);
                          onMenuOpen(null);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-100 hover:bg-zinc-800 transition-colors disabled:opacity-50"
                      >
                        <Bookmark
                          className={`w-4 h-4 ${
                            bookmarkedIds.has(post?.id)
                              ? "text-yellow-400 fill-yellow-400"
                              : "text-zinc-400"
                          }`}
                        />
                        {bookmarkedIds.has(post?.id)
                          ? "Remove Bookmark"
                          : "Bookmark"}
                      </button>

                      {publicKey && post?.wallet !== walletPk && (
                        <button
                          type="button"
                          onClick={() => {
                            onReport(post?.id ?? 0);
                            onMenuOpen(null);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-zinc-800 transition-colors"
                        >
                          <Flag className="w-4 h-4" />
                          Report Post
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {isQuoteRepost && (
              <div className="mt-1 p-3 rounded-xl border border-border bg-muted/20">
                <p className="text-xs text-muted-foreground mb-1">Quote</p>
                <p className="text-sm text-foreground whitespace-pre-wrap">
                  {linkifyContent(post.quote_content ?? "")}
                </p>
              </div>
            )}

            {isRepost && !originalPost ? (
              <div className="h-4 bg-muted/30 rounded animate-pulse w-2/3" />
            ) : (
              <p className="text-sm text-foreground whitespace-pre-wrap">
                {linkifyContent(displayContent)}
              </p>
            )}
            {(() => {
              const linkData = isRepost && originalPost
                ? originalPost
                : post;
              return (linkData as any)?.link_url ? (
                <LinkPreviewCard
                  url={(linkData as any).link_url}
                  title={(linkData as any).link_title}
                  description={(linkData as any).link_description}
                  image={(linkData as any).link_image}
                />
              ) : null;
            })()}
            {(() => {
              const imgUrl =
                isRepost && originalPost
                  ? originalPost.image_url
                  : post.image_url;
              return imgUrl ? (
                <div
                  style={{
                    width: "100%",
                    maxWidth: "100%",
                    overflow: "hidden",
                    marginTop: 8,
                    borderRadius: 12,
                    backgroundColor: "transparent",
                  }}
                >
                  <img
                    src={imgUrl}
                    alt="Post image"
                    style={{
                      width: "100%",
                      height: "auto",
                      maxHeight: "600px",
                      objectFit: "contain",
                      borderRadius: 12,
                      display: "block",
                      backgroundColor: "transparent",
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      // Don't open modal if user is selecting text
                      if (isSelectingText()) return;
                      onPostClick(post);
                    }}
                  />
                </div>
              ) : null;
            })()}

            <div className="flex items-center justify-between pt-1 text-xs text-muted-foreground">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  className={`flex items-center gap-1 transition-colors disabled:opacity-60 ${
                    likedPostIds.has(post?.id)
                      ? "text-red-400 hover:text-red-300"
                      : "hover:text-red-400"
                  }`}
                  disabled={likeLoading[post?.id]}
                  onClick={(e) => {
                    e.stopPropagation();
                    onLike(post);
                  }}
                >
                  <Heart
                    className={`w-3.5 h-3.5 ${
                      likeLoading[post?.id]
                        ? "animate-pulse"
                        : likedPostIds.has(post?.id)
                          ? "fill-red-400"
                          : ""
                    }`}
                  />
                  <span>{post?.likes_count ?? post?.like_count ?? 0}</span>
                </button>
                <button
                  type="button"
                  className="flex items-center gap-1 hover:text-primary transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!post?.id || !publicKey) return;
                    onReply(post.id);
                  }}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>
                    {post?.replies_count ?? post?.reply_count ?? 0}
                  </span>
                </button>
                <RepostMenu
                  post={post}
                  isRepost={isRepost}
                  originalPost={originalPost}
                  publicKey={publicKey}
                  repostedPostIds={repostedPostIds}
                  repostDropdownId={repostDropdownId}
                  repostTargetId={repostTargetId}
                  onRepostDropdown={onRepostDropdown}
                  onUndoRepost={onUndoRepost}
                  onRepost={onRepost}
                  onQuote={onQuote}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
  );

  const normalCard = (
    <>
      {repostLabel}
      {mainPostCard}
    </>
  );

  if (activeTab === "following" && post.top_reply) {
    const tr = post.top_reply;
    return (
      <div style={{ position: "relative" }}>
        <div
          style={{
            position: "absolute",
            left: 43,
            top: "auto",
            bottom: 52,
            height: 40,
            width: 2,
            background: "rgba(255,255,255,0.12)",
            zIndex: 2,
          }}
        />
        <div style={{ marginBottom: 0, paddingBottom: 0 }}>
          {repostLabel}
          {mainPostCard}
        </div>
        <div
          className="glass-card"
          style={{
            marginTop: 0,
            borderTop: "1px solid rgba(255,255,255,0.04)",
            borderTopLeftRadius: 0,
            borderTopRightRadius: 0,
            padding: "10px 16px 10px 16px",
            position: "relative",
            zIndex: 1,
            cursor: "pointer",
          }}
          onClick={(e) => {
            e.stopPropagation();
            // Don't open modal if user is selecting text
            if (isSelectingText()) return;
            onTopReplyClick(tr);
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 10,
              alignItems: "flex-start",
            }}
          >
            <UserAvatar
              avatarUrl={(tr as any).avatar_url}
              avatarType={(tr as any).avatar_type}
              avatarIsAnimated={(tr as any).avatar_is_animated}
              handle={tr.handle}
              wallet={tr.wallet}
              size={32}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginBottom: 3,
                }}
              >
                <span
                  style={{
                    color: "hsl(var(--foreground))",
                    fontWeight: 600,
                    fontSize: 13,
                  }}
                >
                  {tr.handle
                    ? `@${tr.handle}`
                    : `${tr.wallet?.slice(0, 4)}...${tr.wallet?.slice(-4)}`}
                </span>
                <span style={{ color: "hsl(var(--muted-foreground))", fontSize: 11 }}>
                  · {formatRelativeTime(tr.created_at)}
                </span>
              </div>
              <p
                style={
                  {
                    color: "hsl(var(--muted-foreground))",
                    fontSize: 13,
                    lineHeight: 1.5,
                    whiteSpace: "pre-wrap",
                    overflow: "hidden",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                  } as CSSProperties
                }
              >
                {tr.content}
              </p>
              <div
                style={{
                  display: "flex",
                  gap: 14,
                  marginTop: 8,
                }}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!publicKey) return;
                    onTopReplyLike(tr.id);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "hsl(var(--muted-foreground))",
                    fontSize: 12,
                  }}
                >
                  <Heart className="w-3 h-3 shrink-0" />
                  {tr.like_count ?? 0}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!publicKey) return;
                    onTopReplyComment(post, tr.id);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "hsl(var(--muted-foreground))",
                    fontSize: 12,
                  }}
                >
                  <MessageSquare className="w-3 h-3 shrink-0" />
                  {tr.reply_count ?? 0}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!publicKey) return;
                    onTopReplyRepost(tr.id);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "hsl(var(--muted-foreground))",
                    fontSize: 12,
                  }}
                >
                  <Repeat2 className="w-3 h-3 shrink-0" />
                  {tr.repost_count ?? 0}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return normalCard;
}
