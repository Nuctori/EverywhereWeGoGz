#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
快速爬虫 - 只抓取HTTP站点（康辉、品途、广东中旅、广之旅）
修复康辉div class=product j_item解析问题
"""

import requests
import re
import json
import time
import os
from datetime import datetime
from bs4 import BeautifulSoup
try:
    from crawl_gzl_api import fetch as fetch_gzl_api
except ImportError:
    from scripts.crawl_gzl_api import fetch as fetch_gzl_api

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}
TIMEOUT = 15

def safe_request(url, timeout=None):
    t = timeout or TIMEOUT
    try:
        resp = requests.get(url, headers=HEADERS, timeout=t)
        resp.raise_for_status()
        encoding = (resp.encoding or "").lower()
        apparent = (resp.apparent_encoding or "").lower()
        if not encoding or encoding == "iso-8859-1":
            resp.encoding = apparent or "utf-8"
        elif apparent and apparent != encoding and apparent in {"utf-8", "gbk", "gb18030"}:
            resp.encoding = apparent
        return resp
    except Exception as e:
        print(f"  [失败] {url} -> {e}")
        return None

def extract_price(text):
    prices = []
    for m in re.finditer(r"[¥￥]\s*(\d+(?:,\d+)*)", text):
        prices.append(float(m.group(1).replace(",", "")))
    if prices:
        return max(prices)
    m = re.search(r"(?:价格|费用|售价|报价)[^\d]*?(\d+(?:,\d+)*)", text)
    if m:
        return float(m.group(1).replace(",", ""))
    all_nums = re.findall(r"\b(\d{3,}(?:,\d+)*)\b", text)
    if all_nums:
        return max(float(n.replace(",", "")) for n in all_nums)
    return 0

def extract_days(title):
    m = re.search(r"(\d+)[天日]", title)
    if m:
        return int(m.group(1))
    return 0

# ==================== 康辉 ====================
class KanghuiSpider:
    BASE_URL = "http://gz.cctpage.com"
    # 只取前20个navid，加快测试
    NAVIDS = [6, 7, 8, 9, 10, 11, 12, 14, 53, 56, 57, 58, 61, 64, 66, 67, 68, 69, 70, 71]

    def fetch(self):
        print("[康辉] 抓取中...")
        items = []
        seen = set()

        for navid in self.NAVIDS:
            try:
                url = f"{self.BASE_URL}/PC/Product/ColumnList?navid={navid}"
                resp = safe_request(url)
                if not resp:
                    continue

                soup = BeautifulSoup(resp.text, "lxml")
                
                # 使用div class=product j_item
                divs = soup.find_all("div", class_="product j_item")
                for div in divs:
                    try:
                        # 标题
                        title_a = div.find("div", class_="title")
                        if not title_a:
                            continue
                        title_a = title_a.find("a")
                        if not title_a:
                            continue
                        title = title_a.get_text(strip=True)
                        
                        # 链接
                        href = title_a.get("href", "")
                        if not href or "prodcode=" not in href:
                            continue
                        if not href.startswith("http"):
                            href = self.BASE_URL + href
                        
                        # 价格 - 在span class=value中
                        price_span = div.find("span", class_="value")
                        price = 0
                        if price_span:
                            price_text = price_span.get_text(strip=True)
                            try:
                                price = float(price_text.replace(",", ""))
                            except:
                                pass
                        
                        if not title or price <= 0:
                            continue
                        
                        # 去重
                        key = title + str(price)
                        if key in seen:
                            continue
                        seen.add(key)
                        
                        # 图片
                        img_url = ""
                        img = div.find("img", class_="lazy_img")
                        if img:
                            img_src = img.get("data-original") or img.get("src")
                            if img_src and img_src.startswith("http"):
                                img_url = img_src
                        
                        item = {
                            "source": "康辉",
                            "title": title,
                            "price": price,
                            "url": href,
                            "days": extract_days(title),
                        }
                        if img_url:
                            item["img"] = img_url
                        items.append(item)
                    except Exception as e:
                        pass
                
                time.sleep(0.3)
            except Exception as e:
                print(f"  navid={navid} error: {e}")

        print(f"[康辉] 抓取完成: {len(items)} 条")
        return items


# ==================== 品途 ====================
class PintuSpider:
    BASE_URL = "http://gz.ptotour.com"
    CATEGORIES = [
        {"path": "/domestic/", "name": "国内游"},
        {"path": "/around/", "name": "周边游"},
        {"path": "/outbound/", "name": "出境游"},
    ]

    def fetch(self):
        print("[品途] 抓取中...")
        all_items = []
        seen = set()

        for cat in self.CATEGORIES:
            for page in range(1, 11):
                try:
                    url = f"{self.BASE_URL}{cat['path']}index_{page}.html"
                    resp = safe_request(url)
                    if not resp:
                        break

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

                        detail_url = url
                        if name_elem and name_elem.get("href"):
                            detail_url = name_elem["href"]
                            if not detail_url.startswith("http"):
                                detail_url = self.BASE_URL + detail_url

                        img_url = ""
                        pic_div = li.find("div", class_="pic")
                        if pic_div:
                            img = pic_div.find("img")
                            if img:
                                img_src = img.get("data-original") or img.get("src")
                                if img_src:
                                    if img_src.startswith("http"):
                                        img_url = img_src
                                    elif img_src.startswith("/"):
                                        img_url = self.BASE_URL + img_src
                                    else:
                                        img_url = self.BASE_URL + "/" + img_src

                        if title and len(title) > 5 and days > 0 and price > 0:
                            if days >= 3 and price < 100:
                                continue

                            key = title + str(price)
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
                except Exception as e:
                    print(f"  品途 {cat['name']} 第{page}页 error: {e}")

        print(f"[品途] 抓取完成: {len(all_items)} 条")
        return all_items


# ==================== 广东中旅 ====================
class GdctsSpider:
    BASE_URL = "http://www.gdcts.com"
    
    def fetch(self):
        print("[广东中旅] 抓取中...")
        items = []
        seen = set()
        
        # 首页热门推荐
        try:
            resp = safe_request(f"{self.BASE_URL}/")
            if resp:
                soup = BeautifulSoup(resp.text, "lxml")
                # 查找产品卡片
                cards = soup.find_all("div", class_=re.compile("product|item|tour"))
                for card in cards:
                    try:
                        title_a = card.find("a")
                        if not title_a:
                            continue
                        title = title_a.get_text(strip=True)
                        href = title_a.get("href", "")
                        
                        price = extract_price(card.get_text(" ", strip=True))
                        
                        if title and price > 0 and len(title) > 5:
                            key = title + str(price)
                            if key in seen:
                                continue
                            seen.add(key)
                            
                            if not href.startswith("http"):
                                href = self.BASE_URL + href
                            
                            items.append({
                                "source": "广东中旅",
                                "title": title,
                                "price": price,
                                "url": href,
                                "days": extract_days(title),
                            })
                    except:
                        pass
        except Exception as e:
            print(f"  广东中旅首页 error: {e}")
        
        print(f"[广东中旅] 抓取完成: {len(items)} 条")
        return items


# ==================== 广之旅 ====================
class GzlSpider:
    BASE_URL = "http://nn.gzl.cn"
    
    def fetch(self):
        print("[GZL] fetching via API...")
        return fetch_gzl_api()
        print("[广之旅] 抓取中...")
        items = []
        seen = set()
        
        try:
            resp = safe_request(f"{self.BASE_URL}/")
            if resp:
                soup = BeautifulSoup(resp.text, "lxml")
                cards = soup.find_all("div", class_=re.compile("product|item|tour"))
                for card in cards:
                    try:
                        title_a = card.find("a")
                        if not title_a:
                            continue
                        title = title_a.get_text(strip=True)
                        href = title_a.get("href", "")
                        
                        price = extract_price(card.get_text(" ", strip=True))
                        
                        if title and price > 0 and len(title) > 5:
                            key = title + str(price)
                            if key in seen:
                                continue
                            seen.add(key)
                            
                            if not href.startswith("http"):
                                href = self.BASE_URL + href
                            
                            items.append({
                                "source": "广之旅",
                                "title": title,
                                "price": price,
                                "url": href,
                                "days": extract_days(title),
                            })
                    except:
                        pass
        except Exception as e:
            print(f"  广之旅 error: {e}")
        
        print(f"[广之旅] 抓取完成: {len(items)} 条")
        return items


def main():
    print("=" * 60)
    print("快速爬虫 - HTTP站点")
    print("=" * 60)
    
    all_raw = []
    spiders = [
        KanghuiSpider(),
        PintuSpider(),
        GdctsSpider(),
    ]
    
    for spider in spiders:
        try:
            items = spider.fetch()
            print(f"  -> {len(items)} 条")
            all_raw.extend(items)
        except Exception as e:
            print(f"  -> 错误: {e}")
        time.sleep(0.5)
    
    print("\n" + "-" * 60)
    print(f"[汇总] 原始数据: {len(all_raw)} 条")
    
    # 去重
    seen = set()
    deduped = []
    for it in all_raw:
        key = it.get("source", "") + "|" + it.get("title", "") + "|" + str(it.get("price", ""))
        if key not in seen:
            seen.add(key)
            deduped.append(it)
    print(f"[汇总] 去重后: {len(deduped)} 条")
    
    # 过滤
    deduped = [r for r in deduped if r.get('price', 0) > 0 and len(r.get('title', '')) > 5]
    print(f"[过滤] 有效数据: {len(deduped)} 条")
    
    # 保存为raw文件
    data_dir = os.path.join(os.path.dirname(__file__), "..", "src", "data")
    data_dir = os.path.abspath(data_dir)
    os.makedirs(data_dir, exist_ok=True)
    
    # 保存合并的raw数据
    with open(os.path.join(data_dir, "raw_http.json"), "w", encoding="utf-8") as f:
        json.dump(deduped, f, ensure_ascii=False, indent=2)
    
    print(f"[保存] -> {os.path.join(data_dir, 'raw_http.json')}")
    print("=" * 60)


if __name__ == "__main__":
    main()
