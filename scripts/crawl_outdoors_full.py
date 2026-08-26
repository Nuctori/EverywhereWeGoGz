#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Fetch Tianya Outdoors route products from the public route list pages."""

from __future__ import annotations

import json
import os
import re
import time
from datetime import datetime
from html import unescape
from urllib.parse import parse_qs, urljoin, urlparse

import requests
from bs4 import BeautifulSoup


BASE_URL = "https://www.outdoors.com.cn"
SOURCE = "天涯户外"
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "zh-CN,zh;q=0.9",
}
LIST_URLS = [
    ("surroundcity", f"{BASE_URL}/route/routelist/surroundcity/1.html"),
    ("internal", f"{BASE_URL}/route/routelist/internal/1.html"),
    ("depart", f"{BASE_URL}/route/routelist/depart/1.html"),
]
SCROLL_ENDPOINT = f"{BASE_URL}/route/routelist.html"
REQUEST_DELAY = 0.2
TIMEOUT = 25
MAX_SCROLL_PAGES = int(os.environ.get("OUTDOORS_MAX_SCROLL_PAGES", "200") or "200")


def safe_get(url: str, session: requests.Session | None = None) -> str:
    client = session or requests
    response = client.get(url, headers=HEADERS, timeout=TIMEOUT)
    response.raise_for_status()
    response.encoding = response.apparent_encoding or response.encoding or "utf-8"
    return response.text


def safe_post_json(session: requests.Session, url: str, data: dict, referer: str):
    headers = {
        **HEADERS,
        "X-Requested-With": "XMLHttpRequest",
        "Referer": referer,
    }
    response = session.post(url, data=data, headers=headers, timeout=TIMEOUT)
    response.raise_for_status()
    return response.json()


def normalize_text(value: str) -> str:
    text = unescape(value or "").replace("\xa0", " ")
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def resolve_url(url: str) -> str:
    return urljoin(BASE_URL, (url or "").strip())


def extract_price(text: str) -> float:
    cleaned = normalize_text(text).replace(",", "")
    match = re.search(r"(?:￥|¥)\s*(\d+(?:\.\d+)?)", cleaned)
    if not match:
        match = re.search(r"(\d+(?:\.\d+)?)\s*元", cleaned)
    if not match:
        match = re.fullmatch(r"\d+(?:\.\d+)?", cleaned)
    if not match:
        return 0.0
    return float(match.group(1) if match.groups() else match.group(0))


def extract_days(title: str) -> int:
    match = re.search(r"(\d+)\s*(?:天|日)", title or "")
    return int(match.group(1)) if match else 0


def normalize_date(value: str) -> str:
    text = normalize_text(value)
    patterns = [
        r"(\d{4})[年/-](\d{1,2})[月/-](\d{1,2})日?",
        r"(\d{4})\.(\d{1,2})\.(\d{1,2})",
    ]
    for pattern in patterns:
        match = re.search(pattern, text)
        if not match:
            continue
        year, month, day = (int(part) for part in match.groups())
        try:
            return datetime(year, month, day).strftime("%Y-%m-%d")
        except ValueError:
            return ""
    return ""


def extract_source_id(url: str) -> str:
    parsed = urlparse(url)
    path_match = re.search(r"/id/(\d+)(?:/did/(\d+))?", parsed.path)
    if path_match:
        route_id = path_match.group(1)
        schedule_id = path_match.group(2)
        return f"{route_id}:{schedule_id}" if schedule_id else route_id

    query = parse_qs(parsed.query)
    route_id = (query.get("id") or [""])[0]
    schedule_id = (query.get("did") or [""])[0]
    if route_id:
        return f"{route_id}:{schedule_id}" if schedule_id else route_id
    return ""


def parse_list_card(card) -> dict | None:
    title_link = card.select_one("a.a-coupons")
    if not title_link:
        title_link = card.select_one("a[href*='/route/linedetail']")
    if not title_link:
        return None

    title = normalize_text(title_link.get_text(" ", strip=True))
    href = title_link.get("href", "")
    if not title or "/route/linedetail" not in href:
        return None

    detail_url = resolve_url(href)
    price = extract_price(card.select_one(".coupons-right").get_text(" ", strip=True) if card.select_one(".coupons-right") else card.get_text(" ", strip=True))
    if price <= 0:
        return None

    image_url = ""
    image = card.select_one("img")
    if image:
        image_src = image.get("data-original") or image.get("data-src") or image.get("src") or ""
        if image_src and not image_src.startswith("/Public/"):
            image_url = resolve_url(image_src)

    card_text = card.get_text(" ", strip=True)
    departure_date = normalize_date(card_text)
    destination = ""
    destination_match = re.search(r"目的地[:：]\s*([^出发集合已]+)", normalize_text(card_text))
    if destination_match:
        destination = normalize_text(destination_match.group(1)).replace("&nbsp", "").strip()

    item = {
        "source": SOURCE,
        "title": title,
        "price": price,
        "url": detail_url,
        "days": extract_days(title),
        "sourceId": extract_source_id(detail_url),
        "departureDates": [departure_date] if departure_date else [],
    }
    if destination:
        item["destination"] = destination
    if image_url:
        item["img"] = image_url
    return item


def parse_list_page(html: str) -> list[dict]:
    soup = BeautifulSoup(html, "lxml")
    current_list = soup.select_one(".di-addic[style*='display:block']")
    cards = current_list.select("li.li-coupons") if current_list else soup.select("li.li-coupons")
    products: list[dict] = []
    for card in cards:
        item = parse_list_card(card)
        if item:
            products.append(item)
    return products


def parse_api_item(info: dict) -> dict | None:
    title = normalize_text(str(info.get("line_name") or ""))
    route_id = normalize_text(str(info.get("id") or ""))
    schedule_id = normalize_text(str(info.get("did") or ""))
    if not title or not route_id:
        return None

    detail_path = f"/route/linedetail/id/{route_id}"
    if schedule_id:
        detail_path += f"/did/{schedule_id}"
    detail_url = resolve_url(f"{detail_path}.html")

    price = extract_price(str(info.get("vip_money") or ""))
    if price <= 0:
        return None

    departure_date = normalize_date(str(info.get("start_time_change") or ""))
    destination = ""
    region_name = info.get("region_name")
    if isinstance(region_name, dict):
        destination = " ".join(normalize_text(str(value)) for value in region_name.values() if value)
    elif isinstance(region_name, list):
        destination = " ".join(normalize_text(str(value)) for value in region_name if value)
    elif region_name:
        destination = normalize_text(str(region_name))

    item = {
        "source": SOURCE,
        "title": title,
        "price": price,
        "url": detail_url,
        "days": extract_days(title),
        "sourceId": f"{route_id}:{schedule_id}" if schedule_id else route_id,
        "departureDates": [departure_date] if departure_date else [],
    }
    if destination:
        item["destination"] = destination
    image_url = normalize_text(str(info.get("pic_3_2_path") or info.get("pic_2_1_path") or ""))
    if image_url and not image_url.startswith("/Public/"):
        item["img"] = resolve_url(image_url)
    return item


def fetch_scroll_page(session: requests.Session, referer: str, page: int):
    data = {
        "i": page,
        "where": "",
        "line_type": "",
        "region_county": "",
        "before_time": "",
        "after_time": "",
        "month": "",
        "orderby": "",
    }
    payload = safe_post_json(session, SCROLL_ENDPOINT, data, referer)
    if isinstance(payload, dict) and payload.get("status") == 101:
        return []
    if not isinstance(payload, list):
        raise ValueError(f"unexpected scroll response: {payload!r}")
    return [item for row in payload if (item := parse_api_item(row))]


def fetch_detail_dates(item: dict, session: requests.Session | None = None) -> None:
    try:
        html = safe_get(item["url"], session=session)
    except Exception as exc:
        print(f"  [outdoors] detail dates failed {item['url']}: {exc}")
        return

    soup = BeautifulSoup(html, "lxml")
    dates = list(item.get("departureDates") or [])
    prices = [float(item["price"])] if item.get("price") else []
    for option in soup.select("#cfrq option"):
        text = normalize_text(option.get_text(" ", strip=True))
        date_value = normalize_date(text)
        if date_value and date_value not in dates:
            dates.append(date_value)
        price = extract_price(text.replace("(成人)", "元"))
        if price > 0:
            prices.append(price)

    if dates:
        dates.sort()
        item["departureDates"] = dates
    if prices:
        item["price"] = min(prices)


def fetch() -> list[dict]:
    print("[outdoors] fetching Tianya Outdoors route lists...")
    items: list[dict] = []
    seen: set[str] = set()

    for channel, base_url in LIST_URLS:
        session = requests.Session()
        try:
            first_html = safe_get(base_url, session=session)
            first_items = parse_list_page(first_html)
        except Exception as exc:
            print(f"  [outdoors] list failed {base_url}: {exc}")
            continue

        channel_seen_before = len(items)
        page_batches = [(0, first_items)]
        for page in range(1, MAX_SCROLL_PAGES + 1):
            try:
                page_items = fetch_scroll_page(session, base_url, page)
            except Exception as exc:
                print(f"  [outdoors] scroll failed {base_url} page {page}: {exc}")
                break
            if not page_items:
                print(f"  [outdoors] {channel} scroll page {page}: exhausted")
                break
            page_batches.append((page, page_items))
            time.sleep(REQUEST_DELAY)

        for page, page_items in page_batches:
            added = 0
            for item in page_items:
                key = item.get("sourceId") or f"{item['title']}|{item['price']}"
                if key in seen:
                    continue
                seen.add(key)
                fetch_detail_dates(item, session=session)
                items.append(item)
                added += 1
                time.sleep(REQUEST_DELAY)

            label = "first html" if page == 0 else f"scroll page {page}"
            print(f"  [outdoors] {channel} {label}: {added} new / {len(page_items)} parsed")

        print(f"  [outdoors] {channel}: {len(items) - channel_seen_before} total new")

    print(f"[outdoors] fetched {len(items)} products")
    return items


def main() -> None:
    items = fetch()
    data_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "src", "data"))
    output_path = os.path.join(data_dir, "raw_outdoors_full.json")
    if len(items) == 0 and os.path.exists(output_path):
        print(f"[outdoors] 0 items -- keeping existing {output_path}")
        return
    os.makedirs(data_dir, exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(items, f, ensure_ascii=False, indent=2)
    print(f"[save] -> {output_path}")


if __name__ == "__main__":
    main()
