#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from pathlib import Path

import geocode_destinations as geocoder
from geocode_destinations import (
    _arcgis_result,
    _address_from_display_name,
    _merge_geocoder_results,
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
    assert tour["destinationAddress"]["formatted"] == "蓝钟温泉, 蓝钟镇, 肇庆市, 广东省, 中国"
    assert tour["destinationAddress"]["city"] == "肇庆市"
    assert tour["destinationAddress"]["locality"] == "蓝钟镇"
    assert tour["destinationAddress"]["province"] == "广东省"
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

    assert fields["destinationPlaceName"] == "肇庆怀集蓝钟森林温泉酒店"
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


def test_title_hotel_suffix_is_a_geocoder_candidate_without_a_static_alias():
    fields, _ = normalize_tour_geo(
        {"destination": "广东", "title": "龙门温德姆温泉3天"},
        "龙门温德姆温泉3天",
        "广东",
        {},
    )

    assert fields["destinationCity"] == "龙门"
    assert fields["destinationPlaceName"] == "龙门温德姆温泉"
    assert fields["destinationGeoLevel"] == "poi"
    assert fields["destinationCoordinatePrecision"] == ""
    assert fields["destinationCoordinateSource"] == "inferred"
    assert destination_queries({"title": "龙门温德姆温泉3天", **fields})[0] == "龙门温德姆温泉 广东 中国"


def test_itinerary_named_hotel_is_a_geocoder_candidate_without_a_city_guess():
    fields, _ = normalize_tour_geo(
        {"destination": "广东", "title": "周末温泉3天"},
        "周末温泉3天",
        "广东",
        {"itinerary": [{"description": "前往【乐天温泉度假酒店】办理入住"}]},
    )

    assert fields["destinationPlaceName"] == "乐天温泉度假酒店"
    assert fields["destinationCity"] == ""
    assert fields["destinationLatitude"] is None
    assert fields["destinationCoordinateSource"] == "unknown"
    assert destination_queries({"title": "周末温泉3天", **fields}) == ["乐天温泉度假酒店 广东 中国"]


def test_itinerary_named_hotel_overrides_a_city_only_destination():
    fields, _ = normalize_tour_geo(
        {"destination": "肇庆", "title": "肇庆温泉3天"},
        "肇庆温泉3天",
        "肇庆",
        {"itinerary": [{"description": "入住【肇庆星湖大酒店】"}]},
    )

    assert fields["destinationPlaceName"] == "肇庆星湖大酒店"
    assert fields["destinationCity"] == "肇庆"
    assert fields["destinationLatitude"] is None
    assert destination_queries({"title": "肇庆温泉3天", **fields})[0] == "肇庆星湖大酒店 广东 中国"


def test_structured_accommodation_is_a_geocoder_candidate_without_same_class_noise():
    fields, _ = normalize_tour_geo(
        {"destination": "江西", "title": "江西高铁5天"},
        "江西高铁5天",
        "江西",
        {"itinerary": [{"accommodation": "仙女湖沁庐度假酒店或其他同级酒店；"}]},
    )

    assert fields["destinationPlaceName"] == "仙女湖沁庐度假酒店"
    assert fields["destinationLatitude"] is None
    assert fields["destinationCoordinateSource"] == "unknown"
    assert destination_queries({"title": "江西高铁5天", **fields}) == ["仙女湖沁庐度假酒店 江西 中国"]


def test_cityless_cached_poi_requires_an_exact_name(tmp_path: Path):
    tour = {
        "title": "周末温泉3天",
        "destinationPlaceName": "乐天温泉度假酒店",
        "destinationCity": "",
        "destinationProvince": "广东",
        "destinationCoordinateSource": "unknown",
        "meta": {"dataQuality": {"fieldSources": {}}},
    }
    cache_path = tmp_path / "geo-cache.json"
    cache_path.write_text(
        '{"乐天温泉度假酒店 广东 中国": {"provider": "nominatim", "latitude": 21.7, "longitude": 110.9, "level": "poi", "displayName": "乐天温泉度假酒店, 高州市, 广东省, 中国"}}',
        encoding="utf-8",
    )

    candidates, resolved = enrich_tours([tour], cache_path=cache_path)

    assert candidates == 1
    assert resolved == 1
    assert tour["destinationCoordinateSource"] == "geocoder"

    cache_path.write_text(
        '{"乐天温泉度假酒店 广东 中国": {"provider": "nominatim", "latitude": 21.7, "longitude": 110.9, "level": "poi", "displayName": "乐天温泉度假酒店（高州店）, 高州市, 广东省, 中国"}}',
        encoding="utf-8",
    )
    rejected_tour = {**tour, "destinationLatitude": None, "destinationLongitude": None, "destinationCoordinateSource": "unknown"}
    candidates, resolved = enrich_tours([rejected_tour], cache_path=cache_path)

    assert candidates == 1
    assert resolved == 0
    assert rejected_tour["destinationLatitude"] is None


def test_short_city_substrings_and_flight_cities_do_not_become_destinations():
    fields, _ = normalize_tour_geo(
        {"destination": "其他", "title": "山西双飞6天丨五台山丨平遥古城"},
        "山西双飞6天丨五台山丨平遥古城",
        "其他",
        {},
    )
    assert fields["destinationCity"] != "台山"

    fields, _ = normalize_tour_geo(
        {"destination": "港澳", "title": "澳门大三巴 外观巴黎人铁塔 珠海日月贝2天"},
        "澳门大三巴 外观巴黎人铁塔 珠海日月贝2天",
        "港澳",
        {},
    )
    assert fields["destinationCity"] != "巴黎"

    fields, _ = normalize_tour_geo(
        {"destination": "其他", "title": "南航广州起止北京飞 巴黎连住12天"},
        "南航广州起止北京飞 巴黎连住12天",
        "其他",
        {},
    )
    assert fields["departureCity"] == "北京"
    assert fields["destinationCity"] == "巴黎"

    fields, _ = normalize_tour_geo(
        {"destination": "广东", "title": "马来西亚潮玩沙巴5天4晚游-广州CZ南航直飞亚庇"},
        "马来西亚潮玩沙巴5天4晚游-广州CZ南航直飞亚庇",
        "广东",
        {},
    )
    assert fields["destinationCity"] != "广州"

    fields, _ = normalize_tour_geo(
        {"destination": "广东", "title": "广州增城、东莞3天"},
        "广州增城、东莞3天",
        "广东",
        {},
    )
    assert fields.get("departureCity") != "广州"

    fields, _ = normalize_tour_geo(
        {"destination": "湖北", "title": "湖北恩施高铁5天＊中国仙本那屏山大峡谷"},
        "湖北恩施高铁5天＊中国仙本那屏山大峡谷",
        "湖北",
        {},
    )
    assert fields["destinationCity"] == "恩施"


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
    assert result["address"]["city"] == "肇庆市"
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
    assert result["address"]["city"] == "肇庆市"
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


def test_geocoder_pool_merges_address_fields_from_all_matching_providers():
    results = [
        {
            "provider": "photon",
            "latitude": 23.1267,
            "longitude": 112.5856,
            "displayName": "紫云谷景区, 肇庆市, 广东省, 中国",
            "level": "poi",
            "locality": "金渡镇",
            "providerScore": 80,
            "matchQuality": 100,
            "address": {"formatted": "紫云谷景区, 肇庆市, 广东省, 中国", "locality": "金渡镇"},
        },
        {
            "provider": "nominatim",
            "latitude": 23.1268,
            "longitude": 112.5857,
            "displayName": "紫云谷景区, 金渡镇, 高要区, 肇庆市, 广东省, 中国",
            "level": "poi",
            "locality": "金渡镇",
            "providerScore": 80,
            "matchQuality": 100,
            "address": {"formatted": "紫云谷景区, 金渡镇, 高要区, 肇庆市, 广东省, 中国", "district": "高要区", "street": "紫云谷路"},
        },
    ]

    merged = _merge_geocoder_results(results)

    assert merged["provider"] in {"photon", "nominatim"}
    assert merged["address"]["district"] == "高要区"
    assert merged["address"]["street"] == "紫云谷路"


def test_formatted_poi_name_is_not_treated_as_district():
    for formatted, locality, district in (
        ("紫云谷景区, 金渡镇, 高要区, 肇庆市, 广东省, 中国", "金渡镇", "高要区"),
        ("海泉湾度假区, 平沙镇, 珠海市, 广东省, 中国", "平沙镇", None),
        ("丹霞山风景名胜区, 丹霞街道, 仁化县, 韶关市, 广东省, 中国", "丹霞街道", "仁化县"),
    ):
        address = _address_from_display_name(formatted)

        assert address["locality"] == locality
        assert address.get("district") == district
        assert address["city"].endswith("市")


def test_geocoder_query_collects_all_provider_candidates():
    original_request = geocoder._request_json
    calls = []

    def provider_request(endpoint, params, timeout):
        calls.append(endpoint)
        if "photon" in endpoint:
            return {"features": [{
                "geometry": {"type": "Point", "coordinates": [112.5856, 23.1267]},
                "properties": {"name": "紫云谷景区", "city": "肇庆市", "state": "广东省", "country": "中国"},
            }]}
        if "nominatim" in endpoint:
            return [{
                "display_name": "紫云谷景区, 金渡镇, 高要区, 肇庆市, 广东省, 中国",
                "lat": "23.1268",
                "lon": "112.5857",
                "address": {"tourism": "紫云谷景区", "town": "金渡镇", "county": "高要区", "city": "肇庆市", "state": "广东省", "country": "中国", "road": "紫云谷路"},
            }]
        return {"candidates": [{
            "address": "紫云谷景区, 金渡镇, 高要区, 肇庆市, 广东省, 中国",
            "score": 98,
            "location": {"x": 112.5858, "y": 23.1269},
        }]}

    try:
        geocoder.reset_geocoder_pool_health()
        geocoder._request_json = provider_request
        result = geocoder.geocode_query("肇庆紫云谷", "紫云谷 肇庆市 广东省 中国", "肇庆")
    finally:
        geocoder._request_json = original_request
        geocoder.reset_geocoder_pool_health()

    assert len(calls) == len(geocoder.GEOCODER_POOL)
    assert result["address"]["district"] == "高要区"
    assert result["address"]["street"] == "紫云谷路"


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
    test_title_hotel_suffix_is_a_geocoder_candidate_without_a_static_alias()
    test_itinerary_named_hotel_is_a_geocoder_candidate_without_a_city_guess()
    test_itinerary_named_hotel_overrides_a_city_only_destination()
    test_structured_accommodation_is_a_geocoder_candidate_without_same_class_noise()
    test_cityless_cached_poi_requires_an_exact_name(Path("."))
    test_short_city_substrings_and_flight_cities_do_not_become_destinations()
    test_named_poi_aliases_become_geocoder_candidates()
    test_geocoder_requires_poi_name_and_expected_city()
    test_photon_result_uses_geojson_longitude_then_latitude()
    test_geocoder_pool_merges_address_fields_from_all_matching_providers()
    test_formatted_poi_name_is_not_treated_as_district()
    test_geocoder_query_collects_all_provider_candidates()
    test_geocoder_pool_skips_repeatedly_unavailable_providers()
    test_unique_alias_without_canonical_city_does_not_inherit_city_centroid()
    print("geocoder destination tests passed")
