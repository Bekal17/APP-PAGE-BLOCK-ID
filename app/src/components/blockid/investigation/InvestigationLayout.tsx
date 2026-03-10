import React, { useState, useMemo, useEffect, useRef } from "react";
import { Maximize2, Minimize2 } from "lucide-react";
import type { WalletGraphHandle } from "@/components/investigation/WalletGraph";
import WalletOverview from "./WalletOverview";
import BehaviorSignals from "@/components/blockid/BehaviorSignals";
import RiskDrivers from "./RiskDrivers";
import CounterpartyExposure from "./CounterpartyExposure";
import Breadcrumbs from "./Breadcrumbs";
import WalletGraph3D, { buildGraphData } from "@/components/WalletGraph3D";
import WalletGraph from "@/components/investigation/WalletGraph";
import FlowPathGraph from "@/components/investigation/FlowPathGraph";
import TopNeighbors from "@/components/investigation/TopNeighbors";
import MoneyFlowPath from "./MoneyFlowPath";
import TransactionTimeline from "./TransactionTimeline";
import MoneyFlowHeatmap from "./MoneyFlowHeatmap";
import EvidencePanel from "./EvidencePanel";
import ActionPanel from "@/components/blockid/ActionPanel";

interface Props {
  wallet: string;
  graphData?: { nodes: { id: string; risk?: number; connections?: number }[]; links: { source: string; target: string }[] } | null;
  score: number;
  risk: string;
  riskColor: string;
  propagationSignal: string;
  exposureRatio: number;
  primaryRiskDriver: string | null;
  badges: string[];
  category: string;
  cluster: { cluster_id?: string; size?: number } | null;
  counterparties: { wallet: string; risk_tier: string }[];
  graphNodes: Record<string, unknown>[];
  graphLinks: Record<string, unknown>[];
  clusterMembers?: string[];
  fingerprint?: string;
  moneyFlowPath: { wallet: string; risk: string }[];
  timelineEvents: { time: string; event: string; counterparty?: string }[];
  evidence: { tx_hash: string; reason: string; timestamp?: string }[];
  onSelectWallet: (wallet: string) => void;
  onBreadcrumbSelect: (wallet: string) => void;
  walletHistory: string[];
  recommendedActions: string[];
}

export default function InvestigationLayout({
  wallet,
  graphData,
  score,
  risk,
  riskColor,
  propagationSignal,
  exposureRatio,
  primaryRiskDriver,
  badges,
  category,
  cluster,
  counterparties,
  graphNodes,
  graphLinks,
  clusterMembers = [],
  fingerprint = "",
  moneyFlowPath,
  timelineEvents,
  evidence,
  onSelectWallet,
  onBreadcrumbSelect,
  walletHistory,
  recommendedActions,
}: Props) {
  const [showNetwork, setShowNetwork] = useState(true);
  const [activeTab, setActiveTab] = useState("counterparties");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const walletGraphRef = useRef<WalletGraphHandle>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsFullscreen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const syntheticNodes = clusterMembers.map((m) => ({ id: m, risk_tier: "HIGH" }));
  const syntheticLinks = clusterMembers.map((m) => ({ source: wallet, target: m }));

  const analyticsGraph = useMemo(
    () => buildGraphData(
      wallet,
      graphNodes.length > 0 ? graphNodes : syntheticNodes,
      graphLinks.length > 0 ? graphLinks : syntheticLinks,
      clusterMembers,
      fingerprint
    ),
    [wallet, graphNodes, graphLinks, clusterMembers, fingerprint]
  );

  return (
    <div className="space-y-8">
      <Breadcrumbs
        walletHistory={walletHistory}
        onSelectWallet={onBreadcrumbSelect}
      />

      {/* Wallet Overview */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Wallet Overview</h2>
        <WalletOverview
          wallet={wallet}
          score={score}
          risk={risk}
          riskColor={riskColor}
          propagationSignal={propagationSignal}
          cluster={cluster}
        />
      </section>

      {/* Risk Analysis */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Risk Analysis</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <BehaviorSignals
            propagationSignal={propagationSignal}
            exposureRatio={exposureRatio}
            primaryRiskDriver={primaryRiskDriver}
            category={category}
          />
          <RiskDrivers
            primaryRiskDriver={primaryRiskDriver}
            badges={badges}
            category={category}
          />
        </div>
      </section>

      {/* Wallet Network Graph (Cluster Expansion) */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Wallet Network Graph</h2>
        <div className="relative">
          <div
            className={isFullscreen ? "fixed inset-0 z-50 bg-black" : "relative"}
            style={isFullscreen ? { width: "100vw", height: "100vh" } : undefined}
          >
            {isFullscreen && (
              <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3 bg-black/80">
                <span className="text-sm font-mono text-foreground truncate">{wallet}</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => walletGraphRef.current?.zoomToFit(400)}
                    className="px-3 py-1.5 text-xs rounded-lg bg-zinc-800 hover:bg-zinc-700 text-foreground"
                  >
                    Reset View
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsFullscreen(false)}
                    className="p-2 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-foreground"
                    aria-label="Exit fullscreen"
                  >
                    <Minimize2 size={20} />
                  </button>
                </div>
              </div>
            )}
            {!isFullscreen && (
              <div className="absolute top-3 right-3 flex gap-2 z-10">
                <button
                  type="button"
                  onClick={() => walletGraphRef.current?.zoomToFit(400)}
                  className="px-3 py-1.5 text-xs rounded-lg bg-zinc-800 hover:bg-zinc-700 text-foreground"
                >
                  Reset View
                </button>
                <button
                  type="button"
                  onClick={() => setIsFullscreen(true)}
                  className="p-2 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-foreground"
                  aria-label="Fullscreen"
                >
                  <Maximize2 size={20} />
                </button>
              </div>
            )}
            <div
              className={isFullscreen ? "absolute left-0 right-0 bottom-0" : ""}
              style={isFullscreen ? { top: 48, width: "100%", height: "calc(100vh - 48px)" } : undefined}
            >
              <WalletGraph
                ref={walletGraphRef}
                wallet={wallet}
                graphData={graphData}
                onSelectWallet={onSelectWallet}
                hideResetButton
                fullscreen={isFullscreen}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Network Intelligence */}
      <section className="space-y-4">
        <div
          className="flex justify-between items-center cursor-pointer"
          onClick={() => setShowNetwork(!showNetwork)}
        >
          <h2 className="text-lg font-semibold text-foreground">Network Intelligence</h2>
          <span className="text-foreground">{showNetwork ? "−" : "+"}</span>
        </div>
        {showNetwork && (
          <div className="space-y-4">
            <div className="flex gap-2 border-b border-zinc-800 pb-2">
              <button
                type="button"
                onClick={() => setActiveTab("counterparties")}
                className={`px-3 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                  activeTab === "counterparties"
                    ? "bg-zinc-800 text-foreground"
                    : "text-gray-400 hover:text-foreground hover:bg-zinc-800/50"
                }`}
              >
                Counterparties
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("graph")}
                className={`px-3 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                  activeTab === "graph"
                    ? "bg-zinc-800 text-foreground"
                    : "text-gray-400 hover:text-foreground hover:bg-zinc-800/50"
                }`}
              >
                Network Graph
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("timeline")}
                className={`px-3 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                  activeTab === "timeline"
                    ? "bg-zinc-800 text-foreground"
                    : "text-gray-400 hover:text-foreground hover:bg-zinc-800/50"
                }`}
              >
                Timeline
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("flow")}
                className={`px-3 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                  activeTab === "flow"
                    ? "bg-zinc-800 text-foreground"
                    : "text-gray-400 hover:text-foreground hover:bg-zinc-800/50"
                }`}
              >
                Money Flow
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("evidence")}
                className={`px-3 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                  activeTab === "evidence"
                    ? "bg-zinc-800 text-foreground"
                    : "text-gray-400 hover:text-foreground hover:bg-zinc-800/50"
                }`}
              >
                Evidence
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("neighbors")}
                className={`px-3 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                  activeTab === "neighbors"
                    ? "bg-zinc-800 text-foreground"
                    : "text-gray-400 hover:text-foreground hover:bg-zinc-800/50"
                }`}
              >
                Neighbors
              </button>
            </div>
            {activeTab === "counterparties" && (
              <CounterpartyExposure
                counterparties={counterparties}
                onSelectWallet={onSelectWallet}
              />
            )}
            {activeTab === "graph" && (
              <WalletGraph3D
                wallet={wallet}
                data={analyticsGraph}
                fingerprint={fingerprint}
                onSelectWallet={onSelectWallet}
                onLoadWallet={onSelectWallet}
              />
            )}
            {activeTab === "timeline" && (
              <div className="space-y-4">
                <TransactionTimeline events={timelineEvents} />
                <MoneyFlowHeatmap wallet={wallet} />
              </div>
            )}
            {activeTab === "flow" && (
              <div className="space-y-4">
                <FlowPathGraph wallet={wallet} onSelectWallet={onSelectWallet} />
                <MoneyFlowPath
                  path={moneyFlowPath}
                  onSelectWallet={onSelectWallet}
                />
              </div>
            )}
            {activeTab === "neighbors" && (
              <TopNeighbors wallet={wallet} onSelectWallet={onSelectWallet} />
            )}
            {activeTab === "evidence" && (
              <EvidencePanel evidence={evidence} />
            )}
          </div>
        )}
      </section>

      {/* Recommended Actions */}
      <section>
        <ActionPanel actions={recommendedActions} />
      </section>
    </div>
  );
}
