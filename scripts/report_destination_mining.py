#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""报告线路数据中的目的地地点挖掘覆盖率。"""

import argparse
import json
from collections import Counter
from pathlib import Path

from detail_parsers import empty_detail
from geo_catalog import normalize_tour_geo
from merge_data import RAW_FILE_PRIORITIES, extract_days, guess_destination
from tour_blacklist import is_blacklisted_title


RAW_FILES = (
    "raw_jrt365_full.json",
    "raw_http_full.json",
    "raw_kanghui.json",
    "raw_pintu_full.json",
    "raw_saihuitong_full.json",
    "raw_gzl_api.json",
)


def load_raw_items(data_dir: Path) -> list[dict]:
    """按合并脚本的文件优先级读取原始线路，不修改任何文件。"""
    items = []
    for filename in RAW_FILES:
        path = data_dir / filename
        if not path.exists():
            continue
        with path.open("r", encoding="utf-8") as handle:
            data = json.load(handle)
        for item in data:
            if isinstance(item, dict):
                candidate = dict(item)
                candidate["_merge_priority"] = RAW_FILE_PRIORITIES.get(filename, 0)
                items.append(candidate)
    return items


def _deduplicate(items: list[dict]) -> list[dict]:
    seen = {}
    for item in items:
        key = "|".join(
            (
                str(item.get("source") or ""),
                str(item.get("title") or ""),
                str(item.get("price") or ""),
            )
        )
        previous = seen.get(key)
        if previous is None or item.get("_merge_priority", 0) < previous.get("_merge_priority", 0):
            seen[key] = item
    return list(seen.values())


def build_report(raw_items: list[dict]) -> dict:
    """统计原始线路的地理挖掘结果；不触发爬虫、网络请求或生产数据写入。"""
    deduped = _deduplicate(raw_items)
    valid = [
        item
        for item in deduped
        if item.get("price", 0) > 0
        and len(str(item.get("title") or "")) > 5
        and (extract_days(str(item.get("title") or "")) or item.get("days", 0))
        and not is_blacklisted_title(str(item.get("title") or ""))
    ]
    tours = []
    for raw in valid:
        title = str(raw.get("title") or "")
        destination = str(raw.get("destination") or "").strip() or guess_destination(title)
        geo_fields, _ = normalize_tour_geo(raw, title, destination, empty_detail())
        tours.append({"title": title, **geo_fields})

    source_counts = Counter(tour.get("geoSource", "unknown") for tour in tours)
    place_counts = Counter(
        tour.get("destinationPlaceName")
        for tour in tours
        if tour.get("destinationPlaceName")
    )
    possible_departure_confusion = [
        {
            "title": tour.get("title", ""),
            "departureCity": tour.get("departureCity", ""),
            "destinationPlaceName": tour.get("destinationPlaceName", ""),
        }
        for tour in tours
        if tour.get("geoSource") == "title-place-miner"
        and tour.get("departureCity")
        and tour.get("departureCity") == tour.get("destinationPlaceName")
    ]
    return {
        "rawCount": len(raw_items),
        "dedupedCount": len(deduped),
        "validCount": len(valid),
        "convertedCount": len(tours),
        "geoSourceCounts": dict(sorted(source_counts.items())),
        "titleMinerCount": source_counts.get("title-place-miner", 0),
        "titleMinerRate": round(source_counts.get("title-place-miner", 0) / len(tours), 4) if tours else 0,
        "namedPlaceCounts": dict(place_counts.most_common()),
        "possibleDepartureConfusion": possible_departure_confusion,
    }


def print_report(report: dict) -> None:
    print("目的地地点挖掘覆盖率")
    print(f"原始线路: {report['rawCount']}")
    print(f"去重线路: {report['dedupedCount']}")
    print(f"有效线路: {report['validCount']}")
    print(f"可转换线路: {report['convertedCount']}")
    print(f"标题挖掘命中: {report['titleMinerCount']} ({report['titleMinerRate']:.2%})")
    print("地理来源:")
    for source, count in report["geoSourceCounts"].items():
        print(f"  {source}: {count}")
    print("高频命名地点:")
    for name, count in list(report["namedPlaceCounts"].items())[:20]:
        print(f"  {name}: {count}")
    print(f"疑似出发地混淆: {len(report['possibleDepartureConfusion'])}")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, help="可选：将 JSON 报告写入指定路径")
    args = parser.parse_args()

    repo_root = Path(__file__).resolve().parent.parent
    report = build_report(load_raw_items(repo_root / "src" / "data"))
    print_report(report)
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"JSON 报告: {args.output}")


if __name__ == "__main__":
    main()
