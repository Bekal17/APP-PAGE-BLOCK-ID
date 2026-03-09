import React, { useRef, useEffect, useState, useCallback } from "react";
import ForceGraph2D from "react-force-graph-2d";

interface WalletGraphProps {
  nodes: Array<Record<string, unknown>>;
  links: Array<Record<string, unknown>>;
  onSelectWallet?: (wallet: string) => void;
}

const INITIAL_NODE_LIMIT = 60;

const NODE_COLORS: Record<string, string> = {
  target: "#22d3ee",  // cyan
  risky: "#ef4444",   // red
  cluster: "#f59e0b", // amber
  normal: "#6b7280",  // gray
};

const getNodeColor = (risk: string | undefined): string => {
  if (!risk) return "#22c55e";
  const r = String(risk).toUpperCase();
  if (r === "HIGH") return "#ef4444";
  if (r === "MEDIUM") return "#f59e0b";
  return "#22c55e";
};

const riskScore = (risk: string | undefined): number => {
  const r = String(risk || "").toUpperCase();
  if (r === "HIGH") return 3;
  if (r === "MEDIUM") return 2;
  return 1;
};

const getLinkIds = (link: Record<string, unknown>) => {
  const srcId = typeof link.source === "object"
    ? (link.source as Record<string, unknown>)?.id
    : link.source;
  const tgtId = typeof link.target === "object"
    ? (link.target as Record<string, unknown>)?.id
    : link.target;
  return { src: String(srcId ?? ""), tgt: String(tgtId ?? "") };
};

const findPath = (
  nodes: Array<Record<string, unknown>>,
  links: Array<Record<string, unknown>>,
  start: string,
  end: string
): string[] => {
  const getId = (n: unknown) =>
    typeof n === "object" && n && "id" in n ? String((n as Record<string, unknown>).id) : String(n);
  const queue: string[][] = [[start]];
  const visited = new Set<string>();

  while (queue.length) {
    const path = queue.shift()!;
    const node = path[path.length - 1];

    if (node === end) return path;
    if (visited.has(node)) continue;
    visited.add(node);

    links.forEach((l) => {
      const src = getId(l.source);
      const tgt = getId(l.target);
      const neighbor = src === node ? tgt : tgt === node ? src : null;
      if (neighbor && !visited.has(neighbor)) {
        queue.push([...path, neighbor]);
      }
    });
  }
  return [];
};

const findRiskPath = (
  nodes: Array<Record<string, unknown>>,
  links: Array<Record<string, unknown>>
): string[] => {
  let bestPath: string[] = [];
  let bestScore = 0;

  links.forEach((link) => {
    const srcId = typeof link.source === "object" ? (link.source as Record<string, unknown>)?.id : link.source;
    const tgtId = typeof link.target === "object" ? (link.target as Record<string, unknown>)?.id : link.target;
    const source = nodes.find((n) => (n.id ?? n.address) === srcId);
    const target = nodes.find((n) => (n.id ?? n.address) === tgtId);

    const score =
      riskScore((source?.risk ?? source?.risk_tier) as string) +
      riskScore((target?.risk ?? target?.risk_tier) as string);

    if (score > bestScore) {
      bestScore = score;
      bestPath = [String(srcId ?? ""), String(tgtId ?? "")];
    }
  });

  return bestPath;
};

export default function WalletGraph({ nodes, links, onSelectWallet }: WalletGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const graphRef = useRef<any>(null);
  const [dimensions, setDimensions] = useState({ width: 400, height: 320 });
  const [sourceWallet, setSourceWallet] = useState("");
  const [targetWallet, setTargetWallet] = useState("");
  const [pathResult, setPathResult] = useState<string[]>([]);
  const [graphData, setGraphData] = useState<{
    nodes: Array<Record<string, unknown>>;
    links: Array<Record<string, unknown>>;
  }>(() => {
    const normalizedNodes = nodes.map((n, i) => ({
      ...n,
      id: n.id ?? (n as any).address ?? `node-${i}`,
    }));
    const visibleNodes = normalizedNodes.slice(0, INITIAL_NODE_LIMIT);
    const visibleNodeIds = new Set(visibleNodes.map((n) => String(n.id ?? (n as any).address ?? "")));
    const visibleLinks = links.filter((l) => {
      const { src, tgt } = getLinkIds(l);
      return visibleNodeIds.has(src) && visibleNodeIds.has(tgt);
    });
    const normalizedLinks = visibleLinks.map((l) => ({
      ...l,
      source: l.source ?? "",
      target: l.target ?? "",
    }));
    return { nodes: visibleNodes, links: normalizedLinks };
  });

  useEffect(() => {
    const normalizedNodes = nodes.map((n, i) => ({
      ...n,
      id: n.id ?? (n as any).address ?? `node-${i}`,
    }));
    const visibleNodes = normalizedNodes.slice(0, INITIAL_NODE_LIMIT);
    const visibleNodeIds = new Set(visibleNodes.map((n) => String(n.id ?? (n as any).address ?? "")));
    const visibleLinks = links.filter((l) => {
      const { src, tgt } = getLinkIds(l);
      return visibleNodeIds.has(src) && visibleNodeIds.has(tgt);
    });
    const normalizedLinks = visibleLinks.map((l) => ({
      ...l,
      source: l.source ?? "",
      target: l.target ?? "",
    }));
    setGraphData({ nodes: visibleNodes, links: normalizedLinks });
  }, [nodes, links]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateSize = () => {
      if (el) {
        setDimensions({ width: el.offsetWidth || 800, height: 300 });
      }
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const riskyPath = React.useMemo(
    () => findRiskPath(graphData.nodes, graphData.links),
    [graphData.nodes, graphData.links]
  );

  const runPathFinder = useCallback(() => {
    const start = sourceWallet.trim();
    const end = targetWallet.trim();
    if (!start || !end) return;
    const result = findPath(graphData.nodes, graphData.links, start, end);
    setPathResult(result);
  }, [sourceWallet, targetWallet, graphData.nodes, graphData.links]);

  const nodeColor = useCallback((node: Record<string, unknown>) => {
    const risk = (node.risk ?? node.risk_tier) as string | undefined;
    if (risk) return getNodeColor(risk);
    const type = (node.type as string) ?? "normal";
    return NODE_COLORS[type] ?? NODE_COLORS.normal;
  }, []);

  const isLinkInRiskPath = useCallback(
    (link: Record<string, unknown>) => {
      const { src, tgt } = getLinkIds(link);
      return riskyPath.includes(src) && riskyPath.includes(tgt);
    },
    [riskyPath]
  );

  const isLinkOnPath = useCallback(
    (link: Record<string, unknown>, path: string[]) => {
      const { src, tgt } = getLinkIds(link);
      for (let i = 0; i < path.length - 1; i++) {
        if ((path[i] === src && path[i + 1] === tgt) || (path[i] === tgt && path[i + 1] === src)) {
          return true;
        }
      }
      return false;
    },
    []
  );

  const linkColor = useCallback(
    (link: Record<string, unknown>) => {
      if (pathResult.length > 0 && isLinkOnPath(link, pathResult)) {
        return "#ff0000";
      }
      const { src, tgt } = getLinkIds(link);
      if (riskyPath.includes(src) && riskyPath.includes(tgt)) {
        return "#ff0000";
      }
      return "#444";
    },
    [riskyPath, pathResult, isLinkOnPath]
  );

  const linkDirectionalParticles = useCallback((link: Record<string, unknown>) => {
    const risk = String(link.risk ?? link.risk_tier ?? "").toUpperCase();
    if (risk === "HIGH") return 4;
    return 0;
  }, []);

  const linkDirectionalParticleWidth = useCallback((link: Record<string, unknown>) => {
    const risk = String(link.risk ?? link.risk_tier ?? "LOW").toUpperCase();
    if (risk === "HIGH") return 4;
    if (risk === "MEDIUM") return 3;
    return 2;
  }, []);

  const linkDirectionalParticleColor = useCallback((link: Record<string, unknown>) => {
    const risk = String(link.risk ?? link.risk_tier ?? "LOW").toUpperCase();
    if (risk === "HIGH") return "#ef4444";
    if (risk === "MEDIUM") return "#f59e0b";
    return "#22c55e";
  }, []);

  const linkDirectionalParticleSpeed = useCallback((link: Record<string, unknown>) => {
    const risk = String(link.risk ?? link.risk_tier ?? "LOW").toUpperCase();
    if (risk === "HIGH") return 0.02;
    if (risk === "MEDIUM") return 0.015;
    return 0.01;
  }, []);

  const nodeCanvasObject = useCallback(
    (node: Record<string, unknown>, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const n = node as { x?: number; y?: number; r?: number };
      const nodeId = String(node.id ?? node.address ?? "");
      const isRiskPath = riskyPath.includes(nodeId);
      const isPathResult = pathResult.includes(nodeId);
      const risk = String(node.risk ?? node.risk_tier ?? "LOW").toUpperCase();
      const colors: Record<string, string> = {
        HIGH: "#ef4444",
        MEDIUM: "#f59e0b",
        LOW: "#22c55e",
      };
      const color = colors[risk] ?? "#22c55e";

      ctx.save();
      if (isPathResult || isRiskPath) {
        ctx.shadowColor = "#ff0000";
        ctx.shadowBlur = 20;
      }
      ctx.beginPath();
      ctx.arc(n.x ?? 0, n.y ?? 0, 6, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.restore();

      const label = String(node.id ?? node.address ?? "Wallet");
      const displayLabel = label.length > 12 ? `${label.slice(0, 4)}...${label.slice(-4)}` : label;
      const fontSize = 12 / globalScale;
      ctx.font = `${fontSize}px Sans-Serif`;
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.fillText(displayLabel, (n.x ?? 0) + 8, (n.y ?? 0) + 8);
    },
    [riskyPath, pathResult]
  );

  const getNodeLabel = useCallback((node: Record<string, unknown>) => {
    const id = node.id ?? node.address ?? "Wallet";
    const type = (node.type as string) ?? "normal";
    return `${String(id)}\nType: ${type}`;
  }, []);

  const graphDataRef = useRef(graphData);
  graphDataRef.current = graphData;

  const expandNetwork = useCallback(async (wallet: string) => {
    try {
      const res = await fetch(
        `http://localhost:8001/explorer/identity/${encodeURIComponent(wallet)}/counterparties`
      );
      const raw = await res.json();
      const data = Array.isArray(raw) ? raw : raw.counterparties ?? [];
      const { nodes: currentNodes, links: currentLinks } = graphDataRef.current;
      const existingIds = new Set(
        currentNodes.map((n) => String(n.id ?? n.address ?? ""))
      );
      const existingLinkKeys = new Set(
        currentLinks.map((l) => {
          const { src, tgt } = getLinkIds(l);
          return `${src}->${tgt}`;
        })
      );
      const newNodes = data
        .filter((c: { wallet?: string }) => {
          const id = String(c.wallet ?? "");
          return id && !existingIds.has(id);
        })
        .map((c: { wallet?: string; risk_tier?: string }) => ({
          id: c.wallet,
          risk_tier: c.risk_tier,
        }));
      const newLinks = data
        .filter((c: { wallet?: string }) => {
          const key = `${wallet}->${c.wallet ?? ""}`;
          return !existingLinkKeys.has(key);
        })
        .map((c: { wallet?: string; risk_tier?: string }) => ({
          source: wallet,
          target: c.wallet,
          risk_tier: c.risk_tier,
        }));
      if (newNodes.length > 0 || newLinks.length > 0) {
        setGraphData((prev) => ({
          nodes: [...prev.nodes, ...newNodes],
          links: [...prev.links, ...newLinks],
        }));
      }
    } catch (err) {
      console.error("Expand network failed", err);
    }
  }, []);

  const handleNodeClick = useCallback(
    (node: Record<string, unknown>) => {
      const id = node.id;
      const wallet = id != null ? String(id) : "";
      if (wallet && onSelectWallet) {
        onSelectWallet(wallet);
      }
      if (wallet) {
        expandNetwork(wallet);
      }
      const n = node as { x?: number; y?: number };
      const x = n.x ?? 0;
      const y = n.y ?? 0;
      graphRef.current?.centerAt(x, y, 1000);
      graphRef.current?.zoom(1.5, 1000);
    },
    [onSelectWallet, expandNetwork]
  );

  const resetView = useCallback(() => {
    graphRef.current?.zoomToFit(400);
  }, []);

  if (!nodes.length && !links.length) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 h-80 flex items-center justify-center card-hover-glow">
        <p className="text-sm text-gray-400">No wallet connections to display</p>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden card-hover-glow" style={{ width: "100%" }}>
      <div className="flex flex-wrap gap-2 p-3">
        <input
          placeholder="Source wallet"
          value={sourceWallet}
          onChange={(e) => setSourceWallet(e.target.value)}
          className="flex-1 min-w-0 px-3 py-1.5 text-sm rounded bg-zinc-800 border border-zinc-700 text-foreground placeholder:text-gray-500"
        />
        <input
          placeholder="Target wallet"
          value={targetWallet}
          onChange={(e) => setTargetWallet(e.target.value)}
          className="flex-1 min-w-0 px-3 py-1.5 text-sm rounded bg-zinc-800 border border-zinc-700 text-foreground placeholder:text-gray-500"
        />
        <button
          type="button"
          onClick={runPathFinder}
          className="px-3 py-1.5 text-sm rounded bg-zinc-800 hover:bg-zinc-700 text-foreground"
        >
          Find Path
        </button>
      </div>
      <div ref={containerRef} style={{ width: "100%", height: "300px" }}>
        <ForceGraph2D
          ref={graphRef}
          graphData={graphData}
          nodeColor={nodeColor}
          linkColor={linkColor}
          linkDirectionalParticles={linkDirectionalParticles}
          linkDirectionalParticleWidth={linkDirectionalParticleWidth}
          linkDirectionalParticleColor={linkDirectionalParticleColor}
          linkDirectionalParticleSpeed={linkDirectionalParticleSpeed}
          nodeCanvasObject={nodeCanvasObject}
          nodeCanvasObjectMode="replace"
          nodeLabel={getNodeLabel}
          onNodeClick={handleNodeClick}
          enableZoomInteraction={true}
          enablePanInteraction={true}
          enableNodeDrag={true}
          cooldownTicks={100}
          cooldownTime={3000}
          d3AlphaDecay={0.05}
          d3VelocityDecay={0.4}
          width={dimensions.width || 800}
          height={300}
        />
        <div className="absolute bottom-4 right-4 w-32 h-32 bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden pointer-events-none">
          <ForceGraph2D
            graphData={graphData}
            width={120}
            height={120}
            enableZoomInteraction={false}
            enablePanInteraction={false}
            enableNodeDrag={false}
            nodeRelSize={2}
          />
        </div>
      </div>
    </div>
  );
}
