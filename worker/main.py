"""Entry point of the standalone worker process.

The worker polls the shared jobs database on a configurable interval. Each tick
it logs how many jobs are pending and processes at most one of them: claim it,
mark it running, run the analysis, then store the result or the error.

``SIGINT`` and ``SIGTERM`` request a graceful stop: the signal only sets a flag,
so a job that is being processed still finishes and the database is never left
with a half-written job. The process then logs its shutdown and exits 0 without
a traceback.
"""

from __future__ import annotations

import logging
import signal
import sqlite3
import threading
from types import FrameType

import analysis
import db
import jobs
import settings

logger = logging.getLogger("worker")

_stop_event = threading.Event()


def _handle_signal(signum: int, _frame: FrameType | None) -> None:
    logger.info("received signal %s — finishing the current job, then shutting down", signum)
    _stop_event.set()


def _install_signal_handlers() -> None:
    for name in ("SIGINT", "SIGTERM"):
        sig = getattr(signal, name, None)
        if sig is None:
            continue
        try:
            signal.signal(sig, _handle_signal)
        except ValueError:
            # Not running in the main thread (e.g. under some test runners):
            # leave the default handling in place.
            logger.debug("could not install %s handler outside the main thread", name)


def count_pending(conn: sqlite3.Connection) -> int:
    """Return the number of jobs currently waiting to be processed."""
    row = conn.execute("SELECT COUNT(*) AS n FROM jobs WHERE status = 'pending'").fetchone()
    return int(row["n"]) if row is not None else 0


def run_once(conn: sqlite3.Connection) -> None:
    """Run a single polling tick: log the backlog and process one job."""
    pending = count_pending(conn)
    logger.info("poll: %d pending job(s)", pending)

    row = jobs.claim_next_pending(conn)
    if row is None:
        return

    job_id = row["id"]
    jobs.mark_running(conn, job_id)
    try:
        result = analysis.analyze(row["text"], row["analysis"])
    except Exception as exc:
        # Any analysis failure marks the job as failed; the loop keeps running.
        logger.exception("job %s failed", job_id)
        jobs.mark_failed(conn, job_id, str(exc))
    else:
        jobs.mark_done(conn, job_id, result)


def run() -> int:
    """Run the polling loop until a stop signal arrives. Returns the exit code."""
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    )
    _stop_event.clear()
    _install_signal_handlers()

    cfg = settings.load_settings()
    conn = db.get_connection(cfg.jobs_db_path)
    logger.info(
        "worker started (db=%s, poll_interval=%ss)",
        cfg.jobs_db_path,
        cfg.poll_interval_seconds,
    )
    try:
        while not _stop_event.is_set():
            try:
                run_once(conn)
            except Exception:
                # A transient DB error must not kill the polling loop.
                logger.exception("polling cycle failed")
            _stop_event.wait(cfg.poll_interval_seconds)
    finally:
        conn.close()
    logger.info("worker shutdown complete")
    return 0


def main() -> int:
    try:
        return run()
    except KeyboardInterrupt:
        logger.info("worker interrupted — shutdown complete")
        return 0


if __name__ == "__main__":
    raise SystemExit(main())
