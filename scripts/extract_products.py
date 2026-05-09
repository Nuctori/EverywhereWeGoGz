#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
康辉旅行网站产品数据提取脚本
从 HTML 中解析产品列表数据
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
print("康辉旅行网站产品数据提取")
print("=" * 60)

def extract_products_from_page(navid, page_index):
    """从指定页面提取产品数据"""
    url = f"{BASE_URL}/PC/TourLine/List"
    params = {"navid": navid, "pageIndex": page_index}
    
    resp = session.get(url, params=params, timeout=15)
    html = resp.text
    
    products = []
    
    # 方法1: 使用正则提取产品卡片
    # 产品卡片的模式: <div class="product j_item">...</div>
    product_divs = re.findall(
        r'<div class="product j_item">(.*?)</div>\s*</div>\s*</div>\s*</div>',
        html, re.DOTALL
    )
    
    if not product_divs:
        # 尝试更宽松的模式
        product_divs = re.findall(
            r'<div class="product j_item">(.*?)</div>\s*</div>\s*</div>',
            html, re.DOTALL
        )
    
    print(f"   找到 {len(product_divs)} 个产品卡片")
    
    for div in product_divs:
        product = {}
        
        # 提取 prodCode
        prodcode_match = re.search(r'prodcode=([A-Z0-9]+)', div, re.IGNORECASE)
        if prodcode_match:
            product['prodCode'] = prodcode_match.group(1)
        
        # 提取标题
        title_match = re.search(r'<h[1-6][^>]*>([^<]+)</h[1-6]>', div)
        if title_match:
            product['title'] = title_match.group(1).strip()
        
        # 提取图片
        img_match = re.search(r'data-original=["\']([^"\']+)["\']', div)
        if img_match:
            product['image'] = img_match.group(1)
        
        # 提取价格
        price_match = re.search(r'<span[^>]*class=["\']price["\'][^>]*>(.*?)</span>', div, re.DOTALL)
        if price_match:
            price_html = price_match.group(1)
            price_num = re.search(r'(\d+[\d,]*)', price_html)
            if price_num:
                product['price'] = price_num.group(1).replace(',', '')
        
        # 提取标签
        tags = re.findall(r'<span[^>]*class=["\']tag["\'][^>]*>([^<]+)</span>', div)
        if tags:
            product['tags'] = [t.strip() for t in tags]
        
        # 提取天数
        day_match = re.search(r'(\d+)\s*天', div)
        if day_match:
            product['days'] = int(day_match.group(1))
        
        if product:
            products.append(product)
    
    return products

# ============================================================
# 1. 测试提取 navid=6, pageIndex=1
# ============================================================
print("\n[1] 测试提取 navid=6, pageIndex=1...")
products = extract_products_from_page(6, 1)
print(f"   提取到 {len(products)} 个产品")
for p in products[:5]:
    print(f"   {json.dumps(p, ensure_ascii=False)}")

# ============================================================
# 2. 测试提取 navid=6, pageIndex=2
# ============================================================
print("\n[2] 测试提取 navid=6, pageIndex=2...")
products2 = extract_products_from_page(6, 2)
print(f"   提取到 {len(products2)} 个产品")
for p in products2[:5]:
    print(f"   {json.dumps(p, ensure_ascii=False)}")

# ============================================================
# 3. 测试不同 navid
# ============================================================
print("\n[3] 测试不同 navid...")

navids = [251, 252, 253]  # 出境旅游、国内旅游、周边旅游
for navid in navids:
    try:
        prods = extract_products_from_page(navid, 1)
        print(f"   navid={navid}: {len(prods)} 个产品")
        if prods:
            print(f"     示例: {json.dumps(prods[0], ensure_ascii=False)}")
    except Exception as e:
        print(f"   navid={navid}: 错误 {e}")

# ============================================================
# 4. 使用 BeautifulSoup 提取
# ============================================================
print("\n[4] 使用 BeautifulSoup 提取...")

resp = session.get(f"{BASE_URL}/PC/TourLine/List?navid=6&pageIndex=1", timeout=15)
html = resp.text
soup = BeautifulSoup(html, 'html.parser')

# 查找产品列表容器
product_list = soup.find('div', class_='product_list')
if product_list:
    product_divs = product_list.find_all('div', class_='product')
    print(f"   BeautifulSoup 找到 {len(product_divs)} 个产品")
    
    for prod_div in product_divs[:3]:
        product = {}
        
        # 提取链接和 prodCode
        link = prod_div.find('a', href=re.compile(r'prodcode'))
        if link:
            href = link.get('href', '')
            prodcode_match = re.search(r'prodcode=([A-Z0-9]+)', href, re.IGNORECASE)
            if prodcode_match:
                product['prodCode'] = prodcode_match.group(1)
        
        # 提取标题
        title = prod_div.find(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'])
        if title:
            product['title'] = title.get_text(strip=True)
        
        # 提取图片
        img = prod_div.find('img', class_='j_lazyImg')
        if img:
            product['image'] = img.get('data-original', '')
        
        # 提取价格
        price = prod_div.find('span', class_='price')
        if price:
            price_text = price.get_text()
            price_num = re.search(r'(\d+[\d,]*)', price_text)
            if price_num:
                product['price'] = price_num.group(1).replace(',', '')
        
        # 提取标签
        tags = prod_div.find_all('span', class_='tag')
        if tags:
            product['tags'] = [t.get_text(strip=True) for t in tags]
        
        print(f"   {json.dumps(product, ensure_ascii=False)}")

# ============================================================
# 5. 总结
# ============================================================
print("\n" + "=" * 60)
print("提取总结")
print("=" * 60)
print("\n【数据提取方式】")
print("网站没有提供 JSON API，数据通过服务端渲染的 HTML 返回。")
print("需要使用 HTML 解析（正则或 BeautifulSoup）提取产品数据。")
print("\n【产品列表 URL】")
print("GET http://gz.cctpage.com/PC/TourLine/List")
print("参数:")
print("  - navid: 分类ID")
print("  - pageIndex: 页码（从1开始）")
print("  - pageSize: 每页数量")
print("  - destinationID: 目的地ID")
print("  - departureID: 出发地ID")
print("  - tipDay: 天数")
print("  - tripDate: 出发日期")
print("  - prodType: 产品类型")
print("\n【产品字段】")
print("  - prodCode: 产品代码")
print("  - title: 产品标题")
print("  - image: 产品图片URL")
print("  - price: 价格")
print("  - tags: 标签列表")
print("  - days: 天数")
