"""Text analyses executed by the worker.

Each analysis is a pure function: it reads only its arguments and returns the
result object described by the shared contract. ``analyze`` dispatches on the
analysis name; an unknown name is a programming error and raises ``ValueError``,
which the polling loop in ``main.py`` turns into a ``failed`` job with a readable
message.

A "word" is a run of letters (Unicode letters included, so ``Wörter`` stays one
word) and digits, with surrounding punctuation stripped. Tokens are lowercased
so ``Hello`` and ``HELLO`` count as the same word.
"""

from __future__ import annotations

import re
from collections import Counter

_WORD_RE = re.compile("[^\\W_]+(?:['\u2019][^\\W_]+)*")
_WORDS_PER_MINUTE = 200.0
_TOP_WORDS_LIMIT = 10


def _tokenize(text: str) -> list[str]:
    """Split ``text`` into lowercased word tokens with punctuation stripped."""
    return [match.group(0).lower() for match in _WORD_RE.finditer(text)]


def word_count(text: str) -> dict:
    """Count the words in ``text``."""
    return {"words": len(_tokenize(text))}


def top_words(text: str) -> dict:
    """Return up to ten most frequent words, most frequent first.

    Ties are broken alphabetically so the result is deterministic.
    """
    counts = Counter(_tokenize(text))
    ordered = sorted(counts.items(), key=lambda item: (-item[1], item[0]))
    words = [{"word": word, "count": count} for word, count in ordered[:_TOP_WORDS_LIMIT]]
    return {"words": words}


def reading_time(text: str) -> dict:
    """Estimate the reading time from the word count at 200 words per minute."""
    words = len(_tokenize(text))
    return {"minutes": words / _WORDS_PER_MINUTE, "words": words}


_ANALYSES = {
    "word_count": word_count,
    "top_words": top_words,
    "reading_time": reading_time,
}


def analyze(text: str, analysis: str) -> dict:
    """Run the requested analysis over ``text`` and return its result."""
    try:
        func = _ANALYSES[analysis]
    except KeyError:
        raise ValueError(f"unknown analysis: {analysis!r}") from None
    return func(text)
