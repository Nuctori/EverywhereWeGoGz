#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import requests, re

params_list = [
    {'cid': 'guangzhou', 'tid': 'domestic', 'page': '1', 'sort': 'price'},
    {'cid': 'guangzhou', 'tid': 'domestic', 'page': '2', 'sort': 'price'},
    {'cid': 'guangzhou', 'tid': 'domestic', 'page': '1', 'order': 'asc'},
    {'cid': 'guangzhou', 'tid': 'domestic', 'page': '2', 'order': 'asc'},
    {'cid': 'guangzhou', 'tid': 'domestic', 'page': '1', 'sortby': 'price'},
    {'cid': 'guangzhou', 'tid': 'domestic', 'page': '2', 'sortby': 'price'},
]

for params in params_list:
    resp = requests.get('http://gz.ptotour.com/line/list.aspx', params=params, headers={'User-Agent':'Mozilla/5.0'})
    ids = re.findall(r'href="http://gz\.ptotour\.com/(\d+)/"', resp.text)
    unique_ids = list(dict.fromkeys(ids))
    print(f'{params} -> {len(unique_ids)} products, first: {unique_ids[:3]}')
