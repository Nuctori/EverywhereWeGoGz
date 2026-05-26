#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Fetch Kanghui tour products from the paginated PC list page."""

import json
import os
import re
import time
from html import unescape
from urllib.parse import parse_qs, urljoin, urlparse

import requests
from bs4 import BeautifulSoup


BASE_URL = "http://gz.cctpage.com"
LIST_URL = f"{BASE_URL}/PC/TourLine/List"
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "zh-CN,zh;q=0.9",
}
REQUEST_DELAY = 0.2
TIMEOUT = 20
MAX_PAGE_LIMIT = 200
PLACEHOLDER_IMAGE_TOKENS = ("lazyImg", "{{", "}}")


def safe_get(url, params=None):
    response = requests.get(url, params=params, headers=HEADERS, timeout=TIMEOUT)
    response.raise_for_status()
    response.encoding = response.apparent_encoding or response.encoding or "utf-8"
    return response.text


def extract_days(title):
    match = re.search(r"(\d+)\s*[天日]", title)
    return int(match.group(1)) if match else 0


def extract_price(card):
    price_node = card.find("span", class_="value")
    if price_node:
        text = price_node.get_text("", strip=True).replace(",", "")
        match = re.search(r"\d+(?:\.\d+)?", text)
        if match:
            return float(match.group(0))

    text = card.get_text(" ", strip=True).replace(",", "")
    prices = [float(value) for value in re.findall(r"(?:¥|￥|元)\s*(\d+(?:\.\d+)?)", text)]
    if prices:
        return max(prices)
    return 0.0


def extract_prodcode(href):
    query = parse_qs(urlparse(href).query)
    values = query.get("prodcode") or query.get("prodCode") or []
    return values[0] if values else ""


def is_placeholder_image_url(url):
    return not url or any(token in url for token in PLACEHOLDER_IMAGE_TOKENS)


def parse_products(html):
    soup = BeautifulSoup(html, "lxml")
    products = []

    for card in soup.find_all("div", class_="product j_item"):
        title_wrap = card.find("div", class_="title")
        title_link = title_wrap.find("a") if title_wrap else None
        if not title_link:
            continue

        title = unescape(title_link.get_text(" ", strip=True))
        href = title_link.get("href", "")
        if not title or "prodcode=" not in href:
            continue

        price = extract_price(card)
        if price <= 0:
            continue

        detail_url = urljoin(BASE_URL, href)
        image_url = ""
        image = card.find("img", class_=re.compile(r"(?:^|\s)lazy_img(?:\s|$)"))
        if image:
            image_src = (
                image.get("data-original")
                or image.get("data-src")
                or image.get("data-lazy-src")
                or ""
            )
            if not image_src:
                src = image.get("src") or ""
                image_src = "" if is_placeholder_image_url(src) else src
            image_url = urljoin(BASE_URL, image_src) if not is_placeholder_image_url(image_src) else ""

        item = {
            "source": "康辉",
            "title": title,
            "price": price,
            "url": detail_url,
            "days": extract_days(title),
            "sourceId": extract_prodcode(detail_url),
        }
        if image_url:
            item["img"] = image_url
        products.append(item)

    return products


def extract_max_page(html):
    pages = []
    for value in re.findall(r"pageIndex=(\d+)", html):
        try:
            pages.append(int(value))
        except ValueError:
            pass
    return min(max(pages) if pages else 1, MAX_PAGE_LIMIT)


def fetch():
    first_html = safe_get(LIST_URL, params={"navid": 6, "pageIndex": 1})
    max_page = extract_max_page(first_html)
    print(f"[康辉] max_page={max_page}")

    items = []
    seen = set()

    for page in range(1, max_page + 1):
        html = first_html if page == 1 else safe_get(LIST_URL, params={"navid": 6, "pageIndex": page})
        page_items = parse_products(html)
        if page_items:
            for item in page_items:
                key = item.get("sourceId") or f"{item['title']}|{item['price']}"
                if key in seen:
                    continue
                seen.add(key)
                items.append(item)
        elif page > 1:
            print(f"[康辉] page {page}: no products, stopping")
            break

        if page % 10 == 0 or page == max_page:
            print(f"[康辉] page {page}/{max_page}, total={len(items)}")
        time.sleep(REQUEST_DELAY)

    print(f"[康辉] fetched {len(items)} products")
    return items


def main():
    items = fetch()
    data_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "src", "data"))
    os.makedirs(data_dir, exist_ok=True)
    output_path = os.path.join(data_dir, "raw_kanghui.json")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(items, f, ensure_ascii=False, indent=2)
    print(f"[保存] -> {output_path}")


if __name__ == "__main__":
    main()
