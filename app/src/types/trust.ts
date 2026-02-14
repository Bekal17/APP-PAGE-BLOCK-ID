/**
 * Types for AI trust backend POST /trust-score.
 */

export type RiskLevel = "Low" | "Medium" | "High";

export interface TrustMetrics {
  tx_count: number;
  wallet_age_months: number;
  activity_score: number;
  risk_flags: string[];
}

export interface TrustScoreResult {
  wallet: string;
  trust_score: number;
  risk_level: RiskLevel;
  metrics: TrustMetrics;
}
