import React from "react";
import ScoreRing from "@/components/blockid/ScoreRing";
import RiskBadge from "@/components/blockid/RiskBadge";
import ConfidenceMeter from "@/components/blockid/ConfidenceMeter";
import BadgesPanel from "@/components/blockid/BadgesPanel";
import ActionPanel from "@/components/blockid/ActionPanel";
import RiskLegend from "@/components/blockid/RiskLegend";
import BehaviorSignals from "@/components/blockid/BehaviorSignals";
import ClusterRiskCard from "@/components/blockid/investigation/ClusterRiskCard";

const colorMap: Record<string, string> = {
  RED: "#ef4444",
  ORANGE: "#f59e0b",
  YELLOW: "#eab308",
  GREEN: "#22c55e",
};

interface Props {
  score: number;
  risk: string;
  riskColor: string;
  summaryMessage: string;
  badges: string[];
  confidence: string;
  cluster: { cluster_id?: string; size?: number } | null;
  propagationSignal: string;
  exposureRatio: number;
  primaryRiskDriver: string | null;
  category: string;
  recommendedActions: string[];
}

export default function SimpleModeLayout({
  score,
  risk,
  riskColor,
  summaryMessage,
  badges,
  confidence,
  cluster,
  propagationSignal,
  exposureRatio,
  primaryRiskDriver,
  category,
  recommendedActions,
}: Props) {
  const activeColor = colorMap[riskColor] ?? "#22c55e";

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* LEFT COLUMN */}
      <div className="space-y-6">
        <div className="p-6 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 flex flex-col items-center gap-4 card-hover-glow">
<ScoreRing
    score={score}
    riskColor={riskColor}
  />
          <RiskBadge
            riskTier={risk}
            riskColor={riskColor}
          />
          <p className="text-sm text-gray-400 text-center">
            {summaryMessage}
          </p>
        </div>
        <ActionPanel actions={recommendedActions} />
      </div>

      {/* RIGHT COLUMN */}
      <div className="space-y-6">
        <BadgesPanel badges={badges} />
        <ConfidenceMeter
          confidence={confidence}
          color={activeColor}
        />
        <ClusterRiskCard cluster={cluster} />
        <BehaviorSignals
          propagationSignal={propagationSignal}
          exposureRatio={exposureRatio}
          primaryRiskDriver={primaryRiskDriver}
          category={category}
        />
        <RiskLegend />
      </div>
    </div>
  );
}
