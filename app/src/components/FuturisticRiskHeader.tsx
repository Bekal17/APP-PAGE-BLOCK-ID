import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface FuturisticRiskHeaderProps {
  wallet: string;
  score: number;
  className?: string;
}

const getScoreColor = (s: number) => {
  if (s >= 80) return "text-[hsl(160,70%,45%)]";
  if (s >= 50) return "text-[hsl(38,90%,55%)]";
  return "text-[hsl(0,72%,55%)]";
};

const getScoreGlow = (s: number) => {
  if (s >= 80) return "0 0 24px hsl(160 70% 45% / 0.35)";
  if (s >= 50) return "0 0 24px hsl(38 90% 55% / 0.35)";
  return "0 0 24px hsl(0 72% 55% / 0.35)";
};

const FuturisticRiskHeader = ({ wallet, score, className }: FuturisticRiskHeaderProps) => {
  const { toast } = useToast();

  const handleCopyWallet = () => {
    if (!wallet) return;
    navigator.clipboard.writeText(wallet);
    toast({ title: "Copied", description: "Wallet address copied to clipboard." });
  };

  return (
    <div
      className={cn(
        "glass-card p-6 flex flex-col items-center overflow-hidden relative",
        "border border-primary/20",
        "before:absolute before:inset-0 before:rounded-xl before:pointer-events-none",
        "before:bg-gradient-to-br before:from-primary/5 before:via-transparent before:to-accent/5",
        className,
      )}
    >
      {/* Futuristic accent line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

      {/* Wallet row */}
      <div className="mb-4 flex items-center gap-1.5 w-full justify-center min-w-0">
        {wallet ? (
          <>
            <span
              className="text-xs font-mono text-muted-foreground truncate max-w-[200px] sm:max-w-[260px]"
              title={wallet}
            >
              {wallet}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
              onClick={handleCopyWallet}
              aria-label="Copy wallet address"
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
          </>
        ) : (
          <span className="text-xs text-muted-foreground italic">Enter wallet above to analyze</span>
        )}
      </div>

      {/* Score display - futuristic large number with glow */}
      <div className="relative flex flex-col items-center justify-center py-4">
        <span
          className={cn(
            "text-6xl font-extrabold tabular-nums tracking-tighter",
            getScoreColor(score),
          )}
          style={{ textShadow: getScoreGlow(score) }}
        >
          {score}
        </span>
        <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground mt-2">
          Trust Score
        </span>
      </div>

      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(hsl(var(--primary)) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)
          `,
          backgroundSize: "20px 20px",
        }}
      />
    </div>
  );
};

export default FuturisticRiskHeader;
