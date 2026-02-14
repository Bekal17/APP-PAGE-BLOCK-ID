"""
Wallet analyzer module for the trust scoring engine.
Fetches real Solana on-chain data via RPC, counts transactions, estimates activity
(low/medium/high), applies mock suspicious-behavior flags, and returns structured metrics.
"""

from __future__ import annotations

import hashlib
import time
from dataclasses import dataclass
from typing import Literal

from rpc_client import TxSignatureInfo, get_recent_transactions

# Activity: tx count -> 0–100 score (log-like scale; 100+ txs = 100)
TX_COUNT_FOR_FULL_ACTIVITY = 100
# Activity level bands (for human-readable low/medium/high)
ACTIVITY_LEVEL_LOW_THRESHOLD = 40.0
ACTIVITY_LEVEL_HIGH_THRESHOLD = 70.0
# Wallet age: months since oldest tx; no txs -> deterministic mock
SECONDS_PER_MONTH = 30 * 24 * 3600
MOCK_AGE_CAP_MONTHS = 24

# Mock suspicious behavior flag identifiers (explainable; replace with real rules later)
RISK_NEW_WALLET = "new_wallet"
RISK_LOW_ACTIVITY = "low_activity"
RISK_HIGH_CHURN = "high_churn"
RISK_SUSPICIOUS_PATTERNS = "suspicious_patterns"

ActivityLevel = Literal["low", "medium", "high"]


@dataclass(frozen=True)
class WalletMetrics:
    """Structured metrics from wallet analysis. Convert to API TrustMetrics in main."""

    tx_count: int
    wallet_age_months: int
    activity_score: float
    activity_level: ActivityLevel
    suspicious_behavior_count: int
    risk_flags: tuple[str, ...]


def _tx_count_to_activity_score(tx_count: int) -> float:
    """Map transaction count to 0–100 activity score. Higher count = higher score."""
    if tx_count <= 0:
        return 0.0
    if tx_count >= TX_COUNT_FOR_FULL_ACTIVITY:
        return 100.0
    ratio = tx_count / TX_COUNT_FOR_FULL_ACTIVITY
    score = 100.0 * (ratio ** 0.6)
    return round(min(100.0, score), 1)


def _activity_score_to_level(score: float) -> ActivityLevel:
    """Map numeric activity score to low / medium / high."""
    if score < ACTIVITY_LEVEL_LOW_THRESHOLD:
        return "low"
    if score >= ACTIVITY_LEVEL_HIGH_THRESHOLD:
        return "high"
    return "medium"


def _oldest_block_time(infos: list[TxSignatureInfo]) -> int | None:
    """Return oldest block_time from list; ignore None."""
    times = [i.block_time for i in infos if i.block_time is not None]
    return min(times) if times else None


def _wallet_age_months(oldest_ts: int | None) -> int:
    """Compute wallet age in months from oldest tx timestamp."""
    if oldest_ts is None:
        return 0
    now = int(time.time())
    if now <= oldest_ts:
        return 0
    months = (now - oldest_ts) / SECONDS_PER_MONTH
    return max(0, int(months))


def _mock_wallet_age_months(wallet: str) -> int:
    """
    Deterministic mock wallet age in months when no on-chain history exists.
    Same wallet address always yields the same value (0..MOCK_AGE_CAP_MONTHS).
    """
    h = hashlib.sha256(wallet.strip().encode("utf-8")).hexdigest()
    return int(h[:8], 16) % (MOCK_AGE_CAP_MONTHS + 1)


def _compute_risk_flags(
    tx_count: int,
    wallet_age_months: int,
    activity_score: float,
) -> list[str]:
    """Detect mock suspicious behavior flags from metrics (explainable rules)."""
    flags: list[str] = []
    if wallet_age_months < 3:
        flags.append(RISK_NEW_WALLET)
    if tx_count < 5:
        flags.append(RISK_LOW_ACTIVITY)
    if activity_score >= 80.0 and wallet_age_months < 6:
        flags.append(RISK_HIGH_CHURN)
    # Mock: treat certain numeric pattern as suspicious (replace with real logic later)
    if tx_count > 0 and (tx_count % 17 == 0) and wallet_age_months < 12:
        flags.append(RISK_SUSPICIOUS_PATTERNS)
    return flags


def analyze_wallet(wallet: str) -> WalletMetrics:
    """
    Analyze wallet: fetch recent txs from Solana RPC, compute explainable metrics.
    Wallet age: from oldest tx when available; deterministic mock (by address) when none.
    """
    wallet = wallet.strip()
    txs = get_recent_transactions(wallet)
    tx_count = len(txs)
    oldest_ts = _oldest_block_time(txs)
    wallet_age_months = (
        _wallet_age_months(oldest_ts)
        if oldest_ts is not None
        else _mock_wallet_age_months(wallet)
    )
    activity_score = _tx_count_to_activity_score(tx_count)
    activity_level = _activity_score_to_level(activity_score)
    risk_flags = _compute_risk_flags(tx_count, wallet_age_months, activity_score)
    suspicious_behavior_count = len(risk_flags)

    return WalletMetrics(
        tx_count=tx_count,
        wallet_age_months=wallet_age_months,
        activity_score=activity_score,
        activity_level=activity_level,
        suspicious_behavior_count=suspicious_behavior_count,
        risk_flags=tuple(risk_flags),
    )
