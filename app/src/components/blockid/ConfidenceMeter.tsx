import React from "react";

interface Props {
  confidence: string;
  color: string;
}

const getConfidencePercent = (level: string) => {
  switch (level) {
    case "HIGH":
      return 90;
    case "MEDIUM":
      return 65;
    case "LOW":
      return 40;
    default:
      return 50;
  }
};

export default function ConfidenceMeter({ confidence, color }: Props) {
  const percent = getConfidencePercent(confidence);

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm text-gray-400">
        <span>AI Confidence</span>
        <span>{confidence}</span>
      </div>

      <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${percent}%`,
            background: color,
            boxShadow: `0 0 8px ${color}`,
          }}
        />
      </div>
    </div>
  );
}
