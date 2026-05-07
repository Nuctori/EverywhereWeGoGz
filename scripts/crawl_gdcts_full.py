#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
广东中旅全量爬虫 - 所有子分类×所有页
"""

import requests
import re
import json
import os

HEADERS = {
    "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1",
}

def extract_days(title):
    m = re.search(r"(\d+)[天日]", title)
    if m:
        return int(m.group(1))
    return 0


def fetch():
    print("[广东中旅] 全量抓取中...")
    BASE_URL = "http://m.gdcts.com"
    CAT_PATHS = [
        "/product/category/index/regionalId_1/13/key/0",
        "/product/category/index/regionalId_1/14/key/2",
        "/product/category/index/regionalId_1/15/key/1",
        "/product/category/index/regionalId_1/2/key/8",
        "/product/category/index/regionalId_1/4/key/3",
        "/product/category/index/regionalId_1/616/key/5",
        "/product/category/index/regionalId_1/7/key/4",
        "/product/category/index/regionalId_1/8/key/6",
        "/product/category/index/regionalId_1/9/key/7",
    ]
    MAX_PAGES = 5
    
    all_items = []
    seen = set()
    total_regionalids = 0
    
    for cat_path in CAT_PATHS:
        try:
            cat_url = BASE_URL + cat_path
            resp = requests.get(cat_url, headers=HEADERS, timeout=15)
            if not resp:
                continue
            
            regionalids = re.findall(r'regionalid/(\d+)', resp.text)
            regionalids = sorted(set(regionalids), key=int)
            total_regionalids += len(regionalids)
            print(f"  [广东中旅] {cat_path}: {len(regionalids)} 个子分类")
            
            for rid in regionalids:
                for page in range(1, MAX_PAGES + 1):
                    try:
                        url = f"{BASE_URL}/product/line/index/id/69/regionalid/{rid}/page/{page}"
                        resp = requests.get(url, headers=HEADERS, timeout=15)
                        if not resp:
                            break
                        
                        html = resp.text
                        matches = []
                        for m in re.findall(r'<a href="(/product/line/detail/[^"]+)">(.*?)</a>', html, re.DOTALL):
                            href, content = m
                            title_m = re.search(r'<div class="name">([^<]+)</div>', content)
                            price_m = re.search(r'[¥￥]\s*(\d+)', content)
                            img_m = re.search(r'<img[^>]+src="([^"]+)"', content)
                            if title_m and price_m:
                                matches.append((href, img_m.group(1) if img_m else '', title_m.group(1), price_m.group(1)))
                        
                        page_items = 0
                        for href, img_src, title, price_str in matches:
                            try:
                                price = float(price_str)
                            except:
                                continue
                            if price <= 0 or not title:
                                continue
                            
                            title = title.strip()
                            key = title + "|" + str(price)
                            if key in seen:
                                continue
                            seen.add(key)
                            
                            detail_url = BASE_URL + href
                            img_url = ""
                            if img_src:
                                if img_src.startswith("http"):
                                    img_url = img_src
                                else:
                                    img_url = BASE_URL + img_src
                            
                            item = {
                                "source": "广东中旅",
                                "title": title,
                                "price": price,
                                "url": detail_url,
                                "days": extract_days(title),
                            }
                            if img_url:
                                item["img"] = img_url
                            all_items.append(item)
                            page_items += 1
                        
                        if page_items == 0:
                            break
                    except:
                        break
        except Exception as e:
            print(f"  [广东中旅] {cat_path} error: {e}")
    
    print(f"[广东中旅] 总子分类: {total_regionalids}, 抓取完成: {len(all_items)} 条")
    return all_items


def main():
    items = fetch()
    data_dir = os.path.join(os.path.dirname(__file__), "..", "src", "data")
    data_dir = os.path.abspath(data_dir)
    os.makedirs(data_dir, exist_ok=True)
    with open(os.path.join(data_dir, "raw_gdcts_full.json"), "w", encoding="utf-8") as f:
        json.dump(items, f, ensure_ascii=False, indent=2)
    print(f"[保存] -> {os.path.join(data_dir, 'raw_gdcts_full.json')}")


if __name__ == "__main__":
    main()
