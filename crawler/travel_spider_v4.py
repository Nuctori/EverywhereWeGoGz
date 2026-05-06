#!/usr/bin/env python3\
# -*- coding: utf-8 -*-\
\"\"\"\
旅行团聚合爬虫 v4.0 (7站聚合)\
目标站点:\
  1. 假日通        - http://www.jrt365.com        (传统旅行社CMS)\
  2. 广州去旅行    - http://gzqlx.360jlb.cn       (赛会通SaaS)\
  3. 康辉旅行      - http://m.cctpage.com         (可可旅行社管理系统)\
  4. 暴走村/暴走团 - http://gftblm.360jlb.cn      (赛会通SaaS)\
  5. 广之旅        - http://nn.gzl.cn             (易起行平台)\
  6. 广东中旅      - http://www.gdcts.com         (自研CMS)\
  7. 品途旅游      - http://gz.ptotour.com        (ASP.NET，省内周边游)\
\
运行依赖:\
  pip install requests beautifulsoup4 lxml\
\
作者: AI Assistant\
日期: 2026-05-06\
\"\"\"\
\
import requests\
import re\
import json\
import csv\
import time\
import sys\
from urllib.parse import urljoin, urlparse\
from bs4 import BeautifulSoup\
\
# ==================== 全局配置 ====================\
HEADERS = {\
    \"User-Agent\": (\
        \"Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) \"\
        \"AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 \"\
        \"Mobile/15E148 Safari/604.1\"\
    ),\
    \"Accept\": \"text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8\",\
    \"Accept-Language\": \"zh-CN,zh;q=0.9\",\
    \"Accept-Encoding\": \"gzip, deflate\",\
    \"Connection\": \"keep-alive\",\
}\
\
REQUEST_DELAY = 2.0\
TIMEOUT = 20\
\
\
# ==================== 工具函数 ====================\
def safe_request(url, headers=None, timeout=None, params=None):\
    h = headers or HEADERS\
    t = timeout or TIMEOUT\
    try:\
        resp = requests.get(url, headers=h, timeout=t, params=params)\
        resp.raise_for_status()\
        resp.encoding = resp.apparent_encoding or \"utf-8\"\
        return resp\
    except requests.RequestException as e:\
        print(f\"[请求失败] {url} -> {e}\")\
        return None\
\
\
def save_json(data, filename=\"travel_agg_v4.json\"):\
    with open(filename, \"w\", encoding=\"utf-8\") as f:\
        json.dump(data, f, ensure_ascii=False, indent=2)\
    print(f\"[保存] JSON -> {filename}\")\
\
\
def save_csv(data, filename=\"travel_agg_v4.csv\"):\
    if not data:\
        print(\"[警告] 无数据可保存为CSV\")\
        return\
    keys = data[0].keys()\
    with open(filename, \"w\", newline=\"\", encoding=\"utf-8-sig\") as f:\
        writer = csv.DictWriter(f, fieldnames=keys)\
        writer.writeheader()\
        writer.writerows(data)\
    print(f\"[保存] CSV -> {filename}\")\
\
\
def dedup_items(items):\
    seen = set()\
    out = []\
    for it in items:\
        key = it.get(\"source\", \"\") + \"|\" + it.get(\"title\", \"\") + \"|\" + str(it.get(\"price\", \"\"))\
        if key not in seen:\
            seen.add(key)\
            out.append(it)\
    return out\
\
\
def extract_price(text):\
    m = re.search(r\"[¥￥](\\d+(?:,\\d+)*(?:\\.\\d+)?)\", text)\
    if m:\
        return float(m.group(1).replace(\",\", \"\"))\
    m2 = re.search(r\"(\\d+(?:,\\d+)*(?:\\.\\d+)?)\\s*元\", text)\
    if m2:\
        return float(m2.group(1).replace(\",\", \"\"))\
    return 0\
\
\
def extract_days(title):\
    m = re.search(r\"(\\d+)[天/日]\", title)\
    if m:\
        return int(m.group(1))\
    m2 = re.search(r\"(\\d+)\\s*天\", title)\
    if m2:\
        return int(m2.group(1))\
    return 0\
\
\
# ==================== 1. 假日通爬虫 ====================\
class Jrt365Spider:\
    BASE_URL = \"http://www.jrt365.com\"\
\
    def __init__(self):\
        self.session = requests.Session()\
        self.session.headers.update(HEADERS)\
\
    def fetch_index(self):\
        url = self.BASE_URL + \"/\"\
        resp = safe_request(url)\
        if not resp:\
            return []\
        soup = BeautifulSoup(resp.text, \"lxml\")\
        items = []\
        for elem in soup.find_all(text=True):\
            text = elem.strip()\
            price_m = re.search(r\"¥(\\d+(?:\\.\\d+)?)\", text)\
            if not price_m:\
                continue\
            price = float(price_m.group(1))\
            parent = elem.parent\
            full_text = parent.get_text(\" \", strip=True) if parent else text\
            title = full_text.replace(price_m.group(0), \"\").strip(\" -\\\\/¥\")\
            if len(title) < 5 and parent and parent.parent:\
                title = parent.parent.get_text(\" \", strip=True).replace(price_m.group(0), \"\").strip(\" -\\\\/¥\")\
            if len(title) >= 5 and any(k in title for k in (\"天\", \"游\", \"温泉\", \"酒店\", \"度假\", \"纯玩\", \"日\")):\
                items.append({\
                    \"source\": \"假日通\",\
                    \"title\": title,\
                    \"price\": price,\
                    \"price_raw\": price_m.group(0),\
                    \"url\": self.BASE_URL,\
                    \"category\": self._guess_category(title),\
                    \"destination\": \"\",\
                    \"date_range\": \"\",\
                    \"days\": extract_days(title),\
                })\
        if len(items) < 3:\
            items = self._extract_from_raw(resp.text)\
        return dedup_items(items)\
\
    def _extract_from_raw(self, text):\
        items = []\
        chunks = re.split(r\"\\\\+\", text)\
        for i, chunk in enumerate(chunks):\
            chunk = chunk.strip()\
            price_m = re.search(r\"¥(\\d+(?:\\.\\d+)?)\", chunk)\
            if price_m and i > 0:\
                price = float(price_m.group(1))\
                title = chunks[i - 1].strip()\
                if len(title) >= 5 and any(k in title for k in (\"天\", \"游\", \"温泉\", \"酒店\", \"度假\")):\
                    items.append({\
                        \"source\": \"假日通\",\
                        \"title\": title,\
                        \"price\": price,\
                        \"price_raw\": chunk,\
                        \"url\": self.BASE_URL,\
                        \"category\": self._guess_category(title),\
                        \"destination\": \"\",\
                        \"date_range\": \"\",\
                        \"days\": extract_days(title),\
                    })\
        return items\
\
    def _guess_category(self, title):\
        t = title.lower()\
        if any(k in t for k in (\"越南\", \"泰国\", \"新马\", \"巴厘岛\", \"欧洲\", \"日本\", \"韩国\", \"出境\")):\
            return \"出境游\"\
        if any(k in t for k in (\"甘南\", \"丽江\", \"庐山\", \"平潭\", \"涠洲\", \"北海\", \"湛江\", \"贺州\", \"新疆\", \"北京\", \"四川\", \"贵州\")):\
            return \"国内游\"\
        if any(k in t for k in (\"新丰\", \"龙门\", \"美林湖\", \"地派\", \"粤西\", \"从化\", \"增城\", \"惠州\", \"省内\")):\
            return \"省内游\"\
        if \"温泉\" in t:\
            return \"温泉\"\
        return \"其他\"\
\
    def discover_lists(self):\
        url = self.BASE_URL + \"/\"\
        resp = safe_request(url)\
        if not resp:\
            return []\
        soup = BeautifulSoup(resp.text, \"lxml\")\
        links = []\
        keywords = [\"省内\", \"国内\", \"出境\", \"温泉\", \"自由行\", \"周边\", \"特价\", \"秒杀\", \"邮轮\"]\
        for a in soup.find_all(\"a\", href=True):\
            text = a.get_text(strip=True)\
            href = a[\"href\"].strip()\
            if any(k in text for k in keywords):\
                full = urljoin(self.BASE_URL, href)\
                if full.startswith(self.BASE_URL) and not href.startswith(\"javascript\"):\
                    links.append({\"text\": text, \"url\": full})\
        return links\
\
    def fetch_list(self, list_url):\
        resp = safe_request(list_url)\
        if not resp:\
            return []\
        soup = BeautifulSoup(resp.text, \"lxml\")\
        items = []\
        selectors = [\".product-item\", \".line-item\", \".tour-item\", \".goods-item\", \".list-item\", \".item\", \"ul li\", \".main li\"]\
        cards = []\
        for sel in selectors:\
            cards = soup.select(sel)\
            if len(cards) >= 2:\
                break\
        for card in cards:\
            title = \"\"\
            for tsel in [\"h3\", \"h2\", \"h4\", \".title\", \"a\", \".name\", \".tit\"]:\
                te = card.select_one(tsel)\
                if te:\
                    title = te.get_text(strip=True)\
                    break\
            price = None\
            for psel in [\".price\", \".money\", \".cost\", \"span\", \"strong\", \"b\"]:\
                pe = card.select_one(psel)\
                if pe:\
                    pm = re.search(r\"¥(\\d+(?:\\.\\d+)?)\", pe.get_text())\
                    if pm:\
                        price = float(pm.group(1))\
                        break\
            if title and price and len(title) > 3:\
                items.append({\
                    \"source\": \"假日通\",\
                    \"title\": title,\
                    \"price\": price,\
                    \"url\": urljoin(list_url, card.find(\"a\", href=True)[\"href\"]) if card.find(\"a\", href=True) else list_url,\
                    \"category\": self._guess_category(title),\
                    \"destination\": \"\",\
                    \"date_range\": \"\",\
                    \"days\": extract_days(title),\
                })\
        return items\
\
\
# ==================== 2. 广州去旅行爬虫 ====================\
class GzqlxSpider:\
    BASE_URL = \"http://gzqlx.360jlb.cn\"\
    CATEGORIES = [\
        {\"name\": \"一天团\", \"path\": \"/m/events\", \"params\": {}},\
        {\"name\": \"2-3日游\", \"path\": \"/m/events\", \"params\": {}},\
        {\"name\": \"全国纯玩(含高铁/机票)\", \"path\": \"/m/events\", \"params\": {}},\
        {\"name\": \"全国纯玩\", \"path\": \"/m/events\", \"params\": {}},\
        {\"name\": \"全国徒步\", \"path\": \"/m/events\", \"params\": {}},\
        {\"name\": \"青年徒步团\", \"path\": \"/m/events\", \"params\": {}},\
    ]\
\
    def fetch_events(self, category=None, path=\"/m/events\", params=None):\
        url = self.BASE_URL + path\
        resp = safe_request(url, params=params)\
        if not resp:\
            return []\
        text = resp.text\
        items = []\
        lines = [l.strip() for l in text.split(\"\\\\\") if l.strip()]\
        i = 0\
        while i < len(lines):\
            line = lines[i]\
            price_m = re.search(r\"¥(\\d+(?:\\.\\d+)?)\", line)\
            if price_m and i >= 2:\
                price = float(price_m.group(1))\
                destination = \"\"\
                date_range = \"\"\
                title = \"\"\
                for j in range(max(0, i - 6), i):\
                    cand = lines[j]\
                    if re.match(r\"^[\一-\龥]+·[\一-\龥]+$\", cand):\
                        destination = cand\
                    elif re.match(r\"^\\d{2}/\\d{2}-\\d{2}/\\d{2}$\", cand):\
                        date_range = cand\
                    elif len(cand) > 8 and any(k in cand for k in (\"天\", \"日\", \"团\", \"纯玩\", \"徒步\", \"高铁\", \"飞机\")):\
                        title = cand\
                if title:\
                    items.append({\
                        \"source\": \"广州去旅行\",\
                        \"title\": title,\
                        \"price\": price,\
                        \"price_raw\": line,\
                        \"url\": url,\
                        \"category\": category or \"全国纯玩\",\
                        \"destination\": destination,\
                        \"date_range\": date_range,\
                        \"days\": extract_days(title),\
                    })\
            i += 1\
        if len(items) < 2:\
            items = self._parse_dom(BeautifulSoup(text, \"lxml\"), url, category)\
        return items\
\
    def _parse_dom(self, soup, base_url, category):\
        items = []\
        for card in soup.find_all([\"div\", \"a\", \"li\"]):\
            text = card.get_text(\" \", strip=True)\
            if \"¥\" not in text:\
                continue\
            price_m = re.search(r\"¥(\\d+(?:\\.\\d+)?)\", text)\
            if not price_m:\
                continue\
            price = float(price_m.group(1))\
            title = \"\"\
            for part in text.split():\
                if len(part) > len(title) and any(k in part for k in (\"天\", \"日\", \"团\", \"纯玩\", \"徒步\")):\
                    title = part\
            dest_m = re.search(r\"([\一-\龥]+·[\一-\龥]+)\", text)\
            destination = dest_m.group(1) if dest_m else \"\"\
            date_m = re.search(r\"(\\d{2}/\\d{2}-\\d{2}/\\d{2})\", text)\
            date_range = date_m.group(1) if date_m else \"\"\
            if title and len(title) > 5:\
                items.append({\
                    \"source\": \"广州去旅行\",\
                    \"title\": title,\
                    \"price\": price,\
                    \"url\": base_url,\
                    \"category\": category or \"全国纯玩\",\
                    \"destination\": destination,\
                    \"date_range\": date_range,\
                    \"days\": extract_days(title),\
                })\
        return items\
\
    def fetch_all(self):\
        all_items = []\
        for cat in self.CATEGORIES:\
            print(f\"[广州去旅行] 抓取: {cat['name']} ...\")\
            items = self.fetch_events(category=cat[\"name\"], path=cat[\"path\"], params=cat.get(\"params\"))\
            print(f\"              -> {len(items)} 条\")\
            all_items.extend(items)\
            time.sleep(REQUEST_DELAY)\
        return all_items\
\
\
# ==================== 3. 康辉旅行爬虫 ====================\
class KanghuiSpider:\
    ENTRIES = [\
        \"http://m.cctpage.com\",\
        \"http://www.cct.cn\",\
        \"http://www.gzcct.com\",\
    ]\
\
    def __init__(self):\
        self.session = requests.Session()\
        self.session.headers.update(HEADERS)\
        self.working_base = None\
\
    def _find_working_entry(self):\
        for entry in self.ENTRIES:\
            resp = safe_request(entry)\
            if resp and len(resp.text) > 500:\
                self.working_base = entry\
                print(f\"[康辉] 可用入口: {entry}\")\
                return True\
        return False\
\
    def fetch(self):\
        if not self._find_working_entry():\
            print(\"[康辉] 警告: 所有入口均不可访问, 返回空数据\")\
            return []\
        items = []\
        base = self.working_base\
        paths = [\"/\", \"/line/\", \"/product/\", \"/search/\", \"/list/\", \"/mobile/\"]\
        for p in paths:\
            url = base + p\
            resp = safe_request(url)\
            if not resp:\
                continue\
            soup = BeautifulSoup(resp.text, \"lxml\")\
            selectors = [\".line_box\", \".pro_list\", \".travel-item\", \".product-list\", \".list-item\"]\
            for sel in selectors:\
                cards = soup.select(sel)\
                if cards:\
                    for card in cards:\
                        title_e = card.select_one(\".title, h3, h4, a\")\
                        price_e = card.select_one(\".price, .money, .cost\")\
                        if title_e and price_e:\
                            title = title_e.get_text(strip=True)\
                            price_m = re.search(r\"¥?(\\d+(?:\\.\\d+)?)\", price_e.get_text())\
                            price = float(price_m.group(1)) if price_m else 0\
                            if title and price > 0:\
                                items.append({\
                                    \"source\": \"康辉旅行\",\
                                    \"title\": title,\
                                    \"price\": price,\
                                    \"url\": urljoin(url, title_e[\"href\"]) if title_e.name == \"a\" and title_e.has_attr(\"href\") else url,\
                                    \"category\": \"其他\",\
                                    \"destination\": \"\",\
                                    \"date_range\": \"\",\
                                    \"days\": extract_days(title),\
                                })\
                    break\
            text_items = self._extract_from_text(resp.text, base)\
            items.extend(text_items)\
            time.sleep(REQUEST_DELAY)\
        return dedup_items(items)\
\
    def _extract_from_text(self, text, base_url):\
        items = []\
        pattern = r\"【([^】]+)】([^\\d]{3,50}?)(\\d+)天[^\\d]*?(\\d+)\"\
        for m in re.finditer(pattern, text):\
            tag, title, days, price = m.groups()\
            full_title = f\"【{tag}】{title.strip()} {days}天\"\
            items.append({\
                \"source\": \"康辉旅行\",\
                \"title\": full_title,\
                \"price\": float(price),\
                \"url\": base_url,\
                \"category\": \"国内游\",\
                \"destination\": \"\",\
                \"date_range\": \"\",\
                \"days\": int(days),\
            })\
        return items\
\
\
# ==================== 4. 暴走村/暴走团爬虫 ====================\
class BaozoucunSpider:\
    ENTRIES = [\
        {\"name\": \"暴走村广州站\", \"base\": \"http://gftblm.360jlb.cn\", \"path\": \"/m\"},\
        {\"name\": \"暴走团\", \"base\": \"http://wx.gzbzt.com\", \"path\": \"/events\"},\
    ]\
\
    def fetch(self):\
        all_items = []\
        for entry in self.ENTRIES:\
            print(f\"[暴走村] 尝试入口: {entry['name']} ...\")\
            url = entry[\"base\"] + entry[\"path\"]\
            resp = safe_request(url)\
            if not resp:\
                continue\
            items = self._parse_baozou(resp.text, url, entry[\"name\"])\
            print(f\"         -> {len(items)} 条\")\
            all_items.extend(items)\
            time.sleep(REQUEST_DELAY)\
            if len(items) >= 3:\
                break\
        return all_items\
\
    def _parse_baozou(self, text, url, source_name):\
        items = []\
        soup = BeautifulSoup(text, \"lxml\")\
        if \"360jlb\" in url:\
            lines = [l.strip() for l in text.split(\"\\\\\") if l.strip()]\
            for i, line in enumerate(lines):\
                price_m = re.search(r\"¥(\\d+(?:\\.\\d+)?)\", line)\
                if price_m:\
                    price = float(price_m.group(1))\
                    title = \"\"\
                    date_range = \"\"\
                    status = \"\"\
                    for j in range(max(0, i - 8), i):\
                        cand = lines[j]\
                        if re.match(r\"^\\d{2}/\\d{2}~\\d{2}/\\d{2}$\", cand):\
                            date_range = cand\
                        elif any(k in cand for k in (\"即将成团\", \"已成团\", \"报名\", \"活动结束\", \"进行中\")):\
                            status = cand\
                        elif len(cand) > 8 and \"【\" in cand and \"】\" in cand:\
                            title = cand\
                        elif len(cand) > 10 and any(k in cand for k in (\"公里\", \"徒步\", \"登山\", \"穿越\", \"古道\")):\
                            if not title:\
                                title = cand\
                    if title:\
                        items.append({\
                            \"source\": source_name,\
                            \"title\": title,\
                            \"price\": price,\
                            \"url\": url,\
                            \"category\": \"徒步/户外\",\
                            \"destination\": \"\",\
                            \"date_range\": date_range,\
                            \"days\": extract_days(title),\
                        })\
        else:\
            for card in soup.find_all([\"div\", \"a\", \"li\"]):\
                txt = card.get_text(\" \", strip=True)\
                if \"¥\" not in txt and \"元\" not in txt:\
                    continue\
                price_m = re.search(r\"[¥￥](\\d+)\", txt)\
                if not price_m:\
                    continue\
                price = float(price_m.group(1))\
                title = \"\"\
                for part in txt.split():\
                    if \"【\" in part and \"】\" in part and len(part) > len(title):\
                        title = part\
                if not title:\
                    cn_parts = re.findall(r\"[\一-\龥【】\\d]+\", txt)\
                    if cn_parts:\
                        title = max(cn_parts, key=len)\
                if title and len(title) > 5:\
                    items.append({\
                        \"source\": source_name,\
                        \"title\": title,\
                        \"price\": price,\
                        \"url\": url,\
                        \"category\": \"徒步/户外\",\
                        \"destination\": \"\",\
                        \"date_range\": \"\",\
                        \"days\": extract_days(title),\
                    })\
        return items\
\
\
# ==================== 5. 广之旅爬虫 ====================\
class GzlSpider:\
    BASE_URL = \"http://nn.gzl.cn\"\
    CATEGORY_PATHS = [\
        {\"name\": \"出境游\", \"path\": \"/abroad/abroad.html\"},\
        {\"name\": \"省内周边\", \"path\": \"/around/guangdong.html\"},\
        {\"name\": \"国内游\", \"path\": \"/domestic/domestic.html\"},\
        {\"name\": \"自由行\", \"path\": \"/free/free.html\"},\
    ]\
\
    def fetch_all(self):\
        all_items = []\
        for cat in self.CATEGORY_PATHS:\
            print(f\"[广之旅] 抓取: {cat['name']} ...\")\
            items = self.fetch_category(cat[\"path\"], cat[\"name\"])\
            print(f\"           -> {len(items)} 条\")\
            all_items.extend(items)\
            time.sleep(REQUEST_DELAY)\
        return all_items\
\
    def fetch_category(self, path, category_name):\
        url = self.BASE_URL + path\
        resp = safe_request(url)\
        if not resp:\
            return []\
        return self._parse_page(resp.text, url, category_name)\
\
    def _parse_page(self, html, base_url, category):\
        items = []\
        soup = BeautifulSoup(html, \"lxml\")\
        text = html\
        title_blocks = re.findall(r\"(【[^】]+】[^\\\\]{10,200}?)(?=\\\\|$)\", text)\
        for block in title_blocks:\
            title = block.strip()\
            price = 0\
            price_m = re.search(r\"￥\\s*(\\d+(?:,\\d+)*)\", text[text.find(block):text.find(block)+500])\
            if price_m:\
                price = float(price_m.group(1).replace(\",\", \"\"))\
            days = extract_days(title)\
            if title and price > 0 and len(title) > 10:\
                items.append({\
                    \"source\": \"广之旅\",\
                    \"title\": title,\
                    \"price\": price,\
                    \"url\": base_url,\
                    \"category\": category,\
                    \"destination\": \"\",\
                    \"date_range\": \"\",\
                    \"days\": days,\
                })\
        if len(items) < 3:\
            items = self._parse_dom(soup, base_url, category)\
        return items\
\
    def _parse_dom(self, soup, base_url, category):\
        items = []\
        for card in soup.find_all([\"div\", \"a\", \"li\"]):\
            txt = card.get_text(\" \", strip=True)\
            if \"【\" not in txt or \"￥\" not in txt:\
                continue\
            title = \"\"\
            for part in txt.split(\"\\\\\"):\
                part = part.strip()\
                if \"【\" in part and \"】\" in part and len(part) > len(title):\
                    title = part\
            price = 0\
            price_m = re.search(r\"￥\\s*(\\d+(?:,\\d+)*)\", txt)\
            if price_m:\
                price = float(price_m.group(1).replace(\",\", \"\"))\
            days = extract_days(title)\
            if title and price > 0:\
                items.append({\
                    \"source\": \"广之旅\",\
                    \"title\": title,\
                    \"price\": price,\
                    \"url\": base_url,\
                    \"category\": category,\
                    \"destination\": \"\",\
                    \"date_range\": \"\",\
                    \"days\": days,\
                })\
        return items\
\
\
# ==================== 6. 广东中旅爬虫 ====================\
class GdctsSpider:\
    PC_URL = \"http://www.gdcts.com\"\
    MOBILE_URL = \"http://m.gdcts.com\"\
\
    def fetch_all(self):\
        all_items = []\
        print(\"[广东中旅] 抓取PC端首页...\")\
        items = self.fetch_pc_index()\
        print(f\"           -> {len(items)} 条\")\
        all_items.extend(items)\
        time.sleep(REQUEST_DELAY)\
        print(\"[广东中旅] 抓取移动端分类页...\")\
        items = self.fetch_mobile_category()\
        print(f\"           -> {len(items)} 条\")\
        all_items.extend(items)\
        return all_items\
\
    def fetch_pc_index(self):\
        url = self.PC_URL + \"/\"\
        resp = safe_request(url)\
        if not resp:\
            return []\
        return self._parse_gdcts_html(resp.text, url, \"首页推荐\")\
\
    def fetch_mobile_category(self):\
        url = self.MOBILE_URL + \"/product/category/index\"\
        resp = safe_request(url)\
        if not resp:\
            return []\
        soup = BeautifulSoup(resp.text, \"lxml\")\
        items = []\
        text = resp.text\
        pattern = r\"【([^】]+)】([^|【]{5,100}?)(\\d+)[天/日]\"\
        for m in re.finditer(pattern, text):\
            tag, title_part, days = m.groups()\
            title = f\"【{tag}】{title_part.strip()} {days}天\"\
            nearby = text[m.start():m.start()+300]\
            price = extract_price(nearby)\
            items.append({\
                \"source\": \"广东中旅\",\
                \"title\": title,\
                \"price\": price,\
                \"url\": url,\
                \"category\": \"国内游\",\
                \"destination\": \"\",\
                \"date_range\": \"\",\
                \"days\": int(days),\
            })\
        if len(items) < 3:\
            items = self._parse_gdcts_html(text, url, \"分类页\")\
        return items\
\
    def _parse_gdcts_html(self, html, url, category):\
        items = []\
        soup = BeautifulSoup(html, \"lxml\")\
        for card in soup.find_all([\"div\", \"a\", \"li\"]):\
            txt = card.get_text(\" \", strip=True)\
            if \"【\" not in txt:\
                continue\
            title = \"\"\
            for part in txt.split(\"\\\\\"):\
                part = part.strip()\
                if \"【\" in part and \"】\" in part and len(part) > len(title):\
                    title = part\
            if not title:\
                bracket_parts = re.findall(r\"【[^】]+】[^\\\\]{5,100}\", txt)\
                if bracket_parts:\
                    title = max(bracket_parts, key=len)\
            price = extract_price(txt)\
            days = extract_days(title)\
            if title and len(title) > 8:\
                items.append({\
                    \"source\": \"广东中旅\",\
                    \"title\": title,\
                    \"price\": price,\
                    \"url\": url,\
                    \"category\": category,\
                    \"destination\": \"\",\
                    \"date_range\": \"\",\
                    \"days\": days,\
                })\
        return items\
\
\
# ==================== 7. 品途旅游爬虫 (NEW) ====================\
class PintuSpider:\
    \"\"\"\
    品途旅游 (gz.ptotour.com)\
    特征: ASP.NET，URL规律清晰，省内周边游为主\
    \"\"\"\
    BASE_URL = \"http://gz.ptotour.com\"\
\
    # 已确认的分类路径\
    CATEGORY_PATHS = [\
        {\"name\": \"省内周边\", \"path\": \"/line/list.aspx\", \"params\": {\"cid\": \"guangzhou\", \"tid\": \"around\", \"key\": \"\", \"page\": \"1\"}},\
        {\"name\": \"国内游\", \"path\": \"/line/list.aspx\", \"params\": {\"cid\": \"guangzhou\", \"tid\": \"domestic\", \"key\": \"\", \"page\": \"1\"}},\
        {\"name\": \"出境游\", \"path\": \"/line/list.aspx\", \"params\": {\"cid\": \"guangzhou\", \"tid\": \"abroad\", \"key\": \"\", \"page\": \"1\"}},\
    ]\
\
    def fetch_all(self):\
        all_items = []\
        for cat in self.CATEGORY_PATHS:\
            print(f\"[品途旅游] 抓取: {cat['name']} ...\")\
            items = self.fetch_category(cat)\
            print(f\"            -> {len(items)} 条\")\
            all_items.extend(items)\
            time.sleep(REQUEST_DELAY)\
        return all_items\
\
    def fetch_category(self, cat_config):\
        \"\"\"\
        抓取某个分类的列表页，支持分页\
        默认抓前3页\
        \"\"\"\
        all_items = []\
        base_params = cat_config[\"params\"].copy()\
        path = cat_config[\"path\"]\
        category_name = cat_config[\"name\"]\
\
        for page in range(1, 4):\
            base_params[\"page\"] = str(page)\
            url = self.BASE_URL + path\
            resp = safe_request(url, params=base_params)\
            if not resp:\
                break\
            items = self._parse_list_page(resp.text, url, category_name)\
            if not items:\
                break\
            all_items.extend(items)\
            print(f\"            第{page}页 -> {len(items)} 条\")\
            time.sleep(REQUEST_DELAY)\
\
        return all_items\
\
    def _parse_list_page(self, html, url, category):\
        \"\"\"\
        解析品途旅游列表页\
        探测到的结构:\
          ------<线路名>行程描述\
          游玩目的地: _目的地1_ _目的地2_\
          行程天数: _X天_ 交通方式: _汽车/汽车_\
        \"\"\"\
        items = []\
        soup = BeautifulSoup(html, \"lxml\")\
\
        # 策略A: 按分隔符\"------\"拆分线路块\
        blocks = re.split(r\"-+\\s*<\", html)\
        for block in blocks:\
            if not block.strip():\
                continue\
\
            # 提取线路名: <xxx> 或 开头的文本\
            title_match = re.match(r\"([^>]+)>([^\\
]{5,200})\", block)\
            if title_match:\
                tag = title_match.group(1).strip()\
                desc = title_match.group(2).strip()\
                title = f\"<{tag}>{desc}\"\
            else:\
                # 兜底: 取最长的一段中文作为标题\
                lines = [l.strip() for l in block.split(\"\\
\") if l.strip()]\
                title = \"\"\
                for line in lines:\
                    if len(line) > len(title) and any(k in line for k in (\"游\", \"天\", \"日\", \"湾\", \"山\", \"岛\", \"城\")):\
                        title = line\
\
            # 提取目的地: 游玩目的地: _xxx_ _yyy_\
            dest_match = re.search(r\"游玩目的地[：:]\\s*(_?)([^\\
]{2,100})\", block)\
            destination = \"\"\
            if dest_match:\
                dest_text = dest_match.group(2)\
                # 清理下划线分隔符\
                destinations = [d.strip(\"_\") for d in dest_text.split(\"_\") if d.strip(\"_\")]\
                destination = \" \".join(destinations)\
\
            # 提取天数: 行程天数: _X天_\
            days_match = re.search(r\"行程天数[：:]\\s*_?(\\d+)[天/日]_?\", block)\
            days = int(days_match.group(1)) if days_match else 0\
\
            # 提取交通方式\
            traffic_match = re.search(r\"交通方式[：:]\\s*_?([^\\
]{2,20})_?\", block)\
            traffic = traffic_match.group(1).strip(\"_\") if traffic_match else \"\"\
\
            # 提取价格: 品途列表页价格可能不明显，尝试提取\
            price = extract_price(block)\
\
            # 过滤无效数据\
            if title and len(title) > 5 and days > 0:\
                items.append({\
                    \"source\": \"品途旅游\",\
                    \"title\": title,\
                    \"price\": price,\
                    \"url\": url,\
                    \"category\": category,\
                    \"destination\": destination,\
                    \"date_range\": \"\",\
                    \"days\": days,\
                    \"traffic\": traffic,\
                })\
\
        # 策略B: 如果策略A太少，用DOM解析兜底\
        if len(items) < 2:\
            items = self._parse_dom(soup, url, category)\
\
        return items\
\
    def _parse_dom(self, soup, url, category):\
        items = []\
        for card in soup.find_all([\"div\", \"li\", \"tr\"]):\
            txt = card.get_text(\" \", strip=True)\
            # 品途特征: 包含\"行程天数\"和\"游玩目的地\"\
            if \"行程天数\" not in txt and \"游玩目的地\" not in txt:\
                continue\
\
            # 提取标题: 最长含\"游\"或\"天\"的文本\
            title = \"\"\
            for part in txt.split(\"\\
\"):\
                part = part.strip()\
                if len(part) > len(title) and any(k in part for k in (\"游\", \"天\", \"日\", \"湾\", \"山\", \"岛\")):\
                    title = part\
\
            # 提取目的地\
            dest_m = re.search(r\"游玩目的地[：:]\\s*([^\\
]+)\", txt)\
            destination = dest_m.group(1).strip() if dest_m else \"\"\
\
            # 提取天数\
            days_m = re.search(r\"行程天数[：:]\\s*(\\d+)[天/日]\", txt)\
            days = int(days_m.group(1)) if days_m else 0\
\
            # 提取交通\
            traffic_m = re.search(r\"交通方式[：:]\\s*([^\\
]+)\", txt)\
            traffic = traffic_m.group(1).strip() if traffic_m else \"\"\
\
            price = extract_price(txt)\
\
            if title and len(title) > 5 and days > 0:\
                items.append({\
                    \"source\": \"品途旅游\",\
                    \"title\": title,\
                    \"price\": price,\
                    \"url\": url,\
                    \"category\": category,\
                    \"destination\": destination,\
                    \"date_range\": \"\",\
                    \"days\": days,\
                    \"traffic\": traffic,\
                })\
        return items\
\
\
# ==================== 8. 主控程序 ====================\
def main():\
    print(\"=\" * 70)\
    print(\"旅行团聚合爬虫 v4.0 启动 (7站聚合)\")\
    print(\"=\" * 70)\
\
    all_data = []\
\
    # ---------- 假日通 ----------\
    print(\"\\
[1/7] 假日通 (jrt365.com)\")\
    jrt = Jrt365Spider()\
    try:\
        items = jrt.fetch_index()\
        print(f\"      首页 -> {len(items)} 条\")\
        for it in items[:5]:\
            print(f\"         · {it['title'][:40]}... | ¥{it['price']} | {it['category']}\")\
        all_data.extend(items)\
        lists = jrt.discover_lists()\
        if lists:\
            print(f\"      发现 {len(lists)} 个列表页, 抓取前2个...\")\
            for link in lists[:2]:\
                li_items = jrt.fetch_list(link[\"url\"])\
                all_data.extend(li_items)\
                time.sleep(REQUEST_DELAY)\
    except Exception as e:\
        print(f\"      错误: {e}\")\
\
    # ---------- 广州去旅行 ----------\
    print(\"\\
[2/7] 广州去旅行 (gzqlx.360jlb.cn)\")\
    gzqlx = GzqlxSpider()\
    try:\
        items = gzqlx.fetch_all()\
        all_data.extend(items)\
    except Exception as e:\
        print(f\"      错误: {e}\")\
\
    # ---------- 康辉旅行 ----------\
    print(\"\\
[3/7] 康辉旅行 (cctpage.com / cct.cn)\")\
    kanghui = KanghuiSpider()\
    try:\
        items = kanghui.fetch()\
        print(f\"      总计 -> {len(items)} 条\")\
        for it in items[:5]:\
            print(f\"         · {it['title'][:40]}... | ¥{it['price']}\")\
        all_data.extend(items)\
    except Exception as e:\
        print(f\"      错误: {e}\")\
\
    # ---------- 暴走村 ----------\
    print(\"\\
[4/7] 暴走村/暴走团\")\
    baozou = BaozoucunSpider()\
    try:\
        items = baozou.fetch()\
        all_data.extend(items)\
    except Exception as e:\
        print(f\"      错误: {e}\")\
\
    # ---------- 广之旅 ----------\
    print(\"\\
[5/7] 广之旅 (nn.gzl.cn)\")\
    gzl = GzlSpider()\
    try:\
        items = gzl.fetch_all()\
        print(f\"      总计 -> {len(items)} 条\")\
        for it in items[:5]:\
            print(f\"         · {it['title'][:40]}... | ¥{it['price']} | {it['category']}\")\
        all_data.extend(items)\
    except Exception as e:\
        print(f\"      错误: {e}\")\
\
    # ---------- 广东中旅 ----------\
    print(\"\\
[6/7] 广东中旅 (gdcts.com)\")\
    gdcts = GdctsSpider()\
    try:\
        items = gdcts.fetch_all()\
        print(f\"      总计 -> {len(items)} 条\")\
        for it in items[:5]:\
            print(f\"         · {it['title'][:40]}... | ¥{it['price']} | {it['category']}\")\
        all_data.extend(items)\
    except Exception as e:\
        print(f\"      错误: {e}\")\
\
    # ---------- 品途旅游 (NEW) ----------\
    print(\"\\
[7/7] 品途旅游 (gz.ptotour.com)\")\
    pintu = PintuSpider()\
    try:\
        items = pintu.fetch_all()\
        print(f\"      总计 -> {len(items)} 条\")\
        for it in items[:5]:\
            print(f\"         · {it['title'][:40]}... | ¥{it['price']} | {it['category']} | {it['destination']} | {it['days']}天\")\
        all_data.extend(items)\
    except Exception as e:\
        print(f\"      错误: {e}\")\
\
    # ---------- 保存 ----------\
    print(\"\\
\" + \"-\" * 70)\
    print(\"[汇总] 去重前: {} 条\".format(len(all_data)))\
    all_data = dedup_items(all_data)\
    print(\"[汇总] 去重后: {} 条\".format(len(all_data)))\
\
    save_json({\"data\": all_data, \"total\": len(all_data)}, \"travel_agg_v4.json\")\
    save_csv(all_data, \"travel_agg_v4.csv\")\
\
    print(\"\\
\" + \"=\" * 70)\
    print(\"聚合完成! 输出文件: travel_agg_v4.json / travel_agg_v4.csv\")\
    print(\"=\" * 70)\
\
    print(\"\\
[数据样本 - 前15条]\")\
    for idx, it in enumerate(all_data[:15], 1):\
        price_str = f\"¥{it['price']}\" if it['price'] else \"电询\"\
        dest = it.get('destination', '')\
        cat = it.get('category', '')\
        days = f\"{it.get('days', 0)}天\" if it.get('days', 0) > 0 else \"\"\
        print(f\"  {idx:2d}. [{it['source']}] {it['title'][:35]}... | {price_str} | {days} | {cat}\")\
\
\
if __name__ == \"__main__\":\
    main()\
'''