"""SQLite access for the worker.

The worker and the API share ONE SQLite file. Each connection enables WAL
journaling and a busy timeout so the two processes can read and write the same
file concurrently without spurious "database is locked" errors.
"""

from __future__ import annotations

import os
import sqlite3

import settings

BUSY_TIMEOUT_MS = 5000

CREATE_JOBS_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    text TEXT NOT NULL,
    analysis TEXT NOT NULL,
    status TEXT NOT NULL,
    result TEXT NULL,
    error TEXT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
)
"""


def get_connection(db_path: str | os.PathLike[str] | None = None) -> sqlite3.Connection:
    """Open the shared jobs database, creating the schema when missing.

    ``db_path`` defaults to the configured ``JOBS_DB_PATH``. The returned
    connection uses ``sqlite3.Row`` rows so callers can index columns by name.
    """
    path = str(db_path) if db_path is not None else settings.load_settings().jobs_db_path
    conn = sqlite3.connect(path, timeout=BUSY_TIMEOUT_MS / 1000.0)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute(f"PRAGMA busy_timeout={BUSY_TIMEOUT_MS}")
    conn.execute(CREATE_JOBS_TABLE_SQL)
    conn.commit()
    return conn
