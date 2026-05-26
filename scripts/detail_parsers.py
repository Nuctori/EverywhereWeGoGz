#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from __future__ import annotations

import re
import threading
import time
from typing import Any
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup

REQUEST_TIMEOUT = 25
USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/136.0.0.0 Safari/537.36"
)

_thread_local = threading.local()
_selenium_semaphore = threading.Semaphore(2)

SECTION_ALIASES = {
    "inclusions": ["费用包含", "费用已含", "报价包含", "团费包含", "服务包含", "已含费用"],
    "exclusions": ["费用不含", "费用未含", "报价不含", "团费不含", "服务不含", "不含费用"],
    "self_funded": ["自费项目", "自费推荐", "另付费项目", "另行付费项目", "推荐项目"],
    "child_policy": ["儿童价标准", "儿童收费", "小童收费", "儿童说明", "儿童标准"],
    "single_room": ["单房差", "补房差", "单人房差", "单人间附加费"],
    "booking_notes": ["预订须知", "报名须知", "注意事项", "温馨提示", "特别说明", "相关事项"],
    "refund": ["退团说明", "退费说明", "退款说明", "取消政策", "违约条款"],
}


def _get_session() -> requests.Session:
    session = getattr(_thread_local, "session", None)
    if session is None:
        session = requests.Session()
        session.trust_env = False
        session.headers.update({"User-Agent": USER_AGENT})
        setattr(_thread_local, "session", session)
    return session


def empty_detail() -> dict[str, Any]:
    return {
        "highlights": [],
        "itinerary": [],
        "inclusions": [],
        "exclusions": [],
        "optionalExpenses": [],
        "importantNotes": [],
        "childPolicy": "",
        "singleSupplementNote": "",
        "singleSupplementAmount": None,
        "cancellationPolicy": "",
        "refundPolicy": "",
    }


def detail_has_content(detail: dict[str, Any]) -> bool:
    return any(
        [
            detail.get("itinerary"),
            detail.get("inclusions"),
            detail.get("exclusions"),
            detail.get("optionalExpenses"),
            detail.get("importantNotes"),
            detail.get("childPolicy"),
            detail.get("singleSupplementNote"),
            detail.get("cancellationPolicy"),
            detail.get("refundPolicy"),
        ]
    )


def _fetch_text(
    url: str,
    *,
    method: str = "GET",
    data: dict[str, Any] | None = None,
    referer: str | None = None,
) -> tuple[str, str]:
    session = _get_session()
    headers: dict[str, str] = {}
    if referer:
        headers["Referer"] = referer
    response = session.request(
        method=method,
        url=url,
        data=data,
        headers=headers,
        timeout=REQUEST_TIMEOUT,
        allow_redirects=True,
    )
    response.raise_for_status()
    encoding = (response.encoding or "").lower()
    apparent = (response.apparent_encoding or "").lower()
    if not encoding or encoding == "iso-8859-1":
        response.encoding = apparent or "utf-8"
    elif apparent and apparent != encoding and apparent in {"utf-8", "gbk", "gb18030"}:
        response.encoding = apparent
    return response.text, response.url


def _html_to_text(value: str | BeautifulSoup | Any) -> str:
    if hasattr(value, "decode"):
        html = value.decode()
    else:
        html = str(value)
    soup = BeautifulSoup(html, "lxml")
    for tag in soup.select("br"):
        tag.replace_with("\n")
    return _normalize_text(soup.get_text("\n", strip=True))


def _normalize_text(text: str) -> str:
    text = text.replace("\r", "\n").replace("\xa0", " ").replace("\u200b", " ")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return "\n".join(line.strip() for line in text.splitlines() if line.strip()).strip()


def _dedupe(items: list[str]) -> list[str]:
    seen: set[str] = set()
    result: list[str] = []
    for item in items:
        item = item.strip()
        if not item or item in seen:
            continue
        seen.add(item)
        result.append(item)
    return result


def _text_to_list(text: str) -> list[str]:
    if not text:
        return []
    prepared = re.sub(r"(?<=\S)[•●▪■◆◇※]", "\n", text)
    prepared = re.sub(r"\n\s*(\d+[.、])", "\n", prepared)
    items: list[str] = []
    for line in prepared.splitlines():
        line = re.sub(r"^[\s•●▪■◆◇※\-]+", "", line).strip("：: ")
        if len(line) >= 2:
            items.append(line)
    return _dedupe(items)


def _extract_sections(text: str) -> dict[str, str]:
    text = _normalize_text(text)
    found: list[tuple[int, str, str]] = []
    for key, labels in SECTION_ALIASES.items():
        best_pos = None
        best_label = ""
        for label in labels:
            pos = text.find(label)
            if pos != -1 and (best_pos is None or pos < best_pos):
                best_pos = pos
                best_label = label
        if best_pos is not None:
            found.append((best_pos, key, best_label))
    found.sort(key=lambda item: item[0])

    sections: dict[str, str] = {}
    for index, (pos, key, label) in enumerate(found):
        end = found[index + 1][0] if index + 1 < len(found) else len(text)
        body = text[pos + len(label) : end].strip("：: \n")
        if body:
            sections[key] = body
    return sections


def _extract_policy_sentence(text: str, keywords: list[str]) -> str:
    if not text:
        return ""
    normalized = _normalize_text(text)
    sentences = re.split(r"[。\n]+", normalized)
    matched = [sentence.strip() for sentence in sentences if any(key in sentence for key in keywords)]
    return "；".join(_dedupe(matched[:3]))


def _slice_between(text: str, start_marker: str, end_markers: list[str]) -> str:
    start = text.find(start_marker)
    if start == -1:
        return ""
    start += len(start_marker)
    end_positions = [text.find(marker, start) for marker in end_markers if text.find(marker, start) != -1]
    end = min(end_positions) if end_positions else len(text)
    return text[start:end].strip()


def _extract_single_room_amount(text: str) -> int | None:
    if not text:
        return None
    match = re.search(r"(?:单房差|补房差|附加费)[^\d]{0,12}(\d{2,5})", text)
    if match:
        try:
            return int(match.group(1))
        except ValueError:
            return None
    return None


def _sanitize_policy_text(text: str, *, keywords: list[str], max_length: int = 240) -> str:
    normalized = _normalize_text(text)
    if not normalized:
        return ""
    if len(normalized) > max_length:
        return ""
    if not any(keyword in normalized for keyword in keywords):
        return ""
    return normalized


def _collect_text_from_selectors(soup: BeautifulSoup, selectors: list[str]) -> str:
    parts: list[str] = []
    seen: set[str] = set()
    for selector in selectors:
        for node in soup.select(selector):
            text = _html_to_text(node)
            if text and text not in seen:
                seen.add(text)
                parts.append(text)
    return "\n".join(parts)


def _extract_activities(text: str) -> list[str]:
    activities = re.findall(r"【([^】]{2,30})】", text)
    return _dedupe(activities)[:6]


def _extract_meals(text: str) -> list[str]:
    meals: list[str] = []
    for meal_name in ("早餐", "午餐", "晚餐"):
        match = re.search(rf"{meal_name}[：:\s]*([^\n|]+)", text)
        if not match:
            continue
        value = match.group(1).strip()
        value = value.replace("敬请自理", "自理").replace("无", "自理").replace("X", "自理")
        meals.append(f"{meal_name}{value}")
    return _dedupe(meals)


def _extract_accommodation(text: str) -> str:
    for pattern in [
        r"住宿[：:\s]*([^\n]+)",
        r"入住[：:\s]*([^\n]+)",
        r"酒店[：:\s]*([^\n]+)",
    ]:
        match = re.search(pattern, text)
        if match:
            return match.group(1).strip("：: ")
    return ""


def _parse_itinerary_from_text(text: str) -> list[dict[str, Any]]:
    normalized = _normalize_text(text)
    if not normalized:
        return []

    matches = list(re.finditer(r"(?:D\s*(\d+)|第\s*(\d+)\s*天)", normalized))
    if not matches:
        return []

    itinerary: list[dict[str, Any]] = []
    for index, match in enumerate(matches):
        day = int(match.group(1) or match.group(2))
        start = match.start()
        end = matches[index + 1].start() if index + 1 < len(matches) else len(normalized)
        chunk = normalized[start:end].strip()
        chunk = re.sub(r"^(?:D\s*\d+|第\s*\d+\s*天)\s*", "", chunk).strip()
        lines = chunk.splitlines()
        title_suffix = lines[0].strip("：: ") if lines else ""
        body = "\n".join(lines[1:]).strip() if len(lines) > 1 else ""
        description = body or title_suffix
        itinerary.append(
            {
                "day": day,
                "title": title_suffix or f"第{day}天",
                "description": description[:2400],
                "meals": _extract_meals(chunk),
                "accommodation": _extract_accommodation(chunk),
                "activities": _extract_activities(chunk),
            }
        )
    return itinerary


def _apply_section_fields(detail: dict[str, Any], source_text: str) -> None:
    sections = _extract_sections(source_text)
    detail["inclusions"] = _text_to_list(sections.get("inclusions", ""))
    detail["exclusions"] = _text_to_list(sections.get("exclusions", ""))
    detail["optionalExpenses"] = _text_to_list(sections.get("self_funded", ""))
    detail["childPolicy"] = _sanitize_policy_text(
        sections.get("child_policy", "").strip(),
        keywords=["儿童", "小童", "占床", "不占床"],
    )
    detail["singleSupplementNote"] = _sanitize_policy_text(
        sections.get("single_room", "").strip(),
        keywords=["单房差", "补房差", "附加费"],
        max_length=160,
    )
    detail["singleSupplementAmount"] = _extract_single_room_amount(detail["singleSupplementNote"])
    detail["cancellationPolicy"] = _extract_policy_sentence(
        "\n".join(part for part in [sections.get("refund", ""), sections.get("booking_notes", "")] if part),
        ["退团", "取消", "违约"],
    )
    detail["refundPolicy"] = _extract_policy_sentence(
        "\n".join(part for part in [sections.get("refund", ""), sections.get("booking_notes", "")] if part),
        ["退款", "退费", "返还"],
    )
    detail["cancellationPolicy"] = _sanitize_policy_text(
        detail["cancellationPolicy"],
        keywords=["退团", "取消", "违约"],
    )
    detail["refundPolicy"] = _sanitize_policy_text(
        detail["refundPolicy"],
        keywords=["退款", "退费", "返还"],
    )


def _merge_notes(*parts: str) -> list[str]:
    lines: list[str] = []
    for part in parts:
        lines.extend(_text_to_list(part))
    return _dedupe(lines)[:24]


def _parse_pintu_detail(raw: dict[str, Any]) -> dict[str, Any]:
    detail = empty_detail()
    text, _ = _fetch_text(raw["url"])
    soup = BeautifulSoup(text, "lxml")

    intro = soup.select_one("#box2, .LineContent.brief_intro")
    fee = soup.select_one("#box3, .LineContent.price_notice")
    notice = soup.select_one("#box4, .LineContent.must_notice")
    warm = soup.select_one("#box5")
    feature = soup.select_one(".tour_line_feature, .tour_line_ts, .line_feature")

    intro_text = _html_to_text(intro) if intro else ""
    fee_text = _html_to_text(fee) if fee else ""
    notice_text = _html_to_text(notice) if notice else ""
    warm_text = _html_to_text(warm) if warm else ""

    detail["highlights"] = _text_to_list(_html_to_text(feature))[:6] if feature else []
    detail["itinerary"] = _parse_itinerary_from_text(intro_text)
    _apply_section_fields(detail, "\n".join(part for part in [fee_text, notice_text, warm_text] if part))
    detail["importantNotes"] = _merge_notes(notice_text, warm_text)
    return detail


def _parse_kanghui_itinerary(soup: BeautifulSoup) -> list[dict[str, Any]]:
    items: list[dict[str, Any]] = []
    day_contents = soup.select(".day_content")
    day_details = soup.select(".day_detail")
    for index, node in enumerate(day_contents):
        day = index + 1
        body = _html_to_text(node)
        extra = _html_to_text(day_details[index]) if index < len(day_details) else ""
        title_match = re.search(r"(?:精彩行程[:：])?\s*(?:D\s*\d+)?\s*(第\d+天)?\s*(.+)", body.split("\n", 1)[0])
        title = title_match.group(2).strip() if title_match else f"第{day}天"
        chunk = "\n".join(part for part in [body, extra] if part)
        items.append(
            {
                "day": day,
                "title": title[:120],
                "description": body[:2400],
                "meals": _extract_meals(chunk),
                "accommodation": _extract_accommodation(chunk),
                "activities": _extract_activities(chunk),
            }
        )
    return items


def _parse_kanghui_detail(raw: dict[str, Any]) -> dict[str, Any]:
    detail = empty_detail()
    text, _ = _fetch_text(raw["url"])
    soup = BeautifulSoup(text, "lxml")
    structured_text = _collect_text_from_selectors(
        soup,
        [
            "#travel_note",
            ".travel_note",
            ".notice_content",
            ".book_notice",
            ".fee_notice",
            ".expense_notice",
            ".js_detail",
        ],
    )
    travel_note = _html_to_text(soup.select_one("#travel_note")) if soup.select_one("#travel_note") else ""

    detail["itinerary"] = _parse_kanghui_itinerary(soup)
    if not detail["itinerary"]:
        intro = soup.select_one(".brief_intro, .js_detail")
        detail["itinerary"] = _parse_itinerary_from_text(_html_to_text(intro) if intro else "")

    _apply_section_fields(detail, structured_text)
    detail["importantNotes"] = _merge_notes(travel_note, structured_text)
    return detail


def _parse_gdcts_detail(raw: dict[str, Any]) -> dict[str, Any]:
    detail = empty_detail()
    text, _ = _fetch_text(raw["url"])
    soup = BeautifulSoup(text, "lxml")

    schedule = soup.select_one(".schedule") or soup.select_one(".schedule_day") or soup.select_one("#J_xcap")
    explain = soup.select_one("#J_xgsy") or soup.select_one(".explain")
    feature = soup.select_one(".product_manual, #J_cpsm")

    schedule_text = _html_to_text(schedule) if schedule else ""
    explain_text = _html_to_text(explain) if explain else ""
    feature_text = _html_to_text(feature) if feature else ""

    detail["highlights"] = _text_to_list(feature_text)[:6]
    detail["itinerary"] = _parse_itinerary_from_text(schedule_text)
    _apply_section_fields(detail, "\n".join(part for part in [explain_text, feature_text] if part))
    detail["importantNotes"] = _merge_notes(explain_text)
    return detail


def _extract_gzl_web_params(html_text: str) -> dict[str, str]:
    result: dict[str, str] = {}
    match = re.search(r"var\s+webParams\s*=\s*\{(.*?)\}", html_text, re.S)
    if not match:
        return result
    body = match.group(1)
    for key in ["pdId", "departureDate", "isProductPackage", "isFreeTravel"]:
        key_match = re.search(rf"{key}\s*:\s*'([^']*)'", body)
        if key_match:
            result[key] = key_match.group(1)
    return result


def _extract_input_value(soup: BeautifulSoup, input_id: str) -> str:
    node = soup.select_one(f"#{input_id}")
    return (node.get("value") or "").strip() if node else ""


def _extract_gzl_note_blocks(notes: Any) -> list[str]:
    if not notes:
        return []
    blocks: list[str] = []
    for node in notes.select("li"):
        text = _html_to_text(node)
        if text:
            blocks.append(text)
    return _dedupe(blocks)


def _is_gzl_fee_block(text: str) -> bool:
    markers = [
        "团费报价",
        "费用已含",
        "费用包含",
        "费用不含",
        "费用未含",
        "报价包含",
        "报价不含",
        "门票优惠",
        "小孩收费",
        "儿童收费",
        "儿童价标准",
        "婴儿",
        "单房差",
        "补房差",
    ]
    return any(marker in text for marker in markers)


def _is_gzl_policy_block(text: str) -> bool:
    markers = [
        "退团",
        "取消",
        "改签",
        "延期",
        "违约",
        "扣除旅游费用",
        "退款",
        "退费",
        "不能退换",
        "不予退还",
    ]
    return any(marker in text for marker in markers)


def _parse_gzl_itinerary(desc_soup: BeautifulSoup) -> list[dict[str, Any]]:
    items: list[dict[str, Any]] = []
    for index, node in enumerate(desc_soup.select(".trip-list > li")):
        title_node = node.select_one(".trip-tit")
        body_text = _html_to_text(node)
        title_text = _html_to_text(title_node) if title_node else ""
        title = ""
        if title_text:
            lines = title_text.splitlines()
            title = lines[-1].strip() if lines else ""
        items.append(
            {
                "day": index + 1,
                "title": title or f"第{index + 1}天",
                "description": body_text[:2400],
                "meals": _extract_meals(body_text),
                "accommodation": _extract_accommodation(body_text),
                "activities": _extract_activities(body_text),
            }
        )
    return items


def _parse_gzl_detail(raw: dict[str, Any]) -> dict[str, Any]:
    detail = empty_detail()
    page_text, final_url = _fetch_text(raw["url"])
    if any(marker in page_text for marker in ["页面它不小心迷路了", "很抱歉", "404"]):
        return detail

    page_soup = BeautifulSoup(page_text, "lxml")
    web_params = _extract_gzl_web_params(page_text)
    pd_id = web_params.get("pdId")
    if not pd_id:
        match = re.search(r"/([0-9a-f]{24,})\.html", final_url)
        if match:
            pd_id = match.group(1)
    if not pd_id:
        return detail

    is_free_travel = web_params.get("isFreeTravel") == "1" or "/freetour/" in final_url
    endpoint = "/freetour/findDescInfo.shtml" if is_free_travel else "/grouptour/findDescInfo.shtml"
    payload = {
        "packageId": _extract_input_value(page_soup, "packageId"),
        "packageSn": _extract_input_value(page_soup, "packageSn"),
        "pdId": pd_id,
        "schdId": _extract_input_value(page_soup, "schdId"),
        "groupSn": _extract_input_value(page_soup, "groupSn"),
        "departureDate": web_params.get("departureDate") or _extract_input_value(page_soup, "departureDate"),
        "isProductPackage": web_params.get("isProductPackage") or _extract_input_value(page_soup, "scheduleIsProductPackage"),
    }

    desc_html, _ = _fetch_text(
        urljoin(final_url, endpoint),
        method="POST",
        data=payload,
        referer=final_url,
    )
    desc_soup = BeautifulSoup(desc_html, "lxml")

    feature = desc_soup.select_one("#featureDescInfo")
    travel = desc_soup.select_one("#travelInfo")
    fee = desc_soup.select_one("#feeDescription, .prod-fee, .fee-description")
    notes = desc_soup.select_one("#bookNotes, .book-notes, .prod-book-notes")

    feature_text = _html_to_text(feature) if feature else ""
    travel_text = _html_to_text(travel) if travel else ""
    fee_text = _html_to_text(fee) if fee else ""
    notes_text = _html_to_text(notes) if notes else ""
    note_blocks = _extract_gzl_note_blocks(notes)
    fee_blocks = [block for block in note_blocks if _is_gzl_fee_block(block)]
    policy_blocks = [block for block in note_blocks if _is_gzl_policy_block(block)]
    fee_structured_text = "\n".join(part for part in [fee_text, *fee_blocks] if part)
    policy_text = "\n".join(part for part in [fee_text, notes_text, *policy_blocks] if part)

    detail["highlights"] = _text_to_list(feature_text)[:6]
    detail["itinerary"] = _parse_gzl_itinerary(desc_soup) or _parse_itinerary_from_text(travel_text)
    _apply_section_fields(detail, fee_structured_text)
    if not detail["childPolicy"]:
        detail["childPolicy"] = _sanitize_policy_text(
            _extract_policy_sentence(policy_text, ["儿童", "小童", "小孩", "婴儿", "占床", "不占床"]),
            keywords=["儿童", "小童", "小孩", "婴儿", "占床", "不占床"],
        )
    if not detail["singleSupplementNote"]:
        detail["singleSupplementNote"] = _sanitize_policy_text(
            _extract_policy_sentence(policy_text, ["单房差", "补房差", "附加费"]),
            keywords=["单房差", "补房差", "附加费"],
            max_length=160,
        )
        detail["singleSupplementAmount"] = _extract_single_room_amount(detail["singleSupplementNote"])
    if not detail["cancellationPolicy"]:
        detail["cancellationPolicy"] = _sanitize_policy_text(
            _extract_policy_sentence(policy_text, ["退团", "取消", "违约"]),
            keywords=["退团", "取消", "违约"],
        )
    if not detail["refundPolicy"]:
        detail["refundPolicy"] = _sanitize_policy_text(
            _extract_policy_sentence(policy_text, ["退款", "退费", "返还"]),
            keywords=["退款", "退费", "返还"],
        )
    detail["importantNotes"] = _merge_notes(notes_text)
    return detail


def _parse_360jlb_detail(raw: dict[str, Any]) -> dict[str, Any]:
    detail = empty_detail()
    text, final_url = _fetch_text(raw["url"])
    if "/m/error" in final_url or any(marker in text for marker in ["活动不存在", "页面不存在", "错误页"]):
        return detail

    try:
        from selenium import webdriver
        from selenium.webdriver.edge.options import Options
        from selenium.webdriver.support.ui import WebDriverWait

        with _selenium_semaphore:
            options = Options()
            options.add_argument("--headless=new")
            options.add_argument("--disable-gpu")
            options.add_argument("--no-sandbox")
            options.add_argument("--disable-dev-shm-usage")
            driver = webdriver.Edge(options=options)
            try:
                driver.get(raw["url"])
                WebDriverWait(driver, 20).until(lambda d: d.execute_script("return document.readyState") == "complete")
                for step in range(6):
                    driver.execute_script("window.scrollTo(0, document.body.scrollHeight * arguments[0] / 5);", step)
                    time.sleep(1)
                payload = driver.execute_script(
                    """
                    const vm = window.avalon && window.avalon.vmodels && window.avalon.vmodels.controller;
                    return {
                      eventContent: vm ? (vm.eventContent || '') : (document.getElementById('act-conent')?.innerHTML || ''),
                      scheduling: vm ? (vm.scheduling || '') : (document.getElementById('ext-scheduling')?.innerHTML || ''),
                      expenseExplanation: vm ? (vm.expenseExplanation || '') : (document.getElementById('ext-expense')?.innerHTML || ''),
                      remindNotice: vm ? (vm.remindNotice || '') : (document.getElementById('act-remindNotice')?.innerHTML || ''),
                      bodyText: document.body ? (document.body.innerText || '') : '',
                    };
                    """
                ) or {}
            finally:
                driver.quit()
    except Exception:
        return detail

    event_text = _normalize_text(BeautifulSoup(payload.get("eventContent", ""), "lxml").get_text("\n", strip=True))
    scheduling_text = _normalize_text(BeautifulSoup(payload.get("scheduling", ""), "lxml").get_text("\n", strip=True))
    expense_text = _normalize_text(BeautifulSoup(payload.get("expenseExplanation", ""), "lxml").get_text("\n", strip=True))
    remind_text = _normalize_text(BeautifulSoup(payload.get("remindNotice", ""), "lxml").get_text("\n", strip=True))
    body_text = _normalize_text(payload.get("bodyText", ""))

    detail["itinerary"] = _parse_itinerary_from_text(scheduling_text or event_text)
    _apply_section_fields(detail, "\n".join(part for part in [expense_text, remind_text] if part))
    detail["importantNotes"] = _merge_notes(remind_text)

    highlight_text = _slice_between(body_text, "活动亮点", ["最近报名", "互动话题", "详细信息"])
    if highlight_text:
        detail["highlights"] = _text_to_list(highlight_text)[:6]

    return detail


def _parse_outdoors_itinerary(soup: BeautifulSoup) -> list[dict[str, Any]]:
    container = soup.select_one("#siderexplain")
    if not container:
        return []

    items: list[dict[str, Any]] = []
    day_nodes = container.select(".frist_explain")
    for index, node in enumerate(day_nodes):
        day_marker = node.select_one(".i-exico")
        marker_text = _html_to_text(day_marker) if day_marker else ""
        day_match = re.search(r"D\s*(\d+)", marker_text, re.I)
        day = int(day_match.group(1)) if day_match else index + 1

        title_parts = []
        for title_node in node.select(".p-frist_explain"):
            title_text = _html_to_text(title_node)
            if title_text:
                title_parts.append(title_text.replace("\n", " "))
        overview_node = node.find(string=re.compile("行程概述"))
        overview = ""
        if overview_node:
            overview_parent = overview_node.find_parent("tr")
            overview = _html_to_text(overview_parent) if overview_parent else ""
            overview = re.sub(r"^行程概述\s*", "", overview).strip()

        description = _html_to_text(node)
        if len(description) < 8:
            continue
        title = overview or " - ".join(_dedupe(title_parts)) or f"第{day}天"

        sibling = node.find_next_sibling()
        extra_text = ""
        while sibling and not (
            getattr(sibling, "name", None)
            and "frist_explain" in (sibling.get("class") or [])
        ):
            extra_text = "\n".join(part for part in [extra_text, _html_to_text(sibling)] if part)
            sibling = sibling.find_next_sibling()

        chunk = "\n".join(part for part in [description, extra_text] if part)
        items.append(
            {
                "day": day,
                "title": title[:120],
                "description": chunk[:2400],
                "meals": _extract_meals(chunk),
                "accommodation": _extract_accommodation(chunk),
                "activities": _extract_activities(chunk),
            }
        )

    return items


def _collect_outdoors_cost_text(soup: BeautifulSoup) -> str:
    marker = soup.select_one("#cost-description")
    if not marker:
        return ""

    parts: list[str] = []
    for sibling in marker.find_next_siblings():
        if getattr(sibling, "name", None) in {"h2", "div"}:
            sibling_id = sibling.get("id") or ""
            if sibling_id in {"mk06", "mk07"}:
                break
            classes = sibling.get("class") or []
            if "h2-a" in classes:
                break
        text = _html_to_text(sibling)
        if text:
            parts.append(text)
    return "\n".join(parts)


def _collect_outdoors_notes(soup: BeautifulSoup) -> str:
    start = soup.select_one("#mk06")
    if not start:
        return ""

    parts: list[str] = []
    for sibling in start.find_next_siblings():
        if getattr(sibling, "name", None) in {"h2", "span"}:
            sibling_id = sibling.get("id") or ""
            if sibling_id == "mk07":
                break
        text = _html_to_text(sibling)
        if text:
            parts.append(text)
    return "\n".join(parts)


def _parse_outdoors_detail(raw: dict[str, Any]) -> dict[str, Any]:
    detail = empty_detail()
    text, _ = _fetch_text(raw["url"])
    soup = BeautifulSoup(text, "lxml")

    detail["itinerary"] = _parse_outdoors_itinerary(soup)

    cost_text = _collect_outdoors_cost_text(soup)
    notes_text = _collect_outdoors_notes(soup)
    _apply_section_fields(detail, "\n".join(part for part in [cost_text, notes_text] if part))
    detail["importantNotes"] = _merge_notes(notes_text)

    highlight_parts = []
    for selector in [".route-feature", ".line-feature", ".feature", ".xq_intro"]:
        text_part = _collect_text_from_selectors(soup, [selector])
        if text_part:
            highlight_parts.append(text_part)
    if highlight_parts:
        detail["highlights"] = _text_to_list("\n".join(highlight_parts))[:6]

    return detail


def _parse_jrt365_print_detail(print_url: str, referer: str) -> dict[str, Any]:
    detail = empty_detail()
    text, final_url = _fetch_text(print_url, referer=referer)
    soup = BeautifulSoup(text, "lxml")
    if "该团号不可在此显示" in text:
        return detail

    itinerary = soup.select_one("#ctl00_ContentPlaceHolder_htmlform_id_xc")
    inclusions = soup.select_one("#ctl00_ContentPlaceHolder_htmlform_id_fybh_content")
    exclusions = soup.select_one("#ctl00_ContentPlaceHolder_htmlform_id_fybbh_content")
    signup = soup.select_one("#ctl00_ContentPlaceHolder_htmlform_id_bmxz_content")
    warm = soup.select_one("#ctl00_ContentPlaceHolder_htmlform_id_wxts_content")
    note = soup.select_one("#ctl00_ContentPlaceHolder_htmlform_id_note")

    itinerary_text = _html_to_text(itinerary) if itinerary else ""
    inclusion_text = _html_to_text(inclusions) if inclusions else ""
    exclusion_text = _html_to_text(exclusions) if exclusions else ""
    signup_text = _html_to_text(signup) if signup else ""
    warm_text = _html_to_text(warm) if warm else ""
    note_text = _html_to_text(note) if note else ""

    detail["itinerary"] = _parse_itinerary_from_text(itinerary_text)
    detail["inclusions"] = _text_to_list(inclusion_text)
    detail["exclusions"] = _text_to_list(exclusion_text)
    detail["importantNotes"] = _merge_notes(signup_text, warm_text, note_text)
    detail["childPolicy"] = _sanitize_policy_text(
        _extract_policy_sentence(
            "\n".join(part for part in [note_text, signup_text, exclusion_text] if part),
            ["收费小孩", "不占床", "占床", "小童", "儿童"],
        ),
        keywords=["收费小孩", "不占床", "占床", "小童", "儿童"],
    )
    detail["singleSupplementNote"] = _sanitize_policy_text(
        _extract_policy_sentence(
            "\n".join(part for part in [inclusion_text, exclusion_text, note_text] if part),
            ["单房差", "单间房差", "补房差"],
        ),
        keywords=["单房差", "单间房差", "补房差"],
        max_length=160,
    )
    detail["singleSupplementAmount"] = _extract_single_room_amount(detail["singleSupplementNote"])
    detail["cancellationPolicy"] = _sanitize_policy_text(
        _extract_policy_sentence(
            "\n".join(part for part in [signup_text, warm_text] if part),
            ["退团", "取消", "违约"],
        ),
        keywords=["退团", "取消", "违约"],
    )
    detail["refundPolicy"] = _sanitize_policy_text(
        _extract_policy_sentence(
            "\n".join(part for part in [signup_text, warm_text] if part),
            ["退款", "退费", "返还"],
        ),
        keywords=["退款", "退费", "返还"],
    )
    return detail


def _parse_jrt365_detail(raw: dict[str, Any]) -> dict[str, Any]:
    detail = empty_detail()
    text, final_url = _fetch_text(raw["url"])
    soup = BeautifulSoup(text, "lxml")
    itinerary = soup.select_one("#con_e_1")
    signup = soup.select_one("#con_e_2")
    fee = soup.select_one("#con_e_3")
    warm = soup.select_one("#con_e_4")
    note = soup.select_one("#ctl00_ContentPlaceHolder_htmlform_id_note")
    print_link = soup.select_one("#ctl00_ContentPlaceHolder_htmlform_id_print_xc")
    print_href = urljoin(final_url, print_link.get("href", "").strip()) if print_link and print_link.get("href") else ""

    itinerary_text = _html_to_text(itinerary) if itinerary else ""
    signup_text = _html_to_text(signup) if signup else ""
    fee_text = _html_to_text(fee) if fee else ""
    warm_text = _html_to_text(warm) if warm else ""
    note_text = _html_to_text(note) if note else ""

    is_invalid_shell = (
        "该团号不可在此显示" in text
        and not any([itinerary_text, signup_text, fee_text, warm_text, print_href])
    )
    if is_invalid_shell:
        return detail

    if print_href:
        detail = _parse_jrt365_print_detail(print_href, final_url)

    if not detail.get("itinerary"):
        detail["itinerary"] = _parse_itinerary_from_text(itinerary_text)
    if not detail.get("inclusions") or not detail.get("exclusions"):
        _apply_section_fields(detail, "\n".join(part for part in [fee_text, signup_text, warm_text, note_text] if part))
    detail["importantNotes"] = _merge_notes(
        "\n".join(detail.get("importantNotes", [])),
        signup_text,
        warm_text,
        note_text,
    )
    if not detail["childPolicy"]:
        detail["childPolicy"] = _sanitize_policy_text(
            _extract_policy_sentence("\n".join(part for part in [fee_text, note_text] if part), ["收费小孩", "不占床", "占床", "小童", "儿童"]),
            keywords=["收费小孩", "不占床", "占床", "小童", "儿童"],
        )
    if not detail["singleSupplementNote"]:
        detail["singleSupplementNote"] = _sanitize_policy_text(
            _extract_policy_sentence("\n".join(part for part in [fee_text, note_text] if part), ["单房差", "单间房差", "补房差"]),
            keywords=["单房差", "单间房差", "补房差"],
            max_length=160,
        )
        detail["singleSupplementAmount"] = _extract_single_room_amount(detail["singleSupplementNote"])

    return detail


def fetch_detail_data(raw: dict[str, Any]) -> dict[str, Any]:
    source = raw.get("source", "")
    try:
        if source == "品途":
            return _parse_pintu_detail(raw)
        if source == "康辉":
            return _parse_kanghui_detail(raw)
        if source == "广东中旅":
            return _parse_gdcts_detail(raw)
        if source == "广之旅":
            if "/hotel/" in raw.get("url", "").lower():
                return empty_detail()
            return _parse_gzl_detail(raw)
        if source in {"广州去旅行", "暴走村"}:
            return _parse_360jlb_detail(raw)
        if source == "天涯户外":
            return _parse_outdoors_detail(raw)
        if source == "假日通":
            return _parse_jrt365_detail(raw)
    except Exception as exc:
        print(f"[detail parser] {source} {raw.get('url', '')} -> {exc}")
    return empty_detail()
