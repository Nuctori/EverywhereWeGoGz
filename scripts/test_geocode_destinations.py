#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from pathlib import Path

from geocode_destinations import destination_queries, enrich_tours, normalize_query
from geo_catalog import normalize_tour_geo


def test_destination_queries_keep_named_place_and_admin_context():
    tour = {
        "title": "广州往返--肇庆怀集蓝钟森林温泉酒店 纯玩3天",
        "destinationPlaceName": "肇庆蓝钟温泉",
        "destinationCity": "肇庆",
        "destinationProvince": "广东",
    }
    queries = destination_queries(tour)
    assert queries[0] == "肇庆蓝钟温泉 怀集 广东 中国"
    assert queries[1] == "肇庆蓝钟温泉 广东 中国"


def test_cached_geocoder_result_overrides_city_fallback(tmp_path: Path):
    tour = {
        "title": "肇庆蓝钟温泉3天",
        "destinationPlaceName": "肇庆蓝钟温泉",
        "destinationCity": "肇庆",
        "destinationProvince": "广东",
        "destinationLatitude": 23.0472,
        "destinationLongitude": 112.4651,
        "destinationGeoLevel": "poi",
        "destinationCoordinateSource": "fallback",
        "geoConfidence": "low",
        "geoSource": "title-place-miner",
        "meta": {"dataQuality": {"fieldSources": {}}},
    }
    cache_path = tmp_path / "geo-cache.json"
    cache_path.write_text(
        '{"肇庆蓝钟温泉 广东 中国": {"provider": "test", "latitude": 24.2, "longitude": 112.2, "level": "town", "locality": "蓝钟镇"}}',
        encoding="utf-8",
    )

    candidates, resolved = enrich_tours([tour], cache_path=cache_path)

    assert candidates == 1
    assert resolved == 1
    assert tour["destinationLatitude"] == 24.2
    assert tour["destinationLongitude"] == 112.2
    assert tour["destinationLocality"] == "蓝钟镇"
    assert tour["destinationCoordinateSource"] == "geocoder"
    assert tour["geoSource"] == "geocoder"
    assert normalize_query(" 肇庆蓝钟温泉 广东 中国 ") in __import__("json").loads(cache_path.read_text(encoding="utf-8"))


def test_catalog_coordinates_are_not_sent_to_external_geocoder(tmp_path: Path):
    tour = {
        "title": "珠海海泉湾3天",
        "destinationPlaceName": "珠海海泉湾",
        "destinationCity": "珠海",
        "destinationProvince": "广东",
        "destinationCoordinateSource": "catalog",
    }
    candidates, resolved = enrich_tours([tour], cache_path=tmp_path / "geo-cache.json")
    assert candidates == 0
    assert resolved == 0


def test_named_title_destination_does_not_inherit_city_centroid():
    fields, _ = normalize_tour_geo(
        {
            "destination": "广东",
            "title": "<潇洒行>广州往返--肇庆怀集蓝钟森林温泉酒店 纯玩3天",
        },
        "<潇洒行>广州往返--肇庆怀集蓝钟森林温泉酒店 纯玩3天",
        "广东",
        {},
    )

    assert fields["destinationPlaceName"] == "肇庆蓝钟"
    assert fields["destinationCity"] == "肇庆"
    assert fields["destinationLatitude"] is None
    assert fields["destinationLongitude"] is None
    assert fields["destinationCoordinateSource"] == "inferred"


def test_named_destination_from_title_is_geocoder_candidate():
    fields, _ = normalize_tour_geo(
        {"destination": "广东", "title": "肇庆蓝钟温泉3天"},
        "肇庆蓝钟温泉3天",
        "广东",
        {},
    )
    tour = {
        "title": "肇庆蓝钟温泉3天",
        **fields,
        "meta": {"dataQuality": {"fieldSources": {}}},
    }

    queries = destination_queries(tour)
    assert queries[0] == "肇庆蓝钟温泉 广东 中国"
    assert tour["destinationCoordinateSource"] == "inferred"


def test_unique_alias_without_canonical_city_does_not_inherit_city_centroid():
    fields, _ = normalize_tour_geo(
        {"destination": "其他", "title": "星耀肇城蓝钟喜来登3天"},
        "星耀肇城蓝钟喜来登3天",
        "其他",
        {},
    )

    assert fields["destinationPlaceName"] == "肇庆蓝钟"
    assert fields["destinationLatitude"] is None
    assert fields["destinationLongitude"] is None
    assert fields["destinationCoordinateSource"] == "inferred"


if __name__ == "__main__":
    test_destination_queries_keep_named_place_and_admin_context()
    test_cached_geocoder_result_overrides_city_fallback(Path("."))
    test_named_title_destination_does_not_inherit_city_centroid()
    test_named_destination_from_title_is_geocoder_candidate()
    test_unique_alias_without_canonical_city_does_not_inherit_city_centroid()
    print("geocoder destination tests passed")
