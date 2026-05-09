#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
康辉旅行网站 API 探测脚本
目标：找到获取产品列表数据的 AJAX/API 接口
"""

import requests
import re
import json
import sys
from urllib.parse import urljoin, parse_qs, urlparse
from bs4 import BeautifulSoup

# 配置
BASE_URL = "http://gz.cctpage.com"
LIST_URL = "http://gz.cctpage.com/PC/Product/ColumnList"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
    "Accept-Encoding": "gzip, deflate",
    "Connection": "keep-alive",
}

# 设置编码
sys.stdout.reconfigure(encoding='utf-8')

session = requests.Session()
session.headers.update(HEADERS)

print("=" * 60)
print("康辉旅行网站 API 探测脚本")
print("=" * 60)

# ============================================================
# 1. 获取首页源码，分析 JavaScript
# ============================================================
print("\n[1] 获取首页源码并分析 JavaScript...")
try:
    resp = session.get(BASE_URL, timeout=15)
    resp.encoding = 'gbk'
    homepage_html = resp.text
    print(f"   首页状态码: {resp.status_code}, 内容长度: {len(homepage_html)}")
    
    # 查找所有 script src
    script_srcs = re.findall(r'<script[^>]+src=["\']([^"\']+)["\']', homepage_html)
    print(f"   发现 {len(script_srcs)} 个外部脚本")
    
    # 查找内联脚本中的 AJAX 调用
    inline_scripts = re.findall(r'<script[^>]*>(.*?)</script>', homepage_html, re.DOTALL)
    ajax_patterns = []
    for script in inline_scripts:
        # 查找 $.ajax, $.get, $.post, fetch, XMLHttpRequest 等
        if any(kw in script for kw in ['$.ajax', '$.get', '$.post', 'fetch(', 'XMLHttpRequest', '.load(']):
            ajax_patterns.append(script[:500])
        # 查找 /api/, /ajax/, /data/ 路径
        api_matches = re.findall(r'["\']([^"\']*(?:/api/|/ajax/|/data/)[^"\']*)["\']', script)
        if api_matches:
            print(f"   发现 API 路径: {api_matches}")
    
    if ajax_patterns:
        print(f"   发现 {len(ajax_patterns)} 个包含 AJAX 的内联脚本片段")
        for i, pat in enumerate(ajax_patterns[:3]):
            print(f"   --- 片段 {i+1} ---")
            print(f"   {pat[:400]}")
    
    # 查找所有 URL 模式
    all_urls = re.findall(r'["\']([^"\']*/PC/[^"\']*)["\']', homepage_html)
    unique_urls = list(set(all_urls))
    print(f"   发现 {len(unique_urls)} 个 /PC/ 路径:")
    for url in unique_urls[:20]:
        print(f"     {url}")
        
except Exception as e:
    print(f"   错误: {e}")

# ============================================================
# 2. 获取产品列表页源码
# ============================================================
print("\n[2] 获取产品列表页源码...")
try:
    resp = session.get(f"{LIST_URL}?navid=6", timeout=15)
    resp.encoding = 'gbk'
    list_html = resp.text
    print(f"   列表页状态码: {resp.status_code}, 内容长度: {len(list_html)}")
    
    # 查找所有 script src
    script_srcs = re.findall(r'<script[^>]+src=["\']([^"\']+)["\']', list_html)
    print(f"   发现 {len(script_srcs)} 个外部脚本")
    for src in script_srcs:
        print(f"     {src}")
    
    # 查找内联脚本
    inline_scripts = re.findall(r'<script[^>]*>(.*?)</script>', list_html, re.DOTALL)
    print(f"   发现 {len(inline_scripts)} 个内联脚本")
    
    ajax_found = False
    for i, script in enumerate(inline_scripts):
        if any(kw in script for kw in ['$.ajax', '$.get', '$.post', 'fetch(', 'XMLHttpRequest', 'loadMore', 'getList', 'getData']):
            ajax_found = True
            print(f"   --- 内联脚本 {i+1} (含AJAX) ---")
            print(f"   {script[:800]}")
            print()
    
    if not ajax_found:
        print("   未在内联脚本中发现明显的 AJAX 调用")
    
    # 查找所有 /api/, /ajax/, /data/ 路径
    api_paths = re.findall(r'["\']([^"\']*(?:/api/|/ajax/|/data/)[^"\']*)["\']', list_html)
    if api_paths:
        print(f"   发现 API 路径: {list(set(api_paths))}")
    
    # 查找所有 URL
    all_urls = re.findall(r'["\']([^"\']*/PC/[^"\']*)["\']', list_html)
    unique_urls = list(set(all_urls))
    print(f"   发现 {len(unique_urls)} 个 /PC/ 路径:")
    for url in unique_urls[:30]:
        print(f"     {url}")
        
except Exception as e:
    print(f"   错误: {e}")

# ============================================================
# 3. 尝试获取外部 JS 文件分析
# ============================================================
print("\n[3] 分析外部 JS 文件...")
try:
    # 获取主要的 JS 文件
    js_files = [
        "/Scripts/jquery.min.js",
        "/Scripts/common.js",
        "/Scripts/product.js",
        "/Scripts/list.js",
        "/Scripts/app.js",
    ]
    
    for js_file in js_files:
        try:
            js_url = urljoin(BASE_URL, js_file)
            resp = session.get(js_url, timeout=10)
            if resp.status_code == 200:
                js_content = resp.text
                print(f"   [{js_file}] 大小: {len(js_content)}")
                
                # 查找 AJAX 调用
                ajax_calls = re.findall(r'\$\.ajax\s*\(\s*\{[^}]+\}', js_content)
                get_calls = re.findall(r'\$\.get\s*\(["\']([^"\']+)["\']', js_content)
                post_calls = re.findall(r'\$\.post\s*\(["\']([^"\']+)["\']', js_content)
                
                if ajax_calls:
                    print(f"     $.ajax 调用: {len(ajax_calls)} 个")
                    for call in ajax_calls[:3]:
                        print(f"       {call[:200]}")
                if get_calls:
                    print(f"     $.get 调用: {get_calls[:5]}")
                if post_calls:
                    print(f"     $.post 调用: {post_calls[:5]}")
                    
                # 查找 API 端点
                api_matches = re.findall(r'["\']([^"\']*(?:/api/|/ajax/|/data/)[^"\']*)["\']', js_content)
                if api_matches:
                    print(f"     API 路径: {list(set(api_matches))[:10]}")
                    
                # 查找 navid 相关
                navid_matches = re.findall(r'navid[=:][^\s,;})]+', js_content)
                if navid_matches:
                    print(f"     navid 相关: {navid_matches[:5]}")
                    
        except Exception as e:
            print(f"   [{js_file}] 错误: {e}")
            
except Exception as e:
    print(f"   错误: {e}")

# ============================================================
# 4. 尝试各种 API 端点
# ============================================================
print("\n[4] 尝试各种 API 端点...")

endpoints_to_try = [
    "/api/Product/GetList",
    "/api/Product/GetColumnList",
    "/api/Product/List",
    "/ajax/Product/GetList",
    "/ajax/Product/GetColumnList",
    "/PC/Product/GetList",
    "/PC/Product/GetColumnList",
    "/PC/Product/AjaxList",
    "/PC/Product/LoadMore",
    "/data/Product/GetList",
    "/data/Product/List",
    "/Product/GetList",
    "/Product/List",
    "/api/TourLine/GetList",
    "/ajax/TourLine/GetList",
    "/PC/TourLine/List",
    "/PC/TourLine/GetList",
    "/api/Column/GetList",
    "/ajax/Column/GetList",
]

for endpoint in endpoints_to_try:
    try:
        url = urljoin(BASE_URL, endpoint)
        # 尝试 GET
        resp = session.get(url, params={"navid": 6, "page": 1, "size": 10}, timeout=10)
        if resp.status_code != 404:
            print(f"   GET {endpoint} -> {resp.status_code}, 内容长度: {len(resp.text)}")
            if len(resp.text) < 500:
                print(f"     内容: {resp.text[:200]}")
            
        # 尝试 POST
        resp = session.post(url, data={"navid": 6, "page": 1, "size": 10}, timeout=10)
        if resp.status_code != 404:
            print(f"   POST {endpoint} -> {resp.status_code}, 内容长度: {len(resp.text)}")
            if len(resp.text) < 500:
                print(f"     内容: {resp.text[:200]}")
                
    except Exception as e:
        pass  # 忽略错误

# ============================================================
# 5. 检查产品列表页的分页和参数
# ============================================================
print("\n[5] 检查产品列表页的分页和参数...")
try:
    # 尝试不同的参数
    params_to_try = [
        {"navid": 6, "page": 1},
        {"navid": 6, "pageIndex": 1},
        {"navid": 6, "p": 1},
        {"navid": 6, "currentPage": 1},
        {"navid": 6, "page": 1, "size": 10},
        {"navid": 6, "page": 1, "pageSize": 10},
        {"navid": 6, "page": 1, "rows": 10},
        {"navid": 6, "page": 2},
        {"navid": 6, "type": 1},
        {"id": 6},
        {"columnId": 6},
        {"categoryId": 6},
    ]
    
    for params in params_to_try:
        try:
            resp = session.get(LIST_URL, params=params, timeout=10)
            resp.encoding = 'gbk'
            content = resp.text
            # 检查是否包含产品数据
            has_products = '产品' in content or 'price' in content.lower() or '￥' in content or '¥' in content
            print(f"   参数 {params} -> 状态码: {resp.status_code}, 含产品: {has_products}, 长度: {len(content)}")
        except Exception as e:
            print(f"   参数 {params} -> 错误: {e}")
            
except Exception as e:
    print(f"   错误: {e}")

# ============================================================
# 6. 检查其他产品列表 URL
# ============================================================
print("\n[6] 检查其他产品列表 URL...")

other_urls = [
    "/PC/TourLine/List",
    "/PC/TourLine/Index",
    "/PC/Product/List",
    "/PC/Product/Index",
    "/PC/Line/List",
    "/PC/Line/Index",
    "/Product/List",
    "/Product/Index",
    "/TourLine/List",
    "/TourLine/Index",
    "/Line/List",
    "/Line/Index",
]

for url_path in other_urls:
    try:
        url = urljoin(BASE_URL, url_path)
        resp = session.get(url, params={"navid": 6}, timeout=10)
        resp.encoding = 'gbk'
        content = resp.text
        has_products = '产品' in content or 'price' in content.lower() or '￥' in content or '¥' in content
        print(f"   {url_path} -> 状态码: {resp.status_code}, 含产品: {has_products}, 长度: {len(content)}")
        if has_products and len(content) < 10000:
            print(f"     内容预览: {content[:300]}")
    except Exception as e:
        print(f"   {url_path} -> 错误: {e}")

# ============================================================
# 7. 分析产品列表页的分页元素
# ============================================================
print("\n[7] 分析产品列表页的分页元素...")
try:
    resp = session.get(f"{LIST_URL}?navid=6", timeout=15)
    resp.encoding = 'gbk'
    soup = BeautifulSoup(resp.text, 'html.parser')
    
    # 查找分页链接
    pagination = soup.find_all('a', href=re.compile(r'page|Page|p='))
    print(f"   发现 {len(pagination)} 个分页链接")
    for link in pagination[:10]:
        print(f"     {link.get('href')} - {link.get_text(strip=True)}")
    
    # 查找所有链接
    all_links = soup.find_all('a', href=True)
    pc_links = [link for link in all_links if '/PC/' in link.get('href', '')]
    print(f"   发现 {len(pc_links)} 个 /PC/ 链接")
    for link in pc_links[:20]:
        print(f"     {link.get('href')} - {link.get_text(strip=True)[:50]}")
    
    # 查找表单
    forms = soup.find_all('form')
    print(f"   发现 {len(forms)} 个表单")
    for form in forms:
        print(f"     action: {form.get('action')}, method: {form.get('method')}")
        inputs = form.find_all('input')
        for inp in inputs:
            print(f"       input: name={inp.get('name')}, value={inp.get('value')}")
    
    # 查找 data-* 属性
    data_elements = soup.find_all(attrs={"data-url": True})
    print(f"   发现 {len(data_elements)} 个 data-url 元素")
    for elem in data_elements[:10]:
        print(f"     {elem.get('data-url')}")
        
except Exception as e:
    print(f"   错误: {e}")

# ============================================================
# 8. 尝试检测动态加载
# ============================================================
print("\n[8] 尝试检测动态加载机制...")
try:
    # 检查是否有 XHR 相关的全局变量或函数
    resp = session.get(LIST_URL + "?navid=6", timeout=15)
    resp.encoding = 'gbk'
    html = resp.text
    
    # 查找 loadMore, getMore, loadData 等函数
    func_patterns = [
        r'function\s+(loadMore|getMore|loadData|getData|loadList|getList|ajaxLoad)\s*\(',
        r'var\s+(loadMore|getMore|loadData|getData|loadList|getList|ajaxLoad)\s*=',
        r'(loadMore|getMore|loadData|getData|loadList|getList|ajaxLoad)\s*[:=]\s*function',
    ]
    
    for pattern in func_patterns:
        matches = re.findall(pattern, html)
        if matches:
            print(f"   发现函数: {matches}")
    
    # 查找 onclick 事件
    onclick_elements = re.findall(r'onclick=["\']([^"\']+)["\']', html)
    ajax_onclicks = [oc for oc in onclick_elements if any(kw in oc for kw in ['ajax', 'load', 'get', 'post'])]
    if ajax_onclicks:
        print(f"   发现 AJAX 相关的 onclick: {ajax_onclicks[:10]}")
    
    # 查找可能的分页参数
    page_params = re.findall(r'(page|Page|pageIndex|currentPage|p)\s*[=:]\s*(\d+)', html)
    if page_params:
        print(f"   发现分页参数: {page_params[:10]}")
        
except Exception as e:
    print(f"   错误: {e}")

# ============================================================
# 9. 尝试不同的 Content-Type 请求
# ============================================================
print("\n[9] 尝试不同的请求头...")
try:
    # 尝试 JSON 请求
    headers_json = {
        **HEADERS,
        "X-Requested-With": "XMLHttpRequest",
        "Accept": "application/json, text/javascript, */*; q=0.01",
    }
    resp = session.get(LIST_URL, params={"navid": 6}, headers=headers_json, timeout=10)
    resp.encoding = 'gbk'
    print(f"   AJAX 请求 -> 状态码: {resp.status_code}, 内容类型: {resp.headers.get('Content-Type')}, 长度: {len(resp.text)}")
    
    # 尝试 POST JSON
    headers_post = {
        **HEADERS,
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "X-Requested-With": "XMLHttpRequest",
    }
    resp = session.post(LIST_URL, data={"navid": 6, "page": 1}, headers=headers_post, timeout=10)
    resp.encoding = 'gbk'
    print(f"   POST AJAX -> 状态码: {resp.status_code}, 内容类型: {resp.headers.get('Content-Type')}, 长度: {len(resp.text)}")
    if len(resp.text) < 500:
        print(f"     内容: {resp.text[:300]}")
        
except Exception as e:
    print(f"   错误: {e}")

# ============================================================
# 10. 总结发现
# ============================================================
print("\n" + "=" * 60)
print("探测总结")
print("=" * 60)
print("请查看上面的输出，寻找以下线索：")
print("1. 状态码为 200 且返回数据（非HTML）的端点")
print("2. 包含 '$.ajax', '$.get', '$.post', 'fetch' 的脚本")
print("3. 包含 /api/, /ajax/, /data/ 的路径")
print("4. 分页参数（page, pageIndex, p 等）")
print("5. 其他产品列表 URL")
