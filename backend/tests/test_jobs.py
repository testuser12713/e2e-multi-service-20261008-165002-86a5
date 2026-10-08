"""Behaviour of the job creation, listing and lookup endpoints."""

from __future__ import annotations

import json
from collections.abc import Iterator
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.db import connection
from app.main import app


@pytest.fixture()
def client(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> Iterator[TestClient]:
    monkeypatch.setenv("JOBS_DB_PATH", str(tmp_path / "jobs.db"))
    with TestClient(app) as test_client:
        yield test_client


def test_create_job_answers_201_and_reads_back_as_pending(client: TestClient) -> None:
    response = client.post("/api/jobs", json={"text": "hello world", "analysis": "word_count"})
    assert response.status_code == 201
    body = response.json()
    assert isinstance(body["id"], int)
    assert body["status"] == "pending"
    assert body["analysis"] == "word_count"
    assert body["result"] is None

    fetched = client.get(f"/api/jobs/{body['id']}")
    assert fetched.status_code == 200
    assert fetched.json()["status"] == "pending"
    assert fetched.json()["text"] == "hello world"


def test_blank_text_is_rejected_with_unified_error_body(client: TestClient) -> None:
    response = client.post("/api/jobs", json={"text": "   ", "analysis": "word_count"})
    assert response.status_code == 422
    body = response.json()
    assert set(body) == {"error"}
    assert body["error"]["code"] == "validation_error"
    assert isinstance(body["error"]["message"], str)


def test_unknown_analysis_is_rejected_with_unified_error_body(client: TestClient) -> None:
    response = client.post("/api/jobs", json={"text": "hello", "analysis": "not_a_type"})
    assert response.status_code == 422
    body = response.json()
    assert set(body) == {"error"}
    assert body["error"]["code"] == "validation_error"


def test_list_returns_jobs_newest_first(client: TestClient) -> None:
    created = []
    for index in range(3):
        response = client.post(
            "/api/jobs", json={"text": f"job number {index}", "analysis": "word_count"}
        )
        assert response.status_code == 201
        created.append(response.json()["id"])

    response = client.get("/api/jobs")
    assert response.status_code == 200
    ids = [job["id"] for job in response.json()["jobs"]]
    assert ids == list(reversed(created))


def test_unknown_id_answers_404_with_unified_error_body(client: TestClient) -> None:
    response = client.get("/api/jobs/999999")
    assert response.status_code == 404
    body = response.json()
    assert set(body) == {"error"}
    assert body["error"]["code"] == "not_found"


def test_done_job_result_is_returned_as_object(client: TestClient) -> None:
    now = "2026-01-01T00:00:00+00:00"
    result = {"words": 3}
    with connection() as conn:
        cursor = conn.execute(
            """
            INSERT INTO jobs (text, analysis, status, result, error, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            ("drei kleine Wörter", "word_count", "done", json.dumps(result), None, now, now),
        )
        conn.commit()
        job_id = cursor.lastrowid

    response = client.get(f"/api/jobs/{job_id}")
    assert response.status_code == 200
    assert response.json()["status"] == "done"
    assert response.json()["result"] == result
