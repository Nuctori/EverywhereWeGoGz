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

from geo_catalog import find_place

CACHE_PATH = Path(__file__).with_name("geo-geocode-cache.json")
USER_AGENT = "laoguang-travel-map/1.0 (+https://github.com/)"
REQUEST_TIMEOUT_SECONDS = 8
MIN_REQUEST_INTERVAL_SECONDS = 1.1
GEOCODER_POOL_FAILURE_LIMIT = 2
_last_request_at = 0.0
_provider_failures: dict[str, int] = {}
_overpass_endpoint_index = 0

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
OVERPASS_POOL = (
    {
        "provider": "overpass",
        "endpoint": "https://overpass-api.de/api/interpreter",
        "timeout": 15,
    },
    {
        "provider": "overpass",
        "endpoint": "https://overpass.kumi.systems/api/interpreter",
        "timeout": 15,
    },
)
GEOCODER_PROVIDERS.add("overpass")

ADMIN_CONTEXT_PATTERN = re.compile(r"([\u4e00-\u9fff]{2,8}(?:省|市|县|区|镇|街道))")
ADMIN_RESULT_PATTERN = re.compile(
    r"([\u4e00-\u9fff]{2,12}(?:自治州|地区|盟|市|县|区|旗))"
)
GENERIC_NAME_PARTS = {
    "中国",
    "广东",
    "广西",
    "湖南",
    "江西",
    "福建",
    "海南",
    "肇庆",
    "温泉",
    "酒店",
    "森林",
    "旅游",
}
POI_DESCRIPTIVE_SUFFIXES = ("景区", "风景区", "旅游区", "度假区", "风景名胜区", "公园")
ADDRESS_FIELDS = (
    "formatted",
    "country",
    "province",
    "city",
    "district",
    "locality",
    "street",
    "houseNumber",
    "postalCode",
)
FUZZY_PLACE_SUFFIXES = (
    "风景名胜区",
    "旅游度假区",
    "森林公园",
    "风景区",
    "旅游区",
    "度假区",
    "湿地公园",
    "温泉",
    "古镇",
    "古城",
    "公园",
)
FUZZY_ADMIN_SUFFIXES = ("镇", "街道", "乡", "村")


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
    path.write_text(
        json.dumps(cache, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )


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
    label_tail = label[len(city) :]
    if not label_tail:
        return []
    city_index = str(title or "").find(city)
    if city_index < 0:
        return []
    anchor = label_tail[:2]
    tail_index = str(title or "").find(anchor, city_index + len(city))
    if tail_index <= city_index + len(city):
        return []
    inserted = str(title or "")[city_index + len(city) : tail_index]
    inserted = re.sub(r"^[\s\-—至到往返]+|[\s\-—至到往返]+$", "", inserted)
    return [inserted] if inserted and len(inserted) <= 12 else []


def destination_queries(tour: dict) -> list[str]:
    label = str(tour.get("destinationPlaceName") or "").strip()
    city = str(tour.get("destinationCity") or "").strip()
    province = str(tour.get("destinationProvince") or "").strip()
    if not label or not city or label == city:
        return []

    title = str(tour.get("title") or "")
    country = str(tour.get("destinationCountry") or "").strip()
    country_part = country if country and country != "中国" else "中国"
    context = list(
        dict.fromkeys(
            _title_inserted_context(title, label, city) + _context_terms(title)
        )
    )
    parts = [label, *context, province, country_part]
    queries = [" ".join(part for part in parts if part)]
    queries.append(" ".join(part for part in (label, province, country_part) if part))
    place_label = (
        label[len(city) :].strip() if city and label.startswith(city) else label
    )
    if place_label and place_label != label:
        queries.append(
            " ".join(
                part
                for part in (place_label, *context, city, province, country_part)
                if part
            )
        )
        queries.append(
            " ".join(
                part
                for part in (
                    place_label,
                    *context,
                    f"{city}市" if not city.endswith(("市", "县", "区")) else city,
                    f"{province}省"
                    if province and not province.endswith("省")
                    else province,
                    country_part,
                )
                if part
            )
        )
    # Last resort: the bare POI name. Photon/Nominatim index many Chinese resorts
    # under their full brand name (e.g. 新丰云天海温泉度假村); adding admin
    # context terms makes the fuzzy search miss them. Validation still requires
    # admin evidence in the result's own address, so this stays bounded.
    queries.append(label)
    return list(dict.fromkeys(normalize_query(query) for query in queries if query))


def destination_fuzzy_queries(tour: dict) -> list[str]:
    """Search the nearest administrative place when a POI itself is absent."""
    label = str(tour.get("destinationPlaceName") or "").strip()
    city = str(tour.get("destinationCity") or "").strip()
    province = str(tour.get("destinationProvince") or "").strip()
    if not label or not city or label == city:
        return []
    base = _fuzzy_name_base(label, city)
    if len(base) < 2:
        return []
    context = list(
        dict.fromkeys(
            _title_inserted_context(str(tour.get("title") or ""), label, city)
        )
    )
    queries = [
        " ".join(
            part
            for part in (f"{base}{suffix}", *context, city, province, "中国")
            if part
        )
        for suffix in FUZZY_ADMIN_SUFFIXES
    ]
    queries.append(
        " ".join(part for part in (base, *context, city, province, "中国") if part)
    )
    return list(dict.fromkeys(normalize_query(query) for query in queries if query))


def _request_json(
    endpoint: str, params: dict, timeout: int = REQUEST_TIMEOUT_SECONDS
) -> dict | list | None:
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


def _has_province_evidence(expected_province: str, text: str) -> bool:
    return _has_admin_evidence(expected_province, text)


def _result_context_text(display_name: str, address: dict | None) -> str:
    values = [str(display_name or "")]
    if isinstance(address, dict):
        values.extend(str(address.get(key) or "") for key in ADDRESS_FIELDS)
    return " ".join(values)


def _has_conflicting_admin_context(
    expected_city: str,
    expected_province: str,
    display_name: str,
    address: dict | None,
) -> bool:
    """Reject a result whose explicit administrative context contradicts the tour."""
    display = re.sub(r"\s+", "", str(display_name or ""))
    display_tokens = ADMIN_RESULT_PATTERN.findall(display)
    expected_province_variants = _admin_variants(expected_province)
    if expected_province:
        province_tokens = [token for token in display_tokens if token.endswith("省")]
        if province_tokens and not any(
            any(variant and variant in token for variant in expected_province_variants)
            for token in province_tokens
        ):
            return True
        if not province_tokens and not _has_province_evidence(
            expected_province,
            _result_context_text(display_name, address),
        ):
            return True
    if not expected_city:
        return False
    expected_city_variants = _admin_variants(expected_city)
    city_tokens = [token for token in display_tokens if not token.endswith("省")]
    if any(
        any(variant and variant in token for variant in expected_city_variants)
        for token in city_tokens
    ):
        return False
    if city_tokens:
        return True
    # Providers sometimes return a bare POI name with no administrative suffix.
    # In that case a structured address can still prove the expected city.
    address_text = _result_context_text("", address)
    if _has_admin_evidence(expected_city, address_text):
        return False
    return False


def _named_variants(label: str, expected_city: str = "") -> list[str]:
    normalized_label = re.sub(r"\s+", "", str(label or ""))
    city = re.sub(r"\s+", "", str(expected_city or ""))
    place_label = (
        normalized_label[len(city) :]
        if city and normalized_label.startswith(city)
        else normalized_label
    )
    return list(
        dict.fromkeys(
            token
            for token in (normalized_label, place_label)
            if len(token) >= 2 and token not in GENERIC_NAME_PARTS and token != city
        )
    )


def _strip_admin_suffixes(value: str) -> str:
    normalized = re.sub(r"\s+", "", str(value or ""))
    return re.sub(r"(?:街道|省|市|县|区|旗|镇)", "", normalized)


def _contains_named_variant(text: str, variant: str) -> bool:
    start = 0
    while True:
        index = text.find(variant, start)
        if index < 0:
            return False
        tail = text[index + len(variant) :]
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
        # Admin-suffix equality (e.g. 硅谷 ↔ 硅谷街道) is only acceptable when
        # the query carried a city context. Without one, a bare POI label must
        # not silently match an administrative division in some other city.
        if expected_city and _strip_admin_suffixes(
            normalized_name
        ) == _strip_admin_suffixes(variant):
            return 85
    return 0


def _fuzzy_name_base(label: str, expected_city: str = "") -> str:
    normalized = re.sub(r"\s+", "", str(label or ""))
    city = re.sub(r"\s+", "", str(expected_city or ""))
    if city and normalized.startswith(city):
        normalized = normalized[len(city) :]
    for suffix in sorted(FUZZY_PLACE_SUFFIXES, key=len, reverse=True):
        if normalized.endswith(suffix) and len(normalized) > len(suffix):
            normalized = normalized[: -len(suffix)]
            break
    return normalized


def _fuzzy_name_quality(label: str, name: str, expected_city: str = "") -> int:
    normalized_name = re.sub(r"\s+", "", str(name or ""))
    base = _fuzzy_name_base(label, expected_city)
    if len(base) < 2 or not normalized_name:
        return 0
    stripped_name = re.sub(r"(?:镇|街道|乡|村)$", "", normalized_name)
    if stripped_name == base:
        return 55
    return (
        55 if re.search(rf"{re.escape(base)}(?:镇|街道|乡|村)", normalized_name) else 0
    )


def _is_fuzzy_admin_name(name: str) -> bool:
    normalized = re.sub(r"\s+", "", str(name or ""))
    return normalized.endswith(FUZZY_ADMIN_SUFFIXES)


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
        "province": str(
            values.get("province") or values.get("state") or values.get("region") or ""
        ).strip(),
        "city": str(
            values.get("city") or values.get("municipality_city") or ""
        ).strip(),
        "district": str(
            values.get("district")
            or values.get("county")
            or values.get("city_district")
            or values.get("subregion")
            or ""
        ).strip(),
        "locality": str(
            values.get("town")
            or values.get("village")
            or values.get("locality")
            or values.get("suburb")
            or values.get("neighbourhood")
            or values.get("municipality")
            or ""
        ).strip(),
        "street": str(values.get("road") or values.get("street") or "").strip(),
        "houseNumber": str(
            values.get("house_number")
            or values.get("housenumber")
            or values.get("houseNumber")
            or ""
        ).strip(),
        "postalCode": str(
            values.get("postcode")
            or values.get("postal_code")
            or values.get("postalCode")
            or ""
        ).strip(),
    }
    return {key: value for key, value in address.items() if value}


def _address_from_display_name(display_name: str) -> dict:
    """Recover administrative levels from a provider's formatted address."""
    formatted = str(display_name or "").strip()
    address = {"formatted": formatted} if formatted else {}
    parts = [
        part.strip() for part in re.split(r"[,，;；/]+", formatted) if part.strip()
    ]
    for index, part in enumerate(parts):
        value = part.strip()
        if index == 0 and not (
            value in {"中国", "China"}
            or (
                value.endswith(
                    ("省", "市", "自治州", "区", "县", "旗", "镇", "街道", "乡")
                )
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
        elif value.endswith(("区", "县", "旗")) and not value.endswith(
            POI_DESCRIPTIVE_SUFFIXES
        ):
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


def _try_float(value: object) -> float | None:
    if isinstance(value, bool) or not isinstance(value, (int, float, str)):
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _try_int(value: object) -> int | None:
    if isinstance(value, bool):
        return None
    if isinstance(value, str):
        try:
            return int(float(value))
        except (TypeError, ValueError):
            return None
    if isinstance(value, (int, float)):
        try:
            return int(value)
        except (TypeError, ValueError):
            return None
    return None


def _merge_geocoder_results(results: list[dict]) -> dict | None:
    if not results:
        return None
    ranked = sorted(
        results,
        key=lambda result: (
            _try_int(result.get("matchQuality")) or 0,
            _try_float(result.get("providerScore")) or 0,
            len(result.get("address") or {}),
        ),
    )
    winner = dict(ranked[0])
    winner = dict(ranked[0])
    merged_address = {}
    for candidate in ranked:
        if _same_place_area(winner, candidate):
            merged_address = _merge_address_values(
                merged_address, candidate.get("address") or {}
            )
    if merged_address:
        winner["address"] = merged_address
        winner["locality"] = merged_address.get("locality") or winner.get(
            "locality", ""
        )
    winner.pop("matchQuality", None)
    return winner


def _valid_cached_result(
    label: str,
    expected_city: str,
    result: object,
    expected_province: str = "",
    allow_fuzzy: bool = False,
) -> bool:
    if not isinstance(result, dict):
        return False
    provider = result.get("provider")
    latitude = result.get("latitude")
    longitude = result.get("longitude")
    display_name = str(result.get("displayName") or "")
    address = result.get("address")
    admin_context = expected_city or expected_province
    context_conflict = _has_conflicting_admin_context(
        expected_city,
        expected_province,
        display_name,
        address if isinstance(address, dict) else {},
    )
    strict_match = _has_named_evidence(
        label, display_name, expected_city
    ) and _has_admin_evidence(admin_context, display_name)
    fuzzy_match = (
        allow_fuzzy
        and result.get("precision") == "approximate"
        and _fuzzy_name_quality(
            label, result.get("name") or display_name, expected_city
        )
        > 0
        and not context_conflict
        and result.get("level") == "town"
    )
    return (
        provider in GEOCODER_PROVIDERS
        and isinstance(latitude, (int, float))
        and not isinstance(latitude, bool)
        and -90 <= latitude <= 90
        and isinstance(longitude, (int, float))
        and not isinstance(longitude, bool)
        and -180 <= longitude <= 180
        and not context_conflict
        and (strict_match or fuzzy_match)
        and result.get("level") in {"town", "poi"}
        and (address is None or isinstance(address, dict))
    )


def _arcgis_result(
    label: str,
    payload: dict | list | None,
    expected_city: str = "",
    expected_province: str = "",
    allow_fuzzy: bool = False,
) -> dict | None:
    candidates = payload.get("candidates", []) if isinstance(payload, dict) else []
    for item in candidates:
        if not isinstance(item, dict) or not isinstance(item.get("location"), dict):
            continue
        address = str(item.get("address") or "")
        attributes = (
            item.get("attributes") if isinstance(item.get("attributes"), dict) else {}
        )
        score = _try_float(item.get("score")) or 0
        named_evidence = _has_named_evidence(label, address, expected_city)
        fuzzy_quality = _fuzzy_name_quality(
            label, attributes.get("PlaceName") or address, expected_city
        )
        if score < 70 or (not named_evidence and not (allow_fuzzy and fuzzy_quality)):
            continue
        if (
            expected_city
            and not _has_admin_evidence(expected_city, address)
            and not (
                allow_fuzzy
                and _has_province_evidence(expected_province, address)
                and _is_fuzzy_admin_name(attributes.get("PlaceName") or address)
            )
        ):
            continue
        location = item["location"]
        normalized_address = _address_from_mapping(
            {
                "country": attributes.get("Country") or attributes.get("CountryCode"),
                "province": attributes.get("Region")
                or attributes.get("State")
                or attributes.get("RegionAbbr"),
                "city": attributes.get("City") or attributes.get("PlaceName"),
                "district": attributes.get("District") or attributes.get("Subregion"),
                "locality": attributes.get("Neighborhood")
                or attributes.get("Locality"),
                "street": attributes.get("Address") or attributes.get("Street"),
                "house_number": attributes.get("HouseNumber"),
                "postcode": attributes.get("PostalCode") or attributes.get("Postal"),
            },
            address,
        )
        if _has_conflicting_admin_context(
            expected_city, expected_province, address, normalized_address
        ):
            continue
        latitude = _try_float(location.get("y"))
        longitude = _try_float(location.get("x"))
        if latitude is None or longitude is None:
            continue
        return {
            "latitude": latitude,
            "longitude": longitude,
            "displayName": address,
            "level": (
                "town"
                if any(token in address for token in FUZZY_ADMIN_SUFFIXES)
                or _is_fuzzy_admin_name(attributes.get("PlaceName") or "")
                else "poi"
            ),
            "locality": normalized_address.get("locality")
            or _result_locality(attributes, address, expected_city),
            "providerScore": score,
            "address": normalized_address,
            "matchQuality": _named_result_quality(
                label, attributes.get("PlaceName") or address, expected_city
            )
            or fuzzy_quality
            or 70,
            **(
                {"precision": "approximate"}
                if allow_fuzzy and not named_evidence
                else {}
            ),
        }
    return None


def _nominatim_result(
    label: str,
    payload: dict | list | None,
    expected_city: str = "",
    expected_province: str = "",
    allow_fuzzy: bool = False,
) -> dict | None:
    candidates = payload if isinstance(payload, list) else []
    best = None
    for item in candidates:
        if not isinstance(item, dict):
            continue
        display_name = str(item.get("display_name") or "")
        address = item.get("address") if isinstance(item.get("address"), dict) else {}
        address_text = " ".join(str(value) for value in address.values())
        normalized_address = _address_from_mapping(address, display_name)
        name_quality = _named_result_quality(
            label, item.get("name") or "", expected_city
        )
        fuzzy_quality = _fuzzy_name_quality(
            label, item.get("name") or "", expected_city
        )
        named_evidence = name_quality > 0 or _has_named_evidence(
            label, display_name, expected_city
        )
        if not named_evidence and not (allow_fuzzy and fuzzy_quality):
            continue
        if (
            expected_city
            and not _has_admin_evidence(expected_city, f"{display_name} {address_text}")
            and not (
                allow_fuzzy
                and _has_province_evidence(
                    expected_province, f"{display_name} {address_text}"
                )
                and _is_fuzzy_admin_name(item.get("name") or "")
            )
        ):
            continue
        if _has_conflicting_admin_context(
            expected_city, expected_province, display_name, normalized_address
        ):
            continue
        locality = _result_locality(address, display_name, expected_city)
        lat = _try_float(item.get("lat"))
        lon = _try_float(item.get("lon"))
        if lat is None or lon is None:
            continue
        result = {
            "latitude": lat,
            "longitude": lon,
            "displayName": display_name,
            "level": "town"
            if address.get("town")
            or address.get("village")
            or _is_fuzzy_admin_name(item.get("name") or "")
            else "poi",
            "locality": locality,
            "providerScore": 80,
            "address": normalized_address,
            "matchQuality": name_quality or fuzzy_quality or 70,
            **(
                {"precision": "approximate"} if allow_fuzzy and not name_quality else {}
            ),
        }
        ranking = (name_quality, _try_float(item.get("importance")) or 0)
        if best is None or ranking > best[0]:
            best = (ranking, result)
    return best[1] if best else None


def _photon_result(
    label: str,
    payload: dict | list | None,
    expected_city: str = "",
    expected_province: str = "",
    allow_fuzzy: bool = False,
) -> dict | None:
    features = payload.get("features", []) if isinstance(payload, dict) else []
    best = None
    for item in features:
        if not isinstance(item, dict):
            continue
        geometry = (
            item.get("geometry") if isinstance(item.get("geometry"), dict) else {}
        )
        coordinates = (
            geometry.get("coordinates")
            if isinstance(geometry.get("coordinates"), list)
            else []
        )
        if len(coordinates) < 2:
            continue
        properties = (
            item.get("properties") if isinstance(item.get("properties"), dict) else {}
        )
        display_name = " ".join(
            str(properties.get(key) or "")
            for key in (
                "name",
                "street",
                "district",
                "city",
                "county",
                "state",
                "country",
            )
        ).strip()
        name_quality = _named_result_quality(
            label, properties.get("name") or "", expected_city
        )
        fuzzy_quality = _fuzzy_name_quality(
            label, properties.get("name") or "", expected_city
        )
        if name_quality == 0 and not (allow_fuzzy and fuzzy_quality):
            continue
        if (
            expected_city
            and not _has_admin_evidence(expected_city, display_name)
            and not (
                allow_fuzzy
                and _has_province_evidence(expected_province, display_name)
                and _is_fuzzy_admin_name(properties.get("name") or "")
            )
        ):
            continue
        normalized_address = _address_from_mapping(
            {
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
            },
            display_name,
        )
        if _has_conflicting_admin_context(
            expected_city, expected_province, display_name, normalized_address
        ):
            continue
        locality = str(
            properties.get("town")
            or properties.get("village")
            or properties.get("city")
            or properties.get("municipality")
            or properties.get("county")
            or properties.get("district")
            or ""
        )
        lat = _try_float(coordinates[1])
        lon = _try_float(coordinates[0])
        if lat is None or lon is None:
            continue
        result = {
            "latitude": lat,
            "longitude": lon,
            "displayName": display_name,
            "level": "town"
            if properties.get("town")
            or properties.get("village")
            or _is_fuzzy_admin_name(properties.get("name") or "")
            else "poi",
            "locality": locality,
            "providerScore": 80,
            "address": normalized_address,
            "matchQuality": name_quality or fuzzy_quality or 70,
            **(
                {"precision": "approximate"} if allow_fuzzy and not name_quality else {}
            ),
        }
        ranking = (name_quality, _try_float(properties.get("importance")) or 0)
        if best is None or ranking > best[0]:
            best = (ranking, result)
    return best[1] if best else None


def _overpass_bbox(expected_city: str) -> tuple[float, float, float, float] | None:
    place = find_place(expected_city)
    if not isinstance(place, dict):
        return None
    try:
        latitude = float(place["latitude"])
        longitude = float(place["longitude"])
    except (KeyError, TypeError, ValueError):
        return None
    # The bbox is deliberately broad enough for a city-level destination while
    # remaining bounded so an exact name cannot match a same-named POI globally.
    return (latitude - 1.2, longitude - 1.4, latitude + 1.2, longitude + 1.4)


def _overpass_query(label: str, expected_city: str) -> str | None:
    bbox = _overpass_bbox(expected_city)
    variants = _named_variants(label, expected_city)
    if bbox is None or not variants:
        return None
    pattern = "|".join(re.escape(variant) for variant in variants[:2])
    south, west, north, east = bbox
    return (
        f'[out:json][timeout:15];nwr["name"~"{pattern}",i]'
        f"({south:.5f},{west:.5f},{north:.5f},{east:.5f});out center tags;"
    )


def _overpass_result(
    label: str,
    payload: dict | list | None,
    expected_city: str = "",
    expected_province: str = "",
    allow_fuzzy: bool = False,
) -> dict | None:
    elements = payload.get("elements", []) if isinstance(payload, dict) else []
    best = None
    for item in elements:
        if not isinstance(item, dict) or not isinstance(item.get("tags"), dict):
            continue
        tags = item["tags"]
        name = str(tags.get("name") or tags.get("name:zh") or "").strip()
        if not name:
            continue
        name_quality = _named_result_quality(label, name, expected_city)
        fuzzy_quality = _fuzzy_name_quality(label, name, expected_city)
        named_evidence = name_quality > 0 or _has_named_evidence(
            label, name, expected_city
        )
        if not named_evidence and not (allow_fuzzy and fuzzy_quality):
            continue
        coordinates = item.get("lat"), item.get("lon")
        if not isinstance(coordinates[0], (int, float)) or not isinstance(
            coordinates[1], (int, float)
        ):
            center = item.get("center") if isinstance(item.get("center"), dict) else {}
            coordinates = center.get("lat"), center.get("lon")
        if not isinstance(coordinates[0], (int, float)) or not isinstance(
            coordinates[1], (int, float)
        ):
            continue
        address = _address_from_mapping(
            {
                "country": tags.get("addr:country") or "中国",
                "province": tags.get("addr:province")
                or tags.get("addr:state")
                or expected_province,
                "city": tags.get("addr:city") or expected_city,
                "district": tags.get("addr:district") or tags.get("addr:county"),
                "town": tags.get("addr:town")
                or tags.get("addr:village")
                or tags.get("addr:suburb"),
                "street": tags.get("addr:street"),
                "house_number": tags.get("addr:housenumber"),
                "postcode": tags.get("addr:postcode"),
            },
            name,
        )
        locality = address.get("locality", "")
        level = "town" if tags.get("place") in {"town", "village"} else "poi"
        display_name = ", ".join(
            value
            for value in (
                name,
                address.get("locality"),
                address.get("district"),
                address.get("city"),
                address.get("province"),
                address.get("country"),
            )
            if value
        )
        if _has_conflicting_admin_context(
            expected_city, expected_province, display_name, address
        ):
            continue
        result = {
            "latitude": coordinates[0],
            "longitude": coordinates[1],
            "displayName": display_name,
            "level": level,
            "locality": locality,
            "providerScore": 86,
            "address": address,
            "matchQuality": name_quality or fuzzy_quality or 70,
            **(
                {"precision": "approximate"} if allow_fuzzy and not name_quality else {}
            ),
        }
        ranking = (
            name_quality,
            1 if address.get("district") or address.get("locality") else 0,
        )
        if best is None or ranking > best[0]:
            best = (ranking, result)
    return best[1] if best else None


def _request_overpass(query: str) -> dict | list | None:
    global _overpass_endpoint_index
    if not OVERPASS_POOL:
        return None
    config = OVERPASS_POOL[_overpass_endpoint_index % len(OVERPASS_POOL)]
    payload = _request_json(config["endpoint"], {"data": query}, config["timeout"])
    if payload is None:
        _overpass_endpoint_index = (_overpass_endpoint_index + 1) % len(OVERPASS_POOL)
    return payload


def reset_geocoder_pool_health() -> None:
    global _overpass_endpoint_index
    _provider_failures.clear()
    _overpass_endpoint_index = 0


def geocode_query(
    label: str,
    query: str,
    expected_city: str = "",
    expected_province: str = "",
    allow_fuzzy: bool = False,
) -> dict | None:
    results = []
    for config in GEOCODER_POOL:
        provider = config["provider"]
        endpoint = config["endpoint"]
        if _provider_failures.get(provider, 0) >= GEOCODER_POOL_FAILURE_LIMIT:
            continue
        if provider == "arcgis":
            payload = _request_json(
                endpoint,
                {"SingleLine": query, "f": "json", "maxLocations": 5},
                config["timeout"],
            )
            result = _arcgis_result(
                label,
                payload,
                expected_city,
                expected_province,
                allow_fuzzy,
            )
        elif provider == "nominatim":
            payload = _request_json(
                endpoint,
                {
                    "q": query,
                    "format": "jsonv2",
                    "limit": 5,
                    "accept-language": "zh-CN",
                },
                config["timeout"],
            )
            result = _nominatim_result(
                label, payload, expected_city, expected_province, allow_fuzzy
            )
        else:
            payload = _request_json(
                endpoint,
                {
                    "q": query,
                    "limit": 5,
                },
                config["timeout"],
            )
            result = _photon_result(
                label, payload, expected_city, expected_province, allow_fuzzy
            )
        if payload is None:
            _provider_failures[provider] = _provider_failures.get(provider, 0) + 1
            continue
        _provider_failures[provider] = 0
        if result:
            results.append({"provider": provider, **result})
    if (
        not results
        and _provider_failures.get("overpass", 0) < GEOCODER_POOL_FAILURE_LIMIT
    ):
        overpass_query = _overpass_query(label, expected_city)
        if overpass_query:
            result = _overpass_result(
                label,
                _request_overpass(overpass_query),
                expected_city,
                expected_province,
                allow_fuzzy,
            )
            if result:
                _provider_failures["overpass"] = 0
                results.append({"provider": "overpass", **result})
            else:
                _provider_failures["overpass"] = (
                    _provider_failures.get("overpass", 0) + 1
                )
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
    is_osm_result = result.get("provider") == "overpass"
    tour["destinationCoordinateSource"] = "osm" if is_osm_result else "geocoder"
    approximate = result.get("precision") == "approximate"
    tour["geoConfidence"] = "low" if approximate else "medium"
    if approximate:
        tour["destinationCoordinatePrecision"] = "approximate"
    else:
        tour.pop("destinationCoordinatePrecision", None)
    tour["geoSource"] = "osm" if is_osm_result else "geocoder"
    meta = tour.setdefault("meta", {})
    quality = meta.setdefault("dataQuality", {})
    quality.setdefault("fieldSources", {})["destinationLatitude"] = "inferred"
    quality["fieldSources"]["destinationLongitude"] = "inferred"
    quality["fieldSources"]["destinationLocality"] = "inferred"
    quality["fieldSources"]["destinationAddress"] = "inferred"


def enrich_tours(
    tours: list[dict], allow_network: bool = False, cache_path: Path = CACHE_PATH
) -> tuple[int, int]:
    cache = _load_cache(cache_path)
    network_results: dict[tuple[str, str, str, bool], dict | None] = {}
    resolved = 0
    candidates = 0
    changed = False
    for tour in tours:
        if tour.get("destinationCoordinateSource") in {"catalog", "osm"}:
            resolution = tour.get("geoResolution")
            if isinstance(resolution, dict):
                resolution["geocoder"] = {
                    "status": "not-needed",
                    "queries": [],
                    "reason": "already-resolved",
                }
            continue
        if tour.get("destinationCoordinateSource") == "geocoder" and tour.get(
            "destinationAddress"
        ):
            resolution = tour.get("geoResolution")
            if isinstance(resolution, dict):
                resolution["geocoder"] = {
                    "status": "not-needed",
                    "queries": [],
                    "reason": "already-resolved",
                }
            continue
        queries = destination_queries(tour)
        fuzzy_queries = destination_fuzzy_queries(tour)
        all_queries = list(dict.fromkeys(queries + fuzzy_queries))
        resolution = tour.get("geoResolution")
        if not all_queries:
            if isinstance(resolution, dict):
                resolution["geocoder"] = {
                    "status": "not-attempted",
                    "queries": [],
                    "reason": "no-destination-query",
                }
            continue
        candidates += 1
        if isinstance(resolution, dict):
            resolution["geocoder"] = {"status": "querying", "queries": all_queries}
        label = str(tour.get("destinationPlaceName") or "")
        expected_city = str(tour.get("destinationCity") or "")
        expected_province = str(tour.get("destinationProvince") or "")
        result = None
        for query in queries:
            cached_result = cache.get(normalize_query(query))
            if _valid_cached_result(label, expected_city, cached_result):
                result = cached_result
                if isinstance(resolution, dict):
                    resolution["geocoder"] = {
                        "status": "resolved-cache",
                        "queries": all_queries,
                        "reason": "validated-cache-hit",
                    }
                break
        if result is None:
            for query in fuzzy_queries:
                cached_result = cache.get(normalize_query(query))
                if _valid_cached_result(
                    label,
                    expected_city,
                    cached_result,
                    expected_province,
                    allow_fuzzy=True,
                ):
                    result = cached_result
                    if isinstance(resolution, dict):
                        resolution["geocoder"] = {
                            "status": "resolved-cache-approximate",
                            "queries": all_queries,
                            "reason": "validated-fuzzy-cache-hit",
                        }
                    break
        if result is None and allow_network:
            for query in queries:
                result_key = (
                    normalize_query(query),
                    expected_city,
                    expected_province,
                    False,
                )
                if result_key in network_results:
                    result = network_results[result_key]
                else:
                    result = geocode_query(
                        label, query, expected_city, expected_province
                    )
                    network_results[result_key] = result
                if result:
                    cache[normalize_query(query)] = result
                    changed = True
                    if isinstance(resolution, dict):
                        resolution["geocoder"] = {
                            "status": "resolved-network",
                            "queries": all_queries,
                            "reason": "validated-provider-match",
                        }
                    break
        if result is None and allow_network:
            for query in fuzzy_queries:
                result_key = (
                    normalize_query(query),
                    expected_city,
                    expected_province,
                    True,
                )
                if result_key in network_results:
                    result = network_results[result_key]
                else:
                    result = geocode_query(
                        label, query, expected_city, expected_province, allow_fuzzy=True
                    )
                    network_results[result_key] = result
                if result:
                    cache[normalize_query(query)] = result
                    changed = True
                    if isinstance(resolution, dict):
                        resolution["geocoder"] = {
                            "status": "resolved-network-approximate",
                            "queries": all_queries,
                            "reason": "validated-fuzzy-provider-match",
                        }
                    break
        if result is None and isinstance(resolution, dict):
            resolution["geocoder"] = {
                "status": "no-match",
                "queries": all_queries,
                "reason": "no-validated-provider-result"
                if allow_network
                else "cache-miss",
            }
        if isinstance(result, dict) and result.get("latitude") is not None:
            _apply_result(tour, result)
            resolved += 1
    if changed:
        _write_cache(cache, cache_path)
    return candidates, resolved


if __name__ == "__main__":
    raise SystemExit("Import enrich_tours from rebuild_geo_data.py")
