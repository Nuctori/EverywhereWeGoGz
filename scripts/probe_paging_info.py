#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import requests, re

url = 'http://gz.ptotour.com/line/list.aspx?cid=guangzhou&tid=domestic&page=1'
resp = requests.get(url, headers={'User-Agent':'Mozilla/5.0'})
html = resp.text

total_pages = re.search(r'(\d+)\s*页', html)
if total_pages:
    print(f'Total pages: {total_pages.group(1)}')

total_items = re.search(r'(\d+)\s*条', html)
if total_items:
    print(f'Total items: {total_items.group(1)}')

num_links = re.findall(r'<a[^>]*>(\d+)</a>', html)
print(f'Number links: {num_links[:20]}')

next_page = re.search(r'(下一页|Next|next|&gt;&gt;|>>)', html)
print(f'Has next page: {next_page is not None}')

page_input = re.search(r'<input[^>]*name=[\"\']?page', html, re.I)
print(f'Has page input: {page_input is not None}')
