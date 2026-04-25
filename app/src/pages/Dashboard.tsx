import { useEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import ReactCrop, {
  type Crop,
  type PixelCrop,
  centerCrop,
  convertToPixelCrop,
  makeAspectCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { useWallet } from "@solana/wallet-adapter-react";
import DashboardLayout from "@/components/DashboardLayout";
import PostDetailPanel from "@/components/PostDetailPanel";
import PostCard from "@/components/PostCard";
import UserAvatar from "@/components/UserAvatar";
import {
  Users,
  Clock,
  Star,
  AlertTriangle,
  X,
  Image as ImageIcon,
} from "lucide-react";
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
  unrepostPost,
  reportPost,
  createPost,
  getSessionToken,
  bookmarkPost,
  getBookmarkIds,
  getLikedIds,
  getRepostedIds,
  getFollowing,
  getPost,
  getWalletNFTs,
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

type WalletProfile = {
  wallet: string;
  handle?: string | null;
  trust_score?: number | null;
  avatar_url?: string | null;
  avatar_type?: string | null;
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

const sortPostsByCreatedAtDesc = (posts: SocialPost[]) =>
  [...posts].sort(
    (a, b) =>
      new Date(b.created_at ?? 0).getTime() -
      new Date(a.created_at ?? 0).getTime()
  );

const Dashboard = () => {
  const { t } = useTranslation();
  const { publicKey } = useWallet();
  const { toast } = useToast();
  const address = publicKey?.toBase58() ?? publicKey?.toString();
  const [feed, setFeed] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "explore" | "following" | "newest"
  >("explore");
  const [profiles, setProfiles] = useState<Record<string, WalletProfile>>({});
  const [composeProfile, setComposeProfile] = useState<{
    avatar_url?: string | null;
    avatar_type?: string | null;
  } | null>(null);
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
  const [postImageDropdownOpen, setPostImageDropdownOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const [postNFTModalOpen, setPostNFTModalOpen] = useState(false);
  const [postNFTs, setPostNFTs] = useState<any[]>([]);
  const [postNFTsLoading, setPostNFTsLoading] = useState(false);
  const [postIsNFT, setPostIsNFT] = useState(false);
  const [postNFTUrl, setPostNFTUrl] = useState<string | null>(null);
  const [socialLimits, setSocialLimits] = useState<{
    risk_level: string;
    score: number;
    plan: string;
    limits: {
      post: { used: number; limit: number; remaining: number };
      reply: { used: number; limit: number; remaining: number };
      repost: { used: number; limit: number; remaining: number };
    };
  } | null>(null);
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
  const composeTextareaRef = useRef<HTMLTextAreaElement>(null);
  const postImageBtnRef = useRef<HTMLButtonElement>(null);
  const postImageMenuRef = useRef<HTMLDivElement>(null);
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
  const [selectedPost, setSelectedPost] = useState<SocialPost | null>(null);
  const selectedPostIdRef = useRef<number | null>(null);
  selectedPostIdRef.current = selectedPost?.id ?? null;

  useEffect(() => {
    document.body.style.overflow = selectedPost ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedPost]);

  useEffect(() => {
    if (!selectedPost?.id) return;
    getPost(selectedPost.id)
      .then((data) => {
        setReplies((prev) => ({
          ...prev,
          [selectedPost.id]: data.replies ?? [],
        }));
      })
      .catch(() => {});
  }, [selectedPost?.id]);

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
    if (!postImageDropdownOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (
        postImageMenuRef.current &&
        !postImageMenuRef.current.contains(event.target as Node) &&
        !postImageBtnRef.current?.contains(event.target as Node)
      ) {
        setPostImageDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [postImageDropdownOpen]);

  useEffect(() => {
    const el = composeTextareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [postContent]);

  useEffect(() => {
    if (!publicKey) return;
    getBookmarkIds(publicKey.toString())
      .then((data) => {
        setBookmarkedIds(new Set(data.post_ids ?? []));
      })
      .catch(() => {});
    getLikedIds(publicKey.toString())
      .then((data) => {
        setLikedPostIds(new Set(data.post_ids ?? []));
      })
      .catch(() => {});
    getRepostedIds(publicKey.toString())
      .then((data) => {
        setRepostedPostIds(new Set(data.post_ids ?? []));
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
    if (!address) {
      setComposeProfile(null);
      return;
    }
    getSocialProfile(address)
      .then((profile) => {
        setComposeProfile({
          avatar_url: profile?.avatar_url ?? null,
          avatar_type: profile?.avatar_type ?? null,
        });
      })
      .catch(() => setComposeProfile(null));
  }, [address]);

  useEffect(() => {
    if (!address) return;
    const API =
      import.meta.env.VITE_SOCIAL_API_URL ??
      "https://blockid-backend-production.up.railway.app";
    fetch(`${API}/social/limits/${address}`)
      .then((r) => r.json())
      .then((data) => setSocialLimits(data))
      .catch(() => {});
  }, [address]);

  useEffect(() => {
    const cachedFeed = sessionStorage.getItem("dashboard_feed_cache");
    const cachedTime = sessionStorage.getItem("dashboard_feed_time");
    const cacheAge = cachedTime ? Date.now() - parseInt(cachedTime) : Infinity;
    const isReturningFromPost = !!sessionStorage.getItem("dashboard_scroll");

    if (cachedFeed && cacheAge < 5 * 60 * 1000 && isReturningFromPost) {
      try {
        const cachedPosts = JSON.parse(cachedFeed);
        const arr = Array.isArray(cachedPosts) ? cachedPosts : [];
        if (activeTab === "explore") {
          setFeed([...arr].reverse());
        } else if (activeTab === "newest") {
          setFeed(sortPostsByCreatedAtDesc(arr));
        } else {
          setFeed(arr);
        }
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
        } else if (activeTab === "newest") {
          const data = await getSocialFeed();
          const posts: SocialPost[] = data.posts ?? data ?? [];
          if (!Array.isArray(posts)) {
            if (!cancelled) setFeed([]);
            return;
          }
          if (!cancelled) {
            const sorted = sortPostsByCreatedAtDesc(posts);
            setFeed(sorted);
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

      const data = await getPost(postId);
      setReplies((prev) => ({
        ...prev,
        [postId]: data.replies ?? [],
      }));
      setShowReplies((prev) => ({ ...prev, [postId]: true }));

      const rootId = selectedPostIdRef.current;
      if (rootId != null && rootId !== postId) {
        try {
          const rootData = await getPost(rootId);
          setReplies((prev) => ({
            ...prev,
            [rootId]: rootData.replies ?? [],
          }));
        } catch {
          /* ignore */
        }
      }

      if (rootId != null) {
        setReplyToId(rootId);
        if (rootId === postId) {
          setSelectedPost((prev) =>
            prev && prev.id === postId
              ? {
                  ...prev,
                  reply_count: (prev.reply_count ?? 0) + 1,
                  replies_count: (prev.replies_count ?? 0) + 1,
                }
              : prev
          );
        } else {
          setSelectedPost((prev) =>
            prev && prev.id === rootId
              ? {
                  ...prev,
                  reply_count: (prev.reply_count ?? 0) + 1,
                  replies_count: (prev.replies_count ?? 0) + 1,
                }
              : prev
          );
        }
      } else {
        setReplyToId(null);
      }

      const feedPostId = rootId ?? postId;
      setFeed((prev) =>
        prev.map((p) =>
          p.id === feedPostId
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
      setPostIsNFT(false);
      setPostNFTUrl(null);
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

  const handleLimitError = (detail: any): boolean => {
    if (detail?.error === "trust_score_too_low") {
      toast({
        title: "Trust score too low",
        description: "Improve your on-chain activity to unlock posting.",
        variant: "destructive",
      });
      return true;
    }
    if (detail?.error === "daily_limit_reached") {
      toast({
        title: `Daily limit reached (${detail.used}/${detail.limit})`,
        description: "Improve your trust score to post more. Resets in 24 hours.",
        variant: "destructive",
      });
      return true;
    }
    return false;
  };

  const handlePost = async () => {
    setIsPosting(true);
    if (!publicKey || !postContent.trim()) {
      setIsPosting(false);
      return;
    }
    try {
      const API_SOCIAL =
        import.meta.env.VITE_SOCIAL_API_URL ??
        "https://blockid-backend-production.up.railway.app";

      if (postIsNFT && postNFTUrl) {
        const res = await fetch(`${API_SOCIAL}/social/post`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            wallet: publicKey.toString(),
            content: postContent.trim(),
            post_type: "PUBLIC",
            signed_message: "BlockID Post",
            signature: "devtest_signature_bypass",
            session_token: getSessionToken() ?? "",
            image_url: postNFTUrl,
            media_type: "NFT",
          }),
        });
        if (!res.ok) {
          const detail = await res.json().catch(() => ({}));
          if (handleLimitError(detail?.detail ?? detail)) return;
          throw new Error(
            (detail?.detail?.message ?? detail?.detail) ?? "Failed to post"
          );
        }
      } else if (postImage) {
        const formData = new FormData();
        formData.append("wallet", publicKey.toString());
        formData.append("content", postContent.trim());
        formData.append("post_type", "PUBLIC");
        formData.append("session_token", getSessionToken() ?? "");
        formData.append("image", postImage);

        const res = await fetch(`${API_SOCIAL}/social/post/with-image`, {
          method: "POST",
          body: formData,
        });
        if (!res.ok) {
          const detail = await res.json().catch(() => ({}));
          if (handleLimitError(detail?.detail ?? detail)) return;
          throw new Error(
            (detail?.detail?.message ?? detail?.detail) ?? "Failed to post"
          );
        }
      } else {
        await createPost(publicKey.toString(), postContent.trim());
      }

      setPostContent("");
      setPostImage(null);
      setPostImagePreview(null);
      setPostIsNFT(false);
      setPostNFTUrl(null);
      setPostNFTs([]);
      setPostNFTModalOpen(false);
      setPostImageDropdownOpen(false);
      fetch(`${API_SOCIAL}/social/limits/${publicKey.toString()}`)
        .then((r) => r.json())
        .then((data) => setSocialLimits(data))
        .catch(() => {});
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
        <h1 className="sr-only">{t("dashboard.title")}</h1>
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
            {t("dashboard.tab_explore")}
          </button>
          <button
            className={`px-3 py-1.5 text-xs sm:text-sm rounded-full flex items-center gap-1 ${
              activeTab === "newest"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted/20"
            }`}
            onClick={() => setActiveTab("newest")}
          >
            <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
            {t("dashboard.tab_newest")}
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
            {t("dashboard.tab_following")}
          </button>
        </div>

        {publicKey && (
          <div className="glass-card p-4 flex gap-3 animate-slide-up">
            {composeProfile?.avatar_url ? (
              <img
                src={composeProfile.avatar_url}
                alt="Your avatar"
                className={composeProfile.avatar_type === "NFT" ? "" : "rounded-full"}
                style={
                  composeProfile.avatar_type === "NFT"
                    ? {
                        width: 36,
                        height: 36,
                        objectFit: "cover",
                        border: "2px solid gold",
                        borderRadius: "8px",
                      }
                    : {
                        width: 36,
                        height: 36,
                        objectFit: "cover",
                      }
                }
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                {(address ?? "?")[0]?.toUpperCase() ?? "?"}
              </div>
            )}
            <div className="flex-1">
              <textarea
                ref={composeTextareaRef}
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                placeholder={t("dashboard.post_placeholder")}
                className="w-full bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground"
                style={{
                  minHeight: "60px",
                  height: "auto",
                  overflow: "hidden",
                  resize: "none",
                }}
                maxLength={280}
              />
              {postImagePreview && (
                <div className="relative mt-2 rounded-xl overflow-hidden max-h-64 w-full">
                  <img
                    src={postImagePreview}
                    alt="Post image"
                    className="w-full object-cover rounded-xl max-h-64"
                    style={
                      postIsNFT
                        ? {
                            border: "2px solid gold",
                            boxShadow: "0 0 8px rgba(255,215,0,0.4)",
                          }
                        : undefined
                    }
                  />
                  <button
                    onClick={() => {
                      revokeIfBlob(postImagePreview);
                      setPostImage(null);
                      setPostImagePreview(null);
                      setPostIsNFT(false);
                      setPostNFTUrl(null);
                      setPostNFTs([]);
                      setPostNFTModalOpen(false);
                    }}
                    className="absolute top-2 right-2 p-1 rounded-full bg-black/60 hover:bg-black/80 text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              <div className="flex items-start gap-1.5 py-2 text-xs text-amber-500/70">
                <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
                <span>{t("dashboard.content_warning")}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-border/50">
                <div className="flex items-center gap-2 relative overflow-visible">
                  <div className="relative">
                    <button
                      ref={postImageBtnRef}
                      type="button"
                      onClick={() => {
                        const rect = postImageBtnRef.current?.getBoundingClientRect();
                        if (rect) {
                          setDropdownPos({
                            top: rect.bottom + window.scrollY + 4,
                            left: rect.left + window.scrollX,
                          });
                        }
                        setPostImageDropdownOpen((prev) => !prev);
                      }}
                      className="p-1.5 rounded-full hover:bg-muted/30 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ImageIcon className="w-4 h-4" />
                    </button>
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
                        setPostImageDropdownOpen(false);
                        setPostIsNFT(false);
                        setPostNFTUrl(null);
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
                  </div>
                  {socialLimits && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {socialLimits.limits.post.limit === -1 ? (
                        <span className="text-green-400">∞ unlimited</span>
                      ) : (
                        <span
                          className={
                            socialLimits.limits.post.remaining === 0
                              ? "text-red-400"
                              : socialLimits.limits.post.remaining <= 2
                                ? "text-amber-400"
                                : "text-muted-foreground"
                          }
                        >
                          {socialLimits.limits.post.remaining}/
                          {socialLimits.limits.post.limit} posts left
                        </span>
                      )}
                    </div>
                  )}
                  <span className="text-xs text-muted-foreground">{postContent.length}/280</span>
                </div>
                <button
                  onClick={handlePost}
                  disabled={
                    isPosting ||
                    (!postContent.trim() && !postImage && !postNFTUrl) ||
                    (socialLimits !== null &&
                      socialLimits.limits.post.remaining === 0 &&
                      socialLimits.limits.post.limit !== -1)
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
                      {t("common.loading")}
                    </span>
                  ) : (
                    t("dashboard.post_button")
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {postImageDropdownOpen &&
          createPortal(
            <div
              style={{
                position: "absolute",
                top: dropdownPos.top,
                left: dropdownPos.left,
                zIndex: 9999,
                width: "160px",
              }}
              ref={postImageMenuRef}
              className="bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl py-1"
            >
              <button
                type="button"
                className="w-full text-left px-3 py-2 text-sm text-zinc-100 hover:bg-zinc-800 transition-colors"
                onClick={() => {
                  setPostImageDropdownOpen(false);
                  postImageInputRef.current?.click();
                }}
              >
                Choose Photo
              </button>
              <button
                type="button"
                className="w-full text-left px-3 py-2 text-sm text-zinc-100 hover:bg-zinc-800 transition-colors"
                onClick={async () => {
                  if (!address) return;
                  setPostImageDropdownOpen(false);
                  setPostNFTsLoading(true);
                  setPostNFTModalOpen(true);
                  try {
                    const data = await getWalletNFTs(address);
                    const nftsList = data?.nfts ?? data?.items ?? data ?? [];
                    setPostNFTs(Array.isArray(nftsList) ? nftsList : []);
                  } catch {
                    setPostNFTs([]);
                    toast({
                      title: "Failed to load NFTs",
                      variant: "destructive",
                    });
                  } finally {
                    setPostNFTsLoading(false);
                  }
                }}
              >
                Choose NFT
              </button>
            </div>,
            document.body
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
                  {t("common.cancel")}
                </button>
                <button
                  type="button"
                  onClick={() => void handleCropApply()}
                  className="px-4 py-2 rounded-full text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  {t("common.apply")}
                </button>
              </div>
            </div>
          </div>
        )}

        {postNFTModalOpen && (
          <div
            className="fixed inset-0 z-[101] flex items-center justify-center bg-black/70"
            onClick={() => {
              setPostNFTModalOpen(false);
              setPostNFTs([]);
            }}
          >
            <div
              className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-foreground">
                  Choose NFT for Post
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setPostNFTModalOpen(false);
                    setPostNFTs([]);
                  }}
                >
                  <X className="w-5 h-5 text-muted-foreground hover:text-foreground" />
                </button>
              </div>

              {postNFTsLoading ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Loading your NFTs...
                </div>
              ) : postNFTs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No NFTs found in this wallet.
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {postNFTs.map((nft: any) => (
                    <button
                      key={nft.mint ?? nft.id}
                      type="button"
                      onClick={() => {
                        const nftUrl = nft.image ?? nft.image_url ?? null;
                        if (!nftUrl) return;
                        revokeIfBlob(postImagePreview);
                        setPostNFTUrl(nftUrl);
                        setPostIsNFT(true);
                        setPostImagePreview(nftUrl);
                        setPostImage(null);
                        setPostNFTModalOpen(false);
                      }}
                      className="relative aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-yellow-400 transition-all group"
                    >
                      {(nft.image ?? nft.image_url) ? (
                        <img
                          src={nft.image ?? nft.image_url}
                          alt={nft.name ?? "NFT"}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-xs text-muted-foreground">
                          No image
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                    </button>
                  ))}
                </div>
              )}
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
              {t("post.no_posts")}
            </div>
          ) : (
            feed.map((post: SocialPost) => (
              <div
                key={post?.id}
                style={{ overflow: "visible", position: "relative" }}
              >
                <PostCard
                  post={post}
                  profile={profiles[post.wallet] ?? { wallet: post.wallet }}
                  publicKey={publicKey}
                  activeTab={activeTab}
                  likedPostIds={likedPostIds}
                  repostedPostIds={repostedPostIds}
                  bookmarkedIds={bookmarkedIds}
                  bookmarkLoading={bookmarkLoading}
                  followedWallets={followedWallets}
                  likeLoading={likeLoading}
                  menuOpenId={menuOpenId}
                  repostDropdownId={repostDropdownId}
                  repostTargetId={repostTargetId}
                  onPostClick={(p) => {
                    sessionStorage.setItem(
                      "dashboard_scroll",
                      window.scrollY.toString()
                    );
                    setSelectedPost(p);
                    setReplyToId(p.id);
                    setReplyContent("");
                  }}
                  onLike={handleLike}
                  onReply={(postId) => {
                    const target = feed.find((x) => x.id === postId);
                    if (!target || !publicKey) return;
                    sessionStorage.setItem(
                      "dashboard_scroll",
                      window.scrollY.toString()
                    );
                    setSelectedPost(target);
                    setReplyToId(postId);
                    setReplyContent("");
                  }}
                  onRepost={async (_postId, targetId) => {
                    if (!publicKey) return;
                    try {
                      await repostPost(publicKey.toString(), targetId);
                      setRepostedPostIds((prev) => {
                        const n = new Set(prev);
                        n.add(targetId);
                        return n;
                      });
                      const data =
                        activeTab === "following" && publicKey
                          ? await getFollowingFeed(publicKey.toString())
                          : await getSocialFeed();
                      const raw = data.posts ?? data ?? [];
                      const posts = Array.isArray(raw) ? raw : [];
                      if (activeTab === "explore") setFeed([...posts].reverse());
                      else if (activeTab === "newest")
                        setFeed(sortPostsByCreatedAtDesc(posts));
                      else setFeed(posts);
                      setRepostDropdownId(null);
                      setRepostTargetId(null);
                    } catch (e) {
                      console.error(e);
                    }
                  }}
                  onQuote={(p) => {
                    setQuoteModalPost(p);
                    setRepostDropdownId(null);
                    setQuoteModalText("");
                  }}
                  onBookmark={handleBookmark}
                  onReport={(postId) => {
                    setReportModalId(postId);
                    setMenuOpenId(null);
                  }}
                  onMenuOpen={setMenuOpenId}
                  onRepostDropdown={(postId, targetId) => {
                    setRepostDropdownId(postId);
                    setRepostTargetId(targetId);
                  }}
                  onUndoRepost={(targetId) => {
                    if (publicKey) {
                      unrepostPost(publicKey.toString(), targetId).catch(
                        console.error
                      );
                    }
                    setRepostedPostIds((prev) => {
                      const n = new Set(prev);
                      n.delete(targetId);
                      return n;
                    });
                    setFeed((prev) =>
                      prev.map((p) => {
                        const match =
                          (p as { repost_of?: number }).repost_of ===
                            targetId || p.id === targetId;
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
                  onTopReplyClick={(reply) => {
                    if (!reply) return;
                    sessionStorage.setItem(
                      "dashboard_scroll",
                      window.scrollY.toString()
                    );
                    setSelectedPost(reply as unknown as SocialPost);
                    setReplyToId(reply.id);
                    setReplyContent("");
                  }}
                  onTopReplyLike={(replyId) => {
                    if (!publicKey) return;
                    likePost(publicKey.toString(), replyId).catch(console.error);
                  }}
                  onTopReplyRepost={(replyId) => {
                    if (!publicKey) return;
                    repostPost(publicKey.toString(), replyId).catch(
                      console.error
                    );
                  }}
                  onTopReplyComment={(p, replyId) => {
                    sessionStorage.setItem(
                      "dashboard_scroll",
                      window.scrollY.toString()
                    );
                    setSelectedPost(p);
                    setReplyToId(replyId);
                    setReplyContent("");
                  }}
                />
              </div>
            ))
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

      {replyToId !== null && selectedPost === null && (
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
                    {t("post.reply_to")}{" "}
                    <span className="text-primary">
                      @{originalProfile?.handle ?? originalPost.wallet?.slice(0, 8)}
                    </span>
                  </p>
                </div>
              ) : null;
            })()}

            {/* Reply composer */}
            <div className="flex gap-3">
              <UserAvatar wallet={publicKey?.toString() ?? ""} size={36} />
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
                  placeholder={t("post.placeholder_reply")}
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
                      {t("common.cancel")}
                    </button>
                    <button
                      onClick={() => handleReply(replyToId!)}
                      disabled={!replyContent.trim() || replyLoading}
                      className="px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                      {replyLoading ? t("post.replying") : t("post.reply")}
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
                {quoteModalLoading
                  ? t("common.loading")
                  : t("dashboard.post_button")}
              </button>
            </div>

            {/* Quote input area */}
            <div className="flex gap-3 px-4 pt-4 pb-2">
              <UserAvatar wallet={address ?? ""} size={36} />
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

      {selectedPost &&
        (() => {
          const imgUrl =
            selectedPost.original_post?.image_url ??
            selectedPost.image_url;
          return (
            <div
              role="dialog"
              aria-modal="true"
              onClick={() => {
                document.body.style.overflow = "";
                setReplyToId(null);
                setSelectedPost(null);
              }}
              onWheel={(e) => e.stopPropagation()}
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.7)",
                backdropFilter: "blur(2px)",
                zIndex: 1000,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "20px",
              }}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  maxWidth: imgUrl ? 900 : 600,
                  width: "100%",
                  height: "80vh",
                  display: "flex",
                }}
              >
                <PostDetailPanel
                  key={selectedPost.id}
                  post={selectedPost}
                  replies={replies[selectedPost.id] ?? []}
                  initialLikedIds={likedPostIds}
                  initialRepostedIds={repostedPostIds}
                  onLikeChange={(postId, liked) => {
                    if (liked) {
                      setLikedPostIds((prev) => {
                        const n = new Set(prev);
                        n.add(postId);
                        return n;
                      });
                      setFeed((prev) =>
                        prev.map((p) =>
                          p.id === postId
                            ? {
                                ...p,
                                like_count: (p.like_count ?? 0) + 1,
                                likes_count: (p.likes_count ?? 0) + 1,
                              }
                            : p
                        )
                      );
                    } else {
                      setLikedPostIds((prev) => {
                        const n = new Set(prev);
                        n.delete(postId);
                        return n;
                      });
                      setFeed((prev) =>
                        prev.map((p) =>
                          p.id === postId
                            ? {
                                ...p,
                                like_count: Math.max((p.like_count ?? 0) - 1, 0),
                                likes_count: Math.max(
                                  (p.likes_count ?? 0) - 1,
                                  0
                                ),
                              }
                            : p
                        )
                      );
                    }
                  }}
                  onRepostChange={(postId) => {
                    setRepostedPostIds((prev) => {
                      const n = new Set(prev);
                      n.add(postId);
                      return n;
                    });
                    setFeed((prev) =>
                      prev.map((p) =>
                        p.id === postId
                          ? {
                              ...p,
                              repost_count: (p.repost_count ?? 0) + 1,
                            }
                          : p
                      )
                    );
                  }}
                  onRepostUndo={(postId) => {
                    if (publicKey) {
                      unrepostPost(publicKey.toString(), postId).catch(
                        console.error
                      );
                    }
                    setRepostedPostIds((prev) => {
                      const n = new Set(prev);
                      n.delete(postId);
                      return n;
                    });
                    setFeed((prev) =>
                      prev.map((p) => {
                        const match =
                          (p as { repost_of?: number }).repost_of ===
                            postId || p.id === postId;
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
                  }}
                  onQuote={(post) => {
                    setSelectedPost(null);
                    setReplyToId(null);
                    setReplyContent("");
                    document.body.style.overflow = "";
                    setQuoteModalPost(post);
                    setQuoteModalText("");
                  }}
                  onClose={() => {
                    document.body.style.overflow = "";
                    setReplyToId(null);
                    setSelectedPost(null);
                  }}
                  onRepliesChange={(newReplies) =>
                    setReplies((prev) => ({
                      ...prev,
                      [selectedPost.id]: newReplies,
                    }))
                  }
                  onReplySuccess={(postId) => {
                    setFeed((prev) =>
                      prev.map((p) =>
                        p.id === postId
                          ? { ...p, reply_count: (p.reply_count ?? 0) + 1 }
                          : p
                      )
                    );
                  }}
                />
              </div>
            </div>
          );
        })()}
    </DashboardLayout>
  );
};

export default Dashboard;
