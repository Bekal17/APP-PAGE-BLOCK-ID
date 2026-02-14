import { useState, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import TrustScoreRing from "@/components/TrustScoreRing";
import WalletInput from "@/components/trust/WalletInput";
import TrustScoreCard from "@/components/trust/TrustScoreCard";
import MetricsTable from "@/components/trust/MetricsTable";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchTrustScore, type FetchTrustScoreError } from "@/lib/trust-api";
import type { TrustScoreResult } from "@/types/trust";
import {
  Shield,
  Brain,
  Network,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Eye,
  ExternalLink,
} from "lucide-react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

const radarData = [
  { factor: "Age", value: 92 },
  { factor: "Volume", value: 78 },
  { factor: "Diversity", value: 85 },
  { factor: "Consistency", value: 88 },
  { factor: "Reputation", value: 76 },
  { factor: "Social", value: 65 },
];

const riskFactors = [
  { label: "Mixer Interaction", level: "low", score: 5 },
  { label: "Sanctioned Address", level: "none", score: 0 },
  { label: "Flash Loan Activity", level: "low", score: 8 },
  { label: "High-Risk DeFi", level: "medium", score: 32 },
  { label: "Token Spam Received", level: "low", score: 12 },
];

const historyData = [
  { month: "Aug", score: 68 },
  { month: "Sep", score: 72 },
  { month: "Oct", score: 69 },
  { month: "Nov", score: 78 },
  { month: "Dec", score: 82 },
  { month: "Jan", score: 87 },
];

const interactionMap = [
  { protocol: "Uniswap v3", txns: 245, trust: "High" },
  { protocol: "Aave v3", txns: 89, trust: "High" },
  { protocol: "OpenSea", txns: 156, trust: "Medium" },
  { protocol: "Lido Finance", txns: 12, trust: "High" },
  { protocol: "1inch", txns: 67, trust: "High" },
];

const TrustAnalytics = () => {
  const [result, setResult] = useState<TrustScoreResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLookup = useCallback(async (wallet: string) => {
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const data = await fetchTrustScore(wallet);
      setResult(data);
    } catch (err) {
      const e = err as FetchTrustScoreError;
      setError(e.detail ?? (e.status === 503 ? "Trust API unavailable. Is the backend running?" : "Request failed."));
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="animate-slide-up">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Trust Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">Look up a Solana wallet for real-time trust score from the AI backend</p>
        </div>

        {/* Wallet lookup */}
        <div className="animate-slide-up" style={{ animationDelay: "0.05s" }}>
          <WalletInput onSubmit={handleLookup} disabled={loading} />
        </div>

        {loading && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-up">
            <Skeleton className="h-64 rounded-lg" />
            <Skeleton className="h-64 rounded-lg lg:col-span-2" />
          </div>
        )}

        {error && (
          <Alert variant="destructive" className="animate-slide-up">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {result && !loading && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-up">
            <TrustScoreCard
              trustScore={result.trust_score}
              riskLevel={result.risk_level}
              wallet={result.wallet}
            />
            <div className="lg:col-span-2">
              <MetricsTable metrics={result.metrics} />
            </div>
          </div>
        )}

        {/* Top Row: Radar when no result yet */}
        {!result && !loading && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-up" style={{ animationDelay: "0.1s" }}>
            <div className="glass-card p-6 flex flex-col items-center">
              <div className="flex items-center gap-2 mb-4">
                <Brain className="w-4 h-4 text-accent" />
                <h3 className="text-sm font-semibold text-foreground">AI Trust Score</h3>
              </div>
              <TrustScoreRing score={87} size={160} />
              <p className="text-xs text-muted-foreground mt-4 text-center max-w-[200px]">
                Enter a wallet above to fetch a live score from the blockchain
              </p>
            </div>

            <div className="glass-card p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Trust Breakdown</h3>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                  <PolarGrid stroke="hsl(222, 15%, 18%)" />
                  <PolarAngleAxis
                    dataKey="factor"
                    tick={{ fill: "hsl(215, 15%, 55%)", fontSize: 11 }}
                  />
                  <Radar
                    dataKey="value"
                    stroke="hsl(185, 80%, 55%)"
                    fill="hsl(185, 80%, 55%)"
                    fillOpacity={0.15}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
          </div>
        )}

        {/* Risk + History */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-slide-up" style={{ animationDelay: "0.2s" }}>
          {/* Risk Factors */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-4 h-4 text-warning" />
              <h3 className="text-sm font-semibold text-foreground">Risk Factors</h3>
            </div>
            <div className="space-y-3">
              {riskFactors.map((factor) => (
                <div key={factor.label} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-3">
                    {factor.level === "none" ? (
                      <CheckCircle2 className="w-4 h-4 text-success" />
                    ) : factor.level === "medium" ? (
                      <AlertTriangle className="w-4 h-4 text-warning" />
                    ) : (
                      <Eye className="w-4 h-4 text-muted-foreground" />
                    )}
                    <span className="text-sm text-foreground">{factor.label}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          factor.level === "none" ? "bg-success" : factor.level === "medium" ? "bg-warning" : "bg-primary"
                        }`}
                        style={{ width: `${Math.max(factor.score, 2)}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-8 text-right font-mono">{factor.score}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Reputation History */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Reputation History</h3>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={historyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 15%, 18%)" />
                  <XAxis dataKey="month" tick={{ fill: "hsl(215, 15%, 55%)", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[50, 100]} tick={{ fill: "hsl(215, 15%, 55%)", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(222, 20%, 12%)",
                      border: "1px solid hsl(222, 15%, 22%)",
                      borderRadius: "8px",
                      color: "hsl(210, 20%, 92%)",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="score" fill="hsl(185, 80%, 55%)" radius={[4, 4, 0, 0]} opacity={0.8} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Interaction Map */}
        <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: "0.3s" }}>
          <div className="flex items-center gap-2 mb-4">
            <Network className="w-4 h-4 text-accent" />
            <h3 className="text-sm font-semibold text-foreground">Wallet Interaction Map</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Protocol</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Transactions</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Trust Level</th>
                </tr>
              </thead>
              <tbody>
                {interactionMap.map((row) => (
                  <tr key={row.protocol} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-4 font-medium text-foreground flex items-center gap-2">
                      {row.protocol}
                      <ExternalLink className="w-3 h-3 text-muted-foreground" />
                    </td>
                    <td className="py-3 px-4 text-right text-muted-foreground font-mono">{row.txns}</td>
                    <td className="py-3 px-4 text-right">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        row.trust === "High" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                      }`}>
                        {row.trust}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TrustAnalytics;
