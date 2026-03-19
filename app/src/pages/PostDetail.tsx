import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  ArrowLeft,
  Heart,
  MessageSquare,
  Repeat2,
  Bookmark,
  Shield,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import WalletHoverCard from "@/components/WalletHoverCard";
import {
  getPost,
  likePost,
  bookmarkPost,
  createPost,
  getSocialProfile,
  endorseWallet,
} from "@/services/blockidApi";

const formatTime = (iso?: string) => {
  if (!iso) return "";
  const utcIso = iso.endsWith("Z") ? iso : iso + "Z";
  const date = new Date(utcIso);
  return date.toLocaleString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatRelativeTime = (iso?: string) => {
  if (!iso) return "";
  const utcIso = iso.endsWith("Z") ? iso : iso + "Z";
  const date = new Date(utcIso);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const PostDetail = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const { publicKey } = useWallet();

  const [post, setPost] = useState<any>(null);
  const [replies, setReplies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [bookmarked, setBookmarked] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [replyLoading, setReplyLoading] = useState(false);

  useEffect(() => {
    if (!postId) return;
    getPost(Number(postId))
      .then((data) => {
        setPost(data.post);
        setReplies(data.replies ?? []);
        setLikeCount(data.post?.like_count ?? 0);
        if (data.post?.wallet) {
          getSocialProfile(data.post.wallet)
            .then(setProfile)
            .catch(() => {});
        }
      })
      .catch(() => setPost(null))
      .finally(() => setLoading(false));
  }, [postId]);

  const handleLike = async () => {
    if (!publicKey || !post?.id) return;
    try {
      await likePost(publicKey.toString(), post.id);
      setLiked(true);
      setLikeCount((prev) => prev + 1);
    } catch (e) {
      console.error(e);
    }
  };

  const handleBookmark = async () => {
    if (!publicKey || !post?.id) return;
    try {
      const res = await bookmarkPost(publicKey.toString(), post.id);
      setBookmarked(res.bookmarked);
    } catch (e) {
      console.error(e);
    }
  };

  const handleReply = async () => {
    if (!publicKey || !replyContent.trim() || !post?.id) return;
    setReplyLoading(true);
    try {
      await createPost(publicKey.toString(), replyContent.trim(), "PUBLIC", post.id);
      setReplyContent("");
      const data = await getPost(post.id);
      setReplies(data.replies ?? []);
    } catch (e) {
      console.error(e);
    }
    setReplyLoading(false);
  };

  const displayName = profile?.handle
    ? `@${profile.handle}`
    : post?.handle
    ? `@${post.handle}`
    : `${post?.wallet?.slice(0, 6)}...${post?.wallet?.slice(-4)}`;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto px-4 animate-pulse space-y-4 pt-4">
          <div className="h-8 bg-muted/40 rounded w-24" />
          <div className="glass-card p-4 space-y-3">
            <div className="h-4 bg-muted/40 rounded w-1/3" />
            <div className="h-4 bg-muted/40 rounded w-full" />
            <div className="h-4 bg-muted/40 rounded w-2/3" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!post) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto px-4 pt-8 text-center text-muted-foreground">
          <p>Post not found</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 text-primary hover:underline"
          >
            Go back
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center gap-3 py-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full hover:bg-muted/30 transition-colors text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold text-foreground">Post</h1>
        </div>

        {/* Main post */}
        <div className="glass-card p-4 mb-0 rounded-b-none border-b-0">
          {/* Author */}
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
              {(profile?.handle ?? post?.handle ?? post?.wallet ?? "?")[0].toUpperCase()}
            </div>
            <div className="flex-1">
              <WalletHoverCard
                wallet={post?.wallet ?? ""}
                handle={profile?.handle ?? post?.handle}
              >
                <p className="text-sm font-bold text-foreground cursor-pointer hover:underline">
                  {displayName}
                </p>
              </WalletHoverCard>
              <p className="text-xs text-muted-foreground font-mono">
                {post?.wallet?.slice(0, 6)}...{post?.wallet?.slice(-4)}
              </p>
            </div>
            {post?.trust_score != null && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 flex items-center gap-1">
                <Shield className="w-3 h-3" />
                {Math.round(post.trust_score)}
              </span>
            )}
          {publicKey &&
            post?.wallet !== publicKey.toString() && (
              <button
                onClick={() => {
                  if (!publicKey) return;
                  endorseWallet(
                    publicKey.toString(),
                    post?.wallet ?? "",
                    "Great on-chain reputation"
                  ).catch(() => {});
                }}
                className="px-3 py-1 rounded-full border border-border/60 text-xs text-muted-foreground hover:bg-muted/10 transition-colors"
              >
                Endorse
              </button>
            )}
          </div>

          {/* Content */}
          <p className="text-base text-foreground whitespace-pre-wrap mb-4 leading-relaxed">
            {post?.content}
          </p>

          {/* Timestamp */}
          <p className="text-xs text-muted-foreground pb-3 border-b border-border/50">
            {formatTime(post?.created_at)}
          </p>

          {/* Stats */}
          <div className="flex items-center gap-4 py-3 border-b border-border/50 text-sm">
            <span>
              <strong className="text-foreground">
                {post?.reply_count ?? 0}
              </strong>
              <span className="text-muted-foreground ml-1">Replies</span>
            </span>
            <span>
              <strong className="text-foreground">
                {post?.repost_count ?? 0}
              </strong>
              <span className="text-muted-foreground ml-1">Reposts</span>
            </span>
            <span>
              <strong className="text-foreground">{likeCount}</strong>
              <span className="text-muted-foreground ml-1">Likes</span>
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-around py-2 border-b border-border/50">
            <button className="p-2 rounded-full hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors">
              <MessageSquare className="w-5 h-5" />
            </button>
            <button className="p-2 rounded-full hover:bg-green-500/10 text-muted-foreground hover:text-green-400 transition-colors">
              <Repeat2 className="w-5 h-5" />
            </button>
            <button
              onClick={handleLike}
              className={`p-2 rounded-full hover:bg-red-500/10 transition-colors ${
                liked
                  ? "text-red-400"
                  : "text-muted-foreground hover:text-red-400"
              }`}
            >
              <Heart className={`w-5 h-5 ${liked ? "fill-red-400" : ""}`} />
            </button>
            <button
              onClick={handleBookmark}
              className={`p-2 rounded-full hover:bg-yellow-500/10 transition-colors ${
                bookmarked
                  ? "text-yellow-400"
                  : "text-muted-foreground hover:text-yellow-400"
              }`}
            >
              <Bookmark className={`w-5 h-5 ${bookmarked ? "fill-yellow-400" : ""}`} />
            </button>
          </div>

          {/* Reply composer */}
          {publicKey && (
            <div className="flex gap-3 pt-3">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                {publicKey.toString()[0].toUpperCase()}
              </div>
              <div className="flex-1">
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Post your reply"
                  className="w-full bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground resize-none min-h-[60px]"
                  rows={2}
                  maxLength={280}
                />
                <div className="flex items-center justify-end gap-2 pt-2">
                  <span className="text-xs text-muted-foreground">
                    {replyContent.length}/280
                  </span>
                  <button
                    onClick={handleReply}
                    disabled={!replyContent.trim() || replyLoading}
                    className="px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {replyLoading ? "Replying..." : "Reply"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Replies */}
        <div className="space-y-0">
          {replies.length === 0 ? (
            <div className="glass-card p-6 text-center text-sm text-muted-foreground rounded-t-none">
              No replies yet. Be the first to reply!
            </div>
          ) : (
            replies.map((reply: any) => (
              <div
                key={reply.id}
                className="glass-card p-4 rounded-none border-t-0 hover:bg-muted/5 transition-colors cursor-pointer"
                onClick={() => navigate(`/post/${reply.id}`)}
              >
                <div className="flex gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                    {(reply.handle ?? reply.wallet ?? "?")[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-foreground">
                        {reply.handle
                          ? `@${reply.handle}`
                          : `${reply.wallet?.slice(0, 4)}...${reply.wallet?.slice(-4)}`}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatRelativeTime(reply.created_at)}
                      </span>
                    </div>
                    <p className="text-sm text-foreground whitespace-pre-wrap">
                      {reply.content}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Heart className="w-3.5 h-3.5" />
                        {reply.like_count ?? 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3.5 h-3.5" />
                        {reply.reply_count ?? 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PostDetail;

