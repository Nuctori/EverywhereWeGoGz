#!/usr/bin/env python3
"""上品旅行（gz.tootour.com）解析契约测试。

只跑离线 fixture，不联网：列表解析必须给出可入库的标题/价格/天数/链接，
详情解析必须给出行程与费用包含。任何一条不成立就退出 1。
"""

from __future__ import annotations

import json
import os
import sys

ROOT = os.path.dirname(os.path.abspath(__file__))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

FIXTURES = os.path.join(ROOT, "fixtures")

failures: list[str] = []


def check(condition: bool, message: str) -> None:
    if not condition:
        failures.append(message)


def main() -> int:
    from crawl_tootour_full import parse_detail, parse_listing

    listing_html = open(os.path.join(FIXTURES, "tootour_around.html"), encoding="utf-8").read()
    items = parse_listing(listing_html)

    check(len(items) >= 150, f"列表解析条数应 >=150，实际 {len(items)}")
    check(
        len({item['url'] for item in items}) == len(items),
        "同一次列表解析不应出现重复链接",
    )

    short = [item for item in items if 1 <= int(item.get("days") or 0) <= 3]
    check(len(short) >= 140, f"1-3 天线路应 >=140，实际 {len(short)}")

    bad = [item for item in items if not (item.get("title") and len(item["title"]) >= 6)]
    check(not bad, f"标题过短的条目 {len(bad)} 条：{[b.get('title') for b in bad[:3]]}")

    bad_price = [item for item in items if not isinstance(item.get("price"), int) or item["price"] <= 0]
    check(not bad_price, f"价格缺失/非正整数的条目 {len(bad_price)} 条")

    bad_url = [item for item in items if not str(item.get("url", "")).startswith("http://gz.tootour.com/travel/")]
    check(not bad_url, f"链接不是详情页的条目 {len(bad_url)} 条")

    bad_source = [item for item in items if item.get("source") != "上品旅行"]
    check(not bad_source, f"source 字段必须统一为「上品旅行」，异常 {len(bad_source)} 条")

    bad_departure = [item for item in items if item.get("departureCity") != "广州"]
    check(not bad_departure, f"出发地不是广州的条目 {len(bad_departure)} 条")

    missing_days = [item for item in items if not item.get("days")]
    check(not missing_days, f"天数为 0 的条目 {len(missing_days)} 条：{[m['title'][:20] for m in missing_days[:3]]}")

    detail_html = open(os.path.join(FIXTURES, "tootour_detail.html"), encoding="utf-8").read()
    detail = parse_detail(detail_html, "http://gz.tootour.com/travel/22766.html")

    check(len(detail.get("itinerary") or []) >= 2, f"详情行程应 >=2 天，实际 {len(detail.get('itinerary') or [])}")
    check(bool(detail.get("inclusions")), "详情应解析出费用包含项")
    check(int(detail.get("days") or 0) == 3, f"详情天数应为 3，实际 {detail.get('days')}")

    if failures:
        for message in failures:
            print(f"  ✗ {message}")
        print(json.dumps({"checked": "tootour-source", "ok": False, "failures": len(failures)}, ensure_ascii=False))
        return 1

    print(
        json.dumps(
            {
                "checked": "tootour-source",
                "ok": True,
                "items": len(items),
                "shortDays": len(short),
                "detailDays": detail.get("days"),
                "itineraryDays": len(detail.get("itinerary") or []),
            },
            ensure_ascii=False,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
