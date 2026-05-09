#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import requests, re

params_to_test = [
    {'cid':'guangzhou', 'tid':'domestic', 'page':'1'},
    {'cid':'guangzhou', 'tid':'domestic', 'page':'2'},
    {'cid':'guangzhou', 'tid':'domestic'},
    {'cid':'guangzhou', 'tid':'domestic', 'start':'0'},
    {'cid':'guangzhou', 'tid':'domestic', 'start':'50'},
    {'cid':'guangzhou', 'tid':'domestic', 'limit':'50'},
    {'cid':'guangzhou', 'tid':'domestic', 'limit':'50', 'offset':'0'},
    {'cid':'guangzhou', 'tid':'domestic', 'limit':'50', 'offset':'50'},
    {'cid':'guangzhou', 'tid':'domestic', 'size':'50'},
    {'cid':'guangzhou', 'tid':'domestic', 'size':'50', 'page':'2'},
    {'cid':'guangzhou', 'tid':'domestic', 'rows':'50'},
    {'cid':'guangzhou', 'tid':'domestic', 'rows':'50', 'page':'2'},
    {'cid':'guangzhou', 'tid':'domestic', 'count':'50'},
    {'cid':'guangzhou', 'tid':'domestic', 'num':'50'},
    {'cid':'guangzhou', 'tid':'domestic', 'perpage':'50'},
    {'cid':'guangzhou', 'tid':'domestic', 'per_page':'50'},
    {'cid':'guangzhou', 'tid':'domestic', 'pageSize':'50'},
    {'cid':'guangzhou', 'tid':'domestic', 'page_size':'50'},
]

for p in params_to_test:
    resp = requests.get('http://gz.ptotour.com/line/list.aspx', params=p, headers={'User-Agent':'Mozilla/5.0'})
    html = resp.text
    ids = re.findall(r'href="http://gz\.ptotour\.com/(\d+)/"', html)
    unique_ids = list(dict.fromkeys(ids))
    print(f'{p} -> {len(unique_ids)} products, first 3: {unique_ids[:3]}')
