#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""汇总各来源上车点，输出全量分布统计。

用法:
    python scripts/report_boarding_points.py
    python scripts/report_boarding_points.py --query 增城
"""

from __future__ import annotations

import argparse
import json
import re
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
IN_DIR = ROOT / "public" / "data" / "boarding-points"

# 归一化：把"珠江新城B2出口"与"珠江新城B2"合并为同一站点
EXIT_SUFFIX_RE = re.compile(r"(出口|口|站|地铁站|地铁|大门口|门口|正门|侧门)$")


def canonical(name: str) -> str:
    """归一到可匹配的站点名（保留字母出口编号，去掉"出口/站"等后缀）。"""
    text = name.strip()
    text = re.sub(r"^[\u4e00-\u9fa5]{2,4}[-—](?=[\u4e00-\u9fa5])", "", text)  # "深圳-民治…" 去城市前缀
    prev = None
    while prev != text:
        prev = text
        text = EXIT_SUFFIX_RE.sub("", text).strip()
    return text or name


def load_all() -> dict[str, dict]:
    merged: dict[str, dict] = {}
    for path in sorted(IN_DIR.glob("*.json")):
        payload = json.loads(path.read_text(encoding="utf-8"))
        source = path.stem
        for url, item in (payload.get("items") or {}).items():
            merged[f"{source}:{url}"] = {**item, "source": source, "url": url}
    return merged


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--query", default=None, help="按站点名筛选线路")
    parser.add_argument("--top", type=int, default=25)
    args = parser.parse_args()

    records = load_all()
    if not records:
        print("没有上车点数据，请先运行 enrich_boarding_points.py")
        return 1

    counter: Counter[str] = Counter()
    by_source: dict[str, set[str]] = {}
    for key, item in records.items():
        src = item["source"]
        by_source.setdefault(src, set()).add(key)
        for point in item["points"]:
            counter[canonical(point["name"])] += 1

    total_points = sum(len(i["points"]) for i in records.values())
    print(f"线路数 {len(records)} | 站点条目 {total_points} | 去重站点 {len(counter)}")
    print("\n按来源：")
    for src, keys in sorted(by_source.items(), key=lambda kv: -len(kv[1])):
        pts = sum(len(records[k]["points"]) for k in keys)
        print(f"  {src:<12} 线路 {len(keys):<4} 站点条目 {pts}")

    if args.query:
        # 同时匹配结构化站点名与 raw 原文——原样捕获的意义就在这里：
        # "增城广场" 可能只出现在 raw 的说明文字里（"荔新路沿线均可接送"）
        hits = []
        for k, item in records.items():
            pts = [p for p in item["points"] if args.query in p["name"]]
            in_raw = args.query in (item.get("raw") or "")
            if pts or in_raw:
                hits.append((k, item, pts, in_raw))
        print(f"\n=== 命中「{args.query}」的线路：{len(hits)} 条 ===")
        for key, item, pts, in_raw in hits:
            tag = "结构化" if pts else "仅原文"
            print(f"\n  [{item['source']}/{tag}] {item['title'][:52]}")
            print(f"    {item['url']}")
            for p in pts:
                extra = []
                if p.get("district"):
                    extra.append(p["district"])
                if p.get("quota"):
                    extra.append(f"{p['quota']}人起接")
                if p.get("time"):
                    extra.append(p["time"])
                suffix = f"  ({' / '.join(extra)})" if extra else ""
                print(f"      - {p['name']}{suffix}")
            if in_raw and not pts:
                # 命中在原文里：把相关片段交给 AI 判断
                raw = item.get("raw") or ""
                idx = raw.find(args.query)
                snippet = raw[max(0, idx - 120): idx + 160].replace("\n", " ")
                print(f"      原文片段: …{snippet}…")
        return 0

    print(f"\n=== 高频站点 Top {args.top} ===")
    for name, count in counter.most_common(args.top):
        print(f"  {count:>4}  {name}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
