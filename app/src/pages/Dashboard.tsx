import { useWallet } from "@solana/wallet-adapter-react";
import { useCallback, useEffect, useState } from "react";
import { getGraph, setGraphCache } from "@/services/blockidApi";
import { normalizeGraphResponse } from "@/components/investigation/WalletGraph";
import DashboardLayout from "@/components/DashboardLayout";
import DashboardOnboarding from "@/components/DashboardOnboarding";
import ScoreRing from "@/components/blockid/ScoreRing";
import RiskBadge from "@/components/blockid/RiskBadge";
import WalletActivityChart from "@/components/blockid/WalletActivityChart";
import RiskExposureRadar from "@/components/blockid/dashboard/RiskExposureRadar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ShareInvestigationModal, buildFullReport, buildTwitterReport } from "@/components/dashboard/ShareInvestigationModal";
import { AlertTriangle, Clock, ArrowLeftRight, Users, DollarSign, FileText } from "lucide-react";
import {
  InvestigatorProgress,
  type InvestigatorStep,
} from "@/components/InvestigatorProgress";

const APP_BASE_URL = "https://app.blockidscore.fun";
const API_BASE = import.meta.env.VITE_EXPLORER_API_URL || "https://blockid-backend-production.up.railway.app";

const formatSolanaAddress = (address: string) => {
  if (!address) return "";
  if (address.length <= 12) return address;
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
};

const riskColorMap: Record<string, string> = {
  GREEN: "GREEN",
  AMBER: "ORANGE",
  YELLOW: "ORANGE",
  ORANGE: "ORANGE",
  RED: "RED",
};

const getStatusMessage = (riskColor: string, riskTier: string) => {
  const rc = riskColor?.toUpperCase();
  if (rc === "RED") return "Review recommended";
  if (rc === "AMBER" || rc === "ORANGE" || rc === "YELLOW") return "Caution advised";
  return "Safe";
};

const buildRiskAlerts = (data: {
  primary_risk_driver?: string | null;
  propagation_signal?: string;
  cluster?: { cluster_id?: string; size?: number } | null;
  badges?: string[];
}) => {
  const alerts: string[] = [];
  const sig = (data.propagation_signal ?? "").toUpperCase();
  if (sig === "HIGH" || sig === "MEDIUM") {
    alerts.push("Interaction with high-risk wallet");
  }
  if (data.cluster) {
    alerts.push("Cluster exposure detected");
  }
  if (data.primary_risk_driver) {
    if (data.primary_risk_driver.includes("SCAM") || data.primary_risk_driver.includes("CLUSTER")) {
      if (!alerts.some((a) => a.includes("Cluster"))) {
        alerts.push("Cluster exposure detected");
      }
    } else {
      alerts.push("Suspicious token interaction");
    }
  }
  if (data.badges?.some((b) => b.includes("SCAM") || b.includes("RISK"))) {
    alerts.push("Suspicious token interaction");
  }
  return [...new Set(alerts)];
};

interface DashboardData {
  risk_level?: string;
  risk_tier?: string;
  trust_score: number;
  risk_color: string;
  summary_message: string;
  recommended_actions: string[];
  counterparties: { wallet: string; risk_tier: string }[];
  evidence?: { tx_hash: string; reason: string; timestamp?: string }[];
  timeline_events?: { time: string; event: string; counterparty?: string }[];
  propagation_signal?: string;
  primary_risk_driver?: string | null;
  cluster?: { cluster_id?: string; size?: number } | null;
  badges?: string[];
  wallet_age_months?: number;
  wallet_first_seen?: string;
  wallet_age_days?: number;
  exposure_ratio?: number;
  fingerprint?: string;
  category?: string;
  volume_30d?: number;
  transactions?: number;
  unique_counterparties?: number;
}

const formatWalletAge = (firstSeen?: string, months?: number, days?: number): string => {
  if (days != null && days > 0) {
    if (days < 30) return `${days} days`;
    if (days < 365) return `${Math.round(days / 30)} mo`;
    return `${(days / 365).toFixed(1)} years`;
  }
  if (firstSeen) {
    try {
      const date = new Date(firstSeen);
      if (Number.isNaN(date.getTime())) return "Unknown";
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const years = diffMs / (1000 * 60 * 60 * 24 * 365.25);
      if (years < 0) return "Unknown";
      if (years < 1) return `${Math.round(years * 12)} mo`;
      return `${years.toFixed(1)} years`;
    } catch {
      return "Unknown";
    }
  }
  if (months != null && months > 0) {
    if (months < 12) return `${months} mo`;
    return `${(months / 12).toFixed(1)} years`;
  }
  return "Unknown";
};

const formatVolume = (val?: number) => {
  if (val == null || val <= 0) return "$0";
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(1)}K`;
  return `$${val.toLocaleString()}`;
};

const Dashboard = () => {
  const { publicKey, connected } = useWallet();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [walletDashboard, setWalletDashboard] = useState<any>(null);
  const [investigatorStep, setInvestigatorStep] = useState<InvestigatorStep | null>(null);
  const [investigatorDone, setInvestigatorDone] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  const address = publicKey?.toBase58();
  const walletAddress = address ?? "REPLACE_WITH_CONNECTED_WALLET";
  const walletUrl = address ? `${APP_BASE_URL}/wallet/${address}` : "";
  const canShare = !!address && !!data && !loading && !error;
  const [shareInvestigationOpen, setShareInvestigationOpen] = useState(false);
  const [graphData, setGraphData] = useState<ReturnType<typeof normalizeGraphResponse> | null>(null);

  const loadDashboardData = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch(`${API_BASE}/wallet/${encodeURIComponent(walletAddress)}/dashboard`);
      const json = await res.json();
      if (!res.ok) throw new Error(json?.detail ?? "Failed to load wallet dashboard");
      setWalletDashboard(json);
      const bp = json.behavioral_pattern ?? json.fingerprint ?? json.category ?? json.profile ?? "";
      const profileVal = json.profile;
      const profileStr = typeof profileVal === "string" ? profileVal : Array.isArray(profileVal) ? profileVal.join(", ") : "";
      setData({
        trust_score: json.trust_score ?? 0,
        risk_tier: json.risk_tier ?? "LOW",
        risk_color: json.risk_color ?? "GREEN",
        summary_message: json.summary_message ?? "",
        recommended_actions: json.recommended_actions ?? json.reasons ?? [],
        counterparties: json.counterparties ?? [],
        evidence: json.evidence ?? [],
        timeline_events: json.timeline_events ?? [],
        propagation_signal: json.propagation_signal,
        primary_risk_driver: json.primary_risk_driver,
        cluster: json.cluster,
        badges: json.badges ?? [],
        wallet_age_months: json.wallet_age_months ?? (json.wallet_age_days != null ? Math.round(json.wallet_age_days / 30) : undefined) ?? json.wallet_age,
        wallet_first_seen: json.wallet_first_seen ?? json.first_seen,
        wallet_age_days: json.wallet_age_days,
        transactions: json.transactions ?? json.activity?.transactions,
        unique_counterparties: json.unique_counterparties ?? json.activity?.unique_counterparties,
        exposure_ratio: json.exposure_ratio ?? json.risk_exposure ?? 0,
        volume_30d: json.volume_30d ?? json.volume_30d_usd ?? json.activity?.volume_30d,
        fingerprint: bp || profileStr,
        category: json.category ?? (bp || profileStr),
      });
    } catch (err) {
      console.error("Failed to load wallet dashboard", err);
      setError(err instanceof Error ? err.message : "Could not load wallet data");
      setData(null);
      setWalletDashboard(null);
    } finally {
      setLoading(false);
      setInvestigatorStep(null);
      setInvestigatorDone(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    if (!walletAddress || walletAddress === "REPLACE_WITH_CONNECTED_WALLET" || !connected) {
      setData(null);
      setWalletDashboard(null);
      setError(null);
      setInvestigatorStep(null);
      setInvestigatorDone(false);
      return;
    }

    setLoading(true);
    setError(null);
    setInvestigatorStep(null);
    setInvestigatorDone(false);

    let eventSource: EventSource | null = null;

    const run = async () => {
      try {
        // Step 1: check if wallet needs pipeline or can use cached data
        const checkRes = await fetch(
          `${API_BASE}/wallet/${encodeURIComponent(walletAddress)}/needs-refresh`
        );
        const checkJson = await checkRes.json();

        if (checkJson.cached === true && checkJson.needs_refresh === false) {
          // Wallet exists in DB and no new transactions — load from cache directly
          setInvestigatorStep(null);
          setInvestigatorDone(true);
          setLoading(false);
          await loadDashboardData();
          return;
        }

        // Step 2: new wallet or has new transactions — run full pipeline via SSE
        const investigateUrl = `${API_BASE}/investigate/${encodeURIComponent(walletAddress)}`;
        eventSource = new EventSource(investigateUrl);

        eventSource.onmessage = (event) => {
          try {
            const parsed = JSON.parse(event.data);
            if (parsed.step === "fetch_tx") setInvestigatorStep("fetch_tx");
            else if (parsed.step === "build_network") setInvestigatorStep("build_network");
            else if (parsed.step === "detect_drainer") setInvestigatorStep("detect_drainer");
            else if (parsed.step === "compute_score") setInvestigatorStep("compute_score");

            if (parsed.status === "done") {
              eventSource?.close();
              setInvestigatorDone(true);
              setLoading(false);
              loadDashboardData();
            }
          } catch {
            // ignore parse errors
          }
        };

        eventSource.onerror = () => {
          eventSource?.close();
          setLoading(false);
          loadDashboardData();
        };

      } catch {
        // fallback: if needs-refresh check fails, load from DB directly
        setLoading(false);
        setInvestigatorDone(true);
        await loadDashboardData();
      }
    };

    run();

    return () => {
      eventSource?.close();
    };

  }, [walletAddress, connected, loadDashboardData]);

  useEffect(() => {
    if (!address || !connected) return;
    async function preloadGraph() {
      try {
        const graph = await getGraph(address);
        const normalized = normalizeGraphResponse(graph);
        setGraphCache(address, normalized);
        setGraphData(normalized);
      } catch {
        setGraphData(null);
      }
    }
    preloadGraph();
  }, [address, connected]);

  const trustScore = walletDashboard?.trust_score ?? data?.trust_score ?? 0;
  const riskTier = walletDashboard?.risk_tier ?? data?.risk_tier ?? "LOW";
  const profile = walletDashboard?.profile;
  const reasons = walletDashboard?.reasons;
  const riskExposure = walletDashboard?.risk_exposure;
  const activity = walletDashboard?.activity;
  const badges = walletDashboard?.badges;

  const score = trustScore;
  const riskColor = riskColorMap[data?.risk_color?.toUpperCase() ?? ""] ?? "GREEN";
  const summaryMessage = data?.summary_message ?? "";
  const recommendedActions = data?.recommended_actions ?? [];
  const riskAlerts = data ? buildRiskAlerts(data) : [];
  const counterpartyItems = (data?.counterparties ?? [])
    .filter((c) => (c.risk_tier ?? "").toUpperCase() === "HIGH" || (c.risk_tier ?? "").toUpperCase() === "MEDIUM")
    .slice(0, 5)
    .map((c) => ({
      label: `Unknown wallet transfer — ${(c.risk_tier ?? "MEDIUM").toUpperCase()} risk`,
      wallet: c.wallet,
      risk: c.risk_tier,
    }));
  const evidenceItems = (data?.evidence ?? [])
    .slice(0, Math.max(0, 5 - counterpartyItems.length))
    .map((e) => ({
      label: `${e.reason} — HIGH risk`,
      wallet: "",
      risk: "HIGH",
    }));
  const suspiciousItems = [...counterpartyItems, ...evidenceItems].slice(0, 5);
  const suspiciousCount = counterpartyItems.length + evidenceItems.length;
  const totalTx = data?.transactions ?? data?.timeline_events?.length ?? 0;
  const uniqueCounterparties =
    data?.unique_counterparties ?? new Set(data?.counterparties?.map((c) => c.wallet) ?? []).size;

  const getBehaviorPatterns = (data: DashboardData | null, score: number): string[] => {
    if (!data) return ["No pattern detected"];

    // Priority 1: use reasons from backend if available
    const reasons: string[] = walletDashboard?.reasons ?? [];

    if (reasons.length > 0) {
      const patterns: string[] = [];
      const reasonSet = new Set(reasons);

      // === HIGH RISK PATTERNS ===
      if (reasonSet.has("MEGA_DRAINER") || reasonSet.has("DRAINER_FLOW") || reasonSet.has("DRAINER_FLOW_DETECTED")) {
        patterns.push("Drainer pattern detected");
        patterns.push("Elevated propagation risk");
        return patterns;
      }
      if (reasonSet.has("RUG_PULL_DEPLOYER")) {
        patterns.push("Rug pull deployer");
        patterns.push("Elevated propagation risk");
        return patterns;
      }
      if (
        reasonSet.has("SCAM_CLUSTER_MEMBER") ||
        reasonSet.has("SCAM_CLUSTER_MEMBER_SMALL") ||
        reasonSet.has("SCAM_CLUSTER_MEMBER_LARGE")
      ) {
        patterns.push("Cluster-linked wallet");
        patterns.push("Elevated risk exposure");
        return patterns;
      }
      if (reasonSet.has("HIGH_RISK_TOKEN_INTERACTION") || reasonSet.has("SUSPICIOUS_TOKEN_MINT")) {
        patterns.push("Suspicious token activity");
        patterns.push("Elevated risk exposure");
        return patterns;
      }
      if (reasonSet.has("BLACKLISTED_CREATOR")) {
        patterns.push("Blacklisted creator");
        patterns.push("Elevated risk exposure");
        return patterns;
      }

      // === MEDIUM RISK PATTERNS ===
      if (reasonSet.has("HIGH_VALUE_OUTFLOW")) {
        patterns.push("High value outflow detected");
        return patterns;
      }
      if (reasonSet.has("VICTIM_OF_SCAM")) {
        patterns.push("Previous scam victim");
        patterns.push("Monitor interactions");
        return patterns;
      }

      // === LOW RISK / INFO PATTERNS ===
      if (reasonSet.has("LOW_ACTIVITY")) {
        patterns.push("Low on-chain activity");
        patterns.push("Insufficient data for full analysis");
        return patterns;
      }
      if (reasonSet.has("NEW_WALLET")) {
        patterns.push("New wallet");
        patterns.push("No history available");
        return patterns;
      }

      // === POSITIVE PATTERNS ===
      if (reasonSet.has("MEGA_DRAINER") === false) {
        if (reasonSet.has("DEX_TRADER") || reasonSet.has("DEX_TRADER_10_PLUS") || reasonSet.has("DEX_TRADER_50_PLUS")) {
          patterns.push("Active DEX trader");
        }
        if (reasonSet.has("NFT_COLLECTOR") || reasonSet.has("NFT_10_PLUS")) {
          patterns.push("NFT collector");
        }
        if (reasonSet.has("LONG_HISTORY") || reasonSet.has("MULTI_YEAR_ACTIVITY") || reasonSet.has("AGE_3Y") || reasonSet.has("AGE_5Y")) {
          patterns.push("Long-term holder");
        }
        if (reasonSet.has("LOW_RISK_CLUSTER") || reasonSet.has("FAR_FROM_SCAM_CLUSTER")) {
          patterns.push("Low-risk network");
        }
        if (reasonSet.has("CLEAN_HISTORY") || reasonSet.has("NO_SCAM_HISTORY")) {
          patterns.push("No drainer pattern");
        }
        if (reasonSet.has("DAO_MEMBER")) {
          patterns.push("DAO participant");
        }
        if (patterns.length > 0) return patterns;
      }
    }

    // Priority 2: fallback to score-based if no reasons
    if (score > 80) {
      return ["Long-term holder", "Low-risk network", "No drainer pattern"];
    }
    if (score >= 40) {
      return ["Active trader", "Moderate exposure"];
    }
    if (score >= 20) {
      return ["Elevated risk exposure", "Review recommended"];
    }
    return ["Cluster-linked wallet", "Elevated risk exposure"];
  };

  const behaviorPatterns = getBehaviorPatterns(data, score);
  const walletAgeStr = formatWalletAge(data?.wallet_first_seen, data?.wallet_age_months, data?.wallet_age_days);
  const volumeStr = formatVolume(data?.volume_30d);

  const investigationReportProps = address && data
    ? {
        walletAddress: address,
        shortAddress: formatSolanaAddress(address),
        trustScore: score,
        riskTier,
        walletAge: walletAgeStr,
        totalTx,
        uniqueCounterparties,
        volume30d: volumeStr,
        behaviorPatterns,
      }
    : null;

  const fullReportText = investigationReportProps ? buildFullReport(investigationReportProps) : "";
  const twitterReportText = investigationReportProps ? buildTwitterReport(investigationReportProps) : "";

  const handleCopyInvestigationReport = () => {
    if (!fullReportText) return;
    navigator.clipboard.writeText(fullReportText);
    toast({ title: "Investigation report copied" });
  };

  const handleShareInvestigationTwitter = () => {
    if (!twitterReportText) return;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(twitterReportText)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleShareInvestigationTelegram = () => {
    if (!twitterReportText || !walletUrl) return;
    const url = `https://t.me/share/url?url=${encodeURIComponent(walletUrl)}&text=${encodeURIComponent(twitterReportText)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleRecalculate = async () => {
    if (!address) return;
    try {
      setAnalyzing(true);
      const res = await fetch(`${API_BASE}/wallet/recalculate/${encodeURIComponent(address)}`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Recalculate failed");
      await loadDashboardData();
      toast({ title: "Score recalculated successfully" });
    } catch (err) {
      console.error("Recalculate error", err);
      toast({ title: "Failed to recalculate score", variant: "destructive" });
    } finally {
      setAnalyzing(false);
    }
  };

  const cardClass =
    "rounded-2xl border border-border bg-card/40 backdrop-blur p-6 transition-shadow hover:shadow-[0_0_20px_rgba(0,255,200,0.15)]";

  if (!connected) {
    return (
      <DashboardLayout>
        <DashboardOnboarding />
      </DashboardLayout>
    );
  }

  if (loading && !walletDashboard) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[300px] p-8">
          <InvestigatorProgress
            currentStep={investigatorStep}
            done={investigatorDone}
            className="max-w-md w-full"
          />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="w-full max-w-screen-2xl mx-auto p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
          {/* 1. Wallet Health - col-span-12 */}
            <div className={`${cardClass} col-span-1 md:col-span-2 lg:col-span-12`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground">Wallet Health</h2>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-lg border-border bg-transparent hover:bg-accent/50 gap-2"
                    disabled={!canShare}
                    onClick={() => setShareInvestigationOpen(true)}
                  >
                    <FileText className="w-4 h-4" />
                    Share Your Score
                  </Button>
                  <Button
                    size="sm"
                    disabled={analyzing || !address}
                    onClick={handleRecalculate}
                    className="rounded-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-4 py-2 transition"
                  >
                    {analyzing ? "Analyzing..." : "Recalculate Score"}
                  </Button>
                </div>
              </div>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-pulse text-muted-foreground">Loading...</div>
                </div>
              ) : error ? (
                <p className="text-sm text-destructive py-4">{error}</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start">
                  {/* Column 1: Trust Score */}
                  <ScoreRing score={score} riskColor={riskColor} riskTier={data?.risk_level ?? data?.risk_tier} />

                  {/* Column 2: Wallet Age, Activity Profile */}
                  <div className="space-y-6 min-w-0">
                    <div className="flex items-start gap-3">
                      <Clock className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Wallet Age</p>
                        <p className="font-medium text-foreground">
                          {loading ? "—" : formatWalletAge(data?.wallet_first_seen, data?.wallet_age_months, data?.wallet_age_days)}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground mb-3">Activity Profile</p>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <ArrowLeftRight className="w-4 h-4 text-muted-foreground shrink-0" />
                          <span className="text-muted-foreground">Transactions:</span>
                          <span className="font-medium text-foreground">{loading ? "0" : totalTx}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="w-4 h-4 text-muted-foreground shrink-0" />
                          <span className="text-muted-foreground">Unique Counterparties:</span>
                          <span className="font-medium text-foreground">{loading ? "0" : uniqueCounterparties}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <DollarSign className="w-4 h-4 text-muted-foreground shrink-0" />
                          <span className="text-muted-foreground">30D Volume:</span>
                          <span className="font-medium text-foreground">
                            {loading ? "$0" : formatVolume(data?.volume_30d)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Column 3: Behavioral Pattern, Summary */}
                  <div className="space-y-6 min-w-0 md:col-span-2 lg:col-span-1">
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Behavioral Pattern</p>
                      <ul className="space-y-1.5">
                        {(loading ? ["No pattern detected"] : getBehaviorPatterns(data, score)).map((pattern, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <span className="text-primary mt-1">•</span>
                            <span className="text-foreground">{pattern}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">Summary</p>
                      <p className="text-foreground text-sm mt-1">
                        {loading ? "—" : summaryMessage || "No major threats detected."}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Risk Alerts - col-span-6 */}
            <div className={`${cardClass} col-span-1 md:col-span-2 lg:col-span-6`}>
              <h2 className="text-lg font-semibold text-foreground mb-4">Risk Alerts</h2>
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : riskAlerts.length === 0 ? (
                <p className="text-sm text-muted-foreground">No active risk alerts detected.</p>
              ) : (
                <ul className="space-y-2">
                  {riskAlerts.map((alert, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <span className="text-foreground">{alert}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* 3. Suspicious Interactions - col-span-6 */}
            <div className={`${cardClass} col-span-1 md:col-span-2 lg:col-span-6`}>
              <h2 className="text-lg font-semibold text-foreground mb-4">Suspicious Interactions</h2>
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : suspiciousItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">No suspicious interactions detected.</p>
              ) : (
                <ul className="space-y-3">
                  {suspiciousItems.map((item, i) => (
                    <li key={i} className="flex items-center justify-between gap-4 py-2 border-b border-zinc-800 last:border-0">
                      <span className="text-sm text-foreground">{item.label}</span>
                      {item.wallet && (
                        <span className="text-xs font-mono text-muted-foreground shrink-0">
                          {formatSolanaAddress(item.wallet)}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* 4. Trust Improvement Tips - col-span-6 */}
            <div className={`${cardClass} col-span-1 md:col-span-2 lg:col-span-6`}>
              <h2 className="text-lg font-semibold text-foreground mb-4">Trust Improvement Tips</h2>
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : recommendedActions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No recommendations at this time.</p>
              ) : (
                <ul className="space-y-2">
                  {recommendedActions.map((action, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-primary mt-1">•</span>
                      <span className="text-foreground">{action}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* 5. Activity Overview - col-span-6 */}
            <div className={`${cardClass} col-span-1 md:col-span-2 lg:col-span-6`}>
              <h2 className="text-sm font-semibold text-foreground mb-4">Activity Overview</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <p className="stat-label">Total Transactions</p>
                  <p className="stat-value mt-1">{loading ? "—" : totalTx}</p>
                </div>
                <div>
                  <p className="stat-label">Unique Counterparties</p>
                  <p className="stat-value mt-1">{loading ? "—" : uniqueCounterparties}</p>
                </div>
                <div>
                  <p className="stat-label">30D Volume</p>
                  <p className="stat-value mt-1">{loading ? "—" : "—"}</p>
                </div>
              </div>
            </div>

            {/* 6. Wallet Activity Chart - full width */}
            <WalletActivityChart />

            {/* 7. Risk Exposure Radar */}
          <RiskExposureRadar riskTier={riskColor} />
        </div>

        {analyzing && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <div className="bg-gray-900 p-8 rounded-xl text-center">
              <div className="animate-pulse text-purple-400 text-lg mb-4">
                🧠 BlockID AI analyzing wallet...
              </div>
              <div className="text-gray-400 text-sm space-y-1">
                <div>Fetching transactions...</div>
                <div>Analyzing wallet behavior...</div>
                <div>Running risk model...</div>
                <div>Updating trust score...</div>
              </div>
            </div>
          </div>
        )}

        {investigationReportProps && (
          <ShareInvestigationModal
            open={shareInvestigationOpen}
            onOpenChange={setShareInvestigationOpen}
            {...investigationReportProps}
            onCopyReport={handleCopyInvestigationReport}
            onShareTwitter={handleShareInvestigationTwitter}
            onShareTelegram={handleShareInvestigationTelegram}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
