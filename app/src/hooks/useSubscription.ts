import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

const API_BASE =
  import.meta.env.VITE_SOCIAL_API_URL ||
  import.meta.env.VITE_EXPLORER_API_URL ||
  "https://blockid-backend-production.up.railway.app";

export interface SubscriptionState {
  plan: "free" | "explorer" | "pro";
  scansUsed: number;
  scansLimit: number;
  scansRemaining: number;
  isAtLimit: boolean;
  isNearLimit: boolean; // within 20% of limit
  loading: boolean;
}

const PLAN_LIMITS: Record<string, number> = {
  free: 10,
  explorer: 100,
  pro: Infinity,
};

export function useSubscription() {
  const { publicKey } = useWallet();
  const [state, setState] = useState<SubscriptionState>({
    plan: "free",
    scansUsed: 0,
    scansLimit: 10,
    scansRemaining: 10,
    isAtLimit: false,
    isNearLimit: false,
    loading: true,
  });

  useEffect(() => {
    if (!publicKey) {
      console.log("[useSubscription] No publicKey, skipping");
      setState((prev) => ({ ...prev, loading: false }));
      return;
    }

    const wallet = publicKey.toBase58();
    console.log("[useSubscription] Fetching for wallet:", wallet);

    const fetchSubscription = async () => {
      try {
        const url = `${API_BASE}/social/subscription/${wallet}`;
        console.log("[useSubscription] URL:", url);
        const res = await fetch(url);
        const data = await res.json();
        console.log("[useSubscription] Response:", data);
        if (!res.ok) throw new Error("Failed to fetch subscription");

        const plan = (data.plan ?? "free").toLowerCase() as
          | "free"
          | "explorer"
          | "pro";
        const scansUsed = data.scans_used ?? data.wallet_scan_usage ?? 0;
        const scansLimit = PLAN_LIMITS[plan] ?? 10;
        const scansRemaining =
          scansLimit === Infinity
            ? Infinity
            : Math.max(0, scansLimit - scansUsed);
        const isAtLimit = scansLimit !== Infinity && scansUsed >= scansLimit;
        const isNearLimit =
          scansLimit !== Infinity &&
          scansRemaining <= Math.ceil(scansLimit * 0.2) &&
          !isAtLimit;

        setState({
          plan,
          scansUsed,
          scansLimit,
          scansRemaining,
          isAtLimit,
          isNearLimit,
          loading: false,
        });
      } catch (err) {
        console.error("[useSubscription] Error:", err);
        setState((prev) => ({ ...prev, loading: false }));
      }
    };

    fetchSubscription();
  }, [publicKey]);

  return state;
}
