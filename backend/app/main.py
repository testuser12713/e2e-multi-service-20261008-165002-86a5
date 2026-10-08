"""FastAPI application for the Job Runner API.

Builds the app, enables CORS for the configured frontend origin, registers the
health and jobs routers, and installs the single exception handler that renders
the contract's unified error body for HTTP errors and request validation errors
alike.  The catch-all middleware ensures even an unhandled error leaves the
server with its CORS headers attached.
"""

from __future__ import annotations

import logging
import os
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.responses import Response

from app import db
from app.routes import health, jobs

logger = logging.getLogger(__name__)

DEFAULT_CORS_ORIGIN = "http://localhost:3000"

_STATUS_CODE_NAMES = {
    400: "bad_request",
    401: "unauthorized",
    403: "forbidden",
    404: "not_found",
    405: "method_not_allowed",
    409: "conflict",
    422: "validation_error",
    500: "internal_error",
    501: "not_implemented",
    503: "service_unavailable",
}


def _error_body(code: str, message: str, details: object | None = None) -> dict:
    return {"error": {"code": code, "message": message, "details": details}}


def _code_for_status(status_code: int) -> str:
    return _STATUS_CODE_NAMES.get(status_code, "http_error")


async def unified_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Render the contract's unified error body for both exception kinds."""
    if isinstance(exc, RequestValidationError):
        return JSONResponse(
            status_code=422,
            content=_error_body(
                "validation_error",
                "Request validation failed",
                {"errors": jsonable_encoder(exc.errors())},
            ),
        )
    status_code = exc.status_code if isinstance(exc, StarletteHTTPException) else 500
    detail = exc.detail if isinstance(exc, StarletteHTTPException) else "Internal Server Error"
    message = detail if isinstance(detail, str) else str(detail)
    return JSONResponse(
        status_code=status_code,
        content=_error_body(_code_for_status(status_code), message),
    )


class _UnhandledErrorMiddleware(BaseHTTPMiddleware):
    """Turn an unhandled exception into the unified 500 body, inside the CORS layer."""

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        try:
            return await call_next(request)
        except Exception:
            logger.exception("unhandled error on %s %s", request.method, request.url.path)
            return JSONResponse(
                status_code=500,
                content=_error_body("internal_error", "Internal Server Error"),
            )


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Create the database and its schema before serving the first request."""
    db.init_db()
    yield


app = FastAPI(title="Job Runner API", version="0.1.0", lifespan=lifespan)

# Added first so that CORS, added right after, wraps it: every response the
# catch-all produces then leaves the server with its Access-Control-Allow-Origin
# header instead of showing up in the browser as a false CORS failure.
app.add_middleware(_UnhandledErrorMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.environ.get("CORS_ALLOWED_ORIGIN", DEFAULT_CORS_ORIGIN)],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(jobs.router)

app.add_exception_handler(StarletteHTTPException, unified_exception_handler)
app.add_exception_handler(RequestValidationError, unified_exception_handler)
