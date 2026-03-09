import { useEffect, useRef } from "react";

interface GraphNode {
  x: number;
  y: number;
  type: "center" | "counterparty";
  address?: string;
  risky?: boolean;
  vx?: number;
  vy?: number;
}

interface Flow {
  a: GraphNode;
  b: GraphNode;
  t: number;
}

interface Counterparty {
  wallet: string;
  risk_tier: string;
}

interface LiveWalletGraphProps {
  wallet: string | null;
  counterparties?: Counterparty[];
}

const RISKY_TIERS = ["HIGH", "CRITICAL", "SEVERE"];

export default function LiveWalletGraph({ wallet, counterparties = [] }: LiveWalletGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!wallet) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const NODE_COUNT = Math.min(40, Math.max(20, 25));
    const nodes: GraphNode[] = [];
    let flows: Flow[] = [];

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    nodes.push({
      x: centerX,
      y: centerY,
      type: "center",
      address: wallet,
    });

    const riskySet = new Set(
      counterparties.filter((c) => RISKY_TIERS.includes(c.risk_tier?.toUpperCase())).map((c) => c.wallet)
    );

    for (let i = 0; i < NODE_COUNT; i++) {
      const angle = (i / NODE_COUNT) * Math.PI * 2 + Math.random() * 0.5;
      const dist = 80 + Math.random() * Math.min(canvas.width, canvas.height) * 0.3;
      nodes.push({
        x: centerX + Math.cos(angle) * dist,
        y: centerY + Math.sin(angle) * dist,
        type: "counterparty",
        risky: i < 5 && riskySet.size === 0 ? Math.random() < 0.3 : false,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2,
      });
    }

    if (counterparties.length > 0) {
      counterparties.slice(0, NODE_COUNT).forEach((cp, i) => {
        const node = nodes[i + 1];
        if (node && node.type === "counterparty") {
          node.risky = RISKY_TIERS.includes(cp.risk_tier?.toUpperCase());
        }
      });
    }

    function drawEdges() {
      const center = nodes[0];
      if (!center) return;

      for (let i = 1; i < nodes.length; i++) {
        const node = nodes[i];
        if (node.type !== "counterparty") continue;

        ctx.beginPath();
        ctx.moveTo(center.x, center.y);
        ctx.lineTo(node.x, node.y);
        ctx.strokeStyle = "rgba(99,102,241,0.2)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    function drawNodes() {
      nodes.forEach((n) => {
        const r = n.type === "center" ? 6 : 3;
        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2);

        ctx.fillStyle =
          n.type === "center"
            ? "rgba(34,211,238,1)"
            : "rgba(168,85,247,0.9)";

        ctx.shadowColor = n.type === "center" ? "rgba(34,211,238,0.9)" : "rgba(168,85,247,0.9)";
        ctx.shadowBlur = 20;
        ctx.fill();
        ctx.shadowBlur = 0;
      });
    }

    function drawFlows() {
      flows.forEach((f) => {
        f.t += 0.02;

        const x = f.a.x + (f.b.x - f.a.x) * f.t;
        const y = f.a.y + (f.b.y - f.a.y) * f.t;

        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(34,211,238,0.9)";
        ctx.shadowColor = "rgba(34,211,238,0.9)";
        ctx.shadowBlur = 12;
        ctx.fill();
        ctx.shadowBlur = 0;
      });
      flows = flows.filter((f) => f.t < 1);
    }

    function drawRiskClusters() {
      nodes.forEach((n) => {
        if (n.type !== "counterparty" || !n.risky) return;

        ctx.beginPath();
        ctx.arc(n.x, n.y, 30, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(239,68,68,0.15)";
        ctx.lineWidth = 2;
        ctx.stroke();
      });
    }

    function updateCounterparties() {
      const center = nodes[0];
      if (!center) return;

      for (let i = 1; i < nodes.length; i++) {
        const n = nodes[i];
        if (n.type !== "counterparty" || !n.vx) continue;

        n.x += n.vx;
        n.y += n.vy;

        const dx = n.x - center.x;
        const dy = n.y - center.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = Math.min(canvas.width, canvas.height) * 0.4;

        if (dist > maxDist) {
          n.vx = -dx * 0.01;
          n.vy = -dy * 0.01;
        }

        if (n.x < 0 || n.x > canvas.width) n.vx *= -1;
        if (n.y < 0 || n.y > canvas.height) n.vy *= -1;
      }
    }

    function spawnFlow() {
      const center = nodes[0];
      const idx = 1 + Math.floor(Math.random() * (nodes.length - 1));
      const other = nodes[idx];
      if (!center || !other) return;

      if (Math.random() < 0.5) {
        flows.push({ a: center, b: other, t: 0 });
      } else {
        flows.push({ a: other, b: center, t: 0 });
      }
    }

    const flowInterval = setInterval(spawnFlow, 600);

    let frameId: number;

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      updateCounterparties();
      drawEdges();
      drawFlows();
      drawNodes();
      drawRiskClusters();
      frameId = requestAnimationFrame(animate);
    }

    animate();

    const resize = () => {
      const c = canvasRef.current;
      if (!c) return;
      c.width = window.innerWidth;
      c.height = window.innerHeight;
      nodes[0].x = c.width / 2;
      nodes[0].y = c.height / 2;
      flows = [];
    };
    window.addEventListener("resize", resize);

    return () => {
      clearInterval(flowInterval);
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(frameId);
    };
  }, [wallet, counterparties]);

  if (!wallet) return null;

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
        className="fixed inset-0 -z-10 opacity-40"
        aria-hidden
      />
    </>
  );
}
