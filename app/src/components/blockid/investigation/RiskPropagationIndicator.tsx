import React from "react";

interface Props {
  propagationSignal: string;
}

const SIGNAL_CONFIG: Record<
  string,
  { dots: number; color: string; explanation: string }
> = {
  LOW: {
    dots: 1,
    color: "text-green-500",
    explanation: "No significant propagation risk detected.",
  },
  MEDIUM: {
    dots: 2,
    color: "text-amber-500",
    explanation: "Wallet shows indirect exposure to risky entities.",
  },
  HIGH: {
    dots: 3,
    color: "text-red-500",
    explanation: "Wallet has direct exposure to high-risk entities.",
  },
};

export default function RiskPropagationIndicator({ propagationSignal }: Props) {
  const level = (propagationSignal || "LOW").toUpperCase();
  const config = SIGNAL_CONFIG[level] ?? SIGNAL_CONFIG.LOW;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-3 card-hover-glow">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Risk Propagation</h3>
        <p className="text-xs text-gray-400 mt-0.5">
          Exposure to risky entities through network connections.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-foreground">{level}</span>
        <span className={`flex gap-1 ${config.color}`}>
          {Array.from({ length: config.dots }, (_, i) => (
            <span key={i} aria-hidden="true">
              ●
            </span>
          ))}
        </span>
      </div>

      <p className="text-sm text-muted-foreground">{config.explanation}</p>
    </div>
  );
}
