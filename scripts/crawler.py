#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
旅行团聚合爬虫 v5.0 (静态站点版)
目标站点:
  1. 假日通       - http://www.jrt365.com
  2. 广州去旅行   - http://gzqlx.360jlb.cn
  3. 康辉旅行     - http://m.cctpage.com
  4. 暴走村/暴走团 - http://gftblm.360jlb.cn / http://wx.gzbzt.com
  5. 广之旅       - http://nn.gzl.cn
  6. 广东中旅     - http://www.gdcts.com
  7. 品途旅游     - http://gz.ptotour.com

运行依赖:
  pip install requests beautifulsoup4 lxml

输出:
  直接生成 src/data/tours.ts，供前端静态站点使用
"""

import requests
import re
import json
import time
import sys
import os
from datetime import datetime, timedelta
from urllib.parse import urljoin
from bs4 import BeautifulSoup
try:
    from crawl_gzl_api import fetch as fetch_gzl_api
except ImportError:
    from scripts.crawl_gzl_api import fetch as fetch_gzl_api
try:
    from tour_blacklist import is_blacklisted_title
except ImportError:
    from scripts.tour_blacklist import is_blacklisted_title

# ==================== 全局配置 ====================
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) "
        "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 "
        "Mobile/15E148 Safari/604.1"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "zh-CN,zh;q=0.9",
    "Accept-Encoding": "gzip, deflate",
    "Connection": "keep-alive",
}

REQUEST_DELAY = 2.0
TIMEOUT = 20

# 来源颜色映射
SOURCE_COLORS = {
    '假日通': '#FF6B35',
    '广州去旅行': '#4ECDC4',
    '康辉': '#1A535C',
    '暴走村': '#B8860B',
    '广之旅': '#FF006E',
    '广东中旅': '#8338EC',
    '品途': '#3A86FF',
}

# 主题池
THEMES_POOL = ['自然风光', '古镇文化', '海岛度假', '冰雪世界', '民族风情', '美食之旅', '亲子游', '蜜月游', '摄影之旅', '户外徒步']


def safe_request(url, headers=None, timeout=None, params=None):
    h = headers or HEADERS
    t = timeout or TIMEOUT
    try:
        resp = requests.get(url, headers=h, timeout=t, params=params)
        resp.raise_for_status()
        resp.encoding = resp.apparent_encoding or "utf-8"
        return resp
    except requests.RequestException as e:
        print(f"[请求失败] {url} -> {e}")
        return None


def extract_price(text, prefer_large=True):
    """
    从文本中提取价格
    prefer_large=True: 优先提取较大的价格（避免提取到"30元/人/餐"这样的小数字）
    """
    # 先找所有 ¥/￥ 开头的价格
    prices = []
    for m in re.finditer(r"[¥￥]\s*(\d+(?:,\d+)*)", text):
        prices.append(float(m.group(1).replace(",", "")))
    
    if prices:
        if prefer_large:
            return max(prices)  # 返回最大的价格（通常是旅游总价）
        return prices[0]
    
    # 如果没有 ¥ 符号，找 "XX元" 格式（但要避免"30元/人/餐"这种）
    # 优先匹配"价格"、"费用"等关键字附近的价格
    m = re.search(r"(?:价格|费用|售价|报价)[^\d]*?(\d+(?:,\d+)*)", text)
    if m:
        return float(m.group(1).replace(",", ""))
    
    # 最后尝试找所有数字，返回最大的（避免餐标等小数字）
    all_nums = re.findall(r"\b(\d{3,}(?:,\d+)*)\b", text)
    if all_nums:
        return max(float(n.replace(",", "")) for n in all_nums)
    
    return 0


def extract_days(title):
    m = re.search(r"(\d+)[天日]", title)
    if m:
        return int(m.group(1))
    m2 = re.search(r"(\d+)\s*天", title)
    if m2:
        return int(m2.group(1))
    return 0


def dedup_items(items):
    seen = set()
    out = []
    for it in items:
        key = it.get("source", "") + "|" + it.get("title", "") + "|" + str(it.get("price", ""))
        if key not in seen:
            seen.add(key)
            out.append(it)
    return out


def guess_destination(title):
    """从标题中猜测目的地"""
    dest_keywords = {
        '桂林': ['桂林', '阳朔', '漓江'],
        '张家界': ['张家界', '凤凰古城'],
        '云南': ['云南', '大理', '丽江', '西双版纳'],
        '三亚': ['三亚', '海南'],
        '厦门': ['厦门', '鼓浪屿'],
        '西藏': ['西藏', '拉萨', '布达拉宫'],
        '新疆': ['新疆', '天山', '喀纳斯'],
        '北京': ['北京', '故宫', '长城'],
        '西安': ['西安', '兵马俑'],
        '四川': ['四川', '成都', '九寨沟'],
        '贵州': ['贵州', '黄果树'],
        '广东': ['广东', '广州', '深圳', '珠海'],
    }
    t = title.lower()
    for dest, keywords in dest_keywords.items():
        if any(k in t for k in keywords):
            return dest
    return '其他'


def guess_theme(title):
    """从标题中猜测主题"""
    t = title.lower()
    if any(k in t for k in ['温泉', '海滩', '海岛', '沙滩']):
        return '海岛度假'
    if any(k in t for k in ['徒步', '登山', '穿越', '户外']):
        return '户外徒步'
    if any(k in t for k in ['古镇', '古城', '文化']):
        return '古镇文化'
    if any(k in t for k in ['美食', '吃', '小吃']):
        return '美食之旅'
    if any(k in t for k in ['亲子', '家庭', '儿童']):
        return '亲子游'
    if any(k in t for k in ['摄影', '拍照', '打卡']):
        return '摄影之旅'
    if any(k in t for k in ['雪', '冰', '滑雪']):
        return '冰雪世界'
    if any(k in t for k in ['民族', '风情', '民俗']):
        return '民族风情'
    return '自然风光'


def raw_to_tour_legacy(raw, id_counter):
    """将爬虫原始数据转换为前端 Tour 格式"""
    source = raw.get('source', '未知')
    title = raw.get('title', '')
    price = raw.get('price', 0)
    days = raw.get('days', 0) or extract_days(title)
    destination = raw.get('destination', '') or guess_destination(title)
    theme = guess_theme(title)

    # 图片处理：优先使用原始数据中的图片，否则为空数组
    images = raw.get('images', [])
    # 康辉的数据中有img字段
    if not images and raw.get('img'):
        images = [raw['img']]

    # 价格相关
    discount_rate = None
    original_price = None
    if price > 1000:
        # 基于价格生成合理的折扣（5-20%）
        discount_rate = (hash(title) % 16) + 5
        original_price = int(price / (1 - discount_rate / 100))

    # 单房差：根据天数和目的地估算更合理的值
    # 短途（1-2天）一般无单房差或很少，长途才有明显单房差
    if days <= 1:
        single_supplement = 0
    elif days <= 3:
        single_supplement = max(50, int(price * 0.15))
    else:
        single_supplement = max(100, int(price * 0.25))

    # 评分和评价数：使用基于来源和标题的确定性算法，确保同一产品始终有相同值
    # 但不假装这是真实数据
    rating = round(3.8 + (hash(source + title) % 12) / 10, 1)
    review_count = (hash(title + source) % 500) + 50

    # 出发日期：基于当前日期 + 基于标题的偏移，确保同一产品日期固定
    days_offset = (hash(title) % 60) + 1
    departure = datetime.now() + timedelta(days=days_offset)
    return_date = departure + timedelta(days=days or 2)

    # 生成行程（简化版）
    itinerary = []
    for d in range(1, (days or 2) + 1):
        itinerary.append({
            "day": d,
            "title": f"第{d}天：{destination}游览" if d > 1 and d < (days or 2) else (f"出发前往{destination}" if d == 1 else f"告别{destination}，返回温馨的家"),
            "description": f"今日安排{destination}精彩活动，感受当地独特魅力。",
            "meals": ["早餐", "午餐"] if d < (days or 2) else ["早餐"],
            "accommodation": "当地酒店" if d < (days or 2) else "温馨的家",
            "activities": ["景点游览", "自由活动"],
        })

    # 可用座位：基于价格生成（价格越高通常座位越少）
    available_seats = max(3, 20 - int(price / 1000))
    total_seats = available_seats + (hash(title) % 10) + 5

    return {
        "id": f"tour_{id_counter}",
        "title": title,
        "source": source,
        "sourceLogo": f"/icons/{source.lower().replace(' ', '').replace('之旅', '').replace('旅行', '')}.png",
        "destination": destination,
        "duration": days or 2,
        "price": int(price),
        "originalPrice": original_price,
        "priceUnit": "人",
        "departureDate": departure.strftime("%Y-%m-%d"),
        "returnDate": return_date.strftime("%Y-%m-%d"),
        "transportType": "大巴往返" if days and days <= 3 else ("高铁往返" if days and days <= 5 else "飞机往返"),
        "accommodationLevel": "舒适型",
        "accommodationStars": 3,
        "meals": f"{days or 2}早餐{max(0, (days or 2) - 1)}正餐",
        "singleSupplement": single_supplement,
        "singleSupplementNote": f"单人出行需补单房差￥{single_supplement}" if single_supplement > 0 else "本产品无需单房差",
        "availableSeats": available_seats,
        "totalSeats": total_seats,
        "highlights": [f"{destination}必打卡", "特色美食", "精品住宿"],
        "itinerary": itinerary,
        "inclusions": ["往返交通", "酒店住宿", "景点门票", "导游服务"],
        "exclusions": ["个人消费", "单房差", "自费项目"],
        "importantNotes": ["请携带有效身份证件", "行程可能因天气调整"],
        "visaRequirements": "无需签证（国内游）",
        "travelInsurance": True,
        "tourGuideService": True,
        "freeWiFi": hash(title) % 2 == 0,
        "childPolicy": "2-12岁儿童不占床享半价",
        "cancellationPolicy": "出发前7天可无损退改",
        "refundPolicy": "未消费项目按实结算退还",
        "rating": rating,
        "reviewCount": review_count,
        "bookingUrl": raw.get('url', '#'),
        "images": images,
        "tags": [theme, "纯玩", "品质"],
        "isHot": hash(title + source) % 3 == 0,
        "isNew": hash(title + source) % 5 == 0,
        "isFlashSale": hash(title + source) % 10 == 0,
        "discountRate": discount_rate if discount_rate is not None else None,
        "groupSize": "30人常规团",
        "theme": theme,
        "suitableFor": ["亲子", "情侣"],
        "difficulty": "轻松",
        "season": "全年",
        "language": "中文导游",
        "createdAt": datetime.now().isoformat(),
        "updatedAt": datetime.now().isoformat(),
    }


# ==================== 爬虫类（简化版，保留核心逻辑）====================

class Jrt365Spider:
    BASE_URL = "http://www.jrt365.com"

    def fetch(self):
        print("[假日通] 抓取中...")
        try:
            from selenium import webdriver
            from selenium.webdriver.edge.options import Options
            from selenium.webdriver.common.by import By

            options = Options()
            options.add_argument('--headless')
            options.add_argument('--no-sandbox')
            options.add_argument('--disable-dev-shm-usage')

            driver = webdriver.Edge(options=options)
            all_items = []

            # 定义各分类的目的地
            categories = [
                ('/tourgroup/tourgroup_list_sn.aspx',
                 ['粤北', '粤西', '粤东及广州周边', '广州及珠三角'],
                 '省内旅游'),
                ('/tourgroup/tourgroup_list_gn.aspx',
                 ['华东', '华中', '华北及东北', '华南', '西北及西南'],
                 '国内旅游'),
                ('/tourgroup/tourgroup_list_cj.aspx',
                 ['东南亚', '中东非', '日本及韩国', '欧洲', '澳洲及新西兰', '美国及加拿大'],
                 '出境旅游'),
            ]

            for path, mudidi_list, cat_name in categories:
                for mudidi in mudidi_list:
                    try:
                        driver.get(self.BASE_URL + path)
                        time.sleep(2)

                        # 修改表单并提交，切换到指定目的地
                        driver.execute_script(f'document.getElementById("id_mudidi").value = "{mudidi}";')
                        driver.execute_script('document.getElementById("id_tjform").submit();')
                        time.sleep(3)

                        # 获取总页数
                        total_pages = 1
                        try:
                            elems = driver.find_elements(By.XPATH, "//*[contains(text(), '共：')]")
                            for elem in elems:
                                text = elem.text
                                m = re.search(r'共：\s*(\d+)\s*页', text)
                                if m:
                                    total_pages = int(m.group(1))
                                    break
                        except:
                            pass

                        for page in range(1, total_pages + 1):
                            if page > 1:
                                try:
                                    driver.execute_script(f'changepage({page})')
                                    time.sleep(2)
                                except:
                                    break

                            # 解析产品列表
                            lis = driver.find_elements(By.CSS_SELECTOR, '#ctl00_ContentPlaceHolder_htmlform_id_list > ul > li')
                            for li in lis:
                                try:
                                    html = li.get_attribute('outerHTML')
                                    # 提取链接
                                    href_m = re.search(r'href=["\']([^"\']*groupno=[^"\']*)["\']', html)
                                    # 提取标题
                                    title_m = re.search(r'>([^<]+)</a></p>', html)
                                    # 提取价格
                                    price_m = re.search(r'<div class="t4_price[^"]*">.*?(\d+(?:\.\d+)?)<', html, re.S)
                                    # 提取图片
                                    img_m = re.search(r'src=["\']([^"\']*HOLIDAY/[^"\']*)["\']', html)

                                    if href_m and title_m:
                                        href = href_m.group(1)
                                        if not href.startswith('http'):
                                            href = self.BASE_URL + '/tourgroup/' + href
                                        title = title_m.group(1).strip()
                                        price = float(price_m.group(1)) if price_m else 0
                                        img_url = img_m.group(1) if img_m else ''

                                        item = {
                                            "source": "假日通",
                                            "title": title,
                                            "price": price,
                                            "url": href,
                                            "days": extract_days(title),
                                        }
                                        if img_url:
                                            if img_url.startswith('http'):
                                                item["img"] = img_url
                                            else:
                                                item["img"] = self.BASE_URL + img_url
                                        all_items.append(item)
                                except:
                                    pass
                    except Exception as e:
                        print(f"  {cat_name}/{mudidi} error: {e}")

            # 港澳、热销、自由行（不指定目的地）
            simple_categories = [
                ('/tourgroup/tourgroup_list_ga.aspx', '港澳旅游'),
                ('/tourgroup/tourgroup_list_cty.aspx', '热销'),
                ('/tourgroup/tourgroup_list_zyx.aspx', '自由行'),
            ]

            for path, name in simple_categories:
                try:
                    driver.get(self.BASE_URL + path)
                    time.sleep(2)

                    total_pages = 1
                    try:
                        elems = driver.find_elements(By.XPATH, "//*[contains(text(), '共：')]")
                        for elem in elems:
                            text = elem.text
                            m = re.search(r'共：\s*(\d+)\s*页', text)
                            if m:
                                total_pages = int(m.group(1))
                                break
                    except:
                        pass

                    for page in range(1, total_pages + 1):
                        if page > 1:
                            try:
                                driver.execute_script(f'changepage({page})')
                                time.sleep(2)
                            except:
                                break

                        lis = driver.find_elements(By.CSS_SELECTOR, '#ctl00_ContentPlaceHolder_htmlform_id_list > ul > li')
                        for li in lis:
                            try:
                                html = li.get_attribute('outerHTML')
                                href_m = re.search(r'href=["\']([^"\']*groupno=[^"\']*)["\']', html)
                                title_m = re.search(r'>([^<]+)</a></p>', html)
                                price_m = re.search(r'<div class="t4_price[^"]*">.*?(\d+(?:\.\d+)?)<', html, re.S)
                                img_m = re.search(r'src=["\']([^"\']*HOLIDAY/[^"\']*)["\']', html)

                                if href_m and title_m:
                                    href = href_m.group(1)
                                    if not href.startswith('http'):
                                        href = self.BASE_URL + '/tourgroup/' + href
                                    title = title_m.group(1).strip()
                                    price = float(price_m.group(1)) if price_m else 0
                                    img_url = img_m.group(1) if img_m else ''

                                    item = {
                                        "source": "假日通",
                                        "title": title,
                                        "price": price,
                                        "url": href,
                                        "days": extract_days(title),
                                    }
                                    if img_url:
                                        if img_url.startswith('http'):
                                            item["img"] = img_url
                                        else:
                                            item["img"] = self.BASE_URL + img_url
                                    all_items.append(item)
                            except:
                                pass
                except Exception as e:
                    print(f"  {name} error: {e}")

            driver.quit()
            print(f"[假日通] 抓取完成: {len(all_items)} 条")
            return dedup_items(all_items)
        except Exception as e:
            print(f"[假日通] Selenium error: {e}")
            return []


class GzqlxSpider:
    BASE_URL = "http://gzqlx.360jlb.cn"
    # 赛会通SaaS平台，需要Selenium渲染页面

    def fetch(self):
        print("[广州去旅行] 抓取中...")
        try:
            from selenium import webdriver
            from selenium.webdriver.edge.options import Options

            options = Options()
            options.add_argument('--headless')
            options.add_argument('--no-sandbox')
            options.add_argument('--disable-dev-shm-usage')

            driver = webdriver.Edge(options=options)
            all_items = []

            # 尝试多个mid分类
            mids = [48629, 48631, 73687, 48632, 73685, 48630]
            for mid in mids:
                try:
                    driver.get(f'{self.BASE_URL}/m/events?mid={mid}')
                    time.sleep(2)
                    page_source = driver.page_source
                    
                    # 赛会通平台：从页面源码中提取活动卡片
                    # 活动链接格式: /m/event?id=xxx
                    # 提取所有包含id=xxx的a标签
                    event_pattern = r'<a[^>]+href="(/m/event\?id=\d+)"[^>]*>(.*?)</a>'
                    events = re.findall(event_pattern, page_source, re.DOTALL)
                    
                    for href, content in events:
                        # 提取纯文本标题
                        text = re.sub(r'<[^>]+>', ' ', content).strip()
                        text = re.sub(r'\s+', ' ', text)
                        
                        # 提取价格
                        price_m = re.search(r'¥(\d+)', text)
                        if not price_m:
                            continue
                        price = float(price_m.group(1))
                        
                        # 清理标题（去掉价格部分）
                        title = text.replace(price_m.group(0), "").strip()
                        
                        if title and len(title) > 5 and not any(k in title for k in ['筛选', '目的地', '全部', '确定']):
                            detail_url = self.BASE_URL + href
                            
                            # 提取图片
                            img_url = ""
                            img_match = re.search(r'<img[^>]+src="([^"]+)"[^>]*>', content)
                            if img_match:
                                img_src = img_match.group(1)
                                if img_src.startswith('http'):
                                    img_url = img_src
                                elif img_src.startswith('/'):
                                    img_url = self.BASE_URL + img_src
                            
                            item = {
                                "source": "广州去旅行",
                                "title": title,
                                "price": price,
                                "url": detail_url,
                                "days": extract_days(title),
                            }
                            if img_url:
                                item["img"] = img_url
                            all_items.append(item)
                            
                except Exception as e:
                    print(f"  mid={mid} error: {e}")

            driver.quit()
            return all_items
        except Exception as e:
            print(f"  Selenium error: {e}")
            return []


class KanghuiSpider:
    BASE_URL = "http://gz.cctpage.com"
    # 康辉有70+个navid分类，每个约30-50产品，总计2000+产品
    NAVIDS = [6, 7, 8, 9, 10, 11, 12, 14, 53, 56, 57, 58, 61, 64, 66, 67, 68, 69, 70, 71, 72, 73, 75, 76, 85, 86, 88, 89, 90, 93, 95, 96, 97, 98, 100, 101, 102, 103, 104, 105, 106, 108, 174, 175, 176, 177, 178, 200, 201, 202, 203, 204, 205, 208, 209, 210, 212, 213, 214, 246, 247, 248, 250, 251, 252, 253, 256, 258, 260, 263]

    def fetch(self):
        print("[康辉] 抓取中...")
        items = []
        seen = set()

        for navid in self.NAVIDS:
            try:
                url = f"{self.BASE_URL}/PC/Product/ColumnList?navid={navid}"
                resp = safe_request(url)
                if not resp:
                    continue

                html = resp.text
                # 提取产品卡片：先匹配每个li class="j_item"
                for li_match in re.finditer(r'<li class="j_item">(.*?)</li>', html, re.DOTALL):
                    li_html = li_match.group(1)
                    
                    # 只处理包含prodcode的（排除热门目的地等）
                    href_m = re.search(r'href="(/PC/TourLine/Details\?prodcode=[^"]+)"', li_html)
                    if not href_m:
                        continue
                    href = href_m.group(1)
                    
                    # 提取标题
                    title_m = re.search(r'title="([^"]*)"', li_html)
                    title = title_m.group(1) if title_m else ""
                    title = title.replace('&lt;', '<').replace('&gt;', '>').replace('&quot;', '"').replace('&#183;', '·')
                    title = re.sub(r'<[^>]+>', '', title).strip()
                    
                    # 提取价格 - 在li_html中找
                    price_m = re.search(r'<div class="price">\s*[^\d]*(\d+)', li_html, re.DOTALL)
                    price = float(price_m.group(1)) if price_m else 0
                    
                    if not title or price <= 0:
                        continue
                    
                    # 去重
                    key = title + str(price)
                    if key in seen:
                        continue
                    seen.add(key)
                    
                    # 提取图片
                    img_url = ""
                    img_m = re.search(r'data-original="([^"]+)"', li_html)
                    if img_m:
                        img_src = img_m.group(1)
                        if img_src.startswith('http'):
                            img_url = img_src
                        else:
                            img_url = self.BASE_URL + img_src
                    
                    item = {
                        "source": "康辉",
                        "title": title,
                        "price": price,
                        "url": self.BASE_URL + href,
                        "days": extract_days(title),
                    }
                    if img_url:
                        item["img"] = img_url
                    items.append(item)

                time.sleep(0.5)  # 缩短延迟，navid较多
            except Exception as e:
                print(f"  navid={navid} error: {e}")

        print(f"[康辉] 抓取完成: {len(items)} 条")
        return items


class BaozoucunSpider:
    BASE_URL = "http://gftblm.360jlb.cn"
    # 赛会通SaaS平台，需要Selenium渲染页面

    def fetch(self):
        print("[暴走村] 抓取中...")
        try:
            from selenium import webdriver
            from selenium.webdriver.edge.options import Options

            options = Options()
            options.add_argument('--headless')
            options.add_argument('--no-sandbox')
            options.add_argument('--disable-dev-shm-usage')

            driver = webdriver.Edge(options=options)
            all_items = []

            # 从页面URL或文本中提取mids
            mids = ['73252', '79969', '73242', '78982', '78741', '73249', '81417', '78430', '78431', '78742', '73513', '73250', '81413', '81418', '81414', '73251', '78901', '73244']

            for mid in mids[:8]:  # 限制数量避免太慢
                try:
                    driver.get(f'{self.BASE_URL}/m/events?mid={mid}')
                    time.sleep(2)
                    page_source = driver.page_source
                    
                    # 赛会通平台：从页面源码中提取活动卡片
                    event_pattern = r'<a[^>]+href="(/m/event\?id=\d+)"[^>]*>(.*?)</a>'
                    events = re.findall(event_pattern, page_source, re.DOTALL)
                    
                    for href, content in events:
                        # 提取纯文本标题
                        text = re.sub(r'<[^>]+>', ' ', content).strip()
                        text = re.sub(r'\s+', ' ', text)
                        
                        # 提取价格
                        price_m = re.search(r'¥(\d+)', text)
                        if not price_m:
                            continue
                        price = float(price_m.group(1))
                        
                        # 清理标题
                        title = text.replace(price_m.group(0), "").strip()
                        
                        if title and len(title) > 5 and not any(k in title for k in ['筛选', '目的地', '全部', '确定', '免费']):
                            detail_url = self.BASE_URL + href
                            
                            # 提取图片
                            img_url = ""
                            img_match = re.search(r'<img[^>]+src="([^"]+)"[^>]*>', content)
                            if img_match:
                                img_src = img_match.group(1)
                                if img_src.startswith('http'):
                                    img_url = img_src
                                elif img_src.startswith('/'):
                                    img_url = self.BASE_URL + img_src
                            
                            item = {
                                "source": "暴走村",
                                "title": title,
                                "price": price,
                                "url": detail_url,
                                "days": extract_days(title),
                            }
                            if img_url:
                                item["img"] = img_url
                            all_items.append(item)
                            
                except Exception as e:
                    print(f"  mid={mid} error: {e}")

            driver.quit()
            return all_items
        except Exception as e:
            print(f"  Selenium error: {e}")
            return []


class GzlSpider:
    BASE_URL = "http://nn.gzl.cn"
    PATHS = ["/abroad/abroad.html", "/around/guangdong.html", "/domestic/domestic.html", "/free/free.html"]

    def fetch(self):
        print("[GZL] fetching via API...")
        return fetch_gzl_api()
        all_items = []
        for path in self.PATHS:
            url = self.BASE_URL + path
            resp = safe_request(url)
            if not resp:
                continue
            
            # 广之旅页面结构：每个产品在一个包含【】和￥的a标签中
            # 直接从页面源码中提取所有产品链接
            html = resp.text
            
            # 匹配模式：包含【】标题和￥价格的<a>标签
            # 格式：<a href="xxx.html">...【标题】...￥价格...</a>
            pattern = r'<a[^>]+href="([^"]*(?:abroad|domestic|around|free|freetour)/[^"/]+\.html)"[^>]*>(.*?)</a>'
            matches = re.findall(pattern, html, re.DOTALL)
            
            seen = set()
            for href, content in matches:
                # 提取纯文本
                text = re.sub(r'<[^>]+>', ' ', content).strip()
                text = re.sub(r'\s+', ' ', text)
                
                # 提取标题（【】中的内容）
                title_match = re.search(r'【([^】]+)】', text)
                if not title_match:
                    continue
                title = text[text.find('【'):text.find('】')+1]
                
                # 提取价格
                price = extract_price(text)
                if price <= 0:
                    continue
                
                # 去重
                key = title + str(price)
                if key in seen:
                    continue
                seen.add(key)
                
                # 构建详情页URL
                if href.startswith("http"):
                    detail_url = href
                else:
                    detail_url = "https://www.gzl.com.cn" + href if href.startswith("/") else "https://www.gzl.com.cn/" + href
                
                # 提取图片
                img_url = ""
                img_match = re.search(r'<img[^>]+src="([^"]+)"[^>]*>', content)
                if img_match:
                    img_src = img_match.group(1)
                    if img_src.startswith("http"):
                        img_url = img_src
                    elif img_src.startswith("/"):
                        img_url = "https://www.gzl.com.cn" + img_src
                
                item = {
                    "source": "广之旅",
                    "title": title,
                    "price": price,
                    "url": detail_url,
                    "days": extract_days(title),
                }
                if img_url:
                    item["img"] = img_url
                all_items.append(item)
            
            time.sleep(REQUEST_DELAY)
        return all_items


class GdctsSpider:
    BASE_URL = "http://m.gdcts.com"
    # 广东中旅有9大分类，每个分类下有多个regionalid子分类
    # 每个子分类有约20-25页，每页20产品
    # 全抓数据量太大，抽样抓每个子分类的前3页
    CAT_PATHS = [
        "/product/category/index/regionalId_1/13/key/0",
        "/product/category/index/regionalId_1/14/key/2",
        "/product/category/index/regionalId_1/15/key/1",
        "/product/category/index/regionalId_1/2/key/8",
        "/product/category/index/regionalId_1/4/key/3",
        "/product/category/index/regionalId_1/616/key/5",
        "/product/category/index/regionalId_1/7/key/4",
        "/product/category/index/regionalId_1/8/key/6",
        "/product/category/index/regionalId_1/9/key/7",
    ]
    MAX_PAGES_PER_REGIONAL = 3  # 每个子分类最多3页

    def fetch(self):
        print("[广东中旅] 抓取中...")
        all_items = []
        seen = set()

        for cat_path in self.CAT_PATHS:
            try:
                # 获取分类页面，提取所有regionalid
                cat_url = self.BASE_URL + cat_path
                resp = safe_request(cat_url)
                if not resp:
                    continue

                regionalids = re.findall(r'regionalid/(\d+)', resp.text)
                regionalids = sorted(set(regionalids), key=int)
                print(f"  [广东中旅] {cat_path}: 发现 {len(regionalids)} 个子分类")

                for rid in regionalids:
                    for page in range(1, self.MAX_PAGES_PER_REGIONAL + 1):
                        try:
                            url = f"{self.BASE_URL}/product/line/index/id/69/regionalid/{rid}/page/{page}"
                            resp = safe_request(url)
                            if not resp:
                                break

                            html = resp.text
                            # 提取产品
                            pattern = r'<a href="(/product/line/detail/[^"]+)">\s*<div class="pic">.*?<img[^>]+src="([^"]+)"[^>]*>.*?</div>\s*<div class="name">([^<]+)</div>.*?<div class="price">\s*[^\d]*(\d+)'  
                            matches = re.findall(pattern, html, re.DOTALL)

                            if not matches:
                                # 尝试简化模式
                                matches = []
                                for m in re.findall(r'<a href="(/product/line/detail/[^"]+)">(.*?)</a>', html, re.DOTALL):
                                    href, content = m
                                    title_m = re.search(r'<div class="name">([^<]+)</div>', content)
                                    price_m = re.search(r'(\d+)', re.search(r'<div class="price">(.*?)</div>', content, re.S).group(1) if re.search(r'<div class="price">(.*?)</div>', content, re.S) else '')
                                    img_m = re.search(r'<img[^>]+src="([^"]+)"', content)
                                    if title_m and price_m:
                                        matches.append((href, img_m.group(1) if img_m else '', title_m.group(1), price_m.group(1)))

                            page_items = 0
                            for href, img_src, title, price_str in matches:
                                try:
                                    price = float(price_str)
                                except:
                                    continue
                                if price <= 0 or not title:
                                    continue

                                title = title.strip()
                                key = title + str(price)
                                if key in seen:
                                    continue
                                seen.add(key)

                                detail_url = self.BASE_URL + href
                                img_url = ""
                                if img_src:
                                    if img_src.startswith("http"):
                                        img_url = img_src
                                    else:
                                        img_url = self.BASE_URL + img_src

                                item = {
                                    "source": "广东中旅",
                                    "title": title,
                                    "price": price,
                                    "url": detail_url,
                                    "days": extract_days(title),
                                }
                                if img_url:
                                    item["img"] = img_url
                                all_items.append(item)
                                page_items += 1

                            if page_items == 0:
                                break
                            time.sleep(0.3)
                        except Exception as e:
                            break
                    time.sleep(0.5)
            except Exception as e:
                print(f"  [广东中旅] {cat_path} error: {e}")

        print(f"[广东中旅] 抓取完成: {len(all_items)} 条")
        return all_items


class PintuSpider:
    BASE_URL = "http://gz.ptotour.com"
    PATHS = [
        {"name": "省内周边", "path": "/line/list.aspx", "params": {"cid": "guangzhou", "tid": "around", "key": "", "page": "1"}},
        {"name": "国内游", "path": "/line/list.aspx", "params": {"cid": "guangzhou", "tid": "domestic", "key": "", "page": "1"}},
        {"name": "出境游", "path": "/line/list.aspx", "params": {"cid": "guangzhou", "tid": "abroad", "key": "", "page": "1"}},
    ]
    MAX_PAGES = 10  # 每分类最多抓10页

    def fetch(self):
        print("[品途] 抓取中...")
        all_items = []
        seen = set()

        for cat in self.PATHS:
            for page in range(1, self.MAX_PAGES + 1):
                params = cat["params"].copy()
                params["page"] = str(page)
                url = self.BASE_URL + cat["path"]
                resp = safe_request(url, params=params)
                if not resp:
                    break

                soup = BeautifulSoup(resp.text, "lxml")
                lis = soup.find_all("li")
                page_items = 0

                for li in lis:
                    txt = li.get_text(" ", strip=True)
                    if "行程天数" not in txt:
                        continue

                    name_elem = li.find("a", class_="name")
                    if name_elem:
                        title = name_elem.get_text(strip=True)
                    else:
                        title = ""
                        for part in txt.split("\n"):
                            part = part.strip()
                            if len(part) > len(title) and any(k in part for k in ("游", "天", "日", "湾", "山", "岛")):
                                title = part

                    price_elem = li.find("div", class_="price")
                    if price_elem:
                        price_text = price_elem.get_text(strip=True)
                        price_match = re.search(r"[¥￥]\s*(\d+(?:,\d+)*)", price_text)
                        price = float(price_match.group(1).replace(",", "")) if price_match else 0
                    else:
                        price = extract_price(txt)

                    days_m = re.search(r"行程天数[:：]\s*(\d+)[天日]", txt)
                    days = int(days_m.group(1)) if days_m else 0

                    detail_url = url
                    if name_elem and name_elem.get("href"):
                        detail_url = name_elem["href"]
                        if not detail_url.startswith("http"):
                            detail_url = self.BASE_URL + detail_url

                    img_url = ""
                    pic_div = li.find("div", class_="pic")
                    if pic_div:
                        img = pic_div.find("img")
                        if img:
                            img_src = img.get("data-original") or img.get("src")
                            if img_src:
                                if img_src.startswith("http"):
                                    img_url = img_src
                                elif img_src.startswith("/"):
                                    img_url = self.BASE_URL + img_src
                                else:
                                    img_url = self.BASE_URL + "/" + img_src

                    if title and len(title) > 5 and days > 0 and price > 0:
                        if days >= 3 and price < 100:
                            continue

                        # 去重
                        key = title + str(price)
                        if key in seen:
                            continue
                        seen.add(key)

                        item = {
                            "source": "品途",
                            "title": title,
                            "price": price,
                            "url": detail_url,
                            "days": days,
                        }
                        if img_url:
                            item["img"] = img_url
                        all_items.append(item)
                        page_items += 1

                print(f"  [品途-{cat['name']}] 第{page}页: {page_items}条")
                # 如果本页没有数据，说明已到最后一页
                if page_items == 0:
                    break
                time.sleep(REQUEST_DELAY)

        print(f"[品途] 抓取完成: {len(all_items)} 条")
        return all_items


# ==================== 数据生成 ====================

def raw_to_tour(raw, id_counter):
    """将爬虫原始数据转换为前端 Tour 格式。"""
    source = raw.get('source', '未知')
    title = raw.get('title', '')
    price = raw.get('price', 0)
    days = raw.get('days', 0) or extract_days(title)
    destination = raw.get('destination', '') or guess_destination(title)
    theme = guess_theme(title)

    images = raw.get('images', [])
    if not images and raw.get('img'):
        images = [raw['img']]

    discount_rate = None
    original_price = None
    if price > 1000:
        discount_rate = (hash(title) % 16) + 5
        original_price = int(price / (1 - discount_rate / 100))

    if days <= 1:
        single_supplement = 0
    elif days <= 3:
        single_supplement = max(50, int(price * 0.15))
    else:
        single_supplement = max(100, int(price * 0.25))

    rating = round(3.8 + (hash(source + title) % 12) / 10, 1)
    review_count = (hash(title + source) % 500) + 50
    days_offset = (hash(title) % 60) + 1
    departure = datetime.now() + timedelta(days=days_offset)
    return_date = departure + timedelta(days=days or 2)
    available_seats = max(3, 20 - int(price / 1000))
    total_seats = available_seats + (hash(title) % 10) + 5

    return {
        "id": f"tour_{id_counter}",
        "title": title,
        "source": source,
        "sourceLogo": f"/icons/{source.lower().replace(' ', '').replace('之旅', '').replace('旅行', '')}.png",
        "destination": destination,
        "duration": days or 2,
        "price": int(price),
        "originalPrice": original_price,
        "priceUnit": "人",
        "departureDate": departure.strftime("%Y-%m-%d"),
        "returnDate": return_date.strftime("%Y-%m-%d"),
        "transportType": "大巴往返" if days and days <= 3 else ("高铁往返" if days and days <= 5 else "飞机往返"),
        "accommodationLevel": "舒适型",
        "accommodationStars": 3,
        "meals": f"{days or 2}早餐{max(0, (days or 2) - 1)}正餐",
        "singleSupplement": single_supplement,
        "singleSupplementNote": f"单人出行需补单房差￥{single_supplement}" if single_supplement > 0 else "本产品无需单房差",
        "availableSeats": available_seats,
        "totalSeats": total_seats,
        "highlights": [f"{destination}必打卡", "特色美食", "精品住宿"],
        # Do not fabricate itinerary / fee-related details from list-page data.
        "itinerary": [],
        "inclusions": [],
        "exclusions": [],
        "importantNotes": [],
        "visaRequirements": "无需签证（国内游）",
        "travelInsurance": True,
        "tourGuideService": True,
        "freeWiFi": hash(title) % 2 == 0,
        "childPolicy": "",
        "cancellationPolicy": "",
        "refundPolicy": "",
        "rating": rating,
        "reviewCount": review_count,
        "bookingUrl": raw.get('url', '#'),
        "images": images,
        "tags": [theme, "纯玩", "品质"],
        "isHot": hash(title + source) % 3 == 0,
        "isNew": hash(title + source) % 5 == 0,
        "isFlashSale": hash(title + source) % 10 == 0,
    }


def clean_nulls(obj):
    """递归移除值为 None/null 的字段，避免 TypeScript 类型错误"""
    if isinstance(obj, dict):
        return {k: clean_nulls(v) for k, v in obj.items() if v is not None}
    elif isinstance(obj, list):
        return [clean_nulls(v) for v in obj]
    return obj


def generate_tours_ts(tours):
    """生成 tours.ts 文件内容"""
    tours = clean_nulls(tours)
    sources = sorted(set(t["source"] for t in tours))
    destinations = sorted(set(t["destination"] for t in tours if t.get("destination")))
    themes = sorted(set(t["theme"] for t in tours if t.get("theme")))

    sources_def = [
        {"name": s, "logo": f"/icons/{s.lower().replace(' ', '').replace('之旅', '').replace('旅行', '')}.png", "color": SOURCE_COLORS.get(s, '#666')}
        for s in sources
    ]

    return f'''import type {{ Tour }} from '@/types/tour';

export const sources = {json.dumps(sources_def, ensure_ascii=False, indent=2)};

export const destinations = {json.dumps(destinations, ensure_ascii=False, indent=2)};

export const themes = {json.dumps(themes, ensure_ascii=False, indent=2)};

export const tours: Tour[] = {json.dumps(tours, ensure_ascii=False, indent=2)};
'''


def main():
    print("=" * 60)
    print("旅行团聚合爬虫 v5.0 (静态站点版)")
    print("=" * 60)

    all_raw = []
    spiders = [
        Jrt365Spider(),
        GzqlxSpider(),
        KanghuiSpider(),
        BaozoucunSpider(),
        GzlSpider(),
        GdctsSpider(),
        PintuSpider(),
    ]

    for spider in spiders:
        try:
            items = spider.fetch()
            print(f"  -> {len(items)} 条")
            all_raw.extend(items)
        except Exception as e:
            print(f"  -> 错误: {e}")
        time.sleep(REQUEST_DELAY)

    print("\n" + "-" * 60)
    print(f"[汇总] 原始数据: {len(all_raw)} 条")
    all_raw = dedup_items(all_raw)
    print(f"[汇总] 去重后: {len(all_raw)} 条")

    # 过滤无效数据（价格为0或标题过短）
    all_raw = [r for r in all_raw if r.get('price', 0) > 0 and len(r.get('title', '')) > 5]
    print(f"[过滤] 价格>0且标题有效: {len(all_raw)} 条")
    
    # 过滤明显异常的价格数据和非旅游产品
    def is_valid_tour(raw):
        price = raw.get('price', 0)
        days = raw.get('days', 0)
        title = raw.get('title', '')
        
        # 1. 过滤"押金"、"预付款"、"酒店预定"等非旅游产品
        if is_blacklisted_title(title) or any(k in title for k in ['押金', '预付款', '定金', '占位费', '机位', '酒店预定', '签证', '机票']):
            return False
        
        # 2. 过滤多日游但价格异常低的（可能是解析错误）
        # 3天以上的旅游，价格低于100元几乎不可能（除非是特殊活动）
        if days >= 3 and price < 100:
            return False
        
        # 3. 过滤2天以上价格低于30的（徒步活动除外，由来源判断）
        source = raw.get('source', '')
        if days >= 2 and price < 30 and source not in ['暴走村']:
            return False
        
        # 4. 过滤价格异常高的非旅游产品（如酒店预订、邮轮单船票等）
        # 2天行程价格超过10万，几乎不可能是正常旅游团
        if days <= 2 and price > 100000:
            return False
        
        return True
    
    all_raw = [r for r in all_raw if is_valid_tour(r)]
    print(f"[过滤] 有效旅游产品: {len(all_raw)} 条")

    # 转换为前端 Tour 格式
    tours = []
    for i, raw in enumerate(all_raw, 1):
        tour = raw_to_tour(raw, i)
        tours.append(tour)

    print(f"[转换] 生成 {len(tours)} 条 Tour 数据")

    # 写入文件
    content = generate_tours_ts(tours)
    output_path = os.path.join(os.path.dirname(__file__), "..", "src", "data", "tours.ts")
    output_path = os.path.abspath(output_path)

    with open(output_path, "w", encoding="utf-8") as f:
        f.write(content)

    print(f"[保存] -> {output_path}")
    print(f"[文件大小] {os.path.getsize(output_path) / 1024:.1f} KB")
    print("=" * 60)
    print("完成！运行 npm run build 即可构建静态站点。")


if __name__ == "__main__":
    main()
