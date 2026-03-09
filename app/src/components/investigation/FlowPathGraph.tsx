import { useEffect, useState } from "react";
import { getFlowPath } from "@/services/blockidApi";

interface FlowEdge {
  source: string;
  target: string;
}

interface FlowPathGraphProps {
  wallet: string;
  onSelectWallet?: (wallet: string) => void;
}

function shortenAddress(addr: string): string {
  if (!addr || addr.length <= 8) return addr;
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
}

export default function FlowPathGraph({ wallet, onSelectWallet }: FlowPathGraphProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [flows, setFlows] = useState<FlowEdge[]>([]);

  useEffect(() => {
    if (!wallet.trim()) {
      setFlows([]);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    getFlowPath(wallet)
      .then((data) => {
        const edges = data.flows ?? data.edges ?? data;
        const list = Array.isArray(edges)
          ? edges.map((f: { source?: string; target?: string; from?: string; to?: string }) => ({
              source: String(f.source ?? f.from ?? ""),
              target: String(f.target ?? f.to ?? ""),
            })).filter((f) => f.source && f.target)
          : [];
        setFlows(list);
      })
      .catch((err) => {
        setError(err?.message ?? "Failed to load flow path");
        setFlows([]);
      })
      .finally(() => setLoading(false));
  }, [wallet]);

  if (!wallet.trim()) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 min-h-[200px] flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Enter a wallet to view flow path.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 min-h-[200px] flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading flow path...</p>
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

  if (flows.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 min-h-[200px] flex items-center justify-center">
        <p className="text-sm text-muted-foreground">No flow path detected.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Flow Path</h3>
        <p className="text-xs text-gray-400 mt-0.5">Transaction flow: source → target</p>
      </div>
      <div className="space-y-3">
        {flows.map((flow, i) => (
          <div
            key={i}
            className="flex flex-wrap items-center gap-2 text-sm"
          >
            <button
              type="button"
              onClick={() => onSelectWallet?.(flow.source)}
              className="font-mono px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-cyan-400 transition-colors"
            >
              {shortenAddress(flow.source)}
            </button>
            <span className="text-zinc-500">→</span>
            <button
              type="button"
              onClick={() => onSelectWallet?.(flow.target)}
              className="font-mono px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-cyan-400 transition-colors"
            >
              {shortenAddress(flow.target)}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
