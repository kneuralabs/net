#!/usr/bin/env python3
"""Fetch authentic AI-governance headlines and write assets/news.json.

Runs daily in CI (see .github/workflows/governance-brief.yml). Pulls real,
dated articles from Google News RSS (which aggregates real publishers), then
normalises them into the shape the intranet Daily Governance Brief renders.

No fabricated content: if no genuine items are retrieved the existing
assets/news.json is left untouched and the script exits non-zero.
"""

import json
import re
import sys
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "assets" / "news.json"

# Authentic source: Google News RSS search, restricted to AI governance / policy.
FEEDS = [
    "https://news.google.com/rss/search?q=%22AI%20governance%22%20OR%20%22AI%20regulation%22%20OR%20%22AI%20policy%22%20OR%20%22AI%20Act%22&hl=en-US&gl=US&ceid=US:en",
    "https://news.google.com/rss/search?q=%22AI%20safety%22%20OR%20%22AI%20oversight%22%20OR%20%22AI%20governance%22%20when:7d&hl=en-US&gl=US&ceid=US:en",
]

MON = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN",
       "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"]

HEADERS = {
    "User-Agent": ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                   "AppleWebKit/537.36 (KHTML, like Gecko) "
                   "Chrome/124.0 Safari/537.36"),
    "Accept": "application/rss+xml, application/xml, text/xml, */*",
}


def brief_date(dt: datetime) -> str:
    return f"{dt.day:02d} {MON[dt.month - 1]} {dt.year}"


def classify_chip(title: str) -> str:
    s = title.lower()
    if re.search(r"regulat|\bact\b|\blaw\b|\bbill\b|legislat", s):
        return "Regulation"
    if re.search(r"framework|standard|\bnist\b|\biso\b|guideline", s):
        return "Framework"
    if re.search(r"fine|enforce|penalt|lawsuit|\bban\b", s):
        return "Enforcement"
    if re.search(r"\beu\b|brussels|white house|federal|government|ministry|meity|oecd", s):
        return "Policy"
    return "Industry"


def fetch(url: str) -> bytes:
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.read()


def parse_items(xml_bytes: bytes):
    root = ET.fromstring(xml_bytes)
    for item in root.iter("item"):
        title = (item.findtext("title") or "").strip()
        link = (item.findtext("link") or "").strip()
        if not title or not link:
            continue
        src_el = item.find("source")
        src = (src_el.text or "").strip() if src_el is not None else ""
        # Google News titles read "Headline - Publisher"; trim the publisher.
        if src and title.endswith(" - " + src):
            title = title[: -(len(src) + 3)].strip()
        elif " - " in title and not src:
            head, _, tail = title.rpartition(" - ")
            if 0 < len(tail) <= 40:
                title, src = head.strip(), tail.strip()
        pub = item.findtext("pubDate")
        try:
            dt = parsedate_to_datetime(pub) if pub else datetime.now(timezone.utc)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
        except Exception:
            dt = datetime.now(timezone.utc)
        yield {
            "_dt": dt,
            "date": brief_date(dt),
            "chip": classify_chip(title),
            "title": title,
            "src": src or "Newswire",
            "tag": "Google News",
            "url": link,
        }


def main() -> int:
    collected = []
    seen_titles = set()
    errors = []
    for feed in FEEDS:
        try:
            for it in parse_items(fetch(feed)):
                key = it["title"].lower()[:80]
                if key in seen_titles:
                    continue
                seen_titles.add(key)
                collected.append(it)
        except Exception as e:  # noqa: BLE001 — keep going, other feeds may work
            errors.append(f"{feed}: {type(e).__name__}: {e}")

    if not collected:
        print("No authentic items retrieved; leaving news.json untouched.",
              file=sys.stderr)
        for e in errors:
            print("  -", e, file=sys.stderr)
        return 1

    collected.sort(key=lambda x: x["_dt"], reverse=True)
    items = []
    for it in collected[:6]:
        it.pop("_dt", None)
        items.append(it)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(items, ensure_ascii=False, indent=2) + "\n",
                   encoding="utf-8")
    print(f"Wrote {len(items)} authentic items to {OUT}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
