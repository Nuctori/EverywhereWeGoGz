# -*- coding: utf-8 -*-
"""Canonical place matching used by the data merge and geo quality audit."""

import re


PLACE_ROWS = [
    ("广州", "中国", "广东", 23.1291, 113.2644, ("广州", "广州市", "南沙")),
    ("东莞", "中国", "广东", 23.0207, 113.7518, ("东莞", "东莞市", "桥头")),
    ("中山", "中国", "广东", 22.5176, 113.3926, ("中山", "中山市", "神湾")),
    ("梅州", "中国", "广东", 24.2886, 116.122, ("梅州", "梅州市", "五华热矿泥")),
    ("深圳", "中国", "广东", 22.5431, 114.0579, ("深圳", "深圳市")),
    ("珠海", "中国", "广东", 22.271, 113.5767, ("珠海", "珠海市", "海泉湾", "东澳岛", "桂山岛", "外伶仃岛")),
    ("惠州", "中国", "广东", 23.1115, 114.4152, ("惠州", "惠州市", "巽寮湾", "双月湾", "罗浮山")),
    ("清远", "中国", "广东", 23.6818, 113.056, ("清远", "清远市", "美林湖")),
    ("韶关", "中国", "广东", 24.8104, 113.5972, ("韶关", "韶关市", "南华寺", "丹霞山")),
    ("肇庆", "中国", "广东", 23.0472, 112.4651, ("肇庆", "肇庆市", "蓝钟", "七星岩")),
    ("佛山", "中国", "广东", 23.0218, 113.1219, ("佛山", "佛山市")),
    ("江门", "中国", "广东", 22.5787, 113.0815, ("江门", "江门市")),
    ("阳江", "中国", "广东", 21.8579, 111.9822, ("阳江", "阳江市")),
    ("汕头", "中国", "广东", 23.3541, 116.6819, ("汕头", "汕头市", "南澳岛", "青澳湾", "贝沙湾")),
    ("汕尾", "中国", "广东", 22.7869, 115.3753, ("汕尾", "汕尾市", "红海湾")),
    ("潮州", "中国", "广东", 23.6567, 116.6226, ("潮州", "潮州市")),
    ("湛江", "中国", "广东", 21.2707, 110.3594, ("湛江", "湛江市")),
    ("茂名", "中国", "广东", 21.6627, 110.9255, ("茂名", "茂名市")),
    ("贺州", "中国", "广西", 24.4036, 111.5668, ("贺州", "贺州市", "姑婆山", "西溪")),
    ("龙门", "中国", "广东", 23.723, 114.25, ("龙门", "龙门县", "云顶", "地派", "竹溪山境", "美泉谷", "玥泉庄", "逸泉庄", "尚天然", "林丰", "温泉大观园", "庄上庄", "颐和温泉", "康桥温泉", "南昆山居")),
    ("河源", "中国", "广东", 23.7463, 114.7007, ("河源", "河源市", "万绿湖", "叶园温泉")),
    ("连平", "中国", "广东", 24.3696, 114.4887, ("连平", "连平县", "鹰嘴桃")),
    ("德庆", "中国", "广东", 23.1456, 111.7859, ("德庆", "德庆县", "悦城龙母祖庙")),
    ("翁源", "中国", "广东", 24.3506, 114.1301, ("翁源", "翁源县", "翁山源温泉", "龙泰翁山源温泉")),
    ("开平", "中国", "广东", 22.376, 112.6985, ("开平", "开平市", "赤坎古镇")),
    ("鹤山", "中国", "广东", 22.7659, 112.9643, ("鹤山", "鹤山市")),
    ("三水", "中国", "广东", 23.1557, 112.8966, ("三水", "三水区", "三水温泉")),
    ("阳西", "中国", "广东", 21.7529, 111.6177, ("阳西", "阳西县", "沙扒湾", "咸水矿温泉")),
    ("新丰", "中国", "广东", 24.0592, 114.207, ("新丰", "新丰县", "雅致酒店", "云天海", "江源温泉", "温德姆花园酒店")),
    ("英德", "中国", "广东", 24.1861, 113.401, ("英德", "英德市", "海螺国际大酒店")),
    ("安远", "中国", "江西", 25.1346, 115.3939, ("安远", "安远县", "三百山", "热泉河")),
    ("阳山", "中国", "广东", 24.4706, 112.641, ("阳山", "阳山县", "阳山第一峰")),
    ("新兴", "中国", "广东", 22.695, 112.225, ("新兴", "新兴县", "象窝", "龙山温泉", "禅域小镇", "悦天下", "三页温泉", "天露山")),
    ("台山", "中国", "广东", 22.2514, 112.7938, ("台山", "台山市", "泽汇温泉", "金水台", "富丽湾")),
    ("恩平", "中国", "广东", 22.1833, 112.3051, ("恩平", "恩平市", "山泉湾", "喜运来温泉", "温泉国际酒店")),
    ("佛冈", "中国", "广东", 23.879, 113.532, ("佛冈", "佛冈县", "聚龙湾", "森波拉")),
    ("增城", "中国", "广东", 23.2904, 113.8108, ("增城", "增城区", "三英温泉", "高滩温泉", "合汇温泉")),
    ("从化", "中国", "广东", 23.5483, 113.5867, ("从化", "从化区", "圣托利温泉庄园", "壹泉湾", "卓思道")),
    ("新会", "中国", "广东", 22.4583, 113.034, ("新会", "新会区", "古兜温泉")),
    ("连州", "中国", "广东", 24.7814, 112.377, ("连州", "连州市", "地下河", "水晶梨")),
    ("玉林", "中国", "广西", 22.6364, 110.1648, ("玉林", "玉林市", "璟象九龙温泉")),
    ("郴州", "中国", "湖南", 25.7705, 113.0149, ("郴州", "郴州市", "莽山")),
    ("龙南", "中国", "江西", 24.8647, 114.789, ("龙南", "龙南县", "汉仙温泉")),
    ("汝城", "中国", "湖南", 25.5327, 113.6858, ("汝城", "汝城县", "官溪温泉", "热水河")),
    ("泉州", "中国", "福建", 24.8741, 118.6757, ("泉州", "泉州市", "洛伽寺", "蟳蜅渔村")),
    ("平潭", "中国", "福建", 25.5037, 119.791, ("平潭", "平潭县", "猴研岛")),
    ("漳州", "中国", "福建", 24.5129, 117.6471, ("漳州", "漳州市", "土楼")),
    ("永定", "中国", "福建", 24.723, 116.732, ("永定", "永定土楼")),
    ("六盘水", "中国", "贵州", 26.5846, 104.8485, ("六盘水", "六盘水市")),
    ("霞浦", "中国", "福建", 26.8854, 120.005, ("霞浦", "霞浦县")),
    ("北海", "中国", "广西", 21.4733, 109.1193, ("北海", "北海市", "涠洲岛")),
    ("柳州", "中国", "广西", 24.3255, 109.4155, ("柳州", "柳州市")),
    ("崇左", "中国", "广西", 22.3771, 107.3647, ("崇左", "崇左市", "德天瀑布")),
    ("三门海", "中国", "广西", 24.1095, 107.539, ("三门海",)),
    ("大理", "中国", "云南", 25.6065, 100.2676, ("大理", "大理市", "洱海")),
    ("普者黑", "中国", "云南", 24.1227, 104.195, ("普者黑",)),
    ("丽江", "中国", "云南", 26.8721, 100.233, ("丽江", "丽江市", "玉龙雪山")),
    ("西双版纳", "中国", "云南", 22.0074, 100.7979, ("西双版纳", "版纳")),
    ("长沙", "中国", "湖南", 28.2282, 112.9388, ("长沙", "长沙市")),
    ("恩施", "中国", "湖北", 30.2722, 109.4882, ("恩施", "恩施市")),
    ("神农架", "中国", "湖北", 31.7449, 110.6759, ("神农架",)),
    ("庐山", "中国", "江西", 29.5602, 115.992, ("庐山",)),
    ("三清山", "中国", "江西", 28.8955, 118.0645, ("三清山",)),
    ("婺源", "中国", "江西", 29.2481, 117.8622, ("婺源",)),
    ("景德镇", "中国", "江西", 29.2687, 117.1784, ("景德镇",)),
    ("赣州", "中国", "江西", 25.8311, 114.935, ("赣州", "赣州市")),
    ("温州", "中国", "浙江", 27.9949, 120.6994, ("温州", "温州市")),
    ("杭州", "中国", "浙江", 30.2741, 120.1551, ("杭州", "杭州市", "西湖")),
    ("黄山", "中国", "安徽", 29.7147, 118.3376, ("黄山", "黄山市")),
    ("大连", "中国", "辽宁", 38.914, 121.6147, ("大连", "大连市")),
    ("西宁", "中国", "青海", 36.6171, 101.7782, ("西宁", "西宁市")),
    ("兰州", "中国", "甘肃", 36.0611, 103.8343, ("兰州", "兰州市")),
    ("敦煌", "中国", "甘肃", 40.1421, 94.6619, ("敦煌", "敦煌市", "莫高窟")),
    ("张掖", "中国", "甘肃", 38.9259, 100.4498, ("张掖", "张掖市")),
    ("嘉峪关", "中国", "甘肃", 39.7731, 98.2882, ("嘉峪关", "嘉峪关市")),
    ("海拉尔", "中国", "内蒙古", 49.2116, 119.7657, ("海拉尔", "呼伦贝尔")),
    ("满洲里", "中国", "内蒙古", 49.5978, 117.3787, ("满洲里", "满洲里市")),
    ("呼伦贝尔", "中国", "内蒙古", 49.2116, 119.7657, ("呼伦贝尔", "呼伦湖")),
    ("马拉喀什", "摩洛哥", None, 31.6295, -7.9811, ("马拉喀什",)),
    ("喀什", "中国", "新疆", 39.4677, 75.9938, ("喀什", "喀什市")),
    ("伊犁", "中国", "新疆", 43.9168, 81.3241, ("伊犁", "那拉提")),
    ("喀纳斯", "中国", "新疆", 48.819, 87.038, ("喀纳斯", "喀纳斯湖")),
    ("贵阳", "中国", "贵州", 26.647, 106.6302, ("贵阳", "贵阳市")),
    ("黄果树", "中国", "贵州", 25.99, 105.666, ("黄果树", "黄果树瀑布")),
    ("荔波", "中国", "贵州", 25.4122, 107.8838, ("荔波", "荔波县")),
    ("西江", "中国", "贵州", 26.4956, 108.176, ("西江", "西江千户苗寨")),
    ("桂林", "中国", "广西", 25.2736, 110.2902, ("桂林", "桂林市")),
    ("南宁", "中国", "广西", 22.817, 108.3665, ("南宁", "南宁市")),
    ("张家界", "中国", "湖南", 29.1171, 110.4792, ("张家界", "张家界市")),
    ("厦门", "中国", "福建", 24.4798, 118.0894, ("厦门", "厦门市")),
    ("三亚", "中国", "海南", 18.2528, 109.5119, ("三亚", "三亚市")),
    ("昆明", "中国", "云南", 25.0389, 102.7183, ("昆明", "昆明市")),
    ("成都", "中国", "四川", 30.5728, 104.0668, ("成都", "成都市")),
    ("重庆", "中国", "重庆", 29.563, 106.5516, ("重庆", "重庆市", "武隆", "仙女山")),
    ("北京", "中国", "北京", 39.9042, 116.4074, ("北京", "北京市")),
    ("上海", "中国", "上海", 31.2304, 121.4737, ("上海", "上海市")),
    ("西安", "中国", "陕西", 34.3416, 108.9398, ("西安", "西安市")),
    ("乌鲁木齐", "中国", "新疆", 43.8256, 87.6168, ("乌鲁木齐", "乌鲁木齐市")),
    ("拉萨", "中国", "西藏", 29.652, 91.1721, ("拉萨", "拉萨市")),
    ("呼和浩特", "中国", "内蒙古", 40.8414, 111.7519, ("呼和浩特", "呼和浩特市")),
    ("哈尔滨", "中国", "黑龙江", 45.8038, 126.5349, ("哈尔滨", "哈尔滨市")),
    ("河内", "越南", None, 21.0285, 105.8542, ("河内", "河内市")),
    ("曼谷", "泰国", None, 13.7563, 100.5018, ("曼谷", "曼谷市")),
    ("清迈", "泰国", None, 18.7883, 98.9853, ("清迈", "清莱")),
    ("普吉岛", "泰国", None, 7.8804, 98.3923, ("普吉岛", "普吉")),
    ("胡志明市", "越南", None, 10.8231, 106.6297, ("胡志明", "胡志明市")),
    ("芽庄", "越南", None, 12.2388, 109.1967, ("芽庄",)),
    ("东京", "日本", None, 35.6762, 139.6503, ("东京", "东京市")),
    ("大阪", "日本", None, 34.6937, 135.5023, ("大阪", "大阪市")),
    ("京都", "日本", None, 35.0116, 135.7681, ("京都", "京都市")),
    ("首尔", "韩国", None, 37.5665, 126.978, ("首尔", "首尔市")),
    ("新加坡", "新加坡", None, 1.3521, 103.8198, ("新加坡",)),
    ("吉隆坡", "马来西亚", None, 3.139, 101.6869, ("吉隆坡", "吉隆坡市")),
    ("仙本那", "马来西亚", None, 4.4818, 118.6112, ("仙本那", "斗湖")),
    ("巴厘岛", "印度尼西亚", None, -8.4095, 115.1889, ("巴厘岛", "巴厘")),
    ("奥克兰", "新西兰", None, -36.8509, 174.7645, ("奥克兰",)),
    ("基督城", "新西兰", None, -43.5321, 172.6362, ("基督城",)),
    ("皇后镇", "新西兰", None, -45.0312, 168.6626, ("皇后镇",)),
    ("悉尼", "澳大利亚", None, -33.8688, 151.2093, ("悉尼", "悉尼市")),
    ("墨尔本", "澳大利亚", None, -37.8136, 144.9631, ("墨尔本",)),
    ("布里斯班", "澳大利亚", None, -27.4698, 153.0251, ("布里斯班",)),
    ("凯恩斯", "澳大利亚", None, -16.9186, 145.7781, ("凯恩斯", "大堡礁")),
    ("马尔代夫", "马尔代夫", None, 4.1755, 73.5093, ("马尔代夫",)),
    ("莫斯科", "俄罗斯", None, 55.7558, 37.6173, ("莫斯科",)),
    ("圣彼得堡", "俄罗斯", None, 59.9343, 30.3351, ("圣彼得堡",)),
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
DEPARTURE_MARKERS = re.compile(r"(?:起止|起程|出发|往返|直飞|集合|起飞|返程|回程|联运)")
PLACE_LABEL_SUFFIXES = re.compile(
    "|".join(sorted(("海泉湾", "红海湾", "云顶", "森林公园", "度假区", "古镇", "古村", "庄园", "乐园", "景区", "酒店", "温泉", "湾", "岛", "湖"), key=len, reverse=True))
)
ADMINISTRATIVE_ALIAS_SUFFIXES = ("省", "市", "县", "区", "旗")
EXPLICIT_POI_NAMES = {
    "仙本那", "普者黑", "三门海", "喀纳斯", "黄果树", "神农架", "庐山", "三清山", "婺源",
    "巴黎", "伦敦", "纽约", "悉尼", "墨尔本", "布里斯班", "凯恩斯", "奥克兰", "基督城", "皇后镇",
    "清迈", "普吉岛", "胡志明市", "芽庄", "巴厘岛", "马尔代夫", "莫斯科", "圣彼得堡",
}
TEXT_SEPARATORS = "|｜丨/／+&＆()（）[]【】,，。；;、"


def _is_named_alias(alias, canonical_name):
    """Treat catalog aliases as POIs unless they are administrative spellings."""
    return bool(alias) and alias != canonical_name and not alias.endswith(ADMINISTRATIVE_ALIAS_SUFFIXES)


def _is_inline_named_alias(text, mention):
    alias = mention["alias"]
    canonical_name = mention["place"]["name"]
    if not _is_named_alias(alias, canonical_name):
        return False
    if PLACE_LABEL_SUFFIXES.search(alias):
        return True
    return str(text or "")[:mention["start"]].rstrip().endswith(canonical_name)


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


def _find_direct_place_match(text):
    value = str(text or "").strip()
    exact_matches = [(alias, place) for alias, place in ALIAS_ROWS if alias == value]
    if exact_matches:
        alias, place = exact_matches[0]
        if alias == place["name"] or not _is_named_alias(alias, place["name"]):
            return place, place["name"]
    named_matches = [
        (alias, place)
        for alias, place in ALIAS_ROWS
        if _is_named_alias(alias, place["name"]) and alias in value
    ]
    if named_matches:
        alias, place = max(named_matches, key=lambda item: len(item[0]))
        label = alias if alias.startswith(place["name"]) else f"{place['name']}{alias}"
        return place, label
    place = find_place(value)
    return (place, place["name"]) if place else (None, "")


def _iter_place_mentions(text):
    value = str(text or "")
    matches = []
    for alias, place in ALIAS_ROWS:
        start = 0
        while alias:
            index = value.find(alias, start)
            if index < 0:
                break
            matches.append({
                "place": place,
                "alias": alias,
                "start": index,
                "end": index + len(alias),
            })
            start = index + 1
    matches.sort(key=lambda item: (item["start"], -len(item["alias"])))
    selected = []
    occupied_until = -1
    seen_mentions = set()
    for item in matches:
        if item["start"] < occupied_until:
            continue
        name = item["place"]["name"]
        mention_key = (name, item["alias"])
        if mention_key in seen_mentions:
            continue
        seen_mentions.add(mention_key)
        selected.append(item)
        occupied_until = item["end"]
    return selected


def _is_departure_mention(text, mention):
    value = str(text or "")
    start = mention["start"]
    end = mention["end"]
    after = value[end:min(len(value), end + 16)]
    after_text = after.lstrip()
    if after_text.startswith("往返") and mention["place"]["country"] != "中国":
        return False
    before_text = value[max(0, start - 16):start].rstrip()
    if after_text.startswith("往返") and re.search(r"(?:直飞|出发|起程|起止|集合|联运)[=＝\s-]{0,8}$", before_text):
        return False
    if DEPARTURE_MARKERS.match(after_text) or re.match(
        r"[A-Za-z0-9]{0,8}(?:起止|起程|出发|往返|直飞|集合|起飞|返程|回程|联运)",
        after_text,
    ):
        return True
    dash_match = re.match(r"\s*[-—－]\s*", after)
    if dash_match:
        dash_tail = after[dash_match.end():]
        immediate_match = re.match(r"[\u4e00-\u9fff]+", dash_tail)
        immediate = immediate_match.group(0) if immediate_match else ""
        inline_alias = mention["alias"] != mention["place"]["name"] and value[:start].rstrip().endswith(mention["place"]["name"])
        if (any(alias and immediate.startswith(alias) for alias, _ in ALIAS_ROWS) or inline_alias) and (
            mention["alias"] != mention["place"]["name"]
            or mention["place"]["name"] not in EXPLICIT_POI_NAMES
        ):
            return True
    before = value[max(0, start - 8):start]
    if re.search(r"(?:从|由|自|在|于)\s*$", before):
        return True
    return False


def _place_label(text, mention):
    value = str(text or "")
    alias = mention["alias"]
    canonical_name = mention["place"]["name"]
    if _is_named_alias(alias, canonical_name):
        prefix = f"{canonical_name}{alias}" if not alias.startswith(canonical_name) else alias
        tail_match = re.match(r"[\u4e00-\u9fff]{0,18}", value[mention["end"]:])
        tail = tail_match.group(0) if tail_match else ""
        suffix_matches = list(PLACE_LABEL_SUFFIXES.finditer(tail))
        if suffix_matches and suffix_matches[0].start() == 0:
            return f"{prefix}{tail[:suffix_matches[0].end()]}".strip()
        return prefix
    end = mention["end"]
    tail_match = re.match(r"[\u4e00-\u9fff]{0,18}", value[end:])
    tail = tail_match.group(0) if tail_match else ""
    suffix_matches = list(PLACE_LABEL_SUFFIXES.finditer(tail))
    suffix_match = suffix_matches[-1] if suffix_matches else None
    if tail.startswith(("回", "返", "去", "住", "入住", "返回")):
        return mention["place"]["name"]
    if suffix_match:
        return f"{canonical_name}{tail[:suffix_match.end()]}".strip()
    return canonical_name


def mine_destination_place(raw, title, destination, detail=None):
    """Extract a named destination from title/detail text without treating departure as destination."""
    destination_text = str(destination or "").strip()
    direct_place, direct_label = _find_direct_place_match(destination_text)
    if direct_place:
        return direct_place, direct_label, "medium", "local-place-catalog"

    texts = [str(title or "")]
    detail = detail if isinstance(detail, dict) else {}
    for day in detail.get("itinerary") or []:
        if not isinstance(day, dict):
            continue
        texts.extend(str(day.get(key) or "") for key in ("title", "description"))
        texts.extend(str(value or "") for value in day.get("activities") or [])
    texts.extend(str(value or "") for value in detail.get("highlights") or [])

    candidates = []
    for text_index, text in enumerate(texts):
        for mention in _iter_place_mentions(text):
            if _is_departure_mention(text, mention):
                continue
            label = _place_label(text, mention)
            is_named_place = _is_inline_named_alias(text, mention) or (
                mention["alias"] == mention["place"]["name"]
                and mention["place"]["name"] in EXPLICIT_POI_NAMES
            )
            candidates.append((
                text_index,
                mention["start"],
                mention["place"],
                label,
                is_named_place,
            ))

    if not candidates:
        return None, "", "low", "unknown"
    region = find_region(destination_text)
    if region and region.get("province"):
        in_region = [
            item for item in candidates
            if item[2].get("province") == region["province"]
            and item[2].get("country") == region.get("country")
        ]
        named_in_region = [item for item in in_region if item[4]]
        named_anywhere = [item for item in candidates if item[4]]
        if named_in_region:
            candidates = in_region
        elif named_anywhere:
            # Source destination fields often contain the departure province;
            # an explicit named POI in the title is stronger evidence.
            candidates = named_anywhere
        elif in_region:
            first_candidate = min(candidates, key=lambda item: (item[0], item[1]))
            candidates = in_region if first_candidate in in_region else []
        else:
            # Some feeds copy the departure province into destination. When
            # no same-region candidate survives departure filtering, the first
            # remaining catalog place is the strongest title-level signal.
            pass
    named_candidates = [item for item in candidates if item[4]]
    if named_candidates:
        candidates = named_candidates
    elif not candidates and destination_text not in {"", "其他", "全国"}:
        return None, "", "low", "unknown"
    candidates.sort(key=lambda item: (item[0], item[1]))
    _, _, place, label, _ = candidates[0]
    return place, label if named_candidates else place["name"], "low", "title-place-miner"


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


def normalize_tour_geo(raw, title, destination, detail=None):
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
    destination_place, destination_label, destination_confidence, destination_geo_source = mine_destination_place(
        raw,
        title,
        destination_text,
        detail,
    )
    destination_region = find_region(destination_text)
    destination_country = destination_place["country"] if destination_place else (destination_region["country"] if destination_region else "")
    destination_province = (destination_place.get("province") or "") if destination_place else (destination_region.get("province") or "") if destination_region else ""
    destination_source = "source" if str(raw.get("destination") or "").strip() else "inferred"
    fields = {
        **departure,
        "destinationCity": destination_place["name"] if destination_place else "",
        "destinationPlaceName": destination_label if destination_place else "",
        "destinationProvince": (destination_place.get("province") or "") if destination_place else "",
        "destinationCountry": destination_country,
        "destinationLatitude": destination_place["latitude"] if destination_place else None,
        "destinationLongitude": destination_place["longitude"] if destination_place else None,
        "geoStatus": "complete" if departure_place and destination_place else ("destination_only" if destination_place or destination_region else "unmapped"),
        "geoConfidence": destination_confidence if destination_place else "low",
        "geoSource": destination_geo_source if destination_place else ("local-region-catalog" if destination_region else "unknown"),
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
        "destinationPlaceName": "inferred" if destination_place else "unknown",
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
