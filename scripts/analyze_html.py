#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import requests
import re

url = 'http://gz.cctpage.com/PC/TourLine/List?navid=6&pageIndex=1'
resp = requests.get(url, headers={'User-Agent':'Mozilla/5.0'})
print('encoding:', resp.encoding)
print('apparent:', resp.apparent_encoding)
html = resp.text

# 查找产品相关的HTML结构
matches = re.findall(r'<div[^>]*class=["\']([^"\']*product[^"\']*)["\'][^>]*>(.*?)</div>', html, re.DOTALL | re.IGNORECASE)
print('product divs found:', len(matches))
for m in matches[:3]:
    print('class:', m[0])
    print('content:', m[1][:300])
    print('---')

# 查找所有class
all_classes = re.findall(r'class=["\']([^"\']+)["\']', html)
unique = set(all_classes)
print('\nAll unique classes:', len(unique))
for c in sorted(unique):
    print(' ', c)
