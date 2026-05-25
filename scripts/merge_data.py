#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
合并所有数据源，生成 tours.ts 和 tours.json
"""

import hashlib
import json
import os
import re
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timedelta
from pathlib import Path
from urllib.parse import urlparse

import requests

from detail_parsers import detail_has_content, empty_detail, fetch_detail_data
from tour_blacklist import is_blacklisted_title
from validate_tour_availability import DEFAULT_CACHE, HTTP_ERROR, UNAVAILABLE, run_validation_jobs

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

DATE_TOKEN_RE = re.compile(r'(?<!\d)(\d{1,2})[./-](\d{1,2})(?!\d)')
IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.svg'}
RAW_FILE_PRIORITIES = {
    "raw_jrt365_full.json": 10,
    "raw_jrt365.json": 20,
    "raw_http_full.json": 10,
    "raw_pintu_full.json": 10,
    "raw_saihuitong_full.json": 10,
    "raw_gzl_api.json": 10,
}
JRT365_HOST_TOKEN = "jrt365.com"


def stable_hash(value: str) -> int:
    return int(hashlib.sha1(value.encode('utf-8')).hexdigest(), 16)


def normalize_image_path(url: str, source: str) -> str:
    if not url:
        return url

    image_cache_mode = os.environ.get("IMAGE_CACHE_MODE", "download").strip().lower()

    parsed = urlparse(url)
    if parsed.scheme not in {'http', 'https'}:
        return url
    if image_cache_mode in {"remote", "skip", "off"} and parsed.scheme == 'https':
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
    for match in DATE_TOKEN_RE.finditer(normalized):
        month, day = match.groups()
        start, end = match.span()
        prev_char = normalized[start - 1] if start > 0 else ''
        next_char = normalized[end] if end < len(normalized) else ''
        if prev_char in {'-', '~', '至', '到'} or next_char in {'-', '~', '至', '到'}:
            continue
        try:
            parsed = datetime(year, int(month), int(day))
        except ValueError:
            continue
        value = parsed.strftime('%Y-%m-%d')
        if value not in dates:
            dates.append(value)
    return dates


def normalize_departure_dates(values):
    normalized = []
    seen = set()
    for value in values or []:
        if not value:
            continue
        text = str(value).strip()
        try:
            parsed = datetime.strptime(text, "%Y-%m-%d")
        except ValueError:
            continue
        iso_value = parsed.strftime("%Y-%m-%d")
        if iso_value in seen:
            continue
        seen.add(iso_value)
        normalized.append(iso_value)
    normalized.sort()
    return normalized


def first_upcoming_date(dates):
    if not dates:
        return ""
    today = datetime.now().date()
    for value in dates:
        try:
            if datetime.strptime(value, "%Y-%m-%d").date() >= today:
                return value
        except ValueError:
            continue
    return dates[0]


def extract_structured_departure_dates(raw):
    candidates = []
    if raw.get("departureDates"):
        candidates.extend(raw.get("departureDates") or [])
    if raw.get("departureDaysList"):
        candidates.extend(raw.get("departureDaysList") or [])
    if raw.get("departureDate"):
        candidates.append(raw.get("departureDate"))
    dates = normalize_departure_dates(candidates)
    return first_upcoming_date(dates), dates


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


def guess_leisure_level(title: str, days: int, theme: str) -> str:
    t = title.lower()
    if any(k in t for k in ['徒步', '登山', '穿越', '户外', '探险', '露营', '漂流', '越野', '房车旅行']):
        return 'hard'
    if days >= 8 or any(k in t for k in ['长线', '深度', '环线', '邮轮', '专列']):
        return 'medium'
    if theme in ['海岛度假', '亲子游', '古镇文化', '美食之旅', '摄影之旅']:
        return 'easy'
    return 'easy'


RECOMMENDED_TITLE_HINTS = (
    "已成团",
    "即将成团",
    "热卖",
    "爆款",
    "首发",
    "限时",
    "甄选",
    "精选",
)

NEW_TITLE_HINTS = (
    "新品",
    "新上线",
    "全新上线",
    "首发",
    "新开",
)


def is_new_tour(title: str) -> bool:
    return any(token in title for token in NEW_TITLE_HINTS)


def compute_recommendation_score(
    title: str,
    departure_date: str,
    departure_dates: list[str],
    detail: dict,
) -> int:
    score = 0

    if any(token in title for token in RECOMMENDED_TITLE_HINTS):
        score += 4

    score += min(len(departure_dates or []), 4)

    if departure_date:
        try:
            target = datetime.strptime(departure_date, "%Y-%m-%d").date()
            today = datetime.now().date()
            days_until = (target - today).days
            if days_until < 0:
                score -= 1
            elif days_until <= 7:
                score += 3
            elif days_until <= 30:
                score += 2
            elif days_until <= 90:
                score += 1
        except ValueError:
            pass

    if detail.get("highlights"):
        score += 1
    if detail.get("itinerary"):
        score += 1

    return score


def raw_to_tour_legacy(raw, id_counter, detail=None):
    return raw_to_tour(raw, id_counter, detail=detail)
    source = raw.get('source', '未知')
    title = raw.get('title', '')
    price = raw.get('price', 0)
    detail = detail or empty_detail()

    if is_blacklisted_title(title):
        return None
    if source == '广之旅' and '/hotel/' in str(raw.get('url', '')).lower():
        return None

    days = raw.get('days', 0) or extract_days(title)
    destination = raw.get('destination', '') or guess_destination(title)
    theme = guess_theme(title)
    leisure_level = guess_leisure_level(title, days, theme)

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
        estimated_single_supplement = 0
    elif days <= 3:
        estimated_single_supplement = max(50, int(price * 0.15))
    else:
        estimated_single_supplement = max(100, int(price * 0.25))

    actual_single_supplement = detail.get("singleSupplementAmount")
    single_supplement = int(actual_single_supplement) if actual_single_supplement is not None else estimated_single_supplement

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
        "singleSupplementNote": detail.get("singleSupplementNote", ""),
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
        "leisureLevel": leisure_level,
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


def raw_to_tour(raw, id_counter, detail=None):
    source = raw.get('source', '未知')
    title = raw.get('title', '')
    price = raw.get('price', 0)
    detail = detail or empty_detail()

    if is_blacklisted_title(title):
        return None
    if source == '广之旅' and '/hotel/' in str(raw.get('url', '')).lower():
        return None

    days = raw.get('days', 0) or extract_days(title)
    destination = raw.get('destination', '') or guess_destination(title)
    theme = guess_theme(title)
    leisure_level = guess_leisure_level(title, days, theme)

    images = raw.get('images', [])
    if not images and raw.get('img'):
        images = [raw['img']]
    images = normalize_images(images, source)
    if not images:
        images = [ensure_placeholder_image(source)]

    departure_date, departure_dates = extract_structured_departure_dates(raw)
    if not departure_dates:
        parsed_dates = extract_title_dates(title)
        if parsed_dates:
            departure_dates = parsed_dates
            departure_date = first_upcoming_date(parsed_dates)
        else:
            departure_date = ""
            departure_dates = []

    single_supplement_amount = detail.get("singleSupplementAmount")
    single_supplement = int(single_supplement_amount) if single_supplement_amount is not None else 0

    if departure_date:
        departure = datetime.strptime(departure_date, "%Y-%m-%d")
        return_date = (departure + timedelta(days=days or 2)).strftime("%Y-%m-%d")
    else:
        return_date = ""

    recommendation_score = compute_recommendation_score(
        title,
        departure_date,
        departure_dates,
        detail,
    )
    is_new = is_new_tour(title)

    return {
        "id": f"tour_{id_counter}",
        "title": title,
        "source": source,
        "sourceLogo": f"/icons/{source.lower().replace(' ', '').replace('之旅', '').replace('旅行', '')}.png",
        "destination": destination,
        "duration": days or 2,
        "price": int(price),
        "originalPrice": None,
        "priceUnit": "人",
        "departureDate": departure_date,
        "returnDate": return_date,
        "transportType": "大巴往返" if days and days <= 3 else ("高铁往返" if days and days <= 5 else "飞机往返"),
        "accommodationLevel": "舒适型",
        "accommodationStars": 3,
        "meals": f"{days or 2}早餐{max(0, (days or 2) - 1)}正餐",
        "singleSupplement": single_supplement,
        "singleSupplementNote": detail.get("singleSupplementNote", ""),
        "availableSeats": 0,
        "totalSeats": 0,
        "highlights": detail.get("highlights") or [f"{destination}必打卡", "特色美食", "精品住宿"],
        "itinerary": detail.get("itinerary", []),
        "inclusions": detail.get("inclusions", []),
        "exclusions": detail.get("exclusions", []),
        "optionalExpenses": detail.get("optionalExpenses", []),
        "importantNotes": detail.get("importantNotes", []),
        "visaRequirements": "无需签证（国内游）",
        "travelInsurance": True,
        "tourGuideService": True,
        "freeWiFi": stable_hash(title) % 2 == 0,
        "childPolicy": detail.get("childPolicy", ""),
        "cancellationPolicy": detail.get("cancellationPolicy", ""),
        "refundPolicy": detail.get("refundPolicy", ""),
        "rating": 0,
        "reviewCount": 0,
        "bookingUrl": raw.get('url', '#'),
        "images": images,
        "tags": [theme, "纯玩", "品质"],
        "isHot": recommendation_score >= 5,
        "isNew": is_new,
        "isFlashSale": False,
        "discountRate": None,
        "groupSize": "30人常规团",
        "theme": theme,
        "leisureLevel": leisure_level,
        "suitableFor": ["亲子", "情侣"],
        "difficulty": "轻松",
        "season": "全年",
        "language": "中文导游",
        "sourceId": str(raw.get("sourceId") or raw.get("pdId") or raw.get("prodcode") or raw.get("groupno") or ""),
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


def make_tour_key(item):
    source_id = str(item.get("sourceId") or item.get("pdId") or item.get("prodcode") or item.get("groupno") or "").strip()
    if source_id:
        return f"{item.get('source', '')}|id:{source_id}"
    source = item.get("source", "")
    title = item.get("title", "")
    price = item.get("price", 0)
    try:
        price_key = str(int(float(price)))
    except (TypeError, ValueError):
        price_key = str(price)
    return f"{source}|{title}|{price_key}"


def score_raw_candidate(item):
    return (
        int(item.get("_merge_priority", 0) or 0),
        min(len(normalize_departure_dates(item.get("departureDates") or item.get("departureDaysList") or [])), 32),
        1 if str(item.get("departureDate") or "").strip() else 0,
        1 if str(item.get("url") or "").strip() else 0,
        1 if str(item.get("img") or "").strip() else 0,
    )


def prefer_raw_candidate(current, candidate):
    return score_raw_candidate(candidate) >= score_raw_candidate(current)


def extract_existing_detail(item):
    return {
        "highlights": item.get("highlights", []),
        "itinerary": item.get("itinerary", []),
        "inclusions": item.get("inclusions", []),
        "exclusions": item.get("exclusions", []),
        "optionalExpenses": item.get("optionalExpenses", []),
        "importantNotes": item.get("importantNotes", []),
        "childPolicy": "",
        "singleSupplementNote": "",
        "singleSupplementAmount": None,
        "cancellationPolicy": "",
        "refundPolicy": "",
    }


def load_detail_results(deduped, existing_tours):
    detail_mode = os.environ.get("DETAIL_FETCH_MODE", "fetch").strip().lower()
    detail_results = {}

    if detail_mode in {"cache", "cached", "existing"}:
        print(f"[详情] 使用已有 tours.json 详情缓存，共 {len(existing_tours)} 条")
        for raw in deduped:
            key = make_tour_key(raw)
            existing = existing_tours.get(key)
            if existing:
                detail_results[key] = extract_existing_detail(existing)
        return detail_results

    if detail_mode in {"off", "skip", "none"}:
        print("[详情] 已禁用远程详情抓取")
        return detail_results

    detail_workers = max(4, min(16, int(os.environ.get("DETAIL_WORKERS", "10") or "10")))
    print(f"[详情] 开始抓取 {len(deduped)} 条，线程数 {detail_workers}")
    with ThreadPoolExecutor(max_workers=detail_workers) as executor:
        future_map = {
            executor.submit(fetch_detail_data, raw): make_tour_key(raw)
            for raw in deduped
        }
        total = len(future_map)
        for idx, future in enumerate(as_completed(future_map), 1):
            key = future_map[future]
            try:
                detail = future.result() or empty_detail()
            except Exception as exc:
                print(f"[详情] {key} -> {exc}")
                detail = empty_detail()
            if not detail_has_content(detail) and key in existing_tours:
                existing_detail = extract_existing_detail(existing_tours[key])
                if detail_has_content(existing_detail):
                    detail = existing_detail
            detail_results[key] = detail
            if idx % 50 == 0 or idx == total:
                print(f"[详情] {idx}/{total}")

    return detail_results


def unique_availability_jobs(tours):
    grouped = {}
    for tour in tours:
        url = str(tour.get("bookingUrl") or "").strip()
        if not url:
            continue
        grouped.setdefault(url, []).append(tour)
    return [(url, str(items[0].get("title") or "")) for url, items in grouped.items()]


def apply_availability_filter(tours, label="all tours"):
    jobs = unique_availability_jobs(tours)
    if not jobs:
        return tours

    workers = max(4, min(20, int(os.environ.get("AVAILABILITY_WORKERS", "12") or "12")))
    timeout = float(os.environ.get("AVAILABILITY_TIMEOUT", "10") or "10")
    cache_path = os.environ.get("AVAILABILITY_CACHE_PATH", str(DEFAULT_CACHE)).strip()
    cache_ttl_hours = float(os.environ.get("AVAILABILITY_CACHE_TTL_HOURS", "24") or "24")
    print(
        f"[可用性] {label}: 开始校验 {len(jobs)} 个唯一 URL，线程数 {workers}，超时 {timeout}s，"
        f"缓存 {cache_path}（TTL {cache_ttl_hours}h）"
    )

    url_results, cache_stats = run_validation_jobs(
        jobs,
        workers=workers,
        timeout=timeout,
        cache_path=None if not cache_path else Path(cache_path),
        cache_ttl_hours=cache_ttl_hours,
        use_cache=bool(cache_path),
        write_cache=bool(cache_path),
    )
    print(
        f"[可用性] 缓存命中 {cache_stats['cache_hits']} | "
        f"刷新 {cache_stats['validated']} | 未命中 {cache_stats['cache_misses']}"
    )

    filtered = []
    removed_rows = []
    kept_by_category = {}
    removed_by_category = {}

    for tour in tours:
        url = str(tour.get("bookingUrl") or "").strip()
        result = url_results.get(url, {"category": "reachable_unverified", "reason": "missing validation result"})
        category = result.get("category", "reachable_unverified")
        if category in {UNAVAILABLE, HTTP_ERROR}:
            removed_by_category[category] = removed_by_category.get(category, 0) + 1
            removed_rows.append(
                {
                    "source": tour.get("source", ""),
                    "title": tour.get("title", ""),
                    "url": url,
                    "category": category,
                    "reason": result.get("reason", ""),
                }
            )
            continue
        kept_by_category[category] = kept_by_category.get(category, 0) + 1
        filtered.append(tour)

    print(
        f"[可用性] 保留 {len(filtered)}/{len(tours)} 条，"
        f"移除 {len(removed_rows)} 条明确下架/404 线路"
    )
    for category, count in sorted(kept_by_category.items()):
        print(f"[可用性] 保留 {category}: {count}")
    for category, count in sorted(removed_by_category.items()):
        print(f"[可用性] 移除 {category}: {count}")

    if removed_rows:
        print("[可用性] 移除样本:")
        for row in removed_rows[:10]:
            print(
                f"  [{row['category']}] {row['source']} | {row['title'][:40]} | "
                f"{row['reason']} | {row['url']}"
            )

    return filtered


def is_jrt365_tour(tour):
    url = str(tour.get("bookingUrl") or "").strip().lower()
    return JRT365_HOST_TOKEN in url


def filter_unavailable_tours(tours):
    enabled = os.environ.get("AVAILABILITY_FILTER", "1").strip().lower()
    if enabled in {"0", "false", "no", "off"}:
        jrt365_filter = os.environ.get("JRT365_AVAILABILITY_FILTER", "0").strip().lower()
        if jrt365_filter not in {"1", "true", "yes", "on"}:
            print("[可用性] 已跳过自动下架过滤")
            return tours

        jrt365_tours = [tour for tour in tours if is_jrt365_tour(tour)]
        if not jrt365_tours:
            print("[可用性] 全局过滤已关闭，且没有假日通线路需要单独校验")
            return tours

        print(f"[可用性] 全局过滤已关闭，仅校验假日通线路 {len(jrt365_tours)} 条")
        filtered_jrt365 = apply_availability_filter(jrt365_tours, label="JRT365 only")
        kept_ids = {tour.get("id") for tour in filtered_jrt365}
        return [
            tour
            for tour in tours
            if not is_jrt365_tour(tour) or tour.get("id") in kept_ids
        ]

    return apply_availability_filter(tours)


def main():
    print("=" * 60)
    print("数据合并脚本")
    print("=" * 60)

    all_raw = []
    existing_tours = {}
    data_dir = os.path.join(os.path.dirname(__file__), "..", "src", "data")
    data_dir = os.path.abspath(data_dir)
    existing_json_path = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..", "public", "data", "tours.json")
    )

    if os.path.exists(existing_json_path):
        try:
            with open(existing_json_path, "r", encoding="utf-8-sig") as f:
                existing_data = json.load(f)
            existing_tours = {make_tour_key(item): item for item in existing_data}
            print(f"[existing tours.json] {len(existing_tours)}条")
        except Exception as e:
            print(f"[existing tours.json] 读取失败: {e}")

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
    # 假日通保留两个抓取口径：
    # - raw_jrt365_full.json: 全量脚本输出
    # - raw_jrt365.json: 主爬虫输出
    # 两者存在一定差异，先一并并入，再统一去重，避免有效线路被单一路径漏掉。
    raw_files = [
        "raw_jrt365_full.json",
        "raw_jrt365.json",
        "raw_http_full.json",
        "raw_pintu_full.json",
        "raw_saihuitong_full.json",
        "raw_gzl_api.json",
    ]
    for fname in raw_files:
        fpath = os.path.join(data_dir, fname)
        if os.path.exists(fpath):
            try:
                with open(fpath, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                if fname == "raw_http_full.json":
                    data = [
                        item for item in data
                        if item.get("source") not in {"品途", "广之旅"}
                    ]
                priority = RAW_FILE_PRIORITIES.get(fname, 0)
                enriched = []
                for item in data:
                    if not isinstance(item, dict):
                        continue
                    candidate = dict(item)
                    candidate["_merge_priority"] = priority
                    enriched.append(candidate)
                print(f"[{fname}] {len(enriched)}条")
                all_raw.extend(enriched)
            except Exception as e:
                print(f"[{fname}] 读取失败: {e}")

    print(f"\n[汇总] 原始数据: {len(all_raw)}条")

    # 去重
    seen = {}
    for it in all_raw:
        key = make_tour_key(it)
        previous = seen.get(key)
        if previous is None or prefer_raw_candidate(previous, it):
            seen[key] = it
    deduped = list(seen.values())
    print(f"[去重] 后: {len(deduped)}条")

    # 过滤
    deduped = [r for r in deduped if r.get('price', 0) > 0 and len(r.get('title', '')) > 5]
    print(f"[过滤] 有效数据: {len(deduped)}条")

    detail_results = load_detail_results(deduped, existing_tours)

    # 转换为前端格式
    tours = []
    for i, raw in enumerate(deduped, 1):
        tour = raw_to_tour(raw, i, detail_results.get(make_tour_key(raw), empty_detail()))
        if tour is not None:
            existing = existing_tours.get(make_tour_key(tour))
            if existing and existing.get("createdAt"):
                tour["createdAt"] = existing["createdAt"]
            tours.append(tour)

    print(f"[转换] 生成 {len(tours)} 条 Tour 数据")
    for source in sorted(set(t["source"] for t in tours)):
        subset = [tour for tour in tours if tour["source"] == source]
        print(
            f"[详情覆盖] {source}: "
            f"itinerary={sum(1 for tour in subset if tour.get('itinerary'))}/{len(subset)} "
            f"inclusions={sum(1 for tour in subset if tour.get('inclusions'))}/{len(subset)} "
            f"exclusions={sum(1 for tour in subset if tour.get('exclusions'))}/{len(subset)} "
            f"notes={sum(1 for tour in subset if tour.get('importantNotes'))}/{len(subset)}"
        )

    tours = filter_unavailable_tours(tours)
    print(f"[输出] 自动过滤后 {len(tours)} 条 Tour 数据")

    # 生成元数据
    tours_clean = clean_nulls(tours)
    sources = sorted(set(t["source"] for t in tours_clean))
    destinations = sorted(set(t["destination"] for t in tours_clean if t.get("destination")))
    themes = sorted(set(t["theme"] for t in tours_clean if t.get("theme")))

    sources_def = [
        {"name": s, "logo": f"/icons/{s}.png", "color": SOURCE_COLORS.get(s, '#666')}
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
        json.dump(tours_clean, f, ensure_ascii=False, separators=(',', ':'))
    split_script = os.path.abspath(os.path.join(os.path.dirname(__file__), "split_tour_data.mjs"))
    if os.path.exists(split_script):
        os.system(f'node "{split_script}"')
    print(f"[保存] tours.json -> {json_path}")
    print(f"[文件大小] {os.path.getsize(json_path) / 1024:.1f} KB")

    print("=" * 60)
    print("完成！")


if __name__ == "__main__":
    main()
