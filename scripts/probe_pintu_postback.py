#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
品途POST回发探测 - ASP.NET WebForms
"""

import requests
import re
from bs4 import BeautifulSoup

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Content-Type": "application/x-www-form-urlencoded",
}

BASE_URL = "http://gz.ptotour.com"

session = requests.Session()
session.headers.update(HEADERS)

# 1. 获取第一页，提取ViewState和EventValidation
print("=== 品途POST回发探测 ===")
resp = session.get(f"{BASE_URL}/line/list.aspx", params={"cid": "guangzhou", "tid": "domestic"}, timeout=15)
html = resp.text
soup = BeautifulSoup(html, 'lxml')

viewstate = soup.find('input', {'name': '__VIEWSTATE'})
viewstate_gen = soup.find('input', {'name': '__VIEWSTATEGENERATOR'})
event_validation = soup.find('input', {'name': '__EVENTVALIDATION'})

print(f"VIEWSTATE: {viewstate['value'][:50] if viewstate else 'not found'}...")
print(f"VIEWSTATEGENERATOR: {viewstate_gen['value'] if viewstate_gen else 'not found'}")
print(f"EVENTVALIDATION: {event_validation['value'][:50] if event_validation else 'not found'}...")

# 2. 查找分页控件
print("\n=== 分页控件 ===")
# 查找包含页码的元素
page_links = soup.find_all('a', href=True)
for link in page_links:
    text = link.get_text(strip=True)
    if text.isdigit() or '下一页' in text or '上一页' in text:
        print(f"  页码链接: {text} -> {link.get('href', 'no href')}")

# 查找javascript分页
scripts = soup.find_all('script')
for script in scripts:
    text = script.get_text()
    if 'page' in text and ('__doPostBack' in text or 'postback' in text.lower()):
        print(f"  发现postback脚本")
        # 提取__doPostBack参数
        postbacks = re.findall(r"__doPostBack\('([^']+)','([^']*)'\)", text)
        for pb in postbacks[:5]:
            print(f"    __doPostBack('{pb[0]}', '{pb[1]}')")

# 3. 尝试POST回发翻页
print("\n=== 尝试POST回发 ===")
if viewstate and viewstate_gen:
    data = {
        "__VIEWSTATE": viewstate['value'],
        "__VIEWSTATEGENERATOR": viewstate_gen['value'],
        "__EVENTVALIDATION": event_validation['value'] if event_validation else "",
        "__EVENTTARGET": "",  # 分页控件的target
        "__EVENTARGUMENT": "",
        "cid": "guangzhou",
        "tid": "domestic",
    }
    
    # 尝试不同的EVENTTARGET
    for target in ["", "ctl00$ContentPlaceHolder1$Pager1$lnkNext", "Pager1", "pager"]:
        test_data = data.copy()
        test_data["__EVENTTARGET"] = target
        resp = session.post(f"{BASE_URL}/line/list.aspx", data=test_data, timeout=15)
        soup = BeautifulSoup(resp.text, 'lxml')
        lis = soup.find_all('li')
        count = sum(1 for li in lis if '行程天数' in li.get_text(' ', strip=True))
        print(f"  EVENTTARGET='{target}': {count}条")
