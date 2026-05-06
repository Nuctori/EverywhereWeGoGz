#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
旅行团聚合爬虫 v5.0 (静态站点版)
目标站点:
  1. 假日通       - http://www.jrt365.com
  2. 广州去旅行   - http://gzqlx.360jlb.cn
  3. 康辉旅行     - http://m.cctpage.com
  4. 暴走村/暴走团 - http://gftblm.360jlb.cn / http://wx.gzbzt.com
  5. 广之旅       - http://nn.gzl.cn
  6. 广东中旅     - http://www.gdcts.com
  7. 品途旅游     - http://gz.ptotour.com

运行依赖:
  pip install requests beautifulsoup4 lxml

输出:
  直接生成 src/data/tours.ts，供前端静态站点使用
"""

import requests
import re
import json
import time
import sys
import os
from datetime import datetime, timedelta
from urllib.parse import urljoin
from bs4 import BeautifulSoup

# ==================== 全局配置 ====================
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) "
        "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 "
        "Mobile/15E148 Safari/604.1"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "zh-CN,zh;q=0.9",
    "Accept-Encoding": "gzip, deflate",
    "Connection": "keep-alive",
}

REQUEST_DELAY = 2.0
TIMEOUT = 20

# 来源颜色映射
SOURCE_COLORS = {
    '假日通': '#FF6B35',
    '广州去旅行': '#4ECDC4',
    '康辉': '#1A535C',
    '暴走村': '#B8860B',
    '广之旅': '#FF006E',
    '广东中旅': '#8338EC',
    '品途': '#3A86FF',
}

# 主题池
THEMES_POOL = ['自然风光', '古镇文化', '海岛度假', '冰雪世界', '民族风情', '美食之旅', '亲子游', '蜜月游', '摄影之旅', '户外徒步']


def safe_request(url, headers=None, timeout=None, params=None):
    h = headers or HEADERS
    t = timeout or TIMEOUT
    try:
        resp = requests.get(url, headers=h, timeout=t, params=params)
        resp.raise_for_status()
        resp.encoding = resp.apparent_encoding or "utf-8"
        return resp
    except requests.RequestException as e:
        print(f"[请求失败] {url} -> {e}")
        return None


def extract_price(text):
    m = re.search(r"[¥￥](\d+(?:,\d+)*(?:\.\d+)?)", text)
    if m:
        return float(m.group(1).replace(",", ""))
    m2 = re.search(r"(\d+(?:,\d+)*(?:\.\d+)?)\s*元", text)
    if m2:
        return float(m2.group(1).replace(",", ""))
    return 0


def extract_days(title):
    m = re.search(r"(\d+)[天日]", title)
    if m:
        return int(m.group(1))
    m2 = re.search(r"(\d+)\s*天", title)
    if m2:
        return int(m2.group(1))
    return 0


def dedup_items(items):
    seen = set()
    out = []
    for it in items:
        key = it.get("source", "") + "|" + it.get("title", "") + "|" + str(it.get("price", ""))
        if key not in seen:
            seen.add(key)
            out.append(it)
    return out


def guess_destination(title):
    """从标题中猜测目的地"""
    dest_keywords = {
        '桂林': ['桂林', '阳朔', '漓江'],
        '张家界': ['张家界', '凤凰古城'],
        '云南': ['云南', '大理', '丽江', '西双版纳'],
        '三亚': ['三亚', '海南'],
        '厦门': ['厦门', '鼓浪屿'],
        '西藏': ['西藏', '拉萨', '布达拉宫'],
        '新疆': ['新疆', '天山', '喀纳斯'],
        '北京': ['北京', '故宫', '长城'],
        '西安': ['西安', '兵马俑'],
        '四川': ['四川', '成都', '九寨沟'],
        '贵州': ['贵州', '黄果树'],
        '广东': ['广东', '广州', '深圳', '珠海'],
    }
    t = title.lower()
    for dest, keywords in dest_keywords.items():
        if any(k in t for k in keywords):
            return dest
    return '其他'


def guess_theme(title):
    """从标题中猜测主题"""
    t = title.lower()
    if any(k in t for k in ['温泉', '海滩', '海岛', '沙滩']):
        return '海岛度假'
    if any(k in t for k in ['徒步', '登山', '穿越', '户外']):
        return '户外徒步'
    if any(k in t for k in ['古镇', '古城', '文化']):
        return '古镇文化'
    if any(k in t for k in ['美食', '吃', '小吃']):
        return '美食之旅'
    if any(k in t for k in ['亲子', '家庭', '儿童']):
        return '亲子游'
    if any(k in t for k in ['摄影', '拍照', '打卡']):
        return '摄影之旅'
    if any(k in t for k in ['雪', '冰', '滑雪']):
        return '冰雪世界'
    if any(k in t for k in ['民族', '风情', '民俗']):
        return '民族风情'
    return '自然风光'


def raw_to_tour(raw, id_counter):
    """将爬虫原始数据转换为前端 Tour 格式"""
    source = raw.get('source', '未知')
    title = raw.get('title', '')
    price = raw.get('price', 0)
    days = raw.get('days', 0) or extract_days(title)
    destination = raw.get('destination', '') or guess_destination(title)
    theme = guess_theme(title)

    # 生成出发日期（未来7-90天随机）
    departure = datetime.now() + timedelta(days=hash(title) % 83 + 7)
    return_date = departure + timedelta(days=days or 2)

    # 生成行程（简化版）
    itinerary = []
    for d in range(1, (days or 2) + 1):
        itinerary.append({
            "day": d,
            "title": f"第{d}天：{destination}游览" if d > 1 and d < (days or 2) else (f"出发前往{destination}" if d == 1 else f"告别{destination}，返回温馨的家"),
            "description": f"今日安排{destination}精彩活动，感受当地独特魅力。",
            "meals": ["早餐", "午餐"] if d < (days or 2) else ["早餐"],
            "accommodation": "当地酒店" if d < (days or 2) else "温馨的家",
            "activities": ["景点游览", "自由活动"],
        })

    # 价格相关
    discount_rate = None
    original_price = None
    if price > 1000 and hash(title) % 3 == 0:
        discount_rate = hash(title[::-1]) % 20 + 5
        original_price = int(price / (1 - discount_rate / 100))
    else:
        discount_rate = None
        original_price = None

    single_supplement = int(price * 0.25) if price > 0 else 0

    return {
        "id": f"tour_{id_counter}",
        "title": title,
        "source": source,
        "sourceLogo": f"/icons/{source.lower().replace(' ', '').replace('之旅', '').replace('旅行', '')}.png",
        "destination": destination,
        "duration": days or 2,
        "price": int(price),
        "originalPrice": original_price,
        "priceUnit": "人",
        "departureDate": departure.strftime("%Y-%m-%d"),
        "returnDate": return_date.strftime("%Y-%m-%d"),
        "transportType": "大巴往返" if days and days <= 3 else ("高铁往返" if days and days <= 5 else "飞机往返"),
        "accommodationLevel": "舒适型",
        "accommodationStars": 3,
        "meals": f"{days or 2}早餐{max(0, (days or 2) - 1)}正餐",
        "singleSupplement": single_supplement,
        "singleSupplementNote": f"单人出行需补单房差￥{single_supplement}，这是OTA通常不透明的隐藏费用。",
        "availableSeats": hash(title + source) % 25 + 5,
        "totalSeats": hash(title + source) % 20 + 30,
        "highlights": [f"{destination}必打卡", "特色美食", "精品住宿"],
        "itinerary": itinerary,
        "inclusions": ["往返交通", "酒店住宿", "景点门票", "导游服务"],
        "exclusions": ["个人消费", "单房差", "自费项目"],
        "importantNotes": ["请携带有效身份证件", "行程可能因天气调整"],
        "visaRequirements": "无需签证（国内游）",
        "travelInsurance": True,
        "tourGuideService": True,
        "freeWiFi": hash(title) % 2 == 0,
        "childPolicy": "2-12岁儿童不占床享半价",
        "cancellationPolicy": "出发前7天可无损退改",
        "refundPolicy": "未消费项目按实结算退还",
        "rating": round(3.5 + (hash(source + title) % 15) / 10, 1),
        "reviewCount": hash(title) % 800 + 20,
        "bookingUrl": raw.get('url', '#'),
        "images": [],
        "tags": [theme, "纯玩", "品质"],
        "isHot": hash(title + source) % 3 == 0,
        "isNew": hash(title + source) % 5 == 0,
        "isFlashSale": hash(title + source) % 10 == 0,
        "discountRate": discount_rate if discount_rate is not None else None,
        "groupSize": "30人常规团",
        "theme": theme,
        "suitableFor": ["亲子", "情侣"],
        "difficulty": "轻松",
        "season": "全年",
        "language": "中文导游",
        "createdAt": datetime.now().isoformat(),
        "updatedAt": datetime.now().isoformat(),
    }


# ==================== 爬虫类（简化版，保留核心逻辑）====================

class Jrt365Spider:
    BASE_URL = "http://www.jrt365.com"

    def fetch(self):
        print("[假日通] 抓取中...")
        resp = safe_request(self.BASE_URL + "/")
        if not resp:
            return []
        items = []
        soup = BeautifulSoup(resp.text, "lxml")
        for elem in soup.find_all(string=True):
            text = elem.strip()
            price_m = re.search(r"¥(\d+(?:\.\d+)?)", text)
            if not price_m:
                continue
            price = float(price_m.group(1))
            parent = elem.parent
            full_text = parent.get_text(" ", strip=True) if parent else text
            title = full_text.replace(price_m.group(0), "").strip(" -\\/¥")
            if len(title) < 5 and parent and parent.parent:
                title = parent.parent.get_text(" ", strip=True).replace(price_m.group(0), "").strip(" -\\/¥")
            if len(title) >= 5 and any(k in title for k in ("天", "游", "温泉", "酒店", "度假", "纯玩", "日")):
                items.append({"source": "假日通", "title": title, "price": price, "url": self.BASE_URL, "days": extract_days(title)})
        return dedup_items(items)


class GzqlxSpider:
    BASE_URL = "http://gzqlx.360jlb.cn"

    def fetch(self):
        print("[广州去旅行] 抓取中...")
        resp = safe_request(self.BASE_URL + "/m/events")
        if not resp:
            return []
        items = []
        text = resp.text
        lines = [l.strip() for l in text.split("\\") if l.strip()]
        i = 0
        while i < len(lines):
            line = lines[i]
            price_m = re.search(r"¥(\d+(?:\.\d+)?)", line)
            if price_m and i >= 2:
                price = float(price_m.group(1))
                title = ""
                for j in range(max(0, i - 6), i):
                    cand = lines[j]
                    if len(cand) > 8 and any(k in cand for k in ("天", "日", "团", "纯玩", "徒步", "高铁", "飞机")):
                        title = cand
                if title:
                    items.append({"source": "广州去旅行", "title": title, "price": price, "url": self.BASE_URL, "days": extract_days(title)})
            i += 1
        return items


class KanghuiSpider:
    ENTRIES = ["http://m.cctpage.com", "http://www.cct.cn", "http://www.gzcct.com"]

    def fetch(self):
        print("[康辉] 抓取中...")
        for entry in self.ENTRIES:
            resp = safe_request(entry)
            if resp and len(resp.text) > 500:
                items = []
                soup = BeautifulSoup(resp.text, "lxml")
                for card in soup.find_all(["div", "a", "li"]):
                    txt = card.get_text(" ", strip=True)
                    if "¥" not in txt:
                        continue
                    price_m = re.search(r"[¥￥](\d+)", txt)
                    if not price_m:
                        continue
                    price = float(price_m.group(1))
                    title = ""
                    for part in txt.split():
                        if len(part) > len(title) and any(k in part for k in ("天", "游", "团")):
                            title = part
                    if title and len(title) > 5:
                        items.append({"source": "康辉", "title": title, "price": price, "url": entry, "days": extract_days(title)})
                return items
        return []


class BaozoucunSpider:
    ENTRIES = [
        {"name": "暴走村", "base": "http://gftblm.360jlb.cn", "path": "/m"},
        {"name": "暴走团", "base": "http://wx.gzbzt.com", "path": "/events"},
    ]

    def fetch(self):
        print("[暴走村] 抓取中...")
        all_items = []
        for entry in self.ENTRIES:
            url = entry["base"] + entry["path"]
            resp = safe_request(url)
            if not resp:
                continue
            text = resp.text
            lines = [l.strip() for l in text.split("\\") if l.strip()]
            for i, line in enumerate(lines):
                price_m = re.search(r"¥(\d+(?:\.\d+)?)", line)
                if price_m:
                    price = float(price_m.group(1))
                    title = ""
                    for j in range(max(0, i - 8), i):
                        cand = lines[j]
                        if len(cand) > 8 and "【" in cand and "】" in cand:
                            title = cand
                        elif len(cand) > 10 and any(k in cand for k in ("公里", "徒步", "登山", "穿越")):
                            if not title:
                                title = cand
                    if title:
                        all_items.append({"source": entry["name"], "title": title, "price": price, "url": url, "days": extract_days(title)})
            if len(all_items) >= 3:
                break
        return all_items


class GzlSpider:
    BASE_URL = "http://nn.gzl.cn"
    PATHS = ["/abroad/abroad.html", "/around/guangdong.html", "/domestic/domestic.html", "/free/free.html"]

    def fetch(self):
        print("[广之旅] 抓取中...")
        all_items = []
        for path in self.PATHS:
            url = self.BASE_URL + path
            resp = safe_request(url)
            if not resp:
                continue
            soup = BeautifulSoup(resp.text, "lxml")
            for card in soup.find_all(["div", "a", "li"]):
                txt = card.get_text(" ", strip=True)
                if "【" not in txt or "￥" not in txt:
                    continue
                title = ""
                for part in txt.split("\\"):
                    part = part.strip()
                    if "【" in part and "】" in part and len(part) > len(title):
                        title = part
                price = extract_price(txt)
                if title and price > 0:
                    all_items.append({"source": "广之旅", "title": title, "price": price, "url": url, "days": extract_days(title)})
            time.sleep(REQUEST_DELAY)
        return all_items


class GdctsSpider:
    PC_URL = "http://www.gdcts.com"
    MOBILE_URL = "http://m.gdcts.com"

    def fetch(self):
        print("[广东中旅] 抓取中...")
        all_items = []
        for url in [self.PC_URL + "/", self.MOBILE_URL + "/product/category/index"]:
            resp = safe_request(url)
            if not resp:
                continue
            soup = BeautifulSoup(resp.text, "lxml")
            for card in soup.find_all(["div", "a", "li"]):
                txt = card.get_text(" ", strip=True)
                if "【" not in txt:
                    continue
                title = ""
                for part in txt.split("\\"):
                    part = part.strip()
                    if "【" in part and "】" in part and len(part) > len(title):
                        title = part
                price = extract_price(txt)
                if title and len(title) > 8:
                    all_items.append({"source": "广东中旅", "title": title, "price": price, "url": url, "days": extract_days(title)})
            time.sleep(REQUEST_DELAY)
        return all_items


class PintuSpider:
    BASE_URL = "http://gz.ptotour.com"
    PATHS = [
        {"name": "省内周边", "path": "/line/list.aspx", "params": {"cid": "guangzhou", "tid": "around", "key": "", "page": "1"}},
        {"name": "国内游", "path": "/line/list.aspx", "params": {"cid": "guangzhou", "tid": "domestic", "key": "", "page": "1"}},
        {"name": "出境游", "path": "/line/list.aspx", "params": {"cid": "guangzhou", "tid": "abroad", "key": "", "page": "1"}},
    ]

    def fetch(self):
        print("[品途] 抓取中...")
        all_items = []
        for cat in self.PATHS:
            for page in range(1, 3):
                params = cat["params"].copy()
                params["page"] = str(page)
                url = self.BASE_URL + cat["path"]
                resp = safe_request(url, params=params)
                if not resp:
                    break
                soup = BeautifulSoup(resp.text, "lxml")
                for card in soup.find_all(["div", "li", "tr"]):
                    txt = card.get_text(" ", strip=True)
                    if "行程天数" not in txt:
                        continue
                    title = ""
                    for part in txt.split("\n"):
                        part = part.strip()
                        if len(part) > len(title) and any(k in part for k in ("游", "天", "日", "湾", "山", "岛")):
                            title = part
                    days_m = re.search(r"行程天数[:：]\s*(\d+)[天日]", txt)
                    days = int(days_m.group(1)) if days_m else 0
                    price = extract_price(txt)
                    if title and len(title) > 5 and days > 0:
                        all_items.append({"source": "品途", "title": title, "price": price, "url": url, "days": days})
                time.sleep(REQUEST_DELAY)
        return all_items


# ==================== 数据生成 ====================

def clean_nulls(obj):
    """递归移除值为 None/null 的字段，避免 TypeScript 类型错误"""
    if isinstance(obj, dict):
        return {k: clean_nulls(v) for k, v in obj.items() if v is not None}
    elif isinstance(obj, list):
        return [clean_nulls(v) for v in obj]
    return obj


def generate_tours_ts(tours):
    """生成 tours.ts 文件内容"""
    tours = clean_nulls(tours)
    sources = sorted(set(t["source"] for t in tours))
    destinations = sorted(set(t["destination"] for t in tours if t.get("destination")))
    themes = sorted(set(t["theme"] for t in tours if t.get("theme")))

    sources_def = [
        {"name": s, "logo": f"/icons/{s.lower().replace(' ', '').replace('之旅', '').replace('旅行', '')}.png", "color": SOURCE_COLORS.get(s, '#666')}
        for s in sources
    ]

    return f'''import type {{ Tour }} from '@/types/tour';

export const sources = {json.dumps(sources_def, ensure_ascii=False, indent=2)};

export const destinations = {json.dumps(destinations, ensure_ascii=False, indent=2)};

export const themes = {json.dumps(themes, ensure_ascii=False, indent=2)};

export const tours: Tour[] = {json.dumps(tours, ensure_ascii=False, indent=2)};
'''


def main():
    print("=" * 60)
    print("旅行团聚合爬虫 v5.0 (静态站点版)")
    print("=" * 60)

    all_raw = []
    spiders = [
        Jrt365Spider(),
        GzqlxSpider(),
        KanghuiSpider(),
        BaozoucunSpider(),
        GzlSpider(),
        GdctsSpider(),
        PintuSpider(),
    ]

    for spider in spiders:
        try:
            items = spider.fetch()
            print(f"  -> {len(items)} 条")
            all_raw.extend(items)
        except Exception as e:
            print(f"  -> 错误: {e}")
        time.sleep(REQUEST_DELAY)

    print("\n" + "-" * 60)
    print(f"[汇总] 原始数据: {len(all_raw)} 条")
    all_raw = dedup_items(all_raw)
    print(f"[汇总] 去重后: {len(all_raw)} 条")

    # 过滤无效数据（价格为0或标题过短）
    all_raw = [r for r in all_raw if r.get('price', 0) > 0 and len(r.get('title', '')) > 5]
    print(f"[过滤] 有效数据: {len(all_raw)} 条")

    # 转换为前端 Tour 格式
    tours = []
    for i, raw in enumerate(all_raw, 1):
        tour = raw_to_tour(raw, i)
        tours.append(tour)

    print(f"[转换] 生成 {len(tours)} 条 Tour 数据")

    # 写入文件
    content = generate_tours_ts(tours)
    output_path = os.path.join(os.path.dirname(__file__), "..", "src", "data", "tours.ts")
    output_path = os.path.abspath(output_path)

    with open(output_path, "w", encoding="utf-8") as f:
        f.write(content)

    print(f"[保存] -> {output_path}")
    print(f"[文件大小] {os.path.getsize(output_path) / 1024:.1f} KB")
    print("=" * 60)
    print("完成！运行 npm run build 即可构建静态站点。")


if __name__ == "__main__":
    main()
