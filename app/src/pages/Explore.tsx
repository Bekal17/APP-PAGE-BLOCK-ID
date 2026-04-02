import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Search,
  Clock,
  Heart,
  MessageSquare,
  Repeat2,
} from "lucide-react";
import { getSocialFeed, getSocialProfile } from "@/services/blockidApi";
import { useWallet } from "@solana/wallet-adapter-react";
import WalletHoverCard from "@/components/WalletHoverCard";
import { useSubscription } from "@/hooks/useSubscription";
import SubscriptionBadge from "@/components/blockid/SubscriptionBadge";

const Explore = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { publicKey } = useWallet();
  const sub = useSubscription();
  const [feed, setFeed] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchResult, setSearchResult] = useState<any>(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const fetchFeed = async () => {
      try {
        const data = await getSocialFeed();
        setFeed(data.posts ?? data ?? []);
      } catch {
        setFeed([]);
      } finally {
        setLoading(false);
      }
    };
    fetchFeed();
  }, []);

  const handleSearch = async () => {
    if (!search.trim()) return;
    if (sub.isAtLimit) return;
    setSearching(true);
    setSearchResult(null);
    try {
      const query = search.trim();
      const data = await getSocialProfile(query);
      if (data?.notFound) {
        setSearchResult({ notFound: true });
      } else if (Array.isArray(data)) {
        const unique = Array.from(
          new Map(data.map((r: any, i: number) => [r.wallet ?? r.handle ?? `key-${i}`, r])).values()
        );
        setSearchResult(unique.length === 1 ? unique[0] : { results: unique });
      } else if (data?.profiles && Array.isArray(data.profiles)) {
        const unique = Array.from(
          new Map(
            data.profiles.map((r: any, i: number) => [r.wallet ?? r.handle ?? `key-${i}`, r])
          ).values()
        );
        setSearchResult(unique.length === 1 ? unique[0] : { results: unique });
      } else if (data && (data.wallet || data.handle)) {
        setSearchResult(data);
      } else {
        setSearchResult({ notFound: true });
      }
    } catch {
      setSearchResult({ notFound: true });
    }
    setSearching(false);
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto w-full space-y-6">
        {/* Header */}
        <div className="animate-slide-up">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            {t("explore.title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Search wallets, handles, and discover trusted users
          </p>
        </div>

        {/* Search Bar — prominent */}
        <div
          className="relative animate-slide-up"
          style={{ animationDelay: "0.05s" }}
        >
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !sub.isAtLimit && handleSearch()}
            placeholder={t("explore.search_placeholder")}
            className="w-full pl-12 pr-32 py-3.5 bg-zinc-900 border border-zinc-700 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
          />
          <button
            onClick={handleSearch}
            disabled={searching || sub.isAtLimit}
            title={sub.isAtLimit ? "Upgrade to scan more wallets this month" : undefined}
            className={`absolute right-3 top-1/2 -translate-y-1/2 px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              sub.isAtLimit
                ? "opacity-50 cursor-not-allowed bg-zinc-600 text-zinc-300"
                : "bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
            }`}
          >
            {searching ? "Searching..." : sub.isAtLimit ? "Limit Reached" : "Search"}
          </button>
        </div>

        {/* Search Result */}
        {searchResult && !searchResult.notFound && (() => {
          const results = searchResult.results ?? [searchResult];
          return (
            <div className="space-y-2 w-full animate-slide-up">
              {results.map((result: any) => (
                <div
                  key={result.wallet ?? result.handle ?? result}
                  className="glass-card w-full p-4 cursor-pointer hover:bg-white/5 transition-colors"
                  onClick={() => result.wallet && navigate(`/profile/${result.wallet}`)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-zinc-700 flex items-center justify-center text-lg font-bold text-foreground">
                      {(result.handle ?? result.wallet ?? "?")[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-foreground flex items-center gap-1">
                        {result.handle
                          ? `@${result.handle}`
                          : `${result.wallet?.slice(0, 8)}...${result.wallet?.slice(-8)}`}
                        <SubscriptionBadge plan={result.plan ?? "free"} size="sm" />
                      </p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {result.wallet?.slice(0, 8)}...
                        {result.wallet?.slice(-8)}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                            (result.trust_score ?? 0) >= 70
                              ? "bg-green-500/20 text-green-400"
                              : (result.trust_score ?? 0) >= 40
                                ? "bg-orange-500/20 text-orange-400"
                                : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          ⬡ {Math.round(result.trust_score ?? 0)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {result.follower_count ?? 0} Followers
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          );
        })()}

        {searchResult?.notFound && (
          <div className="glass-card w-full p-4 text-center text-muted-foreground text-sm animate-slide-up">
            No wallet or handle found for &quot;{search}&quot;
          </div>
        )}

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-zinc-800" />
          <span className="text-xs text-muted-foreground">Latest Posts</span>
          <div className="flex-1 h-px bg-zinc-800" />
        </div>

        {/* Feed */}
        {loading ? (
          <div className="space-y-3 w-full">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-card w-full p-4 animate-pulse overflow-hidden">
                <div className="flex gap-3">
                  <div className="w-9 h-9 rounded-full bg-zinc-700" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-zinc-700 rounded w-1/3" />
                    <div className="h-3 bg-zinc-700 rounded w-full" />
                    <div className="h-3 bg-zinc-700 rounded w-2/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : feed.length === 0 ? (
          <div className="glass-card w-full p-8 text-center text-muted-foreground text-sm">
            No posts yet. Be the first to post!
          </div>
        ) : (
          <div className="space-y-3 w-full">
            {feed.map((post: any) => {
              const score = Math.round(post.trust_score ?? 0);
              const scoreColor =
                score >= 70
                  ? "bg-green-500/20 text-green-400"
                  : score >= 40
                    ? "bg-orange-500/20 text-orange-400"
                    : "bg-red-500/20 text-red-400";
              return (
                <div
                  key={post.id}
                  className="glass-card w-full overflow-hidden p-4 animate-slide-up"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-full bg-zinc-700 flex items-center justify-center text-sm font-bold text-foreground flex-shrink-0">
                        {(post.handle ?? post.wallet ?? "?")[0]?.toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <WalletHoverCard
                            wallet={post.wallet ?? ""}
                            handle={post.handle ?? undefined}
                          >
                            <span className="text-sm font-semibold text-foreground inline-flex items-center gap-1">
                              {post.handle
                                ? `@${post.handle}`
                                : `${post.wallet?.slice(0, 4)}...${post.wallet?.slice(-4)}`}
                              <SubscriptionBadge plan={(post as any).plan ?? "free"} size="sm" />
                            </span>
                          </WalletHoverCard>
                          <span
                            className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${scoreColor}`}
                          >
                            ⬡ {score}
                          </span>
                        </div>
                        <p className="text-sm text-foreground mt-1 break-words">
                          {post.content}
                        </p>
                        {(post.image_url || post.original_post?.image_url) && (
                          <div className="mt-2 rounded-xl overflow-hidden">
                            <img
                              src={post.image_url ?? post.original_post?.image_url}
                              alt="Post image"
                              className="w-full max-h-72 object-cover rounded-xl"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          </div>
                        )}
                        <div className="flex items-center gap-4 mt-2">
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Heart className="w-3.5 h-3.5" />
                            {post.likes_count ?? post.like_count ?? 0}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MessageSquare className="w-3.5 h-3.5" />
                            {post.replies_count ?? post.reply_count ?? 0}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Repeat2 className="w-3.5 h-3.5" />
                            {post.repost_count ?? 0}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
                            <Clock className="w-3 h-3" />
                            {timeAgo(post.created_at ?? "")}
                          </span>
                        </div>
                      </div>
                    </div>
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

export default Explore;
