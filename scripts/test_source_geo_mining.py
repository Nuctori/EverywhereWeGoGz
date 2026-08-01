#!/usr/bin/env python3

from source_geo_mining import extract_detail_candidates
from source_geo_enrichment import _candidate_queries, _country_result_matches, has_location_evidence, merge_detail_payload


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


if __name__ == "__main__":
    test_detail_candidates_prioritize_activities_and_strip_route_noise()
    test_detail_candidates_keep_foreign_route_names()
    test_detail_merge_preserves_existing_fields_and_adds_source_evidence()
    test_marketing_title_alone_is_not_location_evidence()
    test_country_candidate_rejects_same_named_domestic_poi()
    test_candidate_queries_keep_city_and_province_context_separate()
    print("source geo mining tests passed")
