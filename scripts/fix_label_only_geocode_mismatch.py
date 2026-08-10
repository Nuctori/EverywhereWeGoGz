#!/usr/bin/env python3
"""Clear wrong geocoder pins that were matched on a bare label.

Two classes:
1. 硅谷 -> 长春市硅谷街道: an international route label matched a same-named
   Chinese administrative division and the wrong city was written back.
2. International route + Chinese subdivision city (镇/村/街道/乡): e.g.
   柏林 -> 重庆柏林镇, 珍珠港 -> 广西江平镇, 黑山(国) -> 辽宁西关村.

Clearing the wrong fields lets the next rebuild re-resolve from the catalog /
OSM index, or leave the tour unmapped instead of mis-pinned.
"""

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TOURS_PATH = ROOT / "public" / "data" / "tours.json"

GEO_FIELDS = (
    "destinationCity",
    "destinationPlaceName",
    "destinationProvince",
    "destinationCountry",
    "destinationLatitude",
    "destinationLongitude",
    "destinationGeoLevel",
    "destinationLocality",
    "destinationCoordinateSource",
    "destinationCoordinatePrecision",
    "destinationAddress",
    "geoConfidence",
    "geoSource",
    "geoStatus",
)

INTERNATIONAL_MARKERS = (
    "出境",
    "境外",
    "欧洲",
    "东欧",
    "西欧",
    "南欧",
    "北欧",
    "奥地利",
    "匈牙利",
    "捷克",
    "布达佩斯",
    "维也纳",
    "布拉格",
    "多瑙河",
    "美泉宫",
    "申根",
    "国际航班",
    "摩洛哥",
    "地中海",
    "邮轮",
    "西意法突",
    "突尼斯",
    "埃及",
    "土耳其",
    "日本",
    "泰国",
    "越南",
    "美国",
    "加拿大",
    "澳大利亚",
    "新西兰",
    "非洲",
    "美洲",
    "阿联酋",
    "夏威夷",
    "德国",
    "法国",
    "意大利",
    "瑞士",
    "西班牙",
    "葡萄牙",
    "希腊",
    "俄罗斯",
    "圣彼得堡",
    "莫斯科",
    "马尔代夫",
    "沙巴",
    "济州岛",
    "巴厘岛",
)
SUBDIVISION_SUFFIXES = ("镇", "村", "街道", "乡")


def is_international_route(title: str) -> bool:
    return any(marker in title for marker in INTERNATIONAL_MARKERS)


def strip_mined_label(tour: dict, label: str) -> None:
    resolution = tour.get("geoResolution")
    if not isinstance(resolution, dict):
        return
    mining = resolution.get("mining")
    if not isinstance(mining, dict):
        return
    mining.pop("resolvedCandidate", None)
    rows = mining.get("sourceCandidates")
    if isinstance(rows, list):
        mining["sourceCandidates"] = [
            row
            for row in rows
            if not (isinstance(row, dict) and row.get("label") == label)
        ]


def clear_geo_fields(tour: dict) -> None:
    for key in GEO_FIELDS:
        tour.pop(key, None)


def main() -> int:
    try:
        with TOURS_PATH.open(encoding="utf-8-sig") as handle:
            tours = json.load(handle)
    except (OSError, json.JSONDecodeError) as error:
        print(f"load failed: {error}", file=sys.stderr)
        return 1

    cleared = 0
    reasons = []
    for tour in tours:
        place = str(tour.get("destinationPlaceName") or "")
        city = str(tour.get("destinationCity") or "")
        title = str(tour.get("title") or "")
        source = str(tour.get("destinationCoordinateSource") or "")

        label_only_mismatch = place == "硅谷" and city == "长春市"
        intl_subdivision = (
            is_international_route(title)
            and city.endswith(SUBDIVISION_SUFFIXES)
            and source in {"geocoder", "osm"}
        )
        if not (label_only_mismatch or intl_subdivision):
            continue
        reason = "label-only" if label_only_mismatch else "intl-subdivision"
        clear_geo_fields(tour)
        strip_mined_label(tour, place)
        reasons.append(f"{tour.get('id')}:{place}->{city}({reason})")
        cleared += 1

    if cleared:
        with TOURS_PATH.open("w", encoding="utf-8", newline="\n") as handle:
            json.dump(tours, handle, ensure_ascii=False, separators=(",", ":"))
            handle.write("\n")
    print(f"cleared wrong geocoder pins on {cleared} tours")
    for reason in reasons:
        print(reason)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
