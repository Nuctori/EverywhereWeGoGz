#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""上车点/集合点解析。

各源站字段名不统一，实测形态：
  - 广东中旅(gdcts)  "上车点：8:00越秀公园C出口" / "上车时间地点：...集中（地铁海珠广场A/F出口）"
  - 广之旅(gzl)      "集中上车点：（...）2人起接：A、B、C 4人起接：D、E"
  - 360jlb/户外      "集合地: 广东 广州 龙溪A/嘉禾望岗H/番禺广场A/珠江新城B2"
  - 天涯户外         "集合地：珠江新城B2"（属性表 <span class="clo5">）

上车点即下车点：多个源站原文写明"回程统一送团地点"/"散团地点"/"统一在指定集合点上下车"，
故解析结果同时用于上车与下车筛选，不做两份数据。

设计取向（D-059）：**原样捕获**。
结构化字段（name/district/quota/time）只是便于索引的副产物，真正的语义理解交给 AI。
因此同时保留 `raw`（字段原文，不做任何裁剪），确保下面这类信息不丢失：
  - 非站点描述："荔新路沿线均可接送"、"依报名的酒店顺序送至酒店"
  - 接送方式："安排大巴/接驳车/打车报销"
  - 回程差异："回程统一送团地点:佛山/越秀公园"
  - 清单外区域："非以上车点 广州3区…15人起接 不足人数补80元/人车差"
查询侧不应依赖站点名的字面匹配（"增城广场" vs "增城中海城市广场"），而应由 AI 读 raw 判断。
"""

from __future__ import annotations

import re
from html import unescape

# 字段标签，按优先级排列。越靠前越可能是"结构化上车点清单"而非行程散文。
FIELD_LABELS = (
    "集中上车点",
    "上车时间地点",
    "接送点",
    "上车地点",
    "上车点",
    "上落车点",
    "集合地",
    "集中地点",
    "集合点",
)

# 行政区前缀，如 "增城区：" "白云区："
DISTRICT_PREFIX_RE = re.compile(r"([\u4e00-\u9fa5]{2,4}(?:区|市|县|镇))\s*[：:]")
QUOTA_RE = re.compile(r"(\d+)\s*人起接")
# 分组门槛声明，如 "广州4区（白云区、增城区、黄埔区、南沙区）4人起接"
GROUP_QUOTA_RE = re.compile(
    r"[（(]([\u4e00-\u9fa5、,，\s]{4,80})[）)]\s*(\d+)\s*人起接"
)
# 否定式声明（"非以上车点 …15人起接"）：描述的是清单外的区，不能用于覆盖清单内门槛
NEGATIVE_GROUP_RE = re.compile(r"非以上|除以上|不在以上")
# 区块终止标记：这些出现说明上车点清单结束
BLOCK_END_RE = re.compile(
    r"具体出发时间|请客人准时|我社将|请客人自觉|过时不候|注[：:]"
)
# 行程正文起始：raw 捕获的截断点（保留区块完整，但不拖入整篇行程）
BODY_START_RE = re.compile(
    r"产品亮点|行程介绍|费用说明|费用包含|费用不含|预订须知|温馨提示|特别提示"
    r"|DAY\s*\d|第\s*\d\s*天|★|【活动|线路特色"
)

# 站点值里必须出现这类特征，否则多半是散文
STATION_HINT_RE = re.compile(
    r"出口|地铁|广场|酒店|车站|公交|大厦|门口|客运站|火车站|机场|码头|城轨|轻轨|公园|市场|银行"
    r"|麦当劳|肯德基|中心|宾馆|招待所|大门口|收费站|加油站|站|口$"
)
# 地铁口简写：珠江新城B2 / 龙溪A / 嘉禾望岗H —— 结尾为单个字母+可选数字
METRO_SHORTHAND_RE = re.compile(r"[\u4e00-\u9fa5]{2,8}[A-Za-z]\d{0,2}$")
# 明确否定：模板条款/免责声明/行程散文，不是站点
NEGATIVE_RE = re.compile(
    r"出团通知|以实际|另行通知|旅行社|索赔|违约责任|合同|保险|温馨|敬请|请客人|过时不候"
    r"|发票|退改|投诉|护照|签证|行李|小费|客人自行|自行前往|无需|不含|自理|游览|入住|用餐"
    r"|住宿|行程|费用|须知|备注|注意|天气|航班|集合时间"
)

# 省市层级前缀：360jlb/outdoors 的 "广东 广州 龙溪A" 形态
CITY_NAMES = (
    "广州", "深圳", "佛山", "东莞", "珠海", "中山", "惠州", "江门", "肇庆", "汕头",
    "清远", "韶关", "河源", "梅州", "汕尾", "阳江", "湛江", "茂名", "潮州", "揭阳",
    "云浮", "北京", "上海", "成都", "重庆", "昆明", "丽江", "大理", "拉萨", "桂林",
    "贵阳", "南宁", "武汉", "长沙", "西安", "兰州", "乌鲁木齐", "哈尔滨", "海拉尔",
)
PROVINCE_RE = re.compile(r"^(?:中国)?[\u4e00-\u9fa5]{2,3}省?\s+(?=[\u4e00-\u9fa5])")

TIME_PREFIX_RE = re.compile(r"^(\d{1,2}\s*[:：]\s*\d{2}(?:\s*[-~－]\s*\d{1,2}\s*[:：]\s*\d{2})?)\s*分?\s*")
# 选项标记："【A】" "A、" "1)" "● " —— 在站点清单里这些本身就是分隔符
OPTION_MARK_RE = re.compile(r"^[【（(\[]?\s*[A-Da-d1-9●•]\s*[】）)\]]?\s*[、.．)]?\s*")
OPTION_SPLIT_RE = re.compile(r"【\s*[A-Da-d1-9]\s*】|[（(]\s*[A-Da-d1-9]\s*[）)]|(?<=[\u4e00-\u9fa5A-Za-z0-9])\s+[A-Da-d]\s*[、.．]")

# 分隔符：顿号/逗号/斜杠/全角斜杠/换行/中加点
SPLIT_RE = re.compile(r"[、，,；;]|／|/|\\|\n|\r|·")
# 时间锚点：站点清单多为 "07:30 梅东路 ... 07:50 越秀公园"，按时间锚点切更可靠
TIME_ANCHOR_RE = re.compile(
    r"(?<![\d:])(\d{1,2}\s*[:：]\s*\d{2}(?:\s*[-~－]\s*\d{1,2}\s*[:：]\s*\d{2})?)\s*分?"
)
# 单个空格也是分隔符，但仅在两侧都是短中文片段时（避免切断 "白云国际机场" 这类长名）
SPACE_SPLIT_RE = re.compile(r"\s+(?=[\u4e00-\u9fa5A-Za-z])")
# 括号内补充说明（如 "梅东路（杨箕地铁站E出口）" 保留主名，丢弃括号）——用于归一化主名
PAREN_RE = re.compile(r"[（(][^）)]*[）)]")

# 行程/说明段落起点：截断，避免把正文当成站点清单
STOP_MARKERS = (
    "产品亮点", "行程介绍", "费用说明", "费用包含", "费用不含", "预订须知", "温馨提示",
    "请注意", "祝您", "我社", "第1天", "第2天", "DAY 1", "接站说明", "特别提示",
)


def _clean(value: str) -> str:
    text = unescape(value or "")
    text = re.sub(r"<[^>]+>", " ", text)
    text = text.replace("\xa0", " ").replace("\u3000", " ")
    text = re.sub(r"[ \t]+", " ", text)
    return text.strip()


def _truncate_at_stop_marker(text: str) -> str:
    cut = len(text)
    for marker in STOP_MARKERS:
        idx = text.find(marker)
        if idx > 0:
            cut = min(cut, idx)
    return text[:cut]


def _looks_like_station(value: str) -> bool:
    if not (2 <= len(value) <= 26):
        return False
    if NEGATIVE_RE.search(value):
        return False
    # 含句号/问号/感叹号的多半是句子而非站点名
    if re.search(r"[。！？!?]", value):
        return False
    # 装饰性分隔线/提示语
    if re.search(r"分隔线|报名请|备注|我是", value):
        return False
    if value in CITY_NAMES:
        return True
    # 碎片词：切分残留（"出口" "酒店"），本身不是站点
    if value in {"出口", "口", "门口", "地铁", "地铁站", "酒店", "大堂", "酒店大堂", "集中", "集合"}:
        return False
    # "珠江新城B2" "龙溪A" 这类地铁口简写
    if METRO_SHORTHAND_RE.match(value):
        return True
    return bool(STATION_HINT_RE.search(value))


def _normalize_name(value: str) -> str:
    """归一化站点名：去选项标记/时间前后缀/括号补充，供展示与匹配。"""
    # 注意不能把括号放进首尾 strip 集合：剥掉结尾的 ）会让后面"未闭合括号"
    # 正则把整个出口说明（纪念堂地铁C出口）当噪声吃掉，站名信息就丢了。
    text = value.strip(" 　·-—－~～,，。")
    # 先剥时间（"8:00越秀公园C出口"），否则选项标记规则会把 "8" 当成选项字母吃掉
    text = re.sub(r"^\d{1,2}\s*[:：]\s*\d{2}\s*分?", "", text)
    text = TIME_PREFIX_RE.sub("", text)
    text = OPTION_MARK_RE.sub("", text)
    text = re.sub(r"^\d{2}(?=[\u4e00-\u9fa5])", "", text)
    # 去掉残留的时间尾巴（"越秀公园地铁C出口 08：15分" -> "越秀公园地铁C出口"）
    text = re.sub(r"\s*\d{1,2}\s*[:：]\s*\d{2}(?:\s*[-~－]\s*\d{1,2}\s*[:：]\s*\d{2})?\s*分?$", "", text)
    text = re.sub(r"^\d{1,2}\s*[点時时分]\s*\d{0,2}\s*分?", "", text)
    # 去掉未闭合括号起的说明尾巴（"越秀公园C出口 （如有交通管控..."）
    text = re.sub(r"[（(\[【][^）)\]】]*$", "", text)
    # "梅东路（杨箕地铁站E出口）" -> 若括号内含地铁/出口，用括号内容做主名更利于查询
    paren = PAREN_RE.search(text)
    if paren:
        inner = paren.group(0)[1:-1]
        if re.search(r"地铁|出口|口", inner):
            text = inner
        else:
            text = PAREN_RE.sub("", text)
    # 去掉地名层级前缀（"广东 广州 龙溪A" -> "龙溪A"；"广州/佛山" 这类保留城市名）
    text = re.sub(r"^(?:广东|广东省)\s+", "", text)
    text = re.sub(r"^(?:广州|深圳|佛山|东莞|珠海|中山|惠州|江门|肇庆)\s+(?=\S)", "", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip(" 　·-—－~～()（）[]【】,，。:：")


def _protect_grouped(text: str) -> list[str]:
    """把不应被切开的片段提取出来（括号内容、"1号线"），用占位符替换后再切分。

    返回 [受保护文本...]，占位符形如 \\x00i\\x00。
    """
    protected: list[str] = []

    def stash(match: re.Match) -> str:
        protected.append(match.group(0))
        return f"\x00{len(protected) - 1}\x00"

    # "1/5号线" 不能按分隔符切开（深圳-地铁1/5号线【宝安中心】站B出口）
    text = re.sub(r"\d\s*[/／、]\s*\d+\s*号线", lambda m: m.group(0).replace(" ", ""), text)
    text = re.sub(r"(\d)\s+(号线)", r"\1\2", text)
    # 把 "N号线" 整体保护，避免 "/" 把它切断
    text = re.sub(r"\d+(?:[/／、]\d+)*号线", stash, text)
    # 括号整体保护
    text = re.sub(r"[（(][^）)]{0,40}[）)]", stash, text)
    text = re.sub(r"【[^】]{0,30}】", stash, text)
    return protected, text


def _restore_grouped(text: str, protected: list[str]) -> str:
    def pop(match: re.Match) -> str:
        idx = int(match.group(1))
        return protected[idx] if idx < len(protected) else ""

    return re.sub(r"\x00(\d+)\x00", pop, text)


def _split_candidates(segment: str) -> list[str]:
    """把一段上车点文本切成候选碎片。

    两条路径取更细的结果：
      1) 时间锚点切分——"07:30 梅东路 07:50 越秀公园" 这类清单的主分隔就是时间
      2) 标点/空格切分
    """
    protected, masked = _protect_grouped(segment)

    by_time: list[str] = []
    marks = list(TIME_ANCHOR_RE.finditer(masked))
    if marks:
        for idx, mark in enumerate(marks):
            end = marks[idx + 1].start() if idx + 1 < len(marks) else len(masked)
            chunk = masked[mark.end():end].strip()
            if chunk:
                by_time.append(f"{mark.group(1)} {chunk}")
        head = masked[: marks[0].start()].strip()
        if head:
            by_time.insert(0, head)

    by_punct: list[str] = []
    for part in OPTION_SPLIT_RE.split(masked):
        if part is None:
            continue
        for piece in SPLIT_RE.split(part):
            by_punct.extend(SPACE_SPLIT_RE.split(piece))

    def keep(parts: list[str]) -> list[str]:
        return [p for p in parts if p.strip()]

    time_parts = keep(by_time)
    punct_parts = keep(by_punct)
    chosen = punct_parts if len(punct_parts) >= len(time_parts) else time_parts
    restored = [_restore_grouped(p, protected) for p in chosen]

    # 时间锚点路即使未被选中，也可用其"时间->站名"映射补齐 time 字段
    times: dict[str, str] = {}
    for part in time_parts:
        restored_part = _restore_grouped(part, protected)
        match = TIME_PREFIX_RE.match(restored_part.strip())
        if not match:
            continue
        name = _normalize_name(restored_part)
        if name:
            times.setdefault(name, match.group(1).replace("：", ":"))

    return restored, times


def _strip_leading_label(text: str) -> str:
    """去掉开头的字段标签与引导语，避免混入首个站点名。"""
    # 先剪掉标签后紧跟的括号说明，如 "集中上车点：（根据实际情况安排大车接站）"
    text = re.sub(
        r"^\s*(?:【)?[\u4e00-\u9fa5]{0,6}(?:上车|集合|散团|下车|接送)[\u4e00-\u9fa5]{0,4}(?:】)?\s*[：:]?\s*"
        r"(?:[（(][^）)]{0,60}[）)]\s*)*",
        " ",
        text,
    )
    # 标签被上游消费后残留的引导性括号声明（"（因受交通管制，…以导游通知为准）："），
    # 不剥掉会触发区块终止误判，把真正的站点清单整段截掉。
    text = re.sub(
        r"^\s*[（(][^）)]*(?:交通管制|导游通知|为准|变更)[^）)]{0,40}[）)]\s*[:：]?\s*",
        " ",
        text,
    )
    text = re.sub(r"^\s*(?:和)?散团地点\s*[：:]?", " ", text)
    return text.lstrip(" 　:：-—")


# 段落内的"下车点：/返程下车点：/下车点】"等次级标签——不是站点名本身
INLINE_LABEL_RE = re.compile(
    r"(?:回程|返程|下车|上车|集合|散团|送团)?(?:下车点|上车点|集合地点|集合地|送团地点|散团地点|集合点)"
    r"\s*[】）)\]]?\s*[：:]?"
)


def _extract_city_prefix(text: str) -> tuple[str | None, str]:
    """取出开头的城市上下文（"广东 广州 龙溪A" -> city=广州, rest=龙溪A）。"""
    work = text
    work = re.sub(r"^(?:中国)?(?:广东|广西|云南|四川|湖南|湖北|江西|福建|浙江|江苏|山东|河南|河北|陕西|甘肃|新疆|西藏|内蒙|青海|宁夏|贵州|海南|吉林|辽宁|黑龙江|山西|安徽)\s+", "", work)
    match = re.match(r"^([\u4e00-\u9fa5]{2,4})\s+(?=\S)", work)
    if match and match.group(1) in CITY_NAMES:
        return match.group(1), work[match.end():]
    return None, text


def _district_quotas(text: str) -> dict[str, str]:
    """解析分组门槛声明，得到 {区名: 人数}。

    形态："广州4区（白云区、增城区、黄埔区、南沙区）4人起接"
    同名区多次出现时，取"声明位置"最近且在其之前的那次。
    """
    quotas: dict[str, tuple[int, str]] = {}
    for gm in GROUP_QUOTA_RE.finditer(text):
        # 跳过否定式声明："非以上车点 …15人起接"
        head = text[max(0, gm.start() - 12): gm.start()]
        if NEGATIVE_GROUP_RE.search(head):
            continue
        for d in re.split(r"[、,，\s]+", gm.group(1)):
            d = d.strip()
            if not d.endswith(("区", "市", "县", "镇")):
                continue
            prev = quotas.get(d)
            if prev is None or gm.start() > prev[0]:
                quotas[d] = (gm.start(), gm.group(2))
    return {d: v[1] for d, v in quotas.items()}


def parse_boarding_points(raw_text: str) -> list[dict]:
    """把一段上车点文本切成结构化站点列表，返回 [{name, district?, quota?}]。"""
    text = _truncate_at_stop_marker(_clean(raw_text))
    text = _strip_leading_label(text)
    if not text:
        return []
    # 段落内次级标签（"下车点：越秀公园"）转成弱分隔，避免标签词混进站点名
    text = INLINE_LABEL_RE.sub(" ", text)
    end = BLOCK_END_RE.search(text)
    if end:
        text = text[: end.start()]
    city, text = _extract_city_prefix(text)
    group_quotas = _district_quotas(text)
    group_quota_pos: dict[str, int] = {}

    # 按行政区切块，保留归属（"增城区：增城中海城市广场"）
    segments: list[tuple[str | None, str]] = []
    district: str | None = None
    cursor = 0
    for match in DISTRICT_PREFIX_RE.finditer(text):
        segments.append((district, text[cursor: match.start()]))
        district = match.group(1)
        cursor = match.end()
    segments.append((district, text[cursor:]))

    items: list[dict] = []
    # 记录每个区在文本中的位置，便于绑定"最近的前置门槛声明"
    district_positions: dict[str, int] = {}
    for match in DISTRICT_PREFIX_RE.finditer(text):
        district_positions.setdefault(match.group(1), match.start())

    for seg_district, segment in segments:
        # 切掉否定式段落（"非以上车点 …15人起接"），它不属于本区清单
        neg = NEGATIVE_GROUP_RE.search(segment)
        if neg:
            segment = segment[: neg.start()]
        quota_match = QUOTA_RE.search(segment)
        quota = quota_match.group(1) if quota_match else None
        if quota is None and seg_district in group_quotas:
            quota = group_quotas[seg_district]
        segment = QUOTA_RE.sub(" ", segment)
        # 去掉分组门槛声明本身（"广州4区（白云区、增城区…）4人起接"）
        segment = re.sub(r"[\u4e00-\u9fa5]{2,6}\d*区\s*[（(][^）)]{0,80}[）)]", " ", segment)

        candidates, times = _split_candidates(segment)
        for chunk in candidates:
            time_value: str | None = None
            time_match = TIME_PREFIX_RE.match(chunk.strip())
            if time_match:
                time_value = time_match.group(1).replace("：", ":")
            name = _normalize_name(chunk)
            if time_value is None:
                time_value = times.get(name)
            if not _looks_like_station(name):
                continue
            items.append(
                {
                    "name": name,
                    "district": seg_district,
                    "quota": quota,
                    "city": city,
                    "time": time_value,
                }
            )

    out: list[dict] = []
    seen: set[tuple[str, str | None]] = set()
    for item in items:
        key = (item["name"], item.get("district"))
        if key in seen:
            continue
        seen.add(key)
        out.append(item)
    return out


def _score_candidate(points: list[dict], tail: str) -> float:
    """给候选结果打分，用于在多个命中里挑真正的结构化字段。

    真正的上车点字段：站点多、密度高、文本短；散文段落：站点少但尾巴极长。
    """
    if not points:
        return -1.0
    density = len(points) / max(1.0, len(tail) / 40.0)
    return len(points) + density


def extract_boarding_raw(html: str, max_chars: int = 1200) -> str:
    """原样捕获上车点字段文本，不做站点级裁剪。

    与 extract_boarding_points 的区别：保留非站点描述、接送方式、回程地点、
    清单外区域门槛等，供 AI 做语义判断。
    截断只发生在"真正进入下一页内容"处（产品亮点/行程介绍/DAY 1…），
    使区块保持完整可读。
    """
    text = _clean(html)
    texts: list[str] = []
    for label in FIELD_LABELS:
        for match in re.finditer(re.escape(label) + r"\s*[:：]?", text):
            tail = text[match.end(): match.end() + max_chars]
            # 截断点：下一个属性字段，或行程正文起始
            cuts = []
            matched = NEXT_FIELD_RE.search(tail)
            if matched:
                cuts.append(matched.start())
            body = BODY_START_RE.search(tail)
            if body:
                cuts.append(body.start())
            block = tail[: min(cuts)] if cuts else tail
            block = block.strip()
            if block:
                texts.append(block[:max_chars])
    if not texts:
        return ""
    # 站点最多的那个区块通常就是真字段
    texts.sort(key=lambda t: -len(parse_boarding_points(t)))
    return texts[0]


def extract_boarding_points(html: str) -> list[dict]:
    """从详情页 HTML 提取上车点。返回 [] 表示该线路无城市上车点（如国际长线）。"""
    text = _clean(html)
    best: list[dict] = []
    best_score = -1.0
    for label in FIELD_LABELS:
        for match in re.finditer(re.escape(label) + r"\s*[:：]?", text):
            tail = text[match.end(): match.end() + 700]
            # 遇到下一个属性字段就停，避免把"目的地：深圳"当成最后一个上车点
            tail = _cut_at_next_field(tail)
            points = parse_boarding_points(tail)
            score = _score_candidate(points, tail)
            if score > best_score:
                best_score = score
                best = points
    return best


# 紧邻的其他属性字段：出现即说明上车点清单已结束
NEXT_FIELD_RE = re.compile(
    r"[\s\n]*(?:目的地|活动类型|行程天数|组织者|活动费用|费用说明|产品亮点|行程介绍|活动咨询|领队"
    r"|已参加|活动强度|风景指数|套餐选择|出发日期|报名)\s*[:：]"
)


def _cut_at_next_field(tail: str) -> str:
    match = NEXT_FIELD_RE.search(tail)
    cut = match.start() if match else len(tail)
    # 字段值通常单段结束；散文会继续成句（。！？），在首个句末截断。
    # 句末判定忽略括号内内容——免责声明"（…以导游通知为准！）"的感叹号
    # 不是句末，否则会把清单整段截掉。
    blanked = re.sub(r"[（(][^）)]*[）)]", "　", tail[:cut])
    sentence = re.search(r"[。！？!?]", blanked)
    if sentence:
        cut = min(cut, sentence.start())
    return tail[:cut]


def format_summary(points: list[dict], limit: int = 3) -> str:
    """生成展示用摘要，如 "珠江新城B2 等4个上车点"。"""
    if not points:
        return ""
    names = [p["name"] for p in points]
    if len(names) <= limit:
        return "、".join(names)
    return f"{'、'.join(names[:limit])} 等{len(names)}个上车点"
