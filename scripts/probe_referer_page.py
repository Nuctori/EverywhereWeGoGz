#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import requests, re

headers1 = {
    'User-Agent': 'Mozilla/5.0',
    'Referer': 'http://gz.ptotour.com/line/list.aspx?cid=guangzhou&tid=domestic&page=1'
}
headers2 = {
    'User-Agent': 'Mozilla/5.0',
    'Referer': 'http://gz.ptotour.com/line/list.aspx?cid=guangzhou&tid=domestic&page=2'
}

resp1 = requests.get('http://gz.ptotour.com/line/list.aspx?cid=guangzhou&tid=domestic&page=1', headers=headers1)
resp2 = requests.get('http://gz.ptotour.com/line/list.aspx?cid=guangzhou&tid=domestic&page=2', headers=headers2)

ids1 = re.findall(r'href="http://gz\.ptotour\.com/(\d+)/"', resp1.text)
ids2 = re.findall(r'href="http://gz\.ptotour\.com/(\d+)/"', resp2.text)
unique_ids1 = list(dict.fromkeys(ids1))
unique_ids2 = list(dict.fromkeys(ids2))

print(f'Page 1: {len(unique_ids1)} products, first: {unique_ids1[:3]}')
print(f'Page 2: {len(unique_ids2)} products, first: {unique_ids2[:3]}')
print(f'Same content: {unique_ids1 == unique_ids2}')
