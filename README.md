# net — KneuraLabs Intranet

Flask-based intranet portal with SSO login, per-user password management, and
an encrypted Excel workbook (`DATA.xlsx`) as the user store.

## Components

- **`app.py`** — main intranet app. SSO-gated dashboard, first-login password
  change flow, encrypted `DATA.xlsx` user store (Fernet key derived from
  `EXCEL_PASSWORD` via PBKDF2).
- **`sso/sso_app.py`** — standalone SSO server (port 5001). Validates employees
  against the roster at `kneuralabs/ID/EmployeeData.xlsx` (cached in memory for
  1 hour, with fallback to the last good copy on fetch failure) and issues
  time-limited signed tokens (5 minutes).
- **`index.html` + `assets/`** — the public-facing frontend. **This is an
  export artifact from an external visual editor, not hand-written source.**
  The editable source of truth lives outside this repository and should be
  documented here by the owner (tool, project link, export procedure). Do not
  hand-edit these files; changes will be lost on the next export.
- **`scripts/fetch_governance_news.py`** — refreshes `assets/news.json`; run
  daily by `.github/workflows/governance-brief.yml`.

## Configuration

In production all secrets must come from the environment; the apps refuse to
start otherwise.

| Variable | Required | Purpose |
|---|---|---|
| `SECRET_KEY` | yes (app.py) | Flask session signing |
| `SSO_APP_SECRET` | recommended | SSO app session/flash signing |
| `SSO_SHARED_SECRET` | yes | Signs/verifies SSO tokens (must match in both apps) |
| `EXCEL_PASSWORD` | yes | Decrypts `DATA.xlsx` |
| `DEFAULT_USER_PASSWORD` | yes | First-login onboarding password |
| `SSO_URL` | no | SSO server URL (default `https://sso.kneuralabs.com`) |
| `INTRANET_BASE_URL` | no | Intranet base URL for callbacks |

Local development: set `NET_DEV=1` (or `FLASK_DEBUG=1`). To use the legacy
committed dev defaults you must additionally set
`NET_ALLOW_INSECURE_DEFAULTS=1`; a loud warning is emitted. Never use these
outside local development.

## Running locally

```bash
pip install -r requirements.txt
export NET_DEV=1 NET_ALLOW_INSECURE_DEFAULTS=1
python sso/sso_app.py   # SSO on :5001
python app.py           # intranet
```

## Known limitations

- `DATA.xlsx` as a user database does not scale (file I/O per request, no
  locking/indexes). Recommended migration: SQLite/PostgreSQL with the existing
  bcrypt hashes.
- No deployment workflow exists in this repo; document or automate how
  `app.py` and `sso/sso_app.py` are deployed.
