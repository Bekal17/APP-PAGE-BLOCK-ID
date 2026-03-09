/**
 * Types for AI trust backend POST /trust-score.
 * Matches FastAPI response: trust_score, risk_level, metrics.
 */

export type RiskLevel = "Low" | "Medium" | "High";

export type ActivityLevel = "low" | "medium" | "high";

export interface TrustMetrics {
  tx_count: number;
  wallet_age_months: number;
  activity_score: number;
  /** Activity band from backend (low / medium / high). Optional for backward compat. */
  activity_level?: ActivityLevel;
  /** Count of risk/suspicious behavior flags. Optional for backward compat. */
  suspicious_behavior_count?: number;
  risk_flags: string[];
}

/** Simple status for Trust UI (Simple Mode). */
export type SimpleStatus = "SAFE" | "REVIEW" | "RISKY";

/** Risk color for Trust UI (Simple Mode). */
export type RiskColor = "GREEN" | "AMBER" | "RED";

export interface TrustScoreResult {
  wallet: string;
  trust_score: number;
  risk_level: RiskLevel;
  metrics: TrustMetrics;
  /** Optional: from summary-compact endpoint. Derived from risk_level if absent. */
  simple_status?: SimpleStatus;
  /** Optional: from summary-compact endpoint. Derived from risk_level if absent. */
  risk_color?: RiskColor;
  /** Optional: from summary-compact endpoint. Fallback message derived if absent. */
  summary_message?: string;
}
