#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
合并所有数据源，生成 tours.ts 和 tours.json
"""

import hashlib
import json
import os
import re
import tempfile
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timedelta
from pathlib import Path
from urllib.parse import urlparse

import requests

from detail_parsers import detail_has_content, empty_detail, fetch_detail_data
from geo_catalog import classify_route, normalize_tour_geo
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

PLACEHOLDER_LABEL = '老广精选线路'
GENERIC_HIGHLIGHTS = {
    ("其他必打卡", "特色美食", "精品住宿"),
    ("广东必打卡", "特色美食", "精品住宿"),
    ("云南必打卡", "特色美食", "精品住宿"),
    ("北京必打卡", "特色美食", "精品住宿"),
    ("新疆必打卡", "特色美食", "精品住宿"),
}
DATE_TOKEN_RE = re.compile(r'(?<!\d)(\d{1,2})[./-](\d{1,2})(?!\d)')
IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.svg'}
RAW_FILE_PRIORITIES = {
    "raw_jrt365_full.json": 10,
    "raw_jrt365.json": 20,
    "raw_http_full.json": 10,
    "raw_kanghui.json": 10,
    "raw_pintu_full.json": 10,
    "raw_saihuitong_full.json": 10,
    "raw_gzl_api.json": 10,
}
JRT365_HOST_TOKEN = "jrt365.com"
SCHEDULE_REQUIRED_SOURCES = {"假日通", "广之旅"}


def stable_hash(value: str) -> int:
    return int(hashlib.sha1(value.encode('utf-8')).hexdigest(), 16)


def string_list(value) -> list[str]:
    if not isinstance(value, list):
        return []
    return [str(item).strip() for item in value if item is not None and str(item).strip()]


def nonnegative_number(value, default=0):
    try:
        number = float(value)
    except (TypeError, ValueError):
        return default
    if number < 0:
        return default
    return int(number) if number.is_integer() else number


SERVICE_STATUS_VALUES = {"included", "excluded", "unknown"}


def extract_service_status(detail: dict, keywords: tuple[str, ...]) -> str:
    included = "\n".join(string_list(detail.get("inclusions")))
    excluded = "\n".join(string_list(detail.get("exclusions")))
    in_match = any(keyword in included for keyword in keywords)
    out_match = any(keyword in excluded for keyword in keywords)
    if in_match == out_match:
        return "unknown"
    return "included" if in_match else "excluded"


def extract_accommodation_details(detail: dict) -> list[str]:
    values = []
    for day in detail.get("itinerary") or []:
        if not isinstance(day, dict):
            continue
        value = str(day.get("accommodation") or "").strip()
        if value and value not in values:
            values.append(value)
    return values


def extract_meal_counts(detail: dict) -> dict[str, int]:
    counts = {"breakfast": 0, "lunch": 0, "dinner": 0}
    tokens = {
        "breakfast": ("早餐", "早餐"),
        "lunch": ("午餐", "中餐"),
        "dinner": ("晚餐", "晚饭", "晚餐"),
    }
    for day in detail.get("itinerary") or []:
        if not isinstance(day, dict):
            continue
        for meal in string_list(day.get("meals")):
            for name, names in tokens.items():
                if any(token in meal for token in names):
                    counts[name] += 1
                    break
    return counts


def summarize_accommodation(values: list[str]) -> tuple[str, int]:
    hotel_values = [value for value in values if "酒店" in value or "宾馆" in value or "客栈" in value]
    if not hotel_values:
        return "", 0
    stars = set()
    for value in hotel_values:
        match = re.search(r"([1-5一二三四五])\s*星", value)
        if match:
            token = match.group(1)
            star = {"一": 1, "二": 2, "三": 3, "四": 4, "五": 5}.get(token, 0)
            stars.add(star or int(token))
    stars.discard(0)
    if len(stars) == 1:
        star = next(iter(stars))
        return f"{star}星酒店", star
    return "酒店住宿", 0


def build_source_meta(
    raw: dict,
    detail: dict,
    *,
    destination_source: str,
    dates_source: str,
    duration_source: str,
    geo_field_sources: dict,
) -> dict:
    """Keep source-specific fields without changing the legacy Tour shape."""
    raw_meta = raw.get("meta") if isinstance(raw.get("meta"), dict) else {}
    raw_attributes = raw_meta.get("sourceAttributes")
    source_attributes = dict(raw_attributes) if isinstance(raw_attributes, dict) else {}
    for key in (
        "supplierName",
        "productType",
        "priceSource",
        "startingPrice",
        "groupno",
        "tournameno",
        "printUrl",
        "hasDetailContent",
    ):
        value = raw.get(key)
        if value in (None, "", [], {}):
            value = raw_meta.get(key)
        if value not in (None, "", [], {}):
            source_attributes[key] = value

    raw_ai_tags = string_list(raw_meta.get("aiTags"))
    raw_features = string_list(raw_meta.get("sourceFeatures"))
    source_meta = {
        "aiTags": raw_ai_tags,
        "sourceFeatures": raw_features,
        "sourceAttributes": source_attributes,
    }
    detail_fields = {
        field
        for field in (
            "itinerary",
            "inclusions",
            "exclusions",
            "optionalExpenses",
            "importantNotes",
            "childPolicy",
            "singleSupplementNote",
            "cancellationPolicy",
            "refundPolicy",
        )
        if detail.get(field)
    }
    raw_tags = string_list(raw.get("tags"))
    source_features = raw_features
    detail_itinerary = detail.get("itinerary") if isinstance(detail.get("itinerary"), list) else []
    has_detail_meals = any(
        isinstance(day.get("meals"), list) and any(str(meal).strip() for meal in day.get("meals"))
        for day in detail_itinerary
        if isinstance(day, dict)
    )
    accommodation_details = extract_accommodation_details(detail)
    meal_counts = extract_meal_counts(detail)
    service_status = {
        "visaRequirements": extract_service_status(detail, ("签证",)),
        "travelInsurance": extract_service_status(detail, ("保险", "意外险")),
        "tourGuideService": extract_service_status(detail, ("导游", "领队", "司导")),
    }
    field_sources = {
        "price": "source" if raw.get("price") is not None else "unknown",
        "duration": duration_source,
        "destination": destination_source,
        "departureDates": dates_source,
        "highlights": "detail" if detail.get("highlights") else "unknown",
        "theme": "inferred",
        "leisureLevel": "inferred",
        "transportType": "source" if str(raw.get("transportType") or "").strip() else "inferred",
        "tags": "source" if isinstance(raw_tags, list) and raw_tags else "unknown",
        "groupSize": "unknown",
        "accommodationLevel": "unknown",
        "accommodationStars": "unknown",
        "meals": "detail" if has_detail_meals else "unknown",
        "suitableFor": "unknown",
        "season": "unknown",
        "visaRequirements": "unknown",
        "difficulty": "unknown",
        "language": "unknown",
        "travelInsurance": "unknown",
        "tourGuideService": "unknown",
        "freeWiFi": "source" if isinstance(source_features, list) and source_features else "unknown",
        "rating": "unknown",
        "reviewCount": "unknown",
        "availableSeats": "unknown",
        "totalSeats": "unknown",
        "singleSupplement": "detail" if detail.get("singleSupplementAmount") is not None else "unknown",
        "singleSupplementNote": "detail" if detail.get("singleSupplementNote") else "unknown",
        "returnDate": "inferred" if raw.get("departureDate") or detail.get("itinerary") else "unknown",
        "isHot": "inferred",
        "isNew": "inferred",
        "isFlashSale": "unknown",
        "originalPrice": "unknown",
        "discountRate": "unknown",
        "accommodationDetails": "detail" if accommodation_details else "unknown",
        "mealCounts": "detail" if any(meal_counts.values()) else "unknown",
        "serviceStatus": "detail" if any(value != "unknown" for value in service_status.values()) else "unknown",
    }
    field_sources.update(geo_field_sources)
    field_sources.setdefault("routeRegion", "inferred")
    if str(raw.get("accommodationLevel") or "").strip():
        field_sources["accommodationLevel"] = "source"
    if str(raw.get("groupSize") or "").strip():
        field_sources["groupSize"] = "source"
    elif re.search(r"\d+\s*人(?:小团|精品团|常规团|大团)", str(raw.get("title") or "")):
        field_sources["groupSize"] = "inferred"
    if raw.get("originalPrice") is not None:
        field_sources["originalPrice"] = "source"
    if raw.get("discountRate") is not None:
        field_sources["discountRate"] = "source"
    if "isFlashSale" in raw:
        field_sources["isFlashSale"] = "source"
    raw_provenance_fields = {
        "groupSize": raw.get("groupSize"),
        "accommodationLevel": raw.get("accommodationLevel"),
        "accommodationStars": raw.get("accommodationStars"),
        "meals": raw.get("meals"),
        "suitableFor": raw.get("suitableFor"),
        "season": raw.get("season"),
        "visaRequirements": raw.get("visaRequirements"),
        "difficulty": raw.get("difficulty"),
        "language": raw.get("language"),
        "travelInsurance": raw.get("travelInsurance"),
        "tourGuideService": raw.get("tourGuideService"),
        "rating": raw.get("rating"),
        "reviewCount": raw.get("reviewCount"),
        "availableSeats": raw.get("availableSeats"),
        "totalSeats": raw.get("totalSeats"),
    }
    for field, value in raw_provenance_fields.items():
        if value not in (None, "", [], {}):
            field_sources[field] = "source"
    if "wifi_available" in raw_features:
        field_sources["freeWiFi"] = "source"
    for field in detail_fields:
        field_sources[field] = "detail"
    if accommodation_details:
        field_sources["accommodationLevel"] = "source" if field_sources.get("accommodationLevel") == "source" else "detail"
        field_sources["accommodationStars"] = "detail"
    synthetic_fields = [field for field, source in field_sources.items() if source == "synthetic"]
    source_meta["dataQuality"] = {
        "fieldSources": field_sources,
        "syntheticFields": synthetic_fields,
        "riskFlags": [f"synthetic:{field}" for field in synthetic_fields],
    }
    source_meta["structuredDetails"] = {
        "accommodationDetails": accommodation_details,
        "mealCounts": meal_counts if any(meal_counts.values()) else {},
        "serviceStatus": service_status,
    }
    return source_meta


def normalize_image_path(url: str, source: str) -> str:
    if not url:
        return url

    image_cache_mode = os.environ.get("IMAGE_CACHE_MODE", "download").strip().lower()

    parsed = urlparse(url)
    if parsed.scheme not in {'http', 'https'}:
        return url
    if image_cache_mode in {"remote", "skip", "off"}:
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
  <text x="400" y="290" text-anchor="middle" font-size="42" fill="#475569" font-family="Arial, sans-serif">{PLACEHOLDER_LABEL}</text>
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


def prefetch_image_cache(raw_items):
    image_urls = set()
    for raw in raw_items:
        images = raw.get("images", [])
        if not images and raw.get("img"):
            images = [raw["img"]]
        for image in images or []:
            value = str(image or "").strip()
            if value.startswith(("http://", "https://")):
                image_urls.add(value)

    if not image_urls:
        return

    workers = max(4, min(32, int(os.environ.get("IMAGE_CACHE_WORKERS", "16") or "16")))
    print(f"[图片缓存] 并发预取 {len(image_urls)} 张，线程数 {workers}", flush=True)
    started = datetime.now()
    completed = 0
    with ThreadPoolExecutor(max_workers=workers) as executor:
        futures = {
            executor.submit(normalize_image_path, image_url, "prefetch"): image_url
            for image_url in image_urls
        }
        for future in as_completed(futures):
            future.result()
            completed += 1
            if completed % 100 == 0 or completed == len(futures):
                elapsed = max((datetime.now() - started).total_seconds(), 0.001)
                rate = completed / elapsed
                print(
                    f"[图片缓存] {completed}/{len(futures)} | 速率 {rate:.1f}/s | "
                    f"耗时 {elapsed / 60:.1f}min",
                    flush=True,
                )


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


def raw_to_tour(raw, id_counter, detail=None):
    source = raw.get('source', '未知')
    title = raw.get('title', '')
    price = raw.get('price', 0)
    detail = detail or empty_detail()

    if is_blacklisted_title(title):
        return None
    if source == '广之旅' and '/hotel/' in str(raw.get('url', '')).lower():
        return None

    raw_days = raw.get('days', 0)
    title_days = extract_days(title)
    days = raw_days or title_days
    if not days:
        return None
    duration_source = 'source' if raw_days else ('inferred' if title_days else 'unknown')
    raw_destination = str(raw.get('destination') or '').strip()
    destination = raw_destination or guess_destination(title)
    destination_source = 'source' if raw_destination else 'inferred'
    geo_fields, geo_field_sources = normalize_tour_geo(raw, title, destination, detail)
    geo_fields["routeRegion"] = classify_route(geo_fields)
    theme = guess_theme(title)
    leisure_level = guess_leisure_level(title, days, theme)

    images = raw.get('images', [])
    if not images and raw.get('img'):
        images = [raw['img']]
    images = normalize_images(images, source)
    if not images:
        images = [ensure_placeholder_image(source)]

    structured_dates = []
    raw_date_values = list(raw.get("departureDates") or [])
    raw_date_values.extend(raw.get("departureDaysList") or [])
    if raw.get("departureDate"):
        raw_date_values.append(raw.get("departureDate"))
    for value in raw_date_values:
        try:
            normalized_date = datetime.strptime(str(value).strip(), "%Y-%m-%d").strftime("%Y-%m-%d")
        except (TypeError, ValueError):
            continue
        if normalized_date not in structured_dates:
            structured_dates.append(normalized_date)

    parsed_dates = structured_dates or extract_title_dates(title)
    if parsed_dates:
        departure_date = parsed_dates[0]
        departure_dates = parsed_dates
    else:
        departure_date = ""
        departure_dates = []

    dates_source = 'source' if structured_dates else ('inferred' if parsed_dates else 'unknown')

    single_supplement_amount = detail.get("singleSupplementAmount")
    single_supplement = nonnegative_number(single_supplement_amount)

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
    source_meta = build_source_meta(
        raw,
        detail,
        destination_source=destination_source,
        dates_source=dates_source,
        duration_source=duration_source,
        geo_field_sources=geo_field_sources,
    )

    raw_meta = raw.get("meta") if isinstance(raw.get("meta"), dict) else {}
    raw_tags = string_list(raw.get("tags"))
    detail_meals = []
    for day in detail.get("itinerary") or []:
        if not isinstance(day, dict):
            continue
        meals = day.get("meals")
        if not isinstance(meals, list):
            continue
        for meal in meals:
            if meal is None:
                continue
            value = str(meal).strip()
            if value and value not in detail_meals:
                detail_meals.append(value)
    raw_meals = str(raw.get("meals") or "").strip()
    meals_value = "、".join(detail_meals) or raw_meals
    transport_value = str(raw.get("transportType") or "").strip()
    if not transport_value:
        transport_value = "大巴往返" if days and days <= 3 else ("高铁往返" if days and days <= 5 else "飞机往返")
    group_size = str(raw.get("groupSize") or "").strip()
    if not group_size:
        group_match = re.search(r"\d+\s*人(?:小团|精品团|常规团|大团)", title)
        group_size = group_match.group(0) if group_match else ""
    source_features = string_list(raw_meta.get("sourceFeatures"))
    if isinstance(source_features, list) and source_features:
        free_wifi = "wifi_available" in source_features
    else:
        free_wifi = False
    original_price = raw.get("originalPrice")
    try:
        original_price = int(float(original_price)) if original_price is not None else None
    except (TypeError, ValueError):
        original_price = None
    discount_rate = raw.get("discountRate")
    try:
        discount_rate = float(discount_rate) if discount_rate is not None else None
    except (TypeError, ValueError):
        discount_rate = None
    raw_accommodation_level = str(raw.get("accommodationLevel") or "").strip()
    accommodation_level = raw_accommodation_level
    accommodation_stars = raw.get("accommodationStars")
    try:
        accommodation_stars = int(float(accommodation_stars)) if accommodation_stars is not None else 0
    except (TypeError, ValueError):
        accommodation_stars = 0
    accommodation_details = extract_accommodation_details(detail)
    accommodation_summary, detail_accommodation_stars = summarize_accommodation(accommodation_details)
    if not accommodation_level:
        accommodation_level = accommodation_summary
    if not accommodation_stars:
        accommodation_stars = detail_accommodation_stars
    meal_counts = extract_meal_counts(detail)
    service_status = {
        "visaRequirements": extract_service_status(detail, ("签证",)),
        "travelInsurance": extract_service_status(detail, ("保险", "意外险")),
        "tourGuideService": extract_service_status(detail, ("导游", "领队", "司导")),
    }

    return {
        "id": f"tour_{id_counter}",
        "title": title,
        "source": source,
        "sourceId": raw.get('sourceId') or raw.get('source_id') or raw.get('sourceID') or raw.get('id'),
        "meta": source_meta,
        "dataQuality": source_meta["dataQuality"],
        "sourceLogo": f"/icons/{source.lower().replace(' ', '').replace('之旅', '').replace('旅行', '')}.png",
        "destination": destination,
        **geo_fields,
        "duration": days or 2,
        "price": int(price),
        "originalPrice": original_price,
        "priceUnit": "人",
        "departureDate": departure_date,
        "returnDate": return_date,
        "transportType": transport_value,
        "accommodationLevel": accommodation_level,
        "accommodationStars": accommodation_stars,
        "accommodationDetails": accommodation_details,
        "mealCounts": meal_counts if any(meal_counts.values()) else None,
        "serviceStatus": service_status,
        "meals": meals_value,
        "singleSupplement": single_supplement,
        "singleSupplementNote": detail.get("singleSupplementNote", ""),
        "availableSeats": nonnegative_number(raw.get("availableSeats")),
        "totalSeats": nonnegative_number(raw.get("totalSeats")),
        "highlights": detail.get("highlights", []),
        "itinerary": detail.get("itinerary", []),
        "inclusions": detail.get("inclusions", []),
        "exclusions": detail.get("exclusions", []),
        "optionalExpenses": detail.get("optionalExpenses", []),
        "importantNotes": detail.get("importantNotes", []),
        "visaRequirements": str(raw.get("visaRequirements") or "").strip(),
        "travelInsurance": bool(raw.get("travelInsurance", False)),
        "tourGuideService": bool(raw.get("tourGuideService", False)),
        "freeWiFi": free_wifi,
        "childPolicy": detail.get("childPolicy", ""),
        "cancellationPolicy": detail.get("cancellationPolicy", ""),
        "refundPolicy": detail.get("refundPolicy", ""),
        "rating": nonnegative_number(raw.get("rating")),
        "reviewCount": nonnegative_number(raw.get("reviewCount")),
        "bookingUrl": str(raw.get('url') or '').strip(),
        "images": images,
        "tags": raw_tags,
        "isHot": recommendation_score >= 5,
        "isNew": is_new,
        "isFlashSale": False,
        "discountRate": discount_rate,
        "groupSize": group_size,
        "theme": theme,
        "leisureLevel": leisure_level,
        "suitableFor": string_list(raw.get("suitableFor")),
        "difficulty": str(raw.get("difficulty") or "").strip(),
        "season": str(raw.get("season") or "").strip(),
        "language": str(raw.get("language") or "").strip(),
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


def write_json_atomically(path, value):
    directory = os.path.dirname(path) or "."
    fd, temp_path = tempfile.mkstemp(prefix=".merge-", suffix=".json", dir=directory)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            json.dump(value, f, ensure_ascii=False, separators=(",", ":"))
        os.replace(temp_path, path)
    except Exception:
        try:
            os.unlink(temp_path)
        except FileNotFoundError:
            pass
        raise


def make_tour_key(item):
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
        1 if str(item.get("url") or "").strip() else 0,
        1 if str(item.get("img") or "").strip() else 0,
    )


def prefer_raw_candidate(current, candidate):
    return score_raw_candidate(candidate) >= score_raw_candidate(current)


def has_structured_departure_dates(raw):
    values = list(raw.get("departureDates") or [])
    values.extend(raw.get("departureDaysList") or [])
    if raw.get("departureDate"):
        values.append(raw.get("departureDate"))
    return any(re.fullmatch(r"\d{4}-\d{2}-\d{2}", str(value).strip()) for value in values if value)


def extract_existing_detail(item):
    quality = item.get("dataQuality") or item.get("meta", {}).get("dataQuality") or {}
    field_sources = quality.get("fieldSources", {}) if isinstance(quality, dict) else {}

    def cached_value(field, default):
        if field_sources.get(field) == "synthetic":
            return default
        value = item.get(field, default)
        if field == "highlights" and tuple(value or ()) in GENERIC_HIGHLIGHTS:
            return default
        return value

    return {
        "highlights": cached_value("highlights", []),
        "itinerary": cached_value("itinerary", []),
        "inclusions": cached_value("inclusions", []),
        "exclusions": cached_value("exclusions", []),
        "optionalExpenses": cached_value("optionalExpenses", []),
        "importantNotes": cached_value("importantNotes", []),
        "childPolicy": cached_value("childPolicy", ""),
        "singleSupplementNote": cached_value("singleSupplementNote", ""),
        "singleSupplementAmount": cached_value("singleSupplement", None),
        "cancellationPolicy": cached_value("cancellationPolicy", ""),
        "refundPolicy": cached_value("refundPolicy", ""),
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
    cache_ttl_hours = float(os.environ.get("AVAILABILITY_CACHE_TTL_HOURS", "168") or "168")
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
        "raw_http_full.json",
        "raw_kanghui.json",
        "raw_pintu_full.json",
        "raw_saihuitong_full.json",
        "raw_gzl_api.json",
    ]
    if not os.path.exists(os.path.join(data_dir, "raw_jrt365_full.json")):
        raw_files.insert(1, "raw_jrt365.json")
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
        key = it.get("source", "") + "|" + it.get("title", "") + "|" + str(it.get("price", ""))
        previous = seen.get(key)
        if previous is None or prefer_raw_candidate(previous, it):
            seen[key] = it
    deduped = list(seen.values())
    print(f"[去重] 后: {len(deduped)}条")

    # 过滤
    deduped = [
        r for r in deduped
        if r.get('price', 0) > 0
        and len(r.get('title', '')) > 5
        and (r.get('source') not in SCHEDULE_REQUIRED_SOURCES or has_structured_departure_dates(r))
    ]
    print(f"[过滤] 有效数据: {len(deduped)}条")

    prefetch_image_cache(deduped)
    detail_results = load_detail_results(deduped, existing_tours)

    # 转换为前端格式
    tours = []
    for i, raw in enumerate(deduped, 1):
        tour = raw_to_tour(raw, i, detail_results.get(make_tour_key(raw), empty_detail()))
        if tour is not None:
            existing = existing_tours.get(make_tour_key(tour))
            if existing and existing.get("createdAt"):
                tour["createdAt"] = existing["createdAt"]
            if existing and existing.get("updatedAt"):
                tour["updatedAt"] = existing["updatedAt"]
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

    write_json_atomically(json_path, tours_clean)
    split_script = os.path.abspath(os.path.join(os.path.dirname(__file__), "split_tour_data.mjs"))
    if os.path.exists(split_script):
        os.system(f'node "{split_script}"')
    print(f"[保存] tours.json -> {json_path}")
    print(f"[文件大小] {os.path.getsize(json_path) / 1024:.1f} KB")

    print("=" * 60)
    print("完成！")


if __name__ == "__main__":
    main()
