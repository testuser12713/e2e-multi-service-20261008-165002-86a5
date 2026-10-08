"""Pydantic models shared by the API routes.

Every later ticket (job creation, listing, lookup) imports the models defined
here, so the shapes match the sprint contract exactly.
"""

from __future__ import annotations

from enum import StrEnum
from typing import Any, Literal

from pydantic import BaseModel, Field, field_validator


class AnalysisType(StrEnum):
    """The three analyses the worker can run on a job's text."""

    WORD_COUNT = "word_count"
    TOP_WORDS = "top_words"
    READING_TIME = "reading_time"


class JobStatus(StrEnum):
    """Lifecycle states of a job."""

    PENDING = "pending"
    RUNNING = "running"
    DONE = "done"
    FAILED = "failed"


class JobCreate(BaseModel):
    """Request body of POST /api/jobs."""

    text: str = Field(min_length=1)
    analysis: AnalysisType

    @field_validator("text")
    @classmethod
    def _reject_blank_text(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("text must not be blank")
        return value


class JobResponse(BaseModel):
    """A single job as returned by the API."""

    id: int
    text: str
    analysis: AnalysisType
    status: JobStatus
    result: dict[str, Any] | None = None
    error: str | None = None
    created_at: str
    updated_at: str


class JobListResponse(BaseModel):
    """Response body of GET /api/jobs: the jobs newest first."""

    jobs: list[JobResponse]


class ErrorDetail(BaseModel):
    """The inner error object of the unified error body."""

    code: str
    message: str
    details: dict[str, Any] | None = None


class ErrorResponse(BaseModel):
    """The unified error body of every non-2xx response."""

    error: ErrorDetail


class HealthResponse(BaseModel):
    """Response body of GET /api/health."""

    status: Literal["ok"] = "ok"
