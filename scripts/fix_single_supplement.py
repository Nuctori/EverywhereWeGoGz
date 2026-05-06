#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
单房差数据源确认与修复

结论：所有7个数据源都没有提供单房差真实数据
- 单房差当前是基于价格和天数的估算值
- 需要明确标注为"估算"，避免误导用户
"""
import sys
sys.stdout.reconfigure(encoding='utf-8')
import json
import re
import os

os.chdir(r'd:\react\app')

with open('src/data/tours.ts', 'r', encoding='utf-8') as f:
    content = f.read()

m = re.search(r'export const tours: Tour\[\] = (\[.*?\]);', content, re.DOTALL)
tours = json.loads(m.group(1))

print('=== 单房差数据源审计 ===')
print()
print('审计结果：所有7个数据源（假日通/品途/广东中旅/广之旅/广州去旅行/康辉/暴走村）')
print('均未在列表页或详情页提供单房差具体金额。')
print()
print('当前单房差计算逻辑（scripts/crawler.py raw_to_tour）:')
print('  - 1天及以下: 0元')
print('  - 2-3天: max(50, 价格×15%)')
print('  - 4天及以上: max(100, 价格×25%)')
print()

# 统计当前单房差分布
from collections import Counter, defaultdict
ss_by_source = defaultdict(list)
for t in tours:
    ss_by_source[t['source']].append(t['singleSupplement'])

print('各来源单房差范围（估算值）:')
for src, vals in sorted(ss_by_source.items()):
    print(f'  {src}: {min(vals)}~{max(vals)}元, 平均{sum(vals)//len(vals)}元')

print()
print('建议处理方案：')
print('1. 【推荐】在UI上明确标注"单房差仅供参考，以实际预订为准"')
print('2. 或隐藏单房差显示，改为"详情咨询客服"')
print('3. 或从详情页进一步抓取（需要访问每个产品的详情页，成本较高）')
