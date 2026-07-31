#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Resolve mined tour destination labels against the local OSM POI index."""

from __future__ import annotations

import json
import re
from pathlib import Path


DEFAULT_INDEX_PATH = Path(__file__).resolve().parent.parent / "public" / "data" / "osm-poi-index.json"
GENERIC_NAMES = {"酒店", "宾馆", "客栈", "当地酒店", "参考酒店", "豪华酒店", "度假村", "温泉酒店"}


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


def resolve_poi(label: str, *, expected_city: str = "", expected_province: str = "", pois: list[dict]) -> dict | None:
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
        score = max((_name_score(exact_queries, normalize_name(name)) for name in _candidate_names(poi)), default=0)
        if score == 0:
            continue
        address = poi.get("address") if isinstance(poi.get("address"), dict) else {}
        context = normalize_name(" ".join(str(address.get(key) or "") for key in ("city", "district", "locality", "province")))
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
            pois=pois,
        )
        if not result:
            continue
        tour["destinationLatitude"] = result["latitude"]
        tour["destinationLongitude"] = result["longitude"]
        tour["destinationGeoLevel"] = "poi"
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
