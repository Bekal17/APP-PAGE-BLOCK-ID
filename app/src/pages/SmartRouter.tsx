import { useState, useRef, type KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import DashboardLayout from "@/components/DashboardLayout";
import UserAvatar from "@/components/UserAvatar";
import {
  Zap,
  Send,
  ArrowRight,
  Loader2,
  AlertCircle,
  X,
  Shield,
} from "lucide-react";

const API_BASE =
  import.meta.env.VITE_SOCIAL_API_URL ??
  "https://blockid-backend-production.up.railway.app";

interface ParseResult {
  intent: string;
  handle: string | null;
  handle_resolved: string | null;
  amount: number | string | null;
  token: string | null;
  output_token: string | null;
  confidence: number;
  raw_input: string;
  needs_more_info: boolean;
}

interface ResolveResult {
  wallet: string;
  handle: string | null;
  trust_score: number | null;
  risk_level: string | null;
  avatar_url: string | null;
  avatar_type: string | null;
  badges: string[];
  plan: string;
  risk_warning: string | null;
}

const SmartRouter = () => {
  const { t } = useTranslation();
  const { publicKey, signTransaction } = useWallet();
  const { connection } = useConnection();
  const inputRef = useRef<HTMLInputElement>(null);

  const [input, setInput] = useState("");
  const [parsing, setParsing] = useState(false);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [step, setStep] = useState<"input" | "confirm">("input");
  const [resolving, setResolving] = useState(false);
  const [resolveResult, setResolveResult] = useState<ResolveResult | null>(null);
  const [resolveError, setResolveError] = useState<string | null>(null);
  const [executing, setExecuting] = useState(false);
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [txError, setTxError] = useState<string | null>(null);

  const handleParse = async () => {
    const text = input.trim();
    if (!text) return;

    setParsing(true);
    setParseError(null);
    setParseResult(null);
    setStep("input");
    setResolveResult(null);
    setResolveError(null);
    setTxSignature(null);
    setTxError(null);
    setExecuting(false);

    try {
      const res = await fetch(`${API_BASE}/router/parse`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: text }),
      });
      if (!res.ok) throw new Error("Parse failed");
      const data: ParseResult = await res.json();
      setParseResult(data);
    } catch {
      setParseError("Failed to understand your request. Try again.");
    } finally {
      setParsing(false);
    }
  };

  const handleContinue = async () => {
    if (!parseResult?.handle) return;

    setResolving(true);
    setResolveError(null);

    try {
      const res = await fetch(
        `${API_BASE}/router/resolve/${encodeURIComponent(parseResult.handle)}`,
      );
      if (!res.ok) {
        const err: { detail?: string } = await res.json().catch(() => ({}));
        throw new Error(err.detail ?? "Handle not found");
      }
      const data: ResolveResult = await res.json();
      setResolveResult(data);
      setStep("confirm");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Could not resolve recipient";
      setResolveError(message);
    } finally {
      setResolving(false);
    }
  };

  const handleExecute = async () => {
    if (!publicKey || !resolveResult || !parseResult?.amount || !connection)
      return;

    setExecuting(true);
    setTxError(null);
    setTxSignature(null);

    try {
      const recipientPubkey = new PublicKey(resolveResult.wallet);
      const amount = parseFloat(String(parseResult.amount));

      if (isNaN(amount) || amount <= 0) {
        throw new Error("Invalid amount");
      }

      const token = (parseResult.token ?? "SOL").toUpperCase();

      if (token === "SOL") {
        const lamports = Math.round(amount * LAMPORTS_PER_SOL);

        const { blockhash, lastValidBlockHeight } =
          await connection.getLatestBlockhash();

        const transaction = new Transaction({
          recentBlockhash: blockhash,
          feePayer: publicKey,
        }).add(
          SystemProgram.transfer({
            fromPubkey: publicKey,
            toPubkey: recipientPubkey,
            lamports,
          }),
        );

        if (!signTransaction) {
          throw new Error("Wallet does not support signing. Please reconnect.");
        }

        const signed = await signTransaction(transaction);
        const signature = await connection.sendRawTransaction(
          signed.serialize(),
        );

        await connection.confirmTransaction(
          { signature, blockhash, lastValidBlockHeight },
          "confirmed",
        );

        setTxSignature(signature);
        setStep("input");
      } else {
        throw new Error(
          "SPL token transfers coming soon. Only SOL supported for now.",
        );
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Transaction failed";
      if (message.includes("User rejected") || message.includes("cancelled")) {
        setTxError("Transaction cancelled by user.");
      } else {
        setTxError(message);
      }
    } finally {
      setExecuting(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleParse();
    }
  };

  const clearResult = () => {
    setParseResult(null);
    setParseError(null);
    setResolveResult(null);
    setResolveError(null);
    setStep("input");
    setTxSignature(null);
    setTxError(null);
    setExecuting(false);
    setInput("");
    inputRef.current?.focus();
  };

  const examples = [
    "send 1 SOL to @blockid",
    "kirim 100 USDC ke @bee17",
    "swap 2 SOL to USDC",
    "送金 0.5 SOL @blockid",
    "enviar 10 USDC a @bee17",
  ];

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center space-y-2 pt-4 animate-slide-up">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <Zap className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Smart Router</h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            {t(
              "smart_router.subtitle",
              "Type what you want to do in any language. AI handles the rest.",
            )}
          </p>
        </div>

        <div
          className="glass-card p-4 animate-slide-up"
          style={{ animationDelay: "0.05s" }}
        >
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t(
                  "smart_router.input_placeholder",
                  '"send 1 SOL to @blockid" — type in any language',
                )}
                className="w-full bg-transparent border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                disabled={parsing}
                autoFocus
              />
              {input && !parsing && (
                <button
                  type="button"
                  onClick={() => {
                    setInput("");
                    inputRef.current?.focus();
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted/30 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => void handleParse()}
              disabled={!input.trim() || parsing}
              className="px-5 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shrink-0"
            >
              {parsing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {parsing
                ? t("common.loading", "Processing...")
                : t("smart_router.send_button", "Send")}
            </button>
          </div>

          <p className="text-[10px] text-muted-foreground/50 mt-2 text-right">
            Powered by GPT-4o-mini · Jupiter Metis v1
          </p>
        </div>

        {parseError && (
          <div className="glass-card p-4 border-red-500/20 animate-slide-up">
            <div className="flex items-center gap-3 text-red-400">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <div>
                <p className="text-sm font-medium">{parseError}</p>
                <button
                  type="button"
                  onClick={clearResult}
                  className="text-xs text-primary hover:underline mt-1"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        )}

        {parseResult && !parseError && step === "input" && (
          <div
            className="glass-card p-5 space-y-4 animate-slide-up"
            style={{ animationDelay: "0.05s" }}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <ArrowRight className="w-4 h-4 text-primary" />
                {t("smart_router.parsed_intent", "Understood")}
              </h3>
              <button
                type="button"
                onClick={clearResult}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {t("smart_router.clear", "Clear")}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-muted/20">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                  Intent
                </p>
                <p className="text-sm font-semibold text-foreground capitalize">
                  {parseResult.intent}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-muted/20">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                  Confidence
                </p>
                <p
                  className={`text-sm font-semibold ${
                    parseResult.confidence >= 0.8
                      ? "text-green-400"
                      : parseResult.confidence >= 0.5
                        ? "text-amber-400"
                        : "text-red-400"
                  }`}
                >
                  {Math.round(parseResult.confidence * 100)}%
                </p>
              </div>
              {parseResult.handle && (
                <div className="p-3 rounded-lg bg-muted/20">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                    Recipient
                  </p>
                  <p className="text-sm font-semibold text-primary">
                    @{parseResult.handle}
                  </p>
                </div>
              )}
              {parseResult.amount != null && parseResult.amount !== "" && (
                <div className="p-3 rounded-lg bg-muted/20">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                    Amount
                  </p>
                  <p className="text-sm font-semibold text-foreground">
                    {parseResult.amount} {parseResult.token ?? ""}
                  </p>
                </div>
              )}
              {parseResult.output_token && parseResult.intent === "swap" && (
                <div className="p-3 rounded-lg bg-muted/20 col-span-2">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                    Swap
                  </p>
                  <p className="text-sm font-semibold text-foreground">
                    {parseResult.amount} {parseResult.token} →{" "}
                    {parseResult.output_token}
                  </p>
                </div>
              )}
            </div>

            {parseResult.needs_more_info && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <p className="text-xs text-amber-400">
                  {t(
                    "smart_router.needs_more_info",
                    "More information needed. Please specify amount, token, or recipient.",
                  )}
                </p>
              </div>
            )}

            {parseResult.intent === "send" &&
              parseResult.handle &&
              parseResult.amount != null &&
              parseResult.amount !== "" &&
              !parseResult.needs_more_info && (
                <button
                  type="button"
                  className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  onClick={() => void handleContinue()}
                  disabled={resolving}
                >
                  {resolving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ArrowRight className="w-4 h-4" />
                  )}
                  {resolving
                    ? t("smart_router.resolving", "Resolving recipient...")
                    : t("smart_router.continue", "Continue")}
                </button>
              )}

            {parseResult.intent === "swap" &&
              parseResult.amount != null &&
              parseResult.amount !== "" &&
              parseResult.token &&
              parseResult.output_token &&
              !parseResult.needs_more_info && (
                <button
                  type="button"
                  className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                  onClick={() => {
                    console.log("Continue to swap", parseResult);
                  }}
                >
                  <ArrowRight className="w-4 h-4" />
                  {t("smart_router.continue_swap", "Preview Swap")}
                </button>
              )}
          </div>
        )}

        {/* Confirmation Card — Step 2 */}
        {step === "confirm" && resolveResult && parseResult && (
          <div className="glass-card p-5 space-y-5 animate-slide-up">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">
                {t("smart_router.confirm_transfer", "Confirm Transfer")}
              </h3>
              <button
                type="button"
                onClick={clearResult}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {t("common.cancel", "Cancel")}
              </button>
            </div>

            <div className="p-4 rounded-xl bg-muted/20 border border-border/50 space-y-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                {t("smart_router.sending_to", "Sending to")}
              </p>
              <div className="flex items-center gap-3">
                <UserAvatar
                  avatarUrl={resolveResult.avatar_url}
                  avatarType={resolveResult.avatar_type}
                  wallet={resolveResult.wallet}
                  handle={resolveResult.handle}
                  size={44}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">
                      @{resolveResult.handle}
                    </p>
                    {resolveResult.trust_score != null && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-medium flex items-center gap-1 ${
                          resolveResult.trust_score >= 70
                            ? "bg-emerald-500/10 text-emerald-400"
                            : resolveResult.trust_score >= 40
                              ? "bg-amber-500/10 text-amber-400"
                              : "bg-rose-500/10 text-rose-400"
                        }`}
                      >
                        <Shield className="w-3 h-3" />
                        {Math.round(resolveResult.trust_score)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground font-mono truncate">
                    {resolveResult.wallet}
                  </p>
                </div>
              </div>

              {resolveResult.badges && resolveResult.badges.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {resolveResult.badges.slice(0, 3).map((badge) => (
                    <span
                      key={badge}
                      className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary/10 text-primary border border-primary/20"
                    >
                      {badge}
                    </span>
                  ))}
                </div>
              )}

              {resolveResult.risk_warning && (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  <p className="text-xs text-amber-400">
                    {resolveResult.risk_warning}
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 rounded-xl bg-muted/20 border border-border/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                    {t("smart_router.amount_label", "Amount")}
                  </p>
                  <p className="text-lg font-bold text-foreground">
                    {parseResult.amount} {parseResult.token ?? "SOL"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                    {t("smart_router.network_label", "Network")}
                  </p>
                  <p className="text-sm font-medium text-foreground">Solana</p>
                </div>
              </div>
            </div>

            <button
              type="button"
              className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              onClick={() => void handleExecute()}
              disabled={executing || !publicKey}
            >
              {executing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t("smart_router.executing", "Sending...")}
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  {t("smart_router.confirm_send", "Confirm & Send")}{" "}
                  {parseResult.amount} {parseResult.token ?? "SOL"}
                </>
              )}
            </button>

            <p className="text-[10px] text-muted-foreground/50 text-center">
              {t(
                "smart_router.sign_note",
                "You will be asked to sign the transaction with your wallet.",
              )}
            </p>
          </div>
        )}

        {resolveError && (
          <div className="glass-card p-4 border-red-500/20 animate-slide-up">
            <div className="flex items-center gap-3 text-red-400">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <div>
                <p className="text-sm font-medium">{resolveError}</p>
                <button
                  type="button"
                  onClick={clearResult}
                  className="text-xs text-primary hover:underline mt-1"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        )}

        {txSignature && (
          <div className="glass-card p-5 space-y-4 animate-slide-up">
            <div className="text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto">
                <svg
                  className="w-7 h-7 text-emerald-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-foreground">
                {t("smart_router.tx_success", "Transaction Sent!")}
              </h3>
              <p className="text-sm text-muted-foreground">
                {parseResult?.amount} {parseResult?.token ?? "SOL"} → @
                {resolveResult?.handle ?? "recipient"}
              </p>
            </div>

            <a
              href={`https://solscan.io/tx/${txSignature}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full py-3 rounded-xl bg-muted/30 text-center text-sm font-medium text-primary hover:bg-muted/50 transition-colors border border-border/50"
            >
              {t("smart_router.view_on_solscan", "View on Solscan")} ↗
            </a>
            <button
              type="button"
              onClick={clearResult}
              className="w-full py-3 rounded-xl text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {t("smart_router.new_transfer", "New Transfer")}
            </button>
          </div>
        )}

        {txError && (
          <div className="glass-card p-4 border-red-500/20 animate-slide-up">
            <div className="flex items-center gap-3 text-red-400">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <div>
                <p className="text-sm font-medium">{txError}</p>
                <button
                  type="button"
                  onClick={() => setTxError(null)}
                  className="text-xs text-primary hover:underline mt-1"
                >
                  {t("smart_router.try_again", "Try again")}
                </button>
              </div>
            </div>
          </div>
        )}

        {!parseResult && !parseError && !parsing && (
          <div
            className="space-y-3 animate-slide-up"
            style={{ animationDelay: "0.1s" }}
          >
            <p className="text-xs text-muted-foreground text-center">
              {t("smart_router.try_examples", "Try these examples:")}
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {examples.map((ex) => (
                <button
                  type="button"
                  key={ex}
                  onClick={() => {
                    setInput(ex);
                    inputRef.current?.focus();
                  }}
                  className="px-3 py-1.5 rounded-full text-xs bg-muted/30 text-muted-foreground hover:bg-muted/50 hover:text-foreground border border-border/50 transition-all"
                >
                  &quot;{ex}&quot;
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default SmartRouter;
