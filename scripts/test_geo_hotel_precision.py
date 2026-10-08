#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Root-cause regression tests: hotel/温泉 tours must not dead-end at 镇级.

Five fixes, one test each plus attack cases:
- RC1 geo_catalog: a bare-city destination match upgrades to a same-place
  named alias found in the title (阳江 → 阳江北洛秘境).
- RC2 osm_poi_resolver: same-city-prefixed mined labels are alternate POI
  spellings of one destination, not competing places.
- RC3 geocode_destinations: mined venue names (酒店全名) become their own
  validated query groups and win with their own label evidence.
- RC4 geocode_destinations: 惠州市龙门地派-style display (prefecture token +
  bare expected county) is not an administrative conflict.
- RC5 geocode_destinations: fuzzy town matches must sit inside the expected
  city's catalog footprint (林丰温泉→茂名林丰村 is a wrong pin, not evidence).
"""

import json
from pathlib import Path

from geocode_destinations import (
    _has_conflicting_admin_context,
    _mining_candidate_labels,
    _photon_result,
    _valid_cached_result,
    destination_query_groups,
    enrich_tours,
)
from geo_catalog import mine_destination_place
from osm_poi_resolver import _candidate_labels, enrich_tours_from_osm, resolve_poi


def test_rc1_bare_city_destination_upgrades_to_title_named_alias():
    # dest=阳江 hits the catalog city row directly; the title names the
    # same-row alias 北洛秘境. The old code short-circuited on the city.
    place, label, confidence, source = mine_destination_place(
        {"destination": "阳江"},
        "【佛山出发·一价全包】阳江北洛秘境纯玩2天",
        "阳江",
        {},
    )
    assert label == "阳江北洛秘境"
    assert source == "local-place-catalog"
    # Named alias without curated coordinate stays coordinate-less so the
    # OSM/geocoder stages can pin the actual POI.
    assert place.get("latitude") is None

    # No same-place alias in the title: the bare city match is unchanged.
    place, label, _, _ = mine_destination_place(
        {"destination": "阳江"},
        "【佛山出发】阳江纯玩2天",
        "阳江",
        {},
    )
    assert label == "阳江"
    assert place.get("latitude") is not None


def test_rc2_same_city_candidate_labels_flow_into_osm_resolution():
    tour = {
        "destinationCity": "阳江",
        "destinationPlaceName": "阳江闸坡",
        "geoResolution": {
            "mining": {
                "sourceCandidates": [],
                "candidateLabels": [
                    "阳江闸坡北洛秘境度假酒店",
                    "阳江闸坡",
                    "阳江北洛秘境",
                ],
            }
        },
    }
    labels = _candidate_labels(tour)
    assert "阳江北洛秘境" in labels

    # A different-city label is still rejected (gate keeps its purpose);
    # with no supported mined label the list is empty, never cross-city.
    tour["geoResolution"]["mining"]["candidateLabels"] = ["惠州南昆山"]
    assert _candidate_labels(tour) == []


def test_rc2_osm_resolves_chosen_town_label_to_same_city_hotel_poi():
    poi = {
        "osmId": "node/1",
        "name": "阳江北洛秘境度假酒店",
        "aliases": [],
        "kind": "hotel",
        "latitude": 21.5671,
        "longitude": 111.8621,
        "coordinateSystem": "wgs84",
        "address": {"city": "阳江市", "province": "广东省", "country": "中国"},
    }
    result = resolve_poi(
        "阳江北洛秘境",
        expected_city="阳江",
        expected_province="广东",
        pois=[poi],
        poi_lookup={"阳江北洛秘境": [poi]},
    )
    assert result is not None
    assert result["osmId"] == "node/1"


def test_rc2_curated_catalog_poi_pin_is_never_replaced_by_osm():
    # A curated exact resort pin (龙门云顶) is authoritative: itinerary
    # mentions of a nearby attraction (南昆山) must not replace it.
    poi = {
        "osmId": "way/9",
        "name": "南昆山生态旅游区",
        "aliases": ["龙门南昆山"],
        "kind": "attraction",
        "latitude": 23.6062,
        "longitude": 113.8618,
        "coordinateSystem": "wgs84",
        "address": {"city": "惠州市", "province": "广东省", "country": "中国"},
    }
    tour = {
        "id": "tour_curated_poi",
        "title": "龙门云顶2天(威士忌畔山)",
        "destinationPlaceName": "龙门云顶",
        "destinationCity": "龙门",
        "destinationProvince": "广东",
        "destinationLatitude": 23.577073,
        "destinationLongitude": 113.9987374,
        "destinationGeoLevel": "poi",
        "destinationCoordinateSource": "catalog",
        "geoResolution": {
            "mining": {
                "sourceCandidates": [],
                "candidateLabels": ["龙门云顶", "龙门南昆山"],
            }
        },
    }

    candidates, resolved = enrich_tours_from_osm([tour])

    assert candidates == 0
    assert resolved == 0
    assert tour["destinationPlaceName"] == "龙门云顶"
    assert tour["destinationLatitude"] == 23.577073
    assert tour["destinationCoordinateSource"] == "catalog"


def test_rc3_mined_venue_names_become_validated_query_groups():
    tour = {
        "title": "肇庆蓝钟温泉3天(含餐)",
        "destinationPlaceName": "蓝钟温泉",
        "destinationCity": "怀集",
        "destinationProvince": "广东",
        "geoResolution": {
            "mining": {
                "sourceCandidates": [],
                "candidateLabels": [
                    "肇庆蓝钟温泉",
                    "蓝钟温泉",
                    "肇庆",
                    "蓝钟森林温泉度假酒店",
                    "蓝钟森林温泉",
                    "蓝钟",
                    "肇庆怀集蓝钟森林温泉酒店",
                ],
            }
        },
    }
    groups = destination_query_groups(tour)
    group_labels = [label for label, _ in groups]
    assert group_labels[0] == "蓝钟温泉"
    assert "蓝钟森林温泉度假酒店" in group_labels
    # Short admin/context fragments stay out of the query budget.
    assert all(label not in {"蓝钟", "肇庆", "蓝钟温泉"} for label in group_labels[1:])
    assert len(group_labels) <= 4
    for label, queries in groups:
        if label != "蓝钟温泉":
            assert queries[-1] == normalize_text(label)
            assert f"{normalize_text(label)} 广东 中国" in queries


def normalize_text(value: str) -> str:
    import re

    return re.sub(r"\s+", " ", value.strip().lower())


def test_rc3_cached_hotel_name_hit_applies_the_hotel_label(tmp_path: Path):
    tour = {
        "title": "肇庆蓝钟温泉3天(含餐)",
        "destinationPlaceName": "蓝钟温泉",
        "destinationCity": "怀集",
        "destinationProvince": "广东",
        "geoResolution": {
            "mining": {
                "sourceCandidates": [],
                "candidateLabels": [
                    "蓝钟温泉",
                    "蓝钟森林温泉度假酒店",
                ],
            }
        },
        "meta": {"dataQuality": {"fieldSources": {}}},
    }
    cache_path = tmp_path / "geo-cache.json"
    cache_path.write_text(
        json.dumps(
            {
                "蓝钟森林温泉度假酒店 广东 中国": {
                    "provider": "arcgis",
                    "latitude": 24.0831,
                    "longitude": 111.9308,
                    "displayName": "蓝钟森林温泉, 蓝钟镇, 怀集县, 肇庆市, 广东省, 中国",
                    "level": "poi",
                }
            },
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )

    candidates, resolved = enrich_tours([tour], cache_path=cache_path)

    assert candidates == 1
    assert resolved == 1
    # The win came from the venue-name query group: the hotel label is the
    # recorded place, not the shortened alias.
    assert tour["destinationPlaceName"] == "蓝钟森林温泉度假酒店"
    assert tour["destinationGeoLevel"] == "poi"
    assert tour["destinationLatitude"] == 24.0831


def test_rc3_hotel_name_matches_provider_short_name():
    # Provider indexes the venue without the marketing tail; the mined full
    # label must still count as named evidence (photon path).
    payload = {
        "features": [
            {
                "geometry": {"coordinates": [111.9308, 24.0831]},
                "properties": {
                    "name": "蓝钟森林温泉",
                    "county": "怀集县",
                    "city": "肇庆市",
                    "state": "广东省",
                    "country": "中国",
                },
            }
        ]
    }
    result = _photon_result("蓝钟森林温泉度假酒店", payload, "怀集", "广东")
    assert result is not None
    assert result["latitude"] == 24.0831
    assert result["level"] == "poi"


def test_rc4_prefecture_plus_bare_county_display_is_not_a_conflict():
    # ArcGIS formats the county without its suffix; the token table only sees
    # 惠州市. The cached POI (level=poi) must validate instead of being
    # rejected into the fuzzy-town path.
    assert (
        _has_conflicting_admin_context(
            "龙门",
            "广东",
            "广东省惠州市龙门地派",
            {"province": "广东省", "city": "惠州市"},
        )
        is False
    )
    # A genuinely different city with its own admin token remains a conflict.
    assert (
        _has_conflicting_admin_context(
            "龙门",
            "广东",
            "广东省茂名市林丰温泉",
            {"province": "广东省"},
        )
        is True
    )


def test_rc4_cached_prefecture_display_poi_is_accepted(tmp_path: Path):
    tour = {
        "title": "龙门地派温泉2天",
        "destinationPlaceName": "龙门地派",
        "destinationCity": "龙门",
        "destinationProvince": "广东",
        "meta": {"dataQuality": {"fieldSources": {}}},
    }
    cache_path = tmp_path / "geo-cache.json"
    cache_path.write_text(
        json.dumps(
            {
                "龙门地派 广东 中国": {
                    "provider": "arcgis",
                    "latitude": 23.9341,
                    "longitude": 113.9201,
                    "displayName": "广东省惠州市龙门地派",
                    "level": "poi",
                    "address": {"province": "广东省", "city": "惠州市"},
                }
            },
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )

    candidates, resolved = enrich_tours([tour], cache_path=cache_path)

    assert candidates == 1
    assert resolved == 1
    assert tour["destinationGeoLevel"] == "poi"
    assert "destinationCoordinatePrecision" not in tour


def test_rc5_fuzzy_town_far_from_expected_city_is_rejected():
    # 林丰村 in 茂名 is ~395km from the expected 龙门 county: a same-name
    # admin collision, not coarse evidence of the resort.
    result = {
        "provider": "photon",
        "latitude": 21.83135,
        "longitude": 110.9879,
        "displayName": "林丰村 茂名市 广东省 中国",
        "level": "town",
        "locality": "林丰村",
        "providerScore": 80,
        "address": {"formatted": "林丰村 茂名市 广东省 中国"},
        "precision": "approximate",
    }
    assert _valid_cached_result("龙门林丰温泉", "龙门", result, "广东", allow_fuzzy=True) is False
    # The same shape inside the expected county stays valid (蓝钟镇 case).
    near = dict(result, latitude=24.0776, longitude=111.9556, displayName="蓝钟镇 怀集 广东 中国")
    assert _valid_cached_result("蓝钟温泉", "怀集", near, "广东", allow_fuzzy=True) is True


def test_rc5_network_fuzzy_merge_rejects_far_town(monkeypatch=None):
    import geocode_destinations as geocoder

    calls = []

    def provider_request(endpoint, params, timeout):
        calls.append(endpoint)
        if "photon" in endpoint:
            return {
                "features": [
                    {
                        "geometry": {"coordinates": [110.9879, 21.83135]},
                        "properties": {
                            "name": "林丰村",
                            "city": "茂名市",
                            "state": "广东省",
                            "country": "中国",
                        },
                    }
                ]
            }
        if "overpass" in endpoint:
            return {"elements": []}
        return None

    original_request = geocoder._request_json
    try:
        geocoder.reset_geocoder_pool_health()
        geocoder._request_json = provider_request
        result = geocoder.geocode_query(
            "龙门林丰温泉",
            "林丰村 龙门 广东 中国",
            "龙门",
            "广东",
            allow_fuzzy=True,
        )
    finally:
        geocoder._request_json = original_request
        geocoder.reset_geocoder_pool_health()

    assert result is None


def test_rc5_helper_passes_through_without_catalog_city():
    # No catalog centroid to verify against: keep today's permissive behavior.
    from geocode_destinations import _fuzzy_result_within_city

    assert _fuzzy_result_within_city("不存在城市", 23.0, 113.0) is True


def test_audit_short_hand_alias_never_doubles_the_label():
    # dest=多站路线 containing the shorthand 禾木 (canonical 禾木村): the old
    # concat invented 禾木村禾木. The canonical spelling must win and keep
    # the curated coordinate.
    from geo_catalog import _find_direct_place_match, _materialize_named_place

    place, label = _find_direct_place_match(
        "乌鲁木齐、布尔津、禾木、喀纳斯、伊宁、巴音布鲁克"
    )
    assert (place["name"], label) == ("禾木村", "禾木村")
    assert _materialize_named_place(place, label).get("latitude") is not None

    # A real source span keeps its concat: dest=闸坡 anchors to 阳江闸坡.
    place, label = _find_direct_place_match("闸坡")
    assert label == "阳江闸坡"

    # The feed's own wording is echoed as-is (芭提雅芭堤雅 is a source string).
    place, label = _find_direct_place_match("芭提雅芭堤雅")
    assert label == "芭提雅芭堤雅"
