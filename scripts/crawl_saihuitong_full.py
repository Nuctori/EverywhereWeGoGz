#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
赛会通全量爬虫 - 广州去旅行 + 暴走村
扩展mid分类
"""

import re
import json
import os
import time

def create_webdriver():
    from selenium import webdriver

    for options_cls, builder in (
        (webdriver.EdgeOptions, webdriver.Edge),
        (webdriver.ChromeOptions, webdriver.Chrome),
    ):
        options = options_cls()
        options.add_argument('--headless=new')
        options.add_argument('--no-sandbox')
        options.add_argument('--disable-dev-shm-usage')
        options.add_argument('--disable-gpu')
        options.add_argument('--window-size=1440,2400')
        try:
            return builder(options=options)
        except Exception:
            continue
    raise RuntimeError("Unable to create webdriver")


def extract_days(title):
    m = re.search(r"(\d+)[天日]", title)
    if m:
        return int(m.group(1))
    return 0


class GzqlxSpider:
    BASE_URL = "http://gzqlx.360jlb.cn"

    def fetch(self):
        print("[广州去旅行] 全量抓取中...")
        try:
            driver = create_webdriver()
            all_items = []
            seen = set()

            # 扩展mid列表
            mids = [48629, 48631, 73687, 48632, 73685, 48630, 48633, 48634, 73686, 73688]
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
        print("[暴走村] 全量抓取中...")
        try:
            driver = create_webdriver()
            all_items = []
            seen = set()

            mids = ['73252', '79969', '73242', '78982', '78741', '73249', '81417', '78430', '78431', '78742', '73513', '73250', '81413', '81418', '81414', '73251', '78901', '73244']

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
                        
                        if title and len(title) > 5 and not any(k in title for k in ['筛选', '目的地', '全部', '确定', '免费']):
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
    data_dir = os.path.join(os.path.dirname(__file__), "..", "src", "data")
    data_dir = os.path.abspath(data_dir)
    output_path = os.path.join(data_dir, "raw_saihuitong_full.json")
    if len(all_raw) == 0 and os.path.exists(output_path):
        print(f"[saihuitong] 0 items -- keeping existing {output_path}")
        return
    os.makedirs(data_dir, exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(all_raw, f, ensure_ascii=False, indent=2)
    print(f"[保存] -> {os.path.join(data_dir, 'raw_saihuitong_full.json')}")


if __name__ == "__main__":
    main()
