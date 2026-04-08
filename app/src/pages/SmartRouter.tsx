import { useState, useRef, type KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";
import { useWallet } from "@solana/wallet-adapter-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Zap, Send, ArrowRight, Loader2, AlertCircle, X } from "lucide-react";

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

const SmartRouter = () => {
  const { t } = useTranslation();
  const { publicKey } = useWallet();
  const inputRef = useRef<HTMLInputElement>(null);

  const [input, setInput] = useState("");
  const [parsing, setParsing] = useState(false);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  const handleParse = async () => {
    const text = input.trim();
    if (!text) return;

    setParsing(true);
    setParseError(null);
    setParseResult(null);

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

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleParse();
    }
  };

  const clearResult = () => {
    setParseResult(null);
    setParseError(null);
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

        {parseResult && !parseError && (
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
                  className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                  onClick={() => {
                    console.log("Continue to resolve & confirm", parseResult);
                  }}
                >
                  <ArrowRight className="w-4 h-4" />
                  {t("smart_router.continue", "Continue")}
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
