"""Job routes.

The signatures (path, verb, schemas, status codes) are the sprint contract and
are declared in full here.  The bodies are stubs that answer 501 in the unified
error body; job creation, listing and lookup are implemented by a later ticket.
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, status

from app.schemas import JobCreate, JobListResponse, JobResponse

router = APIRouter()


@router.post("/api/jobs", response_model=JobResponse, status_code=status.HTTP_201_CREATED)
async def create_job(payload: JobCreate) -> JobResponse:
    """Create a job and queue it for the worker (stub)."""
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="job creation is not implemented yet",
    )


@router.get("/api/jobs", response_model=JobListResponse)
async def list_jobs() -> JobListResponse:
    """List all jobs, newest first (stub)."""
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="job listing is not implemented yet",
    )


@router.get("/api/jobs/{id}", response_model=JobResponse)
async def get_job(id: int) -> JobResponse:
    """Return a single job by id (stub)."""
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="job lookup is not implemented yet",
    )
