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
    assert tour["meta"]["dataQuality"]["fieldSources"]["destinationPlaceName"] == "inferred"
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

    before, after = rebuild([tour], geocode_cache_path=Path("tmp-nonexistent-geo-cache.json"))

    assert before == 1
    assert after == 1
    assert tour["destinationPlaceName"] == "肇庆蓝钟温泉"
    assert tour["destinationCoordinateSource"] == "fallback"
    assert tour["destinationGeoLevel"] == "city"
    assert tour["destinationCoordinatePrecision"] == "approximate"
    assert tour["destinationLatitude"] == 23.0472
    assert tour["destinationLongitude"] == 112.4651
    assert tour["geoConfidence"] == "low"
    assert tour["geoResolution"]["fallback"]["reason"] == "coarse-parent-city-fallback"
    assert tour["geoResolution"]["final"]["status"] == "destination-only"
    assert tour["geoResolution"]["final"]["precision"] == "approximate"


def test_rebuild_materializes_an_explicit_region_as_approximate():
    tour = {
        "id": "tour_region_destination",
        "title": "广东周边轻松游3天",
        "destination": "广东",
    }

    _, after = rebuild([tour])

    assert after == 1
    assert tour["destinationPlaceName"] == "广东"
    assert tour["destinationGeoLevel"] == "region"
    assert tour["destinationCoordinateSource"] == "fallback"
    assert tour["destinationCoordinatePrecision"] == "approximate"
    assert tour["geoSource"] == "local-region-catalog"
    assert tour["geoResolution"]["fallback"]["reason"] == "region-catalog-fallback"
    assert tour["geoResolution"]["final"]["reason"] == "region-catalog-fallback"


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
    assert tour["geoResolution"]["final"]["status"] == "unmapped"


if __name__ == "__main__":
    test_rebuild_updates_geo_fields_without_replacing_tour_content()
    test_rebuild_keeps_a_named_place_visible_with_explicit_coarse_fallback()
    test_rebuild_materializes_an_explicit_region_as_approximate()
    test_rebuild_keeps_unproven_destination_unmapped()
    print("geo rebuild tests passed")
