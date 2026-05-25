#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
全量爬虫最终版 - 平衡数据量和速度
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
    "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}
TIMEOUT = 15

def safe_request(url, headers=None, timeout=None, params=None):
    h = headers or HEADERS
    t = timeout or TIMEOUT
    try:
        resp = requests.get(url, headers=h, timeout=t, params=params)
        resp.raise_for_status()
        encoding = (resp.encoding or "").lower()
        apparent = (resp.apparent_encoding or "").lower()
        if not encoding or encoding == "iso-8859-1":
            resp.encoding = apparent or "utf-8"
        elif apparent and apparent != encoding and apparent in {"utf-8", "gbk", "gb18030"}:
            resp.encoding = apparent
        return resp
    except Exception as e:
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
    NAVIDS = [6, 7, 8, 9, 10, 11, 12, 14, 53, 56, 57, 58, 61, 64, 66, 67, 68, 69, 70, 71, 72, 73, 75, 76, 85, 86, 88, 89, 90, 93, 95, 96, 97, 98, 100, 101, 102, 103, 104, 105, 106, 108, 174, 175, 176, 177, 178, 200, 201, 202, 203, 204, 205, 208, 209, 210, 212, 213, 214, 246, 247, 248, 250, 251, 252, 253, 256, 258, 260, 263]

    def fetch(self):
        print("[康辉] 抓取中...")
        items = []
        seen = set()
        for navid in self.NAVIDS:
            try:
                resp = safe_request(f"{self.BASE_URL}/PC/Product/ColumnList?navid={navid}")
                if not resp:
                    continue
                soup = BeautifulSoup(resp.text, "lxml")
                for div in soup.find_all("div", class_="product j_item"):
                    try:
                        title_a = div.find("div", class_="title")
                        if not title_a:
                            continue
                        title_a = title_a.find("a")
                        if not title_a:
                            continue
                        title = title_a.get_text(strip=True)
                        href = title_a.get("href", "")
                        if "prodcode=" not in href:
                            continue
                        price_span = div.find("span", class_="value")
                        price = 0
                        if price_span:
                            try:
                                price = float(price_span.get_text(strip=True).replace(",", ""))
                            except:
                                pass
                        if not title or price <= 0:
                            continue
                        key = title + "|" + str(price)
                        if key in seen:
                            continue
                        seen.add(key)
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
                            "url": self.BASE_URL + href if not href.startswith("http") else href,
                            "days": extract_days(title),
                        }
                        if img_url:
                            item["img"] = img_url
                        items.append(item)
                    except:
                        pass
                time.sleep(0.1)
            except:
                pass
        print(f"[康辉] 抓取完成: {len(items)} 条")
        return items


# ==================== 品途 ====================
class PintuSpider:
    BASE_URL = "http://gz.ptotour.com"
    CATS = [
        {"name": "省内周边", "tid": "around"},
        {"name": "国内游", "tid": "domestic"},
        {"name": "出境游", "tid": "abroad"},
    ]
    MAX_PAGES = 10  # 10页 × 50条 = 500条/分类

    def fetch(self):
        print("[品途] 抓取中...")
        all_items = []
        seen = set()
        for cat in self.CATS:
            for page in range(1, self.MAX_PAGES + 1):
                try:
                    params = {"cid": "guangzhou", "tid": cat["tid"], "key": "", "page": str(page)}
                    resp = safe_request(f"{self.BASE_URL}/line/list.aspx", params=params)
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
                        detail_url = f"{self.BASE_URL}/line/list.aspx"
                        if name_elem and name_elem.get("href"):
                            detail_url = name_elem["href"]
                            if not detail_url.startswith("http"):
                                detail_url = self.BASE_URL + detail_url
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
                    time.sleep(0.1)
                except Exception as e:
                    print(f"  品途 {cat['name']} 第{page}页 error: {e}")
        print(f"[品途] 抓取完成: {len(all_items)} 条")
        return all_items


# ==================== 广东中旅 ====================
class GdctsSpider:
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
    MAX_PAGES = 3  # 每个子分类3页
    MAX_REGIONALIDS = 15  # 每分类最多15个子分类

    def fetch(self):
        print("[广东中旅] 抓取中...")
        all_items = []
        seen = set()
        for cat_path in self.CAT_PATHS:
            try:
                cat_url = self.BASE_URL + cat_path
                resp = safe_request(cat_url)
                if not resp:
                    continue
                regionalids = re.findall(r'regionalid/(\d+)', resp.text)
                regionalids = sorted(set(regionalids), key=int)
                print(f"  [广东中旅] {cat_path}: 发现 {len(regionalids)} 个子分类, 抓前{self.MAX_REGIONALIDS}个")
                for rid in regionalids[:self.MAX_REGIONALIDS]:
                    for page in range(1, self.MAX_PAGES + 1):
                        try:
                            url = f"{self.BASE_URL}/product/line/index/id/69/regionalid/{rid}/page/{page}"
                            resp = safe_request(url)
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
                                detail_url = self.BASE_URL + href
                                img_url = ""
                                if img_src:
                                    if img_src.startswith("http"):
                                        img_url = img_src
                                    else:
                                        img_url = self.BASE_URL + img_src
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
                            time.sleep(0.05)
                        except:
                            break
                    time.sleep(0.1)
            except Exception as e:
                print(f"  [广东中旅] {cat_path} error: {e}")
        print(f"[广东中旅] 抓取完成: {len(all_items)} 条")
        return all_items


# ==================== 广之旅 ====================
class GzlSpider:
    BASE_URL = "http://nn.gzl.cn"
    PATHS = ["/abroad/abroad.html", "/around/guangdong.html", "/domestic/domestic.html", "/free/free.html"]

    def fetch(self):
        print("[GZL] fetching via API...")
        return fetch_gzl_api()
        print("[广之旅] 抓取中...")
        items = []
        seen = set()
        for path in self.PATHS:
            try:
                url = self.BASE_URL + path
                resp = safe_request(url)
                if not resp:
                    continue
                html = resp.text
                pattern = r'<a[^>]+href="([^"]*(?:abroad|domestic|around|free|freetour)/[^"/]+\.html)"[^>]*>(.*?)</a>'
                matches = re.findall(pattern, html, re.DOTALL)
                for href, content in matches:
                    text = re.sub(r'<[^>]+>', ' ', content).strip()
                    text = re.sub(r'\s+', ' ', text)
                    title_match = re.search(r'【([^】]+)】', text)
                    if not title_match:
                        continue
                    title = text[text.find('【'):text.find('】')+1]
                    price = extract_price(text)
                    if price <= 0:
                        continue
                    key = title + "|" + str(price)
                    if key in seen:
                        continue
                    seen.add(key)
                    if href.startswith("http"):
                        detail_url = href
                    else:
                        detail_url = "https://www.gzl.com.cn" + href if href.startswith("/") else "https://www.gzl.com.cn/" + href
                    img_url = ""
                    img_match = re.search(r'<img[^>]+src="([^"]+)"[^>]*>', content)
                    if img_match:
                        img_src = img_match.group(1)
                        if img_src.startswith("http"):
                            img_url = img_src
                        elif img_src.startswith("/"):
                            img_url = "https://www.gzl.com.cn" + img_src
                    item = {
                        "source": "广之旅",
                        "title": title,
                        "price": price,
                        "url": detail_url,
                        "days": extract_days(title),
                    }
                    if img_url:
                        item["img"] = img_url
                    items.append(item)
                time.sleep(0.2)
            except Exception as e:
                print(f"  广之旅 {path} error: {e}")
        print(f"[广之旅] 抓取完成: {len(items)} 条")
        return items


def main():
    print("=" * 60)
    print("全量HTTP站点爬虫 - 最终版")
    print("=" * 60)
    all_raw = []
    spiders = [KanghuiSpider(), PintuSpider(), GdctsSpider()]
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
    seen = set()
    deduped = []
    for it in all_raw:
        key = it.get("source", "") + "|" + it.get("title", "") + "|" + str(it.get("price", ""))
        if key not in seen:
            seen.add(key)
            deduped.append(it)
    print(f"[去重] 后: {len(deduped)} 条")
    deduped = [r for r in deduped if len(r.get("title", "")) > 5]
    print(f"[过滤] 有效数据: {len(deduped)} 条")
    data_dir = os.path.join(os.path.dirname(__file__), "..", "src", "data")
    data_dir = os.path.abspath(data_dir)
    os.makedirs(data_dir, exist_ok=True)
    with open(os.path.join(data_dir, "raw_http_full.json"), "w", encoding="utf-8") as f:
        json.dump(deduped, f, ensure_ascii=False, indent=2)
    print(f"[保存] -> {os.path.join(data_dir, 'raw_http_full.json')}")
    print("=" * 60)


if __name__ == "__main__":
    main()
