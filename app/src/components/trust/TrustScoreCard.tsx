import TrustScoreRing from "@/components/TrustScoreRing";
import { cn } from "@/lib/utils";
import type { RiskLevel } from "@/types/trust";

interface TrustScoreCardProps {
  trustScore: number;
  riskLevel: RiskLevel;
  wallet: string;
  className?: string;
}

const riskLevelStyles: Record<RiskLevel, string> = {
  Low: "bg-success/10 text-success border-success/30",
  Medium: "bg-warning/10 text-warning border-warning/30",
  High: "bg-destructive/10 text-destructive border-destructive/30",
};

const TrustScoreCard = ({ trustScore, riskLevel, wallet, className }: TrustScoreCardProps) => {
  return (
    <div className={cn("glass-card p-6 flex flex-col items-center", className)}>
      <div className="mb-2 text-xs font-mono text-muted-foreground truncate max-w-full" title={wallet}>
        {wallet}
      </div>
      <TrustScoreRing score={trustScore} size={160} />
      <div className="mt-4 flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Risk level</span>
        <span
          className={cn(
            "px-3 py-1 rounded-full text-sm font-semibold border",
            riskLevelStyles[riskLevel],
          )}
        >
          {riskLevel}
        </span>
      </div>
    </div>
  );
};

export default TrustScoreCard;
