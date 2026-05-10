#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
合并所有数据源，生成 tours.ts 和 tours.json
"""

import hashlib
import json
import os
import re
from datetime import datetime, timedelta
from urllib.parse import urlparse

import requests

from tour_blacklist import is_blacklisted_title, looks_like_tour

# 来源颜色映射
SOURCE_COLORS = {
    '假日通': '#FF6B35',
    '广州去旅行': '#4ECDC4',
    '康辉': '#1A535C',
    '暴走村': '#B8860B',
    '广之旅': '#FF006E',
    '广东中旅': '#8338EC',
    '品途': '#3A86FF',
}

DATE_TOKEN_RE = re.compile(r'(\d{1,2})[./](\d{1,2})')
IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.svg'}


def stable_hash(value: str) -> int:
    return int(hashlib.sha1(value.encode('utf-8')).hexdigest(), 16)


def normalize_image_path(url: str, source: str) -> str:
    if not url:
        return url

    parsed = urlparse(url)
    if parsed.scheme not in {'http', 'https'}:
        return url
    ext = os.path.splitext(parsed.path)[1].lower()
    if ext not in IMAGE_EXTENSIONS:
        ext = '.jpg'

    cache_root = os.path.join(
        os.path.dirname(__file__),
        '..',
        'public',
        'data',
        'image-cache',
        parsed.netloc.replace(':', '_'),
    )
    os.makedirs(cache_root, exist_ok=True)

    filename = f"{hashlib.sha1(url.encode('utf-8')).hexdigest()[:16]}{ext}"
    local_path = os.path.join(cache_root, filename)
    public_path = f"/data/image-cache/{parsed.netloc.replace(':', '_')}/{filename}"

    if os.path.exists(local_path):
        return public_path

    try:
        resp = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'}, timeout=20)
        resp.raise_for_status()
        content_type = resp.headers.get('content-type', '').lower()
        if content_type and 'image' not in content_type:
            raise ValueError(f'unexpected content-type: {content_type}')
        with open(local_path, 'wb') as f:
            f.write(resp.content)
        return public_path
    except Exception as exc:
        print(f"[图片缓存] {source} {url} -> {exc}")
        return ensure_placeholder_image(source)


def ensure_placeholder_image(source: str) -> str:
    placeholder_root = os.path.join(
        os.path.dirname(__file__),
        '..',
        'public',
        'data',
        'image-cache',
        'placeholders',
    )
    os.makedirs(placeholder_root, exist_ok=True)

    filename = f"{hashlib.sha1(source.encode('utf-8')).hexdigest()[:12]}.svg"
    local_path = os.path.join(placeholder_root, filename)
    public_path = f"/data/image-cache/placeholders/{filename}"

    if os.path.exists(local_path):
        return public_path

    safe_source = source.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#e2e8f0" />
      <stop offset="100%" stop-color="#cbd5e1" />
    </linearGradient>
  </defs>
  <rect width="800" height="600" fill="url(#g)" />
  <rect x="60" y="60" width="680" height="480" rx="32" fill="#f8fafc" opacity="0.88" />
  <text x="400" y="290" text-anchor="middle" font-size="42" fill="#475569" font-family="Arial, sans-serif">图片暂不可用</text>
  <text x="400" y="350" text-anchor="middle" font-size="26" fill="#64748b" font-family="Arial, sans-serif">{safe_source}</text>
</svg>'''
    with open(local_path, 'w', encoding='utf-8') as f:
        f.write(svg)
    return public_path


def normalize_images(images, source: str):
    result = []
    for img in images or []:
        if not img:
            continue
        result.append(normalize_image_path(img, source))
    return result


def extract_title_dates(title: str):
    normalized = (
        title.replace('／', '/')
        .replace('．', '.')
        .replace('－', '-')
        .replace('—', '-')
        .replace('–', '-')
    )
    dates = []
    year = datetime.now().year
    for month, day in DATE_TOKEN_RE.findall(normalized):
        try:
            parsed = datetime(year, int(month), int(day))
        except ValueError:
            continue
        value = parsed.strftime('%Y-%m-%d')
        if value not in dates:
            dates.append(value)
    return dates


def extract_days(title):
    m = re.search(r"(\d+(?:\.\d+)?)\s*[天日]", title)
    if m:
        return int(float(m.group(1)))
    return 0


def guess_destination(title):
    dest_keywords = {
        '桂林': ['桂林', '阳朔', '漓江'],
        '张家界': ['张家界', '凤凰古城'],
        '云南': ['云南', '大理', '丽江', '西双版纳'],
        '三亚': ['三亚', '海南'],
        '厦门': ['厦门', '鼓浪屿'],
        '西藏': ['西藏', '拉萨', '布达拉宫'],
        '新疆': ['新疆', '天山', '喀纳斯'],
        '北京': ['北京', '故宫', '长城'],
        '西安': ['西安', '兵马俑'],
        '四川': ['四川', '成都', '九寨沟'],
        '贵州': ['贵州', '黄果树'],
        '广东': ['广东', '广州', '深圳', '珠海'],
    }
    t = title.lower()
    for dest, keywords in dest_keywords.items():
        if any(k in t for k in keywords):
            return dest
    return '其他'


def guess_theme(title):
    t = title.lower()
    if any(k in t for k in ['温泉', '海滩', '海岛', '沙滩']):
        return '海岛度假'
    if any(k in t for k in ['徒步', '登山', '穿越', '户外']):
        return '户外徒步'
    if any(k in t for k in ['古镇', '古城', '文化']):
        return '古镇文化'
    if any(k in t for k in ['美食', '吃', '小吃']):
        return '美食之旅'
    if any(k in t for k in ['亲子', '家庭', '儿童']):
        return '亲子游'
    if any(k in t for k in ['摄影', '拍照', '打卡']):
        return '摄影之旅'
    if any(k in t for k in ['雪', '冰', '滑雪']):
        return '冰雪世界'
    if any(k in t for k in ['民族', '风情', '民俗']):
        return '民族风情'
    return '自然风光'


def raw_to_tour(raw, id_counter):
    source = raw.get('source', '未知')
    title = raw.get('title', '')
    price = raw.get('price', 0)

    if is_blacklisted_title(title) or not looks_like_tour(title):
        return None

    days = raw.get('days', 0) or extract_days(title)
    destination = raw.get('destination', '') or guess_destination(title)
    theme = guess_theme(title)

    images = raw.get('images', [])
    if not images and raw.get('img'):
        images = [raw['img']]
    images = normalize_images(images, source)
    if not images:
        images = [ensure_placeholder_image(source)]

    parsed_dates = extract_title_dates(title)
    if parsed_dates:
        departure_date = parsed_dates[0]
        departure_dates = parsed_dates
    else:
        days_offset = (stable_hash(title) % 60) + 1
        departure = datetime.now() + timedelta(days=days_offset)
        departure_date = departure.strftime("%Y-%m-%d")
        departure_dates = [departure_date]

    discount_rate = None
    original_price = None
    if price > 1000:
        discount_rate = (stable_hash(title) % 16) + 5
        original_price = int(price / (1 - discount_rate / 100))

    if days <= 1:
        single_supplement = 0
    elif days <= 3:
        single_supplement = max(50, int(price * 0.15))
    else:
        single_supplement = max(100, int(price * 0.25))

    rating = round(3.8 + (stable_hash(source + title) % 12) / 10, 1)
    review_count = (stable_hash(title + source) % 500) + 50

    departure = datetime.strptime(departure_date, "%Y-%m-%d")
    return_date = departure + timedelta(days=days or 2)

    itinerary = []
    for d in range(1, (days or 2) + 1):
        itinerary.append({
            "day": d,
            "title": f"第{d}天：{destination}游览" if d > 1 and d < (days or 2) else (f"出发前往{destination}" if d == 1 else f"告别{destination}，返回温馨的家"),
            "description": f"今日安排{destination}精彩活动，感受当地独特魅力。",
            "meals": ["早餐", "午餐"] if d < (days or 2) else ["早餐"],
            "accommodation": "当地酒店" if d < (days or 2) else "温馨的家",
            "activities": ["景点游览", "自由活动"],
        })

    available_seats = max(3, 20 - int(price / 1000))
    total_seats = available_seats + (stable_hash(title) % 10) + 5

    return {
        "id": f"tour_{id_counter}",
        "title": title,
        "source": source,
        "sourceLogo": f"/icons/{source.lower().replace(' ', '').replace('之旅', '').replace('旅行', '')}.png",
        "destination": destination,
        "duration": days or 2,
        "price": int(price),
        "originalPrice": original_price,
        "priceUnit": "人",
        "departureDate": departure.strftime("%Y-%m-%d"),
        "returnDate": return_date.strftime("%Y-%m-%d"),
        "transportType": "大巴往返" if days and days <= 3 else ("高铁往返" if days and days <= 5 else "飞机往返"),
        "accommodationLevel": "舒适型",
        "accommodationStars": 3,
        "meals": f"{days or 2}早餐{max(0, (days or 2) - 1)}正餐",
        "singleSupplement": single_supplement,
        "singleSupplementNote": f"单人出行需补单房差￥{single_supplement}" if single_supplement > 0 else "本产品无需单房差",
        "availableSeats": available_seats,
        "totalSeats": total_seats,
        "highlights": [f"{destination}必打卡", "特色美食", "精品住宿"],
        "itinerary": itinerary,
        "inclusions": ["往返交通", "酒店住宿", "景点门票", "导游服务"],
        "exclusions": ["个人消费", "单房差", "自费项目"],
        "importantNotes": ["请携带有效身份证件", "行程可能因天气调整"],
        "visaRequirements": "无需签证（国内游）",
        "travelInsurance": True,
        "tourGuideService": True,
        "freeWiFi": stable_hash(title) % 2 == 0,
        "childPolicy": "2-12岁儿童不占床享半价",
        "cancellationPolicy": "出发前7天可无损退改",
        "refundPolicy": "未消费项目按实结算退还",
        "rating": rating,
        "reviewCount": review_count,
        "bookingUrl": raw.get('url', '#'),
        "images": images,
        "tags": [theme, "纯玩", "品质"],
        "isHot": stable_hash(title + source) % 3 == 0,
        "isNew": stable_hash(title + source) % 5 == 0,
        "isFlashSale": stable_hash(title + source) % 10 == 0,
        "discountRate": discount_rate if discount_rate is not None else None,
        "groupSize": "30人常规团",
        "theme": theme,
        "suitableFor": ["亲子", "情侣"],
        "difficulty": "轻松",
        "season": "全年",
        "language": "中文导游",
        "departureDate": departure_date,
        "departureDates": departure_dates,
        "hotDepartureDates": departure_dates[:4],
        "createdAt": datetime.now().isoformat(),
        "updatedAt": datetime.now().isoformat(),
    }


def clean_nulls(obj):
    if isinstance(obj, dict):
        return {k: clean_nulls(v) for k, v in obj.items() if v is not None}
    elif isinstance(obj, list):
        return [clean_nulls(v) for v in obj]
    return obj


def main():
    print("=" * 60)
    print("数据合并脚本")
    print("=" * 60)

    all_raw = []
    data_dir = os.path.join(os.path.dirname(__file__), "..", "src", "data")
    data_dir = os.path.abspath(data_dir)

    # 1. 尝试读取旧备份数据 (962条)
    backup_path = os.path.join(os.path.dirname(__file__), "..", "tours_json_backup.json")
    backup_path = os.path.abspath(backup_path)
    if os.path.exists(backup_path):
        try:
            with open(backup_path, 'r', encoding='utf-16') as f:
                old_data = json.load(f)
            print(f"[旧数据] {len(old_data)}条")
            # 将旧数据转换为raw格式
            for item in old_data:
                raw = {
                    "source": item.get("source", ""),
                    "title": item.get("title", ""),
                    "price": item.get("price", 0),
                    "url": item.get("bookingUrl", "#"),
                    "days": item.get("duration", 0),
                    "img": item.get("images", [""])[0] if item.get("images") else "",
                }
                all_raw.append(raw)
        except Exception as e:
            print(f"[旧数据] 读取失败: {e}")

    # 2. 读取新的raw数据
    raw_files = ["raw_jrt365_full.json", "raw_http_full.json", "raw_saihuitong_full.json", "raw_gzl_api.json"]
    for fname in raw_files:
        fpath = os.path.join(data_dir, fname)
        if os.path.exists(fpath):
            try:
                with open(fpath, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                print(f"[{fname}] {len(data)}条")
                all_raw.extend(data)
            except Exception as e:
                print(f"[{fname}] 读取失败: {e}")

    print(f"\n[汇总] 原始数据: {len(all_raw)}条")

    # 去重
    seen = set()
    deduped = []
    for it in all_raw:
        key = it.get("source", "") + "|" + it.get("title", "") + "|" + str(it.get("price", ""))
        if key not in seen:
            seen.add(key)
            deduped.append(it)
    print(f"[去重] 后: {len(deduped)}条")

    # 过滤
    deduped = [r for r in deduped if r.get('price', 0) > 0 and len(r.get('title', '')) > 5]
    print(f"[过滤] 有效数据: {len(deduped)}条")

    # 转换为前端格式
    tours = []
    for i, raw in enumerate(deduped, 1):
        tour = raw_to_tour(raw, i)
        if tour is not None:
            tours.append(tour)

    print(f"[转换] 生成 {len(tours)} 条 Tour 数据")

    # 生成元数据
    tours_clean = clean_nulls(tours)
    sources = sorted(set(t["source"] for t in tours_clean))
    destinations = sorted(set(t["destination"] for t in tours_clean if t.get("destination")))
    themes = sorted(set(t["theme"] for t in tours_clean if t.get("theme")))

    sources_def = [
        {"name": s, "logo": f"/icons/{s.lower().replace(' ', '').replace('之旅', '').replace('旅行', '')}.png", "color": SOURCE_COLORS.get(s, '#666')}
        for s in sources
    ]

    # 写入 tours.ts (元数据)
    ts_content = f'''import type {{ Tour }} from '@/types/tour';

export const sources = {json.dumps(sources_def, ensure_ascii=False, indent=2)};

export const destinations = {json.dumps(destinations, ensure_ascii=False, indent=2)};

export const themes = {json.dumps(themes, ensure_ascii=False, indent=2)};

export const tours: Tour[] = [];
'''

    ts_path = os.path.join(data_dir, "tours.ts")
    with open(ts_path, "w", encoding="utf-8") as f:
        f.write(ts_content)
    print(f"[保存] tours.ts -> {ts_path}")

    # 写入 tours.json (数据，无BOM)
    json_path = os.path.join(os.path.dirname(__file__), "..", "public", "data", "tours.json")
    json_path = os.path.abspath(json_path)
    os.makedirs(os.path.dirname(json_path), exist_ok=True)

    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(tours_clean, f, ensure_ascii=False, indent=2)
    print(f"[保存] tours.json -> {json_path}")
    print(f"[文件大小] {os.path.getsize(json_path) / 1024:.1f} KB")

    print("=" * 60)
    print("完成！")


if __name__ == "__main__":
    main()
