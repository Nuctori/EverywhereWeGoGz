"""Audit structured detail coverage and provenance for the committed dataset."""

import json
from collections import Counter
from pathlib import Path

from enrich_structured_tour_fields import detail_ids_for_tours, orphan_detail_ids


ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "public" / "data"


def main() -> None:
    tours = json.loads((DATA_DIR / "tours.json").read_text(encoding="utf-8"))
    detail_dir = DATA_DIR / "tour-details"
    detail_ids = [path.stem for path in detail_dir.glob("*.json")]
    expected_ids = detail_ids_for_tours(tours)
    actual_ids = set(detail_ids)
    missing = expected_ids - actual_ids
    orphan = orphan_detail_ids(tours, detail_ids)
    synthetic = [tour["id"] for tour in tours if (tour.get("dataQuality") or {}).get("syntheticFields")]
    if missing or orphan or synthetic:
        raise SystemExit(f"structured field audit failed: missing={sorted(missing)[:5]} orphan={sorted(orphan)[:5]} synthetic={synthetic[:5]}")

    meal_count = sum(1 for tour in tours if tour.get("mealCounts"))
    accommodation_count = sum(1 for tour in tours if tour.get("accommodationDetails"))
    service_values = Counter(
        value
        for tour in tours
        for value in (tour.get("serviceStatus") or {}).values()
        if value != "unknown"
    )
    print(f"tours={len(tours)} details={len(detail_ids)} missing=0 orphan=0 synthetic=0")
    print(f"accommodationDetails={accommodation_count} mealCounts={meal_count} explicitServiceStatuses={sum(service_values.values())}")


if __name__ == "__main__":
    main()
