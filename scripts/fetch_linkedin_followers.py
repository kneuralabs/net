#!/usr/bin/env python3
"""Fetch the Kneuralabs LinkedIn follower count and write assets/linkedin.json.

Runs daily in CI (see .github/workflows/linkedin-followers.yml). Reads the
public company page, whose meta description carries the count
("Kneuralabs | N followers on LinkedIn"), and writes it for the intranet
LinkedIn widget to render at page load.

No fabricated numbers: if the count cannot be retrieved the existing
assets/linkedin.json is left untouched and the script exits non-zero.
"""

import json
import re
import sys
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "assets" / "linkedin.json"

PAGE_URL = "https://www.linkedin.com/company/kneuralabs/"

HEADERS = {
    "User-Agent": ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                   "AppleWebKit/537.36 (KHTML, like Gecko) "
                   "Chrome/124.0 Safari/537.36"),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
}


def fetch(url: str) -> str:
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.read().decode("utf-8", errors="replace")


def parse_followers(html: str) -> int | None:
    m = re.search(r"([\d][\d,.]*)\s+followers", html, re.IGNORECASE)
    if not m:
        return None
    return int(re.sub(r"\D", "", m.group(1)))


def main() -> int:
    try:
        followers = parse_followers(fetch(PAGE_URL))
    except Exception as e:  # noqa: BLE001 — any failure means "leave file alone"
        print(f"Fetch failed; leaving linkedin.json untouched: "
              f"{type(e).__name__}: {e}", file=sys.stderr)
        return 1

    if followers is None:
        print("No follower count found in page (auth wall?); "
              "leaving linkedin.json untouched.", file=sys.stderr)
        return 1

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({
        "followers": followers,
        "fetched": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "source": PAGE_URL,
    }, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote followers={followers} to {OUT}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
