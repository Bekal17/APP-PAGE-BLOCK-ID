import { useState, useEffect } from "react";
import HeatMap from "react-heatmap-grid";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_FULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const HOUR_LABELS = Array.from({ length: 24 }, (_, i) => `${i}`);

function generateMockData(): number[][] {
  return DAY_LABELS.map((_, yi) =>
    Array.from({ length: 24 }, (_, xi) => {
      const hour = xi;
      const day = yi;
      const workHours = hour >= 9 && hour <= 17 ? 1.5 : 1;
      const weekday = day >= 1 && day <= 5 ? 1.3 : 0.8;
      const base = 0.5 + 0.5 * Math.sin(xi * 0.3) * Math.cos(yi * 0.5);
      return Math.max(0, Math.floor((base * workHours * weekday * 12) + Math.random() * 4));
    })
  );
}

function interpolateColor(ratio: number): string {
  if (ratio <= 0) return "rgb(55, 55, 60)";
  if (ratio >= 1) return "rgb(190, 100, 255)";
  if (ratio < 0.5) {
    const t = ratio * 2;
    const r = Math.round(55 + (120 - 55) * t);
    const g = Math.round(55 + (80 - 55) * t);
    const b = Math.round(60 + (180 - 60) * t);
    return `rgb(${r}, ${g}, ${b})`;
  }
  const t = (ratio - 0.5) * 2;
  const r = Math.round(120 + (190 - 120) * t);
  const g = Math.round(80);
  const b = Math.round(180 + (255 - 180) * t);
  return `rgb(${r}, ${g}, ${b})`;
}

export default function MoneyFlowHeatmap({ wallet }: { wallet: string }) {
  const [data, setData] = useState<number[][]>(() => generateMockData());

  useEffect(() => {
    if (!wallet) return;
    fetch(`http://172.22.80.1:8001/explorer/identity/${encodeURIComponent(wallet)}/activity-heatmap`)
      .then((r) => r.json())
      .then((json) => {
        if (json.heatmap && json.heatmap.length === 7) {
          setData(json.heatmap);
        }
      })
      .catch(() => {});
  }, [wallet]);

  const cellStyle = (background: string, value: number, min: number, max: number) => {
    const range = max - min || 1;
    const ratio = (value - min) / range;
    return {
      background: interpolateColor(ratio),
      opacity: 0.6 + ratio * 0.4,
      fontSize: "11px",
      color: ratio > 0.6 ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.5)",
    };
  };

  const title = (value: number, _unit: string, xi: number, yi: number) => {
    const day = DAY_FULL[yi] ?? "Unknown";
    const hour = `${String(xi).padStart(2, "0")}:00`;
    return `${day} ${hour} — ${value} transaction${value !== 1 ? "s" : ""}`;
  };

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 card-hover-glow [&_#outer-container]:text-gray-400">
      <h3 className="text-sm font-semibold text-foreground mb-2">Money Flow Activity</h3>
      <p className="text-xs text-gray-400 mb-4">
        Transaction activity by day of week and hour.
      </p>
      <div className="w-full overflow-x-auto">
        <div className="min-w-[640px]">
          <HeatMap
            xLabels={HOUR_LABELS}
            yLabels={DAY_LABELS}
            data={data}
            background="rgb(55, 55, 60)"
            height={24}
            xLabelWidth={28}
            yLabelWidth={36}
            xLabelsLocation="bottom"
            squares={false}
            cellStyle={cellStyle}
            cellRender={() => null}
            title={title}
            unit=""
            onClick={() => {}}
          />
        </div>
      </div>
    </div>
  );
}
