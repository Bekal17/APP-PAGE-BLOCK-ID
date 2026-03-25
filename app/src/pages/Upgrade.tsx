import { useState } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import {
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import {
  createTransferInstruction,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { Check, X, Zap, Star, Crown } from "lucide-react";
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
  const { publicKey, signTransaction } = useWallet();
  const { connection } = useConnection();
  const sub = useSubscription();
  const { toast } = useToast();

  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
  const [payToken, setPayToken] = useState<"USDC" | "SOL">("USDC");
  const [solPrice, setSolPrice] = useState<number>(0);
  const [loading, setLoading] = useState<string | null>(null); // "explorer" | "pro"
  const [paying, setPaying] = useState<string | null>(null);

  // Fetch SOL price from Jupiter
  const fetchSolPrice = async () => {
    try {
      const res = await fetch(
        "https://price.jup.ag/v6/price?ids=SOL&vsToken=USDC"
      );
      const data = await res.json();
      const price = data?.data?.SOL?.price ?? 0;
      setSolPrice(price);
      return price;
    } catch {
      return 0;
    }
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

    const { blockhash, lastValidBlockHeight } =
      await connection.getLatestBlockhash();

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
    if (!price) throw new Error("Could not fetch SOL price");

    const usdAmount = PLANS[plan][period];
    const solAmount = usdAmount / price;
    // Add 1% buffer for slippage
    const lamports = Math.round(solAmount * 1.01 * LAMPORTS_PER_SOL);

    const { blockhash, lastValidBlockHeight } =
      await connection.getLatestBlockhash();

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
      toast({ title: "Connect your wallet first", variant: "destructive" });
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
      if (!sig) throw new Error("Transaction failed");

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
      if (!res.ok) throw new Error(data.detail ?? "Upgrade failed");

      toast({
        title: `Upgraded to ${plan === "explorer" ? "Explorer" : "PRO"}!`,
        description: "Your plan is now active.",
      });

      // Refresh subscription data
      window.location.reload();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Payment failed";
      toast({ title: msg, variant: "destructive" });
    } finally {
      setPaying(null);
    }
  };

  const currentPlan = sub.plan ?? "free";

  // Feature comparison data
  const features = [
    {
      category: "Identity",
      items: [
        { name: "Public BlockID profile", free: true, explorer: true, pro: true },
        { name: "Trust score (realtime)", free: true, explorer: true, pro: true },
        { name: "NFT identity (auto-mint)", free: true, explorer: true, pro: true },
        { name: "@Handle claim", free: false, explorer: "1 handle", pro: "3 handles" },
        { name: "Make Your Own NFT avatar", free: false, explorer: true, pro: true },
      ],
    },
    {
      category: "Social",
      items: [
        { name: "Unlimited posts & social feed", free: true, explorer: true, pro: true },
        { name: "Follow & followers", free: true, explorer: true, pro: true },
        { name: "Direct messages", free: true, explorer: true, pro: true },
        { name: "Wallet scans/month", free: "10", explorer: "100", pro: "Unlimited" },
      ],
    },
    {
      category: "Access",
      items: [
        { name: "Early access to new features", free: false, explorer: false, pro: true },
        { name: "Priority support", free: false, explorer: false, pro: true },
        { name: "Blue tick badge", free: false, explorer: true, pro: false },
        { name: "Purple tick badge", free: false, explorer: false, pro: true },
      ],
    },
  ];

  const renderCell = (val: boolean | string) => {
    if (val === true)
      return <Check className="w-4 h-4 text-green-400 mx-auto" />;
    if (val === false)
      return <X className="w-4 h-4 text-zinc-600 mx-auto" />;
    return <span className="text-xs text-zinc-300 font-medium">{val}</span>;
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-10">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Upgrade BlockID</h1>
          <p className="text-sm text-muted-foreground">
            Get more scans, claim your @handle, and unlock exclusive features.
          </p>
        </div>

        {/* Billing toggle */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setBilling("monthly")}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors
              ${billing === "monthly" ? "bg-zinc-700 text-white" : "text-zinc-400 hover:text-white"}`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBilling("annual")}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors
              ${billing === "annual" ? "bg-zinc-700 text-white" : "text-zinc-400 hover:text-white"}`}
          >
            Annual
            <span className="ml-2 px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-xs font-bold">
              20% off
            </span>
          </button>
        </div>

        {/* Pay with toggle */}
        <div className="flex items-center justify-center gap-2">
          <span className="text-xs text-zinc-500">Pay with:</span>
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
                Free
              </p>
              <p className="text-4xl font-bold">$0</p>
              <p className="text-xs text-zinc-500 mt-1">forever</p>
            </div>
            <ul className="space-y-2 text-xs text-zinc-400">
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                Public profile & NFT identity
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                10 wallet scans/month
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                Full social access
              </li>
            </ul>
            <button
              disabled
              className="w-full py-2.5 rounded-xl border border-zinc-700 text-zinc-500 text-sm font-semibold cursor-not-allowed"
            >
              {currentPlan === "free" ? "Current Plan" : "Free"}
            </button>
          </div>

          {/* Explorer */}
          <div className="rounded-2xl border border-blue-500/40 bg-zinc-900/80 p-6 space-y-4 shadow-lg shadow-blue-500/10 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="px-3 py-1 rounded-full bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-500/30">
                Most Popular
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <p className="text-xs font-bold text-blue-400 uppercase tracking-widest">
                  Explorer
                </p>
                <span className="text-blue-400 text-sm">✓</span>
              </div>
              <p className="text-4xl font-bold text-blue-400">
                ${billing === "monthly" ? 9 : (86.4 / 12).toFixed(2)}
              </p>
              <p className="text-xs text-zinc-500 mt-1">
                {billing === "monthly"
                  ? "per month"
                  : `$86.40/year · billed annually`}
              </p>
            </div>
            <ul className="space-y-2 text-xs text-zinc-400">
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                100 wallet scans/month
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                @Handle claim (1 handle)
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                Make Your Own NFT avatar
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                Blue tick badge ✓
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
                ? "Processing..."
                : currentPlan === "explorer"
                  ? "Current Plan"
                  : currentPlan === "pro"
                    ? "Downgrade"
                    : `Upgrade · ${
                        payToken === "USDC"
                          ? `$${billing === "monthly" ? 9 : 86.4} USDC`
                          : "Pay SOL"
                      }`}
            </button>
          </div>

          {/* PRO */}
          <div className="rounded-2xl border border-purple-500/40 bg-zinc-900/80 p-6 space-y-4 shadow-lg shadow-purple-500/10">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <p className="text-xs font-bold text-purple-400 uppercase tracking-widest">
                  PRO
                </p>
                <Crown className="w-3.5 h-3.5 text-purple-400" />
              </div>
              <p className="text-4xl font-bold text-purple-400">
                ${billing === "monthly" ? 29 : (278.4 / 12).toFixed(2)}
              </p>
              <p className="text-xs text-zinc-500 mt-1">
                {billing === "monthly"
                  ? "per month"
                  : `$278.40/year · billed annually`}
              </p>
            </div>
            <ul className="space-y-2 text-xs text-zinc-400">
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                Unlimited wallet scans
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                3 @Handle claims
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                Make Your Own NFT avatar (unlimited)
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                Purple tick badge
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                Priority support
              </li>
            </ul>
            <button
              onClick={() => handleUpgrade("pro")}
              disabled={paying === "pro" || currentPlan === "pro"}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-500 hover:opacity-90 text-white text-sm font-bold transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {paying === "pro"
                ? "Processing..."
                : currentPlan === "pro"
                  ? "Current Plan"
                  : `Upgrade · ${
                      payToken === "USDC"
                        ? `$${billing === "monthly" ? 29 : 278.4} USDC`
                        : "Pay SOL"
                    }`}
            </button>
          </div>
        </div>

        {/* Feature comparison table */}
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-center">
            Compare tiers & features
          </h2>
          {features.map((section) => (
            <div
              key={section.category}
              className="rounded-2xl border border-zinc-800 overflow-hidden"
            >
              <div className="grid grid-cols-4 bg-zinc-800/50 px-4 py-3">
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                  {section.category}
                </p>
                <p className="text-xs font-bold text-zinc-400 text-center">
                  Free
                </p>
                <p className="text-xs font-bold text-blue-400 text-center">
                  Explorer
                </p>
                <p className="text-xs font-bold text-purple-400 text-center">
                  PRO
                </p>
              </div>
              {section.items.map((item, i) => (
                <div
                  key={item.name}
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
          Payments are processed on Solana mainnet. USDC mint: EPjFWdd5...
          t1v · No refunds after plan activation.
        </p>
      </div>
    </DashboardLayout>
  );
}

