#!/usr/bin/env python3
# -*- coding: utf-8 -*-

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


def test_rebuild_preserves_coarse_coordinate_as_non_map_fallback():
    tour = {
        "id": "tour_blue_bell",
        "title": "肇庆蓝钟温泉3天",
        "destination": "广东",
        "price": 999,
        "destinationLatitude": 23.0472,
        "destinationLongitude": 112.4651,
    }

    before, after = rebuild([tour])

    assert before == 1
    assert after == 1
    assert tour["destinationPlaceName"] == "肇庆蓝钟温泉"
    assert tour["destinationCoordinateSource"] == "fallback"
    assert tour["destinationGeoLevel"] == "poi"
    assert tour["destinationCoordinatePrecision"] == "city"
    assert tour["destinationLatitude"] == 23.0472
    assert tour["destinationLongitude"] == 112.4651
    assert tour["geoConfidence"] == "low"


def test_rebuild_discards_stale_osm_address_before_reapplying_index():
    tour = {
        "id": "tour_stale_osm",
        "title": "\u65b0\u4e30\u96c5\u81f4\u9152\u5e973\u5929",
        "destination": "\u5176\u4ed6",
        "destinationCoordinateSource": "fallback",
        "destinationLatitude": 23.0571,
        "destinationLongitude": 112.4669,
        "destinationAddress": {"province": "\u6e56\u5357\u7701", "formatted": "stale OSM address"},
        "meta": {"dataQuality": {"fieldSources": {"destinationAddress": "source"}}},
    }

    rebuild([tour])

    assert tour["destinationCoordinateSource"] == "fallback"
    assert tour["destinationLatitude"] == 24.0592
    assert "destinationAddress" not in tour


if __name__ == "__main__":
    test_rebuild_updates_geo_fields_without_replacing_tour_content()
    test_rebuild_preserves_coarse_coordinate_as_non_map_fallback()
    test_rebuild_discards_stale_osm_address_before_reapplying_index()
    print("geo rebuild tests passed")
