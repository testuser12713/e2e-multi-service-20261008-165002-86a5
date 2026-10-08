"""Skeleton checks: the app imports, wires both routers, serves health and
creates the WAL database with its ``jobs`` table on startup."""

from __future__ import annotations

import sqlite3
from pathlib import Path

from fastapi.testclient import TestClient

from app.main import app


def test_app_is_importable_and_registers_both_routers() -> None:
    paths = set(app.openapi()["paths"])
    assert "/api/health" in paths
    assert "/api/jobs" in paths
    assert "/api/jobs/{id}" in paths


def test_health_answers_200() -> None:
    response = TestClient(app).get("/api/health")
    assert response.status_code == 200


def test_startup_creates_wal_database_with_jobs_table(tmp_path: Path, monkeypatch) -> None:
    db_file = tmp_path / "jobs.db"
    monkeypatch.setenv("JOBS_DB_PATH", str(db_file))

    with TestClient(app) as client:
        assert client.get("/api/health").status_code == 200

    assert db_file.exists()

    conn = sqlite3.connect(str(db_file))
    try:
        journal_mode = str(conn.execute("PRAGMA journal_mode").fetchone()[0])
        tables = {
            row[0] for row in conn.execute("SELECT name FROM sqlite_master WHERE type = 'table'")
        }
    finally:
        conn.close()

    assert journal_mode.lower() == "wal"
    assert "jobs" in tables


def test_validation_error_uses_unified_error_body() -> None:
    response = TestClient(app).post("/api/jobs", json={"text": "   ", "analysis": "word_count"})
    assert response.status_code == 422
    body = response.json()
    assert set(body) == {"error"}
    assert body["error"]["code"] == "validation_error"
    assert isinstance(body["error"]["message"], str)
