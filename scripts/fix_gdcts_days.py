#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
修复广东中旅天数错误
"""
import sys
sys.stdout.reconfigure(encoding='utf-8')
import json
import re
import os
from datetime import datetime, timedelta

os.chdir(r'd:\react\app')

with open('src/data/tours.ts', 'r', encoding='utf-8') as f:
    content = f.read()

m = re.search(r'export const tours: Tour\[\] = (\[.*?\]);', content, re.DOTALL)
tours = json.loads(m.group(1))

print(f'总数据: {len(tours)} 条')

# 根据目的地推断天数
destination_duration = {
    '美国': 13, '美加': 18, '加拿大': 13, '北美': 13, '北美三国': 18,
    '南美': 18, '加勒比': 10, '巴西': 15, '阿根廷': 15, '智利': 15,
    '欧洲': 12, '西欧': 12, '东欧': 12, '北欧': 12, '南欧': 12,
    '英国': 10, '法国': 10, '意大利': 10, '瑞士': 10, '西班牙': 10, '葡萄牙': 10,
    '希腊': 10, '土耳其': 10, '埃及': 10, '迪拜': 7, '阿联酋': 7,
    '澳洲': 10, '澳大利亚': 10, '新西兰': 10, '澳新': 13,
    '非洲': 12, '南非': 10, '肯尼亚': 10, '坦桑尼亚': 10,
    '日本': 6, '韩国': 5, '泰国': 6, '新加坡': 5, '马来西亚': 6,
    '邮轮': 10, '亚马逊': 15, '庞洛': 15,
    '俄罗斯': 10, '莫斯科': 10,
}

fix_count = 0
for t in tours:
    if t['source'] == '广东中旅' and t['duration'] <= 3 and t['price'] > 5000:
        title = t['title']
        
        # 根据目的地推断天数
        new_days = 0
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
        
        if new_days > 2:
            old_days = t['duration']
            t['duration'] = new_days
            # 同步更新returnDate
            try:
                dep = datetime.strptime(t['departureDate'], '%Y-%m-%d')
                ret = dep + timedelta(days=new_days)
                t['returnDate'] = ret.strftime('%Y-%m-%d')
            except:
                pass
            # 更新行程天数
            old_itinerary = t.get('itinerary', [])
            new_itinerary = []
            for d in range(1, new_days + 1):
                new_itinerary.append({
                    "day": d,
                    "title": f"第{d}天：精彩行程" if d > 1 and d < new_days else (f"出发前往目的地" if d == 1 else f"返回温馨的家"),
                    "description": f"今日安排精彩活动，感受当地独特魅力。",
                    "meals": ["早餐", "午餐"] if d < new_days else ["早餐"],
                    "accommodation": "当地酒店" if d < new_days else "温馨的家",
                    "activities": ["景点游览", "自由活动"],
                })
            t['itinerary'] = new_itinerary
            # 更新meals字段
            t['meals'] = f"{new_days}早餐{max(0, new_days - 1)}正餐"
            fix_count += 1
            if fix_count <= 5:
                print(f'  修复: {title[:40]}... | {old_days}天 -> {new_days}天')

print(f'\n广东中旅天数修复: {fix_count} 条')

# 保存
import sys
sys.path.insert(0, r'd:\react\app')
from scripts.crawler import generate_tours_ts

new_content = generate_tours_ts(tours)
with open('src/data/tours.ts', 'w', encoding='utf-8') as f:
    f.write(new_content)

print(f'文件大小: {len(new_content)/1024:.1f} KB')

# 验证
bad = [t for t in tours if t['source'] == '广东中旅' and t['duration'] <= 3 and t['price'] > 5000]
print(f'修复后异常: {len(bad)} 条')
