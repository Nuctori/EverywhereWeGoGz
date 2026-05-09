#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
康辉旅行网站 API 探测脚本 - 第三阶段
深入分析 HTML 结构，提取产品数据，检查是否有其他数据接口
"""

import requests
import re
import json
import sys
from urllib.parse import urljoin
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
print("康辉旅行网站 API 探测 - 第三阶段")
print("=" * 60)

# ============================================================
# 1. 深入分析产品列表 HTML 结构
# ============================================================
print("\n[1] 深入分析产品列表 HTML 结构...")

resp = session.get(f"{BASE_URL}/PC/TourLine/List?navid=6&pageIndex=1", timeout=15)
resp.encoding = 'gbk'
html = resp.text
soup = BeautifulSoup(html, 'html.parser')

# 查找产品列表 - 尝试找到正确的产品容器
print("   查找产品列表容器...")

# 方法1: 查找包含产品图片的容器
product_imgs = soup.find_all('img', src=re.compile(r'product|tour|line|upload'))
print(f"   找到 {len(product_imgs)} 个产品相关图片")

# 方法2: 查找所有 class 包含 product 的元素
all_products = soup.find_all(class_=re.compile(r'product'))
print(f"   找到 {len(all_products)} 个 class 含 product 的元素")

# 方法3: 直接分析 HTML 中的产品区域
# 查找可能的产品列表父元素
possible_parents = soup.find_all(['div', 'ul', 'section'], class_=re.compile(r'list|content|main|body'))
print(f"   找到 {len(possible_parents)} 个可能的列表容器")

# 方法4: 查找包含价格信息的元素
price_elems = soup.find_all(text=re.compile(r'[¥￥]\d+'))
print(f"   找到 {len(price_elems)} 个含价格的文本节点")

# 方法5: 直接搜索 prodCode
prodcodes = re.findall(r'prodCode[=:]([A-Z0-9]+)', html)
print(f"   找到 {len(prodcodes)} 个 prodCode")

# 方法6: 查找 Details 链接
details_links = re.findall(r'/PC/TourLine/Details\?prodCode=([A-Z0-9]+)', html)
print(f"   找到 {len(details_links)} 个产品详情链接")
print(f"   前10个 prodCode: {details_links[:10]}")

# ============================================================
# 2. 提取完整产品信息
# ============================================================
print("\n[2] 提取产品信息...")

# 查找产品卡片 - 通过分析 HTML 结构
# 通常产品在一个容器内，包含图片、标题、价格等

# 尝试通过 Details 链接找到产品卡片
for prod_code in details_links[:3]:
    # 查找包含此 prodCode 的元素
    elem = soup.find('a', href=re.compile(rf'prodCode={prod_code}'))
    if elem:
        # 向上查找父元素
        parent = elem
        for _ in range(5):
            parent = parent.parent
            if parent and parent.name in ['div', 'li', 'article']:
                # 检查是否包含价格
                text = parent.get_text()
                if '¥' in text or '￥' in text or '元' in text:
                    print(f"\n   产品 {prod_code} 的容器:")
                    print(f"   标签: {parent.name}, class: {parent.get('class')}")
                    print(f"   文本预览: {text[:200]}")
                    break

# ============================================================
# 3. 检查是否有其他参数可以过滤产品
# ============================================================
print("\n[3] 检查过滤参数...")

# 从页面中提取所有过滤链接
filter_links = re.findall(r'/PC/TourLine/List\?([^"\'\s]+)', html)
print(f"   找到 {len(filter_links)} 个过滤链接")

# 分析参数
all_params = {}
for link in filter_links[:50]:
    from urllib.parse import parse_qs
    params = parse_qs(link)
    for key, values in params.items():
        if key not in all_params:
            all_params[key] = set()
        all_params[key].update(values)

print("   发现的参数:")
for key, values in all_params.items():
    values_list = list(values)[:10]
    print(f"     {key}: {values_list}")

# ============================================================
# 4. 测试不同 navid
# ============================================================
print("\n[4] 测试不同 navid...")

for navid in [1, 2, 3, 6, 10, 50, 100, 200, 251, 252, 253]:
    try:
        resp = session.get(f"{BASE_URL}/PC/TourLine/List", params={"navid": navid, "pageIndex": 1}, timeout=10)
        resp.encoding = 'gbk'
        prodcodes = re.findall(r'/PC/TourLine/Details\?prodCode=([A-Z0-9]+)', resp.text)
        print(f"   navid={navid}: {len(prodcodes)} 个产品")
    except Exception as e:
        print(f"   navid={navid}: 错误 {e}")

# ============================================================
# 5. 检查 /PC/Product/ColumnList 端点
# ============================================================
print("\n[5] 检查 /PC/Product/ColumnList 端点...")

resp = session.get(f"{BASE_URL}/PC/Product/ColumnList?navid=6", timeout=15)
resp.encoding = 'gbk'
html2 = resp.text

prodcodes2 = re.findall(r'/PC/TourLine/Details\?prodCode=([A-Z0-9]+)', html2)
print(f"   ColumnList 页面产品数: {len(prodcodes2)}")

# 比较两个页面的产品
if prodcodes2:
    print(f"   前10个: {prodcodes2[:10]}")

# ============================================================
# 6. 尝试找到 JSON 数据源
# ============================================================
print("\n[6] 尝试找到 JSON 数据源...")

# 检查是否有 script type="application/json"
json_scripts = soup.find_all('script', type='application/json')
print(f"   找到 {len(json_scripts)} 个 application/json 脚本")

# 检查是否有 data 属性包含 JSON
data_attrs = []
for elem in soup.find_all(attrs=True):
    for attr, value in elem.attrs.items():
        if attr.startswith('data-') and value and ('{' in str(value) or '[' in str(value)):
            data_attrs.append((elem.name, attr, str(value)[:100]))
print(f"   找到 {len(data_attrs)} 个含 JSON 的 data 属性")
for tag, attr, val in data_attrs[:5]:
    print(f"     <{tag}> {attr}={val}")

# ============================================================
# 7. 检查是否有 API 端点返回产品数据
# ============================================================
print("\n[7] 检查 API 端点...")

# 尝试一些可能的端点
endpoints = [
    "/api/TourLine/GetTourLines",
    "/api/TourLine/GetTourLineListByNavid",
    "/api/TourLine/GetTourLineList",
    "/api/Product/GetProducts",
    "/api/Product/GetProductList",
    "/ajax/TourLine/GetTourLines",
    "/ajax/TourLine/GetTourLineList",
    "/ajax/Product/GetProducts",
    "/PC/TourLine/GetTourLines",
    "/PC/TourLine/GetTourLineList",
    "/PC/Product/GetProducts",
    "/data/TourLine/GetTourLines",
    "/data/Product/GetProducts",
]

for endpoint in endpoints:
    try:
        url = urljoin(BASE_URL, endpoint)
        resp = session.get(url, params={"navid": 6, "pageIndex": 1, "pageSize": 10}, timeout=10)
        if resp.status_code == 200:
            content_type = resp.headers.get('Content-Type', '')
            if 'json' in content_type or (len(resp.text) > 100 and len(resp.text) < 50000 and resp.text[0] in '{['):
                print(f"   {endpoint} -> 状态码: {resp.status_code}, Content-Type: {content_type}")
                print(f"     内容: {resp.text[:500]}")
    except Exception as e:
        pass

# ============================================================
# 8. 检查搜索功能
# ============================================================
print("\n[8] 检查搜索功能...")

try:
    resp = session.get(f"{BASE_URL}/search/测试", timeout=10)
    resp.encoding = 'gbk'
    print(f"   搜索页面状态码: {resp.status_code}, 长度: {len(resp.text)}")
    
    # 查找搜索API
    search_api = re.findall(r'["\']([^"\']*search[^"\']*\.(?:ashx|php|json))["\']', resp.text)
    if search_api:
        print(f"   搜索API: {search_api}")
except Exception as e:
    print(f"   错误: {e}")

# ============================================================
# 9. 最终总结
# ============================================================
print("\n" + "=" * 60)
print("最终探测总结")
print("=" * 60)
print("\n【发现的接口】")
print("1. 产品列表页面（HTML）:")
print("   GET http://gz.cctpage.com/PC/TourLine/List?navid={navid}&pageIndex={page}")
print("   参数:")
print("     - navid: 分类ID（如 6）")
print("     - pageIndex: 页码（从1开始）")
print("     - pageSize: 每页数量（可选，默认10）")
print("     - destinationID: 目的地ID（可选）")
print("     - departureID: 出发地ID（可选）")
print("     - tipDay: 天数（可选）")
print("     - tripDate: 出发日期（可选）")
print("     - prodType: 产品类型（可选，如'国内当地'、'国内长线'、'出境游'、'入境游'）")
print("")
print("2. 产品详情页面:")
print("   GET http://gz.cctpage.com/PC/TourLine/Details?prodCode={prodCode}")
print("")
print("3. 栏目列表页面:")
print("   GET http://gz.cctpage.com/PC/Product/ColumnList?navid={navid}")
print("")
print("【重要发现】")
print("- 网站没有独立的 AJAX/JSON API 接口")
print("- 所有数据通过服务端渲染的 HTML 返回")
print("- 需要从 HTML 中解析提取产品数据")
print("- 编码为 GBK，需要正确设置编码")
print("- 每页约10条产品，支持 pageIndex 分页")
print("- 总页数可以从分页链接中推断（如 pageIndex=115 表示有115页）")
