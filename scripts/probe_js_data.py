#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import requests, re

url = 'http://gz.ptotour.com/line/list.aspx?cid=guangzhou&tid=domestic&page=1'
resp = requests.get(url, headers={'User-Agent':'Mozilla/5.0'})
html = resp.text

js_data = re.findall(r'var\s+\w+\s*=\s*(\[[^\]]{100,5000}\]);', html)
print(f'JS array data: {len(js_data)}')
for d in js_data[:3]:
    print(f'  {d[:200]}')

json_data = re.findall(r'var\s+\w+\s*=\s*(\{[^}]{100,5000}\});', html)
print(f'JS object data: {len(json_data)}')
for d in json_data[:3]:
    print(f'  {d[:200]}')

ajax_divs = re.findall(r'<div[^>]*id="([^"]+)"[^>]*>\s*</div>', html)
print(f'Empty divs with IDs: {len(ajax_divs)}')
for d in ajax_divs[:10]:
    print(f'  #{d}')
