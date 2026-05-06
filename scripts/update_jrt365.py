#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
快速更新假日通数据
"""
import sys
sys.stdout.reconfigure(encoding='utf-8')
import os
import re
import json

os.chdir(r'd:\react\app')
sys.path.insert(0, r'd:\react\app')

from scripts.crawler import Jrt365Spider, raw_to_tour, dedup_items, generate_tours_ts

# 抓取假日通数据
spider = Jrt365Spider()
items = spider.fetch()
print(f'[假日通] 抓取到 {len(items)} 条')

# 读取其他来源的现有数据
tours_path = os.path.join('src', 'data', 'tours.ts')
existing_other = []

if os.path.exists(tours_path):
    with open(tours_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 提取JSON数组
    m = re.search(r'export const tours: Tour\[\] = (\[.*?\]);', content, re.DOTALL)
    if m:
        try:
            all_tours = json.loads(m.group(1))
            existing_other = [t for t in all_tours if t.get('source') != '假日通']
            print(f'[现有] 其他来源: {len(existing_other)} 条')
        except Exception as e:
            print(f'[解析错误] {e}')

# 转换假日通数据
import itertools
id_counter = itertools.count(start=1)
jrt365_tours = []
for item in items:
    tour = raw_to_tour(item, id_counter)
    if tour:
        jrt365_tours.append(tour)

print(f'[假日通] 有效数据: {len(jrt365_tours)} 条')

# 合并
all_tours = jrt365_tours + existing_other

# 重新编号
for i, tour in enumerate(all_tours, 1):
    tour['id'] = f"tour_{i}"

# 写入
content = generate_tours_ts(all_tours)
with open(tours_path, 'w', encoding='utf-8') as f:
    f.write(content)

print(f'[保存] {tours_path}')
print(f'[总计] {len(all_tours)} 条 (假日通:{len(jrt365_tours)} + 其他:{len(existing_other)})')
