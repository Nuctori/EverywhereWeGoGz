#!/usr/bin/env python3
"""Run the unified full-entry crawlers and write per-source raw files."""

from __future__ import annotations

import importlib
import sys
import time
import traceback
from pathlib import Path


ROOT = Path(__file__).resolve().parent


CRAWLERS = [
    ("jrt365", "crawl_jrt365_full"),
    ("kanghui", "crawl_kanghui_full"),
    ("gdcts", "crawl_gdcts_full"),
    ("pintu", "crawl_pintu_full"),
    ("saihuitong", "crawl_saihuitong_full"),
    ("gzl", "crawl_gzl_api"),
    ("outdoors", "crawl_outdoors_full"),
]


def run_module(module_name: str) -> None:
    module = importlib.import_module(module_name)
    main = getattr(module, "main", None)
    if not callable(main):
        raise RuntimeError(f"{module_name}.main not found")
    main()


def main() -> int:
    start = time.time()
    failures: list[tuple[str, str]] = []

    if str(ROOT) not in sys.path:
        sys.path.insert(0, str(ROOT))

    for label, module_name in CRAWLERS:
        print("=" * 72)
        print(f"[unified-crawl] start {label} -> {module_name}.py")
        print("=" * 72)
        step_start = time.time()
        try:
            run_module(module_name)
        except Exception as exc:  # pragma: no cover - operational path
            failures.append((label, f"{exc}"))
            print(f"[unified-crawl] failed {label} -> {exc}")
            traceback.print_exc()
        finally:
            elapsed = time.time() - step_start
            print(f"[unified-crawl] done {label} | {elapsed:.1f}s")

    total_elapsed = time.time() - start
    print("=" * 72)
    print(f"[unified-crawl] finished in {total_elapsed:.1f}s")
    if failures:
        print(f"[unified-crawl] failed sources: {len(failures)}")
        for label, error in failures:
            print(f"  - {label}: {error}")
        return 1

    print("[unified-crawl] all sources completed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
