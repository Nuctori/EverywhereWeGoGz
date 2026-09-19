#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""假日通(jrt365)详情页空壳判定 — 单一事实来源。

背景：源站会把已下架/停售线路的详情页渲染成"空壳"——HTTP 200、
页面框架在，但 tourname / 出发月份 / 价格等节点全空，只剩一个空的
预订骨架。这类页面用户点进去看不到任何有效内容。

历史上爬虫只用 `bool(title)` 判断有无内容，而 title 恰恰取自空壳页面
上为空的 tourname 节点，导致空壳被记为 hasDetailContent=true 写进
raw 文件。校验器(validate_tour_availability)其实能识别这些标记，但
它只在合并阶段跑，抓取阶段照样把空壳当成功入库。

本模块把判定逻辑抽出来，让抓取侧与校验侧共用同一套谓词，避免两处
实现漂移（曾出现过 naive 重实现与真实语义不一致的情况）。
"""

from __future__ import annotations

from bs4 import BeautifulSoup

# 源站模板里表示"该字段为空"的字面量。注意冒号后有一个空格。
EMPTY_TOURNAME_MARKER = 'tourname: ""'
# 仅作文档/测试引用：判定逻辑刻意不依赖它——实测它对内容完好的线路误报，
# 详见 classify_detail_html 的说明。
EMPTY_SALE_FLAG_MARKER = 'salelable3: ""'

TITLE_SELECTORS = (
    "#ctl00_ContentPlaceHolder_htmlform_id_tourname",
    "#ctl00_ContentPlaceHolder_htmlform_id_tourname_1",
)

DETAIL_CONTENT_SELECTORS = (
    "#con_e_1",
    "#con_e_2",
    "#con_e_3",
    "#con_e_4",
    "#ctl00_ContentPlaceHolder_htmlform_id_note",
)

PRINT_LINK_SELECTOR = "#ctl00_ContentPlaceHolder_htmlform_id_print_xc"

# 判定结果分类
SHELL = "shell"      # 完全空壳：标题节点也为空
BROKEN = "broken"    # 标题在，但详情内容区为空、售票标记为空
OK = "ok"


def _first_text(soup, selectors):
    for selector in selectors:
        node = soup.select_one(selector)
        text = node.get_text(" ", strip=True) if node else ""
        if text:
            return text
    return ""


def _print_href(soup):
    node = soup.select_one(PRINT_LINK_SELECTOR)
    return (node.get("href", "") if node else "").strip()


def classify_detail_html(raw_html: str) -> str:
    """把假日通详情页 HTML 归类为 SHELL / BROKEN / OK。

    判定只看**页面实际有没有内容**，不看售票标记：

    1. 标题节点为空 -> SHELL（完全空壳，用户点进去什么都看不到）
    2. 标题在但详情内容区为空 -> BROKEN（标题可读，正文缺失）
    3. 其余 -> OK

    刻意不采用 `salelable3: ""` 作为"下架"信号。实测该标记会对
    **内容完好的线路**误报：22 条带完整标题 + 2900~15500 字行程正文的
    正常线路全部带此标记（它表示"当前不可售"，不是"页面为空"）。
    校验器 validate_tour_availability 的 detect_jrt365_broken_schedule_context
    会把这 22 条判为不可用并被 apply_availability_filter 删除——那是
    误删有效线路。本模块按"内容是否存在"判定，与用户实际体感一致。
    """
    soup = BeautifulSoup(raw_html, "lxml")
    title = _first_text(soup, TITLE_SELECTORS)
    if title:
        has_detail_text = any(
            (soup.select_one(selector).get_text(" ", strip=True) if soup.select_one(selector) else "")
            for selector in DETAIL_CONTENT_SELECTORS
        )
        return OK if has_detail_text else BROKEN

    # 标题为空 -> 完全空壳。
    return SHELL


def is_hollow(raw_html: str) -> bool:
    """是否为用户看不到有效内容的详情页（SHELL 或 BROKEN）。"""
    return classify_detail_html(raw_html) in {SHELL, BROKEN}


def is_shell(raw_html: str) -> bool:
    """是否为完全空壳——连标题都读不出来。

    每日体检与下架都以该口径为准：空壳页面对用户完全无价值，
    而 BROKEN（标题在、正文缺）保留，避免误删刚停售但信息完整的线路。
    """
    return classify_detail_html(raw_html) == SHELL
