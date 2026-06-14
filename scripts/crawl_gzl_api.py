#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
广之旅API爬虫 - 使用POST接口获取全量数据
"""

import requests
import json
import os
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/json, text/javascript, */*; q=0.01",
    "Accept-Language": "zh-CN,zh;q=0.9",
    "X-Requested-With": "XMLHttpRequest",
    "Origin": "http://nn.gzl.cn",
    "Referer": "http://nn.gzl.cn/search/all_list.html",
}

BASE_URL = "http://nn.gzl.cn"
MIN_DEPARTURE_YEAR = 2000
MAX_DEPARTURE_YEAR_OFFSET = 3
DEFAULT_GZL_SCHEDULE_WORKERS = 16
_THREAD_LOCAL = threading.local()

# 目的地列表
DESTINATIONS = [
    "北京", "上海", "云南", "四川", "广西", "海南", "贵州", "西藏", "新疆",
    "湖南", "湖北", "江西", "福建", "浙江", "江苏", "山东", "河南", "河北",
    "山西", "陕西", "甘肃", "青海", "宁夏", "内蒙古", "东北", "广东",
    "香港", "澳门", "台湾", "日本", "韩国", "泰国", "新加坡", "马来西亚",
    "越南", "柬埔寨", "印尼", "菲律宾", "马尔代夫", "斯里兰卡", "尼泊尔",
    "印度", "迪拜", "土耳其", "埃及", "肯尼亚", "南非", "摩洛哥",
    "俄罗斯", "欧洲", "英国", "法国", "德国", "意大利", "瑞士", "西班牙",
    "葡萄牙", "希腊", "北欧", "东欧", "美国", "加拿大", "墨西哥",
    "巴西", "阿根廷", "智利", "秘鲁", "澳大利亚", "新西兰", "斐济",
    "巴厘岛", "普吉岛", "苏梅岛", "长滩岛", "沙巴", "芽庄", "清迈",
]

# 产品类型
SEARCH_TYPES = [
    ("ALL", "全部"),
    ("PRODUCTGROUP", "跟团游"),
    ("FREETRAVEL", "自由行"),
    ("YJYT", "一家一团"),
    ("LOCAL", "当地玩乐"),
    ("HOTEL", "酒店"),
    ("TICKET", "门票"),
    ("VISA", "签证"),
    ("CRUISE", "邮轮"),
]


def extract_days(title):
    import re
    m = re.search(r"(\d+)[天日]", title)
    if m:
        return int(m.group(1))
    return 0


def normalize_departure_dates(values):
    if not values:
        return []
    normalized = []
    seen = set()
    max_year = datetime.now().year + MAX_DEPARTURE_YEAR_OFFSET
    for value in values:
        if not value:
            continue
        text = str(value).strip()
        try:
            parsed = datetime.strptime(text, "%Y-%m-%d")
        except ValueError:
            continue
        if parsed.year < MIN_DEPARTURE_YEAR or parsed.year > max_year:
            continue
        iso_value = parsed.strftime("%Y-%m-%d")
        if iso_value in seen:
            continue
        seen.add(iso_value)
        normalized.append(iso_value)
    normalized.sort()
    return normalized


def first_upcoming_date(values):
    dates = normalize_departure_dates(values)
    if not dates:
        return ""

    today = datetime.now().date()
    for value in dates:
        try:
            if datetime.strptime(value, "%Y-%m-%d").date() >= today:
                return value
        except ValueError:
            continue
    return dates[0]


def coerce_price(value):
    if value in (None, ""):
        return 0
    if isinstance(value, (int, float)):
        return int(float(value))
    text = str(value).strip().replace(",", "")
    if not text:
        return 0
    try:
        return int(float(text))
    except ValueError:
        return 0


def parse_schedule_value(value):
    if value is None:
        return {"sellable": False, "price": 0}

    if isinstance(value, dict):
        price = coerce_price(value.get("adultPrice") or value.get("stdPrice") or value.get("price"))
        stock = value.get("stock")
        sellable = price > 0 and (stock is None or coerce_price(stock) > 0)
        return {"sellable": sellable, "price": price}

    text = str(value).strip()
    if not text or text.startswith("|||") or "|0|" in text:
        return {"sellable": False, "price": 0}

    if text.startswith("{") and text.endswith("}"):
        try:
            payload = json.loads(text)
        except ValueError:
            return {"sellable": False, "price": 0}
        return parse_schedule_value(payload)

    price = coerce_price(text.split("|", 1)[0])
    return {"sellable": price > 0, "price": price}


def resolve_schedule_request(pd_id, ptype, url):
    if not pd_id or not url:
        return None, None

    lower_url = str(url).lower()
    if ptype == "PRODUCTGROUP" or any(token in lower_url for token in ("/domestic/", "/abroad/", "/around/")):
        endpoint = f"{BASE_URL}/grouptour/scheduleDateMap.json"
        payload = {"pdId": pd_id, "activityId": ""}
    elif ptype in {"FREE_TOUR", "FREETRAVEL"} or "/freetour/" in lower_url:
        endpoint = f"{BASE_URL}/freetour/scheduleDateMap.json"
        payload = {"pdId": pd_id, "ctripPdSn": "", "activityId": ""}
    else:
        return None, None
    return endpoint, payload


def schedule_cache_key(pd_id, ptype, url):
    return f"{ptype}|{pd_id}|{url}"


def fetch_schedule_snapshot(session, pd_id, ptype, url):
    endpoint, payload = resolve_schedule_request(pd_id, ptype, url)
    if not endpoint:
        return {}

    try:
        response = session.post(
            endpoint,
            data=payload,
            timeout=15,
            headers={
                "Referer": url,
                "X-Requested-With": "XMLHttpRequest",
            },
        )
        response.raise_for_status()
        result = response.json()
    except Exception:
        return {}

    schedule_map = result.get("ScheduleDateMap")
    if not isinstance(schedule_map, dict):
        return {}

    sellable_dates = []
    prices_by_date = {}
    for raw_date, raw_value in schedule_map.items():
        try:
            iso_date = datetime.strptime(str(raw_date).strip(), "%Y-%m-%d").strftime("%Y-%m-%d")
        except ValueError:
            continue

        parsed = parse_schedule_value(raw_value)
        if not parsed["sellable"] or parsed["price"] <= 0:
            continue

        prices_by_date[iso_date] = parsed["price"]
        sellable_dates.append(iso_date)

    sellable_dates = normalize_departure_dates(sellable_dates)
    departure_date = first_upcoming_date(sellable_dates)
    price = prices_by_date.get(departure_date, 0) if departure_date else 0

    return {
        "departure_dates": sellable_dates,
        "departure_date": departure_date,
        "price": price,
    }


def get_session():
    """获取session和cookie"""
    session = requests.Session()
    session.headers.update(HEADERS)
    # 先访问搜索页面获取cookie
    resp = session.get(f"{BASE_URL}/search/all_list.html", timeout=15)
    return session


def get_thread_session():
    session = getattr(_THREAD_LOCAL, "session", None)
    if session is None:
        session = get_session()
        _THREAD_LOCAL.session = session
    return session


def fetch_products(session, dest_name, search_type, page=1):
    """获取产品列表"""
    url = f"{BASE_URL}/search/getAllProductList.json"
    
    data = {
        "destName": dest_name,
        "searchtype": search_type,
        "searchfield": dest_name,
        "page": str(page),
        "order": "",
        "priceRange": "",
        "travelDays": "",
        "departureDays": "",
        "endDays": "",
        "deptPlaceName": "",
        "pdTag": "",
        "pdLevel": "",
        "selfSupport": "",
        "isGiveWifi": "",
        "isUseGroup": "false",
        "rd": "0.123",
    }
    
    try:
        resp = session.post(url, data=data, timeout=15)
        result = resp.json()
        
        if not result.get("success"):
            return []
        
        content = result.get("responseObject", {}).get("content", [])
        if not content:
            return []
        
        products = content[0].get("allProductList", [])
        return products
    except Exception as e:
        print(f"  API error: {e}")
        return []


def build_base_item(product):
    """从列表接口构建基础产品数据，schedule 信息后补。"""
    title = product.get("title", "")
    list_price = coerce_price(product.get("b2cMinPrice", 0))
    days = product.get("travelDays", 0)
    pd_id = product.get("pdId", "")
    ptype = product.get("type", "")
    departure_dates = normalize_departure_dates(product.get("departureDaysList", []))
    
    # 构建URL
    url = str(product.get("url", "") or "").strip()
    if url.startswith("//"):
        url = f"http:{url}"
    elif url.startswith("/"):
        url = f"{BASE_URL}{url}"
    if not url and ptype == "PRODUCTGROUP":
        url = f"{BASE_URL}/domestic/{pd_id}.html"
    elif not url and ptype == "FREE_TOUR":
        url = f"{BASE_URL}/freetour/{pd_id}.html"
    elif not url and ptype == "SCENIC":
        url = f"{BASE_URL}/tickets/{pd_id}.html"
    elif not url and ptype == "HOTEL":
        url = f"{BASE_URL}/hotel/{pd_id}.html"
    elif not url:
        url = f"{BASE_URL}/domestic/{pd_id}.html"
    
    # 图片
    images = product.get("defaultImage", {})
    img_url = images.get("imageStr", "") if images else ""
    ai_tags = []
    for raw_tag in product.get("pdTagNames") or []:
        tag = str(raw_tag or "").strip()
        if tag and tag not in ai_tags:
            ai_tags.append(tag)
    
    item = {
        "source": "广之旅",
        "sourceId": pd_id,
        "productType": ptype,
        "title": title,
        "price": list_price,
        "startingPrice": list_price,
        "priceSource": "b2cMinPrice",
        "url": url,
        "days": days or extract_days(title),
        "departureDates": departure_dates,
        "departureDate": first_upcoming_date(departure_dates),
        "meta": {
            "supplierName": str(product.get("pdCompanyName") or "").strip(),
            "priceSource": "b2cMinPrice",
            "productType": ptype,
            "aiTags": ai_tags,
            "sourceFeatures": [
                feature
                for feature, enabled in (
                    ("self_support", str(product.get("selfSupport") or "").strip() == "1"),
                    ("wifi_available", str(product.get("isGiveWifi") or "").strip() == "1"),
                )
                if enabled
            ],
            "sourceAttributes": {
                "pdLevel": str(product.get("pdLevel") or "").strip(),
            },
        },
    }
    if img_url:
        item["img"] = img_url
    
    return item


def apply_schedule_snapshot(item, schedule_snapshot):
    enriched = dict(item)
    meta = dict(enriched.get("meta") or {})

    schedule_dates = schedule_snapshot.get("departure_dates") or []
    schedule_price = coerce_price(schedule_snapshot.get("price"))
    schedule_departure_date = schedule_snapshot.get("departure_date") or ""

    if schedule_dates:
        enriched["departureDates"] = schedule_dates
    if schedule_departure_date:
        enriched["departureDate"] = schedule_departure_date
    elif enriched.get("departureDates"):
        enriched["departureDate"] = first_upcoming_date(enriched.get("departureDates") or [])

    if schedule_price > 0:
        enriched["price"] = schedule_price
        enriched["priceSource"] = "scheduleDateMap"
        meta["priceSource"] = "scheduleDateMap"
    else:
        enriched["priceSource"] = enriched.get("priceSource") or "b2cMinPrice"
        meta["priceSource"] = enriched["priceSource"]

    enriched["meta"] = meta
    return enriched


def fetch_schedule_snapshots(items):
    unique_requests = {}
    for item in items:
        pd_id = str(item.get("sourceId") or "").strip()
        ptype = str(item.get("productType") or "").strip()
        url = str(item.get("url") or "").strip()
        endpoint, _ = resolve_schedule_request(pd_id, ptype, url)
        if not endpoint:
            continue

        key = schedule_cache_key(pd_id, ptype, url)
        unique_requests.setdefault(key, (pd_id, ptype, url))

    if not unique_requests:
        return {}

    workers = max(
        4,
        min(32, int(os.environ.get("GZL_SCHEDULE_WORKERS", str(DEFAULT_GZL_SCHEDULE_WORKERS)) or str(DEFAULT_GZL_SCHEDULE_WORKERS))),
    )
    print(f"[广之旅] 并发补全 schedule: {len(unique_requests)} 条, workers={workers}")

    def fetch_one(entry):
        key, (pd_id, ptype, url) = entry
        session = get_thread_session()
        return key, fetch_schedule_snapshot(session, pd_id, ptype, url)

    snapshots = {}
    with ThreadPoolExecutor(max_workers=workers) as executor:
        future_map = {
            executor.submit(fetch_one, entry): entry[0]
            for entry in unique_requests.items()
        }
        for completed, future in enumerate(as_completed(future_map), start=1):
            key, snapshot = future.result()
            snapshots[key] = snapshot
            if completed % 100 == 0 or completed == len(unique_requests):
                print(f"[广之旅] 已补全 schedule {completed}/{len(unique_requests)}")

    return snapshots


def fetch():
    print("[广之旅] API全量抓取中...")
    session = get_session()
    candidate_items = []
    
    for dest in DESTINATIONS:
        for search_type, type_name in SEARCH_TYPES:
            page = 1
            empty_count = 0
            
            while page <= 50:  # 最多50页
                products = fetch_products(session, dest, search_type, page)
                
                if not products:
                    empty_count += 1
                    if empty_count >= 2:
                        break
                else:
                    empty_count = 0
                
                page_items = 0
                for product in products:
                    item = build_base_item(product)
                    if not item["title"]:
                        continue

                    candidate_items.append(item)
                    page_items += 1
                
                print(f"  [广之旅-{dest}-{type_name}] 第{page}页: {page_items}条")
                
                if page_items == 0:
                    break
                
                page += 1

    schedule_snapshots = fetch_schedule_snapshots(candidate_items)
    all_items = []
    seen = set()
    for item in candidate_items:
        snapshot = schedule_snapshots.get(
            schedule_cache_key(
                str(item.get("sourceId") or "").strip(),
                str(item.get("productType") or "").strip(),
                str(item.get("url") or "").strip(),
            ),
            {},
        )
        enriched = apply_schedule_snapshot(item, snapshot)
        if enriched["price"] <= 0:
            continue

        key = enriched["title"] + "|" + str(enriched["price"])
        if key in seen:
            continue
        seen.add(key)
        all_items.append(enriched)

    print(f"[广之旅] 抓取完成: {len(all_items)} 条")
    return all_items


def refresh_existing_prices(items):
    workers = max(4, min(32, int(os.environ.get("GZL_REFRESH_WORKERS", "16") or "16")))

    def refresh_one(raw_item):
        session = get_session()
        item = dict(raw_item)
        pd_id = str(item.get("sourceId") or item.get("pdId") or "").strip()
        ptype = str(item.get("productType") or item.get("type") or "").strip()
        url = str(item.get("url") or "").strip()

        if not pd_id or not url:
            return item

        schedule_snapshot = fetch_schedule_snapshot(session, pd_id, ptype, url)

        schedule_dates = schedule_snapshot.get("departure_dates") or []
        schedule_price = coerce_price(schedule_snapshot.get("price"))
        schedule_departure_date = schedule_snapshot.get("departure_date") or ""

        current_price = coerce_price(item.get("price"))
        item["startingPrice"] = coerce_price(item.get("startingPrice") or current_price)
        if schedule_price > 0:
            item["price"] = schedule_price
            item["priceSource"] = "scheduleDateMap"
        else:
            item["priceSource"] = item.get("priceSource") or "b2cMinPrice"

        if schedule_dates:
            item["departureDates"] = schedule_dates
        if schedule_departure_date:
            item["departureDate"] = schedule_departure_date
        elif item.get("departureDates"):
            item["departureDate"] = first_upcoming_date(item.get("departureDates") or [])

        return item

    refreshed = [None] * len(items)
    with ThreadPoolExecutor(max_workers=workers) as executor:
        future_map = {
            executor.submit(refresh_one, raw_item): index
            for index, raw_item in enumerate(items)
        }
        for completed, future in enumerate(as_completed(future_map), start=1):
            index = future_map[future]
            refreshed[index] = future.result()
            if completed % 100 == 0:
                print(f"[广之旅] 已刷新 {completed}/{len(items)} 条")
    return refreshed


def main():
    data_dir = os.path.join(os.path.dirname(__file__), "..", "src", "data")
    data_dir = os.path.abspath(data_dir)
    os.makedirs(data_dir, exist_ok=True)
    output_path = os.path.join(data_dir, "raw_gzl_api.json")

    refresh_existing = os.environ.get("GZL_REFRESH_EXISTING", "").strip().lower() in {"1", "true", "yes", "on"}
    if refresh_existing and os.path.exists(output_path):
        with open(output_path, "r", encoding="utf-8") as f:
            items = json.load(f)
        print(f"[广之旅] 刷新现有价格: {len(items)} 条")
        items = refresh_existing_prices(items)
    else:
        items = fetch()

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(items, f, ensure_ascii=False, indent=2)
    print(f"[保存] -> {output_path}")


if __name__ == "__main__":
    main()
