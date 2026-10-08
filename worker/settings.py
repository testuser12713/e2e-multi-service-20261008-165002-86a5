"""Configuration for the worker process.

Every value is read lazily from the environment when :func:`load_settings` is
called (never at import time), so a missing variable is reported when the
process actually starts rather than as a bare traceback during import.

``JOBS_DB_PATH`` defaults to ``<repo-root>/jobs.db`` where the repo root is
derived from ``__file__``. Both the API and the worker resolve the same root
this way, so without any configuration they open the very same file.
"""

from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

REPO_ROOT: Path = Path(__file__).resolve().parent.parent
DEFAULT_JOBS_DB_PATH: str = str(REPO_ROOT / "jobs.db")
DEFAULT_POLL_INTERVAL_SECONDS: float = 2.0


@dataclass(frozen=True)
class Settings:
    """Resolved worker configuration."""

    jobs_db_path: str
    poll_interval_seconds: float


def _read_poll_interval(name: str, default: float) -> float:
    raw = os.environ.get(name)
    if raw is None or raw.strip() == "":
        return default
    try:
        value = float(raw)
    except ValueError:
        raise ValueError(f"{name} must be a number, got {raw!r}") from None
    if value <= 0:
        raise ValueError(f"{name} must be greater than 0, got {raw!r}")
    return value


def load_settings() -> Settings:
    """Read the worker settings from the environment, applying defaults."""
    return Settings(
        jobs_db_path=os.environ.get("JOBS_DB_PATH", DEFAULT_JOBS_DB_PATH),
        poll_interval_seconds=_read_poll_interval(
            "WORKER_POLL_INTERVAL_SECONDS", DEFAULT_POLL_INTERVAL_SECONDS
        ),
    )
