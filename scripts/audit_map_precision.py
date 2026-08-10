#!/usr/bin/env python3
"""Audit map marker precision from geo-places.json / tours.json.

The complaint class is "地点名被标到市镇": a place whose name is a specific
destination (hotel / resort / scenic area) but whose pin sits on the parent
city center. Those are produced by the coarse parent-city fallback
(coordinateSource=fallback). Legit region/country destinations are excluded.

Outputs one JSON line with the loop metrics.
"""

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PLACES_PATH = ROOT / "public" / "data" / "geo-places.json"
TOURS_PATH = ROOT / "public" / "data" / "tours.json"

POI_MARKERS = re.compile(
    r"(景区|公园|温泉|古镇|古城|度假|酒店|宾馆|客栈|山庄|庄园|乐园|草原|沙漠|雪山|冰川|"
    r"瀑布|海滩|码头|寺|宫|阁|塔|寨|沟|谷|洞|潭|泉|滩|林|湖|岛|湾|峰|山)"
)
ADMIN_NAMES = re.compile(
    r"^(香港|台湾|澳门|北京|上海|天津|重庆|广东|广西|湖南|湖北|江西|福建|海南|四川|云南|"
    r"贵州|山东|山西|河南|河北|辽宁|吉林|黑龙江|江苏|浙江|安徽|陕西|甘肃|青海|新疆|西藏|"
    r"内蒙古|宁夏|港澳|华东|青甘|东北|华北|西北|华南|东南亚|澳洲|欧洲|美洲|非洲)"
)
ADMIN_SUFFIXES = ("市", "县", "区", "镇", "旗", "乡", "街道")


def load_json(path: Path) -> list | None:
    try:
        with path.open(encoding="utf-8") as handle:
            value = json.load(handle)
    except (OSError, json.JSONDecodeError) as error:
        print(f"load failed {path}: {error}", file=sys.stderr)
        return None
    return value if isinstance(value, list) else None


def main() -> int:
    import argparse

    parser = argparse.ArgumentParser()
    parser.add_argument("--base", type=Path, default=ROOT / "public" / "data",
                        help="data dir (default public/data); use with git-extracted snapshots")
    args = parser.parse_args()
    reconfigure = getattr(sys.stdout, "reconfigure", None)
    if callable(reconfigure):
        reconfigure(encoding="utf-8")
    places = load_json(args.base / "geo-places.json")
    if places is None:
        return 1
    tours = load_json(args.base / "tours.json") or []

    by_level: dict[str, int] = {}
    by_source: dict[str, int] = {}
    for place in places:
        level = str(place.get("level") or "?")
        source = str(place.get("coordinateSource") or "?")
        by_level[level] = by_level.get(level, 0) + 1
        by_source[source] = by_source.get(source, 0) + 1

    fallback_total = 0
    fallback_coarse = []
    for place in places:
        if place.get("coordinateSource") != "fallback":
            continue
        fallback_total += 1
        if place.get("level") in {"region", "country"}:
            continue  # legitimately coarse (省份/区域目的地)
        name = str(place.get("name") or "").strip()
        if not name or ADMIN_NAMES.match(name) or name.endswith(ADMIN_SUFFIXES):
            continue
        fallback_coarse.append(place)

    dest_levels: dict[str, int] = {}
    for tour in tours:
        level = str(tour.get("destinationGeoLevel") or "none")
        has_coords = isinstance(
            tour.get("destinationLatitude"), (int, float)
        ) and isinstance(tour.get("destinationLongitude"), (int, float))
        if not has_coords:
            level = "unmapped"
        dest_levels[level] = dest_levels.get(level, 0) + 1
    destination_total = sum(dest_levels.values())
    precise = dest_levels.get("poi", 0) + dest_levels.get("town", 0)
    approximate = sum(
        count
        for level, count in dest_levels.items()
        if level in {"city", "region", "country"}
    )

    report = {
        "places_total": len(places),
        "by_level": by_level,
        "by_source": by_source,
        "fallback_total": fallback_total,
        "fallback_coarse_count": len(fallback_coarse),
        "fallback_coarse_examples": [
            str(p.get("name"))
            for p in sorted(fallback_coarse, key=lambda p: -(p.get("tourCount") or 0))[
                :10
            ]
        ],
        "tour_destinations": destination_total,
        "tour_dest_poi_town": precise,
        "tour_dest_city_region_country": approximate,
        "tour_precision_ratio": round(precise / destination_total, 3)
        if destination_total
        else 0,
    }
    print(json.dumps(report, ensure_ascii=False, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
