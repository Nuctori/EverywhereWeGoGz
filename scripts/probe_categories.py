#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import requests, re

urls = [
    'http://gz.ptotour.com/line/list.aspx?cid=guangzhou&tid=abroad&page=1',
    'http://gz.ptotour.com/line/list.aspx?cid=guangzhou&tid=around&page=1',
    'http://gz.ptotour.com/line/list.aspx?cid=guangzhou&tid=hongkong&page=1',
]

for url in urls:
    resp = requests.get(url, headers={'User-Agent':'Mozilla/5.0'})
    html = resp.text
    ids = re.findall(r'href="http://gz\.ptotour\.com/(\d+)/"', html)
    unique_ids = list(dict.fromkeys(ids))
    print(f'{url}')
    print(f'  产品数量: {len(unique_ids)}')
    has_pager = 'class="pager"' in html
    print(f'  有分页元素: {has_pager}')
    print()
