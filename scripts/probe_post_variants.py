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

post_data_list = [
    {'__VIEWSTATE': vs, '__VIEWSTATEGENERATOR': vg, 'cid': 'guangzhou', 'tid': 'domestic', 'page': '2'},
    {'__VIEWSTATE': vs, '__VIEWSTATEGENERATOR': vg, 'cid': 'guangzhou', 'tid': 'domestic', 'page': '2', '__EVENTTARGET': '', '__EVENTARGUMENT': ''},
    {'__VIEWSTATE': vs, '__VIEWSTATEGENERATOR': vg, 'cid': 'guangzhou', 'tid': 'domestic'},
]

for i, data in enumerate(post_data_list):
    resp_post = requests.post('http://gz.ptotour.com/line/list.aspx', data=data, headers={
        'User-Agent': 'Mozilla/5.0',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Referer': url,
    })
    ids = re.findall(r'href="http://gz\.ptotour\.com/(\d+)/"', resp_post.text)
    unique_ids = list(dict.fromkeys(ids))
    print(f'Post variant {i+1}: {len(unique_ids)} products, first 3: {unique_ids[:3]}')
