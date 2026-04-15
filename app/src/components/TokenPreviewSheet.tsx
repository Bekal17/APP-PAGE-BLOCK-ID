import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
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

  return (
    <Sheet open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-4" />

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
            <p className="text-sm font-medium">0</p>
            <p className="text-xs text-muted-foreground">Coming soon</p>
          </div>
        </div>

        <div className="border-t pt-3 mt-3">
          <p className="text-sm font-medium">Discussed by 0 wallets with Trust Score &gt;70</p>
          <p className="text-xs text-muted-foreground">Coming soon</p>
        </div>

        <Button
          variant="outline"
          className="w-full mt-4"
          onClick={() => window.open(`https://jup.ag/swap/SOL-${mintAddress}`, "_blank")}
        >
          View on Jupiter
        </Button>
      </SheetContent>
    </Sheet>
  );
}
