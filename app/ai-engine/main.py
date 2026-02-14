"""
AI Trust Scoring Engine - Web3-ready trust protocol backend.
Uses Solana RPC to analyze wallets and return explainable trust scores.
"""

from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from analyzer import analyze_wallet
from db import init_db, insert_trust_record
from models import TrustMetrics, TrustScoreRequest, TrustScoreResponse
from scoring import compute_trust_score

# ---------------------------------------------------------------------------
# App lifecycle
# ---------------------------------------------------------------------------


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: ensure DB and table exist. Shutdown: optional teardown."""
    init_db()
    yield


# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------

app = FastAPI(
    title="AI Trust Scoring Engine",
    description="Web3 trust infrastructure: explainable trust scores for wallet addresses",
    version="2.0.0",
    lifespan=lifespan,
)

# Allow frontend from any origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health() -> dict[str, str]:
    """Health check for load balancers and monitoring."""
    return {"status": "ok"}


@app.post("/trust-score", response_model=TrustScoreResponse)
async def trust_score(body: TrustScoreRequest) -> TrustScoreResponse:
    """
    POST /trust-score (backward compatible). Accepts { wallet: string }.
    Fetches on-chain data via Solana RPC, analyzes metrics, computes trust_score (0–100),
    determines risk_level (Low / Medium / High), saves result + metrics to SQLite,
    returns JSON: trust_score, risk_level, metrics.
    """
    wallet = body.wallet.strip()
    if not wallet:
        raise HTTPException(status_code=400, detail="wallet must be non-empty")

    try:
        metrics = analyze_wallet(wallet)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail="Solana RPC unavailable or error; try again later",
        ) from e

    score, risk_level = compute_trust_score(metrics)
    insert_trust_record(
        wallet=wallet,
        trust_score=score,
        risk_level=risk_level,
        tx_count=metrics.tx_count,
        wallet_age_months=metrics.wallet_age_months,
        activity_score=metrics.activity_score,
        risk_flags=list(metrics.risk_flags),
    )

    api_metrics = TrustMetrics(
        tx_count=metrics.tx_count,
        wallet_age_months=metrics.wallet_age_months,
        activity_score=metrics.activity_score,
        activity_level=metrics.activity_level,
        suspicious_behavior_count=metrics.suspicious_behavior_count,
        risk_flags=list(metrics.risk_flags),
    )

    return TrustScoreResponse(
        wallet=wallet,
        trust_score=score,
        risk_level=risk_level,
        metrics=api_metrics,
    )
