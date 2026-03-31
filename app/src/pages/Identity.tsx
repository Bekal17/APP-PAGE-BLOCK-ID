import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import {
  Connection,
  SystemProgram,
  Transaction,
  PublicKey,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import {
  createTransferInstruction,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/DashboardLayout";
import {
  AtSign,
  Search,
  CheckCircle2,
  XCircle,
  Loader2,
  Fingerprint,
  Shield,
  Wallet,
  Tag,
  AlertTriangle,
} from "lucide-react";

const API_BASE =
  import.meta.env.VITE_EXPLORER_API_URL ||
  "https://blockid-backend-production.up.railway.app";

const HELIUS_RPC =
  import.meta.env.VITE_HELIUS_RPC_URL ||
  "https://mainnet.helius-rpc.com/?api-key=" +
    (import.meta.env.VITE_HELIUS_API_KEY || "");

const heliusConnection = new Connection(HELIUS_RPC, "confirmed");

const BLOCKID_TREASURY = "4DdLPRDiLRY8Q2E4Fv31kvcfMf3XJf11HgaSaW7tKVcx";

const FOUNDER_WALLETS = new Set([
  "7WVhw8R7moAHaPJkZh59kRbqyApTFQvjV816qwEjsW6o",
]);

const USDC_MINT = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
const REQUIRED_USDC = 5.0;
const USDC_DECIMALS = 1_000_000;

const Identity = () => {
  const [handle, setHandle] = useState("");
  const [checking, setChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<{
    available: boolean;
    price_usd: number;
    price_sol: number;
    current_owner?: string | null;
    message?: string;
  } | null>(null);
  const [currentHandle, setCurrentHandle] = useState<string | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [step, setStep] = useState<
    "search" | "confirm" | "paying" | "done"
  >("search");
  const [paymentMethod, setPaymentMethod] = useState<"SOL" | "USDC">("SOL");

  const { publicKey, signTransaction, connected } = useWallet();
  const { connection } = useConnection();
  const { toast } = useToast();
  const address = publicKey?.toBase58();

  useEffect(() => {
    if (!address) return;
    fetch(`${API_BASE}/social/profile/${address}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.handle) setCurrentHandle(data.handle);
      })
      .catch(() => {});
  }, [address]);

  const handleCheck = async () => {
    if (!handle.trim()) return;
    setChecking(true);
    setCheckResult(null);
    try {
      const h = handle.replace(/^@/, "").toLowerCase().trim();
      const res = await fetch(`${API_BASE}/handle/check?handle=${h}`);
      const data = await res.json();
      setCheckResult({
        available: data.available ?? false,
        price_usd: data.price_usd ?? 5,
        price_sol: data.price_sol ?? 0.05,
        current_owner: data.current_owner ?? null,
        message: data.message,
      });
      if (data.available) setStep("confirm");
    } catch {
      toast({ title: "Failed to check handle", variant: "destructive" });
    } finally {
      setChecking(false);
    }
  };

  const handleClaim = async () => {
    if (!publicKey || !signTransaction || !checkResult || !handle) return;
    setClaiming(true);
    setStep("paying");
    try {
      const h = handle.replace(/^@/, "").toLowerCase().trim();

      const isFounder = FOUNDER_WALLETS.has(address ?? "");
      let txSig = "founder-bypass";

      if (!isFounder) {
        if (paymentMethod === "USDC") {
          // USDC SPL transfer
          const fromAta = await getAssociatedTokenAddress(USDC_MINT, publicKey);
          const toAta = await getAssociatedTokenAddress(
            USDC_MINT,
            new PublicKey(BLOCKID_TREASURY)
          );
          const amount = Math.ceil(REQUIRED_USDC * USDC_DECIMALS);
          const transaction = new Transaction().add(
            createTransferInstruction(
              fromAta,
              toAta,
              publicKey,
              amount,
              [],
              TOKEN_PROGRAM_ID
            )
          );
          const { blockhash } = await heliusConnection.getLatestBlockhash();
          transaction.recentBlockhash = blockhash;
          transaction.feePayer = publicKey;
          const signed = await signTransaction(transaction);
          txSig = await heliusConnection.sendRawTransaction(signed.serialize());
          await heliusConnection.confirmTransaction(txSig, "confirmed");
        } else {
          // SOL transfer (existing logic)
          const lamports = Math.ceil(checkResult.price_sol * LAMPORTS_PER_SOL);
          const transaction = new Transaction().add(
            SystemProgram.transfer({
              fromPubkey: publicKey,
              toPubkey: new PublicKey(BLOCKID_TREASURY),
              lamports,
            })
          );
          const { blockhash } = await heliusConnection.getLatestBlockhash();
          transaction.recentBlockhash = blockhash;
          transaction.feePayer = publicKey;
          const signed = await signTransaction(transaction);
          txSig = await heliusConnection.sendRawTransaction(signed.serialize());
          await heliusConnection.confirmTransaction(txSig, "confirmed");
        }
      }

      // Step 2: Claim handle via API
      const claimRes = await fetch(`${API_BASE}/handle/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet: address,
          handle: h,
          signed_message: `Claim @${h} on BlockID`,
          tx_signature: txSig,
          payment_method: paymentMethod,
        }),
      });
      const claimData = await claimRes.json();
      if (!claimRes.ok) throw new Error(claimData.detail ?? "Claim failed");

      setCurrentHandle(h);
      setStep("done");
      toast({ title: `@${h} claimed successfully!` });
    } catch (e: unknown) {
      console.error(e);
      const err = e as Error;
      toast({
        title: err?.message ?? "Failed to claim handle",
        variant: "destructive",
      });
      setStep("confirm");
    } finally {
      setClaiming(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-2">
          <h1 className="text-2xl font-bold text-foreground">
            @Handle Identity
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Your identity on BlockID. One name, one reputation, across every
            wallet you own.
          </p>
          <p className="text-xs text-muted-foreground/60 mt-2 max-w-md mx-auto leading-relaxed">
            Your trust score and reputation are yours, they follow your
            wallet, not your handle.
          </p>
        </div>

        {/* Already have handle */}
        {currentHandle && (
          <div className="glass-card p-5 border border-green-500/20 bg-green-500/5">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              <div>
                <p className="text-sm font-semibold text-foreground">
                  You own @{currentHandle}
                </p>
                <p className="text-xs text-muted-foreground">
                  Soul-bound to your wallet · Active
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Search card */}
        {!currentHandle && (
          <div className="glass-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <AtSign className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">
                Search Handle
              </h3>
            </div>

            <div className="flex gap-3">
              <div className="flex-1 relative">
                <span
                  className="absolute left-3 top-1/2 -translate-y-1/2
                    text-muted-foreground text-sm font-mono"
                >
                  @
                </span>
                <input
                  type="text"
                  value={handle}
                  onChange={(e) => {
                    setHandle(e.target.value.replace(/^@/, "").toLowerCase());
                    setCheckResult(null);
                    setStep("search");
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleCheck()}
                  placeholder="yourhandle"
                  className="w-full pl-8 pr-4 py-3 bg-muted/50 border border-border
                    rounded-lg text-foreground placeholder:text-muted-foreground
                    focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm font-mono"
                />
              </div>
              <button
                onClick={handleCheck}
                disabled={!handle.trim() || checking}
                className="px-5 py-3 bg-primary text-primary-foreground rounded-lg
                  text-sm font-semibold hover:bg-primary/90 disabled:opacity-50
                  transition-all flex items-center gap-2"
              >
                {checking ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                Check
              </button>
            </div>

            {/* Check result */}
            {checkResult && (
              <div
                className={`mt-4 p-4 rounded-lg border ${
                  checkResult.available
                    ? "border-green-500/20 bg-green-500/5"
                    : "border-red-500/20 bg-red-500/5"
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {checkResult.available ? (
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-400" />
                  )}
                  <span
                    className={`text-sm font-semibold ${
                      checkResult.available ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    @{handle} is {checkResult.available ? "available!" : "taken"}
                  </span>
                </div>

                {!checkResult.available && checkResult.current_owner && (
                  <div className="flex items-center justify-between text-xs mt-2 pt-2 border-t border-red-500/20">
                    <span className="text-muted-foreground">
                      Current owner
                    </span>
                    <span className="font-mono text-foreground">
                      {checkResult.current_owner.slice(0, 4)}...
                      {checkResult.current_owner.slice(-4)}
                    </span>
                  </div>
                )}

                {checkResult.available && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Price</span>
                      <span className="font-semibold text-foreground">
                        ${checkResult.price_usd} USD · {checkResult.price_sol}{" "}
                        SOL
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Tag className="w-3 h-3" />
                      <span>
                        {handle.length <= 4
                          ? "Premium handle (short)"
                          : handle.length <= 7
                            ? "Standard handle"
                            : "Basic handle"}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Confirm & Pay card — only show when available */}
        {step === "confirm" &&
          checkResult?.available &&
          !currentHandle && (
            <div className="glass-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <Wallet className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">
                  Confirm & Pay
                </h3>
              </div>

              <div className="flex gap-3 mb-5">
                <button
                  onClick={() => setPaymentMethod("SOL")}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-semibold border transition-all ${
                    paymentMethod === "SOL"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-muted/30 text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  SOL
                </button>
                <button
                  onClick={() => setPaymentMethod("USDC")}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-semibold border transition-all ${
                    paymentMethod === "USDC"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-muted/30 text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  USDC
                </button>
              </div>

              <div className="space-y-3 mb-5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Handle</span>
                  <span className="font-mono font-semibold text-foreground">
                    @{handle}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Price</span>
                  <span className="font-semibold text-foreground">
                    {paymentMethod === "USDC"
                      ? `$${REQUIRED_USDC} USDC`
                      : `${checkResult.price_sol} SOL (≈$${checkResult.price_usd})`}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Type</span>
                  <span className="text-foreground">Transferable NFT</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Challenge period
                  </span>
                  <span className="text-foreground">30 days</span>
                </div>
              </div>

              <div
                className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10
                  border border-amber-500/20 mb-5"
              >
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-300">
                  Handle name can be sold on Magic Eden or Tensor. Your trust
                  score, reputation, and followers stay with your wallet — not
                  the handle. New owner starts with fresh reputation. 30-day
                  challenge period applies.
                </p>
              </div>

              <button
                onClick={handleClaim}
                disabled={claiming || !connected}
                className="w-full py-3 bg-primary text-primary-foreground rounded-lg
                  text-sm font-bold hover:bg-primary/90 disabled:opacity-50
                  transition-all flex items-center justify-center gap-2"
              >
                {claiming ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Processing...
                  </>
                ) : (
                  <>
                    <Fingerprint className="w-4 h-4" /> Pay & Claim @{handle}
                  </>
                )}
              </button>
            </div>
          )}

        {/* Paying step */}
        {step === "paying" && (
          <div className="glass-card p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
            <p className="text-sm font-semibold text-foreground">
              Processing payment...
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Please approve the transaction in your wallet
            </p>
          </div>
        )}

        {/* Done step */}
        {step === "done" && (
          <div className="glass-card p-8 text-center border border-green-500/20">
            <CheckCircle2 className="w-10 h-10 text-green-400 mx-auto mb-3" />
            <p className="text-lg font-bold text-foreground">
              @{handle} is yours!
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Transferable · Sell anytime on Magic Eden or Tensor · 30-day
              challenge period active
            </p>
          </div>
        )}

        {/* Info card */}
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">
              Handle Pricing
            </h3>
          </div>
          <div className="space-y-2">
            {[
              { len: "1-2 chars", price: "$200-500", note: "Ultra premium" },
              { len: "3 chars", price: "$100", note: "Premium" },
              { len: "4 chars", price: "$50", note: "Short" },
              { len: "5-7 chars", price: "$10-30", note: "Standard" },
              { len: "8+ chars", price: "$5", note: "Basic" },
              { len: "Transfer", price: "Anytime", note: "Via Magic Eden / Tensor" },
            ].map((row) => (
              <div
                key={row.len}
                className="flex items-center justify-between text-xs py-1.5
                  border-b border-border/30 last:border-0"
              >
                <span className="font-mono text-foreground">{row.len}</span>
                <span className="text-muted-foreground">{row.note}</span>
                <span className="font-semibold text-foreground">
                  {row.price}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Identity;
