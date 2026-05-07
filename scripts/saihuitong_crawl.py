#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
赛会通平台爬虫 - 广州去旅行 + 暴走村
"""

import re
import json
import time
import os
from datetime import datetime


def extract_days(title):
    m = re.search(r"(\d+)[天日]", title)
    if m:
        return int(m.group(1))
    return 0


class GzqlxSpider:
    BASE_URL = "http://gzqlx.360jlb.cn"

    def fetch(self):
        print("[广州去旅行] 抓取中...")
        try:
            from selenium import webdriver
            from selenium.webdriver.edge.options import Options

            options = Options()
            options.add_argument('--headless')
            options.add_argument('--no-sandbox')
            options.add_argument('--disable-dev-shm-usage')

            driver = webdriver.Edge(options=options)
            all_items = []
            seen = set()

            mids = [48629, 48631, 73687, 48632, 73685, 48630]
            for mid in mids:
                try:
                    driver.get(f'{self.BASE_URL}/m/events?mid={mid}')
                    time.sleep(2)
                    page_source = driver.page_source
                    
                    event_pattern = r'<a[^>]+href="(/m/event\?id=\d+)"[^>]*>(.*?)</a>'
                    events = re.findall(event_pattern, page_source, re.DOTALL)
                    
                    for href, content in events:
                        text = re.sub(r'<[^>]+>', ' ', content).strip()
                        text = re.sub(r'\s+', ' ', text)
                        
                        price_m = re.search(r'¥(\d+)', text)
                        if not price_m:
                            continue
                        price = float(price_m.group(1))
                        
                        title = text.replace(price_m.group(0), "").strip()
                        
                        if title and len(title) > 5 and not any(k in title for k in ['筛选', '目的地', '全部', '确定']):
                            detail_url = self.BASE_URL + href
                            
                            img_url = ""
                            img_match = re.search(r'<img[^>]+src="([^"]+)"[^>]*>', content)
                            if img_match:
                                img_src = img_match.group(1)
                                if img_src.startswith('http'):
                                    img_url = img_src
                                elif img_src.startswith('/'):
                                    img_url = self.BASE_URL + img_src
                            
                            key = title + "|" + str(price)
                            if key in seen:
                                continue
                            seen.add(key)
                            
                            item = {
                                "source": "广州去旅行",
                                "title": title,
                                "price": price,
                                "url": detail_url,
                                "days": extract_days(title),
                            }
                            if img_url:
                                item["img"] = img_url
                            all_items.append(item)
                            
                except Exception as e:
                    print(f"  mid={mid} error: {e}")

            driver.quit()
            print(f"[广州去旅行] 抓取完成: {len(all_items)} 条")
            return all_items
        except Exception as e:
            print(f"  Selenium error: {e}")
            return []


class BaozoucunSpider:
    BASE_URL = "http://gftblm.360jlb.cn"

    def fetch(self):
        print("[暴走村] 抓取中...")
        try:
            from selenium import webdriver
            from selenium.webdriver.edge.options import Options

            options = Options()
            options.add_argument('--headless')
            options.add_argument('--no-sandbox')
            options.add_argument('--disable-dev-shm-usage')

            driver = webdriver.Edge(options=options)
            all_items = []
            seen = set()

            mids = [1, 2, 3, 4, 5]
            for mid in mids:
                try:
                    driver.get(f'{self.BASE_URL}/m/events?mid={mid}')
                    time.sleep(2)
                    page_source = driver.page_source
                    
                    event_pattern = r'<a[^>]+href="(/m/event\?id=\d+)"[^>]*>(.*?)</a>'
                    events = re.findall(event_pattern, page_source, re.DOTALL)
                    
                    for href, content in events:
                        text = re.sub(r'<[^>]+>', ' ', content).strip()
                        text = re.sub(r'\s+', ' ', text)
                        
                        price_m = re.search(r'¥(\d+)', text)
                        if not price_m:
                            continue
                        price = float(price_m.group(1))
                        
                        title = text.replace(price_m.group(0), "").strip()
                        
                        if title and len(title) > 5 and not any(k in title for k in ['筛选', '目的地', '全部', '确定']):
                            detail_url = self.BASE_URL + href
                            
                            img_url = ""
                            img_match = re.search(r'<img[^>]+src="([^"]+)"[^>]*>', content)
                            if img_match:
                                img_src = img_match.group(1)
                                if img_src.startswith('http'):
                                    img_url = img_src
                                elif img_src.startswith('/'):
                                    img_url = self.BASE_URL + img_src
                            
                            key = title + "|" + str(price)
                            if key in seen:
                                continue
                            seen.add(key)
                            
                            item = {
                                "source": "暴走村",
                                "title": title,
                                "price": price,
                                "url": detail_url,
                                "days": extract_days(title),
                            }
                            if img_url:
                                item["img"] = img_url
                            all_items.append(item)
                            
                except Exception as e:
                    print(f"  mid={mid} error: {e}")

            driver.quit()
            print(f"[暴走村] 抓取完成: {len(all_items)} 条")
            return all_items
        except Exception as e:
            print(f"  Selenium error: {e}")
            return []


def main():
    print("=" * 60)
    print("赛会通平台爬虫")
    print("=" * 60)
    
    all_raw = []
    spiders = [GzqlxSpider(), BaozoucunSpider()]
    
    for spider in spiders:
        try:
            items = spider.fetch()
            print(f"  -> {len(items)} 条")
            all_raw.extend(items)
        except Exception as e:
            print(f"  -> 错误: {e}")
        time.sleep(1)
    
    print(f"\n[汇总] 原始数据: {len(all_raw)} 条")
    
    # 保存
    data_dir = os.path.join(os.path.dirname(__file__), "..", "src", "data")
    data_dir = os.path.abspath(data_dir)
    os.makedirs(data_dir, exist_ok=True)
    
    with open(os.path.join(data_dir, "raw_saihuitong.json"), "w", encoding="utf-8") as f:
        json.dump(all_raw, f, ensure_ascii=False, indent=2)
    
    print(f"[保存] -> {os.path.join(data_dir, 'raw_saihuitong.json')}")
    print("=" * 60)


if __name__ == "__main__":
    main()
