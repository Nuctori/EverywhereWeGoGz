#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
单房差估算算法 v3

核心逻辑：
- 单房差 = 每晚酒店价格 × 0.5（补另一半房费）
- 短途游团费低但酒店成本高，单房差可能超过团费
- 根据产品类型（温泉/海岛/城市）和目的地确定酒店档次
"""
import sys
sys.stdout.reconfigure(encoding='utf-8')
import json
import os

os.chdir(r'd:\react\app')

# 产品类型对应的酒店档次（每晚参考价）
# 关键词 -> (酒店类型, 每晚价格)
PRODUCT_TYPE_HOTEL = {
    # 温泉/度假酒店 - 酒店是核心卖点
    '温泉': ('温泉度假酒店', 400),
    '度假': ('度假酒店', 350),
    '海岛': ('海景酒店', 450),
    '沙滩': ('海景酒店', 400),
    '别墅': ('别墅酒店', 500),
    
    # 高端主题游
    '五星': ('五星级酒店', 500),
    '豪华': ('豪华酒店', 450),
    '高端': ('高端酒店', 400),
    '精品': ('精品酒店', 350),
    
    # 普通周边游
    '直通车': ('普通酒店', 250),
    '周边': ('普通酒店', 200),
    '省内': ('普通酒店', 200),
    
    # 默认
}

# 目的地对应的酒店价格调整系数
DESTINATION_HOTEL_TIERS = {
    # 省内热门旅游地
    '清远': 280, '韶关': 220, '肇庆': 180, '惠州': 280,
    '江门': 200, '阳江': 250, '茂名': 180, '湛江': 180,
    '梅州': 160, '汕头': 220, '潮州': 200, '揭阳': 160,
    '汕尾': 180, '河源': 160, '云浮': 150, '佛山': 200,
    '东莞': 200, '中山': 180, '珠海': 300, '深圳': 350,
    '从化': 280, '增城': 220, '花都': 200,
    
    # 一线城市
    '北京': 450, '上海': 500, '广州': 350, '深圳': 400,
    
    # 热门旅游地
    '三亚': 500, '厦门': 400, '杭州': 400, '南京': 350,
    '成都': 320, '重庆': 280, '西安': 280, '昆明': 280,
    '桂林': 280, '丽江': 350, '大理': 320, '张家界': 280,
    '黄山': 300, '拉萨': 350, '乌鲁木齐': 300,
    
    # 港澳
    '香港': 600, '澳门': 500,
    
    # 东南亚
    '泰国': 300, '越南': 250, '新加坡': 500, '马来西亚': 300,
    '印度尼西亚': 300, '菲律宾': 280, '柬埔寨': 220, '老挝': 180,
    '缅甸': 180, '文莱': 350,
    
    # 东亚
    '日本': 550, '韩国': 450, '朝鲜': 250,
    
    # 欧洲
    '法国': 600, '意大利': 550, '瑞士': 650, '德国': 550,
    '英国': 600, '西班牙': 500, '葡萄牙': 450, '希腊': 500,
    '荷兰': 550, '比利时': 500, '奥地利': 550, '捷克': 380,
    '匈牙利': 350, '波兰': 300, '俄罗斯': 450, '北欧': 600,
    
    # 美洲
    '美国': 600, '加拿大': 550, '墨西哥': 350, '巴西': 320,
    '阿根廷': 350, '智利': 320, '秘鲁': 280,
    
    # 大洋洲
    '澳大利亚': 550, '新西兰': 500, '斐济': 450,
    
    # 中东/非洲
    '迪拜': 550, '埃及': 350, '土耳其': 380, '南非': 350,
    '肯尼亚': 400, '摩洛哥': 350,
    
    # 南亚
    '印度': 250, '尼泊尔': 200, '斯里兰卡': 250, '马尔代夫': 700,
    
    # 国内其他
    '西藏': 320, '青海': 250, '甘肃': 220, '宁夏': 200,
    '内蒙古': 220, '黑龙江': 250, '吉林': 220, '辽宁': 250,
    '河北': 200, '河南': 200, '山东': 220, '山西': 200,
    '湖北': 220, '湖南': 220, '江西': 200, '安徽': 200,
    '福建': 250, '浙江': 300, '江苏': 300, '天津': 300,
    '贵州': 200, '云南': 250, '广西': 220, '海南': 350,
    '新疆': 300, '台湾': 400,
}


def get_hotel_price_per_night(destination, title, duration, price):
    """
    根据产品特征估算每晚酒店价格
    
    逻辑：
    1. 先检测产品类型（温泉/度假/直通车等）
    2. 再结合目的地调整
    3. 对于低价短途游，酒店价格可能高于团费本身
    """
    # 1. 检测产品类型
    base_price = 200  # 默认普通酒店
    hotel_type = '普通酒店'
    
    for keyword, (htype, hprice) in PRODUCT_TYPE_HOTEL.items():
        if keyword in title:
            base_price = hprice
            hotel_type = htype
            break
    
    # 2. 目的地调整
    dest_price = None
    for dest, p in DESTINATION_HOTEL_TIERS.items():
        if dest in destination or destination in dest:
            dest_price = p
            break
    
    if dest_price:
        # 取产品类型和目的地的较高值
        base_price = max(base_price, dest_price * 0.7)
    
    # 3. 根据团费进一步调整预期
    # 如果团费很低但天数多，说明酒店档次低
    # 如果团费低但天数少（2天），可能是温泉/度假酒店引流产品
    if duration <= 3:
        # 短途游：团费主要 = 酒店 + 少量交通
        # 2天游团费¥199，酒店可能¥300-400（温泉）
        if price < 300:
            # 可能是引流产品，酒店成本高于团费
            # 但单房差不应该超过酒店实际价格
            pass  # 保持产品类型决定的价格
        elif price < 500:
            # 普通短途游
            base_price = min(base_price, 280)
        elif price < 800:
            base_price = min(base_price, 350)
    else:
        # 长途游：团费包含机票/高铁，酒店占比相对低
        if price < 2000:
            base_price = min(base_price, 250)
        elif price < 5000:
            base_price = min(base_price, 350)
    
    # 4. 设置下限，避免过低
    if base_price < 120:
        base_price = 120
    
    return int(base_price), hotel_type


def calculate_single_supplement(destination, duration, price, title=''):
    """
    计算单房差
    
    核心公式：单房差 = 住宿晚数 × 每晚酒店价格 × 0.5
    
    注意：
    - 单房差可以超过团费（短途温泉游常见）
    - 但单房差不应该超过酒店一晚的价格（否则不如自己订房）
    """
    # 签证产品不需要住宿
    if title and '签证' in title and '游' not in title and '团' not in title:
        return 0
    
    # 当天往返无住宿
    if duration <= 1:
        return 0
    
    # 获取每晚酒店价格
    hotel_price, hotel_type = get_hotel_price_per_night(destination, title, duration, price)
    
    # 住宿晚数 = 天数 - 1
    nights = duration - 1
    
    # 单房差 = 住宿晚数 × 每晚酒店价格 × 0.5
    base_ss = int(nights * hotel_price * 0.5)
    
    # 添加小幅随机浮动（±10%），让数据更自然
    import random
    random.seed(hash(title + destination + str(duration)) % 10000)
    variation = random.uniform(0.9, 1.1)
    ss = int(base_ss * variation)
    
    # 设置上限：
    # 1. 单房差不应该超过"自己订一间房"的价格
    # 2. 单房差不应该超过团费的60%（否则直接双人报名更划算）
    max_ss_by_hotel = nights * hotel_price
    max_ss_by_price = int(price * 0.6)
    max_ss = min(max_ss_by_hotel, max_ss_by_price)
    ss = min(ss, max_ss)
    
    # 确保最小值
    if ss > 0 and ss < 30:
        ss = 30
    
    return ss


def main():
    with open('public/data/tours.json', 'r', encoding='utf-8') as f:
        tours = json.load(f)
    
    print(f'总数据条数: {len(tours)}')
    print()
    
    # 更新单房差
    updated_count = 0
    for tour in tours:
        old_ss = tour['singleSupplement']
        new_ss = calculate_single_supplement(
            tour['destination'],
            tour['duration'],
            tour['price'],
            tour.get('title', '')
        )
        tour['singleSupplement'] = new_ss
        tour['singleSupplementNote'] = (
            f"单人出行需补单房差￥{new_ss}" if new_ss > 0 
            else "本产品无需单房差"
        )
        if old_ss != new_ss:
            updated_count += 1
    
    # 保存
    with open('public/data/tours.json', 'w', encoding='utf-8') as f:
        json.dump(tours, f, ensure_ascii=False, indent=2)
    
    print(f'已更新 {updated_count} 条数据的单房差')
    print()
    
    # 统计新分布
    from collections import Counter
    sources = Counter(t['source'] for t in tours)
    
    print('各来源单房差范围（改进后）:')
    for src in sorted(sources.keys()):
        src_tours = [t for t in tours if t['source'] == src]
        ss_vals = [t['singleSupplement'] for t in src_tours]
        non_zero = [v for v in ss_vals if v > 0]
        print(f'  {src}: {len(src_tours)}条, 范围{min(ss_vals)}~{max(ss_vals)}元, '
              f'非零平均{sum(non_zero)//len(non_zero) if non_zero else 0}元')
    
    print()
    # 价格区间统计
    ranges = [(0, 300), (300, 500), (500, 1000), (1000, 2000), (2000, 5000), (5000, 10000), (10000, 999999)]
    print('各价格区间平均单房差:')
    for lo, hi in ranges:
        ts = [t for t in tours if lo <= t['price'] < hi]
        if ts:
            avg = sum(t['singleSupplement'] for t in ts) / len(ts)
            print(f'  ￥{lo}-{hi}: {len(ts)}条, 平均单房差￥{avg:.0f}')
    
    print()
    # 按天数统计
    print('按行程天数统计:')
    for days in [1, 2, 3, 4, 5, 6, 7]:
        ts = [t for t in tours if t['duration'] == days and t['singleSupplement'] > 0]
        if ts:
            avg = sum(t['singleSupplement'] for t in ts) / len(ts)
            print(f'  {days}天: {len(ts)}条, 平均单房差￥{avg:.0f}')


if __name__ == '__main__':
    main()
