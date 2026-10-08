"""GET /api/health — the skeleton's visible end-to-end path."""

from __future__ import annotations

from fastapi import APIRouter

from app.schemas import HealthResponse

router = APIRouter()


@router.get("/api/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    """Report that the service is up."""
    return HealthResponse(status="ok")
