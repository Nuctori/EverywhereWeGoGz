#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import requests, re

url = 'http://gz.ptotour.com/line/list.aspx?cid=guangzhou&tid=domestic&page=1'
resp = requests.get(url, headers={'User-Agent':'Mozilla/5.0'})
html = resp.text

lazy_patterns = ['lazyload', 'scroll', 'infinite', 'loadmore', '分页', 'page']
for p in lazy_patterns:
    matches = re.findall(r'.{0,50}' + p + r'.{0,50}', html, re.I)
    if matches:
        print(f'Pattern "{p}" found {len(matches)} times')
        for m in matches[:3]:
            print(f'  ...{m}...')

bottom = html[-5000:]
load_more = re.search(r'(加载更多|load more|查看更多|show more)', bottom, re.I)
print(f'Load more at bottom: {load_more is not None}')

onload_code = re.findall(r'window\.onload\s*=\s*function\s*\(\)\s*\{([^}]*)\}', html, re.I)
print(f'window.onload handlers: {len(onload_code)}')
