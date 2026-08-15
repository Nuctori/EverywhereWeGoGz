#!/usr/bin/env python3
"""Scan one domain (default m.gdcts.com) — fast, no cross-domain hangs."""
import json
import ssl
import sys
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent.parent
CARDS_PATH = ROOT / "public" / "data" / "tour-map-cards.json"
TIMEOUT = 6
CONCURRENCY = 12
TARGET_DOMAIN = sys.argv[1] if len(sys.argv) > 1 else "m.gdcts.com"


def probe(url):
    req = urllib.request.Request(
        url,
        method="HEAD",
        headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"},
    )
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
            return resp.status
    except urllib.error.HTTPError as error:
        return error.code
    except (ssl.SSLCertVerificationError, ssl.SSLError):
        return 0
    except (OSError, urllib.error.URLError):
        try:
            get_req = urllib.request.Request(
                url,
                headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"},
            )
            with urllib.request.urlopen(get_req, timeout=TIMEOUT) as resp:
                return resp.status
        except urllib.error.HTTPError as get_err:
            return get_err.code
        except (OSError, urllib.error.URLError):
            return 0


def main():
    try:
        cards = json.loads(CARDS_PATH.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        print(f"cannot read {CARDS_PATH}: {error}")
        return 1
    targets = [
        {"id": c.get("id"), "url": str(c.get("bookingUrl") or "")}
        for c in cards
        if urlparse(str(c.get("bookingUrl") or "")).netloc == TARGET_DOMAIN
    ]
    print(f"{TARGET_DOMAIN}: {len(targets)}", flush=True)
    results = []
    with ThreadPoolExecutor(max_workers=CONCURRENCY) as pool:
        futures = {pool.submit(probe, t["url"]): t for t in targets}
        for done, fut in enumerate(as_completed(futures), start=1):
            t = futures[fut]
            t["status"] = fut.result()
            results.append(t)
            if done % 250 == 0:
                print(f"  {done}/{len(targets)}", flush=True)
    bad = [r for r in results if r["status"] != 200]
    print(f"ok={len(results)-len(bad)} bad={len(bad)}")
    for r in bad[:30]:
        print(f"  [{r['status']}] {r['id']} {r['url'][:90]}")
    Path(f"scripts/_url_{TARGET_DOMAIN.replace('.', '_')}.json").write_text(
        json.dumps(bad, ensure_ascii=False, indent=1), encoding="utf-8"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
