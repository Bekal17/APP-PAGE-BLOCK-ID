import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { getWalletOverview, getTimeline, getGraph, getGraphCache, setGraphCache, getCounterparties } from "@/services/blockidApi";
import { normalizeGraphResponse } from "@/components/investigation/WalletGraph";
import DashboardLayout from "@/components/DashboardLayout";
import InteractiveWalletGraph from "@/components/InteractiveWalletGraph";
import AIClusterGraph from "@/components/AIClusterGraph";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import SimpleModeLayout from "@/components/blockid/SimpleModeLayout";
import InvestigationLayout from "@/components/blockid/investigation/InvestigationLayout";

interface ReasonCode {
  code: string;
  weight: number;
  confidence: number;
  tx_hash?: string | null;
}

export default function TrustAnalytics() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const walletParam = searchParams.get("wallet");
  const [wallet, setWallet] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [risk, setRisk] = useState<string>("");
  const [reasons, setReasons] = useState<ReasonCode[]>([]);
  const [mode, setMode] = useState<"simple" | "investigation">("simple");
  const [riskColor, setRiskColor] = useState<string>("GREEN");
  const [summaryMessage, setSummaryMessage] = useState<string>("");
  const [badges, setBadges] = useState<string[]>([]);
  const [confidence, setConfidence] = useState<string>("");
  const [cluster, setCluster] = useState<{ cluster_id?: string; size?: number } | null>(null);
  const [clusterMembers, setClusterMembers] = useState<string[]>([]);
  const [counterparties, setCounterparties] = useState<{ wallet: string; risk_tier: string }[]>([]);
  const [graphNodes, setGraphNodes] = useState<Record<string, unknown>[]>([]);
  const [graphLinks, setGraphLinks] = useState<Record<string, unknown>[]>([]);
  const [moneyFlowPath, setMoneyFlowPath] = useState<{ wallet: string; risk: string }[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<{ time: string; event: string; counterparty?: string }[]>([]);
  const [evidence, setEvidence] = useState<{ tx_hash: string; reason: string; timestamp?: string }[]>([]);
  const [walletHistory, setWalletHistory] = useState<string[]>([]);
  const [recommendedActions, setRecommendedActions] = useState<string[]>([]);
  const [propagationSignal, setPropagationSignal] = useState("");
  const [exposureRatio, setExposureRatio] = useState(0);
  const [primaryRiskDriver, setPrimaryRiskDriver] = useState<string | null>(null);
  const [category, setCategory] = useState("");
  const [fingerprint, setFingerprint] = useState<string>("");
  const [graphData, setGraphData] = useState<ReturnType<typeof normalizeGraphResponse> | null>(null);

  const fetchScore = async (walletOverride?: string) => {
    const address = (walletOverride ?? wallet).trim();
    if (!address) return;
    if (walletOverride) setWallet(walletOverride);
    setError(null);
    setScore(null);
    setRisk("");
    setReasons([]);
    setRiskColor("GREEN");
    setSummaryMessage("");
    setBadges([]);
    setConfidence("");
    setCluster(null);
    setClusterMembers([]);
    setCounterparties([]);
    setGraphNodes([]);
    setGraphLinks([]);
    setMoneyFlowPath([]);
    setTimelineEvents([]);
    setEvidence([]);
    setWalletHistory([]);
    setRecommendedActions([]);
    setPropagationSignal("");
    setExposureRatio(0);
    setPrimaryRiskDriver(null);
    setCategory("");
    setFingerprint("");
    setGraphData(null);
    setLoading(true);
    try {
      const cachedGraph = getGraphCache(address) as ReturnType<typeof normalizeGraphResponse> | null;
      const [overviewData, timelineData, graphRaw, counterpartiesData] = await Promise.all([
        getWalletOverview(address),
        getTimeline(address).catch(() => null),
        cachedGraph ? Promise.resolve(null) : getGraph(address).catch(() => null),
        getCounterparties(address).catch(() => null),
      ]);

      const data = overviewData;
      setWalletHistory((prev) => {
        if (prev.length > 0 && prev[prev.length - 1] === address) return prev;
        return [...prev, address];
      });
      setScore(data.trust_score);
      setRisk(data.risk_tier);
      setRiskColor(data.risk_color ?? "GREEN");
      setSummaryMessage(data.summary_message ?? "");
      setBadges(data.badges || []);
      setConfidence(data.confidence ?? "");
      setCluster(data.cluster ?? null);
      setClusterMembers(data.cluster_members ?? data.clusterMembers ?? []);
      const cpList = counterpartiesData?.counterparties
        ?? counterpartiesData
        ?? data.counterparties
        ?? [];
      setCounterparties(Array.isArray(cpList) ? cpList : []);
      setGraphNodes(data.graph_nodes || data.graphNodes || []);
      setGraphLinks(data.graph_links || data.graphLinks || []);
      setMoneyFlowPath(
        (data.money_flow_path || data.moneyFlowPath || []).map(
          (n: { wallet: string; risk?: string; risk_tier?: string }) => ({
            wallet: n.wallet,
            risk: n.risk ?? n.risk_tier ?? "LOW",
          })
        )
      );
      const timeline = timelineData?.timeline ?? timelineData?.events ?? timelineData;
      const timelineList = Array.isArray(timeline) ? timeline : (data.timeline_events || data.timelineEvents || []);
      setTimelineEvents(timelineList);
      const graph = cachedGraph ?? (graphRaw ? normalizeGraphResponse(graphRaw) : null);
      if (graph) {
        setGraphCache(address, graph);
        setGraphData(graph);
      }
      setEvidence(data.evidence || []);
      setRecommendedActions(data.recommended_actions || []);
      setPropagationSignal(data.propagation_signal ?? "");
      setExposureRatio(data.exposure_ratio ?? 0);
      setPrimaryRiskDriver(data.primary_risk_driver ?? null);
      setCategory(data.category ?? "");
      setFingerprint(data.fingerprint ?? data.behavioral_fingerprint ?? "");

      navigate(`/analytics?wallet=${encodeURIComponent(address)}`, { replace: true });

      // For now summary-compact does not return reason_codes
      setReasons([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (walletParam && walletParam.trim() !== "") {
      setWallet(walletParam.trim());
      fetchScore(walletParam.trim());
    }
  }, [walletParam]);

  const graphTransactions = graphLinks.map((l) => {
    const getLinkId = (v: unknown) => {
      if (typeof v === "object" && v) {
        const o = v as Record<string, unknown>;
        return String(o.id ?? o.address ?? "");
      }
      return String(v ?? "");
    };
    return {
      from: getLinkId(l.source),
      to: getLinkId(l.target),
    };
  }).filter((t) => t.from && t.to);

  const scamClusterMembers = clusterMembers.length > 0
    ? clusterMembers
    : counterparties
        .filter((c) => ["HIGH", "CRITICAL", "SEVERE"].includes((c.risk_tier || "").toUpperCase()))
        .map((c) => c.wallet);

  return (
    <>
      {wallet && score !== null && !error ? (
        <AIClusterGraph
          wallet={wallet}
          clusterMembers={scamClusterMembers}
          counterparties={counterparties.map((c) => c.wallet)}
          transactions={graphTransactions}
          riskLevel={risk}
        />
      ) : (
        <InteractiveWalletGraph />
      )}
    <DashboardLayout>
      <div className="min-h-screen p-8 space-y-8 max-w-5xl mx-auto">
        {/* Header */}
        <div className="space-y-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Trust Analytics</h1>
            <p className="text-muted-foreground mt-2">
              AI-powered wallet risk evaluation.
          </p>
        </div>

          <div className="flex gap-2">
            <button
              onClick={() => setMode("simple")}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                mode === "simple"
                  ? "bg-white text-black"
                  : "bg-zinc-800 text-gray-400"
              }`}
            >
              Simple
            </button>

            <button
              onClick={() => setMode("investigation")}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                mode === "investigation"
                  ? "bg-white text-black"
                  : "bg-zinc-800 text-gray-400"
              }`}
            >
              Investigation
            </button>
          </div>
        </div>

        {/* Wallet Input */}
        <Card className="border rounded-2xl">
          <CardContent className="p-6 flex flex-col sm:flex-row gap-4">
            <Input
              placeholder="Paste Solana wallet address..."
              value={wallet}
              onChange={(e) => setWallet(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchScore()}
              className="flex-1 font-mono text-sm"
              disabled={loading}
            />
            <Button onClick={() => fetchScore()} disabled={loading || !wallet.trim()}>
              {loading ? "Loading..." : "Get Score"}
            </Button>
          </CardContent>
        </Card>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-12 flex items-center justify-center">
            <p className="text-muted-foreground">Loading wallet data...</p>
          </div>
        )}

        {/* Production Layout: Score + Breakdown */}
        {!loading && score !== null && !error && (
          mode === "simple" ? (
            <SimpleModeLayout
              score={score}
              risk={risk}
              riskColor={riskColor}
              summaryMessage={summaryMessage}
              badges={badges}
              confidence={confidence}
              cluster={cluster}
              propagationSignal={propagationSignal}
              exposureRatio={exposureRatio}
              primaryRiskDriver={primaryRiskDriver}
              category={category}
              recommendedActions={recommendedActions}
            />
          ) : (
            <InvestigationLayout
              wallet={wallet}
              graphData={graphData}
              score={score}
              risk={risk}
              riskColor={riskColor}
              propagationSignal={propagationSignal}
              exposureRatio={exposureRatio}
              primaryRiskDriver={primaryRiskDriver}
              badges={badges}
              category={category}
              cluster={cluster}
              counterparties={counterparties}
              graphNodes={graphNodes}
              graphLinks={graphLinks}
              clusterMembers={scamClusterMembers}
              fingerprint={fingerprint}
              moneyFlowPath={moneyFlowPath}
              timelineEvents={timelineEvents}
              evidence={evidence}
              onSelectWallet={(w) => {
                setWalletHistory((prev) => [...prev, w]);
                setWallet(w);
                fetchScore(w);
              }}
              onBreadcrumbSelect={(w) => {
                setWalletHistory((prev) => prev.slice(0, prev.indexOf(w) + 1));
                setWallet(w);
                fetchScore(w);
              }}
              walletHistory={walletHistory}
              recommendedActions={recommendedActions}
            />
          )
        )}
      </div>
    </DashboardLayout>
    </>
  );
}
