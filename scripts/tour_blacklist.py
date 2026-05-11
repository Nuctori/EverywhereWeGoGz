import re


_TOUR_MARKERS = [
    re.compile(r"\d+\s*[天日][游团]?$"),
    re.compile(r"\d+\s*[天日].*?(双飞|双动|高铁|动车|专列|往返|出发|成团|纯玩|跟团|联游|环线)"),
    re.compile(r"(双飞|双动|高铁|动车|专列|往返|出发|成团|纯玩|跟团|联游|环线|徒步|穿越|深度游|精品小团|私家团|房车旅行|邮轮|探险)"),
]


_PRODUCT_BRANDS = [
    "红棉",
    "陶陶居",
    "致美斋",
    "客来客往",
    "蒸谷米",
    "广州酒家",
    "天润粮油",
    "穗粮定制",
    "江门华联",
    "秀才郎",
    "王老吉",
    "广氏",
    "ASIA亚洲",
    "皇中皇",
    "黄金食品",
    "叹鸡",
]


_PRODUCT_WORDS = [
    "黑糖",
    "方糖",
    "红糖",
    "白糖",
    "冰糖",
    "黄糖",
    "零卡糖",
    "咖啡伴侣",
    "糖条",
    "糖包",
    "糖粉",
    "礼包",
    "零食",
    "食品",
    "汤料",
    "油粘米",
    "粘米",
    "香米",
    "丝苗米",
    "富硒米",
    "蒸谷米",
    "米粉",
    "生晒面",
    "面条",
    "腐竹",
    "花生油",
    "腊肠",
    "腊肉",
    "腊味",
    "腊鸭",
    "调味酱",
    "酱油",
    "生抽",
    "老抽",
    "蚝油",
    "鲍汁",
    "甜醋",
    "猪脚姜醋",
    "凉茶",
    "饮料",
    "果汁",
    "茶饮",
    "植物饮料",
    "碳酸饮料",
    "果汁饮料",
    "固体饮料",
    "电解质水",
    "椰子水",
    "汽水",
    "花茶",
    "果干",
    "冻干",
    "蜜饯",
    "蜂蜜",
    "陈皮",
    "芡实",
    "莲子",
    "罗汉果",
    "无花果干",
    "芒果干",
    "花菇",
    "白菜干",
    "鸡仔饼",
    "蛋卷",
    "凤梨酥",
    "曲奇",
    "酥饼",
    "糯米鸡",
    "糯米糍",
    "裹蒸粽",
    "罗汉果",
]


_PRODUCT_CONTEXT = [
    "包邮",
    "起售",
    "礼盒",
    "礼装",
    "礼袋",
    "礼品",
    "系列",
    "组合",
    "独立包装",
    "省内包邮",
    "任意搭配",
    "多口味可选",
    "出口品质",
    "天然无添加",
    "纯净无添加",
    "省内邮",
    "装",
]


_PRODUCT_PACKAGING_PATTERNS = [
    re.compile(r"\d+\s*(?:ml|毫升|g|克|kg|斤|l|L|盒|袋|包|箱|罐|瓶|支|粒|条|枚)\b", re.I),
    re.compile(r"(?:×|x|\*)\s*\d+\s*(?:盒|袋|包|箱|罐|瓶|支|粒|条|枚)?", re.I),
    re.compile(r"\d+\s*(?:件|份)\s*起售"),
]


def _contains_any(text: str, terms) -> bool:
    return any(term in text for term in terms)


def _matches_any(text: str, patterns) -> bool:
    return any(pattern.search(text) for pattern in patterns)


def looks_like_product_title(title: str) -> bool:
    compact = re.sub(r"\s+", "", title or "")
    if not compact:
        return False

    if _contains_any(compact, _PRODUCT_BRANDS):
        return (
            _contains_any(compact, _PRODUCT_CONTEXT)
            or _contains_any(compact, _PRODUCT_WORDS)
            or _matches_any(compact, _PRODUCT_PACKAGING_PATTERNS)
        )

    if _contains_any(compact, _PRODUCT_CONTEXT):
        return _contains_any(compact, _PRODUCT_WORDS) or _matches_any(compact, _PRODUCT_PACKAGING_PATTERNS)

    if _contains_any(compact, _PRODUCT_WORDS) and _matches_any(compact, _PRODUCT_PACKAGING_PATTERNS):
        return True

    return False


def is_blacklisted_title(title: str) -> bool:
    return looks_like_product_title(title)


def looks_like_tour(title: str) -> bool:
    compact = re.sub(r"\s+", "", title or "")
    if not compact:
        return False
    if is_blacklisted_title(compact):
        return False
    return any(pattern.search(compact) for pattern in _TOUR_MARKERS)
