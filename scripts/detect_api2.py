#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
康辉旅行网站 API 探测脚本 - 第二阶段
重点分析 /PC/TourLine/List 端点和分页参数
"""

import requests
import re
import json
import sys
from urllib.parse import urljoin, parse_qs, urlparse
from bs4 import BeautifulSoup

BASE_URL = "http://gz.cctpage.com"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
    "Accept-Encoding": "gzip, deflate",
    "Connection": "keep-alive",
}

sys.stdout.reconfigure(encoding='utf-8')
session = requests.Session()
session.headers.update(HEADERS)

print("=" * 60)
print("康辉旅行网站 API 探测 - 第二阶段")
print("=" * 60)

# ============================================================
# 1. 分析 /PC/TourLine/List 页面的分页
# ============================================================
print("\n[1] 分析 /PC/TourLine/List 分页...")

def analyze_page(url, params):
    """分析页面内容，提取产品和分页信息"""
    try:
        resp = session.get(url, params=params, timeout=15)
        resp.encoding = 'gbk'
        html = resp.text
        soup = BeautifulSoup(html, 'html.parser')
        
        # 查找产品元素
        products = []
        # 尝试多种可能的产品选择器
        selectors = [
            '.product-item', '.tour-item', '.line-item', '.list-item',
            '.product', '.tour', '.line', '.item',
            '[class*="product"]', '[class*="tour"]', '[class*="line"]'
        ]
        
        for selector in selectors:
            elems = soup.select(selector)
            if elems:
                print(f"   选择器 '{selector}' 找到 {len(elems)} 个元素")
                if len(elems) <= 20:  # 只显示合理数量的产品
                    break
        
        # 查找分页
        pagination = soup.find_all('a', href=re.compile(r'pageIndex|page'))
        print(f"   分页链接数: {len(pagination)}")
        
        # 提取所有 pageIndex 值
        page_indices = re.findall(r'pageIndex=(\d+)', html)
        if page_indices:
            unique_pages = sorted(set(int(p) for p in page_indices))
            print(f"   页面中的 pageIndex 值: {unique_pages[:20]}")
        
        # 查找总页数
        total_match = re.search(r'共\s*(\d+)\s*页', html)
        if total_match:
            print(f"   总页数: {total_match.group(1)}")
        
        total_match2 = re.search(r'totalPages?["\']?\s*[:=]\s*(\d+)', html)
        if total_match2:
            print(f"   总页数(脚本): {total_match2.group(1)}")
        
        # 查找产品数量
        count_match = re.search(r'共\s*(\d+)\s*条', html)
        if count_match:
            print(f"   总产品数: {count_match.group(1)}")
        
        return html
    except Exception as e:
        print(f"   错误: {e}")
        return ""

# 测试不同 pageIndex
for page in [1, 2, 3]:
    print(f"\n--- pageIndex={page} ---")
    url = f"{BASE_URL}/PC/TourLine/List"
    html = analyze_page(url, {"navid": 6, "pageIndex": page})

# ============================================================
# 2. 检查页面中是否有 AJAX 加载更多
# ============================================================
print("\n[2] 检查 AJAX 加载机制...")

resp = session.get(f"{BASE_URL}/PC/TourLine/List?navid=6&pageIndex=1", timeout=15)
resp.encoding = 'gbk'
html = resp.text

# 查找所有 JavaScript 中的 URL
js_urls = re.findall(r'["\']([^"\']*\.(?:ashx|php|jsp|json)[^"\']*)["\']', html)
if js_urls:
    print(f"   发现动态端点: {list(set(js_urls))}")

# 查找 loadMore 相关
loadmore_patterns = [
    r'loadMore\s*\(\s*["\']([^"\']+)["\']',
    r'getMore\s*\(\s*["\']([^"\']+)["\']',
    r'url\s*:\s*["\']([^"\']*(?:Load|More|Ajax|Get)[^"\']*)["\']',
]

for pattern in loadmore_patterns:
    matches = re.findall(pattern, html, re.IGNORECASE)
    if matches:
        print(f"   发现加载端点: {matches}")

# 查找可能的分页请求函数
func_body_pattern = r'function\s+(\w*[Ll]oad\w*|\w*[Gg]et\w*[Ll]ist\w*|\w*[Aa]jax\w*)\s*\([^)]*\)\s*\{([^}]*(?:\{[^}]*\}[^}]*)*)\}'
functions = re.findall(func_body_pattern, html)
for func_name, func_body in functions[:5]:
    if len(func_body) > 50:
        print(f"   函数 {func_name}: {func_body[:300]}")

# ============================================================
# 3. 尝试 POST 到 /PC/TourLine/List 获取 JSON
# ============================================================
print("\n[3] 尝试 POST 请求获取 JSON...")

headers_ajax = {
    **HEADERS,
    "X-Requested-With": "XMLHttpRequest",
    "Accept": "application/json, text/javascript, */*; q=0.01",
    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
}

post_params = {
    "navid": 6,
    "pageIndex": 1,
    "pageSize": 10,
}

try:
    resp = session.post(f"{BASE_URL}/PC/TourLine/List", data=post_params, headers=headers_ajax, timeout=15)
    resp.encoding = 'gbk'
    print(f"   POST /PC/TourLine/List -> 状态码: {resp.status_code}")
    print(f"   Content-Type: {resp.headers.get('Content-Type')}")
    print(f"   内容长度: {len(resp.text)}")
    print(f"   内容前500字符: {resp.text[:500]}")
    
    # 尝试解析 JSON
    try:
        data = resp.json()
        print(f"   JSON 解析成功! 键: {list(data.keys()) if isinstance(data, dict) else '列表长度: ' + str(len(data))}")
    except:
        pass
        
except Exception as e:
    print(f"   错误: {e}")

# ============================================================
# 4. 尝试不同的参数组合
# ============================================================
print("\n[4] 尝试不同的参数组合...")

param_combos = [
    {"navid": 6},
    {"navid": 6, "pageIndex": 1},
    {"navid": 6, "pageIndex": 1, "pageSize": 10},
    {"navid": 6, "page": 1},
    {"navid": 6, "page": 1, "rows": 10},
    {"navid": 6, "currentPage": 1},
    {"ColumnID": 6, "pageIndex": 1},
    {"categoryId": 6, "pageIndex": 1},
]

for params in param_combos:
    try:
        resp = session.get(f"{BASE_URL}/PC/TourLine/List", params=params, timeout=10)
        resp.encoding = 'gbk'
        has_products = 'prodCode' in resp.text or '产品' in resp.text or 'price' in resp.text.lower()
        print(f"   {params} -> 状态码: {resp.status_code}, 含产品: {has_products}, 长度: {len(resp.text)}")
    except Exception as e:
        print(f"   {params} -> 错误: {e}")

# ============================================================
# 5. 检查页面源码中隐藏的数据
# ============================================================
print("\n[5] 检查页面中隐藏的数据...")

# 查找 JSON 数据
json_data_patterns = [
    r'var\s+\w*[Dd]ata\w*\s*=\s*(\{.*?\});',
    r'var\s+\w*[Ll]ist\w*\s*=\s*(\[.*?\]);',
    r'window\.__\w+__\s*=\s*(\{.*?\});',
]

for pattern in json_data_patterns:
    matches = re.findall(pattern, html, re.DOTALL)
    if matches:
        print(f"   发现隐藏数据 ({pattern[:40]}): {len(matches)} 个")
        for match in matches[:2]:
            print(f"     {match[:300]}")

# 查找 prodCode
prodcodes = re.findall(r'prodCode=([A-Z0-9]+)', html)
print(f"   发现 {len(prodcodes)} 个 prodCode")
print(f"   前10个: {prodcodes[:10]}")

# ============================================================
# 6. 检查是否有 API 返回产品列表
# ============================================================
print("\n[6] 检查可能的 API 端点...")

api_endpoints = [
    "/api/TourLine/GetTourLineList",
    "/api/TourLine/GetList",
    "/api/TourLine/List",
    "/api/Product/GetProductList",
    "/api/Product/GetList",
    "/ajax/TourLine/GetTourLineList",
    "/ajax/TourLine/GetList",
    "/ajax/Product/GetProductList",
    "/ajax/Product/GetList",
    "/PC/TourLine/GetTourLineList",
    "/PC/TourLine/GetList",
    "/PC/Product/GetProductList",
    "/PC/Product/GetList",
    "/data/TourLine/GetList",
    "/data/Product/GetList",
]

for endpoint in api_endpoints:
    try:
        url = urljoin(BASE_URL, endpoint)
        resp = session.get(url, params={"navid": 6, "pageIndex": 1}, timeout=10)
        if resp.status_code == 200 and len(resp.text) != 36710:  # 36710 是错误页面的大小
            print(f"   GET {endpoint} -> {resp.status_code}, 长度: {len(resp.text)}")
            if len(resp.text) < 1000:
                print(f"     内容: {resp.text[:300]}")
        
        resp = session.post(url, data={"navid": 6, "pageIndex": 1}, timeout=10)
        if resp.status_code == 200 and len(resp.text) != 36710:
            print(f"   POST {endpoint} -> {resp.status_code}, 长度: {len(resp.text)}")
            if len(resp.text) < 1000:
                print(f"     内容: {resp.text[:300]}")
                
    except Exception as e:
        pass

# ============================================================
# 7. 分析 oss.keeek.com 的 JS 文件
# ============================================================
print("\n[7] 分析外部 JS 文件...")

js_urls = [
    "https://oss.keeek.com/keeekmall/res/pc/js/common.js",
    "https://oss.keeek.com/keeekmall/res/pc/js/kklib.js",
]

for js_url in js_urls:
    try:
        resp = session.get(js_url, timeout=15)
        if resp.status_code == 200:
            js = resp.text
            print(f"   [{js_url.split('/')[-1]}] 大小: {len(js)}")
            
            # 查找 AJAX
            ajax_calls = re.findall(r'\$\.ajax\s*\(\s*\{[^}]*url\s*:\s*["\']([^"\']+)["\']', js)
            if ajax_calls:
                print(f"     $.ajax URL: {ajax_calls[:10]}")
            
            get_calls = re.findall(r'\$\.get\s*\(["\']([^"\']+)["\']', js)
            if get_calls:
                print(f"     $.get URL: {get_calls[:10]}")
            
            post_calls = re.findall(r'\$\.post\s*\(["\']([^"\']+)["\']', js)
            if post_calls:
                print(f"     $.post URL: {post_calls[:10]}")
            
            # 查找 TourLine 相关
            tourline_matches = re.findall(r'["\']([^"\']*TourLine[^"\']*)["\']', js)
            if tourline_matches:
                print(f"     TourLine 路径: {list(set(tourline_matches))[:10]}")
                
    except Exception as e:
        print(f"   [{js_url}] 错误: {e}")

# ============================================================
# 8. 尝试直接爬取产品详情页分析结构
# ============================================================
print("\n[8] 分析产品列表页结构...")

resp = session.get(f"{BASE_URL}/PC/TourLine/List?navid=6&pageIndex=1", timeout=15)
resp.encoding = 'gbk'
soup = BeautifulSoup(resp.text, 'html.parser')

# 查找产品列表容器
list_containers = [
    soup.find('div', class_=re.compile(r'list|product|tour|line')),
    soup.find('ul', class_=re.compile(r'list|product|tour|line')),
]

for container in list_containers:
    if container:
        items = container.find_all(['li', 'div'], recursive=False)
        print(f"   容器找到 {len(items)} 个直接子元素")
        if items:
            first_item = items[0]
            links = first_item.find_all('a', href=True)
            print(f"   第一个元素中的链接: {[a['href'] for a in links[:3]]}")
            imgs = first_item.find_all('img')
            print(f"   第一个元素中的图片: {[img.get('src', '') for img in imgs[:2]]}")

# 查找所有包含 prodCode 的链接
prod_links = soup.find_all('a', href=re.compile(r'prodCode='))
print(f"   找到 {len(prod_links)} 个产品链接")

# ============================================================
# 9. 总结
# ============================================================
print("\n" + "=" * 60)
print("第二阶段探测总结")
print("=" * 60)
print("关键发现:")
print("1. 有效的产品列表 URL: /PC/TourLine/List?navid=X&pageIndex=Y")
print("2. 分页参数: pageIndex")
print("3. 产品详情: /PC/TourLine/Details?prodCode=XXX")
print("4. 页面返回 HTML，需要解析 DOM 提取产品数据")
print("5. 未发现独立的 AJAX/JSON API 端点")
