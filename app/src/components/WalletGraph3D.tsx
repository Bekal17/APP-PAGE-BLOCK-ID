import { useEffect, useState, useCallback, useRef } from "react";
import ForceGraph3D from "react-force-graph-3d";
import * as THREE from "three";
import GraphModeToggle from "@/components/blockid/GraphModeToggle";

interface GraphNode {
  id: string;
  type: "center" | "counterparty" | "scam";
  risk?: number;
  isPatternNode?: boolean;
}

interface GraphLink {
  source: string;
  target: string;
}

interface AnalyticsGraph {
  nodes: GraphNode[];
  links: GraphLink[];
}

type GraphLayout = "radial" | "circular" | "force-cluster";

interface WalletGraph3DProps {
  wallet: string;
  data: AnalyticsGraph;
  fingerprint?: string;
  onSelectWallet?: (wallet: string) => void;
  onLoadWallet?: (wallet: string) => void;
}

const FINGERPRINT_LAYOUT: Record<string, GraphLayout> = {
  drainer: "radial",
  "wash trading": "circular",
  "wash_trading": "circular",
  cluster: "force-cluster",
};

const FINGERPRINT_LABELS: Record<string, string> = {
  drainer: "Drainer Network",
  "wash trading": "Wash Trading Pattern",
  "wash_trading": "Wash Trading Pattern",
  cluster: "Cluster Behavior",
};


const NODE_COLORS: Record<string, string> = {
  center: "#22d3ee",
  counterparty: "#a855f7",
  scam: "#ef4444",
};

const getNodeColor = (node: GraphNode) => {
  if (node.type === "center") return NODE_COLORS.center;
  if (node.type === "counterparty") return NODE_COLORS.counterparty;
  if (node.type === "scam") return NODE_COLORS.scam;
  return NODE_COLORS.counterparty;
};

export function buildGraphData(
  wallet: string,
  nodes: Record<string, unknown>[],
  links: Record<string, unknown>[],
  clusterMembers: string[] = [],
  fingerprint: string = ""
): AnalyticsGraph {
  const scamSet = new Set(clusterMembers);
  const nodeMap = new Map<string, GraphNode>();
  const graphNodes: GraphNode[] = [];
  const graphLinks: GraphLink[] = [];

  const getLinkId = (v: unknown) => {
    if (typeof v === "object" && v) {
      const o = v as Record<string, unknown>;
      return String(o.id ?? o.address ?? "");
    }
    return String(v ?? "");
  };

  const riskFromNode = (n: Record<string, unknown>): number | undefined => {
    const risk = n.risk as number | undefined;
    if (typeof risk === "number") return risk;
    const score = n.trust_score as number | undefined;
    if (typeof score === "number") return Math.max(0, 100 - score);
    const tier = String(n.risk_tier ?? "").toUpperCase();
    if (tier === "HIGH" || tier === "CRITICAL") return 90;
    if (tier === "MEDIUM") return 50;
    if (tier === "LOW") return 15;
    return undefined;
  };

  const fp = String(fingerprint || "").toLowerCase().trim();
  const isDrainer = fp === "drainer";
  const isWashTrading = fp === "wash trading" || fp === "wash_trading";
  const isCluster = fp === "cluster";

  const ensureNode = (id: string, type: GraphNode["type"], risk?: number) => {
    if (!id) return;
    const existing = nodeMap.get(id);
    if (existing) return;
    const isPatternNode =
      (isDrainer && type === "scam") ||
      (isWashTrading && (type === "counterparty" || type === "scam")) ||
      (isCluster && (type === "scam" || scamSet.has(id)));
    const node: GraphNode = { id, type, risk, isPatternNode };
    nodeMap.set(id, node);
    graphNodes.push(node);
  };

  ensureNode(wallet, "center");

  nodes.forEach((n, i) => {
    const id = String(n.id ?? n.address ?? `node-${i}`);
    if (!id) return;
    const tier = String(n.risk ?? n.risk_tier ?? "").toUpperCase();
    const explicitType = (n.type as string) ?? "";
    let type: GraphNode["type"] = "counterparty";
    if (id === wallet) type = "center";
    else if (
      explicitType === "scam" ||
      explicitType === "risky" ||
      scamSet.has(id) ||
      tier === "HIGH" ||
      tier === "CRITICAL"
    )
      type = "scam";
    ensureNode(id, type, riskFromNode(n));
  });

  links.forEach((l) => {
    const src = getLinkId(l.source);
    const tgt = getLinkId(l.target);
    if (src && tgt && src !== tgt) {
      ensureNode(src, src === wallet ? "center" : scamSet.has(src) ? "scam" : "counterparty");
      ensureNode(tgt, tgt === wallet ? "center" : scamSet.has(tgt) ? "scam" : "counterparty");
      graphLinks.push({ source: src, target: tgt });
    }
  });

  return { nodes: graphNodes, links: graphLinks };
}

export default function WalletGraph3D({
  wallet,
  data,
  fingerprint = "",
  onSelectWallet,
  onLoadWallet,
}: WalletGraph3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 640, height: 400 });
  const [graphData, setGraphData] = useState(data);
  const [graphMode, setGraphMode] = useState("investigation");
  const [searchInput, setSearchInput] = useState("");

  useEffect(() => {
    setGraphData(data);
  }, [data]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateSize = () => {
      if (el) {
        const rect = el.getBoundingClientRect();
        setDimensions({ width: rect.width, height: 400 });
      }
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const graphDataRef = useRef(graphData);
  graphDataRef.current = graphData;

  const expandCluster = useCallback(async (nodeId: string) => {
    try {
      let list: { wallet?: string; risk_tier?: string }[] = [];
      const connectionsRes = await fetch(
        `http://localhost:8001/api/wallet-connections?wallet=${encodeURIComponent(nodeId)}`
      );
      if (connectionsRes.ok) {
        const connectionsData = await connectionsRes.json();
        list = connectionsData.connections ?? connectionsData ?? [];
        if (!Array.isArray(list)) list = [];
      }
      if (list.length === 0) {
        const counterpartiesRes = await fetch(
          `http://localhost:8001/explorer/identity/${encodeURIComponent(nodeId)}/counterparties`
        );
        const raw = await counterpartiesRes.json();
        list = Array.isArray(raw) ? raw : raw.counterparties ?? [];
      }
      const current = graphDataRef.current;
      const existingIds = new Set(current.nodes.map((n) => n.id));
      const existingLinkKeys = new Set(
        current.links.map((l) => `${l.source}-${l.target}`)
      );

        const newNodes = list
          .filter((c: { wallet?: string }) => {
            const id = String(c.wallet ?? "");
            return id && !existingIds.has(id);
          })
          .map((c: { wallet?: string; risk_tier?: string }) => ({
            id: c.wallet!,
            type: (["HIGH", "CRITICAL", "SEVERE"].includes(String(c.risk_tier ?? "").toUpperCase()) ? "scam" : "counterparty") as GraphNode["type"],
          }));

        const newLinks = list
          .filter((c: { wallet?: string }) => {
            const key = `${nodeId}-${c.wallet ?? ""}`;
            return !existingLinkKeys.has(key);
          })
          .map((c: { wallet?: string }) => ({
            source: nodeId,
            target: c.wallet!,
          }));

        if (newNodes.length > 0 || newLinks.length > 0) {
          setGraphData((prev) => ({
            nodes: [...prev.nodes, ...newNodes],
            links: [...prev.links, ...newLinks],
          }));
        }
      } catch (err) {
        console.error("Expand cluster failed", err);
      }
    }, []);

  const handleNodeClick = useCallback(
    (node: GraphNode) => {
      expandCluster(node.id);
      onSelectWallet?.(node.id);
    },
    [expandCluster, onSelectWallet]
  );

  const loadWalletGraph = useCallback(
    (address: string) => {
      const addr = address.trim();
      if (!addr) return;
      onLoadWallet?.(addr) ?? onSelectWallet?.(addr);
    },
    [onLoadWallet, onSelectWallet]
  );

  const fpNormalized = String(fingerprint || "").toLowerCase().trim();
  const layout = FINGERPRINT_LAYOUT[fpNormalized] ?? "force-cluster";
  const fingerprintLabel = FINGERPRINT_LABELS[fpNormalized];
  const showBehaviorBadge = graphMode === "behavior" && !!fingerprintLabel;
  const isUniverseMode = graphMode === "universe";
  const dagMode =
    isUniverseMode ? undefined : layout === "radial" ? "radialout" : layout === "circular" ? "radialin" : undefined;

  const graphRef = useRef<{
    cameraPosition: (pos: { x?: number; y?: number; z?: number }, lookAt?: { x?: number; y?: number; z?: number }, transitionMs?: number) => void;
  } | null>(null);

  useEffect(() => {
    if (!isUniverseMode) return;
    let angle = 0;
    const orbitRadius = 400;
    const orbitHeight = 200;
    const orbitSpeed = 0.00015;

    const tick = () => {
      angle += orbitSpeed;
      const x = orbitRadius * Math.cos(angle);
      const z = orbitRadius * Math.sin(angle);
      graphRef.current?.cameraPosition?.({ x, y: orbitHeight, z }, { x: 0, y: 0, z: 0 }, 50);
    };

    const id = setInterval(tick, 50);
    return () => clearInterval(id);
  }, [isUniverseMode]);

  const nodeThreeObject = useCallback(
    (node: GraphNode) => {
      if (isUniverseMode) {
        const color = getNodeColor(node);
        const sprite = new THREE.Sprite(
          new THREE.SpriteMaterial({
            color,
            transparent: true,
            opacity: 0.95,
          })
        );
        const scale = node.type === "center" ? 8 : node.type === "scam" ? 5 : 6;
        sprite.scale.set(scale, scale, 1);
        return sprite;
      }

      const color = getNodeColor(node);
      const radius = node.type === "center" ? 4 : node.type === "scam" ? 3 : 2.5;
      const geometry = new THREE.SphereGeometry(radius, 16, 16);
      const usePatternGlow = showBehaviorBadge && node.isPatternNode;
      const material = new THREE.MeshLambertMaterial({
        color,
        emissive: usePatternGlow ? 0xef4444 : node.type === "scam" || node.type === "center" ? color : "#000000",
        emissiveIntensity: usePatternGlow ? 0.8 : node.type === "scam" ? 0.6 : node.type === "center" ? 0.4 : 0,
      });
      const mesh = new THREE.Mesh(geometry, material);
      const effectiveRisk = node.risk ?? (node.type === "scam" ? 90 : 0);
      const showPropagationRipple = effectiveRisk > 80;
      if (showPropagationRipple) {
        const group = new THREE.Group();
        group.add(mesh);
        const rippleGeom = new THREE.RingGeometry(radius * 2, radius * 2.5, 32);
        const rippleMat = new THREE.MeshBasicMaterial({
          color: 0xef4444,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.25,
        });
        const ripple = new THREE.Mesh(rippleGeom, rippleMat);
        ripple.rotation.x = -Math.PI / 2;
        group.add(ripple);
        return group;
      }
      return mesh;
    },
    [showBehaviorBadge, isUniverseMode]
  );

  const emptyState = (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 card-hover-glow">
      <div className="flex flex-col gap-3 mb-3">
        <div className="flex flex-wrap gap-2 items-center">
          <input
            placeholder="Search wallet"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") loadWalletGraph(searchInput);
            }}
            className="flex-1 min-w-[200px] px-3 py-2 text-sm rounded-lg bg-zinc-800 border border-zinc-700 text-foreground placeholder:text-gray-500"
          />
          <GraphModeToggle
            modes={["investigation", "behavior", "universe"]}
            value={graphMode}
            onChange={setGraphMode}
          />
        </div>
      </div>
      <div className="h-80 flex items-center justify-center rounded-lg bg-zinc-900/50">
        <p className="text-sm text-gray-400">No wallet connections to display</p>
      </div>
    </div>
  );

  if (!graphData.nodes.length && !graphData.links.length) {
    return emptyState;
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 card-hover-glow">
      <div className="flex flex-col gap-3 mb-3">
        <div className="flex flex-wrap gap-2 items-center">
          <input
            placeholder="Search wallet"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") loadWalletGraph(searchInput);
            }}
            className="flex-1 min-w-[200px] px-3 py-2 text-sm rounded-lg bg-zinc-800 border border-zinc-700 text-foreground placeholder:text-gray-500"
          />
          <GraphModeToggle
            modes={["investigation", "behavior", "universe"]}
            value={graphMode}
            onChange={setGraphMode}
          />
          {showBehaviorBadge && (
            <span className="px-3 py-1.5 text-xs font-medium rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30">
              Behavior Pattern: {fingerprintLabel}
            </span>
          )}
          {isUniverseMode && (
            <span className="px-3 py-1.5 text-xs font-medium rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              Blockchain Universe
            </span>
          )}
        </div>
      </div>
      <div ref={containerRef} className="relative h-80 overflow-hidden rounded-lg">
        <ForceGraph3D
          ref={graphRef}
          graphData={graphData}
          nodeLabel={(n) => String((n as GraphNode).id).slice(0, 8) + "..."}
          nodeColor={(n) => getNodeColor(n as GraphNode)}
          nodeThreeObject={nodeThreeObject}
          linkDirectionalParticles={isUniverseMode ? 6 : 4}
          linkDirectionalParticleSpeed={isUniverseMode ? 0.005 : 0.004}
          linkDirectionalParticleWidth={isUniverseMode ? 3 : 2}
          backgroundColor="#020617"
          width={dimensions.width}
          height={dimensions.height}
          onNodeClick={(n) => handleNodeClick(n as GraphNode)}
          enableNodeDrag={!isUniverseMode}
          dagMode={dagMode}
          dagLevelDistance={dagMode ? 120 : undefined}
          d3VelocityDecay={isUniverseMode ? 0.15 : undefined}
          d3AlphaDecay={isUniverseMode ? 0.02 : undefined}
        />
      </div>
    </div>
  );
}

export type { AnalyticsGraph, GraphNode, GraphLink };
