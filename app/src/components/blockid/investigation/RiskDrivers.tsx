import React from "react";

interface Props {
  primaryRiskDriver: string | null;
  badges?: string[];
  category?: string;
}

const DRIVER_EXPLANATIONS: Record<string, string> = {
  SCAM_CLUSTER_MEMBER: "Wallet belongs to a cluster containing flagged wallets.",
  HIGH_RISK_SELF: "Direct risk indicators detected for this wallet.",
};

function getExplanation(driver: string): string {
  return DRIVER_EXPLANATIONS[driver] ?? "Risk factor identified for this wallet.";
}

export default function RiskDrivers({ primaryRiskDriver, badges = [], category = "" }: Props) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 min-h-[220px] space-y-4 card-hover-glow">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Risk Drivers</h3>
        <p className="text-xs text-gray-400 mt-0.5">Key factors contributing to wallet risk.</p>
      </div>

      <div className="space-y-3">
        {primaryRiskDriver ? (
          <div className="space-y-1">
            <span className="inline-block bg-zinc-800 rounded-md text-xs px-2 py-1 text-foreground font-medium">
              {primaryRiskDriver}
            </span>
            <p className="text-xs text-gray-400">{getExplanation(primaryRiskDriver)}</p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No dominant risk driver detected.</p>
        )}

        {badges.map((badge, i) => (
          <div key={i} className="space-y-1">
            <span className="inline-block bg-zinc-800 rounded-md text-xs px-2 py-1 text-muted-foreground">
              {badge}
            </span>
            <p className="text-xs text-gray-400">{getExplanation(badge)}</p>
          </div>
        ))}

        {category && (
          <div className="space-y-1">
            <span className="inline-block bg-zinc-800 rounded-md text-xs px-2 py-1 text-foreground font-medium">
              {category}
            </span>
            <p className="text-xs text-gray-400">{getExplanation(category)}</p>
          </div>
        )}
      </div>
    </div>
  );
}
