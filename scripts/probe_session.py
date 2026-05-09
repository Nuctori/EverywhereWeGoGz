#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import requests, re

session = requests.Session()

url1 = 'http://gz.ptotour.com/line/list.aspx?cid=guangzhou&tid=domestic&page=1'
resp1 = session.get(url1, headers={'User-Agent':'Mozilla/5.0'})
ids1 = re.findall(r'href="http://gz\.ptotour\.com/(\d+)/"', resp1.text)
unique_ids1 = list(dict.fromkeys(ids1))
print(f'Page 1 (session): {len(unique_ids1)} products')

url2 = 'http://gz.ptotour.com/line/list.aspx?cid=guangzhou&tid=domestic&page=2'
resp2 = session.get(url2, headers={'User-Agent':'Mozilla/5.0'})
ids2 = re.findall(r'href="http://gz\.ptotour\.com/(\d+)/"', resp2.text)
unique_ids2 = list(dict.fromkeys(ids2))
print(f'Page 2 (session): {len(unique_ids2)} products')

print(f'Cookies: {session.cookies.get_dict()}')
