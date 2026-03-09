import { useEffect, useState } from "react";
import { getNeighbors } from "@/services/blockidApi";

interface Neighbor {
  wallet: string;
  interactions?: number;
  risk_score?: number;
}

interface TopNeighborsProps {
  wallet: string;
  onSelectWallet?: (wallet: string) => void;
}

function shortenAddress(addr: string): string {
  if (!addr || addr.length <= 8) return addr;
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
}

function getRiskColor(score?: number): string {
  if (score == null) return "text-muted-foreground";
  if (score >= 80) return "text-red-500";
  if (score >= 60) return "text-orange-500";
  if (score >= 30) return "text-yellow-500";
  return "text-green-500";
}

export default function TopNeighbors({ wallet, onSelectWallet }: TopNeighborsProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [neighbors, setNeighbors] = useState<Neighbor[]>([]);

  useEffect(() => {
    if (!wallet.trim()) {
      setNeighbors([]);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    getNeighbors(wallet)
      .then((data) => {
        const list = data.neighbors ?? data ?? [];
        const arr = Array.isArray(list)
          ? list.map((n: { wallet?: string; address?: string; interactions?: number; risk_score?: number }) => ({
              wallet: String(n.wallet ?? n.address ?? ""),
              interactions: n.interactions,
              risk_score: n.risk_score,
            })).filter((n) => n.wallet)
          : [];
        setNeighbors(arr);
      })
      .catch((err) => {
        setError(err?.message ?? "Failed to load neighbors");
        setNeighbors([]);
      })
      .finally(() => setLoading(false));
  }, [wallet]);

  if (!wallet.trim()) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 min-h-[200px] flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Enter a wallet to view neighbors.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 min-h-[200px] flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading neighbors...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 min-h-[200px] flex items-center justify-center">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  if (neighbors.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 min-h-[200px] flex items-center justify-center">
        <p className="text-sm text-muted-foreground">No neighbors found.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Top Neighbors</h3>
        <p className="text-xs text-gray-400 mt-0.5">Connected wallets with interactions and risk.</p>
      </div>
      <div className="space-y-2">
        {neighbors.map((n, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onSelectWallet?.(n.wallet)}
            className="w-full flex items-center justify-between gap-4 px-3 py-2 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 text-left transition-colors"
          >
            <span className="font-mono text-sm text-foreground truncate">
              {shortenAddress(n.wallet)}
            </span>
            <div className="flex gap-4 shrink-0 text-xs">
              <span className="text-muted-foreground">
                {n.interactions != null ? `${n.interactions} int.` : "—"}
              </span>
              <span className={getRiskColor(n.risk_score)}>
                {n.risk_score != null ? `${n.risk_score}` : "—"}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
