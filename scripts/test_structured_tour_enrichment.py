import copy
import sys

from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from detail_parsers import empty_detail
from enrich_structured_tour_fields import enrich_tours, normalize_detail_payload, orphan_detail_ids


def sample_detail():
    return {
        **empty_detail(),
        "itinerary": [
            {"meals": ["早餐", "午餐"], "accommodation": "当地四星酒店"},
            {"meals": ["晚餐"], "accommodation": "当地四星酒店"},
        ],
        "inclusions": ["含旅行保险", "含中文导游"],
        "exclusions": ["个人消费"],
    }


def test_enrichment_is_idempotent_and_marks_real_sources():
    tours = [{"id": "tour_1", "accommodationLevel": "", "accommodationStars": 0}]
    details = {"tour_1": sample_detail()}

    first = enrich_tours(copy.deepcopy(tours), details)
    second = enrich_tours(copy.deepcopy(first), details)

    assert second == first
    assert first[0]["accommodationDetails"] == ["当地四星酒店"]
    assert first[0]["mealCounts"] == {"breakfast": 1, "lunch": 1, "dinner": 1}
    assert first[0]["serviceStatus"]["travelInsurance"] == "included"
    assert first[0]["dataQuality"]["fieldSources"]["mealCounts"] == "detail"
    assert first[0]["dataQuality"]["syntheticFields"] == []


def test_empty_detail_preserves_unknown_semantics_without_zero_meals():
    tour = {"id": "tour_empty", "accommodationLevel": "", "accommodationStars": 0}
    enriched = enrich_tours([tour], {"tour_empty": empty_detail()})[0]

    assert "mealCounts" not in enriched
    assert enriched["accommodationDetails"] == []
    assert enriched["serviceStatus"] == {
        "visaRequirements": "unknown",
        "travelInsurance": "unknown",
        "tourGuideService": "unknown",
    }
    assert enriched["dataQuality"]["fieldSources"]["mealCounts"] == "unknown"
    assert enriched["dataQuality"]["fieldSources"]["serviceStatus"] == "unknown"


def test_orphan_detail_ids_are_only_unreferenced_files():
    tours = [{"id": "tour_1"}, {"id": "tour_2"}]
    assert orphan_detail_ids(tours, ["tour_1", "tour_2", "tour_legacy"]) == {"tour_legacy"}


def test_null_detail_fields_are_normalized_away():
    detail = {"mealCounts": None, "meta": {"structuredDetails": {"mealCounts": None}}}
    assert normalize_detail_payload(detail) is True
    assert detail == {"meta": {"structuredDetails": {}}}


if __name__ == "__main__":
    test_enrichment_is_idempotent_and_marks_real_sources()
    test_empty_detail_preserves_unknown_semantics_without_zero_meals()
    test_orphan_detail_ids_are_only_unreferenced_files()
    test_null_detail_fields_are_normalized_away()
    print("structured tour enrichment tests passed")
