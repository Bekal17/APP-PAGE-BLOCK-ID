import { cn } from "@/lib/utils";
import type { TrustMetrics } from "@/types/trust";
import { Activity, Calendar, Hash, AlertTriangle, Gauge } from "lucide-react";

interface MetricsTableProps {
  metrics: TrustMetrics;
  className?: string;
}

const activityLevelLabel = (level: string) =>
  level.charAt(0).toUpperCase() + level.slice(1);

const MetricsTable = ({ metrics, className }: MetricsTableProps) => {
  const rows = [
    {
      label: "Transaction count",
      value: String(metrics.tx_count),
      icon: Hash,
      desc: "Recent on-chain transactions",
    },
    {
      label: "Activity score",
      value: `${Number(metrics.activity_score).toFixed(1)}`,
      icon: Activity,
      desc: "0–100 from tx volume",
    },
    {
      label: "Wallet age",
      value: `${metrics.wallet_age_months} months`,
      icon: Calendar,
      desc: "From chain or deterministic mock",
    },
    ...(metrics.activity_level != null
      ? [
          {
            label: "Activity level",
            value: activityLevelLabel(metrics.activity_level),
            icon: Gauge,
            desc: "Low / medium / high band",
          },
        ]
      : []),
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
        {(metrics.suspicious_behavior_count != null && metrics.suspicious_behavior_count > 0) ||
        (metrics.risk_flags?.length ?? 0) > 0 ? (
          <div className="pt-2">
            <div className="flex items-center gap-2 mb-2 text-xs font-medium text-muted-foreground">
              <AlertTriangle className="w-3.5 h-3.5" />
              Risk flags
              {metrics.suspicious_behavior_count != null && (
                <span className="font-mono">({metrics.suspicious_behavior_count})</span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {(metrics.risk_flags ?? []).map((flag) => (
                <span
                  key={flag}
                  className="px-2 py-1 rounded-md text-xs font-medium bg-destructive/10 text-destructive border border-destructive/20"
                >
                  {flag.replace(/_/g, " ")}
                </span>
              ))}
            </div>
          </div>
        ) : (
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
