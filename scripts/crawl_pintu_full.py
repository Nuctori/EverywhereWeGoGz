#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
品途全量爬虫 - 使用 session 分页并提取列表图
"""

import json
import os
import re
import time

import requests
from bs4 import BeautifulSoup

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) "
        "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 "
        "Mobile/15E148 Safari/604.1"
    ),
}

BASE_URL = "http://gz.ptotour.com"
CATS = [
    {"name": "省内周边", "tid": "around"},
    {"name": "国内游", "tid": "domestic"},
    {"name": "出境游", "tid": "abroad"},
]
MAX_PAGES = 80
RETRY_TIMES = 3


def extract_days(title):
    match = re.search(r"(\d+)[天日]", title)
    return int(match.group(1)) if match else 0


def extract_price(text):
    prices = []
    for match in re.finditer(r"[¥￥]\s*(\d+(?:,\d+)*)", text):
        prices.append(float(match.group(1).replace(",", "")))
    return max(prices) if prices else 0


def resolve_url(url):
    if not url:
        return ""
    if url.startswith("http"):
        return url
    if url.startswith("/"):
        return BASE_URL + url
    return f"{BASE_URL}/{url.lstrip('/')}"


def extract_image(li):
    pic_div = li.find("div", class_="pic")
    if not pic_div:
        return ""

    img = pic_div.find("img")
    if not img:
        return ""

    img_src = (
        img.get("data-original")
        or img.get("data-src")
        or img.get("src")
        or ""
    ).strip()
    if not img_src or "loading.gif" in img_src:
        return ""
    return resolve_url(img_src)


def fetch():
    print("[品途] 全量抓取中...")
    session = requests.Session()
    session.headers.update(HEADERS)

    all_items = []
    seen = set()

    for cat in CATS:
        for page in range(1, MAX_PAGES + 1):
            try:
                params = {
                    "cid": "guangzhou",
                    "tid": cat["tid"],
                    "key": "",
                    "page": str(page),
                }
                resp = None
                for attempt in range(1, RETRY_TIMES + 1):
                    try:
                        resp = session.get(f"{BASE_URL}/line/list.aspx", params=params, timeout=15)
                        break
                    except requests.RequestException as exc:
                        if attempt == RETRY_TIMES:
                            raise exc
                        time.sleep(1.2 * attempt)
                        session = requests.Session()
                        session.headers.update(HEADERS)
                soup = BeautifulSoup(resp.text, "lxml")
                lis = soup.find_all("li")
                page_items = 0

                for li in lis:
                    txt = li.get_text(" ", strip=True)
                    if "行程天数" not in txt:
                        continue

                    name_elem = li.find("a", class_="name")
                    if not name_elem:
                        continue

                    title = name_elem.get_text(strip=True)
                    price_elem = li.find("div", class_="price")
                    if price_elem:
                        price_text = price_elem.get_text(strip=True)
                        price_match = re.search(r"[¥￥]\s*(\d+(?:,\d+)*)", price_text)
                        price = float(price_match.group(1).replace(",", "")) if price_match else 0
                    else:
                        price = extract_price(txt)

                    days_match = re.search(r"行程天数[:：]\s*(\d+)[天日]", txt)
                    days = int(days_match.group(1)) if days_match else 0
                    detail_url = resolve_url(name_elem.get("href", ""))
                    img_url = extract_image(li)

                    if not (title and len(title) > 5 and days > 0 and price > 0):
                        continue
                    if days >= 3 and price < 100:
                        continue

                    key = f"{title}|{price}"
                    if key in seen:
                        continue
                    seen.add(key)

                    item = {
                        "source": "品途",
                        "title": title,
                        "price": price,
                        "url": detail_url,
                        "days": days,
                    }
                    if img_url:
                        item["img"] = img_url
                    all_items.append(item)
                    page_items += 1

                print(f"  [品途-{cat['name']}] 第{page}页: {page_items}条")
                if page_items == 0:
                    break
                time.sleep(0.3)
            except Exception as exc:
                print(f"  品途 {cat['name']} 第{page}页 error: {exc}")
                break

    print(f"[品途] 抓取完成: {len(all_items)} 条")
    return all_items


def main():
    items = fetch()
    data_dir = os.path.join(os.path.dirname(__file__), "..", "src", "data")
    data_dir = os.path.abspath(data_dir)
    os.makedirs(data_dir, exist_ok=True)
    with open(os.path.join(data_dir, "raw_pintu_full.json"), "w", encoding="utf-8") as f:
        json.dump(items, f, ensure_ascii=False, indent=2)
    print(f"[保存] -> {os.path.join(data_dir, 'raw_pintu_full.json')}")


if __name__ == "__main__":
    main()
