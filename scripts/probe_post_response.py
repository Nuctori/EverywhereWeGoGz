#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import requests, re

url = 'http://gz.ptotour.com/line/list.aspx?cid=guangzhou&tid=domestic&page=1'
resp = requests.get(url, headers={'User-Agent':'Mozilla/5.0'})
html = resp.text

viewstate = re.search(r'name="__VIEWSTATE"[^>]*value="([^"]*)"', html)
viewstate_gen = re.search(r'name="__VIEWSTATEGENERATOR"[^>]*value="([^"]*)"', html)

vs = viewstate.group(1) if viewstate else ''
vg = viewstate_gen.group(1) if viewstate_gen else ''

data = {'__VIEWSTATE': vs, '__VIEWSTATEGENERATOR': vg, 'cid': 'guangzhou', 'tid': 'domestic', 'page': '2'}
resp_post = requests.post('http://gz.ptotour.com/line/list.aspx', data=data, headers={
    'User-Agent': 'Mozilla/5.0',
    'Content-Type': 'application/x-www-form-urlencoded',
    'Referer': url,
})
print(f'POST status: {resp_post.status_code}')
print(f'POST content-type: {resp_post.headers.get("Content-Type")}')
print(f'POST length: {len(resp_post.text)}')
print(f'POST first 500 chars: {resp_post.text[:500]}')
