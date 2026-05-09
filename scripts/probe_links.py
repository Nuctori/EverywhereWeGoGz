#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import requests, re
from bs4 import BeautifulSoup

url = 'http://gz.ptotour.com/line/list.aspx?cid=guangzhou&tid=domestic&page=1'
resp = requests.get(url, headers={'User-Agent':'Mozilla/5.0'})
html = resp.text

# 查找所有链接中包含数字ID的
line_links = re.findall(r'href="([^"]*\d{4,}/[^"]*)"', html)
print('Line detail links (pattern /digits/):', len(line_links))
for l in line_links[:10]:
    print(' ', l)

# 查找页面中所有数字ID链接
id_links = re.findall(r'href="([^"]*/\d{4,}/?)"', html)
print('ID links:', len(id_links))
for l in id_links[:10]:
    print(' ', l)

# 查找页码链接
page_links = re.findall(r'href="([^"]*page=\d+[^"]*)"', html)
print('Page param links:', len(page_links))
for l in page_links[:10]:
    print(' ', l)

# 查看分页区域附近的内容
pager_idx = html.find('class="pager"')
if pager_idx > 0:
    context = html[max(0,pager_idx-500):pager_idx+500]
    print('Pager context:', context[:1000])

# 查找是否有页码数字
page_numbers = re.findall(r'>(\d+)</a>', html)
print('Page numbers:', page_numbers[:20])

# 查找所有 a 标签的文本和 href
soup = BeautifulSoup(html, 'html.parser')
all_a = soup.find_all('a', href=True)
print('Total a tags:', len(all_a))
for a in all_a:
    text = a.get_text(strip=True)
    href = a['href']
    if text.isdigit() or 'page' in href.lower():
        print(f'  [{text}] -> {href}')
