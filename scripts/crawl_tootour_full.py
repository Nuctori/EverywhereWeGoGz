#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""上品旅行（广州市海外国际旅行社，gz.tootour.com）全量线路爬虫。

站点是传统服务端渲染 ASP.NET 站，列表页即全量：无需登录、无需 JS、无分页。
接口形态见 docs/data-source-expansion-2026-11.md。

产出：src/data/raw_tootour_full.json（merge_data.py 按 raw 契约消费）
字段：source/title/price/url/days/destination/img/tags/departureCity/departureDates

注意（2026-11 实测）：该站按出口 IP 做地域/CDN 判断，经日本出口的代理访问会落进
Cloudflare 挑战页（403 安全验证）。故默认直连；需要走系统代理时设 SOURCE_DIRECT=0。
"""

from __future__ import annotations

import json
import os
import re
import sys
import time

import requests
from bs4 import BeautifulSoup

ROOT = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(ROOT, "..", "src", "data")
OUTPUT = os.path.join(DATA_DIR, "raw_tootour_full.json")

SOURCE = "上品旅行"
BASE = "http://gz.tootour.com"
CATEGORIES = ["/around/", "/domestic/", "/hongkong/"]
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "zh-CN,zh;q=0.9",
}
TIMEOUT = 25

DETAIL_RE = re.compile(r"^/travel/(\d+)\.html$")
PRICE_RE = re.compile(r"[¥￥]\s*([\d,]{2,8})")
DAY_RE = re.compile(r"(\d+(?:\.\d+)?)\s*[天日]")
CN_DAYS = {"一": 1, "两": 2, "二": 2, "三": 3, "四": 4, "五": 5, "六": 6, "七": 7, "八": 8, "九": 9, "十": 10}


def _proxies():
    """默认直连：该站的 Cloudflare 判定与出口 IP 绑定，走境外代理必然 403。"""
    if os.environ.get("SOURCE_DIRECT", "1").strip() in {"0", "false", "no"}:
        return None
    return {"http": None, "https": None}


def fetch(url: str) -> str:
    response = requests.get(url, headers=HEADERS, timeout=TIMEOUT, proxies=_proxies())
    response.raise_for_status()
    response.encoding = response.apparent_encoding or response.encoding
    return response.text


def extract_days(title: str) -> int:
    match = DAY_RE.search(title)
    if match:
        return int(float(match.group(1)))
    match = re.search(r"([一两二三四五六七八九十])\s*日游", title)
    if match:
        return CN_DAYS.get(match.group(1), 0)
    return 0


def _card_text(card) -> str:
    return re.sub(r"\s+", " ", card.get_text(" ", strip=True))


def parse_listing(html: str, category: str = "") -> list[dict]:
    """解析列表页卡片为 raw 契约条目。

    站点卡片结构：li.j_item > a[href=/travel/<id>.html] + div.title/div.price/div.origin。
    只保留"广州出发"且有天数的线路：非广州出发的货与本项目口径无关，无天数的条目
    merge 侧也会被丢弃（raw_to_tour 要求 days>0），提前剔除可让产出数量诚实。
    """
    soup = BeautifulSoup(html, "html.parser")
    items: dict[str, dict] = {}

    for anchor in soup.select('a[href^="/travel/"]'):
        href = anchor.get("href", "")
        match = DETAIL_RE.match(href)
        if not match:
            continue

        card = anchor
        for _ in range(4):
            if card.parent is None:
                break
            card = card.parent
            if PRICE_RE.search(_card_text(card)):
                break

        title_node = card.select_one("div.title")
        title = (title_node.get_text(" ", strip=True) if title_node else anchor.get_text(" ", strip=True))
        title = re.sub(r"\s+", " ", title).strip()
        if len(title) < 6:
            continue

        days = extract_days(title)
        if not days:
            continue

        price_node = card.select_one("div.price span.value") or card.select_one("div.price")
        price_text = price_node.get_text(" ", strip=True) if price_node else ""
        price_match = PRICE_RE.search(price_text) or PRICE_RE.search(_card_text(card))
        if not price_match:
            continue
        price = int(price_match.group(1).replace(",", ""))
        if price <= 0:
            continue

        origin_node = card.select_one("div.origin")
        origin = origin_node.get_text(" ", strip=True) if origin_node else ""
        if "广州" not in origin:
            continue

        img_node = card.select_one("img")
        img = ""
        if img_node is not None:
            img = (img_node.get("data-original") or img_node.get("src") or "").strip()
            if "loading.gif" in img:
                img = ""

        tags = [node.get_text(" ", strip=True) for node in card.select("div.tags span")]
        tags = [tag for tag in tags if tag]

        url = BASE + href
        if url in items:
            continue
        items[url] = {
            "source": SOURCE,
            "title": title,
            "price": price,
            "url": url,
            "days": days,
            "destination": "",
            "departureCity": "广州",
            "departureDates": [],
            "img": img,
            "tags": tags,
            "category": category.strip("/"),
        }

    return list(items.values())


def parse_detail(html: str, url: str = "") -> dict:
    """解析详情页：行程分段（D<n> 第<n>天）与费用包含/不含。"""
    soup = BeautifulSoup(html, "html.parser")
    for tag in soup(["script", "style"]):
        tag.decompose()
    text = re.sub(r"\s+", " ", soup.get_text(" ", strip=True))

    markers = list(re.finditer(r"D(\d{1,2})\s*第\s*(\d{1,2})\s*天", text))
    itinerary: list[dict] = []
    by_day: dict[int, dict] = {}
    for index, marker in enumerate(markers):
        day = int(marker.group(1))
        end = markers[index + 1].start() if index + 1 < len(markers) else len(text)
        body = text[marker.end():end].strip()
        body = re.split(r"费用说明|费用包含|预订须知|温馨提示", body)[0].strip()
        if len(body) < 6:
            continue
        head, _, rest = body.partition(" ")
        entry = {
            "day": day,
            "title": head.strip()[:40],
            "description": rest.strip()[:1200] or body[:1200],
        }
        previous = by_day.get(day)
        if previous is None or len(entry["description"]) > len(previous["description"]):
            by_day[day] = entry
    itinerary = [by_day[day] for day in sorted(by_day)]

    inclusions: list[str] = []
    fee_match = re.search(r"费用包含(.{0,1200}?)(费用不包含|费用说明|预订须知|$)", text)
    if fee_match:
        block = fee_match.group(1)
        inclusions = [part.strip(" •·　") for part in re.split(r"[•·]", block) if len(part.strip(" •·　")) > 1]

    exclusions: list[str] = []
    exclude_match = re.search(r"费用不包含(.{0,900}?)(预订须知|温馨提示|$)", text)
    if exclude_match:
        block = exclude_match.group(1)
        exclusions = [part.strip(" •·　") for part in re.split(r"[•·]", block) if len(part.strip(" •·　")) > 1]

    days = max((entry["day"] for entry in itinerary), default=0)
    price_match = PRICE_RE.search(text)

    return {
        "itinerary": itinerary,
        "inclusions": inclusions,
        "exclusions": exclusions,
        "days": days,
        "price": int(price_match.group(1).replace(",", "")) if price_match else None,
    }


def main() -> int:
    os.makedirs(DATA_DIR, exist_ok=True)
    collected: dict[str, dict] = {}
    started = time.time()

    for category in CATEGORIES:
        url = BASE + category
        try:
            html = fetch(url)
        except Exception as exc:  # pragma: no cover - 网络路径
            print(f"[上品旅行] {category} 抓取失败: {exc}")
            continue
        items = parse_listing(html, category)
        print(f"[上品旅行] {category:12s} {len(items):4d} 条")
        for item in items:
            collected.setdefault(item["url"], item)
        time.sleep(0.5)

    items = list(collected.values())
    if not items:
        if os.path.exists(OUTPUT):
            print("[tootour] 0 items -- keeping existing", OUTPUT)
            return 0
        print("[tootour] 0 items", file=sys.stderr)
        return 1

    items.sort(key=lambda item: (item["days"], item["price"]))
    with open(OUTPUT, "w", encoding="utf-8") as handle:
        json.dump(items, handle, ensure_ascii=False, indent=1)

    short = sum(1 for item in items if 1 <= item["days"] <= 3)
    print(f"[上品旅行] 合计 {len(items)} 条（1-3 天 {short} 条），耗时 {time.time() - started:.1f}s")
    print(f"[保存] -> {os.path.relpath(OUTPUT, os.path.join(ROOT, '..'))}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
