import { useEffect, useRef } from "react";
import { usePhantomAuth } from "@/hooks/usePhantomAuth";
import { EmbeddedAuthForm } from "@crossmint/client-sdk-react-ui";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { phantomWallet, solflareWallet, backpackWallet, connectWallet, connected } = usePhantomAuth();
  const navigate = useNavigate();

  // Redirect if already connected
  useEffect(() => {
    if (connected) navigate("/");
  }, [connected, navigate]);

  // Canvas animation — same as landing page
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    let W: number, H: number;
    let pts: any[] = [];
    let mx = -9999, my = -9999;
    const trail: {x:number,y:number,t:number}[] = [];
    const TRAIL_LEN = 120, TRAIL_LIFE = 900;
    let animId: number;

    const rand = (a: number, b: number) => Math.random() * (b - a) + a;
    const resize = () => { W = c.width = innerWidth; H = c.height = innerHeight; };
    const init = () => {
      pts = Array.from({ length: Math.floor(W * H / 12000) }, () => ({
        x: rand(0, W), y: rand(0, H),
        vx: rand(-.18, .18), vy: rand(-.18, .18),
        r: rand(.8, 2.2), a: rand(.08, .4),
        col: Math.random() > .55 ? '56,189,248' : '124,58,237'
      }));
    };
    const drawGrid = () => {
      const s = 60;
      ctx.strokeStyle = 'rgba(56,189,248,0.02)';
      ctx.lineWidth = 1; ctx.beginPath();
      for (let x = 0; x < W; x += s) { ctx.moveTo(x, 0); ctx.lineTo(x, H); }
      for (let y = 0; y < H; y += s) { ctx.moveTo(0, y); ctx.lineTo(W, y); }
      ctx.stroke();
    };
    const drawOrbs = () => {
      const t = Date.now() / 4000;
      [
        { x: W*.2, y: H*.3, r: 320, c: '124,58,237', a: .05+.018*Math.sin(t) },
        { x: W*.8, y: H*.6, r: 280, c: '56,189,248', a: .04+.015*Math.sin(t+1.5) },
        { x: W*.5, y: H*.85, r: 200, c: '129,140,248', a: .028+.01*Math.sin(t+3) }
      ].forEach(o => {
        const g = ctx.createRadialGradient(o.x,o.y,0,o.x,o.y,o.r);
        g.addColorStop(0, `rgba(${o.c},${o.a})`);
        g.addColorStop(1, `rgba(${o.c},0)`);
        ctx.fillStyle = g; ctx.beginPath();
        ctx.arc(o.x,o.y,o.r,0,Math.PI*2); ctx.fill();
      });
    };
    const drawPts = () => {
      pts.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
        const dx = p.x-mx, dy = p.y-my, d = Math.sqrt(dx*dx+dy*dy);
        if (d < 110) { const f=(110-d)/110*.5; p.x+=dx/d*f; p.y+=dy/d*f; }
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
        ctx.fillStyle = `rgba(${p.col},${p.a})`; ctx.fill();
      });
      for (let i = 0; i < pts.length; i++)
        for (let j = i+1; j < pts.length; j++) {
          const dx=pts[i].x-pts[j].x, dy=pts[i].y-pts[j].y, d=Math.sqrt(dx*dx+dy*dy);
          if (d < 90) {
            ctx.beginPath(); ctx.moveTo(pts[i].x,pts[i].y); ctx.lineTo(pts[j].x,pts[j].y);
            ctx.strokeStyle=`rgba(56,189,248,${.05*(1-d/90)})`; ctx.lineWidth=.5; ctx.stroke();
          }
        }
    };
    const drawTrail = () => {
      const now = Date.now();
      while (trail.length > 0 && now-trail[0].t > TRAIL_LIFE) trail.shift();
      if (trail.length < 2) return;
      ctx.save(); ctx.lineCap='round'; ctx.lineJoin='round';
      for (let i = 1; i < trail.length; i++) {
        const p0=trail[i-1], p1=trail[i];
        const age=now-p1.t, life=Math.max(0,1-age/TRAIL_LIFE);
        const ratio=i/trail.length, alpha=life*ratio*0.95;
        if (alpha < 0.005) continue;
        const w=0.5+ratio*2.2;
        const r=Math.round(124+(14-124)*ratio);
        const g2=Math.round(58+(165-58)*ratio);
        const b=Math.round(237+(233-237)*ratio);
        ctx.beginPath(); ctx.moveTo(p0.x,p0.y); ctx.lineTo(p1.x,p1.y);
        ctx.shadowColor=`rgba(${r},${g2},${b},${alpha})`;
        ctx.shadowBlur=14+ratio*14;
        ctx.strokeStyle=`rgba(${r},${g2},${b},${alpha})`;
        ctx.lineWidth=w; ctx.stroke();
        ctx.shadowBlur=3;
        ctx.strokeStyle=`rgba(255,255,255,${alpha*0.4*ratio})`;
        ctx.lineWidth=w*0.28; ctx.stroke();
      }
      ctx.restore();
    };
    const loop = () => {
      ctx.clearRect(0,0,W,H);
      drawGrid(); drawOrbs(); drawPts(); drawTrail();
      animId = requestAnimationFrame(loop);
    };
    const onResize = () => { resize(); init(); };
    const onMouse = (e: MouseEvent) => {
      mx=e.clientX; my=e.clientY;
      trail.push({x:mx,y:my,t:Date.now()});
      if (trail.length > TRAIL_LEN) trail.shift();
    };
    window.addEventListener('resize', onResize);
    window.addEventListener('mousemove', onMouse);
    resize(); init(); loop();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('mousemove', onMouse);
    };
  }, []);

  return (
    <div style={{
      position:'fixed', inset:0,
      background:'#06050f',
      display:'flex', alignItems:'center', justifyContent:'center',
      fontFamily:"'Inter',sans-serif",
      zIndex: 9999,
    }}>
      <canvas ref={canvasRef} style={{position:'fixed',inset:0,zIndex:0,pointerEvents:'none'}} />
      
      {/* Card */}
      <div style={{
        position:'relative', zIndex:10,
        background:'rgba(255,255,255,0.04)',
        border:'1px solid rgba(56,189,248,0.15)',
        borderRadius:20, backdropFilter:'blur(24px)',
        padding:'40px 36px', width:'100%', maxWidth:420,
        margin:'0 16px',
        boxShadow:'0 0 60px -20px rgba(56,189,248,0.2)',
      }}>
        {/* Logo */}
        <div style={{textAlign:'center', marginBottom:28}}>
          <img src="/blockid-logo.svg" alt="BlockID" 
            style={{height:80, marginBottom:16, display:'block', margin:'0 auto 16px'}} />
          <div style={{
            fontFamily:"'Inter',sans-serif",
            fontSize:22, fontWeight:700,
            letterSpacing:'-.03em',
            background:'linear-gradient(135deg,#38bdf8,#818cf8)',
            WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
            backgroundClip:'text',
            marginBottom:8,
          }}>Welcome to BlockID</div>
          <div style={{fontSize:13, color:'#64748b', lineHeight:1.618}}>
            Your on-chain identity starts here
          </div>
        </div>

        {/* Divider */}
        <div style={{display:'flex',alignItems:'center',gap:12,margin:'24px 0 16px'}}>
          <div style={{flex:1,height:1,background:'rgba(56,189,248,0.1)'}}/>
          <span style={{fontSize:11,color:'#64748b',letterSpacing:'.08em',textTransform:'uppercase'}}>Connect Wallet</span>
          <div style={{flex:1,height:1,background:'rgba(56,189,248,0.1)'}}/>
        </div>

        {/* Phantom button */}
        {phantomWallet && (
          <button
            onClick={() => connectWallet(phantomWallet.adapter.name)}
            style={{
              width:'100%', display:'flex', alignItems:'center', gap:12,
              padding:'13px 16px', borderRadius:12, marginBottom:10,
              background:'rgba(255,255,255,0.04)',
              border:'1px solid rgba(56,189,248,0.12)',
              color:'#f0f8ff', fontSize:14, fontWeight:600,
              cursor:'pointer', transition:'all .2s',
              fontFamily:"'Inter',sans-serif",
            }}
            onMouseEnter={e=>(e.currentTarget.style.borderColor='rgba(56,189,248,0.3)')}
            onMouseLeave={e=>(e.currentTarget.style.borderColor='rgba(56,189,248,0.12)')}
          >
            <img src={phantomWallet.adapter.icon} alt="Phantom" style={{width:22,height:22,borderRadius:6}} />
            <span>Continue with Phantom</span>
            <span style={{marginLeft:'auto',fontSize:11,color:'#38bdf8',
              background:'rgba(56,189,248,0.1)',padding:'2px 8px',borderRadius:100}}>
              Detected
            </span>
          </button>
        )}

        {/* Solflare button */}
        {solflareWallet && (
          <button
            onClick={() => connectWallet(solflareWallet.adapter.name)}
            style={{
              width:'100%', display:'flex', alignItems:'center', gap:12,
              padding:'13px 16px', borderRadius:12, marginBottom:10,
              background:'rgba(255,255,255,0.04)',
              border:'1px solid rgba(56,189,248,0.12)',
              color:'#f0f8ff', fontSize:14, fontWeight:600,
              cursor:'pointer', transition:'all .2s',
              fontFamily:"'Inter',sans-serif",
            }}
            onMouseEnter={e=>(e.currentTarget.style.borderColor='rgba(56,189,248,0.3)')}
            onMouseLeave={e=>(e.currentTarget.style.borderColor='rgba(56,189,248,0.12)')}
          >
            <img src={solflareWallet.adapter.icon} alt="Solflare" style={{width:22,height:22,borderRadius:6}} />
            <span>Continue with Solflare</span>
          </button>
        )}

        {/* Backpack button */}
        {backpackWallet && (
          <button
            onClick={() => connectWallet(backpackWallet.adapter.name)}
            style={{
              width:'100%', display:'flex', alignItems:'center', gap:12,
              padding:'13px 16px', borderRadius:12, marginBottom:10,
              background:'rgba(255,255,255,0.04)',
              border:'1px solid rgba(56,189,248,0.12)',
              color:'#f0f8ff', fontSize:14, fontWeight:600,
              cursor:'pointer', transition:'all .2s',
              fontFamily:"'Inter',sans-serif",
            }}
            onMouseEnter={e=>(e.currentTarget.style.borderColor='rgba(56,189,248,0.3)')}
            onMouseLeave={e=>(e.currentTarget.style.borderColor='rgba(56,189,248,0.12)')}
          >
            <img src={backpackWallet.adapter.icon} alt="Backpack" style={{width:22,height:22,borderRadius:6}} />
            <span>Continue with Backpack</span>
          </button>
        )}

        {/* Divider */}
        <div style={{display:'flex',alignItems:'center',gap:12,margin:'20px 0 16px'}}>
          <div style={{flex:1,height:1,background:'rgba(56,189,248,0.1)'}}/>
          <span style={{fontSize:11,color:'#64748b',letterSpacing:'.08em',textTransform:'uppercase'}}>or continue with</span>
          <div style={{flex:1,height:1,background:'rgba(56,189,248,0.1)'}}/>
        </div>

        <div
          style={{
            width:'100%',
            borderRadius:12,
            marginBottom:10,
            background:'rgba(56,189,248,0.15)',
            border:'1px solid rgba(56,189,248,0.4)',
            color:'#f0f8ff',
            fontSize:14,
            fontWeight:600,
            fontFamily:"'Inter',sans-serif",
          }}
        >
          <EmbeddedAuthForm />
        </div>

        {/* Footer */}
        <p style={{textAlign:'center',fontSize:11,color:'#475569',marginTop:20,lineHeight:1.618}}>
          New to crypto? Google & Email login creates your wallet automatically.
        </p>
      </div>
    </div>
  );
}