import { cn } from "@/lib/utils";
import type { TrustMetrics } from "@/types/trust";
import { Activity, Calendar, Hash, AlertTriangle } from "lucide-react";

interface MetricsTableProps {
  metrics: TrustMetrics;
  className?: string;
}

const MetricsTable = ({ metrics, className }: MetricsTableProps) => {
  const rows = [
    {
      label: "Transaction count",
      value: metrics.tx_count,
      icon: Hash,
      desc: "Recent on-chain transactions",
    },
    {
      label: "Activity score",
      value: `${metrics.activity_score.toFixed(1)}`,
      icon: Activity,
      desc: "0–100 from tx volume",
    },
    {
      label: "Wallet age",
      value: `${metrics.wallet_age_months} months`,
      icon: Calendar,
      desc: "From oldest tx",
    },
  ];

  return (
    <div className={cn("glass-card p-6", className)}>
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Metrics breakdown</h3>
      </div>
      <div className="space-y-3">
        {rows.map(({ label, value, icon: Icon, desc }) => (
          <div
            key={label}
            className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
          >
            <div className="flex items-center gap-3">
              <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
              <div>
                <div className="text-sm font-medium text-foreground">{label}</div>
                <div className="text-xs text-muted-foreground">{desc}</div>
              </div>
            </div>
            <span className="text-sm font-mono font-medium text-foreground">{value}</span>
          </div>
        ))}
        {metrics.risk_flags.length > 0 && (
          <div className="pt-2">
            <div className="flex items-center gap-2 mb-2 text-xs font-medium text-muted-foreground">
              <AlertTriangle className="w-3.5 h-3.5" />
              Risk flags
            </div>
            <div className="flex flex-wrap gap-2">
              {metrics.risk_flags.map((flag) => (
                <span
                  key={flag}
                  className="px-2 py-1 rounded-md text-xs font-medium bg-destructive/10 text-destructive border border-destructive/20"
                >
                  {flag.replace(/_/g, " ")}
                </span>
              ))}
            </div>
          </div>
        )}
        {metrics.risk_flags.length === 0 && (
          <div className="pt-2 text-xs text-muted-foreground flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-success" />
            No risk flags detected
          </div>
        )}
      </div>
    </div>
  );
};

export default MetricsTable;
