#!/usr/bin/env python3
"""Targeted geocode cache prefill using only the photon provider.

The full --network rebuild is slow because no-match tours burn long timeouts
across three providers plus overpass. This prefill queries only photon (best
China POI coverage) for the first strict query of each unresolved tour, stores
validated results in the shared cache, and is fully reviewable. A later
cache-only rebuild consumes the filled entries.

Run BEFORE the cache-only rebuild; safe to re-run (idempotent cache update).
"""

import json
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

import geocode_destinations as geo  # noqa: E402
from geocode_destinations import (  # noqa: E402
    CACHE_PATH,
    _load_cache,
    _write_cache,
    destination_queries,
    geocode_query,
    normalize_query,
)

PHOTON_ONLY = (
    {"provider": "photon", "endpoint": "https://photon.komoot.io/api/", "timeout": 6},
)


def main() -> int:
    try:
        with (ROOT / "public" / "data" / "tours.json").open(
            encoding="utf-8-sig"
        ) as handle:
            tours = json.load(handle)
    except (OSError, json.JSONDecodeError) as error:
        print(f"tours load failed: {error}", file=sys.stderr)
        return 1

    targets = []
    for tour in tours:
        source = str(tour.get("destinationCoordinateSource") or "")
        if source in {"catalog", "osm"}:
            continue
        if source == "geocoder" and tour.get("destinationAddress"):
            continue
        queries = destination_queries(tour)
        if queries:
            targets.append((tour, queries))

    print(f"target tours: {len(targets)}", file=sys.stderr)
    cache = _load_cache(CACHE_PATH)
    before = len(cache)
    geo.GEOCODER_POOL = PHOTON_ONLY
    geo.OVERPASS_POOL = ()
    found = 0
    for index, (tour, queries) in enumerate(targets):
        label = str(tour.get("destinationPlaceName") or "")
        expected_city = str(tour.get("destinationCity") or "")
        expected_province = str(tour.get("destinationProvince") or "")
        for query in queries[:2]:
            key = normalize_query(query)
            if key in cache:
                continue
            result = geocode_query(label, query, expected_city, expected_province)
            if result:
                cache[key] = result
                found += 1
            time.sleep(0.05)
        if index % 50 == 0:
            print(f"progress {index}/{len(targets)} found={found}", file=sys.stderr)
    _write_cache(cache, CACHE_PATH)
    print(f"cache entries: {before} -> {len(cache)} (new {found})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
