import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useWallet } from "@solana/wallet-adapter-react";
import DashboardLayout from "@/components/DashboardLayout";
import PostCard, { type SocialPost, type WalletProfile } from "@/components/PostCard";
import {
  createPost,
  getCommunities,
  getCommunityFeed,
  getSocialProfile,
  getFollowing,
  getSessionToken,
  getBookmarkIds,
  bookmarkPost,
  getLikedIds,
  getRepostedIds,
  likePost,
  unlikePost,
  repostPost,
  unrepostPost,
} from "@/services/blockidApi";
import { useToast } from "@/hooks/use-toast";

const CommunityFeed = () => {
  const { collectionAddress } = useParams<{ collectionAddress: string }>();
  const { publicKey } = useWallet();
  const wallet = publicKey?.toString() ?? "";
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [postContent, setPostContent] = useState("");
  const [feed, setFeed] = useState<SocialPost[]>([]);
  const [communitiesMeta, setCommunitiesMeta] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, WalletProfile>>({});
  const [likedPostIds, setLikedPostIds] = useState<Set<number>>(new Set());
  const [repostedPostIds, setRepostedPostIds] = useState<Set<number>>(new Set());
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<number>>(new Set());
  const [followedWallets, setFollowedWallets] = useState<Set<string>>(new Set());
  const [likeLoading, setLikeLoading] = useState<Record<number, boolean>>({});
  const [bookmarkLoading, setBookmarkLoading] = useState<Record<number, boolean>>({});
  const [menuOpenId, setMenuOpenId] = useState<number | null>(null);
  const [repostDropdownId, setRepostDropdownId] = useState<number | null>(null);
  const [repostTargetId, setRepostTargetId] = useState<number | null>(null);

  const currentCommunity = useMemo(
    () =>
      communitiesMeta.find(
        (item) => item.collection_address === collectionAddress
      ) ?? null,
    [communitiesMeta, collectionAddress]
  );

  const loadFeed = async () => {
    if (!wallet || !collectionAddress) {
      setFeed([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [feedData, communitiesData] = await Promise.all([
        getCommunityFeed(collectionAddress, wallet, 30),
        getCommunities(wallet),
      ]);
      setFeed(feedData.posts ?? feedData.feed ?? feedData ?? []);
      setCommunitiesMeta(communitiesData.communities ?? []);
    } catch {
      setFeed([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadFeed();
  }, [wallet, collectionAddress]);

  useEffect(() => {
    if (!wallet) return;
    getLikedIds(wallet)
      .then((data) => setLikedPostIds(new Set(data.post_ids ?? [])))
      .catch(() => {});
    getRepostedIds(wallet)
      .then((data) => setRepostedPostIds(new Set(data.post_ids ?? [])))
      .catch(() => {});
    getBookmarkIds(wallet)
      .then((data) => setBookmarkedIds(new Set(data.post_ids ?? [])))
      .catch(() => {});
    getFollowing(wallet)
      .then((data) => {
        const wallets = (data.following ?? data ?? [])
          .map((f: any) => f.wallet ?? f.following_wallet)
          .filter(Boolean);
        setFollowedWallets(new Set(wallets));
      })
      .catch(() => {});
  }, [wallet]);

  useEffect(() => {
    const wallets = Array.from(new Set(feed.map((p) => p.wallet))).filter(
      (w) => !!w && !profiles[w]
    );
    if (wallets.length === 0) return;
    const loadProfiles = async () => {
      const next: Record<string, WalletProfile> = {};
      for (const w of wallets) {
        try {
          const profile = await getSocialProfile(w);
          next[w] = {
            wallet: w,
            handle: profile?.handle ?? null,
            trust_score: profile?.trust_score ?? null,
          };
        } catch {
          // ignore profile failure
        }
      }
      if (Object.keys(next).length) {
        setProfiles((prev) => ({ ...prev, ...next }));
      }
    };
    void loadProfiles();
  }, [feed, profiles]);

  const handlePost = async () => {
    if (!wallet || !postContent.trim() || !collectionAddress) return;
    setPosting(true);
    try {
      await createPost(wallet, postContent.trim(), "PUBLIC", undefined, {
        community_address: collectionAddress,
        also_share_to_everyone: true,
      });
      setPostContent("");
      await loadFeed();
    } catch {
      toast({ title: "Failed to create post", variant: "destructive" });
    } finally {
      setPosting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="glass-card p-4 border border-zinc-800">
          <div className="flex items-center gap-3">
            {currentCommunity?.collection_image ? (
              <img
                src={currentCommunity.collection_image}
                alt={currentCommunity.collection_name}
                className="w-12 h-12 rounded-lg object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-zinc-800 text-zinc-300 text-xs font-semibold flex items-center justify-center">
                {(currentCommunity?.collection_name ?? "CO").slice(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="text-lg font-semibold text-zinc-100">
                {currentCommunity?.collection_name ?? "Community Feed"}
              </h1>
              <p className="text-xs text-zinc-400">
                Collection: {collectionAddress}
              </p>
            </div>
          </div>
        </div>

        {wallet && (
          <div className="glass-card p-4 border border-zinc-800">
            <textarea
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              placeholder="Post to this community..."
              className="w-full bg-transparent border-none outline-none text-sm text-zinc-100 placeholder:text-zinc-500 resize-none min-h-[90px]"
              maxLength={280}
            />
            <div className="pt-3 border-t border-zinc-800 flex items-center justify-between">
              <span className="text-xs text-zinc-500">{postContent.length}/280</span>
              <button
                onClick={handlePost}
                disabled={posting || !postContent.trim()}
                className="px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 disabled:opacity-50"
              >
                {posting ? "Posting..." : "Post"}
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="glass-card p-4 text-sm text-zinc-400">Loading feed...</div>
        ) : feed.length === 0 ? (
          <div className="glass-card p-4 text-sm text-zinc-400">
            No posts in this community yet.
          </div>
        ) : (
          <div className="space-y-3">
            {feed.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                profile={profiles[post.wallet] ?? { wallet: post.wallet }}
                publicKey={publicKey}
                activeTab={"explore"}
                likedPostIds={likedPostIds}
                repostedPostIds={repostedPostIds}
                bookmarkedIds={bookmarkedIds}
                bookmarkLoading={bookmarkLoading}
                followedWallets={followedWallets}
                likeLoading={likeLoading}
                menuOpenId={menuOpenId}
                repostDropdownId={repostDropdownId}
                repostTargetId={repostTargetId}
                onPostClick={(p) => navigate(`/post/${p.id}`)}
                onLike={async (p) => {
                  if (!wallet || !p.id) return;
                  const isLiked = likedPostIds.has(p.id);
                  setLikeLoading((prev) => ({ ...prev, [p.id]: true }));
                  try {
                    if (isLiked) {
                      await unlikePost(wallet, p.id);
                      setLikedPostIds((prev) => {
                        const next = new Set(prev);
                        next.delete(p.id);
                        return next;
                      });
                    } else {
                      await likePost(wallet, p.id);
                      setLikedPostIds((prev) => {
                        const next = new Set(prev);
                        next.add(p.id);
                        return next;
                      });
                    }
                  } finally {
                    setLikeLoading((prev) => ({ ...prev, [p.id]: false }));
                  }
                }}
                onReply={(postId) => navigate(`/post/${postId}`)}
                onRepost={async (_postId, targetId) => {
                  if (!wallet) return;
                  await repostPost(wallet, targetId);
                  setRepostedPostIds((prev) => {
                    const next = new Set(prev);
                    next.add(targetId);
                    return next;
                  });
                }}
                onQuote={() => {}}
                onBookmark={async (p) => {
                  if (!wallet || !p.id) return;
                  setBookmarkLoading((prev) => ({ ...prev, [p.id]: true }));
                  try {
                    const res = await bookmarkPost(wallet, p.id);
                    setBookmarkedIds((prev) => {
                      const next = new Set(prev);
                      if (res.bookmarked) next.add(p.id);
                      else next.delete(p.id);
                      return next;
                    });
                  } finally {
                    setBookmarkLoading((prev) => ({ ...prev, [p.id]: false }));
                  }
                }}
                onReport={() => {}}
                onMenuOpen={setMenuOpenId}
                onRepostDropdown={(postId, targetId) => {
                  setRepostDropdownId(postId);
                  setRepostTargetId(targetId);
                }}
                onUndoRepost={(targetId) => {
                  if (!wallet) return;
                  void unrepostPost(wallet, targetId);
                  setRepostedPostIds((prev) => {
                    const next = new Set(prev);
                    next.delete(targetId);
                    return next;
                  });
                }}
                onTopReplyClick={(reply) => {
                  if (!reply?.id) return;
                  navigate(`/post/${reply.id}`);
                }}
                onTopReplyLike={() => {}}
                onTopReplyRepost={() => {}}
                onTopReplyComment={(_, replyId) => navigate(`/post/${replyId}`)}
              />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default CommunityFeed;
