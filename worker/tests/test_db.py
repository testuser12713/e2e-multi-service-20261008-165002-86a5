"""Tests for the shared SQLite schema, WAL mode and busy timeout."""

from __future__ import annotations

import sqlite3

import db


def _column_names(conn: sqlite3.Connection) -> list[str]:
    rows = conn.execute("PRAGMA table_info(jobs)").fetchall()
    return [row["name"] for row in rows]


def test_get_connection_creates_jobs_table(tmp_path):
    conn = db.get_connection(tmp_path / "jobs.db")
    try:
        columns = _column_names(conn)
    finally:
        conn.close()

    assert columns == [
        "id",
        "text",
        "analysis",
        "status",
        "result",
        "error",
        "created_at",
        "updated_at",
    ]


def test_id_is_autoincrement_primary_key(tmp_path):
    conn = db.get_connection(tmp_path / "jobs.db")
    try:
        info = {row["name"]: row for row in conn.execute("PRAGMA table_info(jobs)")}
    finally:
        conn.close()

    assert info["id"]["pk"] == 1


def test_wal_mode_is_enabled(tmp_path):
    conn = db.get_connection(tmp_path / "jobs.db")
    try:
        mode = conn.execute("PRAGMA journal_mode").fetchone()[0]
    finally:
        conn.close()

    assert mode.lower() == "wal"


def test_busy_timeout_is_five_seconds(tmp_path):
    conn = db.get_connection(tmp_path / "jobs.db")
    try:
        timeout = conn.execute("PRAGMA busy_timeout").fetchone()[0]
    finally:
        conn.close()

    assert timeout == 5000


def test_connection_uses_configured_path(monkeypatch, tmp_path):
    target = tmp_path / "configured.db"
    monkeypatch.setenv("JOBS_DB_PATH", str(target))

    conn = db.get_connection()
    try:
        conn.execute("SELECT 1")
    finally:
        conn.close()

    assert target.exists()


def test_second_connection_reuses_existing_table(tmp_path):
    path = tmp_path / "jobs.db"
    first = db.get_connection(path)
    first.close()

    second = db.get_connection(path)
    try:
        second.execute("SELECT id FROM jobs")
    finally:
        second.close()
