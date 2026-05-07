#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
广之旅API爬虫 - 使用POST接口获取全量数据
"""

import requests
import json
import os

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/json, text/javascript, */*; q=0.01",
    "Accept-Language": "zh-CN,zh;q=0.9",
    "X-Requested-With": "XMLHttpRequest",
    "Origin": "http://nn.gzl.cn",
    "Referer": "http://nn.gzl.cn/search/all_list.html",
}

BASE_URL = "http://nn.gzl.cn"

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


def get_session():
    """获取session和cookie"""
    session = requests.Session()
    session.headers.update(HEADERS)
    # 先访问搜索页面获取cookie
    resp = session.get(f"{BASE_URL}/search/all_list.html", timeout=15)
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


def parse_product(product):
    """解析产品数据"""
    title = product.get("title", "")
    price = product.get("b2cMinPrice", 0)
    days = product.get("travelDays", 0)
    pd_id = product.get("pdId", "")
    ptype = product.get("type", "")
    
    # 构建URL
    url = ""
    if ptype == "PRODUCTGROUP":
        url = f"{BASE_URL}/domestic/{pd_id}.html"
    elif ptype == "FREE_TOUR":
        url = f"{BASE_URL}/freetour/{pd_id}.html"
    elif ptype == "SCENIC":
        url = f"{BASE_URL}/tickets/{pd_id}.html"
    elif ptype == "HOTEL":
        url = f"{BASE_URL}/hotel/{pd_id}.html"
    else:
        url = f"{BASE_URL}/domestic/{pd_id}.html"
    
    # 图片
    images = product.get("defaultImage", {})
    img_url = images.get("imageStr", "") if images else ""
    
    item = {
        "source": "广之旅",
        "title": title,
        "price": price,
        "url": url,
        "days": days or extract_days(title),
    }
    if img_url:
        item["img"] = img_url
    
    return item


def fetch():
    print("[广之旅] API全量抓取中...")
    session = get_session()
    all_items = []
    seen = set()
    
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
                    item = parse_product(product)
                    if not item["title"] or item["price"] <= 0:
                        continue
                    
                    key = item["title"] + "|" + str(item["price"])
                    if key in seen:
                        continue
                    seen.add(key)
                    
                    all_items.append(item)
                    page_items += 1
                
                print(f"  [广之旅-{dest}-{type_name}] 第{page}页: {page_items}条")
                
                if page_items == 0:
                    break
                
                page += 1
    
    print(f"[广之旅] 抓取完成: {len(all_items)} 条")
    return all_items


def main():
    items = fetch()
    data_dir = os.path.join(os.path.dirname(__file__), "..", "src", "data")
    data_dir = os.path.abspath(data_dir)
    os.makedirs(data_dir, exist_ok=True)
    with open(os.path.join(data_dir, "raw_gzl_api.json"), "w", encoding="utf-8") as f:
        json.dump(items, f, ensure_ascii=False, indent=2)
    print(f"[保存] -> {os.path.join(data_dir, 'raw_gzl_api.json')}")


if __name__ == "__main__":
    main()
