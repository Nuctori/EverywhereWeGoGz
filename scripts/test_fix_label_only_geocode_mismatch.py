#!/usr/bin/env python3
"""Tests for fix_label_only_geocode_mismatch rules.

Each rule must fire on its own case and NOT fire on similar-but-correct cases
(the false-positive guards matter most: 乌镇西栅, 邛海, 勐仑镇, 维也纳-branded).
"""

import json
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

import fix_label_only_geocode_mismatch as fix  # noqa: E402


def make_tour(**overrides):
    tour = {
        "id": "tour_test",
        "title": "测试线路",
        "destination": "广东",
        "destinationPlaceName": "测试地点",
        "destinationCity": "测试市",
        "destinationProvince": "广东省",
        "destinationCountry": "中国",
        "destinationLatitude": 23.0,
        "destinationLongitude": 113.0,
        "destinationGeoLevel": "poi",
        "destinationCoordinateSource": "geocoder",
        "geoResolution": {
            "mining": {"resolvedCandidate": "测试地点", "sourceCandidates": []}
        },
    }
    tour.update(overrides)
    return tour


def run_fix(tours):
    with tempfile.TemporaryDirectory() as tmp:
        path = Path(tmp) / "tours.json"
        path.write_text(json.dumps(tours, ensure_ascii=False), encoding="utf-8")
        original = fix.TOURS_PATH
        fix.TOURS_PATH = path
        try:
            fix.main()
        finally:
            fix.TOURS_PATH = original
        return json.loads(path.read_text(encoding="utf-8"))


def cleared(tour):
    return tour.get("destinationCoordinateSource") is None


def test_label_only_mismatch():
    tour = make_tour(
        title="【品质4钻 活力美西】美国西部三城10日",
        destinationPlaceName="硅谷",
        destinationCity="长春市",
    )
    out = run_fix([tour])[0]
    assert cleared(out), "硅谷->长春市 must be cleared"


def test_intl_subdivision_fires():
    tour = make_tour(
        title="【东欧】奥捷匈深度游",
        destinationPlaceName="柏林",
        destinationCity="何埂镇",
        destinationProvince="重庆市",
    )
    out = run_fix([tour])[0]
    assert cleared(out), "柏林->重庆柏林镇 must be cleared"


def test_intl_subdivision_ignores_domestic_hotel_brand():
    # 维也纳国际酒店 is a domestic chain; title must not trip the intl rule.
    tour = make_tour(
        title="维也纳国际酒店2天",
        destinationPlaceName="维也纳国际酒店",
        destinationCity="麻章区",
        destinationProvince="广东省",
    )
    out = run_fix([tour])[0]
    assert not cleared(out), "domestic 维也纳国际酒店 pin must be kept"


def test_generic_label_fires():
    tour = make_tour(
        title="潮汕拼团3天",
        destinationPlaceName="餐饮",
        destinationCity="箭杆村",
        destinationProvince="四川省",
    )
    out = run_fix([tour])[0]
    assert cleared(out), "generic label 餐饮 must be cleared"


def test_domestic_province_conflict_fires():
    tour = make_tour(
        title="直飞浙东南双飞5天",
        destinationPlaceName="应星楼",
        destinationCity="唐江镇",
        destinationProvince="江西省",
    )
    out = run_fix([tour])[0]
    assert cleared(out), "应星楼->江西唐江镇 on 浙东南 route must be cleared"


def test_abbreviation_false_positives_kept():
    # Single-char abbreviations like 川(银川) / 新(新会) / 青(青岛) must not
    # trip the province-conflict rule for unrelated provinces.
    for tour in (
        make_tour(
            title="银川西夏王陵 宁夏双飞",
            destinationPlaceName="西夏王陵",
            destinationCity="镇北堡镇",
            destinationProvince="宁夏回族自治区",
        ),
        make_tour(
            title="新会陈皮文化之旅 江门出发",
            destinationPlaceName="陈皮村",
            destinationCity="双水镇",
            destinationProvince="广东省",
        ),
        make_tour(
            title="青岛栈桥海滨双飞",
            destinationPlaceName="栈桥",
            destinationCity="湛山街道",
            destinationProvince="山东省",
        ),
    ):
        out = run_fix([tour])[0]
        assert not cleared(out), f"{tour['title']} correct pin must be kept"


def test_domestic_keeps_city_anchored_label():
    # 乌镇西栅景区 in 乌镇: label contains the city -> keep.
    tour = make_tour(
        title="华东五市纯玩双飞6天",
        destinationPlaceName="乌镇西栅景区",
        destinationCity="乌镇",
        destinationProvince="浙江省",
        destinationLatitude=30.755668956625,
        destinationLongitude=120.48030012886,
    )
    out = run_fix([tour])[0]
    assert not cleared(out), "乌镇西栅景区 in 乌镇 must be kept"


def test_domestic_keeps_correct_subdivision():
    # 勐仑镇 (中科院植物园) and 罗定学宫->罗城街道 are correct.
    for tour in (
        make_tour(
            title="奇趣版纳7天",
            destinationPlaceName="勐仑镇",
            destinationCity="勐仑镇",
            destinationProvince="云南省",
            destinationLatitude=21.937657,
            destinationLongitude=101.2475309,
        ),
        make_tour(
            title="罗定桂花梨2天",
            destinationPlaceName="罗定学宫",
            destinationCity="罗城街道",
            destinationProvince="广东省",
            destinationLatitude=22.776515344294,
            destinationLongitude=111.558628705611,
        ),
    ):
        out = run_fix([tour])[0]
        assert not cleared(out), (
            f"{tour['destinationPlaceName']} correct pin must be kept"
        )


def test_no_wiener_marker():
    assert "维也纳" not in fix.INTERNATIONAL_MARKERS, (
        "维也纳 must not be an international marker"
    )


def test_no_duplicate_markers():
    assert len(fix.INTERNATIONAL_MARKERS) == len(set(fix.INTERNATIONAL_MARKERS)), (
        "INTERNATIONAL_MARKERS must not contain duplicates"
    )


def main() -> None:
    tests = [
        test_label_only_mismatch,
        test_intl_subdivision_fires,
        test_intl_subdivision_ignores_domestic_hotel_brand,
        test_generic_label_fires,
        test_domestic_province_conflict_fires,
        test_abbreviation_false_positives_kept,
        test_domestic_keeps_city_anchored_label,
        test_domestic_keeps_correct_subdivision,
        test_no_wiener_marker,
        test_no_duplicate_markers,
    ]
    for test in tests:
        test()
        print(f"PASS {test.__name__}")
    print("fix_label_only_geocode_mismatch tests passed")


if __name__ == "__main__":
    main()
