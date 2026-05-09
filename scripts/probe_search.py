#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import requests, re

urls = [
    'http://gz.ptotour.com/line/search.aspx?key=海南',
    'http://gz.ptotour.com/line/search.aspx?key=云南',
    'http://gz.ptotour.com/line/search.aspx?key=北京',
]

for url in urls:
    resp = requests.get(url, headers={'User-Agent':'Mozilla/5.0'})
    ids = re.findall(r'href="http://gz\.ptotour\.com/(\d+)/"', resp.text)
    unique_ids = list(dict.fromkeys(ids))
    print(f'{url}')
    print(f'  {len(unique_ids)} products, first: {unique_ids[:3]}')
