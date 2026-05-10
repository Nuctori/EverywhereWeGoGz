import re


_PATTERNS = [
    re.compile(r'当地玩乐'),
    re.compile(r'自由行'),
    re.compile(r'酒店(?:住宿)?套餐'),
    re.compile(r'住宿套餐'),
    re.compile(r'门票(?:套餐|票券|预订|预定|产品)'),
    re.compile(r'(?:签证|签注)(?:代办|办理|套餐|服务)?'),
    re.compile(r'(?:代订|代办|代购)[^\n]{0,20}(?:酒店|门票|签证|机票|巴士)'),
    re.compile(r'(?:土特产|特产|手信|花生油|豆腐|人参|燕窝|海参|乳胶|茶叶|饮料|食品|零食|酱油|生抽|老抽)'),
    re.compile(r'(?:扫码|二维码|活动群|微信群|加群|已结束|结业|工作日活动)'),
    re.compile(r'(?:工厂探秘|体验馆|展销会|年会|培训会|会议活动|直播间)'),
    re.compile(r'\d+\s*(?:ml|毫升|g|克|kg|斤|l|L|盒|袋|罐|瓶|包|箱)\b', re.I),
    re.compile(r'(?:×|\*)\s*\d+\s*(?:罐|瓶|盒|袋|箱|包)?'),
]


def is_blacklisted_title(title: str) -> bool:
    compact = re.sub(r'\s+', '', title or '')
    return any(pattern.search(compact) for pattern in _PATTERNS)


_TOUR_MARKERS = [
    re.compile(r'\d+\s*[天日][游团]?$'),
    re.compile(r'\d+\s*[天日].*?(双飞|双动|高铁|动车|专列|往返|出发|成团|纯玩|跟团|联游|环线)'),
    re.compile(r'(双飞|双动|高铁|动车|专列|往返|出发|成团|纯玩|跟团|联游|环线|徒步|穿越|深度游|精品小团|私家团|房车旅行|邮轮|探险)'),
]


def looks_like_tour(title: str) -> bool:
    compact = re.sub(r'\s+', '', title or '')
    if not compact:
        return False
    if is_blacklisted_title(compact):
        return False
    return any(pattern.search(compact) for pattern in _TOUR_MARKERS)
