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
POI_DESCRIPTIVE_SUFFIXES = ("景区", "风景区", "旅游区", "度假区", "风景名胜区", "公园")
ADDRESS_FIELDS = (
    "formatted", "country", "province", "city", "district", "locality",
    "street", "houseNumber", "postalCode",
)


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
    normalized = _address_from_mapping(address, display_name)
    locality = normalized.get("locality", "")
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


def _address_from_mapping(values: dict, display_name: str = "") -> dict:
    """Normalize provider-specific address fields into the map data contract."""
    if not isinstance(values, dict):
        values = {}
    address = {
        "formatted": str(display_name or "").strip(),
        "country": str(values.get("country") or "").strip(),
        "province": str(values.get("province") or values.get("state") or values.get("region") or "").strip(),
        "city": str(values.get("city") or values.get("municipality_city") or "").strip(),
        "district": str(
            values.get("district") or values.get("county") or values.get("city_district")
            or values.get("subregion") or ""
        ).strip(),
        "locality": str(
            values.get("town") or values.get("village") or values.get("locality")
            or values.get("suburb") or values.get("neighbourhood") or values.get("municipality") or ""
        ).strip(),
        "street": str(values.get("road") or values.get("street") or "").strip(),
        "houseNumber": str(values.get("house_number") or values.get("housenumber") or values.get("houseNumber") or "").strip(),
        "postalCode": str(values.get("postcode") or values.get("postal_code") or values.get("postalCode") or "").strip(),
    }
    return {key: value for key, value in address.items() if value}


def _address_from_display_name(display_name: str) -> dict:
    """Recover administrative levels from a provider's formatted address."""
    formatted = str(display_name or "").strip()
    address = {"formatted": formatted} if formatted else {}
    parts = [part.strip() for part in re.split(r"[,，;；/]+", formatted) if part.strip()]
    for index, part in enumerate(parts):
        value = part.strip()
        if index == 0 and not (
            value in {"中国", "China"}
            or (
                value.endswith(("省", "市", "自治州", "区", "县", "旗", "镇", "街道", "乡"))
                and not value.endswith(POI_DESCRIPTIVE_SUFFIXES)
            )
        ):
            continue
        if not value:
            continue
        if value in {"中国", "China"}:
            address.setdefault("country", value)
        elif value.endswith("省"):
            address.setdefault("province", value)
        elif value.endswith(("市", "自治州")):
            address.setdefault("city", value)
        elif value.endswith(("区", "县", "旗")) and not value.endswith(POI_DESCRIPTIVE_SUFFIXES):
            address.setdefault("district", value)
        elif value.endswith(("镇", "街道", "乡")):
            address.setdefault("locality", value)
    return address


def _merge_address_values(primary: dict, secondary: dict) -> dict:
    merged = dict(primary) if isinstance(primary, dict) else {}
    for key in ADDRESS_FIELDS:
        if not merged.get(key) and isinstance(secondary, dict) and secondary.get(key):
            merged[key] = str(secondary[key]).strip()
    return {key: value for key, value in merged.items() if value}


def _same_place_area(left: dict, right: dict) -> bool:
    try:
        latitude_delta = abs(float(left["latitude"]) - float(right["latitude"]))
        longitude_delta = abs(float(left["longitude"]) - float(right["longitude"]))
    except (KeyError, TypeError, ValueError):
        return False
    return latitude_delta <= 0.08 and longitude_delta <= 0.08


def _merge_geocoder_results(results: list[dict]) -> dict | None:
    if not results:
        return None
    ranked = sorted(
        results,
        key=lambda result: (
            int(result.get("matchQuality") or 0),
            float(result.get("providerScore") or 0),
            len(result.get("address") or {}),
        ),
        reverse=True,
    )
    winner = dict(ranked[0])
    merged_address = {}
    for candidate in ranked:
        if _same_place_area(winner, candidate):
            merged_address = _merge_address_values(merged_address, candidate.get("address") or {})
    if merged_address:
        winner["address"] = merged_address
        winner["locality"] = merged_address.get("locality") or winner.get("locality", "")
    winner.pop("matchQuality", None)
    return winner


def _valid_cached_result(label: str, expected_city: str, result: object) -> bool:
    if not isinstance(result, dict):
        return False
    provider = result.get("provider")
    latitude = result.get("latitude")
    longitude = result.get("longitude")
    display_name = str(result.get("displayName") or "")
    address = result.get("address")
    return (
        provider in GEOCODER_PROVIDERS
        and isinstance(latitude, (int, float)) and not isinstance(latitude, bool) and -90 <= latitude <= 90
        and isinstance(longitude, (int, float)) and not isinstance(longitude, bool) and -180 <= longitude <= 180
        and _has_named_evidence(label, display_name, expected_city)
        and _has_admin_evidence(expected_city, display_name)
        and result.get("level") in {"town", "poi"}
        and (address is None or isinstance(address, dict))
    )


def _arcgis_result(label: str, payload: dict | list | None, expected_city: str = "") -> dict | None:
    candidates = payload.get("candidates", []) if isinstance(payload, dict) else []
    for item in candidates:
        if not isinstance(item, dict) or not isinstance(item.get("location"), dict):
            continue
        address = str(item.get("address") or "")
        attributes = item.get("attributes") if isinstance(item.get("attributes"), dict) else {}
        score = float(item.get("score") or 0)
        if score < 70 or not _has_named_evidence(label, address, expected_city):
            continue
        if expected_city and not _has_admin_evidence(expected_city, address):
            continue
        location = item["location"]
        normalized_address = _address_from_mapping({
            "country": attributes.get("Country") or attributes.get("CountryCode"),
            "province": attributes.get("Region") or attributes.get("State") or attributes.get("RegionAbbr"),
            "city": attributes.get("City") or attributes.get("PlaceName"),
            "district": attributes.get("District") or attributes.get("Subregion"),
            "locality": attributes.get("Neighborhood") or attributes.get("Locality"),
            "street": attributes.get("Address") or attributes.get("Street"),
            "house_number": attributes.get("HouseNumber"),
            "postcode": attributes.get("PostalCode") or attributes.get("Postal"),
        }, address)
        return {
            "latitude": float(location["y"]),
            "longitude": float(location["x"]),
            "displayName": address,
            "level": "town" if any(token in address for token in ("镇", "街道")) else "poi",
            "locality": normalized_address.get("locality") or _result_locality(attributes, address, expected_city),
            "providerScore": score,
            "address": normalized_address,
            "matchQuality": _named_result_quality(label, attributes.get("PlaceName") or address, expected_city) or 70,
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
            "address": _address_from_mapping(address, display_name),
            "matchQuality": name_quality or 70,
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
            "address": _address_from_mapping({
                "name": properties.get("name"),
                "country": properties.get("country"),
                "state": properties.get("state"),
                "city": properties.get("city"),
                "district": properties.get("district"),
                "county": properties.get("county"),
                "town": properties.get("town"),
                "village": properties.get("village"),
                "locality": properties.get("locality"),
                "street": properties.get("street"),
                "housenumber": properties.get("housenumber"),
                "postcode": properties.get("postcode"),
            }, display_name),
            "matchQuality": name_quality or 70,
        }
        ranking = (name_quality, float(properties.get("importance") or 0))
        if best is None or ranking > best[0]:
            best = (ranking, result)
    return best[1] if best else None


def reset_geocoder_pool_health() -> None:
    _provider_failures.clear()


def geocode_query(label: str, query: str, expected_city: str = "") -> dict | None:
    results = []
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
            results.append({"provider": provider, **result})
    merged = _merge_geocoder_results(results)
    return {"query": query, **merged} if merged else None


def _apply_result(tour: dict, result: dict) -> None:
    tour["destinationLatitude"] = result["latitude"]
    tour["destinationLongitude"] = result["longitude"]
    tour["destinationGeoLevel"] = result["level"]
    if result.get("locality"):
        tour["destinationLocality"] = result["locality"]
    address = _merge_address_values(
        _address_from_display_name(result.get("displayName", "")),
        result.get("address") or {},
    )
    if result.get("displayName"):
        address.setdefault("formatted", str(result["displayName"]))
    for key, tour_key in (
        ("country", "destinationCountry"),
        ("province", "destinationProvince"),
        ("city", "destinationCity"),
    ):
        if not address.get(key) and tour.get(tour_key):
            address[key] = str(tour[tour_key])
    if address:
        tour["destinationAddress"] = address
    tour["destinationCoordinateSource"] = "geocoder"
    tour["geoConfidence"] = "medium"
    tour["geoSource"] = "geocoder"
    meta = tour.setdefault("meta", {})
    quality = meta.setdefault("dataQuality", {})
    quality.setdefault("fieldSources", {})["destinationLatitude"] = "inferred"
    quality["fieldSources"]["destinationLongitude"] = "inferred"
    quality["fieldSources"]["destinationLocality"] = "inferred"
    quality["fieldSources"]["destinationAddress"] = "inferred"


def enrich_tours(tours: list[dict], allow_network: bool = False, cache_path: Path = CACHE_PATH) -> tuple[int, int]:
    cache = _load_cache(cache_path)
    resolved = 0
    candidates = 0
    changed = False
    for tour in tours:
        if tour.get("destinationCoordinateSource") == "catalog":
            continue
        if tour.get("destinationCoordinateSource") == "geocoder" and tour.get("destinationAddress"):
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
