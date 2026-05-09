#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
康辉旅行网站 API 探测脚本 - 第四阶段
直接保存 HTML 到文件进行分析，避免编码问题
"""

import requests
import re
import sys
from urllib.parse import urljoin

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
print("康辉旅行网站 API 探测 - 第四阶段")
print("=" * 60)

# ============================================================
# 1. 获取并保存原始 HTML
# ============================================================
print("\n[1] 获取并保存原始 HTML...")

resp = session.get(f"{BASE_URL}/PC/TourLine/List?navid=6&pageIndex=1", timeout=15)
print(f"   状态码: {resp.status_code}")
print(f"   Content-Type: {resp.headers.get('Content-Type')}")
print(f"   原始编码: {resp.encoding}")
print(f"    apparent_encoding: {resp.apparent_encoding}")

# 保存原始字节
with open('d:/react/app/scripts/tourline_raw.html', 'wb') as f:
    f.write(resp.content)
print(f"   原始内容已保存到 tourline_raw.html, 大小: {len(resp.content)}")

# 使用 GBK 解码
try:
    html_gbk = resp.content.decode('gbk')
    with open('d:/react/app/scripts/tourline_gbk.html', 'w', encoding='utf-8') as f:
        f.write(html_gbk)
    print(f"   GBK解码内容已保存到 tourline_gbk.html, 大小: {len(html_gbk)}")
except Exception as e:
    print(f"   GBK解码错误: {e}")

# ============================================================
# 2. 分析原始 HTML 中的产品数据
# ============================================================
print("\n[2] 分析原始 HTML 中的产品数据...")

# 使用 GBK 解码后的内容
html = resp.content.decode('gbk', errors='ignore')

# 查找 prodCode
prodcodes = re.findall(r'prodCode=([A-Z0-9]+)', html)
print(f"   找到 {len(prodcodes)} 个 prodCode")
print(f"   前20个: {prodcodes[:20]}")

# 查找产品名称
titles = re.findall(r'<h[1-6][^>]*>([^<]+)</h[1-6]>', html)
print(f"   找到 {len(titles)} 个标题")
for t in titles[:10]:
    print(f"     {t.strip()}")

# 查找价格
prices = re.findall(r'[¥￥]\s*(\d+[\d,]*)', html)
print(f"   找到 {len(prices)} 个价格")
for p in prices[:10]:
    print(f"     ¥{p}")

# 查找所有链接
all_links = re.findall(r'href=["\']([^"\']+)["\']', html)
tourline_links = [l for l in all_links if 'TourLine' in l]
print(f"   找到 {len(tourline_links)} 个 TourLine 链接")
for l in tourline_links[:20]:
    print(f"     {l}")

# ============================================================
# 3. 查找产品列表的 HTML 结构
# ============================================================
print("\n[3] 查找产品列表的 HTML 结构...")

# 查找产品相关的 class
product_classes = re.findall(r'class=["\']([^"\']*(?:product|tour|line|item|list)[^"\']*)["\']', html, re.IGNORECASE)
unique_classes = list(set(product_classes))
print(f"   找到 {len(unique_classes)} 个唯一的产品相关 class")
for c in unique_classes[:30]:
    print(f"     {c}")

# ============================================================
# 4. 提取完整的产品卡片 HTML
# ============================================================
print("\n[4] 提取产品卡片 HTML...")

# 尝试找到产品卡片的模式
# 通常产品卡片包含图片、标题、价格、prodCode

# 方法: 找到第一个 prodCode，然后提取周围的 HTML
if prodcodes:
    first_prod = prodcodes[0]
    idx = html.find(f'prodCode={first_prod}')
    if idx > 0:
        # 提取前后500字符
        context = html[max(0, idx-500):min(len(html), idx+500)]
        print(f"   产品 {first_prod} 周围的 HTML:")
        print(f"   {context}")

# ============================================================
# 5. 检查是否有 script 包含产品数据
# ============================================================
print("\n[5] 检查 script 中的产品数据...")

scripts = re.findall(r'<script[^>]*>(.*?)</script>', html, re.DOTALL)
print(f"   找到 {len(scripts)} 个 script 标签")

for i, script in enumerate(scripts):
    if len(script) > 100:
        # 查找可能的 JSON 数据
        if 'prodCode' in script or 'product' in script.lower() or 'tour' in script.lower():
            print(f"\n   --- Script {i+1} (长度: {len(script)}) ---")
            print(f"   {script[:500]}")

# ============================================================
# 6. 检查是否有 AJAX 端点
# ============================================================
print("\n[6] 检查 AJAX 端点...")

# 查找所有 URL 模式
urls = re.findall(r'["\']([^"\']*(?:/api/|/ajax/|/data/)[^"\']*)["\']', html)
unique_urls = list(set(urls))
print(f"   找到 {len(unique_urls)} 个 API/AJAX URL")
for u in unique_urls:
    print(f"     {u}")

# 查找 $.ajax, $.get, $.post
ajax_patterns = re.findall(r'\$\.(?:ajax|get|post)\s*\([^)]*\)', html)
print(f"   找到 {len(ajax_patterns)} 个 AJAX 调用")
for p in ajax_patterns[:10]:
    print(f"     {p[:200]}")

# ============================================================
# 7. 尝试找到分页信息
# ============================================================
print("\n[7] 分页信息...")

# 查找 pageIndex
page_indices = re.findall(r'pageIndex=(\d+)', html)
if page_indices:
    unique_pages = sorted(set(int(p) for p in page_indices))
    print(f"   页面中的 pageIndex: {unique_pages[:20]}")
    if unique_pages:
        print(f"   最大页码: {max(unique_pages)}")

# 查找总页数
total_pages = re.findall(r'共\s*(\d+)\s*页', html)
if total_pages:
    print(f"   总页数: {total_pages[0]}")

# 查找总记录数
total_records = re.findall(r'共\s*(\d+)\s*条', html)
if total_records:
    print(f"   总记录数: {total_records[0]}")

# ============================================================
# 8. 测试 pageIndex=2
# ============================================================
print("\n[8] 测试 pageIndex=2...")

resp2 = session.get(f"{BASE_URL}/PC/TourLine/List?navid=6&pageIndex=2", timeout=15)
html2 = resp2.content.decode('gbk', errors='ignore')
prodcodes2 = re.findall(r'prodCode=([A-Z0-9]+)', html2)
print(f"   pageIndex=2 的产品数: {len(prodcodes2)}")
print(f"   前10个: {prodcodes2[:10]}")

# 比较两页是否有重复
if prodcodes and prodcodes2:
    common = set(prodcodes) & set(prodcodes2)
    print(f"   两页重复产品数: {len(common)}")
    if common:
        print(f"   重复: {list(common)[:5]}")

# ============================================================
# 9. 最终总结
# ============================================================
print("\n" + "=" * 60)
print("第四阶段探测总结")
print("=" * 60)
print(f"\n产品列表页: /PC/TourLine/List?navid={{navid}}&pageIndex={{page}}")
print(f"每页产品数: 约 {len(prodcodes)} 个")
print(f"产品详情页: /PC/TourLine/Details?prodCode={{prodCode}}")
print(f"\nHTML 文件已保存到:")
print(f"  - d:/react/app/scripts/tourline_raw.html (原始字节)")
print(f"  - d:/react/app/scripts/tourline_gbk.html (UTF-8编码)")
