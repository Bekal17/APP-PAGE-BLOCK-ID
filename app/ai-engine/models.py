"""
Pydantic models and types for the AI Trust Scoring API.
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

RiskLevel = Literal["Low", "Medium", "High"]
ActivityLevel = Literal["low", "medium", "high"]


class TrustScoreRequest(BaseModel):
    """Request body for POST /trust-score. Accepts { wallet: string }."""

    wallet: str = Field(..., min_length=1, description="Solana wallet address to score")


class TrustMetrics(BaseModel):
    """Structured metrics from on-chain analysis used to compute the trust score."""

    tx_count: int = Field(
        ...,
        ge=0,
        description="Total recent transactions fetched from chain",
    )
    wallet_age_months: int = Field(
        ...,
        ge=0,
        description="Wallet age in months (from chain or deterministic mock)",
    )
    activity_score: float = Field(
        ...,
        ge=0.0,
        le=100.0,
        description="Transaction activity score 0–100",
    )
    activity_level: ActivityLevel = Field(
        ...,
        description="Activity band: low / medium / high",
    )
    suspicious_behavior_count: int = Field(
        ...,
        ge=0,
        description="Count of detected risk/suspicious behavior flags",
    )
    risk_flags: list[str] = Field(
        default_factory=list,
        description="List of detected risk indicators (e.g. new_wallet, low_activity)",
    )


class TrustScoreResponse(BaseModel):
    """Response body for POST /trust-score. Backward compatible: trust_score + risk_level + metrics."""

    wallet: str
    trust_score: int = Field(..., ge=0, le=100, description="Trust score 0–100")
    risk_level: RiskLevel
    metrics: TrustMetrics = Field(
        ...,
        description="Metrics used for scoring (explainable)",
    )
