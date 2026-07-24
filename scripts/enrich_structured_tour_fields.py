"""Enrich an existing tours.json without re-crawling or re-filtering tours."""

import json
import os
import tempfile
from pathlib import Path

from detail_parsers import empty_detail
from merge_data import (
    extract_accommodation_details,
    extract_meal_counts,
    extract_service_status,
    summarize_accommodation,
)


ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "public" / "data"


def write_json_atomically(path: Path, value):
    fd, temporary = tempfile.mkstemp(prefix=f".{path.name}.", suffix=".tmp", dir=path.parent)
    try:
        with os.fdopen(fd, "w", encoding="utf-8", newline="\n") as handle:
            json.dump(value, handle, ensure_ascii=False, separators=(",", ":"))
            handle.write("\n")
        os.replace(temporary, path)
    finally:
        if os.path.exists(temporary):
            os.unlink(temporary)


def enrich(tour: dict, detail: dict) -> None:
    accommodation_details = extract_accommodation_details(detail)
    accommodation_summary, stars = summarize_accommodation(accommodation_details)
    meal_counts = extract_meal_counts(detail)
    service_status = {
        "visaRequirements": extract_service_status(detail, ("签证",)),
        "travelInsurance": extract_service_status(detail, ("保险", "意外险")),
        "tourGuideService": extract_service_status(detail, ("导游", "领队", "司导")),
    }

    if not tour.get("accommodationLevel"):
        tour["accommodationLevel"] = accommodation_summary
    if not tour.get("accommodationStars"):
        tour["accommodationStars"] = stars
    tour["accommodationDetails"] = accommodation_details
    if any(meal_counts.values()):
        tour["mealCounts"] = meal_counts
    else:
        tour.pop("mealCounts", None)
    tour["serviceStatus"] = service_status

    quality = tour.setdefault("dataQuality", {})
    quality.setdefault("syntheticFields", [])
    sources = quality.setdefault("fieldSources", {})
    if accommodation_details:
        sources["accommodationLevel"] = sources.get("accommodationLevel") or "detail"
        sources["accommodationStars"] = "detail"
        sources["accommodationDetails"] = "detail"
    else:
        sources.setdefault("accommodationDetails", "unknown")
    sources["mealCounts"] = "detail" if any(meal_counts.values()) else "unknown"
    sources["serviceStatus"] = (
        "detail" if any(value != "unknown" for value in service_status.values()) else "unknown"
    )
    structured_details = {
        "accommodationDetails": accommodation_details,
        "serviceStatus": service_status,
    }
    if any(meal_counts.values()):
        structured_details["mealCounts"] = meal_counts
    tour.setdefault("meta", {})["structuredDetails"] = structured_details


def enrich_tours(tours: list[dict], details_by_id: dict[str, dict]) -> list[dict]:
    for tour in tours:
        enrich(tour, details_by_id.get(tour.get("id"), empty_detail()))
    return tours


def detail_ids_for_tours(tours: list[dict]) -> set[str]:
    return {str(tour.get("id")) for tour in tours if str(tour.get("id") or "").strip()}


def orphan_detail_ids(tours: list[dict], detail_ids: list[str]) -> set[str]:
    return set(detail_ids) - detail_ids_for_tours(tours)


def main() -> None:
    tours_path = DATA_DIR / "tours.json"
    details_dir = DATA_DIR / "tour-details"
    tours = json.loads(tours_path.read_text(encoding="utf-8"))
    details = {}
    for detail_path in details_dir.glob("*.json"):
        details[detail_path.stem] = json.loads(detail_path.read_text(encoding="utf-8"))
    enrich_tours(tours, details)
    write_json_atomically(tours_path, tours)
    print(f"enriched {len(tours)} tours")


if __name__ == "__main__":
    main()
