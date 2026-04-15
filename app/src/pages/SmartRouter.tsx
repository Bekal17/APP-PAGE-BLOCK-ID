import { useState, useRef, useEffect, type KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Buffer } from "buffer";
import {
  PublicKey,
  Transaction,
  VersionedTransaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import {
  getAssociatedTokenAddressSync,
  createTransferInstruction,
  createAssociatedTokenAccountInstruction,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import DashboardLayout from "@/components/DashboardLayout";
import UserAvatar from "@/components/UserAvatar";
import { CashtagPill } from "@/components/CashtagPill";
import { getWalletBalance } from "@/services/blockidApi";
import { useTokenList } from "@/hooks/useTokenList";
import { useCashtagPrice } from "@/hooks/useCashtagPrice";
import {
  Zap,
  Send,
  ArrowRight,
  Loader2,
  AlertCircle,
  X,
  Shield,
  Wallet,
} from "lucide-react";

const API_BASE =
  import.meta.env.VITE_SOCIAL_API_URL ??
  "https://blockid-backend-production.up.railway.app";

const POPULAR_TOKENS = [
  {
    symbol: "USDC",
    name: "USD Coin",
    mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  },
  {
    symbol: "USDT",
    name: "Tether USD",
    mint: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
  },
  {
    symbol: "BONK",
    name: "Bonk",
    mint: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
  },
  {
    symbol: "JUP",
    name: "Jupiter",
    mint: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",
  },
  {
    symbol: "WIF",
    name: "dogwifhat",
    mint: "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm",
  },
];

const TOKEN_DECIMALS: Record<string, { mint: string; decimals: number }> = {
  USDC: { mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", decimals: 6 },
  USDT: { mint: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB", decimals: 6 },
  BONK: { mint: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263", decimals: 5 },
  JUP: { mint: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN", decimals: 6 },
  WIF: { mint: "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm", decimals: 6 },
};

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
  const { getByTicker } = useTokenList();
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
  const [quoteResult, setQuoteResult] = useState<any>(null);
  const [quoting, setQuoting] = useState(false);
  const [swapStep, setSwapStep] = useState<"idle" | "quoted" | "signing">("idle");
  const [balance, setBalance] = useState<any>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);

  const routerToken = parseResult?.token ?? null;
  const routerTokenData = routerToken ? getByTicker(routerToken) : null;
  const routerMint = routerTokenData?.address ?? undefined;
  const { prices: routerPrices } = useCashtagPrice(routerMint ? [routerMint] : []);
  const routerPrice = routerMint ? routerPrices[routerMint] : undefined;

  useEffect(() => {
    if (!publicKey) {
      setBalance(null);
      return;
    }
    setBalanceLoading(true);
    getWalletBalance(publicKey.toString())
      .then(setBalance)
      .catch(() => setBalance(null))
      .finally(() => setBalanceLoading(false));
  }, [publicKey]);

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
    setQuoteResult(null);
    setSwapStep("idle");

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
        throw new Error(err.detail ?? "Handle, SNS or DNS not found");
      }
      const data: ResolveResult = await res.json();
      setResolveResult(data);
      setStep("confirm");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Handle, SNS or DNS not found";
      setResolveError(message);
    } finally {
      setResolving(false);
    }
  };

  const handleQuote = async () => {
    if (
      !publicKey ||
      !parseResult?.amount ||
      !parseResult?.token ||
      !parseResult?.output_token
    )
      return;

    setQuoting(true);
    setTxError(null);
    setResolveError(null);
    setQuoteResult(null);

    try {
      const res = await fetch(`${API_BASE}/router/swap-quote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender_wallet: publicKey.toString(),
          amount: parseFloat(String(parseResult.amount)),
          input_token: parseResult.token.toUpperCase(),
          output_token: parseResult.output_token.toUpperCase(),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail ?? "Quote failed");
      }
      const data = await res.json();
      setQuoteResult(data);
      setSwapStep("quoted");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to get quote";
      setTxError(message);
    } finally {
      setQuoting(false);
    }
  };

  const handleSwapExecute = async () => {
    if (!publicKey || !signTransaction || !connection || !parseResult) return;

    setSwapStep("signing");
    setExecuting(true);
    setTxError(null);
    setTxSignature(null);

    try {
      const swapRes = await fetch(`${API_BASE}/router/swap`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender_wallet: publicKey.toString(),
          recipient_wallet: publicKey.toString(),
          amount: parseFloat(String(parseResult.amount)),
          input_token: (parseResult.token ?? "SOL").toUpperCase(),
          output_token: (parseResult.output_token ?? "USDC").toUpperCase(),
        }),
      });
      if (!swapRes.ok) {
        const err = await swapRes.json().catch(() => ({}));
        throw new Error(err.detail ?? "Swap preparation failed");
      }
      const swapData = await swapRes.json();

      if (!swapData.transaction) {
        throw new Error("No transaction returned from swap endpoint");
      }

      const transactionBuf = Buffer.from(swapData.transaction, "base64");
      // Jupiter v2 returns VersionedTransaction (v0)
      const transaction = VersionedTransaction.deserialize(transactionBuf);
      const signed = await signTransaction(transaction);
      const serialized = signed.serialize();
      const base64Signed = Buffer.from(serialized).toString("base64");

      const execRes = await fetch(`${API_BASE}/router/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signed_transaction: base64Signed,
          request_id: swapData.request_id,
        }),
      });
      if (!execRes.ok) {
        const err = await execRes.json().catch(() => ({}));
        throw new Error(err.detail ?? "Swap execution failed");
      }
      const execData = await execRes.json();

      if (execData.status === "Success" && execData.signature) {
        setTxSignature(execData.signature);
        setSwapStep("idle");
        setStep("input");
        // Refresh balance after swap
        if (publicKey) {
          getWalletBalance(publicKey.toString())
            .then(setBalance)
            .catch(() => {});
        }
      } else {
        throw new Error(execData.error ?? "Swap failed");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Swap failed";
      if (message.includes("User rejected") || message.includes("cancelled")) {
        setTxError("Swap cancelled.");
      } else {
        setTxError(message.length > 150 ? message.slice(0, 150) + "..." : message);
      }
      setSwapStep("quoted");
    } finally {
      setExecuting(false);
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
        // Refresh balance after send
        if (publicKey) {
          getWalletBalance(publicKey.toString())
            .then(setBalance)
            .catch(() => {});
        }
      } else {
        // SPL Token Transfer
        const tokenInfo = TOKEN_DECIMALS[token];
        if (!tokenInfo) {
          throw new Error(`Token ${token} is not supported for transfers.`);
        }

        const mintPubkey = new PublicKey(tokenInfo.mint);
        const senderATA = getAssociatedTokenAddressSync(mintPubkey, publicKey);
        const recipientATA = getAssociatedTokenAddressSync(
          mintPubkey,
          recipientPubkey,
        );

        const { blockhash, lastValidBlockHeight } =
          await connection.getLatestBlockhash();

        const transaction = new Transaction({
          recentBlockhash: blockhash,
          feePayer: publicKey,
        });

        // Check if recipient ATA exists; if not, create it (sender pays rent).
        const recipientATAInfo = await connection.getAccountInfo(recipientATA);
        if (!recipientATAInfo) {
          transaction.add(
            createAssociatedTokenAccountInstruction(
              publicKey,
              recipientATA,
              recipientPubkey,
              mintPubkey,
              TOKEN_PROGRAM_ID,
              ASSOCIATED_TOKEN_PROGRAM_ID,
            ),
          );
        }

        // Calculate raw amount using token decimals
        const rawAmount = BigInt(Math.round(amount * 10 ** tokenInfo.decimals));

        transaction.add(
          createTransferInstruction(
            senderATA,
            recipientATA,
            publicKey,
            rawAmount,
            [],
            TOKEN_PROGRAM_ID,
          ),
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
        if (publicKey) {
          getWalletBalance(publicKey.toString())
            .then(setBalance)
            .catch(() => {});
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Transaction failed";
      if (message.includes("User rejected") || message.includes("cancelled")) {
        setTxError("Transaction cancelled.");
      } else if (
        message.includes("insufficient") ||
        message.includes("funds for rent")
      ) {
        setTxError(
          "Insufficient balance. Make sure you have enough SOL for the transfer plus network fee (~0.005 SOL).",
        );
      } else if (
        message.includes("Blockhash not found") ||
        message.includes("block height exceeded")
      ) {
        setTxError("Transaction expired. Please try again.");
      } else if (message.includes("does not support signing")) {
        setTxError("Wallet not connected. Please reconnect and try again.");
      } else if (
        message.includes("TokenAccountNotFoundError") ||
        message.includes("could not find account")
      ) {
        setTxError(
          `You don't have any ${parseResult?.token ?? "token"} in your wallet.`,
        );
      } else {
        setTxError(
          message.length > 150 ? message.slice(0, 150) + "..." : message,
        );
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
    setQuoteResult(null);
    setSwapStep("idle");
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

  const getMergedTokens = () => {
    if (!balance) return [];
    const backendTokens = balance.tokens ?? [];
    const ownedMints = new Set(backendTokens.map((t: any) => t.mint));

    const missingPopular = POPULAR_TOKENS.filter((pt) => !ownedMints.has(pt.mint))
      .map((pt) => ({
        symbol: pt.symbol,
        name: pt.name,
        mint: pt.mint,
        balance: 0,
        usd_value: 0,
        decimals: 0,
        logo_uri: null,
      }));

    return [...backendTokens, ...missingPopular];
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto flex gap-6">
        <div className="flex-1 min-w-0 space-y-6">
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

        {!publicKey && (
          <div className="glass-card p-4 text-center animate-slide-up">
            <p className="text-sm text-muted-foreground">
              {t(
                "smart_router.connect_wallet",
                "Connect your wallet to start using Smart Router.",
              )}
            </p>
          </div>
        )}

        {publicKey && !txSignature && (
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
              Powered by BlockID AI · Jupiter Swap v2
            </p>
          </div>
        )}

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

        {parseResult &&
          !parseError &&
          step === "input" &&
          !txSignature &&
          swapStep !== "quoted" && (
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
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">
                      {parseResult.amount}
                    </p>
                    {parseResult.token ? (
                      <CashtagPill
                        ticker={parseResult.token}
                        mintAddress={routerMint}
                        price={routerPrice?.price}
                        change24h={routerPrice?.change24h}
                        isVerified={!!routerTokenData}
                      />
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </div>
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
                  className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  onClick={() => void handleQuote()}
                  disabled={quoting}
                >
                  {quoting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ArrowRight className="w-4 h-4" />
                  )}
                  {quoting
                    ? t("common.loading", "Getting quote...")
                    : t("smart_router.continue_swap", "Preview Swap")}
                </button>
              )}
          </div>
        )}

        {swapStep === "quoted" && quoteResult && parseResult && !txSignature && (
          <div className="glass-card p-5 space-y-5 animate-slide-up">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">
                {t("smart_router.swap_preview", "Swap Preview")}
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
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                    You Pay
                  </p>
                  <p className="text-lg font-bold text-foreground">
                    {quoteResult.input_amount ?? parseResult.amount}{" "}
                    {quoteResult.input_token ?? parseResult.token}
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground" />
                <div className="text-right">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                    You Receive
                  </p>
                  <p className="text-lg font-bold text-emerald-400">
                    {quoteResult.output_amount}{" "}
                    {quoteResult.output_token ?? parseResult.output_token}
                  </p>
                </div>
              </div>
              {quoteResult.price_impact_pct != null && (
                <div className="flex items-center justify-between pt-2 border-t border-border/30">
                  <p className="text-xs text-muted-foreground">Price Impact</p>
                  <p
                    className={`text-xs font-medium ${parseFloat(quoteResult.price_impact_pct) > 1 ? "text-amber-400" : "text-muted-foreground"}`}
                  >
                    {quoteResult.price_impact_pct}%
                  </p>
                </div>
              )}
              {quoteResult.router && (
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">Route</p>
                  <p className="text-xs text-muted-foreground">
                    {quoteResult.router}
                  </p>
                </div>
              )}
            </div>

            <button
              type="button"
              className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              onClick={() => void handleSwapExecute()}
              disabled={executing || !publicKey}
            >
              {executing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t("smart_router.swapping", "Swapping...")}
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  {t("smart_router.confirm_swap", "Confirm Swap")}
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

        {/* Confirmation Card — Step 2 */}
        {step === "confirm" &&
          resolveResult &&
          parseResult &&
          !txSignature && (
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
                    {resolveResult.wallet.slice(0, 4)}...{resolveResult.wallet.slice(-4)}
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
                {parseResult?.intent === "swap"
                  ? `${parseResult?.amount} ${parseResult?.token} → ${parseResult?.output_token}`
                  : `${parseResult?.amount} ${parseResult?.token ?? "SOL"} → @${resolveResult?.handle ?? "recipient"}`}
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

        {publicKey && (
          <div className="hidden lg:block w-72 shrink-0 space-y-4">
            <div
              className="glass-card p-4 sticky top-20 animate-slide-up"
              style={{ animationDelay: "0.15s" }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Wallet className="w-4 h-4 text-primary" />
                <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  {t("smart_router.your_balance", "Your Balance")}
                </h3>
              </div>

              {balanceLoading ? (
                <div className="space-y-2 animate-pulse">
                  <div className="h-6 bg-muted/40 rounded w-2/3" />
                  <div className="h-4 bg-muted/30 rounded w-1/2" />
                </div>
              ) : !balance ? (
                <p className="text-xs text-muted-foreground">
                  Unable to load balance
                </p>
              ) : (
                <div className="space-y-3">
                  <div>
                    <p className="text-xl font-bold text-foreground">
                      $
                      {(balance.total_usd_value ?? 0).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Total Balance
                    </p>
                  </div>

                  <div className="flex items-center justify-between py-2 border-t border-border/30">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-[10px] font-bold text-white">
                        ◎
                      </div>
                      <span className="text-xs font-medium text-foreground">
                        SOL
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium text-foreground">
                        {(balance.sol_balance ?? 0).toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 4,
                        })}
                      </p>
                      {(balance.sol_usd_value ?? 0) > 0 && (
                        <p className="text-[10px] text-muted-foreground">
                          $
                          {(balance.sol_usd_value ?? 0).toLocaleString(
                            "en-US",
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            },
                          )}
                        </p>
                      )}
                    </div>
                  </div>

                  {getMergedTokens().map((token: any, i: number) => (
                      <div
                        key={token.mint ?? token.symbol ?? i}
                        className="flex items-center justify-between py-2 border-t border-border/30"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center text-[10px] font-bold text-foreground">
                            {token.symbol?.[0] ?? "?"}
                          </div>
                          <span className="text-xs font-medium text-foreground">
                            {token.symbol}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-medium text-foreground">
                            {(token.balance ?? 0).toLocaleString("en-US", {
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 4,
                            })}
                          </p>
                          {token.usd_value && (
                            <p className="text-[10px] text-muted-foreground">
                              $
                              {(token.usd_value ?? 0).toLocaleString(
                                "en-US",
                                {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                },
                              )}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}

                  {getMergedTokens().length === 0 &&
                    (balance.sol_balance ?? 0) === 0 && (
                      <p className="text-[10px] text-muted-foreground text-center py-1">
                        No assets found
                      </p>
                    )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default SmartRouter;
