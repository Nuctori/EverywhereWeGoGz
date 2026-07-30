#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Rebuild geo fields and map indexes without refetching tour data."""

import json
import os
import subprocess
import tempfile
import argparse
from pathlib import Path

from geo_catalog import classify_route, normalize_tour_geo
from geocode_destinations import enrich_tours


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


def rebuild(tours: list[dict], allow_network: bool = False) -> tuple[int, int, int, int]:
    before = sum(1 for tour in tours if tour.get("destinationLatitude") is not None)
    for tour in tours:
        fields, field_sources = normalize_tour_geo(
            tour,
            str(tour.get("title") or ""),
            str(tour.get("destination") or ""),
            tour,
        )
        fields["routeRegion"] = classify_route(fields)
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

    candidates, resolved = enrich_tours(tours, allow_network=allow_network)
    after = sum(1 for tour in tours if tour.get("destinationLatitude") is not None)
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
