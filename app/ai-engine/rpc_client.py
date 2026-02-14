"""
Solana RPC client for fetching on-chain wallet data.
Uses solana-py to connect to Solana mainnet RPC and fetch recent transactions.
"""

from __future__ import annotations

import os
from dataclasses import dataclass
from typing import Optional

from solana.rpc.api import Client
from solders.pubkey import Pubkey

# Solana mainnet RPC (override with SOLANA_RPC_URL env for private RPC)
DEFAULT_RPC_URL = "https://api.mainnet-beta.solana.com"
MAX_SIGNATURES_LIMIT = 100
# Request timeout in seconds (solana-py Client uses this when supported)
DEFAULT_TIMEOUT = 30


@dataclass(frozen=True)
class TxSignatureInfo:
    """Minimal info for one transaction (from getSignaturesForAddress)."""

    signature: str
    block_time: Optional[int] = None  # Unix timestamp; can be None from RPC


def get_rpc_url() -> str:
    """Return Solana RPC endpoint URL (mainnet by default)."""
    return os.environ.get("SOLANA_RPC_URL", DEFAULT_RPC_URL)


def get_recent_transactions(
    wallet_address: str,
    limit: int = MAX_SIGNATURES_LIMIT,
    rpc_url: Optional[str] = None,
) -> list[TxSignatureInfo]:
    """
    Fetch recent transaction signatures for a Solana wallet from mainnet RPC.
    Uses solana-py Client; requires valid base58 Solana address.
    Returns list of (signature, block_time); block_time may be None.
    Raises ValueError for invalid address; propagates RPC/network errors.
    """
    url = rpc_url or get_rpc_url()
    client = Client(url, timeout=DEFAULT_TIMEOUT)

    try:
        pubkey = Pubkey.from_string(wallet_address.strip())
    except Exception as e:
        raise ValueError(f"Invalid Solana address: {e}") from e

    response = client.get_signatures_for_address(pubkey, limit=limit)
    if response.value is None:
        return []

    out: list[TxSignatureInfo] = []
    for item in response.value:
        sig = getattr(item, "signature", None)
        sig_str = str(sig) if sig is not None else ""
        block_time = getattr(item, "block_time", None)
        out.append(TxSignatureInfo(signature=sig_str, block_time=block_time))
    return out
