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


def _append_unique(items: list[dict], value: str, source: str, priority: int) -> None:
    value = _clean_segment(value)
    if not _valid_candidate(value) or any(item["label"] == value for item in items):
        for item in items:
            if item["label"] == value and priority > item["priority"]:
                item.update({"source": source, "priority": priority})
        return
    items.append({"label": value, "source": source, "priority": priority})


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


def extract_detail_candidates(title: str, detail: dict, raw_destination: str = "") -> list[dict]:
    """Return ordered, explainable location candidates from parsed source text."""
    candidates: list[dict] = []
    for value, source, priority in _iter_detail_strings(detail if isinstance(detail, dict) else {}):
        cleaned = _clean_segment(value)
        for segment in ROUTE_SPLIT.split(cleaned):
            _append_unique(candidates, segment, source, priority)

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
