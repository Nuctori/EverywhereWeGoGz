#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import requests
from bs4 import BeautifulSoup

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
    'Referer': 'http://gz.ptotour.com/',
    'Connection': 'keep-alive',
}

url = 'http://gz.ptotour.com/line/list.aspx?cid=guangzhou&tid=domestic&page=1'
resp = requests.get(url, headers=headers)
html = resp.text

soup = BeautifulSoup(html, 'html.parser')
linelist = soup.find('ul', class_='linelist')
if linelist:
    items = linelist.find_all('li', recursive=False)
    print(f'Total items: {len(items)}')
    
    if items:
        first = items[0]
        name = first.find('a', class_='name')
        price = first.find('div', class_='price')
        brief = first.find('div', class_='brief')
        
        print(f'Name: {name.get_text(strip=True) if name else "N/A"}')
        print(f'Price: {price.get_text(strip=True) if price else "N/A"}')
        print(f'Brief: {brief.get_text(strip=True)[:100] if brief else "N/A"}')
        
        link = name['href'] if name and name.has_attr('href') else None
        print(f'Link: {link}')
        
        img = first.find('img')
        if img:
            print(f'Image data-original: {img.get("data-original", "N/A")}')
            print(f'Image src: {img.get("src", "N/A")}')
