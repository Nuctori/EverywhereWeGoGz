#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
快速校验 tours.json 中的 bookingUrl 是否仍然可访问。

输出:
  - JSON 明细报告
  - CSV 明细报告

分类说明:
  - ok: 页面可访问，且命中了详情页正向特征
  - unavailable: 页面可访问，但命中了 404/下架/已删除/错误页等特征
  - http_error: HTTP 4xx/5xx
  - blocked: 被安全验证、验证码或风控页拦截
  - network_error: 请求超时、连接失败等
  - reachable_unverified: 页面可达，但缺少稳定的正向/反向特征，建议人工复核
"""

from __future__ import annotations

import argparse
import csv
import html
import json
import re
import sys
import threading
import time
from collections import Counter
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

import requests
from bs4 import BeautifulSoup

sys.stdout.reconfigure(encoding="utf-8")


DEFAULT_INPUT = Path("public/data/tours.json")
DEFAULT_OUTPUT = Path("audit/tour-availability-report.json")
DEFAULT_CACHE = Path("src/data/tour-availability-cache.json")
CACHE_SCHEMA_VERSION = 2

BLOCKED = "blocked"
HTTP_ERROR = "http_error"
NETWORK_ERROR = "network_error"
OK = "ok"
REACHABLE_UNVERIFIED = "reachable_unverified"
UNAVAILABLE = "unavailable"

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/136.0.0.0 Safari/537.36"
)

GLOBAL_NEGATIVE_KEYWORDS = [
    "页面不存在",
    "产品不存在",
    "线路不存在",
    "活动已结束",
    "活动被删除",
    "您访问的页面被删除了",
    "很抱歉，出错了",
    "找不到文件或目录",
    "the resource you are looking for might have been removed",
    "您看的产品不小心飞走了",
    "已下架",
    "已售罄",
    "售罄",
    "停止报名",
    "报名已满",
    "操作失败",
    "404 很抱歉，出错了",
    "server error 404",
]

BLOCKED_KEYWORDS = [
    "验证码",
    "安全验证",
    "访问频繁",
    "请求过于频繁",
    "人机验证",
    "just a moment",
    "checking your browser",
    "cloudflare",
]

TITLE_NEGATIVE_HINTS = [
    "【下架】",
    "下架",
    "停售",
    "售罄",
]


@dataclass(frozen=True)
class DomainRule:
    name: str
    host_contains: tuple[str, ...]
    positive_markers: tuple[str, ...] = ()
    negative_keywords: tuple[str, ...] = ()
    negative_final_url_fragments: tuple[str, ...] = ()


DOMAIN_RULES = [
    DomainRule(
        name="广之旅",
        host_contains=("gzl.cn", "gzl.com.cn"),
        positive_markers=("产品特色", "行程介绍", "费用说明", "预订须知", "产品编号", "行程天数"),
        negative_keywords=("您看的产品不小心飞走了",),
    ),
    DomainRule(
        name="康辉",
        host_contains=("cctpage.com",),
        positive_markers=("产品编号", "行程介绍", "费用说明", "预订须知", "参考价"),
        negative_keywords=("很抱歉，出错了", "页面不存在"),
        negative_final_url_fragments=("/PC/Error/Index",),
    ),
    DomainRule(
        name="品途",
        host_contains=("ptotour.com",),
        positive_markers=("行程介绍", "费用说明", "预订须知", "温馨提示", "预定流程", "立即预订"),
        negative_keywords=("找不到文件或目录", "file or directory not found"),
    ),
    DomainRule(
        name="广东中旅",
        host_contains=("gdcts.com",),
        positive_markers=("产品说明", "行程安排", "相关事项", "选择出游日期", "行程天数", "编号："),
        negative_keywords=("产品不存在", "操作失败"),
    ),
    DomainRule(
        name="广州去旅行/暴走村",
        host_contains=("360jlb.cn",),
        positive_markers=("活动详情", "集合地点", "活动咨询", "立即报名", "图文详情"),
        negative_keywords=("您访问的页面被删除了", "出错啦"),
        negative_final_url_fragments=("/m/error",),
    ),
    DomainRule(
        name="假日通",
        host_contains=("jrt365.com",),
        # 假日通详情页返回的文本结构不稳定，快速校验只能给到“可达但待人工复核”。
        positive_markers=(),
        negative_keywords=(),
    ),
]


_thread_local = threading.local()


def get_session() -> requests.Session:
    session = getattr(_thread_local, "session", None)
    if session is None:
        session = requests.Session()
        session.trust_env = False
        session.headers.update(
            {
                "User-Agent": USER_AGENT,
                "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
                "Cache-Control": "no-cache",
                "Pragma": "no-cache",
            }
        )
        _thread_local.session = session
    return session


def compact_whitespace(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def html_to_text(markup: str) -> str:
    text = re.sub(r"(?is)<script.*?>.*?</script>", " ", markup)
    text = re.sub(r"(?is)<style.*?>.*?</style>", " ", text)
    text = re.sub(r"(?s)<[^>]+>", " ", text)
    return compact_whitespace(html.unescape(text))


def normalize_token(value: str) -> str:
    value = html.unescape(value)
    value = re.sub(r"&[a-zA-Z]+;", " ", value)
    value = re.sub(r"[【】\[\]（）()<>〈〉·•|:：,，.。!！?？/+_*=~'\"-]", " ", value)
    return compact_whitespace(value)


def extract_title_tokens(title: str) -> list[str]:
    normalized = normalize_token(title)
    raw_tokens = re.split(r"\s+", normalized)
    tokens: list[str] = []
    for token in raw_tokens:
        stripped = token.strip()
        if not stripped:
            continue
        if stripped.isdigit():
            continue
        if len(stripped) < 2:
            continue
        tokens.append(stripped.lower())
    tokens.sort(key=len, reverse=True)
    return tokens[:8]


def find_domain_rule(url: str) -> DomainRule | None:
    host = urlparse(url).netloc.lower()
    for rule in DOMAIN_RULES:
        if any(fragment in host for fragment in rule.host_contains):
            return rule
    return None


def match_keyword(text: str, keywords: tuple[str, ...] | list[str]) -> str:
    lower_text = text.lower()
    for keyword in keywords:
        if keyword.lower() in lower_text:
            return keyword
    return ""


def title_confidence(title: str, text: str) -> tuple[int, list[str]]:
    text_lower = text.lower()
    matched: list[str] = []
    for token in extract_title_tokens(title):
        if token in text_lower:
            matched.append(token)
    return len(matched), matched[:3]


def detect_redirect_problem(original_url: str, final_url: str) -> str:
    original = urlparse(original_url)
    final = urlparse(final_url)
    original_path = original.path.lower()
    final_path = final.path.lower()

    detail_like = any(
        fragment in original_path
        for fragment in ("/detail", "/details", "tourgroup_ziliao.aspx", "/event", "/domestic/", "/freetour/")
    )
    list_like = any(
        fragment in final_path
        for fragment in ("/search", "/list", "/index", "/error")
    )

    if detail_like and list_like and original_path != final_path:
        return f"redirected to non-detail page: {final_path}"
    return ""


def detect_jrt365_unavailable_shell(raw_html: str) -> bool:
    soup = BeautifulSoup(raw_html, "lxml")
    title_selectors = [
        "#ctl00_ContentPlaceHolder_htmlform_id_tourname",
        "#ctl00_ContentPlaceHolder_htmlform_id_tourname_1",
    ]
    content_selectors = [
        "#con_e_1",
        "#con_e_2",
        "#con_e_3",
        "#con_e_4",
        "#ctl00_ContentPlaceHolder_htmlform_id_note",
    ]

    titles = []
    for selector in title_selectors:
        node = soup.select_one(selector)
        titles.append(node.get_text(" ", strip=True) if node else "")

    contents = []
    for selector in content_selectors:
        node = soup.select_one(selector)
        contents.append(node.get_text(" ", strip=True) if node else "")

    print_link = soup.select_one("#ctl00_ContentPlaceHolder_htmlform_id_print_xc")
    print_href = (print_link.get("href", "") if print_link else "").strip()

    if any(titles) or any(contents) or print_href:
        return False

    return 'tourname: ""' in raw_html and 'salelable3: ""' in raw_html


def has_jrt365_detail_content(raw_html: str) -> bool:
    soup = BeautifulSoup(raw_html, "lxml")
    title = ""
    for selector in (
        "#ctl00_ContentPlaceHolder_htmlform_id_tourname",
        "#ctl00_ContentPlaceHolder_htmlform_id_tourname_1",
    ):
        node = soup.select_one(selector)
        title = (node.get_text(" ", strip=True) if node else "").strip()
        if title:
            break

    if not title:
        return False

    print_link = soup.select_one("#ctl00_ContentPlaceHolder_htmlform_id_print_xc")
    print_href = (print_link.get("href", "") if print_link else "").strip()
    if print_href:
        return True

    for selector in ("#con_e_1", "#con_e_2", "#con_e_3", "#con_e_4", "#ctl00_ContentPlaceHolder_htmlform_id_note"):
        node = soup.select_one(selector)
        if node and node.get_text(" ", strip=True):
            return True
    return False


def validate_url(url: str, title: str, timeout: float) -> dict[str, Any]:
    started = time.time()
    rule = find_domain_rule(url)
    result: dict[str, Any] = {
        "url": url,
        "title": title,
        "domain_rule": rule.name if rule else "",
    }

    if any(hint in title for hint in TITLE_NEGATIVE_HINTS):
        result.update(
            {
                "category": UNAVAILABLE,
                "reason": "title already contains unavailable hint",
                "status_code": None,
                "final_url": url,
                "matched_keyword": next(h for h in TITLE_NEGATIVE_HINTS if h in title),
                "elapsed_ms": int((time.time() - started) * 1000),
                "text_sample": "",
                "title_token_hits": [],
            }
        )
        return result

    try:
        response = get_session().get(url, timeout=timeout, allow_redirects=True)
    except requests.RequestException as exc:
        result.update(
            {
                "category": NETWORK_ERROR,
                "reason": str(exc.__class__.__name__),
                "status_code": None,
                "final_url": url,
                "matched_keyword": "",
                "elapsed_ms": int((time.time() - started) * 1000),
                "text_sample": "",
                "title_token_hits": [],
            }
        )
        return result

    response.encoding = response.apparent_encoding or response.encoding
    final_url = response.url
    status_code = response.status_code
    raw_html = response.text
    text = html_to_text(response.text)
    text_sample = text[:220]
    title_hits_count, title_hits = title_confidence(title, text)

    result.update(
        {
            "status_code": status_code,
            "final_url": final_url,
            "elapsed_ms": int((time.time() - started) * 1000),
            "text_sample": text_sample,
            "title_token_hits": title_hits,
        }
    )

    if status_code >= 400:
        result.update(
            {
                "category": HTTP_ERROR,
                "reason": f"http {status_code}",
                "matched_keyword": "",
            }
        )
        return result

    blocked_keyword = match_keyword(text, BLOCKED_KEYWORDS)
    if blocked_keyword:
        result.update(
            {
                "category": BLOCKED,
                "reason": "anti-bot or verification page",
                "matched_keyword": blocked_keyword,
            }
        )
        return result

    redirect_problem = detect_redirect_problem(url, final_url)
    if redirect_problem:
        result.update(
            {
                "category": UNAVAILABLE,
                "reason": redirect_problem,
                "matched_keyword": "",
            }
        )
        return result

    if rule:
        if rule.name == "假日通":
            if detect_jrt365_unavailable_shell(raw_html):
                result.update(
                    {
                        "category": UNAVAILABLE,
                        "reason": "假日通 detail shell without content",
                        "matched_keyword": "",
                    }
                )
                return result

            if has_jrt365_detail_content(raw_html):
                result.update(
                    {
                        "category": OK,
                        "reason": "假日通 detail content found",
                        "matched_keyword": "",
                    }
                )
                return result

        if any(fragment in final_url.lower() for fragment in ("gzl.cn", "gzl.com.cn")):
            rule_positive = match_keyword(text, rule.positive_markers)
            if rule_positive:
                reason = f"{rule.name} detail markers found"
                if title_hits_count > 0:
                    reason += " + title tokens matched"
                result.update(
                    {
                        "category": OK,
                        "reason": reason,
                        "matched_keyword": rule_positive,
                    }
                )
                return result

        rule_negative = match_keyword(text, rule.negative_keywords)
        if rule_negative:
            result.update(
                {
                    "category": UNAVAILABLE,
                    "reason": f"{rule.name} negative keyword",
                    "matched_keyword": rule_negative,
                }
            )
            return result

        final_url_lower = final_url.lower()
        fragment_hit = next((fragment for fragment in rule.negative_final_url_fragments if fragment.lower() in final_url_lower), "")
        if fragment_hit:
            result.update(
                {
                    "category": UNAVAILABLE,
                    "reason": f"{rule.name} error redirect",
                    "matched_keyword": fragment_hit,
                }
            )
            return result

    global_negative = match_keyword(text, GLOBAL_NEGATIVE_KEYWORDS)
    if global_negative:
        result.update(
            {
                "category": UNAVAILABLE,
                "reason": "matched negative keyword",
                "matched_keyword": global_negative,
            }
        )
        return result

    if rule:
        rule_positive = match_keyword(text, rule.positive_markers)
        if rule_positive:
            reason = f"{rule.name} detail markers found"
            if title_hits_count > 0:
                reason += " + title tokens matched"
            result.update(
                {
                    "category": OK,
                    "reason": reason,
                    "matched_keyword": rule_positive,
                }
            )
            return result

    if title_hits_count >= 2 and len(text) >= 500:
        result.update(
            {
                "category": OK,
                "reason": "title tokens matched in reachable page",
                "matched_keyword": "",
            }
        )
        return result

    result.update(
        {
            "category": REACHABLE_UNVERIFIED,
            "reason": "page reachable but no stable detail/unavailable markers found",
            "matched_keyword": "",
        }
    )
    return result


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def parse_checked_at(value: str) -> float | None:
    if not value:
        return None
    try:
        normalized = value.replace("Z", "+00:00")
        return datetime.fromisoformat(normalized).timestamp()
    except ValueError:
        return None


def load_cache(path: Path) -> dict[str, dict[str, Any]]:
    if not path.exists():
        return {}
    try:
        with path.open("r", encoding="utf-8") as f:
            payload = json.load(f)
    except Exception:
        return {}

    if not isinstance(payload, dict) or payload.get("schema_version") != CACHE_SCHEMA_VERSION:
        return {}

    raw_entries = payload.get("entries")
    if not isinstance(raw_entries, dict):
        return {}

    entries: dict[str, dict[str, Any]] = {}
    for url, entry in raw_entries.items():
        if isinstance(url, str) and isinstance(entry, dict):
            entries[url] = entry
    return entries


def save_cache(path: Path, entries: dict[str, dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "generated_at": utc_now_iso(),
        "schema_version": CACHE_SCHEMA_VERSION,
        "entries": dict(sorted(entries.items())),
    }
    with path.open("w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)


def is_cache_entry_fresh(entry: dict[str, Any], ttl_hours: float) -> bool:
    if ttl_hours <= 0:
        return False
    checked_at = parse_checked_at(str(entry.get("checked_at") or ""))
    if checked_at is None:
        return False
    age_seconds = time.time() - checked_at
    return age_seconds <= ttl_hours * 3600


def run_validation_jobs(
    jobs: list[tuple[str, str]],
    *,
    workers: int,
    timeout: float,
    cache_path: Path | None = DEFAULT_CACHE,
    cache_ttl_hours: float = 24.0,
    use_cache: bool = True,
    write_cache: bool = True,
) -> tuple[dict[str, dict[str, Any]], dict[str, int]]:
    cache_entries = load_cache(cache_path) if use_cache and cache_path else {}
    url_results: dict[str, dict[str, Any]] = {}
    to_validate: list[tuple[str, str]] = []
    title_by_url = {url: title for url, title in jobs}
    stats = {
        "cache_hits": 0,
        "cache_misses": 0,
        "validated": 0,
    }

    for url, title in jobs:
        cached = cache_entries.get(url)
        if cached and is_cache_entry_fresh(cached, cache_ttl_hours):
            result = dict(cached)
            result["url"] = url
            result["title"] = title
            url_results[url] = result
            stats["cache_hits"] += 1
            continue
        to_validate.append((url, title))
        stats["cache_misses"] += 1

    if to_validate:
        with ThreadPoolExecutor(max_workers=max(1, workers)) as executor:
            future_map = {
                executor.submit(validate_url, url, title, timeout): url
                for url, title in to_validate
            }
            total = len(future_map)
            for idx, future in enumerate(as_completed(future_map), 1):
                url = future_map[future]
                title = title_by_url.get(url, "")
                try:
                    result = future.result()
                except Exception as exc:  # pragma: no cover
                    result = {
                        "url": url,
                        "title": title,
                        "domain_rule": "",
                        "category": NETWORK_ERROR,
                        "reason": f"unexpected error: {exc.__class__.__name__}",
                        "status_code": None,
                        "final_url": url,
                        "matched_keyword": "",
                        "elapsed_ms": 0,
                        "text_sample": "",
                        "title_token_hits": [],
                    }
                result["checked_at"] = utc_now_iso()
                url_results[url] = result
                cache_entries[url] = result
                stats["validated"] += 1
                if idx % 50 == 0 or idx == total:
                    print(f"[可用性缓存] 刷新 {idx}/{total}")

    if cache_path and write_cache:
        save_cache(cache_path, cache_entries)

    return url_results, stats


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="快速校验旅行团链接可用性")
    parser.add_argument("--input", default=str(DEFAULT_INPUT), help="输入 tours.json 路径")
    parser.add_argument("--output", default=str(DEFAULT_OUTPUT), help="输出 JSON 报告路径")
    parser.add_argument("--cache", default=str(DEFAULT_CACHE), help="可用性缓存文件路径")
    parser.add_argument("--cache-ttl-hours", type=float, default=24.0, help="缓存有效期（小时），默认 24")
    parser.add_argument("--no-cache", action="store_true", help="禁用读取/写入缓存")
    parser.add_argument("--workers", type=int, default=10, help="并发数，默认 10")
    parser.add_argument("--timeout", type=float, default=12.0, help="单请求超时秒数，默认 12")
    parser.add_argument("--limit", type=int, default=0, help="仅校验前 N 条，0 表示全部")
    parser.add_argument("--source", default="", help="仅校验指定来源")
    parser.add_argument("--sample-failures", type=int, default=20, help="终端最多打印多少条异常样本")
    return parser.parse_args()


def load_tours(path: Path, source_filter: str, limit: int) -> list[dict[str, Any]]:
    with path.open("r", encoding="utf-8") as f:
        tours = json.load(f)

    if source_filter:
        tours = [tour for tour in tours if tour.get("source") == source_filter]
    if limit > 0:
        tours = tours[:limit]
    return tours


def unique_jobs(tours: list[dict[str, Any]]) -> tuple[list[tuple[str, str]], dict[str, list[dict[str, Any]]]]:
    grouped: dict[str, list[dict[str, Any]]] = {}
    for tour in tours:
        url = str(tour.get("bookingUrl") or "").strip()
        if not url:
            continue
        grouped.setdefault(url, []).append(tour)

    jobs: list[tuple[str, str]] = []
    for url, items in grouped.items():
        jobs.append((url, str(items[0].get("title") or "")))
    return jobs, grouped


def build_rows(grouped: dict[str, list[dict[str, Any]]], url_results: dict[str, dict[str, Any]]) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for url, tours in grouped.items():
        validation = url_results[url]
        for tour in tours:
            row = {
                "id": tour.get("id"),
                "source": tour.get("source"),
                "title": tour.get("title"),
                "price": tour.get("price"),
                "bookingUrl": url,
                **validation,
            }
            rows.append(row)
    return rows


def write_csv(path: Path, rows: list[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fieldnames = [
        "id",
        "source",
        "title",
        "price",
        "bookingUrl",
        "final_url",
        "status_code",
        "category",
        "reason",
        "matched_keyword",
        "elapsed_ms",
        "domain_rule",
        "title_token_hits",
        "text_sample",
    ]
    with path.open("w", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            normalized = {name: row.get(name, "") for name in fieldnames}
            normalized["title_token_hits"] = ", ".join(row.get("title_token_hits") or [])
            writer.writerow(normalized)


def main() -> int:
    args = parse_args()
    input_path = Path(args.input)
    output_path = Path(args.output)
    csv_path = output_path.with_suffix(".csv")
    cache_path = Path(args.cache)

    if not input_path.exists():
        print(f"[错误] 输入文件不存在: {input_path}")
        return 1

    tours = load_tours(input_path, args.source, args.limit)
    print(f"[载入] 线路 {len(tours)} 条")
    if args.source:
        print(f"[过滤] 来源 = {args.source}")

    jobs, grouped = unique_jobs(tours)
    print(f"[去重] 唯一 URL {len(jobs)} 条")

    started = time.time()
    url_results, cache_stats = run_validation_jobs(
        jobs,
        workers=max(1, args.workers),
        timeout=args.timeout,
        cache_path=None if args.no_cache else cache_path,
        cache_ttl_hours=args.cache_ttl_hours,
        use_cache=not args.no_cache,
        write_cache=not args.no_cache,
    )

    rows = build_rows(grouped, url_results)

    category_counter = Counter(row["category"] for row in rows)
    source_category_counter = Counter((row["source"], row["category"]) for row in rows)

    report = {
        "generated_at": time.strftime("%Y-%m-%dT%H:%M:%S"),
        "input": str(input_path),
        "total_tours": len(tours),
        "unique_urls": len(jobs),
        "elapsed_seconds": round(time.time() - started, 2),
        "cache": {
            "path": "" if args.no_cache else str(cache_path),
            "ttl_hours": args.cache_ttl_hours,
            **cache_stats,
        },
        "summary": dict(category_counter),
        "summary_by_source": {
            f"{source}::{category}": count
            for (source, category), count in sorted(source_category_counter.items())
        },
        "rows": rows,
    }

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2)
    write_csv(csv_path, rows)

    print("\n[汇总]")
    if not args.no_cache:
        print(
            f"[缓存] 命中 {cache_stats['cache_hits']} | "
            f"刷新 {cache_stats['validated']} | 未命中 {cache_stats['cache_misses']}"
        )
    for category, count in sorted(category_counter.items(), key=lambda item: (-item[1], item[0])):
        print(f"  {category}: {count}")

    bad_categories = {UNAVAILABLE, HTTP_ERROR, BLOCKED, NETWORK_ERROR}
    failures = [row for row in rows if row["category"] in bad_categories]
    if failures:
        print(f"\n[异常样本] 最多显示 {args.sample_failures} 条")
        for row in failures[: args.sample_failures]:
            print(
                f"  [{row['category']}] {row['source']} | {row['title'][:40]} | "
                f"status={row['status_code']} | {row['reason']} | {row['bookingUrl']}"
            )

    print(f"\n[输出] JSON: {output_path}")
    print(f"[输出] CSV : {csv_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
