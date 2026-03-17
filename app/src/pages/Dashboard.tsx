import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import DashboardLayout from "@/components/DashboardLayout";
import {
  MessageSquare,
  Heart,
  Users,
  Shield,
  Clock,
  Star,
  Search,
  MoreVertical,
  Repeat2,
  MessageSquareQuote,
  Flag,
} from "lucide-react";
import {
  getSocialFeed,
  getFollowingFeed,
  getSocialProfile,
  followWallet,
  endorseWallet,
  likePost,
  repostPost,
  reportPost,
} from "@/services/blockidApi";

type SocialPost = {
  id: number;
  wallet: string;
  handle?: string | null;
  trust_score?: number | null;
  content: string;
  created_at?: string;
  likes_count?: number;
  replies_count?: number;
  repost_count?: number;
};

type WalletProfile = {
  wallet: string;
  handle?: string | null;
  trust_score?: number | null;
};

const truncateWallet = (wallet: string) =>
  wallet.length > 8 ? `${wallet.slice(0, 4)}...${wallet.slice(-4)}` : wallet;

const getTrustColor = (score?: number | null) => {
  if (score == null) return "bg-muted text-muted-foreground";
  if (score >= 70) return "bg-emerald-500/10 text-emerald-400";
  if (score >= 40) return "bg-amber-500/10 text-amber-400";
  return "bg-rose-500/10 text-rose-400";
};

const formatRelativeTime = (iso?: string) => {
  if (!iso) return "";
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hr${diffHr > 1 ? "s" : ""} ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay} day${diffDay > 1 ? "s" : ""} ago`;
};

const Dashboard = () => {
  const { publicKey } = useWallet();
  const [feed, setFeed] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"explore" | "following">("explore");
  const [profiles, setProfiles] = useState<Record<string, WalletProfile>>({});
  const [likeLoading, setLikeLoading] = useState<Record<number, boolean>>({});
  const [followLoading, setFollowLoading] = useState<Record<string, boolean>>({});
  const [menuOpenId, setMenuOpenId] = useState<number | null>(null);
  const [repostModalId, setRepostModalId] = useState<number | null>(null);
  const [quoteText, setQuoteText] = useState("");
  const [reportModalId, setReportModalId] = useState<number | null>(null);
  const [reportReason, setReportReason] = useState("SPAM");

  useEffect(() => {
    setFeed([]);
    setLoading(true);

    let cancelled = false;

    const fetchFeed = async () => {
      try {
        if (activeTab === "explore") {
          const data = await getSocialFeed();
          const posts: SocialPost[] = data.posts ?? data ?? [];
          if (!Array.isArray(posts)) {
            if (!cancelled) setFeed([]);
            return;
          }
          if (!cancelled) {
            setFeed(posts);
          }
        } else if (activeTab === "following") {
          if (!publicKey) {
            if (!cancelled) setFeed([]);
            return;
          }
          const data = await getFollowingFeed(publicKey.toString());
          const posts: SocialPost[] = data.posts ?? data ?? [];
          if (!Array.isArray(posts)) {
            if (!cancelled) setFeed([]);
            return;
          }
          if (!cancelled) {
            setFeed(posts);
          }
        }
      } catch (err) {
        console.error("Feed fetch error:", err);
        if (!cancelled) setFeed([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchFeed();

    return () => {
      cancelled = true;
    };
  }, [activeTab, publicKey]);

  useEffect(() => {
    const wallets = Array.from(new Set(feed.map((p) => p.wallet))).filter(
      (w) => !!w && !profiles[w]
    );
    if (wallets.length === 0) return;

    const loadProfiles = async () => {
      const newProfiles: Record<string, WalletProfile> = {};
      for (const wallet of wallets) {
        try {
          const profile = await getSocialProfile(wallet) as { handle?: string | null; trust_score?: number | null };
          newProfiles[wallet] = {
            wallet,
            handle: profile?.handle ?? null,
            trust_score: profile?.trust_score ?? null,
          };
        } catch (e) {
          console.error("Failed to load profile for", wallet, e);
        }
      }
      if (Object.keys(newProfiles).length > 0) {
        setProfiles((prev) => ({ ...prev, ...newProfiles }));
      }
    };

    loadProfiles();
  }, [feed, profiles]);

  const handleLike = async (post: SocialPost) => {
    if (!publicKey) return;
    if (!post.id) return;
    setLikeLoading((prev) => ({ ...prev, [post.id]: true }));
    try {
      // optimistic UI update
      setFeed((prev) =>
        prev.map((p) =>
          p.id === post.id
            ? { ...p, likes_count: (p.likes_count ?? 0) + 1 }
            : p
        )
      );
      await likePost(publicKey.toBase58(), post.id);
    } catch (e) {
      console.error("Failed to like post", e);
      // revert on error
      setFeed((prev) =>
        prev.map((p) =>
          p.id === post.id
            ? { ...p, likes_count: Math.max((p.likes_count ?? 1) - 1, 0) }
            : p
        )
      );
    } finally {
      setLikeLoading((prev) => ({ ...prev, [post.id]: false }));
    }
  };

  const handleFollow = async (wallet: string) => {
    if (!publicKey) return;
    setFollowLoading((prev) => ({ ...prev, [wallet]: true }));
    try {
      await followWallet(publicKey.toBase58(), wallet);
    } catch (e) {
      console.error("Failed to follow wallet", e);
    } finally {
      setFollowLoading((prev) => ({ ...prev, [wallet]: false }));
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-slide-up">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              Social Layer
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Discover and connect with trusted wallets
            </p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              placeholder="Search wallets..."
              className="w-full pl-10 pr-4 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>

        <div className="glass-card p-2 flex items-center gap-2 text-xs sm:text-sm w-fit animate-slide-up">
          <Shield className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
          <span className="text-muted-foreground">
            Posts are trust-weighted by the BlockID social graph.
          </span>
        </div>

        <div
          className="flex gap-2 border-b border-border pb-1 animate-slide-up"
          style={{ animationDelay: "0.05s" }}
        >
          <button
            className={`px-3 py-1.5 text-xs sm:text-sm rounded-full flex items-center gap-1 ${
              activeTab === "explore"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted/20"
            }`}
            onClick={() => setActiveTab("explore")}
          >
            <Users className="w-3 h-3 sm:w-4 sm:h-4" />
            Explore
          </button>
          <button
            className={`px-3 py-1.5 text-xs sm:text-sm rounded-full flex items-center gap-1 ${
              activeTab === "following"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted/20"
            }`}
            onClick={() => setActiveTab("following")}
          >
            <Star className="w-3 h-3 sm:w-4 sm:h-4" />
            Following
          </button>
        </div>

        <div
          className="space-y-3 animate-slide-up"
          style={{ animationDelay: "0.1s" }}
        >
          {loading ? (
            <>
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="glass-card p-4 flex flex-col gap-3 animate-pulse"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-muted/70" />
                      <div className="space-y-1">
                        <div className="h-3 w-24 bg-muted/60 rounded" />
                        <div className="h-2.5 w-16 bg-muted/40 rounded" />
                      </div>
                    </div>
                    <div className="h-3 w-14 bg-muted/40 rounded-full" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 w-full bg-muted/50 rounded" />
                    <div className="h-3 w-2/3 bg-muted/40 rounded" />
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <div className="h-3 w-20 bg-muted/40 rounded" />
                    <div className="flex gap-3">
                      <div className="h-3 w-10 bg-muted/40 rounded" />
                      <div className="h-3 w-12 bg-muted/40 rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </>
          ) : feed.length === 0 ? (
            <div className="glass-card p-6 text-center text-sm text-muted-foreground">
              No posts yet. Be the first to post!
            </div>
          ) : (
            feed.map((post: any) => {
              const profile = (profiles[post.wallet] ?? {}) as WalletProfile;
              const trustScore =
                profile?.trust_score ?? post?.trust_score ?? undefined;
              const trustColor = getTrustColor(trustScore);
              const isConnected = !!publicKey;

              return (
                <div
                  key={post?.id}
                  className="glass-card p-4 flex flex-col gap-3 animate-slide-up"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                        {profile?.handle?.[0]?.toUpperCase() ??
                          post?.wallet?.[0]?.toUpperCase() ??
                          "?"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-foreground">
                            {profile?.handle
                              ? `@${profile.handle}`
                              : truncateWallet(post?.wallet ?? "")}
                          </p>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-medium flex items-center gap-1 ${trustColor}`}
                          >
                            <Shield className="w-3 h-3" />
                            {trustScore != null ? Math.round(trustScore) : "No score"}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          {truncateWallet(post?.wallet ?? "")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>{formatRelativeTime(post?.created_at)}</span>
                      </div>
                      <div className="relative">
                        <button
                          onClick={() =>
                            setMenuOpenId(
                              menuOpenId === post?.id ? null : (post?.id ?? 0)
                            )
                          }
                          className="p-1 rounded-md hover:bg-muted/30 text-muted-foreground"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {menuOpenId === post?.id && (
                          <div className="absolute right-0 top-6 z-50 w-44 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl py-1">
                            {publicKey && post?.wallet !== publicKey.toString() && (
                              <button
                                onClick={() => {
                                  setRepostModalId(post?.id ?? null);
                                  setMenuOpenId(null);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted/30 transition-colors"
                              >
                                <Repeat2 className="w-4 h-4 text-green-400" />
                                Repost
                              </button>
                            )}

                            {publicKey && post?.wallet !== publicKey.toString() && (
                              <button
                                onClick={async () => {
                                  try {
                                    await followWallet(
                                      publicKey.toString(),
                                      post?.wallet ?? ""
                                    );
                                    setMenuOpenId(null);
                                  } catch (e) {
                                    console.error(e);
                                  }
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted/30 transition-colors"
                              >
                                <Users className="w-4 h-4 text-blue-400" />
                                Follow @
                                {profile?.handle ??
                                  post?.handle ??
                                  post?.wallet?.slice(0, 8)}
                              </button>
                            )}

                            {publicKey && post?.wallet !== publicKey.toString() && (
                              <button
                                onClick={() => {
                                  setReportModalId(post?.id ?? null);
                                  setMenuOpenId(null);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-muted/30 transition-colors"
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

                  <p className="text-sm text-foreground whitespace-pre-wrap">
                    {post?.content}
                  </p>

                  <div className="flex items-center justify-between pt-1 text-xs text-muted-foreground">
                    <div className="flex items-center gap-4">
                      <button
                        className="flex items-center gap-1 hover:text-primary transition-colors disabled:opacity-60"
                        disabled={likeLoading[post?.id]}
                        onClick={() => handleLike(post)}
                      >
                        <Heart
                          className={`w-3.5 h-3.5 ${
                            likeLoading[post?.id] ? "animate-pulse" : ""
                          }`}
                        />
                        <span>{post?.likes_count ?? 0}</span>
                      </button>
                      <div className="flex items-center gap-1">
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>{post?.replies_count ?? 0}</span>
                      </div>
                      <button className="flex items-center gap-1 text-muted-foreground hover:text-green-400 transition-colors text-sm">
                        <Repeat2 className="w-4 h-4" />
                        {post?.repost_count ?? 0}
                      </button>
                    </div>

                    {isConnected && (
                      <div className="flex items-center gap-2">
                        <button
                          className="px-2.5 py-1 rounded-md bg-primary/10 text-primary text-[11px] font-semibold hover:bg-primary/20 transition-colors disabled:opacity-60"
                          onClick={() => handleFollow(post?.wallet ?? "")}
                          disabled={followLoading[post?.wallet]}
                        >
                          {followLoading[post?.wallet] ? "Following..." : "Follow"}
                        </button>
                        <button
                          className="px-2.5 py-1 rounded-md border border-border/60 text-[11px] text-muted-foreground hover:bg-muted/10 transition-colors"
                          onClick={() =>
                            endorseWallet(
                              publicKey!.toBase58(),
                              post?.wallet ?? "",
                              "Great on-chain reputation"
                            )
                          }
                        >
                          Endorse
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {repostModalId !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => {
            setRepostModalId(null);
            setQuoteText("");
          }}
        >
          <div
            className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-md mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-foreground mb-4">Repost</h3>

            <div className="flex gap-3 mb-4">
              <button
                onClick={async () => {
                  if (!publicKey) return;
                  try {
                    await repostPost(
                      publicKey.toString(),
                      repostModalId
                    );
                    setRepostModalId(null);
                    const data =
                      activeTab === "following" && publicKey
                        ? await getFollowingFeed(publicKey.toString())
                        : await getSocialFeed();
                    setFeed(data.posts ?? data ?? []);
                  } catch (e) {
                    console.error(e);
                  }
                }}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 font-medium transition-colors"
              >
                <Repeat2 className="w-4 h-4" />
                Repost
              </button>

              <button
                onClick={() => setQuoteText(" ")}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 font-medium transition-colors"
              >
                <MessageSquareQuote className="w-4 h-4" />
                Quote Repost
              </button>
            </div>

            {quoteText !== "" && (
              <div className="mb-4">
                <textarea
                  value={quoteText.trim() === "" ? "" : quoteText}
                  onChange={(e) => setQuoteText(e.target.value)}
                  placeholder="Add your thoughts..."
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                  rows={3}
                  autoFocus
                />
                <button
                  onClick={async () => {
                    if (!publicKey || !quoteText.trim()) return;
                    try {
                      await repostPost(
                        publicKey.toString(),
                        repostModalId,
                        quoteText.trim()
                      );
                      setRepostModalId(null);
                      setQuoteText("");
                      const data =
                        activeTab === "following" && publicKey
                          ? await getFollowingFeed(publicKey.toString())
                          : await getSocialFeed();
                      setFeed(data.posts ?? data ?? []);
                    } catch (e) {
                      console.error(e);
                    }
                  }}
                  className="mt-2 w-full py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
                >
                  Post Quote
                </button>
              </div>
            )}

            <button
              onClick={() => {
                setRepostModalId(null);
                setQuoteText("");
              }}
              className="w-full py-2 text-sm text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {reportModalId !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => setReportModalId(null)}
        >
          <div
            className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-sm mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-foreground mb-4">
              Report Post
            </h3>

            <select
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-sm text-foreground mb-4 focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="SPAM">Spam</option>
              <option value="HARASSMENT">Harassment</option>
              <option value="MISINFORMATION">Misinformation</option>
              <option value="SCAM">Scam</option>
              <option value="OTHER">Other</option>
            </select>

            <div className="flex gap-3">
              <button
                onClick={async () => {
                  if (!publicKey) return;
                  try {
                    await reportPost(
                      publicKey.toString(),
                      reportModalId,
                      reportReason
                    );
                    setReportModalId(null);
                  } catch (e) {
                    console.error(e);
                  }
                }}
                className="flex-1 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 font-medium transition-colors"
              >
                Submit Report
              </button>
              <button
                onClick={() => setReportModalId(null)}
                className="flex-1 py-2 rounded-lg bg-zinc-800 text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Dashboard;
