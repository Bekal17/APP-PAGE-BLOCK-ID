import { useSubscription } from "@/hooks/useSubscription";
import { useNavigate } from "react-router-dom";

const PRICING_URL = "https://blockidscore.fun/pricing-b2c.html";

export default function QuotaIndicator() {
  const sub = useSubscription();
  const navigate = useNavigate();
  console.log("[QuotaIndicator] state:", sub);

  if (sub.loading) {
    console.log("[QuotaIndicator] still loading");
    return null;
  }
  if (sub.plan === "pro") {
    console.log("[QuotaIndicator] pro plan, hiding");
    return null;
  }

  const pct =
    sub.scansLimit === Infinity
      ? 0
      : Math.round((sub.scansUsed / sub.scansLimit) * 100);

  const barColor = sub.isAtLimit
    ? "bg-red-500"
    : sub.isNearLimit
      ? "bg-amber-400"
      : "bg-blue-400";

  const planLabel = sub.plan === "explorer" ? "Explorer" : "Free";

  return (
    <div className="px-4 py-3 border-t border-white/5">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-slate-500 font-medium">
          {planLabel} Plan
        </span>
        <span className="text-xs text-slate-500">
          {sub.plan === "pro"
            ? "∞"
            : `${sub.scansUsed}/${sub.scansLimit}`}{" "}
          scans
        </span>
      </div>
      {sub.scansLimit !== Infinity && (
        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${barColor}`}
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>
      )}
      {sub.isAtLimit && (
        <button
          onClick={() => navigate("/upgrade")}
          className="mt-2 w-full text-xs text-center py-1.5 rounded-lg bg-gradient-to-r from-purple-600/80 to-blue-500/80 text-white font-semibold hover:opacity-90 transition-opacity"
        >
          Upgrade Plan
        </button>
      )}
    </div>
  );
}
