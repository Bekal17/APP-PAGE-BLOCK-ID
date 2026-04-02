import type { TFunction } from "i18next";

const TIER_KEYS: Record<string, string> = {
  SAFE: "trust_score.safe",
  LOW: "trust_score.low",
  MODERATE: "trust_score.moderate",
  MEDIUM: "trust_score.moderate",
  HIGH: "trust_score.high",
  CRITICAL: "trust_score.critical",
  SEVERE: "trust_score.critical",
};

export function translateRiskTier(t: TFunction, tier: string): string {
  if (!tier) return tier;
  const path = TIER_KEYS[tier.trim().toUpperCase()];
  return path ? t(path) : tier;
}
