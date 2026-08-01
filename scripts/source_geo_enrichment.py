#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Fetch source details and resolve additional tour locations without API keys.

This is an opt-in data-refresh step. It only reads public booking URLs already
present in tours.json, reuses the existing detail parsers and zero-key
geocoder pool, and records every mined candidate in geoResolution.
"""

from __future__ import annotations

import argparse
import json
import os
import tempfile
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from typing import Any

from detail_parsers import detail_has_content, empty_detail, fetch_detail_data
from geo_catalog import find_place, find_region, normalize_tour_geo
from geocode_destinations import (
    CACHE_PATH,
    _apply_result,
    _load_cache,
    _valid_cached_result,
    _write_cache,
    destination_fuzzy_queries,
    geocode_query,
    normalize_query,
)
from source_geo_mining import candidate_context, extract_detail_candidates


ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = ROOT / "public" / "data" / "tours.json"
DETAIL_DIR = ROOT / "public" / "data" / "tour-details"
MAX_SOURCE_CANDIDATES = 6
MAX_NETWORK_CANDIDATES_PER_TOUR = MAX_SOURCE_CANDIDATES
COUNTRY_ALIASES = {
    "意大利": {"意大利", "意大利共和国", "italy", "italia"},
    "希腊": {"希腊", "希腊共和国", "greece", "hellas"},
    "土耳其": {"土耳其", "土耳其共和国", "turkey", "türkiye"},
    "法国": {"法国", "法兰西", "france"},
    "西班牙": {"西班牙", "spain", "españa"},
    "葡萄牙": {"葡萄牙", "portugal"},
    "德国": {"德国", "germany", "deutschland"},
    "瑞士": {"瑞士", "switzerland", "schweiz"},
    "美国": {"美国", "united states", "usa"},
    "加拿大": {"加拿大", "canada"},
    "澳大利亚": {"澳大利亚", "australia"},
    "新西兰": {"新西兰", "new zealand"},
    "日本": {"日本", "japan"},
    "韩国": {"韩国", "大韩民国", "south korea"},
    "泰国": {"泰国", "thailand"},
    "马来西亚": {"马来西亚", "malaysia"},
    "新加坡": {"新加坡", "singapore"},
    "印度尼西亚": {"印度尼西亚", "indonesia"},
    "尼泊尔": {"尼泊尔", "nepal"},
    "南非": {"南非", "south africa"},
}


def _valid_coordinate_pair(latitude: Any, longitude: Any) -> bool:
    return (
        isinstance(latitude, (int, float))
        and not isinstance(latitude, bool)
        and isinstance(longitude, (int, float))
        and not isinstance(longitude, bool)
        and -90 <= latitude <= 90
        and -180 <= longitude <= 180
    )


def _needs_refinement(tour: dict) -> bool:
    if not _valid_coordinate_pair(tour.get("destinationLatitude"), tour.get("destinationLongitude")):
        return True
    return (
        str(tour.get("destinationCoordinatePrecision") or "") == "approximate"
        or str(tour.get("destinationCoordinateSource") or "") == "fallback"
    )


def _write_json_atomically(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, temporary = tempfile.mkstemp(prefix=f".{path.name}.", suffix=".tmp", dir=path.parent)
    try:
        with os.fdopen(fd, "w", encoding="utf-8", newline="\n") as handle:
            json.dump(value, handle, ensure_ascii=False, separators=(",", ":"))
            handle.write("\n")
        os.replace(temporary, path)
    finally:
        if os.path.exists(temporary):
            os.unlink(temporary)


def _non_empty(value: Any) -> bool:
    if isinstance(value, (list, dict)):
        return bool(value)
    return bool(str(value or "").strip())


def merge_detail_payload(existing: dict, fetched: dict) -> dict:
    """Merge fetched detail fields without discarding source data already kept."""
    result = dict(existing) if isinstance(existing, dict) else {}
    for key, value in (fetched.items() if isinstance(fetched, dict) else []):
        if not _non_empty(value):
            continue
        current = result.get(key)
        if isinstance(current, list) and isinstance(value, list):
            merged = list(current)
            for item in value:
                if item not in merged:
                    merged.append(item)
            result[key] = merged
        elif not _non_empty(current):
            result[key] = value
    return result


def detail_from_tour(tour: dict) -> dict:
    fields = (
        "highlights", "itinerary", "inclusions", "exclusions", "optionalExpenses",
        "importantNotes", "childPolicy", "singleSupplementNote", "singleSupplementAmount",
        "cancellationPolicy", "refundPolicy",
    )
    return {field: tour.get(field) for field in fields if field in tour}


def has_location_evidence(title: str, detail: dict, raw_destination: str = "") -> bool:
    candidates = extract_detail_candidates(title, detail, raw_destination)
    return any(
        candidate.get("source") != "title-route"
        or find_place(str(candidate.get("label") or ""))
        for candidate in candidates
    )


def should_fetch_source_detail(tour: dict) -> bool:
    url = str(tour.get("bookingUrl") or "").strip()
    if not url.startswith(("http://", "https://")):
        return False
    detail = detail_from_tour(tour)
    if not _needs_refinement(tour):
        return False
    return not has_location_evidence(
        str(tour.get("title") or ""), detail, str(tour.get("destination") or "")
    )


def _fetch_one(tour: dict) -> tuple[str, dict, str]:
    tour_id = str(tour.get("id") or "")
    raw = {"source": tour.get("source", ""), "url": tour.get("bookingUrl", "")}
    try:
        detail = fetch_detail_data(raw) or empty_detail()
        return tour_id, detail, "content" if detail_has_content(detail) else "empty"
    except Exception as exc:  # A single bad source must not stop the batch.
        return tour_id, empty_detail(), f"error:{type(exc).__name__}"


def fetch_missing_details(
    tours: list[dict],
    workers: int = 8,
    limit: int | None = None,
    fetch_remote: bool = True,
    force_ids: set[str] | None = None,
) -> dict[str, tuple[dict, str]]:
    force_ids = force_ids or set()
    eligible = [
        tour for tour in tours
        if str(tour.get("id") or "") in force_ids
        or _needs_refinement(tour)
    ]
    if limit is not None:
        eligible = eligible[: max(0, limit)]
    existing_evidence = {
        str(tour.get("id") or ""): (empty_detail(), "existing")
        for tour in eligible
        if str(tour.get("id") or "")
        and has_location_evidence(
            str(tour.get("title") or ""),
            detail_from_tour(tour),
            str(tour.get("destination") or ""),
        )
    }
    targets = [
        tour for tour in eligible
        if fetch_remote and (
            str(tour.get("id") or "") in force_ids
            or should_fetch_source_detail(tour)
        )
    ]
    results: dict[str, tuple[dict, str]] = dict(existing_evidence)
    if not targets:
        return results
    with ThreadPoolExecutor(max_workers=max(1, min(workers, 16))) as executor:
        futures = {executor.submit(_fetch_one, tour): str(tour.get("id") or "") for tour in targets}
        for future in as_completed(futures):
            tour_id, detail, status = future.result()
            results[tour_id] = (detail, status)
    return results


def _candidate_queries(tour: dict, label: str) -> tuple[list[str], list[str], str, str]:
    city, province = candidate_context(tour)
    raw_destination = str(tour.get("destination") or "").strip()
    region = find_region(raw_destination)
    if region:
        province = province or str(region.get("province") or raw_destination).strip()
        if raw_destination in {"华东", "青甘", "港澳"}:
            province = raw_destination
        city = ""
    if not city and province and find_place(label):
        city = str(find_place(label).get("name") or "")
    context = [label]
    if city and city != label:
        context.append(city)
    if province and province not in context:
        context.append(province)
    context.append("中国")
    strict = [" ".join(context)]
    if province:
        strict.append(" ".join(part for part in (label, province, "中国") if part))
    fuzzy = []
    base_tour = dict(tour)
    base_tour["destinationPlaceName"] = label
    base_tour["destinationCity"] = city
    base_tour["destinationProvince"] = province
    for query in destination_fuzzy_queries(base_tour):
        fuzzy.append(query)
    if province:
        fuzzy.extend(
            " ".join(part for part in (label + suffix, city, province, "中国") if part)
            for suffix in ("镇", "街道", "乡", "村")
        )
    return list(dict.fromkeys(normalize_query(query) for query in strict if query)), list(
        dict.fromkeys(normalize_query(query) for query in fuzzy if query)
    ), city, province


def _record_mined_candidate(tour: dict, candidate: dict) -> None:
    resolution = tour.setdefault("geoResolution", {})
    mining = resolution.setdefault("mining", {})
    rows = mining.setdefault("sourceCandidates", [])
    if not any(row.get("label") == candidate.get("label") for row in rows if isinstance(row, dict)):
        rows.append(candidate)


def _country_result_matches(label: str, result: dict) -> bool:
    aliases = COUNTRY_ALIASES.get(label)
    if not aliases:
        return True
    address = result.get("address") if isinstance(result.get("address"), dict) else {}
    country = str(address.get("country") or "").strip().lower()
    display = str(result.get("displayName") or "").lower()
    if country:
        return country in {value.lower() for value in aliases}
    return any(alias.lower() in display for alias in aliases)


def _try_candidate(
    tour: dict,
    candidate: dict,
    cache: dict,
    allow_network: bool,
    network_results: dict[tuple[str, str, str, bool], dict | None] | None = None,
) -> dict | None:
    label = str(candidate.get("label") or "").strip()
    if not label:
        return None
    queries, fuzzy_queries, city, province = _candidate_queries(tour, label)
    all_queries = list(dict.fromkeys(queries + fuzzy_queries))
    candidate["queries"] = all_queries
    result = None
    for query in queries:
        cached = cache.get(normalize_query(query))
        if _valid_cached_result(label, city, cached, province):
            if _country_result_matches(label, cached):
                result = cached
                candidate["resolution"] = "cached-exact"
                break
            cache.pop(normalize_query(query), None)
    if result is None:
        for query in fuzzy_queries:
            cached = cache.get(normalize_query(query))
            if _valid_cached_result(label, city, cached, province, allow_fuzzy=True):
                if _country_result_matches(label, cached):
                    result = cached
                    candidate["resolution"] = "cached-approximate"
                    break
                cache.pop(normalize_query(query), None)
    if result is None and allow_network:
        for query in queries[:1]:
            key = (normalize_query(query), city, province, False)
            if network_results is not None and key in network_results:
                result = network_results[key]
            else:
                result = geocode_query(label, query, city, province)
                if network_results is not None:
                    network_results[key] = result
            if result and not _country_result_matches(label, result):
                result = None
            if result:
                cache[normalize_query(query)] = result
                candidate["resolution"] = "network-exact"
                break
    if result is None and allow_network:
        for query in fuzzy_queries[:1]:
            key = (normalize_query(query), city, province, True)
            if network_results is not None and key in network_results:
                result = network_results[key]
            else:
                result = geocode_query(label, query, city, province, allow_fuzzy=True)
                if network_results is not None:
                    network_results[key] = result
            if result and not _country_result_matches(label, result):
                result = None
            if result:
                cache[normalize_query(query)] = result
                candidate["resolution"] = "network-approximate"
                break
    if not result:
        candidate.setdefault("resolution", "no-match")
        return None

    address = result.get("address") if isinstance(result.get("address"), dict) else {}
    tour["destinationPlaceName"] = label
    tour["destinationCity"] = str(address.get("city") or city or label).strip()
    tour["destinationProvince"] = str(address.get("province") or province or tour.get("destinationProvince") or "").strip()
    tour["destinationCountry"] = str(address.get("country") or tour.get("destinationCountry") or "中国").strip()
    _apply_result(tour, result)
    if label in COUNTRY_ALIASES:
        tour["destinationCity"] = label
        tour["destinationGeoLevel"] = "country"
        tour["destinationCoordinatePrecision"] = "approximate"
        tour["geoConfidence"] = "low"
    candidate["address"] = address
    candidate["latitude"] = result.get("latitude")
    candidate["longitude"] = result.get("longitude")
    candidate["level"] = result.get("level")
    return result


def apply_detail_and_geo(
    tour: dict,
    fetched_detail: dict,
    fetch_status: str,
    *,
    cache: dict,
    allow_network: bool,
    network_results: dict[tuple[str, str, str, bool], dict | None] | None = None,
) -> bool:
    existing_detail = detail_from_tour(tour)
    detail = merge_detail_payload(existing_detail, fetched_detail)
    for key, value in detail.items():
        if _non_empty(value):
            tour[key] = value
    meta = tour.get("meta") if isinstance(tour.get("meta"), dict) else {}
    tour["meta"] = meta
    quality = meta.get("dataQuality") if isinstance(meta.get("dataQuality"), dict) else {}
    meta["dataQuality"] = quality
    field_sources = quality.setdefault("fieldSources", {})
    for key, value in detail.items():
        if _non_empty(value):
            field_sources[key] = "detail"

    fields, _ = normalize_tour_geo(
        tour,
        str(tour.get("title") or ""),
        str(tour.get("destination") or ""),
        detail,
    )
    tour.update(fields)
    resolution = tour.setdefault("geoResolution", {})
    mining = resolution.setdefault("mining", {})
    mining["sourceDetail"] = {
        "status": fetch_status,
        "hasContent": detail_has_content(detail),
        "itineraryDays": len(detail.get("itinerary") or []) if isinstance(detail, dict) else 0,
    }
    candidates = extract_detail_candidates(
        str(tour.get("title") or ""), detail, str(tour.get("destination") or "")
    )
    network_attempts = 0
    for candidate in candidates[:MAX_SOURCE_CANDIDATES]:
        _record_mined_candidate(tour, dict(candidate))
    mining.pop("resolvedCandidate", None)

    # A region centroid is deliberately only a coarse fallback; source evidence
    # still gets a chance to upgrade it to a named town, POI or hotel.
    if _valid_coordinate_pair(tour.get("destinationLatitude"), tour.get("destinationLongitude")) and not _needs_refinement(tour):
        mining["status"] = "resolved-detail"
        return True

    for candidate in candidates[:MAX_SOURCE_CANDIDATES]:
        candidate_row = next(
            row for row in mining.get("sourceCandidates", [])
            if isinstance(row, dict) and row.get("label") == candidate.get("label")
        )
        # A bare marketing title is only a discovery hint. It is not strong
        # enough to send to a geocoder; detail activities and itinerary titles
        # carry the evidence required for an external lookup.
        network_eligible = candidate_row.get("source") != "title-route"
        probe_network = (
            allow_network
            and network_eligible
            and network_attempts < MAX_NETWORK_CANDIDATES_PER_TOUR
        )
        if probe_network:
            network_attempts += 1
        if _try_candidate(tour, candidate_row, cache, probe_network, network_results):
            mining["status"] = "resolved-source-candidate"
            mining["resolvedCandidate"] = candidate_row.get("label")
            return True
    mining["status"] = "no-validated-candidate"
    return False


def enrich_tours(
    tours: list[dict],
    *,
    allow_network: bool,
    workers: int,
    limit: int | None,
    cache_path: Path,
    fetch_remote: bool = True,
    force_ids: set[str] | None = None,
) -> dict[str, int]:
    fetched = fetch_missing_details(
        tours,
        workers=workers,
        limit=limit,
        fetch_remote=fetch_remote,
        force_ids=force_ids,
    )
    cache = _load_cache(cache_path)
    network_results: dict[tuple[str, str, str, bool], dict | None] = {}
    stats = {"targets": len(fetched), "detailContent": 0, "resolved": 0, "unresolved": 0}
    for tour in tours:
        tour_id = str(tour.get("id") or "")
        if tour_id not in fetched:
            continue
        detail, status = fetched[tour_id]
        if status == "content":
            stats["detailContent"] += 1
        if apply_detail_and_geo(
            tour,
            detail,
            status,
            cache=cache,
            allow_network=allow_network,
            network_results=network_results,
        ):
            stats["resolved"] += 1
        else:
            stats["unresolved"] += 1
    _write_cache(cache, cache_path)
    return stats


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--network", action="store_true", help="query public zero-key geocoders on cache misses")
    parser.add_argument("--workers", type=int, default=8)
    parser.add_argument("--limit", type=int, help="limit source detail fetches for a trial run")
    parser.add_argument("--cache", type=Path, default=CACHE_PATH)
    parser.add_argument("--write", action="store_true", help="persist tours.json and detail shards")
    parser.add_argument("--no-fetch", action="store_true", help="rehydrate existing detail evidence without fetching source pages")
    parser.add_argument("--id", action="append", default=[], help="process one tour id; repeatable")
    args = parser.parse_args()

    tours = json.loads(DATA_PATH.read_text(encoding="utf-8-sig"))
    if not isinstance(tours, list):
        raise ValueError("public/data/tours.json must contain a list")
    selected_tours = (
        [tour for tour in tours if str(tour.get("id") or "") in set(args.id)]
        if args.id
        else tours
    )
    stats = enrich_tours(
        selected_tours,
        allow_network=args.network,
        workers=args.workers,
        limit=args.limit,
        cache_path=args.cache,
        fetch_remote=not args.no_fetch,
        force_ids=set(args.id),
    )
    print(json.dumps(stats, ensure_ascii=False, sort_keys=True))
    if not args.write:
        return
    _write_json_atomically(DATA_PATH, tours)
    for tour in tours:
        detail_path = DETAIL_DIR / f"{tour.get('id')}.json"
        if detail_path.exists():
            existing = json.loads(detail_path.read_text(encoding="utf-8"))
        else:
            existing = {}
        _write_json_atomically(detail_path, merge_detail_payload(existing, detail_from_tour(tour)))


if __name__ == "__main__":
    main()
