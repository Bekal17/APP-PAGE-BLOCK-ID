import { type MouseEvent } from "react";
import { AlertTriangle } from "lucide-react";

export interface CashtagPillProps {
  ticker: string;
  mintAddress?: string;
  price?: number;
  change24h?: number;
  isVerified?: boolean;
  onClick?: (e?: MouseEvent<HTMLButtonElement>) => void;
}

const BASE_CLASSES =
  "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium cursor-pointer transition-opacity hover:opacity-80";
const DOT_CLASSES = "w-1.5 h-1.5 rounded-full flex-shrink-0";

function formatPrice(price: number): string {
  if (price >= 1) return `$${price.toFixed(2)}`;
  if (price >= 0.01) return `$${price.toFixed(4)}`;
  return `$${price.toFixed(6)}`;
}

function formatChange(change: number): string {
  const prefix = change > 0 ? "+" : "";
  return `${prefix}${change.toFixed(1)}%`;
}

export function CashtagPill({
  ticker,
  mintAddress,
  price,
  change24h,
  isVerified = true,
  onClick,
}: CashtagPillProps) {
  const normalizedTicker = ticker.startsWith("$") ? ticker : `$${ticker}`;

  if (mintAddress && price === undefined) {
    return <div className="w-20 h-5 rounded-full animate-pulse bg-zinc-700/50" />;
  }

  if (isVerified === false) {
    return (
      <button
        type="button"
        className={`${BASE_CLASSES} bg-purple-500/10 text-purple-400 border border-purple-500/25`}
        onClick={(e) => {
          e.stopPropagation();
          onClick?.(e);
        }}
      >
        <AlertTriangle className="w-3 h-3 flex-shrink-0 text-purple-400" />
        <span>{`${normalizedTicker} · unverified`}</span>
      </button>
    );
  }

  const formattedPrice = price !== undefined ? formatPrice(price) : undefined;
  const hasChange = typeof change24h === "number" && change24h !== 0;
  const isUp = typeof change24h === "number" && change24h > 0;
  const isDown = typeof change24h === "number" && change24h < 0;

  const toneClasses = isUp
    ? "bg-green-500/10 text-green-400 border border-green-500/25"
    : isDown
      ? "bg-red-500/10 text-red-400 border border-red-500/25"
      : "bg-zinc-500/15 text-zinc-400 border border-zinc-500/20";

  const dotColorClass = isUp ? "bg-green-400" : isDown ? "bg-red-400" : "bg-zinc-500";

  return (
    <button
      type="button"
      className={`${BASE_CLASSES} ${toneClasses}`}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(e);
      }}
    >
      <span className={`${DOT_CLASSES} ${dotColorClass}`} />
      <span>
        {normalizedTicker}
        {formattedPrice ? ` · ${formattedPrice}` : ""}
        {hasChange && change24h !== undefined ? ` · ${formatChange(change24h)}` : ""}
      </span>
    </button>
  );
}
