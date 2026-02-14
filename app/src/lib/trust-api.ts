/**
 * Client for AI trust backend POST /trust-score.
 * Request: { wallet: string }
 * Response: { wallet, trust_score (0–100), risk_level (Low|Medium|High), metrics }
 */

import type { TrustScoreResult } from "@/types/trust";

const getTrustApiBase = (): string => {
  return import.meta.env.VITE_TRUST_API_URL ?? "http://localhost:8000";
};

export interface FetchTrustScoreError {
  status: number;
  detail: string;
}

export async function fetchTrustScore(wallet: string): Promise<TrustScoreResult> {
  const base = getTrustApiBase();
  const url = `${base.replace(/\/$/, "")}/trust-score`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ wallet: wallet.trim() }),
  });

  const data = await res.json().catch(() => ({}));
  const detail = typeof data.detail === "string" ? data.detail : res.statusText || "Request failed";

  if (!res.ok) {
    const err: FetchTrustScoreError = { status: res.status, detail };
    throw err;
  }

  return data as TrustScoreResult;
}

export { getTrustApiBase };
