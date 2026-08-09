#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from unittest.mock import patch

from merge_data import load_detail_results, make_tour_key, needs_geo_detail


def test_geo_detail_refresh_targets_only_unmapped_tours():
    raw = {"source": "假日通", "title": "测试线路", "price": 299, "url": "https://example.com"}

    assert needs_geo_detail(raw, None)
    assert needs_geo_detail(raw, {"destinationLatitude": None, "destinationLongitude": 113.1})
    assert not needs_geo_detail(raw, {"destinationLatitude": 23.1, "destinationLongitude": 113.1})


def test_geo_detail_mode_keeps_cached_details_and_fetches_only_missing_coordinates():
    mapped = {"source": "假日通", "title": "已定位", "price": 299, "url": "https://example.com/mapped"}
    unmapped = {"source": "假日通", "title": "待定位", "price": 299, "url": "https://example.com/unmapped"}
    existing = {
        make_tour_key(mapped): {"destinationLatitude": 23.1, "destinationLongitude": 113.1, "highlights": ["缓存详情"]},
        make_tour_key(unmapped): {"destinationLatitude": None, "destinationLongitude": None},
    }
    fetched_detail = {"highlights": ["新详情"], "itinerary": []}

    with patch.dict("os.environ", {"DETAIL_FETCH_MODE": "geo", "DETAIL_WORKERS": "4"}, clear=False), patch(
        "merge_data.fetch_detail_data", return_value=fetched_detail
    ) as fetch:
        details = load_detail_results([mapped, unmapped], existing)

    assert fetch.call_count == 1
    assert fetch.call_args.args[0] == unmapped
    assert details[make_tour_key(mapped)]["highlights"] == ["缓存详情"]
    assert details[make_tour_key(unmapped)] == fetched_detail


if __name__ == "__main__":
    test_geo_detail_refresh_targets_only_unmapped_tours()
    test_geo_detail_mode_keeps_cached_details_and_fetches_only_missing_coordinates()
    print("geo detail refresh tests passed")
