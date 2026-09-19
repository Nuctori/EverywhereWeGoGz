#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""jrt365_hollow 分类器回归测试。

重点覆盖两个真实事故：
1. 空壳页被 `bool(title)` 误判为"有内容"——因为 title 取自空壳页上本就
   为空的 tourname 节点，导致 74.6% 的空壳写入 raw 文件。
2. 带 `salelable3: ""` 的**内容完好**线路被误判为已下架——实测 22 条带
   完整标题 + 2900~15500 字行程正文的正常线路全部带此标记，早期版本
   仅凭该标记就判 True，把它们从站上删掉了。
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from jrt365_hollow import (  # noqa: E402
    BROKEN,
    OK,
    SHELL,
    classify_detail_html,
    is_hollow,
    is_shell,
)

failures = []


def check(label, actual, expected):
    if actual != expected:
        failures.append(f"{label}: expected {expected!r}, got {actual!r}")


def page(title="", detail="", print_href="", extra=""):
    """构造一个最小假日通详情页。"""
    title_html = (
        f'<span id="ctl00_ContentPlaceHolder_htmlform_id_tourname">{title}</span>'
        if title
        else '<span id="ctl00_ContentPlaceHolder_htmlform_id_tourname"></span>'
    )
    detail_html = (
        f'<div id="con_e_1">{detail}</div>'
        if detail
        else '<div id="con_e_1"></div>'
    )
    print_html = (
        f'<a id="ctl00_ContentPlaceHolder_htmlform_id_print_xc" href="{print_href}">print</a>'
        if print_href
        else ""
    )
    return f"<html><body>{title_html}{detail_html}{print_html}{extra}</body></html>"


# --- 空壳：标题与正文都没有 ---
check("empty page is shell", classify_detail_html(page()), SHELL)
check(
    "shell with empty markers",
    classify_detail_html(
        page(extra='var tourname: ""; var salelable3: "";')
    ),
    SHELL,
)
check("shell is_shell", is_shell(page()), True)
check("shell is_hollow", is_hollow(page()), True)

# --- 正文缺失：标题在但没有正文 ---
check(
    "title only is broken", classify_detail_html(page(title="测试线路2天")), BROKEN
)
check(
    "broken with sale flag",
    classify_detail_html(
        page(title="测试线路2天", extra='var salelable3: "";')
    ),
    BROKEN,
)
check("broken is not shell", is_shell(page(title="测试线路2天")), False)
check("broken is hollow", is_hollow(page(title="测试线路2天")), True)

# --- 正常：标题 + 正文 ---
check(
    "title and detail is ok",
    classify_detail_html(page(title="测试线路2天", detail="第1天 广州出发")),
    OK,
)
# 关键回归：内容完好但带 salelable3 空标记（表示"当前不可售"，不是空壳）。
# 早期版本会把这类线路判为不可用并删除。
check(
    "content-rich with sale flag stays ok",
    classify_detail_html(
        page(
            title="渝见光雾山（武隆）高铁7天",
            detail="第1天 (火车) 重庆市 广州南-重庆-李子坝-洪崖洞",
            extra='var salelable3: "";',
        )
    ),
    OK,
)
check(
    "content-rich with sale flag is not hollow",
    is_hollow(
        page(
            title="渝见光雾山（武隆）高铁7天",
            detail="第1天 (火车) 重庆市 广州南-重庆-李子坝-洪崖洞",
            extra='var salelable3: "";',
        )
    ),
    False,
)

# 标题在、正文在、且带 print 链接 -> 正常
check(
    "with print link is ok",
    classify_detail_html(
        page(title="线路3天", detail="行程正文", print_href="/print.aspx?x=1")
    ),
    OK,
)

# 只有 print 链接、无标题无正文 -> 空壳（下架页常见形态）
check(
    "print link only is shell",
    classify_detail_html(page(print_href="/print.aspx?x=1")),
    SHELL,
)

# --- 校验器误判回归 ---
# detect_jrt365_broken_schedule_context 早期仅凭 `salelable3: ""` 就判 True，
# 于是 22 条内容完好的线路被 apply_availability_filter 当"不可用"删掉。
# 这些用例锁住收紧后的行为：必须同时满足"确实没有内容"才算损坏。
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from validate_tour_availability import detect_jrt365_broken_schedule_context  # noqa: E402
from validate_tour_availability import detect_jrt365_unavailable_shell  # noqa: E402

rich_with_sale_flag = page(
    title="塞北醉金秋（坝上）双飞5天",
    detail="第1天 广州-北京 第2天 坝上草原 第3天 乌兰布统",
    extra='var salelable3: "";',
)
check(
    "broken-context must not fire on content-rich page with sale flag",
    detect_jrt365_broken_schedule_context(rich_with_sale_flag),
    False,
)
check(
    "unavailable-shell must not fire on content-rich page",
    detect_jrt365_unavailable_shell(rich_with_sale_flag),
    False,
)

# 标题在、正文确实缺失、且带空标记 -> 这才是真正的损坏
check(
    "broken-context fires when body is truly empty",
    detect_jrt365_broken_schedule_context(
        page(title="测试线路2天", extra='var salelable3: "";')
    ),
    True,
)

# 完全空壳交给 unavailable-shell 识别，broken-context 不再重复报
empty_page = page(extra='var tourname: ""; var salelable3: "";')
check(
    "unavailable-shell fires on empty shell",
    detect_jrt365_unavailable_shell(empty_page),
    True,
)

if failures:
    print("jrt365 hollow classifier tests FAILED")
    for line in failures:
        print("  -", line)
    raise SystemExit(1)

print("jrt365 hollow classifier tests passed")
