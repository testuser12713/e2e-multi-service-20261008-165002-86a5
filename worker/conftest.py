"""Test support: make the worker's flat modules importable.

The worker is started as a script (``python main.py``) and its modules are
imported flat (``import db``), so the worker directory itself must be on
``sys.path`` when pytest collects the tests.
"""

import sys
from pathlib import Path

WORKER_DIR = Path(__file__).resolve().parent
if str(WORKER_DIR) not in sys.path:
    sys.path.insert(0, str(WORKER_DIR))
