import { useEffect, useRef } from "react";

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  cluster: number;
  pulse: number;
}

interface Flow {
  a: Node;
  b: Node;
  t: number;
}

export default function InteractiveWalletGraph() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const mouse = { x: 0, y: 0 };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    window.addEventListener("mousemove", handleMouseMove);

    const NODE_COUNT = 80;
    const nodes: Node[] = [];
    let flows: Flow[] = [];

    for (let i = 0; i < NODE_COUNT; i++) {
      const cluster = Math.floor(Math.random() * 5);
      nodes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        cluster,
        pulse: Math.random() * 100,
      });
    }

    function updateNodes() {
      nodes.forEach((n) => {
        n.x += n.vx;
        n.y += n.vy;

        const dx = mouse.x - n.x;
        const dy = mouse.y - n.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 120) {
          n.x -= dx * 0.02;
          n.y -= dy * 0.02;
        }

        if (n.x < 0 || n.x > canvas.width) n.vx *= -1;
        if (n.y < 0 || n.y > canvas.height) n.vy *= -1;
      });
    }

    function drawNodes() {
      nodes.forEach((n) => {
        n.pulse += 0.05;

        const r = 2 + Math.sin(n.pulse) * 1.5;

        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(34,211,238,0.9)";
        ctx.shadowColor = "rgba(34,211,238,0.9)";
        ctx.shadowBlur = 12;
        ctx.fill();
        ctx.shadowBlur = 0;
      });
    }

    function drawConnections() {
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];

          if (a.cluster !== b.cluster) continue;

          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 140) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = "rgba(99,102,241,0.15)";
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }
    }

    function drawFlows() {
      flows.forEach((f) => {
        f.t += 0.015;

        const x = f.a.x + (f.b.x - f.a.x) * f.t;
        const y = f.a.y + (f.b.y - f.a.y) * f.t;

        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(168,85,247,0.9)";
        ctx.shadowColor = "rgba(168,85,247,0.9)";
        ctx.shadowBlur = 15;
        ctx.fill();
        ctx.shadowBlur = 0;
      });
      flows = flows.filter((f) => f.t < 1);
    }

    function drawClusters() {
      nodes.forEach((n) => {
        if (Math.random() < 0.002) {
          ctx.beginPath();
          ctx.arc(n.x, n.y, 50, 0, Math.PI * 2);
          ctx.strokeStyle = "rgba(34,211,238,0.1)";
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      });
    }

    function spawnFlow() {
      const a = nodes[Math.floor(Math.random() * nodes.length)];
      let b = nodes[Math.floor(Math.random() * nodes.length)];
      while (b === a) {
        b = nodes[Math.floor(Math.random() * nodes.length)];
      }
      flows.push({ a, b, t: 0 });
    }

    const flowInterval = setInterval(spawnFlow, 800);

    let frameId: number;

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      updateNodes();
      drawConnections();
      drawFlows();
      drawNodes();
      drawClusters();
      frameId = requestAnimationFrame(animate);
    }

    animate();

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      nodes.forEach((n) => {
        n.x = Math.min(canvas.width, Math.max(0, n.x));
        n.y = Math.min(canvas.height, Math.max(0, n.y));
      });
      flows = [];
    };
    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      clearInterval(flowInterval);
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(frameId);
    };
  }, []);

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
        className="fixed inset-0 -z-10 opacity-50"
        aria-hidden
      />
    </>
  );
}
