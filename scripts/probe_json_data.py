#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import requests, re

url = 'http://gz.ptotour.com/line/list.aspx?cid=guangzhou&tid=domestic&page=1'
resp = requests.get(url, headers={'User-Agent':'Mozilla/5.0'})
html = resp.text

json_data = re.findall(r'var\s+\w+\s*=\s*(\{[^;]{100,5000}\});', html)
print(f'Inline JSON variables: {len(json_data)}')
for j in json_data[:3]:
    print(f'  {j[:200]}')

data_attrs = re.findall(r'data-[a-z-]+="([^"]+)"', html)
print(f'Data attributes: {len(data_attrs)}')
for d in data_attrs[:10]:
    print(f'  {d[:100]}')

js_resp = requests.get('http://gz.ptotour.com/js/common.js', headers={'User-Agent':'Mozilla/5.0'})
if js_resp.status_code == 200:
    js = js_resp.text
    api_calls = re.findall(r'(ajax|fetch|getJSON|get|post)\s*\(\s*["\']([^"\']+)["\']', js, re.I)
    print(f'API calls in common.js: {len(api_calls)}')
    for method, endpoint in api_calls[:10]:
        print(f'  {method} -> {endpoint}')
