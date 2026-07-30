#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Resolve mined destination names through cached, public geocoders.

The runtime never calls a geocoder. This script is part of the data refresh
pipeline and keeps the network result in a small, reviewable cache.
"""

from __future__ import annotations

import json
import re
import time
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request, urlopen


CACHE_PATH = Path(__file__).with_name("geo-geocode-cache.json")
USER_AGENT = "laoguang-travel-map/1.0 (+https://github.com/)"
REQUEST_TIMEOUT_SECONDS = 8
MIN_REQUEST_INTERVAL_SECONDS = 1.1
_last_request_at = 0.0

GEOCODER_ENDPOINTS = (
    ("arcgis", "https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates"),
    ("nominatim", "https://nominatim.openstreetmap.org/search"),
)

ADMIN_CONTEXT_PATTERN = re.compile(r"([\u4e00-\u9fff]{2,8}(?:省|市|县|区|镇|街道))")
GENERIC_NAME_PARTS = {
    "中国", "广东", "广西", "湖南", "江西", "福建", "海南", "肇庆", "温泉", "酒店", "森林", "旅游",
}


def normalize_query(value: str) -> str:
    return re.sub(r"\s+", " ", str(value or "").strip().lower())


def _load_cache(path: Path = CACHE_PATH) -> dict:
    if not path.exists():
        return {}
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {}
    return value if isinstance(value, dict) else {}


def _write_cache(cache: dict, path: Path = CACHE_PATH) -> None:
    path.write_text(json.dumps(cache, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def _context_terms(title: str) -> list[str]:
    terms = []
    for match in ADMIN_CONTEXT_PATTERN.finditer(str(title or "")):
        value = match.group(1)
        if value not in terms and not value.endswith(("出发", "往返")):
            terms.append(value)
    return terms


def _title_inserted_context(title: str, label: str, city: str) -> list[str]:
    if not city or not label.startswith(city):
        return []
    label_tail = label[len(city):]
    if not label_tail:
        return []
    city_index = str(title or "").find(city)
    if city_index < 0:
        return []
    anchor = label_tail[:2]
    tail_index = str(title or "").find(anchor, city_index + len(city))
    if tail_index <= city_index + len(city):
        return []
    inserted = str(title or "")[city_index + len(city):tail_index]
    inserted = re.sub(r"^[\s\-—至到往返]+|[\s\-—至到往返]+$", "", inserted)
    return [inserted] if inserted and len(inserted) <= 12 else []


def destination_queries(tour: dict) -> list[str]:
    label = str(tour.get("destinationPlaceName") or "").strip()
    city = str(tour.get("destinationCity") or "").strip()
    province = str(tour.get("destinationProvince") or "").strip()
    if not label or not city or label == city:
        return []

    title = str(tour.get("title") or "")
    context = list(dict.fromkeys(_title_inserted_context(title, label, city) + _context_terms(title)))
    parts = [label, *context, province, "中国"]
    queries = [" ".join(part for part in parts if part)]
    queries.append(" ".join(part for part in (label, province, "中国") if part))
    return list(dict.fromkeys(normalize_query(query) for query in queries if query))


def _request_json(endpoint: str, params: dict) -> dict | list | None:
    global _last_request_at
    elapsed = time.monotonic() - _last_request_at
    if elapsed < MIN_REQUEST_INTERVAL_SECONDS:
        time.sleep(MIN_REQUEST_INTERVAL_SECONDS - elapsed)
    request = Request(
        f"{endpoint}?{urlencode(params)}",
        headers={"User-Agent": USER_AGENT, "Accept": "application/json"},
    )
    try:
        with urlopen(request, timeout=REQUEST_TIMEOUT_SECONDS) as response:
            _last_request_at = time.monotonic()
            return json.loads(response.read().decode("utf-8"))
    except (OSError, ValueError, json.JSONDecodeError):
        _last_request_at = time.monotonic()
        return None


def _name_tokens(label: str) -> list[str]:
    chunks = re.findall(r"[\u4e00-\u9fff]{2,}", label)
    return [chunk for chunk in chunks if chunk not in GENERIC_NAME_PARTS]


def _has_named_evidence(label: str, text: str) -> bool:
    tokens = _name_tokens(label)
    return bool(tokens) and any(token in text for token in tokens)


def _arcgis_result(label: str, payload: dict | list | None) -> dict | None:
    candidates = payload.get("candidates", []) if isinstance(payload, dict) else []
    for item in candidates:
        if not isinstance(item, dict) or not isinstance(item.get("location"), dict):
            continue
        address = str(item.get("address") or "")
        score = float(item.get("score") or 0)
        if score < 70 or not _has_named_evidence(label, address):
            continue
        location = item["location"]
        return {
            "latitude": float(location["y"]),
            "longitude": float(location["x"]),
            "displayName": address,
            "level": "town" if any(token in address for token in ("镇", "街道")) else "poi",
            "locality": address,
            "providerScore": score,
        }
    return None


def _nominatim_result(label: str, payload: dict | list | None) -> dict | None:
    candidates = payload if isinstance(payload, list) else []
    for item in candidates:
        if not isinstance(item, dict):
            continue
        display_name = str(item.get("display_name") or "")
        if not _has_named_evidence(label, display_name):
            continue
        address = item.get("address") if isinstance(item.get("address"), dict) else {}
        locality = str(address.get("town") or address.get("village") or address.get("county") or "")
        return {
            "latitude": float(item["lat"]),
            "longitude": float(item["lon"]),
            "displayName": display_name,
            "level": "town" if locality and locality.endswith(("镇", "街道")) else "poi",
            "locality": locality,
            "providerScore": 80,
        }
    return None


def geocode_query(label: str, query: str) -> dict | None:
    for provider, endpoint in GEOCODER_ENDPOINTS:
        if provider == "arcgis":
            result = _arcgis_result(label, _request_json(endpoint, {"SingleLine": query, "f": "json", "maxLocations": 5}))
        else:
            result = _nominatim_result(label, _request_json(endpoint, {
                "q": query,
                "format": "jsonv2",
                "limit": 5,
                "accept-language": "zh-CN",
            }))
        if result:
            return {"provider": provider, "query": query, **result}
    return None


def _apply_result(tour: dict, result: dict) -> None:
    tour["destinationLatitude"] = result["latitude"]
    tour["destinationLongitude"] = result["longitude"]
    tour["destinationGeoLevel"] = result["level"]
    if result.get("locality"):
        tour["destinationLocality"] = result["locality"]
    tour["destinationCoordinateSource"] = "geocoder"
    tour["geoConfidence"] = "medium"
    tour["geoSource"] = "geocoder"
    meta = tour.setdefault("meta", {})
    quality = meta.setdefault("dataQuality", {})
    quality.setdefault("fieldSources", {})["destinationLatitude"] = "inferred"
    quality["fieldSources"]["destinationLongitude"] = "inferred"
    quality["fieldSources"]["destinationLocality"] = "inferred"


def enrich_tours(tours: list[dict], allow_network: bool = False, cache_path: Path = CACHE_PATH) -> tuple[int, int]:
    cache = _load_cache(cache_path)
    resolved = 0
    candidates = 0
    changed = False
    for tour in tours:
        if tour.get("destinationCoordinateSource") in {"catalog", "geocoder"}:
            continue
        queries = destination_queries(tour)
        if not queries:
            continue
        candidates += 1
        result = None
        for query in queries:
            result = cache.get(normalize_query(query))
            if isinstance(result, dict):
                break
        if result is None and allow_network:
            label = str(tour.get("destinationPlaceName") or "")
            for query in queries:
                result = geocode_query(label, query)
                if result:
                    cache[normalize_query(query)] = result
                    changed = True
                    break
        if isinstance(result, dict) and result.get("latitude") is not None:
            _apply_result(tour, result)
            resolved += 1
    if changed:
        _write_cache(cache, cache_path)
    return candidates, resolved


if __name__ == "__main__":
    raise SystemExit("Import enrich_tours from rebuild_geo_data.py")
