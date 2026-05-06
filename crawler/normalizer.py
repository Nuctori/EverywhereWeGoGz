#!/usr/bin/env python3\
# -*- coding: utf-8 -*-\
\"\"\"\
旅行团数据归一化器\
输入: travel_agg_v4.json (7站爬虫原始输出)\
输出: travel_normalized.json + travel_normalized.csv\
统一Schema:\
  id, title, source, source_label, category, category_code,\
  price, price_raw, days, destination, date_range,\
  traffic, description, url, tags, created_at\
\"\"\"\
\
import json\
import csv\
import re\
import hashlib\
from datetime import datetime\
\
# ==================== 归一化配置 ====================\
\
# 来源映射: 统一标识 -> 显示名称\
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
# 分类映射: 原始分类 -> 统一分类代码\
CATEGORY_MAP = {\
    # 省内游\
    \"省内游\": \"provincial\", \"省内\": \"provincial\", \"温泉\": \"provincial\",\
    \"周边游\": \"provincial\", \"粤东\": \"provincial\", \"粤西\": \"provincial\",\
    \"粤北\": \"provincial\", \"珠三角\": \"provincial\",\
    # 国内游\
    \"国内游\": \"domestic\", \"国内\": \"domestic\", \"全国纯玩\": \"domestic\",\
    \"全国纯玩(含高铁/机票)\": \"domestic\", \"全国徒步\": \"domestic\",\
    \"青年徒步团\": \"domestic\",\
    # 出境游\
    \"出境游\": \"outbound\", \"出境\": \"outbound\", \"港澳游\": \"outbound\",\
    \"邮轮\": \"outbound\", \"台湾游\": \"outbound\",\
    # 户外/徒步\
    \"徒步/户外\": \"outdoor\", \"一天团\": \"outdoor\", \"2-3日游\": \"outdoor\",\
    # 其他\
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
# 目的地关键词库（用于从标题中提取）\
DEST_KEYWORDS = [\
    \"湛江\", \"北海\", \"涠洲\", \"丽江\", \"庐山\", \"平潭\", \"贺州\", \"甘南\",\
    \"新丰\", \"龙门\", \"从化\", \"增城\", \"惠州\", \"巽寮湾\", \"海陵岛\",\
    \"阳江\", \"韶关\", \"丹霞山\", \"云门山\", \"西冲\", \"深圳\", \"珠海\",\
    \"长隆\", \"罗浮山\", \"哈斯塔特\", \"牛牯嶂\", \"梅子坪\", \"大岭山\",\
    \"马尔代夫\", \"泰国\", \"越南\", \"日本\", \"韩国\", \"欧洲\", \"俄罗斯\",\
    \"土耳其\", \"西葡\", \"法瑞意\", \"北欧\", \"冰岛\", \"美国\",\
]\
\
\
def normalize_price(price_raw, title=\"\"):\
    \"\"\"统一价格格式\"\"\"\
    if not price_raw and not title:\
        return 0, \"电询\"\
    text = str(price_raw) + \" \" + title\
    # 匹配 ¥/￥ + 数字（支持千分位）\
    m = re.search(r\"[¥￥]\\s*(\\d{1,3}(?:,\\d{3})*(?:\\.\\d+)?)\", text)\
    if m:\
        price = float(m.group(1).replace(\",\", \"\"))\
        return price, f\"¥{int(price)}\"\
    # 匹配 \"起\" 价格\
    m2 = re.search(r\"[¥￥]\\s*(\\d+(?:\\.\\d+)?)\\s*起\", text)\
    if m2:\
        price = float(m2.group(1))\
        return price, f\"¥{int(price)}起\"\
    return 0, \"电询\"\
\
\
def normalize_days(title, raw_days=0):\
    \"\"\"统一天数格式\"\"\"\
    if raw_days and raw_days > 0:\
        return raw_days\
    # 从标题提取\
    patterns = [\
        r\"(\\d+)\\s*天\", r\"(\\d+)\\s*日\", r\"(\\d+)\\s*晚\",\
        r\"(\\d+)天\\d+晚\", r\"(\\d+)\\s*日游\",\
    ]\
    for p in patterns:\
        m = re.search(p, title)\
        if m:\
            return int(m.group(1))\
    return 0\
\
\
def normalize_category(raw_category, title=\"\"):\
    \"\"\"统一分类\"\"\"\
    if raw_category in CATEGORY_MAP:\
        return CATEGORY_MAP[raw_category]\
    # 从标题推断\
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
    \"\"\"提取目的地\"\"\"\
    if raw_dest:\
        return raw_dest.replace(\"·\", \" \").strip()\
    # 从标题匹配\
    found = []\
    for kw in DEST_KEYWORDS:\
        if kw in title:\
            found.append(kw)\
    return \" \".join(found[:3]) if found else \"\"\
\
\
def generate_tags(title, category, destination, source):\
    \"\"\"生成标签数组\"\"\"\
    tags = []\
    # 分类标签\
    if category in CATEGORY_LABELS:\
        tags.append(CATEGORY_LABELS[category])\
    # 来源标签\
    if source in SOURCE_MAP:\
        tags.append(SOURCE_MAP[source][\"label\"])\
    # 特色标签（从标题提取）\
    feature_keywords = {\
        \"纯玩\": \"纯玩\", \"温泉\": \"温泉\", \"高铁\": \"高铁\", \"动车\": \"高铁\",\
        \"飞机\": \"机票\", \"双飞\": \"机票\", \"双动\": \"高铁\", \"自由行\": \"自由行\",\
        \"亲子\": \"亲子\", \"研学\": \"研学\", \"徒步\": \"徒步\", \"登山\": \"登山\",\
        \"漂流\": \"漂流\", \"海岛\": \"海岛\", \"沙滩\": \"海岛\", \"长隆\": \"长隆\",\
        \"迪士尼\": \"迪士尼\", \"故宫\": \"故宫\", \"西湖\": \"西湖\",\
    }\
    for kw, tag in feature_keywords.items():\
        if kw in title and tag not in tags:\
            tags.append(tag)\
    return tags\
\
\
def normalize_item(raw_item):\
    \"\"\"单条数据归一化\"\"\"\
    source_raw = raw_item.get(\"source\", \"其他\")\
    title = raw_item.get(\"title\", \"\").strip()\
    \
    if not title or len(title) < 3:\
        return None\
    \
    # 来源\
    source = source_raw\
    source_info = SOURCE_MAP.get(source, {\"label\": source, \"color\": \"#6b7280\"})\
    \
    # 价格\
    price, price_display = normalize_price(raw_item.get(\"price_raw\", \"\"), title)\
    if price == 0 and raw_item.get(\"price\", 0) > 0:\
        price = float(raw_item.get(\"price\", 0))\
        price_display = f\"¥{int(price)}\"\
    \
    # 天数\
    days = normalize_days(title, raw_item.get(\"days\", 0))\
    \
    # 分类\
    category = normalize_category(raw_item.get(\"category\", \"\"), title)\
    \
    # 目的地\
    destination = extract_destination(title, raw_item.get(\"destination\", \"\"))\
    \
    # 标签\
    tags = generate_tags(title, category, destination, source)\
    \
    # 生成唯一ID\
    id_str = f\"{source}-{title}-{price}\"\
    item_id = hashlib.md5(id_str.encode()).hexdigest()[:12]\
    \
    # 交通方式（品途特有）\
    traffic = raw_item.get(\"traffic\", \"\")\
    \
    # 日期范围\
    date_range = raw_item.get(\"date_range\", \"\")\
    \
    # URL\
    url = raw_item.get(\"url\", \"\")\
    \
    # 描述（从标题生成简短描述）\
    description = title\
    \
    return {\
        \"id\": item_id,\
        \"title\": title,\
        \"source\": source,\
        \"source_label\": source_info[\"label\"],\
        \"source_color\": source_info[\"color\"],\
        \"category\": category,\
        \"category_label\": CATEGORY_LABELS.get(category, \"其他\"),\
        \"price\": price,\
        \"price_display\": price_display,\
        \"days\": days,\
        \"destination\": destination,\
        \"date_range\": date_range,\
        \"traffic\": traffic,\
        \"description\": description,\
        \"url\": url,\
        \"tags\": tags,\
        \"created_at\": datetime.now().isoformat(),\
        \"raw\": raw_item,  # 保留原始数据用于调试\
    }\
\
\
def main():\
    print(\"=\" * 60)\
    print(\"旅行团数据归一化\")\
    print(\"=\" * 60)\
    \
    # 读取原始数据\
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
    # 归一化\
    normalized = []\
    skipped = 0\
    for item in raw_items:\
        clean = normalize_item(item)\
        if clean:\
            normalized.append(clean)\
        else:\
            skipped += 1\
    \
    print(f\"成功归一化: {len(normalized)} 条\")\
    print(f\"跳过无效: {skipped} 条\")\
    \
    # 统计\
    sources = {}\
    categories = {}\
    for it in normalized:\
        sources[it[\"source\"]] = sources.get(it[\"source\"], 0) + 1\
        categories[it[\"category_label\"]] = categories.get(it[\"category_label\"], 0) + 1\
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
    # 保存JSON\
    with open(\"travel_normalized.json\", \"w\", encoding=\"utf-8\") as f:\
        json.dump({\"data\": normalized, \"total\": len(normalized)}, f, ensure_ascii=False, indent=2)\
    print(\"\\
[保存] travel_normalized.json\")\
    \
    # 保存CSV（不含raw字段）\
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
    # 生成前端数据文件（精简版，不含raw）\
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