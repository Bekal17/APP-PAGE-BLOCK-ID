import { useState, useMemo, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronDown } from "lucide-react";

type RangeKey = "1D" | "1W" | "30D" | "1Y";

const RANGES: RangeKey[] = ["1D", "1W", "30D", "1Y"];
const LEGEND_TOP_COUNT = 5;

const MOCK_TOKEN_SYMBOLS = [
  "SOL", "USDC", "BONK", "JUP", "PYTH", "RAY", "ORCA", "SRM", "MNGO",
  "COPE", "STEP", "MEDIA", "ROPE", "FIDA", "MAPS", "OXY", "PORT", "SNY",
  "SLIM", "mSOL",
];

function getTokenColor(index: number, total: number): string {
  const hue = (220 + (index * 137.5)) % 360;
  return `hsl(${hue}, 72%, 52%)`;
}

function buildMockMultiTokenData(
  timeLabels: string[],
  tokenSymbols: string[],
  baseScale: number
): Record<string, number | string>[] {
  return timeLabels.map((time, i) => {
    const point: Record<string, number | string> = { time };
    tokenSymbols.forEach((sym, j) => {
      const variance = 0.6 + 0.4 * Math.sin(i * 0.7 + j * 0.5);
      point[sym] = Math.round(baseScale * (0.3 + (j / tokenSymbols.length) * 0.7) * variance * 100);
    });
    return point;
  });
}

const TIME_1D = ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00", "24:00"];
const TIME_1W = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const TIME_30D = ["W1", "W2", "W3", "W4"];
const TIME_1Y = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const MOCK_DATA_1D = buildMockMultiTokenData(TIME_1D, MOCK_TOKEN_SYMBOLS, 2.5);
const MOCK_DATA_1W = buildMockMultiTokenData(TIME_1W, MOCK_TOKEN_SYMBOLS, 12);
const MOCK_DATA_30D = buildMockMultiTokenData(TIME_30D, MOCK_TOKEN_SYMBOLS, 35);
const MOCK_DATA_1Y = buildMockMultiTokenData(TIME_1Y, MOCK_TOKEN_SYMBOLS, 120);

const DATA_MAP: Record<RangeKey, Record<string, number | string>[]> = {
  "1D": MOCK_DATA_1D,
  "1W": MOCK_DATA_1W,
  "30D": MOCK_DATA_30D,
  "1Y": MOCK_DATA_1Y,
};

function buildMockInflowOutflowData(
  timeLabels: string[],
  baseScale: number
): { time: string; inflow: number; outflow: number }[] {
  return timeLabels.map((time, i) => {
    const baseIn = baseScale * (0.5 + 0.4 * Math.sin(i * 0.5));
    const baseOut = baseScale * (0.45 + 0.35 * Math.sin(i * 0.5 + 0.8));
    return {
      time,
      inflow: Math.round(baseIn * 100),
      outflow: Math.round(baseOut * 100),
    };
  });
}

const IO_DATA_1D = buildMockInflowOutflowData(TIME_1D, 2.2);
const IO_DATA_1W = buildMockInflowOutflowData(TIME_1W, 11);
const IO_DATA_30D = buildMockInflowOutflowData(TIME_30D, 32);
const IO_DATA_1Y = buildMockInflowOutflowData(TIME_1Y, 110);

const INFLOW_OUTFLOW_MAP: Record<RangeKey, { time: string; inflow: number; outflow: number }[]> = {
  "1D": IO_DATA_1D,
  "1W": IO_DATA_1W,
  "30D": IO_DATA_30D,
  "1Y": IO_DATA_1Y,
};

function buildRealInflowData(
  activity: { date: string; tx: number }[],
  range: RangeKey
): { time: string; inflow: number; outflow: number }[] {
  if (!activity || activity.length === 0) return INFLOW_OUTFLOW_MAP[range];
  if (range === "30D") {
    const weeks: Record<string, number> = { W1: 0, W2: 0, W3: 0, W4: 0 };
    activity.forEach(({ date, tx }) => {
      const day = new Date(date).getDate();
      const week = day <= 7 ? "W1" : day <= 14 ? "W2" : day <= 21 ? "W3" : "W4";
      weeks[week] += tx;
    });
    return ["W1", "W2", "W3", "W4"].map((w) => ({
      time: w,
      inflow: Math.round(weeks[w] * 0.6),
      outflow: Math.round(weeks[w] * 0.4),
    }));
  }
  return INFLOW_OUTFLOW_MAP[range];
}

const AGGREGATE_COLOR = "hsl(185, 80%, 55%)";
const INFLOW_COLOR = "hsl(142, 70%, 45%)";
const OUTFLOW_COLOR = "hsl(0, 70%, 55%)";

type ChartMode = "volume" | "inflow-outflow";

interface Props {
  wallet?: string;
  activity?: { date: string; tx: number }[];
}

export default function WalletActivityChart({ wallet, activity }: Props = {}) {
  const [range, setRange] = useState<RangeKey>("30D");
  const [chartMode, setChartMode] = useState<ChartMode>("volume");
  const [selectedToken, setSelectedToken] = useState<string | null>(null);
  const [othersOpen, setOthersOpen] = useState(false);
  const [realInflowData, setRealInflowData] = useState<
    { time: string; inflow: number; outflow: number; tx: number }[]
  >([]);
  const [realVolumeData, setRealVolumeData] = useState<
    { time: string; tx: number }[]
  >([]);
  const [activityLoading, setActivityLoading] = useState(false);

  useEffect(() => {
    if (!wallet) return;
    setActivityLoading(true);
    const apiBase = (import.meta.env.VITE_EXPLORER_API_URL ?? "").replace(/\/$/, "");
    fetch(`${apiBase}/wallet/${encodeURIComponent(wallet)}/activity?range=${range}`)
      .then((r) => r.json())
      .then((d) => {
        setRealInflowData(d.data ?? []);
        setRealVolumeData((d.data ?? []).map((p: { time?: string; tx?: number }) => ({ time: p.time ?? "", tx: p.tx ?? 0 })));
      })
      .catch(() => {
        setRealInflowData([]);
        setRealVolumeData([]);
      })
      .finally(() => setActivityLoading(false));
  }, [wallet, range]);

  const volumeChartData = useMemo(() => {
    if (realVolumeData && realVolumeData.length > 0) {
      return realVolumeData.map((p) => {
        const point: Record<string, number | string> = { time: p.time };
        point["SOL"] = p.tx;
        return point;
      });
    }
    return DATA_MAP[range];
  }, [range, realVolumeData]);

  const { tokens, topTokens, othersCount, othersTokens } = useMemo(() => {
    const raw = volumeChartData;
    const syms =
      realVolumeData && realVolumeData.length > 0 ? ["SOL"] : MOCK_TOKEN_SYMBOLS;
    const totals = syms.map((sym) => ({
      symbol: sym,
      total: raw.reduce((s, p) => s + (p[sym] ?? 0), 0),
    }));
    totals.sort((a, b) => b.total - a.total);
    const ordered = totals.map((t) => t.symbol);
    const top = ordered.slice(0, LEGEND_TOP_COUNT);
    const others = ordered.slice(LEGEND_TOP_COUNT);
    return {
      tokens: ordered,
      topTokens: top,
      othersCount: others.length,
      othersTokens: others,
    };
  }, [range, volumeChartData, realVolumeData]);

  const colorMap = useMemo(() => {
    const m: Record<string, string> = {};
    tokens.forEach((t, i) => {
      m[t] = getTokenColor(i, tokens.length);
    });
    return m;
  }, [tokens]);

  const volumeChartDataForRender = useMemo(() => {
    const raw = volumeChartData;
    const syms =
      realVolumeData && realVolumeData.length > 0 ? ["SOL"] : MOCK_TOKEN_SYMBOLS;
    if (selectedToken) {
      return raw.map((p) => ({
        time: String(p.time),
        volume: Number(p[selectedToken] ?? 0),
      }));
    }
    return raw.map((p) => {
      let sum = 0;
      syms.forEach((sym) => {
        sum += Number(p[sym] ?? 0);
      });
      return { time: String(p.time), volume: sum };
    });
  }, [volumeChartData, selectedToken, realVolumeData]);

  const inflowOutflowData = useMemo(() => {
    if (realInflowData && realInflowData.length > 0) return realInflowData;
    if (activity && activity.length > 0) return buildRealInflowData(activity, range);
    return INFLOW_OUTFLOW_MAP[range];
  }, [range, activity, realInflowData]);

  const chartColor = selectedToken ? colorMap[selectedToken] : AGGREGATE_COLOR;

  const handleTokenClick = (token: string) => {
    setSelectedToken((prev) => (prev === token ? null : token));
    setOthersOpen(false);
  };

  return (
    <div className="rounded-2xl border border-border bg-card/40 backdrop-blur p-6 transition-shadow hover:shadow-[0_0_20px_rgba(0,255,200,0.15)] col-span-1 md:col-span-2 lg:col-span-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <div className="flex flex-wrap items-center gap-4">
          <h2 className="text-lg font-semibold text-foreground">Wallet Activity</h2>
          <div className="flex rounded-lg bg-muted/50 p-0.5">
            <button
              type="button"
              onClick={() => setChartMode("volume")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                chartMode === "volume"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Volume
            </button>
            <button
              type="button"
              onClick={() => setChartMode("inflow-outflow")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                chartMode === "inflow-outflow"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Inflow/Outflow
            </button>
          </div>
        </div>
        <div className="flex gap-2">
          {RANGES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                range === r
                  ? "bg-primary/20 text-primary"
                  : "bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Legend: Volume (token) or Inflow/Outflow */}
      {chartMode === "inflow-outflow" ? (
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <span className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: INFLOW_COLOR }}
            />
            Inflow
          </span>
          <span className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: OUTFLOW_COLOR }}
            />
            Outflow
          </span>
        </div>
      ) : (
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {topTokens.map((token) => {
          const isActive = selectedToken === token;
          const color = colorMap[token];
          return (
            <button
              key={token}
              type="button"
              onClick={() => handleTokenClick(token)}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? "ring-1 ring-offset-2 ring-offset-background opacity-100"
                  : "opacity-75 hover:opacity-100 hover:bg-muted/50"
              }`}
              style={
                isActive
                  ? {
                      backgroundColor: `${color}20`,
                      color: color,
                      ringColor: color,
                    }
                  : { color }
              }
            >
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: color }}
              />
              {token}
              {isActive && <span className="text-muted-foreground">(filtered)</span>}
            </button>
          );
        })}

        {othersCount > 0 && (
          <Popover open={othersOpen} onOpenChange={setOthersOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                +{othersCount} others
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-48 max-h-64 overflow-y-auto p-2">
              <div className="flex flex-col gap-0.5">
                {othersTokens.map((token) => {
                  const isActive = selectedToken === token;
                  const color = colorMap[token];
                  return (
                    <button
                      key={token}
                      type="button"
                      onClick={() => handleTokenClick(token)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium text-left transition-colors ${
                        isActive ? "bg-muted" : "hover:bg-muted/70"
                      }`}
                      style={isActive ? { color } : { color }}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      {token}
                      {isActive && <span className="text-muted-foreground ml-1">(filtered)</span>}
                    </button>
                  );
                })}
              </div>
            </PopoverContent>
          </Popover>
        )}

        {selectedToken && (
          <button
            type="button"
            onClick={() => setSelectedToken(null)}
            className="text-xs text-muted-foreground hover:text-foreground underline"
          >
            Show all
          </button>
        )}
      </div>
      )}

      <div className="w-full h-64">
        <ResponsiveContainer width="100%" height="100%">
          {chartMode === "inflow-outflow" ? (
            <AreaChart data={inflowOutflowData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="inflowGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={INFLOW_COLOR} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={INFLOW_COLOR} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="outflowGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={OUTFLOW_COLOR} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={OUTFLOW_COLOR} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 15%, 18%)" vertical={false} />
              <XAxis
                dataKey="time"
                tick={{ fill: "hsl(215, 15%, 55%)", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "hsl(215, 15%, 55%)", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v))}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(222, 20%, 12%)",
                  border: "1px solid hsl(222, 15%, 22%)",
                  borderRadius: "8px",
                  color: "hsl(210, 20%, 92%)",
                  fontSize: "12px",
                }}
                formatter={(value: number, name: string) => [`${value}`, name === "inflow" ? "Inflow" : "Outflow"]}
                labelFormatter={(label) => `Period: ${label}`}
              />
              <Area
                type="monotone"
                dataKey="inflow"
                stackId="io"
                stroke={INFLOW_COLOR}
                strokeWidth={2}
                fill="url(#inflowGradient)"
              />
              <Area
                type="monotone"
                dataKey="outflow"
                stackId="io"
                stroke={OUTFLOW_COLOR}
                strokeWidth={2}
                fill="url(#outflowGradient)"
              />
            </AreaChart>
          ) : (
            <AreaChart data={volumeChartDataForRender} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="activityGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={chartColor} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={chartColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 15%, 18%)" vertical={false} />
              <XAxis
                dataKey="time"
                tick={{ fill: "hsl(215, 15%, 55%)", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "hsl(215, 15%, 55%)", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v))}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(222, 20%, 12%)",
                  border: "1px solid hsl(222, 15%, 22%)",
                  borderRadius: "8px",
                  color: "hsl(210, 20%, 92%)",
                  fontSize: "12px",
                }}
                formatter={(value: number) => [`${value} txns`, selectedToken ?? "Total"]}
                labelFormatter={(label) => `Period: ${label}`}
              />
              <Area
                type="monotone"
                dataKey="volume"
                stroke={chartColor}
                strokeWidth={2}
                fill="url(#activityGradient)"
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
