"""SQLite access shared by the API and the worker.

Both services resolve the repository root from this file's location, so that
when ``JOBS_DB_PATH`` is not set they open the SAME database file.  Every
connection enables WAL journaling and a busy timeout so the API's readers and
the worker's writer can share the file without tripping over each other.
"""

from __future__ import annotations

import os
import sqlite3
from collections.abc import Iterator
from contextlib import contextmanager
from pathlib import Path

# backend/app/db.py -> backend -> repository root
REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_DB_PATH = REPO_ROOT / "jobs.db"

BUSY_TIMEOUT_MS = 5000

CREATE_JOBS_TABLE = """
CREATE TABLE IF NOT EXISTS jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    text TEXT NOT NULL,
    analysis TEXT NOT NULL,
    status TEXT NOT NULL,
    result TEXT,
    error TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
)
"""


def get_db_path() -> str:
    """Return the database file path, read from the environment at call time."""
    return os.environ.get("JOBS_DB_PATH") or str(DEFAULT_DB_PATH)


def connect() -> sqlite3.Connection:
    """Open a connection with WAL journaling and a busy timeout enabled."""
    conn = sqlite3.connect(get_db_path(), timeout=BUSY_TIMEOUT_MS / 1000)
    conn.row_factory = sqlite3.Row
    conn.execute(f"PRAGMA busy_timeout={BUSY_TIMEOUT_MS}")
    conn.execute("PRAGMA journal_mode=WAL")
    return conn


def ensure_schema(conn: sqlite3.Connection) -> None:
    """Create the ``jobs`` table when it is missing."""
    conn.execute(CREATE_JOBS_TABLE)
    conn.commit()


def init_db() -> None:
    """Create the database file and the ``jobs`` table if needed."""
    conn = connect()
    try:
        ensure_schema(conn)
    finally:
        conn.close()


@contextmanager
def connection() -> Iterator[sqlite3.Connection]:
    """Yield a connection and close it afterwards."""
    conn = connect()
    try:
        yield conn
    finally:
        conn.close()
