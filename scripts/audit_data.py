#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
爬虫数据真实性审计脚本
"""

import json
from collections import Counter

print('=' * 60)
print('爬虫数据真实性审计报告')
print('=' * 60)

with open('public/data/tours.json', 'r', encoding='utf-8') as f:
    tours = json.load(f)

print(f'\n[总体概况]')
print(f'  总条数: {len(tours)}')

# 来源分布
sources = Counter(t['source'] for t in tours)
print(f'\n[来源分布]')
for s, c in sources.most_common():
    print(f'  {s}: {c}')

# 价格检查
prices = [t['price'] for t in tours if t.get('price')]
print(f'\n[价格统计]')
print(f'  最小: {min(prices)}')
print(f'  最大: {max(prices)}')
print(f'  平均: {sum(prices)//len(prices)}')

suspicious = [t for t in tours if t.get('price', 0) < 100 or t.get('price', 0) > 500000]
print(f'  异常价格(<100或>50万): {len(suspicious)}条')

by_source = Counter(t['source'] for t in suspicious)
print(f'\n  [异常价格按来源]')
for s, c in by_source.most_common():
    print(f'    {s}: {c}')

print(f'\n  [低价样本<100]')
low = [t for t in suspicious if t['price'] < 100][:5]
for t in low:
    src = t['source']
    title = t['title'][:50] if t.get('title') else 'N/A'
    price = t['price']
    print(f'    [{src}] {title} - {price}')

print(f'\n  [高价样本>50万]')
high = [t for t in suspicious if t['price'] > 500000][:5]
for t in high:
    src = t['source']
    title = t['title'][:50] if t.get('title') else 'N/A'
    price = t['price']
    print(f'    [{src}] {title} - {price}')

# 天数检查
durations = [t['duration'] for t in tours if t.get('duration')]
print(f'\n[天数统计]')
print(f'  最小: {min(durations)}')
print(f'  最大: {max(durations)}')
print(f'  平均: {sum(durations)//len(durations)}')

day_issues = [t for t in tours if t.get('duration', 0) > 30 or t.get('duration', 0) == 0]
print(f'  异常天数(>30或0): {len(day_issues)}条')
for t in day_issues[:5]:
    src = t['source']
    title = t['title'][:50] if t.get('title') else 'N/A'
    dur = t['duration']
    print(f'    [{src}] {title} - {dur}天')

# 目的地分布
dests = Counter(t.get('destination', '未知') for t in tours)
print(f'\n[目的地TOP10]')
for d, c in dests.most_common(10):
    print(f'  {d}: {c}')

# 链接检查
invalid = [t for t in tours if not t.get('bookingUrl', '').startswith('http')]
print(f'\n[链接检查]')
print(f'  无效链接: {len(invalid)}条')

# 重复检查
seen = set()
dups = 0
for t in tours:
    key = t.get('title', '') + '|' + str(t.get('price', ''))
    if key in seen:
        dups += 1
    seen.add(key)
print(f'\n[重复检查]')
print(f'  标题+价格重复: {dups}条')

print(f'\n[审计完成]')
