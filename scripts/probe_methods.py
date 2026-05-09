#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import requests

methods = ['GET', 'POST', 'HEAD', 'OPTIONS']

for method in methods:
    try:
        if method == 'GET':
            resp = requests.get('http://gz.ptotour.com/line/list.aspx?cid=guangzhou&tid=domestic&page=1', headers={'User-Agent':'Mozilla/5.0'})
        elif method == 'POST':
            resp = requests.post('http://gz.ptotour.com/line/list.aspx?cid=guangzhou&tid=domestic&page=1', data={'page':'1'}, headers={'User-Agent':'Mozilla/5.0'})
        elif method == 'HEAD':
            resp = requests.head('http://gz.ptotour.com/line/list.aspx?cid=guangzhou&tid=domestic&page=1', headers={'User-Agent':'Mozilla/5.0'})
        elif method == 'OPTIONS':
            resp = requests.options('http://gz.ptotour.com/line/list.aspx?cid=guangzhou&tid=domestic&page=1', headers={'User-Agent':'Mozilla/5.0'})
        
        ct = resp.headers.get('Content-Type', 'N/A')
        print(f'{method}: HTTP {resp.status_code}, Content-Type: {ct}')
    except Exception as e:
        print(f'{method}: ERROR {e}')
