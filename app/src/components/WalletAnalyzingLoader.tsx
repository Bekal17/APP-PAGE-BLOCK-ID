import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const DURATION_MS = 12000;
const RING_SIZE = 160;
const STROKE_WIDTH = 6;
const ICON_SIZE = 64;
/** Radius for stroke path (centered in RING_SIZE box) */
const R = (RING_SIZE - STROKE_WIDTH) / 2;
const CIRC = 2 * Math.PI * R;
const CX = RING_SIZE / 2;
const CY = RING_SIZE / 2;

function messageForProgress(p: number): string {
  if (p < 15) return "Connecting to Solana network...";
  if (p < 30) return "Fetching transaction history...";
  if (p < 50) return "Analyzing wallet behavior...";
  if (p < 70) return "Running AI risk model...";
  if (p < 85) return "Computing trust score...";
  return "Finalizing analysis...";
}

const WalletAnalyzingLoader = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const id = window.setInterval(() => {
      const elapsed = Date.now() - start;
      const next = Math.min(100, (elapsed / DURATION_MS) * 100);
      setProgress(next);
      if (next >= 100) clearInterval(id);
    }, 50);
    return () => clearInterval(id);
  }, []);

  const dashOffset = CIRC * (1 - progress / 100);
  const msg = messageForProgress(progress);
  const pct = Math.min(100, Math.round(progress));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm px-4">
      <motion.div
        className="relative flex flex-col items-center gap-5 max-w-md w-full text-center"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <motion.h2
          className="text-xl sm:text-2xl font-semibold text-white"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.35 }}
        >
          Analyzing Wallet
        </motion.h2>

        <div
          className="relative shrink-0"
          style={{ width: RING_SIZE, height: RING_SIZE }}
        >
          <svg
            width={RING_SIZE}
            height={RING_SIZE}
            className="block -rotate-90"
            aria-hidden
          >
            <defs>
              <linearGradient
                id="walletLoaderRingGrad"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#22d3ee" />
              </linearGradient>
            </defs>
            <circle
              cx={CX}
              cy={CY}
              r={R}
              fill="none"
              stroke="rgba(59, 130, 246, 0.15)"
              strokeWidth={STROKE_WIDTH}
              strokeLinecap="round"
            />
            <circle
              cx={CX}
              cy={CY}
              r={R}
              fill="none"
              stroke="url(#walletLoaderRingGrad)"
              strokeWidth={STROKE_WIDTH}
              strokeLinecap="round"
              strokeDasharray={CIRC}
              strokeDashoffset={dashOffset}
              className="transition-[stroke-dashoffset] duration-100 ease-linear"
            />
          </svg>

          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <motion.img
              src="/blockid-icon.png"
              alt=""
              width={ICON_SIZE}
              height={ICON_SIZE}
              className="object-contain w-16 h-16"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15, duration: 0.4, type: "spring", stiffness: 260, damping: 20 }}
            />
          </div>
        </div>

        <p className="text-3xl font-bold tabular-nums bg-gradient-to-r from-blue-500 to-cyan-400 bg-clip-text text-transparent">
          {pct}%
        </p>

        <div className="min-h-[3rem] flex items-center justify-center w-full px-2">
          <AnimatePresence mode="wait">
            <motion.p
              key={msg}
              className="text-sm text-blue-300/80"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
            >
              {msg}
            </motion.p>
          </AnimatePresence>
        </div>

        <motion.p
          className="text-xs text-gray-400 leading-relaxed max-w-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35, duration: 0.4 }}
        >
          This may take 10-15 seconds. Our AI analyzes real on-chain
          transactions to compute your trust score.
        </motion.p>
      </motion.div>
    </div>
  );
};

export default WalletAnalyzingLoader;
