"""
旅行团数据爬虫示例

用途：从旅行网站抓取数据，输出 JSON 供前端使用

使用方式：
    1. 复制此文件为 scripts/crawler.py
    2. 根据目标网站修改爬取逻辑
    3. 安装依赖：pip install requests beautifulsoup4
    4. 运行：python scripts/crawler.py
    5. 将输出写入 src/data/tours.ts（或通过 fetch-data.js 中转）

输出格式：
    打印 JSON 数组到 stdout，每个元素是一个 Tour 对象
"""

import json
import sys
from datetime import datetime, timedelta
import random


def generate_mock_tours(count=50):
    """
    示例：生成模拟数据
    替换为实际的爬虫逻辑
    """
    sources = ['假日通', '广州去旅行', '康辉', '暴走村', '广之旅', '广东中旅', '品途']
    destinations = ['桂林', '三亚', '云南', '张家界', '西藏', '新疆', '厦门', '西安']
    themes = ['自然风光', '古镇文化', '海岛度假', '美食之旅', '亲子游']

    tours = []
    for i in range(count):
        source = random.choice(sources)
        dest = random.choice(destinations)
        duration = random.randint(2, 7)
        base_price = random.randint(500, 4000)
        discount = random.choice([None, random.randint(5, 30)])
        price = int(base_price * (1 - discount / 100)) if discount else base_price

        departure = datetime.now() + timedelta(days=random.randint(7, 90))

        tours.append({
            "id": f"tour_{i + 1}",
            "title": f"{dest}{duration}日{random.choice(themes)}·品质之选",
            "source": source,
            "sourceLogo": f"/icons/{source.lower().replace(' ', '-')}.png",
            "destination": dest,
            "duration": duration,
            "price": price,
            "originalPrice": base_price if discount else None,
            "priceUnit": "人",
            "departureDate": departure.strftime("%Y-%m-%d"),
            "returnDate": (departure + timedelta(days=duration)).strftime("%Y-%m-%d"),
            "transportType": random.choice(["高铁往返", "飞机往返", "大巴往返"]),
            "accommodationLevel": random.choice(["经济型", "舒适型", "高档型", "豪华型"]),
            "accommodationStars": random.randint(2, 5),
            "meals": f"{duration}早餐{duration - 1}正餐",
            "singleSupplement": int(base_price * 0.25),
            "singleSupplementNote": f"单人出行需补单房差￥{int(base_price * 0.25)}",
            "availableSeats": random.randint(1, 30),
            "totalSeats": random.randint(15, 50),
            "highlights": [f"{dest}必打卡", "特色美食", "精品住宿"],
            "itinerary": [
                {
                    "day": d + 1,
                    "title": f"第{d + 1}天行程",
                    "description": f"游览{dest}著名景点",
                    "meals": ["早餐", "午餐"],
                    "accommodation": "当地酒店",
                    "activities": ["景点游览", "自由活动"]
                }
                for d in range(duration)
            ],
            "inclusions": ["往返交通", "酒店住宿", "景点门票", "导游服务"],
            "exclusions": ["个人消费", "单房差", "自费项目"],
            "importantNotes": ["请携带身份证", "行程可能调整"],
            "visaRequirements": "无需签证（国内游）",
            "travelInsurance": True,
            "tourGuideService": True,
            "freeWiFi": random.choice([True, False]),
            "childPolicy": "2-12岁儿童不占床享半价",
            "cancellationPolicy": "出发前7天可无损退改",
            "refundPolicy": "未消费项目按实结算退还",
            "rating": round(random.uniform(3.5, 5.0), 1),
            "reviewCount": random.randint(10, 1000),
            "bookingUrl": "#",
            "images": [],
            "tags": [random.choice(themes), "纯玩", "品质"],
            "isHot": random.random() > 0.6,
            "isNew": random.random() > 0.7,
            "isFlashSale": random.random() > 0.9,
            "discountRate": discount,
            "groupSize": random.choice(["15人精品团", "30人常规团", "50人大团"]),
            "theme": random.choice(themes),
            "suitableFor": ["亲子", "情侣"],
            "difficulty": random.choice(["休闲", "轻松", "适中"]),
            "season": random.choice(["春季", "夏季", "秋季", "冬季", "全年"]),
            "language": "中文导游",
            "createdAt": datetime.now().isoformat(),
            "updatedAt": datetime.now().isoformat(),
        })

    return tours


def crawl_jiari_tong():
    """
    示例：爬取假日通网站（需根据实际网站结构修改）
    """
    # import requests
    # from bs4 import BeautifulSoup
    #
    # url = "https://www.jrt365.com/tours"
    # headers = {"User-Agent": "Mozilla/5.0"}
    # res = requests.get(url, headers=headers)
    # soup = BeautifulSoup(res.text, "html.parser")
    #
    # tours = []
    # for item in soup.select(".tour-item"):
    #     tours.append({
    #         "title": item.select_one(".title").text.strip(),
    #         "price": int(item.select_one(".price").text.replace("¥", "")),
    #         ...
    #     })
    # return tours
    pass


if __name__ == "__main__":
    # 默认输出模拟数据到 stdout
    # CI 中可以通过管道写入文件：python scripts/crawler.py > data/tours.json
    tours = generate_mock_tours(30)
    print(json.dumps(tours, ensure_ascii=False, indent=2))
