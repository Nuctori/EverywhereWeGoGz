#!/usr/bin/env python3
"""Full scan of ALL tour-map-cards bookingUrls — find every unreachable URL.

HEAD-first probe (fast), GET fallback, low concurrency to avoid source WAFs.
Writes a report + the unreachable list for triage.
Usage: python scripts/scan_all_booking_urls.py
"""
import json
import re
import ssl
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CARDS_PATH = ROOT / "public" / "data" / "tour-map-cards.json"
OUT_PATH = ROOT / "scripts" / "_url_scan_report.json"
TIMEOUT = 10
CONCURRENCY = 10


def probe(url):
    """Return (status, kind) where kind is a bucket for triage."""
    ctx = ssl.create_default_context()
    req = urllib.request.Request(
        url,
        method="HEAD",
        headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"},
    )
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT, context=ctx) as resp:
            return resp.status, "ok"
    except urllib.error.HTTPError as error:
        return error.code, "http"
    except (ssl.SSLCertVerificationError, ssl.SSLError):
        return 0, "ssl"
    except (OSError, urllib.error.URLError):
        # HEAD may be rejected; try GET once
        try:
            get_req = urllib.request.Request(
                url,
                headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"},
            )
            with urllib.request.urlopen(get_req, timeout=TIMEOUT, context=ctx) as resp:
                return resp.status, "ok-get"
        except urllib.error.HTTPError as get_err:
            return get_err.code, "http-get"
        except (OSError, urllib.error.URLError):
            return 0, "net"


def main():
    try:
        cards = json.loads(CARDS_PATH.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        print(f"cannot read {CARDS_PATH}: {error}")
        return 1
    print(f"cards: {len(cards)}")
    targets = []
    for card in cards:
        url = str(card.get("bookingUrl") or "").strip()
        tid = str(card.get("id") or "")
        if not url:
            targets.append({"id": tid, "url": "", "status": -1, "kind": "no-url"})
            continue
        if not re.match(r"^https?://", url):
            targets.append({"id": tid, "url": url, "status": -2, "kind": "bad-url"})
            continue
        targets.append({"id": tid, "url": url, "status": 0, "kind": ""})

    results = []
    with ThreadPoolExecutor(max_workers=CONCURRENCY) as pool:
        futures = {pool.submit(probe, t["url"]): t for t in targets if t["url"]}
        for done, fut in enumerate(as_completed(futures), start=1):
            t = futures[fut]
            status, kind = fut.result()
            t["status"] = status
            t["kind"] = kind
            results.append(t)
            if done % 500 == 0:
                print(f"  probed {done}/{len(futures)}")

    for t in targets:
        if not t["url"]:
            results.append(t)

    unreachable = [r for r in results if r["status"] != 200]
    reachable = [r for r in results if r["status"] == 200]
    print(f"reachable: {len(reachable)}/{len(results)}")
    kind_counts = {}
    for r in unreachable:
        kind_counts[r["kind"]] = kind_counts.get(r["kind"], 0) + 1
    print(f"unreachable by kind: {kind_counts}")
    OUT_PATH.write_text(
        json.dumps(
            {"total": len(results), "reachable": len(reachable), "unreachable": unreachable},
            ensure_ascii=False,
            indent=1,
        ),
        encoding="utf-8",
    )
    print(f"report -> {OUT_PATH}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
