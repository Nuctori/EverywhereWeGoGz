#!/usr/bin/env python3
"""Build a compact, versioned POI index from regional OpenStreetMap extracts."""

from __future__ import annotations

import argparse
import json
import os
import re
import tempfile
import time
import urllib.error
from datetime import datetime, timezone
from pathlib import Path
from urllib.request import Request, urlopen

DEFAULT_REGIONS_PATH = Path(__file__).with_name("osm-poi-regions.json")
DEFAULT_OUTPUT_PATH = (
    Path(__file__).resolve().parent.parent / "public" / "data" / "osm-poi-index.json"
)
HOTEL_TOURISM_VALUES = {
    "hotel",
    "guest_house",
    "hostel",
    "motel",
    "resort",
    "chalet",
    "apartment",
}
TOURISM_VALUES = HOTEL_TOURISM_VALUES | {
    "attraction",
    "theme_park",
    "zoo",
    "museum",
    "viewpoint",
    "camp_site",
}
NAME_KEYS = (
    "name",
    "name:zh",
    "alt_name",
    "official_name",
    "brand",
    "operator",
    "name:en",
)


def normalize_name(value: object) -> str:
    return re.sub(r"[^0-9A-Za-z\u4e00-\u9fff]", "", str(value or "")).lower()


def split_names(tags: dict) -> list[str]:
    names: list[str] = []
    for key in NAME_KEYS:
        for value in re.split(r"[;；/]", str(tags.get(key) or "")):
            value = value.strip()
            if value and value not in names:
                names.append(value)
    return names


def poi_kind(tags: dict) -> str:
    tourism = str(tags.get("tourism") or "").strip()
    if tourism in HOTEL_TOURISM_VALUES or str(tags.get("amenity") or "") in {
        "hotel",
        "guest_house",
    }:
        return "hotel"
    if tourism in TOURISM_VALUES:
        return "attraction"
    return ""


def address_from_tags(tags: dict, region: dict) -> dict:
    address = {
        "country": str(
            tags.get("addr:country") or region.get("country") or "中国"
        ).strip(),
        "province": str(
            tags.get("addr:province") or region.get("province") or ""
        ).strip(),
        "city": str(tags.get("addr:city") or "").strip(),
        "district": str(tags.get("addr:district") or "").strip(),
        "locality": str(
            tags.get("addr:subdistrict") or tags.get("addr:place") or ""
        ).strip(),
        "street": str(tags.get("addr:street") or "").strip(),
        "houseNumber": str(tags.get("addr:housenumber") or "").strip(),
        "postalCode": str(tags.get("addr:postcode") or "").strip(),
    }
    return {key: value for key, value in address.items() if value}


def make_poi(
    *,
    osm_type: str,
    osm_id: int,
    tags: dict,
    latitude: float,
    longitude: float,
    region: dict,
) -> dict | None:
    names = split_names(tags)
    kind = poi_kind(tags)
    if (
        not names
        or not kind
        or not (-90 <= latitude <= 90 and -180 <= longitude <= 180)
    ):
        return None
    address = address_from_tags(tags, region)
    formatted_parts = [
        names[0],
        address.get("street", ""),
        address.get("locality", ""),
        address.get("district", ""),
        address.get("city", ""),
        address.get("province", ""),
        address.get("country", ""),
    ]
    formatted = ", ".join(part for part in formatted_parts if part)
    if formatted:
        address["formatted"] = formatted
    return {
        "osmId": f"{osm_type}/{osm_id}",
        "name": names[0],
        "normalizedName": normalize_name(names[0]),
        "aliases": names[1:],
        "kind": kind,
        "latitude": round(latitude, 7),
        "longitude": round(longitude, 7),
        "coordinateSystem": "wgs84",
        "address": address,
    }


def build_index(rows: list[dict], regions: list[str]) -> dict:
    unique = {
        row["osmId"]: row for row in rows if isinstance(row, dict) and row.get("osmId")
    }
    pois = sorted(
        unique.values(), key=lambda row: (row["normalizedName"], row["osmId"])
    )
    return {
        "schemaVersion": 1,
        "source": "OpenStreetMap contributors",
        "license": "ODbL-1.0",
        "generatedAt": datetime.now(timezone.utc)
        .replace(microsecond=0)
        .isoformat()
        .replace("+00:00", "Z"),
        "regions": sorted(set(regions)),
        "pois": pois,
    }


def atomic_write_json(path: Path, value: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, temporary_name = tempfile.mkstemp(
        prefix=f".{path.name}.", suffix=".tmp", dir=path.parent
    )
    try:
        with os.fdopen(fd, "w", encoding="utf-8", newline="\n") as handle:
            json.dump(value, handle, ensure_ascii=False, separators=(",", ":"))
            handle.write("\n")
        os.replace(temporary_name, path)
    finally:
        if os.path.exists(temporary_name):
            os.unlink(temporary_name)


def download(url: str, destination: Path, max_bytes: int, retries: int = 1) -> None:
    # ponytail: 5xx/429 transient gateway blip (geofabrik 502 on 2026-09-01) retries once; 404 no-retry
    last_exc: Exception | None = None
    for attempt in range(retries + 1):
        try:
            request = Request(
                url, headers={"User-Agent": "EverywhereWeGoGz-OSM-Indexer/1.0"}
            )
            with (
                urlopen(request, timeout=120) as response,
                destination.open("wb") as handle,
            ):
                content_length = int(response.headers.get("Content-Length") or 0)
                if content_length and content_length > max_bytes:
                    raise ValueError(
                        f"{url} is larger than the configured download limit"
                    )
                written = 0
                while chunk := response.read(1024 * 1024):
                    written += len(chunk)
                    if written > max_bytes:
                        raise ValueError(
                            f"{url} exceeded the configured download limit"
                        )
                    handle.write(chunk)
            return
        except urllib.error.HTTPError as exc:
            last_exc = exc
            if exc.code in (429, 500, 502, 503, 504) and attempt < retries:
                if destination.exists():
                    destination.unlink()
                time.sleep(1.5 * (attempt + 1))
                continue
            raise
        except (OSError, urllib.error.URLError) as exc:
            last_exc = exc
            if attempt < retries:
                if destination.exists():
                    destination.unlink()
                time.sleep(1.5 * (attempt + 1))
                continue
            raise
    if last_exc:
        raise last_exc


def extract_pois(pbf_path: Path, region: dict) -> list[dict]:
    try:
        import osmium
    except ImportError as error:
        raise RuntimeError(
            "Install pyosmium (pip install osmium) before building the OSM POI index"
        ) from error

    rows: list[dict] = []

    class PoiHandler(osmium.SimpleHandler):
        def add(self, item, osm_type: str, latitude: float, longitude: float) -> None:
            poi = make_poi(
                osm_type=osm_type,
                osm_id=item.id,
                tags=dict(item.tags),
                latitude=latitude,
                longitude=longitude,
                region=region,
            )
            if poi:
                rows.append(poi)

        def node(self, node) -> None:
            if node.location.valid():
                self.add(node, "node", node.location.lat, node.location.lon)

        def way(self, way) -> None:
            coordinates = [node.location for node in way.nodes if node.location.valid()]
            if coordinates:
                self.add(
                    way,
                    "way",
                    sum(point.lat for point in coordinates) / len(coordinates),
                    sum(point.lon for point in coordinates) / len(coordinates),
                )

    handler = PoiHandler()
    handler.apply_file(str(pbf_path), locations=True)
    return rows


def load_regions(path: Path, selected: list[str]) -> list[dict]:
    payload = json.loads(path.read_text(encoding="utf-8"))
    regions = payload.get("regions") if isinstance(payload, dict) else None
    if not isinstance(regions, list):
        raise ValueError("OSM region config must contain a regions array")
    wanted = set(selected)
    selected_regions = [
        region
        for region in regions
        if isinstance(region, dict) and (not wanted or region.get("id") in wanted)
    ]
    if wanted - {str(region.get("id")) for region in selected_regions}:
        raise ValueError("Unknown OSM region requested")
    return selected_regions


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--regions-config", type=Path, default=DEFAULT_REGIONS_PATH)
    parser.add_argument(
        "--region",
        action="append",
        default=[],
        help="region id from osm-poi-regions.json; repeatable",
    )
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT_PATH)
    parser.add_argument(
        "--work-dir",
        type=Path,
        help="temporary download directory; omitted means an auto-cleaned directory",
    )
    parser.add_argument("--max-download-mib", type=int, default=1024)
    args = parser.parse_args()

    regions = load_regions(args.regions_config, args.region)
    max_bytes = args.max_download_mib * 1024 * 1024
    temporary_directory = None
    work_dir = args.work_dir
    if work_dir is None:
        temporary_directory = tempfile.TemporaryDirectory(prefix="osm-poi-")
        work_dir = Path(temporary_directory.name)
    work_dir.mkdir(parents=True, exist_ok=True)
    try:
        rows: list[dict] = []
        for region in regions:
            pbf_path = work_dir / f"{region['id']}.osm.pbf"
            download(str(region["url"]), pbf_path, max_bytes)
            rows.extend(extract_pois(pbf_path, region))
        index = build_index(rows, [str(region["id"]) for region in regions])
        if not index["pois"]:
            raise RuntimeError(
                "OSM POI extraction produced no places; refusing to publish an empty index"
            )
        atomic_write_json(args.output, index)
        print(
            f"OSM POI index built: {len(index['pois'])} places across {len(regions)} regions"
        )
    finally:
        if temporary_directory is not None:
            temporary_directory.cleanup()


if __name__ == "__main__":
    main()
