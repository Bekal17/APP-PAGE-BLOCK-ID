import { useCallback } from "react";
import TrustScoreRing from "@/components/TrustScoreRing";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { RiskLevel } from "@/types/trust";
import { Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();

  const handleCopyWallet = useCallback(() => {
    navigator.clipboard.writeText(wallet);
    toast({ title: "Copied", description: "Wallet address copied to clipboard." });
  }, [wallet, toast]);

  return (
    <div className={cn("glass-card p-6 flex flex-col items-center", className)}>
      <div className="mb-2 flex items-center gap-1.5 w-full justify-center min-w-0">
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
