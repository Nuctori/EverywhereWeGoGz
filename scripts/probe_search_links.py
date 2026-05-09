#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import requests, re

url = 'http://gz.ptotour.com/line/search.aspx?key=海南'
resp = requests.get(url, headers={'User-Agent':'Mozilla/5.0'})
html = resp.text

ids = re.findall(r'href="http://gz\.ptotour\.com/(\d+)/"', html)
unique_ids = list(dict.fromkeys(ids))
print(f'Search results: {len(unique_ids)} products')
print(f'First 10: {unique_ids[:10]}')

all_links = re.findall(r'href="([^"]+)"', html)
product_links = [l for l in all_links if 'ptotour.com' in l and any(c.isdigit() for c in l)]
print(f'All product links: {len(product_links)}')
for l in product_links[:10]:
    print(f'  {l}')
