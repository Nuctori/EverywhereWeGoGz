#!/usr/bin/env python3\
# -*- coding: utf-8 -*-\
\"\"\"\
旅行团数据归一化器 v2.0（价格精度增强版）\
增强点:\
  1. 单房差识别与标注\
  2. 价格类型区分(每人价/双人价/单房差价/儿童价)\
  3. 多价格提取(市场价/会员价/儿童价)\
  4. 价格备注生成\
\
输入: travel_agg_v4.json\
输出: travel_frontend.json（增强Schema）\
\"\"\"\
\
import json\
import csv\
import re\
import hashlib\
from datetime import datetime\
\
# ==================== 配置 ====================\
\
SOURCE_MAP = {\
    \"假日通\": {\"label\": \"假日通\", \"color\": \"#10b981\"},\
    \"广州去旅行\": {\"label\": \"广州去旅行\", \"color\": \"#f59e0b\"},\
    \"康辉旅行\": {\"label\": \"康辉旅行\", \"color\": \"#3b82f6\"},\
    \"暴走村\": {\"label\": \"暴走村\", \"color\": \"#ef4444\"},\
    \"暴走村广州站\": {\"label\": \"暴走村\", \"color\": \"#ef4444\"},\
    \"暴走团\": {\"label\": \"暴走团\", \"color\": \"#ef4444\"},\
    \"广之旅\": {\"label\": \"广之旅\", \"color\": \"#8b5cf6\"},\
    \"广东中旅\": {\"label\": \"广东中旅\", \"color\": \"#06b6d4\"},\
    \"品途旅游\": {\"label\": \"品途旅游\", \"color\": \"#ec4899\"},\
}\
\
CATEGORY_MAP = {\
    \"省内游\": \"provincial\", \"省内\": \"provincial\", \"温泉\": \"provincial\",\
    \"周边游\": \"provincial\", \"粤东\": \"provincial\", \"粤西\": \"provincial\",\
    \"粤北\": \"provincial\", \"珠三角\": \"provincial\",\
    \"国内游\": \"domestic\", \"国内\": \"domestic\", \"全国纯玩\": \"domestic\",\
    \"全国纯玩(含高铁/机票)\": \"domestic\", \"全国徒步\": \"domestic\",\
    \"青年徒步团\": \"domestic\",\
    \"出境游\": \"outbound\", \"出境\": \"outbound\", \"港澳游\": \"outbound\",\
    \"邮轮\": \"outbound\", \"台湾游\": \"outbound\",\
    \"徒步/户外\": \"outdoor\", \"一天团\": \"outdoor\", \"2-3日游\": \"outdoor\",\
    \"自由行\": \"free\", \"其他\": \"other\", \"首页推荐\": \"other\",\
    \"分类页\": \"other\",\
}\
\
CATEGORY_LABELS = {\
    \"provincial\": \"省内周边\",\
    \"domestic\": \"国内长线\",\
    \"outbound\": \"出境港澳\",\
    \"outdoor\": \"户外徒步\",\
    \"free\": \"自由行\",\
    \"other\": \"其他\",\
}\
\
DEST_KEYWORDS = [\
    \"湛江\", \"北海\", \"涠洲\", \"丽江\", \"庐山\", \"平潭\", \"贺州\", \"甘南\",\
    \"新丰\", \"龙门\", \"从化\", \"增城\", \"惠州\", \"巽寮湾\", \"海陵岛\",\
    \"阳江\", \"韶关\", \"丹霞山\", \"云门山\", \"西冲\", \"深圳\", \"珠海\",\
    \"长隆\", \"罗浮山\", \"哈斯塔特\", \"牛牯嶂\", \"梅子坪\", \"大岭山\",\
    \"马尔代夫\", \"泰国\", \"越南\", \"日本\", \"韩国\", \"欧洲\", \"俄罗斯\",\
    \"土耳其\", \"西葡\", \"法瑞意\", \"北欧\", \"冰岛\", \"美国\",\
]\
\
# 单房差关键词\
SINGLE_SUPPLEMENT_KEYWORDS = [\
    \"单房差\", \"单人间\", \"单人房差\", \"单人入住\", \"单人补房差\",\
    \"补房差\", \"房差\", \"单住\", \"单人住\", \"单人房\",\
    \"1人1房\", \"一人一房\", \"单人报名\", \"单男单女\",\
]\
\
# 价格类型关键词\
PRICE_TYPE_KEYWORDS = {\
    \"per_person\": [\"每人\", \"人均\", \"1人\", \"一人\", \"单人价\", \"成人价\"],\
    \"double_occupancy\": [\"双人\", \"2人\", \"两人\", \"双人入住\", \"双人间\"],\
    \"child\": [\"儿童\", \"小孩\", \"小童\", \"1.2米以下\", \"1.5米以下\", \"学生价\"],\
    \"group\": [\"团费\", \"团价\", \"拼团\", \"散客拼团\"],\
}\
\
\
def extract_all_prices(text):\
    \"\"\"从文本中提取所有价格，返回 [(金额, 原始文本), ...]\"\"\"\
    prices = []\
    # ¥/￥ + 数字（支持千分位）\
    for m in re.finditer(r\"[¥￥]\\s*(\\d{1,3}(?:,\\d{3})*(?:\\.\\d+)?)\", text):\
        prices.append((float(m.group(1).replace(\",\", \"\")), m.group(0)))\
    # \"起\"价格\
    for m in re.finditer(r\"[¥￥]\\s*(\\d+(?:\\.\\d+)?)\\s*起\", text):\
        prices.append((float(m.group(1)), m.group(0)))\
    # \"元\"\
    for m in re.finditer(r\"(\\d+(?:,\\d+)*)\\s*元\", text):\
        prices.append((float(m.group(1).replace(\",\", \"\")), m.group(0)))\
    return prices\
\
\
def detect_single_supplement(title, raw_text=\"\"):\
    \"\"\"\
    检测是否存在单房差信息\
    返回: (has_supplement: bool, supplement_amount: float, note: str)\
    \"\"\"\
    full_text = title + \" \" + raw_text\
    has = any(kw in full_text for kw in SINGLE_SUPPLEMENT_KEYWORDS)\
    \
    if not has:\
        return False, 0, \"\"\
    \
    # 尝试提取单房差金额\
    # 常见格式: \"单房差¥200\" \"补房差200元/人\" \"单人入住需补房差300\"\
    patterns = [\
        r\"单房差\\s*[¥￥]?\\s*(\\d+)\",\
        r\"补房差\\s*[¥￥]?\\s*(\\d+)\",\
        r\"房差\\s*[¥￥]?\\s*(\\d+)\",\
        r\"单人.*补\\s*[¥￥]?\\s*(\\d+)\",\
        r\"单住.*[¥￥]?\\s*(\\d+)\",\
    ]\
    for p in patterns:\
        m = re.search(p, full_text)\
        if m:\
            amount = float(m.group(1))\
            return True, amount, f\"单房差¥{int(amount)}\"\
    \
    return True, 0, \"含单房差（金额未标明）\"\
\
\
def detect_price_type(title, raw_text=\"\"):\
    \"\"\"检测价格类型\"\"\"\
    full_text = title + \" \" + raw_text\
    \
    # 检查各类型关键词\
    for ptype, keywords in PRICE_TYPE_KEYWORDS.items():\
        if any(kw in full_text for kw in keywords):\
            return ptype\
    \
    # 默认推断\
    # 如果标题含\"2天\"、\"3天\"等跟团特征，默认为每人价\
    if re.search(r\"\\d+天\", full_text) or re.search(r\"\\d+日游\", full_text):\
        return \"per_person\"\
    \
    return \"unknown\"\
\
\
def normalize_price(raw_item):\
    \"\"\"增强版价格归一化\"\"\"\
    title = raw_item.get(\"title\", \"\")\
    raw_price_text = str(raw_item.get(\"price_raw\", \"\"))\
    raw_price_num = raw_item.get(\"price\", 0)\
    \
    # 提取所有价格\
    all_prices = extract_all_prices(raw_price_text + \" \" + title)\
    \
    # 主价格（第一个或最大的）\
    main_price = 0\
    if all_prices:\
        main_price = all_prices[0][0]  # 取第一个出现的价格\
    if main_price == 0 and raw_price_num > 0:\
        main_price = float(raw_price_num)\
    \
    # 检测单房差\
    has_supplement, supplement_amount, supplement_note = detect_single_supplement(title, raw_price_text)\
    \
    # 检测价格类型\
    price_type = detect_price_type(title, raw_price_text)\
    \
    # 生成价格显示文本\
    if main_price > 0:\
        if has_supplement:\
            if supplement_amount > 0:\
                price_display = f\"¥{int(main_price)}+房差¥{int(supplement_amount)}\"\
            else:\
                price_display = f\"¥{int(main_price)}（单房差另计）\"\
        else:\
            price_display = f\"¥{int(main_price)}\"\
        \
        # 如果有\"起\"字\
        if \"起\" in raw_price_text or \"起\" in title:\
            price_display += \"起\"\
    else:\
        price_display = \"电询\"\
    \
    # 价格备注\
    price_notes = []\
    if has_supplement:\
        price_notes.append(supplement_note)\
    if price_type == \"double_occupancy\":\
        price_notes.append(\"价格为双人入住价，单人需补房差\")\
    elif price_type == \"child\":\
        price_notes.append(\"儿童价，成人价另询\")\
    elif price_type == \"group\":\
        price_notes.append(\"团费价\")\
    \
    price_note = \"；\".join(price_notes) if price_notes else \"\"\
    \
    # 会员价/市场价双价格（广州去旅行常见）\
    market_price = 0\
    member_price = 0\
    if len(all_prices) >= 2:\
        # 通常第一个是市场价，第二个是会员价\
        market_price = all_prices[0][0]\
        member_price = all_prices[1][0]\
    \
    return {\
        \"price\": main_price,\
        \"price_display\": price_display,\
        \"price_raw_text\": raw_price_text,\
        \"has_single_supplement\": has_supplement,\
        \"single_supplement_amount\": supplement_amount,\
        \"single_supplement_note\": supplement_note,\
        \"price_type\": price_type,\
        \"price_type_label\": {\
            \"per_person\": \"每人价\",\
            \"double_occupancy\": \"双人价\",\
            \"child\": \"儿童价\",\
            \"group\": \"团费价\",\
            \"unknown\": \"价格类型未知\",\
        }.get(price_type, \"未知\"),\
        \"price_note\": price_note,\
        \"market_price\": market_price,\
        \"member_price\": member_price,\
    }\
\
\
def extract_days(title, raw_days=0):\
    m = re.search(r\"(\\d+)[天/日]\", title)\
    if m:\
        return int(m.group(1))\
    m2 = re.search(r\"(\\d+)\\s*天\", title)\
    if m2:\
        return int(m2.group(1))\
    return raw_days if raw_days > 0 else 0\
\
\
def normalize_category(raw_category, title=\"\"):\
    if raw_category in CATEGORY_MAP:\
        return CATEGORY_MAP[raw_category]\
    t = title.lower()\
    if any(k in t for k in (\"越南\", \"泰国\", \"新马\", \"巴厘岛\", \"欧洲\", \"日本\", \"韩国\", \"马尔代夫\", \"美国\", \"俄罗斯\", \"土耳其\", \"出境\", \"港澳\")):\
        return \"outbound\"\
    if any(k in t for k in (\"甘南\", \"丽江\", \"庐山\", \"平潭\", \"涠洲\", \"北海\", \"湛江\", \"贺州\", \"新疆\", \"北京\", \"四川\", \"贵州\", \"东北\", \"华东\", \"西北\")):\
        return \"domestic\"\
    if any(k in t for k in (\"新丰\", \"龙门\", \"从化\", \"增城\", \"惠州\", \"粤西\", \"粤东\", \"韶关\", \"阳江\", \"珠海\", \"深圳\", \"省内\", \"温泉\")):\
        return \"provincial\"\
    if any(k in t for k in (\"徒步\", \"登山\", \"穿越\", \"古道\", \"公里\", \"户外\")):\
        return \"outdoor\"\
    return \"other\"\
\
\
def extract_destination(title, raw_dest=\"\"):\
    if raw_dest:\
        return raw_dest.replace(\"·\", \" \").strip()\
    found = []\
    for kw in DEST_KEYWORDS:\
        if kw in title:\
            found.append(kw)\
    return \" \".join(found[:3]) if found else \"\"\
\
\
def generate_tags(title, category, destination, source, price_info):\
    tags = []\
    if category in CATEGORY_LABELS:\
        tags.append(CATEGORY_LABELS[category])\
    if source in SOURCE_MAP:\
        tags.append(SOURCE_MAP[source][\"label\"])\
    \
    feature_keywords = {\
        \"纯玩\": \"纯玩\", \"温泉\": \"温泉\", \"高铁\": \"高铁\", \"动车\": \"高铁\",\
        \"飞机\": \"机票\", \"双飞\": \"机票\", \"双动\": \"高铁\", \"自由行\": \"自由行\",\
        \"亲子\": \"亲子\", \"研学\": \"研学\", \"徒步\": \"徒步\", \"登山\": \"登山\",\
        \"漂流\": \"漂流\", \"海岛\": \"海岛\", \"沙滩\": \"海岛\", \"长隆\": \"长隆\",\
        \"迪士尼\": \"迪士尼\", \"故宫\": \"故宫\", \"西湖\": \"西湖\",\
        \"单房差\": \"单房差\", \"房差\": \"单房差\", \"儿童\": \"儿童价\",\
    }\
    for kw, tag in feature_keywords.items():\
        if kw in title and tag not in tags:\
            tags.append(tag)\
    \
    # 根据价格信息添加标签\
    if price_info[\"has_single_supplement\"]:\
        if \"单房差\" not in tags:\
            tags.append(\"单房差\")\
    if price_info[\"price_type\"] == \"child\":\
        if \"儿童价\" not in tags:\
            tags.append(\"儿童价\")\
    \
    return tags\
\
\
def normalize_item(raw_item):\
    source_raw = raw_item.get(\"source\", \"其他\")\
    title = raw_item.get(\"title\", \"\").strip()\
    \
    if not title or len(title) < 3:\
        return None\
    \
    source = source_raw\
    source_info = SOURCE_MAP.get(source, {\"label\": source, \"color\": \"#6b7280\"})\
    \
    # 增强价格处理\
    price_info = normalize_price(raw_item)\
    \
    days = extract_days(title, raw_item.get(\"days\", 0))\
    category = normalize_category(raw_item.get(\"category\", \"\"), title)\
    destination = extract_destination(title, raw_item.get(\"destination\", \"\"))\
    tags = generate_tags(title, category, destination, source, price_info)\
    \
    id_str = f\"{source}-{title}-{price_info['price']}\"\
    item_id = hashlib.md5(id_str.encode()).hexdigest()[:12]\
    \
    traffic = raw_item.get(\"traffic\", \"\")\
    date_range = raw_item.get(\"date_range\", \"\")\
    url = raw_item.get(\"url\", \"\")\
    \
    return {\
        \"id\": item_id,\
        \"title\": title,\
        \"source\": source,\
        \"source_label\": source_info[\"label\"],\
        \"source_color\": source_info[\"color\"],\
        \"category\": category,\
        \"category_label\": CATEGORY_LABELS.get(category, \"其他\"),\
        \
        # 价格字段（增强版）\
        \"price\": price_info[\"price\"],\
        \"price_display\": price_info[\"price_display\"],\
        \"price_type\": price_info[\"price_type\"],\
        \"price_type_label\": price_info[\"price_type_label\"],\
        \"has_single_supplement\": price_info[\"has_single_supplement\"],\
        \"single_supplement_amount\": price_info[\"single_supplement_amount\"],\
        \"single_supplement_note\": price_info[\"single_supplement_note\"],\
        \"price_note\": price_info[\"price_note\"],\
        \"market_price\": price_info[\"market_price\"],\
        \"member_price\": price_info[\"member_price\"],\
        \
        \"days\": days,\
        \"destination\": destination,\
        \"date_range\": date_range,\
        \"traffic\": traffic,\
        \"url\": url,\
        \"tags\": tags,\
        \"created_at\": datetime.now().isoformat(),\
    }\
\
\
def main():\
    print(\"=\" * 60)\
    print(\"旅行团数据归一化 v2.0（价格精度增强版）\")\
    print(\"=\" * 60)\
    \
    try:\
        with open(\"travel_agg_v4.json\", \"r\", encoding=\"utf-8\") as f:\
            raw_data = json.load(f)\
        raw_items = raw_data.get(\"data\", raw_data)\
    except FileNotFoundError:\
        print(\"错误: 找不到 travel_agg_v4.json，请先运行爬虫\")\
        return\
    \
    print(f\"输入: {len(raw_items)} 条原始数据\")\
    \
    normalized = []\
    skipped = 0\
    supplement_count = 0\
    for item in raw_items:\
        clean = normalize_item(item)\
        if clean:\
            normalized.append(clean)\
            if clean[\"has_single_supplement\"]:\
                supplement_count += 1\
        else:\
            skipped += 1\
    \
    print(f\"成功归一化: {len(normalized)} 条\")\
    print(f\"跳过无效: {skipped} 条\")\
    print(f\"含单房差: {supplement_count} 条\")\
    \
    # 统计\
    sources = {}\
    categories = {}\
    price_types = {}\
    for it in normalized:\
        sources[it[\"source\"]] = sources.get(it[\"source\"], 0) + 1\
        categories[it[\"category_label\"]] = categories.get(it[\"category_label\"], 0) + 1\
        pt = it[\"price_type_label\"]\
        price_types[pt] = price_types.get(pt, 0) + 1\
    \
    print(\"\\
[来源分布]\")\
    for s, c in sorted(sources.items(), key=lambda x: -x[1]):\
        print(f\"  {s}: {c} 条\")\
    \
    print(\"\\
[分类分布]\")\
    for c, n in sorted(categories.items(), key=lambda x: -x[1]):\
        print(f\"  {c}: {n} 条\")\
    \
    print(\"\\
[价格类型分布]\")\
    for pt, n in sorted(price_types.items(), key=lambda x: -x[1]):\
        print(f\"  {pt}: {n} 条\")\
    \
    # 保存JSON\
    with open(\"travel_normalized.json\", \"w\", encoding=\"utf-8\") as f:\
        json.dump({\"data\": normalized, \"total\": len(normalized)}, f, ensure_ascii=False, indent=2)\
    print(\"\\
[保存] travel_normalized.json\")\
    \
    # 保存CSV\
    csv_items = []\
    for it in normalized:\
        csv_it = {k: v for k, v in it.items() if k != \"raw\"}\
        csv_it[\"tags\"] = \",\".join(csv_it.get(\"tags\", []))\
        csv_items.append(csv_it)\
    \
    if csv_items:\
        keys = csv_items[0].keys()\
        with open(\"travel_normalized.csv\", \"w\", newline=\"\", encoding=\"utf-8-sig\") as f:\
            writer = csv.DictWriter(f, fieldnames=keys)\
            writer.writeheader()\
            writer.writerows(csv_items)\
        print(\"[保存] travel_normalized.csv\")\
    \
    # 生成前端数据文件\
    frontend_data = []\
    for it in normalized:\
        frontend_data.append({\
            \"id\": it[\"id\"],\
            \"title\": it[\"title\"],\
            \"source\": it[\"source\"],\
            \"source_label\": it[\"source_label\"],\
            \"source_color\": it[\"source_color\"],\
            \"category\": it[\"category\"],\
            \"category_label\": it[\"category_label\"],\
            \"price\": it[\"price\"],\
            \"price_display\": it[\"price_display\"],\
            \"price_type\": it[\"price_type\"],\
            \"price_type_label\": it[\"price_type_label\"],\
            \"has_single_supplement\": it[\"has_single_supplement\"],\
            \"single_supplement_amount\": it[\"single_supplement_amount\"],\
            \"single_supplement_note\": it[\"single_supplement_note\"],\
            \"price_note\": it[\"price_note\"],\
            \"market_price\": it[\"market_price\"],\
            \"member_price\": it[\"member_price\"],\
            \"days\": it[\"days\"],\
            \"destination\": it[\"destination\"],\
            \"date_range\": it[\"date_range\"],\
            \"traffic\": it[\"traffic\"],\
            \"url\": it[\"url\"],\
            \"tags\": it[\"tags\"],\
        })\
    \
    with open(\"travel_frontend.json\", \"w\", encoding=\"utf-8\") as f:\
        json.dump(frontend_data, f, ensure_ascii=False, indent=2)\
    print(\"[保存] travel_frontend.json (前端专用)\")\
    \
    print(\"\\
\" + \"=\" * 60)\
    print(\"归一化完成!\")\
    print(\"=\" * 60)\
\
\
if __name__ == \"__main__\":\
    main()\
'''