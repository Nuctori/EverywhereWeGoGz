#!/usr/bin/env python3
"""Per-domain URL scan: each source domain gets its own pool so a slow/WAF
domain (cct.cn) never blocks fast ones. DNS is resolved once per host first.
Writes partial results every 250 probes.
"""

import json
import ssl
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent.parent
CARDS_PATH = ROOT / "public" / "data" / "tour-map-cards.json"
OUT_PATH = ROOT / "scripts" / "_url_scan_report.json"
PARTIAL_PATH = ROOT / "scripts" / "_url_scan_partial.json"
TIMEOUT = 6
DOMAIN_CONCURRENCY = 8


def probe(url):
    req = urllib.request.Request(
        url,
        method="HEAD",
        headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
            "Accept-Encoding": "gzip, deflate",
            "Accept": "text/html,application/xhtml+xml",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=8) as resp:
            return resp.status
    except urllib.error.HTTPError as error:
        return error.code
    except (ssl.SSLCertVerificationError, ssl.SSLError):
        return 0
    except (OSError, urllib.error.URLError):
        try:
            get_req = urllib.request.Request(
                url,
                headers={
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
                    "Accept-Encoding": "gzip, deflate",
                    "Accept": "text/html,application/xhtml+xml",
                },
            )
            with urllib.request.urlopen(get_req, timeout=15) as resp:
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
    print(f"cards: {len(cards)}")

    by_domain = {}
    for card in cards:
        url = str(card.get("bookingUrl") or "").strip()
        tid = str(card.get("id") or "")
        if not url:
            by_domain.setdefault("_none", []).append(
                {"id": tid, "url": "", "status": -1, "kind": "no-url"}
            )
            continue
        if not url.startswith(("http://", "https://")):
            by_domain.setdefault("_bad", []).append(
                {"id": tid, "url": url, "status": -2, "kind": "bad-url"}
            )
            continue
        host = urlparse(url).netloc
        by_domain.setdefault(host, []).append(
            {"id": tid, "url": url, "status": 0, "kind": ""}
        )

    all_results = []
    for host, targets in sorted(by_domain.items(), key=lambda kv: -len(kv[1])):
        if host.startswith("_") or not targets or not targets[0]["url"]:
            all_results.extend(targets)
            continue
        print(f"domain {host}: {len(targets)}", flush=True)
        results = []
        with ThreadPoolExecutor(max_workers=DOMAIN_CONCURRENCY) as pool:
            futures = {pool.submit(probe, t["url"]): t for t in targets}
            for done, fut in enumerate(as_completed(futures), start=1):
                t = futures[fut]
                status, kind = fut.result()
                t["status"] = status
                t["kind"] = kind
                results.append(t)
                if done % 250 == 0:
                    print(f"  {host} {done}/{len(targets)}", flush=True)
        all_results.extend(results)

    unreachable = [r for r in all_results if r["status"] != 200]
    reachable = [r for r in all_results if r["status"] == 200]
    print(f"reachable: {len(reachable)}/{len(all_results)}")
    kind_counts = {}
    for r in unreachable:
        kind_counts[r["kind"]] = kind_counts.get(r["kind"], 0) + 1
    print(f"unreachable by kind: {kind_counts}")
    OUT_PATH.write_text(
        json.dumps(
            {
                "total": len(all_results),
                "reachable": len(reachable),
                "unreachable": unreachable,
            },
            ensure_ascii=False,
            indent=1,
        ),
        encoding="utf-8",
    )
    print(f"report -> {OUT_PATH}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
