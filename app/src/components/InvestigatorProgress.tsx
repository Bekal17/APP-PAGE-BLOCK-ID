import { motion } from "framer-motion";
import { Check, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

export type InvestigatorStep =
  | "fetch_tx"
  | "build_network"
  | "detect_drainer"
  | "compute_score";

const STEPS: { key: InvestigatorStep; label: string }[] = [
  { key: "fetch_tx", label: "Fetching transactions" },
  { key: "build_network", label: "Building wallet network" },
  { key: "detect_drainer", label: "Detecting drainer patterns" },
  { key: "compute_score", label: "Computing trust score" },
];

const stepOrder: InvestigatorStep[] = [
  "fetch_tx",
  "build_network",
  "detect_drainer",
  "compute_score",
];

interface InvestigatorProgressProps {
  currentStep: InvestigatorStep | null;
  done?: boolean;
  className?: string;
}

export function InvestigatorProgress({
  currentStep,
  done = false,
  className,
}: InvestigatorProgressProps) {
  const currentIndex =
    done || !currentStep
      ? done
        ? STEPS.length
        : -1
      : stepOrder.indexOf(currentStep);
  const progressPercent =
    currentIndex >= 0 ? (currentIndex / STEPS.length) * 100 : 0;

  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card/80 backdrop-blur p-6",
        "shadow-[0_0_30px_rgba(139,92,246,0.15)]",
        className
      )}
    >
      <div className="flex items-center gap-2 mb-6">
        <span className="text-2xl" aria-hidden>
          🧠
        </span>
        <h2 className="text-lg font-semibold text-foreground">
          BlockID AI Investigator
        </h2>
      </div>

      <ul className="space-y-4 mb-6">
        {STEPS.map((step, idx) => {
          const isCompleted = currentIndex > idx;
          const isCurrent = currentIndex === idx;

          return (
            <motion.li
              key={step.key}
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              {isCompleted ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400"
                >
                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                </motion.div>
              ) : (
                <div
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border",
                    isCurrent
                      ? "border-purple-500 bg-purple-500/10"
                      : "border-muted-foreground/40 bg-transparent"
                  )}
                >
                  {isCurrent ? (
                    <motion.div
                      className="h-2 w-2 rounded-full bg-purple-500"
                      animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
                      transition={{
                        duration: 1.2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />
                  ) : (
                    <Circle className="h-3 w-3 text-muted-foreground/60" />
                  )}
                </div>
              )}
              <span
                className={cn(
                  "text-sm",
                  isCompleted
                    ? "text-muted-foreground"
                    : isCurrent
                    ? "text-foreground font-medium"
                    : "text-muted-foreground/70"
                )}
              >
                {step.label}
              </span>
            </motion.li>
          );
        })}
      </ul>

      <div className="relative overflow-hidden rounded-full h-2.5 bg-secondary/50">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-purple-500 via-violet-500 to-blue-500"
          initial={{ width: "0%" }}
          animate={{ width: `${Math.max(progressPercent, 5)}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          style={{ width: "40%" }}
          animate={{ x: ["-100%", "300%"] }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      </div>
    </div>
  );
}
