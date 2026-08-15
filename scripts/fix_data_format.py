#!/usr/bin/env python3
"""Restore compact LF serialization for data files reformatted by
fix_kanghui_urls.py (341472ce2 wrote indent=1 CRLF — 2.68M-line churn,
violates .editorconfig end_of_line=lf). Content is verified identical
after rewrite (json.load deep-equal). Use: python scripts/fix_data_format.py
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "public" / "data"
FILES = [DATA / "tour-map-cards.json", DATA / "tours.json", DATA / "tours-index.json", DATA / "tours-list.json"]
FILES += sorted((DATA / "tour-map-place-cards").rglob("*.json"))
FILES += sorted((DATA / "tours-page-1").glob("*.json")) if (DATA / "tours-page-1").is_dir() else []
FILES += sorted((DATA / "tours-page-2").glob("*.json")) if (DATA / "tours-page-2").is_dir() else []


def main() -> None:
    fixed = 0
    for path in FILES:
        if not path.is_file():
            continue
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as error:
            print(f"SKIP {path.name}: {error}")
            continue
        text = path.read_text(encoding="utf-8")
        compact = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
        if text == compact or text.replace("\r\n", "\n") == compact:
            continue  # already compact LF
        # content deep-equal check against what we just loaded
        path.write_text(compact + "\n", encoding="utf-8", newline="\n")
        reloaded = json.loads(path.read_text(encoding="utf-8"))
        if reloaded != data:
            print(f"CONTENT MISMATCH {path.name} — restoring")
            path.write_text(text, encoding="utf-8")
            continue
        fixed += 1
        if fixed % 50 == 0:
            print(f"  fixed {fixed}...", flush=True)
    print(f"fixed {fixed} files")


if __name__ == "__main__":
    main()
