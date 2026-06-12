#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
鍚堝苟鎵€鏈夋暟鎹簮锛岀敓鎴?tours.ts 鍜?tours.json
"""

import hashlib
import json
import os
import re
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timedelta
from pathlib import Path
from urllib.parse import urlparse

import requests

from detail_parsers import detail_has_content, empty_detail, fetch_detail_data
from tour_blacklist import is_blacklisted_title
from validate_tour_availability import DEFAULT_CACHE, HTTP_ERROR, UNAVAILABLE, run_validation_jobs

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(line_buffering=True)

# 鏉ユ簮棰滆壊鏄犲皠
SOURCE_COLORS = {
    '鍋囨棩閫?: '#FF6B35',
    '骞垮窞鍘绘梾琛?: '#4ECDC4',
    '搴疯緣': '#1A535C',
    '鏆磋蛋鏉?: '#B8860B',
    '骞夸箣鏃?: '#FF006E',
    '骞夸笢涓梾': '#8338EC',
    '鍝侀€?: '#3A86FF',
    '澶╂动鎴峰': '#2F855A',
}

DATE_TOKEN_RE = re.compile(r'(?<!\d)(\d{1,2})[./-](\d{1,2})(?!\d)')
IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.jfif', '.png', '.webp', '.gif', '.bmp', '.svg'}
# ?????????????????????????????
RAW_FILE_PRIORITIES = {
    "raw_jrt365_full.json": 10,
    "raw_kanghui.json": 30,
    "raw_gdcts_full.json": 20,
    "raw_http_full.json": 20,
    "raw_pintu_full.json": 10,
    "raw_saihuitong_full.json": 10,
    "raw_gzl_api.json": 10,
    "raw_outdoors_full.json": 10,
}
JRT365_HOST_TOKEN = "jrt365.com"
GZL_HOST_TOKENS = ("gzl.cn", "gzl.com.cn")
JLB_HOST_TOKEN = "360jlb.cn"
PLACEHOLDER_IMAGE_TOKENS = ("lazyimg", "{{", "}}")
OUTDOORS_HOST_TOKEN = "outdoors.com.cn"
GROUPNO_RE = re.compile(r"groupno=([^&]+)", re.IGNORECASE)
MIN_DEPARTURE_YEAR = 2000
MAX_DEPARTURE_YEAR_OFFSET = 3


def looks_like_image(content: bytes) -> bool:
    signatures = (
        b"\xff\xd8\xff",  # jpg/jpeg/jfif
        b"\x89PNG\r\n\x1a\n",
        b"GIF87a",
        b"GIF89a",
        b"RIFF",  # webp starts with RIFF....WEBP
        b"<svg",
    )
    head = content[:16].lstrip()
    return any(head.startswith(signature) for signature in signatures) or (
        content[:12].startswith(b"RIFF") and content[8:12] == b"WEBP"
    )


def stable_hash(value: str) -> int:
    return int(hashlib.sha1(value.encode('utf-8')).hexdigest(), 16)


def extract_jrt365_groupno(value: str) -> str:
    if not value:
        return ""
    match = GROUPNO_RE.search(str(value))
    return match.group(1).strip() if match else ""


# ?????????????????????????????????
def normalize_image_path(url: str, source: str) -> str:
    if not url:
        return url

    normalized_url = str(url).strip()
    if any(token in normalized_url.lower() for token in PLACEHOLDER_IMAGE_TOKENS):
        return ""

    image_cache_mode = os.environ.get("IMAGE_CACHE_MODE", "remote").strip().lower()

    parsed = urlparse(normalized_url)
    if parsed.scheme not in {'http', 'https'}:
        return normalized_url
    force_cache = (
        (source == "澶╂动鎴峰" and OUTDOORS_HOST_TOKEN in parsed.netloc) or
        (source == "鍋囨棩閫? and parsed.netloc == "jrttp.jrt365.com:8066")
    )
    if image_cache_mode in {"remote", "skip", "off"} and not force_cache:
        return normalized_url
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

    filename = f"{hashlib.sha1(normalized_url.encode('utf-8')).hexdigest()[:16]}{ext}"
    local_path = os.path.join(cache_root, filename)
    public_path = f"/data/image-cache/{parsed.netloc.replace(':', '_')}/{filename}"

    if os.path.exists(local_path):
        return public_path

    try:
        headers = {'User-Agent': 'Mozilla/5.0'}
        if source == "澶╂动鎴峰" and OUTDOORS_HOST_TOKEN in parsed.netloc:
            headers["Referer"] = f"https://www.{OUTDOORS_HOST_TOKEN}/"
        elif source == "鍋囨棩閫? and parsed.netloc == "jrttp.jrt365.com:8066":
            headers["Referer"] = "http://www.jrt365.com/"
        resp = requests.get(normalized_url, headers=headers, timeout=20)
        resp.raise_for_status()
        content_type = resp.headers.get('content-type', '').lower()
        if content_type and 'image' not in content_type and not looks_like_image(resp.content):
            raise ValueError(f'unexpected content-type: {content_type}')
        with open(local_path, 'wb') as f:
            f.write(resp.content)
        return public_path
    except Exception as exc:
        print(f"[鍥剧墖缂撳瓨] {source} {normalized_url} -> {exc}")
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
  <text x="400" y="290" text-anchor="middle" font-size="42" fill="#475569" font-family="Arial, sans-serif">鍥剧墖鏆備笉鍙敤</text>
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
        normalized = normalize_image_path(img, source)
        if normalized:
            result.append(normalized)
    return result


def extract_title_dates(title: str):
    normalized = (
        title.replace('锛?, '/')
        .replace('锛?, '.')
        .replace('锛?, '-')
        .replace('鈥?, '-')
        .replace('鈥?, '-')
    )
    dates = []
    year = datetime.now().year
    for match in DATE_TOKEN_RE.finditer(normalized):
        month, day = match.groups()
        start, end = match.span()
        prev_char = normalized[start - 1] if start > 0 else ''
        next_char = normalized[end] if end < len(normalized) else ''
        if prev_char in {'-', '~', '鑷?, '鍒?} or next_char in {'-', '~', '鑷?, '鍒?}:
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
    max_year = datetime.now().year + MAX_DEPARTURE_YEAR_OFFSET
    for value in values or []:
        if not value:
            continue
        text = str(value).strip()
        try:
            parsed = datetime.strptime(text, "%Y-%m-%d")
        except ValueError:
            continue
        if parsed.year < MIN_DEPARTURE_YEAR or parsed.year > max_year:
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


def build_ai_meta(raw, source: str, departure_date: str, departure_dates: list[str]):
    raw_meta = raw.get("meta") if isinstance(raw.get("meta"), dict) else {}
    raw_tags = raw_meta.get("aiTags") or raw.get("pdTagNames") or []
    ai_tags = []
    for value in raw_tags:
        tag = str(value or "").strip()
        if tag and tag not in ai_tags:
            ai_tags.append(tag)

    source_features = []
    for value in raw_meta.get("sourceFeatures") or []:
        feature = str(value or "").strip()
        if feature and feature not in source_features:
            source_features.append(feature)

    source_attributes = {}
    if isinstance(raw_meta.get("sourceAttributes"), dict):
        for key, value in raw_meta["sourceAttributes"].items():
            text = str(value or "").strip()
            if text:
                source_attributes[str(key)] = text

    supplier_name = str(
        raw_meta.get("supplierName")
        or raw.get("supplierName")
        or raw.get("pdCompanyName")
        or ""
    ).strip()
    if supplier_name:
        source_attributes.setdefault("supplierName", supplier_name)

    product_type = str(
        raw_meta.get("productType")
        or raw.get("productType")
        or raw.get("type")
        or ""
    ).strip()
    if product_type:
        source_attributes.setdefault("productType", product_type)

    price_source = str(
        raw_meta.get("priceSource")
        or raw.get("priceSource")
        or ""
    ).strip()
    if price_source:
        source_attributes.setdefault("priceSource", price_source)

    risk_flags = []
    if not departure_dates:
        risk_flags.append("missing_structured_schedule")
    if source == "鍋囨棩閫?:
        risk_flags.append("supplier_requires_strict_schedule_validation")

    data_quality = {
        "hasStructuredDepartureDates": bool(departure_dates),
        "isDepartureDateReliable": bool(departure_date),
        "availabilityConfidence": "high" if departure_dates else ("medium" if source != "鍋囨棩閫? else "low"),
        "riskFlags": risk_flags,
    }

    return {
        "aiTags": ai_tags[:12],
        "sourceFeatures": source_features[:8],
        "sourceAttributes": source_attributes,
        "dataQuality": data_quality,
    }


def extract_days(title):
    m = re.search(r"(\d+(?:\.\d+)?)\s*[澶╂棩]", title)
    if m:
        return int(float(m.group(1)))
    return 0


def guess_destination(title):
    dest_keywords = {
        '妗傛灄': ['妗傛灄', '闃虫湐', '婕撴睙'],
        '寮犲鐣?: ['寮犲鐣?, '鍑ゅ嚢鍙ゅ煄'],
        '浜戝崡': ['浜戝崡', '澶х悊', '涓芥睙', '瑗垮弻鐗堢撼'],
        '涓変簹': ['涓変簹', '娴峰崡'],
        '鍘﹂棬': ['鍘﹂棬', '榧撴氮灞?],
        '瑗胯棌': ['瑗胯棌', '鎷夎惃', '甯冭揪鎷夊'],
        '鏂扮枂': ['鏂扮枂', '澶╁北', '鍠€绾虫柉'],
        '鍖椾含': ['鍖椾含', '鏁呭', '闀垮煄'],
        '瑗垮畨': ['瑗垮畨', '鍏甸┈淇?],
        '鍥涘窛': ['鍥涘窛', '鎴愰兘', '涔濆娌?],
        '璐靛窞': ['璐靛窞', '榛勬灉鏍?],
        '骞夸笢': ['骞夸笢', '骞垮窞', '娣卞湷', '鐝犳捣'],
    }
    t = title.lower()
    for dest, keywords in dest_keywords.items():
        if any(k in t for k in keywords):
            return dest
    return '鍏朵粬'


def guess_theme(title):
    t = title.lower()
    if any(k in t for k in ['娓╂硥', '娴锋哗', '娴峰矝', '娌欐哗']):
        return '娴峰矝搴﹀亣'
    if any(k in t for k in ['寰掓', '鐧诲北', '绌胯秺', '鎴峰']):
        return '鎴峰寰掓'
    if any(k in t for k in ['鍙ら晣', '鍙ゅ煄', '鏂囧寲']):
        return '鍙ら晣鏂囧寲'
    if any(k in t for k in ['缇庨', '鍚?, '灏忓悆']):
        return '缇庨涔嬫梾'
    if any(k in t for k in ['浜插瓙', '瀹跺涵', '鍎跨']):
        return '浜插瓙娓?
    if any(k in t for k in ['鎽勫奖', '鎷嶇収', '鎵撳崱']):
        return '鎽勫奖涔嬫梾'
    if any(k in t for k in ['闆?, '鍐?, '婊戦洩']):
        return '鍐伴洩涓栫晫'
    if any(k in t for k in ['姘戞棌', '椋庢儏', '姘戜織']):
        return '姘戞棌椋庢儏'
    return '鑷劧椋庡厜'


def guess_leisure_level(title: str, days: int, theme: str) -> str:
    t = title.lower()
    if any(k in t for k in ['寰掓', '鐧诲北', '绌胯秺', '鎴峰', '鎺㈤櫓', '闇茶惀', '婕傛祦', '瓒婇噹', '鎴胯溅鏃呰']):
        return 'hard'
    if days >= 8 or any(k in t for k in ['闀跨嚎', '娣卞害', '鐜嚎', '閭疆', '涓撳垪']):
        return 'medium'
    if theme in ['娴峰矝搴﹀亣', '浜插瓙娓?, '鍙ら晣鏂囧寲', '缇庨涔嬫梾', '鎽勫奖涔嬫梾']:
        return 'easy'
    return 'easy'


RECOMMENDED_TITLE_HINTS = (
    "宸叉垚鍥?,
    "鍗冲皢鎴愬洟",
    "鐑崠",
    "鐖嗘",
    "棣栧彂",
    "闄愭椂",
    "鐢勯€?,
    "绮鹃€?,
)

NEW_TITLE_HINTS = (
    "鏂板搧",
    "鏂颁笂绾?,
    "鍏ㄦ柊涓婄嚎",
    "棣栧彂",
    "鏂板紑",
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
    source = raw.get('source', '鏈煡')
    title = raw.get('title', '')
    price = raw.get('price', 0)
    detail = detail or empty_detail()

    if is_blacklisted_title(title):
        return None
    if source == '骞夸箣鏃? and '/hotel/' in str(raw.get('url', '')).lower():
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
            "title": f"绗瑊d}澶╋細{destination}娓歌" if d > 1 and d < (days or 2) else (f"鍑哄彂鍓嶅線{destination}" if d == 1 else f"鍛婂埆{destination}锛岃繑鍥炴俯棣ㄧ殑瀹?),
            "description": f"浠婃棩瀹夋帓{destination}绮惧僵娲诲姩锛屾劅鍙楀綋鍦扮嫭鐗归瓍鍔涖€?,
            "meals": ["鏃╅", "鍗堥"] if d < (days or 2) else ["鏃╅"],
            "accommodation": "褰撳湴閰掑簵" if d < (days or 2) else "娓╅Θ鐨勫",
            "activities": ["鏅偣娓歌", "鑷敱娲诲姩"],
        })

    available_seats = max(3, 20 - int(price / 1000))
    total_seats = available_seats + (stable_hash(title) % 10) + 5

    return {
        "id": f"tour_{id_counter}",
        "title": title,
        "source": source,
        "sourceLogo": f"/icons/{source.lower().replace(' ', '').replace('涔嬫梾', '').replace('鏃呰', '')}.png",
        "destination": destination,
        "duration": days or 2,
        "price": int(price),
        "originalPrice": original_price,
        "priceUnit": "浜?,
        "departureDate": departure.strftime("%Y-%m-%d"),
        "returnDate": return_date.strftime("%Y-%m-%d"),
        "transportType": "澶у反寰€杩? if days and days <= 3 else ("楂橀搧寰€杩? if days and days <= 5 else "椋炴満寰€杩?),
        "accommodationLevel": "鑸掗€傚瀷",
        "accommodationStars": 3,
        "meals": f"{days or 2}鏃╅{max(0, (days or 2) - 1)}姝ｉ",
        "singleSupplement": single_supplement,
        "singleSupplementNote": detail.get("singleSupplementNote", ""),
        "availableSeats": available_seats,
        "totalSeats": total_seats,
        "highlights": [f"{destination}蹇呮墦鍗?, "鐗硅壊缇庨", "绮惧搧浣忓"],
        "itinerary": itinerary,
        "inclusions": ["寰€杩斾氦閫?, "閰掑簵浣忓", "鏅偣闂ㄧエ", "瀵兼父鏈嶅姟"],
        "exclusions": ["涓汉娑堣垂", "鍗曟埧宸?, "鑷垂椤圭洰"],
        "importantNotes": ["璇锋惡甯︽湁鏁堣韩浠借瘉浠?, "琛岀▼鍙兘鍥犲ぉ姘旇皟鏁?],
        "visaRequirements": "鏃犻渶绛捐瘉锛堝浗鍐呮父锛?,
        "travelInsurance": True,
        "tourGuideService": True,
        "freeWiFi": stable_hash(title) % 2 == 0,
        "childPolicy": "2-12宀佸効绔ヤ笉鍗犲簥浜崐浠?,
        "cancellationPolicy": "鍑哄彂鍓?澶╁彲鏃犳崯閫€鏀?,
        "refundPolicy": "鏈秷璐归」鐩寜瀹炵粨绠楅€€杩?,
        "rating": rating,
        "reviewCount": review_count,
        "bookingUrl": raw.get('url', '#'),
        "images": images,
        "tags": [theme, "绾帺", "鍝佽川"],
        "isHot": stable_hash(title + source) % 3 == 0,
        "isNew": stable_hash(title + source) % 5 == 0,
        "isFlashSale": stable_hash(title + source) % 10 == 0,
        "discountRate": discount_rate if discount_rate is not None else None,
        "groupSize": "30浜哄父瑙勫洟",
        "theme": theme,
        "leisureLevel": leisure_level,
        "suitableFor": ["浜插瓙", "鎯呬荆"],
        "difficulty": "杞绘澗",
        "season": "鍏ㄥ勾",
        "language": "涓枃瀵兼父",
        "departureDate": departure_date,
        "departureDates": departure_dates,
        "hotDepartureDates": departure_dates[:4],
        "createdAt": datetime.now().isoformat(),
        "updatedAt": datetime.now().isoformat(),
    }


# ??????????????? Tour ??????????????
def raw_to_tour(raw, id_counter, detail=None):
    source = raw.get('source', '鏈煡')
    title = raw.get('title', '')
    price = raw.get('price', 0)
    detail = detail or empty_detail()

    if is_blacklisted_title(title):
        return None
    if source == '骞夸箣鏃? and '/hotel/' in str(raw.get('url', '')).lower():
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

    structured_departure_date, raw_structured_dates = extract_structured_departure_dates(raw)
    departure_date = structured_departure_date
    departure_dates = list(raw_structured_dates)
    if source != "鍋囨棩閫? and not departure_dates:
        parsed_dates = extract_title_dates(title)
        if parsed_dates:
            departure_dates = parsed_dates
            departure_date = first_upcoming_date(parsed_dates)
        else:
            departure_date = ""
            departure_dates = []
    if source == "骞夸箣鏃? and not raw_structured_dates:
        return None
    if source == "鍋囨棩閫? and not raw_structured_dates:
        return None

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

    source_id = str(raw.get("sourceId") or raw.get("pdId") or raw.get("prodcode") or raw.get("groupno") or "").strip()
    if not source_id and source == "鍋囨棩閫?:
        source_id = extract_jrt365_groupno(raw.get("url", ""))
    ai_meta = build_ai_meta(raw, source, departure_date, departure_dates)

    return {
        "id": f"tour_{id_counter}",
        "title": title,
        "source": source,
        "sourceLogo": f"/icons/{source.lower().replace(' ', '').replace('涔嬫梾', '').replace('鏃呰', '')}.png",
        "destination": destination,
        "duration": days or 2,
        "price": int(price),
        "originalPrice": None,
        "priceUnit": "浜?,
        "departureDate": departure_date,
        "returnDate": return_date,
        "transportType": "澶у反寰€杩? if days and days <= 3 else ("楂橀搧寰€杩? if days and days <= 5 else "椋炴満寰€杩?),
        "accommodationLevel": "鑸掗€傚瀷",
        "accommodationStars": 3,
        "meals": f"{days or 2}鏃╅{max(0, (days or 2) - 1)}姝ｉ",
        "singleSupplement": single_supplement,
        "singleSupplementNote": detail.get("singleSupplementNote", ""),
        "availableSeats": 0,
        "totalSeats": 0,
        "highlights": detail.get("highlights") or [f"{destination}蹇呮墦鍗?, "鐗硅壊缇庨", "绮惧搧浣忓"],
        "itinerary": detail.get("itinerary", []),
        "inclusions": detail.get("inclusions", []),
        "exclusions": detail.get("exclusions", []),
        "optionalExpenses": detail.get("optionalExpenses", []),
        "importantNotes": detail.get("importantNotes", []),
        "visaRequirements": "鏃犻渶绛捐瘉锛堝浗鍐呮父锛?,
        "travelInsurance": True,
        "tourGuideService": True,
        "freeWiFi": stable_hash(title) % 2 == 0,
        "childPolicy": detail.get("childPolicy", ""),
        "cancellationPolicy": detail.get("cancellationPolicy", ""),
        "refundPolicy": detail.get("refundPolicy", ""),
        "rating": 0,
        "reviewCount": 0,
        "bookingUrl": raw.get('url', '#'),
        "url": raw.get('url', '#'),
        "images": images,
        "tags": [theme, "绾帺", "鍝佽川"],
        "isHot": recommendation_score >= 5,
        "isNew": is_new,
        "isFlashSale": False,
        "discountRate": None,
        "groupSize": "30浜哄父瑙勫洟",
        "theme": theme,
        "leisureLevel": leisure_level,
        "suitableFor": ["浜插瓙", "鎯呬荆"],
        "difficulty": "杞绘澗",
        "season": "鍏ㄥ勾",
        "language": "涓枃瀵兼父",
        "sourceId": source_id,
        "departureDates": departure_dates,
        "hotDepartureDates": departure_dates[:4],
        "meta": ai_meta,
        "dataQuality": ai_meta["dataQuality"],
        "createdAt": datetime.now().isoformat(),
        "updatedAt": datetime.now().isoformat(),
    }


def clean_nulls(obj):
    if isinstance(obj, dict):
        return {k: clean_nulls(v) for k, v in obj.items() if v is not None}
    elif isinstance(obj, list):
        return [clean_nulls(v) for v in obj]
    return obj


# ?????????????????????????????
def make_tour_key(item):
    source_id = str(item.get("sourceId") or item.get("pdId") or item.get("prodcode") or item.get("groupno") or "").strip()
    source = item.get("source", "")
    url = str(item.get("url") or item.get("bookingUrl") or "").strip()
    if not source_id and source == "鍋囨棩閫?:
        source_id = extract_jrt365_groupno(url)
    if source_id:
        return f"{item.get('source', '')}|id:{source_id}"
    if source == "鍋囨棩閫? and url:
        return f"{source}|url:{url.lower()}"
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


# ????????????????????????
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
        "childPolicy": item.get("childPolicy", ""),
        "singleSupplementNote": item.get("singleSupplementNote", ""),
        "singleSupplementAmount": item.get("singleSupplementAmount"),
        "cancellationPolicy": item.get("cancellationPolicy", ""),
        "refundPolicy": item.get("refundPolicy", ""),
    }


def merge_detail_with_existing(detail, existing_detail):
    if not existing_detail:
        return detail or empty_detail()

    detail = detail or empty_detail()
    merged = dict(existing_detail)

    list_fields = [
        "highlights",
        "itinerary",
        "inclusions",
        "exclusions",
        "optionalExpenses",
        "importantNotes",
    ]
    scalar_fields = [
        "childPolicy",
        "singleSupplementNote",
        "cancellationPolicy",
        "refundPolicy",
    ]

    for field in list_fields:
        merged[field] = detail.get(field) or existing_detail.get(field, [])

    for field in scalar_fields:
        merged[field] = detail.get(field) or existing_detail.get(field, "")

    if detail.get("singleSupplementAmount") is not None:
        merged["singleSupplementAmount"] = detail.get("singleSupplementAmount")
    else:
        merged["singleSupplementAmount"] = existing_detail.get("singleSupplementAmount")

    return merged


def load_detail_results(deduped, existing_tours):
    detail_mode = os.environ.get("DETAIL_FETCH_MODE", "fetch").strip().lower()
    detail_results = {}

    if detail_mode in {"cache", "cached", "existing"}:
        print(f"[璇︽儏] 浣跨敤宸叉湁 tours.json 璇︽儏缂撳瓨锛屽叡 {len(existing_tours)} 鏉?)
        for raw in deduped:
            key = make_tour_key(raw)
            existing = existing_tours.get(key)
            if existing:
                detail_results[key] = extract_existing_detail(existing)
        return detail_results

    if detail_mode in {"off", "skip", "none"}:
        print("[璇︽儏] 宸茬鐢ㄨ繙绋嬭鎯呮姄鍙?)
        return detail_results

    detail_workers = max(4, min(16, int(os.environ.get("DETAIL_WORKERS", "10") or "10")))
    print(f"[璇︽儏] 寮€濮嬫姄鍙?{len(deduped)} 鏉★紝绾跨▼鏁?{detail_workers}")
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
                print(f"[璇︽儏] {key} -> {exc}")
                detail = empty_detail()
            if key in existing_tours:
                existing_detail = extract_existing_detail(existing_tours[key])
                if detail_has_content(existing_detail):
                    detail = merge_detail_with_existing(detail, existing_detail)
            detail_results[key] = detail
            if idx % 50 == 0 or idx == total:
                print(f"[璇︽儏] {idx}/{total}")

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
        f"[鍙敤鎬 {label}: 寮€濮嬫牎楠?{len(jobs)} 涓敮涓€ URL锛岀嚎绋嬫暟 {workers}锛岃秴鏃?{timeout}s锛?
        f"缂撳瓨 {cache_path}锛圱TL {cache_ttl_hours}h锛?
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
        f"[鍙敤鎬 缂撳瓨鍛戒腑 {cache_stats['cache_hits']} | "
        f"鍒锋柊 {cache_stats['validated']} | 鏈懡涓?{cache_stats['cache_misses']}"
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
        f"[鍙敤鎬 淇濈暀 {len(filtered)}/{len(tours)} 鏉★紝"
        f"绉婚櫎 {len(removed_rows)} 鏉℃槑纭笅鏋?404 绾胯矾"
    )
    for category, count in sorted(kept_by_category.items()):
        print(f"[鍙敤鎬 淇濈暀 {category}: {count}")
    for category, count in sorted(removed_by_category.items()):
        print(f"[鍙敤鎬 绉婚櫎 {category}: {count}")

    if removed_rows:
        print("[鍙敤鎬 绉婚櫎鏍锋湰:")
        for row in removed_rows[:10]:
            print(
                f"  [{row['category']}] {row['source']} | {row['title'][:40]} | "
                f"{row['reason']} | {row['url']}"
            )

    return filtered


def is_jrt365_tour(tour):
    url = str(tour.get("bookingUrl") or "").strip().lower()
    return JRT365_HOST_TOKEN in url


def is_gzl_tour(tour):
    url = str(tour.get("bookingUrl") or "").strip().lower()
    return any(token in url for token in GZL_HOST_TOKENS)


def is_360jlb_tour(tour):
    url = str(tour.get("bookingUrl") or "").strip().lower()
    return JLB_HOST_TOKEN in url


# ?????????????????????????????
def filter_unavailable_tours(tours):
    enabled = os.environ.get("AVAILABILITY_FILTER", "0").strip().lower()
    if enabled in {"0", "false", "no", "off"}:
        jrt365_filter = os.environ.get("JRT365_AVAILABILITY_FILTER", "1").strip().lower()
        gzl_filter = os.environ.get("GZL_AVAILABILITY_FILTER", "1").strip().lower()
        jlb_filter = os.environ.get("JLB_AVAILABILITY_FILTER", "1").strip().lower()

        enabled_predicates = []
        if jrt365_filter in {"1", "true", "yes", "on"}:
            enabled_predicates.append(("JRT365", is_jrt365_tour))
        if gzl_filter in {"1", "true", "yes", "on"}:
            enabled_predicates.append(("GZL", is_gzl_tour))
        if jlb_filter in {"1", "true", "yes", "on"}:
            enabled_predicates.append(("360JLB", is_360jlb_tour))

        if not enabled_predicates:
            print("[鍙敤鎬 宸茶烦杩囪嚜鍔ㄤ笅鏋惰繃婊?)
            return tours

        scoped_tours = [
            tour
            for tour in tours
            if any(predicate(tour) for _, predicate in enabled_predicates)
        ]
        if not scoped_tours:
            print("[鍙敤鎬 鍏ㄥ眬杩囨护宸插叧闂紝涓旀病鏈夐渶瑕佸崟鐙牎楠岀殑绾胯矾")
            return tours

        scope_names = ", ".join(name for name, _ in enabled_predicates)
        print(f"[鍙敤鎬 鍏ㄥ眬杩囨护宸插叧闂紝浠呮牎楠?{scope_names} 绾胯矾 {len(scoped_tours)} 鏉?)
        filtered_scoped = apply_availability_filter(scoped_tours, label=f"{scope_names} only")
        kept_ids = {tour.get("id") for tour in filtered_scoped}
        return [
            tour
            for tour in tours
            if not any(predicate(tour) for _, predicate in enabled_predicates) or tour.get("id") in kept_ids
        ]

    return apply_availability_filter(tours)


def main():
    started_at = time.perf_counter()

    def log_stage(label: str, started: float) -> None:
        elapsed = time.perf_counter() - started
        print(f"[闃舵] {label}: {elapsed:.1f}s")

    print("=" * 60)
    print("鏁版嵁鍚堝苟鑴氭湰")
    print("=" * 60)
    print(f"[寮€濮媇 {datetime.utcnow().isoformat()}Z")

    all_raw = []
    existing_tours = {}
    data_dir = os.path.join(os.path.dirname(__file__), "..", "src", "data")
    data_dir = os.path.abspath(data_dir)
    existing_json_path = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..", "public", "data", "tours.json")
    )

    if os.path.exists(existing_json_path):
        stage_started = time.perf_counter()
        try:
            with open(existing_json_path, "r", encoding="utf-8-sig") as f:
                existing_data = json.load(f)
            existing_tours = {make_tour_key(item): item for item in existing_data}
            print(f"[existing tours.json] {len(existing_tours)}鏉?)
        except Exception as e:
            print(f"[existing tours.json] 璇诲彇澶辫触: {e}")
        log_stage("read existing tours.json", stage_started)

    # 1. 灏濊瘯璇诲彇鏃у浠芥暟鎹?(962鏉?
    backup_path = os.path.join(os.path.dirname(__file__), "..", "tours_json_backup.json")
    backup_path = os.path.abspath(backup_path)
    if os.path.exists(backup_path):
        stage_started = time.perf_counter()
        try:
            with open(backup_path, 'r', encoding='utf-16') as f:
                old_data = json.load(f)
            print(f"[鏃ф暟鎹甝 {len(old_data)}鏉?)
            # 灏嗘棫鏁版嵁杞崲涓簉aw鏍煎紡
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
            print(f"[鏃ф暟鎹甝 璇诲彇澶辫触: {e}")
        log_stage("read legacy backup", stage_started)

    # 2. 璇诲彇鏂扮殑raw鏁版嵁
    # 鍋囨棩閫氫粎淇濈暀 unified crawl 鍒锋柊鐨?raw_jrt365_full.json銆?    # raw_jrt365.json 宸蹭笉鍦ㄧ粺涓€鎶撳彇閾捐矾涓埛鏂帮紝缁х画娣峰叆浼氭妸闄堟棫绾胯矾閲嶆柊甯﹀洖浜х墿銆?    raw_files = [
        "raw_jrt365_full.json",
        "raw_kanghui.json",
        "raw_gdcts_full.json",
        "raw_http_full.json",
        "raw_pintu_full.json",
        "raw_saihuitong_full.json",
        "raw_gzl_api.json",
        "raw_outdoors_full.json",
    ]
    for fname in raw_files:
        fpath = os.path.join(data_dir, fname)
        if os.path.exists(fpath):
            stage_started = time.perf_counter()
            try:
                with open(fpath, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                if fname == "raw_http_full.json":
                    data = [
                        item for item in data
                        if item.get("source") not in {"鍝侀€?, "骞夸箣鏃?}
                    ]
                priority = RAW_FILE_PRIORITIES.get(fname, 0)
                enriched = []
                for item in data:
                    if not isinstance(item, dict):
                        continue
                    candidate = dict(item)
                    candidate["_merge_priority"] = priority
                    enriched.append(candidate)
                print(f"[{fname}] {len(enriched)}鏉?)
                all_raw.extend(enriched)
            except Exception as e:
                print(f"[{fname}] 璇诲彇澶辫触: {e}")
            log_stage(f"read {fname}", stage_started)

    print(f"\n[姹囨€籡 鍘熷鏁版嵁: {len(all_raw)}鏉?)

    # 鍘婚噸
    stage_started = time.perf_counter()
    seen = {}
    for it in all_raw:
        key = make_tour_key(it)
        previous = seen.get(key)
        if previous is None or prefer_raw_candidate(previous, it):
            seen[key] = it
    deduped = list(seen.values())
    print(f"[鍘婚噸] 鍚? {len(deduped)}鏉?)
    log_stage("dedupe raw records", stage_started)

    # 杩囨护
    stage_started = time.perf_counter()
    deduped = [r for r in deduped if r.get('price', 0) > 0 and len(r.get('title', '')) > 5]
    print(f"[杩囨护] 鏈夋晥鏁版嵁: {len(deduped)}鏉?)
    log_stage("filter valid raw records", stage_started)

    stage_started = time.perf_counter()
    detail_results = load_detail_results(deduped, existing_tours)
    log_stage("load detail results", stage_started)

    # 杞崲涓哄墠绔牸寮?    stage_started = time.perf_counter()
    tours = []
    for i, raw in enumerate(deduped, 1):
        tour = raw_to_tour(raw, i, detail_results.get(make_tour_key(raw), empty_detail()))
        if tour is not None:
            existing = existing_tours.get(make_tour_key(tour))
            if existing and existing.get("createdAt"):
                tour["createdAt"] = existing["createdAt"]
            tours.append(tour)

    print(f"[杞崲] 鐢熸垚 {len(tours)} 鏉?Tour 鏁版嵁")
    for source in sorted(set(t["source"] for t in tours)):
        subset = [tour for tour in tours if tour["source"] == source]
        print(
            f"[璇︽儏瑕嗙洊] {source}: "
            f"itinerary={sum(1 for tour in subset if tour.get('itinerary'))}/{len(subset)} "
            f"inclusions={sum(1 for tour in subset if tour.get('inclusions'))}/{len(subset)} "
            f"exclusions={sum(1 for tour in subset if tour.get('exclusions'))}/{len(subset)} "
            f"notes={sum(1 for tour in subset if tour.get('importantNotes'))}/{len(subset)}"
        )

    stage_started = time.perf_counter()
    tours = filter_unavailable_tours(tours)
    print(f"[杈撳嚭] 鑷姩杩囨护鍚?{len(tours)} 鏉?Tour 鏁版嵁")
    log_stage("availability filter", stage_started)

    # 鐢熸垚鍏冩暟鎹?    tours_clean = clean_nulls(tours)
    sources = sorted(set(t["source"] for t in tours_clean))
    destinations = sorted(set(t["destination"] for t in tours_clean if t.get("destination")))
    themes = sorted(set(t["theme"] for t in tours_clean if t.get("theme")))

    sources_def = [
        {"name": s, "logo": f"/icons/{s}.png", "color": SOURCE_COLORS.get(s, '#666')}
        for s in sources
    ]

    # 鍐欏叆 tours.ts (鍏冩暟鎹?
    ts_content = f'''import type {{ Tour }} from '@/types/tour';

export const sources = {json.dumps(sources_def, ensure_ascii=False, indent=2)};

export const destinations = {json.dumps(destinations, ensure_ascii=False, indent=2)};

export const themes = {json.dumps(themes, ensure_ascii=False, indent=2)};

export const tours: Tour[] = [];
'''

    ts_path = os.path.join(data_dir, "tours.ts")
    with open(ts_path, "w", encoding="utf-8") as f:
        f.write(ts_content)
    print(f"[淇濆瓨] tours.ts -> {ts_path}")

    # 鍐欏叆 tours.json (鏁版嵁锛屾棤BOM)
    json_path = os.path.join(os.path.dirname(__file__), "..", "public", "data", "tours.json")
    json_path = os.path.abspath(json_path)
    os.makedirs(os.path.dirname(json_path), exist_ok=True)

    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(tours_clean, f, ensure_ascii=False, separators=(',', ':'))
    split_script = os.path.abspath(os.path.join(os.path.dirname(__file__), "split_tour_data.mjs"))
    if os.path.exists(split_script):
        print("[鍒嗙墖] 瑙﹀彂 split_tour_data.mjs")
        os.system(f'node "{split_script}"')
    print(f"[淇濆瓨] tours.json -> {json_path}")
    print(f"[鏂囦欢澶у皬] {os.path.getsize(json_path) / 1024:.1f} KB")

    print("=" * 60)
    print("瀹屾垚锛?)
    log_stage("merge_data main", started_at)
    print(f"[缁撴潫] {datetime.utcnow().isoformat()}Z")


if __name__ == "__main__":
    main()
