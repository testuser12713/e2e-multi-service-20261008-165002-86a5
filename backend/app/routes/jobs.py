"""Job routes: creation, listing and lookup.

A job is stored in the shared SQLite ``jobs`` table (see :mod:`app.db`) with
status ``pending``; the worker owns every later status transition.  ``result``
is stored as JSON text and parsed back into an object before it is returned.
"""

from __future__ import annotations

import json
import sqlite3
from datetime import UTC, datetime
from typing import Any

from fastapi import APIRouter, HTTPException, status

from app.db import connection
from app.schemas import AnalysisType, JobCreate, JobListResponse, JobResponse, JobStatus

router = APIRouter()


def _utc_now() -> str:
    """Return the current time as an ISO-8601 UTC string."""
    return datetime.now(UTC).isoformat()


def _parse_result(raw: str | None) -> dict[str, Any] | None:
    """Parse the stored result JSON text into an object, or ``None``."""
    if raw is None or raw == "":
        return None
    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError:
        return None
    return parsed if isinstance(parsed, dict) else None


def _row_to_job(row: sqlite3.Row) -> JobResponse:
    """Map a ``jobs`` row onto the response contract."""
    return JobResponse(
        id=row["id"],
        text=row["text"],
        analysis=AnalysisType(row["analysis"]),
        status=JobStatus(row["status"]),
        result=_parse_result(row["result"]),
        error=row["error"],
        created_at=row["created_at"],
        updated_at=row["updated_at"],
    )


@router.post("/api/jobs", response_model=JobResponse, status_code=status.HTTP_201_CREATED)
async def create_job(payload: JobCreate) -> JobResponse:
    """Create a job in state ``pending`` and return it."""
    now = _utc_now()
    with connection() as conn:
        cursor = conn.execute(
            """
            INSERT INTO jobs (text, analysis, status, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?)
            """,
            (payload.text, payload.analysis.value, JobStatus.PENDING.value, now, now),
        )
        conn.commit()
        row = conn.execute("SELECT * FROM jobs WHERE id = ?", (cursor.lastrowid,)).fetchone()

    if row is None:  # pragma: no cover - the row was just inserted
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="job could not be stored",
        )
    return _row_to_job(row)


@router.get("/api/jobs", response_model=JobListResponse)
async def list_jobs() -> JobListResponse:
    """List all jobs, newest first."""
    with connection() as conn:
        rows = conn.execute("SELECT * FROM jobs ORDER BY created_at DESC, id DESC").fetchall()
    return JobListResponse(jobs=[_row_to_job(row) for row in rows])


@router.get("/api/jobs/{id}", response_model=JobResponse)
async def get_job(id: int) -> JobResponse:
    """Return a single job by id, or 404 when it does not exist."""
    with connection() as conn:
        row = conn.execute("SELECT * FROM jobs WHERE id = ?", (id,)).fetchone()
    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"job {id} not found",
        )
    return _row_to_job(row)
