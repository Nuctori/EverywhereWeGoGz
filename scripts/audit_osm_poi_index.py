#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Reject an empty or malformed checked-in OSM POI index."""

from __future__ import annotations

import json
from pathlib import Path


INDEX_PATH = Path(__file__).resolve().parent.parent / "public" / "data" / "osm-poi-index.json"


def main() -> None:
    try:
        payload = json.loads(INDEX_PATH.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        raise SystemExit(f"OSM POI index is unreadable: {error}") from error

    pois = payload.get("pois") if isinstance(payload, dict) else None
    if not isinstance(pois, list) or not pois:
        raise SystemExit("OSM POI index must contain at least one POI")
    if not payload.get("regions"):
        raise SystemExit("OSM POI index must record its source regions")
    for poi in pois:
        if not isinstance(poi, dict) or poi.get("coordinateSystem") != "wgs84":
            raise SystemExit("OSM POI index contains an invalid coordinate system")
        try:
            latitude = float(poi["latitude"])
            longitude = float(poi["longitude"])
        except (KeyError, TypeError, ValueError) as error:
            raise SystemExit("OSM POI index contains invalid coordinates") from error
        if not -90 <= latitude <= 90 or not -180 <= longitude <= 180:
            raise SystemExit("OSM POI index contains out-of-range coordinates")

    print(f"OSM POI index audit passed: {len(pois)} places across {len(payload['regions'])} regions")


if __name__ == "__main__":
    main()
