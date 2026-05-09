#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import requests, re

url = 'http://gz.ptotour.com/line/list.aspx?cid=guangzhou&tid=domestic&page=1'
resp = requests.get(url, headers={'User-Agent':'Mozilla/5.0'})
html = resp.text

viewstate = re.search(r'name="__VIEWSTATE"[^>]*value="([^"]*)"', html)
viewstate_gen = re.search(r'name="__VIEWSTATEGENERATOR"[^>]*value="([^"]*)"', html)
event_val = re.search(r'name="__EVENTVALIDATION"[^>]*value="([^"]*)"', html)

print('VIEWSTATE:', viewstate.group(1)[:50] if viewstate else 'Not found')
print('VIEWSTATEGENERATOR:', viewstate_gen.group(1) if viewstate_gen else 'Not found')
print('EVENTVALIDATION:', event_val.group(1)[:50] if event_val else 'Not found')

pager_btn = re.search(r'(btnNext|btnPrev|lnkNext|lnkPrev|Page\$\d+)', html)
print('Pager button pattern:', pager_btn.group(1) if pager_btn else 'Not found')

event_targets = re.findall(r'__doPostBack\([\'"]([^\'"]+)[\'"]', html)
print('__doPostBack targets:', event_targets[:10])

dopost_links = re.findall(r'href="javascript:__doPostBack\([^)]*\)"', html)
print('__doPostBack links:', len(dopost_links))
for l in dopost_links[:5]:
    print(' ', l)
