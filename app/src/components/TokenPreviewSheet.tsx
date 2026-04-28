import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type { JupiterToken } from "@/hooks/useTokenList";

interface TokenPreviewSheetProps {
  open: boolean;
  onClose: () => void;
  ticker: string;
  mintAddress: string;
  token: JupiterToken | null;
  price?: number;
  change24h?: number;
  isVerified: boolean;
}

interface CashtagStats {
  trusted_wallet_count: number;
  post_count_today: number;
  wallets: Array<{
    wallet: string;
    handle: string | null;
    trust_score: number;
    avatar_url: string | null;
    avatar_type: string | null;
    avatar_is_animated: boolean;
  }>;
}

function formatPrice(price?: number): string {
  if (price === undefined) return "--";
  if (price >= 1) return `$${price.toFixed(2)}`;
  if (price >= 0.01) return `$${price.toFixed(4)}`;
  return `$${price.toFixed(6)}`;
}

function formatChange(change24h?: number): string | null {
  if (change24h === undefined || change24h === 0) return null;
  const prefix = change24h > 0 ? "+" : "";
  return `${prefix}${change24h.toFixed(1)}%`;
}

function truncateMint(mintAddress: string): string {
  if (mintAddress.length <= 8) return mintAddress;
  return `${mintAddress.slice(0, 4)}...${mintAddress.slice(-4)}`;
}

export function TokenPreviewSheet({
  open,
  onClose,
  ticker,
  mintAddress,
  token,
  price,
  change24h,
  isVerified,
}: TokenPreviewSheetProps) {
  const [cashtagStats, setCashtagStats] = useState<CashtagStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    if (!open || !ticker) return;
    setStatsLoading(true);
    setCashtagStats(null);
    fetch(
      `https://blockid-backend-production.up.railway.app/social/cashtag/${ticker}/stats`,
    )
      .then((r) => r.json())
      .then((data) => setCashtagStats(data))
      .catch(() => setCashtagStats(null))
      .finally(() => setStatsLoading(false));
  }, [open, ticker]);

  const normalizedTicker = ticker.startsWith("$") ? ticker : `$${ticker}`;
  const changeText = formatChange(change24h);
  const changeColorClass =
    change24h === undefined || change24h === 0
      ? "text-muted-foreground"
      : change24h > 0
        ? "text-green-600"
        : "text-red-600";

  const displayName = token?.name ?? normalizedTicker;
  const displaySymbol = token?.symbol ?? normalizedTicker.replace("$", "");
  const logoFallbackText = normalizedTicker.replace("$", "").slice(0, 3).toUpperCase();

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="max-w-md w-full mx-auto rounded-xl bg-zinc-900 border border-zinc-700 p-4"
        onClick={(e) => e.stopPropagation()}
      >

        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {token?.logoURI ? (
              <img src={token.logoURI} alt={displaySymbol} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs font-medium flex-shrink-0">
                {logoFallbackText}
              </div>
            )}

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium truncate">{displayName}</p>
                {isVerified && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-700 border border-green-200">
                    Verified
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{normalizedTicker}</p>
            </div>
          </div>

          <div className="text-right shrink-0">
            <p className="font-medium">{formatPrice(price)}</p>
            {changeText && <p className={`text-sm ${changeColorClass}`}>{changeText}</p>}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 bg-muted rounded-lg p-3 mt-4">
          <div>
            <p className="text-xs text-muted-foreground">Mint</p>
            <p className="text-sm font-medium">{truncateMint(mintAddress)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Status</p>
            <p className={`text-sm font-medium ${isVerified ? "text-green-600" : "text-amber-600"}`}>
              {isVerified ? "Verified ✓" : "Unverified ⚠"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Posts today</p>
            <p className="text-sm font-medium">
              {statsLoading ? "..." : (cashtagStats?.post_count_today ?? 0)}
            </p>
          </div>
        </div>

        <div className="border-t pt-3 mt-3">
          {statsLoading ? (
            <div style={{ fontSize: 12, color: "var(--color-text-tertiary)" }}>
              Loading...
            </div>
          ) : cashtagStats && cashtagStats.trusted_wallet_count > 0 ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ display: "flex" }}>
                {cashtagStats.wallets.slice(0, 3).map((w, i) => (
                  <div
                    key={w.wallet}
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      marginLeft: i === 0 ? 0 : -5,
                      border: "1.5px solid var(--color-background-primary)",
                      background: "var(--color-background-secondary)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 9,
                      fontWeight: 500,
                      color: "var(--color-text-secondary)",
                      overflow: "hidden",
                      flexShrink: 0,
                    }}
                  >
                    {w.avatar_url ? (
                      <img
                        src={w.avatar_url}
                        alt={w.handle ?? w.wallet}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      (w.handle ?? w.wallet)[0]?.toUpperCase()
                    )}
                  </div>
                ))}
              </div>
              <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
                Discussed by {cashtagStats.trusted_wallet_count} wallet
                {cashtagStats.trusted_wallet_count !== 1 ? "s" : ""} with Trust
                Score &gt;50
              </span>
            </div>
          ) : (
            <span style={{ fontSize: 12, color: "var(--color-text-tertiary)" }}>
              No trusted wallets discussing this token yet
            </span>
          )}
        </div>

        <Button
          variant="outline"
          className="w-full mt-4"
          onClick={() => window.open(`https://jup.ag/swap/SOL-${mintAddress}`, "_blank")}
        >
          View on Jupiter
        </Button>
      </div>
    </div>
  );
}
