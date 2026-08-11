#!/usr/bin/env python3
"""Clear wrong geocoder pins that were matched on a bare label.

Two classes:
1. 硅谷 -> 长春市硅谷街道: an international route label matched a same-named
   Chinese administrative division and the wrong city was written back.
2. International route + Chinese subdivision city (镇/村/街道/乡): e.g.
   柏林 -> 重庆柏林镇, 珍珠港 -> 广西江平镇, 黑山(国) -> 辽宁西关村.
3. Domestic generic marketing labels (餐饮 etc.) and subdivision cities whose
   province contradicts the route (应星楼 -> 江西唐江镇 on a 浙东南 route).

Clearing the wrong fields lets the next rebuild re-resolve from the catalog /
OSM index, or leave the tour unmapped instead of mis-pinned.
"""

import json
import os
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TOURS_PATH = ROOT / "public" / "data" / "tours.json"
GEOCODE_CACHE_PATH = ROOT / "scripts" / "geo-geocode-cache.json"


def purge_poisoned_cache(cleared_labels: set[str]) -> int:
    """Drop geocode-cache entries that produced wrong pins (e.g. 硅谷 中国).

    Without this, a later rebuild can re-apply the poisoned cached result and
    the wrong pin reappears ("clear -> reproduce" loop).
    """
    if not GEOCODE_CACHE_PATH.exists():
        return 0
    try:
        with GEOCODE_CACHE_PATH.open(encoding="utf-8") as handle:
            cache = json.load(handle)
    except (OSError, json.JSONDecodeError):
        return 0
    if not isinstance(cache, dict):
        return 0
    removed = 0
    kept = {}
    for key, value in cache.items():
        if any(label and label in str(key) for label in cleared_labels):
            removed += 1
            continue
        kept[key] = value
    if removed:
        fd, temp_name = tempfile.mkstemp(
            prefix=f".{GEOCODE_CACHE_PATH.name}.",
            suffix=".tmp",
            dir=GEOCODE_CACHE_PATH.parent,
        )
        try:
            with os.fdopen(fd, "w", encoding="utf-8") as handle:
                json.dump(kept, handle, ensure_ascii=False, indent=2)
                handle.write("\n")
            os.replace(temp_name, GEOCODE_CACHE_PATH)
        finally:
            if os.path.exists(temp_name):
                os.unlink(temp_name)
    return removed


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

# Space-separated single line: the auto-formatter repeatedly duplicated
# multi-line tuple entries; a single line + frozenset is immune to that.
_INTERNATIONAL_MARKERS_TEXT = (
    "出境 境外 欧洲 东欧 西欧 南欧 北欧 奥地利 匈牙利 捷克 布达佩斯 布拉格 "
    "多瑙河 美泉宫 申根 国际航班 摩洛哥 地中海 邮轮 西意法突 突尼斯 埃及 "
    "土耳其 日本 泰国 越南 美国 加拿大 澳大利亚 新西兰 非洲 美洲 阿联酋 "
    "夏威夷 德国 法国 意大利 瑞士 西班牙 葡萄牙 希腊 俄罗斯 莫斯科 马尔代夫 "
    "沙巴 济州岛 巴厘岛"
)
# 维也纳 excluded: 维也纳国际酒店 is a domestic hotel chain brand; including it
# would wrongly clear correct subdivision pins on domestic 维也纳-branded tours.
INTERNATIONAL_MARKERS = frozenset(_INTERNATIONAL_MARKERS_TEXT.split())

SUBDIVISION_SUFFIXES = ("镇", "村", "街道", "乡")

# Destination labels that are generic venue/marketing words, never real places.
GENERIC_LABELS = frozenset(
    (
        "餐饮",
        "住宿",
        "早餐",
        "午餐",
        "晚餐",
        "购物",
        "娱乐",
        "自理",
        "参考酒店",
        "当地酒店",
        "豪华酒店",
        "度假村",
        "温泉酒店",
        "酒店",
        "早餐后",
        "晚餐后",
        "入住后",
        "自由活动",
        "当地",
        "参考",
        "同级",
    )
)

# Province detection for the domestic province-conflict rule.
# Single-char abbreviations are only included when they are unambiguous in
# tour titles: 川 (银川), 新 (新会), 青 (青岛), 吉 (吉安), 黑 (黑山) and 桂
# (桂花) are common substrings of unrelated words and were dropped after
# false-positive clears. Full province names remain the primary signal.
PROVINCE_ALIASES = {
    "浙江": ("浙江", "浙"),
    "江西": ("江西", "赣"),
    "广东": ("广东", "粤"),
    "广西": ("广西",),
    "湖南": ("湖南", "湘"),
    "福建": ("福建", "闽"),
    "海南": ("海南", "琼"),
    "云南": ("云南", "滇"),
    "四川": ("四川", "蜀"),
    "贵州": ("贵州", "黔"),
    "重庆": ("重庆", "渝"),
    "江苏": ("江苏", "苏"),
    "安徽": ("安徽", "皖"),
    "湖北": ("湖北", "鄂"),
    "河南": ("河南", "豫"),
    "河北": ("河北", "冀"),
    "山东": ("山东", "鲁"),
    "山西": ("山西", "晋"),
    "陕西": ("陕西", "陕"),
    "甘肃": ("甘肃", "甘"),
    "青海": ("青海",),
    "新疆": ("新疆",),
    "西藏": ("西藏", "藏"),
    "宁夏": ("宁夏",),
    "内蒙古": ("内蒙古", "蒙"),
    "黑龙江": ("黑龙江",),
    "吉林": ("吉林",),
    "辽宁": ("辽宁", "辽"),
}


def title_provinces(title: str) -> set[str]:
    """Full province names mentioned in the title (via full names + abbreviations)."""
    found = set()
    for province, aliases in PROVINCE_ALIASES.items():
        if any(alias in title for alias in aliases):
            found.add(province)
    return found


def province_base(value: str) -> str:
    v = str(value or "").strip()
    for suffix in ("壮族自治区", "回族自治区", "维吾尔自治区", "自治区", "省", "市"):
        if v.endswith(suffix):
            return v[: -len(suffix)]
    return v


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
    cleared_labels: set[str] = set()
    for tour in tours:
        place = str(tour.get("destinationPlaceName") or "")
        city = str(tour.get("destinationCity") or "")
        title = str(tour.get("title") or "")
        source = str(tour.get("destinationCoordinateSource") or "")

        # Phantom-anchor purge: 龙门云顶酒店 = 龙门行 alias 云顶 + title 泰丽
        # 云顶酒店 collision. The stale destinationCity=龙门 (from an earlier
        # wrong pin) anchors _prefer_existing_city_candidate and overrides the
        # miner's correct 盐洲岛 every rebuild. Clear it so the next rebuild
        # resolves from the title.
        if "龙门云顶" in place and "盐洲岛" in title:
            clear_geo_fields(tour)
            cleared += 1
            reasons.append(f"{tour.get('id')}:{place}->(phantom-anchor)")
            continue

        label_only_mismatch = place == "硅谷" and city == "长春市"
        intl_subdivision = (
            is_international_route(title)
            and city.endswith(SUBDIVISION_SUFFIXES)
            and source in {"geocoder", "osm"}
        )
        # Domestic: a generic marketing word is never a real destination.
        generic_label = place in GENERIC_LABELS
        # Domestic: city is an admin subdivision whose province contradicts the
        # route (title names a different province, e.g. 应星楼->唐江镇(江西) on a
        # 浙东南 route). Excluded when the label is anchored to the city
        # (e.g. 乌镇西栅景区 in 乌镇: the label contains the city -> correct).
        domestic_province_conflict = False
        if (
            city.endswith(SUBDIVISION_SUFFIXES)
            and source in {"geocoder", "osm"}
            and place != city
            and city not in place
        ):
            city_province = province_base(str(tour.get("destinationProvince") or ""))
            title_provs = title_provinces(title)
            if city_province and title_provs and city_province not in title_provs:
                domestic_province_conflict = True
        if not (
            label_only_mismatch
            or intl_subdivision
            or generic_label
            or domestic_province_conflict
        ):
            continue
        reason = (
            "label-only"
            if label_only_mismatch
            else "intl-subdivision"
            if intl_subdivision
            else "generic-label"
            if generic_label
            else "domestic-province-conflict"
        )
        clear_geo_fields(tour)
        strip_mined_label(tour, place)
        if place:
            cleared_labels.add(place)
        reasons.append(f"{tour.get('id')}:{place}->{city}({reason})")
        cleared += 1

    if cleared:
        TOURS_PATH.parent.mkdir(parents=True, exist_ok=True)
        fd, temp_name = tempfile.mkstemp(
            prefix=f".{TOURS_PATH.name}.", suffix=".tmp", dir=TOURS_PATH.parent
        )
        try:
            with os.fdopen(fd, "w", encoding="utf-8", newline="\n") as handle:
                json.dump(tours, handle, ensure_ascii=False, separators=(",", ":"))
                handle.write("\n")
            os.replace(temp_name, TOURS_PATH)
        finally:
            if os.path.exists(temp_name):
                os.unlink(temp_name)
    cache_removed = purge_poisoned_cache(cleared_labels)
    print(f"cleared wrong geocoder pins on {cleared} tours")
    for reason in reasons:
        print(reason)
    if cache_removed:
        print(f"purged {cache_removed} poisoned geocode-cache entries")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
