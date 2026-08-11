#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Rebuild geo fields and map indexes without refetching tour data."""

import json
import os
import subprocess
import tempfile
import argparse
from pathlib import Path

from geo_catalog import classify_route, find_place, normalize_tour_geo
from geocode_destinations import (
    _has_conflicting_admin_context,
    _has_named_evidence,
    enrich_tours,
)
from osm_poi_resolver import (
    enrich_tours_from_osm,
    is_international_route_title,
    normalize_name,
)
from source_geo_mining import is_generic_candidate


def atomic_write_json(path: Path, value) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, temp_name = tempfile.mkstemp(
        prefix=f".{path.name}.", suffix=".tmp", dir=path.parent
    )
    try:
        with os.fdopen(fd, "w", encoding="utf-8", newline="\n") as handle:
            json.dump(value, handle, ensure_ascii=False, separators=(",", ":"))
            handle.write("\n")
        os.replace(temp_name, path)
    finally:
        if os.path.exists(temp_name):
            os.unlink(temp_name)


def _valid_coordinate_pair(latitude, longitude) -> bool:
    return (
        isinstance(latitude, (int, float))
        and isinstance(longitude, (int, float))
        and -90 <= latitude <= 90
        and -180 <= longitude <= 180
    )


def _update_geo_resolution_final(tour: dict) -> None:
    resolution = tour.get("geoResolution")
    if not isinstance(resolution, dict):
        return
    destination_ready = _valid_coordinate_pair(
        tour.get("destinationLatitude"), tour.get("destinationLongitude")
    )
    departure_ready = _valid_coordinate_pair(
        tour.get("departureLatitude"), tour.get("departureLongitude")
    )
    if destination_ready:
        status = "complete" if departure_ready else "destination-only"
        final = {"status": status}
        source = str(tour.get("destinationCoordinateSource") or "").strip()
        if source:
            final["source"] = source
        precision = str(tour.get("destinationCoordinatePrecision") or "").strip()
        if precision:
            final["precision"] = precision
        if source == "fallback":
            reason = (
                "region-catalog-fallback"
                if tour.get("geoSource") == "local-region-catalog"
                else "coarse-parent-city-fallback"
            )
            final["reason"] = reason
        resolution["final"] = final
    else:
        resolution["final"] = {"status": "unmapped"}


def _preserve_geo_mining(previous: object, current: object) -> None:
    """Keep source-mining evidence across a deterministic geo rebuild."""
    if not isinstance(previous, dict) or not isinstance(current, dict):
        return
    old_mining_value = previous.get("mining")
    old_mining = old_mining_value if isinstance(old_mining_value, dict) else {}
    new_mining = current.setdefault("mining", {})
    if old_mining.get("sourceDetail") and not new_mining.get("sourceDetail"):
        new_mining["sourceDetail"] = old_mining["sourceDetail"]
    old_resolved = old_mining.get("resolvedCandidate")
    if (
        old_resolved
        and not is_generic_candidate(old_resolved)
        and not new_mining.get("resolvedCandidate")
    ):
        new_mining["resolvedCandidate"] = old_resolved
    old_rows = old_mining.get("sourceCandidates")
    if not isinstance(old_rows, list):
        return
    new_rows = new_mining.setdefault("sourceCandidates", [])
    current_labels = {
        normalize_name(label)
        for label in new_mining.get("candidateLabels", [])
        if str(label).strip()
    }
    existing_labels = {
        str(row.get("label") or "") for row in new_rows if isinstance(row, dict)
    }
    for row in old_rows:
        if not isinstance(row, dict):
            continue
        label = str(row.get("label") or "")
        if current_labels and normalize_name(label) not in current_labels:
            continue
        if label and label not in existing_labels:
            new_rows.append(row)
            existing_labels.add(label)


def _preserve_existing_precise_geo(previous: object, current: object) -> bool:
    """Do not erase a validated network/OSM point during catalog normalization."""
    if not isinstance(previous, dict) or not isinstance(current, dict):
        return False
    source = str(previous.get("destinationCoordinateSource") or "")
    if source not in {"geocoder", "osm"}:
        return False
    if not _valid_coordinate_pair(
        previous.get("destinationLatitude"), previous.get("destinationLongitude")
    ):
        return False
    previous_address = previous.get("destinationAddress")
    previous_display = (
        previous_address.get("formatted") if isinstance(previous_address, dict) else ""
    ) or str(previous.get("destinationPlaceName") or "")
    expected_city = str(current.get("destinationCity") or "")
    expected_province = str(current.get("destinationProvince") or "")
    current_resolution_value = current.get("geoResolution")
    current_resolution = (
        current_resolution_value if isinstance(current_resolution_value, dict) else {}
    )
    current_mining_value = current_resolution.get("mining")
    current_mining = (
        current_mining_value if isinstance(current_mining_value, dict) else {}
    )
    current_labels = [
        normalize_name(label)
        for label in current_mining.get("candidateLabels", [])
        if str(label).strip()
    ]
    # NOTE: sourceCandidates are deliberately NOT used as evidence here — they
    # are preserved from the previous rebuild (_preserve_geo_mining), so relying
    # on them would create a self-justifying loop: a stale wrong pin (e.g.
    # tour_14 东北 -> 杭州西湖) would keep its preserved label as "evidence"
    # and never be cleared.
    previous_place = normalize_name(previous.get("destinationPlaceName"))
    previous_city = normalize_name(previous.get("destinationCity"))
    title = normalize_name(previous.get("title"))
    previous_tail = (
        previous_place[len(previous_city) :]
        if previous_city and previous_place.startswith(previous_city)
        else previous_place
    )
    supported_by_current_evidence = bool(
        previous_place
        and (
            previous_place in title
            or len(previous_tail) >= 3
            and previous_tail in title
            or any(
                previous_place in label or label in previous_place
                for label in current_labels
            )
        )
    )
    if (
        previous_place
        and previous_place != previous_city
        and not supported_by_current_evidence
    ):
        current_mining.pop("resolvedCandidate", None)
        for key in (
            "destinationLatitude",
            "destinationLongitude",
            "destinationGeoLevel",
            "destinationLocality",
            "destinationCoordinateSource",
            "destinationCoordinatePrecision",
            "destinationAddress",
            "geoConfidence",
            "geoSource",
        ):
            previous.pop(key, None)
        return False
    # An international route with only a province-level destination cannot
    # safely inherit any domestic OSM POI from a shared itinerary token.
    if (
        source == "osm"
        and is_international_route_title(previous.get("title"))
        and normalize_name(expected_city)
        and normalize_name(expected_city) in {normalize_name(expected_province), ""}
    ):
        current_mining.pop("resolvedCandidate", None)
        for key in (
            "destinationLatitude",
            "destinationLongitude",
            "destinationGeoLevel",
            "destinationLocality",
            "destinationCoordinateSource",
            "destinationCoordinatePrecision",
            "destinationAddress",
            "geoConfidence",
            "geoSource",
        ):
            previous.pop(key, None)
        return False
    if (
        source == "osm"
        and previous_place == previous_city
        and previous.get("destinationGeoLevel") == "poi"
    ):
        for key in (
            "destinationLatitude",
            "destinationLongitude",
            "destinationGeoLevel",
            "destinationLocality",
            "destinationCoordinateSource",
            "destinationCoordinatePrecision",
            "destinationAddress",
            "geoConfidence",
            "geoSource",
        ):
            previous.pop(key, None)
        return False
    if _has_conflicting_admin_context(
        expected_city,
        expected_province,
        previous_display,
        previous_address if isinstance(previous_address, dict) else {},
    ):
        for key in (
            "destinationLatitude",
            "destinationLongitude",
            "destinationGeoLevel",
            "destinationLocality",
            "destinationCoordinateSource",
            "destinationCoordinatePrecision",
            "destinationAddress",
            "geoConfidence",
            "geoSource",
        ):
            previous.pop(key, None)
        return False
    current_source = str(current.get("destinationCoordinateSource") or "")
    if current_source in {"catalog", "osm"} and current_source != "unknown":
        return False
    for key in (
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
    ):
        if key in previous:
            current[key] = previous[key]
    return True


def _apply_coarse_destination_fallback(tour: dict) -> bool:
    """Keep a mined destination visible when only its parent city is trusted."""
    if _valid_coordinate_pair(
        tour.get("destinationLatitude"), tour.get("destinationLongitude")
    ):
        return False
    label = str(tour.get("destinationPlaceName") or "").strip()
    city = str(tour.get("destinationCity") or "").strip()
    if not label or not city or label == city:
        return False
    parent = find_place(city)
    if not isinstance(parent, dict) or not _valid_coordinate_pair(
        parent.get("latitude"), parent.get("longitude")
    ):
        return False

    tour["destinationLatitude"] = parent["latitude"]
    tour["destinationLongitude"] = parent["longitude"]
    tour["destinationGeoLevel"] = "city"
    tour["destinationCoordinateSource"] = "fallback"
    tour["destinationCoordinatePrecision"] = "approximate"
    tour["destinationLocality"] = f"{city}范围"
    tour["geoConfidence"] = "low"
    tour["geoSource"] = "coarse-parent-city-fallback"
    tour["destinationAddress"] = {
        "formatted": f"{city}范围（模糊定位）",
        "country": parent.get("country", ""),
        "province": parent.get("province", ""),
        "city": city,
    }
    meta = tour.setdefault("meta", {})
    quality = meta.setdefault("dataQuality", {})
    field_sources = quality.setdefault("fieldSources", {})
    for field in (
        "destinationLatitude",
        "destinationLongitude",
        "destinationLocality",
        "destinationAddress",
    ):
        field_sources[field] = "inferred"
    resolution = tour.get("geoResolution")
    if isinstance(resolution, dict):
        resolution["fallback"] = {
            "status": "applied",
            "reason": "coarse-parent-city-fallback",
            "level": "city",
        }
    return True


def rebuild(
    tours: list[dict],
    allow_network: bool = False,
    geocode_cache_path: Path | None = None,
) -> tuple[int, int]:
    before = sum(1 for tour in tours if tour.get("destinationLatitude") is not None)
    for tour in tours:
        previous_resolution = tour.get("geoResolution")
        fields, field_sources = normalize_tour_geo(
            tour,
            str(tour.get("title") or ""),
            str(tour.get("destination") or ""),
            tour,
        )
        _preserve_geo_mining(previous_resolution, fields.get("geoResolution"))
        _preserve_existing_precise_geo(tour, fields)
        tour.update(fields)

        meta = tour.get("meta")
        if not isinstance(meta, dict):
            meta = {}
            tour["meta"] = meta
        quality = meta.get("dataQuality")
        if not isinstance(quality, dict):
            quality = {}
            meta["dataQuality"] = quality
        sources = quality.get("fieldSources")
        if not isinstance(sources, dict):
            sources = {}
            quality["fieldSources"] = sources
        sources.update(field_sources)
        quality.setdefault("syntheticFields", [])
        quality.setdefault("riskFlags", [])

    osm_candidates, osm_resolved = enrich_tours_from_osm(tours)
    for tour in tours:
        tour["routeRegion"] = classify_route(tour)

    if geocode_cache_path is None:
        candidates, resolved = enrich_tours(tours, allow_network=allow_network)
    else:
        candidates, resolved = enrich_tours(
            tours, allow_network=allow_network, cache_path=geocode_cache_path
        )
    fallback_resolved = sum(
        1 for tour in tours if _apply_coarse_destination_fallback(tour)
    )
    for tour in tours:
        _update_geo_resolution_final(tour)
    after = sum(1 for tour in tours if tour.get("destinationLatitude") is not None)
    print(f"OSM POI resolution: candidates {osm_candidates}; resolved {osm_resolved}")
    print(f"Coarse destination fallback: resolved {fallback_resolved}")
    return before, after


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--network", action="store_true", help="query public geocoders for cache misses"
    )
    args = parser.parse_args()
    root = Path(__file__).resolve().parent.parent
    tours_path = root / "public" / "data" / "tours.json"
    split_script = Path(__file__).resolve().parent / "split_tour_data.mjs"

    try:
        with tours_path.open("r", encoding="utf-8-sig") as handle:
            tours = json.load(handle)
    except (OSError, json.JSONDecodeError) as error:
        raise SystemExit(f"failed to load tours.json: {error}") from error
    if not isinstance(tours, list) or not all(isinstance(tour, dict) for tour in tours):
        raise ValueError("public/data/tours.json must contain a list of tour objects")

    before, after = rebuild(tours, allow_network=args.network)
    atomic_write_json(tours_path, tours)
    subprocess.run(["node", str(split_script)], cwd=root, check=True)
    print(
        f"Geo data rebuilt: destination points {before} -> {after}; tours {len(tours)}"
    )


if __name__ == "__main__":
    main()
