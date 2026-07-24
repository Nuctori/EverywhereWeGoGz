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
