#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import requests, re

url = 'http://gz.ptotour.com/line/list.aspx?cid=guangzhou&tid=domestic&page=1'
resp = requests.get(url, headers={'User-Agent':'Mozilla/5.0'})
html = resp.text

iframes = re.findall(r'<iframe[^>]*src="([^"]+)"', html)
print(f'Iframes: {iframes}')

ajax_divs = re.findall(r'<div[^>]*id="([^"]+)"[^>]*>', html)
print(f'Div IDs: {ajax_divs[:20]}')

data_urls = re.findall(r'data-url="([^"]+)"', html)
print(f'Data URLs: {data_urls[:10]}')

list_containers = re.findall(r'<(ul|div|ol)[^>]*id="([^"]+)"[^>]*class="[^"]*(?:list|line|product)[^"]*"', html, re.I)
print(f'List containers: {list_containers}')
