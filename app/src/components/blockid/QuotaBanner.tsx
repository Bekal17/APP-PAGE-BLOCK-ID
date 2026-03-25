import { useSubscription } from "@/hooks/useSubscription";
import { useNavigate } from "react-router-dom";

const PRICING_URL = "https://blockidscore.fun/pricing-b2c.html";

export default function QuotaBanner() {
  const sub = useSubscription();
  const navigate = useNavigate();

  if (sub.loading || sub.plan === "pro") return null;

  if (sub.isAtLimit) {
    return (
      <div className="mx-4 mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-red-400 text-sm">⚠</span>
          <p className="text-sm text-red-300 font-medium">
            Wallet scan limit reached ({sub.scansUsed}/{sub.scansLimit} this
            month)
          </p>
        </div>
        <button
          onClick={() => navigate("/upgrade")}
          className="shrink-0 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-blue-500 text-white text-xs font-bold hover:opacity-90 transition-opacity"
        >
          Upgrade →
        </button>
      </div>
    );
  }

  if (sub.isNearLimit) {
    return (
      <div className="mx-4 mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-amber-400 text-sm">⚡</span>
          <p className="text-sm text-amber-300">
            {sub.scansRemaining} wallet scan
            {sub.scansRemaining !== 1 ? "s" : ""} remaining this month
          </p>
        </div>
        <button
          onClick={() => navigate("/upgrade")}
          className="shrink-0 px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold hover:bg-amber-500/30 transition-colors"
        >
          Upgrade
        </button>
      </div>
    );
  }

  return null;
}
