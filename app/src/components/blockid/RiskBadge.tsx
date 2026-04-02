import React from "react";
import { useTranslation } from "react-i18next";
import { translateRiskTier } from "@/i18n/translateRiskTier";

interface Props {
  riskTier: string;
  riskColor: string;
}

const colorMap: Record<string, string> = {
  RED: "#ef4444",
  ORANGE: "#f59e0b",
  YELLOW: "#eab308",
  GREEN: "#22c55e",
};

export default function RiskBadge({ riskTier, riskColor }: Props) {
  const { t } = useTranslation();
  const color = colorMap[riskColor] ?? "#22c55e";

  return (
    <span
      className="rounded-full text-xs font-semibold px-3 py-1"
      style={{
        backgroundColor: `${color}20`,
        color,
      }}
    >
      {translateRiskTier(t, riskTier)}
    </span>
  );
}
