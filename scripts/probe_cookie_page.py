#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import requests, re

session = requests.Session()

url1 = 'http://gz.ptotour.com/line/list.aspx?cid=guangzhou&tid=domestic&page=1'
resp1 = session.get(url1, headers={'User-Agent':'Mozilla/5.0'})

session.cookies.set('page', '2')
session.cookies.set('currentPage', '2')

url2 = 'http://gz.ptotour.com/line/list.aspx?cid=guangzhou&tid=domestic&page=2'
resp2 = session.get(url2, headers={'User-Agent':'Mozilla/5.0'})

ids1 = re.findall(r'href="http://gz\.ptotour\.com/(\d+)/"', resp1.text)
ids2 = re.findall(r'href="http://gz\.ptotour\.com/(\d+)/"', resp2.text)
unique_ids1 = list(dict.fromkeys(ids1))
unique_ids2 = list(dict.fromkeys(ids2))

print(f'Page 1: {len(unique_ids1)} products, first: {unique_ids1[:3]}')
print(f'Page 2: {len(unique_ids2)} products, first: {unique_ids2[:3]}')
print(f'Same content: {unique_ids1 == unique_ids2}')
