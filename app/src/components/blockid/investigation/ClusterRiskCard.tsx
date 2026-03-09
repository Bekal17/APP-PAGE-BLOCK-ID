import React from "react";

interface Props {
  cluster: { cluster_id?: string; size?: number } | null;
}

export default function ClusterRiskCard({ cluster }: Props) {
  if (!cluster) return null;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4 card-hover-glow">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Cluster</h3>
        <p className="text-xs text-gray-400 mt-0.5">Wallet cluster assignment.</p>
      </div>
      <div className="text-sm text-muted-foreground">
        Cluster #{cluster.cluster_id ?? "—"} · {cluster.size ?? "—"} wallets
      </div>
    </div>
  );
}
