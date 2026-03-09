import { useEffect, useRef } from "react";

export default function AnimatedNetworkBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const NODE_COUNT = 60;
    const nodes: { x: number; y: number; vx: number; vy: number }[] = [];

    for (let i = 0; i < NODE_COUNT; i++) {
      nodes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
      });
    }

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      nodes.forEach((n) => {
        n.x = Math.min(canvas.width, Math.max(0, n.x));
        n.y = Math.min(canvas.height, Math.max(0, n.y));
      });
    };
    window.addEventListener("resize", resize);

    let frameId: number;

    function draw() {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];

        n.x += n.vx;
        n.y += n.vy;

        if (n.x < 0 || n.x > canvas.width) n.vx *= -1;
        if (n.y < 0 || n.y > canvas.height) n.vy *= -1;

        ctx.beginPath();
        ctx.arc(n.x, n.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(34,211,238,0.8)";
        ctx.fill();

        for (let j = i + 1; j < nodes.length; j++) {
          const m = nodes[j];
          const dx = n.x - m.x;
          const dy = n.y - m.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 140) {
            ctx.beginPath();
            ctx.moveTo(n.x, n.y);
            ctx.lineTo(m.x, m.y);
            ctx.strokeStyle = "rgba(99,102,241,0.15)";
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      frameId = requestAnimationFrame(draw);
    }

    draw();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(frameId);
    };
  }, []);

  return (
    <>
      {/* Gradient glow layer */}
      <div
        className="fixed inset-0 -z-20 bg-gradient-to-br from-slate-950 via-slate-900 to-black"
        aria-hidden
      />

      {/* Optional glow lights */}
      <div
        className="fixed top-[-200px] left-[20%] w-[600px] h-[600px] bg-cyan-500/20 blur-[200px] rounded-full -z-20"
        aria-hidden
      />
      <div
        className="fixed bottom-[-200px] right-[20%] w-[600px] h-[600px] bg-indigo-500/20 blur-[200px] rounded-full -z-20"
        aria-hidden
      />

      {/* Animated canvas */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 -z-10 opacity-40"
        aria-hidden
      />
    </>
  );
}
