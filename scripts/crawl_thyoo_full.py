#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""广州康辉 网络销售部（thyoo.com）线路爬虫。

站点结构（2026-11 实测）：
- /travel/ 全站索引页给出类目与条数（当期 1646 条），但每个类目页只展示精选卡片；
- 真正的元数据在详情页：出发地/目的地/产品编号/班期表/上车点/行程/费用说明；
- sitemap.xml 给出 9,622 条 /travel/<id>.html（含大量已下架），实际在架约 1,646 条。

因此采用「有界游标」抓取：每轮从 sitemap 取 MAX_PAGES 条详情页（默认 400），
命中"广州市出发 + 1-3 天"的入库，游标落盘到 src/data/thyoo_sitemap_cursor.json，
下一轮接着往下走 —— 单轮耗时可控（约 1-2 分钟），多轮覆盖全量。
产出与已有 raw 合并（按 url 去重），不会因为一轮没抓到就清空历史。

接口形态与调研证据见 docs/data-source-expansion-2026-11.md。
"""

from __future__ import annotations

import json
import os
import re
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime

import requests
from bs4 import BeautifulSoup

ROOT = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(ROOT, "..", "src", "data")
OUTPUT = os.path.join(DATA_DIR, "raw_thyoo_full.json")
CURSOR_PATH = os.path.join(DATA_DIR, "thyoo_sitemap_cursor.json")
BOARDING_PATH = os.path.join(ROOT, "..", "public", "data", "boarding-points", "thyoo.json")

SOURCE = "广州康辉"
BASE = "https://www.thyoo.com"
SITEMAP = BASE + "/sitemap.xml"
MAX_PAGES = int(os.environ.get("THYOO_MAX_PAGES", "400") or "400")
# 该站对高频请求会下发 JS 挑战页（2026-11 实测：连续 1500+ 次详情请求后 sitemap 变挑战页），
# 默认并发压到 4 并留抖动间隔，宁可多跑几轮也不把源站打疼。
WORKERS = max(1, min(8, int(os.environ.get("THYOO_WORKERS", "4") or "4")))
REQUEST_INTERVAL = float(os.environ.get("THYOO_INTERVAL", "0.15") or "0.15")

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "zh-CN,zh;q=0.9",
}
TIMEOUT = 25

TRAVEL_URL_RE = re.compile(r"/travel/(\d+)\.html$")
CARD_PRICE_RE = re.compile(r"[¥￥]\s*([\d,]{2,8})")
DAY_RE = re.compile(r"(\d+)\s*天")
DEPART_DATE_RE = re.compile(r"(\d{1,2})-(\d{1,2})\s*周[一二三四五六日]\s*[¥￥]([\d,]+)")
BOARDING_RE = re.compile(r"\[([A-Z])\]\s*(\d{1,2}:\d{2})\s*([^\[\]，。；]{2,40})")


def _proxies():
    """默认直连（与上品同因：境外出口会被站点侧拦截/降级）。"""
    if os.environ.get("SOURCE_DIRECT", "1").strip() in {"0", "false", "no"}:
        return None
    return {"http": None, "https": None}


def fetch(url: str) -> str:
    if REQUEST_INTERVAL > 0:
        time.sleep(REQUEST_INTERVAL)
    response = requests.get(url, headers=HEADERS, timeout=TIMEOUT, proxies=_proxies())
    response.raise_for_status()
    response.encoding = response.apparent_encoding or response.encoding
    return response.text


def is_challenge_page(text: str) -> bool:
    """识别站点下发的 JS 反爬挑战页（985 字节混淆脚本，没有 <loc>）。"""
    return "<loc>" not in text and ("_0x" in text or "function a(a)" in text)


def fetch_sitemap_urls() -> list[str]:
    """sitemap 里的线路 URL，按数字 id 倒序（最新在前）。

    sitemap 同时含大量已下架旧页（低 id 段 404）与旧模板页（无班期/上车点），
    而新上架产品集中在高 id 段且是现行模板 —— 游标按"最新优先"推进，前几轮就能
    把当期货覆盖完，旧段留到后面轮次顺带清理。
    """
    html = fetch(SITEMAP)
    if is_challenge_page(html):
        print("[广州康辉] sitemap 返回 JS 挑战页（限流）", file=sys.stderr)
        return []
    pairs: list[tuple[int, str]] = []
    for loc in re.findall(r"<loc>([^<]+)</loc>", html):
        match = TRAVEL_URL_RE.search(loc)
        if match:
            pairs.append((int(match.group(1)), loc))
    pairs.sort(reverse=True)
    return [url for _, url in pairs]


def parse_travel_listing(html: str) -> list[dict]:
    """解析 /travel/ 索引页的精选卡片（标题/价格/链接/图片）。"""
    soup = BeautifulSoup(html, "html.parser")
    items: dict[str, dict] = {}
    for anchor in soup.select('a[href*="/travel/"]'):
        href = anchor.get("href", "")
        match = TRAVEL_URL_RE.search(href)
        if not match:
            continue
        title_node = anchor.select_one("b")
        title = (title_node.get_text(" ", strip=True) if title_node else anchor.get_text(" ", strip=True))
        title = re.sub(r"\s+", " ", title).strip()
        if len(title) < 6:
            continue
        price_match = CARD_PRICE_RE.search(anchor.get_text(" ", strip=True))
        if not price_match:
            continue
        price = int(price_match.group(1).replace(",", ""))
        if price <= 0:
            continue
        days_match = DAY_RE.search(title)
        url = href if href.startswith("http") else BASE + href
        if url in items:
            continue
        items[url] = {
            "source": SOURCE,
            "title": title,
            "price": price,
            "url": url,
            "days": int(days_match.group(1)) if days_match else 0,
        }
    return list(items.values())


def _normalize_title(title: str) -> str:
    cleaned = re.sub(r"\s+", " ", title).strip()
    # 站内标题尾巴：「-广东省 广州市出发旅游线路_价格与行程_康辉旅行社」
    cleaned = re.split(r"-广东省|_价格与行程|旅游线路", cleaned)[0].strip(" -_")
    return cleaned


def _dates_from_schedule(text: str) -> list[str]:
    today = datetime.now()
    dates: list[str] = []
    for month_text, day_text, _price in DEPART_DATE_RE.findall(text):
        month, day = int(month_text), int(day_text)
        year = today.year
        if month < today.month:
            year += 1
        try:
            value = datetime(year, month, day).strftime("%Y-%m-%d")
        except ValueError:
            continue
        if value not in dates:
            dates.append(value)
    return sorted(dates)


def parse_detail(html: str, url: str = "") -> dict:
    """解析详情页：出发地/目的地/产品编号/班期/上车点/行程/费用包含。"""
    soup = BeautifulSoup(html, "html.parser")
    raw_title = soup.title.get_text(strip=True) if soup.title else ""
    for tag in soup(["script", "style"]):
        tag.decompose()
    text = re.sub(r"\s+", " ", soup.get_text(" ", strip=True))

    title = _normalize_title(raw_title)
    if len(title) < 6:
        heading = soup.find("h1")
        if heading:
            title = _normalize_title(heading.get_text(" ", strip=True))

    days_match = re.search(r"(\d+)\s*天\s*(\d+)?\s*晚?", title) or DAY_RE.search(text)
    days = int(days_match.group(1)) if days_match else 0

    dates = _dates_from_schedule(text)
    price_match = re.search(r"最低\s*[¥￥]([\d,]+)", text) or re.search(r"共\s*\d+\s*个班期(.{0,20}?)[¥￥]([\d,]+)", text)
    if price_match and price_match.lastindex and price_match.lastindex >= 2 and price_match.group(2):
        price = int(price_match.group(2).replace(",", ""))
    elif price_match:
        price = int(price_match.group(1).replace(",", ""))
    else:
        prices = [int(p.replace(",", "")) for p in CARD_PRICE_RE.findall(text)[:6]]
        price = min(prices) if prices else None

    code_match = re.search(r"产品编号[:：]\s*([A-Za-z0-9]+)", text)
    departure_match = re.search(r"([\u4e00-\u9fa5]{2,6})市出发", text)
    # 导航条里也有「目的地」字样（目的地 资讯 游记），故取第一个真正带地名分组的匹配。
    destination = ""
    destination_pattern = re.compile(
        r"目的地\s*([\u4e00-\u9fa5]{2,8}(?:省|自治区|特别行政区))?\s*([\u4e00-\u9fa5]{2,10}(?:市|自治州|县))?"
    )
    for match in destination_pattern.finditer(text):
        parts = [part for part in match.groups() if part]
        if parts:
            destination = "".join(parts)
            break

    boarding = [
        {"label": label, "time": moment, "place": place.strip()}
        for label, moment, place in BOARDING_RE.findall(text)
    ]

    itinerary: list[dict] = []
    # 「行程介绍」在页签里也出现一次，取最后一次（真正的正文段），再在它之后的费用说明处截断。
    section_start = text.rfind("行程介绍")
    itinerary_text = text[section_start:] if section_start >= 0 else text
    itinerary_text = re.split(r"费用说明|费用包含|预订须知", itinerary_text, 1)[0]
    markers = list(re.finditer(r"D(\d{1,2})\b", itinerary_text))
    for index, marker in enumerate(markers):
        day = int(marker.group(1))
        end = markers[index + 1].start() if index + 1 < len(markers) else len(itinerary_text)
        body = re.sub(r"\s+", " ", itinerary_text[marker.end():end]).strip(" :：-")
        if len(body) < 6:
            continue
        itinerary.append({"day": day, "title": "", "description": body[:1200]})
    unique: dict[int, dict] = {}
    for entry in itinerary:
        current = unique.get(entry["day"])
        if current is None or len(entry["description"]) > len(current["description"]):
            unique[entry["day"]] = entry
    itinerary = [unique[day] for day in sorted(unique)]

    inclusions: list[str] = []
    fee_match = re.search(r"费用包含(.{0,1200}?)(费用不含|费用不包含|预订须知|$)", text)
    if fee_match:
        block = fee_match.group(1)
        inclusions = [part.strip(" •·　") for part in re.split(r"[•·]", block) if len(part.strip(" •·　")) > 1]

    return {
        "source": SOURCE,
        "title": title,
        "price": price,
        "url": url,
        "days": days,
        "departureCity": (departure_match.group(1) if departure_match else "").replace("市", ""),
        "destination": destination,
        "departureDates": dates,
        "boarding": boarding,
        "sourceCode": code_match.group(1) if code_match else "",
        "itinerary": itinerary,
        "inclusions": inclusions,
    }


def _write_boarding_cache(details: list[dict]) -> int:
    """把详情页解析出的上车点写进 merge 消费的上车点缓存。

    格式与 enrich_boarding_points.py 一致（public/data/boarding-points/*.json
    的 {stats, items:{url:{title, points, raw}}}），merge 的 boarding_for() 按
    URL 归一化键取用。这些上车点是抓详情时顺手拿到的，不再额外抓一次。
    """
    items: dict[str, dict] = {}
    try:
        with open(BOARDING_PATH, encoding="utf-8") as handle:
            items = dict(json.load(handle).get("items") or {})
    except (OSError, json.JSONDecodeError):
        items = {}

    added = 0
    for detail in details:
        points = [
            f"{point.get('time')} {point.get('place')}".strip()
            for point in (detail.get("boarding") or [])
            if point.get("place")
        ]
        if not points:
            continue
        url = detail.get("url")
        if not url:
            continue
        if items.get(url, {}).get("points") == points:
            continue
        items[url] = {"title": detail.get("title", ""), "points": points, "raw": ""}
        added += 1

    if not added:
        return 0

    os.makedirs(os.path.dirname(BOARDING_PATH), exist_ok=True)
    with open(BOARDING_PATH, "w", encoding="utf-8") as handle:
        json.dump(
            {
                "stats": {"source": SOURCE, "total": len(items), "updatedAt": datetime.now().isoformat(timespec="seconds")},
                "items": items,
            },
            handle,
            ensure_ascii=False,
            indent=1,
        )
    return added


def _load_cursor() -> int:
    try:
        with open(CURSOR_PATH, encoding="utf-8") as handle:
            return int(json.load(handle).get("offset") or 0)
    except (OSError, ValueError, json.JSONDecodeError):
        return 0


def _save_cursor(offset: int) -> None:
    with open(CURSOR_PATH, "w", encoding="utf-8") as handle:
        json.dump({"offset": offset, "updatedAt": datetime.now().isoformat(timespec="seconds")}, handle, indent=1)


def _load_existing() -> dict[str, dict]:
    try:
        with open(OUTPUT, encoding="utf-8") as handle:
            data = json.load(handle)
        return {item["url"]: item for item in data if isinstance(item, dict) and item.get("url")}
    except (OSError, json.JSONDecodeError):
        return {}


def main() -> int:
    os.makedirs(DATA_DIR, exist_ok=True)
    started = time.time()
    urls = fetch_sitemap_urls()
    if not urls:
        # 被挑战页拦截时保留既有 raw，本轮记 0 新增但不把整条数据刷新打红。
        existing = _load_existing()
        print(
            f"[广州康辉] sitemap 未取到线路（疑似挑战页限流），保留既有 {len(existing)} 条，稍后重试",
            file=sys.stderr,
        )
        return 0 if existing else 1

    cursor = _load_cursor() % len(urls)
    window = urls[cursor:cursor + MAX_PAGES]
    if len(window) < MAX_PAGES:
        window += urls[: MAX_PAGES - len(window)]
    print(f"[广州康辉] sitemap {len(urls)} 条，本轮抓取 {len(window)} 条（游标 {cursor}）")

    found: dict[str, dict] = {}
    with ThreadPoolExecutor(max_workers=WORKERS) as executor:
        futures = {executor.submit(fetch, url): url for url in window}
        for done, future in enumerate(as_completed(futures), 1):
            url = futures[future]
            try:
                detail = parse_detail(future.result(), url)
            except Exception:
                continue
            if not detail.get("title") or not detail.get("price"):
                continue
            if not str(detail.get("departureCity") or "").startswith("广州"):
                continue
            if not 1 <= int(detail.get("days") or 0) <= 3:
                continue
            found[url] = detail
            if done % 100 == 0:
                print(f"[广州康辉] {done}/{len(window)} 已命中 {len(found)}")

    existing = _load_existing()
    existing.update(found)
    items = sorted(existing.values(), key=lambda item: (item.get("days") or 0, item.get("price") or 0))
    with open(OUTPUT, "w", encoding="utf-8") as handle:
        json.dump(items, handle, ensure_ascii=False, indent=1)
    _save_cursor((cursor + len(window)) % len(urls))

    print(
        f"[广州康辉] 本轮命中 {len(found)} 条，累计 {len(items)} 条，"
        f"耗时 {time.time() - started:.1f}s"
    )
    added_boarding = _write_boarding_cache(list(found.values()))
    if added_boarding:
        print(f"[广州康辉] 上车点写入 {added_boarding} 条 -> {os.path.relpath(BOARDING_PATH, os.path.join(ROOT, '..'))}")
    print(f"[保存] -> {os.path.relpath(OUTPUT, os.path.join(ROOT, '..'))}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
