import { useMemo } from "react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export type RiskTier = "LOW" | "MEDIUM" | "HIGH";

export interface ExposureVector {
  subject: string;
  value: number;
  fullMark: number;
  explanation: string;
}

const VECTOR_DEFINITIONS: Omit<ExposureVector, "value">[] = [
  {
    subject: "Scam Cluster",
    fullMark: 100,
    explanation: "Exposure to wallets in known scam clusters or phishing networks.",
  },
  {
    subject: "High Risk Counterparties",
    fullMark: 100,
    explanation: "Transactions with wallets flagged for high-risk behavior.",
  },
  {
    subject: "Suspicious Tokens",
    fullMark: 100,
    explanation: "Holdings or trades involving tokens with scam or rug-pull history.",
  },
  {
    subject: "Drainer Interaction",
    fullMark: 100,
    explanation: "Past interactions with drainer contracts or drainer-associated addresses.",
  },
  {
    subject: "Mixer Exposure",
    fullMark: 100,
    explanation: "Use of or exposure to mixing services and privacy tools.",
  },
  {
    subject: "Wash Trading",
    fullMark: 100,
    explanation: "Potential circular or wash trading patterns in transaction history.",
  },
];

const MOCK_VALUES = [18, 42, 12, 8, 25, 35];

const RISK_COLORS: Record<RiskTier, { fill: string; stroke: string }> = {
  LOW: { fill: "hsl(142, 70%, 45%, 0.3)", stroke: "hsl(142, 70%, 45%)" },
  MEDIUM: { fill: "hsl(38, 92%, 50%, 0.3)", stroke: "hsl(38, 92%, 50%)" },
  HIGH: { fill: "hsl(0, 70%, 55%, 0.3)", stroke: "hsl(0, 70%, 55%)" },
};

function normalizeRiskTier(tier: string | undefined): RiskTier {
  const t = (tier ?? "").toUpperCase();
  if (t === "RED" || t === "HIGH") return "HIGH";
  if (t === "AMBER" || t === "ORANGE" || t === "YELLOW" || t === "MEDIUM") return "MEDIUM";
  return "LOW";
}

interface RiskExposureRadarProps {
  riskTier?: string;
  data?: Partial<Record<string, number>>;
}

export default function RiskExposureRadar({ riskTier = "LOW", data }: RiskExposureRadarProps) {
  const tier = normalizeRiskTier(riskTier);
  const colors = RISK_COLORS[tier];

  const chartData = useMemo(() => {
    return VECTOR_DEFINITIONS.map((def, i) => ({
      ...def,
      value: data?.[def.subject] ?? MOCK_VALUES[i] ?? 0,
    }));
  }, [data]);

  const customTooltip = ({ active, payload }: { active?: boolean; payload?: { payload: ExposureVector }[] }) => {
    if (!active || !payload?.[0]) return null;
    const item = payload[0].payload;
    return (
      <div
        className="rounded-lg border border-border bg-popover px-3 py-2 shadow-md max-w-[260px]"
        style={{
          backgroundColor: "hsl(222, 20%, 12%)",
          borderColor: "hsl(222, 15%, 22%)",
        }}
      >
        <p className="font-semibold text-foreground text-sm">{item.subject}</p>
        <p className="text-muted-foreground text-xs mt-1">{item.value} / 100</p>
        <p className="text-muted-foreground text-xs mt-2 leading-relaxed">{item.explanation}</p>
      </div>
    );
  };

  return (
    <div className="rounded-2xl border border-border bg-card/40 backdrop-blur p-6 transition-shadow hover:shadow-[0_0_20px_rgba(0,255,200,0.15)] col-span-1 md:col-span-2 lg:col-span-12">
      <h2 className="text-lg font-semibold text-foreground mb-4">Risk Exposure</h2>
      <div className="w-full h-80">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={chartData} cx="50%" cy="50%" outerRadius="70%">
            <PolarGrid
              stroke="hsl(222, 15%, 25%)"
              strokeDasharray="3 3"
            />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fill: "hsl(215, 15%, 65%)", fontSize: 11 }}
              tickLine={false}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={{ fill: "hsl(215, 15%, 55%)", fontSize: 10 }}
              tickCount={5}
            />
            <Radar
              name="Exposure"
              dataKey="value"
              stroke={colors.stroke}
              fill={colors.fill}
              strokeWidth={2}
            />
            <Tooltip content={customTooltip} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
