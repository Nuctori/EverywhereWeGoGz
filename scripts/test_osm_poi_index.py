#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Regression checks for the zero-key OSM POI index and resolver."""

import json
import tempfile
from pathlib import Path

from osm_poi_index import build_index, extract_pois, make_poi, normalize_name
from osm_poi_resolver import enrich_tours_from_osm, resolve_poi


def hotel_poi() -> dict:
    poi = make_poi(
        osm_type="node",
        osm_id=42,
        tags={
            "name": "温德姆花园酒店",
            "name:zh": "新丰温德姆花园酒店",
            "tourism": "hotel",
            "addr:city": "新丰县",
            "addr:street": "丰城大道",
        },
        latitude=24.06123,
        longitude=114.20456,
        region={"country": "中国", "province": "广东省"},
    )
    assert poi is not None
    return poi


def test_index_keeps_only_minimal_wgs84_poi_fields():
    poi = hotel_poi()
    index = build_index([poi, poi], ["guangdong"])

    assert index["schemaVersion"] == 1
    assert index["source"] == "OpenStreetMap contributors"
    assert index["regions"] == ["guangdong"]
    assert len(index["pois"]) == 1
    assert index["pois"][0]["coordinateSystem"] == "wgs84"
    assert index["pois"][0]["address"]["province"] == "广东省"
    assert normalize_name("新丰·温德姆花园酒店") == "新丰温德姆花园酒店"


def test_resolver_requires_specific_name_and_uses_city_context():
    poi = hotel_poi()
    result = resolve_poi(
        "新丰温德姆花园酒店",
        expected_city="新丰",
        expected_province="广东",
        pois=[poi],
    )

    assert result is not None
    assert result["latitude"] == 24.06123
    assert result["address"]["street"] == "丰城大道"
    assert resolve_poi("当地酒店", expected_city="新丰", pois=[poi]) is None
    city_prefixed_only = dict(poi, name="新丰温德姆花园酒店", aliases=[])
    assert resolve_poi("温德姆花园酒店", pois=[city_prefixed_only]) is None
    assert resolve_poi("新丰温德姆花园酒店", expected_city="新丰", pois=[poi]) is not None


def test_extractor_reads_real_osm_elements_when_osmium_is_available():
    osm = """<?xml version=\"1.0\" encoding=\"UTF-8\"?>
<osm version=\"0.6\"><node id=\"7\" lat=\"24.06123\" lon=\"114.20456\">
<tag k=\"name\" v=\"测试温泉酒店\"/><tag k=\"tourism\" v=\"hotel\"/>
<tag k=\"addr:city\" v=\"新丰县\"/></node>
<node id=\"8\" lat=\"24.07000\" lon=\"114.21000\"/>
<node id=\"9\" lat=\"24.07200\" lon=\"114.21200\"/>
<way id=\"10\"><nd ref=\"8\"/><nd ref=\"9\"/>
<tag k=\"name\" v=\"测试度假村\"/><tag k=\"tourism\" v=\"resort\"/></way></osm>"""
    with tempfile.TemporaryDirectory() as directory:
        source = Path(directory) / "fixture.osm"
        source.write_text(osm, encoding="utf-8")
        rows = extract_pois(source, {"country": "中国", "province": "广东省"})

    assert {row["osmId"] for row in rows} == {"node/7", "way/10"}
    assert all(row["kind"] == "hotel" for row in rows)


def test_resolver_does_not_pick_an_ambiguous_suffix_match():
    first = hotel_poi()
    second = dict(first, osmId="node/43", name="温德姆花园酒店", aliases=["新丰温德姆花园酒店"])

    assert resolve_poi("新丰温德姆花园酒店", pois=[first, second]) is None


def test_resolver_rejects_same_name_poi_when_known_region_conflicts():
    wrong_city = dict(
        hotel_poi(),
        name="岭南东方酒店",
        aliases=[],
        address={"country": "中国", "province": "广东省", "city": "肇庆市"},
    )
    wrong_province = dict(
        hotel_poi(),
        name="雅致酒店",
        aliases=[],
        address={"country": "中国", "province": "湖南省"},
    )

    assert resolve_poi("英德岭南东方酒店", expected_city="英德", expected_province="广东", pois=[wrong_city]) is None
    assert resolve_poi("新丰雅致酒店", expected_city="新丰", expected_province="广东", pois=[wrong_province]) is None


def test_resolver_uses_existing_city_fallback_when_osm_address_omits_city():
    nearby = dict(
        hotel_poi(),
        name="星湖大酒店",
        aliases=[],
        latitude=23.0571,
        longitude=112.4669,
        address={"country": "中国", "province": "广东省"},
    )
    result = resolve_poi(
        "肇庆星湖大酒店",
        expected_city="肇庆",
        expected_province="广东",
        expected_latitude=23.0472,
        expected_longitude=112.4651,
        pois=[nearby],
    )
    assert result is not None
    assert resolve_poi(
        "肇庆星湖大酒店",
        expected_city="肇庆",
        expected_province="广东",
        expected_latitude=30.0,
        expected_longitude=120.0,
        pois=[nearby],
    ) is None


def test_enrichment_replaces_catalog_centroid_but_preserves_verified_geocoder():
    poi = hotel_poi()
    index = build_index([poi], ["guangdong"])
    tours = [
        {
            "id": "catalog-tour",
            "destinationPlaceName": "新丰温德姆花园酒店",
            "destinationCity": "新丰",
            "destinationProvince": "广东",
            "destinationCoordinateSource": "catalog",
            "destinationLatitude": 24.0592,
            "destinationLongitude": 114.207,
        },
        {
            "id": "verified-tour",
            "destinationPlaceName": "新丰温德姆花园酒店",
            "destinationCity": "新丰",
            "destinationCoordinateSource": "geocoder",
        },
    ]
    with tempfile.TemporaryDirectory() as directory:
        path = Path(directory) / "osm-poi-index.json"
        path.write_text(json.dumps(index, ensure_ascii=False), encoding="utf-8")
        candidates, resolved = enrich_tours_from_osm(tours, path)

    assert candidates == 1
    assert resolved == 1
    assert tours[0]["destinationCoordinateSource"] == "osm"
    assert tours[0]["destinationAddress"]["city"] == "新丰县"
    assert tours[1]["destinationCoordinateSource"] == "geocoder"


if __name__ == "__main__":
    test_index_keeps_only_minimal_wgs84_poi_fields()
    test_resolver_requires_specific_name_and_uses_city_context()
    test_extractor_reads_real_osm_elements_when_osmium_is_available()
    test_resolver_does_not_pick_an_ambiguous_suffix_match()
    test_resolver_rejects_same_name_poi_when_known_region_conflicts()
    test_resolver_uses_existing_city_fallback_when_osm_address_omits_city()
    test_enrichment_replaces_catalog_centroid_but_preserves_verified_geocoder()
    print("OSM POI index tests passed")
