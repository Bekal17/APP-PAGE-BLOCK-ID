"""
SQLite database layer for trust score history.
Stores result (trust_score, risk_level) and metrics (tx_count, wallet_age_months, etc.).
"""

from __future__ import annotations

import json
import sqlite3
from contextlib import contextmanager
from pathlib import Path
from typing import Generator

# Database file lives next to this module inside app/ai-engine/
DATABASE_PATH = Path(__file__).resolve().parent / "trust.db"

TABLE_NAME = "trust_history"

# Optional metrics columns (added by migration for existing DBs)
METRICS_COLUMNS = [
    ("tx_count", "INTEGER"),
    ("wallet_age_months", "INTEGER"),
    ("activity_score", "REAL"),
    ("risk_flags", "TEXT"),  # JSON array
]


def init_db() -> None:
    """Create the trust_history table if it does not exist; add metrics columns if missing."""
    with _connection() as conn:
        conn.execute(
            f"""
            CREATE TABLE IF NOT EXISTS {TABLE_NAME} (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                wallet TEXT NOT NULL,
                trust_score INTEGER NOT NULL,
                risk_level TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                tx_count INTEGER,
                wallet_age_months INTEGER,
                activity_score REAL,
                risk_flags TEXT
            )
            """
        )
        conn.commit()
        _add_columns_if_missing(conn)


def _add_columns_if_missing(conn: sqlite3.Connection) -> None:
    """Add metrics columns to existing table (no-op if already present)."""
    cursor = conn.execute(f"PRAGMA table_info({TABLE_NAME})")
    existing = {row[1] for row in cursor.fetchall()}
    for col_name, col_type in METRICS_COLUMNS:
        if col_name not in existing:
            conn.execute(
                f"ALTER TABLE {TABLE_NAME} ADD COLUMN {col_name} {col_type}"
            )
    conn.commit()


@contextmanager
def _connection() -> Generator[sqlite3.Connection, None, None]:
    """Yield a database connection, closing it on exit."""
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()


def insert_trust_record(
    wallet: str,
    trust_score: int,
    risk_level: str,
    tx_count: int | None = None,
    wallet_age_months: int | None = None,
    activity_score: float | None = None,
    risk_flags: list[str] | None = None,
) -> None:
    """
    Persist a single trust score result and its metrics.
    """
    from datetime import datetime, timezone

    timestamp = datetime.now(timezone.utc).isoformat()
    risk_flags_json: str | None = (
        json.dumps(risk_flags) if risk_flags is not None else None
    )
    with _connection() as conn:
        conn.execute(
            f"""
            INSERT INTO {TABLE_NAME} (
                wallet, trust_score, risk_level, timestamp,
                tx_count, wallet_age_months, activity_score, risk_flags
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                wallet,
                trust_score,
                risk_level,
                timestamp,
                tx_count,
                wallet_age_months,
                activity_score,
                risk_flags_json,
            ),
        )
        conn.commit()
