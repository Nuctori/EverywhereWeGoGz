#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import requests, re

urls = [
    'http://gz.ptotour.com/line/list.aspx?cid=guangzhou&tid=domestic',
    'http://gz.ptotour.com/line/list.aspx?cid=guangzhou&tid=domestic&p=1',
    'http://gz.ptotour.com/line/list.aspx?cid=guangzhou&tid=domestic&p=2',
    'http://gz.ptotour.com/line/list.aspx?cid=guangzhou&tid=domestic&page=1',
    'http://gz.ptotour.com/line/list.aspx?cid=guangzhou&tid=domestic&page=2',
    'http://gz.ptotour.com/line/list.aspx?cid=guangzhou&tid=domestic&currentPage=1',
    'http://gz.ptotour.com/line/list.aspx?cid=guangzhou&tid=domestic&currentPage=2',
    'http://gz.ptotour.com/line/list.aspx?cid=guangzhou&tid=domestic&pageIndex=1',
    'http://gz.ptotour.com/line/list.aspx?cid=guangzhou&tid=domestic&pageIndex=2',
]

for url in urls:
    resp = requests.get(url, headers={'User-Agent':'Mozilla/5.0'})
    ids = re.findall(r'href="http://gz\.ptotour\.com/(\d+)/"', resp.text)
    unique_ids = list(dict.fromkeys(ids))
    query = url.split('?')[1] if '?' in url else ''
    print(f'{query:40s} -> {len(unique_ids)} products, first: {unique_ids[:3]}')
