#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
广之旅(nn.gzl.cn) API 探测脚本
用于获取产品列表数据
"""

import requests
import json
import urllib.parse
import time
import random
import sys
import io

# 设置stdout为UTF-8
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

BASE_URL = "http://nn.gzl.cn"
SEARCH_PAGE = "{}/search/all_list.html"
API_ENDPOINT = "{}/search/getAllProductList.json"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/json, text/javascript, */*; q=0.01",
    "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
    "X-Requested-With": "XMLHttpRequest",
    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    "Origin": "http://nn.gzl.cn",
}


def get_session(dest_name, search_type="ALL"):
    """先访问搜索页面获取session cookie"""
    session = requests.Session()
    params = {
        "destName": dest_name,
        "searchtype": search_type,
        "searchfield": dest_name,
    }
    url = SEARCH_PAGE.format(BASE_URL) + "?" + urllib.parse.urlencode(params)
    resp = session.get(url, headers={"User-Agent": HEADERS["User-Agent"]}, timeout=30)
    print(f"[Session] GET {url} -> status={resp.status_code}, cookies={dict(session.cookies)}")
    return session


def fetch_products(session, dest_name, search_type="ALL", page=1, **extra_params):
    """调用API获取产品列表"""
    url = API_ENDPOINT.format(BASE_URL)
    referer_params = {
        "destName": dest_name,
        "searchtype": search_type,
        "searchfield": dest_name,
    }
    referer = SEARCH_PAGE.format(BASE_URL) + "?" + urllib.parse.urlencode(referer_params)

    data = {
        "destName": dest_name,
        "searchtype": search_type,
        "page": page,
        "rd": random.random(),
        "isUseGroup": "false",
        "order": "",
        "departureDays": "",
        "endDays": "",
        "deptPlaceId": "",
        "deptPlaceName": "",
        "travelDaysRange": "",
        "newDestName": "",
        "travelDays": "",
        "priceRange": "",
        "supplierName": "",
        "pdLevel": "",
        "pdIsPlayTour": "",
        "isGiveWifi": "",
        "selfSupport": "",
        "departureMon": "",
    }
    data.update(extra_params)

    req_headers = dict(HEADERS)
    req_headers["Referer"] = referer

    resp = session.post(url, data=data, headers=req_headers, timeout=30)
    print(f"[API] POST {url} page={page} -> status={resp.status_code}")
    return resp.json()


def parse_products(api_response):
    """解析API响应，提取产品信息"""
    if not api_response.get("success"):
        print(f"[Error] API returned success=false: {api_response}")
        return [], []

    response_object = api_response.get("responseObject", {})
    content = response_object.get("content", [])
    if not content:
        return [], []

    first_group = content[0]
    products = first_group.get("allProductList", [])
    fact_result = first_group.get("factResult", [])
    return products, fact_result


def print_product_summary(products):
    """打印产品摘要"""
    print(f"\n===== 产品列表 (共 {len(products)} 个) =====")
    for i, p in enumerate(products[:10], 1):
        title = p.get("title", "N/A")
        price = p.get("b2cMinPrice", "N/A")
        pd_type = p.get("type", "N/A")
        dept = p.get("deptPlaceName", "N/A")
        days = p.get("travelDays", "N/A")
        pd_id = p.get("pdId", "N/A")
        url = p.get("url", "N/A")
        print(f"{i}. [{pd_type}] {title}")
        print(f"   价格: {price} | 出发地: {dept} | 天数: {days} | ID: {pd_id}")
        print(f"   URL: {BASE_URL}{url}")
        print()
    if len(products) > 10:
        print(f"... 还有 {len(products) - 10} 个产品")


def print_filters(fact_result):
    """打印筛选条件统计"""
    print(f"\n===== 筛选条件统计 (共 {len(fact_result)} 项) =====")
    for fact in fact_result:
        field_name = fact.get("fieldName", "N/A")
        field_map = fact.get("fieldCountMap", {})
        if field_map:
            print(f"\n{field_name}:")
            for key, count in list(field_map.items())[:5]:
                print(f"  - {key}: {count}")
            if len(field_map) > 5:
                print(f"  ... 还有 {len(field_map) - 5} 项")


def probe_destinations():
    """探测多个目的地的API"""
    destinations = [
        ("北京", "ALL"),
        ("广西", "ALL"),
        ("海南", "ALL"),
        ("海南", "PRODUCTGROUP"),
        ("海南", "FREETRAVEL"),
        ("海南", "YJYT"),
        ("海南", "LOCAL"),
    ]

    for dest_name, search_type in destinations:
        print(f"\n{'='*60}")
        print(f"探测: destName={dest_name}, searchtype={search_type}")
        print(f"{'='*60}")

        session = get_session(dest_name, search_type)
        time.sleep(0.5)

        try:
            resp = fetch_products(session, dest_name, search_type, page=1)
            products, fact_result = parse_products(resp)
            print_product_summary(products)
            print_filters(fact_result)

            # 测试分页
            if len(products) >= 20:
                print(f"\n[分页测试] 获取第2页...")
                time.sleep(0.5)
                resp2 = fetch_products(session, dest_name, search_type, page=2)
                products2, _ = parse_products(resp2)
                print(f"第2页产品数: {len(products2)}")
                if products2:
                    print(f"第2页第一个: {products2[0].get('title', 'N/A')[:50]}...")

        except Exception as e:
            print(f"[Error] {e}")

        time.sleep(1)


def probe_api_variations():
    """测试不同API端点和参数组合"""
    print(f"\n{'='*60}")
    print("测试不同参数组合")
    print(f"{'='*60}")

    session = get_session("北京", "ALL")
    time.sleep(0.5)

    # 测试不同排序
    orders = ["", "salesVolume,desc", "b2cMinPrice,asc", "commentScore,desc"]
    for order in orders:
        print(f"\n[排序测试] order='{order}'")
        try:
            resp = fetch_products(session, "北京", "ALL", page=1, order=order)
            products, _ = parse_products(resp)
            print(f"  返回产品数: {len(products)}")
            if products:
                print(f"  第一个: {products[0].get('title', 'N/A')[:40]}... 价格: {products[0].get('b2cMinPrice')}")
        except Exception as e:
            print(f"  Error: {e}")
        time.sleep(0.3)

    # 测试价格筛选
    print(f"\n[价格筛选测试] priceRange='2000-5000'")
    try:
        resp = fetch_products(session, "北京", "ALL", page=1, priceRange="2000-5000")
        products, _ = parse_products(resp)
        print(f"  返回产品数: {len(products)}")
        if products:
            prices = [p.get("b2cMinPrice", 0) for p in products if p.get("b2cMinPrice")]
            print(f"  价格范围: {min(prices)} - {max(prices)}")
    except Exception as e:
        print(f"  Error: {e}")

    # 测试行程天数筛选
    print(f"\n[天数筛选测试] travelDays='5'")
    try:
        resp = fetch_products(session, "北京", "ALL", page=1, travelDays="5")
        products, _ = parse_products(resp)
        print(f"  返回产品数: {len(products)}")
        if products:
            days = [p.get("travelDays", 0) for p in products]
            print(f"  天数范围: {min(days)} - {max(days)}")
    except Exception as e:
        print(f"  Error: {e}")


if __name__ == "__main__":
    print("=" * 60)
    print("广之旅(nn.gzl.cn) API 探测报告")
    print("=" * 60)

    probe_destinations()
    probe_api_variations()

    print("\n" + "=" * 60)
    print("探测完成")
    print("=" * 60)
