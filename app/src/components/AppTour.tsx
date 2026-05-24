import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, type Easing } from "framer-motion";
import { getSessionToken } from "@/services/blockidApi";

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
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={mode}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{
            opacity: 1,
            scale: [1, 1.08, 1],
            boxShadow: [
              `0 0 32px 8px ${glow[mode]}`,
              `0 0 56px 16px ${glow[mode]}`,
              `0 0 32px 8px ${glow[mode]}`,
            ],
          }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{
            opacity: { duration: 0.2 },
            scale: { duration: 2, repeat: Infinity, ease: "easeInOut" as Easing },
            boxShadow: { duration: 2, repeat: Infinity, ease: "easeInOut" as Easing },
          }}
          style={{
            background: `radial-gradient(circle, white 0%, ${colors[mode]} 60%, transparent 100%)`,
            transition: "background 0.6s ease, box-shadow 0.6s ease",
          }}
          className="w-16 h-16 rounded-full"
        />
      </AnimatePresence>
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
      className="bg-zinc-900 border border-zinc-700/60 rounded-2xl px-5 py-4
        text-sm text-white/90 leading-relaxed max-w-sm text-center"
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

function Spotlight({ selector }: { selector: string }) {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      const el = document.querySelector(selector);
      if (!el) return;
      const r = el.getBoundingClientRect();
      setRect(r);
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 300);
    return () => clearTimeout(timer);
  }, [selector]);

  if (!rect) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="fixed pointer-events-none z-[102]"
      style={{
        top: rect.top - 8,
        left: rect.left - 8,
        width: rect.width + 16,
        height: rect.height + 16,
        borderRadius: 12,
        border: "2px solid rgba(56,189,248,0.8)",
        boxShadow: "0 0 0 9999px rgba(0,0,0,0.35), 0 0 24px rgba(56,189,248,0.4)",
      }}
    />
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

const SLIDE_ORDER = ["1", "1b", "2a", "2b", "3", "4a", "4b", "5a", "5a2", "5b", "6", "7"];

function TourProgressBar({ current }: { current: string }) {
  const index = SLIDE_ORDER.indexOf(current);
  const total = SLIDE_ORDER.length;
  const progress = ((index + 1) / total) * 100;

  return (
    <div className="fixed top-0 left-0 right-0 z-[120] h-1 bg-white/10">
      <motion.div
        className="h-full bg-gradient-to-r from-primary to-[#00FFA3]"
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      />
    </div>
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

// ─── Quiz Feedback Variants ──────────────────────────────
const shakeVariants = {
  idle: { x: 0 },
  shake: {
    x: [0, -10, 10, -8, 8, -4, 4, 0],
    transition: { duration: 0.5, ease: "easeInOut" as Easing },
  },
};

const bounceVariants = {
  idle: { scale: 1, y: 0 },
  bounce: {
    scale: [1, 1.15, 0.95, 1.08, 1],
    y: [0, -12, 0, -6, 0],
    transition: { duration: 0.6, ease: "easeOut" as Easing },
  },
};

// ─── Stagger Variants ────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" as Easing },
  },
};

// ─── Slide Direction Variants ────────────────────────────
const slideVariants = {
  enterNext: { opacity: 0, x: 48, y: 0 },
  enterBack: { opacity: 0, x: -48, y: 0 },
  center: { opacity: 1, x: 0, y: 0, transition: { duration: 0.35, ease: "easeOut" as Easing } },
  exitNext: { opacity: 0, x: -48, y: 0, transition: { duration: 0.25, ease: "easeIn" as Easing } },
  exitBack: { opacity: 0, x: 48, y: 0, transition: { duration: 0.25, ease: "easeIn" as Easing } },
};

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
  const [quizFeedback, setQuizFeedback] = useState<
    "idle" | "correct" | "wrong"
  >("idle");
  const [sageMode, setSageMode] = useState<SageMode>("idle");
  const [direction, setDirection] = useState<"next" | "back">("next");

  useEffect(() => {
    const scrollY = window.scrollY;
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";
    return () => {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      window.scrollTo(0, scrollY);
    };
  }, []);

  const completeTour = useCallback(async () => {
    try {
      const token = sessionToken || getSessionToken() || "";
      await fetch(`${API_BASE}/social/tour/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet, session_token: token }),
      });
    } catch {
      /* silent */
    }
    onComplete();
  }, [wallet, sessionToken, onComplete]);

  const goBack = useCallback(() => {
    setDirection("back");
    const index = SLIDE_ORDER.indexOf(slide);
    if (index <= 0) return;
    const prev = SLIDE_ORDER[index - 1];
    if (prev === "4a") navigate("/");
    if (prev === "4b") navigate("/");
    if (prev === "5a") navigate("/profile");
    if (prev === "5a2") navigate("/profile");
    if (prev === "5b") navigate("/profile");
    if (prev === "6") navigate("/router");
    if (prev === "7") navigate("/identity");
    setSageMode("idle");
    setSlide(prev);
  }, [slide, navigate]);

  const goNext = useCallback(
    (target: string) => {
      setDirection("next");
      setSageMode("talking");
      setTimeout(() => {
        if (["4a", "4b", "5a", "5a2", "5b", "6", "7"].includes(target)) {
          setSageMode(
            target === "4b" ? "serious" :
            target === "5a" || target === "5a2" ? "talking" :
            "excited"
          );
        } else {
          setSageMode("idle");
        }
      }, 1000);
      // Navigate to real pages for overlay slides
      if (target === "4a") navigate("/");
      if (target === "4b") navigate("/");
      if (target === "5a") navigate("/profile");
      if (target === "5a2") navigate("/profile");
      if (target === "5b") navigate("/profile");
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
      setQuizFeedback("correct");
      setTimeout(() => completeTour(), 2000);
    } else {
      setSageMode("serious");
      setQuizFeedback("wrong");
      setTimeout(() => {
        setQuizFeedback("idle");
        setSlide("2a");
        setSageMode("idle");
      }, 2000);
    }
  };

  return (
    <motion.div className="fixed inset-0 z-[100] pointer-events-none">
      {/* Canvas BG for slides 1-3 */}
      {["1", "1b", "2a", "2b", "3"].includes(slide) && (
        <>
          <motion.div className="absolute inset-0 bg-[#06050f]" />
          <TourCanvas />
        </>
      )}

      {/* Layer 2: Overlay + Spotlight */}
      {["4a", "4b", "5a", "5a2", "5b", "6", "7"].includes(slide) && (
        <div className="fixed inset-0 z-[101] pointer-events-none">
          <div className="absolute inset-0 bg-black/30" />
        </div>
      )}

      {/* Content */}
      <motion.div
        className="relative z-[110] flex flex-col items-center justify-center
        min-h-screen px-6 py-8 pointer-events-auto"
      >
        {/* Progress bar */}
        <TourProgressBar current={slide} />

        {/* Language picker top right */}
        <motion.div className="fixed top-4 right-4 z-[120] pointer-events-auto">
          <LanguagePicker />
        </motion.div>

        {/* Persistent SageOrb — canvas slides: relative center top */}
        {["1", "1b", "2a", "2b", "3"].includes(slide) && (
          <motion.div
            key="orb-canvas"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center mb-6"
          >
            <SageOrb mode={sageMode} />
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {/* ── SLIDE 1 ── */}
          {slide === "1" && (
            <motion.div
              key="s1"
              custom={direction}
              variants={slideVariants}
              initial={direction === "next" ? "enterNext" : "enterBack"}
              animate="center"
              exit={direction === "next" ? "exitNext" : "exitBack"}
              transition={{ duration: 0.35, ease: "easeOut" as Easing }}
            >
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="flex flex-col items-center gap-6 max-w-sm w-full"
              >
                <motion.div variants={itemVariants}>
                  <SageBubble text={t("tour.slide1_greeting")} />
                </motion.div>
                <motion.p
                  variants={itemVariants}
                  className="text-white/80 text-center text-sm leading-relaxed"
                >
                  {t("tour.slide1_question")}
                </motion.p>
                <motion.div
                  variants={itemVariants}
                  className="flex flex-col gap-3 w-full"
                >
                  <motion.button
                    onClick={() => goNext("2a")}
                    whileHover={{
                      scale: 1.03,
                      boxShadow: "0 0 20px rgba(99,102,241,0.5)",
                    }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    className="w-full py-3 rounded-xl bg-primary text-white font-semibold text-sm"
                  >
                    {t("tour.slide1_yes")}
                  </motion.button>
                  <motion.button
                    onClick={() => goNext("1b")}
                    whileHover={{
                      scale: 1.03,
                      boxShadow: "0 0 16px rgba(255,255,255,0.1)",
                    }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    className="w-full py-3 rounded-xl bg-zinc-800/80 border border-zinc-700
                      text-white/80 font-semibold text-sm"
                  >
                    {t("tour.slide1_no")}
                  </motion.button>
                </motion.div>
              </motion.div>
            </motion.div>
          )}

          {/* ── SLIDE 1b QUIZ ── */}
          {slide === "1b" && (
            <motion.div
              key="s1b"
              custom={direction}
              variants={slideVariants}
              initial={direction === "next" ? "enterNext" : "enterBack"}
              animate="center"
              exit={direction === "next" ? "exitNext" : "exitBack"}
              transition={{ duration: 0.35, ease: "easeOut" as Easing }}
            >
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="flex flex-col items-center gap-6 max-w-sm w-full"
              >
                <motion.div variants={itemVariants}>
                  <SageBubble
                    text={
                      quizAnswer === CORRECT
                        ? t("tour.slide1b_correct")
                        : quizAnswer
                          ? t("tour.slide1b_wrong")
                          : t("tour.slide1b_sage")
                    }
                  />
                </motion.div>
                {(!quizAnswer || quizFeedback !== "idle") && (
                  <motion.div
                    variants={
                      quizFeedback === "wrong"
                        ? shakeVariants
                        : quizFeedback === "correct"
                          ? bounceVariants
                          : itemVariants
                    }
                    animate={
                      quizFeedback === "wrong"
                        ? "shake"
                        : quizFeedback === "correct"
                          ? "bounce"
                          : "visible"
                    }
                    className="flex flex-col gap-3 w-full"
                  >
                    <p className="text-white font-semibold text-center">
                      {t("tour.slide1b_question")}
                    </p>
                    <div className="flex flex-col gap-2 w-full">
                      {(["a", "b", "c", "d"] as const).map((opt) => (
                        <motion.button
                          key={opt}
                          onClick={() => handleQuiz(opt)}
                          whileHover={{
                            scale: 1.02,
                            borderColor: "rgba(99,102,241,0.6)",
                          }}
                          whileTap={{ scale: 0.98 }}
                          transition={{ duration: 0.15 }}
                          className={`w-full py-3 px-4 rounded-xl border text-sm text-left
                            transition-colors
                            ${
                              quizAnswer === opt && opt === CORRECT
                                ? "bg-emerald-500/20 border-emerald-500/60 text-emerald-400"
                                : quizAnswer === opt
                                  ? "bg-red-500/20 border-red-500/60 text-red-400"
                                  : "bg-zinc-800/80 border-zinc-700 text-white/80"
                            }`}
                        >
                          {String.fromCharCode(65 + ["a", "b", "c", "d"].indexOf(opt))}.{" "}
                          {t(`tour.slide1b_${opt}`)}
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            </motion.div>
          )}

          {/* ── SLIDE 2a ── */}
          {slide === "2a" && (
            <motion.div
              key="s2a"
              custom={direction}
              variants={slideVariants}
              initial={direction === "next" ? "enterNext" : "enterBack"}
              animate="center"
              exit={direction === "next" ? "exitNext" : "exitBack"}
              transition={{ duration: 0.35, ease: "easeOut" as Easing }}
            >
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="flex flex-col items-center gap-5 max-w-md w-full"
              >
                <motion.div variants={itemVariants}>
                  <SageBubble text={t("tour.slide2a_sage")} />
                </motion.div>
                <motion.div
                  variants={itemVariants}
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
                      {t("tour.slide2a_analogy")}
                    </p>
                  </motion.div>
                </motion.div>
                <motion.div variants={itemVariants}>
                  <motion.button
                    onClick={() => goNext("2b")}
                    whileHover={{
                      scale: 1.03,
                      boxShadow: "0 0 20px rgba(99,102,241,0.5)",
                    }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    className="w-full min-w-[200px] py-3 rounded-xl bg-primary text-white
                    font-semibold text-sm"
                  >
                    {t("tour.next")}
                  </motion.button>
                </motion.div>
              </motion.div>
            </motion.div>
          )}

          {/* ── SLIDE 2b ── */}
          {slide === "2b" && (
            <motion.div
              key="s2b"
              custom={direction}
              variants={slideVariants}
              initial={direction === "next" ? "enterNext" : "enterBack"}
              animate="center"
              exit={direction === "next" ? "exitNext" : "exitBack"}
              transition={{ duration: 0.35, ease: "easeOut" as Easing }}
            >
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="flex flex-col items-center gap-5 max-w-md w-full"
              >
                <motion.div variants={itemVariants}>
                  <SageBubble text={t("tour.slide2b_sage")} />
                </motion.div>
                <motion.div
                  variants={itemVariants}
                  className="grid grid-cols-2 gap-3 w-full"
                >
                  {/* Web2 */}
                  <motion.div className="bg-zinc-900/80 border border-zinc-700/60 rounded-2xl p-4 backdrop-blur-sm">
                    <p className="text-white/50 text-xs font-bold uppercase tracking-wider mb-3">
                      {t("tour.slide2b_web2_title")}
                    </p>
                    <motion.div className="flex flex-col gap-2">
                      <p className="text-white/70 text-xs">
                        {t("tour.slide2b_web2_1")}
                      </p>
                      <p className="text-white/70 text-xs">
                        {t("tour.slide2b_web2_2")}
                      </p>
                      <p className="text-red-400 text-xs">
                        {t("tour.slide2b_web2_3")}
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
                        {t("tour.slide2b_web3_1")}
                      </p>
                      <p className="text-white/70 text-xs">
                        {t("tour.slide2b_web3_2")}
                      </p>
                      <p className="text-emerald-400 text-xs">
                        {t("tour.slide2b_web3_3")}
                      </p>
                    </motion.div>
                  </motion.div>
                </motion.div>
                <motion.div
                  variants={itemVariants}
                  className="bg-zinc-900/80 border border-zinc-700/60 rounded-xl px-5 py-3
                  backdrop-blur-sm w-full text-center"
                >
                  <p className="text-white/60 text-xs">
                    {t("tour.slide2b_summary")}
                  </p>
                </motion.div>
                <motion.div variants={itemVariants}>
                  <motion.button
                    onClick={() => goNext("3")}
                    whileHover={{
                      scale: 1.03,
                      boxShadow: "0 0 20px rgba(99,102,241,0.5)",
                    }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    className="w-full min-w-[200px] py-3 rounded-xl bg-primary text-white
                    font-semibold text-sm"
                  >
                    {t("tour.next")}
                  </motion.button>
                </motion.div>
              </motion.div>
            </motion.div>
          )}

          {/* ── SLIDE 3 ── */}
          {slide === "3" && (
            <motion.div
              key="s3"
              custom={direction}
              variants={slideVariants}
              initial={direction === "next" ? "enterNext" : "enterBack"}
              animate="center"
              exit={direction === "next" ? "exitNext" : "exitBack"}
              transition={{ duration: 0.35, ease: "easeOut" as Easing }}
            >
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="flex flex-col items-center gap-5 max-w-md w-full"
              >
                <motion.div variants={itemVariants}>
                  <SageBubble text={t("tour.slide3_sage")} />
                </motion.div>
                <motion.div
                  variants={itemVariants}
                  className="bg-zinc-900/80 border border-zinc-700/60 rounded-2xl p-5
                  backdrop-blur-sm w-full flex flex-col gap-4"
                >
                  <p className="text-white/80 text-sm leading-relaxed">
                    {t("tour.slide3_body")}
                  </p>
                  <motion.div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                    <p className="text-amber-400 text-xs leading-relaxed">
                      {t("tour.slide3_warning")}
                    </p>
                  </motion.div>
                  <p className="text-white/70 text-sm leading-relaxed">
                    {t("tour.slide3_blockid")}
                  </p>
                </motion.div>
                <motion.div variants={itemVariants}>
                  <motion.button
                    onClick={() => goNext("4a")}
                    whileHover={{
                      scale: 1.03,
                      boxShadow: "0 0 20px rgba(99,102,241,0.5)",
                    }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    className="w-full min-w-[200px] py-3 rounded-xl bg-primary text-white
                    font-semibold text-sm"
                  >
                    {t("tour.next")}
                  </motion.button>
                </motion.div>
              </motion.div>
            </motion.div>
          )}

          {/* ── SLIDE 4a (Dashboard welcome) ── */}
          {slide === "4a" && (
            <>
              <Spotlight selector="div.glass-card.p-4.flex.gap-3.animate-slide-up" />
              <motion.div
                key="s4a"
                initial={{ opacity: 0, x: direction === "next" ? 48 : -48, y: 0 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                exit={{ opacity: 0, x: direction === "next" ? -48 : 48, y: 0 }}
                transition={{ duration: 0.35, ease: "easeOut" as Easing }}
                className="fixed bottom-0 left-1/2 -translate-x-1/2 w-[600px]
                  max-w-[95vw] z-[115] pointer-events-auto px-6 pt-5 pb-8"
              >
                <div className="flex items-start gap-4">
                  <div className="shrink-0"><SageOrb mode="excited" /></div>
                  <div className="flex flex-col gap-3 flex-1">
                    <SageBubble text={t("tour.slide4_sage1")} />
                    <div className="flex gap-2 w-full mt-1">
                      <motion.button
                        onClick={goBack}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        className="w-1/4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700
                          text-white/60 text-sm font-semibold"
                      >
                        Back
                      </motion.button>
                      <motion.button
                        onClick={() => goNext("4b")}
                        whileHover={{ scale: 1.03, boxShadow: "0 0 20px rgba(99,102,241,0.5)" }}
                        whileTap={{ scale: 0.97 }}
                        className="flex-1 py-2.5 rounded-xl bg-primary text-white font-semibold text-sm"
                      >
                        {t("tour.next")}
                      </motion.button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </>
          )}

          {/* ── SLIDE 4b (Dashboard warning + spotlight) ── */}
          {slide === "4b" && (
            <>
              <Spotlight selector="[class*='text-amber-500']" />
              <motion.div
                key="s4b"
                initial={{ opacity: 0, x: direction === "next" ? 48 : -48, y: 0 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                exit={{ opacity: 0, x: direction === "next" ? -48 : 48, y: 0 }}
                transition={{ duration: 0.35, ease: "easeOut" as Easing }}
                className="fixed bottom-0 left-1/2 -translate-x-1/2 w-[600px]
                  max-w-[95vw] z-[115] pointer-events-auto px-6 pt-5 pb-8"
              >
                <div className="flex items-start gap-4">
                  <div className="shrink-0"><SageOrb mode="serious" /></div>
                  <div className="flex flex-col gap-3 flex-1">
                    <SageBubble text={t("tour.slide4_sage2")} />
                    <div className="flex gap-2 w-full mt-1">
                      <motion.button
                        onClick={goBack}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        className="w-1/4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700
                          text-white/60 text-sm font-semibold"
                      >
                        Back
                      </motion.button>
                      <motion.button
                        onClick={() => goNext("5a")}
                        whileHover={{ scale: 1.03, boxShadow: "0 0 20px rgba(99,102,241,0.5)" }}
                        whileTap={{ scale: 0.97 }}
                        className="flex-1 py-2.5 rounded-xl bg-primary text-white font-semibold text-sm"
                      >
                        {t("tour.next")}
                      </motion.button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </>
          )}

          {/* ── SLIDE 5a (overlay Profile — identity) ── */}
          {slide === "5a" && (
            <>
              <Spotlight selector=".flex-1.pb-2.mt-20" />
              <motion.div
                key="s5a"
                initial={{ opacity: 0, x: direction === "next" ? 48 : -48, y: 0 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                exit={{ opacity: 0, x: direction === "next" ? -48 : 48, y: 0 }}
                transition={{ duration: 0.35, ease: "easeOut" as Easing }}
                className="fixed bottom-0 left-1/2 -translate-x-1/2 w-[600px]
                  max-w-[95vw] z-[115] pointer-events-auto px-6 pt-5 pb-8"
              >
                <div className="flex items-start gap-4">
                  <div className="shrink-0"><SageOrb mode="talking" /></div>
                  <div className="flex flex-col gap-3 flex-1">
                    <SageBubble text={t("tour.slide5_sage1")} />
                    <div className="flex gap-2 w-full mt-1">
                      <motion.button
                        onClick={goBack}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        className="w-1/4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700
                          text-white/60 text-sm font-semibold"
                      >
                        Back
                      </motion.button>
                      <motion.button
                        onClick={() => goNext("5a2")}
                        whileHover={{ scale: 1.03, boxShadow: "0 0 20px rgba(99,102,241,0.5)" }}
                        whileTap={{ scale: 0.97 }}
                        className="flex-1 py-2.5 rounded-xl bg-primary text-white font-semibold text-sm"
                      >
                        {t("tour.next")}
                      </motion.button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </>
          )}

          {/* ── SLIDE 5a2 (overlay Profile — trust score) ── */}
          {slide === "5a2" && (
            <>
              <Spotlight selector="span.px-2.py-0\.5.rounded-full.text-xs.font-bold.bg-orange-500\/20.text-orange-400" />
              <motion.div
                key="s5a2"
                initial={{ opacity: 0, x: direction === "next" ? 48 : -48, y: 0 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                exit={{ opacity: 0, x: direction === "next" ? -48 : 48, y: 0 }}
                transition={{ duration: 0.35, ease: "easeOut" as Easing }}
                className="fixed bottom-0 left-1/2 -translate-x-1/2 w-[600px]
                  max-w-[95vw] z-[115] pointer-events-auto px-6 pt-5 pb-8"
              >
                <div className="flex items-start gap-4">
                  <div className="shrink-0"><SageOrb mode="talking" /></div>
                  <div className="flex flex-col gap-3 flex-1">
                    <SageBubble text={t("tour.slide5_trust")} />
                    <div className="flex gap-2 w-full mt-1">
                      <motion.button
                        onClick={goBack}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        className="w-1/4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700
                          text-white/60 text-sm font-semibold"
                      >
                        Back
                      </motion.button>
                      <motion.button
                        onClick={() => goNext("5b")}
                        whileHover={{ scale: 1.03, boxShadow: "0 0 20px rgba(99,102,241,0.5)" }}
                        whileTap={{ scale: 0.97 }}
                        className="flex-1 py-2.5 rounded-xl bg-primary text-white font-semibold text-sm"
                      >
                        {t("tour.next")}
                      </motion.button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </>
          )}

          {/* ── SLIDE 5b (overlay Profile — claim handle) ── */}
          {slide === "5b" && (
            <>
              <motion.div
                key="s5b"
                initial={{ opacity: 0, x: direction === "next" ? 48 : -48, y: 0 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                exit={{ opacity: 0, x: direction === "next" ? -48 : 48, y: 0 }}
                transition={{ duration: 0.35, ease: "easeOut" as Easing }}
                className="fixed bottom-0 left-1/2 -translate-x-1/2 w-[600px]
                  max-w-[95vw] z-[115] pointer-events-auto px-6 pt-5 pb-8"
              >
                <div className="flex items-start gap-4">
                  <div className="shrink-0"><SageOrb mode="excited" /></div>
                  <div className="flex flex-col gap-3 flex-1">
                    <SageBubble text={t("tour.slide5_sage2")} />
                    <HandleClaimForm
                      wallet={wallet}
                      sessionToken={sessionToken}
                      onClaimed={() => goNext("6")}
                      onSkip={() => goNext("6")}
                    />
                    <motion.button
                      onClick={goBack}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className="w-full py-2 rounded-xl bg-zinc-800/60 border border-zinc-700
                        text-white/40 text-xs font-medium"
                    >
                      Back
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </>
          )}

          {/* ── SLIDE 6 (overlay SmartRouter) ── */}
          {slide === "6" && (
            <>
              <Spotlight selector="input[type='text']" />
              <motion.div
                key="s6"
                initial={{ opacity: 0, x: direction === "next" ? 48 : -48, y: 0 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                exit={{ opacity: 0, x: direction === "next" ? -48 : 48, y: 0 }}
                transition={{ duration: 0.35, ease: "easeOut" as Easing }}
                className="fixed bottom-0 left-1/2 -translate-x-1/2 w-[600px]
                  max-w-[95vw] z-[115] pointer-events-auto px-6 pt-5 pb-8"
              >
                <div className="flex items-start gap-4">
                  <div className="shrink-0"><SageOrb mode="excited" /></div>
                  <div className="flex flex-col gap-3 flex-1">
                    <SageBubble text={t("tour.slide6_sage1")} />
                    <SageBubble text={t("tour.slide6_sage3")} />
                    <div className="flex gap-2 w-full mt-1">
                      <motion.button
                        onClick={goBack}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        className="w-1/4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700
                          text-white/60 text-sm font-semibold"
                      >
                        Back
                      </motion.button>
                      <motion.button
                        onClick={() => goNext("7")}
                        whileHover={{ scale: 1.03, boxShadow: "0 0 20px rgba(99,102,241,0.5)" }}
                        whileTap={{ scale: 0.97 }}
                        className="flex-1 py-2.5 rounded-xl bg-primary text-white font-semibold text-sm"
                      >
                        {t("tour.next")}
                      </motion.button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </>
          )}

          {/* ── SLIDE 7 (overlay Identity) ── */}
          {slide === "7" && (
            <>
              <Spotlight selector="div.glass-card.p-5:has(h3)" />
              <motion.div
                key="s7"
                initial={{ opacity: 0, x: direction === "next" ? 48 : -48, y: 0 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                exit={{ opacity: 0, x: direction === "next" ? -48 : 48, y: 0 }}
                transition={{ duration: 0.35, ease: "easeOut" as Easing }}
                className="fixed bottom-0 left-1/2 -translate-x-1/2 w-[600px]
                  max-w-[95vw] z-[115] pointer-events-auto px-6 pt-5 pb-8"
              >
                <div className="flex items-start gap-4">
                  <div className="shrink-0"><SageOrb mode="excited" /></div>
                  <div className="flex flex-col gap-3 flex-1">
                    <SageBubble text={t("tour.slide7_sage")} />
                    <div className="flex gap-2 w-full mt-1">
                      <motion.button
                        onClick={goBack}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        className="w-1/4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700
                          text-white/60 text-sm font-semibold"
                      >
                        Back
                      </motion.button>
                      <motion.button
                        onClick={completeTour}
                        whileHover={{ scale: 1.03, boxShadow: "0 0 24px rgba(0,255,163,0.4)" }}
                        whileTap={{ scale: 0.97 }}
                        transition={{ duration: 0.15 }}
                        className="flex-1 py-2.5 rounded-xl bg-primary text-white font-semibold text-sm"
                      >
                        {t("tour.slide7_finish")}
                      </motion.button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
