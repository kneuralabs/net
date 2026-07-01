"""Pytest bootstrap shared by the whole suite.

Runs before any test module is imported, so it:
  * puts the repo root and the ``sso/`` package dir on ``sys.path`` so both
    Flask apps (``app`` and ``sso_app``) import cleanly, and
  * pins a dev-mode environment with deterministic test secrets, so importing
    either app never raises the production "missing secrets" guard and never
    reaches for the legacy insecure defaults.
"""

import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
for path in (ROOT, ROOT / 'sso'):
    if str(path) not in sys.path:
        sys.path.insert(0, str(path))

# Deterministic dev-mode config. setdefault so a real environment (e.g. CI that
# exports its own secrets) is never clobbered.
os.environ.setdefault('NET_DEV', '1')
os.environ.setdefault('SECRET_KEY', 'test-secret-key')
os.environ.setdefault('SSO_APP_SECRET', 'test-sso-app-secret')
os.environ.setdefault('SSO_SHARED_SECRET', 'test-sso-shared-secret')
os.environ.setdefault('EXCEL_PASSWORD', 'test-excel-password')
os.environ.setdefault('DEFAULT_USER_PASSWORD', 'Test-Default-1')
