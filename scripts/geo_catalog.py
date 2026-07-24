# -*- coding: utf-8 -*-
"""Canonical place matching used by the data merge and geo quality audit."""

import re


PLACE_ROWS = [
    ("广州", "中国", "广东", 23.1291, 113.2644, ("广州", "广州市")),
    ("深圳", "中国", "广东", 22.5431, 114.0579, ("深圳", "深圳市")),
    ("珠海", "中国", "广东", 22.271, 113.5767, ("珠海", "珠海市")),
    ("惠州", "中国", "广东", 23.1115, 114.4152, ("惠州", "惠州市")),
    ("清远", "中国", "广东", 23.6818, 113.056, ("清远", "清远市")),
    ("韶关", "中国", "广东", 24.8104, 113.5972, ("韶关", "韶关市")),
    ("肇庆", "中国", "广东", 23.0472, 112.4651, ("肇庆", "肇庆市")),
    ("佛山", "中国", "广东", 23.0218, 113.1219, ("佛山", "佛山市")),
    ("江门", "中国", "广东", 22.5787, 113.0815, ("江门", "江门市")),
    ("阳江", "中国", "广东", 21.8579, 111.9822, ("阳江", "阳江市")),
    ("汕头", "中国", "广东", 23.3541, 116.6819, ("汕头", "汕头市")),
    ("潮州", "中国", "广东", 23.6567, 116.6226, ("潮州", "潮州市")),
    ("湛江", "中国", "广东", 21.2707, 110.3594, ("湛江", "湛江市")),
    ("茂名", "中国", "广东", 21.6627, 110.9255, ("茂名", "茂名市")),
    ("桂林", "中国", "广西", 25.2736, 110.2902, ("桂林", "桂林市")),
    ("南宁", "中国", "广西", 22.817, 108.3665, ("南宁", "南宁市")),
    ("张家界", "中国", "湖南", 29.1171, 110.4792, ("张家界", "张家界市")),
    ("厦门", "中国", "福建", 24.4798, 118.0894, ("厦门", "厦门市")),
    ("三亚", "中国", "海南", 18.2528, 109.5119, ("三亚", "三亚市")),
    ("昆明", "中国", "云南", 25.0389, 102.7183, ("昆明", "昆明市")),
    ("成都", "中国", "四川", 30.5728, 104.0668, ("成都", "成都市")),
    ("重庆", "中国", "重庆", 29.563, 106.5516, ("重庆", "重庆市")),
    ("北京", "中国", "北京", 39.9042, 116.4074, ("北京", "北京市")),
    ("上海", "中国", "上海", 31.2304, 121.4737, ("上海", "上海市")),
    ("西安", "中国", "陕西", 34.3416, 108.9398, ("西安", "西安市")),
    ("乌鲁木齐", "中国", "新疆", 43.8256, 87.6168, ("乌鲁木齐", "乌鲁木齐市")),
    ("拉萨", "中国", "西藏", 29.652, 91.1721, ("拉萨", "拉萨市")),
    ("呼和浩特", "中国", "内蒙古", 40.8414, 111.7519, ("呼和浩特", "呼和浩特市")),
    ("哈尔滨", "中国", "黑龙江", 45.8038, 126.5349, ("哈尔滨", "哈尔滨市")),
    ("河内", "越南", None, 21.0285, 105.8542, ("河内", "河内市")),
    ("曼谷", "泰国", None, 13.7563, 100.5018, ("曼谷", "曼谷市")),
    ("东京", "日本", None, 35.6762, 139.6503, ("东京", "东京市")),
    ("首尔", "韩国", None, 37.5665, 126.978, ("首尔", "首尔市")),
    ("新加坡", "新加坡", None, 1.3521, 103.8198, ("新加坡",)),
    ("吉隆坡", "马来西亚", None, 3.139, 101.6869, ("吉隆坡", "吉隆坡市")),
    ("巴厘岛", "印度尼西亚", None, -8.4095, 115.1889, ()),
    ("悉尼", "澳大利亚", None, -33.8688, 151.2093, ("悉尼", "悉尼市")),
    ("巴黎", "法国", None, 48.8566, 2.3522, ("巴黎", "巴黎市")),
    ("伦敦", "英国", None, 51.5074, -0.1278, ("伦敦", "伦敦市")),
    ("纽约", "美国", None, 40.7128, -74.006, ("纽约", "纽约市")),
]

PLACES = [
    {
        "name": name,
        "country": country,
        "province": province,
        "latitude": latitude,
        "longitude": longitude,
        "aliases": aliases,
    }
    for name, country, province, latitude, longitude, aliases in PLACE_ROWS
]
REGION_ROWS = [
    ("中国", None, ("中国",)),
    ("广东", "广东", ("广东",)), ("广西", "广西", ("广西",)),
    ("湖南", "湖南", ("湖南",)), ("福建", "福建", ("福建",)),
    ("海南", "海南", ("海南",)), ("云南", "云南", ("云南",)),
    ("四川", "四川", ("四川",)), ("陕西", "陕西", ("陕西",)),
    ("新疆", "新疆", ("新疆",)), ("西藏", "西藏", ("西藏",)),
    ("内蒙古", "内蒙古", ("内蒙古", "内蒙")), ("黑龙江", "黑龙江", ("黑龙江",)),
    ("越南", None, ("越南",)), ("泰国", None, ("泰国",)),
    ("日本", None, ("日本",)), ("韩国", None, ("韩国",)),
    ("新加坡", None, ("新加坡",)), ("马来西亚", None, ("马来西亚",)),
    ("印度尼西亚", None, ("印度尼西亚", "印尼")), ("澳大利亚", None, ("澳大利亚",)),
    ("法国", None, ("法国",)), ("英国", None, ("英国",)), ("美国", None, ("美国",)),
]
REGIONS = [
    {"name": name, "country": "中国" if province else name, "province": province, "aliases": aliases}
    for name, province, aliases in REGION_ROWS
]
ALIAS_ROWS = sorted(
    ((alias, place) for place in PLACES for alias in place["aliases"]),
    key=lambda item: len(item[0]),
    reverse=True,
)
REGION_ALIAS_ROWS = sorted(
    ((alias, region) for region in REGIONS for alias in region["aliases"]),
    key=lambda item: len(item[0]),
    reverse=True,
)
NEARBY_PROVINCES_BY_DEPARTURE = {
    "广东": {"广西", "湖南", "江西", "福建", "海南"},
    "北京": {"天津", "河北", "山西", "山东"},
    "上海": {"江苏", "浙江", "安徽"},
    "浙江": {"上海", "江苏", "福建", "安徽"},
    "江苏": {"上海", "浙江", "安徽", "山东"},
}
DEPARTURE_PATTERNS = (
    re.compile(r"(?:从|由|自|在|于)(广州|深圳|珠海|佛山|东莞|惠州|清远|江门|中山|肇庆|汕头|北京|上海)出发"),
    re.compile(r"(广州|深圳|珠海|佛山|东莞|惠州|清远|江门|中山|肇庆|汕头|北京|上海)(?:往返|集合|起程|出发|直通车|高铁|动车|飞机)"),
    re.compile(r"(广州|深圳|珠海|佛山|东莞|惠州|清远|江门|中山|肇庆|汕头|北京|上海)(?:[/／](?:广州|深圳|珠海|佛山|东莞|惠州|清远|江门|中山|肇庆|汕头|北京|上海)){0,2}(?:[A-Za-z]{0,4})(?:起止|起程|出发|直飞(?:往返)?|往返|联运)"),
    re.compile(r"(广州|深圳|珠海|佛山|东莞|惠州|清远|江门|中山|肇庆|汕头|北京|上海)[-—至到]"),
)


def find_place(text):
    value = str(text or "").strip()
    for alias, place in ALIAS_ROWS:
        if alias and alias in value:
            return place
    return None


def find_region(text):
    value = str(text or "").strip()
    for alias, region in REGION_ALIAS_ROWS:
        if alias and alias in value:
            return region
    return None


def _raw_departure(raw):
    for key in ("departureCity", "departureProvince", "departureCountry"):
        if str(raw.get(key) or "").strip():
            return {key: str(raw[key]).strip() for key in ("departureCity", "departureProvince", "departureCountry") if str(raw.get(key) or "").strip()}, "source"
    nested = raw.get("departure") if isinstance(raw.get("departure"), dict) else {}
    if nested:
        values = {key: str(nested.get(key) or "").strip() for key in ("city", "province", "country") if str(nested.get(key) or "").strip()}
        if values:
            return {"departureCity": values.get("city", ""), "departureProvince": values.get("province", ""), "departureCountry": values.get("country", "")}, "source"
    return {}, "unknown"


def normalize_tour_geo(raw, title, destination):
    departure, departure_source = _raw_departure(raw)
    departure_place = None
    if not departure:
        for pattern in DEPARTURE_PATTERNS:
            match = pattern.search(str(title or ""))
            if match:
                departure_place = find_place(match.group(1))
                if departure_place:
                    departure = {
                        "departureCity": departure_place["name"],
                        "departureProvince": departure_place.get("province") or "",
                        "departureCountry": departure_place["country"],
                    }
                    departure_source = "inferred"
                    break
    if not departure_place and departure.get("departureCity"):
        departure_place = find_place(departure["departureCity"])
    if departure_place:
        departure.setdefault("departureProvince", departure_place.get("province") or "")
        departure.setdefault("departureCountry", departure_place["country"])

    destination_text = str(destination or "").strip()
    if destination_text in {"", "其他", "全国"}:
        destination_text = re.split(r"(?:往返|出发|起程|集合|起止)", str(title or ""), maxsplit=1)[-1]
    destination_place = find_place(destination_text)
    destination_region = find_region(destination_text)
    destination_country = destination_place["country"] if destination_place else (destination_region["country"] if destination_region else "")
    destination_province = (destination_place.get("province") or "") if destination_place else (destination_region.get("province") or "") if destination_region else ""
    destination_source = "source" if str(raw.get("destination") or "").strip() else "inferred"
    fields = {
        **departure,
        "destinationCity": destination_place["name"] if destination_place else "",
        "destinationProvince": (destination_place.get("province") or "") if destination_place else "",
        "destinationCountry": destination_country,
        "destinationLatitude": destination_place["latitude"] if destination_place else None,
        "destinationLongitude": destination_place["longitude"] if destination_place else None,
        "geoStatus": "complete" if departure_place and destination_place else ("destination_only" if destination_place or destination_region else "unmapped"),
        "geoConfidence": "medium" if destination_place else "low",
        "geoSource": "local-place-catalog" if destination_place else ("local-region-catalog" if destination_region else "unknown"),
    }
    if departure_place:
        fields.update({
            "departureLatitude": departure_place["latitude"],
            "departureLongitude": departure_place["longitude"],
        })
    return fields, {
        "departureCity": departure_source if departure.get("departureCity") else "unknown",
        "departureProvince": departure_source if departure.get("departureProvince") else "unknown",
        "departureCountry": departure_source if departure.get("departureCountry") else "unknown",
        "destinationCity": destination_source if destination_place else "unknown",
        "destinationProvince": "inferred" if destination_place or destination_region else "unknown",
        "destinationCountry": "inferred" if destination_place or destination_region else "unknown",
        "destinationLatitude": "inferred" if destination_place else "unknown",
        "destinationLongitude": "inferred" if destination_place else "unknown",
        "geoStatus": "inferred",
        "geoConfidence": "inferred",
        "geoSource": "inferred" if destination_place else "unknown",
        "routeRegion": "inferred",
    }


def classify_route(fields):
    country = fields.get("destinationCountry")
    departure_province = fields.get("departureProvince")
    destination_province = fields.get("destinationProvince")
    if not country or not departure_province:
        return "unknown"
    if country != "中国":
        return "international"
    if departure_province == destination_province:
        return "local"
    nearby_provinces = NEARBY_PROVINCES_BY_DEPARTURE.get(departure_province, set())
    if destination_province in nearby_provinces:
        return "nearby-province"
    return "national"
