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
from geocode_destinations import enrich_tours
from osm_poi_resolver import enrich_tours_from_osm


def atomic_write_json(path: Path, value) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, temp_name = tempfile.mkstemp(prefix=f".{path.name}.", suffix=".tmp", dir=path.parent)
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
            reason = "region-catalog-fallback" if tour.get("geoSource") == "local-region-catalog" else "coarse-parent-city-fallback"
            final["reason"] = reason
        resolution["final"] = final
    else:
        resolution["final"] = {"status": "unmapped"}


def _apply_coarse_destination_fallback(tour: dict) -> bool:
    """Keep a mined destination visible when only its parent city is trusted."""
    if _valid_coordinate_pair(tour.get("destinationLatitude"), tour.get("destinationLongitude")):
        return False
    label = str(tour.get("destinationPlaceName") or "").strip()
    city = str(tour.get("destinationCity") or "").strip()
    if not label or not city or label == city:
        return False
    parent = find_place(city)
    if not isinstance(parent, dict) or not _valid_coordinate_pair(parent.get("latitude"), parent.get("longitude")):
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
    for field in ("destinationLatitude", "destinationLongitude", "destinationLocality", "destinationAddress"):
        field_sources[field] = "inferred"
    resolution = tour.get("geoResolution")
    if isinstance(resolution, dict):
        resolution["fallback"] = {
            "status": "applied",
            "reason": "coarse-parent-city-fallback",
            "level": "city",
        }
    return True


def rebuild(tours: list[dict], allow_network: bool = False, geocode_cache_path: Path | None = None) -> tuple[int, int]:
    before = sum(1 for tour in tours if tour.get("destinationLatitude") is not None)
    for tour in tours:
        fields, field_sources = normalize_tour_geo(
            tour,
            str(tour.get("title") or ""),
            str(tour.get("destination") or ""),
            tour,
        )
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
        candidates, resolved = enrich_tours(tours, allow_network=allow_network, cache_path=geocode_cache_path)
    fallback_resolved = sum(1 for tour in tours if _apply_coarse_destination_fallback(tour))
    for tour in tours:
        _update_geo_resolution_final(tour)
    after = sum(1 for tour in tours if tour.get("destinationLatitude") is not None)
    print(f"OSM POI resolution: candidates {osm_candidates}; resolved {osm_resolved}")
    print(f"Coarse destination fallback: resolved {fallback_resolved}")
    return before, after


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--network", action="store_true", help="query public geocoders for cache misses")
    args = parser.parse_args()
    root = Path(__file__).resolve().parent.parent
    tours_path = root / "public" / "data" / "tours.json"
    split_script = Path(__file__).resolve().parent / "split_tour_data.mjs"

    with tours_path.open("r", encoding="utf-8-sig") as handle:
        tours = json.load(handle)
    if not isinstance(tours, list) or not all(isinstance(tour, dict) for tour in tours):
        raise ValueError("public/data/tours.json must contain a list of tour objects")

    before, after = rebuild(tours, allow_network=args.network)
    atomic_write_json(tours_path, tours)
    subprocess.run(["node", str(split_script)], cwd=root, check=True)
    print(f"Geo data rebuilt: destination points {before} -> {after}; tours {len(tours)}")


if __name__ == "__main__":
    main()
