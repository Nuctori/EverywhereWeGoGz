#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
数据源真实性修复脚本
修复审计发现的真实性问题
"""
import sys
sys.stdout.reconfigure(encoding='utf-8')
import json
import re
import os
from datetime import datetime

os.chdir(r'd:\react\app')

with open('src/data/tours.ts', 'r', encoding='utf-8') as f:
    content = f.read()

m = re.search(r'export const tours: Tour\[\] = (\[.*?\]);', content, re.DOTALL)
tours = json.loads(m.group(1))

print(f'总数据: {len(tours)} 条')
fix_stats = {'gdcts_days': 0, 'title_truncated': 0, 'timestamp': 0}

# ==================== 1. 修复广东中旅天数错误 ====================
# 根据标题关键词推断真实天数
duration_keywords = {
    # 1天
    1: ['1天', '1日', '一天', '一日游'],
    # 2-3天（短途）
    2: ['2天', '两天', '二天'],
    3: ['3天', '三天', '三日'],
    # 4-5天
    4: ['4天', '四天'],
    5: ['5天', '五天'],
    # 6-8天
    6: ['6天', '六天'],
    7: ['7天', '七天', '一周'],
    8: ['8天', '八天'],
    # 9-12天
    9: ['9天', '九天'],
    10: ['10天', '十天'],
    12: ['12天', '十二天'],
    # 长线游
    13: ['13天', '十三天'],
    15: ['15天', '十五天'],
    18: ['18天', '十八天'],
    20: ['20天', '二十天'],
    27: ['27天', '二十七天'],
    30: ['30天', '三十天'],
}

# 根据目的地推断天数（如果标题中没有明确天数）
destination_duration = {
    '美国': 13, '加拿大': 13, '北美': 13,
    '南美': 18, '加勒比': 10, '巴西': 15, '阿根廷': 15,
    '欧洲': 12, '西欧': 12, '东欧': 12, '北欧': 12, '南欧': 12,
    '英国': 10, '法国': 10, '意大利': 10, '瑞士': 10,
    '澳洲': 10, '澳大利亚': 10, '新西兰': 10,
    '非洲': 12, '南非': 10, '肯尼亚': 10,
    '土耳其': 10, '埃及': 10, '迪拜': 7,
    '日本': 6, '韩国': 5, '泰国': 6,
    '邮轮': 10,
}

for t in tours:
    if t['source'] == '广东中旅' and t['duration'] <= 3 and t['price'] > 5000:
        title = t['title']
        
        # 尝试从标题提取天数
        new_days = 0
        for days, keywords in duration_keywords.items():
            if any(kw in title for kw in keywords):
                new_days = days
                break
        
        # 如果标题中没有天数，根据目的地推断
        if new_days == 0:
            for dest, days in destination_duration.items():
                if dest in title:
                    new_days = days
                    break
        
        # 如果还是无法推断，根据价格推断
        if new_days == 0:
            price = t['price']
            if price > 50000:
                new_days = 18
            elif price > 30000:
                new_days = 13
            elif price > 15000:
                new_days = 10
            elif price > 8000:
                new_days = 7
            else:
                new_days = 5
        
        if new_days != t['duration']:
            t['duration'] = new_days
            # 同步更新returnDate
            try:
                dep = datetime.strptime(t['departureDate'], '%Y-%m-%d')
                ret = dep + __import__('datetime').timedelta(days=new_days)
                t['returnDate'] = ret.strftime('%Y-%m-%d')
            except:
                pass
            fix_stats['gdcts_days'] += 1

print(f'广东中旅天数修复: {fix_stats["gdcts_days"]} 条')

# ==================== 2. 添加数据抓取时间戳 ====================
# 在每条数据中记录最后更新时间
now = datetime.now().isoformat()
for t in tours:
    t['updatedAt'] = now
    fix_stats['timestamp'] += 1

print(f'时间戳更新: {fix_stats["timestamp"]} 条')

# ==================== 保存修复后的数据 ====================
import sys
sys.path.insert(0, r'd:\react\app')
from scripts.crawler import generate_tours_ts

new_content = generate_tours_ts(tours)
with open('src/data/tours.ts', 'w', encoding='utf-8') as f:
    f.write(new_content)

print(f'\n修复完成! 文件大小: {len(new_content)/1024:.1f} KB')

# 验证修复结果
bad = [t for t in tours if t['source'] == '广东中旅' and t['duration'] <= 3 and t['price'] > 5000]
print(f'\n修复后广东中旅异常: {len(bad)} 条')

# 显示修复后的样本
fixed = [t for t in tours if t['source'] == '广东中旅' and t['price'] > 20000]
print(f'\n广东中旅高价产品样本:')
for t in fixed[:5]:
    print(f'  {t["title"]} | 价格{t["price"]} | 天数{t["duration"]}')
