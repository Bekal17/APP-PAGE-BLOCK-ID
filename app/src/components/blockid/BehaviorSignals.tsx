import React from "react";

interface Props {
  propagationSignal: string;
  exposureRatio: number;
  primaryRiskDriver: string | null;
  category: string;
}

export default function BehaviorSignals({
  propagationSignal,
  exposureRatio,
  primaryRiskDriver,
  category,
}: Props) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 min-h-[220px] space-y-4 card-hover-glow">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Behavior Signals</h3>
        <p className="text-xs text-gray-400 mt-0.5">AI-detected wallet behavior indicators.</p>
      </div>

      <div className="divide-y divide-zinc-800">
        <div className="flex justify-between text-sm py-3">
          <span className="text-gray-400">Propagation Signal</span>
          <span className="text-foreground font-medium">{propagationSignal}</span>
        </div>
        <div className="flex justify-between text-sm py-3">
          <span className="text-gray-400">Exposure Ratio</span>
          <span className="text-foreground font-medium">{exposureRatio}%</span>
        </div>
        <div className="flex justify-between text-sm py-3">
          <span className="text-gray-400">Primary Risk Driver</span>
          <span className="text-foreground font-medium">{primaryRiskDriver ?? "None detected"}</span>
        </div>
        <div className="flex justify-between text-sm py-3">
          <span className="text-gray-400">Category</span>
          <span className="text-foreground font-medium">{category}</span>
        </div>
      </div>
    </div>
  );
}
