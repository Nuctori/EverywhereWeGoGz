#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""把上车点数据回填进已有目录（public/data/tours.json）。

merge_data.py 的完整流程需重新抓取全部源站，成本高；本脚本只做一次按 URL 的字段
回填，然后由 split_tour_data.mjs 分发到 list/page/detail 各产物。

用法:
    python scripts/backfill_boarding_points.py            # 写入
    python scripts/backfill_boarding_points.py --dry-run  # 只看命中数
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from merge_data import boarding_for  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
TOURS_JSON = ROOT / "public" / "data" / "tours.json"


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    if not TOURS_JSON.exists():
        print(f"目录文件不存在: {TOURS_JSON}")
        return 1

    tours = json.loads(TOURS_JSON.read_text(encoding="utf-8"))
    if not isinstance(tours, list):
        print("tours.json 结构不是数组，已中止")
        return 1

    filled = 0
    hits_by_source: dict[str, int] = {}
    for tour in tours:
        if not isinstance(tour, dict):
            continue
        payload = boarding_for({"url": tour.get("bookingUrl")})
        if payload:
            # 关键：即使上一轮已写入也要覆盖，避免解析规则改进后残留旧值
            tour["boarding"] = payload
            filled += 1
            src = str(tour.get("source") or "?")
            hits_by_source[src] = hits_by_source.get(src, 0) + 1
        elif "boarding" in tour:
            del tour["boarding"]

    print(f"线路总数 {len(tours)} | 回填上车点 {filled}")
    for src, count in sorted(hits_by_source.items(), key=lambda kv: -kv[1]):
        print(f"  {src}: {count}")

    if args.dry_run:
        print("(dry-run，未写入)")
        return 0

    TOURS_JSON.write_text(
        json.dumps(tours, ensure_ascii=False, separators=(",", ":")), encoding="utf-8"
    )
    print(f"已写入 {TOURS_JSON}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
