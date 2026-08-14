import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from detail_parsers import empty_detail
from merge_data import build_source_meta, extract_service_status, raw_to_tour


def test_missing_values_are_not_fabricated():
    raw = {
        "source": "测试来源",
        "title": "广州周边线路3天",
        "price": 999,
        "url": "https://example.test/tour/1",
        "days": 3,
    }
    tour = raw_to_tour(raw, 1, empty_detail())

    assert tour is not None
    assert tour["departureDate"] == ""
    assert tour["departureDates"] == []
    assert tour["highlights"] == []
    assert tour["tags"] == []
    assert tour["groupSize"] == ""
    assert tour["accommodationLevel"] == ""
    assert tour["meals"] == ""
    assert tour["rating"] == 0
    assert tour["reviewCount"] == 0
    assert tour["availableSeats"] == 0
    assert tour["totalSeats"] == 0
    assert tour["dataQuality"]["syntheticFields"] == []
    assert tour["dataQuality"]["fieldSources"]["rating"] == "unknown"
    assert tour["dataQuality"]["fieldSources"]["groupSize"] == "unknown"


def test_source_fields_are_preserved_and_marked_source():
    raw = {
        "source": "测试来源",
        "title": "广州周边线路3天",
        "price": 999,
        "url": "https://example.test/tour/1",
        "days": 3,
        "groupSize": "4人小团",
        "accommodationLevel": "四星级",
        "accommodationStars": 4,
        "meals": "3早餐",
        "rating": 4.8,
        "reviewCount": 12,
        "availableSeats": 6,
        "totalSeats": 12,
        "meta": {"sourceFeatures": ["wifi_available"]},
    }
    tour = raw_to_tour(raw, 1, empty_detail())

    assert tour["groupSize"] == "4人小团"
    assert tour["accommodationLevel"] == "四星级"
    assert tour["accommodationStars"] == 4
    assert tour["meals"] == "3早餐"
    assert tour["dataQuality"]["fieldSources"]["groupSize"] == "source"
    assert tour["dataQuality"]["fieldSources"]["rating"] == "source"
    assert tour["dataQuality"]["fieldSources"]["freeWiFi"] == "source"


def test_records_without_duration_are_rejected():
    raw = {
        "source": "测试来源",
        "title": "没有天数的线路",
        "price": 999,
        "url": "https://example.test/tour/1",
    }
    assert raw_to_tour(raw, 1, empty_detail()) is None


def test_title_place_miner_resolves_named_place_to_city_anchor():
    raw = {
        "source": "测试来源",
        "title": "珠海海泉湾3天",
        "destination": "广东",
        "price": 999,
        "days": 3,
    }
    tour = raw_to_tour(raw, 1, empty_detail())

    assert tour["destinationCity"] == "珠海"
    assert tour["destinationPlaceName"] == "珠海海泉湾"
    assert tour["destinationLatitude"] == 22.0722469
    assert tour["destinationLongitude"] == 113.1109757
    assert tour["geoSource"] == "title-place-miner"
    assert tour["geoConfidence"] == "low"
    assert tour["dataQuality"]["fieldSources"]["destinationPlaceName"] == "inferred"


def test_catalog_destination_preserves_named_place_alias():
    for destination, expected_city, expected_label in (
        ("南澳岛", "汕头", "汕头南澳岛"),
        ("珠海海泉湾", "珠海", "珠海海泉湾"),
    ):
        raw = {
            "source": "测试来源",
            "title": f"{destination}3天",
            "destination": destination,
            "price": 999,
            "days": 3,
        }
        tour = raw_to_tour(raw, 1, empty_detail())
        assert tour["destinationCity"] == expected_city
        assert tour["destinationPlaceName"] == expected_label
        assert tour["geoSource"] == "local-place-catalog"


def test_title_place_miner_does_not_turn_departure_into_destination():
    raw = {
        "source": "测试来源",
        "title": "欧洲线路5天（广州起止）",
        "destination": "广东",
        "price": 999,
        "days": 5,
    }
    tour = raw_to_tour(raw, 1, empty_detail())

    assert tour["destinationCity"] == ""
    assert tour["destinationPlaceName"] == ""
    assert tour["departureCity"] == "广州"


def test_title_place_miner_rejects_departure_prefixed_route_text():
    raw = {
        "source": "测试来源",
        "title": "重庆线路广州武隆仙女山双动5天",
        "destination": "广东",
        "price": 999,
        "days": 5,
    }
    tour = raw_to_tour(raw, 1, empty_detail())

    # 重庆 opens the title before 线路 = departure hub; 广州 is the second
    # departure (广州…双动 = round-trip rail from 广州). The D-037 nationwide
    # catalog made the real destination 武隆 mineable, so the departure
    # cities must be rejected and 武隆 must win.
    assert tour["destinationCity"] == "武隆"
    assert tour["departureCity"] == "重庆"


def test_title_place_miner_keeps_destination_after_departure_phrase():
    for title in (
        "广州出发珠海海泉湾5天",
        "广州集合后游珠海海泉湾5天",
        "广州-珠海海泉湾5天",
        "行走清迈-邂逅小资广州往返5天",
    ):
        raw = {
            "source": "测试来源",
            "title": title,
            "destination": "广东",
            "price": 999,
            "days": 5,
        }
        tour = raw_to_tour(raw, 1, empty_detail())
        if "清迈" in title:
            assert tour["destinationCity"] == "清迈"
            assert tour["destinationPlaceName"] == "清迈"
        else:
            assert tour["destinationCity"] == "珠海"
            assert tour["destinationPlaceName"] == "珠海海泉湾"
        assert tour["geoConfidence"] == "low"


def test_title_place_miner_recognizes_named_destination_before_transport_text():
    raw = {
        "source": "测试来源",
        "title": "逸游仙本那|臻选水屋5天4晚-广州AK直飞斗湖",
        "destination": "广东",
        "price": 999,
        "days": 5,
    }
    tour = raw_to_tour(raw, 1, empty_detail())

    assert tour["destinationCity"] == "仙本那"
    assert tour["destinationPlaceName"] == "仙本那"
    assert tour["geoSource"] == "title-place-miner"


def test_title_place_miner_promotes_catalog_aliases_to_specific_destinations():
    cases = (
        ("贺州西溪3天", "贺州", "贺州西溪"),
        ("龙门云顶温泉3天", "龙门", "龙门云顶温泉"),
        ("新兴禅域小镇2天", "新兴", "新兴禅域小镇"),
    )
    for title, expected_city, expected_label in cases:
        raw = {
            "source": "测试来源",
            "title": title,
            "destination": "广东",
            "price": 999,
            "days": 3,
        }
        tour = raw_to_tour(raw, 1, empty_detail())
        assert tour["destinationCity"] == expected_city
        assert tour["destinationPlaceName"] == expected_label
        assert tour["geoSource"] == "title-place-miner"


def test_title_place_miner_keeps_standalone_short_alias_as_city():
    raw = {
        "source": "测试来源",
        "title": "8B【纯玩巴厘】双飞6天",
        "destination": "其他",
        "price": 999,
        "days": 6,
    }
    tour = raw_to_tour(raw, 1, empty_detail())
    assert tour["destinationCity"] == "巴厘岛"
    assert tour["destinationPlaceName"] == "巴厘岛"


def test_title_place_miner_does_not_use_departure_port_as_destination():
    raw = {
        "source": "测试来源",
        "title": "广州南沙－马尼拉－文莱－芽庄－广州南沙16晚17天",
        "destination": "广东",
        "price": 999,
        "days": 17,
    }
    tour = raw_to_tour(raw, 1, empty_detail())
    assert tour["destinationCity"] == "芽庄"
    assert tour["destinationPlaceName"] == "芽庄"


def test_title_place_miner_keeps_international_destination_before_return_flight():
    raw = {
        "source": "测试来源",
        "title": "英格兰苏格兰四星10天 广州直飞==伦敦往返",
        "destination": "广东",
        "price": 999,
        "days": 10,
    }
    tour = raw_to_tour(raw, 1, empty_detail())
    assert tour["destinationCity"] == "伦敦"
    assert tour["destinationPlaceName"] == "伦敦"


def test_detail_fields_are_structured_without_invention():
    raw = {
        "source": "测试来源",
        "title": "南非线路5天",
        "price": 999,
        "days": 5,
    }
    detail = {
        **empty_detail(),
        "itinerary": [{
            "day": 1,
            "title": "出发",
            "description": "",
            "meals": ["早餐", "午餐"],
            "accommodation": "当地四星酒店",
            "activities": [],
        }],
        "inclusions": ["含旅行保险", "含中文导游"],
        "exclusions": ["个人消费"],
    }

    tour = raw_to_tour(raw, 1, detail)

    assert tour["accommodationDetails"] == ["当地四星酒店"]
    assert tour["accommodationLevel"] == "4星酒店"
    assert tour["accommodationStars"] == 4
    assert tour["mealCounts"] == {"breakfast": 1, "lunch": 1, "dinner": 0}
    assert tour["serviceStatus"] == {
        "visaRequirements": "unknown",
        "travelInsurance": "included",
        "tourGuideService": "included",
    }
    assert tour["dataQuality"]["fieldSources"]["serviceStatus"] == "detail"


def test_conflicting_service_text_stays_unknown():
    detail = {
        **empty_detail(),
        "inclusions": ["含导游服务"],
        "exclusions": ["导游服务费另付"],
    }

    assert extract_service_status(detail, ("导游",)) == "unknown"


def test_existing_detail_cache_is_not_erased():
    from merge_data import extract_existing_detail

    detail = extract_existing_detail(
        {
            "highlights": ["真实亮点"],
            "childPolicy": "儿童政策",
            "singleSupplement": 888,
            "singleSupplementNote": "单房差以实际为准",
            "cancellationPolicy": "出发前可退",
            "refundPolicy": "按合同执行",
        }
    )

    assert detail["childPolicy"] == "儿童政策"
    assert detail["singleSupplementAmount"] == 888
    assert detail["singleSupplementNote"] == "单房差以实际为准"
    assert detail["cancellationPolicy"] == "出发前可退"
    assert detail["refundPolicy"] == "按合同执行"


def test_synthetic_existing_detail_cache_is_ignored():
    from merge_data import extract_existing_detail

    detail = extract_existing_detail(
        {
            "highlights": ["其他必打卡", "特色美食", "精品住宿"],
            "dataQuality": {
                "fieldSources": {"highlights": "synthetic"},
            },
        }
    )

    assert detail["highlights"] == []


def test_legacy_generic_highlights_are_ignored_even_when_mislabeled():
    from merge_data import extract_existing_detail

    detail = extract_existing_detail(
        {
            "highlights": ["广东必打卡", "特色美食", "精品住宿"],
            "dataQuality": {"fieldSources": {"highlights": "detail"}},
        }
    )

    assert detail["highlights"] == []


if __name__ == "__main__":
    test_missing_values_are_not_fabricated()
    test_source_fields_are_preserved_and_marked_source()
    test_records_without_duration_are_rejected()
    test_existing_detail_cache_is_not_erased()
    test_synthetic_existing_detail_cache_is_ignored()
    test_legacy_generic_highlights_are_ignored_even_when_mislabeled()
    print("merge data provenance tests passed")
