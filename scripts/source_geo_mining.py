#!/usr/bin/env python3
"""Mine destination evidence from source detail pages without API keys."""

from __future__ import annotations

import html
import re
from collections.abc import Iterable

from geo_catalog import find_place, find_region


GENERIC_SEGMENTS = {
    "早餐", "午餐", "晚餐", "酒店", "住宿", "飞机", "高铁", "动车", "汽车", "大巴",
    "机场", "车站", "码头", "自由活动", "当天", "集合", "出发", "往返", "返回",
    "景点", "景区", "费用", "自理", "同级", "游轮上", "飞机上", "中国",
    "建设", "开发", "无色", "无味", "早餐后", "晚餐后", "入住后",
}
ROUTE_SPLIT = re.compile(r"[\s|｜丨/／+&＆,，、;；·•＊*]+|\s*[-—－→至到]\s*")
DAY_PREFIX = re.compile(r"^(?:D\s*\d+|第\s*\d+\s*天|第\d+天)[：:：\s-]*", re.I)
HTML_TAG = re.compile(r"<[^>]+>")
TITLE_NOISE = re.compile(
    r"(?:从|由|自)?[\u4e00-\u9fff]{2,10}出发|"
    r"(?:双飞|往返|直飞|动车|高铁|火车|汽车|纯玩|跟团|自由行)|"
    r"\d+\s*(?:天|日|晚)|[A-Za-z]?\d+天",
    re.I,
)
ACCOMMODATION_SUFFIX = re.compile(r"(?:或|及|以及)?(?:其他)?同级.*$|[（(].*?[)）]$")
TITLE_POI_MARKERS = (
    "温泉", "酒店", "度假村", "度假酒店", "山庄", "客栈", "民宿", "宾馆", "公寓",
    "庄园", "景区", "风景区", "乐园", "古镇", "古城", "公园", "湖", "湾", "岛",
    "瀑布", "雪山", "寺", "营地", "农庄",
)
GENERIC_TITLE_POI_PHRASES = (
    "高级酒店", "首选酒店", "附近的酒店", "机场附近的酒店", "连住酒店",
    "当地酒店", "参考酒店", "同级酒店", "酒店住宿",
)


def _clean_segment(value: object) -> str:
    text = html.unescape(str(value or ""))
    text = HTML_TAG.sub(" ", text)
    text = DAY_PREFIX.sub("", text).strip(" ：:()（）[]【】<>《》\t\r\n")
    text = re.sub(r"^(?:上午|下午|晚上|早上|随后|之后|抵达|前往|游览|参观|入住|返回)\s*", "", text)
    text = ACCOMMODATION_SUFFIX.sub("", text).strip(" ：:()（）[]【】<>《》\t\r\n")
    text = re.sub(r"\s+", " ", text).strip()
    return text


def _valid_candidate(value: str) -> bool:
    if not 2 <= len(value) <= 24:
        return False
    if value in GENERIC_SEGMENTS or any(token in value for token in ("早餐", "午餐", "晚餐", "车程", "小时", "费用")):
        return False
    if re.fullmatch(r"[\d\W]+", value):
        return False
    return any("\u4e00" <= char <= "\u9fff" for char in value)


def is_generic_candidate(value: object) -> bool:
    """Identify mined text that cannot safely represent a destination."""
    return not _valid_candidate(_clean_segment(str(value or "")))


def _append_unique(items: list[dict], value: str, source: str, priority: int) -> None:
    value = _clean_segment(value)
    if not _valid_candidate(value) or any(item["label"] == value for item in items):
        for item in items:
            if item["label"] == value and priority > item["priority"]:
                item.update({"source": source, "priority": priority})
        return
    items.append({"label": value, "source": source, "priority": priority})


def _is_title_poi(label: str, title: str, city: str = "") -> bool:
    """Recognize a concrete title destination without trusting a city centroid."""
    compact_label = re.sub(r"\s+", "", str(label or ""))
    compact_title = re.sub(r"\s+", "", str(title or ""))
    compact_city = re.sub(r"\s+", "", str(city or ""))
    if len(compact_label) < 3 or compact_label == compact_city:
        return False
    if compact_label not in compact_title:
        return False
    if find_region(compact_label):
        return False
    if any(phrase in compact_label for phrase in GENERIC_TITLE_POI_PHRASES):
        return False
    if re.search(
        rf"{re.escape(compact_label)}[\u4e00-\u9fffA-Za-z0-9]{{0,8}}"
        r"(?:出发|起程|起止|直飞|直航|直达|联运|集合)",
        compact_title,
    ):
        return False
    if any(marker in compact_label for marker in TITLE_POI_MARKERS):
        return True
    # Catalog-backed landmarks such as 七星岩 and 紫云谷 do not need a suffix.
    parent = find_place(compact_label)
    return bool(parent and compact_label in compact_title and compact_label != parent.get("name"))


def _iter_detail_strings(detail: dict) -> Iterable[tuple[str, str, int]]:
    for value in detail.get("highlights") or []:
        yield str(value), "highlight", 50
    for day in detail.get("itinerary") or []:
        if not isinstance(day, dict):
            continue
        yield str(day.get("title") or ""), "itinerary-title", 100
        for value in day.get("activities") or []:
            yield str(value), "activity", 120
        yield str(day.get("accommodation") or ""), "accommodation", 60
        yield str(day.get("description") or ""), "itinerary-description", 30


def extract_detail_candidates(
    title: str,
    detail: dict,
    raw_destination: str = "",
    named_destination: str = "",
    destination_city: str = "",
) -> list[dict]:
    """Return ordered, explainable location candidates from parsed source text."""
    candidates: list[dict] = []
    for value, source, priority in _iter_detail_strings(detail if isinstance(detail, dict) else {}):
        cleaned = _clean_segment(value)
        for segment in ROUTE_SPLIT.split(cleaned):
            _append_unique(candidates, segment, source, priority)

    if _is_title_poi(named_destination, title, destination_city):
        _append_unique(candidates, named_destination, "title-poi", 140)

    title_text = _clean_segment(title)
    for segment in ROUTE_SPLIT.split(title_text):
        segment = TITLE_NOISE.sub(" ", segment)
        for subsegment in re.split(r"\s+", segment):
            _append_unique(candidates, subsegment, "title-route", 80)

    # A known administrative value is context, not a POI candidate by itself.
    context = str(raw_destination or "").strip()
    if find_place(context) or find_region(context):
        candidates = [item for item in candidates if item["label"] != context]
    return sorted(candidates, key=lambda item: (-item["priority"], len(item["label"])))


def candidate_context(tour: dict) -> tuple[str, str]:
    destination = str(tour.get("destination") or "").strip()
    place = find_place(destination)
    region = find_region(destination)
    if place:
        return place.get("name") or "", place.get("province") or ""
    if region:
        return "", region.get("province") or ""
    return str(tour.get("destinationCity") or "").strip(), str(tour.get("destinationProvince") or "").strip()
