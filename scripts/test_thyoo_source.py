#!/usr/bin/env python3
"""广州康辉（thyoo.com）解析契约测试。

列表页只给精选卡片，真正的元数据在详情页：出发地/目的地/班期/上车点/行程。
本测试锁定这些字段的解析契约，全部离线跑 fixture。
"""

from __future__ import annotations

import json
import os
import re
import sys
import tempfile

ROOT = os.path.dirname(os.path.abspath(__file__))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

FIXTURES = os.path.join(ROOT, "fixtures")

failures: list[str] = []


def check(condition: bool, message: str) -> None:
    if not condition:
        failures.append(message)


def main() -> int:
    from crawl_thyoo_full import is_challenge_page, parse_detail, parse_travel_listing

    # 反爬挑战页识别：源站限流时下发 985B 混淆脚本（无 <loc>），必须识别成"本轮无数据"
    # 而不是当成 sitemap 解析出 0 条 → 误清空存量。
    check(
        is_challenge_page('<script>function a(a){function n(){var a={wQzOV:_0x649a("0x4")}}}</script>'),
        "应识别出 JS 挑战页",
    )
    check(not is_challenge_page('<urlset><url><loc>https://www.thyoo.com/travel/1.html</loc></url></urlset>'), "正常 sitemap 不应判定为挑战页")

    listing_html = open(os.path.join(FIXTURES, "thyoo_travel.html"), encoding="utf-8").read()
    items = parse_travel_listing(listing_html)
    check(len(items) >= 40, f"全线路页解析条数应 >=40，实际 {len(items)}")
    check(
        all(str(item.get("url", "")).startswith("https://www.thyoo.com/travel/") for item in items),
        "列表链接必须指向 thyoo 详情页",
    )
    check(all(isinstance(item.get("price"), int) and item["price"] > 0 for item in items), "列表价格必须是正整数")

    detail_html = open(os.path.join(FIXTURES, "thyoo_detail.html"), encoding="utf-8").read()
    detail = parse_detail(detail_html, "https://www.thyoo.com/travel/22571.html")

    check("珠海" in str(detail.get("title") or ""), f"标题解析失败：{detail.get('title')!r}")
    check(detail.get("price") == 1339, f"价格应取班期最低价 1339，实际 {detail.get('price')}")
    check(detail.get("days") == 3, f"天数应为 3，实际 {detail.get('days')}")
    check("广州" in str(detail.get("departureCity") or ""), f"出发地应为广州，实际 {detail.get('departureCity')!r}")
    check("珠海" in str(detail.get("destination") or ""), f"目的地应含珠海，实际 {detail.get('destination')!r}")
    check(detail.get("sourceCode") == "SP6970015", f"产品编号解析失败：{detail.get('sourceCode')!r}")

    dates = detail.get("departureDates") or []
    check(len(dates) == 6, f"班期应有 6 个，实际 {len(dates)}：{dates[:3]}")
    check(
        all(re.fullmatch(r"\d{4}-\d{2}-\d{2}", str(d)) for d in dates),
        f"班期必须归一化成 YYYY-MM-DD：{dates[:3]}",
    )

    boarding = detail.get("boarding") or []
    check(len(boarding) >= 2, f"上车点应解析出 >=2 个，实际 {len(boarding)}：{boarding}")
    check(
        any("昌岗" in str(point.get("place") or "") for point in boarding),
        f"上车点地点解析失败：{boarding}",
    )
    check(
        any(str(point.get("time") or "") == "08:45" for point in boarding),
        f"上车点时间解析失败：{boarding}",
    )

    itinerary = detail.get("itinerary") or []
    check(len(itinerary) >= 1, f"行程应 >=1 天，实际 {len(itinerary)}")
    check(bool((itinerary[0] if itinerary else {}).get("description")), "首日行程描述不应为空")
    check(bool(detail.get("inclusions")), "费用包含应解析出内容")

    # 上车点缓存：merge 的 boarding_for() 按 URL 取 points，格式必须与
    # enrich_boarding_points.py 产物一致，否则富集等于白跑。
    import crawl_thyoo_full as thyoo

    with tempfile.TemporaryDirectory() as tmpdir:
        board_path = os.path.join(tmpdir, "thyoo.json")
        original = thyoo.BOARDING_PATH
        thyoo.BOARDING_PATH = board_path
        try:
            written = thyoo._write_boarding_cache([detail])
            payload = json.load(open(board_path, encoding="utf-8"))
        finally:
            thyoo.BOARDING_PATH = original
        check(written == 1, f"应写入 1 条上车点缓存，实际 {written}")
        entry = (payload.get("items") or {}).get("https://www.thyoo.com/travel/22571.html") or {}
        points = entry.get("points") or []
        check(len(points) == 2, f"上车点缓存应有 2 个点，实际 {points}")
        check(any("08:45" in point and "昌岗" in point for point in points), f"上车点格式应为「时间 地点」：{points}")

    if failures:
        for message in failures:
            print(f"  ✗ {message}")
        print(json.dumps({"checked": "thyoo-source", "ok": False, "failures": len(failures)}, ensure_ascii=False))
        return 1

    print(
        json.dumps(
            {
                "checked": "thyoo-source",
                "ok": True,
                "listItems": len(items),
                "departureDates": len(dates),
                "boardingPoints": len(boarding),
                "itineraryDays": len(itinerary),
            },
            ensure_ascii=False,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
