#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from report_destination_mining import build_report


def test_report_counts_mined_places_and_departure_exclusions():
    report = build_report([
        {"source": "测试", "title": "珠海海泉湾3天", "destination": "广东", "price": 999, "days": 3},
        {"source": "测试", "title": "广州出发珠海海泉湾5天", "destination": "广东", "price": 999, "days": 5},
        {"source": "测试", "title": "欧洲线路5天（广州起止）", "destination": "广东", "price": 999, "days": 5},
        {"source": "测试", "title": "南澳岛休闲3天", "destination": "广东", "price": 999, "days": 3},
    ])

    assert report["convertedCount"] == 4
    assert report["titleMinerCount"] == 3
    assert report["namedPlaceCounts"] == {"珠海海泉湾": 2, "汕头南澳岛": 1}
    assert report["possibleDepartureConfusion"] == []


if __name__ == "__main__":
    test_report_counts_mined_places_and_departure_exclusions()
    print("destination mining report tests passed")
