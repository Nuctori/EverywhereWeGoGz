#!/usr/bin/env python3
"""Fix 康辉 bookingUrls: gz.cctpage.com (dead host) -> cct.cn keyword search.

gz.cctpage.com died 2026-08 (invalid cert + 404). 康辉 products now live on
cct.cn; prodcodes cannot be mapped to cct.cn product ids, so the bookingUrl
becomes the new site's keyword search (same target the frontend fallback used).

Rewrites tour-map-cards.json + tour-map-place-cards/*.json (source=康辉).
"""
import json
import urllib.parse
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "public" / "data"
CCTPAGE = "cctpage.com"
SEARCH = "https://www.cct.cn/search?keyword="


def fix_item(item):
    if str(item.get("source")) != "康辉":
        return False
    url = str(item.get("bookingUrl") or "")
    if CCTPAGE not in url:
        return False
    title = str(item.get("title") or "").strip()
    if not title:
        return False
    item["bookingUrl"] = f"{SEARCH}{urllib.parse.quote(title[:20])}"
    return True


def main():
    changed_files = 0
    changed_items = 0
    # all data files that may carry bookingUrl (map cards, place cards,
    # tour lists/pages/index/summary)
    targets = [
        DATA / "tour-map-cards.json",
        DATA / "tours.json",
        DATA / "tours-index.json",
        DATA / "tours-list.json",
    ]
    targets.extend(sorted((DATA / "tour-map-place-cards").rglob("*.json")))
    targets.extend(sorted(DATA.glob("tours-page-*.json")))
    for path in targets:
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as error:
            print(f"skip {path.name}: {error}")
            continue
        if isinstance(data, dict):
            items = data.get("items") if isinstance(data.get("items"), list) else []
        else:
            items = data if isinstance(data, list) else []
        n = sum(1 for item in items if fix_item(item))
        if n:
            path.write_text(
                json.dumps(data, ensure_ascii=False, indent=1) + "\n",
                encoding="utf-8",
            )
            changed_files += 1
            changed_items += n
    print(f"fixed {changed_items} bookingUrls across {changed_files} files")


if __name__ == "__main__":
    main()
