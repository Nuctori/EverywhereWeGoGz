#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Resolve mined tour destination labels against the local OSM POI index."""

from __future__ import annotations

import json
import math
import re
from pathlib import Path


DEFAULT_INDEX_PATH = Path(__file__).resolve().parent.parent / "public" / "data" / "osm-poi-index.json"
GENERIC_NAMES = {
    "酒店", "宾馆", "客栈", "当地酒店", "参考酒店", "豪华酒店", "度假村", "温泉酒店",
    "建设", "开发", "无色", "无味", "早餐后", "晚餐后", "入住后",
}
MAX_UNVERIFIED_CITY_DISTANCE_KM = 45
INTERNATIONAL_TITLE_MARKERS = (
    "\u51fa\u5883", "\u5883\u5916", "\u6b27\u6d32", "\u4e1c\u6b27", "\u897f\u6b27", "\u5357\u6b27", "\u5317\u6b27",
    "\u5965\u6377\u5308", "\u5e03\u8fbe\u4f69\u65af", "\u7ef4\u4e5f\u7eb3", "\u5e03\u62c9\u683c", "\u591a\u7459\u6cb3",
    "\u7f8e\u6cc9\u5bab", "\u7533\u6839", "\u56fd\u9645\u822a\u73ed", "\u6469\u6d1b\u54e5", "\u5730\u4e2d\u6d77",
    "\u90ae\u8f6e", "\u897f\u610f\u6cd5\u7a81", "\u7a81\u5c3c\u65af", "\u57c3\u53ca", "\u571f\u8033\u5176",
    "\u65e5\u672c", "\u6cf0\u56fd", "\u8d8a\u5357", "\u7f8e\u56fd", "\u52a0\u62ff\u5927", "\u6fb3\u5927\u5229\u4e9a",
    "\u65b0\u897f\u5170", "\u975e\u6d32", "\u7f8e\u6d32", "\u963f\u8054\u914b",
)
REGION_POI_MARKERS = tuple(
    "\u6e29\u6cc9 \u9152\u5e97 \u5bbe\u9986 \u666f\u533a \u4e50\u56ed \u53e4\u9547 \u53e4\u57ce \u5c71\u5e84 \u5ea6\u5047 \u516c\u56ed \u6e56 \u5c9b \u4e16\u754c \u5e84\u56ed".split()
)


def is_international_route_title(title: object) -> bool:
    value = str(title or "")
    return any(marker in value for marker in INTERNATIONAL_TITLE_MARKERS)


def normalize_name(value: object) -> str:
    return re.sub(r"[^0-9A-Za-z\u4e00-\u9fff]", "", str(value or "")).lower()


def _candidate_names(poi: dict) -> list[str]:
    return [str(value).strip() for value in [poi.get("name"), *(poi.get("aliases") or [])] if str(value).strip()]


def _lookup_keys(value: str) -> set[str]:
    normalized = normalize_name(value)
    if not normalized:
        return set()
    keys = {normalized, normalized.replace("大酒店", "酒店")}
    for suffix in ("度假酒店", "度假村", "风景区", "景区", "酒店", "宾馆", "温泉", "乐园"):
        if normalized.endswith(suffix) and len(normalized) > len(suffix) + 1:
            keys.add(normalized[:-len(suffix)])
    keys.update(normalized[:length] for length in range(4, min(len(normalized), 12) + 1))
    return keys


VENUE_SUFFIXES = (
    "风景名胜区", "温泉度假区", "旅游度假区", "温泉度假酒店", "度假酒店",
    "温泉酒店", "大酒店", "度假村", "风景区", "景区", "温泉", "酒店",
    "宾馆", "客栈", "民宿", "山庄", "公园", "乐园",
)


def _venue_base(value: str) -> str:
    normalized = normalize_name(value)
    changed = True
    while changed:
        changed = False
        for suffix in VENUE_SUFFIXES:
            if normalized.endswith(suffix) and len(normalized) > len(suffix) + 1:
                normalized = normalized[: -len(suffix)]
                changed = True
                break
    return normalized


def _build_name_lookup(pois: list[dict]) -> dict[str, list[dict]]:
    lookup: dict[str, list[dict]] = {}
    for poi in pois:
        for name in _candidate_names(poi):
            for key in _lookup_keys(name):
                lookup.setdefault(key, []).append(poi)
    return lookup


def load_poi_index(path: Path = DEFAULT_INDEX_PATH) -> list[dict]:
    if not path.exists():
        return []
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return []
    pois = payload.get("pois") if isinstance(payload, dict) else None
    return [poi for poi in pois if isinstance(poi, dict)] if isinstance(pois, list) else []


def _name_score(queries: set[str], candidate: str, *, allow_suffix_match: bool = False) -> int:
    if candidate in queries:
        return 100
    if not allow_suffix_match:
        return 0
    candidate_without_hotel_modifier = candidate.replace("大酒店", "酒店")
    for query in queries:
        query_without_hotel_modifier = query.replace("大酒店", "酒店")
        if query_without_hotel_modifier == candidate_without_hotel_modifier:
            return 96
        if len(query_without_hotel_modifier) >= 4 and (
            query_without_hotel_modifier in candidate_without_hotel_modifier
            or candidate_without_hotel_modifier in query_without_hotel_modifier
        ):
            return 90
        query_base = _venue_base(query_without_hotel_modifier)
        candidate_base = _venue_base(candidate_without_hotel_modifier)
        if len(query_base) >= 3 and query_base == candidate_base:
            return 94
    return 0


def _candidate_labels(tour: dict) -> list[str]:
    """Try mined source-detail names when the current point is only a city."""
    labels = []
    current = str(tour.get("destinationPlaceName") or "").strip()
    resolution = tour.get("geoResolution") if isinstance(tour.get("geoResolution"), dict) else {}
    mining = resolution.get("mining") if isinstance(resolution.get("mining"), dict) else {}
    rows = [
        row for row in mining.get("sourceCandidates", [])
        if isinstance(row, dict) and str(row.get("label") or "").strip()
    ]
    rows.sort(key=lambda row: (-int(row.get("priority") or 0), len(str(row.get("label") or ""))))
    mined_rows = [str(row["label"]).strip() for row in rows]
    candidate_labels = mining.get("candidateLabels")
    mined_labels = [
        str(label).strip()
        for label in (candidate_labels if isinstance(candidate_labels, list) else [])
        if str(label).strip()
    ]
    mined = list(dict.fromkeys([*mined_rows, *mined_labels]))
    city = normalize_name(tour.get("destinationCity"))
    current_name = normalize_name(current)
    current_tail = current_name[len(city):] if city and current_name.startswith(city) else current_name

    def supports_current(label: str) -> bool:
        candidate = normalize_name(label)
        return bool(
            current_name
            and (
                current_name == candidate
                or current_name in candidate
                or candidate in current_name
                or len(current_tail) >= 3 and current_tail in candidate
            )
        )

    if current and current_name != city:
        labels.extend(label for label in mined if supports_current(label))
        if not labels and not mined:
            labels.append(current)
    else:
        labels.extend(mined)
        if current:
            labels.append(current)
    return list(dict.fromkeys(label for label in labels if label and normalize_name(label) not in {
        normalize_name(name) for name in GENERIC_NAMES
    }))


def _distance_km(latitude_a: object, longitude_a: object, latitude_b: object, longitude_b: object) -> float | None:
    try:
        lat_a, lon_a, lat_b, lon_b = (float(value) for value in (latitude_a, longitude_a, latitude_b, longitude_b))
    except (TypeError, ValueError):
        return None
    if not (-90 <= lat_a <= 90 and -90 <= lat_b <= 90 and -180 <= lon_a <= 180 and -180 <= lon_b <= 180):
        return None
    lat_delta = math.radians(lat_b - lat_a)
    lon_delta = math.radians(lon_b - lon_a)
    haversine = math.sin(lat_delta / 2) ** 2 + math.cos(math.radians(lat_a)) * math.cos(math.radians(lat_b)) * math.sin(lon_delta / 2) ** 2
    return 6371 * 2 * math.asin(math.sqrt(haversine))


def _is_region_context(city: str, province: str) -> bool:
    """A province-level destination must not be treated as a confirmed city."""
    return bool(city and province and (city == province or city in province or province in city))


def _is_specific_region_query(query: str, candidate_names: list[str], primary_name: str, kind: str, score: int) -> bool:
    """Allow exact named POIs, but reject a short city/brand token matching a hotel suffix."""
    if score >= 100 and (query == primary_name or kind == "attraction"):
        return True
    if any(marker in query for marker in REGION_POI_MARKERS):
        return True
    return len(query) >= 4 and any(
        any(marker in name for marker in REGION_POI_MARKERS)
        for name in candidate_names
    ) and len(query) >= 4


def resolve_poi(
    label: str,
    *,
    expected_city: str = "",
    expected_province: str = "",
    expected_latitude: object = None,
    expected_longitude: object = None,
    pois: list[dict],
    poi_lookup: dict[str, list[dict]] | None = None,
) -> dict | None:
    query = normalize_name(label)
    if not query or query in {normalize_name(name) for name in GENERIC_NAMES}:
        return None
    city = normalize_name(expected_city)
    province = normalize_name(expected_province)
    exact_queries = {query}
    # Feeds often prefix an otherwise exact hotel name with its confirmed city.
    # Removing only that explicit context preserves exact matching semantics.
    if city and query.startswith(city) and len(query) > len(city):
        exact_queries.add(query[len(city):])
    if poi_lookup is None:
        candidate_pois = pois
    else:
        candidate_pois = []
        seen_ids = set()
        query_keys = {
            key
            for query in exact_queries
            for key in _lookup_keys(query)
        }
        for key in query_keys:
            for poi in poi_lookup.get(key, []):
                identity = str(poi.get("osmId") or id(poi))
                if identity not in seen_ids:
                    candidate_pois.append(poi)
                    seen_ids.add(identity)
    ranked: list[tuple[int, dict]] = []
    for poi in candidate_pois:
        if poi.get("coordinateSystem") != "wgs84" or poi.get("kind") not in {"hotel", "attraction"}:
            continue
        candidate_names = _candidate_names(poi)
        normalized_candidate_names = [normalize_name(name) for name in candidate_names]
        score = max(
            (
                _name_score(
                    exact_queries,
                    name,
                    allow_suffix_match=bool(city),
                )
                for name in normalized_candidate_names
            ),
            default=0,
        )
        if score == 0:
            continue
        address = poi.get("address") if isinstance(poi.get("address"), dict) else {}
        city_context = normalize_name(" ".join(str(address.get(key) or "") for key in ("city", "district", "locality")))
        province_context = normalize_name(str(address.get("province") or ""))
        # A city-prefixed tour title is useful disambiguation, not a cosmetic
        # prefix. Do not replace a city fallback with an equally named POI in
        # another city when OSM supplies neither matching address nor name.
        region_context = _is_region_context(city, province)
        city_confirmed = not city or (not region_context and city in city_context)
        # Region labels may be absent from older OSM objects, but a present and
        # conflicting province is decisive evidence that the POI is wrong.
        if province and province_context and province not in province_context:
            continue
        if not city_confirmed:
            if not province or not province_context or province not in province_context:
                continue
            if region_context and not _is_specific_region_query(
                query,
                normalized_candidate_names,
                normalize_name(poi.get("name")),
                str(poi.get("kind") or ""),
                score,
            ):
                continue
            if not region_context:
                distance = _distance_km(expected_latitude, expected_longitude, poi.get("latitude"), poi.get("longitude"))
                if distance is None or distance > MAX_UNVERIFIED_CITY_DISTANCE_KM:
                    continue
        context = f"{city_context} {province_context}"
        if city and city in context:
            score += 8
        if province and province in context:
            score += 4
        ranked.append((score, poi))
    if not ranked:
        return None
    ranked.sort(key=lambda item: (-item[0], str(item[1].get("osmId") or "")))
    score, winner = ranked[0]
    # Same-name hotels are common. Without enough regional context to separate
    # the top two candidates, leave the tour at its existing precision.
    if len(ranked) > 1 and ranked[1][0] >= score - 4:
        return None
    try:
        latitude = float(winner["latitude"])
        longitude = float(winner["longitude"])
    except (KeyError, TypeError, ValueError):
        return None
    if not (-90 <= latitude <= 90 and -180 <= longitude <= 180):
        return None
    return {"latitude": latitude, "longitude": longitude, "address": dict(winner.get("address") or {}), "osmId": winner.get("osmId"), "kind": winner.get("kind")}


def enrich_tours_from_osm(tours: list[dict], index_path: Path = DEFAULT_INDEX_PATH) -> tuple[int, int]:
    pois = load_poi_index(index_path)
    if not pois:
        return 0, 0
    poi_lookup = _build_name_lookup(pois)
    candidates = 0
    resolved = 0
    for tour in tours:
        city = normalize_name(tour.get("destinationCity"))
        province = normalize_name(tour.get("destinationProvince"))
        if is_international_route_title(tour.get("title")) and _is_region_context(city, province):
            continue
        current_source = str(tour.get("destinationCoordinateSource") or "")
        if current_source in {"geocoder", "osm"}:
            continue
        labels = _candidate_labels(tour)
        if not labels:
            continue
        candidates += 1
        label = ""
        result = None
        for candidate_label in labels:
            result = resolve_poi(
                candidate_label,
                expected_city=str(tour.get("destinationCity") or ""),
                expected_province=str(tour.get("destinationProvince") or ""),
                expected_latitude=tour.get("destinationLatitude"),
                expected_longitude=tour.get("destinationLongitude"),
                pois=pois,
                poi_lookup=poi_lookup,
            )
            if result:
                label = candidate_label
                break
        if not result:
            continue
        tour["destinationPlaceName"] = label
        tour["destinationLatitude"] = result["latitude"]
        tour["destinationLongitude"] = result["longitude"]
        tour["destinationGeoLevel"] = "poi"
        tour["destinationCoordinatePrecision"] = "exact"
        tour["destinationCoordinateSource"] = "osm"
        tour["geoConfidence"] = "high"
        tour["geoSource"] = "osm"
        address = result["address"]
        if address:
            tour["destinationAddress"] = address
            tour["destinationLocality"] = address.get("locality") or address.get("district") or tour.get("destinationLocality", "")
        resolution = tour.get("geoResolution")
        if isinstance(resolution, dict):
            resolution["osm"] = {
                "status": "resolved-source-candidate" if label != str(tour.get("destinationCity") or "") else "resolved",
                "label": label,
            }
            resolution.setdefault("mining", {})["resolvedCandidate"] = label
        meta = tour.setdefault("meta", {})
        quality = meta.setdefault("dataQuality", {})
        field_sources = quality.setdefault("fieldSources", {})
        for field in ("destinationLatitude", "destinationLongitude", "destinationLocality", "destinationAddress"):
            field_sources[field] = "source"
        resolved += 1
    return candidates, resolved
