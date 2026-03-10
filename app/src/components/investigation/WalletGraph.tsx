import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import ForceGraph2D from "react-force-graph-2d";
import { getGraph, getGraphCache, setGraphCache } from "@/services/blockidApi";

export interface GraphNode {
  id: string;
  risk?: number;
  connections?: number;
}

export interface GraphEdge {
  source: string;
  target: string;
}

export interface GraphApiResponse {
  nodes?: { id?: string; risk?: number }[];
  edges?: GraphEdge[];
}

export type NormalizedGraphData = {
  nodes: GraphNode[];
  links: { source: string; target: string }[];
};

export function normalizeGraphResponse(data: GraphApiResponse): NormalizedGraphData {
  const nodes = (data.nodes ?? []).map((n) => ({
    ...n,
    id: String(n.id ?? ""),
    risk: typeof n.risk === "number" ? n.risk : undefined,
  })).filter((n) => n.id);

  const nodeIds = new Set(nodes.map((n) => n.id));
  const links = (data.edges ?? []).map((e) => ({
    source: String(e.source ?? ""),
    target: String(e.target ?? ""),
  })).filter((l) => nodeIds.has(l.source) && nodeIds.has(l.target) && l.source !== l.target);

  const connectionCount = new Map<string, number>();
  links.forEach((l) => {
    connectionCount.set(l.source, (connectionCount.get(l.source) ?? 0) + 1);
    connectionCount.set(l.target, (connectionCount.get(l.target) ?? 0) + 1);
  });

  const nodesWithConnections = nodes.map((n) => ({
    ...n,
    connections: connectionCount.get(n.id) ?? 0,
  }));

  return { nodes: nodesWithConnections, links };
}

const CLUSTER_EXPANSION_EDGE_THRESHOLD = 10;
const MAX_NODES = 100;
const MAX_EDGES = 200;
const INITIAL_BATCH = 10;
const BATCH_INCREMENT = 10;
const EXPANSION_INTERVAL_MS = 200;

function nodeColorByRisk(risk: number | undefined): string {
  if (risk == null) return "#eab308";
  if (risk >= 80) return "#22c55e";   // high score = green = safe
  if (risk >= 50) return "#eab308";   // medium = yellow
  if (risk >= 30) return "#f97316";   // low-medium = orange
  return "#ef4444";                   // low score = red = dangerous
}

export interface WalletGraphHandle {
  zoomToFit: (duration?: number, padding?: number) => void;
}

interface WalletGraphProps {
  wallet: string;
  graphData?: NormalizedGraphData | null;
  onSelectWallet?: (wallet: string) => void;
  hideResetButton?: boolean;
  fullscreen?: boolean;
}

const WalletGraph = forwardRef<WalletGraphHandle, WalletGraphProps>(function WalletGraph(
  { wallet, graphData: graphDataProp, onSelectWallet, hideResetButton, fullscreen },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const graphRef = useRef<any>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 300 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [graphData, setGraphData] = useState<NormalizedGraphData>({ nodes: [], links: [] });
  const [visibleNodes, setVisibleNodes] = useState<GraphNode[]>([]);
  const [visibleEdges, setVisibleEdges] = useState<{ source: string; target: string }[]>([]);

  useEffect(() => {
    if (!wallet.trim()) {
      setGraphData({ nodes: [], links: [] });
      setVisibleNodes([]);
      setVisibleEdges([]);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    getGraph(wallet)
      .then((data: GraphApiResponse) => {
        const normalized = normalizeGraphResponse(data);
        console.log("GRAPH DATA:", JSON.stringify(normalized));
        setGraphCache(wallet, normalized);
        setGraphData(normalized);
      })
      .catch((err) => {
        setError(err?.message ?? "Failed to load graph");
        setGraphData({ nodes: [], links: [] });
      })
      .finally(() => setLoading(false));
  }, [wallet, graphDataProp]);

  useEffect(() => {
    if (!graphData?.nodes?.length) {
      setVisibleNodes([]);
      setVisibleEdges([]);
      return;
    }
    const initialNodeCount = Math.min(INITIAL_BATCH, graphData.nodes.length, MAX_NODES);
    const initialNodes = graphData.nodes.slice(0, initialNodeCount);
    const initialNodeIds = new Set(initialNodes.map((n) => n.id));
    const initialLinks = graphData.links.filter((l) => {
      const src = typeof l.source === "object"
        ? (l.source as { id?: string }).id ?? String(l.source)
        : String(l.source);
      const tgt = typeof l.target === "object"
        ? (l.target as { id?: string }).id ?? String(l.target)
        : String(l.target);
      return initialNodeIds.has(src) && initialNodeIds.has(tgt) && src !== tgt;
    });
    const initialEdges = initialLinks.slice(0, Math.min(INITIAL_BATCH, MAX_EDGES));

    setVisibleNodes(initialNodes);
    setVisibleEdges(initialEdges);
  }, [graphData]);

  useEffect(() => {
    if (!graphData?.nodes?.length) return;

    let step = INITIAL_BATCH;

    const interval = setInterval(() => {
      step += BATCH_INCREMENT;

      const nodeCount = Math.min(step, graphData.nodes.length, MAX_NODES);
      const nodes = graphData.nodes.slice(0, nodeCount);
      const nodeIds = new Set(nodes.map((n) => n.id));
    const links = graphData.links.filter((l) => {
      const src = typeof l.source === "object"
        ? (l.source as { id?: string }).id ?? String(l.source)
        : String(l.source);
      const tgt = typeof l.target === "object"
        ? (l.target as { id?: string }).id ?? String(l.target)
        : String(l.target);
      return nodeIds.has(src) && nodeIds.has(tgt) && src !== tgt;
    });
      const edges = links.slice(0, MAX_EDGES);

      console.log("VISIBLE:", nodes.length, "nodes,", edges.length, "edges", edges);
      setVisibleNodes(nodes);
      setVisibleEdges(edges);

      if (step >= graphData.nodes.length || nodeCount >= MAX_NODES) {
        clearInterval(interval);
      }
    }, EXPANSION_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [graphData]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const updateSize = () => {
      requestAnimationFrame(() => {
        if (el && el.offsetWidth > 0) {
          const h = fullscreen ? el.offsetHeight : 300;
          setDimensions({ width: el.offsetWidth, height: h > 0 ? h : 300 });
        }
      });
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(el);
    return () => observer.disconnect();
  }, [fullscreen]);

  useImperativeHandle(ref, () => ({
    zoomToFit: (duration = 400, padding = 60) => graphRef.current?.zoomToFit(duration, padding),
  }), []);

  const nodeColor = useCallback((node: GraphNode) => nodeColorByRisk(node.risk), []);
  const nodeVal = useCallback((node: GraphNode) => (node.connections ?? 0) * 0.8 + 1, []);

  const nodeLabel = useCallback((node: GraphNode) => {
    const addr = node.id;
    const risk = node.risk != null ? node.risk : "—";
    const conn = node.connections ?? 0;
    return `Wallet: ${addr}\nRisk score: ${risk}\nCluster connections: ${conn}`;
  }, []);

  const handleNodeClick = useCallback(
    (node: GraphNode) => {
      if (node.id && onSelectWallet) onSelectWallet(node.id);
      const n = node as GraphNode & { x?: number; y?: number };
      if (n.x != null && n.y != null) graphRef.current?.centerAt(n.x, n.y, 400);
    },
    [onSelectWallet]
  );

  const clusterExpansionDetected = useMemo(() => {
    return graphData.links.length > CLUSTER_EXPANSION_EDGE_THRESHOLD;
  }, [graphData.links.length]);

  if (!wallet.trim()) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 min-h-[320px] flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Enter a wallet to view the network graph.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 min-h-[320px] flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading graph...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 min-h-[320px] flex items-center justify-center">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  if (graphData.nodes.length === 0 && graphData.links.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 min-h-[320px] flex items-center justify-center">
        <p className="text-sm text-muted-foreground">No wallet connections to display.</p>
      </div>
    );
  }

  const containerHeight = fullscreen ? "100%" : "320px";

  return (
    <div
      className={`relative overflow-hidden ${fullscreen ? "" : "rounded-2xl border border-zinc-800 bg-zinc-900/80"}`}
      style={{ width: "100%", height: containerHeight }}
    >
      {clusterExpansionDetected && (
        <div className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/30 flex items-center gap-2">
          <span className="text-amber-500 font-medium">Cluster Expansion Detected</span>
          <span className="text-muted-foreground text-sm">
            ({graphData.links.length} connections in network)
          </span>
        </div>
      )}
      <div ref={containerRef} style={{ width: "100%", height: fullscreen ? "100%" : "320px", display: "block", position: "relative" }}>
        {!hideResetButton && (
          <div style={{ position: "absolute", top: "8px", right: "8px", zIndex: 10 }}>
            <button
              type="button"
              onClick={() => graphRef.current?.zoomToFit(400)}
              className="px-3 py-1.5 text-xs rounded-lg bg-zinc-800 hover:bg-zinc-700 text-foreground"
            >
              Reset View
            </button>
          </div>
        )}
        <ForceGraph2D
          ref={graphRef}
          graphData={{
            nodes: visibleNodes,
            links: visibleEdges,
          }}
          nodeColor={nodeColor}
          nodeVal={nodeVal}
          nodeLabel={nodeLabel}
          onNodeClick={handleNodeClick}
          nodeCanvasObject={(node, ctx, globalScale) => {
            const n = node as GraphNode & { x?: number; y?: number };
            if (globalScale < 1.2) return;
            const x = n.x ?? 0;
            const y = n.y ?? 0;
            const r = (n.connections ?? 0) * 2 + 4;
            const label = n.id.length > 8 ? `${n.id.slice(0, 4)}...${n.id.slice(-4)}` : n.id;
            const fontSize = Math.max(8 / globalScale, 4);
            ctx.font = `${fontSize}px monospace`;
            ctx.fillStyle = "rgba(255,255,255,0.85)";
            ctx.textAlign = "center";
            ctx.fillText(label, x, y + r + fontSize + 1);
          }}
          nodeCanvasObjectMode={() => "after"}
          dagMode={undefined}
          d3AlphaMin={0.001}
          enableZoomInteraction
          enablePanInteraction
          enableNodeDrag
          linkColor={() => "rgba(148,163,184,0.8)"}
          linkWidth={2}
          linkDirectionalParticles={3}
          linkDirectionalParticleSpeed={0.005}
          linkDirectionalParticleWidth={3}
          linkDirectionalParticleColor={() => "#60a5fa"}
          backgroundColor="#0a0a0f"
          {...({ d3Force: "charge" } as object)}
          width={dimensions.width > 0 ? dimensions.width : undefined}
          height={dimensions.height}
          cooldownTicks={200}
          cooldownTime={5000}
          d3AlphaDecay={0.01}
          d3VelocityDecay={0.1}
          onEngineStop={() => {
            graphRef.current?.zoomToFit(300, 60);
          }}
        />
      </div>
    </div>
  );
});

export default WalletGraph;
