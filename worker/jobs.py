"""Job queue operations against the shared SQLite database.

These functions are deliberately empty in this scaffold: the polling loop in
``main.py`` already calls them, and the ticket that implements the processing
logic fills in the bodies. Until then they invent no behaviour — nothing is
claimed, promoted or written.
"""

from __future__ import annotations

import sqlite3


def claim_next_pending(conn: sqlite3.Connection) -> sqlite3.Row | None:
    """Return the next pending job, or ``None`` when there is nothing to do."""
    return None


def mark_running(conn: sqlite3.Connection, job_id: int) -> None:
    """Move a claimed job into the ``running`` state."""
    return None


def mark_done(conn: sqlite3.Connection, job_id: int, result: dict) -> None:
    """Store a job's result and move it into the ``done`` state."""
    return None


def mark_failed(conn: sqlite3.Connection, job_id: int, message: str) -> None:
    """Record an error message and move the job into the ``failed`` state."""
    return None
