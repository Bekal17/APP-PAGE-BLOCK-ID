"""
Deterministic, explainable trust scoring for Web3 wallets.
Weighted combination of wallet age, transaction activity, and suspicious behavior.
Produces 0–100 score and risk level (Low / Medium / High).
"""

from __future__ import annotations

from typing import Literal

from analyzer import WalletMetrics

# ---------------------------------------------------------------------------
# Weights (must sum to 1.0). Explainable: age + activity + risk.
# ---------------------------------------------------------------------------
WEIGHT_AGE = 0.30
WEIGHT_ACTIVITY = 0.50
WEIGHT_RISK = 0.20

# Age: 0–100 component; 1 month = 4 points, cap at 25 months
AGE_SCORE_PER_MONTH = 4.0
AGE_CAP_MONTHS = 25

# Risk: 0–100 component; each suspicious behavior flag reduces by 25
PENALTY_PER_FLAG = 25.0

# Risk level thresholds (score bands)
THRESHOLD_LOW = 70
THRESHOLD_MEDIUM = 40

RiskLevel = Literal["Low", "Medium", "High"]


def compute_trust_score(metrics: WalletMetrics) -> tuple[int, RiskLevel]:
    """
    Compute trust score (0–100) and risk level from analyzed wallet metrics.
    Formula: score = WEIGHT_AGE * age_component + WEIGHT_ACTIVITY * activity_component
              + WEIGHT_RISK * risk_component. Fully deterministic and explainable.
    """
    # Age component: 0–100 (older = better, capped at AGE_CAP_MONTHS)
    age_component = min(100.0, metrics.wallet_age_months * AGE_SCORE_PER_MONTH)

    # Activity component: already 0–100 from analyzer
    activity_component = metrics.activity_score

    # Risk component: 100 minus penalty per suspicious behavior, floor 0
    penalty = metrics.suspicious_behavior_count * PENALTY_PER_FLAG
    risk_component = max(0.0, 100.0 - penalty)

    score_float = (
        WEIGHT_AGE * age_component
        + WEIGHT_ACTIVITY * activity_component
        + WEIGHT_RISK * risk_component
    )
    score = max(0, min(100, round(score_float)))

    if score >= THRESHOLD_LOW:
        risk_level: RiskLevel = "Low"
    elif score >= THRESHOLD_MEDIUM:
        risk_level = "Medium"
    else:
        risk_level = "High"

    return score, risk_level
