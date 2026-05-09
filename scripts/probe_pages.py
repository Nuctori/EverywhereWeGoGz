#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import requests, re

urls = [
    'http://gz.ptotour.com/line/list.aspx?cid=guangzhou&tid=domestic&page=1',
    'http://gz.ptotour.com/line/list.aspx?cid=guangzhou&tid=domestic&page=2',
    'http://gz.ptotour.com/line/list.aspx?cid=guangzhou&tid=domestic&page=3',
]

for url in urls:
    resp = requests.get(url, headers={'User-Agent':'Mozilla/5.0'})
    html = resp.text
    ids = re.findall(r'href="http://gz\.ptotour\.com/(\d+)/"', html)
    unique_ids = list(dict.fromkeys(ids))
    print(f'{url}')
    print(f'  产品数量: {len(unique_ids)}')
    print(f'  前10个ID: {unique_ids[:10]}')
    print()
