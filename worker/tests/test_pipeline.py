"""Integration tests for job claiming, processing and failure handling."""

from __future__ import annotations

import json
import sqlite3

import analysis
import db
import jobs
import main


def _insert_job(
    conn: sqlite3.Connection,
    text: str,
    analysis_type: str,
    created_at: str,
    status: str = "pending",
) -> int:
    conn.execute(
        """
        INSERT INTO jobs (text, analysis, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
        """,
        (text, analysis_type, status, created_at, created_at),
    )
    conn.commit()
    row = conn.execute("SELECT last_insert_rowid() AS id").fetchone()
    return int(row["id"])


def _status_of(conn: sqlite3.Connection, job_id: int) -> str:
    row = conn.execute("SELECT status FROM jobs WHERE id = ?", (job_id,)).fetchone()
    return str(row["status"])


def test_claim_next_pending_picks_oldest_and_marks_running(tmp_path):
    conn = db.get_connection(tmp_path / "jobs.db")
    try:
        older = _insert_job(conn, "first", "word_count", "2026-01-01T00:00:00Z")
        newer = _insert_job(conn, "second", "word_count", "2026-01-02T00:00:00Z")

        claimed = jobs.claim_next_pending(conn)

        assert claimed is not None
        assert claimed["id"] == older
        assert _status_of(conn, older) == "running"
        assert _status_of(conn, newer) == "pending"
        updated = conn.execute("SELECT updated_at FROM jobs WHERE id = ?", (older,)).fetchone()
        assert updated["updated_at"] != "2026-01-01T00:00:00Z"
    finally:
        conn.close()


def test_claim_on_empty_queue_returns_none(tmp_path):
    conn = db.get_connection(tmp_path / "jobs.db")
    try:
        assert jobs.claim_next_pending(conn) is None
    finally:
        conn.close()


def test_run_once_processes_pending_job_to_done(tmp_path):
    conn = db.get_connection(tmp_path / "jobs.db")
    try:
        job_id = _insert_job(conn, "drei kleine Wörter", "word_count", "2026-01-01T00:00:00Z")

        main.run_once(conn)

        row = conn.execute("SELECT * FROM jobs WHERE id = ?", (job_id,)).fetchone()
        assert row["status"] == "done"
        assert row["error"] is None
        assert json.loads(row["result"]) == {"words": 3}
    finally:
        conn.close()


def test_mark_failed_records_readable_message(tmp_path):
    conn = db.get_connection(tmp_path / "jobs.db")
    try:
        job_id = _insert_job(conn, "text", "word_count", "2026-01-01T00:00:00Z")

        jobs.mark_failed(conn, job_id, "synthetic analysis failure")

        row = conn.execute("SELECT * FROM jobs WHERE id = ?", (job_id,)).fetchone()
        assert row["status"] == "failed"
        assert row["error"] == "synthetic analysis failure"
    finally:
        conn.close()


def test_failing_analysis_leaves_job_failed_and_loop_continues(tmp_path, monkeypatch):
    conn = db.get_connection(tmp_path / "jobs.db")
    try:
        first = _insert_job(conn, "boom", "word_count", "2026-01-01T00:00:00Z")
        second = _insert_job(conn, "drei kleine Wörter", "word_count", "2026-01-02T00:00:00Z")

        real_analyze = analysis.analyze

        def flaky(text: str, analysis_type: str) -> dict:
            if text == "boom":
                raise RuntimeError("synthetic analysis failure")
            return real_analyze(text, analysis_type)

        monkeypatch.setattr(analysis, "analyze", flaky)

        main.run_once(conn)
        first_row = conn.execute("SELECT * FROM jobs WHERE id = ?", (first,)).fetchone()
        assert first_row["status"] == "failed"
        assert "synthetic analysis failure" in first_row["error"]

        main.run_once(conn)
        second_row = conn.execute("SELECT * FROM jobs WHERE id = ?", (second,)).fetchone()
        assert second_row["status"] == "done"
        assert json.loads(second_row["result"]) == {"words": 3}
    finally:
        conn.close()
