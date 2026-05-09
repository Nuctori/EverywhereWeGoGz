#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import requests, re

urls = [
    'http://gz.ptotour.com/line/list-1.aspx?cid=guangzhou&tid=domestic',
    'http://gz.ptotour.com/line/list-2.aspx?cid=guangzhou&tid=domestic',
    'http://gz.ptotour.com/line/list_p1.aspx?cid=guangzhou&tid=domestic',
    'http://gz.ptotour.com/line/list_p2.aspx?cid=guangzhou&tid=domestic',
    'http://gz.ptotour.com/line/list/guangzhou/domestic/1',
    'http://gz.ptotour.com/line/list/guangzhou/domestic/2',
]

for url in urls:
    try:
        resp = requests.get(url, headers={'User-Agent':'Mozilla/5.0'}, timeout=10)
        ids = re.findall(r'href="http://gz\.ptotour\.com/(\d+)/"', resp.text)
        unique_ids = list(dict.fromkeys(ids))
        print(f'{url}')
        print(f'  HTTP {resp.status_code}, {len(unique_ids)} products, first: {unique_ids[:3]}')
    except Exception as e:
        print(f'{url}')
        print(f'  ERROR: {e}')
