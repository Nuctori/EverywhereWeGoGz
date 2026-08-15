#!/usr/bin/env python3
"""Booking-URL health gate (python/urllib — node fetch is WAF-blocked by cct.cn).

Stratified sample of tour-map-cards bookingUrls, probed through the SAME
resolution logic as src/lib/source-detail-url.ts (frontend), so CI measures the
URL a user actually lands on:
  - 康辉 bookingUrl (gz.cctpage.com, dead host) -> cct.cn keyword search
  - 假日通 bookingUrl (groupno detail) first, keyword search only if invalid
Fails when reachability drops below FAIL_BELOW_PCT — a source outage (康辉
cctpage 2026-08) or a dead fallback must surface within a week, not rot.

Usage: python scripts/check_booking_urls.py [samplePerSource=10]
"""

import http.client
import json
import re
import ssl
import sys
import urllib.error
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SAMPLE_PER_SOURCE = (
    int(sys.argv[1]) if len(sys.argv) > 1 and sys.argv[1].isdigit() else 10
)
FAIL_BELOW_PCT = 90.0
TIMEOUT = 10
CONCURRENCY = 8
# 康辉 cct.cn WAF 限流并发探测 -> 串行 (D-046 follow-up, 发现-1): 串行下
# 503 = 真宕机, 恢复报警 — 全 503 时门禁必须 FAIL (原 503 豁免 = 宕机盲区).
KANGHUI_CONCURRENCY = 1
JRT365_KEYWORD = "http://www.jrt365.com/tourgroup/tourgroup_list.aspx?keyword="
JRT365_PRINT = "http://www.jrt365.com/tourname/tourname_ziliao_print.aspx?tournameno="
# 康辉 bookingUrls migrated from dead gz.cctpage.com to cct.cn keyword search
# (fix_kanghui_urls.py, 2026-08) — the gate probes live targets now. 404s
# (product delisted / not migrated to cct.cn) are excluded in the gate;
# network/ssl/5xx still fail.



def resolve_source_detail_url(card):
    """Mirror src/lib/source-detail-url.ts resolveSourceDetailUrl.

    Order matters (D-039): 假日通 stable tourname links (printUrl/tournameno)
    FIRST — the detail modal passes sourceAttributes once detail loading
    succeeds and users land on the stable print host; the groupno bookingUrl
    rotates/expires (0c771a658). The bookingUrl follows (map-card summaries
    carry no sourceAttributes — never degrade to a keyword search while a
    valid detail URL exists), keyword search last. Mirrors the TS resolver so
    the weekly gate probes the URL a user actually opens.
    """
    fallback = str(card.get("bookingUrl") or "").strip()
    title = str(card.get("title") or "").strip()
    source = str(card.get("source") or "").strip()
    if (
        source == "康辉"
        and ("cctpage.com" in fallback or not re.match(r"^https?:", fallback))
        and title
    ):
        return f"https://www.cct.cn/search?keyword={urllib.parse.quote(title[:20])}"
    if source == "假日通":
        attrs = (card.get("meta") or {}).get("sourceAttributes") or {}
        print_url = str(attrs.get("printUrl") or "").strip()
        if re.match(r"^https?:", print_url):
            return print_url
        tournameno = str(attrs.get("tournameno") or "").strip()
        if tournameno:
            return f"{JRT365_PRINT}{urllib.parse.quote(tournameno)}"
    if re.match(r"^https?:", fallback):
        return fallback
    if source != "假日通":
        return ""
    if title:
        return f"{JRT365_KEYWORD}{urllib.parse.quote(title[:20])}"
    return ""


def probe(url):
    """HEAD first with gzip/accept headers (gdcts/nn.gzl.cn need them, else
    huge uncompressed bodies time out). HEAD has no body — status 200 alone
    means reachable. ANY non-200 HEAD falls back to GET WITH gzip: every
    source whose HEAD is non-200 (nn.gzl.cn 403) needs gzip on GET; jrt365's
    HEAD is 200 so its GET+gzip connection-reset is never reached. A confirmed
    non-200 is a real failure."""
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "Accept-Encoding": "gzip, deflate",
        "Accept": "text/html,application/xhtml+xml",
    }
    req = urllib.request.Request(url, method="HEAD", headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return resp.status
    except urllib.error.HTTPError:
        pass  # non-200 HEAD — confirm via GET below
    except (OSError, urllib.error.URLError):
        pass
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            body = resp.read(300)
            return resp.status if len(body) > 50 else -1
    except urllib.error.HTTPError as error:
        return error.code
    except (OSError, urllib.error.URLError, http.client.IncompleteRead):
        return 0


def main():
    cards_path = ROOT / "public" / "data" / "tour-map-cards.json"
    try:
        cards = json.loads(cards_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        print(f"cannot read {cards_path}: {error}")
        sys.exit(2)

    by_source = {}
    for card in cards:
        source = str(card.get("source") or "?")
        by_source.setdefault(source, []).append(card)

    sample = []
    for source, entries in by_source.items():
        for card in entries[:SAMPLE_PER_SOURCE]:
            url = resolve_source_detail_url(card)
            if url:
                sample.append({"source": source, "id": card.get("id"), "url": url})

    results = []

    def run_batch(batch, workers):
        out = []
        with ThreadPoolExecutor(max_workers=workers) as pool:
            futures = {pool.submit(probe, item["url"]): item for item in batch}
            for fut in as_completed(futures):
                item = futures[fut]
                out.append({**item, "status": fut.result()})
        return out

    results = run_batch(
        [i for i in sample if i["source"] != "康辉"], CONCURRENCY
    ) + run_batch([i for i in sample if i["source"] == "康辉"], KANGHUI_CONCURRENCY)

    ok = [r for r in results if r["status"] == 200]
    # 404 = product delisted / not migrated to the new site (康辉 cct.cn only
    # indexes part of the old catalogue) — deterministic source-site fact,
    # excluded from the gate. 503/network/ssl/5xx = source down or broken
    # link — fail the gate (serial 康辉 probing removes WAF false-503s).
    gated = [r for r in results if r["status"] != 404]
    gated_ok = [r for r in gated if r["status"] == 200]
    pct = (len(ok) / len(results) * 100) if results else 100.0
    gated_pct = (len(gated_ok) / len(gated) * 100) if gated else 100.0
    print(
        f"URL health: {len(ok)}/{len(results)} reachable ({pct:.1f}%), "
        f"gated (excl. known-broken) {len(gated_ok)}/{len(gated)} ({gated_pct:.1f}%)"
    )
    by_source_stats = {}
    for r in results:
        s = by_source_stats.setdefault(r["source"], {"ok": 0, "total": 0})
        s["total"] += 1
        if r["status"] == 200:
            s["ok"] += 1
    for source, s in sorted(by_source_stats.items()):
        src_pct = s["ok"] / s["total"] * 100
        print(f"  {source}: {s['ok']}/{s['total']} ({src_pct:.0f}%)")
    failures = [r for r in results if r["status"] != 200][:8]
    if failures:
        print("failures:")
        for f in failures:
            print(f"  {f['source']} {f['id']} [{f['status']}] {f['url'][:90]}")

    if gated_pct < FAIL_BELOW_PCT:
        print(
            f"FAIL: gated reachability {gated_pct:.1f}% < {FAIL_BELOW_PCT:.0f}% threshold"
        )
        sys.exit(1)
    print(f"PASS: gated reachability {gated_pct:.1f}% >= {FAIL_BELOW_PCT:.0f}%")


if __name__ == "__main__":
    main()
