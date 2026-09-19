#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""上车点采集（渲染版）。

gdcts/gzl 的上车点位于详情页"产品介绍/预订须知"区块，由 JS 渲染，
requests 拿不到，必须走真实浏览器（渲染统一由 scripts/render_pages.mjs 完成）。

用法:
    # 1) 生成渲染目标（渲染源从 raw 目录数据里筛短线/汽车团）
    python scripts/enrich_boarding_points.py --prepare-urls
    # 2) 渲染（Node/playwright）
    node scripts/render_pages.mjs --in tmp/boarding_urls_gdcts.json --out tmp/gdcts_rendered.json
    node scripts/render_pages.mjs --in tmp/boarding_urls_gzl.json --out tmp/gzl_rendered.json
    # 3) 解析入库（渲染结果默认读 tmp/<source>_rendered.json）
    python scripts/enrich_boarding_points.py --source all
    python scripts/enrich_boarding_points.py --source gdcts --limit 30

输出:
    public/data/boarding-points/<source>.json

合并语义：本轮成功抓取（或渲染出文本）的 URL 以本轮结果为准（含"本轮确认无上车点"）；
本轮没抓到（网络失败/渲染失败）的 URL 保留上一轮条目，避免一次反爬抖动清空既有数据。
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import time
from pathlib import Path
from urllib.parse import urlparse

sys.path.insert(0, str(Path(__file__).parent))

from boarding_points import (  # noqa: E402
    extract_boarding_points,
    extract_boarding_raw,
    format_summary,
)

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "src" / "data"
OUT_DIR = ROOT / "public" / "data" / "boarding-points"
TMP_DIR = ROOT / "tmp"

UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/122 Safari/537.36"
)

# 国际/长线标记：这类线路在机场/码头集合，没有城市上车点，跳过以免浪费渲染配额。
# 注意不要放"往返""航"这类字：动车团/汽车团标题里大量出现"广州往返""动车往返"，
# 放进去会把纯国内短线全部误杀（2026-09 实测误伤 gzl 30+ 条）。
INTL_RE = re.compile(
    r"国际|双飞|直飞|航班|飞机|机票|航空|邮轮|游轮|欧洲|美洲|非洲|大洋洲"
    r"|日本|韩国|泰国|新马|新加坡|马来|越南|柬埔寨|尼泊尔|不丹|斯里兰卡|印度|中东"
    r"|迪拜|埃及|土耳其|俄罗斯|高加索|中亚|美国|加拿大|巴西|秘鲁|智利|阿根廷|墨西哥|古巴"
    r"|澳洲|澳大利亚|新西兰|斐济|摩洛哥|突尼斯|肯尼亚|南非|极光|冰岛|格陵兰"
    r"|本州|首尔|北海道|冲绳|关岛|塞班|长滩|普吉|巴厘|沙巴|岘港|芽庄"
)

# 各来源的详情页入口（相对 src/data/raw_*.json 的字段）
# render=True 表示详情页区块由 JS 渲染，静态 HTML 取不到（gdcts / gzl 均如此）。
SOURCES = {
    "gdcts": {"raw": "raw_http_full.json", "render": True,
              "url_key": "url", "title_key": "title"},
    "outdoors": {"raw": "raw_outdoors_full.json", "render": False,
                 "url_key": "url", "title_key": "title"},
    "saihuitong": {"raw": "raw_saihuitong_full.json", "render": False,
                   "url_key": "url", "title_key": "title"},
    # 广之旅：跟团/汽车团才可能有集中上车点，自由行/酒店/签证/长线跳过
    "gzl": {"raw": "raw_gzl_api.json", "render": True,
            "url_key": "url", "title_key": "title"},
    "jrt365": {"raw": "raw_jrt365_full.json", "render": False,
               "url_key": "url", "title_key": "title"},
}

# 需要渲染的来源统一走 render_pages.mjs（Node 侧 playwright）
RENDER_SOURCES = {"gdcts", "gzl"}

# gzl 只采这些产品类型的上车点（PRODUCTGROUP=跟团游，BUS=汽车班）
GZL_BUS_PRODUCT_TYPES = {"PRODUCTGROUP", "BUS"}
# 上车点属于汽车/动车短线；超过这个天数的跟团基本都是双长线（即便标题没写）
MAX_BUS_DAYS = 6


def load_raw(name: str) -> list[dict]:
    path = DATA_DIR / name
    if not path.exists():
        return []
    data = json.loads(path.read_text(encoding="utf-8"))
    if isinstance(data, list):
        return data
    return data.get("items") or data.get("data") or []


def is_international(title: str) -> bool:
    return bool(INTL_RE.search(title or ""))


def candidate_url(source: str, item: dict) -> dict | None:
    """按来源过滤出"可能有城市上车点"的详情页目标；不符合返回 None。"""
    cfg = SOURCES[source]
    title = str(item.get(cfg["title_key"]) or "")
    url = str(item.get(cfg["url_key"]) or "").split("?")[0]
    if not url or is_international(title):
        return None
    if source == "gzl":
        if str(item.get("productType") or "") not in GZL_BUS_PRODUCT_TYPES:
            return None
        try:
            days = int(item.get("days") or 0)
        except (TypeError, ValueError):
            days = 0
        if days and days > MAX_BUS_DAYS:
            return None
    return {"url": url, "title": title}


def path_key(url: str) -> str:
    """同线路去重键，语义对齐 merge_data.boarding_url_key（剥 host，保留 query）。

    - gdcts 目录页给 www、raw 里是 m，host 不同但 id 在 path 里；
    - 360jlb (/m/event?id=) 与 jrt365 (?groupno=) 的实体 id 在 query 里，
      丢 query 会把整站折叠成一个键，导致"沿用上一轮"判断整批误杀。
    """
    parsed = urlparse(str(url or "").strip())
    path = (parsed.path or "").rstrip("/").lower()
    key = path or str(url or "").lower()
    if parsed.query:
        key = f"{key}?{parsed.query.lower()}"
    return key


def fetch_html_requests(url: str) -> str:
    import requests

    resp = requests.get(url, headers={"User-Agent": UA}, timeout=25)
    resp.raise_for_status()
    resp.encoding = resp.apparent_encoding or resp.encoding
    return resp.text


def prepare_urls() -> int:
    """为渲染源写出 tmp/boarding_urls_<source>.json，供 render_pages.mjs --in 使用。"""
    TMP_DIR.mkdir(parents=True, exist_ok=True)
    for source in sorted(RENDER_SOURCES):
        cfg = SOURCES[source]
        seen: set[str] = set()
        targets: list[dict] = []
        for item in load_raw(cfg["raw"]):
            cand = candidate_url(source, item)
            if not cand or cand["url"] in seen:
                continue
            seen.add(cand["url"])
            targets.append(cand)
        out_path = TMP_DIR / f"boarding_urls_{source}.json"
        out_path.write_text(
            json.dumps(targets, ensure_ascii=False, indent=1), encoding="utf-8"
        )
        print(f"[{source}] 渲染目标 {len(targets)} -> {out_path}")
    return 0


def process(source: str, limit: int | None) -> tuple[dict, set[str]]:
    """采集单源上车点。返回 (payload, 本轮成功抓取的 path_key 集合)。"""
    cfg = SOURCES[source]
    results: dict[str, dict] = {}
    attempted: set[str] = set()
    stats = {"total": 0, "with_points": 0, "skipped_intl": 0}

    if source in RENDER_SOURCES:
        # JS 渲染源：渲染由 scripts/render_pages.mjs（Node/playwright）完成，
        # 结果经 tmp/<source>_rendered.json（或 BOARDING_RENDERED）传入。
        rendered_path = TMP_DIR / f"{source}_rendered.json"
        env_override = os.environ.get("BOARDING_RENDERED")
        if env_override:
            rendered_path = ROOT / env_override
        if not rendered_path.exists():
            print(f"  [{source}] 渲染结果缺失: {rendered_path}")
            print(f"  先运行: node scripts/render_pages.mjs --in tmp/boarding_urls_{source}.json "
                  f"--out tmp/{source}_rendered.json")
            return {"stats": stats, "items": results}, attempted
        rows = json.loads(rendered_path.read_text(encoding="utf-8"))
        if limit:
            rows = rows[:limit]
        print(f"  [{source}] rendered pages: {len(rows)}")
        for row in rows:
            stats["total"] += 1
            text = row.get("text") or ""
            if not text:
                continue  # 渲染失败：保留上一轮（若有）
            url = row.get("url") or ""
            attempted.add(path_key(url))
            title = row.get("title", "")
            if is_international(title):
                stats["skipped_intl"] += 1
                continue
            points = extract_boarding_points(text)
            raw = extract_boarding_raw(text)
            if points:
                stats["with_points"] += 1
            if points or raw:
                results[url] = {
                    "title": title,
                    "points": points,
                    "raw": raw,
                    "summary": format_summary(points),
                }
        print(f"  [{source}] 含上车点 {stats['with_points']}/{stats['total']}")
        return {"stats": stats, "items": results}, attempted

    # 静态源：直接 requests
    items = load_raw(cfg["raw"])
    print(f"  [{source}] raw items: {len(items)}")
    for item in items:
        cand = candidate_url(source, item)
        if not cand:
            continue
        stats["total"] += 1
        if limit and stats["total"] > limit:
            break
        url = cand["url"]
        try:
            html = fetch_html_requests(url)
            points = extract_boarding_points(html)
            raw = extract_boarding_raw(html)
        except Exception:  # noqa: BLE001
            continue  # 抓取失败：保留上一轮（若有）
        attempted.add(path_key(url))
        if points:
            stats["with_points"] += 1
        if points or raw:
            results[url] = {
                "title": cand["title"],
                "points": points,
                "raw": raw,
                "summary": format_summary(points),
            }
        time.sleep(0.2)
    return {"stats": stats, "items": results}, attempted


def merge_with_previous(out_path: Path, fresh: dict, attempted: set[str]) -> dict:
    """合并上一轮结果：本轮没抓到的 URL 沿用旧条目，成功抓到的以本轮为准。"""
    if not out_path.exists():
        return fresh
    try:
        prev = json.loads(out_path.read_text(encoding="utf-8")).get("items") or {}
    except (OSError, json.JSONDecodeError):
        return fresh
    fresh_keys = {path_key(u) for u in fresh}
    kept = 0
    for url, item in prev.items():
        if not url or path_key(url) in fresh_keys or path_key(url) in attempted:
            continue
        fresh[url] = item
        kept += 1
    if kept:
        print(f"  沿用上一轮条目 {kept} 条（本轮未抓到）")
    return fresh


def write_gzl_rendered_details() -> None:
    """把 gzl 渲染文本解析成详情缓存，供 merge_data 优先于静态解析消费。

    渲染本来是为上车点做的，行程/费用结构是顺带产物，不额外产生抓取量。
    产物 src/data/gzl_rendered_details.json 随仓库提交，merge 在任何
    DETAIL_FETCH_MODE 下都会把它覆盖到对应线路。
    """
    from detail_parsers import parse_rendered_detail

    rendered_path = TMP_DIR / "gzl_rendered.json"
    if not rendered_path.exists():
        print("[gzl-details] 渲染结果缺失，跳过详情缓存")
        return
    rows = json.loads(rendered_path.read_text(encoding="utf-8"))
    cache: dict[str, dict] = {}
    for row in rows:
        text = row.get("text") or ""
        if not text:
            continue
        detail = parse_rendered_detail(text)
        itinerary = detail.get("itinerary") or []
        if not itinerary:
            continue
        cache[str(row.get("url") or "")] = {
            "title": row.get("title", ""),
            "detail": {
                "itinerary": itinerary,
                "inclusions": detail.get("inclusions") or [],
                "exclusions": detail.get("exclusions") or [],
                "optionalExpenses": detail.get("optionalExpenses") or [],
                "childPolicy": detail.get("childPolicy") or "",
                "cancellationPolicy": detail.get("cancellationPolicy") or "",
                "refundPolicy": detail.get("refundPolicy") or "",
            },
        }
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    detail_cache_path = DATA_DIR / "gzl_rendered_details.json"
    detail_cache_path.write_text(
        json.dumps(cache, ensure_ascii=False, separators=(",", ":")), encoding="utf-8"
    )
    with_itinerary = len(cache)
    print(f"[gzl-details] 渲染详情缓存 {with_itinerary} 条 -> {detail_cache_path}")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", default="all", choices=[*SOURCES, "all"])
    parser.add_argument("--limit", type=int, default=None)
    parser.add_argument("--prepare-urls", action="store_true",
                        help="只生成渲染目标清单（tmp/boarding_urls_<source>.json）后退出")
    args = parser.parse_args()

    if args.prepare_urls:
        return prepare_urls()

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    targets = list(SOURCES) if args.source == "all" else [args.source]
    for source in targets:
        print(f"=== {source} ===")
        payload, attempted = process(source, args.limit)
        out_path = OUT_DIR / f"{source}.json"
        payload["items"] = merge_with_previous(out_path, payload["items"], attempted)
        out_path.write_text(
            json.dumps(payload, ensure_ascii=False, indent=1), encoding="utf-8"
        )
        stats = payload["stats"]
        total_with_points = sum(1 for it in payload["items"].values() if it.get("points"))
        print(
            f"  -> {out_path.name}: 本轮 {stats['with_points']}/{stats['total']}，"
            f"累计含上车点 {total_with_points}/{len(payload['items'])}，"
            f"跳过国际线 {stats['skipped_intl']}"
        )
    if args.source in ("all", "gzl"):
        write_gzl_rendered_details()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
