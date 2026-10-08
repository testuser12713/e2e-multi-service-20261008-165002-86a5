"""Tests for the polling loop and clean shutdown."""

from __future__ import annotations

import os
import signal
import subprocess
import sys
import time
from pathlib import Path

import db
import main

WORKER_DIR = Path(__file__).resolve().parent.parent


def test_empty_tick_leaves_database_untouched(tmp_path):
    conn = db.get_connection(tmp_path / "jobs.db")
    try:
        conn.execute("SELECT 1")
        changes_before = conn.total_changes

        main.run_once(conn)

        count = conn.execute("SELECT COUNT(*) FROM jobs").fetchone()[0]
        assert count == 0
        assert conn.total_changes == changes_before
    finally:
        conn.close()


def _spawn_worker(tmp_path: Path) -> subprocess.Popen:
    env = dict(os.environ)
    env["JOBS_DB_PATH"] = str(tmp_path / "jobs.db")
    env["WORKER_POLL_INTERVAL_SECONDS"] = "0.2"
    return subprocess.Popen(
        [sys.executable, "main.py"],
        cwd=WORKER_DIR,
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
    )


def _assert_clean_shutdown(signum: int, tmp_path: Path) -> None:
    proc = _spawn_worker(tmp_path)
    try:
        time.sleep(1.0)
        proc.send_signal(signum)
        output, _ = proc.communicate(timeout=15)
    finally:
        if proc.poll() is None:
            proc.kill()
            proc.communicate()

    assert proc.returncode == 0
    assert "Traceback" not in output
    assert "worker started" in output
    assert "shutdown" in output


def test_sigint_stops_worker_cleanly(tmp_path):
    _assert_clean_shutdown(signal.SIGINT, tmp_path)


def test_sigterm_stops_worker_cleanly(tmp_path):
    _assert_clean_shutdown(signal.SIGTERM, tmp_path)
