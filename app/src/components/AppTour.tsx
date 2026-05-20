import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const API_BASE =
  import.meta.env.VITE_EXPLORER_API_URL ||
  "https://blockid-backend-production.up.railway.app";

// ─── Types ───────────────────────────────────────────────
type TourProps = {
  wallet: string;
  sessionToken: string;
  onComplete: () => void;
};

type SageMode = "idle" | "talking" | "excited" | "serious";

// ─── Sage Glowing Orb ────────────────────────────────────
function SageOrb({ mode }: { mode: SageMode }) {
  const colors: Record<SageMode, string> = {
    idle: "rgba(99,102,241,0.8)",
    talking: "rgba(56,189,248,0.9)",
    excited: "rgba(16,185,129,0.9)",
    serious: "rgba(245,158,11,0.9)",
  };
  const glow: Record<SageMode, string> = {
    idle: "rgba(99,102,241,0.3)",
    talking: "rgba(56,189,248,0.4)",
    excited: "rgba(16,185,129,0.4)",
    serious: "rgba(245,158,11,0.4)",
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <motion.div
        animate={{
          scale: [1, 1.08, 1],
          boxShadow: [
            `0 0 32px 8px ${glow[mode]}`,
            `0 0 56px 16px ${glow[mode]}`,
            `0 0 32px 8px ${glow[mode]}`,
          ],
        }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        style={{
          background: `radial-gradient(circle, white 0%, ${colors[mode]} 60%, transparent 100%)`,
        }}
        className="w-16 h-16 rounded-full"
      />
      <span className="text-xs text-white/60 font-medium tracking-widest uppercase">
        @sage
      </span>
    </div>
  );
}

// ─── Canvas Background (same as landing page) ────────────
function TourCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;

    let W = (c.width = window.innerWidth);
    let H = (c.height = window.innerHeight);
    let animId: number;

    const rand = (a: number, b: number) => Math.random() * (b - a) + a;
    type Pt = {
      x: number;
      y: number;
      vx: number;
      vy: number;
      r: number;
      a: number;
      col: string;
    };
    let pts: Pt[] = [];

    const init = () => {
      pts = Array.from({ length: Math.floor((W * H) / 12000) }, () => ({
        x: rand(0, W),
        y: rand(0, H),
        vx: rand(-0.18, 0.18),
        vy: rand(-0.18, 0.18),
        r: rand(0.8, 2.2),
        a: rand(0.08, 0.4),
        col: Math.random() > 0.55 ? "56,189,248" : "124,58,237",
      }));
    };

    const drawOrbs = () => {
      const t = Date.now() / 4000;
      [
        {
          x: W * 0.2,
          y: H * 0.3,
          r: 320,
          c: "124,58,237",
          a: 0.05 + 0.018 * Math.sin(t),
        },
        {
          x: W * 0.8,
          y: H * 0.6,
          r: 280,
          c: "56,189,248",
          a: 0.04 + 0.015 * Math.sin(t + 1.5),
        },
        {
          x: W * 0.5,
          y: H * 0.85,
          r: 200,
          c: "129,140,248",
          a: 0.028 + 0.01 * Math.sin(t + 3),
        },
      ].forEach((o) => {
        const g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r);
        g.addColorStop(0, `rgba(${o.c},${o.a})`);
        g.addColorStop(1, `rgba(${o.c},0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    const drawGrid = () => {
      const s = 60;
      ctx.strokeStyle = "rgba(56,189,248,0.02)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x < W; x += s) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
      }
      for (let y = 0; y < H; y += s) {
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
      }
      ctx.stroke();
    };

    const drawPts = () => {
      pts.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = W;
        if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H;
        if (p.y > H) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.col},${p.a})`;
        ctx.fill();
      });
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x;
          const dy = pts[i].y - pts[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 90) {
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.strokeStyle = `rgba(56,189,248,${0.05 * (1 - d / 90)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
    };

    const loop = () => {
      ctx.clearRect(0, 0, W, H);
      drawGrid();
      drawOrbs();
      drawPts();
      animId = requestAnimationFrame(loop);
    };

    const onResize = () => {
      W = c.width = window.innerWidth;
      H = c.height = window.innerHeight;
      init();
    };

    window.addEventListener("resize", onResize);
    init();
    loop();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
    />
  );
}

// ─── Sage Speech Bubble ──────────────────────────────────
function SageBubble({ text }: { text: string }) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed("");
    setDone(false);
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(interval);
        setDone(true);
      }
    }, 18);
    return () => clearInterval(interval);
  }, [text]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-zinc-900/90 border border-zinc-700/60 rounded-2xl px-5 py-4
        text-sm text-white/90 leading-relaxed max-w-sm text-center backdrop-blur-sm"
    >
      {displayed}
      {!done && (
        <motion.span
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 0.6, repeat: Infinity }}
          className="inline-block w-0.5 h-4 bg-primary/80 ml-0.5 align-middle"
        />
      )}
    </motion.div>
  );
}

function Spotlight({ selector, label }: { selector: string; label?: string }) {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    const el = document.querySelector(selector);
    if (!el) return;
    const r = el.getBoundingClientRect();
    setRect(r);
    // Scroll element into view
    el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [selector]);

  if (!rect) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed pointer-events-none z-[99]"
      style={{
        top: rect.top - 8,
        left: rect.left - 8,
        width: rect.width + 16,
        height: rect.height + 16,
        borderRadius: 12,
        border: "2px solid rgba(56,189,248,0.8)",
        boxShadow:
          "0 0 0 9999px rgba(0,0,0,0.35), 0 0 24px rgba(56,189,248,0.4)",
      }}
    >
      {label && (
        <div
          className="absolute -top-7 left-0 text-xs text-[#38bdf8] font-semibold
          bg-zinc-900/90 px-2 py-1 rounded-lg border border-[#38bdf8]/30"
        >
          {label}
        </div>
      )}
    </motion.div>
  );
}

// ─── Language Picker ─────────────────────────────────────
const LANGS = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "id", label: "Indonesia", flag: "🇮🇩" },
  { code: "ja", label: "日本語", flag: "🇯🇵" },
  { code: "ko", label: "한국어", flag: "🇰🇷" },
  { code: "zh", label: "中文", flag: "🇨🇳" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "ar", label: "العربية", flag: "🇸🇦" },
];

function LanguagePicker() {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const current = LANGS.find((l) => l.code === i18n.language) ?? LANGS[0];

  return (
    <motion.div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg
          bg-zinc-800/80 border border-zinc-700/50 text-sm text-white/80
          hover:bg-zinc-700/80 transition-colors backdrop-blur-sm"
      >
        <span>{current.flag}</span>
        <span>{current.label}</span>
        <span className="text-white/40">▾</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute right-0 top-full mt-1 z-50 bg-zinc-900 border
              border-zinc-700 rounded-xl overflow-hidden shadow-xl min-w-[160px]"
          >
            {LANGS.map((l) => (
              <button
                key={l.code}
                onClick={() => {
                  i18n.changeLanguage(l.code);
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm
                  hover:bg-zinc-800 transition-colors text-left
                  ${i18n.language === l.code ? "text-primary" : "text-white/80"}`}
              >
                <span>{l.flag}</span>
                <span>{l.label}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Handle Claim Form (Slide 5) ─────────────────────────
function HandleClaimForm({
  wallet,
  sessionToken,
  onClaimed,
  onSkip,
}: {
  wallet: string;
  sessionToken: string;
  onClaimed: () => void;
  onSkip: () => void;
}) {
  const { t } = useTranslation();
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<
    "idle" | "checking" | "available" | "taken"
  >("idle");
  const [claiming, setClaiming] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const checkHandle = useCallback((val: string) => {
    if (!val || val.length < 3) {
      setStatus("idle");
      return;
    }
    setStatus("checking");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `${API_BASE}/handle/block/check/${val.toLowerCase()}`
        );
        const data = await res.json();
        setStatus(data.available ? "available" : "taken");
      } catch {
        setStatus("idle");
      }
    }, 400);
  }, []);

  const claim = async () => {
    if (status !== "available" || claiming) return;
    setClaiming(true);
    try {
      const res = await fetch(`${API_BASE}/handle/block/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          handle: input.toLowerCase(),
          wallet,
          session_token: sessionToken,
        }),
      });
      if (res.ok) onClaimed();
    } catch {
      /* silent */
    } finally {
      setClaiming(false);
    }
  };

  return (
    <motion.div className="flex flex-col gap-3 w-full max-w-xs">
      <motion.div
        className="flex items-center gap-2 bg-zinc-800/80 border border-zinc-700
        rounded-xl px-4 py-3 backdrop-blur-sm"
      >
        <span className="text-white/40 text-sm">@</span>
        <input
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            checkHandle(e.target.value);
          }}
          placeholder={t("tour.slide5_placeholder")}
          className="flex-1 bg-transparent text-sm text-white outline-none"
          maxLength={20}
        />
        <span className="text-white/40 text-sm">.Block</span>
      </motion.div>

      {status === "available" && input.length >= 3 && (
        <p className="text-xs text-emerald-400 text-center">
          {t("tour.slide5_available").replace("{handle}", input)}
        </p>
      )}
      {status === "taken" && (
        <p className="text-xs text-red-400 text-center">
          {t("tour.slide5_taken").replace("{handle}", input)}
        </p>
      )}

      <button
        onClick={claim}
        disabled={status !== "available" || claiming}
        className="w-full py-2.5 rounded-xl bg-primary text-white text-sm font-semibold
          disabled:opacity-40 hover:bg-primary/90 transition-colors"
      >
        {claiming ? "..." : t("tour.slide5_claim")}
      </button>

      <button
        onClick={onSkip}
        className="text-xs text-white/40 hover:text-white/60 transition-colors"
      >
        {t("tour.slide5_skip")}
      </button>
    </motion.div>
  );
}

// ─── Main AppTour Component ──────────────────────────────
export default function AppTour({
  wallet,
  sessionToken,
  onComplete,
}: TourProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [slide, setSlide] = useState<string>("1");
  const [quizAnswer, setQuizAnswer] = useState<string | null>(null);
  const [sageMode, setSageMode] = useState<SageMode>("idle");

  const completeTour = useCallback(async () => {
    try {
      await fetch(`${API_BASE}/social/tour/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet, session_token: sessionToken }),
      });
    } catch {
      /* silent */
    }
    onComplete();
  }, [wallet, sessionToken, onComplete]);

  const goNext = useCallback(
    (target: string) => {
      setSageMode("talking");
      setTimeout(() => setSageMode("idle"), 1000);
      // Navigate to real pages for overlay slides
      if (target === "4") navigate("/");
      if (target === "5") navigate("/profile");
      if (target === "6") navigate("/router");
      if (target === "7") navigate("/identity");
      setSlide(target);
    },
    [navigate]
  );

  // Quiz answers
  const CORRECT = "b";
  const handleQuiz = (answer: string) => {
    setQuizAnswer(answer);
    if (answer === CORRECT) {
      setSageMode("excited");
      setTimeout(() => completeTour(), 2000);
    } else {
      setSageMode("serious");
      setTimeout(() => {
        setSlide("2a");
        setSageMode("idle");
      }, 2000);
    }
  };

  return (
    <motion.div className="fixed inset-0 z-[100]">
      {/* Canvas BG for slides 1-3 */}
      {["1", "1b", "2a", "2b", "3"].includes(slide) && (
        <>
          <motion.div className="absolute inset-0 bg-[#06050f]" />
          <TourCanvas />
        </>
      )}

      {/* Semi-transparent overlay for slides 4-7 */}
      {["4", "5", "6", "7"].includes(slide) && (
        <motion.div className="absolute inset-0 bg-black/30" />
      )}

      {/* Content */}
      <motion.div
        className="relative z-10 flex flex-col items-center justify-center
        min-h-screen px-6 py-8"
      >
        {/* Language picker top right */}
        <motion.div className="absolute top-4 right-4">
          <LanguagePicker />
        </motion.div>

        <AnimatePresence mode="wait">
          {/* ── SLIDE 1 ── */}
          {slide === "1" && (
            <motion.div
              key="s1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center gap-6 max-w-sm w-full"
            >
              <SageOrb mode={sageMode} />
              <SageBubble text={t("tour.slide1_greeting")} />
              <p className="text-white/80 text-center text-sm leading-relaxed">
                {t("tour.slide1_question")}
              </p>
              <motion.div className="flex flex-col gap-3 w-full">
                <button
                  onClick={() => goNext("2a")}
                  className="w-full py-3 rounded-xl bg-primary text-white font-semibold text-sm
                    hover:bg-primary/90 transition-colors"
                >
                  {t("tour.slide1_yes")}
                </button>
                <button
                  onClick={() => goNext("1b")}
                  className="w-full py-3 rounded-xl bg-zinc-800/80 border border-zinc-700
                    text-white/80 font-semibold text-sm hover:bg-zinc-700/80 transition-colors"
                >
                  {t("tour.slide1_no")}
                </button>
              </motion.div>
            </motion.div>
          )}

          {/* ── SLIDE 1b QUIZ ── */}
          {slide === "1b" && (
            <motion.div
              key="s1b"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center gap-6 max-w-sm w-full"
            >
              <SageOrb mode={sageMode} />
              <SageBubble
                text={
                  quizAnswer === CORRECT
                    ? t("tour.slide1b_correct")
                    : quizAnswer
                      ? t("tour.slide1b_wrong")
                      : t("tour.slide1b_sage")
                }
              />
              {!quizAnswer && (
                <>
                  <p className="text-white font-semibold text-center">
                    {t("tour.slide1b_question")}
                  </p>
                  <motion.div className="flex flex-col gap-2 w-full">
                    {(["a", "b", "c", "d"] as const).map((opt) => (
                      <button
                        key={opt}
                        onClick={() => handleQuiz(opt)}
                        className="w-full py-3 px-4 rounded-xl bg-zinc-800/80 border
                          border-zinc-700 text-white/80 text-sm text-left
                          hover:bg-zinc-700/80 hover:border-primary/50 transition-colors"
                      >
                        {String.fromCharCode(65 + ["a", "b", "c", "d"].indexOf(opt))}.{" "}
                        {t(`tour.slide1b_${opt}`)}
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </motion.div>
          )}

          {/* ── SLIDE 2a ── */}
          {slide === "2a" && (
            <motion.div
              key="s2a"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center gap-5 max-w-md w-full"
            >
              <SageOrb mode="talking" />
              <SageBubble text={t("tour.slide2a_sage")} />
              <motion.div
                className="bg-zinc-900/80 border border-zinc-700/60 rounded-2xl p-5
                backdrop-blur-sm w-full"
              >
                <h2 className="text-white font-bold text-lg mb-3 text-center">
                  {t("tour.slide2a_title")}
                </h2>
                <p className="text-white/70 text-sm leading-relaxed mb-4">
                  {t("tour.slide2a_body")}
                </p>
                <motion.div className="bg-primary/10 border border-primary/20 rounded-xl p-4">
                  <p className="text-primary/90 text-xs leading-relaxed">
                    💡 {t("tour.slide2a_analogy")}
                  </p>
                </motion.div>
              </motion.div>
              <button
                onClick={() => goNext("2b")}
                className="w-full max-w-xs py-3 rounded-xl bg-primary text-white
                  font-semibold text-sm hover:bg-primary/90 transition-colors"
              >
                {t("tour.next")}
              </button>
            </motion.div>
          )}

          {/* ── SLIDE 2b ── */}
          {slide === "2b" && (
            <motion.div
              key="s2b"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center gap-5 max-w-md w-full"
            >
              <SageOrb mode="talking" />
              <SageBubble text={t("tour.slide2b_sage")} />
              <motion.div className="grid grid-cols-2 gap-3 w-full">
                {/* Web2 */}
                <motion.div className="bg-zinc-900/80 border border-zinc-700/60 rounded-2xl p-4 backdrop-blur-sm">
                  <p className="text-white/50 text-xs font-bold uppercase tracking-wider mb-3">
                    {t("tour.slide2b_web2_title")}
                  </p>
                  <motion.div className="flex flex-col gap-2">
                    <p className="text-white/70 text-xs">
                      🏦 {t("tour.slide2b_web2_1")}
                    </p>
                    <p className="text-white/70 text-xs">
                      📱 {t("tour.slide2b_web2_2")}
                    </p>
                    <p className="text-red-400 text-xs">
                      ❌ {t("tour.slide2b_web2_3")}
                    </p>
                  </motion.div>
                </motion.div>
                {/* Web3 */}
                <motion.div className="bg-primary/10 border border-primary/30 rounded-2xl p-4 backdrop-blur-sm">
                  <p className="text-primary text-xs font-bold uppercase tracking-wider mb-3">
                    {t("tour.slide2b_web3_title")}
                  </p>
                  <motion.div className="flex flex-col gap-2">
                    <p className="text-white/70 text-xs">
                      ⛓ {t("tour.slide2b_web3_1")}
                    </p>
                    <p className="text-white/70 text-xs">
                      🔑 {t("tour.slide2b_web3_2")}
                    </p>
                    <p className="text-emerald-400 text-xs">
                      ✅ {t("tour.slide2b_web3_3")}
                    </p>
                  </motion.div>
                </motion.div>
              </motion.div>
              <motion.div
                className="bg-zinc-900/80 border border-zinc-700/60 rounded-xl px-5 py-3
                backdrop-blur-sm w-full text-center"
              >
                <p className="text-white/60 text-xs">
                  💡 {t("tour.slide2b_summary")}
                </p>
              </motion.div>
              <button
                onClick={() => goNext("3")}
                className="w-full max-w-xs py-3 rounded-xl bg-primary text-white
                  font-semibold text-sm hover:bg-primary/90 transition-colors"
              >
                {t("tour.next")}
              </button>
            </motion.div>
          )}

          {/* ── SLIDE 3 ── */}
          {slide === "3" && (
            <motion.div
              key="s3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center gap-5 max-w-md w-full"
            >
              <SageOrb mode="serious" />
              <SageBubble text={t("tour.slide3_sage")} />
              <motion.div
                className="bg-zinc-900/80 border border-zinc-700/60 rounded-2xl p-5
                backdrop-blur-sm w-full flex flex-col gap-4"
              >
                <p className="text-white/80 text-sm leading-relaxed">
                  {t("tour.slide3_body")}
                </p>
                <motion.div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                  <p className="text-amber-400 text-xs leading-relaxed">
                    ⚠️ {t("tour.slide3_warning")}
                  </p>
                </motion.div>
                <p className="text-white/70 text-sm leading-relaxed">
                  {t("tour.slide3_blockid")}
                </p>
              </motion.div>
              <button
                onClick={() => goNext("4")}
                className="w-full max-w-xs py-3 rounded-xl bg-primary text-white
                  font-semibold text-sm hover:bg-primary/90 transition-colors"
              >
                {t("tour.next")}
              </button>
            </motion.div>
          )}

          {/* ── SLIDE 4 (overlay Dashboard) ── */}
          {slide === "4" && (
            <motion.div
              key="s4"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-end gap-4 fixed bottom-8 right-8 max-w-xs"
            >
              <Spotlight selector="textarea[placeholder]" label="Post area" />
              <SageOrb mode="excited" />
              <SageBubble text={t("tour.slide4_sage1")} />
              <SageBubble text={t("tour.slide4_sage2")} />
              <button
                onClick={() => goNext("5")}
                className="w-full py-3 rounded-xl bg-primary text-white
                  font-semibold text-sm hover:bg-primary/90 transition-colors"
              >
                {t("tour.next")}
              </button>
            </motion.div>
          )}

          {/* ── SLIDE 5 (overlay Profile) ── */}
          {slide === "5" && (
            <motion.div
              key="s5"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-end gap-4 fixed bottom-8 right-8 max-w-xs"
            >
              <Spotlight selector=".glass-card" label="Your Profile" />
              <SageOrb mode="talking" />
              <SageBubble text={t("tour.slide5_sage1")} />
              <p className="text-white/60 text-xs text-right">
                🏆 {t("tour.slide5_trust")}
              </p>
              <SageBubble text={t("tour.slide5_sage2")} />
              <HandleClaimForm
                wallet={wallet}
                sessionToken={sessionToken}
                onClaimed={() => goNext("6")}
                onSkip={() => goNext("6")}
              />
            </motion.div>
          )}

          {/* ── SLIDE 6 (overlay SmartRouter) ── */}
          {slide === "6" && (
            <motion.div
              key="s6"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-end gap-4 fixed bottom-8 right-8 max-w-xs"
            >
              <Spotlight selector="input[type='text']" label="Smart Router" />
              <SageOrb mode="excited" />
              <SageBubble text={t("tour.slide6_sage1")} />
              <SageBubble text={t("tour.slide6_sage3")} />
              <button
                onClick={() => goNext("7")}
                className="w-full py-3 rounded-xl bg-primary text-white
                  font-semibold text-sm hover:bg-primary/90 transition-colors"
              >
                {t("tour.next")}
              </button>
            </motion.div>
          )}

          {/* ── SLIDE 7 (overlay Identity) ── */}
          {slide === "7" && (
            <motion.div
              key="s7"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-end gap-4 fixed bottom-8 right-8 max-w-xs"
            >
              <Spotlight selector=".glass" label="@Handle Identity" />
              <SageOrb mode="excited" />
              <SageBubble text={t("tour.slide7_sage")} />
              <button
                onClick={completeTour}
                className="w-full py-3 rounded-xl bg-primary text-white
                  font-semibold text-sm hover:bg-primary/90 transition-colors"
              >
                {t("tour.slide7_finish")}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
