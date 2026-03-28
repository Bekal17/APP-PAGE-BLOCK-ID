import { useEffect, useRef, useState } from "react";
import ReactCrop, {
  type Crop,
  type PixelCrop,
  centerCrop,
  convertToPixelCrop,
  makeAspectCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { useNavigate } from "react-router-dom";
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
  AlertTriangle,
  Bookmark,
  X,
  Image as ImageIcon,
} from "lucide-react";
import WalletHoverCard from "@/components/WalletHoverCard";
import QuotaBanner from "@/components/blockid/QuotaBanner";
import SubscriptionBadge from "@/components/blockid/SubscriptionBadge";
import {
  getSocialFeed,
  getFollowingFeed,
  getSocialProfile,
  followWallet,
  endorseWallet,
  likePost,
  unlikePost,
  repostPost,
  reportPost,
  createPost,
  getSessionToken,
  bookmarkPost,
  getBookmarkIds,
  getFollowing,
  getPost,
} from "@/services/blockidApi";
import { useToast } from "@/hooks/use-toast";

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
  reposted_by_wallet?: string | null;
  reposted_by_handle?: string | null;
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

const Dashboard = () => {
  const { publicKey } = useWallet();
  const navigate = useNavigate();
  const { toast } = useToast();
  const address = publicKey?.toBase58() ?? publicKey?.toString();
  const [feed, setFeed] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"explore" | "following">("explore");
  const [profiles, setProfiles] = useState<Record<string, WalletProfile>>({});
  const [likeLoading, setLikeLoading] = useState<Record<number, boolean>>({});
  const [followLoading, setFollowLoading] = useState<Record<string, boolean>>({});
  const [menuOpenId, setMenuOpenId] = useState<number | null>(null);
  const [repostDropdownId, setRepostDropdownId] = useState<number | null>(null);
  const [quoteModalPost, setQuoteModalPost] = useState<any | null>(null);
  const [quoteModalText, setQuoteModalText] = useState("");
  const [quoteModalLoading, setQuoteModalLoading] = useState(false);
  const [reportModalId, setReportModalId] = useState<number | null>(null);
  const [reportReason, setReportReason] = useState("SPAM_SCAM");
  const [postContent, setPostContent] = useState("");
  const [postImage, setPostImage] = useState<File | null>(null);
  const [postImagePreview, setPostImagePreview] = useState<string | null>(null);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [rawImage, setRawImage] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>({
    unit: "%",
    width: 100,
    height: 100,
    x: 0,
    y: 0,
  });
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const [cropAspect, setCropAspect] = useState<number | undefined>(undefined);
  const imgRef = useRef<HTMLImageElement>(null);
  const cropAspectRef = useRef<number | undefined>(undefined);
  const postImageInputRef = useRef<HTMLInputElement>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<number>>(new Set());
  const [bookmarkLoading, setBookmarkLoading] = useState<Record<number, boolean>>({});
  const [followedWallets, setFollowedWallets] = useState<Set<string>>(new Set());
  const [likedPostIds, setLikedPostIds] = useState<Set<number>>(new Set());
  const [replyToId, setReplyToId] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [replyLoading, setReplyLoading] = useState(false);
  const [replies, setReplies] = useState<Record<number, any[]>>({});
  const [showReplies, setShowReplies] = useState<Record<number, boolean>>({});
  const [repostTargetId, setRepostTargetId] = useState<number | null>(null);
  const [repostedPostIds, setRepostedPostIds] = useState<Set<number>>(
    new Set()
  );

  useEffect(() => {
    if (repostDropdownId === null) return;
    const handleClick = () => setRepostDropdownId(null);
    setTimeout(() => {
      document.addEventListener("click", handleClick);
    }, 0);
    return () => document.removeEventListener("click", handleClick);
  }, [repostDropdownId]);

  useEffect(() => {
    if (menuOpenId === null) return;
    const handleClick = () => setMenuOpenId(null);
    setTimeout(() => {
      document.addEventListener("click", handleClick);
    }, 0);
    return () => document.removeEventListener("click", handleClick);
  }, [menuOpenId]);

  useEffect(() => {
    if (!publicKey) return;
    getBookmarkIds(publicKey.toString())
      .then((data) => {
        setBookmarkedIds(new Set(data.post_ids ?? []));
      })
      .catch(() => {});
    getFollowing(publicKey.toString())
      .then((data) => {
        const wallets = (data.following ?? data ?? [])
          .map((f: any) => f.wallet ?? f.following_wallet)
          .filter(Boolean);
        setFollowedWallets(new Set(wallets));
      })
      .catch(() => {});
  }, [publicKey]);

  useEffect(() => {
    const cachedFeed = sessionStorage.getItem("dashboard_feed_cache");
    const cachedTime = sessionStorage.getItem("dashboard_feed_time");
    const cacheAge = cachedTime ? Date.now() - parseInt(cachedTime) : Infinity;
    const isReturningFromPost = !!sessionStorage.getItem("dashboard_scroll");

    if (cachedFeed && cacheAge < 5 * 60 * 1000 && isReturningFromPost) {
      try {
        const cachedPosts = JSON.parse(cachedFeed);
        const arr = Array.isArray(cachedPosts) ? cachedPosts : [];
        setFeed(
          activeTab === "explore" ? [...arr].reverse() : arr
        );
        setLoading(false);
        const savedScroll = sessionStorage.getItem("dashboard_scroll");
        if (savedScroll) {
          sessionStorage.removeItem("dashboard_scroll");
          const y = parseInt(savedScroll, 10);
          setTimeout(() => {
            window.scrollTo({ top: y, behavior: "instant" });
          }, 50);
        }
        return;
      } catch {
        // cache parse failed, continue with normal fetch
      }
    }

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
            const exploreOrdered = [...posts].reverse();
            setFeed(exploreOrdered);
            sessionStorage.setItem(
              "dashboard_feed_cache",
              JSON.stringify(posts)
            );
            sessionStorage.setItem("dashboard_feed_time", Date.now().toString());
            const savedScroll = sessionStorage.getItem("dashboard_scroll");
            if (savedScroll) {
              sessionStorage.removeItem("dashboard_scroll");
              const y = parseInt(savedScroll, 10);
              setTimeout(() => {
                window.scrollTo({ top: y, behavior: "instant" });
              }, 100);
            }
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
            sessionStorage.setItem("dashboard_feed_cache", JSON.stringify(posts));
            sessionStorage.setItem("dashboard_feed_time", Date.now().toString());
            const savedScroll = sessionStorage.getItem("dashboard_scroll");
            if (savedScroll) {
              sessionStorage.removeItem("dashboard_scroll");
              const y = parseInt(savedScroll, 10);
              setTimeout(() => {
                window.scrollTo({ top: y, behavior: "instant" });
              }, 100);
            }
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

    const isLiked = likedPostIds.has(post.id);
    setLikeLoading((prev) => ({ ...prev, [post.id]: true }));

    try {
      if (isLiked) {
        // Unlike
        setLikedPostIds((prev) => {
          const next = new Set(prev);
          next.delete(post.id);
          return next;
        });
        setFeed((prev) =>
          prev.map((p) =>
            p.id === post.id
              ? {
                  ...p,
                  likes_count: Math.max(
                    (p.likes_count ?? p.like_count ?? 1) - 1,
                    0
                  ),
                  like_count: Math.max(
                    (p.likes_count ?? p.like_count ?? 1) - 1,
                    0
                  ),
                }
              : p
          )
        );
        await unlikePost(publicKey.toBase58(), post.id);
      } else {
        // Like
        setLikedPostIds((prev) => {
          const next = new Set(prev);
          next.add(post.id);
          return next;
        });
        setFeed((prev) =>
          prev.map((p) =>
            p.id === post.id
              ? {
                  ...p,
                  likes_count: (p.likes_count ?? p.like_count ?? 0) + 1,
                  like_count: (p.likes_count ?? p.like_count ?? 0) + 1,
                }
              : p
          )
        );
        await likePost(publicKey.toBase58(), post.id);
      }
    } catch (e) {
      console.error("Failed to toggle like", e);
      // Revert likedPostIds on error
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

  const handleFollow = async (wallet: string) => {
    if (!publicKey) return;
    setFollowLoading((prev) => ({ ...prev, [wallet]: true }));
    try {
      await followWallet(publicKey.toBase58(), wallet);
      setFollowedWallets((prev) => {
        const next = new Set(prev);
        next.add(wallet);
        return next;
      });
    } catch (e) {
      console.error("Failed to follow wallet", e);
    } finally {
      setFollowLoading((prev) => ({ ...prev, [wallet]: false }));
    }
  };

  const handleReply = async (postId: number) => {
    if (!publicKey || !replyContent.trim()) return;
    setReplyLoading(true);
    try {
      await createPost(publicKey.toString(), replyContent.trim(), "PUBLIC", postId);
      setReplyContent("");
      setReplyToId(null);

      const data = await getPost(postId);
      setReplies((prev) => ({
        ...prev,
        [postId]: data.replies ?? [],
      }));
      setShowReplies((prev) => ({ ...prev, [postId]: true }));

      setFeed((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                reply_count: (p.reply_count ?? 0) + 1,
                replies_count: (p.replies_count ?? 0) + 1,
              }
            : p
        )
      );
    } catch (e) {
      console.error("Failed to reply", e);
    }
    setReplyLoading(false);
  };

  const handleLoadReplies = async (postId: number) => {
    if (showReplies[postId]) {
      setShowReplies((prev) => ({ ...prev, [postId]: false }));
      return;
    }
    try {
      const data = await getPost(postId);
      setReplies((prev) => ({
        ...prev,
        [postId]: data.replies ?? [],
      }));
      setShowReplies((prev) => ({ ...prev, [postId]: true }));
    } catch (e) {
      console.error("Failed to load replies", e);
    }
  };

  const handleBookmark = async (post: SocialPost) => {
    if (!publicKey || !post.id) return;
    setBookmarkLoading((prev) => ({ ...prev, [post.id]: true }));
    try {
      const res = await bookmarkPost(publicKey.toString(), post.id);
      setBookmarkedIds((prev) => {
        const next = new Set(prev);
        if (res.bookmarked) {
          next.add(post.id);
        } else {
          next.delete(post.id);
        }
        return next;
      });
    } catch (e) {
      console.error(e);
    }
    setBookmarkLoading((prev) => ({ ...prev, [post.id]: false }));
  };

  const handleQuoteSubmit = async () => {
    if (!publicKey || !quoteModalPost || !quoteModalText.trim()) return;
    setQuoteModalLoading(true);
    try {
      const targetId =
        quoteModalPost.is_repost && quoteModalPost.repost_of
          ? quoteModalPost.repost_of
          : quoteModalPost.id;
      await repostPost(publicKey.toString(), targetId, quoteModalText.trim());
      setFeed((prev: any[]) =>
        prev.map((p) => {
          const match = (p as any).repost_of === targetId || p.id === targetId;
          return match
            ? { ...p, repost_count: (p.repost_count ?? 0) + 1 }
            : p;
        })
      );
      setRepostedPostIds((prev) => {
        const next = new Set(prev);
        next.add(targetId);
        return next;
      });
      toast({ title: "Quote posted!" });
      setQuoteModalPost(null);
      setQuoteModalText("");
    } catch (e) {
      console.error(e);
      toast({ title: "Failed to post quote", variant: "destructive" });
    } finally {
      setQuoteModalLoading(false);
    }
  };

  const revokeIfBlob = (url: string | null) => {
    if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
  };

  const handleCropImageLoaded = () => {
    const img = imgRef.current;
    if (!img) return;
    const w = img.width;
    const h = img.height;
    const aspect = cropAspectRef.current;
    if (aspect === undefined) {
      setCrop({ unit: "%", width: 100, height: 100, x: 0, y: 0 });
    } else {
      setCrop(
        centerCrop(makeAspectCrop({ unit: "%", width: 90 }, aspect, w, h), w, h)
      );
    }
  };

  const setAspectMode = (aspect: number | undefined) => {
    cropAspectRef.current = aspect;
    setCropAspect(aspect);
    const img = imgRef.current;
    if (!img?.width || !img?.height) return;
    const w = img.width;
    const h = img.height;
    if (aspect === undefined) {
      setCrop({ unit: "%", width: 100, height: 100, x: 0, y: 0 });
    } else {
      setCrop(centerCrop(makeAspectCrop({ unit: "%", width: 90 }, aspect, w, h), w, h));
    }
  };

  const getCroppedImage = (): Promise<File> => {
    return new Promise((resolve, reject) => {
      const image = imgRef.current;
      if (!image) {
        reject(new Error("No image"));
        return;
      }
      let pixelCrop: PixelCrop | null = completedCrop;
      if (
        !pixelCrop ||
        !pixelCrop.width ||
        !pixelCrop.height
      ) {
        pixelCrop = convertToPixelCrop(crop, image.width, image.height);
      }
      if (!pixelCrop.width || !pixelCrop.height) {
        reject(new Error("Invalid crop"));
        return;
      }
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(pixelCrop.width * scaleX);
      canvas.height = Math.round(pixelCrop.height * scaleY);
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("No canvas context"));
        return;
      }
      ctx.drawImage(
        image,
        pixelCrop.x * scaleX,
        pixelCrop.y * scaleY,
        pixelCrop.width * scaleX,
        pixelCrop.height * scaleY,
        0,
        0,
        canvas.width,
        canvas.height
      );
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Canvas is empty"));
            return;
          }
          const file = new File([blob], "cropped.jpg", { type: "image/jpeg" });
          resolve(file);
        },
        "image/jpeg",
        0.92
      );
    });
  };

  const handleCropApply = async () => {
    try {
      const file = await getCroppedImage();
      revokeIfBlob(postImagePreview);
      setPostImage(file);
      setPostImagePreview(URL.createObjectURL(file));
      revokeIfBlob(rawImage);
      setRawImage(null);
      setCompletedCrop(null);
      setCropModalOpen(false);
      cropAspectRef.current = undefined;
      setCropAspect(undefined);
      if (postImageInputRef.current) postImageInputRef.current.value = "";
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not crop image";
      toast({ title: message, variant: "destructive" });
    }
  };

  const handleCropCancel = () => {
    revokeIfBlob(rawImage);
    setRawImage(null);
    setCompletedCrop(null);
    setCropModalOpen(false);
    cropAspectRef.current = undefined;
    setCropAspect(undefined);
    if (postImageInputRef.current) postImageInputRef.current.value = "";
  };

  const handlePost = async () => {
    setIsPosting(true);
    if (!publicKey || !postContent.trim()) {
      setIsPosting(false);
      return;
    }
    try {
      if (postImage) {
        const formData = new FormData();
        formData.append("wallet", publicKey.toString());
        formData.append("content", postContent.trim());
        formData.append("post_type", "PUBLIC");
        formData.append("session_token", getSessionToken() ?? "");
        formData.append("image", postImage);

        const API_SOCIAL =
          import.meta.env.VITE_SOCIAL_API_URL ??
          "https://blockid-backend-production.up.railway.app";

        const res = await fetch(`${API_SOCIAL}/social/post/with-image`, {
          method: "POST",
          body: formData,
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.detail ?? "Failed to post");
        }
      } else {
        await createPost(publicKey.toString(), postContent.trim());
      }

      setPostContent("");
      setPostImage(null);
      setPostImagePreview(null);
      const data = await getSocialFeed();
      const posts: SocialPost[] = data.posts ?? data ?? [];
      setFeed(Array.isArray(posts) ? posts : []);
    } catch (e: unknown) {
      const err = e as Error;
      console.error("Failed to post", e);
      toast({
        title: err?.message ?? "Failed to post",
        variant: "destructive",
      });
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <QuotaBanner />
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

        {publicKey && (
          <div className="glass-card p-4 flex gap-3 animate-slide-up">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary shrink-0">
              {publicKey.toString()[0].toUpperCase()}
            </div>
            <div className="flex-1">
              <textarea
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                placeholder="What's happening on-chain?"
                className="w-full bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground resize-none min-h-[60px]"
                rows={2}
                maxLength={280}
              />
              {postImagePreview && (
                <div className="relative mt-2 rounded-xl overflow-hidden max-h-64 w-full">
                  <img
                    src={postImagePreview}
                    alt="Post image"
                    className="w-full object-cover rounded-xl max-h-64"
                  />
                  <button
                    onClick={() => {
                      revokeIfBlob(postImagePreview);
                      setPostImage(null);
                      setPostImagePreview(null);
                    }}
                    className="absolute top-2 right-2 p-1 rounded-full bg-black/60 hover:bg-black/80 text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              <div className="flex items-start gap-1.5 py-2 text-xs text-amber-500/70">
                <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
                <span>
                  Posting hate speech, harassment, or profanity may reduce your trust score. Keep it clean to
                  maintain your BlockID reputation.
                </span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-border/50">
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer p-1.5 rounded-full hover:bg-muted/30 text-muted-foreground hover:text-foreground transition-colors">
                    <ImageIcon className="w-4 h-4" />
                    <input
                      ref={postImageInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > 5 * 1024 * 1024) {
                          toast({
                            title: "Image too large",
                            description: "Max 5MB",
                            variant: "destructive",
                          });
                          e.target.value = "";
                          return;
                        }
                        cropAspectRef.current = undefined;
                        setCropAspect(undefined);
                        setCrop({
                          unit: "%",
                          width: 100,
                          height: 100,
                          x: 0,
                          y: 0,
                        });
                        setCompletedCrop(null);
                        setRawImage((prev) => {
                          revokeIfBlob(prev);
                          return URL.createObjectURL(file);
                        });
                        setCropModalOpen(true);
                      }}
                    />
                  </label>
                  <span className="text-xs text-muted-foreground">
                    {postContent.length}/280
                  </span>
                </div>
                <button
                  onClick={handlePost}
                  disabled={
                    isPosting || (!postContent.trim() && !postImage)
                  }
                  className="px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPosting ? (
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        style={{ animation: "spin 1s linear infinite" }}
                      >
                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                      </svg>
                      Posting...
                    </span>
                  ) : (
                    "Post"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {cropModalOpen && rawImage && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">
            <div className="bg-card border border-border rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col text-foreground">
              <div className="p-4 border-b border-border space-y-3">
                <h2 className="text-sm font-semibold">Crop image</h2>
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      { label: "Free", aspect: undefined as number | undefined },
                      { label: "1:1", aspect: 1 },
                      { label: "4:3", aspect: 4 / 3 },
                      { label: "16:9", aspect: 16 / 9 },
                    ] as const
                  ).map(({ label, aspect }) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setAspectMode(aspect)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        cropAspect === aspect
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted/40 text-muted-foreground hover:bg-muted/60"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="p-4 overflow-auto flex-1 flex justify-center items-start">
                <ReactCrop
                  crop={crop}
                  onChange={(_, percentCrop) => setCrop(percentCrop)}
                  onComplete={(pixelCrop) => setCompletedCrop(pixelCrop)}
                  aspect={cropAspect}
                >
                  <img
                    ref={imgRef}
                    src={rawImage}
                    alt="Crop preview"
                    onLoad={handleCropImageLoaded}
                    className="max-h-[60vh] max-w-full block"
                  />
                </ReactCrop>
              </div>
              <div className="p-4 border-t border-border flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCropCancel}
                  className="px-4 py-2 rounded-full text-sm font-medium bg-muted/40 text-foreground hover:bg-muted/60 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void handleCropApply()}
                  className="px-4 py-2 rounded-full text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Apply Crop
                </button>
              </div>
            </div>
          </div>
        )}

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
              const isConnected = !!publicKey;
              const originalPost = (post as any).original_post ?? null;
              const isRepost =
                originalPost != null ||
                (!!(post as any).is_repost &&
                  (post as any).is_repost !== false);

              const displayWallet =
                isRepost && originalPost ? originalPost.wallet : post.wallet ?? "";

              const displayHandle =
                isRepost && originalPost
                  ? originalPost.handle
                  : profile?.handle ?? post.handle ?? null;

              const isQuoteRepost =
                isRepost && !!(post as any)?.quote_content;

              const displayContent =
                isRepost && originalPost ? originalPost.content : post.content;

              const displayTrustScore =
                isRepost && originalPost ? originalPost.trust_score : trustScore;

              const trustColor = getTrustColor(displayTrustScore);
              const targetWalletForActions =
                isRepost && originalPost
                  ? originalPost.wallet
                  : post?.wallet ?? "";

              return (
                <div
                  key={post?.id}
                  style={{ overflow: "visible", position: "relative" }}
                >
                  {isRepost && (
                    <div className="flex items-center gap-1.5 px-1 pb-1 text-xs text-muted-foreground">
                      <Repeat2 className="w-3.5 h-3.5 text-green-400" />
                      <span>
                        {post?.handle
                          ? `@${post.handle}`
                          : truncateWallet(post?.wallet ?? "")}{" "}
                        reposted
                      </span>
                    </div>
                  )}
                  <div
                    className="glass-card p-4 flex flex-col gap-3 animate-slide-up cursor-pointer"
                    onClick={() => {
                      sessionStorage.setItem("dashboard_scroll", window.scrollY.toString());
                      navigate(
                        `/post/${
                          isRepost && (post as any)?.repost_of
                            ? (post as any).repost_of
                            : post?.id
                        }`
                      );
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                        {(
                          isRepost && originalPost
                            ? (originalPost.handle ??
                                originalPost.wallet ??
                                "?")
                            : (displayHandle ?? displayWallet ?? "?")
                        )[0]?.toUpperCase() ?? "?"}
                      </div>
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
                                    ? (originalPost as any)?.plan
                                    : (post as any)?.plan) ?? "free"
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
                        <p className="text-[11px] text-muted-foreground">
                          {truncateWallet(displayWallet)}
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
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuOpenId(
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
                              onClick={() => {
                                handleBookmark(post);
                                setMenuOpenId(null);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-100 hover:bg-zinc-800 transition-colors"
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

                            {publicKey &&
                              post?.wallet !== publicKey.toString() && (
                                <button
                                  onClick={() => {
                                    setReportModalId(post?.id ?? null);
                                    setMenuOpenId(null);
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

                  {/* Quote content if quote repost */}
                  {isQuoteRepost && (
                    <div className="mt-1 p-3 rounded-xl border border-border bg-muted/20">
                      <p className="text-xs text-muted-foreground mb-1">
                        Quote
                      </p>
                      <p className="text-sm text-foreground whitespace-pre-wrap">
                        {(post as any)?.quote_content}
                      </p>
                    </div>
                  )}

                  {isRepost && !originalPost ? (
                    <div className="h-4 bg-muted/30 rounded animate-pulse w-2/3" />
                  ) : (
                    <p className="text-sm text-foreground whitespace-pre-wrap">
                      {displayContent}
                    </p>
                  )}
                  {(() => {
                    const imgUrl =
                      isRepost && originalPost
                        ? (originalPost as any).image_url
                        : (post as any).image_url;
                    return imgUrl ? (
                      <div
                        style={{
                          width: "100%",
                          maxWidth: "100%",
                          overflow: "hidden",
                          marginTop: 8,
                          borderRadius: 12,
                          backgroundColor: "#000",
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
                            backgroundColor: "#000",
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/post/${post.id}`);
                          }}
                        />
                      </div>
                    ) : null;
                  })()}

                  <div className="flex items-center justify-between pt-1 text-xs text-muted-foreground">
                    <div className="flex items-center gap-4">
                      <button
                        className={`flex items-center gap-1 transition-colors disabled:opacity-60 ${
                          likedPostIds.has(post?.id)
                            ? "text-red-400 hover:text-red-300"
                            : "hover:text-red-400"
                        }`}
                        disabled={likeLoading[post?.id]}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLike(post);
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
                        <span>
                          {post?.likes_count ?? post?.like_count ?? 0}
                        </span>
                      </button>
                      <button
                        className="flex items-center gap-1 hover:text-primary transition-colors"
                        onClick={() => {
                          if (!post?.id || !publicKey) return;
                          setReplyToId(post.id);
                          setReplyContent("");
                        }}
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>
                          {post?.replies_count ?? post?.reply_count ?? 0}
                        </span>
                      </button>
                      <div className="relative">
                        <button
                          className={`flex items-center gap-1 
                            transition-colors text-sm ${
                              repostedPostIds.has(
                                (post as any)?.repost_of ?? post?.id ?? 0
                              )
                                ? "text-green-400 hover:text-green-300"
                                : "text-muted-foreground hover:text-green-400"
                            }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!publicKey) return;
                            const targetId =
                              isRepost && (post as any)?.repost_of
                                ? (post as any).repost_of
                                : post?.id ?? null;

                            setRepostDropdownId(
                              repostDropdownId === (post?.id ?? null)
                                ? null
                                : post?.id ?? null
                            );
                            setRepostTargetId(targetId);
                          }}
                        >
                          <Repeat2
                            className={`w-4 h-4 ${
                              repostedPostIds.has(
                                (post as any)?.repost_of ?? post?.id ?? 0
                              )
                                ? "fill-green-400/20"
                                : ""
                            }`}
                          />
                          {post?.repost_count ?? 0}
                        </button>

                        {repostDropdownId === post?.id && (
                          <div
                            className="absolute bottom-full left-0 mb-2 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl py-1 w-44 z-50"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {repostedPostIds.has(
                              repostTargetId ?? repostDropdownId ?? 0
                            ) && (
                              <button
                                onClick={() => {
                                  const tid =
                                    repostTargetId ?? repostDropdownId;
                                  if (tid == null) return;
                                  setRepostedPostIds((prev) => {
                                    const next = new Set(prev);
                                    next.delete(tid);
                                    return next;
                                  });
                                  setFeed((prev) =>
                                    prev.map((p) => {
                                      const match =
                                        (p as any).repost_of === tid ||
                                        p.id === tid;
                                      return match
                                        ? {
                                            ...p,
                                            repost_count: Math.max(
                                              (p.repost_count ?? 0) - 1,
                                              0
                                            ),
                                          }
                                        : p;
                                    })
                                  );
                                  setRepostDropdownId(null);
                                  setRepostTargetId(null);
                                }}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-green-400 hover:bg-zinc-800 transition-colors"
                              >
                                <Repeat2 className="w-4 h-4" />
                                Undo Repost
                              </button>
                            )}

                            <button
                              onClick={async () => {
                                if (!publicKey) return;
                                try {
                                  const idToRepost =
                                    repostTargetId ??
                                    repostDropdownId ??
                                    null;
                                  if (idToRepost == null) return;
                                  await repostPost(
                                    publicKey.toString(),
                                    idToRepost
                                  );
                                  setRepostedPostIds((prev) => {
                                    const next = new Set(prev);
                                    next.add(idToRepost);
                                    return next;
                                  });
                                  setFeed((prev) =>
                                    prev.map((p) => {
                                      const match =
                                        (p as any).repost_of === idToRepost ||
                                        p.id === idToRepost;
                                      return match
                                        ? {
                                            ...p,
                                            repost_count:
                                              (p.repost_count ?? 0) + 1,
                                          }
                                        : p;
                                    })
                                  );
                                  setRepostDropdownId(null);
                                  setRepostTargetId(null);
                                  const data =
                                    activeTab === "following" && publicKey
                                      ? await getFollowingFeed(
                                          publicKey.toString()
                                        )
                                      : await getSocialFeed();
                                  setFeed(data.posts ?? data ?? []);
                                } catch (e) {
                                  console.error(e);
                                }
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-zinc-100 hover:bg-zinc-800 transition-colors"
                            >
                              <Repeat2 className="w-4 h-4 text-green-400" />
                              Repost
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setQuoteModalPost(post);
                                setRepostDropdownId(null);
                                setQuoteModalText("");
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-zinc-100 hover:bg-zinc-800 transition-colors"
                            >
                              <MessageSquareQuote className="w-4 h-4 text-blue-400" />
                              Quote
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                  </div>

                </div>
              </div>
              );
            })
          )}
        </div>
      </div>

      {reportModalId !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => setReportModalId(null)}
        >
          <div
            className="bg-zinc-900 border border-zinc-700 rounded-xl p-6
              w-full max-w-sm mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-foreground">
                Report Post
              </h3>
              <button onClick={() => setReportModalId(null)}>
                <X className="w-5 h-5 text-muted-foreground hover:text-foreground" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground mb-4">
              Pilih alasan laporan. Laporan yang valid akan ditinjau oleh
              komunitas. Post dengan cukup laporan akan otomatis disembunyikan.
            </p>

            <div className="space-y-2 mb-5">
              {[
                { value: "SPAM_SCAM", label: "Spam / Scam" },
                { value: "HATE_SPEECH", label: "Hate Speech / Kata Kasar" },
                { value: "HARMFUL_CONTENT", label: "Konten Berbahaya" },
                { value: "MISINFORMATION", label: "Informasi Palsu / Hoax" },
              ].map((r) => (
                <button
                  key={r.value}
                  onClick={() => setReportReason(r.value)}
                  className={`w-full text-left px-4 py-2.5 rounded-lg text-sm
                    border transition-colors ${
                      reportReason === r.value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-zinc-700 text-foreground hover:bg-zinc-800"
                    }`}
                >
                  {r.label}
                </button>
              ))}
            </div>

            <button
              onClick={async () => {
                if (!publicKey) return;
                try {
                  await reportPost(
                    publicKey.toString(),
                    reportModalId,
                    reportReason
                  );
                  toast({ title: "Report submitted" });
                  setReportModalId(null);
                  setReportReason("SPAM_SCAM");
                } catch (e) {
                  console.error(e);
                  toast({
                    title: "Failed to submit report",
                    variant: "destructive",
                  });
                }
              }}
              disabled={!reportReason}
              className="w-full py-2.5 rounded-lg bg-red-500 hover:bg-red-600
                disabled:opacity-40 text-white text-sm font-medium transition-colors"
            >
              Submit Report
            </button>
          </div>
        </div>
      )}

      {replyToId !== null && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70"
          onClick={() => {
            setReplyToId(null);
            setReplyContent("");
          }}
        >
          <div
            className="bg-zinc-900 border border-zinc-700 rounded-t-2xl sm:rounded-2xl w-full max-w-lg mx-0 sm:mx-4 p-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Original post preview */}
            {(() => {
              const originalPost = feed.find((p) => p.id === replyToId);
              const originalProfile = originalPost
                ? profiles[originalPost.wallet]
                : null;
              return originalPost ? (
                <div className="mb-4 pb-4 border-b border-zinc-800">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                      {(originalProfile?.handle ?? originalPost.wallet ?? "?")[0].toUpperCase()}
                    </div>
                    <div className="flex items-center gap-1">
                      <p className="text-sm font-semibold text-zinc-100">
                        {originalProfile?.handle
                          ? `@${originalProfile.handle}`
                          : `${originalPost.wallet?.slice(0, 4)}...${originalPost.wallet?.slice(-4)}`}
                      </p>
                      <SubscriptionBadge plan={(originalPost as any)?.plan ?? "free"} size="sm" />
                    </div>
                  </div>
                  <p className="text-sm text-zinc-300 line-clamp-3 pl-10">
                    {originalPost.content}
                  </p>
                  <p className="text-xs text-zinc-500 pl-10 mt-1">
                    Replying to{" "}
                    <span className="text-primary">
                      @{originalProfile?.handle ?? originalPost.wallet?.slice(0, 8)}
                    </span>
                  </p>
                </div>
              ) : null;
            })()}

            {/* Reply composer */}
            <div className="flex gap-3">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                {publicKey?.toString()[0].toUpperCase() ?? "?"}
              </div>
              <div className="flex-1">
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                      e.preventDefault();
                      handleReply(replyToId!);
                    }
                  }}
                  placeholder="Post your reply"
                  className="w-full bg-transparent border-none outline-none text-sm text-zinc-100 placeholder:text-zinc-500 resize-none min-h-[80px]"
                  rows={3}
                  maxLength={280}
                  autoFocus
                />
                <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
                  <span className="text-xs text-zinc-500">
                    {replyContent.length}/280
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setReplyToId(null);
                        setReplyContent("");
                      }}
                      className="px-3 py-1.5 rounded-full text-sm text-zinc-400 hover:text-zinc-100 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleReply(replyToId!)}
                      disabled={!replyContent.trim() || replyLoading}
                      className="px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                      {replyLoading ? "Replying..." : "Reply"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {quoteModalPost && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center
            bg-black/70 pt-16 px-4"
          onClick={() => {
            setQuoteModalPost(null);
            setQuoteModalText("");
          }}
        >
          <div
            className="bg-zinc-900 border border-zinc-700 rounded-2xl
              w-full max-w-xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div
              className="flex items-center justify-between px-4 py-3
                border-b border-zinc-800"
            >
              <button
                onClick={() => {
                  setQuoteModalPost(null);
                  setQuoteModalText("");
                }}
                className="p-1 rounded-full hover:bg-zinc-800 transition-colors"
              >
                <X className="w-5 h-5 text-foreground" />
              </button>
              <span className="text-sm font-semibold text-foreground">
                Quote
              </span>
              <button
                onClick={handleQuoteSubmit}
                disabled={!quoteModalText.trim() || quoteModalLoading}
                className="px-4 py-1.5 rounded-full bg-white text-black
                  text-sm font-bold disabled:opacity-40
                  hover:bg-zinc-200 transition-colors"
              >
                {quoteModalLoading ? "Posting..." : "Post"}
              </button>
            </div>

            {/* Quote input area */}
            <div className="flex gap-3 px-4 pt-4 pb-2">
              <div
                className="w-9 h-9 rounded-full bg-primary/10 flex
                  items-center justify-center text-xs font-bold text-primary
                  shrink-0"
              >
                {(address ?? "?")[0]?.toUpperCase()}
              </div>
              <textarea
                autoFocus
                value={quoteModalText}
                onChange={(e) => setQuoteModalText(e.target.value)}
                placeholder="Add your thoughts..."
                maxLength={280}
                rows={3}
                className="flex-1 bg-transparent text-foreground text-sm
                  placeholder:text-muted-foreground resize-none
                  focus:outline-none leading-relaxed"
              />
            </div>

            {/* Character count */}
            <div className="flex justify-end px-4 pb-2">
              <span
                className={`text-xs ${
                  quoteModalText.length > 260
                    ? "text-red-400"
                    : "text-muted-foreground"
                }`}
              >
                {quoteModalText.length}/280
              </span>
            </div>

            {/* Original post preview */}
            <div
              className="mx-4 mb-4 border border-zinc-700 rounded-xl
                overflow-hidden"
            >
              <div className="p-3">
                {/* Original author */}
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-6 h-6 rounded-full bg-zinc-700 flex
                      items-center justify-center text-xs font-bold text-foreground"
                  >
                    {(
                      (quoteModalPost.is_repost && quoteModalPost.original_post
                        ? quoteModalPost.original_post.handle ??
                          quoteModalPost.original_post.wallet
                        : quoteModalPost.handle ?? quoteModalPost.wallet) ??
                      "?"
                    )[0]?.toUpperCase()}
                  </div>
                  <span className="text-sm font-semibold text-foreground flex items-center gap-1">
                    {quoteModalPost.is_repost && quoteModalPost.original_post
                      ? quoteModalPost.original_post.handle
                        ? `@${quoteModalPost.original_post.handle}`
                        : `${quoteModalPost.original_post.wallet?.slice(0, 4)}...${quoteModalPost.original_post.wallet?.slice(-4)}`
                      : quoteModalPost.handle
                        ? `@${quoteModalPost.handle}`
                        : `${quoteModalPost.wallet?.slice(0, 4)}...${quoteModalPost.wallet?.slice(-4)}`}
                    <SubscriptionBadge
                      plan={
                        (quoteModalPost.is_repost && quoteModalPost.original_post
                          ? (quoteModalPost.original_post as any)?.plan
                          : (quoteModalPost as any)?.plan) ?? "free"
                      }
                      size="sm"
                    />
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ·{" "}
                    {formatRelativeTime(
                      quoteModalPost.is_repost && quoteModalPost.original_post
                        ? quoteModalPost.original_post.created_at
                        : quoteModalPost.created_at
                    )}
                  </span>
                </div>

                {/* Original content */}
                <p className="text-sm text-foreground leading-relaxed">
                  {quoteModalPost.is_repost && quoteModalPost.original_post
                    ? quoteModalPost.original_post.content
                    : quoteModalPost.content}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Dashboard;
