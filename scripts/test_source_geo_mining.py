#!/usr/bin/env python3

from source_geo_mining import extract_detail_candidates
from source_geo_enrichment import (
    _candidate_queries,
    _country_result_matches,
    apply_detail_and_geo,
    has_location_evidence,
    merge_detail_payload,
)


def test_detail_candidates_prioritize_activities_and_strip_route_noise():
    candidates = extract_detail_candidates(
        "广州出发江西高铁5天",
        {
            "itinerary": [
                {
                    "title": "仙女湖-温汤镇",
                    "activities": ["仙女湖", "温汤古镇"],
                    "accommodation": "仙女湖沁庐度假酒店或同级",
                    "description": "早餐后前往景区",
                }
            ],
            "highlights": ["精品住宿"],
        },
        "江西",
    )
    labels = [item["label"] for item in candidates]
    assert labels[:2] == ["仙女湖", "温汤古镇"]
    assert "早餐后前往景区" not in labels
    assert all(item["source"] for item in candidates)


def test_detail_candidates_keep_foreign_route_names():
    candidates = extract_detail_candidates(
        "（穆龙达瓦）香草四国16天",
        {
            "itinerary": [
                {"title": "塔那那利佛-穆龙达瓦", "activities": ["猴面包树大道"]},
            ]
        },
        "其他",
    )
    labels = {item["label"] for item in candidates}
    assert {"塔那那利佛", "穆龙达瓦", "猴面包树大道"}.issubset(labels)


def test_detail_merge_preserves_existing_fields_and_adds_source_evidence():
    merged = merge_detail_payload(
        {"itinerary": [{"title": "已有行程"}], "highlights": ["已有亮点"]},
        {"itinerary": [{"title": "新增行程"}], "highlights": ["已有亮点", "新增亮点"]},
    )
    assert [item["title"] for item in merged["itinerary"]] == ["已有行程", "新增行程"]
    assert merged["highlights"] == ["已有亮点", "新增亮点"]


def test_marketing_title_alone_is_not_location_evidence():
    assert not has_location_evidence("轻奢山东半岛双飞5天", {}, "山东")
    assert has_location_evidence(
        "江西高铁5天",
        {"itinerary": [{"title": "仙女湖-温汤镇", "activities": []}]},
        "江西",
    )


def test_named_title_poi_is_network_eligible_without_detail_text():
    candidates = extract_detail_candidates(
        "广州出发贺州姑婆山伴山温泉3天",
        {},
        "广东",
        "贺州姑婆山伴山温泉",
        "贺州",
    )
    assert candidates[0]["label"] == "贺州姑婆山伴山温泉"
    assert candidates[0]["source"] == "title-poi"
    assert has_location_evidence(
        "广州出发贺州姑婆山伴山温泉3天",
        {},
        "广东",
        "贺州姑婆山伴山温泉",
        "贺州",
    )


def test_departure_city_is_not_title_poi_destination():
    candidates = extract_detail_candidates(
        "广州出发云南5天",
        {},
        "云南",
        "广州",
        "广州",
    )
    assert not any(item["source"] == "title-poi" for item in candidates)

    candidates = extract_detail_candidates(
        "珠海高级酒店2天",
        {},
        "广东",
        "珠海高级酒店",
        "珠海",
    )
    assert not any(item["source"] == "title-poi" for item in candidates)

    candidates = extract_detail_candidates(
        "十星茂名花涧乐天温泉3天",
        {},
        "广东",
        "茂名温泉度假酒店",
        "茂名",
    )
    assert not any(item["source"] == "title-poi" for item in candidates)
    candidates = extract_detail_candidates(
        "广州白云机场出发云南5天",
        {},
        "云南",
        "广州白云机场",
        "广州",
    )
    assert not any(item["source"] == "title-poi" for item in candidates)


def test_country_candidate_rejects_same_named_domestic_poi():
    assert not _country_result_matches(
        "意大利",
        {"address": {"country": "中国"}, "displayName": "意大利, 上海市, 中国"},
    )


def test_candidate_queries_keep_city_and_province_context_separate():
    queries, _, city, province = _candidate_queries(
        {"destination": "肇庆", "destinationCity": "肇庆", "destinationProvince": "广东"},
        "蓝钟温泉",
    )
    assert city == "肇庆"
    assert province == "广东"
    assert queries[0] == "蓝钟温泉 肇庆 广东 中国"
    assert _country_result_matches(
        "意大利",
        {"address": {"country": "Italia"}, "displayName": "Italia"},
    )

    queries, _, city, province = _candidate_queries(
        {
            "destination": "广东",
            "destinationPlaceName": "贺州姑婆山伴山温泉",
            "destinationCity": "贺州",
            "destinationProvince": "广西",
        },
        "贺州姑婆山伴山温泉",
    )
    assert city == "贺州"
    assert province == "广西"
    assert queries[0] == "贺州姑婆山伴山温泉 广西 中国"


def test_title_poi_cache_upgrades_city_fallback_without_source_detail():
    tour = {
        "title": "广州出发肇庆七星岩3天",
        "destination": "广东",
        "destinationPlaceName": "肇庆七星岩",
        "destinationCity": "肇庆",
        "destinationProvince": "广东",
        "destinationLatitude": 23.0472,
        "destinationLongitude": 112.4651,
        "destinationGeoLevel": "poi",
        "destinationCoordinateSource": "fallback",
        "destinationCoordinatePrecision": "city",
        "geoSource": "title-place-miner",
        "meta": {"dataQuality": {"fieldSources": {}}},
    }
    cache = {
        "肇庆七星岩 广东 中国": {
            "provider": "nominatim",
            "latitude": 23.0805699,
            "longitude": 112.4727006,
            "displayName": "七星岩景区, 端州区, 肇庆市, 广东省, 中国",
            "level": "poi",
            "locality": "城东街道",
            "address": {"district": "端州区", "locality": "城东街道"},
        }
    }

    assert apply_detail_and_geo(
        tour,
        {},
        "existing",
        cache=cache,
        allow_network=False,
    )
    assert tour["destinationCoordinateSource"] == "geocoder"
    assert tour["destinationLatitude"] == 23.0805699
    assert tour["destinationLocality"] == "城东街道"
    assert tour["destinationAddress"]["district"] == "端州区"
    assert tour["geoResolution"]["mining"]["resolvedCandidate"] == "肇庆七星岩"


def test_title_poi_cache_miss_keeps_city_fallback_and_records_reason():
    tour = {
        "title": "广州出发肇庆蓝钟温泉3天",
        "destination": "广东",
        "destinationPlaceName": "肇庆蓝钟温泉",
        "destinationCity": "肇庆",
        "destinationProvince": "广东",
        "destinationLatitude": 23.0472,
        "destinationLongitude": 112.4651,
        "destinationGeoLevel": "poi",
        "destinationCoordinateSource": "fallback",
        "destinationCoordinatePrecision": "city",
        "geoSource": "title-place-miner",
        "meta": {"dataQuality": {"fieldSources": {}}},
    }

    assert not apply_detail_and_geo(
        tour,
        {},
        "existing",
        cache={},
        allow_network=False,
    )
    assert tour["destinationCoordinateSource"] == "fallback"
    assert tour["destinationCoordinatePrecision"] == "city"
    assert tour["geoResolution"]["mining"]["status"] == "no-validated-candidate"
    assert tour["geoResolution"]["mining"]["sourceCandidates"][0]["resolution"] == "no-match"


if __name__ == "__main__":
    test_detail_candidates_prioritize_activities_and_strip_route_noise()
    test_detail_candidates_keep_foreign_route_names()
    test_detail_merge_preserves_existing_fields_and_adds_source_evidence()
    test_marketing_title_alone_is_not_location_evidence()
    test_country_candidate_rejects_same_named_domestic_poi()
    test_candidate_queries_keep_city_and_province_context_separate()
    print("source geo mining tests passed")
