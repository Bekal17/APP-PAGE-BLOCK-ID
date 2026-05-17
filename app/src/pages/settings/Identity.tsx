import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { usePhantomAuth } from "@/hooks/usePhantomAuth";
import { AtSign, CheckCircle, XCircle, Loader2, ExternalLink } from "lucide-react";
import SettingsLayout from "@/components/SettingsLayout";

const API_BASE =
  import.meta.env.VITE_EXPLORER_API_URL ||
  "https://blockid-backend-production.up.railway.app";

type HandleStatus =
  | { state: "idle" }
  | { state: "checking" }
  | { state: "available"; handle: string }
  | { state: "unavailable"; code: string; handle: string }
  | { state: "error"; code: string }
  | { state: "success"; handle: string };

const DEBOUNCE_MS = 600;

const IdentitySettings = () => {
  const { t } = useTranslation();
  const { publicKey } = usePhantomAuth();
  const wallet = publicKey?.toString() ?? "";

  const [currentHandle, setCurrentHandle] = useState<string | null>(null);
  const [currentHandleType, setCurrentHandleType] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<HandleStatus>({ state: "idle" });
  const [claiming, setClaiming] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!wallet) return;
    fetch(`${API_BASE}/profile/social/${wallet}`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.handle) {
          setCurrentHandle(data.handle);
          setCurrentHandleType(data.handle_type ?? null);
        }
      })
      .catch(() => {});
  }, [wallet]);

  useEffect(() => {
    const h = input.trim().toLowerCase();
    if (!h || h.length < 3) {
      setStatus({ state: "idle" });
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setStatus({ state: "checking" });
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE}/handle/block/check/${h}`);
        const data = await res.json();
        if (data.available) {
          setStatus({ state: "available", handle: h });
        } else {
          setStatus({
            state: "unavailable",
            code: data.code ?? "HANDLE_TAKEN_BLOCK",
            handle: h,
          });
        }
      } catch {
        setStatus({ state: "error", code: "NETWORK_ERROR" });
      }
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [input]);

  const handleClaim = async () => {
    if (status.state !== "available" || !wallet) return;
    setClaiming(true);
    try {
      const res = await fetch(`${API_BASE}/handle/block/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet,
          handle: status.handle,
          signature: "",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const code = data?.detail?.code ?? "UNKNOWN_ERROR";
        const existing = data?.detail?.existing ?? "";
        setStatus({ state: "error", code: `${code}|||${existing}` });
        return;
      }
      setCurrentHandle(data.handle);
      setCurrentHandleType("block");
      setInput("");
      setStatus({ state: "success", handle: data.handle });
    } catch {
      setStatus({ state: "error", code: "NETWORK_ERROR" });
    } finally {
      setClaiming(false);
    }
  };

  const resolveError = (code: string): string => {
    const [errorCode, existing] = code.split("|||");
    return t(`common.error_${errorCode}`, {
      handle: existing || input.trim().toLowerCase(),
      defaultValue: errorCode,
    });
  };

  const inputH = input.trim().toLowerCase();
  const canClaim = status.state === "available" && !claiming && !!wallet;

  return (
    <SettingsLayout title={t("settings.identity")}>
      <div className="max-w-lg space-y-6">

        {/* Current handle display */}
        {currentHandle && (
          <div className="rounded-xl border border-border bg-muted/40 px-4 py-4 space-y-1">
            <p className="text-sm text-muted-foreground">
              {t("common.block_handle_yours", { handle: currentHandle })}
            </p>
            {currentHandleType === "nft" && (
              <p className="text-xs text-emerald-400 font-medium">
                NFT handle · on-chain
              </p>
            )}
            {currentHandleType === "block" && (
              <p className="text-xs text-violet-400 font-medium">
                .Block handle · BlockID only
              </p>
            )}
          </div>
        )}

        {/* Claim form */}
        {!currentHandle && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                {t("common.block_handle_label")}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm select-none">
                  @
                </span>
                <input
                  type="text"
                  value={input}
                  onChange={(e) =>
                    setInput(
                      e.target.value
                        .replace(/[^a-z0-9_]/gi, "")
                        .toLowerCase()
                    )
                  }
                  placeholder={t("common.block_handle_placeholder")}
                  maxLength={20}
                  className="w-full pl-7 pr-16 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  .Block
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {t("common.error_HANDLE_INVALID_FORMAT")}
              </p>
            </div>

            {/* Status feedback */}
            {status.state === "checking" && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                {t("common.block_handle_checking")}
              </div>
            )}
            {status.state === "available" && (
              <div className="flex items-center gap-2 text-sm text-emerald-400">
                <CheckCircle className="w-4 h-4" />
                {t("common.block_handle_available", { handle: status.handle })}
              </div>
            )}
            {status.state === "unavailable" && (
              <div className="flex items-center gap-2 text-sm text-rose-400">
                <XCircle className="w-4 h-4" />
                {t(`common.error_${status.code}`, {
                  handle: status.handle,
                  defaultValue: status.code,
                })}
              </div>
            )}
            {status.state === "error" && (
              <div className="flex items-center gap-2 text-sm text-rose-400">
                <XCircle className="w-4 h-4" />
                {resolveError(status.code)}
              </div>
            )}
            {status.state === "success" && (
              <div className="flex items-center gap-2 text-sm text-emerald-400">
                <CheckCircle className="w-4 h-4" />
                {t("common.block_handle_success", { handle: status.handle })}
              </div>
            )}

            <button
              onClick={handleClaim}
              disabled={!canClaim}
              className="w-full py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
            >
              {claiming ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t("common.loading")}
                </span>
              ) : (
                t("common.block_handle_claim_btn", {
                  handle: inputH || "handle",
                })
              )}
            </button>
          </div>
        )}

        {/* Upgrade prompt for .Block users */}
        {currentHandleType === "block" && (
          <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 px-4 py-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {t("common.block_handle_upgrade")}
            </p>
            <ExternalLink className="w-4 h-4 text-violet-400" />
          </div>
        )}

      </div>
    </SettingsLayout>
  );
};

export default IdentitySettings;
