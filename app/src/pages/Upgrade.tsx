import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import {
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  Connection,
} from "@solana/web3.js";
import {
  createTransferInstruction,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { Check, X, Crown } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useSubscription } from "@/hooks/useSubscription";
import { useToast } from "@/hooks/use-toast";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ??
  "https://blockid-backend-production.up.railway.app";

const TREASURY = new PublicKey(
  "4DdLPRDiLRY8Q2E4Fv31kvcfMf3XJf11HgaSaW7tKVcx"
);
const USDC_MINT = new PublicKey(
  "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
);

const PLANS: Record<
  "explorer" | "pro",
  { monthly: number; annual: number; monthlySOL: number; annualSOL: number }
> = {
  explorer: {
    monthly: 9,
    annual: 86.4,
    monthlySOL: 0, // calculated real-time
    annualSOL: 0,
  },
  pro: {
    monthly: 29,
    annual: 278.4,
    monthlySOL: 0,
    annualSOL: 0,
  },
};

export default function Upgrade() {
  const { t } = useTranslation();
  const { publicKey, signTransaction } = useWallet();
  const { connection } = useConnection();
  const sub = useSubscription();
  const { toast } = useToast();

  const PUBLIC_RPC = "https://api.mainnet-beta.solana.com";

  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
  const [payToken, setPayToken] = useState<"USDC" | "SOL">("USDC");
  const [solPrice, setSolPrice] = useState<number>(0);
  const [loading, setLoading] = useState<string | null>(null); // "explorer" | "pro"
  const [paying, setPaying] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState<{
    plan: string;
    period: string;
  } | null>(null);

  // Fetch SOL price from Jupiter
  const fetchSolPrice = async () => {
    // Try Jupiter v2 first, fallback to CoinGecko
    let price = 0;
    try {
      const res = await fetch(
        "https://api.jup.ag/price/v2?ids=So11111111111111111111111111111111111111112"
      );
      const data = await res.json();
      price =
        data?.data?.["So11111111111111111111111111111111111111112"]
          ?.price ?? 0;
    } catch {
      // fallback to CoinGecko
      try {
        const res = await fetch(
          "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd"
        );
        const data = await res.json();
        price = data?.solana?.usd ?? 0;
      } catch {
        price = 0;
      }
    }
    setSolPrice(price);
    return price;
  };

  // Pay with USDC
  const payWithUSDC = async (
    plan: "explorer" | "pro",
    period: "monthly" | "annual"
  ) => {
    if (!publicKey || !signTransaction) return;
    const amount = PLANS[plan][period];
    const amountRaw = Math.round(amount * 1_000_000); // USDC 6 decimals

    const fromATA = await getAssociatedTokenAddress(USDC_MINT, publicKey);
    const toATA = await getAssociatedTokenAddress(USDC_MINT, TREASURY);

    let blockhash: string;
    let lastValidBlockHeight: number;
    try {
      const result = await connection.getLatestBlockhash();
      blockhash = result.blockhash;
      lastValidBlockHeight = result.lastValidBlockHeight;
    } catch {
      // fallback to public RPC
      const fallbackConn = new Connection(PUBLIC_RPC, "confirmed");
      const result = await fallbackConn.getLatestBlockhash();
      blockhash = result.blockhash;
      lastValidBlockHeight = result.lastValidBlockHeight;
    }

    const tx = new Transaction({
      recentBlockhash: blockhash,
      feePayer: publicKey,
    }).add(
      createTransferInstruction(
        fromATA,
        toATA,
        publicKey,
        amountRaw,
        [],
        TOKEN_PROGRAM_ID
      )
    );

    const signed = await signTransaction(tx);
    const sig = await connection.sendRawTransaction(signed.serialize());
    await connection.confirmTransaction(
      { signature: sig, blockhash, lastValidBlockHeight },
      "confirmed"
    );
    return sig;
  };

  // Pay with SOL
  const payWithSOL = async (
    plan: "explorer" | "pro",
    period: "monthly" | "annual"
  ) => {
    if (!publicKey || !signTransaction) return;
    const price = await fetchSolPrice();
    if (!price)
      throw new Error(
        t("upgrade.err_fetch_sol_price", "Could not fetch SOL price")
      );

    const usdAmount = PLANS[plan][period];
    const solAmount = usdAmount / price;
    // Add 1% buffer for slippage
    const lamports = Math.round(solAmount * 1.01 * LAMPORTS_PER_SOL);

    let blockhash: string;
    let lastValidBlockHeight: number;
    try {
      const result = await connection.getLatestBlockhash();
      blockhash = result.blockhash;
      lastValidBlockHeight = result.lastValidBlockHeight;
    } catch {
      // fallback to public RPC
      const fallbackConn = new Connection(PUBLIC_RPC, "confirmed");
      const result = await fallbackConn.getLatestBlockhash();
      blockhash = result.blockhash;
      lastValidBlockHeight = result.lastValidBlockHeight;
    }

    const tx = new Transaction({
      recentBlockhash: blockhash,
      feePayer: publicKey,
    }).add(
      SystemProgram.transfer({
        fromPubkey: publicKey,
        toPubkey: TREASURY,
        lamports,
      })
    );

    const signed = await signTransaction(tx);
    const sig = await connection.sendRawTransaction(signed.serialize());
    await connection.confirmTransaction(
      { signature: sig, blockhash, lastValidBlockHeight },
      "confirmed"
    );
    return sig;
  };

  // Handle upgrade
  const handleUpgrade = async (plan: "explorer" | "pro") => {
    if (!publicKey) {
      toast({
        title: t("upgrade.connect_wallet_first", "Connect your wallet first"),
        variant: "destructive",
      });
      return;
    }
    setPaying(plan);
    try {
      let sig: string | undefined;
      if (payToken === "USDC") {
        sig = await payWithUSDC(plan, billing);
      } else {
        sig = await payWithSOL(plan, billing);
      }
      if (!sig)
        throw new Error(
          t("upgrade.err_transaction_failed", "Transaction failed")
        );

      // Notify backend
      const res = await fetch(`${API_BASE}/social/subscription/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet: publicKey.toString(),
          plan,
          period: billing,
          tx_signature: sig,
          token: payToken,
        }),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(
          data.detail ?? t("upgrade.err_upgrade_failed", "Upgrade failed")
        );

      // Show welcome modal instead of reload
      setShowWelcome({ plan, period: billing });
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : t("upgrade.err_payment_failed", "Payment failed");
      toast({ title: msg, variant: "destructive" });
    } finally {
      setPaying(null);
    }
  };

  const currentPlan = sub.plan ?? "free";

  const unlimitedLabel = t("upgrade.unlimited");

  const features = [
    {
      category: t("upgrade.cat_identity"),
      items: [
        {
          name: t("upgrade.ft_public_profile"),
          free: true,
          explorer: true,
          pro: true,
        },
        {
          name: t("upgrade.ft_trust_score"),
          free: true,
          explorer: true,
          pro: true,
        },
        {
          name: t("upgrade.ft_nft_identity"),
          free: true,
          explorer: true,
          pro: true,
        },
        {
          name: t("upgrade.ft_handle_claim"),
          free: false,
          explorer: t("upgrade.one_handle"),
          pro: t("upgrade.three_handles"),
        },
        {
          name: t("upgrade.ft_nft_avatar"),
          free: false,
          explorer: t("upgrade.three_per_month"),
          pro: unlimitedLabel,
        },
      ],
    },
    {
      category: t("upgrade.cat_social"),
      items: [
        {
          name: t("upgrade.ft_unlimited_posts"),
          free: true,
          explorer: true,
          pro: true,
        },
        {
          name: t("upgrade.ft_follow"),
          free: true,
          explorer: true,
          pro: true,
        },
        {
          name: t("upgrade.ft_dm"),
          free: true,
          explorer: true,
          pro: true,
        },
        {
          name: t("upgrade.ft_wallet_scans"),
          free: "50",
          explorer: "250",
          pro: unlimitedLabel,
        },
      ],
    },
    {
      category: t("upgrade.cat_access"),
      items: [
        {
          name: t("upgrade.ft_early_access"),
          free: false,
          explorer: false,
          pro: true,
        },
        {
          name: t("upgrade.ft_priority_support"),
          free: false,
          explorer: false,
          pro: true,
        },
        {
          name: t("upgrade.ft_blue_tick"),
          free: false,
          explorer: true,
          pro: false,
        },
        {
          name: t("upgrade.ft_gold_tick"),
          free: false,
          explorer: false,
          pro: true,
        },
      ],
    },
  ];

  const upgradeCtaLabel = (plan: "explorer" | "pro") => {
    if (payToken === "SOL") return t("upgrade.pay_sol");
    const amount =
      plan === "explorer"
        ? `$${billing === "monthly" ? 9 : 86.4}`
        : `$${billing === "monthly" ? 29 : 278.4}`;
    return t("upgrade.upgrade_with", { amount, token: payToken });
  };

  const renderCell = (val: boolean | string) => {
    if (val === true)
      return <Check className="w-4 h-4 text-green-400 mx-auto" />;
    if (val === false)
      return <X className="w-4 h-4 text-zinc-600 mx-auto" />;
    if (typeof val === "string" && val === unlimitedLabel) {
      return (
        <span className="text-xs text-zinc-300 font-medium">{val}</span>
      );
    }
    if (typeof val === "string" && /^\d+$/.test(val)) {
      return (
        <span className="text-xs text-zinc-300 font-medium">
          {val}
          {t("upgrade.per_month")}
        </span>
      );
    }
    if (typeof val === "string" && val.includes("/month")) {
      return (
        <span className="text-xs text-zinc-300 font-medium">
          {val.replace("/month", t("upgrade.per_month"))}
        </span>
      );
    }
    return <span className="text-xs text-zinc-300 font-medium">{val}</span>;
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-10">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            {t("upgrade.title")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("upgrade.subtitle")}
          </p>
        </div>

        {/* Billing toggle */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setBilling("monthly")}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors
              ${billing === "monthly" ? "bg-zinc-700 text-white" : "text-zinc-400 hover:text-white"}`}
          >
            {t("upgrade.monthly")}
          </button>
          <button
            onClick={() => setBilling("annual")}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors
              ${billing === "annual" ? "bg-zinc-700 text-white" : "text-zinc-400 hover:text-white"}`}
          >
            {t("upgrade.annual", "Annual")}
            <span className="ml-2 px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-xs font-bold">
              {t("upgrade.annual_discount", "20% off")}
            </span>
          </button>
        </div>

        {/* Pay with toggle */}
        <div className="flex items-center justify-center gap-2">
          <span className="text-xs text-zinc-500">
            {t("upgrade.payment_method", "Payment Method:")}
          </span>
          {(["USDC", "SOL"] as const).map((token) => (
            <button
              key={token}
              onClick={() => setPayToken(token)}
              className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all
                ${payToken === token ? "bg-blue-500/20 border-blue-500/40 text-blue-400" : "border-zinc-700 text-zinc-500 hover:text-zinc-300"}`}
            >
              {token}
            </button>
          ))}
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-3 gap-4">
          {/* Free */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-4">
            <div>
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">
                {t("upgrade.free_tier", "Free")}
              </p>
              <p className="text-4xl font-bold">$0</p>
              <p className="text-xs text-zinc-500 mt-1">
                {t("upgrade.forever_free", "forever free")}
              </p>
            </div>
            <ul className="space-y-2 text-xs text-zinc-400">
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                {t("upgrade.feat_public_profile")}
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                {t("upgrade.feat_50_scans")}
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                {t("upgrade.feat_social_access")}
              </li>
            </ul>
            <button
              disabled
              className="w-full py-2.5 rounded-xl border border-zinc-700 text-zinc-500 text-sm font-semibold cursor-not-allowed"
            >
              {currentPlan === "free"
                ? t("upgrade.current_plan")
                : t("upgrade.free_tier", "Free")}
            </button>
          </div>

          {/* Explorer */}
          <div className="rounded-2xl border border-blue-500/40 bg-zinc-900/80 p-6 space-y-4 shadow-lg shadow-blue-500/10 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="px-3 py-1 rounded-full bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-500/30">
                {t("upgrade.most_popular")}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <p className="text-xs font-bold text-blue-400 uppercase tracking-widest">
                  {t("upgrade.explorer")}
                </p>
                <span className="text-blue-400 text-sm">✓</span>
              </div>
              <p className="text-4xl font-bold text-blue-400">
                ${billing === "monthly" ? 9 : (86.4 / 12).toFixed(2)}
              </p>
              <p className="text-xs text-zinc-500 mt-1">
                {billing === "monthly"
                  ? t("upgrade.per_month_label")
                  : t("upgrade.billed_annually", { amount: "86.40" })}
              </p>
            </div>
            <ul className="space-y-2 text-xs text-zinc-400">
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                {t("upgrade.feat_250_scans")}
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                {t("upgrade.feat_handle_1")}
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                {t("upgrade.feat_nft_avatar_3x")}
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                {t("upgrade.feat_blue_tick")}
              </li>
            </ul>
            <button
              onClick={() => handleUpgrade("explorer")}
              disabled={
                paying === "explorer" ||
                currentPlan === "explorer" ||
                currentPlan === "pro"
              }
              className="w-full py-2.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-white text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {paying === "explorer"
                ? t("upgrade.processing")
                : currentPlan === "explorer"
                  ? t("upgrade.current_plan")
                  : currentPlan === "pro"
                    ? t("upgrade.downgrade")
                    : upgradeCtaLabel("explorer")}
            </button>
          </div>

          {/* PRO */}
          <div className="rounded-2xl border border-purple-500/40 bg-zinc-900/80 p-6 space-y-4 shadow-lg shadow-purple-500/10">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <p className="text-xs font-bold text-purple-400 uppercase tracking-widest">
                  {t("upgrade.pro")}
                </p>
                <Crown className="w-3.5 h-3.5 text-purple-400" />
              </div>
              <p className="text-4xl font-bold text-purple-400">
                ${billing === "monthly" ? 29 : (278.4 / 12).toFixed(2)}
              </p>
              <p className="text-xs text-zinc-500 mt-1">
                {billing === "monthly"
                  ? t("upgrade.per_month_label")
                  : t("upgrade.billed_annually", { amount: "278.40" })}
              </p>
            </div>
            <ul className="space-y-2 text-xs text-zinc-400">
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                {t("upgrade.feat_unlimited_scans")}
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                {t("upgrade.feat_handle_3")}
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                {t("upgrade.feat_nft_avatar_unlimited")}
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                {t("upgrade.feat_gold_tick")}
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                {t("upgrade.feat_priority_support")}
              </li>
            </ul>
            <button
              onClick={() => handleUpgrade("pro")}
              disabled={paying === "pro" || currentPlan === "pro"}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-500 hover:opacity-90 text-white text-sm font-bold transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {paying === "pro"
                ? t("upgrade.processing")
                : currentPlan === "pro"
                  ? t("upgrade.current_plan")
                  : upgradeCtaLabel("pro")}
            </button>
          </div>
        </div>

        {/* Feature comparison table */}
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-center">
            {t("upgrade.compare_plans", "Compare Plans & Features")}
          </h2>
          {features.map((section, sIdx) => (
            <div
              key={sIdx}
              className="rounded-2xl border border-zinc-800 overflow-hidden"
            >
              <div className="grid grid-cols-4 bg-zinc-800/50 px-4 py-3">
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                  {section.category}
                </p>
                <p className="text-xs font-bold text-zinc-400 text-center">
                  {t("upgrade.free")}
                </p>
                <p className="text-xs font-bold text-blue-400 text-center">
                  {t("upgrade.explorer")}
                </p>
                <p className="text-xs font-bold text-purple-400 text-center">
                  {t("upgrade.pro")}
                </p>
              </div>
              {section.items.map((item, i) => (
                <div
                  key={`${sIdx}-${i}`}
                  className={`grid grid-cols-4 px-4 py-3 items-center ${
                    i % 2 === 0 ? "bg-zinc-900/30" : "bg-transparent"
                  }`}
                >
                  <p className="text-xs text-zinc-300">{item.name}</p>
                  <div className="text-center">
                    {renderCell(item.free as boolean | string)}
                  </div>
                  <div className="text-center">
                    {renderCell(item.explorer as boolean | string)}
                  </div>
                  <div className="text-center">
                    {renderCell(item.pro as boolean | string)}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Note */}
        <p className="text-center text-xs text-zinc-600">
          {t("upgrade.payment_note")}
        </p>
      </div>
      {showWelcome && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => {
            setShowWelcome(null);
            window.location.reload();
          }}
        >
          <div
            className="bg-card border border-border rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative h-40 bg-gradient-to-br from-primary via-primary/80 to-emerald-500 flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent)]" />
              <div className="text-center relative z-10">
                <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  {showWelcome.plan === "pro" ? (
                    <svg
                      className="w-8 h-8 text-yellow-300"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z" />
                    </svg>
                  ) : (
                    <svg
                      className="w-8 h-8 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  )}
                </div>
                <h2 className="text-xl font-bold text-white">
                  {t("upgrade.welcome_title", {
                    plan: showWelcome.plan === "pro" ? "Pro" : "Explorer",
                  })}
                </h2>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                {t("upgrade.welcome_subtitle")}
              </p>

              <div className="space-y-3">
                {(showWelcome.plan === "pro"
                  ? [
                      {
                        icon: "scan",
                        title: t("upgrade.welcome_unlimited_scans"),
                        desc: t("upgrade.welcome_unlimited_desc"),
                      },
                      {
                        icon: "handle",
                        title: t("upgrade.welcome_handles"),
                        desc: t("upgrade.welcome_handles_desc"),
                      },
                      {
                        icon: "nft",
                        title: t("upgrade.welcome_nft"),
                        desc: t("upgrade.welcome_nft_desc"),
                      },
                      {
                        icon: "badge",
                        title: t("upgrade.welcome_gold_badge"),
                        desc: t("upgrade.welcome_gold_desc"),
                      },
                    ]
                  : [
                      {
                        icon: "scan",
                        title: t("upgrade.welcome_250_scans"),
                        desc: t("upgrade.welcome_250_desc"),
                      },
                      {
                        icon: "handle",
                        title: t("upgrade.welcome_handle"),
                        desc: t("upgrade.welcome_handle_desc"),
                      },
                      {
                        icon: "nft",
                        title: t("upgrade.welcome_nft_3"),
                        desc: t("upgrade.welcome_nft_3_desc"),
                      },
                      {
                        icon: "badge",
                        title: t("upgrade.welcome_blue_badge"),
                        desc: t("upgrade.welcome_blue_desc"),
                      },
                    ]
                ).map((item) => (
                  <div
                    key={item.title}
                    className="flex items-center gap-3 p-3 rounded-xl bg-muted/20"
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      {item.icon === "scan" && (
                        <svg
                          className="w-4 h-4 text-primary"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                          />
                        </svg>
                      )}
                      {item.icon === "handle" && (
                        <svg
                          className="w-4 h-4 text-primary"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                      )}
                      {item.icon === "nft" && (
                        <svg
                          className="w-4 h-4 text-primary"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      )}
                      {item.icon === "badge" && (
                        <svg
                          className="w-4 h-4 text-primary"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                          />
                        </svg>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {item.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowWelcome(null);
                  window.location.reload();
                }}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors"
              >
                {t("upgrade.explore_features")}
              </button>

              <p className="text-[10px] text-muted-foreground/50 text-center">
                {t("upgrade.welcome_note")}
              </p>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

