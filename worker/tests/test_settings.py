"""Tests for worker.settings defaults and environment overrides."""

from __future__ import annotations

from pathlib import Path

import settings


def test_default_db_path_points_at_repo_root(monkeypatch):
    monkeypatch.delenv("JOBS_DB_PATH", raising=False)

    cfg = settings.load_settings()

    assert Path(cfg.jobs_db_path) == settings.REPO_ROOT / "jobs.db"
    assert Path(cfg.jobs_db_path).name == "jobs.db"


def test_default_poll_interval_is_two_seconds(monkeypatch):
    monkeypatch.delenv("WORKER_POLL_INTERVAL_SECONDS", raising=False)

    cfg = settings.load_settings()

    assert cfg.poll_interval_seconds == 2.0


def test_environment_overrides_are_read(monkeypatch, tmp_path):
    target = tmp_path / "other.db"
    monkeypatch.setenv("JOBS_DB_PATH", str(target))
    monkeypatch.setenv("WORKER_POLL_INTERVAL_SECONDS", "0.25")

    cfg = settings.load_settings()

    assert cfg.jobs_db_path == str(target)
    assert cfg.poll_interval_seconds == 0.25


def test_blank_poll_interval_falls_back_to_default(monkeypatch):
    monkeypatch.setenv("WORKER_POLL_INTERVAL_SECONDS", "  ")

    cfg = settings.load_settings()

    assert cfg.poll_interval_seconds == settings.DEFAULT_POLL_INTERVAL_SECONDS
