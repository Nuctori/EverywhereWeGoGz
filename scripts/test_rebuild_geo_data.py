#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from pathlib import Path

from rebuild_geo_data import rebuild


def test_rebuild_updates_geo_fields_without_replacing_tour_content():
    tour = {
        "id": "tour_test",
        "title": "乌镇夜未央双飞5天",
        "destination": "其他",
        "price": 999,
        "itinerary": [{"title": "乌镇"}],
        "meta": {"dataQuality": {"fieldSources": {"price": "source"}}},
    }

    before, after = rebuild([tour])

    assert before == 0
    assert after == 1
    assert tour["price"] == 999
    assert tour["itinerary"] == [{"title": "乌镇"}]
    assert tour["destinationPlaceName"] == "乌镇"
    assert tour["destinationLatitude"] == 30.7539
    assert (
        tour["meta"]["dataQuality"]["fieldSources"]["destinationPlaceName"]
        == "inferred"
    )
    assert tour["geoResolution"]["final"]["status"] == "destination-only"


def test_rebuild_keeps_a_named_place_visible_with_explicit_coarse_fallback():
    tour = {
        "id": "tour_blue_bell",
        "title": "肇庆蓝钟温泉3天",
        "destination": "广东",
        "price": 999,
        "destinationLatitude": 23.0472,
        "destinationLongitude": 112.4651,
    }

    before, after = rebuild(
        [tour], geocode_cache_path=Path("tmp-nonexistent-geo-cache.json")
    )

    # 蓝钟温泉 is a metadata-index POI; its parent city 怀集 has no catalog
    # row and the geocode cache is empty, so the rebuild leaves it unmapped
    # rather than pinning an arbitrary coarse point. With the git-tracked
    # geocode cache (蓝钟温泉 广东 中国 -> 24.0776) it resolves exactly.
    assert before == 1
    assert after == 0
    assert tour["destinationLatitude"] is None
    assert tour["destinationPlaceName"] == "蓝钟温泉"
    assert tour["geoResolution"]["final"]["status"] == "unmapped"


def test_rebuild_materializes_an_explicit_region_as_approximate():
    tour = {
        "id": "tour_region_destination",
        "title": "广东周边轻松游3天",
        "destination": "广东",
    }

    _, after = rebuild([tour])

    assert after == 1
    assert tour["destinationPlaceName"] == "广东"
    assert tour["destinationCoordinateSource"] == "fallback"
    assert tour["destinationCoordinatePrecision"] == "approximate"
    assert tour["geoSource"] == "local-region-catalog"
    resolution = tour.get("geoResolution")
    fallback = resolution.get("fallback") if isinstance(resolution, dict) else None
    final = resolution.get("final") if isinstance(resolution, dict) else None
    assert (
        isinstance(fallback, dict)
        and fallback.get("reason") == "region-catalog-fallback"
    )
    assert isinstance(final, dict) and final.get("reason") == "region-catalog-fallback"


def test_rebuild_does_not_call_city_catalog_coordinates_exact():
    tour = {
        "id": "tour_city_catalog",
        "title": "龙门温德姆温泉2天",
        "destination": "广东",
    }

    rebuild([tour])

    assert tour["destinationGeoLevel"] == "city"
    assert tour["destinationCoordinateSource"] == "catalog"
    assert tour["destinationCoordinatePrecision"] == "approximate"


def test_rebuild_keeps_unproven_destination_unmapped():
    tour = {
        "id": "tour_unknown_destination",
        "title": "周边轻松游3天",
        "destination": "其他",
    }

    _, after = rebuild([tour])

    assert after == 0
    assert tour["destinationPlaceName"] == ""
    assert tour["destinationLatitude"] is None
    resolution = tour.get("geoResolution")
    final = resolution.get("final") if isinstance(resolution, dict) else None
    assert isinstance(final, dict) and final.get("status") == "unmapped"


def test_rebuild_preserves_source_mining_evidence():
    tour = {
        "id": "tour_mined_evidence",
        "title": "仙女湖行程3天",
        "destination": "其他",
        "geoResolution": {
            "mining": {
                "sourceDetail": {"status": "content", "itineraryDays": 3},
                "sourceCandidates": [{"label": "仙女湖", "source": "activity"}],
            }
        },
    }

    rebuild([tour])

    mining = tour["geoResolution"]["mining"]
    assert mining["sourceDetail"]["status"] == "content"
    assert mining["sourceCandidates"][0]["label"] == "仙女湖"


def test_rebuild_preserves_validated_geocoder_point():
    tour = {
        "id": "tour_preserved_geocoder",
        "title": "意大利深度游5天",
        "destination": "其他",
        "destinationPlaceName": "意大利",
        "destinationCity": "意大利",
        "destinationProvince": "",
        "destinationCountry": "意大利",
        "destinationLatitude": 41.9,
        "destinationLongitude": 12.5,
        "destinationGeoLevel": "country",
        "destinationCoordinateSource": "geocoder",
        "destinationCoordinatePrecision": "approximate",
        "destinationAddress": {"formatted": "意大利"},
        "geoConfidence": "low",
        "geoSource": "geocoder",
    }

    rebuild([tour])

    assert tour["destinationPlaceName"] == "意大利"
    assert tour["destinationLatitude"] == 41.9
    assert tour["destinationLongitude"] == 12.5
    assert tour["destinationCoordinateSource"] == "geocoder"


def test_rebuild_discards_historical_cross_city_geocoder_point():
    tour = {
        "id": "tour_wrong_city",
        "title": "增城三英温泉3天",
        "destination": "广东",
        "destinationPlaceName": "增城三英温泉",
        "destinationCity": "增城",
        "destinationProvince": "广东",
        "destinationLatitude": 23.5678689,
        "destinationLongitude": 116.6436494,
        "destinationGeoLevel": "town",
        "destinationCoordinateSource": "geocoder",
        "destinationCoordinatePrecision": "approximate",
        "destinationAddress": {
            "formatted": "三英村，潮州市，广东省，中国",
            "city": "潮州市",
            "province": "广东省",
        },
        "geoConfidence": "low",
        "geoSource": "geocoder",
    }

    _, after = rebuild(
        [tour], geocode_cache_path=Path("tmp-nonexistent-geo-cache.json")
    )

    assert after == 1
    assert tour["destinationCoordinateSource"] == "fallback"
    assert tour["destinationCoordinatePrecision"] == "approximate"
    assert tour["destinationLatitude"] == 23.2904
    assert tour["destinationLongitude"] == 113.8108
    assert tour["destinationAddress"]["city"] == "增城"


def test_rebuild_drops_historical_foreign_city_as_domestic_hotel():
    tour = {
        "id": "tour_foreign_collision",
        "title": "<\u4e1c\u6b27>\u5965\u6377\u5308\u6df1\u5ea6\u6e38\u4e2d\u5305\u542b\u7ef4\u4e5f\u7eb3",
        "destination": "\u5e7f\u4e1c",
        "destinationCity": "\u5e7f\u4e1c",
        "destinationPlaceName": "\u7ef4\u4e5f\u7eb3",
        "destinationProvince": "\u5e7f\u4e1c",
        "destinationCountry": "\u4e2d\u56fd",
        "destinationLatitude": 23.1067077,
        "destinationLongitude": 113.5408031,
        "destinationGeoLevel": "poi",
        "destinationCoordinateSource": "osm",
        "destinationCoordinatePrecision": "exact",
        "destinationAddress": {
            "formatted": "\u7ef4\u4e5f\u7eb3\u56fd\u9645\u9152\u5e97, \u5e7f\u4e1c\u7701, \u4e2d\u56fd"
        },
        "geoConfidence": "high",
        "geoSource": "osm",
    }

    rebuild([tour])

    assert tour["destinationCoordinateSource"] == "fallback"
    assert tour["destinationCoordinatePrecision"] == "approximate"
    assert tour["destinationLatitude"] == 23.379
    assert tour["destinationLongitude"] == 113.7633


def test_rebuild_drops_stale_generic_resolved_candidate():
    tour = {
        "id": "tour_generic_evidence",
        "title": "广东温泉宾馆2天",
        "destination": "广东",
        "geoResolution": {"mining": {"resolvedCandidate": "建设"}},
    }

    rebuild([tour])

    assert tour["geoResolution"]["mining"].get("resolvedCandidate") is None


def test_rebuild_keeps_evidence_backed_city_context_for_poi_refinement():
    tour = {
        "id": "tour_context_replay",
        "title": "新兴翔顺龙山温泉3天",
        "destination": "广东",
        "destinationCity": "新兴",
        "destinationPlaceName": "新兴龙山温泉",
        "destinationProvince": "广东",
        "destinationLatitude": 22.695,
        "destinationLongitude": 112.225,
        "destinationCoordinateSource": "fallback",
        "destinationCoordinatePrecision": "approximate",
        "geoResolution": {"mining": {"candidateLabels": ["新兴翔顺龙山温泉"]}},
    }

    rebuild([tour])

    assert tour["destinationCity"] == "新兴"
    assert tour["destinationCoordinateSource"] == "osm"
    assert tour["destinationPlaceName"] == "新兴翔顺龙山温泉"


def test_rebuild_drops_previous_poi_not_supported_by_current_title_candidates():
    tour = {
        "id": "tour_incidental_poi",
        "title": "云浮肇庆3天象窝禅山徒步七星岩",
        "destination": "广东",
        "destinationCity": "新兴",
        "destinationPlaceName": "国恩寺",
        "destinationProvince": "广东",
        "destinationLatitude": 22.5917178,
        "destinationLongitude": 112.2234103,
        "destinationGeoLevel": "poi",
        "destinationCoordinateSource": "osm",
        "destinationCoordinatePrecision": "exact",
        "destinationAddress": {"city": "云浮", "district": "新兴", "province": "广东"},
        "geoResolution": {"mining": {"candidateLabels": ["新兴象窝", "肇庆七星岩"]}},
    }

    rebuild([tour])

    assert tour["destinationPlaceName"] == "新兴象窝"
    # 象窝 is a metadata-index POI resolved via the geocode cache
    # (翔顺象窝酒店, 太平镇 22.5633) — more precise than the 新兴 county fallback.
    assert tour["destinationCoordinateSource"] == "geocoder"
    assert tour["destinationLatitude"] == 22.5633143


def test_rebuild_prefers_city_anchored_destination_over_incidental_itinerary_poi():
    tour = {
        "id": "tour_incidental_title_poi",
        "title": "云浮、肇庆3天象窝禅山徒步七星岩",
        "destination": "广东",
        "destinationCity": "新兴",
        "destinationPlaceName": "国恩寺",
        "destinationProvince": "广东",
        "destinationLatitude": 22.5917178,
        "destinationLongitude": 112.2234103,
        "destinationCoordinateSource": "osm",
        "destinationGeoLevel": "poi",
        "destinationCoordinatePrecision": "exact",
        "destinationAddress": {"city": "云浮", "district": "新兴", "province": "广东"},
        "geoResolution": {"mining": {"candidateLabels": ["新兴象窝", "肇庆七星岩"]}},
    }

    rebuild([tour])

    assert tour["destinationPlaceName"] == "新兴象窝"
    assert tour["destinationCoordinateSource"] == "geocoder"


def test_rebuild_does_not_pin_domestic_cruise_to_foreign_city():
    # 雅典娜号 is a domestic Yangtze cruise ship; the catalog city 雅典
    # (Greece) must not be matched from the ship name substring.
    tour = {
        "id": "tour_athena_cruise",
        "title": "精选雅典娜号·长江三峡+小三峡+宜昌·双飞5天",
        "destination": "广东",
    }

    rebuild([tour])

    assert tour["destinationCountry"] == "中国"
    assert (
        tour["destinationLatitude"] != 37.9838
        or tour["destinationLongitude"] != 23.7275
    )
    assert tour["destinationPlaceName"] != "雅典"


def test_rebuild_does_not_pin_macau_resort_brand_to_paris():
    # 巴黎人铁塔 / 巴黎人酒店 is the Macau resort brand; the catalog city 巴黎
    # (France) must not be matched from the brand substring on a domestic tour.
    for title in ("巴黎人铁塔澳门珠海2天", "巴黎人酒店澳门2天"):
        tour = {
            "id": "tour_parisian_macau",
            "title": title,
            "destination": "广东",
        }
        rebuild([tour])
        assert tour["destinationCountry"] == "中国", f"{title} must not pin to France"
        assert tour["destinationPlaceName"] != "巴黎", f"{title} must not pin to 巴黎"


def test_rebuild_does_not_pin_us_antelope_canyon_to_zhaoqing():
    # 羚羊峡谷 (Antelope Canyon, Arizona) contains the 羚羊峡 substring; the
    # domestic POI index must NOT match it (POI_CONTINUATIONS guard) — a US
    # tour must keep its foreign pin, not land in 肇庆.
    tour = {
        "id": "tour_antelope_us",
        "title": "【金秋纯享黄石】美国东西岸七大名城+黄石六大公园+羚羊峡谷+大瀑布13天",
        "destination": "美国",
    }
    rebuild([tour])

    assert tour["destinationPlaceName"] != "羚羊峡"
    assert tour["destinationCountry"] != "中国"


if __name__ == "__main__":
    test_rebuild_updates_geo_fields_without_replacing_tour_content()
    test_rebuild_keeps_a_named_place_visible_with_explicit_coarse_fallback()
    test_rebuild_materializes_an_explicit_region_as_approximate()
    test_rebuild_keeps_unproven_destination_unmapped()
    test_rebuild_preserves_source_mining_evidence()
    test_rebuild_preserves_validated_geocoder_point()
    test_rebuild_drops_historical_foreign_city_as_domestic_hotel()
    test_rebuild_does_not_pin_domestic_cruise_to_foreign_city()
    test_rebuild_does_not_pin_macau_resort_brand_to_paris()
    test_rebuild_does_not_pin_us_antelope_canyon_to_zhaoqing()
    print("geo rebuild tests passed")
