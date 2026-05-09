#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import requests, re

url = 'http://gz.ptotour.com/line/search.aspx?key=海南'
resp = requests.get(url, headers={'User-Agent':'Mozilla/5.0'})
html = resp.text

ids = re.findall(r'href="http://sz\.ptotour\.com/(\d+)/"', html)
unique_ids = list(dict.fromkeys(ids))
print(f'Search results (sz): {len(unique_ids)} products')
print(f'First 10: {unique_ids[:10]}')

has_pager = 'class="pager"' in html
print(f'Has pager: {has_pager}')

page_links = re.findall(r'href="[^"]*page=(\d+)[^"]*"', html)
print(f'Page links: {page_links[:10]}')
