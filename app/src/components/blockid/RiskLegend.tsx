import React from "react";

const riskItems = [
  {
    tier: "LOW",
    color: "#22c55e",
    explanation: "Wallet shows minimal risk signals.",
  },
  {
    tier: "MEDIUM",
    color: "#f59e0b",
    explanation: "Wallet requires further review due to risk indicators.",
  },
  {
    tier: "HIGH",
    color: "#ef4444",
    explanation: "Wallet shows strong direct risk indicators.",
  },
] as const;

export default function RiskLegend() {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 card-hover-glow">
      <h3 className="text-sm font-semibold text-foreground">Risk Levels</h3>
      <p className="text-xs text-gray-400 mt-0.5 mb-4">How BlockID interprets wallet risk.</p>

      <div className="space-y-4">
        {riskItems.map((item) => {
          const colorName = item.tier === "LOW" ? "Green" : item.tier === "MEDIUM" ? "Amber" : "Red";
          return (
            <div key={item.tier} className="flex items-center gap-3">
              <div
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-sm font-medium text-foreground shrink-0 min-w-[7rem]">
                {item.tier} ({colorName})
              </span>
              <p className="text-sm text-gray-400">{item.explanation}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
