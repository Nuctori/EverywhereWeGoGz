#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import requests

urls = [
    'http://www.ptotour.com/line/list.aspx?cid=guangzhou&tid=domestic&page=1',
    'http://api.ptotour.com/line/list?cid=guangzhou&tid=domestic&page=1',
    'http://m.ptotour.com/line/list.aspx?cid=guangzhou&tid=domestic&page=1',
    'http://gz.ptotour.com/api/line/list?cid=guangzhou&tid=domestic',
    'http://gz.ptotour.com/ajax/line/list?cid=guangzhou&tid=domestic',
]

for url in urls:
    try:
        resp = requests.get(url, headers={'User-Agent':'Mozilla/5.0'}, timeout=10)
        ct = resp.headers.get('Content-Type', 'unknown')
        print(f'{url} -> HTTP {resp.status_code}, {ct}, {len(resp.text)} bytes')
    except Exception as e:
        print(f'{url} -> ERROR: {e}')
