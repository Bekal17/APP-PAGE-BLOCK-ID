import React from "react";
import { useTranslation } from "react-i18next";
import { translateRiskTier } from "@/i18n/translateRiskTier";

interface Props {
  score: number;
  riskColor: string;
  riskTier?: string;
}

const colorMap: Record<string, string> = {
  RED: "#ef4444",
  ORANGE: "#f59e0b",
  YELLOW: "#eab308",
  GREEN: "#22c55e",
};

export default function ScoreRing({ score, riskColor, riskTier }: Props) {
  const { t } = useTranslation();
  const activeColor = colorMap[riskColor] ?? "#22c55e";
  const glowStrength = riskColor === "RED" ? 18 : 12;
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - score / 100);
  const size = 160;

  return (
    <div className="flex flex-col items-center text-center w-40">
      <div
        className="relative w-40 h-40"
        style={{
          filter: `drop-shadow(0 0 ${glowStrength}px ${activeColor})`,
        }}
      >
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth={10}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={activeColor}
            strokeWidth={10}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-700"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-4xl font-bold tracking-tight text-foreground">{score}</span>
        </div>
      </div>
      {riskTier && (
        <span
          className="mt-2 text-xs font-semibold px-3 py-1 rounded-full"
          style={{ backgroundColor: `${activeColor}20`, color: activeColor }}
        >
          {translateRiskTier(t, riskTier)}
        </span>
      )}
    </div>
  );
}
