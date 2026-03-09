import { useEffect, useRef } from "react";

interface Transaction {
  from: string;
  to: string;
}

interface GraphNode {
  x: number;
  y: number;
  type: "center" | "counterparty" | "scam";
  address: string;
}

interface Flow {
  from: GraphNode;
  to: GraphNode;
  t: number;
}

interface AIClusterGraphProps {
  wallet: string;
  clusterMembers?: string[];
  counterparties?: string[];
  transactions?: Transaction[];
  riskLevel?: string;
}

const COLORS = {
  center: "rgba(34,211,238,1)",
  counterparty: "rgba(168,85,247,0.9)",
  scam: "rgba(239,68,68,1)",
};

export default function AIClusterGraph({
  wallet,
  clusterMembers = [],
  counterparties = [],
  transactions = [],
  riskLevel = "LOW",
}: AIClusterGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    const nodes: GraphNode[] = [];
    const nodeMap = new Map<string, GraphNode>();
    let flows: Flow[] = [];

    nodes.push({
      x: centerX,
      y: centerY,
      type: "center",
      address: wallet,
    });
    nodeMap.set(wallet, nodes[0]);

    const scamSet = new Set(clusterMembers);

    clusterMembers.forEach((a) => {
      if (a === wallet || nodeMap.has(a)) return;
      const angle = Math.random() * Math.PI * 2;
      const dist = 120 + Math.random() * 180;
      const node: GraphNode = {
        x: centerX + Math.cos(angle) * dist,
        y: centerY + Math.sin(angle) * dist,
        type: "scam",
        address: a,
      };
      nodes.push(node);
      nodeMap.set(a, node);
    });

    const counterpartySet = new Set(counterparties.filter((a) => a !== wallet && !nodeMap.has(a)));
    counterpartySet.forEach((a) => {
      const angle = Math.random() * Math.PI * 2;
      const dist = 100 + Math.random() * 200;
      const node: GraphNode = {
        x: centerX + Math.cos(angle) * dist,
        y: centerY + Math.sin(angle) * dist,
        type: "counterparty",
        address: a,
      };
      nodes.push(node);
      nodeMap.set(a, node);
    });

    const hasScamInCluster = scamSet.size > 0;

    function drawEdges() {
      transactions.forEach((tx) => {
        const from = nodeMap.get(tx.from);
        const to = nodeMap.get(tx.to);
        if (!from || !to) return;

        const isScam = scamSet.has(tx.from) || scamSet.has(tx.to);
        const edgeColor = isScam ? "rgba(239,68,68,0.5)" : "rgba(99,102,241,0.4)";

        const mx = (from.x + to.x) / 2;
        const my = (from.y + to.y) / 2 - 30;
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.quadraticCurveTo(mx, my, to.x, to.y);
        ctx.strokeStyle = edgeColor;
        ctx.lineWidth = isScam ? 1.5 : 1;
        ctx.stroke();

        const angle = Math.atan2(to.y - my, to.x - mx);
        const arrowSize = 6;
        ctx.beginPath();
        ctx.moveTo(to.x, to.y);
        ctx.lineTo(
          to.x - arrowSize * Math.cos(angle - Math.PI / 6),
          to.y - arrowSize * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
          to.x - arrowSize * Math.cos(angle + Math.PI / 6),
          to.y - arrowSize * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fillStyle = edgeColor;
        ctx.fill();
      });

      clusterMembers.forEach((a) => {
        const from = nodeMap.get(wallet);
        const to = nodeMap.get(a);
        if (!from || !to) return;

        const mx = (from.x + to.x) / 2;
        const my = (from.y + to.y) / 2 - 30;
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.quadraticCurveTo(mx, my, to.x, to.y);
        ctx.strokeStyle = "rgba(239,68,68,0.35)";
        ctx.lineWidth = 1;
        ctx.stroke();

        const angle = Math.atan2(to.y - my, to.x - mx);
        const arrowSize = 5;
        ctx.beginPath();
        ctx.moveTo(to.x, to.y);
        ctx.lineTo(
          to.x - arrowSize * Math.cos(angle - Math.PI / 6),
          to.y - arrowSize * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
          to.x - arrowSize * Math.cos(angle + Math.PI / 6),
          to.y - arrowSize * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fillStyle = "rgba(239,68,68,0.35)";
        ctx.fill();
      });
    }

    function drawNodes() {
      nodes.forEach((n) => {
        const r = n.type === "center" ? 7 : 4;
        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx.fillStyle = COLORS[n.type];
        ctx.shadowColor = COLORS[n.type];
        ctx.shadowBlur = 15;
        ctx.fill();
        ctx.shadowBlur = 0;
      });
    }

    function drawFlows() {
      flows.forEach((f) => {
        f.t += 0.02;

        const x = f.from.x + (f.to.x - f.from.x) * f.t;
        const y = f.from.y + (f.to.y - f.from.y) * f.t;

        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        const isRisky = scamSet.has(f.from.address) || scamSet.has(f.to.address);
        const particleColor = isRisky ? "rgba(239,68,68,0.9)" : "rgba(34,211,238,0.9)";
        ctx.fillStyle = particleColor;
        ctx.shadowColor = particleColor;
        ctx.shadowBlur = 12;
        ctx.fill();
        ctx.shadowBlur = 0;
      });
      flows = flows.filter((f) => f.t < 1);
    }

    function drawPropagationRisk() {
      if (!hasScamInCluster) return;

      nodes.forEach((n) => {
        if (n.type !== "scam") return;

        ctx.beginPath();
        ctx.arc(n.x, n.y, 40, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(239,68,68,0.2)";
        ctx.lineWidth = 2;
        ctx.stroke();
      });
    }

    function spawnFlow() {
      if (transactions.length === 0) {
        const nodeList = Array.from(nodeMap.values());
        if (nodeList.length < 2) return;
        const from = nodeList[Math.floor(Math.random() * nodeList.length)];
        let to = nodeList[Math.floor(Math.random() * nodeList.length)];
        while (to === from) {
          to = nodeList[Math.floor(Math.random() * nodeList.length)];
        }
        flows.push({ from, to, t: 0 });
        return;
      }

      const tx = transactions[Math.floor(Math.random() * transactions.length)];
      const from = nodeMap.get(tx.from);
      const to = nodeMap.get(tx.to);
      if (from && to && from !== to) {
        flows.push({ from, to, t: 0 });
      }
    }

    const flowInterval = setInterval(spawnFlow, 500);

    let frameId: number;

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawEdges();
      drawFlows();
      drawNodes();
      drawPropagationRisk();
      frameId = requestAnimationFrame(animate);
    }

    animate();

    const resize = () => {
      const c = canvasRef.current;
      if (!c) return;
      c.width = window.innerWidth;
      c.height = window.innerHeight;
      const center = nodes[0];
      if (center) {
        center.x = c.width / 2;
        center.y = c.height / 2;
      }
      flows = [];
    };
    window.addEventListener("resize", resize);

    return () => {
      clearInterval(flowInterval);
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(frameId);
    };
  }, [wallet, clusterMembers, counterparties, transactions, riskLevel]);

  return (
    <>
      <div
        className="fixed inset-0 -z-20 bg-gradient-to-br from-slate-950 via-slate-900 to-black"
        aria-hidden
      />
      <div
        className="fixed top-[-200px] left-[20%] w-[700px] h-[700px] bg-cyan-500/20 blur-[200px] rounded-full -z-20"
        aria-hidden
      />
      <div
        className="fixed bottom-[-200px] right-[20%] w-[700px] h-[700px] bg-purple-500/20 blur-[200px] rounded-full -z-20"
        aria-hidden
      />
      <canvas
        ref={canvasRef}
        className="fixed inset-0 -z-10 opacity-65"
        aria-hidden
      />
    </>
  );
}
