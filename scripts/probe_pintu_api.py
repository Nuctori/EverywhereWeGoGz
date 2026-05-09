#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
品途API探测
"""

import requests
import re
import json

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Accept": "application/json, text/plain, */*",
    "X-Requested-With": "XMLHttpRequest",
}

BASE_URL = "http://gz.ptotour.com"

session = requests.Session()
session.headers.update(HEADERS)

# 1. 检查是否有API端点
print("=== 品途API探测 ===")

# 尝试常见的API路径
api_paths = [
    "/api/line/list",
    "/ajax/line/list",
    "/data/line/list",
    "/api/product/list",
    "/ajax/product/list",
    "/api/tour/list",
    "/ajax/tour/list",
]

for path in api_paths:
    try:
        resp = session.get(f"{BASE_URL}{path}", timeout=5)
        print(f"  GET {path}: {resp.status_code}")
    except:
        pass
    
    try:
        resp = session.post(f"{BASE_URL}{path}", data={"page": "1"}, timeout=5)
        print(f"  POST {path}: {resp.status_code}")
    except:
        pass

# 2. 检查list.aspx页面源码中的API调用
print("\n=== 检查页面源码 ===")
resp = session.get(f"{BASE_URL}/line/list.aspx", params={"cid": "guangzhou", "tid": "domestic", "page": "1"}, timeout=15)
html = resp.text

# 查找script中的API调用
scripts = re.findall(r'<script[^>]*>(.*?)</script>', html, re.DOTALL)
for script in scripts:
    if 'ajax' in script.lower() or 'fetch' in script.lower() or 'api' in script.lower():
        # 提取URL
        urls = re.findall(r'[\"\']([^\"\']*(?:ajax|api|data)[^\"\']*)[\"\']', script)
        if urls:
            print(f"  发现API URL: {urls}")

# 3. 尝试POST到list.aspx
print("\n=== 尝试POST ===")
resp = session.post(f"{BASE_URL}/line/list.aspx", data={"cid": "guangzhou", "tid": "domestic", "page": "2"}, timeout=15)
print(f"POST list.aspx: {resp.status_code}, content-type: {resp.headers.get('Content-Type', 'unknown')}")
if 'json' in resp.headers.get('Content-Type', ''):
    try:
        data = resp.json()
        print(f"JSON数据: {len(data)}项")
    except:
        pass

# 4. 检查是否有隐藏的分页参数
print("\n=== 检查分页参数 ===")
# 查找form中的隐藏字段
hidden_fields = re.findall(r'<input[^>]+type=["\']hidden["\'][^>]+name=["\']([^"\']+)["\'][^>]+value=["\']([^"\']*)["\']', html)
for name, value in hidden_fields[:10]:
    print(f"  hidden: {name}={value}")

# 5. 检查cookie
print("\n=== Cookie ===")
for cookie in session.cookies:
    print(f"  {cookie.name}={cookie.value[:30] if len(cookie.value) > 30 else cookie.value}")
