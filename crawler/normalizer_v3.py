#!/usr/bin/env python3\
# -*- coding: utf-8 -*-\
\"\"\"\
旅行团数据归一化器 v3.0（AI Agent推荐专用版）\
新增维度:\
  L3 用户适配: difficulty, fitness_level, target_audience, min_age, max_group_size, shopping_free, freedom_level\
  L4 内容体验: highlights, accommodation, meal_standard, scenery_type, activity_type, best_season\
  L5 时间维度: is_weekend_ok, is_holiday_ok, duration_hours, departure_freq\
  L6 商业维度: daily_price, value_score, popularity_score, price_tier, booking_urgency\
  L7 情感语义: mood_tags, social_buzz, pain_points\
\
输入: travel_agg_v4.json\
输出: travel_frontend.json（AI增强Schema）\
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
    \"假日通\": {\"label\": \"假日通\", \"color\": \"#10b981\", \"weight\": 15},\
    \"广州去旅行\": {\"label\": \"广州去旅行\", \"color\": \"#f59e0b\", \"weight\": 15},\
    \"康辉旅行\": {\"label\": \"康辉旅行\", \"color\": \"#3b82f6\", \"weight\": 18},\
    \"暴走村\": {\"label\": \"暴走村\", \"color\": \"#ef4444\", \"weight\": 12},\
    \"暴走村广州站\": {\"label\": \"暴走村\", \"color\": \"#ef4444\", \"weight\": 12},\
    \"暴走团\": {\"label\": \"暴走团\", \"color\": \"#ef4444\", \"weight\": 12},\
    \"广之旅\": {\"label\": \"广之旅\", \"color\": \"#8b5cf6\", \"weight\": 20},\
    \"广东中旅\": {\"label\": \"广东中旅\", \"color\": \"#06b6d4\", \"weight\": 20},\
    \"品途旅游\": {\"label\": \"品途旅游\", \"color\": \"#ec4899\", \"weight\": 10},\
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
CATEGORY_HEAT = {\
    \"outbound\": 25, \"domestic\": 20, \"provincial\": 18,\
    \"outdoor\": 15, \"free\": 10, \"other\": 5,\
}\
\
# ==================== L3 用户适配推断词库 ====================\
\
DIFFICULTY_RULES = [\
    (r\"休闲|散步|轻松|慢行\", 1),\
    (r\"5公里|6公里|7公里|8公里|平路|环湖|滨海\", 2),\
    (r\"10公里|11公里|12公里|15公里|登山|徒步\", 3),\
    (r\"18公里|20公里|21公里|穿越|溯溪|攀岩\", 4),\
    (r\"25公里|30公里|重装|极限|高海拔|雪山\", 5),\
]\
\
TARGET_AUDIENCE_KEYWORDS = {\
    \"亲子\": [\"亲子\", \"带娃\", \"儿童\", \"宝贝\", \"家庭\", \"1.2米\", \"1.5米\"],\
    \"老人\": [\"爸妈\", \"父母\", \"长辈\", \"夕阳红\", \"银发\", \"慢游\", \"养生\", \"疗养\"],\
    \"情侣\": [\"情侣\", \"蜜月\", \"浪漫\", \"双人\", \"闺蜜\", \"夫妻\"],\
    \"单人\": [\"单人\", \"一人\", \"独行\", \"单身\", \"独自\", \"散客\"],\
    \"团建\": [\"团建\", \"拓展\", \"公司\", \"企业\", \"团队\", \"年会\"],\
    \"摄影\": [\"摄影\", \"拍照\", \"打卡\", \"出片\", \"航拍\", \"旅拍\"],\
}\
\
AGE_RULES = [\
    (r\"亲子|儿童|1\\.2米|1\\.5米|宝贝\", 3),\
    (r\"学生|青少年\", 12),\
    (r\"老人|爸妈|夕阳红|银发\", 50),\
]\
\
GROUP_SIZE_RULES = [\
    (r\"精品小团|小团|VIP团\", 15),\
    (r\"26人|20人|18人\", 26),\
    (r\"30人|35人\", 35),\
    (r\"大巴|大团|常规团\", 50),\
]\
\
SHOPPING_KEYWORDS = [\"纯玩\", \"无购物\", \"0购物\", \"不进店\", \"无自费\"]\
\
FREEDOM_RULES = [\
    (r\"自由行|自助\", 5),\
    (r\"半自助|半自由\", 4),\
    (r\"纯玩\", 3),\
    (r\"跟团|常规团\", 1),\
]\
\
# ==================== L4 内容体验推断词库 ====================\
\
HIGHLIGHT_KEYWORDS = [\
    \"温泉\", \"漂流\", \"玻璃桥\", \"迪士尼\", \"故宫\", \"长隆\", \"蜡像馆\",\
    \"游艇\", \"冲浪\", \"滑雪\", \"花海\", \"樱花\", \"红叶\", \"极光\",\
    \"沙漠\", \"草原\", \"瀑布\", \"溶洞\", \"古镇\", \"寺庙\", \"摩天轮\",\
    \"潜水\", \"帆船\", \"直升机\", \"热气球\", \"篝火\", \"露营\", \"星空\",\
    \"美食\", \"海鲜\", \"烧烤\", \"BBQ\", \"自助餐\", \"下午茶\",\
]\
\
ACCOMMODATION_RULES = [\
    (r\"希尔顿|洲际|万豪|喜来登|香格里拉|深坑|五星|5星|豪华酒店\", \"豪华\"),\
    (r\"四星|4星|精品酒店|度假村|温泉酒店\", \"舒适\"),\
    (r\"民宿|客栈|青旅|特色住宿\", \"民宿\"),\
    (r\"经济型|快捷|连锁|7天|如家\", \"经济\"),\
    (r\"酒店|宾馆\", \"舒适\"),\
]\
\
MEAL_RULES = [\
    (r\"全含|全餐|含三餐\", \"全含\"),\
    (r\"含早|含早餐\", \"含早\"),\
    (r\"自理|不含餐\", \"自理\"),\
    (r\"特色餐|当地美食|风味餐\", \"特色\"),\
    (r\"BBQ|烧烤|海鲜餐\", \"特色\"),\
]\
\
SCENERY_RULES = [\
    (r\"海|岛|滩|湾|岸|礁|珊瑚\", \"海岛\"),\
    (r\"山|峰|岳|岭|峡谷|瀑布|森林|溪|湖|江|河\", \"山水\"),\
    (r\"城|都|市|CBD|地标|塔\", \"城市\"),\
    (r\"古镇|古村|老街|胡同|民居\", \"古镇\"),\
    (r\"草原|牧场|蒙古包\", \"草原\"),\
    (r\"沙漠|戈壁|沙丘|绿洲\", \"沙漠\"),\
    (r\"雪|冰|冰川|雪山|滑雪\", \"冰雪\"),\
]\
\
ACTIVITY_RULES = [\
    (r\"徒步|登山|穿越|溯溪|攀岩|户外\", \"徒步\"),\
    (r\"摄影|拍照|打卡|旅拍|航拍\", \"摄影\"),\
    (r\"美食|吃|餐|饮|小吃|夜市\", \"美食\"),\
    (r\"购物|免税店|奥特莱斯|商圈\", \"购物\"),\
    (r\"漂流|温泉|潜水|冲浪|游艇|滑雪\", \"休闲\"),\
    (r\"观光|游览|参观|景点\", \"观光\"),\
]\
\
SEASON_RULES = [\
    (r\"樱花|桃花|油菜花|杜鹃|春游|踏青\", \"春\"),\
    (r\"避暑|漂流|海滩|海岛|夏令营|荷花\", \"夏\"),\
    (r\"红叶|银杏|秋景|丰收|菊花|赏月\", \"秋\"),\
    (r\"滑雪|温泉|冰雪|雪乡|冬眠|年会\", \"冬\"),\
    (r\"全年|四季|随时\", \"全年\"),\
]\
\
# ==================== L5 时间推断词库 ====================\
\
WEEKEND_KEYWORDS = [\"天天出发\", \"天天团\", \"周六\", \"周日\", \"周末\", \"逢周六\", \"逢周日\"]\
\
HOLIDAY_KEYWORDS = [\"五一\", \"国庆\", \"春节\", \"清明\", \"端午\", \"中秋\", \"元旦\", \"假期\", \"黄金周\", \"小长假\"]\
\
FREQ_RULES = [\
    (r\"天天出发|天天团|每日\", \"天天\"),\
    (r\"周六|周日|周末\", \"周末\"),\
    (r\"节假日|假期|五一|国庆|春节\", \"节假日\"),\
]\
\
# ==================== L7 情感语义推断词库 ====================\
\
MOOD_RULES = [\
    (r\"浪漫|蜜月|情侣|烛光|夕阳|海景房\", \"浪漫\"),\
    (r\"刺激|惊险|极限|挑战|冒险|漂流|跳伞\", \"刺激\"),\
    (r\"治愈|放松|慢生活|花海|森林|温泉|瑜伽\", \"治愈\"),\
    (r\"人文|历史|博物馆|古迹|非遗|文化|研学\", \"人文\"),\
    (r\"探险|秘境|荒野|无人区|穿越|徒步\", \"探险\"),\
    (r\"奢华|五星|贵宾|VIP|私人|定制|豪华\", \"奢华\"),\
    (r\"简约|轻|极简|短途|快闪|citywalk\", \"简约\"),\
    (r\"热闹|狂欢| festival| 嘉年华|音乐节\", \"热闹\"),\
]\
\
SOCIAL_RULES = [\
    (r\"网红|打卡|必去|地标|同款|小红书|抖音\", \"网红打卡\"),\
    (r\"小众|秘境|冷门|私藏|隐秘|未开发|原生态\", \"小众秘境\"),\
    (r\"经典|必游|传统|知名|世界遗产|5A\", \"经典必去\"),\
    (r\"深度|体验|沉浸|local|地道|人文|慢游\", \"深度体验\"),\
]\
\
PAIN_RULES = [\
    (r\"早起|凌晨|05:|06:00|赶\", \"早起\"),\
    (r\"车程|长途|赶路|舟车|奔波\", \"长途车程\"),\
    (r\"高原|海拔|高反|雪山|缺氧\", \"高海拔\"),\
    (r\"高强度|体力|累|虐|重装|暴走\", \"高强度\"),\
    (r\"冷|寒|冻|零下|极寒\", \"寒冷\"),\
    (r\"热|暑|暴晒|高温|沙漠\", \"炎热\"),\
]\
\
\
# ==================== 工具函数 ====================\
\
def match_rules(text, rules):\
    \"\"\"从文本中匹配规则列表，返回匹配到的值列表\"\"\"\
    results = []\
    for pattern, value in rules:\
        if re.search(pattern, text):\
            results.append(value)\
    return results\
\
def match_first(text, rules, default=None):\
    \"\"\"匹配第一个规则\"\"\"\
    for pattern, value in rules:\
        if re.search(pattern, text):\
            return value\
    return default\
\
def extract_kilometers(title):\
    \"\"\"提取公里数\"\"\"\
    m = re.search(r\"(\\d+)\\s*公里\", title)\
    if m:\
        return int(m.group(1))\
    return 0\
\
\
def infer_difficulty(title, category):\
    \"\"\"推断难度等级 1-5\"\"\"\
    # 从规则匹配\
    for pattern, level in DIFFICULTY_RULES:\
        if re.search(pattern, title):\
            return level\
    # 从公里数推断\
    km = extract_kilometers(title)\
    if km > 0:\
        if km <= 5: return 1\
        elif km <= 10: return 2\
        elif km <= 15: return 3\
        elif km <= 20: return 4\
        else: return 5\
    # 从分类推断\
    if category == \"outdoor\":\
        return 3\
    if category == \"outbound\" or category == \"domestic\":\
        return 2\
    return 1\
\
\
def infer_fitness_level(difficulty):\
    mapping = {1: \"休闲\", 2: \"轻松\", 3: \"moderate\", 4: \"高强度\", 5: \"极限\"}\
    return mapping.get(difficulty, \"moderate\")\
\
\
def infer_target_audience(title):\
    audiences = []\
    for audience, keywords in TARGET_AUDIENCE_KEYWORDS.items():\
        if any(kw in title for kw in keywords):\
            audiences.append(audience)\
    return audiences if audiences else [\"通用\"]\
\
\
def infer_min_age(title):\
    for pattern, age in AGE_RULES:\
        if re.search(pattern, title):\
            return age\
    return 0\
\
\
def infer_max_group_size(title):\
    for pattern, size in GROUP_SIZE_RULES:\
        if re.search(pattern, title):\
            return size\
    return 0\
\
\
def infer_shopping_free(title):\
    return any(kw in title for kw in SHOPPING_KEYWORDS)\
\
\
def infer_freedom_level(title, category):\
    if category == \"free\":\
        return 5\
    for pattern, level in FREEDOM_RULES:\
        if re.search(pattern, title):\
            return level\
    return 1\
\
\
def infer_highlights(title):\
    found = []\
    for kw in HIGHLIGHT_KEYWORDS:\
        if kw in title and kw not in found:\
            found.append(kw)\
    return found[:5]  # 最多5个\
\
\
def infer_accommodation(title):\
    return match_first(title, ACCOMMODATION_RULES, \"舒适\")\
\
\
def infer_meal(title):\
    return match_first(title, MEAL_RULES, \"未知\")\
\
\
def infer_scenery(title):\
    return match_rules(title, SCENERY_RULES) or [\"综合\"]\
\
\
def infer_activity(title):\
    return match_rules(title, ACTIVITY_RULES) or [\"观光\"]\
\
\
def infer_season(title):\
    seasons = match_rules(title, SEASON_RULES)\
    return seasons if seasons else [\"全年\"]\
\
\
def infer_weekend_ok(title):\
    return any(kw in title for kw in WEEKEND_KEYWORDS)\
\
\
def infer_holiday_ok(title):\
    return any(kw in title for kw in HOLIDAY_KEYWORDS)\
\
\
def infer_duration_hours(title, category, days):\
    if category == \"outdoor\":\
        return 8\
    if \"深度\" in title:\
        return 8\
    if \"休闲\" in title or \"度假\" in title:\
        return 4\
    if \"紧凑\" in title or \"全景\" in title:\
        return 10\
    return 6\
\
\
def infer_departure_freq(title):\
    return match_first(title, FREQ_RULES, \"不定期\")\
\
\
def infer_mood(title):\
    return match_rules(title, MOOD_RULES) or [\"休闲\"]\
\
\
def infer_social(title):\
    return match_rules(title, SOCIAL_RULES) or [\"常规\"]\
\
\
def infer_pain(title):\
    return match_rules(title, PAIN_RULES) or []\
\
\
def infer_booking_urgency(title):\
    if any(kw in title for kw in [\"已成团\", \"确认发团\"]):\
        return \"正常\"\
    if any(kw in title for kw in [\"即将成团\", \"余位\", \"紧张\", \"秒杀\", \"特价\"]):\
        return \"紧张\"\
    if any(kw in title for kw in [\"截止\", \"满员\", \"封团\", \"停止收客\"]):\
        return \"即将截止\"\
    return \"正常\"\
\
\
# ==================== L6 商业维度计算 ====================\
\
def calculate_daily_price(price, days):\
    if price > 0 and days > 0:\
        return round(price / days, 2)\
    return 0.0\
\
\
def calculate_value_score(daily_price, category, days, has_supplement):\
    \"\"\"性价比评分 0-100\"\"\"\
    if daily_price <= 0:\
        return 50\
    \
    # 基准分（根据分类和日均价格）\
    thresholds = {\
        \"provincial\": [200, 300, 500],\
        \"domestic\": [400, 600, 1000],\
        \"outbound\": [800, 1200, 2000],\
        \"outdoor\": [100, 200, 400],\
        \"free\": [300, 500, 800],\
        \"other\": [300, 500, 800],\
    }\
    \
    th = thresholds.get(category, [300, 500, 800])\
    if daily_price < th[0]:\
        base = 90\
    elif daily_price < th[1]:\
        base = 80\
    elif daily_price < th[2]:\
        base = 60\
    else:\
        base = 40\
    \
    # 天数调整\
    if days == 1:\
        base += 5\
    elif days == 2:\
        base += 3\
    elif days >= 7:\
        base -= 5\
    \
    # 单房差惩罚\
    if has_supplement:\
        base -= 5\
    \
    return max(0, min(100, base))\
\
\
def calculate_popularity_score(source, category, price, title):\
    \"\"\"热度评分 0-100\"\"\"\
    score = 0\
    # 来源权重\
    source_info = SOURCE_MAP.get(source, {\"weight\": 10})\
    score += source_info[\"weight\"]\
    \
    # 分类热度\
    score += CATEGORY_HEAT.get(category, 5)\
    \
    # 有明确价格\
    if price > 0:\
        score += 10\
    \
    # 标题关键词热度\
    hot_words = [\"纯玩\", \"网红\", \"打卡\", \"温泉\", \"迪士尼\", \"长隆\", \"五星\", \"高铁\"]\
    for w in hot_words:\
        if w in title:\
            score += 3\
    \
    # 节假日/周末关键词\
    if any(kw in title for kw in [\"五一\", \"国庆\", \"春节\"]):\
        score += 5\
    \
    return min(100, score)\
\
\
def calculate_price_tier(daily_price):\
    if daily_price <= 0:\
        return \"未知\"\
    if daily_price < 300:\
        return \"经济\"\
    if daily_price < 800:\
        return \"舒适\"\
    return \"豪华\"\
\
\
# ==================== 价格归一化（复用v2）====================\
\
def extract_all_prices(text):\
    prices = []\
    for m in re.finditer(r\"[¥￥]\\s*(\\d{1,3}(?:,\\d{3})*(?:\\.\\d+)?)\", text):\
        prices.append((float(m.group(1).replace(\",\", \"\")), m.group(0)))\
    for m in re.finditer(r\"[¥￥]\\s*(\\d+(?:\\.\\d+)?)\\s*起\", text):\
        prices.append((float(m.group(1)), m.group(0)))\
    for m in re.finditer(r\"(\\d+(?:,\\d+)*)\\s*元\", text):\
        prices.append((float(m.group(1).replace(\",\", \"\")), m.group(0)))\
    return prices\
\
\
def detect_single_supplement(title, raw_text=\"\"):\
    keywords = [\"单房差\", \"单人间\", \"单人房差\", \"单人入住\", \"单人补房差\",\
                \"补房差\", \"房差\", \"单住\", \"单人住\", \"单人房\", \"1人1房\", \"一人一房\", \"单人报名\", \"单男单女\"]\
    full_text = title + \" \" + raw_text\
    has = any(kw in full_text for kw in keywords)\
    if not has:\
        return False, 0, \"\"\
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
    return True, 0, \"含单房差（金额未标明）\"\
\
\
def detect_price_type(title, raw_text=\"\"):\
    full_text = title + \" \" + raw_text\
    types = {\
        \"per_person\": [\"每人\", \"人均\", \"1人\", \"一人\", \"单人价\", \"成人价\"],\
        \"double_occupancy\": [\"双人\", \"2人\", \"两人\", \"双人入住\", \"双人间\"],\
        \"child\": [\"儿童\", \"小孩\", \"小童\", \"1.2米以下\", \"1.5米以下\", \"学生价\"],\
        \"group\": [\"团费\", \"团价\", \"拼团\", \"散客拼团\"],\
    }\
    for ptype, keywords in types.items():\
        if any(kw in full_text for kw in keywords):\
            return ptype\
    if re.search(r\"\\d+天\", full_text) or re.search(r\"\\d+日游\", full_text):\
        return \"per_person\"\
    return \"unknown\"\
\
\
def normalize_price(raw_item):\
    title = raw_item.get(\"title\", \"\")\
    raw_price_text = str(raw_item.get(\"price_raw\", \"\"))\
    raw_price_num = raw_item.get(\"price\", 0)\
    all_prices = extract_all_prices(raw_price_text + \" \" + title)\
    main_price = 0\
    if all_prices:\
        main_price = all_prices[0][0]\
    if main_price == 0 and raw_price_num > 0:\
        main_price = float(raw_price_num)\
    has_supplement, supplement_amount, supplement_note = detect_single_supplement(title, raw_price_text)\
    price_type = detect_price_type(title, raw_price_text)\
    if main_price > 0:\
        if has_supplement:\
            if supplement_amount > 0:\
                price_display = f\"¥{int(main_price)}+房差¥{int(supplement_amount)}\"\
            else:\
                price_display = f\"¥{int(main_price)}（单房差另计）\"\
        else:\
            price_display = f\"¥{int(main_price)}\"\
        if \"起\" in raw_price_text or \"起\" in title:\
            price_display += \"起\"\
    else:\
        price_display = \"电询\"\
    price_notes = []\
    if has_supplement:\
        price_notes.append(supplement_note)\
    if price_type == \"double_occupancy\":\
        price_notes.append(\"价格为双人入住价，单人需补房差\")\
    elif price_type == \"child\":\
        price_notes.append(\"儿童价，成人价另询\")\
    elif price_type == \"group\":\
        price_notes.append(\"团费价\")\
    price_note = \"；\".join(price_notes) if price_notes else \"\"\
    market_price = 0\
    member_price = 0\
    if len(all_prices) >= 2:\
        market_price = all_prices[0][0]\
        member_price = all_prices[1][0]\
    return {\
        \"price\": main_price,\
        \"price_display\": price_display,\
        \"price_type\": price_type,\
        \"price_type_label\": {\"per_person\": \"每人价\", \"double_occupancy\": \"双人价\", \"child\": \"儿童价\", \"group\": \"团费价\", \"unknown\": \"价格类型未知\"}.get(price_type, \"未知\"),\
        \"has_single_supplement\": has_supplement,\
        \"single_supplement_amount\": supplement_amount,\
        \"single_supplement_note\": supplement_note,\
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
    for kw in [\"湛江\", \"北海\", \"涠洲\", \"丽江\", \"庐山\", \"平潭\", \"贺州\", \"甘南\",\
               \"新丰\", \"龙门\", \"从化\", \"增城\", \"惠州\", \"巽寮湾\", \"海陵岛\",\
               \"阳江\", \"韶关\", \"丹霞山\", \"云门山\", \"西冲\", \"深圳\", \"珠海\",\
               \"长隆\", \"罗浮山\", \"哈斯塔特\", \"牛牯嶂\", \"梅子坪\", \"大岭山\",\
               \"马尔代夫\", \"泰国\", \"越南\", \"日本\", \"韩国\", \"欧洲\", \"俄罗斯\",\
               \"土耳其\", \"西葡\", \"法瑞意\", \"北欧\", \"冰岛\", \"美国\"]:\
        if kw in title and kw not in found:\
            found.append(kw)\
    return \" \".join(found[:3]) if found else \"\"\
\
\
def generate_tags(title, category, destination, source, price_info, ai_features):\
    tags = []\
    if category in CATEGORY_LABELS:\
        tags.append(CATEGORY_LABELS[category])\
    if source in SOURCE_MAP:\
        tags.append(SOURCE_MAP[source][\"label\"])\
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
    if price_info[\"has_single_supplement\"] and \"单房差\" not in tags:\
        tags.append(\"单房差\")\
    if price_info[\"price_type\"] == \"child\" and \"儿童价\" not in tags:\
        tags.append(\"儿童价\")\
    # 添加AI推断标签\
    for h in ai_features.get(\"highlights\", [])[:2]:\
        if h not in tags:\
            tags.append(h)\
    for m in ai_features.get(\"mood_tags\", [])[:1]:\
        if m not in tags:\
            tags.append(m)\
    return tags\
\
\
# ==================== 主归一化函数 ====================\
\
def normalize_item(raw_item):\
    source_raw = raw_item.get(\"source\", \"其他\")\
    title = raw_item.get(\"title\", \"\").strip()\
    if not title or len(title) < 3:\
        return None\
    \
    source = source_raw\
    source_info = SOURCE_MAP.get(source, {\"label\": source, \"color\": \"#6b7280\", \"weight\": 10})\
    \
    # L1+L2 基础+价格\
    price_info = normalize_price(raw_item)\
    days = extract_days(title, raw_item.get(\"days\", 0))\
    category = normalize_category(raw_item.get(\"category\", \"\"), title)\
    destination = extract_destination(title, raw_item.get(\"destination\", \"\"))\
    \
    # ==================== L3 用户适配推断 ====================\
    difficulty = infer_difficulty(title, category)\
    fitness_level = infer_fitness_level(difficulty)\
    target_audience = infer_target_audience(title)\
    min_age = infer_min_age(title)\
    max_group_size = infer_max_group_size(title)\
    shopping_free = infer_shopping_free(title)\
    freedom_level = infer_freedom_level(title, category)\
    \
    # ==================== L4 内容体验推断 ====================\
    highlights = infer_highlights(title)\
    accommodation = infer_accommodation(title)\
    meal_standard = infer_meal(title)\
    scenery_type = infer_scenery(title)\
    activity_type = infer_activity(title)\
    best_season = infer_season(title)\
    \
    # ==================== L5 时间推断 ====================\
    is_weekend_ok = infer_weekend_ok(title)\
    is_holiday_ok = infer_holiday_ok(title)\
    duration_hours = infer_duration_hours(title, category, days)\
    departure_freq = infer_departure_freq(title)\
    \
    # ==================== L6 商业计算 ====================\
    daily_price = calculate_daily_price(price_info[\"price\"], days)\
    value_score = calculate_value_score(daily_price, category, days, price_info[\"has_single_supplement\"])\
    popularity_score = calculate_popularity_score(source, category, price_info[\"price\"], title)\
    price_tier = calculate_price_tier(daily_price)\
    booking_urgency = infer_booking_urgency(title)\
    \
    # ==================== L7 情感语义推断 ====================\
    mood_tags = infer_mood(title)\
    social_buzz = infer_social(title)\
    pain_points = infer_pain(title)\
    \
    # 标签\
    ai_features = {\
        \"highlights\": highlights,\
        \"mood_tags\": mood_tags,\
    }\
    tags = generate_tags(title, category, destination, source, price_info, ai_features)\
    \
    id_str = f\"{source}-{title}-{price_info['price']}\"\
    item_id = hashlib.md5(id_str.encode()).hexdigest()[:12]\
    \
    traffic = raw_item.get(\"traffic\", \"\")\
    date_range = raw_item.get(\"date_range\", \"\")\
    url = raw_item.get(\"url\", \"\")\
    \
    return {\
        # === L1 基础 ===\
        \"id\": item_id,\
        \"title\": title,\
        \"source\": source,\
        \"source_label\": source_info[\"label\"],\
        \"source_color\": source_info[\"color\"],\
        \"category\": category,\
        \"category_label\": CATEGORY_LABELS.get(category, \"其他\"),\
        \"price\": price_info[\"price\"],\
        \"price_display\": price_info[\"price_display\"],\
        \"days\": days,\
        \"destination\": destination,\
        \"date_range\": date_range,\
        \"traffic\": traffic,\
        \"url\": url,\
        \"tags\": tags,\
        \"created_at\": datetime.now().isoformat(),\
        \
        # === L2 价格 ===\
        \"price_type\": price_info[\"price_type\"],\
        \"price_type_label\": price_info[\"price_type_label\"],\
        \"has_single_supplement\": price_info[\"has_single_supplement\"],\
        \"single_supplement_amount\": price_info[\"single_supplement_amount\"],\
        \"single_supplement_note\": price_info[\"single_supplement_note\"],\
        \"price_note\": price_info[\"price_note\"],\
        \"market_price\": price_info[\"market_price\"],\
        \"member_price\": price_info[\"member_price\"],\
        \
        # === L3 用户适配 ===\
        \"difficulty\": difficulty,\
        \"fitness_level\": fitness_level,\
        \"target_audience\": target_audience,\
        \"min_age\": min_age,\
        \"max_group_size\": max_group_size,\
        \"shopping_free\": shopping_free,\
        \"freedom_level\": freedom_level,\
        \
        # === L4 内容体验 ===\
        \"highlights\": highlights,\
        \"accommodation\": accommodation,\
        \"meal_standard\": meal_standard,\
        \"scenery_type\": scenery_type,\
        \"activity_type\": activity_type,\
        \"best_season\": best_season,\
        \
        # === L5 时间 ===\
        \"is_weekend_ok\": is_weekend_ok,\
        \"is_holiday_ok\": is_holiday_ok,\
        \"duration_hours\": duration_hours,\
        \"departure_freq\": departure_freq,\
        \
        # === L6 商业 ===\
        \"daily_price\": daily_price,\
        \"value_score\": value_score,\
        \"popularity_score\": popularity_score,\
        \"price_tier\": price_tier,\
        \"booking_urgency\": booking_urgency,\
        \
        # === L7 情感语义 ===\
        \"mood_tags\": mood_tags,\
        \"social_buzz\": social_buzz,\
        \"pain_points\": pain_points,\
        \
        # === AI专用 ===\
        \"rec_reason\": \"\",  # 动态生成\
    }\
\
\
def main():\
    print(\"=\" * 60)\
    print(\"旅行团数据归一化 v3.0（AI Agent推荐专用版）\")\
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
    stats = {\
        \"sources\": {},\
        \"categories\": {},\
        \"price_tiers\": {},\
        \"difficulty\": {},\
        \"audiences\": {},\
        \"seasons\": {},\
    }\
    for it in normalized:\
        stats[\"sources\"][it[\"source\"]] = stats[\"sources\"].get(it[\"source\"], 0) + 1\
        stats[\"categories\"][it[\"category_label\"]] = stats[\"categories\"].get(it[\"category_label\"], 0) + 1\
        stats[\"price_tiers\"][it[\"price_tier\"]] = stats[\"price_tiers\"].get(it[\"price_tier\"], 0) + 1\
        stats[\"difficulty\"][it[\"difficulty\"]] = stats[\"difficulty\"].get(it[\"difficulty\"], 0) + 1\
        for a in it[\"target_audience\"]:\
            stats[\"audiences\"][a] = stats[\"audiences\"].get(a, 0) + 1\
        for s in it[\"best_season\"]:\
            stats[\"seasons\"][s] = stats[\"seasons\"].get(s, 0) + 1\
    \
    print(\"\\
[来源分布]\")\
    for s, c in sorted(stats[\"sources\"].items(), key=lambda x: -x[1]):\
        print(f\"  {s}: {c} 条\")\
    \
    print(\"\\
[分类分布]\")\
    for c, n in sorted(stats[\"categories\"].items(), key=lambda x: -x[1]):\
        print(f\"  {c}: {n} 条\")\
    \
    print(\"\\
[价格档位]\")\
    for t, n in sorted(stats[\"price_tiers\"].items(), key=lambda x: -x[1]):\
        print(f\"  {t}: {n} 条\")\
    \
    print(\"\\
[难度分布]\")\
    for d, n in sorted(stats[\"difficulty\"].items()):\
        print(f\"  等级{d}: {n} 条\")\
    \
    print(\"\\
[适合人群]\")\
    for a, n in sorted(stats[\"audiences\"].items(), key=lambda x: -x[1]):\
        print(f\"  {a}: {n} 条\")\
    \
    print(\"\\
[最佳季节]\")\
    for s, n in sorted(stats[\"seasons\"].items(), key=lambda x: -x[1]):\
        print(f\"  {s}: {n} 条\")\
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
        csv_it = {k: v for k, v in it.items()}\
        # 数组字段转字符串\
        for arr_field in [\"tags\", \"target_audience\", \"highlights\", \"scenery_type\", \"activity_type\", \"best_season\", \"mood_tags\", \"social_buzz\", \"pain_points\"]:\
            if arr_field in csv_it:\
                csv_it[arr_field] = \",\".join(str(x) for x in csv_it[arr_field])\
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
    # 生成前端数据（精简版）\
    frontend_data = []\
    for it in normalized:\
        frontend_data.append({k: v for k, v in it.items() if k != \"rec_reason\"})  # rec_reason动态生成\
    \
    with open(\"travel_frontend.json\", \"w\", encoding=\"utf-8\") as f:\
        json.dump(frontend_data, f, ensure_ascii=False, indent=2)\
    print(\"[保存] travel_frontend.json (前端专用)\")\
    \
    print(\"\\
\" + \"=\" * 60)\
    print(\"归一化完成! AI Agent可用维度: 7层, 30+字段\")\
    print(\"=\" * 60)\
\
\
if __name__ == \"__main__\":\
    main()\
'''