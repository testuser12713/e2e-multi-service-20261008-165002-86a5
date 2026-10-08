"""Job queue operations against the shared SQLite database.

A job is claimed by :func:`claim_next_pending`, which selects the oldest
``pending`` row and flips it to ``running`` in the same call, so the polling
loop never processes the same job twice. :func:`mark_done` stores the result as
JSON with a ``NULL`` error, :func:`mark_failed` records a readable error
message; both refresh ``updated_at``.
"""

from __future__ import annotations

import json
import sqlite3
from datetime import UTC, datetime


def _utc_now() -> str:
    """Return the current UTC time in the shared ``YYYY-MM-DDTHH:MM:SSZ`` format."""
    return datetime.now(UTC).strftime("%Y-%m-%dT%H:%M:%SZ")


def claim_next_pending(conn: sqlite3.Connection) -> sqlite3.Row | None:
    """Return the oldest pending job and mark it ``running``.

    Returns ``None`` when there is nothing to do. The returned row is the one
    selected before the status change, so callers can read ``text`` and
    ``analysis`` from it.
    """
    row = conn.execute(
        "SELECT * FROM jobs WHERE status = 'pending' ORDER BY created_at ASC, id ASC LIMIT 1"
    ).fetchone()
    if row is None:
        return None
    conn.execute(
        "UPDATE jobs SET status = 'running', updated_at = ? WHERE id = ?",
        (_utc_now(), row["id"]),
    )
    conn.commit()
    return row


def mark_running(conn: sqlite3.Connection, job_id: int) -> None:
    """Move a claimed job into the ``running`` state and refresh ``updated_at``."""
    conn.execute(
        "UPDATE jobs SET status = 'running', updated_at = ? WHERE id = ?",
        (_utc_now(), job_id),
    )
    conn.commit()


def mark_done(conn: sqlite3.Connection, job_id: int, result: dict) -> None:
    """Store a job's result as JSON and move it into the ``done`` state."""
    conn.execute(
        "UPDATE jobs SET status = 'done', result = ?, error = NULL, updated_at = ? WHERE id = ?",
        (json.dumps(result), _utc_now(), job_id),
    )
    conn.commit()


def mark_failed(conn: sqlite3.Connection, job_id: int, message: str) -> None:
    """Record an error message and move the job into the ``failed`` state."""
    conn.execute(
        "UPDATE jobs SET status = 'failed', error = ?, updated_at = ? WHERE id = ?",
        (message, _utc_now(), job_id),
    )
    conn.commit()
