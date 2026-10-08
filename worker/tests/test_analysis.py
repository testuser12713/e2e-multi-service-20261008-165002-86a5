"""Tests for the worker's pure text analyses and the ``analyze`` dispatch."""

from __future__ import annotations

import analysis
import pytest

# --- word_count -----------------------------------------------------------


def test_word_count_counts_real_words():
    assert analysis.analyze("drei kleine Wörter", "word_count") == {"words": 3}


def test_word_count_strips_punctuation():
    assert analysis.analyze("Hello, world! Some... text?", "word_count") == {"words": 4}


def test_word_count_mixed_case_still_counts_each_token():
    assert analysis.analyze("Hello HELLO hello", "word_count") == {"words": 3}


def test_word_count_short_and_empty_input():
    assert analysis.analyze("", "word_count") == {"words": 0}
    assert analysis.analyze("   \n\t ", "word_count") == {"words": 0}
    assert analysis.analyze("word", "word_count") == {"words": 1}


# --- top_words ------------------------------------------------------------


def test_top_words_orders_by_count_descending():
    result = analysis.analyze("apple banana apple cherry apple banana", "top_words")
    assert result == {
        "words": [
            {"word": "apple", "count": 3},
            {"word": "banana", "count": 2},
            {"word": "cherry", "count": 1},
        ]
    }


def test_top_words_lowercases_and_strips_punctuation():
    result = analysis.analyze("Hello, hello! HELLO. World?", "top_words")
    assert result["words"][0] == {"word": "hello", "count": 3}
    assert result["words"][1] == {"word": "world", "count": 1}


def test_top_words_returns_at_most_ten():
    text = " ".join(f"word{i}" for i in range(15))
    result = analysis.analyze(text, "top_words")
    assert len(result["words"]) == 10


def test_top_words_empty_input():
    assert analysis.analyze("", "top_words") == {"words": []}


# --- reading_time ---------------------------------------------------------


def test_reading_time_is_derived_from_word_count():
    result = analysis.analyze(" ".join(["word"] * 400), "reading_time")
    assert result["words"] == 400
    assert result["minutes"] == pytest.approx(2.0, abs=1e-6)


def test_reading_time_short_input():
    result = analysis.analyze("drei kleine Wörter", "reading_time")
    assert result["words"] == 3
    assert result["minutes"] == pytest.approx(3 / 200.0, abs=1e-6)
    assert result["minutes"] > 0


# --- dispatch -------------------------------------------------------------


def test_unknown_analysis_raises_value_error():
    with pytest.raises(ValueError):
        analysis.analyze("some text", "does_not_exist")
