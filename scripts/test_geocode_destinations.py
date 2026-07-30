#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from pathlib import Path

import geocode_destinations as geocoder
from geocode_destinations import (
    _arcgis_result,
    _nominatim_result,
    _photon_result,
    destination_queries,
    enrich_tours,
    normalize_query,
)
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
        '{"肇庆蓝钟温泉 广东 中国": {"provider": "nominatim", "latitude": 24.2, "longitude": 112.2, "level": "town", "locality": "蓝钟镇", "displayName": "蓝钟温泉, 蓝钟镇, 肇庆市, 广东省, 中国"}}',
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


def test_invalid_cached_result_does_not_upgrade_the_wrong_poi(tmp_path: Path):
    tour = {
        "title": "肇庆七星岩3天",
        "destinationPlaceName": "肇庆七星岩",
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
        '{"七星岩 肇庆市 广东省 中国": {"provider": "nominatim", "latitude": 23.06, "longitude": 112.47, "level": "poi", "displayName": "七星公园, 肇庆市, 广东省, 中国"}}',
        encoding="utf-8",
    )

    candidates, resolved = enrich_tours([tour], cache_path=cache_path)

    assert candidates == 1
    assert resolved == 0
    assert tour["destinationCoordinateSource"] == "fallback"
    assert tour["destinationLatitude"] == 23.0472


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


def test_named_poi_aliases_become_geocoder_candidates():
    for poi in ("肇庆七星岩", "肇庆紫云谷"):
        fields, _ = normalize_tour_geo(
            {"destination": "广东", "title": f"广州出发{poi}3天"},
            f"广州出发{poi}3天",
            "广东",
            {},
        )
        tour = {
            "title": f"广州出发{poi}3天",
            **fields,
            "meta": {"dataQuality": {"fieldSources": {}}},
        }
        assert fields["destinationPlaceName"] == poi
        assert fields["destinationCity"] == "肇庆"
        assert fields["destinationCoordinateSource"] == "inferred"
        assert destination_queries(tour)[0].startswith(f"{poi} 广东 中国")
        assert any(f"{poi[2:]} 肇庆市 广东省 中国" in query for query in destination_queries(tour))


def test_geocoder_requires_poi_name_and_expected_city():
    arcgis = {
        "candidates": [
            {"address": "七星岩风景区，肇庆市端州区", "score": 98, "location": {"x": 112.48, "y": 23.10}},
            {"address": "七星岩风景区，其他市", "score": 99, "location": {"x": 113.0, "y": 24.0}},
        ]
    }
    result = _arcgis_result("肇庆七星岩", arcgis, "肇庆")
    assert result["longitude"] == 112.48
    assert _arcgis_result("肇庆七星岩", {
        "candidates": [{"address": "七星岩风景区，其他市", "score": 99, "location": {"x": 113.0, "y": 24.0}}]
    }, "肇庆") is None
    assert _arcgis_result("肇庆七星岩", {
        "candidates": [{"address": "七星公园，肇庆市", "score": 99, "location": {"x": 112.5, "y": 23.1}}]
    }, "肇庆") is None

    nominatim = [{
        "display_name": "紫云谷, 肇庆市, 广东省, 中国",
        "lat": "23.12",
        "lon": "112.55",
        "address": {"tourism": "紫云谷", "city": "肇庆市", "state": "广东省"},
    }]
    result = _nominatim_result("肇庆紫云谷", nominatim, "肇庆")
    assert result["latitude"] == 23.12
    assert result["longitude"] == 112.55
    assert _nominatim_result("肇庆七星岩", [{
        "display_name": "七星公园, 肇庆市, 广东省, 中国",
        "lat": "23.12",
        "lon": "112.55",
        "address": {"tourism": "七星公园", "city": "肇庆市", "state": "广东省"},
    }], "肇庆") is None
    assert _nominatim_result("肇庆七星岩", [{
        "name": "七星岩顶",
        "display_name": "七星岩顶, 肇庆市, 广东省, 中国",
        "lat": "23.53",
        "lon": "111.96",
        "address": {"natural": "七星岩顶", "city": "肇庆市", "state": "广东省"},
    }], "肇庆") is None


def test_photon_result_uses_geojson_longitude_then_latitude():
    photon = {
        "features": [{
            "geometry": {"type": "Point", "coordinates": [112.56, 23.13]},
            "properties": {"name": "紫云谷", "city": "肇庆市", "state": "广东省", "country": "中国"},
        }]
    }
    result = _photon_result("肇庆紫云谷", photon, "肇庆")
    assert result["latitude"] == 23.13
    assert result["longitude"] == 112.56
    assert _photon_result("肇庆七星岩", {
        "features": [{
            "geometry": {"type": "Point", "coordinates": [112.5, 23.1]},
            "properties": {"name": "七星公园", "city": "肇庆市", "state": "广东省", "country": "中国"},
        }]
    }, "肇庆") is None
    assert _photon_result("肇庆七星岩", {
        "features": [{
            "geometry": {"type": "Point", "coordinates": [112.47, 23.08]},
            "properties": {"name": "七星岩景区", "city": "肇庆市", "state": "广东省", "country": "中国"},
        }]
    }, "肇庆")["latitude"] == 23.08


def test_geocoder_pool_skips_repeatedly_unavailable_providers():
    original_request = geocoder._request_json
    calls = []

    def unavailable_request(endpoint, params, timeout):
        calls.append((endpoint, timeout))
        return None

    try:
        geocoder.reset_geocoder_pool_health()
        geocoder._request_json = unavailable_request
        assert geocoder.geocode_query("肇庆七星岩", "七星岩 肇庆市 广东省 中国", "肇庆") is None
        assert geocoder.geocode_query("肇庆紫云谷", "紫云谷 肇庆市 广东省 中国", "肇庆") is None
        assert geocoder.geocode_query("肇庆蓝钟", "蓝钟 肇庆 广东 中国", "肇庆") is None
        assert len(calls) == len(geocoder.GEOCODER_POOL) * geocoder.GEOCODER_POOL_FAILURE_LIMIT
        assert [timeout for _, timeout in calls[:3]] == [6, 8, 4]
    finally:
        geocoder._request_json = original_request
        geocoder.reset_geocoder_pool_health()


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
    test_invalid_cached_result_does_not_upgrade_the_wrong_poi(Path("."))
    test_named_title_destination_does_not_inherit_city_centroid()
    test_named_destination_from_title_is_geocoder_candidate()
    test_named_poi_aliases_become_geocoder_candidates()
    test_geocoder_requires_poi_name_and_expected_city()
    test_photon_result_uses_geojson_longitude_then_latitude()
    test_geocoder_pool_skips_repeatedly_unavailable_providers()
    test_unique_alias_without_canonical_city_does_not_inherit_city_centroid()
    print("geocoder destination tests passed")
