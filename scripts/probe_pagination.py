#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import requests, re
from bs4 import BeautifulSoup

url = 'http://gz.ptotour.com/line/list.aspx?cid=guangzhou&tid=domestic&page=1'
resp = requests.get(url, headers={'User-Agent':'Mozilla/5.0'})
html = resp.text
soup = BeautifulSoup(html, 'html.parser')

# 查找所有带数字文本的a标签
for a in soup.find_all('a', href=True):
    text = a.get_text(strip=True)
    if text.isdigit():
        href = a['href']
        print(f'Page number link: [{text}] -> {href}')

# 检查是否有下一页/上一页
for a in soup.find_all('a', href=True):
    text = a.get_text(strip=True)
    if '下一页' in text or '上一页' in text or 'next' in text.lower() or 'prev' in text.lower():
        href = a['href']
        print(f'Nav link: [{text}] -> {href}')

# 查找select标签
selects = soup.find_all('select')
print(f'Select tags: {len(selects)}')
for s in selects:
    print(f'  Select: {s.get("name")}, options: {len(s.find_all("option"))}')

# 检查是否有总页数/总记录数信息
total_match = re.search(r'(共\d+页|共\d+条|total\s*\d+|\d+\s*pages?)', html, re.I)
if total_match:
    print(f'Total info: {total_match.group()}')

# 检查是否有JavaScript分页代码
scripts = soup.find_all('script')
for s in scripts:
    if s.string:
        txt = s.string
        if 'page' in txt.lower() or 'pager' in txt.lower() or '分页' in txt:
            print('--- Script with page reference ---')
            print(txt[:2000])
            print()
