#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""康辉存量线路的途径景点（itinerary[].activities）回填。

背景：_parse_cct_detail 原先不提取 activities，导致康辉（新站 m.cct.cn）线路的
行程日只有 description 散文、没有结构化景点；DETAIL_FETCH_MODE=geo 下 CI 会一直
复用这份缺字段的缓存详情。解析器修好后，存量线路用本脚本一次性补齐。

按 make_tour_key（source|title|price）把 tours.json 与 raw_kanghui_cct.json 对上，
重新抓取 cct.cn 详情页并回填：
  - itinerary 里已有日程：仅回填空缺的 activities（不覆盖已有值）
  - itinerary 整体为空：若详情解析出行程则整段回填

用法:
    python scripts/backfill_kanghui_activities.py --dry-run
    python scripts/backfill_kanghui_activities.py --limit 20
输出:
    直接改写 public/data/tours.json（紧凑 JSON，与 merge_data.py 一致），
    随后由 data:split / 下轮 merge 重建分片。
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from detail_parsers import _parse_cct_detail  # noqa: E402
from merge_data import make_tour_key, write_json_atomically  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
TOURS_PATH = ROOT / "public" / "data" / "tours.json"
RAW_PATH = ROOT / "src" / "data" / "raw_kanghui_cct.json"


def load_raw_kanghui() -> dict[str, dict]:
    data = json.loads(RAW_PATH.read_text(encoding="utf-8"))
    items = data if isinstance(data, list) else data.get("items") or data.get("data") or []
    raws: dict[str, dict] = {}
    for item in items:
        url = str(item.get("url") or "")
        if "cct.cn" not in url:
            continue  # 旧站 gz.cctpage.com 已死，跳过
        raws.setdefault(make_tour_key(item), item)
    return raws


def day_needs_activities(day: dict) -> bool:
    return not (day.get("activities") or [])


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=None, help="最多回填 N 条")
    parser.add_argument("--workers", type=int, default=8)
    parser.add_argument("--dry-run", action="store_true", help="只统计，不写回")
    args = parser.parse_args()

    tours = json.loads(TOURS_PATH.read_text(encoding="utf-8"))
    raws = load_raw_kanghui()
    print(f"[tours.json] {len(tours)} 条；[raw] cct.cn 可匹配 {len(raws)} 条")

    targets = []
    for tour in tours:
        if tour.get("source") != "康辉":
            continue
        raw = raws.get(make_tour_key(tour))
        if not raw:
            continue
        itinerary = tour.get("itinerary") or []
        if itinerary and not any(day_needs_activities(day) for day in itinerary):
            continue  # 全部日程已有 activities
        targets.append((tour, raw))
    print(f"[待回填] {len(targets)} 条（itinerary 缺 activities 或整体缺失）")
    if args.limit:
        targets = targets[:args.limit]
    if not targets or args.dry_run:
        return 0

    done = patched_activities = patched_itinerary = 0

    def fetch(raw: dict) -> dict:
        return _parse_cct_detail(raw)

    with ThreadPoolExecutor(max_workers=args.workers) as executor:
        future_map = {executor.submit(fetch, raw): (tour, raw) for tour, raw in targets}
        for idx, future in enumerate(as_completed(future_map), 1):
            tour, _raw = future_map[future]
            try:
                detail = future.result()
            except Exception as exc:  # noqa: BLE001
                print(f"  [detail] {tour.get('title', '')[:30]} -> {exc}")
                detail = {}
            detail_days = {
                int(day.get("day") or 0): day for day in (detail.get("itinerary") or [])
            }
            itinerary = tour.get("itinerary") or []
            if not itinerary and detail.get("itinerary"):
                tour["itinerary"] = detail["itinerary"]
                patched_itinerary += 1
            else:
                for day in itinerary:
                    detail_day = detail_days.get(int(day.get("day") or 0))
                    if not detail_day:
                        continue
                    activities = detail_day.get("activities") or []
                    if activities and day_needs_activities(day):
                        day["activities"] = activities
                        patched_activities += 1
            done += 1
            if idx % 50 == 0 or idx == len(targets):
                print(f"  [进度] {idx}/{len(targets)}")

    print(
        f"[完成] 抓取 {done} 条；整段补 itinerary {patched_itinerary} 条，"
        f"补 activities {patched_activities} 条"
    )
    write_json_atomically(str(TOURS_PATH), tours)
    print(f"[保存] {TOURS_PATH}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
