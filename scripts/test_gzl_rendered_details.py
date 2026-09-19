#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""parse_rendered_detail（gzl 渲染文本详情解析）与 merge 侧消费契约测试。"""

import json
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from detail_parsers import parse_rendered_detail

RENDERED_SAMPLE = """广之旅 北京双飞5天
第1天
出发地—广州机场—北京
 请各位团友于约定时间地点集中；乘车前往广州机场，乘航班前往北京。
餐饮
酒店早餐X│团队午餐X│团队晚餐X
住宿
北京全季酒店/桔子酒店或同级
第2天
天安门广场--故宫博物院
早餐后，游览【天安门广场】（游览约1小时）。后游【故宫】（游览约3小时）。
景点介绍：
【故宫博物院】：又名紫禁城，是世界上规模最大、保存最完整的木结构宫殿建筑群。
费用包含
1、大交通：往返机票。
2、住宿：行程所列酒店。
费用不含
1、旅游意外保险。
2、景区内小门票。
"""


def test_rendered_detail_parses_itinerary_days():
    detail = parse_rendered_detail(RENDERED_SAMPLE)
    days = [day["day"] for day in detail["itinerary"]]
    assert days == [1, 2], days


def test_rendered_detail_extracts_activities_with_cjk_filter():
    detail = parse_rendered_detail(RENDERED_SAMPLE)
    day2 = detail["itinerary"][1]
    activities = day2["activities"]
    assert "故宫" in activities or "天安门广场" in activities, activities
    # 【Travel Tips】这类非 CJK 标签不得进入
    assert all(any("\u4e00" <= ch <= "\u9fff" for ch in a) for a in activities)


def test_rendered_detail_extracts_meals_and_accommodation():
    detail = parse_rendered_detail(RENDERED_SAMPLE)
    day1 = detail["itinerary"][0]
    assert day1["accommodation"].startswith("北京全季酒店"), day1["accommodation"]


def test_rendered_detail_extracts_fee_sections():
    detail = parse_rendered_detail(RENDERED_SAMPLE)
    assert any("机票" in item for item in detail["inclusions"]), detail["inclusions"]
    assert any("保险" in item for item in detail["exclusions"]), detail["exclusions"]


def test_empty_text_yields_empty_detail():
    detail = parse_rendered_detail("")
    assert not detail.get("itinerary")
    assert not detail.get("inclusions")


def test_merge_side_consumer_contract():
    """merge_data.apply_gzl_rendered_details 存在且缓存文件键为 URL。"""
    import merge_data

    assert callable(merge_data.apply_gzl_rendered_details)
    cache_path = Path(__file__).parent.parent / "src" / "data" / "gzl_rendered_details.json"
    if cache_path.exists():
        cache = json.loads(cache_path.read_text(encoding="utf-8"))
        for url, entry in cache.items():
            assert url.startswith("http"), url
            assert "detail" in entry and "itinerary" in entry["detail"]
            break


if __name__ == "__main__":
    test_rendered_detail_parses_itinerary_days()
    test_rendered_detail_extracts_activities_with_cjk_filter()
    test_rendered_detail_extracts_meals_and_accommodation()
    test_rendered_detail_extracts_fee_sections()
    test_empty_text_yields_empty_detail()
    test_merge_side_consumer_contract()
    print("gzl rendered detail tests passed")
