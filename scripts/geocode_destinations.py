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
GEOCODER_POOL_FAILURE_LIMIT = 2
_last_request_at = 0.0
_provider_failures: dict[str, int] = {}

GEOCODER_POOL = (
    {
        "provider": "photon",
        "endpoint": "https://photon.komoot.io/api/",
        "timeout": 6,
    },
    {
        "provider": "nominatim",
        "endpoint": "https://nominatim.openstreetmap.org/search",
        "timeout": 8,
    },
    {
        "provider": "arcgis",
        "endpoint": "https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates",
        "timeout": 4,
    },
)
GEOCODER_PROVIDERS = {config["provider"] for config in GEOCODER_POOL}

ADMIN_CONTEXT_PATTERN = re.compile(r"([\u4e00-\u9fff]{2,8}(?:省|市|县|区|镇|街道))")
GENERIC_NAME_PARTS = {
    "中国", "广东", "广西", "湖南", "江西", "福建", "海南", "肇庆", "温泉", "酒店", "森林", "旅游",
}
POI_DESCRIPTIVE_SUFFIXES = ("景区", "风景区", "旅游区", "公园")


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
    place_label = label[len(city):].strip() if city and label.startswith(city) else label
    if place_label and place_label != label:
        queries.append(" ".join(part for part in (place_label, *context, city, province, "中国") if part))
        queries.append(" ".join(part for part in (
            place_label,
            *context,
            f"{city}市" if not city.endswith(("市", "县", "区")) else city,
            f"{province}省" if province and not province.endswith("省") else province,
            "中国",
        ) if part))
    return list(dict.fromkeys(normalize_query(query) for query in queries if query))


def _request_json(endpoint: str, params: dict, timeout: int = REQUEST_TIMEOUT_SECONDS) -> dict | list | None:
    global _last_request_at
    elapsed = time.monotonic() - _last_request_at
    if elapsed < MIN_REQUEST_INTERVAL_SECONDS:
        time.sleep(MIN_REQUEST_INTERVAL_SECONDS - elapsed)
    request = Request(
        f"{endpoint}?{urlencode(params)}",
        headers={"User-Agent": USER_AGENT, "Accept": "application/json"},
    )
    try:
        with urlopen(request, timeout=timeout) as response:
            _last_request_at = time.monotonic()
            return json.loads(response.read().decode("utf-8"))
    except (OSError, ValueError, json.JSONDecodeError):
        _last_request_at = time.monotonic()
        return None


def _admin_variants(value: str) -> set[str]:
    normalized = re.sub(r"\s+", "", str(value or ""))
    variants = {normalized} if normalized else set()
    if normalized.endswith(("省", "市", "县", "区", "旗")):
        variants.add(normalized[:-1])
    return variants


def _has_admin_evidence(expected_city: str, text: str) -> bool:
    normalized_text = re.sub(r"\s+", "", str(text or ""))
    variants = _admin_variants(expected_city)
    return bool(variants) and any(variant in normalized_text for variant in variants)


def _named_variants(label: str, expected_city: str = "") -> list[str]:
    normalized_label = re.sub(r"\s+", "", str(label or ""))
    city = re.sub(r"\s+", "", str(expected_city or ""))
    place_label = normalized_label[len(city):] if city and normalized_label.startswith(city) else normalized_label
    return list(dict.fromkeys(
        token for token in (normalized_label, place_label)
        if len(token) >= 2 and token not in GENERIC_NAME_PARTS and token != city
    ))


def _strip_admin_suffixes(value: str) -> str:
    normalized = re.sub(r"\s+", "", str(value or ""))
    return re.sub(r"(?:街道|省|市|县|区|旗|镇)", "", normalized)


def _contains_named_variant(text: str, variant: str) -> bool:
    start = 0
    while True:
        index = text.find(variant, start)
        if index < 0:
            return False
        tail = text[index + len(variant):]
        if not tail or tail[0] in "，。；;、, /／()（）[]【】|-—至到":
            return True
        if any(tail.startswith(suffix) for suffix in POI_DESCRIPTIVE_SUFFIXES):
            return True
        start = index + 1


def _has_named_evidence(label: str, text: str, expected_city: str = "") -> bool:
    normalized_text = re.sub(r"\s+", "", str(text or ""))
    normalized_text_without_admin_suffixes = _strip_admin_suffixes(normalized_text)
    variants = _named_variants(label, expected_city)
    return bool(variants) and any(
        _contains_named_variant(normalized_text, variant)
        or _contains_named_variant(normalized_text_without_admin_suffixes, variant)
        for variant in variants
    )


def _named_result_quality(label: str, name: str, expected_city: str = "") -> int:
    normalized_name = re.sub(r"\s+", "", str(name or ""))
    if not normalized_name:
        return 0
    for variant in _named_variants(label, expected_city):
        if normalized_name == variant:
            return 100
        if normalized_name in {variant + suffix for suffix in POI_DESCRIPTIVE_SUFFIXES}:
            return 90
        if _strip_admin_suffixes(normalized_name) == _strip_admin_suffixes(variant):
            return 85
    return 0


def _result_locality(address: dict, display_name: str, expected_city: str = "") -> str:
    locality = str(
        address.get("town") or address.get("village") or address.get("municipality")
        or address.get("county") or address.get("city_district") or address.get("city") or ""
    )
    if locality:
        return locality
    for match in ADMIN_CONTEXT_PATTERN.finditer(display_name):
        candidate = match.group(1)
        if not candidate.endswith(("镇", "街道")):
            continue
        if candidate in _admin_variants(expected_city):
            continue
        return candidate
    return ""


def _valid_cached_result(label: str, expected_city: str, result: object) -> bool:
    if not isinstance(result, dict):
        return False
    provider = result.get("provider")
    latitude = result.get("latitude")
    longitude = result.get("longitude")
    display_name = str(result.get("displayName") or "")
    return (
        provider in GEOCODER_PROVIDERS
        and isinstance(latitude, (int, float)) and not isinstance(latitude, bool) and -90 <= latitude <= 90
        and isinstance(longitude, (int, float)) and not isinstance(longitude, bool) and -180 <= longitude <= 180
        and _has_named_evidence(label, display_name, expected_city)
        and _has_admin_evidence(expected_city, display_name)
        and result.get("level") in {"town", "poi"}
    )


def _arcgis_result(label: str, payload: dict | list | None, expected_city: str = "") -> dict | None:
    candidates = payload.get("candidates", []) if isinstance(payload, dict) else []
    for item in candidates:
        if not isinstance(item, dict) or not isinstance(item.get("location"), dict):
            continue
        address = str(item.get("address") or "")
        score = float(item.get("score") or 0)
        if score < 70 or not _has_named_evidence(label, address, expected_city):
            continue
        if expected_city and not _has_admin_evidence(expected_city, address):
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


def _nominatim_result(label: str, payload: dict | list | None, expected_city: str = "") -> dict | None:
    candidates = payload if isinstance(payload, list) else []
    best = None
    for item in candidates:
        if not isinstance(item, dict):
            continue
        display_name = str(item.get("display_name") or "")
        address = item.get("address") if isinstance(item.get("address"), dict) else {}
        address_text = " ".join(str(value) for value in address.values())
        name_quality = _named_result_quality(label, item.get("name") or "", expected_city)
        if name_quality == 0 and not _has_named_evidence(label, display_name, expected_city):
            continue
        if expected_city and not _has_admin_evidence(expected_city, f"{display_name} {address_text}"):
            continue
        locality = _result_locality(address, display_name, expected_city)
        result = {
            "latitude": float(item["lat"]),
            "longitude": float(item["lon"]),
            "displayName": display_name,
            "level": "town" if address.get("town") or address.get("village") else "poi",
            "locality": locality,
            "providerScore": 80,
        }
        ranking = (name_quality, float(item.get("importance") or 0))
        if best is None or ranking > best[0]:
            best = (ranking, result)
    return best[1] if best else None


def _photon_result(label: str, payload: dict | list | None, expected_city: str = "") -> dict | None:
    features = payload.get("features", []) if isinstance(payload, dict) else []
    best = None
    for item in features:
        if not isinstance(item, dict):
            continue
        geometry = item.get("geometry") if isinstance(item.get("geometry"), dict) else {}
        coordinates = geometry.get("coordinates") if isinstance(geometry.get("coordinates"), list) else []
        if len(coordinates) < 2:
            continue
        properties = item.get("properties") if isinstance(item.get("properties"), dict) else {}
        display_name = " ".join(
            str(properties.get(key) or "")
            for key in ("name", "street", "district", "city", "county", "state", "country")
        ).strip()
        name_quality = _named_result_quality(label, properties.get("name") or "", expected_city)
        if name_quality == 0:
            continue
        if expected_city and not _has_admin_evidence(expected_city, display_name):
            continue
        locality = str(
            properties.get("town") or properties.get("village") or properties.get("city")
            or properties.get("municipality") or properties.get("county") or properties.get("district") or ""
        )
        result = {
            "latitude": float(coordinates[1]),
            "longitude": float(coordinates[0]),
            "displayName": display_name,
            "level": "town" if properties.get("town") or properties.get("village") else "poi",
            "locality": locality,
            "providerScore": 80,
        }
        ranking = (name_quality, float(properties.get("importance") or 0))
        if best is None or ranking > best[0]:
            best = (ranking, result)
    return best[1] if best else None


def reset_geocoder_pool_health() -> None:
    _provider_failures.clear()


def geocode_query(label: str, query: str, expected_city: str = "") -> dict | None:
    for config in GEOCODER_POOL:
        provider = config["provider"]
        endpoint = config["endpoint"]
        if _provider_failures.get(provider, 0) >= GEOCODER_POOL_FAILURE_LIMIT:
            continue
        if provider == "arcgis":
            payload = _request_json(endpoint, {"SingleLine": query, "f": "json", "maxLocations": 5}, config["timeout"])
            result = _arcgis_result(
                label,
                payload,
                expected_city,
            )
        elif provider == "nominatim":
            payload = _request_json(endpoint, {
                "q": query,
                "format": "jsonv2",
                "limit": 5,
                "accept-language": "zh-CN",
            }, config["timeout"])
            result = _nominatim_result(label, payload, expected_city)
        else:
            payload = _request_json(endpoint, {
                "q": query,
                "limit": 5,
            }, config["timeout"])
            result = _photon_result(label, payload, expected_city)
        if payload is None:
            _provider_failures[provider] = _provider_failures.get(provider, 0) + 1
            continue
        _provider_failures[provider] = 0
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
        label = str(tour.get("destinationPlaceName") or "")
        expected_city = str(tour.get("destinationCity") or "")
        result = None
        for query in queries:
            cached_result = cache.get(normalize_query(query))
            if _valid_cached_result(label, expected_city, cached_result):
                result = cached_result
                break
        if result is None and allow_network:
            for query in queries:
                result = geocode_query(label, query, expected_city)
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
