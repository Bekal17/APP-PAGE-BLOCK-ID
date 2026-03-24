import { useWallet } from "@solana/wallet-adapter-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getGraph,
  setGraphCache,
  getSocialProfile,
  getWalletPosts,
  getWalletBalance,
  likePost,
  unlikePost,
  uploadAvatarPhoto,
  uploadBannerPhoto,
  getWalletNFTs,
  setNFTAvatar,
  setNFTBanner,
  removeAvatar,
  removeBanner,
  getFollowers,
  getFollowing,
  followWallet,
  endorseWallet,
  getPrivacySettings,
  repostPost,
  getWalletNames,
  deletePost,
  incrementScan,
  updateProfile,
  getSessionToken,
} from "@/services/blockidApi";
import { normalizeGraphResponse } from "@/components/investigation/WalletGraph";
import DashboardLayout from "@/components/DashboardLayout";
import DashboardOnboarding from "@/components/DashboardOnboarding";
import ScoreRing from "@/components/blockid/ScoreRing";
import RiskBadge from "@/components/blockid/RiskBadge";
import WalletActivityChart from "@/components/blockid/WalletActivityChart";
import SubscriptionBadge from "@/components/blockid/SubscriptionBadge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  ShareInvestigationModal,
  buildFullReport,
  buildTwitterReport,
} from "@/components/dashboard/ShareInvestigationModal";
import {
  AlertTriangle,
  Clock,
  ArrowLeftRight,
  Users,
  DollarSign,
  FileText,
  Heart,
  MessageSquare,
  MessageSquareQuote,
  Shield,
  Camera,
  Image,
  Trash2,
  X,
  ExternalLink,
  Repeat2,
  MoreHorizontal,
  Flag,
  UserPlus,
  MapPin,
  Link2,
} from "lucide-react";
import WalletHoverCard from "@/components/WalletHoverCard";
import ImageCropModal from "@/components/ImageCropModal";
import {
  InvestigatorProgress,
  type InvestigatorStep,
} from "@/components/InvestigatorProgress";

const APP_BASE_URL = "https://app.blockidscore.fun";
const API_BASE =
  import.meta.env.VITE_EXPLORER_API_URL ||
  "https://blockid-backend-production.up.railway.app";

const formatSolanaAddress = (address: string) => {
  if (!address) return "";
  if (address.length <= 12) return address;
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
};

const truncateWalletLong = (address: string) => {
  if (!address) return "";
  if (address.length <= 16) return address;
  return `${address.slice(0, 8)}...${address.slice(-8)}`;
};

const riskColorMap: Record<string, string> = {
  GREEN: "GREEN",
  AMBER: "ORANGE",
  YELLOW: "ORANGE",
  ORANGE: "ORANGE",
  RED: "RED",
};

const getStatusMessage = (riskColor: string, riskTier: string) => {
  const rc = riskColor?.toUpperCase();
  if (rc === "RED") return "Review recommended";
  if (rc === "AMBER" || rc === "ORANGE" || rc === "YELLOW") return "Caution advised";
  return "Safe";
};

const buildRiskAlerts = (data: {
  primary_risk_driver?: string | null;
  propagation_signal?: string;
  cluster?: { cluster_id?: string; size?: number } | null;
  badges?: string[];
}) => {
  const alerts: string[] = [];
  const sig = (data.propagation_signal ?? "").toUpperCase();
  if (sig === "HIGH" || sig === "MEDIUM") {
    alerts.push("Interaction with high-risk wallet");
  }
  if (data.cluster) {
    alerts.push("Cluster exposure detected");
  }
  if (data.primary_risk_driver) {
    if (data.primary_risk_driver.includes("SCAM") || data.primary_risk_driver.includes("CLUSTER")) {
      if (!alerts.some((a) => a.includes("Cluster"))) {
        alerts.push("Cluster exposure detected");
      }
    } else {
      alerts.push("Suspicious token interaction");
    }
  }
  if (data.badges?.some((b) => b.includes("SCAM") || b.includes("RISK"))) {
    alerts.push("Suspicious token interaction");
  }
  return [...new Set(alerts)];
};

interface DashboardData {
  risk_level?: string;
  risk_tier?: string;
  trust_score: number;
  risk_color: string;
  summary_message: string;
  recommended_actions: string[];
  counterparties: { wallet: string; risk_tier: string }[];
  evidence?: { tx_hash: string; reason: string; timestamp?: string }[];
  timeline_events?: { time: string; event: string; counterparty?: string }[];
  propagation_signal?: string;
  primary_risk_driver?: string | null;
  cluster?: { cluster_id?: string; size?: number } | null;
  badges?: string[];
  wallet_age_months?: number;
  wallet_first_seen?: string;
  wallet_age_days?: number;
  exposure_ratio?: number;
  fingerprint?: string;
  category?: string;
  volume_30d?: number;
  transactions?: number;
  unique_counterparties?: number;
}

const formatWalletAge = (firstSeen?: string, months?: number, days?: number): string => {
  if (days != null && days > 0) {
    if (days < 30) return `${days} days`;
    if (days < 365) return `${Math.round(days / 30)} mo`;
    return `${(days / 365).toFixed(1)} years`;
  }
  if (firstSeen) {
    try {
      const date = new Date(firstSeen);
      if (Number.isNaN(date.getTime())) return "Unknown";
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const years = diffMs / (1000 * 60 * 60 * 24 * 365.25);
      if (years < 0) return "Unknown";
      if (years < 1) return `${Math.round(years * 12)} mo`;
      return `${years.toFixed(1)} years`;
    } catch {
      return "Unknown";
    }
  }
  if (months != null && months > 0) {
    if (months < 12) return `${months} mo`;
    return `${(months / 12).toFixed(1)} years`;
  }
  return "Unknown";
};

const formatVolume = (val?: number) => {
  if (val == null || val <= 0) return "$0";
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(1)}K`;
  return `$${val.toLocaleString()}`;
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

const Profile = () => {
  const { publicKey, connected } = useWallet();
  const { walletParam } = useParams<{ walletParam: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<any | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"wallet" | "posts">("posts");
  const [loading, setLoading] = useState(true);

  const [walletLoading, setWalletLoading] = useState(false);
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [walletDashboard, setWalletDashboard] = useState<any>(null);
  const [investigatorStep, setInvestigatorStep] =
    useState<InvestigatorStep | null>(null);
  const [investigatorDone, setInvestigatorDone] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [showNFTModal, setShowNFTModal] = useState<"avatar" | "banner" | null>(
    null
  );
  const [nfts, setNfts] = useState<any[]>([]);
  const [nftsLoading, setNftsLoading] = useState(false);
  const [balance, setBalance] = useState<any>(null);
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [showFollowModal, setShowFollowModal] = useState<
    "followers" | "following" | null
  >(null);
  const [followList, setFollowList] = useState<any[]>([]);
  const [followListLoading, setFollowListLoading] = useState(false);
  const [viewedPrivacy, setViewedPrivacy] = useState<any>(null);
  const [likedPostIds, setLikedPostIds] = useState<Set<number>>(new Set());
  const [likeLoading, setLikeLoading] = useState<
    Record<string | number, boolean>
  >({});
  const [repostedPostIds, setRepostedPostIds] = useState<Set<number>>(
    new Set()
  );
  const [repostDropdownId, setRepostDropdownId] = useState<number | null>(
    null
  );
  const [repostTargetId, setRepostTargetId] = useState<number | null>(
    null
  );
  const [quoteModalPost, setQuoteModalPost] = useState<any | null>(null);
  const [quoteModalText, setQuoteModalText] = useState("");
  const [quoteModalLoading, setQuoteModalLoading] = useState(false);
  const [postMenuId, setPostMenuId] = useState<number | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [walletNames, setWalletNames] = useState<any[]>([]);
  const [editForm, setEditForm] = useState({
    display_name: "",
    display_name_source: "WALLET",
    bio: "",
    website: "",
    location: "",
  });
  const [editSaving, setEditSaving] = useState(false);
  const [modalAvatarMenu, setModalAvatarMenu] = useState(false);
  const [modalBannerMenu, setModalBannerMenu] = useState(false);
  const bannerMenuRef = useRef<HTMLDivElement>(null);
  const avatarMenuRef = useRef<HTMLDivElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [cropType, setCropType] = useState<"avatar" | "banner" | null>(null);
  const [isCropActive, setIsCropActive] = useState(false);
  const [pendingAvatarBlob, setPendingAvatarBlob] = useState<Blob | null>(null);
  const [pendingBannerBlob, setPendingBannerBlob] = useState<Blob | null>(null);
  const [pendingAvatarPreview, setPendingAvatarPreview] =
    useState<string | null>(null);
  const [pendingBannerPreview, setPendingBannerPreview] =
    useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isHoveringFollow, setIsHoveringFollow] = useState(false);

  useEffect(() => {
    if (repostDropdownId === null) return;
    const handleClick = () => setRepostDropdownId(null);
    setTimeout(() => {
      document.addEventListener("click", handleClick);
    }, 0);
    return () => document.removeEventListener("click", handleClick);
  }, [repostDropdownId]);

  useEffect(() => {
    if (postMenuId === null) return;
    const handleClick = () => setPostMenuId(null);
    setTimeout(() => document.addEventListener("click", handleClick), 0);
    return () => document.removeEventListener("click", handleClick);
  }, [postMenuId]);

  useEffect(() => {
    if (!modalBannerMenu) return;
    const handler = (e: MouseEvent) => {
      if (!bannerMenuRef.current?.contains(e.target as Node)) {
        setModalBannerMenu(false);
      }
    };
    setTimeout(() => document.addEventListener("mousedown", handler), 100);
    return () => document.removeEventListener("mousedown", handler);
  }, [modalBannerMenu]);

  useEffect(() => {
    if (!modalAvatarMenu) return;
    const handler = (e: MouseEvent) => {
      if (!avatarMenuRef.current?.contains(e.target as Node)) {
        setModalAvatarMenu(false);
      }
    };
    setTimeout(() => document.addEventListener("mousedown", handler), 100);
    return () => document.removeEventListener("mousedown", handler);
  }, [modalAvatarMenu]);

  const address = publicKey?.toBase58();
  const wallet = walletParam ?? address ?? "";

  useEffect(() => {
    if (!address || !walletParam || walletParam === address) {
      setIsFollowing(false);
      return;
    }
    const checkFollow = async () => {
      try {
        const data = await getFollowing(address);
        const list = data.following ?? data ?? [];
        const found = list.some(
          (f: any) => (f.wallet ?? f.following_wallet) === walletParam
        );
        setIsFollowing(found);
      } catch {
        setIsFollowing(false);
      }
    };
    checkFollow();
  }, [address, walletParam]);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, type: "avatar" | "banner") => {
      const file = e.target.files?.[0];
      if (!file || !publicKey) return;
      const reader = new FileReader();
      reader.onload = () => {
        setCropImage(reader.result as string);
        setCropType(type);
        setIsCropActive(true);
      };
      reader.readAsDataURL(file);
      e.target.value = "";
      if (type === "avatar") setModalAvatarMenu(false);
      else setModalBannerMenu(false);
    },
    [publicKey]
  );

  const walletAddress = wallet || "REPLACE_WITH_CONNECTED_WALLET";
  const walletUrl = wallet ? `${APP_BASE_URL}/wallet/${wallet}` : "";
  const canShare = !!address && !!data && !walletLoading && !error;
  const [shareInvestigationOpen, setShareInvestigationOpen] = useState(false);
  const [graphData, setGraphData] =
    useState<ReturnType<typeof normalizeGraphResponse> | null>(null);

  useEffect(() => {
    if (!wallet) {
      setProfile(null);
      setPosts([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    const run = async () => {
      try {
        const [profileRes, postsRes] = await Promise.all([
          getSocialProfile(wallet),
          getWalletPosts(wallet),
        ]);
        if (!cancelled) {
          setProfile(profileRes);
          setEditForm({
            display_name: profileRes?.display_name ?? "",
            display_name_source: profileRes?.display_name_source ?? "WALLET",
            bio: profileRes?.bio ?? "",
            website: profileRes?.website ?? "",
            location: profileRes?.location ?? "",
          });
          const p = postsRes.posts ?? postsRes ?? profileRes.posts ?? [];
          setPosts(Array.isArray(p) ? p : []);
          const savedScroll = sessionStorage.getItem("profile_scroll");
          if (savedScroll) {
            sessionStorage.removeItem("profile_scroll");
            const y = parseInt(savedScroll, 10);
            setTimeout(() => {
              window.scrollTo({ top: y, behavior: "instant" });
            }, 100);
          }
        }
      } catch (e) {
        console.error("Failed to load profile/posts", e);
        if (!cancelled) {
          setProfile(null);
          setPosts([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [wallet]);

  useEffect(() => {
    if (!wallet) return;
    getWalletNames(wallet)
      .then((data) => setWalletNames(data.names ?? []))
      .catch(() => setWalletNames([]));
  }, [wallet]);

  useEffect(() => {
    if (!wallet) {
      setBalance(null);
      setBalanceLoading(false);
      return;
    }
    setBalanceLoading(true);
    getWalletBalance(wallet)
      .then(setBalance)
      .catch(() => setBalance(null))
      .finally(() => setBalanceLoading(false));
  }, [wallet]);

  useEffect(() => {
    if (!wallet) {
      setViewedPrivacy(null);
      return;
    }

    let cancelled = false;

    const loadPrivacy = async () => {
      try {
        const privacy = await getPrivacySettings(wallet);
        if (!cancelled) setViewedPrivacy(privacy);
      } catch {
        if (!cancelled) setViewedPrivacy(null);
      }
    };

    loadPrivacy();

    return () => {
      cancelled = true;
    };
  }, [wallet]);

  const loadDashboardData = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch(
        `${API_BASE}/wallet/${encodeURIComponent(walletAddress)}/dashboard`
      );
      const json = await res.json();
      if (!res.ok)
        throw new Error(json?.detail ?? "Failed to load wallet dashboard");
      setWalletDashboard(json);
      const bp =
        json.behavioral_pattern ??
        json.fingerprint ??
        json.category ??
        json.profile ??
        "";
      const profileVal = json.profile;
      const profileStr =
        typeof profileVal === "string"
          ? profileVal
          : Array.isArray(profileVal)
          ? profileVal.join(", ")
          : "";
      setData({
        trust_score: json.trust_score ?? 0,
        risk_tier: json.risk_tier ?? "LOW",
        risk_color: json.risk_color ?? "GREEN",
        summary_message: json.summary_message ?? "",
        recommended_actions: json.recommended_actions ?? json.reasons ?? [],
        counterparties: json.counterparties ?? [],
        evidence: json.evidence ?? [],
        timeline_events: json.timeline_events ?? [],
        propagation_signal: json.propagation_signal,
        primary_risk_driver: json.primary_risk_driver,
        cluster: json.cluster,
        badges: json.badges ?? [],
        wallet_age_days: json.wallet_age_days ?? json.profile?.wallet_age_days,
        wallet_age_months:
          json.wallet_age_months ?? json.profile?.wallet_age_months ??
          (json.profile?.wallet_age_days != null
            ? Math.round(json.profile.wallet_age_days / 30)
            : undefined) ??
          (json.wallet_age_days != null
            ? Math.round(json.wallet_age_days / 30)
            : undefined) ??
          json.wallet_age,
        wallet_first_seen:
          json.wallet_first_seen ?? json.first_seen ?? json.profile?.wallet_first_seen,
        transactions:
          json.transactions ?? json.activity?.transactions ?? json.profile?.total_transactions,
        unique_counterparties:
          json.unique_counterparties ??
          json.activity?.unique_counterparties ??
          json.profile?.unique_counterparties,
        exposure_ratio: json.exposure_ratio ?? json.risk_exposure ?? 0,
        volume_30d:
          json.volume_30d ??
          json.volume_30d_usd ??
          json.activity?.volume_30d ??
          json.profile?.volume_30d,
        fingerprint: bp || profileStr,
        category: json.category ?? (bp || profileStr),
      });
    } catch (err) {
      console.error("Failed to load wallet dashboard", err);
      setError(
        err instanceof Error ? err.message : "Could not load wallet data"
      );
      setData(null);
      setWalletDashboard(null);
    } finally {
      setWalletLoading(false);
      setInvestigatorStep(null);
      setInvestigatorDone(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    if (
      !walletAddress ||
      walletAddress === "REPLACE_WITH_CONNECTED_WALLET" ||
      !connected
    ) {
      setData(null);
      setWalletDashboard(null);
      setError(null);
      setInvestigatorStep(null);
      setInvestigatorDone(false);
      return;
    }

    setWalletLoading(true);
    setError(null);
    setInvestigatorStep(null);
    setInvestigatorDone(false);

    let eventSource: EventSource | null = null;

    const run = async () => {
      try {
        // Increment scan count when viewing another wallet (not own profile)
        if (walletParam && address && walletParam !== address) {
          incrementScan(address);
        }
        const checkRes = await fetch(
          `${API_BASE}/wallet/${encodeURIComponent(walletAddress)}/needs-refresh`
        );
        const checkJson = await checkRes.json();

        if (checkJson.cached === true && checkJson.needs_refresh === false) {
          setInvestigatorStep(null);
          setInvestigatorDone(true);
          setWalletLoading(false);
          await loadDashboardData();
          return;
        }

        const investigateUrl = `${API_BASE}/investigate/${encodeURIComponent(
          walletAddress
        )}`;
        eventSource = new EventSource(investigateUrl);

        eventSource.onmessage = (event) => {
          try {
            const parsed = JSON.parse(event.data);
            if (parsed.step === "fetch_tx") setInvestigatorStep("fetch_tx");
            else if (parsed.step === "build_network")
              setInvestigatorStep("build_network");
            else if (parsed.step === "detect_drainer")
              setInvestigatorStep("detect_drainer");
            else if (parsed.step === "compute_score")
              setInvestigatorStep("compute_score");

            if (parsed.status === "done") {
              eventSource?.close();
              setInvestigatorDone(true);
              setWalletLoading(false);
              loadDashboardData();
            }
          } catch {
            // ignore parse errors
          }
        };

        eventSource.onerror = () => {
          eventSource?.close();
          setWalletLoading(false);
          loadDashboardData();
        };
      } catch {
        setWalletLoading(false);
        setInvestigatorDone(true);
        await loadDashboardData();
      }
    };

    run();

    return () => {
      eventSource?.close();
    };
  }, [walletAddress, connected, loadDashboardData]);

  useEffect(() => {
    if (!address || !connected) return;
    async function preloadGraph() {
      try {
        const graph = await getGraph(address);
        const normalized = normalizeGraphResponse(graph);
        setGraphCache(address, normalized);
        setGraphData(normalized);
      } catch {
        setGraphData(null);
      }
    }
    preloadGraph();
  }, [address, connected]);

  const trustScore = walletDashboard?.trust_score ?? data?.trust_score ?? 0;
  const riskTier = walletDashboard?.risk_tier ?? data?.risk_tier ?? "LOW";
  const riskExposure = walletDashboard?.risk_exposure;
  const activity = walletDashboard?.activity;
  const badges = walletDashboard?.badges;
  const cyclops = walletDashboard?.cyclops ?? null;

  const score = trustScore;
  const riskColor =
    riskColorMap[data?.risk_color?.toUpperCase() ?? ""] ?? "GREEN";
  const summaryMessage = data?.summary_message ?? "";
  const recommendedActions = data?.recommended_actions ?? [];
  const riskAlerts = data ? buildRiskAlerts(data) : [];
  const counterpartyItems = (data?.counterparties ?? [])
    .filter(
      (c) =>
        (c.risk_tier ?? "").toUpperCase() === "HIGH" ||
        (c.risk_tier ?? "").toUpperCase() === "MEDIUM"
    )
    .slice(0, 5)
    .map((c) => ({
      label: `Unknown wallet transfer — ${(c.risk_tier ?? "MEDIUM").toUpperCase()} risk`,
      wallet: c.wallet,
      risk: c.risk_tier,
    }));
  const evidenceItems = (data?.evidence ?? [])
    .slice(0, Math.max(0, 5 - counterpartyItems.length))
    .map((e) => ({
      label: `${e.reason} — HIGH risk`,
      wallet: "",
      risk: "HIGH",
    }));
  const suspiciousItems = [...counterpartyItems, ...evidenceItems].slice(0, 5);
  const totalTx = data?.transactions ?? data?.timeline_events?.length ?? 0;
  const uniqueCounterparties =
    data?.unique_counterparties ??
    new Set(data?.counterparties?.map((c) => c.wallet) ?? []).size;

  const getBehaviorPatterns = (data: DashboardData | null, score: number): string[] => {
    if (!data) return ["No pattern detected"];

    // Priority 1: use reasons from backend if available
    const reasons: string[] = walletDashboard?.reasons ?? [];

    if (reasons.length > 0) {
      const patterns: string[] = [];
      const reasonSet = new Set(reasons);

      // === HIGH RISK PATTERNS ===
      if (reasonSet.has("MEGA_DRAINER") || reasonSet.has("DRAINER_FLOW") || reasonSet.has("DRAINER_FLOW_DETECTED")) {
        patterns.push("Drainer pattern detected");
        patterns.push("Elevated propagation risk");
        return patterns;
      }
      if (reasonSet.has("RUG_PULL_DEPLOYER")) {
        patterns.push("Rug pull deployer");
        patterns.push("Elevated propagation risk");
        return patterns;
      }
      if (
        reasonSet.has("SCAM_CLUSTER_MEMBER") ||
        reasonSet.has("SCAM_CLUSTER_MEMBER_SMALL") ||
        reasonSet.has("SCAM_CLUSTER_MEMBER_LARGE")
      ) {
        patterns.push("Cluster-linked wallet");
        patterns.push("Elevated risk exposure");
        return patterns;
      }
      if (reasonSet.has("HIGH_RISK_TOKEN_INTERACTION") || reasonSet.has("SUSPICIOUS_TOKEN_MINT")) {
        patterns.push("Suspicious token activity");
        patterns.push("Elevated risk exposure");
        return patterns;
      }
      if (reasonSet.has("BLACKLISTED_CREATOR")) {
        patterns.push("Blacklisted creator");
        patterns.push("Elevated risk exposure");
        return patterns;
      }

      // === MEDIUM RISK PATTERNS ===
      if (reasonSet.has("HIGH_VALUE_OUTFLOW")) {
        patterns.push("High value outflow detected");
        return patterns;
      }
      if (reasonSet.has("VICTIM_OF_SCAM")) {
        patterns.push("Previous scam victim");
        patterns.push("Monitor interactions");
        return patterns;
      }

      // === LOW RISK / INFO PATTERNS ===
      if (reasonSet.has("LOW_ACTIVITY")) {
        patterns.push("Low on-chain activity");
        patterns.push("Insufficient data for full analysis");
        return patterns;
      }
      if (reasonSet.has("NEW_WALLET")) {
        patterns.push("New wallet");
        patterns.push("No history available");
        return patterns;
      }

      // === POSITIVE PATTERNS ===
      if (reasonSet.has("MEGA_DRAINER") === false) {
        if (reasonSet.has("DEX_TRADER") || reasonSet.has("DEX_TRADER_10_PLUS") || reasonSet.has("DEX_TRADER_50_PLUS")) {
          patterns.push("Active DEX trader");
        }
        if (reasonSet.has("NFT_COLLECTOR") || reasonSet.has("NFT_10_PLUS")) {
          patterns.push("NFT collector");
        }
        if (reasonSet.has("LONG_HISTORY") || reasonSet.has("MULTI_YEAR_ACTIVITY") || reasonSet.has("AGE_3Y") || reasonSet.has("AGE_5Y")) {
          patterns.push("Long-term holder");
        }
        if (reasonSet.has("LOW_RISK_CLUSTER") || reasonSet.has("FAR_FROM_SCAM_CLUSTER")) {
          patterns.push("Low-risk network");
        }
        if (reasonSet.has("CLEAN_HISTORY") || reasonSet.has("NO_SCAM_HISTORY")) {
          patterns.push("No drainer pattern");
        }
        if (reasonSet.has("DAO_MEMBER")) {
          patterns.push("DAO participant");
        }
        if (patterns.length > 0) return patterns;
      }
    }

    // Priority 2: fallback to score-based if no reasons
    if (score > 80) {
      return ["Long-term holder", "Low-risk network", "No drainer pattern"];
    }
    if (score >= 40) {
      return ["Active trader", "Moderate exposure"];
    }
    if (score >= 20) {
      return ["Elevated risk exposure", "Review recommended"];
    }
    return ["Cluster-linked wallet", "Elevated risk exposure"];
  };

  const behaviorPatterns = getBehaviorPatterns(data, score);
  const walletAgeStr = formatWalletAge(data?.wallet_first_seen, data?.wallet_age_months, data?.wallet_age_days);
  const volumeStr = formatVolume(data?.volume_30d);

  const investigationReportProps =
    address && data
      ? {
          walletAddress: address,
          shortAddress: formatSolanaAddress(address),
          trustScore: score,
          riskTier,
          walletAge: walletAgeStr,
          totalTx,
          uniqueCounterparties,
          volume30d: volumeStr,
          behaviorPatterns,
        }
      : null;

  const fullReportText = investigationReportProps
    ? buildFullReport(investigationReportProps)
    : "";
  const twitterReportText = investigationReportProps
    ? buildTwitterReport(investigationReportProps)
    : "";

  const handleCopyInvestigationReport = () => {
    if (!fullReportText) return;
    navigator.clipboard.writeText(fullReportText);
    toast({ title: "Investigation report copied" });
  };

  const handleShareInvestigationTwitter = () => {
    if (!twitterReportText) return;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      twitterReportText
    )}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleShareInvestigationTelegram = () => {
    if (!twitterReportText || !walletUrl) return;
    const url = `https://t.me/share/url?url=${encodeURIComponent(
      walletUrl
    )}&text=${encodeURIComponent(twitterReportText)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleRecalculate = async () => {
    if (!address) return;
    try {
      setAnalyzing(true);
      const res = await fetch(
        `${API_BASE}/wallet/recalculate/${encodeURIComponent(address)}`,
        {
          method: "POST",
        }
      );
      if (!res.ok) throw new Error("Recalculate failed");
      await loadDashboardData();
      toast({ title: "Score recalculated successfully" });
    } catch (err) {
      console.error("Recalculate error", err);
      toast({
        title: "Failed to recalculate score",
        variant: "destructive",
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const cardClass =
    "rounded-2xl border border-border bg-card/40 backdrop-blur p-6 transition-shadow hover:shadow-[0_0_20px_rgba(0,255,200,0.15)]";

  if (!connected || !publicKey) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
          <Shield className="w-12 h-12 mb-4 opacity-30" />
          <p className="text-lg font-medium">Connect your wallet</p>
          <p className="text-sm mt-1">
            Connect wallet to view your BlockID profile
          </p>
        </div>
      </DashboardLayout>
    );
  }

  const bannerUrl = profile?.banner_url as string | undefined;
  const avatarUrl = profile?.avatar_url as string | undefined;
  const avatarType = profile?.avatar_type as string | undefined;
  const avatarIsAnimated = profile?.avatar_is_animated === true;
  const handle = profile?.handle as string | undefined;
  const profileWallet = profile?.wallet ?? wallet;
  const followerCount = profile?.follower_count ?? profile?.followers_count ?? 0;
  const followingCount = profile?.following_count ?? 0;
  const profileScore =
    typeof profile?.trust_score === "number"
      ? profile.trust_score
      : (walletDashboard?.trust_score ?? data?.trust_score ?? 0);
  const trustBadgeClass =
    profileScore >= 70
      ? "bg-green-500/20 text-green-400"
      : profileScore >= 40
      ? "bg-orange-500/20 text-orange-400"
      : "bg-red-500/20 text-red-400";

  const isOwnProfile = !walletParam || (!!address && walletParam === address);
  const canShowBalance =
    isOwnProfile || viewedPrivacy?.balance_visibility === "PUBLIC";

  const handleLikePost = async (post: any) => {
    if (!address || !post?.id) return;
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
        await unlikePost(address, post.id);
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
                  likes_count: (p.likes_count ?? p.like_count ?? 0) + 1,
                  like_count: (p.likes_count ?? p.like_count ?? 0) + 1,
                }
              : p
          )
        );
        await likePost(address, post.id);
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

  const handleQuoteSubmit = async () => {
    if (!publicKey || !quoteModalPost || !quoteModalText.trim()) return;
    setQuoteModalLoading(true);
    try {
      const targetId =
        quoteModalPost.is_repost && quoteModalPost.repost_of
          ? quoteModalPost.repost_of
          : quoteModalPost.id;
      await repostPost(publicKey.toString(), targetId, quoteModalText.trim());
      setPosts((prev: any[]) =>
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

  return (
    <DashboardLayout>
      <div className="w-full max-w-screen-2xl mx-auto p-4 md:p-8">
        {/* Banner */}
        <div className="relative w-full h-36 rounded-xl mb-0">
          <div className="absolute inset-0 rounded-xl overflow-hidden">
            {profile?.banner_url ? (
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: `url(${profile.banner_url})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-r from-zinc-800 via-zinc-700 to-zinc-800" />
            )}
          </div>

        </div>

        {/* Profile row */}
        <div className="flex items-start gap-4 -mt-14 ml-4 relative z-10">
          <div className="relative w-24 h-24 shrink-0">
              {avatarType === "NFT" && avatarUrl ? (
                avatarIsAnimated ? (
                  <video
                    src={avatarUrl}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-24 h-24 object-cover"
                    style={{
                      borderRadius: "8px",
                      border: "2px solid gold",
                      boxShadow: "0 0 8px rgba(255,215,0,0.5)",
                    }}
                  />
                ) : (
                  <img
                    src={avatarUrl}
                    alt={handle ?? profileWallet}
                    className="w-24 h-24 object-cover"
                    style={{
                      borderRadius: "8px",
                      border: "2px solid gold",
                      boxShadow: "0 0 8px rgba(255,215,0,0.5)",
                    }}
                  />
                )
              ) : avatarType === "PHOTO" && avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={handle ?? profileWallet}
                  className="w-24 h-24 object-cover rounded-full border-2 border-white"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-zinc-700 border-2 border-zinc-600 flex items-center justify-center text-2xl font-bold text-foreground">
                  {(profile?.handle ?? wallet ?? "?")[0]?.toUpperCase() ?? "?"}
                </div>
              )}
            </div>

          <div className="flex-1 pb-2 mt-14">
              <p className="text-lg font-bold text-foreground flex items-center gap-1.5">
                {profile?.handle ? `@${profile.handle}` : wallet.length > 16 ? `${wallet.slice(0, 8)}...${wallet.slice(-8)}` : wallet}
                <SubscriptionBadge plan={(profile as any)?.plan ?? "free"} size="md" />
              </p>
              <p className="text-xs text-muted-foreground font-mono">
                {wallet.length > 16 ? `${wallet.slice(0, 8)}...${wallet.slice(-8)}` : wallet || "—"}
              </p>
              <div className="flex items-center gap-3 mt-1">
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${trustBadgeClass}`}>
                  ⬡ {Math.round(profileScore)}
                </span>
                <button
                  onClick={async () => {
                    setShowFollowModal("followers");
                    setFollowListLoading(true);
                    try {
                      const data = await getFollowers(wallet, address);
                      setFollowList(data.followers ?? data ?? []);
                    } catch {
                      setFollowList([]);
                    }
                    setFollowListLoading(false);
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {followerCount} Followers
                </button>
                <button
                  onClick={async () => {
                    setShowFollowModal("following");
                    setFollowListLoading(true);
                    try {
                      const data = await getFollowing(wallet, address);
                      setFollowList(data.following ?? data ?? []);
                    } catch {
                      setFollowList([]);
                    }
                    setFollowListLoading(false);
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {followingCount} Following
                </button>
              </div>
              {profile?.badges &&
                (() => {
                  try {
                    const list =
                      typeof profile.badges === "string"
                        ? JSON.parse(profile.badges)
                        : profile.badges;
                    return Array.isArray(list) && list.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {list.map((badge: string) => (
                          <span
                            key={badge}
                            className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/15 text-primary border border-primary/20"
                          >
                            {badge}
                          </span>
                        ))}
                      </div>
                    ) : null;
                  } catch {
                    return null;
                  }
                })()}
              {isOwnProfile && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 px-3 rounded-full text-xs mt-2"
                  onClick={() => setEditModalOpen(true)}
                >
                  Edit Profile
                </Button>
              )}
              {!isOwnProfile && (
                <div className="flex items-center gap-2 mt-2">
                  <Button
                    size="sm"
                    className={`h-7 px-3 rounded-full text-xs transition-all ${
                      isFollowing
                        ? "bg-zinc-700 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30 text-zinc-100 border border-zinc-600"
                        : ""
                    }`}
                    variant={isFollowing ? "outline" : "default"}
                    onMouseEnter={() => { if (isFollowing) setIsHoveringFollow(true); }}
                    onMouseLeave={() => setIsHoveringFollow(false)}
                    onClick={async () => {
                      if (!address) return;
                      try {
                        if (isFollowing) {
                          // Unfollow
                          await fetch(
                            `${API_BASE}/social/follow`,
                            {
                              method: "DELETE",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                follower_wallet: address,
                                following_wallet: wallet,
                              }),
                            }
                          );
                          setIsFollowing(false);
                          setProfile((prev: any) =>
                            prev
                              ? {
                                  ...prev,
                                  follower_count: Math.max(
                                    (prev.follower_count ?? 1) - 1,
                                    0
                                  ),
                                }
                              : prev
                          );
                        } else {
                          // Follow
                          await followWallet(address, wallet);
                          setIsFollowing(true);
                          setProfile((prev: any) =>
                            prev
                              ? {
                                  ...prev,
                                  follower_count: (prev.follower_count ?? 0) + 1,
                                }
                              : prev
                          );
                        }
                      } catch (e) {
                        console.error(e);
                      }
                    }}
                  >
                    {isFollowing
                      ? isHoveringFollow
                        ? "Unfollow"
                        : "Following"
                      : "Follow"}
                  </Button>
                  <Button
                    size="sm"
                    className="h-7 px-3 rounded-full text-xs"
                    variant="outline"
                    onClick={async () => {
                      if (!address) return;
                      try {
                        await endorseWallet(address, wallet);
                      } catch (e) {
                        console.error(e);
                      }
                    }}
                  >
                    Endorse
                  </Button>
                </div>
              )}
            </div>
          </div>

        {/* Bio section — below profile row, full width */}
        <div className="ml-4 mt-3 space-y-1">
          {profile?.bio && (
            <p className="text-sm text-foreground max-w-lg">
              {profile.bio}
            </p>
          )}
          {(profile?.website || profile?.location) && (
            <div className="flex items-center gap-3 flex-wrap">
              {profile?.location && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {profile.location}
                </span>
              )}
              {profile?.website && (
                <a
                  href={profile.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Link2 className="w-3 h-3" />
                  {profile.website.replace(/^https?:\/\//, "")}
                </a>
              )}
            </div>
          )}
          {walletNames.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-1">
              {walletNames.map((n: any) => (
                <span
                  key={n.name}
                  className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
                    n.source === "BLOCKID"
                      ? "bg-primary/10 text-primary border-primary/20"
                      : n.source === "SNS"
                        ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                        : n.source === "ANS"
                          ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                          : "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
                  }`}
                >
                  {n.display}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Tab switcher */}
        <div className="border-b border-border flex gap-6 text-sm mt-4">
          <button
            className={`pb-2 px-1 -mb-px border-b-2 transition-colors ${
              activeTab === "posts"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setActiveTab("posts")}
          >
            Posts
          </button>
          <button
            className={`pb-2 px-1 -mb-px border-b-2 transition-colors ${
              activeTab === "wallet"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setActiveTab("wallet")}
          >
            Wallet
          </button>
        </div>

        {/* Tab content */}
        {activeTab === "wallet" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 animate-slide-up">
            {/* 0. Portfolio Balance - above Wallet Health */}
            {canShowBalance && (
              <div className="col-span-1 md:col-span-2 lg:col-span-12">
                <div className="glass-card p-5 mb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-foreground">
                    Portfolio
                  </h3>
                  {balance && (
                    <span className="text-xs text-muted-foreground">
                      Solana
                    </span>
                  )}
                </div>

                {balanceLoading ? (
                  <div className="animate-pulse space-y-2">
                    <div className="h-8 bg-zinc-700 rounded w-1/3" />
                    <div className="h-4 bg-zinc-700 rounded w-1/2" />
                  </div>
                ) : !balance ? (
                  <p className="text-sm text-muted-foreground">
                    Unable to fetch balance
                  </p>
                ) : (
                  <>
                    {/* Total USD Value */}
                    <div className="mb-4">
                      <p className="text-3xl font-bold text-foreground">
                        $
                        {(balance.total_usd_value ?? 0).toLocaleString(
                          "en-US",
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Total Portfolio Value
                      </p>
                    </div>

                    {/* SOL Balance */}
                    <div className="flex items-center justify-between py-2.5 border-b border-zinc-800">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs font-bold text-white">
                          ◎
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            SOL
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Solana
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-foreground">
                          {(balance.sol_balance ?? 0).toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 4,
                          })}{" "}
                          SOL
                        </p>
                        {(balance.sol_usd_value ?? 0) > 0 && (
                          <p className="text-xs text-muted-foreground">
                            $
                            {(balance.sol_usd_value ?? 0).toLocaleString(
                              "en-US",
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              }
                            )}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Token List */}
                    {balance.tokens?.slice(0, 5).map((token: any, i: number) => (
                      <div
                        key={token.mint ?? token.symbol ?? i}
                        className="flex items-center justify-between py-2.5 border-b border-zinc-800 last:border-0"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="relative w-8 h-8 shrink-0">
                            <div className="absolute inset-0 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-bold text-foreground">
                              {token.symbol?.[0] ?? "?"}
                            </div>
                            {token.logo_uri && (
                              <img
                                src={token.logo_uri}
                                alt={token.symbol}
                                className="absolute inset-0 w-full h-full rounded-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.visibility = "hidden";
                                }}
                              />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {token.symbol}
                            </p>
                            <p className="text-xs text-muted-foreground max-w-[120px] truncate">
                              {token.name}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-foreground">
                            {(token.balance ?? 0).toLocaleString("en-US", {
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 4,
                            })}
                          </p>
                          {token.usd_value && (
                            <p className="text-xs text-muted-foreground">
                              $
                              {(token.usd_value ?? 0).toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}

                    {/* Empty tokens */}
                    {balance.tokens?.length === 0 &&
                      (balance.sol_balance ?? 0) === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-2 mt-2">
                          No assets found
                        </p>
                      )}
                  </>
                )}
                </div>
              </div>
            )}

            {/* 1. Wallet Health - col-span-12 */}
            <div
              className={`${cardClass} col-span-1 md:col-span-2 lg:col-span-12`}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground">
                  Wallet Health
                </h2>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-lg border-border bg-transparent hover:bg-accent/50 gap-2"
                    disabled={!canShare}
                    onClick={() => setShareInvestigationOpen(true)}
                  >
                    <FileText className="w-4 h-4" />
                    Share Your Score
                  </Button>
                  <Button
                    size="sm"
                    disabled={analyzing || !address}
                    onClick={handleRecalculate}
                    className="rounded-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-4 py-2 transition"
                  >
                    {analyzing ? "Analyzing..." : "Recalculate Score"}
                  </Button>
                  <a
                    href="https://daemonprotocol.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-xs font-medium text-muted-foreground hover:text-foreground rounded-lg transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Investigate on Daemon
                  </a>
                </div>
              </div>
              {walletLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-pulse text-muted-foreground">
                    Loading...
                  </div>
                </div>
              ) : error ? (
                <p className="text-sm text-destructive py-4">{error}</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start">
                  {/* Column 1: Trust Score */}
                  <ScoreRing
                    score={score}
                    riskColor={riskColor}
                    riskTier={data?.risk_level ?? data?.risk_tier}
                  />

                  {/* Column 2: Wallet Age, Activity Profile */}
                  <div className="space-y-6 min-w-0">
                    <div className="flex items-start gap-3">
                      <Clock className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Wallet Age
                        </p>
                        <p className="font-medium text-foreground">
                          {walletLoading
                            ? "—"
                            : formatWalletAge(
                                data?.wallet_first_seen,
                                data?.wallet_age_months,
                                data?.wallet_age_days
                              )}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground mb-3">
                        Activity Profile
                      </p>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <ArrowLeftRight className="w-4 h-4 text-muted-foreground shrink-0" />
                          <span className="text-muted-foreground">
                            Transactions:
                          </span>
                          <span className="font-medium text-foreground">
                            {walletLoading ? "0" : totalTx}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="w-4 h-4 text-muted-foreground shrink-0" />
                          <span className="text-muted-foreground">
                            Unique Counterparties:
                          </span>
                          <span className="font-medium text-foreground">
                            {walletLoading ? "0" : uniqueCounterparties}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <DollarSign className="w-4 h-4 text-muted-foreground shrink-0" />
                          <span className="text-muted-foreground">
                            30D Volume:
                          </span>
                          <span className="font-medium text-foreground">
                            {walletLoading ? "$0" : formatVolume(data?.volume_30d)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Column 3: Behavioral Pattern, Summary */}
                  <div className="space-y-6 min-w-0 md:col-span-2 lg:col-span-1">
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Behavioral Pattern
                      </p>
                      <ul className="space-y-1.5">
                        {(walletLoading
                          ? ["No pattern detected"]
                          : getBehaviorPatterns(data, score)
                        ).map((pattern, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-2 text-sm"
                          >
                            <span className="text-primary mt-1">•</span>
                            <span className="text-foreground">{pattern}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">Summary</p>
                      <p className="text-foreground text-sm mt-1">
                        {walletLoading
                          ? "—"
                          : summaryMessage || "No major threats detected."}
                      </p>
                    </div>
                    {cyclops && !walletLoading && (
                      <div className="mt-4 pt-4 border-t border-border/30">
                        <p className="text-sm text-muted-foreground mb-2">Risk Intelligence</p>
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full shrink-0 ${
                              cyclops.is_sanctioned ? "bg-red-500" : "bg-green-500"
                            }`} />
                            <span className="text-xs text-foreground">
                              {cyclops.is_sanctioned ? "SANCTIONED" : "Sanctions: Clean"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              cyclops.risk_level === "CRITICAL" ? "bg-red-500/20 text-red-400" :
                              cyclops.risk_level === "HIGH" ? "bg-orange-500/20 text-orange-400" :
                              cyclops.risk_level === "MEDIUM" ? "bg-yellow-500/20 text-yellow-400" :
                              cyclops.risk_level === "LOW" ? "bg-blue-500/20 text-blue-400" :
                              "bg-green-500/20 text-green-400"
                            }`}>
                              {cyclops.risk_level}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {cyclops.risk_score.toFixed(1)} / 100
                            </span>
                          </div>
                          <p className="text-[10px] text-muted-foreground/50 mt-1">
                            Powered by Daemon Protocol
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 2. Risk Alerts - col-span-6 */}
            <div
              className={`${cardClass} col-span-1 md:col-span-2 lg:col-span-6`}
            >
              <h2 className="text-lg font-semibold text-foreground mb-4">
                Risk Alerts
              </h2>
              {walletLoading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : riskAlerts.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No active risk alerts detected.
                </p>
              ) : (
                <ul className="space-y-2">
                  {riskAlerts.map((alert, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm"
                    >
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <span className="text-foreground">{alert}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* 3. Suspicious Interactions - col-span-6 */}
            <div
              className={`${cardClass} col-span-1 md:col-span-2 lg:col-span-6`}
            >
              <h2 className="text-lg font-semibold text-foreground mb-4">
                Suspicious Interactions
              </h2>
              {walletLoading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : suspiciousItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No suspicious interactions detected.
                </p>
              ) : (
                <ul className="space-y-3">
                  {suspiciousItems.map((item, i) => (
                    <li
                      key={i}
                      className="flex items-center justify-between gap-4 py-2 border-b border-zinc-800 last:border-0"
                    >
                      <span className="text-sm text-foreground">
                        {item.label}
                      </span>
                      {item.wallet && (
                        <span className="text-xs font-mono text-muted-foreground shrink-0">
                          {formatSolanaAddress(item.wallet)}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* 4. Trust Improvement Tips - col-span-6 */}
            {isOwnProfile && (
              <div
                className={`${cardClass} col-span-1 md:col-span-2 lg:col-span-6`}
              >
                <h2 className="text-lg font-semibold text-foreground mb-4">
                  Trust Improvement Tips
                </h2>
                {walletLoading ? (
                  <p className="text-sm text-muted-foreground">Loading...</p>
                ) : recommendedActions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No recommendations at this time.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {recommendedActions.map((action, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-sm"
                      >
                        <span className="text-primary mt-1">•</span>
                        <span className="text-foreground">{action}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* 5. Activity Overview - col-span-6 */}
            {isOwnProfile && (
              <div
                className={`${cardClass} col-span-1 md:col-span-2 lg:col-span-6`}
              >
                <h2 className="text-sm font-semibold text-foreground mb-4">
                  Activity Overview
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <p className="stat-label">Total Transactions</p>
                    <p className="stat-value mt-1">
                      {walletLoading ? "—" : totalTx}
                    </p>
                  </div>
                  <div>
                    <p className="stat-label">Unique Counterparties</p>
                    <p className="stat-value mt-1">
                      {walletLoading ? "—" : uniqueCounterparties}
                    </p>
                  </div>
                  <div>
                    <p className="stat-label">30D Volume</p>
                    <p className="stat-value mt-1">
                      {walletLoading ? "—" : "—"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 6. Wallet Activity Chart - full width */}
            {isOwnProfile && <WalletActivityChart wallet={wallet} activity={walletDashboard?.activity ?? []} />}

          </div>
        ) : (
          <div className="space-y-3 animate-slide-up">
            {loading ? (
              <>
                {[0, 1].map((i) => (
                  <div
                    key={i}
                    className="glass-card p-4 flex flex-col gap-3 animate-pulse"
                  >
                    <div className="h-3 w-32 bg-muted/60 rounded" />
                    <div className="h-3 w-full bg-muted/50 rounded" />
                    <div className="h-3 w-2/3 bg-muted/40 rounded" />
                    <div className="flex items-center justify-between pt-2">
                      <div className="h-3 w-16 bg-muted/40 rounded" />
                      <div className="flex gap-3">
                        <div className="h-3 w-10 bg-muted/40 rounded" />
                        <div className="h-3 w-10 bg-muted/40 rounded" />
                      </div>
                    </div>
                  </div>
                ))}
              </>
            ) : posts.length === 0 ? (
              <div className="glass-card p-6 text-center text-sm text-muted-foreground">
                No posts yet.
              </div>
            ) : (
              posts.map((post: any) => {
                const isRepost = post.is_repost === true;
                const originalPost = isRepost
                  ? (post as any).original_post ?? null
                  : null;

                return (
                  <div
                    key={post.id}
                    className="glass-card overflow-hidden
                      cursor-pointer hover:bg-muted/5
                      transition-colors"
                    onClick={() => {
                      sessionStorage.setItem("profile_scroll", window.scrollY.toString());
                      navigate(
                        `/post/${
                          isRepost && post.repost_of ? post.repost_of : post.id
                        }`
                      );
                    }}
                  >
                    {/* Repost header */}
                    {isRepost && (
                      <div
                        className="flex items-center gap-2 px-4 pt-3 pb-1 text-xs
                          text-muted-foreground"
                      >
                        <Repeat2 className="w-3.5 h-3.5 text-green-400" />
                        <span>
                          {profile?.handle
                            ? `@${profile.handle}`
                            : `${wallet.slice(0, 4)}...${wallet.slice(-4)}`}
                          {" "}reposted
                        </span>
                      </div>
                    )}

                    <div className="p-4 flex flex-col gap-3">
                      {/* Author row */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          {/* Avatar */}
                          <div
                            className="w-9 h-9 rounded-full bg-primary/10 flex items-center
                              justify-center text-xs font-bold text-primary shrink-0"
                          >
                            {isRepost && originalPost
                              ? (
                                  originalPost.handle ??
                                  originalPost.wallet ??
                                  "?"
                                )[0].toUpperCase()
                              : (profile?.handle ?? wallet ?? "?")[0]
                                  ?.toUpperCase() ?? "?"}
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              {/* Name */}
                              <span className="text-sm font-semibold text-foreground inline-flex items-center gap-1">
                                {isRepost && originalPost
                                  ? originalPost.handle
                                    ? `@${originalPost.handle}`
                                    : `${originalPost.wallet?.slice(0, 4)}...${originalPost.wallet?.slice(-4)}`
                                  : profile?.handle
                                    ? `@${profile.handle}`
                                    : wallet.length > 16
                                      ? `${wallet.slice(0, 8)}...${wallet.slice(-8)}`
                                      : wallet}
                                <SubscriptionBadge
                                  plan={
                                    (isRepost && originalPost
                                      ? (originalPost as any)?.plan
                                      : (post as any)?.plan) ?? (profile as any)?.plan ?? "free"
                                  }
                                  size="sm"
                                />
                              </span>

                              {/* Trust score */}
                              {(() => {
                                const score =
                                  isRepost && originalPost
                                    ? originalPost.trust_score
                                    : post.trust_score;
                                return score != null ? (
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-medium flex items-center gap-1 ${
                                      score >= 70
                                        ? "bg-emerald-500/10 text-emerald-400"
                                        : score >= 40
                                          ? "bg-amber-500/10 text-amber-400"
                                          : "bg-rose-500/10 text-rose-400"
                                    }`}
                                  >
                                    <Shield className="w-3 h-3" />
                                    {Math.round(score)}
                                  </span>
                                ) : null;
                              })()}
                            </div>

                            {/* Timestamp */}
                            <div
                              className="flex items-center gap-1 text-[11px] text-muted-foreground"
                            >
                              <Clock className="w-3 h-3" />
                              <span>
                                {formatRelativeTime(
                                  isRepost && originalPost
                                    ? originalPost.created_at
                                    : post.created_at
                                )}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Hidden badge */}
                        {post.is_hidden && (
                          <span
                            className="px-2 py-0.5 rounded-full
                              bg-red-500/10 text-red-400 text-xs"
                          >
                            Hidden
                          </span>
                        )}

                        {/* Three-dot menu */}
                        <div className="relative" onClick={(e) => e.stopPropagation()}>
                          <button
                            className="p-1 rounded-full hover:bg-muted/30 text-muted-foreground
                              hover:text-foreground transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPostMenuId(postMenuId === post.id ? null : post.id);
                            }}
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>

                          {postMenuId === post.id && (
                            <div className="absolute right-0 top-full mt-1 bg-zinc-900 border
                              border-zinc-700 rounded-xl shadow-2xl py-1 w-44 z-50">
                              {/* Own post → Delete */}
                              {isOwnProfile && (
                                <button
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    setPostMenuId(null);
                                    if (!address) return;
                                    try {
                                      await deletePost(address, post.id);
                                      setPosts((prev) => prev.filter((p) => p.id !== post.id));
                                      toast({ title: "Post deleted" });
                                    } catch {
                                      toast({ title: "Failed to delete post", variant: "destructive" });
                                    }
                                  }}
                                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm
                                    text-red-400 hover:bg-zinc-800 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Delete Post
                                </button>
                              )}

                              {/* Other's post → Follow + Report */}
                              {!isOwnProfile && (
                                <>
                                  <button
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      if (!address) return;
                                      const targetWallet = isRepost && originalPost
                                        ? originalPost.wallet
                                        : post.wallet;
                                      if (!targetWallet) return;
                                      try {
                                        await followWallet(address, targetWallet);
                                        toast({ title: "Followed!" });
                                      } catch {
                                        toast({ title: "Already following", variant: "destructive" });
                                      }
                                      setPostMenuId(null);
                                    }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm
                                      text-zinc-100 hover:bg-zinc-800 transition-colors"
                                  >
                                    <UserPlus className="w-4 h-4 text-primary" />
                                    Follow {isRepost && originalPost
                                      ? (originalPost.handle ? `@${originalPost.handle}` : "User")
                                      : (post.handle ? `@${post.handle}` : "User")}
                                  </button>

                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setPostMenuId(null);
                                      toast({ title: "Report submitted" });
                                    }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm
                                      text-red-400 hover:bg-zinc-800 transition-colors"
                                  >
                                    <Flag className="w-4 h-4" />
                                    Report Post
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Content */}
                      <p className="text-sm text-foreground whitespace-pre-wrap">
                        {isRepost && originalPost ? originalPost.content : post.content}
                      </p>

                      {/* Post image */}
                      {(() => {
                        const imgUrl =
                          isRepost && originalPost
                            ? (originalPost as any).image_url
                            : (post as any).image_url;
                        return imgUrl ? (
                          <div
                            className="mt-2 rounded-xl overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <img
                              src={imgUrl}
                              alt="Post image"
                              className="w-full object-cover rounded-xl max-h-96"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          </div>
                        ) : null;
                      })()}

                      {/* Loading state for original post */}
                      {isRepost && !originalPost && (
                        <div className="h-4 bg-muted/30 rounded animate-pulse w-2/3" />
                      )}

                      {/* Action bar */}
                      <div
                        className="flex items-center gap-4 pt-1 text-xs text-muted-foreground
                          border-t border-border/30"
                      >
                        {/* Like button */}
                        <button
                          className={`flex items-center gap-1 transition-colors disabled:opacity-60 ${
                            likedPostIds.has(post.id)
                              ? "text-red-400 hover:text-red-300"
                              : "hover:text-red-400"
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLikePost(post);
                          }}
                          disabled={likeLoading[post.id]}
                        >
                          <Heart
                            className={`w-3.5 h-3.5 ${
                              likedPostIds.has(post.id) ? "fill-red-400" : ""
                            }`}
                          />
                          <span>{post.likes_count ?? post.like_count ?? 0}</span>
                        </button>

                        {/* Comment button */}
                        <button
                          className="flex items-center gap-1 hover:text-primary transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(
                              `/post/${
                                isRepost && post.repost_of ? post.repost_of : post.id
                              }`
                            );
                          }}
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>{post.replies_count ?? post.reply_count ?? 0}</span>
                        </button>

                        {/* Repost button with dropdown */}
                        <div className="relative">
                          <button
                            className={`flex items-center gap-1 transition-colors text-sm ${
                              repostedPostIds.has(post.repost_of ?? post.id ?? 0)
                                ? "text-green-400 hover:text-green-300"
                                : "text-muted-foreground hover:text-green-400"
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!publicKey) return;
                              const targetId =
                                post.is_repost && post.repost_of ? post.repost_of : post.id ?? null;
                              setRepostDropdownId(
                                repostDropdownId === post.id ? null : post.id ?? null
                              );
                              setRepostTargetId(targetId);
                            }}
                          >
                            <Repeat2 className="w-3.5 h-3.5" />
                            <span>{post.repost_count ?? 0}</span>
                          </button>

                          {repostDropdownId === post.id && (
                            <div
                              className="absolute bottom-full left-0 mb-2 bg-zinc-900 border border-zinc-700
                                rounded-xl shadow-2xl py-1 w-44 z-50"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {repostedPostIds.has(repostTargetId ?? repostDropdownId ?? 0) && (
                                <button
                                  onClick={() => {
                                    setRepostedPostIds((prev) => {
                                      const next = new Set(prev);
                                      next.delete(repostTargetId ?? repostDropdownId ?? 0);
                                      return next;
                                    });
                                    setRepostDropdownId(null);
                                    setRepostTargetId(null);
                                  }}
                                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm
                                    text-green-400 hover:bg-zinc-800 transition-colors"
                                >
                                  <Repeat2 className="w-4 h-4" />
                                  Undo Repost
                                </button>
                              )}

                              <button
                                onClick={async () => {
                                  if (!publicKey) return;
                                  try {
                                    await repostPost(
                                      publicKey.toString(),
                                      repostTargetId ?? repostDropdownId!
                                    );

                                    setRepostedPostIds((prev) => {
                                      const next = new Set(prev);
                                      next.add(repostTargetId ?? repostDropdownId ?? 0);
                                      return next;
                                    });

                                    setRepostDropdownId(null);
                                    setRepostTargetId(null);
                                  } catch (e) {
                                    console.error(e);
                                  }
                                }}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm
                                  text-zinc-100 hover:bg-zinc-800 transition-colors"
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
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm
                                  text-zinc-100 hover:bg-zinc-800 transition-colors"
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
                );
              })
            )}
          </div>
        )}

        {analyzing && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <div className="bg-gray-900 p-8 rounded-xl text-center">
              <div className="animate-pulse text-purple-400 text-lg mb-4">
                <img src="/blockid_logo.svg" alt="BlockID" className="w-5 h-5 object-contain inline-block mr-1" /> BlockID AI analyzing wallet...
              </div>
              <div className="text-gray-400 text-sm space-y-1">
                <div>Fetching transactions...</div>
                <div>Analyzing wallet behavior...</div>
                <div>Running risk model...</div>
                <div>Updating trust score...</div>
              </div>
            </div>
          </div>
        )}

        {investigationReportProps && (
          <ShareInvestigationModal
            open={shareInvestigationOpen}
            onOpenChange={setShareInvestigationOpen}
            {...investigationReportProps}
            onCopyReport={handleCopyInvestigationReport}
            onShareTwitter={handleShareInvestigationTwitter}
            onShareTelegram={handleShareInvestigationTelegram}
          />
        )}

        {showFollowModal !== null && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
            onClick={() => setShowFollowModal(null)}
          >
            <div
              className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-sm mx-4 max-h-[70vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-foreground capitalize">
                  {showFollowModal}
                </h3>
                <button onClick={() => setShowFollowModal(null)}>
                  <X className="w-5 h-5 text-muted-foreground hover:text-foreground" />
                </button>
              </div>

              {followListLoading ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Loading...
                </div>
              ) : followList.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No {showFollowModal} yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {followList.map((item: any, i: number) => {
                    const w =
                      item.wallet ?? item.from_wallet ?? item.to_wallet ?? "";
                    const h = item.handle;
                    const score =
                      item.trust_score ?? item.score;
                    return (
                      <div
                        key={i}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/20 transition-colors cursor-pointer"
                        onClick={() => {
                          if (w) {
                            setShowFollowModal(null);
                            navigate(`/profile/${w}`);
                          }
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-zinc-700 flex items-center justify-center text-sm font-bold text-foreground">
                            {(h ?? w)[0]?.toUpperCase() ?? "?"}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground flex items-center gap-1">
                              {h
                                ? `@${h}`
                                : w.length > 10
                                  ? `${w.slice(0, 6)}...${w.slice(-4)}`
                                  : w || "—"}
                              <SubscriptionBadge plan={item.plan ?? "free"} size="sm" />
                            </p>
                            {score !== undefined && (
                              <p className="text-xs text-muted-foreground">
                                Score: {Math.round(score)}
                              </p>
                            )}
                          </div>
                        </div>
                        {/* Follow / Follow Back button */}
                        {address && w && w !== address && (() => {
                          const viewerFollows = item.viewer_follows;
                          const followsViewer = item.follows_viewer;
                          // Already mutual — show nothing
                          if (viewerFollows && followsViewer) return null;
                          // Viewer already follows but they don't follow back — show nothing
                          if (viewerFollows && !followsViewer) return null;
                          // They follow viewer but viewer hasn't followed back
                          const isFollowBack = followsViewer && !viewerFollows;
                          return (
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (!address) return;
                                try {
                                  await followWallet(address, w);
                                  setFollowList((prev: any[]) =>
                                    prev.map((fi: any) =>
                                      (fi.wallet ?? fi.from_wallet ?? fi.to_wallet) === w
                                        ? { ...fi, viewer_follows: true }
                                        : fi
                                    )
                                  );
                                  // Update isFollowing if wallet matches viewed profile
                                  if (w === wallet) setIsFollowing(true);
                                } catch (e) {
                                  console.error(e);
                                }
                              }}
                              className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                                isFollowBack
                                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                                  : "bg-zinc-700 text-zinc-100 hover:bg-zinc-600"
                              }`}
                            >
                              {isFollowBack ? "Follow Back" : "Follow"}
                            </button>
                          );
                        })()}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {showNFTModal !== null && (
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70"
            onClick={() => setShowNFTModal(null)}
          >
            <div
              className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-foreground">
                  Choose NFT as{" "}
                  {showNFTModal === "avatar" ? "Avatar" : "Banner"}
                </h3>
                <button onClick={() => setShowNFTModal(null)}>
                  <X className="w-5 h-5 text-muted-foreground hover:text-foreground" />
                </button>
              </div>

              {nftsLoading ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Loading your NFTs...
                </div>
              ) : nfts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No NFTs found in this wallet.
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {nfts.map((nft: any) => (
                    <button
                      key={nft.mint ?? nft.id}
                      onClick={async () => {
                        if (!publicKey) return;
                        try {
                          if (showNFTModal === "avatar") {
                            const res = await setNFTAvatar(
                              publicKey.toString(),
                              nft.mint ?? nft.id
                            );
                            if (res.success) {
                              setProfile((p: any) => ({
                                ...p,
                                avatar_url: res.avatar_url ?? nft.image,
                                avatar_type: "NFT",
                                avatar_nft_mint: nft.mint,
                                avatar_nft_name: nft.name,
                              }));
                            }
                          } else {
                            const res = await setNFTBanner(
                              publicKey.toString(),
                              nft.mint ?? nft.id
                            );
                            if (res.success) {
                              setProfile((p: any) => ({
                                ...p,
                                banner_url: res.banner_url ?? nft.image,
                                banner_type: "NFT",
                              }));
                            }
                          }
                        } catch (err) {
                          console.error(err);
                        }
                        setShowNFTModal(null);
                      }}
                      className="relative aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-yellow-400 transition-all group"
                    >
                      {nft.image ? (
                        <img
                          src={nft.image}
                          alt={nft.name ?? "NFT"}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-xs text-muted-foreground p-1 text-center">
                          {nft.name ?? "NFT"}
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-1">
                        <p className="text-xs text-white truncate w-full">
                          {nft.name ?? "Select"}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {cropImage && cropType && (
          <ImageCropModal
            image={cropImage}
            aspectRatio={cropType === "avatar" ? 1 : 3.2}
            cropShape={cropType === "avatar" ? "round" : "rect"}
            title={cropType === "avatar" ? "Edit avatar" : "Edit banner"}
            onComplete={(blob) => {
              const previewUrl = URL.createObjectURL(blob);
              if (cropType === "avatar") {
                setPendingAvatarBlob(blob);
                setPendingAvatarPreview(previewUrl);
              } else {
                setPendingBannerBlob(blob);
                setPendingBannerPreview(previewUrl);
              }
              setIsCropActive(false);
              setCropImage(null);
              setCropType(null);
            }}
            onCancel={() => {
              setIsCropActive(false);
              setCropImage(null);
              setCropType(null);
            }}
          />
        )}
      </div>

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
                  <span className="text-sm font-semibold text-foreground">
                    {quoteModalPost.is_repost && quoteModalPost.original_post
                      ? quoteModalPost.original_post.handle
                        ? `@${quoteModalPost.original_post.handle}`
                        : `${quoteModalPost.original_post.wallet?.slice(0, 4)}...${quoteModalPost.original_post.wallet?.slice(-4)}`
                      : quoteModalPost.handle
                        ? `@${quoteModalPost.handle}`
                        : `${quoteModalPost.wallet?.slice(0, 4)}...${quoteModalPost.wallet?.slice(-4)}`}
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

      {editModalOpen && isOwnProfile && (
        <div
          className={`fixed inset-0 z-[55] flex items-start justify-center
            bg-black/70 pt-16 px-4 ${isCropActive ? "invisible" : "visible"}`}
          onClick={() => {
            setEditModalOpen(false);
            setPendingAvatarBlob(null);
            setPendingBannerBlob(null);
            if (pendingAvatarPreview) URL.revokeObjectURL(pendingAvatarPreview);
            if (pendingBannerPreview) URL.revokeObjectURL(pendingBannerPreview);
            setPendingAvatarPreview(null);
            setPendingBannerPreview(null);
          }}
        >
          <div
            className="bg-zinc-900 border border-zinc-700 rounded-2xl
              w-full max-w-lg shadow-2xl overflow-hidden
              max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4
              border-b border-zinc-800">
              <button
                onClick={() => setEditModalOpen(false)}
                className="p-1 rounded-full hover:bg-zinc-800 transition-colors"
              >
                <X className="w-5 h-5 text-foreground" />
              </button>
              <span className="text-sm font-bold text-foreground">
                Edit Profile
              </span>
              <button
                onClick={async () => {
                  if (!address || !publicKey) return;
                  setEditSaving(true);
                  try {
                    if (pendingAvatarBlob) {
                      const file = new File(
                        [pendingAvatarBlob],
                        "avatar.jpg",
                        { type: "image/jpeg" }
                      );
                      const res = await uploadAvatarPhoto(
                        publicKey.toString(),
                        file
                      );
                      if (res.success) {
                        setProfile((p: any) => ({
                          ...p,
                          avatar_url: res.avatar_url,
                          avatar_type: "PHOTO",
                        }));
                      }
                      setPendingAvatarBlob(null);
                      if (pendingAvatarPreview)
                        URL.revokeObjectURL(pendingAvatarPreview);
                      setPendingAvatarPreview(null);
                    }
                    if (pendingBannerBlob) {
                      const file = new File(
                        [pendingBannerBlob],
                        "banner.jpg",
                        { type: "image/jpeg" }
                      );
                      const res = await uploadBannerPhoto(
                        publicKey.toString(),
                        file
                      );
                      if (res.success) {
                        setProfile((p: any) => ({
                          ...p,
                          banner_url: res.banner_url,
                          banner_type: "PHOTO",
                        }));
                      }
                      setPendingBannerBlob(null);
                      if (pendingBannerPreview)
                        URL.revokeObjectURL(pendingBannerPreview);
                      setPendingBannerPreview(null);
                    }
                    const normalizedWebsite = editForm.website
                      ? editForm.website.startsWith("http")
                        ? editForm.website
                        : `https://${editForm.website}`
                      : "";
                    await updateProfile({
                      wallet: address,
                      session_token: getSessionToken(),
                      display_name: editForm.display_name,
                      display_name_source: editForm.display_name_source,
                      bio: editForm.bio,
                      website: normalizedWebsite,
                      location: editForm.location,
                    });
                    setProfile((prev: any) => ({
                      ...prev,
                      ...editForm,
                      website: normalizedWebsite,
                    }));
                    setEditModalOpen(false);
                    toast({ title: "Profile updated!" });
                  } catch (err: any) {
                    console.error("Update profile error:", err);
                    toast({
                      title: err?.message ?? "Failed to update",
                      variant: "destructive",
                    });
                  } finally {
                    setEditSaving(false);
                  }
                }}
                disabled={editSaving}
                className="px-4 py-1.5 rounded-full bg-white text-black
                  text-sm font-bold disabled:opacity-40
                  hover:bg-zinc-200 transition-colors"
              >
                {editSaving ? "Saving..." : "Save"}
              </button>
            </div>

            {/* Form */}
            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              {/* Avatar + Banner section */}
              <div className="relative mb-6">
                {/* Banner preview + edit - overflow only on image so dropdown is not clipped */}
                <div className="relative h-24 rounded-xl bg-zinc-800">
                  <div className="absolute inset-0 rounded-xl overflow-hidden">
                    {pendingBannerPreview || profile?.banner_url ? (
                      <div
                        className="absolute inset-0"
                        style={{
                          backgroundImage: `url(${pendingBannerPreview ?? profile?.banner_url})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }}
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-r from-zinc-800 via-zinc-700 to-zinc-800" />
                    )}
                  </div>
                  <div
                    className="absolute inset-0 pointer-events-none"
                    ref={bannerMenuRef}
                  >
                    <div className="absolute bottom-2 right-2 pointer-events-auto">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setModalBannerMenu((prev) => !prev);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white text-xs font-medium backdrop-blur-sm border border-white/10 transition-all"
                      >
                      <Camera className="w-3.5 h-3.5" />
                      Edit Banner
                    </button>

                      {modalBannerMenu && (
                        <div className="absolute top-full right-0 mt-1 z-[9999] bg-[#1a1830] border border-white/10 rounded-xl shadow-2xl py-1 w-48 overflow-hidden">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setModalBannerMenu(false);
                            bannerInputRef.current?.click();
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-200 hover:bg-white/5 transition-colors text-left"
                        >
                          <Camera className="w-4 h-4" />
                          Choose Photo
                        </button>
                        <button
                          type="button"
                          onClick={async (e) => {
                            e.stopPropagation();
                            setModalBannerMenu(false);
                            setNftsLoading(true);
                            try {
                              const data = await getWalletNFTs(wallet);
                              const nftsList = data.nfts ?? data ?? [];
                              setNfts(nftsList);
                              setNftsLoading(false);
                              if (nftsList.length === 0) {
                                toast({
                                  title: "No NFTs found in this wallet",
                                  description: "Buy or mint an NFT to use as banner",
                                });
                                return;
                              }
                              setShowNFTModal("banner");
                            } catch {
                              setNfts([]);
                              setNftsLoading(false);
                              toast({
                                title: "No NFTs found in this wallet",
                                description: "Buy or mint an NFT to use as banner",
                              });
                            }
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-200 hover:bg-white/5 transition-colors text-left"
                        >
                          <Image className="w-4 h-4 text-yellow-400" />
                          Choose NFT
                        </button>
                        {(pendingBannerPreview || profile?.banner_url) && (
                          <button
                            type="button"
                            onClick={async (e) => {
                              e.stopPropagation();
                              setModalBannerMenu(false);
                              if (pendingBannerPreview) {
                                setPendingBannerBlob(null);
                                URL.revokeObjectURL(pendingBannerPreview);
                                setPendingBannerPreview(null);
                              } else if (publicKey) {
                                try {
                                  await removeBanner(publicKey.toString());
                                  setProfile((p: any) => ({
                                    ...p,
                                    banner_url: null,
                                    banner_type: "NONE",
                                  }));
                                } catch {}
                              }
                            }}
                            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-white/5 transition-colors text-left"
                          >
                            <Trash2 className="w-4 h-4" />
                            Remove Banner
                          </button>
                        )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <input
                  ref={bannerInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  className="hidden"
                  onChange={(e) => handleFileSelect(e, "banner")}
                />

                {/* Avatar preview + edit */}
                <div className="absolute -bottom-8 left-4" ref={avatarMenuRef}>
                  <div className="relative w-16 h-16">
                    {pendingAvatarPreview || profile?.avatar_url ? (
                      <img
                        src={pendingAvatarPreview ?? profile?.avatar_url}
                        alt="avatar"
                        className="w-16 h-16 rounded-full object-cover border-2 border-zinc-900"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-zinc-700 border-2 border-zinc-900 flex items-center justify-center text-xl font-bold text-foreground">
                        {(profile?.handle ?? wallet ?? "?")[0]?.toUpperCase()}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setModalAvatarMenu((prev) => !prev);
                      }}
                      className="absolute inset-0 rounded-full bg-black/50 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
                    >
                      <Camera className="w-4 h-4 text-white" />
                    </button>

                    {modalAvatarMenu && (
                      <div className="absolute top-full left-0 mt-1 z-[9999] bg-[#1a1830] border border-white/10 rounded-xl shadow-2xl py-1 w-48 overflow-hidden">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setModalAvatarMenu(false);
                            avatarInputRef.current?.click();
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-200 hover:bg-white/5 transition-colors text-left"
                        >
                          <Camera className="w-4 h-4" />
                          Choose Photo
                        </button>
                        <button
                          type="button"
                          onClick={async (e) => {
                            e.stopPropagation();
                            setModalAvatarMenu(false);
                            setNftsLoading(true);
                            try {
                              const data = await getWalletNFTs(wallet);
                              const nftsList = data.nfts ?? data ?? [];
                              setNfts(nftsList);
                              setNftsLoading(false);
                              if (nftsList.length === 0) {
                                toast({
                                  title: "No NFTs found in this wallet",
                                  description: "Buy or mint an NFT to use as avatar",
                                });
                                return;
                              }
                              setShowNFTModal("avatar");
                            } catch {
                              setNfts([]);
                              setNftsLoading(false);
                              toast({
                                title: "No NFTs found in this wallet",
                                description: "Buy or mint an NFT to use as avatar",
                              });
                            }
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-200 hover:bg-white/5 transition-colors text-left"
                        >
                          <Image className="w-4 h-4 text-yellow-400" />
                          Choose NFT
                        </button>
                        {(pendingAvatarPreview || profile?.avatar_url) && (
                          <button
                            type="button"
                            onClick={async (e) => {
                              e.stopPropagation();
                              setModalAvatarMenu(false);
                              if (pendingAvatarPreview) {
                                setPendingAvatarBlob(null);
                                URL.revokeObjectURL(pendingAvatarPreview);
                                setPendingAvatarPreview(null);
                              } else if (publicKey) {
                                try {
                                  await removeAvatar(publicKey.toString());
                                  setProfile((p: any) => ({
                                    ...p,
                                    avatar_url: null,
                                    avatar_type: "NONE",
                                  }));
                                } catch {}
                              }
                            }}
                            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-white/5 transition-colors text-left"
                          >
                            <Trash2 className="w-4 h-4" />
                            Remove
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  className="hidden"
                  onChange={(e) => handleFileSelect(e, "avatar")}
                />
              </div>

              {/* Spacer for avatar overflow */}
              <div className="h-10" />

              {/* Display Name — dropdown from on-chain names */}
              <div>
                <label className="text-xs font-medium text-muted-foreground
                  uppercase tracking-wider block mb-1.5">
                  Display Name
                </label>
                <select
                  value={editForm.display_name}
                  onChange={(e) => {
                    const selected = walletNames.find(
                      (n: any) => n.name === e.target.value
                    );
                    setEditForm((prev) => ({
                      ...prev,
                      display_name: e.target.value,
                      display_name_source: selected?.source ?? "WALLET",
                    }));
                  }}
                  className="w-full px-4 py-2.5 bg-zinc-800 border
                    border-zinc-700 rounded-lg text-foreground text-sm
                    focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="">
                    {wallet
                      ? `${wallet.slice(0, 4)}...${wallet.slice(-4)}`
                      : "Wallet address"}
                  </option>
                  {walletNames.map((n: any) => (
                    <option key={n.name} value={n.name}>
                      {n.display} ({n.source})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground mt-1">
                  Choose from your on-chain names — BlockID handle, .sol, .abc
                </p>
              </div>

              {/* Bio */}
              <div>
                <label className="text-xs font-medium text-muted-foreground
                  uppercase tracking-wider block mb-1.5">
                  Bio
                </label>
                <textarea
                  rows={3}
                  maxLength={160}
                  value={editForm.bio}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, bio: e.target.value }))
                  }
                  placeholder="Tell the network about yourself..."
                  className="w-full px-4 py-2.5 bg-zinc-800 border
                    border-zinc-700 rounded-lg text-foreground
                    placeholder:text-muted-foreground text-sm
                    focus:outline-none focus:ring-2 focus:ring-primary/50
                    resize-none"
                />
                <p className="text-xs text-muted-foreground text-right mt-0.5">
                  {editForm.bio.length}/160
                </p>
              </div>

              {/* Location */}
              <div>
                <label className="text-xs font-medium text-muted-foreground
                  uppercase tracking-wider block mb-1.5">
                  Location
                </label>
                <input
                  type="text"
                  maxLength={100}
                  value={editForm.location}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      location: e.target.value,
                    }))
                  }
                  placeholder="Jakarta, Indonesia"
                  className="w-full px-4 py-2.5 bg-zinc-800 border
                    border-zinc-700 rounded-lg text-foreground
                    placeholder:text-muted-foreground text-sm
                    focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              {/* Website */}
              <div>
                <label className="text-xs font-medium text-muted-foreground
                  uppercase tracking-wider block mb-1.5">
                  Website
                </label>
                <input
                  type="url"
                  maxLength={255}
                  value={editForm.website}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      website: e.target.value,
                    }))
                  }
                  placeholder="https://your-website.com"
                  className="w-full px-4 py-2.5 bg-zinc-800 border
                    border-zinc-700 rounded-lg text-foreground
                    placeholder:text-muted-foreground text-sm
                    focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Profile;
