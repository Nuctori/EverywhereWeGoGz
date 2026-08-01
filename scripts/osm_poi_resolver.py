#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Resolve mined tour destination labels against the local OSM POI index."""

from __future__ import annotations

import json
import math
import re
from pathlib import Path


DEFAULT_INDEX_PATH = Path(__file__).resolve().parent.parent / "public" / "data" / "osm-poi-index.json"
GENERIC_NAMES = {"酒店", "宾馆", "客栈", "当地酒店", "参考酒店", "豪华酒店", "度假村", "温泉酒店"}
MAX_UNVERIFIED_CITY_DISTANCE_KM = 30


def normalize_name(value: object) -> str:
    return re.sub(r"[^0-9A-Za-z\u4e00-\u9fff]", "", str(value or "")).lower()


def _candidate_names(poi: dict) -> list[str]:
    return [str(value).strip() for value in [poi.get("name"), *(poi.get("aliases") or [])] if str(value).strip()]


def load_poi_index(path: Path = DEFAULT_INDEX_PATH) -> list[dict]:
    if not path.exists():
        return []
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return []
    pois = payload.get("pois") if isinstance(payload, dict) else None
    return [poi for poi in pois if isinstance(poi, dict)] if isinstance(pois, list) else []


def _name_score(queries: set[str], candidate: str) -> int:
    if candidate in queries:
        return 100
    return 0


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


def resolve_poi(
    label: str,
    *,
    expected_city: str = "",
    expected_province: str = "",
    expected_latitude: object = None,
    expected_longitude: object = None,
    pois: list[dict],
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
    ranked: list[tuple[int, dict]] = []
    for poi in pois:
        if poi.get("coordinateSystem") != "wgs84" or poi.get("kind") not in {"hotel", "attraction"}:
            continue
        candidate_names = _candidate_names(poi)
        normalized_candidate_names = [normalize_name(name) for name in candidate_names]
        score = max((_name_score(exact_queries, name) for name in normalized_candidate_names), default=0)
        if score == 0:
            continue
        address = poi.get("address") if isinstance(poi.get("address"), dict) else {}
        city_context = normalize_name(" ".join(str(address.get(key) or "") for key in ("city", "district", "locality")))
        province_context = normalize_name(str(address.get("province") or ""))
        # A city-prefixed tour title is useful disambiguation, not a cosmetic
        # prefix. Do not replace a city fallback with an equally named POI in
        # another city when OSM supplies neither matching address nor name.
        city_confirmed = not city or city in city_context or any(city in name for name in normalized_candidate_names)
        # Region labels may be absent from older OSM objects, but a present and
        # conflicting province is decisive evidence that the POI is wrong.
        if province and province_context and province not in province_context:
            continue
        if not city_confirmed:
            if not province or not province_context or province not in province_context:
                continue
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
    candidates = 0
    resolved = 0
    for tour in tours:
        current_source = str(tour.get("destinationCoordinateSource") or "")
        if current_source in {"geocoder", "osm"}:
            continue
        label = str(tour.get("destinationPlaceName") or "").strip()
        if not label:
            continue
        candidates += 1
        result = resolve_poi(
            label,
            expected_city=str(tour.get("destinationCity") or ""),
            expected_province=str(tour.get("destinationProvince") or ""),
            expected_latitude=tour.get("destinationLatitude"),
            expected_longitude=tour.get("destinationLongitude"),
            pois=pois,
        )
        if not result:
            continue
        tour["destinationLatitude"] = result["latitude"]
        tour["destinationLongitude"] = result["longitude"]
        tour["destinationGeoLevel"] = "poi"
        tour["destinationCoordinatePrecision"] = "poi"
        tour["destinationCoordinateSource"] = "osm"
        tour["geoConfidence"] = "high"
        tour["geoSource"] = "osm"
        address = result["address"]
        if address:
            tour["destinationAddress"] = address
            tour["destinationLocality"] = address.get("locality") or address.get("district") or tour.get("destinationLocality", "")
        meta = tour.setdefault("meta", {})
        quality = meta.setdefault("dataQuality", {})
        field_sources = quality.setdefault("fieldSources", {})
        for field in ("destinationLatitude", "destinationLongitude", "destinationLocality", "destinationAddress"):
            field_sources[field] = "source"
        resolved += 1
    return candidates, resolved
