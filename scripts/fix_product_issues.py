#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
产品体验修复脚本
修复审计发现的产品体验问题
"""
import sys
sys.stdout.reconfigure(encoding='utf-8')
import json
import re
import os

os.chdir(r'd:\react\app')

# 读取数据
with open('src/data/tours.ts', 'r', encoding='utf-8') as f:
    content = f.read()

m = re.search(r'export const tours: Tour\[\] = (\[.*?\]);', content, re.DOTALL)
tours = json.loads(m.group(1))

print(f'总数据: {len(tours)} 条')
fix_stats = {'https': 0, 'tags': 0, 'title': 0}

# ==================== 1. 修复HTTP图片URL为HTTPS ====================
# 已知支持HTTPS的域名
https_domains = {
    'jrttp.jrt365.com:8066': 'jrttp.jrt365.com:8066',  # 假日通图片服务器
    'www.jrt365.com': 'www.jrt365.com',
    'm.cctpage.com': 'm.cctpage.com',
    'nn.gzl.cn': 'nn.gzl.cn',
    'www.gzl.com.cn': 'www.gzl.com.cn',
    'www.gdcts.com': 'www.gdcts.com',
    'gz.ptotour.com': 'gz.ptotour.com',
}

for t in tours:
    images = t.get('images', [])
    new_images = []
    for img in images:
        if img.startswith('http://'):
            # 尝试升级为HTTPS
            https_img = img.replace('http://', 'https://', 1)
            new_images.append(https_img)
            fix_stats['https'] += 1
        else:
            new_images.append(img)
    t['images'] = new_images

print(f'HTTPS升级: {fix_stats["https"]} 条图片URL')

# ==================== 2. 修复标签100%覆盖问题 ====================
# 根据主题分配有意义的标签
theme_tags = {
    '自然风光': ['山水风光', '生态游'],
    '海岛度假': ['海岛游', '海滨度假'],
    '古镇文化': ['古镇', '人文历史'],
    '冰雪世界': ['冰雪', '冬季限定'],
    '民族风情': ['民俗', '文化体验'],
    '美食之旅': ['美食', '舌尖之旅'],
    '亲子游': ['亲子', '家庭出游'],
    '蜜月游': ['蜜月', '浪漫'],
    '摄影之旅': ['摄影', '打卡圣地'],
    '户外徒步': ['徒步', '户外'],
    '温泉养生': ['温泉', '休闲'],
    '历史文化': ['历史', '古迹'],
}

for t in tours:
    theme = t.get('theme', '自然风光')
    dest = t.get('destination', '')
    title = t.get('title', '')
    
    # 基于主题和目的地生成标签
    new_tags = theme_tags.get(theme, ['品质游'])
    
    # 根据目的地添加标签
    if dest in ['广东', '港澳']:
        new_tags.append('周边游')
    elif dest in ['北京', '云南', '四川', '陕西']:
        new_tags.append('国内热门')
    elif dest in ['泰国', '日本', '韩国', '新加坡']:
        new_tags.append('东南亚')
    elif dest in ['欧洲', '美国', '加拿大', '澳洲']:
        new_tags.append('长线游')
    
    # 根据标题添加标签
    if '温泉' in title:
        new_tags.append('温泉')
    if '滑雪' in title or '雪乡' in title:
        new_tags.append('滑雪')
    if '邮轮' in title or '游轮' in title:
        new_tags.append('邮轮')
    if '自由行' in title:
        new_tags.append('自由行')
    if '跟团' in title:
        new_tags.append('跟团游')
    
    # 去重并限制数量
    seen = set()
    unique_tags = []
    for tag in new_tags:
        if tag not in seen and len(unique_tags) < 4:
            seen.add(tag)
            unique_tags.append(tag)
    
    if t.get('tags') != unique_tags:
        t['tags'] = unique_tags
        fix_stats['tags'] += 1

print(f'标签修复: {fix_stats["tags"]} 条')

# ==================== 3. 精简过长标题 ====================
for t in tours:
    title = t['title']
    if len(title) > 50:
        # 尝试提取核心信息
        # 移除冗余前缀如"【已成团】"、"【即将成团】"
        cleaned = re.sub(r'【.*?】', '', title)
        cleaned = re.sub(r'\s+', ' ', cleaned).strip()
        
        # 如果清理后仍然太长，截断并保留关键信息
        if len(cleaned) > 50:
            # 尝试保留目的地+天数+核心卖点
            # 匹配"X天"模式
            days_match = re.search(r'(\d+)天', cleaned)
            days_part = days_match.group(0) if days_match else ''
            
            # 截断到50字以内
            if len(cleaned) > 50:
                cleaned = cleaned[:47] + '...'
        
        if cleaned and cleaned != title:
            t['title'] = cleaned
            fix_stats['title'] += 1

print(f'标题精简: {fix_stats["title"]} 条')

# ==================== 保存修复后的数据 ====================
import sys
sys.path.insert(0, r'd:\react\app')
from scripts.crawler import generate_tours_ts

new_content = generate_tours_ts(tours)
with open('src/data/tours.ts', 'w', encoding='utf-8') as f:
    f.write(new_content)

print(f'\n修复完成! 文件大小: {len(new_content)/1024:.1f} KB')

# 验证修复结果
print('\n修复后验证:')
http_imgs = sum(1 for t in tours for img in t.get('images', []) if img.startswith('http://'))
print(f'  HTTP图片: {http_imgs} 条')

from collections import Counter
tag_counter = Counter()
for t in tours:
    for tag in t.get('tags', []):
        tag_counter[tag] += 1
print(f'  标签种类: {len(tag_counter)} 种')
print(f'  前5标签: {tag_counter.most_common(5)}')

long_titles = [t for t in tours if len(t['title']) > 50]
print(f'  过长标题: {len(long_titles)} 条')
