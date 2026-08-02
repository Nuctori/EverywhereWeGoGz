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


def test_resolver_matches_a_named_poi_with_a_hotel_suffix():
    poi = dict(
        hotel_poi(),
        name="三英温泉度假酒店",
        aliases=[],
        latitude=23.562218,
        longitude=113.7772115,
        address={"country": "中国", "province": "广东省"},
    )
    result = resolve_poi(
        "增城三英温泉",
        expected_city="增城",
        expected_province="广东",
        expected_latitude=23.2904,
        expected_longitude=113.8108,
        pois=[poi],
    )
    assert result is not None
    assert result["latitude"] == 23.562218


def test_resolver_matches_equivalent_hot_spring_and_hotel_suffixes():
    poi = dict(
        hotel_poi(),
        name="翔顺龙山酒店",
        aliases=[],
        latitude=22.5901829,
        longitude=112.2212349,
        address={"country": "中国", "province": "广东省"},
    )
    result = resolve_poi(
        "新兴翔顺龙山温泉",
        expected_city="新兴",
        expected_province="广东",
        expected_latitude=22.695,
        expected_longitude=112.225,
        pois=[poi],
    )
    assert result is not None
    assert result["longitude"] == 112.2212349


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
    unverified_region = dict(nearby, address={"country": "中国"})
    assert resolve_poi(
        "肇庆星湖大酒店",
        expected_city="肇庆",
        expected_province="广东",
        expected_latitude=23.0472,
        expected_longitude=112.4651,
        pois=[unverified_region],
    ) is None


def test_region_context_rejects_short_foreign_city_token_but_keeps_exact_named_poi():
    same_name_hotel = dict(
        hotel_poi(),
        name="\u7ef4\u4e5f\u7eb3\u56fd\u9645\u9152\u5e97",
        aliases=[],
        address={"country": "\u4e2d\u56fd", "province": "\u5e7f\u4e1c\u7701"},
    )
    assert resolve_poi(
        "\u7ef4\u4e5f\u7eb3",
        expected_city="\u5e7f\u4e1c",
        expected_province="\u5e7f\u4e1c",
        pois=[same_name_hotel],
    ) is None

    exact_named_poi = dict(
        hotel_poi(),
        name="\u94a7\u660e\u6b22\u4e50\u4e16\u754c",
        aliases=[],
        address={"country": "\u4e2d\u56fd", "province": "\u5e7f\u4e1c\u7701"},
    )
    result = resolve_poi(
        "\u94a7\u660e\u6b22\u4e50\u4e16\u754c",
        expected_city="\u5e7f\u4e1c",
        expected_province="\u5e7f\u4e1c",
        pois=[exact_named_poi],
    )
    assert result is not None


def test_enrichment_skips_international_itinerary_pois_in_region_context():
    poi = dict(
        hotel_poi(),
        name="\u8679\u6865",
        aliases=[],
        kind="attraction",
        address={"country": "\u4e2d\u56fd", "province": "\u5e7f\u4e1c\u7701"},
    )
    index = build_index([poi], ["guangdong"])
    tours = [{
        "id": "international-itinerary-tour",
        "title": "\u6469\u6d1b\u54e59\u5929\u56db\u5b63\u9152\u5e97\u4e0e\u8679\u6865",
        "destinationPlaceName": "\u5e7f\u4e1c",
        "destinationCity": "\u5e7f\u4e1c",
        "destinationProvince": "\u5e7f\u4e1c",
        "destinationCoordinateSource": "fallback",
        "geoResolution": {"mining": {"candidateLabels": ["\u8679\u6865"]}},
    }]
    with tempfile.TemporaryDirectory() as directory:
        path = Path(directory) / "osm-poi-index.json"
        path.write_text(json.dumps(index, ensure_ascii=False), encoding="utf-8")
        candidates, resolved = enrich_tours_from_osm(tours, path)

    assert candidates == 0
    assert resolved == 0
    assert tours[0]["destinationCoordinateSource"] == "fallback"


def test_enrichment_replaces_catalog_centroid_but_preserves_verified_geocoder():
    poi = hotel_poi()
    index = build_index([poi], ["guangdong"])
    tours = [
        {
            "id": "catalog-tour",
            "destinationPlaceName": "新丰",
            "destinationCity": "新丰",
            "destinationProvince": "广东",
            "destinationCoordinateSource": "catalog",
            "destinationLatitude": 24.0592,
            "destinationLongitude": 114.207,
            "geoResolution": {
                "mining": {
                    "sourceCandidates": [{
                        "label": "新丰温德姆花园酒店",
                        "source": "activity",
                        "priority": 120,
                    }]
                }
            },
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
    assert tours[0]["destinationPlaceName"] == "新丰温德姆花园酒店"
    assert tours[0]["destinationAddress"]["city"] == "新丰县"
    assert tours[1]["destinationCoordinateSource"] == "geocoder"


def test_enrichment_uses_catalog_candidate_labels_for_poi_upgrade():
    poi = dict(
        hotel_poi(),
        name="星湖大酒店",
        aliases=[],
        latitude=23.0571359,
        longitude=112.4668559,
        address={"country": "中国", "province": "广东省"},
    )
    index = build_index([poi], ["guangdong"])
    tours = [{
        "id": "candidate-label-tour",
        "destinationPlaceName": "肇庆",
        "destinationCity": "肇庆",
        "destinationProvince": "广东",
        "destinationCoordinateSource": "catalog",
        "destinationLatitude": 23.0472,
        "destinationLongitude": 112.4651,
        "geoResolution": {"mining": {"candidateLabels": ["肇庆星湖大酒店"]}},
    }]
    with tempfile.TemporaryDirectory() as directory:
        path = Path(directory) / "osm-poi-index.json"
        path.write_text(json.dumps(index, ensure_ascii=False), encoding="utf-8")
        _, resolved = enrich_tours_from_osm(tours, path)

    assert resolved == 1
    assert tours[0]["destinationPlaceName"] == "肇庆星湖大酒店"
    assert tours[0]["destinationCoordinateSource"] == "osm"


def test_enrichment_prefers_specific_source_candidate_over_broad_current_label():
    broad = dict(
        hotel_poi(),
        osmId="node/broad",
        name="龙山温泉度假区(凤铝集团)",
        aliases=[],
        latitude=22.5816899,
        longitude=112.2175553,
        address={"country": "中国", "province": "广东省"},
    )
    specific = dict(
        hotel_poi(),
        osmId="node/specific",
        name="翔顺龙山酒店",
        aliases=[],
        latitude=22.5901829,
        longitude=112.2212349,
        address={"country": "中国", "province": "广东省"},
    )
    index = build_index([broad, specific], ["guangdong"])
    tours = [{
        "id": "specific-candidate-tour",
        "destinationPlaceName": "新兴龙山温泉",
        "destinationCity": "新兴",
        "destinationProvince": "广东",
        "destinationCoordinateSource": "fallback",
        "destinationLatitude": 22.695,
        "destinationLongitude": 112.225,
        "geoResolution": {
            "mining": {
                "candidateLabels": ["新兴翔顺龙山温泉", "新兴龙山温泉"],
                "sourceCandidates": [{"label": "新兴翔顺龙山温泉", "priority": 80}],
            }
        },
    }]
    with tempfile.TemporaryDirectory() as directory:
        path = Path(directory) / "osm-poi-index.json"
        path.write_text(json.dumps(index, ensure_ascii=False), encoding="utf-8")
        _, resolved = enrich_tours_from_osm(tours, path)

    assert resolved == 1
    assert tours[0]["destinationLongitude"] == 112.2212349


def test_enrichment_does_not_reuse_unsupported_current_poi_label():
    poi = dict(
        hotel_poi(),
        name="国恩寺",
        aliases=[],
        latitude=22.5917178,
        longitude=112.2234103,
        address={"country": "中国", "province": "广东省", "city": "云浮市", "district": "新兴县"},
        kind="attraction",
    )
    index = build_index([poi], ["guangdong"])
    tours = [{
        "id": "unsupported-current-label-tour",
        "destinationPlaceName": "国恩寺",
        "destinationCity": "新兴",
        "destinationProvince": "广东",
        "destinationCoordinateSource": "fallback",
        "destinationLatitude": 22.695,
        "destinationLongitude": 112.225,
        "geoResolution": {"mining": {"candidateLabels": ["新兴象窝", "肇庆七星岩"]}},
    }]
    with tempfile.TemporaryDirectory() as directory:
        path = Path(directory) / "osm-poi-index.json"
        path.write_text(json.dumps(index, ensure_ascii=False), encoding="utf-8")
        _, resolved = enrich_tours_from_osm(tours, path)

    assert resolved == 0
    assert tours[0]["destinationCoordinateSource"] == "fallback"


def test_enrichment_ignores_unrelated_itinerary_pois_after_primary_destination_is_known():
    primary = dict(
        hotel_poi(),
        osmId="node/primary",
        name="翔顺象窝酒店",
        aliases=[],
        latitude=22.5637358,
        longitude=112.2907439,
        address={"country": "中国", "province": "广东省"},
    )
    incidental = dict(
        hotel_poi(),
        osmId="node/incidental",
        name="翔顺龙山酒店",
        aliases=[],
        latitude=22.5901829,
        longitude=112.2212349,
        address={"country": "中国", "province": "广东省"},
    )
    index = build_index([primary, incidental], ["guangdong"])
    tours = [{
        "id": "primary-destination-tour",
        "destinationPlaceName": "新兴象窝",
        "destinationCity": "新兴",
        "destinationProvince": "广东",
        "destinationCoordinateSource": "fallback",
        "destinationLatitude": 22.695,
        "destinationLongitude": 112.225,
        "geoResolution": {"mining": {"candidateLabels": ["新兴象窝", "新兴龙山温泉"]}},
    }]
    with tempfile.TemporaryDirectory() as directory:
        path = Path(directory) / "osm-poi-index.json"
        path.write_text(json.dumps(index, ensure_ascii=False), encoding="utf-8")
        _, resolved = enrich_tours_from_osm(tours, path)

    assert resolved == 1
    assert tours[0]["destinationPlaceName"] == "新兴象窝"
    assert tours[0]["destinationLongitude"] == 112.2907439


if __name__ == "__main__":
    test_index_keeps_only_minimal_wgs84_poi_fields()
    test_resolver_requires_specific_name_and_uses_city_context()
    test_resolver_matches_a_named_poi_with_a_hotel_suffix()
    test_extractor_reads_real_osm_elements_when_osmium_is_available()
    test_resolver_does_not_pick_an_ambiguous_suffix_match()
    test_resolver_rejects_same_name_poi_when_known_region_conflicts()
    test_resolver_uses_existing_city_fallback_when_osm_address_omits_city()
    test_region_context_rejects_short_foreign_city_token_but_keeps_exact_named_poi()
    test_enrichment_skips_international_itinerary_pois_in_region_context()
    test_enrichment_replaces_catalog_centroid_but_preserves_verified_geocoder()
    print("OSM POI index tests passed")
