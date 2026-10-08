"""Text analyses executed by the worker.

The scaffold only declares the entry point; the ticket that implements the
analyses (``word_count``, ``top_words``, ``reading_time``) fills in the body.
"""

from __future__ import annotations


def analyze(text: str, analysis: str) -> dict:
    """Run the requested analysis over ``text`` and return its result."""
    return {}
