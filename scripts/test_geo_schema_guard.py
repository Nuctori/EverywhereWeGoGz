"""Schema invariant: rebuilt tours keep geoResolution.mining fields as arrays.

Frontend zod schema requires candidateLabels/rejectedLabels/reasons/
sourceCandidates to be arrays — a null (from a return path that skipped
re-filling mining after the D-031 reset) broke detail loading for 4536 tours.
"""
import json
from pathlib import Path

MINING_ARRAY_KEYS = (
    "candidateLabels",
    "rejectedLabels",
    "reasons",
    "sourceCandidates",
)


def test_rebuild_leaves_mining_fields_as_arrays():
    tour = {
        "id": "tour_schema",
        "title": "江门御泉湖居温泉3天",
        "destination": "广东",
        "geoResolution": {"mining": {"candidateLabels": ["旧残留"], "rejectedLabels": None}},
    }

    from rebuild_geo_data import rebuild

    before, after = rebuild([tour])
    assert before == 0 and after == 1
    mining = (tour.get("geoResolution") or {}).get("mining") or {}
    for key in MINING_ARRAY_KEYS:
        assert isinstance(mining.get(key), list), (
            f"mining.{key} must be a list after rebuild, got {mining.get(key)!r}"
        )
    # old residue must not survive (D-031 ghost prevention)
    assert "旧残留" not in (mining.get("candidateLabels") or [])


def test_all_tour_details_mining_fields_are_arrays():
    """Full-data schema guard: every shipped tour-details file must pass."""
    root = Path(__file__).resolve().parent.parent
    bad = []
    for path in sorted((root / "public/data/tour-details").glob("*.json")):
        try:
            with path.open(encoding="utf-8") as handle:
                tour = json.load(handle)
        except (OSError, json.JSONDecodeError) as error:
            bad.append(f"{path.name}: load {error}")
            continue
        res = tour.get("geoResolution")
        if not isinstance(res, dict):
            continue
        mining = res.get("mining")
        if not isinstance(mining, dict):
            continue
        for key in MINING_ARRAY_KEYS:
            val = mining.get(key)
            if not isinstance(val, list):
                bad.append(f"{path.name}: mining.{key}={val!r}")
    assert not bad, f"{len(bad)} tour-details with invalid mining fields:\n" + "\n".join(bad[:10])


if __name__ == "__main__":
    test_rebuild_leaves_mining_fields_as_arrays()
    test_all_tour_details_mining_fields_are_arrays()
    print("schema guard tests passed")
