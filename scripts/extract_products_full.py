#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
康辉旅行网站产品数据完整提取脚本
改进提取逻辑，获取标题、价格等完整信息
"""

import requests
import re
import json
import sys
from bs4 import BeautifulSoup

BASE_URL = "http://gz.cctpage.com"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
}

sys.stdout.reconfigure(encoding='utf-8')
session = requests.Session()
session.headers.update(HEADERS)

print("=" * 60)
print("康辉旅行网站产品数据完整提取")
print("=" * 60)

def extract_products_full(navid, page_index):
    """完整提取产品数据"""
    url = f"{BASE_URL}/PC/TourLine/List"
    params = {"navid": navid, "pageIndex": page_index}
    
    resp = session.get(url, params=params, timeout=15)
    html = resp.text
    
    soup = BeautifulSoup(html, 'html.parser')
    products = []
    
    # 查找产品列表容器
    product_list = soup.find('div', class_='product_list')
    if not product_list:
        print(f"   未找到 product_list 容器")
        return products
    
    # 查找所有产品卡片
    product_divs = product_list.find_all('div', class_='product')
    print(f"   找到 {len(product_divs)} 个产品卡片")
    
    for prod_div in product_divs:
        product = {}
        
        # 提取 prodCode
        link = prod_div.find('a', href=re.compile(r'prodcode', re.I))
        if link:
            href = link.get('href', '')
            match = re.search(r'prodcode=([A-Z0-9]+)', href, re.I)
            if match:
                product['prodCode'] = match.group(1)
        
        # 提取标题 - 在 describe > detail > h3 中
        detail = prod_div.find('div', class_='detail')
        if detail:
            h3 = detail.find('h3')
            if h3:
                product['title'] = h3.get_text(strip=True)
        
        # 如果没找到，尝试其他位置
        if 'title' not in product:
            title_elem = prod_div.find(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'])
            if title_elem:
                product['title'] = title_elem.get_text(strip=True)
        
        # 提取图片
        img = prod_div.find('img', class_='j_lazyImg')
        if img:
            product['image'] = img.get('data-original', '') or img.get('src', '')
        
        # 提取价格 - 在 price > p1 > num 中
        price_span = prod_div.find('span', class_='price')
        if price_span:
            price_text = price_span.get_text()
            price_match = re.search(r'(\d+[\d,]*)', price_text)
            if price_match:
                product['price'] = price_match.group(1).replace(',', '')
        
        # 提取原价（如果有）
        origin = prod_div.find('span', class_='origin')
        if origin:
            origin_text = origin.get_text()
            origin_match = re.search(r'(\d+[\d,]*)', origin_text)
            if origin_match:
                product['originalPrice'] = origin_match.group(1).replace(',', '')
        
        # 提取标签
        tags = prod_div.find_all('span', class_='tag')
        if tags:
            product['tags'] = [t.get_text(strip=True) for t in tags]
        
        # 提取天数 - 在 tip 中
        tip = prod_div.find('span', class_='tip')
        if tip:
            tip_text = tip.get_text()
            day_match = re.search(r'(\d+)\s*天', tip_text)
            if day_match:
                product['days'] = int(day_match.group(1))
        
        # 提取出发地
        meta = prod_div.find('div', class_='meta')
        if meta:
            meta_text = meta.get_text(strip=True)
            product['meta'] = meta_text
        
        products.append(product)
    
    return products

# ============================================================
# 1. 完整提取 navid=6, pageIndex=1
# ============================================================
print("\n[1] 完整提取 navid=6, pageIndex=1...")
products = extract_products_full(6, 1)
print(f"   提取到 {len(products)} 个产品\n")
for p in products:
    print(f"   {json.dumps(p, ensure_ascii=False)}")

# ============================================================
# 2. 完整提取 navid=6, pageIndex=2
# ============================================================
print("\n[2] 完整提取 navid=6, pageIndex=2...")
products2 = extract_products_full(6, 2)
print(f"   提取到 {len(products2)} 个产品\n")
for p in products2:
    print(f"   {json.dumps(p, ensure_ascii=False)}")

# ============================================================
# 3. 获取分页信息
# ============================================================
print("\n[3] 获取分页信息...")

resp = session.get(f"{BASE_URL}/PC/TourLine/List?navid=6&pageIndex=1", timeout=15)
html = resp.text

# 查找总页数
page_indices = re.findall(r'pageIndex=(\d+)', html)
if page_indices:
    unique_pages = sorted(set(int(p) for p in page_indices))
    max_page = max(unique_pages)
    print(f"   最大页码: {max_page}")
    print(f"   页码列表: {unique_pages[:15]}...")

# 查找总记录数
total_match = re.search(r'共\s*(\d+)\s*条', html)
if total_match:
    print(f"   总记录数: {total_match.group(1)}")

# ============================================================
# 4. 测试不同 navid 的分类
# ============================================================
print("\n[4] 测试不同 navid 分类...")

navid_tests = [
    (251, "出境旅游"),
    (252, "国内旅游"),
    (253, "周边旅游"),
]

for navid, name in navid_tests:
    try:
        prods = extract_products_full(navid, 1)
        print(f"   {name}(navid={navid}): {len(prods)} 个产品")
        if prods:
            print(f"     示例: {json.dumps(prods[0], ensure_ascii=False)}")
    except Exception as e:
        print(f"   {name}(navid={navid}): 错误 {e}")

# ============================================================
# 5. 总结
# ============================================================
print("\n" + "=" * 60)
print("完整提取总结")
print("=" * 60)
print("\n【最终结论】")
print("康辉旅行网站 (gz.cctpage.com) 没有提供独立的 AJAX/JSON API 接口。")
print("产品数据通过服务端渲染的 HTML 页面返回。")
print("\n【产品列表接口（HTML页面）】")
print("URL: GET http://gz.cctpage.com/PC/TourLine/List")
print("参数:")
print("  navid        - 分类ID (如: 251=出境旅游, 252=国内旅游, 253=周边旅游)")
print("  pageIndex    - 页码，从1开始")
print("  pageSize     - 每页数量（可选）")
print("  destinationID - 目的地ID（可选）")
print("  departureID  - 出发地ID（可选）")
print("  tipDay       - 天数（可选）")
print("  tripDate     - 出发日期（可选）")
print("  prodType     - 产品类型（可选: 国内当地/国内长线/出境游/入境游/其他）")
print("\n【产品详情接口（HTML页面）】")
print("URL: GET http://gz.cctpage.com/PC/TourLine/Details")
print("参数:")
print("  prodCode     - 产品代码")
print("\n【可提取的产品字段】")
print("  prodCode     - 产品代码")
print("  title        - 产品标题")
print("  image        - 产品图片URL")
print("  price        - 价格")
print("  originalPrice - 原价")
print("  tags         - 标签列表")
print("  days         - 天数")
print("  meta         - 其他元信息")
print("\n【使用建议】")
print("1. 使用 requests 获取 HTML 页面")
print("2. 使用 BeautifulSoup 解析 HTML 提取数据")
print("3. 遍历 navid 和 pageIndex 获取所有产品")
print("4. 注意设置正确的编码（网站返回 UTF-8）")
