import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useState } from "react";
import {
  Search,
  UserCircle,
  Image,
  Shield,
  MessageSquare,
  Zap,
  Send,
  Globe,
  HeadphonesIcon,
  ChevronRight,
} from "lucide-react";

const API_BASE =
  import.meta.env.VITE_SOCIAL_API_URL ??
  "https://blockid-backend-production.up.railway.app";

type SubInfo = { plan: string; scans_used: number; scans_limit: number };

const PremiumHub = () => {
  const { t } = useTranslation();
  const { publicKey } = useWallet();
  const navigate = useNavigate();
  const [sub, setSub] = useState<SubInfo>({
    plan: "free",
    scans_used: 0,
    scans_limit: 50,
  });

  useEffect(() => {
    if (!publicKey) return;
    fetch(`${API_BASE}/social/subscription/${publicKey.toString()}`)
      .then((r) => r.json())
      .then((d) =>
        setSub({
          plan: d.plan ?? "free",
          scans_used: d.scans_used ?? 0,
          scans_limit: d.scans_limit ?? 50,
        })
      )
      .catch(() => {});
  }, [publicKey]);

  const plan = sub.plan;
  const isPro = plan === "pro";
  const isExplorer = plan === "explorer";
  const isFree = !isPro && !isExplorer;

  const features = [
    {
      icon: Search,
      title: t("premium.wallet_scans", "Wallet Scans"),
      value: isPro
        ? t("premium.unlimited", "Unlimited")
        : isExplorer
          ? "250 / " + t("premium.month", "month")
          : "50 / " + t("premium.month", "month"),
      desc: t(
        "premium.wallet_scans_desc",
        "Scan any Solana wallet to see its trust score, behavioral patterns, risk alerts, and transaction history. Each scan runs our ML engine + Daemon Protocol Cyclops analysis."
      ),
      available: true,
    },
    {
      icon: UserCircle,
      title: t("premium.handle_claim", "@Handle Claim"),
      value: isPro
        ? "3 @handles"
        : isExplorer
          ? "1 @handle"
          : t("premium.not_available", "Not available"),
      desc: t(
        "premium.handle_desc",
        "Claim a unique @handle that maps to your wallet address. Use it across BlockID social layer and Smart Router. Recipients see your @handle instead of a long wallet address."
      ),
      available: !isFree,
    },
    {
      icon: Image,
      title: t("premium.nft_avatar", "NFT Avatar"),
      value: isPro
        ? t("premium.unlimited", "Unlimited")
        : isExplorer
          ? "3 / " + t("premium.month", "month")
          : t("premium.not_available", "Not available"),
      desc: t(
        "premium.nft_avatar_desc",
        "Mint a custom NFT as your profile picture. Upload any image (JPG, PNG, GIF, WebP), crop it, and mint directly on Solana. Your NFT avatar gets a gold border on your profile. Cost: 0.01 SOL per mint."
      ),
      available: !isFree,
    },
    {
      icon: Shield,
      title: t("premium.verified_badge", "Verified Badge"),
      value: isPro
        ? t("premium.gold_badge", "Gold Badge")
        : isExplorer
          ? t("premium.blue_badge", "Blue Badge")
          : t("premium.not_available", "Not available"),
      desc: t(
        "premium.badge_desc",
        "A verified badge appears next to your @handle on posts, profile, and Smart Router confirmations. Blue badge for Explorer, Gold badge for Pro. Shows other users you are a trusted member."
      ),
      available: !isFree,
    },
    {
      icon: MessageSquare,
      title: t("premium.social_layer", "Social Layer"),
      value: t("premium.full_access", "Full Access"),
      desc: t(
        "premium.social_desc",
        "Post, comment, like, repost, quote, and follow other wallets. Content moderation protects the community with 3-layer filtering. Link previews auto-generated from shared URLs."
      ),
      available: true,
    },
    {
      icon: Zap,
      title: t("premium.trust_score", "AI Trust Score"),
      value: t("premium.included", "Included"),
      desc: t(
        "premium.trust_desc",
        "Every wallet gets a behavioral trust score (0-100) powered by ML. RandomForest model trained on 135+ labeled wallets analyzes 8 features including transaction patterns, NFT behavior, and scam proximity."
      ),
      available: true,
    },
    {
      icon: Send,
      title: t("premium.smart_router", "Smart Router"),
      value: t("premium.included", "Included"),
      desc: t(
        "premium.router_desc",
        "Type 'send 1 SOL to @blockid' in any of 100+ languages. AI parses your intent, resolves the @handle, shows trust score and badges, then executes the transaction. Also supports token swaps via Jupiter."
      ),
      available: true,
    },
    {
      icon: Globe,
      title: t("premium.multilingual", "100+ Languages"),
      value: t("premium.included", "Included"),
      desc: t(
        "premium.multilingual_desc",
        "Full interface available in English, Indonesian, Japanese, Korean, Chinese, Spanish, and Arabic. Smart Router AI parser understands natural language input in 100+ languages."
      ),
      available: true,
    },
    {
      icon: HeadphonesIcon,
      title: t("premium.priority_support", "Priority Support"),
      value: isPro
        ? t("premium.included", "Included")
        : t("premium.not_available", "Not available"),
      desc: t(
        "premium.support_desc",
        "Pro users get priority response via Crisp live chat. Direct access to the development team for bug reports, feature requests, and account issues."
      ),
      available: isPro,
    },
  ];

  const planColors = {
    free: "from-zinc-500 to-zinc-600",
    explorer: "from-blue-500 to-cyan-500",
    pro: "from-amber-500 to-yellow-500",
  };

  const planLabels = {
    free: "Free",
    explorer: "Explorer",
    pro: "Pro",
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6 pb-12">
        {/* Header */}
        <div className="text-center space-y-3 pt-4">
          <div
            className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r ${planColors[plan as keyof typeof planColors] ?? planColors.free} text-white text-xs font-bold uppercase tracking-wider`}
          >
            <Shield className="w-3.5 h-3.5" />
            {planLabels[plan as keyof typeof planLabels] ?? "Free"} Plan
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            {t("premium.title", "Your BlockID Plan")}
          </h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            {isFree
              ? t(
                  "premium.subtitle_free",
                  "You're on the Free plan. Upgrade to unlock more features."
                )
              : t(
                  "premium.subtitle_paid",
                  "Here's everything included in your plan."
                )}
          </p>
        </div>

        {/* Usage bar */}
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-foreground">
              {t("premium.scans_usage", "Wallet Scans")}
            </p>
            <p className="text-sm text-muted-foreground">
              {sub.scans_used} /{" "}
              {isPro
                ? t("premium.unlimited", "Unlimited")
                : sub.scans_limit}
            </p>
          </div>
          {!isPro && (
            <div className="w-full h-2 rounded-full bg-muted/30 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-emerald-500 transition-all"
                style={{
                  width: `${Math.min((sub.scans_used / sub.scans_limit) * 100, 100)}%`,
                }}
              />
            </div>
          )}
        </div>

        {/* Features list */}
        <div className="space-y-3">
          {features.map((f) => (
            <div
              key={f.title}
              className={`glass-card p-5 transition-all ${!f.available ? "opacity-50" : ""}`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${f.available ? "bg-primary/10" : "bg-muted/20"}`}
                >
                  <f.icon
                    className={`w-5 h-5 ${f.available ? "text-primary" : "text-muted-foreground"}`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h3 className="text-sm font-bold text-foreground">
                      {f.title}
                    </h3>
                    <span
                      className={`text-xs font-semibold px-2.5 py-0.5 rounded-full shrink-0 ${
                        f.available
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-muted/20 text-muted-foreground"
                      }`}
                    >
                      {f.value}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {f.desc}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        {isFree && (
          <div className="glass-card p-6 text-center space-y-3">
            <h3 className="text-lg font-bold text-foreground">
              {t("premium.unlock_more", "Unlock More with Explorer or Pro")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t(
                "premium.unlock_desc",
                "Get @handles, NFT avatars, verified badges, and more wallet scans."
              )}
            </p>
            <button
              type="button"
              onClick={() => navigate("/upgrade")}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors"
            >
              {t("premium.view_plans", "View Plans")}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {isExplorer && (
          <div className="glass-card p-6 text-center space-y-3">
            <h3 className="text-lg font-bold text-foreground">
              {t("premium.upgrade_pro", "Upgrade to Pro")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t(
                "premium.upgrade_pro_desc",
                "Get unlimited scans, 3 handles, unlimited NFT avatars, and gold badge."
              )}
            </p>
            <button
              type="button"
              onClick={() => navigate("/upgrade")}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold text-sm hover:opacity-90 transition-colors"
            >
              {t("premium.go_pro", "Go Pro")}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        <p className="text-[10px] text-muted-foreground/50 text-center">
          {t(
            "premium.manage_note",
            "Manage your subscription in Settings or contact support via live chat."
          )}
        </p>
      </div>
    </DashboardLayout>
  );
};

export default PremiumHub;
