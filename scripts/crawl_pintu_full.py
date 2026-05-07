#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
品途全量爬虫 - 使用session分页
"""

import requests
import re
import json
import os
from bs4 import BeautifulSoup

HEADERS = {
    "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1",
}

def extract_days(title):
    m = re.search(r"(\d+)[天日]", title)
    if m:
        return int(m.group(1))
    return 0

def extract_price(text):
    prices = []
    for m in re.finditer(r"[¥￥]\s*(\d+(?:,\d+)*)", text):
        prices.append(float(m.group(1).replace(",", "")))
    if prices:
        return max(prices)
    return 0


def fetch():
    print("[品途] 全量抓取中...")
    session = requests.Session()
    session.headers.update(HEADERS)
    
    BASE_URL = "http://gz.ptotour.com"
    CATS = [
        {"name": "省内周边", "tid": "around"},
        {"name": "国内游", "tid": "domestic"},
        {"name": "出境游", "tid": "abroad"},
    ]
    MAX_PAGES = 20  # 最多20页
    
    all_items = []
    seen = set()
    
    for cat in CATS:
        for page in range(1, MAX_PAGES + 1):
            try:
                params = {"cid": "guangzhou", "tid": cat["tid"], "key": "", "page": str(page)}
                resp = session.get(f"{BASE_URL}/line/list.aspx", params=params, timeout=15)
                soup = BeautifulSoup(resp.text, "lxml")
                lis = soup.find_all("li")
                page_items = 0
                
                for li in lis:
                    txt = li.get_text(" ", strip=True)
                    if "行程天数" not in txt:
                        continue
                    
                    name_elem = li.find("a", class_="name")
                    if name_elem:
                        title = name_elem.get_text(strip=True)
                    else:
                        continue
                    
                    price_elem = li.find("div", class_="price")
                    price = 0
                    if price_elem:
                        price_text = price_elem.get_text(strip=True)
                        price_match = re.search(r"[¥￥]\s*(\d+(?:,\d+)*)", price_text)
                        price = float(price_match.group(1).replace(",", "")) if price_match else 0
                    else:
                        price = extract_price(txt)
                    
                    days_m = re.search(r"行程天数[:：]\s*(\d+)[天日]", txt)
                    days = int(days_m.group(1)) if days_m else 0
                    
                    detail_url = f"{BASE_URL}/line/list.aspx"
                    if name_elem and name_elem.get("href"):
                        detail_url = name_elem["href"]
                        if not detail_url.startswith("http"):
                            detail_url = BASE_URL + detail_url
                    
                    if title and len(title) > 5 and days > 0 and price > 0:
                        if days >= 3 and price < 100:
                            continue
                        
                        key = title + "|" + str(price)
                        if key in seen:
                            continue
                        seen.add(key)
                        
                        all_items.append({
                            "source": "品途",
                            "title": title,
                            "price": price,
                            "url": detail_url,
                            "days": days,
                        })
                        page_items += 1
                
                print(f"  [品途-{cat['name']}] 第{page}页: {page_items}条")
                if page_items == 0:
                    break
                
            except Exception as e:
                print(f"  品途 {cat['name']} 第{page}页 error: {e}")
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
