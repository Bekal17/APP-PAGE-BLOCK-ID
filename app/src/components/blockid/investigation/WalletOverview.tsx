import React from "react";
import ScoreRing from "@/components/blockid/ScoreRing";
import RiskBadge from "@/components/blockid/RiskBadge";

interface Props {
  wallet: string;
  score: number;
  risk: string;
  riskColor: string;
  propagationSignal?: string;
  cluster?: { cluster_id?: string; size?: number } | null;
}

export default function WalletOverview({
  wallet,
  score,
  risk,
  riskColor,
  propagationSignal = "",
  cluster,
}: Props) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 card-hover-glow">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-8">
        <div className="flex items-center gap-4">
<ScoreRing score={score} riskColor={riskColor} riskTier={risk} />
        </div>
        <div className="space-y-4 flex-1 min-w-0">
          <div>
            <p className="text-sm text-muted-foreground">Wallet</p>
            <p className="font-mono text-sm text-foreground truncate" title={wallet}>
              {wallet.length > 20 ? `${wallet.slice(0, 8)}...${wallet.slice(-8)}` : wallet}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Risk Propagation</p>
            <p className="font-medium text-foreground">{propagationSignal || "—"}</p>
          </div>
          {cluster && (
            <div>
              <p className="text-sm text-muted-foreground">Cluster</p>
              <p className="text-foreground">
                Cluster #{cluster.cluster_id ?? "—"} · {cluster.size ?? cluster.member_count ?? "?"} wallets
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
