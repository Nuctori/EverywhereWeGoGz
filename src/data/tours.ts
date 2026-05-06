import type { Tour } from '@/types/tour';

export const sources = [
  {
    "name": "假日通",
    "logo": "/icons/假日通.png",
    "color": "#FF6B35"
  },
  {
    "name": "品途",
    "logo": "/icons/品途.png",
    "color": "#3A86FF"
  },
  {
    "name": "广之旅",
    "logo": "/icons/广.png",
    "color": "#FF006E"
  }
];

export const destinations = [
  "三亚",
  "云南",
  "其他",
  "北京",
  "四川",
  "广东",
  "张家界",
  "新疆",
  "桂林",
  "贵州"
];

export const themes = [
  "亲子游",
  "冰雪世界",
  "古镇文化",
  "户外徒步",
  "摄影之旅",
  "民族风情",
  "海岛度假",
  "美食之旅",
  "自然风光"
];

export const tours: Tour[] = [
  {
    "id": "tour_1",
    "title": "惠州双湾盐洲岛温泉联游3天 【占床小童】-1.2米以下小童，只含车位，其余不含\n【不占床小童】-1.2-1.5米小童，含2早+温泉+车位，其余自理",
    "source": "假日通",
    "sourceLogo": "/icons/假日通.png",
    "destination": "其他",
    "duration": 3,
    "price": 399,
    "priceUnit": "人",
    "departureDate": "2026-06-15",
    "returnDate": "2026-06-18",
    "transportType": "大巴往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "3早餐2正餐",
    "singleSupplement": 99,
    "singleSupplementNote": "单人出行需补单房差￥99，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 26,
    "totalSeats": 31,
    "highlights": [
      "其他必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往其他",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "告别其他，返回温馨的家",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.9,
    "reviewCount": 317,
    "bookingUrl": "http://www.jrt365.com",
    "images": [],
    "tags": [
      "海岛度假",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "海岛度假",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.452747",
    "updatedAt": "2026-05-07T01:02:13.452747"
  },
  {
    "id": "tour_2",
    "title": "佛冈聚龙湾2天(食2餐) 【含餐：1早餐+1晚餐】【不占床】-1.2米以下，只含车位，其余不含",
    "source": "假日通",
    "sourceLogo": "/icons/假日通.png",
    "destination": "其他",
    "duration": 2,
    "price": 299,
    "priceUnit": "人",
    "departureDate": "2026-07-12",
    "returnDate": "2026-07-14",
    "transportType": "大巴往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "2早餐1正餐",
    "singleSupplement": 74,
    "singleSupplementNote": "单人出行需补单房差￥74，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 8,
    "totalSeats": 38,
    "highlights": [
      "其他必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往其他",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "告别其他，返回温馨的家",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 3.8,
    "reviewCount": 75,
    "bookingUrl": "http://www.jrt365.com",
    "images": [],
    "tags": [
      "自然风光",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "自然风光",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.452747",
    "updatedAt": "2026-05-07T01:02:13.452747"
  },
  {
    "id": "tour_3",
    "title": "龙门云顶温泉3天(雅泡) 【直通车赠送入住当天自助午餐简餐】\n【占床小孩】-1.2米以下只占车位，产生费用自理  \n【不占床小孩】：1.2-1.5(含)米小孩：只含车位+早+温泉+D1午餐简餐",
    "source": "假日通",
    "sourceLogo": "/icons/假日通.png",
    "destination": "其他",
    "duration": 3,
    "price": 489,
    "priceUnit": "人",
    "departureDate": "2026-06-15",
    "returnDate": "2026-06-18",
    "transportType": "大巴往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "3早餐2正餐",
    "singleSupplement": 122,
    "singleSupplementNote": "单人出行需补单房差￥122，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 9,
    "totalSeats": 39,
    "highlights": [
      "其他必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往其他",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "告别其他，返回温馨的家",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 3.6,
    "reviewCount": 152,
    "bookingUrl": "http://www.jrt365.com",
    "images": [],
    "tags": [
      "海岛度假",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "海岛度假",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.452747",
    "updatedAt": "2026-05-07T01:02:13.452747"
  },
  {
    "id": "tour_4",
    "title": "从化卓思道2天(食2餐) 【专场日限量免升泡池房】【不占床小孩】- 只含车位，其余不含；",
    "source": "假日通",
    "sourceLogo": "/icons/假日通.png",
    "destination": "其他",
    "duration": 2,
    "price": 299,
    "priceUnit": "人",
    "departureDate": "2026-08-04",
    "returnDate": "2026-08-06",
    "transportType": "大巴往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "2早餐1正餐",
    "singleSupplement": 74,
    "singleSupplementNote": "单人出行需补单房差￥74，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 25,
    "totalSeats": 40,
    "highlights": [
      "其他必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往其他",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "告别其他，返回温馨的家",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.5,
    "reviewCount": 622,
    "bookingUrl": "http://www.jrt365.com",
    "images": [],
    "tags": [
      "自然风光",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": true,
    "isFlashSale": true,
    "groupSize": "30人常规团",
    "theme": "自然风光",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.452747",
    "updatedAt": "2026-05-07T01:02:13.452747"
  },
  {
    "id": "tour_5",
    "title": "清远恒大酒店2天(双自助餐) 【不占床】-1.2米以下，只含车位，其余不含",
    "source": "假日通",
    "sourceLogo": "/icons/假日通.png",
    "destination": "其他",
    "duration": 2,
    "price": 299,
    "priceUnit": "人",
    "departureDate": "2026-06-06",
    "returnDate": "2026-06-08",
    "transportType": "大巴往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "2早餐1正餐",
    "singleSupplement": 74,
    "singleSupplementNote": "单人出行需补单房差￥74，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 9,
    "totalSeats": 39,
    "highlights": [
      "其他必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往其他",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "告别其他，返回温馨的家",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.2,
    "reviewCount": 482,
    "bookingUrl": "http://www.jrt365.com",
    "images": [],
    "tags": [
      "自然风光",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "自然风光",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.453747",
    "updatedAt": "2026-05-07T01:02:13.453747"
  },
  {
    "id": "tour_6",
    "title": "美林湖温泉度假2天(双园) 【逢周日至四入住，赠送退房日简易午餐~】【不占床小童】-1.2米以下，只含车位，其余不含(温泉和用餐免)",
    "source": "假日通",
    "sourceLogo": "/icons/假日通.png",
    "destination": "其他",
    "duration": 2,
    "price": 379,
    "priceUnit": "人",
    "departureDate": "2026-06-20",
    "returnDate": "2026-06-22",
    "transportType": "大巴往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "2早餐1正餐",
    "singleSupplement": 94,
    "singleSupplementNote": "单人出行需补单房差￥94，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 6,
    "totalSeats": 41,
    "highlights": [
      "其他必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往其他",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "告别其他，返回温馨的家",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.1,
    "reviewCount": 389,
    "bookingUrl": "http://www.jrt365.com",
    "images": [],
    "tags": [
      "海岛度假",
      "纯玩",
      "品质"
    ],
    "isHot": true,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "海岛度假",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.453747",
    "updatedAt": "2026-05-07T01:02:13.453747"
  },
  {
    "id": "tour_7",
    "title": "龙门云顶2天(威士忌畔山) 【直通车赠送入住当天自助午餐简餐】\n【占床小孩】-1.2米以下只占车位，产生费用自理  \n【不占床小孩】：1.2-1.5(含)米小孩：只含车位+早餐+温泉+D1午餐简餐",
    "source": "假日通",
    "sourceLogo": "/icons/假日通.png",
    "destination": "其他",
    "duration": 2,
    "price": 299,
    "priceUnit": "人",
    "departureDate": "2026-06-04",
    "returnDate": "2026-06-06",
    "transportType": "大巴往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "2早餐1正餐",
    "singleSupplement": 74,
    "singleSupplementNote": "单人出行需补单房差￥74，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 16,
    "totalSeats": 41,
    "highlights": [
      "其他必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往其他",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "告别其他，返回温馨的家",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 3.6,
    "reviewCount": 357,
    "bookingUrl": "http://www.jrt365.com",
    "images": [],
    "tags": [
      "海岛度假",
      "纯玩",
      "品质"
    ],
    "isHot": true,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "海岛度假",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.453747",
    "updatedAt": "2026-05-07T01:02:13.453747"
  },
  {
    "id": "tour_8",
    "title": "双月湾度假村3天 【不占床小童】-只含车位，其他自理",
    "source": "假日通",
    "sourceLogo": "/icons/假日通.png",
    "destination": "其他",
    "duration": 3,
    "price": 259,
    "priceUnit": "人",
    "departureDate": "2026-08-04",
    "returnDate": "2026-08-07",
    "transportType": "大巴往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "3早餐2正餐",
    "singleSupplement": 64,
    "singleSupplementNote": "单人出行需补单房差￥64，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 26,
    "totalSeats": 36,
    "highlights": [
      "其他必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往其他",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "告别其他，返回温馨的家",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.7,
    "reviewCount": 594,
    "bookingUrl": "http://www.jrt365.com",
    "images": [],
    "tags": [
      "自然风光",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "自然风光",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.453747",
    "updatedAt": "2026-05-07T01:02:13.453747"
  },
  {
    "id": "tour_9",
    "title": "玉林璟象九龙温泉星级3天 【不占床】—1.2米以下，只含车位，其余自理",
    "source": "假日通",
    "sourceLogo": "/icons/假日通.png",
    "destination": "其他",
    "duration": 3,
    "price": 599,
    "priceUnit": "人",
    "departureDate": "2026-06-02",
    "returnDate": "2026-06-05",
    "transportType": "大巴往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "3早餐2正餐",
    "singleSupplement": 149,
    "singleSupplementNote": "单人出行需补单房差￥149，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 12,
    "totalSeats": 37,
    "highlights": [
      "其他必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往其他",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "告别其他，返回温馨的家",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.8,
    "reviewCount": 776,
    "bookingUrl": "http://www.jrt365.com",
    "images": [],
    "tags": [
      "海岛度假",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "海岛度假",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.453747",
    "updatedAt": "2026-05-07T01:02:13.453747"
  },
  {
    "id": "tour_10",
    "title": "龙门温德姆温泉2天(新) 【不占床小孩】-1.2-1.5米含早+车位+多次温泉，超高自理\n【占床小孩】-1.2米以下只占车位，产生费用自理",
    "source": "假日通",
    "sourceLogo": "/icons/假日通.png",
    "destination": "其他",
    "duration": 2,
    "price": 299,
    "priceUnit": "人",
    "departureDate": "2026-06-09",
    "returnDate": "2026-06-11",
    "transportType": "大巴往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "2早餐1正餐",
    "singleSupplement": 74,
    "singleSupplementNote": "单人出行需补单房差￥74，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 16,
    "totalSeats": 46,
    "highlights": [
      "其他必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往其他",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "告别其他，返回温馨的家",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 3.7,
    "reviewCount": 22,
    "bookingUrl": "http://www.jrt365.com",
    "images": [],
    "tags": [
      "海岛度假",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "海岛度假",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.453747",
    "updatedAt": "2026-05-07T01:02:13.453747"
  },
  {
    "id": "tour_11",
    "title": "英德宝墩湖温泉3天(食6餐) 【食足6餐（2正2早2下午茶）】\n【不占床】-1.2米以下只占车位，其余自理",
    "source": "假日通",
    "sourceLogo": "/icons/假日通.png",
    "destination": "其他",
    "duration": 3,
    "price": 399,
    "priceUnit": "人",
    "departureDate": "2026-07-08",
    "returnDate": "2026-07-11",
    "transportType": "大巴往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "3早餐2正餐",
    "singleSupplement": 99,
    "singleSupplementNote": "单人出行需补单房差￥99，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 5,
    "totalSeats": 40,
    "highlights": [
      "其他必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往其他",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "告别其他，返回温馨的家",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.3,
    "reviewCount": 678,
    "bookingUrl": "http://www.jrt365.com",
    "images": [],
    "tags": [
      "海岛度假",
      "纯玩",
      "品质"
    ],
    "isHot": true,
    "isNew": true,
    "isFlashSale": true,
    "groupSize": "30人常规团",
    "theme": "海岛度假",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.453747",
    "updatedAt": "2026-05-07T01:02:13.453747"
  },
  {
    "id": "tour_12",
    "title": "新丰雅致温德姆双泉联游3天(含餐) 【含餐：2早+1晚+2宵夜+1下午茶】【不占床】-1.2米以下，只含车位，其余不含；",
    "source": "假日通",
    "sourceLogo": "/icons/假日通.png",
    "destination": "其他",
    "duration": 3,
    "price": 589,
    "priceUnit": "人",
    "departureDate": "2026-05-23",
    "returnDate": "2026-05-26",
    "transportType": "大巴往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "3早餐2正餐",
    "singleSupplement": 147,
    "singleSupplementNote": "单人出行需补单房差￥147，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 26,
    "totalSeats": 46,
    "highlights": [
      "其他必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往其他",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "告别其他，返回温馨的家",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.2,
    "reviewCount": 619,
    "bookingUrl": "http://www.jrt365.com",
    "images": [],
    "tags": [
      "自然风光",
      "纯玩",
      "品质"
    ],
    "isHot": true,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "自然风光",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.453747",
    "updatedAt": "2026-05-07T01:02:13.453747"
  },
  {
    "id": "tour_13",
    "title": "台山那琴纯玩3天 【此团60岁以上长者更优惠】\n【占床小孩】-1.2米以下只占车位，其余不含\n【不占床小孩】-1.2-1.49米只含车位+景点门票，其余不含",
    "source": "假日通",
    "sourceLogo": "/icons/假日通.png",
    "destination": "其他",
    "duration": 3,
    "price": 339,
    "priceUnit": "人",
    "departureDate": "2026-06-12",
    "returnDate": "2026-06-15",
    "transportType": "大巴往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "3早餐2正餐",
    "singleSupplement": 84,
    "singleSupplementNote": "单人出行需补单房差￥84，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 5,
    "totalSeats": 40,
    "highlights": [
      "其他必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往其他",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "告别其他，返回温馨的家",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.0,
    "reviewCount": 53,
    "bookingUrl": "http://www.jrt365.com",
    "images": [],
    "tags": [
      "自然风光",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": true,
    "isFlashSale": true,
    "groupSize": "30人常规团",
    "theme": "自然风光",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.453747",
    "updatedAt": "2026-05-07T01:02:13.453747"
  },
  {
    "id": "tour_14",
    "title": "汕尾红海湾3天 【不占床】-只含车位+餐，不含床位",
    "source": "假日通",
    "sourceLogo": "/icons/假日通.png",
    "destination": "其他",
    "duration": 3,
    "price": 368,
    "priceUnit": "人",
    "departureDate": "2026-05-21",
    "returnDate": "2026-05-24",
    "transportType": "大巴往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "3早餐2正餐",
    "singleSupplement": 92,
    "singleSupplementNote": "单人出行需补单房差￥92，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 25,
    "totalSeats": 35,
    "highlights": [
      "其他必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往其他",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "告别其他，返回温馨的家",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 3.5,
    "reviewCount": 764,
    "bookingUrl": "http://www.jrt365.com",
    "images": [],
    "tags": [
      "自然风光",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": true,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "自然风光",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.453747",
    "updatedAt": "2026-05-07T01:02:13.453747"
  },
  {
    "id": "tour_15",
    "title": "尊品恩施（湖北）双飞5天 真纯玩•独家策划•含门票:总价值661元/人\n舒适旅程：2晚豪华酒店+1晚住在风景里+1晚升级超豪华酒店",
    "source": "假日通",
    "sourceLogo": "/icons/假日通.png",
    "destination": "其他",
    "duration": 5,
    "price": 2939,
    "originalPrice": 3540,
    "priceUnit": "人",
    "departureDate": "2026-06-19",
    "returnDate": "2026-06-24",
    "transportType": "高铁往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "5早餐4正餐",
    "singleSupplement": 734,
    "singleSupplementNote": "单人出行需补单房差￥734，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 21,
    "totalSeats": 46,
    "highlights": [
      "其他必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往其他",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "告别其他，返回温馨的家",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.0,
    "reviewCount": 448,
    "bookingUrl": "http://www.jrt365.com",
    "images": [],
    "tags": [
      "自然风光",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "discountRate": 17,
    "groupSize": "30人常规团",
    "theme": "自然风光",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.453747",
    "updatedAt": "2026-05-07T01:02:13.453747"
  },
  {
    "id": "tour_16",
    "title": "尊品全景湖南高铁4天 不占床小童：（身高1.2-1.39米）：含往返高铁/动车票二等座半票（限年满6周岁且未满14周岁）、当地车位、半价餐、导服、首道门票半票（身高1.4米[含]起超高），不含床位，超高产生任何费用，请自理。 备注：儿童如需按成人价报名，不退任何优惠。   \n\n婴儿：（身高0-1.19米）含当地车位、导服，不含往返高铁/动车票、不占床位、不含餐、不含门票，产生费用请自理。",
    "source": "假日通",
    "sourceLogo": "/icons/假日通.png",
    "destination": "其他",
    "duration": 4,
    "price": 1799,
    "priceUnit": "人",
    "departureDate": "2026-07-25",
    "returnDate": "2026-07-29",
    "transportType": "高铁往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "4早餐3正餐",
    "singleSupplement": 449,
    "singleSupplementNote": "单人出行需补单房差￥449，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 15,
    "totalSeats": 45,
    "highlights": [
      "其他必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往其他",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "告别其他，返回温馨的家",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.8,
    "reviewCount": 51,
    "bookingUrl": "http://www.jrt365.com",
    "images": [],
    "tags": [
      "亲子游",
      "纯玩",
      "品质"
    ],
    "isHot": true,
    "isNew": true,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "亲子游",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.453747",
    "updatedAt": "2026-05-07T01:02:13.453747"
  },
  {
    "id": "tour_17",
    "title": "云洛甘南 双飞8天 【精选住宿】升级2晚4钻网评酒店。\n【画卷甘南】碧水丹霞、飞瀑流泉、原始森林…每一步都像走在油画里。",
    "source": "假日通",
    "sourceLogo": "/icons/假日通.png",
    "destination": "其他",
    "duration": 8,
    "price": 3999,
    "originalPrice": 4937,
    "priceUnit": "人",
    "departureDate": "2026-07-16",
    "returnDate": "2026-07-24",
    "transportType": "飞机往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "8早餐7正餐",
    "singleSupplement": 999,
    "singleSupplementNote": "单人出行需补单房差￥999，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 16,
    "totalSeats": 41,
    "highlights": [
      "其他必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往其他",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "第5天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 6,
        "title": "第6天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 7,
        "title": "第7天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 8,
        "title": "告别其他，返回温馨的家",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 3.9,
    "reviewCount": 692,
    "bookingUrl": "http://www.jrt365.com",
    "images": [],
    "tags": [
      "自然风光",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "discountRate": 19,
    "groupSize": "30人常规团",
    "theme": "自然风光",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.453747",
    "updatedAt": "2026-05-07T01:02:13.453747"
  },
  {
    "id": "tour_18",
    "title": "新丰云天海温泉2天（含餐） 【含餐：1早+1简易午餐+赠送1宵夜】【不占床小童】-1.3米(含)-1.5米以下含车位+早+多次门票；【占床小童】-1.3米以下只含车位，其余不含",
    "source": "假日通",
    "sourceLogo": "/icons/假日通.png",
    "destination": "其他",
    "duration": 2,
    "price": 229,
    "priceUnit": "人",
    "departureDate": "2026-07-23",
    "returnDate": "2026-07-25",
    "transportType": "大巴往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "2早餐1正餐",
    "singleSupplement": 57,
    "singleSupplementNote": "单人出行需补单房差￥57，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 28,
    "totalSeats": 43,
    "highlights": [
      "其他必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往其他",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "告别其他，返回温馨的家",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 3.5,
    "reviewCount": 589,
    "bookingUrl": "http://www.jrt365.com",
    "images": [],
    "tags": [
      "海岛度假",
      "纯玩",
      "品质"
    ],
    "isHot": true,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "海岛度假",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.453747",
    "updatedAt": "2026-05-07T01:02:13.453747"
  },
  {
    "id": "tour_19",
    "title": "佛山樵玥度假酒店3天（食4餐） 【不占床】-1.2米以下，只含车位，其余不含",
    "source": "假日通",
    "sourceLogo": "/icons/假日通.png",
    "destination": "其他",
    "duration": 3,
    "price": 399,
    "priceUnit": "人",
    "departureDate": "2026-05-20",
    "returnDate": "2026-05-23",
    "transportType": "大巴往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "3早餐2正餐",
    "singleSupplement": 99,
    "singleSupplementNote": "单人出行需补单房差￥99，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 5,
    "totalSeats": 30,
    "highlights": [
      "其他必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往其他",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "告别其他，返回温馨的家",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.3,
    "reviewCount": 218,
    "bookingUrl": "http://www.jrt365.com",
    "images": [],
    "tags": [
      "自然风光",
      "纯玩",
      "品质"
    ],
    "isHot": true,
    "isNew": true,
    "isFlashSale": true,
    "groupSize": "30人常规团",
    "theme": "自然风光",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.453747",
    "updatedAt": "2026-05-07T01:02:13.453747"
  },
  {
    "id": "tour_20",
    "title": "赣州双古城江茂漫谷联游3天 【不占床小孩】-1.2-1.4米，只含车位+2早1正+温泉门票，其余自理。 \n【占床小孩】-1.2米以下，只占车位，其余自理。",
    "source": "假日通",
    "sourceLogo": "/icons/假日通.png",
    "destination": "其他",
    "duration": 3,
    "price": 499,
    "priceUnit": "人",
    "departureDate": "2026-05-15",
    "returnDate": "2026-05-18",
    "transportType": "大巴往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "3早餐2正餐",
    "singleSupplement": 124,
    "singleSupplementNote": "单人出行需补单房差￥124，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 9,
    "totalSeats": 39,
    "highlights": [
      "其他必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往其他",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "告别其他，返回温馨的家",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 3.8,
    "reviewCount": 504,
    "bookingUrl": "http://www.jrt365.com",
    "images": [],
    "tags": [
      "海岛度假",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "海岛度假",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.453747",
    "updatedAt": "2026-05-07T01:02:13.453747"
  },
  {
    "id": "tour_21",
    "title": "中山国际江门美食2天(含餐) 【不占床】-1.1米以下，只含车位，早餐和晚餐免；",
    "source": "假日通",
    "sourceLogo": "/icons/假日通.png",
    "destination": "其他",
    "duration": 2,
    "price": 399,
    "priceUnit": "人",
    "departureDate": "2026-05-15",
    "returnDate": "2026-05-17",
    "transportType": "大巴往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "2早餐1正餐",
    "singleSupplement": 99,
    "singleSupplementNote": "单人出行需补单房差￥99，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 27,
    "totalSeats": 47,
    "highlights": [
      "其他必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往其他",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "告别其他，返回温馨的家",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.6,
    "reviewCount": 563,
    "bookingUrl": "http://www.jrt365.com",
    "images": [],
    "tags": [
      "美食之旅",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "美食之旅",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.453747",
    "updatedAt": "2026-05-07T01:02:13.453747"
  },
  {
    "id": "tour_22",
    "title": "汝城双五星温泉3天(食4餐). 【不占床小孩】-1.2米以下，只含车位，其余自理。",
    "source": "假日通",
    "sourceLogo": "/icons/假日通.png",
    "destination": "其他",
    "duration": 3,
    "price": 599,
    "priceUnit": "人",
    "departureDate": "2026-06-08",
    "returnDate": "2026-06-11",
    "transportType": "大巴往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "3早餐2正餐",
    "singleSupplement": 149,
    "singleSupplementNote": "单人出行需补单房差￥149，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 17,
    "totalSeats": 37,
    "highlights": [
      "其他必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往其他",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "告别其他，返回温馨的家",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.9,
    "reviewCount": 261,
    "bookingUrl": "http://www.jrt365.com",
    "images": [],
    "tags": [
      "海岛度假",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "海岛度假",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.453747",
    "updatedAt": "2026-05-07T01:02:13.453747"
  },
  {
    "id": "tour_23",
    "title": "穿越惠州摄海五星2天(食4餐) 【占床小童】-1.2米以下小童，只占车位，其余自理\n【不占床小童】-1.2-1.4米小童，含2正1早1宵夜+车位，其余不含",
    "source": "假日通",
    "sourceLogo": "/icons/假日通.png",
    "destination": "其他",
    "duration": 2,
    "price": 399,
    "priceUnit": "人",
    "departureDate": "2026-05-27",
    "returnDate": "2026-05-29",
    "transportType": "大巴往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "2早餐1正餐",
    "singleSupplement": 99,
    "singleSupplementNote": "单人出行需补单房差￥99，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 23,
    "totalSeats": 43,
    "highlights": [
      "其他必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往其他",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "告别其他，返回温馨的家",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 3.7,
    "reviewCount": 323,
    "bookingUrl": "http://www.jrt365.com",
    "images": [],
    "tags": [
      "户外徒步",
      "纯玩",
      "品质"
    ],
    "isHot": true,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "户外徒步",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.453747",
    "updatedAt": "2026-05-07T01:02:13.453747"
  },
  {
    "id": "tour_24",
    "title": "天边草原（秀美川河盖）动车5天 520感恩钜献！安排红军换装体验！走进60-70那个年代主题街区•重温峥嵘岁月！\n全景网红深度游！悬崖温泉+茶峒边城+星空川河盖！",
    "source": "假日通",
    "sourceLogo": "/icons/假日通.png",
    "destination": "其他",
    "duration": 5,
    "price": 1159,
    "priceUnit": "人",
    "departureDate": "2026-06-27",
    "returnDate": "2026-07-02",
    "transportType": "高铁往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "5早餐4正餐",
    "singleSupplement": 289,
    "singleSupplementNote": "单人出行需补单房差￥289，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 29,
    "totalSeats": 49,
    "highlights": [
      "其他必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往其他",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "告别其他，返回温馨的家",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.5,
    "reviewCount": 688,
    "bookingUrl": "http://www.jrt365.com",
    "images": [],
    "tags": [
      "海岛度假",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "海岛度假",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.453747",
    "updatedAt": "2026-05-07T01:02:13.453747"
  },
  {
    "id": "tour_25",
    "title": "【越出色】越南河内+下龙湾纯玩双动5天 【该产品为非即时确认产品，下单后客服会核实是否有位，核实无误后即可支付】\n【系统价格未含签小680元/人】",
    "source": "假日通",
    "sourceLogo": "/icons/假日通.png",
    "destination": "其他",
    "duration": 5,
    "price": 1199,
    "originalPrice": 1557,
    "priceUnit": "人",
    "departureDate": "2026-06-29",
    "returnDate": "2026-07-04",
    "transportType": "高铁往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "5早餐4正餐",
    "singleSupplement": 299,
    "singleSupplementNote": "单人出行需补单房差￥299，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 28,
    "totalSeats": 33,
    "highlights": [
      "其他必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往其他",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "告别其他，返回温馨的家",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.4,
    "reviewCount": 541,
    "bookingUrl": "http://www.jrt365.com",
    "images": [],
    "tags": [
      "自然风光",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "discountRate": 23,
    "groupSize": "30人常规团",
    "theme": "自然风光",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.453747",
    "updatedAt": "2026-05-07T01:02:13.453747"
  },
  {
    "id": "tour_26",
    "title": "韶关蓝山源温泉3天(食3餐) 【食3餐=含酒店1正+2自助早】\n【不占床小孩】-1.1-1.4米含车位+2早1正，其余不含   \n【占床小孩】-1.1米以下只占车位，其余不含",
    "source": "假日通",
    "sourceLogo": "/icons/假日通.png",
    "destination": "其他",
    "duration": 3,
    "price": 499,
    "priceUnit": "人",
    "departureDate": "2026-07-20",
    "returnDate": "2026-07-23",
    "transportType": "大巴往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "3早餐2正餐",
    "singleSupplement": 124,
    "singleSupplementNote": "单人出行需补单房差￥124，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 7,
    "totalSeats": 37,
    "highlights": [
      "其他必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往其他",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "告别其他，返回温馨的家",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.6,
    "reviewCount": 616,
    "bookingUrl": "http://www.jrt365.com",
    "images": [],
    "tags": [
      "海岛度假",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "海岛度假",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.453747",
    "updatedAt": "2026-05-07T01:02:13.453747"
  },
  {
    "id": "tour_27",
    "title": "莽山森林温泉3天 【不占床】-1.2-1.4米，含车位+1正2早+温泉门票，其余不含\n【占床】-1.2米以下，含车位+餐，温泉门票免费，其余不含",
    "source": "假日通",
    "sourceLogo": "/icons/假日通.png",
    "destination": "其他",
    "duration": 3,
    "price": 699,
    "priceUnit": "人",
    "departureDate": "2026-07-19",
    "returnDate": "2026-07-22",
    "transportType": "大巴往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "3早餐2正餐",
    "singleSupplement": 174,
    "singleSupplementNote": "单人出行需补单房差￥174，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 9,
    "totalSeats": 39,
    "highlights": [
      "其他必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往其他",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "告别其他，返回温馨的家",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 3.8,
    "reviewCount": 338,
    "bookingUrl": "http://www.jrt365.com",
    "images": [],
    "tags": [
      "海岛度假",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "海岛度假",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.453747",
    "updatedAt": "2026-05-07T01:02:13.453747"
  },
  {
    "id": "tour_28",
    "title": "爽爽云冰连州温德姆3天 【不占床】-1.2米以下，只含车位，其余不含",
    "source": "假日通",
    "sourceLogo": "/icons/假日通.png",
    "destination": "其他",
    "duration": 3,
    "price": 499,
    "priceUnit": "人",
    "departureDate": "2026-06-17",
    "returnDate": "2026-06-20",
    "transportType": "大巴往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "3早餐2正餐",
    "singleSupplement": 124,
    "singleSupplementNote": "单人出行需补单房差￥124，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 19,
    "totalSeats": 39,
    "highlights": [
      "其他必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往其他",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "告别其他，返回温馨的家",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.0,
    "reviewCount": 757,
    "bookingUrl": "http://www.jrt365.com",
    "images": [],
    "tags": [
      "冰雪世界",
      "纯玩",
      "品质"
    ],
    "isHot": true,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "冰雪世界",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.453747",
    "updatedAt": "2026-05-07T01:02:13.453747"
  },
  {
    "id": "tour_29",
    "title": "泉暖温汤旅居纯玩高铁5天 不占床小童：（年满6周岁--未满14周岁）含当地旅游车位、往返高铁票二等座半票、半价餐、导服、首道门票半票（身高1.4米[含]起超高），不含床位，超高产生任何费用，请自理。 婴儿：（6周岁以下）含当地车位、导服、半价正餐，不含往返高铁票、不占床位、不含早餐、不含门票，产生费用请自理。",
    "source": "假日通",
    "sourceLogo": "/icons/假日通.png",
    "destination": "其他",
    "duration": 5,
    "price": 2099,
    "priceUnit": "人",
    "departureDate": "2026-08-04",
    "returnDate": "2026-08-09",
    "transportType": "高铁往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "5早餐4正餐",
    "singleSupplement": 524,
    "singleSupplementNote": "单人出行需补单房差￥524，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 28,
    "totalSeats": 48,
    "highlights": [
      "其他必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往其他",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "告别其他，返回温馨的家",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.0,
    "reviewCount": 351,
    "bookingUrl": "http://www.jrt365.com",
    "images": [],
    "tags": [
      "自然风光",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "自然风光",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.454747",
    "updatedAt": "2026-05-07T01:02:13.454747"
  },
  {
    "id": "tour_30",
    "title": "韶关丹霞山溪里颂温泉3天 【不占床小孩】-1.2-1.49米只占车位+2早2正，其余自理   \n【占床小孩】-1.2米以下，只占车位，其余自理",
    "source": "假日通",
    "sourceLogo": "/icons/假日通.png",
    "destination": "其他",
    "duration": 3,
    "price": 399,
    "priceUnit": "人",
    "departureDate": "2026-07-04",
    "returnDate": "2026-07-07",
    "transportType": "大巴往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "3早餐2正餐",
    "singleSupplement": 99,
    "singleSupplementNote": "单人出行需补单房差￥99，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 24,
    "totalSeats": 34,
    "highlights": [
      "其他必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往其他",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "告别其他，返回温馨的家",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 3.7,
    "reviewCount": 581,
    "bookingUrl": "http://www.jrt365.com",
    "images": [],
    "tags": [
      "海岛度假",
      "纯玩",
      "品质"
    ],
    "isHot": true,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "海岛度假",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.454747",
    "updatedAt": "2026-05-07T01:02:13.454747"
  },
  {
    "id": "tour_31",
    "title": "丝路甘青（西北秘境）双飞8天 外籍、台湾不收！港澳正常收！\n成人：30-70周岁（同组不能超过10人[含]）\n长者：71-74周岁（先询，后报）",
    "source": "假日通",
    "sourceLogo": "/icons/假日通.png",
    "destination": "其他",
    "duration": 8,
    "price": 3339,
    "originalPrice": 3552,
    "priceUnit": "人",
    "departureDate": "2026-07-07",
    "returnDate": "2026-07-15",
    "transportType": "飞机往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "8早餐7正餐",
    "singleSupplement": 834,
    "singleSupplementNote": "单人出行需补单房差￥834，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 24,
    "totalSeats": 44,
    "highlights": [
      "其他必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往其他",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "第5天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 6,
        "title": "第6天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 7,
        "title": "第7天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 8,
        "title": "告别其他，返回温馨的家",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.9,
    "reviewCount": 292,
    "bookingUrl": "http://www.jrt365.com",
    "images": [],
    "tags": [
      "自然风光",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "discountRate": 6,
    "groupSize": "30人常规团",
    "theme": "自然风光",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.454747",
    "updatedAt": "2026-05-07T01:02:13.454747"
  },
  {
    "id": "tour_32",
    "title": "安远三百山热泉河温泉3天 【不占床小孩】-1.2米以上，只含车位+2早，其余自理。 \n【占床小孩】-1.2米以下，只占车位，其余自理。",
    "source": "假日通",
    "sourceLogo": "/icons/假日通.png",
    "destination": "其他",
    "duration": 3,
    "price": 399,
    "priceUnit": "人",
    "departureDate": "2026-06-21",
    "returnDate": "2026-06-24",
    "transportType": "大巴往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "3早餐2正餐",
    "singleSupplement": 99,
    "singleSupplementNote": "单人出行需补单房差￥99，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 9,
    "totalSeats": 44,
    "highlights": [
      "其他必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往其他",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "告别其他，返回温馨的家",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.7,
    "reviewCount": 468,
    "bookingUrl": "http://www.jrt365.com",
    "images": [],
    "tags": [
      "海岛度假",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "海岛度假",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.454747",
    "updatedAt": "2026-05-07T01:02:13.454747"
  },
  {
    "id": "tour_33",
    "title": "劲爆深坑（华东）双飞6天1 成人：31-70周岁\n占床小童：12-30周岁",
    "source": "假日通",
    "sourceLogo": "/icons/假日通.png",
    "destination": "其他",
    "duration": 6,
    "price": 2339,
    "originalPrice": 2657,
    "priceUnit": "人",
    "departureDate": "2026-07-11",
    "returnDate": "2026-07-17",
    "transportType": "飞机往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "6早餐5正餐",
    "singleSupplement": 584,
    "singleSupplementNote": "单人出行需补单房差￥584，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 10,
    "totalSeats": 40,
    "highlights": [
      "其他必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往其他",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "第5天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 6,
        "title": "告别其他，返回温馨的家",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.5,
    "reviewCount": 424,
    "bookingUrl": "http://www.jrt365.com",
    "images": [],
    "tags": [
      "自然风光",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": true,
    "isFlashSale": true,
    "discountRate": 12,
    "groupSize": "30人常规团",
    "theme": "自然风光",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.454747",
    "updatedAt": "2026-05-07T01:02:13.454747"
  },
  {
    "id": "tour_34",
    "title": "春韵山东大连双飞7天 ☆【特别安排】升级1晚豪华酒店、游轮升级4人间！\n☆【特色美食】济南饺子宴、青岛锅贴宴、胶东宴、大连特色铁锅炖！",
    "source": "假日通",
    "sourceLogo": "/icons/假日通.png",
    "destination": "其他",
    "duration": 7,
    "price": 2939,
    "originalPrice": 3628,
    "priceUnit": "人",
    "departureDate": "2026-07-08",
    "returnDate": "2026-07-15",
    "transportType": "飞机往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "7早餐6正餐",
    "singleSupplement": 734,
    "singleSupplementNote": "单人出行需补单房差￥734，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 23,
    "totalSeats": 33,
    "highlights": [
      "其他必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往其他",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "第5天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 6,
        "title": "第6天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 7,
        "title": "告别其他，返回温馨的家",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.3,
    "reviewCount": 629,
    "bookingUrl": "http://www.jrt365.com",
    "images": [],
    "tags": [
      "美食之旅",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "discountRate": 19,
    "groupSize": "30人常规团",
    "theme": "美食之旅",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.454747",
    "updatedAt": "2026-05-07T01:02:13.454747"
  },
  {
    "id": "tour_35",
    "title": "奢享山东半岛双飞5天1 2晚国际五钻 • 2晚网评四钻 •  0购物0自费\n◆舌尖美食：全程400元/围餐标：岛城风味、胶东风味、蓬莱八仙风味、老青岛家常菜、石岛风味\n◆独家赠送：无人机航拍。",
    "source": "假日通",
    "sourceLogo": "/icons/假日通.png",
    "destination": "其他",
    "duration": 5,
    "price": 3539,
    "priceUnit": "人",
    "departureDate": "2026-07-08",
    "returnDate": "2026-07-13",
    "transportType": "高铁往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "5早餐4正餐",
    "singleSupplement": 884,
    "singleSupplementNote": "单人出行需补单房差￥884，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 13,
    "totalSeats": 38,
    "highlights": [
      "其他必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往其他",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "告别其他，返回温馨的家",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.6,
    "reviewCount": 471,
    "bookingUrl": "http://www.jrt365.com",
    "images": [],
    "tags": [
      "美食之旅",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "美食之旅",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.454747",
    "updatedAt": "2026-05-07T01:02:13.454747"
  },
  {
    "id": "tour_36",
    "title": "粤西三湾一泉荔枝节4天 【不占床小童】-1.2米以下，只含车位，其余自理",
    "source": "假日通",
    "sourceLogo": "/icons/假日通.png",
    "destination": "其他",
    "duration": 4,
    "price": 699,
    "priceUnit": "人",
    "departureDate": "2026-06-10",
    "returnDate": "2026-06-14",
    "transportType": "高铁往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "4早餐3正餐",
    "singleSupplement": 174,
    "singleSupplementNote": "单人出行需补单房差￥174，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 26,
    "totalSeats": 46,
    "highlights": [
      "其他必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往其他",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "告别其他，返回温馨的家",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.9,
    "reviewCount": 818,
    "bookingUrl": "http://www.jrt365.com",
    "images": [],
    "tags": [
      "自然风光",
      "纯玩",
      "品质"
    ],
    "isHot": true,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "自然风光",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.454747",
    "updatedAt": "2026-05-07T01:02:13.454747"
  },
  {
    "id": "tour_37",
    "title": "粤西双湾荔枝节3天 【不占床小童】-1.2米以下，只含车位，其余自理",
    "source": "假日通",
    "sourceLogo": "/icons/假日通.png",
    "destination": "其他",
    "duration": 3,
    "price": 399,
    "priceUnit": "人",
    "departureDate": "2026-06-24",
    "returnDate": "2026-06-27",
    "transportType": "大巴往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "3早餐2正餐",
    "singleSupplement": 99,
    "singleSupplementNote": "单人出行需补单房差￥99，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 15,
    "totalSeats": 35,
    "highlights": [
      "其他必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往其他",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "告别其他，返回温馨的家",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 3.7,
    "reviewCount": 156,
    "bookingUrl": "http://www.jrt365.com",
    "images": [],
    "tags": [
      "自然风光",
      "纯玩",
      "品质"
    ],
    "isHot": true,
    "isNew": true,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "自然风光",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.454747",
    "updatedAt": "2026-05-07T01:02:13.454747"
  },
  {
    "id": "tour_38",
    "title": "赣州古城江茂漫谷温泉3天(食4餐) 【不占床小童】-1.2米-1.4米含车+餐+温泉票，其余自理\n【占床小孩】-1.2米以下只占车位，其余不含",
    "source": "假日通",
    "sourceLogo": "/icons/假日通.png",
    "destination": "其他",
    "duration": 3,
    "price": 699,
    "priceUnit": "人",
    "departureDate": "2026-05-19",
    "returnDate": "2026-05-22",
    "transportType": "大巴往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "3早餐2正餐",
    "singleSupplement": 174,
    "singleSupplementNote": "单人出行需补单房差￥174，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 16,
    "totalSeats": 31,
    "highlights": [
      "其他必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往其他",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "告别其他，返回温馨的家",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.3,
    "reviewCount": 682,
    "bookingUrl": "http://www.jrt365.com",
    "images": [],
    "tags": [
      "海岛度假",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "海岛度假",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.454747",
    "updatedAt": "2026-05-07T01:02:13.454747"
  },
  {
    "id": "tour_39",
    "title": "贺州西溪3天(悦泉居-食4餐) 【食4餐：酒店2正(围)+2自助早餐】\n\n【不占床】-1.2-1.4米，含车位+2正2早+多次温泉门票，其余不含\n【占床】-1.2米以下，只含车位，其余不含",
    "source": "假日通",
    "sourceLogo": "/icons/假日通.png",
    "destination": "其他",
    "duration": 3,
    "price": 799,
    "priceUnit": "人",
    "departureDate": "2026-06-22",
    "returnDate": "2026-06-25",
    "transportType": "大巴往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "3早餐2正餐",
    "singleSupplement": 199,
    "singleSupplementNote": "单人出行需补单房差￥199，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 25,
    "totalSeats": 35,
    "highlights": [
      "其他必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往其他",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "告别其他，返回温馨的家",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 3.6,
    "reviewCount": 223,
    "bookingUrl": "http://www.jrt365.com",
    "images": [],
    "tags": [
      "海岛度假",
      "纯玩",
      "品质"
    ],
    "isHot": true,
    "isNew": true,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "海岛度假",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.454747",
    "updatedAt": "2026-05-07T01:02:13.454747"
  },
  {
    "id": "tour_40",
    "title": "深圳大鹏双月都喜天丽联游3天 【不占床小童】-1.2-1.4米，含早餐+车位，其余不含；【占床小童】-1.2米以下，只含车位",
    "source": "假日通",
    "sourceLogo": "/icons/假日通.png",
    "destination": "广东",
    "duration": 3,
    "price": 499,
    "priceUnit": "人",
    "departureDate": "2026-06-23",
    "returnDate": "2026-06-26",
    "transportType": "大巴往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "3早餐2正餐",
    "singleSupplement": 124,
    "singleSupplementNote": "单人出行需补单房差￥124，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 19,
    "totalSeats": 49,
    "highlights": [
      "广东必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往广东",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "告别广东，返回温馨的家",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 3.5,
    "reviewCount": 48,
    "bookingUrl": "http://www.jrt365.com",
    "images": [],
    "tags": [
      "自然风光",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "自然风光",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.454747",
    "updatedAt": "2026-05-07T01:02:13.454747"
  },
  {
    "id": "tour_41",
    "title": "纯玩泸沽湖 双飞5天 ◆精选航班：南航直飞攀枝花，省去舟车劳顿！\n★唯美旅拍：泸沽湖走婚桥、旅拍体验高端旅拍-每人赠送 1个7寸水晶摆台 1个+1张精修照片\n◆住宿升级：西昌2晚网评四钻酒店+连住2晚泸沽湖精品民宿\n★舌尖美食：蒸汽石锅鱼+铜锅菌汤鸡+摩梭民族餐+凉山“西”餐+阳光下午茶多款特色美食；",
    "source": "假日通",
    "sourceLogo": "/icons/假日通.png",
    "destination": "其他",
    "duration": 5,
    "price": 3339,
    "priceUnit": "人",
    "departureDate": "2026-06-28",
    "returnDate": "2026-07-03",
    "transportType": "高铁往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "5早餐4正餐",
    "singleSupplement": 834,
    "singleSupplementNote": "单人出行需补单房差￥834，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 10,
    "totalSeats": 30,
    "highlights": [
      "其他必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往其他",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "告别其他，返回温馨的家",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 3.7,
    "reviewCount": 192,
    "bookingUrl": "http://www.jrt365.com",
    "images": [],
    "tags": [
      "美食之旅",
      "纯玩",
      "品质"
    ],
    "isHot": true,
    "isNew": true,
    "isFlashSale": true,
    "groupSize": "30人常规团",
    "theme": "美食之旅",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.454747",
    "updatedAt": "2026-05-07T01:02:13.454747"
  },
  {
    "id": "tour_42",
    "title": "茂名十星荔枝节3天 【不占床】-1.2-1.4米，只含车位+2早2正+莲花庄园门票\n【占床】-1.2米以下只含车位，其余自理",
    "source": "假日通",
    "sourceLogo": "/icons/假日通.png",
    "destination": "其他",
    "duration": 3,
    "price": 599,
    "priceUnit": "人",
    "departureDate": "2026-07-27",
    "returnDate": "2026-07-30",
    "transportType": "大巴往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "3早餐2正餐",
    "singleSupplement": 149,
    "singleSupplementNote": "单人出行需补单房差￥149，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 12,
    "totalSeats": 47,
    "highlights": [
      "其他必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往其他",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "告别其他，返回温馨的家",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.4,
    "reviewCount": 79,
    "bookingUrl": "http://www.jrt365.com",
    "images": [],
    "tags": [
      "自然风光",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "自然风光",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.454747",
    "updatedAt": "2026-05-07T01:02:13.454747"
  },
  {
    "id": "tour_43",
    "title": "五星齐鲁（璀璨山东）双飞6天1 长者线路。不足60周岁，当地现补门票。\n☆ 【奢享住宿】全程网评5钻酒店，2晚国际品牌五星酒店，呵护每一晚睡眠\n☆ 【体验升级】16(含)人以上当地安排2+1空调大巴",
    "source": "假日通",
    "sourceLogo": "/icons/假日通.png",
    "destination": "其他",
    "duration": 6,
    "price": 3339,
    "priceUnit": "人",
    "departureDate": "2026-06-21",
    "returnDate": "2026-06-27",
    "transportType": "飞机往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "6早餐5正餐",
    "singleSupplement": 834,
    "singleSupplementNote": "单人出行需补单房差￥834，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 25,
    "totalSeats": 40,
    "highlights": [
      "其他必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往其他",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "第5天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 6,
        "title": "告别其他，返回温馨的家",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 3.9,
    "reviewCount": 93,
    "bookingUrl": "http://www.jrt365.com",
    "images": [],
    "tags": [
      "自然风光",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": true,
    "isFlashSale": true,
    "groupSize": "30人常规团",
    "theme": "自然风光",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.454747",
    "updatedAt": "2026-05-07T01:02:13.454747"
  },
  {
    "id": "tour_44",
    "title": "关键字 搜索 热门目的地 澳洲 英国 俄罗斯 泰国 法国 意大利 摩洛哥 土耳其 热卖线路 推荐线路 【尚·深度】北欧四国、冰岛13／14天＊一价全含＊冰岛深度三晚＊黄金圈＋蓝湖温泉＋冰河湖游船＊峡湾景观酒店＊双峡湾游船＋品尝三文鱼＊广州往返＜中文官导带游蓝厅，餐食全含，游轮自助海鲜餐，AYI＞ ￥ 37999 ￥40999 【尚·深度】舒享法瑞意12－14天＊一价全含＊阿尔卑斯雪山＊官导讲解卢浮宫＋凡尔赛宫＋巴黎歌剧院＊双游船体验＊TGV高铁＋黄金列车＜全程豪华酒店、巴黎3晚、瑞士2晚，四花小镇科尔马，罗马深度游＋比萨斜塔，威尼斯鳌虾意面＋雪山景观餐＋T骨牛扒餐＋法式蜗牛餐，AFW＞ ￥ 25399 【尚·深度】舒享俄罗斯9天＊一价全含＊南航双直航＊内陆双高铁＊官导带游三大宫殿＊豪华酒店连住＜武装力量大教堂，滴血大教堂，夏宫花园，俄式大餐CZQH＞ ￥ 9399 【尚·深度】法瑞意14天＊一价全含，26人精品团＊深度瑞士4晚＊登上少女峰＊走读巴黎左岸，官导带游四大宫殿博物馆＊黄金列车＋TGV高铁＜伯尔尼＋格林德瓦＋日内瓦，全程豪华酒店、巴黎连住4晚国际连锁酒店、瑞士连住2晚，唯美安纳西小镇，罗马深度游＋黄金大运河游船，LHFS＞ ￥ 32999 【尚·深度】舒享西葡12／14天＊一价全含＊官导带游双皇宫和圣家族大教堂＊高铁＋四城连住＜弗拉明戈，千年古城杜丽多＋塞戈维亚，米其林推荐烤乳猪餐＋海鲜饭＋牛尾餐，用餐全含，SLU＞ ￥ 18999 风光世界 自由行、当地玩乐 【自由行】马尔代夫5天＊库拉玛提岛＊2晚沙滩别墅+2晚水上别墅＊机票+酒店＊快艇上岛＊含早午晚餐＊广州往返＊等待确认＜拖尾沙滩，中文服务+免费WiFi＞ ￥ 11599 ￥13899 【自由行】马来西亚6天＊升级2晚仙本那卡帕莱或马步岛水上屋＊1晚沙巴豪华酒店+2晚仙本那镇上酒店＊亚庇市区游+肉骨茶＊仙本那跳岛游＊广州往返＊等待确认＜网红水屋豪华体验，往返4段接送＞ ￥ 9999 【自由行】新加坡4/5天＊全程入住市区高级酒店＊机票+酒店实惠套餐＊广州往返＊等待确认＜玩家入门精选＞ ￥ 3799 【沙巴自由行】马来西亚沙巴5天＊2人起行＊南航广州直飞正点航班＊等待确认＜机场到市区往返接送机，报名即知航班时间，尊享超值换购＞ ￥ 2499 【仙本那自由行】马来西亚、仙本那4/5天＊2人起行＊直航往返无需转机＊等待确认＜报名即知航班时间，含机场往返仙本那镇接送，全程连住仙本那酒店＞ ￥ 3699 免签/便捷签 推荐线路 【尚·经典】土耳其10天＊纯玩26人团＊费特希耶＊蔚蓝双海＊广州直航双内陆航班＜内陆双飞，特色洞穴＋温泉＋超豪华酒店，3大特色美食尽享＞ ￥ 15999 ￥15999 【尚·深度】阿塞拜疆、格鲁吉亚、亚美尼亚10－12天＊免签一价全含＊外高加索秘境＊古丝路文明＊卡兹别克雪山＊塞凡湖游船＊乌鲁木齐出境可全国联运＜全程特色、豪华或超豪华酒店，格鲁吉亚美酒，外高加索传统特色餐，AGA＞ ￥ 13399 【尚·深度】经典俄罗斯9／10天＊内陆双高铁＊冬宫博物馆＊克里姆林宫＊豪华酒店连住＊俄式大餐＜红场，夏宫御花园，卡洛明斯科娅庄园，CZGT＞ ￥ 7399 【尚·休闲】埃及8天＊3大经典名城＊3大传奇神庙＊大埃及博物馆巡游＊埃及航空广州直飞＜升级一段内陆航班接驳，全程当地超豪华酒店，红海升级海边度假住宿，3大特色美食＞ ￥ 7888 【尚·博览】经典泰国、曼谷芭堤雅6天＊经典暹罗＊大皇宫玉佛寺＋水门寺金色大佛＊船游湄南河＊升级2晚海边超豪华酒店＊双岛出海＊南航正点直飞往返＜东方公主号，特色夜市＋杜拉拉水上市场，大象园趣味之旅＞ ￥ 2699",
    "source": "广之旅",
    "sourceLogo": "/icons/广.png",
    "destination": "广东",
    "duration": 14,
    "price": 40999,
    "priceUnit": "人",
    "departureDate": "2026-07-12",
    "returnDate": "2026-07-26",
    "transportType": "飞机往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "14早餐13正餐",
    "singleSupplement": 10249,
    "singleSupplementNote": "单人出行需补单房差￥10249，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 28,
    "totalSeats": 38,
    "highlights": [
      "广东必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往广东",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "第5天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 6,
        "title": "第6天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 7,
        "title": "第7天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 8,
        "title": "第8天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 9,
        "title": "第9天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 10,
        "title": "第10天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 11,
        "title": "第11天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 12,
        "title": "第12天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 13,
        "title": "第13天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 14,
        "title": "告别广东，返回温馨的家",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 3.8,
    "reviewCount": 674,
    "bookingUrl": "http://nn.gzl.cn/abroad/abroad.html",
    "images": [],
    "tags": [
      "海岛度假",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "海岛度假",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.454747",
    "updatedAt": "2026-05-07T01:02:13.454747"
  },
  {
    "id": "tour_45",
    "title": "热卖线路 推荐线路 【尚·深度】北欧四国、冰岛13／14天＊一价全含＊冰岛深度三晚＊黄金圈＋蓝湖温泉＋冰河湖游船＊峡湾景观酒店＊双峡湾游船＋品尝三文鱼＊广州往返＜中文官导带游蓝厅，餐食全含，游轮自助海鲜餐，AYI＞ ￥ 37999 ￥40999 【尚·深度】舒享法瑞意12－14天＊一价全含＊阿尔卑斯雪山＊官导讲解卢浮宫＋凡尔赛宫＋巴黎歌剧院＊双游船体验＊TGV高铁＋黄金列车＜全程豪华酒店、巴黎3晚、瑞士2晚，四花小镇科尔马，罗马深度游＋比萨斜塔，威尼斯鳌虾意面＋雪山景观餐＋T骨牛扒餐＋法式蜗牛餐，AFW＞ ￥ 25399 【尚·深度】舒享俄罗斯9天＊一价全含＊南航双直航＊内陆双高铁＊官导带游三大宫殿＊豪华酒店连住＜武装力量大教堂，滴血大教堂，夏宫花园，俄式大餐CZQH＞ ￥ 9399 【尚·深度】法瑞意14天＊一价全含，26人精品团＊深度瑞士4晚＊登上少女峰＊走读巴黎左岸，官导带游四大宫殿博物馆＊黄金列车＋TGV高铁＜伯尔尼＋格林德瓦＋日内瓦，全程豪华酒店、巴黎连住4晚国际连锁酒店、瑞士连住2晚，唯美安纳西小镇，罗马深度游＋黄金大运河游船，LHFS＞ ￥ 32999 【尚·深度】舒享西葡12／14天＊一价全含＊官导带游双皇宫和圣家族大教堂＊高铁＋四城连住＜弗拉明戈，千年古城杜丽多＋塞戈维亚，米其林推荐烤乳猪餐＋海鲜饭＋牛尾餐，用餐全含，SLU＞ ￥ 18999",
    "source": "广之旅",
    "sourceLogo": "/icons/广.png",
    "destination": "广东",
    "duration": 14,
    "price": 40999,
    "priceUnit": "人",
    "departureDate": "2026-05-22",
    "returnDate": "2026-06-05",
    "transportType": "飞机往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "14早餐13正餐",
    "singleSupplement": 10249,
    "singleSupplementNote": "单人出行需补单房差￥10249，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 19,
    "totalSeats": 39,
    "highlights": [
      "广东必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往广东",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "第5天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 6,
        "title": "第6天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 7,
        "title": "第7天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 8,
        "title": "第8天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 9,
        "title": "第9天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 10,
        "title": "第10天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 11,
        "title": "第11天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 12,
        "title": "第12天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 13,
        "title": "第13天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 14,
        "title": "告别广东，返回温馨的家",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 3.7,
    "reviewCount": 24,
    "bookingUrl": "http://nn.gzl.cn/abroad/abroad.html",
    "images": [],
    "tags": [
      "海岛度假",
      "纯玩",
      "品质"
    ],
    "isHot": true,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "海岛度假",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.454747",
    "updatedAt": "2026-05-07T01:02:13.454747"
  },
  {
    "id": "tour_46",
    "title": "推荐线路 【尚·深度】北欧四国、冰岛13／14天＊一价全含＊冰岛深度三晚＊黄金圈＋蓝湖温泉＋冰河湖游船＊峡湾景观酒店＊双峡湾游船＋品尝三文鱼＊广州往返＜中文官导带游蓝厅，餐食全含，游轮自助海鲜餐，AYI＞ ￥ 37999 ￥40999 【尚·深度】舒享法瑞意12－14天＊一价全含＊阿尔卑斯雪山＊官导讲解卢浮宫＋凡尔赛宫＋巴黎歌剧院＊双游船体验＊TGV高铁＋黄金列车＜全程豪华酒店、巴黎3晚、瑞士2晚，四花小镇科尔马，罗马深度游＋比萨斜塔，威尼斯鳌虾意面＋雪山景观餐＋T骨牛扒餐＋法式蜗牛餐，AFW＞ ￥ 25399 【尚·深度】舒享俄罗斯9天＊一价全含＊南航双直航＊内陆双高铁＊官导带游三大宫殿＊豪华酒店连住＜武装力量大教堂，滴血大教堂，夏宫花园，俄式大餐CZQH＞ ￥ 9399 【尚·深度】法瑞意14天＊一价全含，26人精品团＊深度瑞士4晚＊登上少女峰＊走读巴黎左岸，官导带游四大宫殿博物馆＊黄金列车＋TGV高铁＜伯尔尼＋格林德瓦＋日内瓦，全程豪华酒店、巴黎连住4晚国际连锁酒店、瑞士连住2晚，唯美安纳西小镇，罗马深度游＋黄金大运河游船，LHFS＞ ￥ 32999 【尚·深度】舒享西葡12／14天＊一价全含＊官导带游双皇宫和圣家族大教堂＊高铁＋四城连住＜弗拉明戈，千年古城杜丽多＋塞戈维亚，米其林推荐烤乳猪餐＋海鲜饭＋牛尾餐，用餐全含，SLU＞ ￥ 18999",
    "source": "广之旅",
    "sourceLogo": "/icons/广.png",
    "destination": "广东",
    "duration": 14,
    "price": 40999,
    "priceUnit": "人",
    "departureDate": "2026-08-02",
    "returnDate": "2026-08-16",
    "transportType": "飞机往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "14早餐13正餐",
    "singleSupplement": 10249,
    "singleSupplementNote": "单人出行需补单房差￥10249，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 19,
    "totalSeats": 49,
    "highlights": [
      "广东必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往广东",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "第5天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 6,
        "title": "第6天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 7,
        "title": "第7天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 8,
        "title": "第8天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 9,
        "title": "第9天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 10,
        "title": "第10天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 11,
        "title": "第11天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 12,
        "title": "第12天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 13,
        "title": "第13天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 14,
        "title": "告别广东，返回温馨的家",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 3.5,
    "reviewCount": 182,
    "bookingUrl": "http://nn.gzl.cn/abroad/abroad.html",
    "images": [],
    "tags": [
      "海岛度假",
      "纯玩",
      "品质"
    ],
    "isHot": true,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "海岛度假",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.454747",
    "updatedAt": "2026-05-07T01:02:13.454747"
  },
  {
    "id": "tour_47",
    "title": "【尚·深度】北欧四国、冰岛13／14天＊一价全含＊冰岛深度三晚＊黄金圈＋蓝湖温泉＋冰河湖游船＊峡湾景观酒店＊双峡湾游船＋品尝三文鱼＊广州往返＜中文官导带游蓝厅，餐食全含，游轮自助海鲜餐，AYI＞ ￥ 37999 ￥40999 【尚·深度】舒享法瑞意12－14天＊一价全含＊阿尔卑斯雪山＊官导讲解卢浮宫＋凡尔赛宫＋巴黎歌剧院＊双游船体验＊TGV高铁＋黄金列车＜全程豪华酒店、巴黎3晚、瑞士2晚，四花小镇科尔马，罗马深度游＋比萨斜塔，威尼斯鳌虾意面＋雪山景观餐＋T骨牛扒餐＋法式蜗牛餐，AFW＞ ￥ 25399 【尚·深度】舒享俄罗斯9天＊一价全含＊南航双直航＊内陆双高铁＊官导带游三大宫殿＊豪华酒店连住＜武装力量大教堂，滴血大教堂，夏宫花园，俄式大餐CZQH＞ ￥ 9399 【尚·深度】法瑞意14天＊一价全含，26人精品团＊深度瑞士4晚＊登上少女峰＊走读巴黎左岸，官导带游四大宫殿博物馆＊黄金列车＋TGV高铁＜伯尔尼＋格林德瓦＋日内瓦，全程豪华酒店、巴黎连住4晚国际连锁酒店、瑞士连住2晚，唯美安纳西小镇，罗马深度游＋黄金大运河游船，LHFS＞ ￥ 32999 【尚·深度】舒享西葡12／14天＊一价全含＊官导带游双皇宫和圣家族大教堂＊高铁＋四城连住＜弗拉明戈，千年古城杜丽多＋塞戈维亚，米其林推荐烤乳猪餐＋海鲜饭＋牛尾餐，用餐全含，SLU＞ ￥ 18999",
    "source": "广之旅",
    "sourceLogo": "/icons/广.png",
    "destination": "广东",
    "duration": 14,
    "price": 40999,
    "priceUnit": "人",
    "departureDate": "2026-07-05",
    "returnDate": "2026-07-19",
    "transportType": "飞机往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "14早餐13正餐",
    "singleSupplement": 10249,
    "singleSupplementNote": "单人出行需补单房差￥10249，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 20,
    "totalSeats": 40,
    "highlights": [
      "广东必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往广东",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "第5天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 6,
        "title": "第6天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 7,
        "title": "第7天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 8,
        "title": "第8天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 9,
        "title": "第9天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 10,
        "title": "第10天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 11,
        "title": "第11天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 12,
        "title": "第12天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 13,
        "title": "第13天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 14,
        "title": "告别广东，返回温馨的家",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.5,
    "reviewCount": 355,
    "bookingUrl": "http://nn.gzl.cn/abroad/abroad.html",
    "images": [],
    "tags": [
      "海岛度假",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": true,
    "isFlashSale": true,
    "groupSize": "30人常规团",
    "theme": "海岛度假",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.454747",
    "updatedAt": "2026-05-07T01:02:13.454747"
  },
  {
    "id": "tour_48",
    "title": "【尚·深度】北欧四国、冰岛13／14天＊一价全含＊冰岛深度三晚＊黄金圈＋蓝湖温泉＋冰河湖游船＊峡湾景观酒店＊双峡湾游船＋品尝三文鱼＊广州往返＜中文官导带游蓝厅，餐食全含，游轮自助海鲜餐，AYI＞ ￥ 37999 ￥40999",
    "source": "广之旅",
    "sourceLogo": "/icons/广.png",
    "destination": "广东",
    "duration": 14,
    "price": 40999,
    "priceUnit": "人",
    "departureDate": "2026-06-24",
    "returnDate": "2026-07-08",
    "transportType": "飞机往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "14早餐13正餐",
    "singleSupplement": 10249,
    "singleSupplementNote": "单人出行需补单房差￥10249，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 16,
    "totalSeats": 36,
    "highlights": [
      "广东必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往广东",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "第5天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 6,
        "title": "第6天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 7,
        "title": "第7天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 8,
        "title": "第8天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 9,
        "title": "第9天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 10,
        "title": "第10天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 11,
        "title": "第11天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 12,
        "title": "第12天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 13,
        "title": "第13天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 14,
        "title": "告别广东，返回温馨的家",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 3.5,
    "reviewCount": 609,
    "bookingUrl": "http://nn.gzl.cn/abroad/abroad.html",
    "images": [],
    "tags": [
      "海岛度假",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "海岛度假",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.454747",
    "updatedAt": "2026-05-07T01:02:13.454747"
  },
  {
    "id": "tour_49",
    "title": "风光世界 自由行、当地玩乐 【自由行】马尔代夫5天＊库拉玛提岛＊2晚沙滩别墅+2晚水上别墅＊机票+酒店＊快艇上岛＊含早午晚餐＊广州往返＊等待确认＜拖尾沙滩，中文服务+免费WiFi＞ ￥ 11599 ￥13899 【自由行】马来西亚6天＊升级2晚仙本那卡帕莱或马步岛水上屋＊1晚沙巴豪华酒店+2晚仙本那镇上酒店＊亚庇市区游+肉骨茶＊仙本那跳岛游＊广州往返＊等待确认＜网红水屋豪华体验，往返4段接送＞ ￥ 9999 【自由行】新加坡4/5天＊全程入住市区高级酒店＊机票+酒店实惠套餐＊广州往返＊等待确认＜玩家入门精选＞ ￥ 3799 【沙巴自由行】马来西亚沙巴5天＊2人起行＊南航广州直飞正点航班＊等待确认＜机场到市区往返接送机，报名即知航班时间，尊享超值换购＞ ￥ 2499 【仙本那自由行】马来西亚、仙本那4/5天＊2人起行＊直航往返无需转机＊等待确认＜报名即知航班时间，含机场往返仙本那镇接送，全程连住仙本那酒店＞ ￥ 3699",
    "source": "广之旅",
    "sourceLogo": "/icons/广.png",
    "destination": "广东",
    "duration": 5,
    "price": 13899,
    "originalPrice": 15794,
    "priceUnit": "人",
    "departureDate": "2026-06-23",
    "returnDate": "2026-06-28",
    "transportType": "高铁往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "5早餐4正餐",
    "singleSupplement": 3474,
    "singleSupplementNote": "单人出行需补单房差￥3474，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 7,
    "totalSeats": 42,
    "highlights": [
      "广东必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往广东",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "告别广东，返回温馨的家",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.7,
    "reviewCount": 154,
    "bookingUrl": "http://nn.gzl.cn/abroad/abroad.html",
    "images": [],
    "tags": [
      "海岛度假",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "discountRate": 12,
    "groupSize": "30人常规团",
    "theme": "海岛度假",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.454747",
    "updatedAt": "2026-05-07T01:02:13.454747"
  },
  {
    "id": "tour_50",
    "title": "自由行、当地玩乐 【自由行】马尔代夫5天＊库拉玛提岛＊2晚沙滩别墅+2晚水上别墅＊机票+酒店＊快艇上岛＊含早午晚餐＊广州往返＊等待确认＜拖尾沙滩，中文服务+免费WiFi＞ ￥ 11599 ￥13899 【自由行】马来西亚6天＊升级2晚仙本那卡帕莱或马步岛水上屋＊1晚沙巴豪华酒店+2晚仙本那镇上酒店＊亚庇市区游+肉骨茶＊仙本那跳岛游＊广州往返＊等待确认＜网红水屋豪华体验，往返4段接送＞ ￥ 9999 【自由行】新加坡4/5天＊全程入住市区高级酒店＊机票+酒店实惠套餐＊广州往返＊等待确认＜玩家入门精选＞ ￥ 3799 【沙巴自由行】马来西亚沙巴5天＊2人起行＊南航广州直飞正点航班＊等待确认＜机场到市区往返接送机，报名即知航班时间，尊享超值换购＞ ￥ 2499 【仙本那自由行】马来西亚、仙本那4/5天＊2人起行＊直航往返无需转机＊等待确认＜报名即知航班时间，含机场往返仙本那镇接送，全程连住仙本那酒店＞ ￥ 3699",
    "source": "广之旅",
    "sourceLogo": "/icons/广.png",
    "destination": "广东",
    "duration": 5,
    "price": 13899,
    "originalPrice": 16546,
    "priceUnit": "人",
    "departureDate": "2026-08-02",
    "returnDate": "2026-08-07",
    "transportType": "高铁往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "5早餐4正餐",
    "singleSupplement": 3474,
    "singleSupplementNote": "单人出行需补单房差￥3474，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 21,
    "totalSeats": 36,
    "highlights": [
      "广东必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往广东",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "告别广东，返回温馨的家",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.2,
    "reviewCount": 601,
    "bookingUrl": "http://nn.gzl.cn/abroad/abroad.html",
    "images": [],
    "tags": [
      "海岛度假",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "discountRate": 16,
    "groupSize": "30人常规团",
    "theme": "海岛度假",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.455747",
    "updatedAt": "2026-05-07T01:02:13.455747"
  },
  {
    "id": "tour_51",
    "title": "【自由行】马尔代夫5天＊库拉玛提岛＊2晚沙滩别墅+2晚水上别墅＊机票+酒店＊快艇上岛＊含早午晚餐＊广州往返＊等待确认＜拖尾沙滩，中文服务+免费WiFi＞ ￥ 11599 ￥13899 【自由行】马来西亚6天＊升级2晚仙本那卡帕莱或马步岛水上屋＊1晚沙巴豪华酒店+2晚仙本那镇上酒店＊亚庇市区游+肉骨茶＊仙本那跳岛游＊广州往返＊等待确认＜网红水屋豪华体验，往返4段接送＞ ￥ 9999 【自由行】新加坡4/5天＊全程入住市区高级酒店＊机票+酒店实惠套餐＊广州往返＊等待确认＜玩家入门精选＞ ￥ 3799 【沙巴自由行】马来西亚沙巴5天＊2人起行＊南航广州直飞正点航班＊等待确认＜机场到市区往返接送机，报名即知航班时间，尊享超值换购＞ ￥ 2499 【仙本那自由行】马来西亚、仙本那4/5天＊2人起行＊直航往返无需转机＊等待确认＜报名即知航班时间，含机场往返仙本那镇接送，全程连住仙本那酒店＞ ￥ 3699",
    "source": "广之旅",
    "sourceLogo": "/icons/广.png",
    "destination": "广东",
    "duration": 5,
    "price": 13899,
    "priceUnit": "人",
    "departureDate": "2026-06-13",
    "returnDate": "2026-06-18",
    "transportType": "高铁往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "5早餐4正餐",
    "singleSupplement": 3474,
    "singleSupplementNote": "单人出行需补单房差￥3474，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 25,
    "totalSeats": 35,
    "highlights": [
      "广东必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往广东",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "告别广东，返回温馨的家",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.6,
    "reviewCount": 739,
    "bookingUrl": "http://nn.gzl.cn/abroad/abroad.html",
    "images": [],
    "tags": [
      "海岛度假",
      "纯玩",
      "品质"
    ],
    "isHot": true,
    "isNew": true,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "海岛度假",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.455747",
    "updatedAt": "2026-05-07T01:02:13.455747"
  },
  {
    "id": "tour_52",
    "title": "【自由行】马尔代夫5天＊库拉玛提岛＊2晚沙滩别墅+2晚水上别墅＊机票+酒店＊快艇上岛＊含早午晚餐＊广州往返＊等待确认＜拖尾沙滩，中文服务+免费WiFi＞ ￥ 11599 ￥13899",
    "source": "广之旅",
    "sourceLogo": "/icons/广.png",
    "destination": "广东",
    "duration": 5,
    "price": 13899,
    "priceUnit": "人",
    "departureDate": "2026-08-02",
    "returnDate": "2026-08-07",
    "transportType": "高铁往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "5早餐4正餐",
    "singleSupplement": 3474,
    "singleSupplementNote": "单人出行需补单房差￥3474，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 8,
    "totalSeats": 48,
    "highlights": [
      "广东必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往广东",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "告别广东，返回温馨的家",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.1,
    "reviewCount": 429,
    "bookingUrl": "http://nn.gzl.cn/abroad/abroad.html",
    "images": [],
    "tags": [
      "海岛度假",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "海岛度假",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.455747",
    "updatedAt": "2026-05-07T01:02:13.455747"
  },
  {
    "id": "tour_53",
    "title": "免签/便捷签 推荐线路 【尚·经典】土耳其10天＊纯玩26人团＊费特希耶＊蔚蓝双海＊广州直航双内陆航班＜内陆双飞，特色洞穴＋温泉＋超豪华酒店，3大特色美食尽享＞ ￥ 15999 ￥15999 【尚·深度】阿塞拜疆、格鲁吉亚、亚美尼亚10－12天＊免签一价全含＊外高加索秘境＊古丝路文明＊卡兹别克雪山＊塞凡湖游船＊乌鲁木齐出境可全国联运＜全程特色、豪华或超豪华酒店，格鲁吉亚美酒，外高加索传统特色餐，AGA＞ ￥ 13399 【尚·深度】经典俄罗斯9／10天＊内陆双高铁＊冬宫博物馆＊克里姆林宫＊豪华酒店连住＊俄式大餐＜红场，夏宫御花园，卡洛明斯科娅庄园，CZGT＞ ￥ 7399 【尚·休闲】埃及8天＊3大经典名城＊3大传奇神庙＊大埃及博物馆巡游＊埃及航空广州直飞＜升级一段内陆航班接驳，全程当地超豪华酒店，红海升级海边度假住宿，3大特色美食＞ ￥ 7888 【尚·博览】经典泰国、曼谷芭堤雅6天＊经典暹罗＊大皇宫玉佛寺＋水门寺金色大佛＊船游湄南河＊升级2晚海边超豪华酒店＊双岛出海＊南航正点直飞往返＜东方公主号，特色夜市＋杜拉拉水上市场，大象园趣味之旅＞ ￥ 2699",
    "source": "广之旅",
    "sourceLogo": "/icons/广.png",
    "destination": "广东",
    "duration": 10,
    "price": 15999,
    "priceUnit": "人",
    "departureDate": "2026-07-05",
    "returnDate": "2026-07-15",
    "transportType": "飞机往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "10早餐9正餐",
    "singleSupplement": 3999,
    "singleSupplementNote": "单人出行需补单房差￥3999，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 15,
    "totalSeats": 35,
    "highlights": [
      "广东必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往广东",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "第5天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 6,
        "title": "第6天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 7,
        "title": "第7天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 8,
        "title": "第8天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 9,
        "title": "第9天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 10,
        "title": "告别广东，返回温馨的家",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.1,
    "reviewCount": 569,
    "bookingUrl": "http://nn.gzl.cn/abroad/abroad.html",
    "images": [],
    "tags": [
      "海岛度假",
      "纯玩",
      "品质"
    ],
    "isHot": true,
    "isNew": true,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "海岛度假",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.455747",
    "updatedAt": "2026-05-07T01:02:13.455747"
  },
  {
    "id": "tour_54",
    "title": "推荐线路 【尚·经典】土耳其10天＊纯玩26人团＊费特希耶＊蔚蓝双海＊广州直航双内陆航班＜内陆双飞，特色洞穴＋温泉＋超豪华酒店，3大特色美食尽享＞ ￥ 15999 ￥15999 【尚·深度】阿塞拜疆、格鲁吉亚、亚美尼亚10－12天＊免签一价全含＊外高加索秘境＊古丝路文明＊卡兹别克雪山＊塞凡湖游船＊乌鲁木齐出境可全国联运＜全程特色、豪华或超豪华酒店，格鲁吉亚美酒，外高加索传统特色餐，AGA＞ ￥ 13399 【尚·深度】经典俄罗斯9／10天＊内陆双高铁＊冬宫博物馆＊克里姆林宫＊豪华酒店连住＊俄式大餐＜红场，夏宫御花园，卡洛明斯科娅庄园，CZGT＞ ￥ 7399 【尚·休闲】埃及8天＊3大经典名城＊3大传奇神庙＊大埃及博物馆巡游＊埃及航空广州直飞＜升级一段内陆航班接驳，全程当地超豪华酒店，红海升级海边度假住宿，3大特色美食＞ ￥ 7888 【尚·博览】经典泰国、曼谷芭堤雅6天＊经典暹罗＊大皇宫玉佛寺＋水门寺金色大佛＊船游湄南河＊升级2晚海边超豪华酒店＊双岛出海＊南航正点直飞往返＜东方公主号，特色夜市＋杜拉拉水上市场，大象园趣味之旅＞ ￥ 2699",
    "source": "广之旅",
    "sourceLogo": "/icons/广.png",
    "destination": "广东",
    "duration": 10,
    "price": 15999,
    "priceUnit": "人",
    "departureDate": "2026-05-18",
    "returnDate": "2026-05-28",
    "transportType": "飞机往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "10早餐9正餐",
    "singleSupplement": 3999,
    "singleSupplementNote": "单人出行需补单房差￥3999，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 29,
    "totalSeats": 44,
    "highlights": [
      "广东必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往广东",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "第5天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 6,
        "title": "第6天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 7,
        "title": "第7天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 8,
        "title": "第8天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 9,
        "title": "第9天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 10,
        "title": "告别广东，返回温馨的家",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.1,
    "reviewCount": 584,
    "bookingUrl": "http://nn.gzl.cn/abroad/abroad.html",
    "images": [],
    "tags": [
      "海岛度假",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "海岛度假",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.455747",
    "updatedAt": "2026-05-07T01:02:13.455747"
  },
  {
    "id": "tour_55",
    "title": "【尚·经典】土耳其10天＊纯玩26人团＊费特希耶＊蔚蓝双海＊广州直航双内陆航班＜内陆双飞，特色洞穴＋温泉＋超豪华酒店，3大特色美食尽享＞ ￥ 15999 ￥15999 【尚·深度】阿塞拜疆、格鲁吉亚、亚美尼亚10－12天＊免签一价全含＊外高加索秘境＊古丝路文明＊卡兹别克雪山＊塞凡湖游船＊乌鲁木齐出境可全国联运＜全程特色、豪华或超豪华酒店，格鲁吉亚美酒，外高加索传统特色餐，AGA＞ ￥ 13399 【尚·深度】经典俄罗斯9／10天＊内陆双高铁＊冬宫博物馆＊克里姆林宫＊豪华酒店连住＊俄式大餐＜红场，夏宫御花园，卡洛明斯科娅庄园，CZGT＞ ￥ 7399 【尚·休闲】埃及8天＊3大经典名城＊3大传奇神庙＊大埃及博物馆巡游＊埃及航空广州直飞＜升级一段内陆航班接驳，全程当地超豪华酒店，红海升级海边度假住宿，3大特色美食＞ ￥ 7888 【尚·博览】经典泰国、曼谷芭堤雅6天＊经典暹罗＊大皇宫玉佛寺＋水门寺金色大佛＊船游湄南河＊升级2晚海边超豪华酒店＊双岛出海＊南航正点直飞往返＜东方公主号，特色夜市＋杜拉拉水上市场，大象园趣味之旅＞ ￥ 2699",
    "source": "广之旅",
    "sourceLogo": "/icons/广.png",
    "destination": "广东",
    "duration": 10,
    "price": 15999,
    "originalPrice": 17776,
    "priceUnit": "人",
    "departureDate": "2026-06-07",
    "returnDate": "2026-06-17",
    "transportType": "飞机往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "10早餐9正餐",
    "singleSupplement": 3999,
    "singleSupplementNote": "单人出行需补单房差￥3999，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 25,
    "totalSeats": 45,
    "highlights": [
      "广东必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往广东",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "第5天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 6,
        "title": "第6天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 7,
        "title": "第7天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 8,
        "title": "第8天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 9,
        "title": "第9天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 10,
        "title": "告别广东，返回温馨的家",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.1,
    "reviewCount": 599,
    "bookingUrl": "http://nn.gzl.cn/abroad/abroad.html",
    "images": [],
    "tags": [
      "海岛度假",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": true,
    "isFlashSale": false,
    "discountRate": 10,
    "groupSize": "30人常规团",
    "theme": "海岛度假",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.455747",
    "updatedAt": "2026-05-07T01:02:13.455747"
  },
  {
    "id": "tour_56",
    "title": "【尚·经典】土耳其10天＊纯玩26人团＊费特希耶＊蔚蓝双海＊广州直航双内陆航班＜内陆双飞，特色洞穴＋温泉＋超豪华酒店，3大特色美食尽享＞ ￥ 15999 ￥15999",
    "source": "广之旅",
    "sourceLogo": "/icons/广.png",
    "destination": "广东",
    "duration": 10,
    "price": 15999,
    "priceUnit": "人",
    "departureDate": "2026-08-01",
    "returnDate": "2026-08-11",
    "transportType": "飞机往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "10早餐9正餐",
    "singleSupplement": 3999,
    "singleSupplementNote": "单人出行需补单房差￥3999，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 7,
    "totalSeats": 37,
    "highlights": [
      "广东必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往广东",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "第5天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 6,
        "title": "第6天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 7,
        "title": "第7天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 8,
        "title": "第8天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 9,
        "title": "第9天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 10,
        "title": "告别广东，返回温馨的家",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 3.6,
    "reviewCount": 216,
    "bookingUrl": "http://nn.gzl.cn/abroad/abroad.html",
    "images": [],
    "tags": [
      "海岛度假",
      "纯玩",
      "品质"
    ],
    "isHot": true,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "海岛度假",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.455747",
    "updatedAt": "2026-05-07T01:02:13.455747"
  },
  {
    "id": "tour_57",
    "title": "关键字 搜索 当季热卖 温泉 湛江 潮汕 巽寮湾 海陵岛 人气目的地 清远 茂名 惠州 主题乐园 广州长隆 珠海长隆 广州融创 乐游周边 休闲特色 3天 【周末 Plus】潮汕3天＊品潮汕功夫茶看英歌舞表演＊乘坐官方文旅轮渡打卡汕头内海湾＊觅食潮州古城牌坊街＊长龙卧波广济桥＜纯玩动车往返，潮式新旅游，周五下午出发＞ ￥ 1299 ￥1399 3天 【尚·海滩】湛江茂名3天＊浪漫海岸沙滩音乐节狂欢＊中国第一滩＊露天矿生态公园＊全程入住超豪华温德姆酒店＊推门即景，轻松悠闲＜畅玩海边泳池，享5公里私家沙滩，含3正2早，品当地特色餐，升级一晚酒店自助餐，纯玩＞ ￥ 799 2天 【尚·美食】肇庆2天＊一价全包 住福澳大酒店＊央视采访的天湖鹭鸟生态村 过万鹭鸟安居＊羚羊峡轻徒步、紫荆西堤文创区＊端砚博物馆＜含3正1早，豪华海鲜自助晚餐、喜有此鲤餐、杏花鸡餐＞ ￥ 499 2天 【尚·美食】肇庆2天＊住在星湖边的全新七星岩温德姆至尊酒店＊叹无限次园林养生汤泉＊爆红宋城骑楼街＊仙掌岩 北岭山＊土产批发市场＜酒店豪华自助早餐、地道麦溪鲩餐、肇城八宝餐，含2正1早＞ ￥ 469 1天 【岭南木棉红·走读广州】广州1／2天＊花城广场广州塔海心沙＊中山纪念堂越秀公园＊陈家祠永庆坊＊沙面万国建筑＊走读广州＊经典广州游＜专属旅游专家，360度玩转广州＞ ￥ 99 欢乐戏水 养生温泉 2天 【典·生态】清远阳山2天＊第一峰温泉度假村＊北山古寺＊无边际温泉，清凉山泉水泳池＊惬意度假胜地，篝火互动＊韩愈纪念馆＜甄选当地原材料烹饪特色美食，莫氏同款阳山双鸡煲特色餐，瑶服换装体验，纯玩无购物＞ ￥ 299 ￥399 2天 【直通车】河源客天下国际旅游度假区2/3天＊国际大酒店山景双人房＊超大水上乐园＊客家小镇体验民俗文化＊等待确认＜含早＞ ￥ 299 2天 【直通车】惠州龙门南昆山云顶温泉度假村2天＊含第一天中午自助简餐,含早含无限次温泉＊含无限次温泉＜龙门温泉品质标杆，山景房 森林房＞ ￥ 289 2天 【直通车】惠州龙门南昆山温德姆温泉酒店2天＊高级温泉房＊含无限次依云四季温泉中心门票＊房间温泉池2次浸泡＜含酒店自助早、自助晚餐＞ ￥ 399 2天 【直通车】从化圣托利温泉庄园2/3天＊高级温泉房＊房间1池水＊自助早餐＊无限次温泉＊往返交通＜含自助晚餐，恒温泳池、无边泳池，天然小苏打氡温泉、地中海风情＞ ￥ 269 更多玩法 周边畅游 3天 【尚·休闲】潮汕动车3天＊精品纯玩＊2晚豪华酒店＊5大潮汕特色餐＊人文深度体验＊南澳岛海滩漫步＜一价全包，16人成团派全陪＞ ￥ 1299 ￥1399 4天 【尚·深度】潮汕动车4天＊三城一岛深度纯玩＊3晚豪华酒店＊5大潮汕特色餐＊潮式非遗小吃制作体验＊岭南第一侨宅陈慈黉故居＜南澳岛海滩，热卖经典＞ ￥ 1599 3天 【直通车】台山3天＊颐和澜悦温泉酒店＊含酒店早餐和无限次温泉＊含往返交通＊等待确认 ￥ 399 2天 【尚·温泉】新兴、南海2天＊西樵山登高＊苏村转运锦鲤文化街＊入住悦天下森林秘境别墅房＊无限三料真温泉、威尼斯泳道＜含1正1早，新兴地道土产餐，酒店自助早餐＞ ￥ 469 3天 【直通车】台山3天＊喜运来温泉＊含往返交通＊含自助早和无限次温泉＜等待确认＞ ￥ 299",
    "source": "广之旅",
    "sourceLogo": "/icons/广.png",
    "destination": "广东",
    "duration": 3,
    "price": 1399,
    "priceUnit": "人",
    "departureDate": "2026-07-28",
    "returnDate": "2026-07-31",
    "transportType": "大巴往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "3早餐2正餐",
    "singleSupplement": 349,
    "singleSupplementNote": "单人出行需补单房差￥349，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 9,
    "totalSeats": 34,
    "highlights": [
      "广东必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往广东",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "告别广东，返回温馨的家",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 3.5,
    "reviewCount": 126,
    "bookingUrl": "http://nn.gzl.cn/around/guangdong.html",
    "images": [],
    "tags": [
      "海岛度假",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "海岛度假",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.455747",
    "updatedAt": "2026-05-07T01:02:13.455747"
  },
  {
    "id": "tour_58",
    "title": "乐游周边 休闲特色 3天 【周末 Plus】潮汕3天＊品潮汕功夫茶看英歌舞表演＊乘坐官方文旅轮渡打卡汕头内海湾＊觅食潮州古城牌坊街＊长龙卧波广济桥＜纯玩动车往返，潮式新旅游，周五下午出发＞ ￥ 1299 ￥1399 3天 【尚·海滩】湛江茂名3天＊浪漫海岸沙滩音乐节狂欢＊中国第一滩＊露天矿生态公园＊全程入住超豪华温德姆酒店＊推门即景，轻松悠闲＜畅玩海边泳池，享5公里私家沙滩，含3正2早，品当地特色餐，升级一晚酒店自助餐，纯玩＞ ￥ 799 2天 【尚·美食】肇庆2天＊一价全包 住福澳大酒店＊央视采访的天湖鹭鸟生态村 过万鹭鸟安居＊羚羊峡轻徒步、紫荆西堤文创区＊端砚博物馆＜含3正1早，豪华海鲜自助晚餐、喜有此鲤餐、杏花鸡餐＞ ￥ 499 2天 【尚·美食】肇庆2天＊住在星湖边的全新七星岩温德姆至尊酒店＊叹无限次园林养生汤泉＊爆红宋城骑楼街＊仙掌岩 北岭山＊土产批发市场＜酒店豪华自助早餐、地道麦溪鲩餐、肇城八宝餐，含2正1早＞ ￥ 469 1天 【岭南木棉红·走读广州】广州1／2天＊花城广场广州塔海心沙＊中山纪念堂越秀公园＊陈家祠永庆坊＊沙面万国建筑＊走读广州＊经典广州游＜专属旅游专家，360度玩转广州＞ ￥ 99",
    "source": "广之旅",
    "sourceLogo": "/icons/广.png",
    "destination": "广东",
    "duration": 3,
    "price": 1399,
    "priceUnit": "人",
    "departureDate": "2026-05-24",
    "returnDate": "2026-05-27",
    "transportType": "大巴往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "3早餐2正餐",
    "singleSupplement": 349,
    "singleSupplementNote": "单人出行需补单房差￥349，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 17,
    "totalSeats": 42,
    "highlights": [
      "广东必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往广东",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "告别广东，返回温馨的家",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.2,
    "reviewCount": 299,
    "bookingUrl": "http://nn.gzl.cn/around/guangdong.html",
    "images": [],
    "tags": [
      "海岛度假",
      "纯玩",
      "品质"
    ],
    "isHot": true,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "海岛度假",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.455747",
    "updatedAt": "2026-05-07T01:02:13.455747"
  },
  {
    "id": "tour_59",
    "title": "休闲特色 3天 【周末 Plus】潮汕3天＊品潮汕功夫茶看英歌舞表演＊乘坐官方文旅轮渡打卡汕头内海湾＊觅食潮州古城牌坊街＊长龙卧波广济桥＜纯玩动车往返，潮式新旅游，周五下午出发＞ ￥ 1299 ￥1399 3天 【尚·海滩】湛江茂名3天＊浪漫海岸沙滩音乐节狂欢＊中国第一滩＊露天矿生态公园＊全程入住超豪华温德姆酒店＊推门即景，轻松悠闲＜畅玩海边泳池，享5公里私家沙滩，含3正2早，品当地特色餐，升级一晚酒店自助餐，纯玩＞ ￥ 799 2天 【尚·美食】肇庆2天＊一价全包 住福澳大酒店＊央视采访的天湖鹭鸟生态村 过万鹭鸟安居＊羚羊峡轻徒步、紫荆西堤文创区＊端砚博物馆＜含3正1早，豪华海鲜自助晚餐、喜有此鲤餐、杏花鸡餐＞ ￥ 499 2天 【尚·美食】肇庆2天＊住在星湖边的全新七星岩温德姆至尊酒店＊叹无限次园林养生汤泉＊爆红宋城骑楼街＊仙掌岩 北岭山＊土产批发市场＜酒店豪华自助早餐、地道麦溪鲩餐、肇城八宝餐，含2正1早＞ ￥ 469 1天 【岭南木棉红·走读广州】广州1／2天＊花城广场广州塔海心沙＊中山纪念堂越秀公园＊陈家祠永庆坊＊沙面万国建筑＊走读广州＊经典广州游＜专属旅游专家，360度玩转广州＞ ￥ 99",
    "source": "广之旅",
    "sourceLogo": "/icons/广.png",
    "destination": "广东",
    "duration": 3,
    "price": 1399,
    "priceUnit": "人",
    "departureDate": "2026-06-27",
    "returnDate": "2026-06-30",
    "transportType": "大巴往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "3早餐2正餐",
    "singleSupplement": 349,
    "singleSupplementNote": "单人出行需补单房差￥349，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 27,
    "totalSeats": 32,
    "highlights": [
      "广东必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往广东",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "告别广东，返回温馨的家",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.0,
    "reviewCount": 499,
    "bookingUrl": "http://nn.gzl.cn/around/guangdong.html",
    "images": [],
    "tags": [
      "海岛度假",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "海岛度假",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.455747",
    "updatedAt": "2026-05-07T01:02:13.455747"
  },
  {
    "id": "tour_60",
    "title": "3天 【周末 Plus】潮汕3天＊品潮汕功夫茶看英歌舞表演＊乘坐官方文旅轮渡打卡汕头内海湾＊觅食潮州古城牌坊街＊长龙卧波广济桥＜纯玩动车往返，潮式新旅游，周五下午出发＞ ￥ 1299 ￥1399 3天 【尚·海滩】湛江茂名3天＊浪漫海岸沙滩音乐节狂欢＊中国第一滩＊露天矿生态公园＊全程入住超豪华温德姆酒店＊推门即景，轻松悠闲＜畅玩海边泳池，享5公里私家沙滩，含3正2早，品当地特色餐，升级一晚酒店自助餐，纯玩＞ ￥ 799 2天 【尚·美食】肇庆2天＊一价全包 住福澳大酒店＊央视采访的天湖鹭鸟生态村 过万鹭鸟安居＊羚羊峡轻徒步、紫荆西堤文创区＊端砚博物馆＜含3正1早，豪华海鲜自助晚餐、喜有此鲤餐、杏花鸡餐＞ ￥ 499 2天 【尚·美食】肇庆2天＊住在星湖边的全新七星岩温德姆至尊酒店＊叹无限次园林养生汤泉＊爆红宋城骑楼街＊仙掌岩 北岭山＊土产批发市场＜酒店豪华自助早餐、地道麦溪鲩餐、肇城八宝餐，含2正1早＞ ￥ 469 1天 【岭南木棉红·走读广州】广州1／2天＊花城广场广州塔海心沙＊中山纪念堂越秀公园＊陈家祠永庆坊＊沙面万国建筑＊走读广州＊经典广州游＜专属旅游专家，360度玩转广州＞ ￥ 99",
    "source": "广之旅",
    "sourceLogo": "/icons/广.png",
    "destination": "广东",
    "duration": 3,
    "price": 1399,
    "priceUnit": "人",
    "departureDate": "2026-07-17",
    "returnDate": "2026-07-20",
    "transportType": "大巴往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "3早餐2正餐",
    "singleSupplement": 349,
    "singleSupplementNote": "单人出行需补单房差￥349，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 6,
    "totalSeats": 36,
    "highlights": [
      "广东必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往广东",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "告别广东，返回温馨的家",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 3.7,
    "reviewCount": 556,
    "bookingUrl": "http://nn.gzl.cn/around/guangdong.html",
    "images": [],
    "tags": [
      "海岛度假",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "海岛度假",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.455747",
    "updatedAt": "2026-05-07T01:02:13.455747"
  },
  {
    "id": "tour_61",
    "title": "3天 【周末 Plus】潮汕3天＊品潮汕功夫茶看英歌舞表演＊乘坐官方文旅轮渡打卡汕头内海湾＊觅食潮州古城牌坊街＊长龙卧波广济桥＜纯玩动车往返，潮式新旅游，周五下午出发＞ ￥ 1299 ￥1399",
    "source": "广之旅",
    "sourceLogo": "/icons/广.png",
    "destination": "其他",
    "duration": 3,
    "price": 1399,
    "originalPrice": 1727,
    "priceUnit": "人",
    "departureDate": "2026-07-14",
    "returnDate": "2026-07-17",
    "transportType": "大巴往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "3早餐2正餐",
    "singleSupplement": 349,
    "singleSupplementNote": "单人出行需补单房差￥349，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 27,
    "totalSeats": 47,
    "highlights": [
      "其他必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往其他",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "告别其他，返回温馨的家",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 3.5,
    "reviewCount": 25,
    "bookingUrl": "http://nn.gzl.cn/around/guangdong.html",
    "images": [],
    "tags": [
      "古镇文化",
      "纯玩",
      "品质"
    ],
    "isHot": true,
    "isNew": false,
    "isFlashSale": false,
    "discountRate": 19,
    "groupSize": "30人常规团",
    "theme": "古镇文化",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.455747",
    "updatedAt": "2026-05-07T01:02:13.455747"
  },
  {
    "id": "tour_62",
    "title": "【周末 Plus】潮汕3天＊品潮汕功夫茶看英歌舞表演＊乘坐官方文旅轮渡打卡汕头内海湾＊觅食潮州古城牌坊街＊长龙卧波广济桥＜纯玩动车往返，潮式新旅游，周五下午出发＞ ￥ 1299 ￥1399",
    "source": "广之旅",
    "sourceLogo": "/icons/广.png",
    "destination": "其他",
    "duration": 3,
    "price": 1399,
    "priceUnit": "人",
    "departureDate": "2026-06-03",
    "returnDate": "2026-06-06",
    "transportType": "大巴往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "3早餐2正餐",
    "singleSupplement": 349,
    "singleSupplementNote": "单人出行需补单房差￥349，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 13,
    "totalSeats": 38,
    "highlights": [
      "其他必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往其他",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "告别其他，返回温馨的家",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.5,
    "reviewCount": 621,
    "bookingUrl": "http://nn.gzl.cn/around/guangdong.html",
    "images": [],
    "tags": [
      "古镇文化",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "古镇文化",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.455747",
    "updatedAt": "2026-05-07T01:02:13.455747"
  },
  {
    "id": "tour_63",
    "title": "欢乐戏水 养生温泉 2天 【典·生态】清远阳山2天＊第一峰温泉度假村＊北山古寺＊无边际温泉，清凉山泉水泳池＊惬意度假胜地，篝火互动＊韩愈纪念馆＜甄选当地原材料烹饪特色美食，莫氏同款阳山双鸡煲特色餐，瑶服换装体验，纯玩无购物＞ ￥ 299 ￥399 2天 【直通车】河源客天下国际旅游度假区2/3天＊国际大酒店山景双人房＊超大水上乐园＊客家小镇体验民俗文化＊等待确认＜含早＞ ￥ 299 2天 【直通车】惠州龙门南昆山云顶温泉度假村2天＊含第一天中午自助简餐,含早含无限次温泉＊含无限次温泉＜龙门温泉品质标杆，山景房 森林房＞ ￥ 289 2天 【直通车】惠州龙门南昆山温德姆温泉酒店2天＊高级温泉房＊含无限次依云四季温泉中心门票＊房间温泉池2次浸泡＜含酒店自助早、自助晚餐＞ ￥ 399 2天 【直通车】从化圣托利温泉庄园2/3天＊高级温泉房＊房间1池水＊自助早餐＊无限次温泉＊往返交通＜含自助晚餐，恒温泳池、无边泳池，天然小苏打氡温泉、地中海风情＞ ￥ 269",
    "source": "广之旅",
    "sourceLogo": "/icons/广.png",
    "destination": "其他",
    "duration": 2,
    "price": 399,
    "priceUnit": "人",
    "departureDate": "2026-07-04",
    "returnDate": "2026-07-06",
    "transportType": "大巴往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "2早餐1正餐",
    "singleSupplement": 99,
    "singleSupplementNote": "单人出行需补单房差￥99，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 29,
    "totalSeats": 39,
    "highlights": [
      "其他必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往其他",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "告别其他，返回温馨的家",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 3.6,
    "reviewCount": 151,
    "bookingUrl": "http://nn.gzl.cn/around/guangdong.html",
    "images": [],
    "tags": [
      "海岛度假",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "海岛度假",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.455747",
    "updatedAt": "2026-05-07T01:02:13.455747"
  },
  {
    "id": "tour_64",
    "title": "养生温泉 2天 【典·生态】清远阳山2天＊第一峰温泉度假村＊北山古寺＊无边际温泉，清凉山泉水泳池＊惬意度假胜地，篝火互动＊韩愈纪念馆＜甄选当地原材料烹饪特色美食，莫氏同款阳山双鸡煲特色餐，瑶服换装体验，纯玩无购物＞ ￥ 299 ￥399 2天 【直通车】河源客天下国际旅游度假区2/3天＊国际大酒店山景双人房＊超大水上乐园＊客家小镇体验民俗文化＊等待确认＜含早＞ ￥ 299 2天 【直通车】惠州龙门南昆山云顶温泉度假村2天＊含第一天中午自助简餐,含早含无限次温泉＊含无限次温泉＜龙门温泉品质标杆，山景房 森林房＞ ￥ 289 2天 【直通车】惠州龙门南昆山温德姆温泉酒店2天＊高级温泉房＊含无限次依云四季温泉中心门票＊房间温泉池2次浸泡＜含酒店自助早、自助晚餐＞ ￥ 399 2天 【直通车】从化圣托利温泉庄园2/3天＊高级温泉房＊房间1池水＊自助早餐＊无限次温泉＊往返交通＜含自助晚餐，恒温泳池、无边泳池，天然小苏打氡温泉、地中海风情＞ ￥ 269",
    "source": "广之旅",
    "sourceLogo": "/icons/广.png",
    "destination": "其他",
    "duration": 2,
    "price": 399,
    "priceUnit": "人",
    "departureDate": "2026-05-16",
    "returnDate": "2026-05-18",
    "transportType": "大巴往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "2早餐1正餐",
    "singleSupplement": 99,
    "singleSupplementNote": "单人出行需补单房差￥99，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 29,
    "totalSeats": 34,
    "highlights": [
      "其他必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往其他",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "告别其他，返回温馨的家",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.1,
    "reviewCount": 246,
    "bookingUrl": "http://nn.gzl.cn/around/guangdong.html",
    "images": [],
    "tags": [
      "海岛度假",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "海岛度假",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.455747",
    "updatedAt": "2026-05-07T01:02:13.455747"
  },
  {
    "id": "tour_65",
    "title": "2天 【典·生态】清远阳山2天＊第一峰温泉度假村＊北山古寺＊无边际温泉，清凉山泉水泳池＊惬意度假胜地，篝火互动＊韩愈纪念馆＜甄选当地原材料烹饪特色美食，莫氏同款阳山双鸡煲特色餐，瑶服换装体验，纯玩无购物＞ ￥ 299 ￥399 2天 【直通车】河源客天下国际旅游度假区2/3天＊国际大酒店山景双人房＊超大水上乐园＊客家小镇体验民俗文化＊等待确认＜含早＞ ￥ 299 2天 【直通车】惠州龙门南昆山云顶温泉度假村2天＊含第一天中午自助简餐,含早含无限次温泉＊含无限次温泉＜龙门温泉品质标杆，山景房 森林房＞ ￥ 289 2天 【直通车】惠州龙门南昆山温德姆温泉酒店2天＊高级温泉房＊含无限次依云四季温泉中心门票＊房间温泉池2次浸泡＜含酒店自助早、自助晚餐＞ ￥ 399 2天 【直通车】从化圣托利温泉庄园2/3天＊高级温泉房＊房间1池水＊自助早餐＊无限次温泉＊往返交通＜含自助晚餐，恒温泳池、无边泳池，天然小苏打氡温泉、地中海风情＞ ￥ 269",
    "source": "广之旅",
    "sourceLogo": "/icons/广.png",
    "destination": "其他",
    "duration": 2,
    "price": 399,
    "priceUnit": "人",
    "departureDate": "2026-06-18",
    "returnDate": "2026-06-20",
    "transportType": "大巴往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "2早餐1正餐",
    "singleSupplement": 99,
    "singleSupplementNote": "单人出行需补单房差￥99，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 17,
    "totalSeats": 42,
    "highlights": [
      "其他必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往其他",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "告别其他，返回温馨的家",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 3.5,
    "reviewCount": 421,
    "bookingUrl": "http://nn.gzl.cn/around/guangdong.html",
    "images": [],
    "tags": [
      "海岛度假",
      "纯玩",
      "品质"
    ],
    "isHot": true,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "海岛度假",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.455747",
    "updatedAt": "2026-05-07T01:02:13.455747"
  },
  {
    "id": "tour_66",
    "title": "2天 【典·生态】清远阳山2天＊第一峰温泉度假村＊北山古寺＊无边际温泉，清凉山泉水泳池＊惬意度假胜地，篝火互动＊韩愈纪念馆＜甄选当地原材料烹饪特色美食，莫氏同款阳山双鸡煲特色餐，瑶服换装体验，纯玩无购物＞ ￥ 299 ￥399",
    "source": "广之旅",
    "sourceLogo": "/icons/广.png",
    "destination": "其他",
    "duration": 2,
    "price": 399,
    "priceUnit": "人",
    "departureDate": "2026-05-21",
    "returnDate": "2026-05-23",
    "transportType": "大巴往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "2早餐1正餐",
    "singleSupplement": 99,
    "singleSupplementNote": "单人出行需补单房差￥99，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 13,
    "totalSeats": 38,
    "highlights": [
      "其他必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往其他",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "告别其他，返回温馨的家",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.7,
    "reviewCount": 495,
    "bookingUrl": "http://nn.gzl.cn/around/guangdong.html",
    "images": [],
    "tags": [
      "海岛度假",
      "纯玩",
      "品质"
    ],
    "isHot": true,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "海岛度假",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.455747",
    "updatedAt": "2026-05-07T01:02:13.455747"
  },
  {
    "id": "tour_67",
    "title": "【典·生态】清远阳山2天＊第一峰温泉度假村＊北山古寺＊无边际温泉，清凉山泉水泳池＊惬意度假胜地，篝火互动＊韩愈纪念馆＜甄选当地原材料烹饪特色美食，莫氏同款阳山双鸡煲特色餐，瑶服换装体验，纯玩无购物＞ ￥ 299 ￥399",
    "source": "广之旅",
    "sourceLogo": "/icons/广.png",
    "destination": "其他",
    "duration": 2,
    "price": 399,
    "priceUnit": "人",
    "departureDate": "2026-05-28",
    "returnDate": "2026-05-30",
    "transportType": "大巴往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "2早餐1正餐",
    "singleSupplement": 99,
    "singleSupplementNote": "单人出行需补单房差￥99，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 16,
    "totalSeats": 41,
    "highlights": [
      "其他必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往其他",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "告别其他，返回温馨的家",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.0,
    "reviewCount": 784,
    "bookingUrl": "http://nn.gzl.cn/around/guangdong.html",
    "images": [],
    "tags": [
      "海岛度假",
      "纯玩",
      "品质"
    ],
    "isHot": true,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "海岛度假",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.455747",
    "updatedAt": "2026-05-07T01:02:13.455747"
  },
  {
    "id": "tour_68",
    "title": "更多玩法 周边畅游 3天 【尚·休闲】潮汕动车3天＊精品纯玩＊2晚豪华酒店＊5大潮汕特色餐＊人文深度体验＊南澳岛海滩漫步＜一价全包，16人成团派全陪＞ ￥ 1299 ￥1399 4天 【尚·深度】潮汕动车4天＊三城一岛深度纯玩＊3晚豪华酒店＊5大潮汕特色餐＊潮式非遗小吃制作体验＊岭南第一侨宅陈慈黉故居＜南澳岛海滩，热卖经典＞ ￥ 1599 3天 【直通车】台山3天＊颐和澜悦温泉酒店＊含酒店早餐和无限次温泉＊含往返交通＊等待确认 ￥ 399 2天 【尚·温泉】新兴、南海2天＊西樵山登高＊苏村转运锦鲤文化街＊入住悦天下森林秘境别墅房＊无限三料真温泉、威尼斯泳道＜含1正1早，新兴地道土产餐，酒店自助早餐＞ ￥ 469 3天 【直通车】台山3天＊喜运来温泉＊含往返交通＊含自助早和无限次温泉＜等待确认＞ ￥ 299",
    "source": "广之旅",
    "sourceLogo": "/icons/广.png",
    "destination": "其他",
    "duration": 3,
    "price": 1399,
    "priceUnit": "人",
    "departureDate": "2026-07-09",
    "returnDate": "2026-07-12",
    "transportType": "大巴往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "3早餐2正餐",
    "singleSupplement": 349,
    "singleSupplementNote": "单人出行需补单房差￥349，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 21,
    "totalSeats": 46,
    "highlights": [
      "其他必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往其他",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "告别其他，返回温馨的家",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.5,
    "reviewCount": 622,
    "bookingUrl": "http://nn.gzl.cn/around/guangdong.html",
    "images": [],
    "tags": [
      "海岛度假",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "海岛度假",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.455747",
    "updatedAt": "2026-05-07T01:02:13.455747"
  },
  {
    "id": "tour_69",
    "title": "周边畅游 3天 【尚·休闲】潮汕动车3天＊精品纯玩＊2晚豪华酒店＊5大潮汕特色餐＊人文深度体验＊南澳岛海滩漫步＜一价全包，16人成团派全陪＞ ￥ 1299 ￥1399 4天 【尚·深度】潮汕动车4天＊三城一岛深度纯玩＊3晚豪华酒店＊5大潮汕特色餐＊潮式非遗小吃制作体验＊岭南第一侨宅陈慈黉故居＜南澳岛海滩，热卖经典＞ ￥ 1599 3天 【直通车】台山3天＊颐和澜悦温泉酒店＊含酒店早餐和无限次温泉＊含往返交通＊等待确认 ￥ 399 2天 【尚·温泉】新兴、南海2天＊西樵山登高＊苏村转运锦鲤文化街＊入住悦天下森林秘境别墅房＊无限三料真温泉、威尼斯泳道＜含1正1早，新兴地道土产餐，酒店自助早餐＞ ￥ 469 3天 【直通车】台山3天＊喜运来温泉＊含往返交通＊含自助早和无限次温泉＜等待确认＞ ￥ 299",
    "source": "广之旅",
    "sourceLogo": "/icons/广.png",
    "destination": "其他",
    "duration": 3,
    "price": 1399,
    "originalPrice": 1685,
    "priceUnit": "人",
    "departureDate": "2026-06-09",
    "returnDate": "2026-06-12",
    "transportType": "大巴往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "3早餐2正餐",
    "singleSupplement": 349,
    "singleSupplementNote": "单人出行需补单房差￥349，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 10,
    "totalSeats": 40,
    "highlights": [
      "其他必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往其他",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "告别其他，返回温馨的家",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.1,
    "reviewCount": 335,
    "bookingUrl": "http://nn.gzl.cn/around/guangdong.html",
    "images": [],
    "tags": [
      "海岛度假",
      "纯玩",
      "品质"
    ],
    "isHot": true,
    "isNew": true,
    "isFlashSale": true,
    "discountRate": 17,
    "groupSize": "30人常规团",
    "theme": "海岛度假",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.455747",
    "updatedAt": "2026-05-07T01:02:13.455747"
  },
  {
    "id": "tour_70",
    "title": "3天 【尚·休闲】潮汕动车3天＊精品纯玩＊2晚豪华酒店＊5大潮汕特色餐＊人文深度体验＊南澳岛海滩漫步＜一价全包，16人成团派全陪＞ ￥ 1299 ￥1399 4天 【尚·深度】潮汕动车4天＊三城一岛深度纯玩＊3晚豪华酒店＊5大潮汕特色餐＊潮式非遗小吃制作体验＊岭南第一侨宅陈慈黉故居＜南澳岛海滩，热卖经典＞ ￥ 1599 3天 【直通车】台山3天＊颐和澜悦温泉酒店＊含酒店早餐和无限次温泉＊含往返交通＊等待确认 ￥ 399 2天 【尚·温泉】新兴、南海2天＊西樵山登高＊苏村转运锦鲤文化街＊入住悦天下森林秘境别墅房＊无限三料真温泉、威尼斯泳道＜含1正1早，新兴地道土产餐，酒店自助早餐＞ ￥ 469 3天 【直通车】台山3天＊喜运来温泉＊含往返交通＊含自助早和无限次温泉＜等待确认＞ ￥ 299",
    "source": "广之旅",
    "sourceLogo": "/icons/广.png",
    "destination": "其他",
    "duration": 3,
    "price": 1399,
    "originalPrice": 1571,
    "priceUnit": "人",
    "departureDate": "2026-07-04",
    "returnDate": "2026-07-07",
    "transportType": "大巴往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "3早餐2正餐",
    "singleSupplement": 349,
    "singleSupplementNote": "单人出行需补单房差￥349，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 11,
    "totalSeats": 31,
    "highlights": [
      "其他必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往其他",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "告别其他，返回温馨的家",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 3.7,
    "reviewCount": 227,
    "bookingUrl": "http://nn.gzl.cn/around/guangdong.html",
    "images": [],
    "tags": [
      "海岛度假",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "discountRate": 11,
    "groupSize": "30人常规团",
    "theme": "海岛度假",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.456747",
    "updatedAt": "2026-05-07T01:02:13.456747"
  },
  {
    "id": "tour_71",
    "title": "3天 【尚·休闲】潮汕动车3天＊精品纯玩＊2晚豪华酒店＊5大潮汕特色餐＊人文深度体验＊南澳岛海滩漫步＜一价全包，16人成团派全陪＞ ￥ 1299 ￥1399",
    "source": "广之旅",
    "sourceLogo": "/icons/广.png",
    "destination": "其他",
    "duration": 3,
    "price": 1399,
    "priceUnit": "人",
    "departureDate": "2026-05-28",
    "returnDate": "2026-05-31",
    "transportType": "大巴往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "3早餐2正餐",
    "singleSupplement": 349,
    "singleSupplementNote": "单人出行需补单房差￥349，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 11,
    "totalSeats": 41,
    "highlights": [
      "其他必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往其他",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "告别其他，返回温馨的家",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 3.7,
    "reviewCount": 740,
    "bookingUrl": "http://nn.gzl.cn/around/guangdong.html",
    "images": [],
    "tags": [
      "海岛度假",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "海岛度假",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.456747",
    "updatedAt": "2026-05-07T01:02:13.456747"
  },
  {
    "id": "tour_72",
    "title": "【尚·休闲】潮汕动车3天＊精品纯玩＊2晚豪华酒店＊5大潮汕特色餐＊人文深度体验＊南澳岛海滩漫步＜一价全包，16人成团派全陪＞ ￥ 1299 ￥1399",
    "source": "广之旅",
    "sourceLogo": "/icons/广.png",
    "destination": "其他",
    "duration": 3,
    "price": 1399,
    "priceUnit": "人",
    "departureDate": "2026-06-27",
    "returnDate": "2026-06-30",
    "transportType": "大巴往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "3早餐2正餐",
    "singleSupplement": 349,
    "singleSupplementNote": "单人出行需补单房差￥349，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 29,
    "totalSeats": 34,
    "highlights": [
      "其他必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往其他",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "告别其他，返回温馨的家",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 3.7,
    "reviewCount": 497,
    "bookingUrl": "http://nn.gzl.cn/around/guangdong.html",
    "images": [],
    "tags": [
      "海岛度假",
      "纯玩",
      "品质"
    ],
    "isHot": true,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "海岛度假",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.456747",
    "updatedAt": "2026-05-07T01:02:13.456747"
  },
  {
    "id": "tour_73",
    "title": "关键字 搜索 精选 一家一团 华誉甄品 智趣营 当季好景 HOT！热门推荐 【颂·深度】北京双飞5天＊故宫深度游＊圆明园遗址公园＊登八达岭长城＊参观恭王府＊安心游＜全程入住超豪华酒店，欢颂京城＞ ￥ 4999 ￥5999 【尚·深度】新疆乌鲁木齐、阿勒泰、双飞／三飞8天＊喀纳斯＊禾木＊乌尔禾魔鬼城＊赛里木湖＜穿越S21沙漠公路，品西域风情宴，深度北疆8天＞ ￥ 6999 【颂·全景】云南丽江、香格里拉、大理、昆明双飞6天＊玉龙雪山＊虎跳峡＊普达措国家公园＊洱海网红廊道＊大小石林＜丽江升级超豪华酒店，纯玩，丽广皇＞ ￥ 4799 【尚·全景】山西太原、忻州、平遥、双飞6天＊五台山＊云冈石窟＊平遥古城＊壶口瀑布＜2晚超豪华酒店，深度山西＞ ￥ 4999 【尚·深度】西宁、祁连、茶卡、格尔木、大柴旦、双飞8天＊青海湖＊茶卡盐湖＊乌素特水上雅丹＊察尔汗盐湖＊卓尔山＜圣湖牧歌，古堡非遗，戈壁奇观，藏地青海＞ ￥ 5399 美景中国 一家一团 【畅玩·一家一团】重庆武隆、双飞／双动5天＊天生三桥悬崖电梯＊仙女山草原小火车＊水陆空游重庆＜全程入住豪华市区酒店江景房，4人成团＞ ￥ 3699 ￥3999 【畅玩·一家一团】呼伦贝尔、额尔古纳、满洲里、海拉尔直飞6天＊莫尔格勒河＊额尔古纳湿地＊哈乌尔河＊恩和小镇＊中俄卡线＜4人成行，草原小火车，俄式列巴DIY，二次确认＞ ￥ 5199 【爆款抢购 ·一家一团】海南三亚双飞4天＊三亚五钻酒店＊亚特兰蒂斯水族馆or游艇出海or直升机等潮玩项目6选1＊三大海岛任选＊三亚往返＜2人成团，接送机，2日专属用车，二次确认＞ ￥ 2599 【畅玩·一家一团】海南、三亚、双飞4天＊1晚入住亚特兰蒂斯海景房＊景点6选1＜三亚往返，2人成团，亚特兰蒂斯水世界，三亚亚特兰蒂斯失落的空间水族馆，二次确认＞ ￥ 3699 【轻奢·一家一团】云南西双版纳双飞5天＊野象谷＊原始森林公园＊告庄星空夜市＊泼水狂欢＜全程入住当地超豪华，4人出发，等待确认，版纳一家一团＞ ￥ 3999 更多玩法 惠玩推荐 【典·全景】南京、无锡、苏州、上海、杭州双飞6天＊江南水乡南浔＊世界遗产西湖＊南京大报恩寺＊品味姑苏＊1晚升豪华酒店＜乐游，经典华东＞ ￥ 1599 ￥1899 【典·休闲】广西、中越边境崇左动车3天＊德天跨国瀑布＊明仕田园＊靖西鹅泉＊锦绣古镇＜纯玩0购物，越式风味餐＞ ￥ 699 【福见蓝眼泪】福建、平潭、泉州、龙岩永定、动车4天＊蓝眼泪爆发季＊北部湾风车海＊梧林古村落＊西街＊南江土楼＜升级1晚超豪华温泉酒店，山海宴，纯玩＞ ￥ 1299 【畅玩·一家一团】衡阳、衡山、高铁3／4天＊2人成团＊南岳衡山＊南岳大庙＊南岳里＜高铁直达衡山，一晚入住衡山下，4天加游长沙＞ ￥ 1999 【典·全景】海南、博鳌、三亚、双飞4天＊蜈支洲岛＊天涯海角＊兴隆巴厘村＊博鳌论坛永久会址＊鹿回头山顶公园＜升级1晚超豪华酒店、海鲜餐，三亚国际免税城，巴厘村换装体验，三亚鲜芒夜市，6人一定行＞ ￥ 2199",
    "source": "广之旅",
    "sourceLogo": "/icons/广.png",
    "destination": "云南",
    "duration": 5,
    "price": 5999,
    "priceUnit": "人",
    "departureDate": "2026-07-27",
    "returnDate": "2026-08-01",
    "transportType": "高铁往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "5早餐4正餐",
    "singleSupplement": 1499,
    "singleSupplementNote": "单人出行需补单房差￥1499，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 20,
    "totalSeats": 40,
    "highlights": [
      "云南必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往云南",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：云南游览",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：云南游览",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：云南游览",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "告别云南，返回温馨的家",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 3.9,
    "reviewCount": 482,
    "bookingUrl": "http://nn.gzl.cn/domestic/domestic.html",
    "images": [],
    "tags": [
      "海岛度假",
      "纯玩",
      "品质"
    ],
    "isHot": true,
    "isNew": true,
    "isFlashSale": true,
    "groupSize": "30人常规团",
    "theme": "海岛度假",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.456747",
    "updatedAt": "2026-05-07T01:02:13.456747"
  },
  {
    "id": "tour_74",
    "title": "当季好景 HOT！热门推荐 【颂·深度】北京双飞5天＊故宫深度游＊圆明园遗址公园＊登八达岭长城＊参观恭王府＊安心游＜全程入住超豪华酒店，欢颂京城＞ ￥ 4999 ￥5999 【尚·深度】新疆乌鲁木齐、阿勒泰、双飞／三飞8天＊喀纳斯＊禾木＊乌尔禾魔鬼城＊赛里木湖＜穿越S21沙漠公路，品西域风情宴，深度北疆8天＞ ￥ 6999 【颂·全景】云南丽江、香格里拉、大理、昆明双飞6天＊玉龙雪山＊虎跳峡＊普达措国家公园＊洱海网红廊道＊大小石林＜丽江升级超豪华酒店，纯玩，丽广皇＞ ￥ 4799 【尚·全景】山西太原、忻州、平遥、双飞6天＊五台山＊云冈石窟＊平遥古城＊壶口瀑布＜2晚超豪华酒店，深度山西＞ ￥ 4999 【尚·深度】西宁、祁连、茶卡、格尔木、大柴旦、双飞8天＊青海湖＊茶卡盐湖＊乌素特水上雅丹＊察尔汗盐湖＊卓尔山＜圣湖牧歌，古堡非遗，戈壁奇观，藏地青海＞ ￥ 5399",
    "source": "广之旅",
    "sourceLogo": "/icons/广.png",
    "destination": "云南",
    "duration": 5,
    "price": 5999,
    "priceUnit": "人",
    "departureDate": "2026-06-08",
    "returnDate": "2026-06-13",
    "transportType": "高铁往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "5早餐4正餐",
    "singleSupplement": 1499,
    "singleSupplementNote": "单人出行需补单房差￥1499，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 28,
    "totalSeats": 48,
    "highlights": [
      "云南必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往云南",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：云南游览",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：云南游览",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：云南游览",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "告别云南，返回温馨的家",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.1,
    "reviewCount": 810,
    "bookingUrl": "http://nn.gzl.cn/domestic/domestic.html",
    "images": [],
    "tags": [
      "户外徒步",
      "纯玩",
      "品质"
    ],
    "isHot": true,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "户外徒步",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.456747",
    "updatedAt": "2026-05-07T01:02:13.456747"
  },
  {
    "id": "tour_75",
    "title": "HOT！热门推荐 【颂·深度】北京双飞5天＊故宫深度游＊圆明园遗址公园＊登八达岭长城＊参观恭王府＊安心游＜全程入住超豪华酒店，欢颂京城＞ ￥ 4999 ￥5999 【尚·深度】新疆乌鲁木齐、阿勒泰、双飞／三飞8天＊喀纳斯＊禾木＊乌尔禾魔鬼城＊赛里木湖＜穿越S21沙漠公路，品西域风情宴，深度北疆8天＞ ￥ 6999 【颂·全景】云南丽江、香格里拉、大理、昆明双飞6天＊玉龙雪山＊虎跳峡＊普达措国家公园＊洱海网红廊道＊大小石林＜丽江升级超豪华酒店，纯玩，丽广皇＞ ￥ 4799 【尚·全景】山西太原、忻州、平遥、双飞6天＊五台山＊云冈石窟＊平遥古城＊壶口瀑布＜2晚超豪华酒店，深度山西＞ ￥ 4999 【尚·深度】西宁、祁连、茶卡、格尔木、大柴旦、双飞8天＊青海湖＊茶卡盐湖＊乌素特水上雅丹＊察尔汗盐湖＊卓尔山＜圣湖牧歌，古堡非遗，戈壁奇观，藏地青海＞ ￥ 5399",
    "source": "广之旅",
    "sourceLogo": "/icons/广.png",
    "destination": "云南",
    "duration": 5,
    "price": 5999,
    "originalPrice": 6817,
    "priceUnit": "人",
    "departureDate": "2026-06-09",
    "returnDate": "2026-06-14",
    "transportType": "高铁往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "5早餐4正餐",
    "singleSupplement": 1499,
    "singleSupplementNote": "单人出行需补单房差￥1499，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 20,
    "totalSeats": 35,
    "highlights": [
      "云南必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往云南",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：云南游览",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：云南游览",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：云南游览",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "告别云南，返回温馨的家",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 3.9,
    "reviewCount": 251,
    "bookingUrl": "http://nn.gzl.cn/domestic/domestic.html",
    "images": [],
    "tags": [
      "户外徒步",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": true,
    "isFlashSale": false,
    "discountRate": 12,
    "groupSize": "30人常规团",
    "theme": "户外徒步",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.456747",
    "updatedAt": "2026-05-07T01:02:13.456747"
  },
  {
    "id": "tour_76",
    "title": "【颂·深度】北京双飞5天＊故宫深度游＊圆明园遗址公园＊登八达岭长城＊参观恭王府＊安心游＜全程入住超豪华酒店，欢颂京城＞ ￥ 4999 ￥5999 【尚·深度】新疆乌鲁木齐、阿勒泰、双飞／三飞8天＊喀纳斯＊禾木＊乌尔禾魔鬼城＊赛里木湖＜穿越S21沙漠公路，品西域风情宴，深度北疆8天＞ ￥ 6999 【颂·全景】云南丽江、香格里拉、大理、昆明双飞6天＊玉龙雪山＊虎跳峡＊普达措国家公园＊洱海网红廊道＊大小石林＜丽江升级超豪华酒店，纯玩，丽广皇＞ ￥ 4799 【尚·全景】山西太原、忻州、平遥、双飞6天＊五台山＊云冈石窟＊平遥古城＊壶口瀑布＜2晚超豪华酒店，深度山西＞ ￥ 4999 【尚·深度】西宁、祁连、茶卡、格尔木、大柴旦、双飞8天＊青海湖＊茶卡盐湖＊乌素特水上雅丹＊察尔汗盐湖＊卓尔山＜圣湖牧歌，古堡非遗，戈壁奇观，藏地青海＞ ￥ 5399",
    "source": "广之旅",
    "sourceLogo": "/icons/广.png",
    "destination": "云南",
    "duration": 5,
    "price": 5999,
    "priceUnit": "人",
    "departureDate": "2026-06-15",
    "returnDate": "2026-06-20",
    "transportType": "高铁往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "5早餐4正餐",
    "singleSupplement": 1499,
    "singleSupplementNote": "单人出行需补单房差￥1499，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 27,
    "totalSeats": 32,
    "highlights": [
      "云南必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往云南",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：云南游览",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：云南游览",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：云南游览",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "告别云南，返回温馨的家",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.9,
    "reviewCount": 778,
    "bookingUrl": "http://nn.gzl.cn/domestic/domestic.html",
    "images": [],
    "tags": [
      "户外徒步",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "户外徒步",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.456747",
    "updatedAt": "2026-05-07T01:02:13.456747"
  },
  {
    "id": "tour_77",
    "title": "【颂·深度】北京双飞5天＊故宫深度游＊圆明园遗址公园＊登八达岭长城＊参观恭王府＊安心游＜全程入住超豪华酒店，欢颂京城＞ ￥ 4999 ￥5999",
    "source": "广之旅",
    "sourceLogo": "/icons/广.png",
    "destination": "北京",
    "duration": 5,
    "price": 5999,
    "priceUnit": "人",
    "departureDate": "2026-05-31",
    "returnDate": "2026-06-05",
    "transportType": "高铁往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "5早餐4正餐",
    "singleSupplement": 1499,
    "singleSupplementNote": "单人出行需补单房差￥1499，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 28,
    "totalSeats": 33,
    "highlights": [
      "北京必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往北京",
        "description": "今日安排北京精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：北京游览",
        "description": "今日安排北京精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：北京游览",
        "description": "今日安排北京精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：北京游览",
        "description": "今日安排北京精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "告别北京，返回温馨的家",
        "description": "今日安排北京精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.0,
    "reviewCount": 271,
    "bookingUrl": "http://nn.gzl.cn/domestic/domestic.html",
    "images": [],
    "tags": [
      "自然风光",
      "纯玩",
      "品质"
    ],
    "isHot": true,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "自然风光",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.456747",
    "updatedAt": "2026-05-07T01:02:13.456747"
  },
  {
    "id": "tour_78",
    "title": "美景中国 一家一团 【畅玩·一家一团】重庆武隆、双飞／双动5天＊天生三桥悬崖电梯＊仙女山草原小火车＊水陆空游重庆＜全程入住豪华市区酒店江景房，4人成团＞ ￥ 3699 ￥3999 【畅玩·一家一团】呼伦贝尔、额尔古纳、满洲里、海拉尔直飞6天＊莫尔格勒河＊额尔古纳湿地＊哈乌尔河＊恩和小镇＊中俄卡线＜4人成行，草原小火车，俄式列巴DIY，二次确认＞ ￥ 5199 【爆款抢购 ·一家一团】海南三亚双飞4天＊三亚五钻酒店＊亚特兰蒂斯水族馆or游艇出海or直升机等潮玩项目6选1＊三大海岛任选＊三亚往返＜2人成团，接送机，2日专属用车，二次确认＞ ￥ 2599 【畅玩·一家一团】海南、三亚、双飞4天＊1晚入住亚特兰蒂斯海景房＊景点6选1＜三亚往返，2人成团，亚特兰蒂斯水世界，三亚亚特兰蒂斯失落的空间水族馆，二次确认＞ ￥ 3699 【轻奢·一家一团】云南西双版纳双飞5天＊野象谷＊原始森林公园＊告庄星空夜市＊泼水狂欢＜全程入住当地超豪华，4人出发，等待确认，版纳一家一团＞ ￥ 3999",
    "source": "广之旅",
    "sourceLogo": "/icons/广.png",
    "destination": "云南",
    "duration": 5,
    "price": 3999,
    "priceUnit": "人",
    "departureDate": "2026-06-13",
    "returnDate": "2026-06-18",
    "transportType": "高铁往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "5早餐4正餐",
    "singleSupplement": 999,
    "singleSupplementNote": "单人出行需补单房差￥999，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 29,
    "totalSeats": 34,
    "highlights": [
      "云南必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往云南",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：云南游览",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：云南游览",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：云南游览",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "告别云南，返回温馨的家",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.6,
    "reviewCount": 364,
    "bookingUrl": "http://nn.gzl.cn/domestic/domestic.html",
    "images": [],
    "tags": [
      "海岛度假",
      "纯玩",
      "品质"
    ],
    "isHot": true,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "海岛度假",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.456747",
    "updatedAt": "2026-05-07T01:02:13.456747"
  },
  {
    "id": "tour_79",
    "title": "一家一团 【畅玩·一家一团】重庆武隆、双飞／双动5天＊天生三桥悬崖电梯＊仙女山草原小火车＊水陆空游重庆＜全程入住豪华市区酒店江景房，4人成团＞ ￥ 3699 ￥3999 【畅玩·一家一团】呼伦贝尔、额尔古纳、满洲里、海拉尔直飞6天＊莫尔格勒河＊额尔古纳湿地＊哈乌尔河＊恩和小镇＊中俄卡线＜4人成行，草原小火车，俄式列巴DIY，二次确认＞ ￥ 5199 【爆款抢购 ·一家一团】海南三亚双飞4天＊三亚五钻酒店＊亚特兰蒂斯水族馆or游艇出海or直升机等潮玩项目6选1＊三大海岛任选＊三亚往返＜2人成团，接送机，2日专属用车，二次确认＞ ￥ 2599 【畅玩·一家一团】海南、三亚、双飞4天＊1晚入住亚特兰蒂斯海景房＊景点6选1＜三亚往返，2人成团，亚特兰蒂斯水世界，三亚亚特兰蒂斯失落的空间水族馆，二次确认＞ ￥ 3699 【轻奢·一家一团】云南西双版纳双飞5天＊野象谷＊原始森林公园＊告庄星空夜市＊泼水狂欢＜全程入住当地超豪华，4人出发，等待确认，版纳一家一团＞ ￥ 3999",
    "source": "广之旅",
    "sourceLogo": "/icons/广.png",
    "destination": "云南",
    "duration": 5,
    "price": 3999,
    "priceUnit": "人",
    "departureDate": "2026-07-22",
    "returnDate": "2026-07-27",
    "transportType": "高铁往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "5早餐4正餐",
    "singleSupplement": 999,
    "singleSupplementNote": "单人出行需补单房差￥999，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 7,
    "totalSeats": 37,
    "highlights": [
      "云南必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往云南",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：云南游览",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：云南游览",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：云南游览",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "告别云南，返回温馨的家",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 3.9,
    "reviewCount": 91,
    "bookingUrl": "http://nn.gzl.cn/domestic/domestic.html",
    "images": [],
    "tags": [
      "海岛度假",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "海岛度假",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.456747",
    "updatedAt": "2026-05-07T01:02:13.456747"
  },
  {
    "id": "tour_80",
    "title": "【畅玩·一家一团】重庆武隆、双飞／双动5天＊天生三桥悬崖电梯＊仙女山草原小火车＊水陆空游重庆＜全程入住豪华市区酒店江景房，4人成团＞ ￥ 3699 ￥3999 【畅玩·一家一团】呼伦贝尔、额尔古纳、满洲里、海拉尔直飞6天＊莫尔格勒河＊额尔古纳湿地＊哈乌尔河＊恩和小镇＊中俄卡线＜4人成行，草原小火车，俄式列巴DIY，二次确认＞ ￥ 5199 【爆款抢购 ·一家一团】海南三亚双飞4天＊三亚五钻酒店＊亚特兰蒂斯水族馆or游艇出海or直升机等潮玩项目6选1＊三大海岛任选＊三亚往返＜2人成团，接送机，2日专属用车，二次确认＞ ￥ 2599 【畅玩·一家一团】海南、三亚、双飞4天＊1晚入住亚特兰蒂斯海景房＊景点6选1＜三亚往返，2人成团，亚特兰蒂斯水世界，三亚亚特兰蒂斯失落的空间水族馆，二次确认＞ ￥ 3699 【轻奢·一家一团】云南西双版纳双飞5天＊野象谷＊原始森林公园＊告庄星空夜市＊泼水狂欢＜全程入住当地超豪华，4人出发，等待确认，版纳一家一团＞ ￥ 3999",
    "source": "广之旅",
    "sourceLogo": "/icons/广.png",
    "destination": "云南",
    "duration": 5,
    "price": 3999,
    "originalPrice": 4596,
    "priceUnit": "人",
    "departureDate": "2026-06-04",
    "returnDate": "2026-06-09",
    "transportType": "高铁往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "5早餐4正餐",
    "singleSupplement": 999,
    "singleSupplementNote": "单人出行需补单房差￥999，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 6,
    "totalSeats": 36,
    "highlights": [
      "云南必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往云南",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：云南游览",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：云南游览",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：云南游览",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "告别云南，返回温馨的家",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.5,
    "reviewCount": 144,
    "bookingUrl": "http://nn.gzl.cn/domestic/domestic.html",
    "images": [],
    "tags": [
      "海岛度假",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "discountRate": 13,
    "groupSize": "30人常规团",
    "theme": "海岛度假",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.456747",
    "updatedAt": "2026-05-07T01:02:13.456747"
  },
  {
    "id": "tour_81",
    "title": "【畅玩·一家一团】重庆武隆、双飞／双动5天＊天生三桥悬崖电梯＊仙女山草原小火车＊水陆空游重庆＜全程入住豪华市区酒店江景房，4人成团＞ ￥ 3699 ￥3999",
    "source": "广之旅",
    "sourceLogo": "/icons/广.png",
    "destination": "其他",
    "duration": 5,
    "price": 3999,
    "originalPrice": 4300,
    "priceUnit": "人",
    "departureDate": "2026-07-10",
    "returnDate": "2026-07-15",
    "transportType": "高铁往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "5早餐4正餐",
    "singleSupplement": 999,
    "singleSupplementNote": "单人出行需补单房差￥999，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 29,
    "totalSeats": 34,
    "highlights": [
      "其他必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往其他",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "告别其他，返回温馨的家",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.0,
    "reviewCount": 694,
    "bookingUrl": "http://nn.gzl.cn/domestic/domestic.html",
    "images": [],
    "tags": [
      "自然风光",
      "纯玩",
      "品质"
    ],
    "isHot": true,
    "isNew": false,
    "isFlashSale": false,
    "discountRate": 7,
    "groupSize": "30人常规团",
    "theme": "自然风光",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.456747",
    "updatedAt": "2026-05-07T01:02:13.456747"
  },
  {
    "id": "tour_82",
    "title": "更多玩法 惠玩推荐 【典·全景】南京、无锡、苏州、上海、杭州双飞6天＊江南水乡南浔＊世界遗产西湖＊南京大报恩寺＊品味姑苏＊1晚升豪华酒店＜乐游，经典华东＞ ￥ 1599 ￥1899 【典·休闲】广西、中越边境崇左动车3天＊德天跨国瀑布＊明仕田园＊靖西鹅泉＊锦绣古镇＜纯玩0购物，越式风味餐＞ ￥ 699 【福见蓝眼泪】福建、平潭、泉州、龙岩永定、动车4天＊蓝眼泪爆发季＊北部湾风车海＊梧林古村落＊西街＊南江土楼＜升级1晚超豪华温泉酒店，山海宴，纯玩＞ ￥ 1299 【畅玩·一家一团】衡阳、衡山、高铁3／4天＊2人成团＊南岳衡山＊南岳大庙＊南岳里＜高铁直达衡山，一晚入住衡山下，4天加游长沙＞ ￥ 1999 【典·全景】海南、博鳌、三亚、双飞4天＊蜈支洲岛＊天涯海角＊兴隆巴厘村＊博鳌论坛永久会址＊鹿回头山顶公园＜升级1晚超豪华酒店、海鲜餐，三亚国际免税城，巴厘村换装体验，三亚鲜芒夜市，6人一定行＞ ￥ 2199",
    "source": "广之旅",
    "sourceLogo": "/icons/广.png",
    "destination": "三亚",
    "duration": 6,
    "price": 1899,
    "priceUnit": "人",
    "departureDate": "2026-07-16",
    "returnDate": "2026-07-22",
    "transportType": "飞机往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "6早餐5正餐",
    "singleSupplement": 474,
    "singleSupplementNote": "单人出行需补单房差￥474，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 17,
    "totalSeats": 32,
    "highlights": [
      "三亚必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往三亚",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：三亚游览",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：三亚游览",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：三亚游览",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "第5天：三亚游览",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 6,
        "title": "告别三亚，返回温馨的家",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.8,
    "reviewCount": 364,
    "bookingUrl": "http://nn.gzl.cn/domestic/domestic.html",
    "images": [],
    "tags": [
      "海岛度假",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "海岛度假",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.456747",
    "updatedAt": "2026-05-07T01:02:13.456747"
  },
  {
    "id": "tour_83",
    "title": "惠玩推荐 【典·全景】南京、无锡、苏州、上海、杭州双飞6天＊江南水乡南浔＊世界遗产西湖＊南京大报恩寺＊品味姑苏＊1晚升豪华酒店＜乐游，经典华东＞ ￥ 1599 ￥1899 【典·休闲】广西、中越边境崇左动车3天＊德天跨国瀑布＊明仕田园＊靖西鹅泉＊锦绣古镇＜纯玩0购物，越式风味餐＞ ￥ 699 【福见蓝眼泪】福建、平潭、泉州、龙岩永定、动车4天＊蓝眼泪爆发季＊北部湾风车海＊梧林古村落＊西街＊南江土楼＜升级1晚超豪华温泉酒店，山海宴，纯玩＞ ￥ 1299 【畅玩·一家一团】衡阳、衡山、高铁3／4天＊2人成团＊南岳衡山＊南岳大庙＊南岳里＜高铁直达衡山，一晚入住衡山下，4天加游长沙＞ ￥ 1999 【典·全景】海南、博鳌、三亚、双飞4天＊蜈支洲岛＊天涯海角＊兴隆巴厘村＊博鳌论坛永久会址＊鹿回头山顶公园＜升级1晚超豪华酒店、海鲜餐，三亚国际免税城，巴厘村换装体验，三亚鲜芒夜市，6人一定行＞ ￥ 2199",
    "source": "广之旅",
    "sourceLogo": "/icons/广.png",
    "destination": "三亚",
    "duration": 6,
    "price": 1899,
    "originalPrice": 2182,
    "priceUnit": "人",
    "departureDate": "2026-07-11",
    "returnDate": "2026-07-17",
    "transportType": "飞机往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "6早餐5正餐",
    "singleSupplement": 474,
    "singleSupplementNote": "单人出行需补单房差￥474，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 15,
    "totalSeats": 30,
    "highlights": [
      "三亚必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往三亚",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：三亚游览",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：三亚游览",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：三亚游览",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "第5天：三亚游览",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 6,
        "title": "告别三亚，返回温馨的家",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.2,
    "reviewCount": 100,
    "bookingUrl": "http://nn.gzl.cn/domestic/domestic.html",
    "images": [],
    "tags": [
      "海岛度假",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": true,
    "isFlashSale": true,
    "discountRate": 13,
    "groupSize": "30人常规团",
    "theme": "海岛度假",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.456747",
    "updatedAt": "2026-05-07T01:02:13.456747"
  },
  {
    "id": "tour_84",
    "title": "【典·全景】南京、无锡、苏州、上海、杭州双飞6天＊江南水乡南浔＊世界遗产西湖＊南京大报恩寺＊品味姑苏＊1晚升豪华酒店＜乐游，经典华东＞ ￥ 1599 ￥1899 【典·休闲】广西、中越边境崇左动车3天＊德天跨国瀑布＊明仕田园＊靖西鹅泉＊锦绣古镇＜纯玩0购物，越式风味餐＞ ￥ 699 【福见蓝眼泪】福建、平潭、泉州、龙岩永定、动车4天＊蓝眼泪爆发季＊北部湾风车海＊梧林古村落＊西街＊南江土楼＜升级1晚超豪华温泉酒店，山海宴，纯玩＞ ￥ 1299 【畅玩·一家一团】衡阳、衡山、高铁3／4天＊2人成团＊南岳衡山＊南岳大庙＊南岳里＜高铁直达衡山，一晚入住衡山下，4天加游长沙＞ ￥ 1999 【典·全景】海南、博鳌、三亚、双飞4天＊蜈支洲岛＊天涯海角＊兴隆巴厘村＊博鳌论坛永久会址＊鹿回头山顶公园＜升级1晚超豪华酒店、海鲜餐，三亚国际免税城，巴厘村换装体验，三亚鲜芒夜市，6人一定行＞ ￥ 2199",
    "source": "广之旅",
    "sourceLogo": "/icons/广.png",
    "destination": "三亚",
    "duration": 6,
    "price": 1899,
    "originalPrice": 2344,
    "priceUnit": "人",
    "departureDate": "2026-07-02",
    "returnDate": "2026-07-08",
    "transportType": "飞机往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "6早餐5正餐",
    "singleSupplement": 474,
    "singleSupplementNote": "单人出行需补单房差￥474，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 15,
    "totalSeats": 35,
    "highlights": [
      "三亚必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往三亚",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：三亚游览",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：三亚游览",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：三亚游览",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "第5天：三亚游览",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 6,
        "title": "告别三亚，返回温馨的家",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.4,
    "reviewCount": 430,
    "bookingUrl": "http://nn.gzl.cn/domestic/domestic.html",
    "images": [],
    "tags": [
      "海岛度假",
      "纯玩",
      "品质"
    ],
    "isHot": true,
    "isNew": true,
    "isFlashSale": false,
    "discountRate": 19,
    "groupSize": "30人常规团",
    "theme": "海岛度假",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.456747",
    "updatedAt": "2026-05-07T01:02:13.456747"
  },
  {
    "id": "tour_85",
    "title": "【典·全景】南京、无锡、苏州、上海、杭州双飞6天＊江南水乡南浔＊世界遗产西湖＊南京大报恩寺＊品味姑苏＊1晚升豪华酒店＜乐游，经典华东＞ ￥ 1599 ￥1899",
    "source": "广之旅",
    "sourceLogo": "/icons/广.png",
    "destination": "其他",
    "duration": 6,
    "price": 1899,
    "priceUnit": "人",
    "departureDate": "2026-07-30",
    "returnDate": "2026-08-05",
    "transportType": "飞机往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "6早餐5正餐",
    "singleSupplement": 474,
    "singleSupplementNote": "单人出行需补单房差￥474，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 16,
    "totalSeats": 41,
    "highlights": [
      "其他必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往其他",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "第5天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 6,
        "title": "告别其他，返回温馨的家",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.7,
    "reviewCount": 225,
    "bookingUrl": "http://nn.gzl.cn/domestic/domestic.html",
    "images": [],
    "tags": [
      "自然风光",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "自然风光",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.456747",
    "updatedAt": "2026-05-07T01:02:13.456747"
  },
  {
    "id": "tour_86",
    "title": "<广州增城-从化2日游>住从化望谷温泉酒店、带私家温泉泡池、增城大丰门漂流、流溪河国家森林公园 望谷温泉酒店公寓望谷温泉拥有10多个功能温泉池区及大型阳光游泳池，虽然池区不多，但每个温泉池舒适、休闲、带给你无限惬意。当您拎着行李推开酒店公寓房门，一间干净整洁、舒适典雅的客房呈现在您的面前，让人为 游玩目的地： 广州 南昆山 行程天数： 2天 交通方式： 汽车/汽车 ¥748 起 查看详情 <清远1日游>包含古龙峡全程漂，含船游北江小三峡，千人出游，百人好评贴心服务，纯玩无购物 产品概要行程天数：1天成团地点：深圳成团目的地：清远往返交通：汽车/汽车报名截止时间：团期前1天18点附加说明：可根据需要选择某段行程或升级行程，在该行程段分开安排或统一协调行程。接待标准•行程安排： 游玩目的地： 清远 古龙峡漂流 行程天数： 1天 交通方式： 汽车/汽车 ¥198 起 查看详情 <清远古龙峡漂流汽车2日游>东莞出发、漂国际漂流主赛道古龙峡漂流、银盏森林温泉、CS野战、农夫庄园看花海 品途专线—“牛在哪””“牛在玩”—漂有水上过山车之称的古龙峡漂流，升级全程飞龙漂，体验国际漂流主赛道的惊险魅力。“牛在吃”来有“凤城”之称的清远，怎能不品尝正宗清远鸡，全程安排两个宴，《清远烧鸡宴》， 游玩目的地： 东莞 清远 古龙峡漂流 行程天数： 2天 交通方式： 汽车/汽车 ¥477 起 查看详情 <清远1日游>东莞往返，体验古龙峡全程漂，游北江小三峡，贴心导游服务，纯玩无购物 古龙峡最刺激的漂流这个夏季激爽到底！这是浪尖上的过山车，是中国漂流的巅峰之作，是赛道长、落差大、流速快，最刺激的漂流！你敢来挑战吗* 游玩目的地： 东莞 清远 古龙峡漂流 行程天数： 1天 交通方式： 汽车/汽车 ¥198 起 查看详情 <深圳西冲沙滩-杨梅坑1日游>快艇冲浪登情人岛、环海单车、海滨BBQ烧烤 产品概要行程天数：1天0晚成团地点：东莞成团目的地：深圳往返交通：汽车/汽车报名截止时间：团期前1天18点组团形式：联合发团；本产品与其他旅行社联合发团。接待标准*贴心赠送：快艇与CS野战为二选一项目 游玩目的地： 西冲 海滨温泉 深圳 东莞 行程天数： 1天 交通方式： 汽车/汽车 ¥158 起 查看详情 <南澳西冲1日游>八千人出游、好评达9成、快艇环岛、海边BBQ、海边戏水游玩 ★杨梅坑环海骑行：近可观帆船游弋，远可望岛屿清影。★远离都市的喧嚣，投入到蔚蓝大海的怀抱中。 ★沙滩自助BBQ：有荤有素，我有美景，你有酒吗？ ★在沙滩赤脚漫步，心情一定 游玩目的地： 深圳 行程天数： 1天 交通方式： 汽车/汽车 ¥128 起 查看详情 <惠东2日游>住海滨温泉、温泉任泡、巽寮湾、海之星游艇、双月湾、海龟自然保护区、品一人一只鸡宴、海味霸王鸭 产品概要行程天数：2天1晚成团地点：深圳成团目的地：惠州往返交通：汽车/汽车报名截止时间：团期前1天17点产品特色产品特色详情★入住：海滨温泉度假酒店，享养生温泉（无限次任泡），儿童水上乐园★观赏：游览【港口海龟自然保护区】+【海之星游艇出海】★美食：品尝巽寮舌尖美食【海味霸王鸭 游玩目的地： 惠州 巽寮湾 海滨温泉 行程天数： 2天 交通方式： 汽车/汽车 ¥572 起 查看详情 <清远2日游>（漂流季）清远黄腾峡勇士漂、新银盏温泉、葡萄任吃、欧风小镇、可升级挑战101米屋顶摩天轮 产品概要行程天数：2天1晚成团地点：深圳成团目的地：清远往返交通：汽车/汽车报名截止时间：团期前1天18点接待标准•行程安排：空调大巴，一人一正座•游玩安排：黄腾峡漂流水上乐园新银盏温泉牛鱼嘴玻璃桥 游玩目的地： 清远 新银盏温泉 黄腾峡漂流 行程天数： 2天 交通方式： 汽车/汽车 ¥491 起 查看详情 <清远1日游>全国首座空中盘旋1080度龙腾峡空中玻璃漂流、享受落差128米，时速78公里激情漂流 龙腾峡玻璃漂流万众瞩目龙腾峡空中玻璃漂流空中盘旋1080度全程5.6公里落差128米时速78公里 游玩目的地： 清远 黄腾峡漂流 行程天数： 1天 交通方式： 汽车/汽车 ¥196 起 查看详情 <清远2日游>龙腾峡玻璃漂流 首创瀑布玻璃桥漂流 刺激开漂、西班牙小镇屋顶摩天轮、清远鸡火锅任吃、尽享湿身体验 产品概要行程天数：2天1晚成团地点：深圳成团目的地：清远往返交通：汽车/汽车报名截止时间：团期前1天18点 游玩目的地： 清远 黄腾峡漂流 行程天数： 2天 交通方式： 汽车/汽车 ¥322 起 查看详情 <河源巴士2日游>入住五星万绿湖美思威尔顿酒店、巴伐利亚黑森林乐园、镜花缘、美食休闲纯玩 产品概要行程天数：2天1晚成团地点：深圳成团目的地：河源往返交通：汽车/汽车报名截止时间：团期前1天17点产品特色更多优质线路推介★畅游：巴伐利亚庄园异国风情小镇，打卡网红景点黑森林乐园无忧畅玩★体验：赏万绿湖畔枫叶，看镜花缘风情表演★入住：市区5星酒店，浸泡酒店汤泉★品尝：农家 游玩目的地： 河源 行程天数： 2天 交通方式： 汽车/汽车 ¥627 起 查看详情 <清远1日游>清远古龙峡云天波霸、纯玩无购物、西班牙风情小镇、挑战玻璃大峡谷 游玩目的地： 清远 古龙峡漂流 行程天数： 1天 交通方式： 汽车/汽车 ¥197 起 查看详情 <西冲2日游>入住酒店、杨梅坑、大鹏所城、农庄趣味活动 ★杨梅坑，沿海岸骑自行车！★远离都市的喧嚣，投入到蔚蓝大海的怀抱中。★全情投入海上逍遥，乘坐快艇出海，体验海上风驰电掣的快感！★沙滩自助BBQ：有荤有素，我有美景，你有酒吗？ 游玩目的地： 西冲 深圳 行程天数： 2天 交通方式： 汽车/汽车 ¥464 起 查看详情 <清远古龙峡漂流-天子山瀑布2日游>天子山音乐派对、泳池BBQ啤酒任何、古龙峡全程漂流、天子山瀑布、七彩云足浴、葡萄园任吃 天子山轰趴轰趴开始[年青的我们、喝着啤酒唱着歌、尽情摇摆，狂魔乱舞，基情四射]【彩虹天幕泳池】无限次入园，畅泳真正的山泉水，清凉透彻，与大自然零接触.【BBQ晚餐】唱着啤酒唱着歌，BBQ自助烧烤【个 游玩目的地： 清远 古龙峡漂流 行程天数： 2天 交通方式： 汽车/汽车 ¥518 起 查看详情 <清远古龙峡2日游>纯玩无购物，体验清凉刺激的漂流**，享受无限次泡温泉，DIY农家乐，**CS野战，可参加玻璃桥活动 产品概要行程天数：2天1晚成团地点：深圳成团目的地：清远往返交通：汽车/汽车报名截止时间：团期前2天17点接待标准•用餐安排：2正1早餐（1011/一桌），DIY自助野炊+水库大盘鱼•住 游玩目的地： 清远 古龙峡漂流 行程天数： 2天 交通方式： 汽车/汽车 ¥451 起 查看详情 <惠州龙门温泉大观园度假村2日游>住南昆山温泉大观园酒店、享无限次温泉、欢乐水世界、昆山峡漂流、空中田园生态园、长津冰雪世界 南昆山温泉大观园温泉富含大量钙、镁、氡等对人体有益微量元素，最高水温达82摄氏度，岭南风情区分五个浸泡区，72个功能各异、各具的温泉池。温泉大观园温泉欢乐水世界引进了“冲关回旋”、“六彩滑道”、“动感 游玩目的地： 惠州 南昆山 温泉大观园 川龙峡漂流 行程天数： 2天 交通方式： 汽车/汽车 ¥678 起 查看详情 <清远古龙峡漂流-银盏温泉2日游>古龙峡飞龙全程漂、银盏森林温泉、牛鱼嘴、水晶弹野战、农家乐野炊、深圳东莞出发 古龙峡漂流清远是中国漂流之乡，而古龙峡作为清远漂流的巅峰之作，被业界评论为“广东漂流看清远，清远漂流看古龙”古龙峡漂流，是广东至刺激的漂流，没有之一。高差达千米的古龙大峡谷赋予了漂流与众不同的，集瀑 游玩目的地： 清远 新银盏温泉 古龙峡漂流 行程天数： 2天 交通方式： 汽车/汽车 ¥428 起 查看详情 <清远古龙峡2日游>古龙峡升级全程飞龙漂、挑战三项世界****的玻璃大峡谷云天波霸 古龙峡漂流清远古龙峡国际漂流赛场是国家AAAA级旅游景区，国际漂流大赛专业赛场。清远是中国漂流之乡，而古龙峡作为清远漂流的巅峰之作，以其全国至大的漂流落差、至刺激的漂流体验，被誉为：漂流之巅、落差之王 游玩目的地： 清远 古龙峡漂流 行程天数： 2天 交通方式： 汽车/汽车 ¥509 起 查看详情 <韶关云门山玻璃桥-百丈崖漂流2日游>云门山登1638级祥云梯、广东省首座全透明高空玻璃桥、禅景**漂百丈崖漂流、马坝人遗址狮子岩 百丈崖峡谷漂流大宝山植物茂盛,树木参天,古藤缠绕,翠竹成林,紫蝶成群,潭水清澈,是漂流探险,享受自然,重拾童趣的首选地。百丈崖峡谷漂流全长3公里,落差达100米,有数十个回旋处，游客在60分钟的漂流 游玩目的地： 韶关 百丈崖漂流 丹霞山 行程天数： 2天 交通方式： 汽车/汽车 ¥468 起 查看详情 <清远黄腾峡2日游>纯玩无购物，黄腾峡勇士漂流，国际4A级生态旅游区，抖音玻璃桥，泡温泉，CS，农家乐DIY，含矿泉水 清远漂流★“漂”最刺激最好玩的自然水域漂流赛道【黄腾峡勇士漂】★“惊”体验广东省最高悬挂玻璃吊桥抖音网红【牛鱼嘴玻璃桥】★“玩”野战是模仿军事体验【水晶弹野战】★“泡”清远最受欢迎的原生态温泉【银盏森 游玩目的地： 清远 黄腾峡漂流 行程天数： 2天 交通方式： 汽车/汽车 ¥451 起 查看详情 <惠州亚婆角-融创海湾半岛3日游>住2晚海湾半岛度假酒店180度海景房、30层高空全海景餐厅自助早、十里私家沙滩 住：2晚海湾半岛海景酒店★180度全海景房：酒店以阳台面朝大海的建筑格局，户户朝海，一趟进房门，就能感受到大海冲进眼帘。★海景自助餐厅：行程包含2次早餐，在30多楼层的海景餐厅品美味早餐，来一场与大海 游玩目的地： 惠州 巽寮湾 行程天数： 3天 交通方式： 汽车/汽车 ¥856 起 查看详情 <深圳西冲沙滩+较场尾+大鹏所城2日游>住西冲特色客栈、巴士往返 西冲沙滩中国八大海滩之一【深圳西冲沙滩】。这块净土，被深圳旅游行业知名人士三彩先生称作“深圳的香格里拉”，可以和三亚媲美的海滨度假胜地就是南澳西冲。西冲拥有深圳高水准沙滩、洁净的海域、引人入胜的海滨田 游玩目的地： 东部华侨城 西冲 深圳 行程天数： 2天 交通方式： 汽车/汽车 ¥198 起 查看详情 <潮州古城-汕头南澳岛动车2日游>游潮州古城、江滨长廊、甲第巷、韩文公祠、汕头南澳岛青澳湾，品正宗潮汕牛肉火锅 产品概要行程天数：2天1晚成团地点：深圳成团目的地：潮州往返交通：动车组/动车组报名截止时间：团期前1天18点产品特色重要提示1、公安厅规定：入住酒店时游客都须提供有效的身份证正本，若无酒店将不接待，小童未有身份证则须出示户口本；2、旅游车辆严禁超载，未成年小童及婴儿均需占有车位 游玩目的地： 汕头 南澳岛 潮州 行程天数： 2天 交通方式： 动车组/动车组 ¥919 起 查看详情 <清远2日游>玩转清泉湾高空漂流、梦幻水城、惊魂玻璃桥、任摘任食葡萄、入住景源艺术酒店/栢兰德金菱酒店 激情漂流【清远】旅游资源丰富，五大类资源各具，分布在各景区内的点达58处之多，是广东省旅游资源大市之一，素有中国温泉之乡、中国龙舟之乡、中国漂流之乡、中国旅游城市、中国宜居城市等美誉。 游玩目的地： 清远 青龙峡漂流 行程天数： 2天 交通方式： 汽车/汽车 ¥444 起 查看详情 <韶关丹霞山+长老峰+南华寺2日游>世界遗产丹霞山、广东名寺南华寺，升级入住曹溪温泉花园别墅 产品概要行程天数：2天1晚成团地点：深圳成团目的地：韶关往返交通：汽车/汽车报名截止时间：团期前1天11点产品特色丹霞山特色桂林山水甲天下，唯恐广东—丹霞。世界丹霞看中国，中国丹霞看仁化。南华寺特色南华寺是中国佛教名寺之一，是禅宗六祖惠能弘扬“南宗禅法”的发源地。风采楼特色风采楼 游玩目的地： 韶关 曹溪温泉 丹霞山 行程天数： 2天 交通方式： 汽车/汽车 ¥469 起 查看详情 <河源巴伐利亚2日游>巴伐利亚庄园、黑森林乐园泉、黄龙岩溶洞、5玻璃桥、客天下水晶温泉、恐龙水世界 产品概要行程天数：2天1晚成团地点：深圳成团目的地：河源往返交通：汽车/汽车报名截止时间：团期前1天18点产品特色重要提示1、旅游车辆严禁超载，未成年小童及婴儿均需占有车位。敬请客人按实际报名人数出行，未经旅行社同意不能临时增加人员（包括小童及婴儿），如车位不足，我社将拒绝上车。 游玩目的地： 河源 行程天数： 2天 交通方式： 汽车/汽车 ¥577 起 查看详情 <清远英德宝墩湖湖山温泉度假村2日游>住网红酒店宝墩湖温泉度假村别墅、温泉、山泉水泳道、仙桥地下河溶洞、浈阳坊旅游小镇 产品概要行程天数：2天1晚成团地点：深圳成团目的地：清远往返交通：汽车/汽车报名截止时间：团期前1天18点产品特色宝墩湖湖山温泉度假村英德宝墩湖湖山温泉度假村坐落于湖光山色的英宝望埠镇之中，拥有200多套别墅，以温泉养生为主题，并集餐饮、住宿、会议、康体、田园风光等多功能于一体的 游玩目的地： 行程天数： 2天 交通方式： 汽车/汽车 ¥650 起 查看详情 <清远黄腾峡漂流汽车2日游>漂流霸主 黄腾峡勇士漂流畅玩水上乐园 CS野战、激情越野车 入住云海碱泉温泉酒店 黄腾峡勇士漂流牛鱼嘴大樟沙滩 游玩目的地： 清远 黄腾峡漂流 行程天数： 2天 交通方式： 汽车/汽车 ¥429 起 查看详情 <潮汕2日游>入住金德宝凯悦国际温泉酒店温泉激情冲浪浸泡夏日清凉温泉潮州古城韩文公祠地道潮汕牛肉火锅任吃宴动车2天 产品概要行程天数：2天1晚成团地点：潮州成团目的地：潮州往返交通：动车组/动车组报名截止时间：团期前1天18点产品特色产品特色详情【舌尖美食】《地道潮汕正宗牛肉火锅》【小镇温泉】享受粤东温泉小镇自然出露的天然温泉资源【韩城文化】古朴典雅，肃穆端庄，赏一代文豪的纪念园【古城风韵】走 游玩目的地： 汕头 行程天数： 2天 交通方式： 动车组/动车组 ¥858 起 查看详情 <潮州古城+紫莲森林度假村+汕头南澳岛3日游>动车往返、住南澳岛上海边酒店、潮州紫莲度假村，体验潮汕文化，品尝潮汕特色美食，国庆团期下单立减 产品概要行程天数：3天2晚成团地点：深圳成团目的地：潮州往返交通：动车组/动车组报名截止时间：团期前1天14点产品特色特别优惠9月24日之前预订国庆团期的可以优惠100元/人重要提示1、公安厅规定：入住酒店时游客都须提供有效的身份证正本，若无酒店将不接待，小童未有身份证则须出示户 游玩目的地： 汕头 南澳岛 潮州 行程天数： 3天 交通方式： 动车组/动车组 ¥1334 起 查看详情 <增城从化2日游>增城白水寨、从化望谷温泉小镇、独立温泉池、天适樱花园 白水寨“中国第一瀑布”的白水寨景区，景区内建有9999级登山步径，总长6.6公里，19000多步，横跨三座高山，边接二大天池，号称“天南一梯”。海船木栈道是白水寨园区内受欢迎的游览线路，也是国内唯一 游玩目的地： 行程天数： 2天 交通方式： 汽车/汽车 ¥814 起 查看详情 <阳江2日游>阳江海陵岛、十里银滩、渔家乐游船、香家堡梦幻花世界 渔家乐游船【渔家乐游船】，出海畅游无限大海风光。海上风光秀丽、蓝天、绿岛、碧海混为一体，鸟鸣、渔歌、涛声此起彼伏，奇石与浪花起、海鸥为渔夫伴行，好一幅美丽壮阔的自然景画。旅途中，或鱼跃莺飞，霞光万丈， 游玩目的地： 阳江 海陵岛 行程天数： 2天 交通方式： 汽车/汽车 ¥596 起 查看详情 <江门佛山2日游>观凤仪里碉楼油菜花、泡纯真星泉温泉、顺德逢简水乡、南风古灶 凤仪里碉楼【凤仪里碉楼群】（游览约1小时）凤仪里碉楼古村落，又名\"女儿村\"，是塘口镇四九村委会下属一条自然村，已经有400多年的历史。凤仪里古村落占地面积约500多亩，里面的景致展示了开平大部分古村落 游玩目的地： 江门 行程天数： 2天 交通方式： 汽车/汽车 ¥596 起 查看详情 <江门古兜2日游>恩平锦江温泉、采摘时令水果、凤仪里碉楼、双合油菜花海 凤仪里碉楼【凤仪里碉楼群】（游览约1小时）凤仪里碉楼古村落，又名\"女儿村\"，是塘口镇四九村委会下属一条自然村，已经有400多年的历史。凤仪里古村落占地面积约500多亩，里面的景致展示了开平大部分古村落 游玩目的地： 江门 行程天数： 2天 交通方式： 汽车/汽车 ¥705 起 查看详情 <佛山2日游>梦里水乡百花园、三水金装卧佛、逢简水乡、清晖园、食滋补火锅宴、十二道锋味大盘鱼 逢简水乡『逢简水乡』、逢简水乡地处广东顺德区杏坛镇北端，锦鲤江畔，水资源以及水环境极优。绕村居水道达十公里有余，辖区水道达28公里之多。水光接天，碧波荡漾，曲折迂回有不尽之感觉。远离繁嚣，宽气清新宜 游玩目的地： 佛山 行程天数： 2天 交通方式： 汽车/汽车 ¥596 起 查看详情 <惠州2日游>中午出发懒人行程，宿舒适酒店，海滩夜晚BBQ，篝火晚会烟花秀，出海捕鱼自由活动无约束 产品概要行程天数：2天1晚成团地点：深圳成团目的地：惠州往返交通：汽车/汽车报名截止时间：团期前1天18点接待标准•用餐安排：一晚餐烧烤/一早餐牛奶加面包•住宿安排：一晚住宿金河酒店/新明园假日酒店 游玩目的地： 惠州 行程天数： 2天 交通方式： 汽车/汽车 ¥400 起 查看详情 <巽寮湾2日游>海之星游艇、一支箭、蜡像馆、永记生态园赏花 海之星【海之星游艇】来到美丽的巽寮湾、要享受她赋予的：阳光、海浪、奢华；也要观赏她的：美丽、梦幻与激情，漂亮的游艇一身雪白的船身在蔚蓝的大海上是那么耀眼，时尚的外型颇感奢华。沿途欣赏“海鸥岛、凤池岛、 游玩目的地： 巽寮湾 行程天数： 2天 交通方式： 汽车/汽车 ¥596 起 查看详情 <罗浮山2日游>罗浮山、哈斯塔特小镇、那里花开 罗浮山【罗浮山】，道孝圣地。罗浮山主峰飞云顶海拔1296米，峰顶盘圆平坦，花草并茂，云雾缭绕。参观全国十大道都明观——冲虚古观，冲虚古观为东晋著名的道教理论家、炼丹家、化学家、药物学家葛洪所创立。罗浮 游玩目的地： 罗浮山 行程天数： 2天 交通方式： 汽车/汽车 ¥596 起 查看详情 <清远连州地下河-湟川三峡2日游>观看桃花、探秘5A景区连州地下河（洞中一日，世上千年）、船游湟川三峡瀑布群、品连州风味宴、入住金瑶峰度假村 •用餐安排：品尝连州风味宴•住宿安排：入住全新酒店金瑶峰度假村标双•行程安排：往返旅游巴士，一人一正座•游玩安排：探秘连州地下河，船游湟川三峡•贴心赠送：赠送湟川三峡桃花岛，观赏桃花 游玩目的地： 清远 行程天数： 2天 交通方式： 汽车/汽车 ¥450 起 查看详情 <清远-英德2日游>入住云海碱性温泉酒店、无限次温泉、无边际泳池、清泉湾花海玻璃桥、天子山瀑布、七彩云足浴、水晶弹野战 云海碱性温泉38多个大小不一的温泉池中享受“温泉水滑洗凝”的贵妃泡浴待遇，尽洗疲劳，这些露天与半露天的温泉池镶嵌在鲜花碧草中，浓缩了中国园林艺术的精华，将亚洲温泉的古朴与浪漫发挥得淋漓尽致。 游玩目的地： 清远 行程天数： 2天 交通方式： 汽车/汽车 ¥398 起 查看详情 <珠海2日游>长隆海洋王国、大型烟花表演、圆明新园住长隆 产品概要行程天数：2天1晚成团地点：深圳成团目的地：珠海往返交通：汽车/汽车报名截止时间：团期前1天18点接待标准•行程安排：海洋王国门票、特别优惠1.65周岁以上的老人持有效证件现退景点门票 游玩目的地： 珠海 珠海长隆 行程天数： 2天 交通方式： 汽车/汽车 ¥780 起 查看详情 <惠州香溪古堡-龙门铁泉-奥地利小镇度假2日游>入住龙门汇都大酒店，浸泡龙门铁泉，含往返交通，含三正一早，游览那里花开主题公园 惠州龙门铁泉【浸泡】世界珍稀《黄金汤泉》，玩转欢乐冷暖水上世界【观赏】四季百花绽放名花异花斗争浪漫花海飘香【游览】香溪堡竹筏漂游、古堡探幽、竹车兜风【品尝】水库大头鱼宴 游玩目的地： 惠州 龙门铁泉 行程天数： 2天 交通方式： 汽车/汽车 ¥643 起 查看详情 <河源2日游>住五星万绿湖东方国际酒店、矿物汤泉、泳池、万绿湖镜花缘、万绿谷风景区 产品概要行程天数：2天1晚成团地点：深圳成团目的地：惠州往返交通：汽车/汽车报名截止时间：团期前1天18点重要提示1、旅游车辆严禁超载，未成年小童及婴儿均需占有车位。敬请客人按实际报名人数出行，未经旅 游玩目的地： 河源 行程天数： 2天 交通方式： 汽车/汽车 ¥673 起 查看详情 <珠海长隆海洋王国2日游>浪漫情侣游，长隆海洋王国、横琴烟花汇演，圆明新园、石景山公园、野狸岛、情侣路 简介当前珠海热门景点莫过于长隆海洋王国+烟花汇演，这是来珠海必玩必看的景点；夏天热门的项目莫过于玩水了，这么热的天气泡在水里，畅玩水上项目可谓是一大享受。本行程包含了以上提到的两点——长隆海洋王国+ 游玩目的地： 珠海 珠海长隆 行程天数： 2天 交通方式： 汽车/汽车 ¥758 起 查看详情 <珠海长隆2日游>纯玩无购物，珠海长隆海洋王国，唯美梦幻海洋街，5D视觉**，烟花汇演， 圆明新园，观港珠澳大桥 长隆海洋王国·长隆海洋王国是世界最大的海洋主题乐园，也是全球首创大型游乐设施与珍贵动物展区相结合的独特设计。·这里有亚洲第一台轨道最长的飞行过山车，和亚洲第一台水上过山车。·长隆海洋王国海洋馆同时荣获 游玩目的地： 珠海 珠海长隆 行程天数： 2天 交通方式： 汽车/汽车 ¥905 起 查看详情 高铁韶关B线：云门山玻璃桥、曹角湾古村、小坑水库、经律论文化小镇、翡翠玉观音、花世界、生肖广场、蓝山源岭南东方温泉酒店，双高铁两晚五星温泉美食享受三天团 ★刺激惊险——感受广东省规模最大的全透明高空景观玻璃桥；★归隐田园——感受清代古村落生活-曹角湾古村；★舌尖美食——安排当地特色餐饮，品尝地道韶关风味；★宿双五星——入住韶关蓝山源岭南东方温泉酒店+经律论温泉酒店；★品质出行——往返高铁，轻松出行，全程无购物，真正纯玩团！ 游玩目的地： 韶关 丹霞山 行程天数： 3天 交通方式： 高铁 ¥1529 起 查看详情 <清远巴士2日游>九瀑探险森林王国、**CS野战、尽享温泉 牛在“玩”清泉湾漂流+山水乐园新银盏温泉牛在“吃”享用清远餐，品尝正宗地道美食。 游玩目的地： 清远 黄腾峡漂流 深圳 行程天数： 2天 交通方式： 汽车/汽车 ¥453 起 查看详情 <韶关丹霞山-长老峰-曹溪温泉-南华寺2日游>住曹溪温泉度假村，览世界自然遗产（阴阳石），南华禅寺，韶关地标风采楼， 世界自然遗产丹霞山、南华寺、百年东街、风采楼、五马农业基地、入住曹溪温泉 游玩目的地： 韶关 曹溪温泉 丹霞山 东莞 行程天数： 2天 交通方式： 汽车/汽车 ¥590 起 查看详情 <清远2日游>古龙峡漂流、静山湖大马戏、卡丁车/越野车、灯光节、DIY野炊 惊魂玻璃桥高空玻璃吊桥建于清远牛鱼嘴风景区的悬崖上，桥全长达250米，悬空的桥身200米，离地高度超200米。近看，万丈深渊就在脚下仿佛置身于空中，蓝天白云近在咫尺。银盏森林温泉银盏森林温泉树木葱茏， 游玩目的地： 清远 古龙峡漂流 东莞 行程天数： 2天 交通方式： 汽车/汽车 ¥379 起 查看详情 <惠州龙门温泉直通车1晚2日游>入住依泉楼 1、泡罕有的“黄金泉”，其为地下深层天然自涌的温泉水，泉水颜色呈金黄色，对腰肌劳损、风湿性骨痛特有疗效；2、温泉项目齐全，任玩全国首创“天然黄金温泉蒸汽浴”、温泉冲浪、中药池、瀑布池、十二生肖池等； 游玩目的地： 惠州 东莞 龙门铁泉 行程天数： 2天 交通方式： 汽车/汽车 ¥453 起 查看详情 旅游选海外国旅有保障 品质保证 AAAAA级旅行社 旅游局认证 深圳旅游局认证 先行赔付 签约付款安全无忧 退款保障 3个工作日内退款保障 周边旅游旅游攻略",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "桂林",
    "duration": 2,
    "price": 748,
    "priceUnit": "人",
    "departureDate": "2026-06-02",
    "returnDate": "2026-06-04",
    "transportType": "大巴往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "2早餐1正餐",
    "singleSupplement": 187,
    "singleSupplementNote": "单人出行需补单房差￥187，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 8,
    "totalSeats": 48,
    "highlights": [
      "桂林必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往桂林",
        "description": "今日安排桂林精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "告别桂林，返回温馨的家",
        "description": "今日安排桂林精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.1,
    "reviewCount": 53,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "海岛度假",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "海岛度假",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.456747",
    "updatedAt": "2026-05-07T01:02:13.456747"
  },
  {
    "id": "tour_87",
    "title": "<广州增城-从化2日游>住从化望谷温泉酒店、带私家温泉泡池、增城大丰门漂流、流溪河国家森林公园 望谷温泉酒店公寓望谷温泉拥有10多个功能温泉池区及大型阳光游泳池，虽然池区不多，但每个温泉池舒适、休闲、带给你无限惬意。当您拎着行李推开酒店公寓房门，一间干净整洁、舒适典雅的客房呈现在您的面前，让人为 游玩目的地： 广州 南昆山 行程天数： 2天 交通方式： 汽车/汽车 ¥748 起 查看详情 <清远1日游>包含古龙峡全程漂，含船游北江小三峡，千人出游，百人好评贴心服务，纯玩无购物 产品概要行程天数：1天成团地点：深圳成团目的地：清远往返交通：汽车/汽车报名截止时间：团期前1天18点附加说明：可根据需要选择某段行程或升级行程，在该行程段分开安排或统一协调行程。接待标准•行程安排： 游玩目的地： 清远 古龙峡漂流 行程天数： 1天 交通方式： 汽车/汽车 ¥198 起 查看详情 <清远古龙峡漂流汽车2日游>东莞出发、漂国际漂流主赛道古龙峡漂流、银盏森林温泉、CS野战、农夫庄园看花海 品途专线—“牛在哪””“牛在玩”—漂有水上过山车之称的古龙峡漂流，升级全程飞龙漂，体验国际漂流主赛道的惊险魅力。“牛在吃”来有“凤城”之称的清远，怎能不品尝正宗清远鸡，全程安排两个宴，《清远烧鸡宴》， 游玩目的地： 东莞 清远 古龙峡漂流 行程天数： 2天 交通方式： 汽车/汽车 ¥477 起 查看详情 <清远1日游>东莞往返，体验古龙峡全程漂，游北江小三峡，贴心导游服务，纯玩无购物 古龙峡最刺激的漂流这个夏季激爽到底！这是浪尖上的过山车，是中国漂流的巅峰之作，是赛道长、落差大、流速快，最刺激的漂流！你敢来挑战吗* 游玩目的地： 东莞 清远 古龙峡漂流 行程天数： 1天 交通方式： 汽车/汽车 ¥198 起 查看详情 <深圳西冲沙滩-杨梅坑1日游>快艇冲浪登情人岛、环海单车、海滨BBQ烧烤 产品概要行程天数：1天0晚成团地点：东莞成团目的地：深圳往返交通：汽车/汽车报名截止时间：团期前1天18点组团形式：联合发团；本产品与其他旅行社联合发团。接待标准*贴心赠送：快艇与CS野战为二选一项目 游玩目的地： 西冲 海滨温泉 深圳 东莞 行程天数： 1天 交通方式： 汽车/汽车 ¥158 起 查看详情 <南澳西冲1日游>八千人出游、好评达9成、快艇环岛、海边BBQ、海边戏水游玩 ★杨梅坑环海骑行：近可观帆船游弋，远可望岛屿清影。★远离都市的喧嚣，投入到蔚蓝大海的怀抱中。 ★沙滩自助BBQ：有荤有素，我有美景，你有酒吗？ ★在沙滩赤脚漫步，心情一定 游玩目的地： 深圳 行程天数： 1天 交通方式： 汽车/汽车 ¥128 起 查看详情 <惠东2日游>住海滨温泉、温泉任泡、巽寮湾、海之星游艇、双月湾、海龟自然保护区、品一人一只鸡宴、海味霸王鸭 产品概要行程天数：2天1晚成团地点：深圳成团目的地：惠州往返交通：汽车/汽车报名截止时间：团期前1天17点产品特色产品特色详情★入住：海滨温泉度假酒店，享养生温泉（无限次任泡），儿童水上乐园★观赏：游览【港口海龟自然保护区】+【海之星游艇出海】★美食：品尝巽寮舌尖美食【海味霸王鸭 游玩目的地： 惠州 巽寮湾 海滨温泉 行程天数： 2天 交通方式： 汽车/汽车 ¥572 起 查看详情 <清远2日游>（漂流季）清远黄腾峡勇士漂、新银盏温泉、葡萄任吃、欧风小镇、可升级挑战101米屋顶摩天轮 产品概要行程天数：2天1晚成团地点：深圳成团目的地：清远往返交通：汽车/汽车报名截止时间：团期前1天18点接待标准•行程安排：空调大巴，一人一正座•游玩安排：黄腾峡漂流水上乐园新银盏温泉牛鱼嘴玻璃桥 游玩目的地： 清远 新银盏温泉 黄腾峡漂流 行程天数： 2天 交通方式： 汽车/汽车 ¥491 起 查看详情 <清远1日游>全国首座空中盘旋1080度龙腾峡空中玻璃漂流、享受落差128米，时速78公里激情漂流 龙腾峡玻璃漂流万众瞩目龙腾峡空中玻璃漂流空中盘旋1080度全程5.6公里落差128米时速78公里 游玩目的地： 清远 黄腾峡漂流 行程天数： 1天 交通方式： 汽车/汽车 ¥196 起 查看详情 <清远2日游>龙腾峡玻璃漂流 首创瀑布玻璃桥漂流 刺激开漂、西班牙小镇屋顶摩天轮、清远鸡火锅任吃、尽享湿身体验 产品概要行程天数：2天1晚成团地点：深圳成团目的地：清远往返交通：汽车/汽车报名截止时间：团期前1天18点 游玩目的地： 清远 黄腾峡漂流 行程天数： 2天 交通方式： 汽车/汽车 ¥322 起 查看详情 <河源巴士2日游>入住五星万绿湖美思威尔顿酒店、巴伐利亚黑森林乐园、镜花缘、美食休闲纯玩 产品概要行程天数：2天1晚成团地点：深圳成团目的地：河源往返交通：汽车/汽车报名截止时间：团期前1天17点产品特色更多优质线路推介★畅游：巴伐利亚庄园异国风情小镇，打卡网红景点黑森林乐园无忧畅玩★体验：赏万绿湖畔枫叶，看镜花缘风情表演★入住：市区5星酒店，浸泡酒店汤泉★品尝：农家 游玩目的地： 河源 行程天数： 2天 交通方式： 汽车/汽车 ¥627 起 查看详情 <清远1日游>清远古龙峡云天波霸、纯玩无购物、西班牙风情小镇、挑战玻璃大峡谷 游玩目的地： 清远 古龙峡漂流 行程天数： 1天 交通方式： 汽车/汽车 ¥197 起 查看详情 <西冲2日游>入住酒店、杨梅坑、大鹏所城、农庄趣味活动 ★杨梅坑，沿海岸骑自行车！★远离都市的喧嚣，投入到蔚蓝大海的怀抱中。★全情投入海上逍遥，乘坐快艇出海，体验海上风驰电掣的快感！★沙滩自助BBQ：有荤有素，我有美景，你有酒吗？ 游玩目的地： 西冲 深圳 行程天数： 2天 交通方式： 汽车/汽车 ¥464 起 查看详情 <清远古龙峡漂流-天子山瀑布2日游>天子山音乐派对、泳池BBQ啤酒任何、古龙峡全程漂流、天子山瀑布、七彩云足浴、葡萄园任吃 天子山轰趴轰趴开始[年青的我们、喝着啤酒唱着歌、尽情摇摆，狂魔乱舞，基情四射]【彩虹天幕泳池】无限次入园，畅泳真正的山泉水，清凉透彻，与大自然零接触.【BBQ晚餐】唱着啤酒唱着歌，BBQ自助烧烤【个 游玩目的地： 清远 古龙峡漂流 行程天数： 2天 交通方式： 汽车/汽车 ¥518 起 查看详情 <清远古龙峡2日游>纯玩无购物，体验清凉刺激的漂流**，享受无限次泡温泉，DIY农家乐，**CS野战，可参加玻璃桥活动 产品概要行程天数：2天1晚成团地点：深圳成团目的地：清远往返交通：汽车/汽车报名截止时间：团期前2天17点接待标准•用餐安排：2正1早餐（1011/一桌），DIY自助野炊+水库大盘鱼•住 游玩目的地： 清远 古龙峡漂流 行程天数： 2天 交通方式： 汽车/汽车 ¥451 起 查看详情 <惠州龙门温泉大观园度假村2日游>住南昆山温泉大观园酒店、享无限次温泉、欢乐水世界、昆山峡漂流、空中田园生态园、长津冰雪世界 南昆山温泉大观园温泉富含大量钙、镁、氡等对人体有益微量元素，最高水温达82摄氏度，岭南风情区分五个浸泡区，72个功能各异、各具的温泉池。温泉大观园温泉欢乐水世界引进了“冲关回旋”、“六彩滑道”、“动感 游玩目的地： 惠州 南昆山 温泉大观园 川龙峡漂流 行程天数： 2天 交通方式： 汽车/汽车 ¥678 起 查看详情 <清远古龙峡漂流-银盏温泉2日游>古龙峡飞龙全程漂、银盏森林温泉、牛鱼嘴、水晶弹野战、农家乐野炊、深圳东莞出发 古龙峡漂流清远是中国漂流之乡，而古龙峡作为清远漂流的巅峰之作，被业界评论为“广东漂流看清远，清远漂流看古龙”古龙峡漂流，是广东至刺激的漂流，没有之一。高差达千米的古龙大峡谷赋予了漂流与众不同的，集瀑 游玩目的地： 清远 新银盏温泉 古龙峡漂流 行程天数： 2天 交通方式： 汽车/汽车 ¥428 起 查看详情 <清远古龙峡2日游>古龙峡升级全程飞龙漂、挑战三项世界****的玻璃大峡谷云天波霸 古龙峡漂流清远古龙峡国际漂流赛场是国家AAAA级旅游景区，国际漂流大赛专业赛场。清远是中国漂流之乡，而古龙峡作为清远漂流的巅峰之作，以其全国至大的漂流落差、至刺激的漂流体验，被誉为：漂流之巅、落差之王 游玩目的地： 清远 古龙峡漂流 行程天数： 2天 交通方式： 汽车/汽车 ¥509 起 查看详情 <韶关云门山玻璃桥-百丈崖漂流2日游>云门山登1638级祥云梯、广东省首座全透明高空玻璃桥、禅景**漂百丈崖漂流、马坝人遗址狮子岩 百丈崖峡谷漂流大宝山植物茂盛,树木参天,古藤缠绕,翠竹成林,紫蝶成群,潭水清澈,是漂流探险,享受自然,重拾童趣的首选地。百丈崖峡谷漂流全长3公里,落差达100米,有数十个回旋处，游客在60分钟的漂流 游玩目的地： 韶关 百丈崖漂流 丹霞山 行程天数： 2天 交通方式： 汽车/汽车 ¥468 起 查看详情 <清远黄腾峡2日游>纯玩无购物，黄腾峡勇士漂流，国际4A级生态旅游区，抖音玻璃桥，泡温泉，CS，农家乐DIY，含矿泉水 清远漂流★“漂”最刺激最好玩的自然水域漂流赛道【黄腾峡勇士漂】★“惊”体验广东省最高悬挂玻璃吊桥抖音网红【牛鱼嘴玻璃桥】★“玩”野战是模仿军事体验【水晶弹野战】★“泡”清远最受欢迎的原生态温泉【银盏森 游玩目的地： 清远 黄腾峡漂流 行程天数： 2天 交通方式： 汽车/汽车 ¥451 起 查看详情 <惠州亚婆角-融创海湾半岛3日游>住2晚海湾半岛度假酒店180度海景房、30层高空全海景餐厅自助早、十里私家沙滩 住：2晚海湾半岛海景酒店★180度全海景房：酒店以阳台面朝大海的建筑格局，户户朝海，一趟进房门，就能感受到大海冲进眼帘。★海景自助餐厅：行程包含2次早餐，在30多楼层的海景餐厅品美味早餐，来一场与大海 游玩目的地： 惠州 巽寮湾 行程天数： 3天 交通方式： 汽车/汽车 ¥856 起 查看详情 <深圳西冲沙滩+较场尾+大鹏所城2日游>住西冲特色客栈、巴士往返 西冲沙滩中国八大海滩之一【深圳西冲沙滩】。这块净土，被深圳旅游行业知名人士三彩先生称作“深圳的香格里拉”，可以和三亚媲美的海滨度假胜地就是南澳西冲。西冲拥有深圳高水准沙滩、洁净的海域、引人入胜的海滨田 游玩目的地： 东部华侨城 西冲 深圳 行程天数： 2天 交通方式： 汽车/汽车 ¥198 起 查看详情 <潮州古城-汕头南澳岛动车2日游>游潮州古城、江滨长廊、甲第巷、韩文公祠、汕头南澳岛青澳湾，品正宗潮汕牛肉火锅 产品概要行程天数：2天1晚成团地点：深圳成团目的地：潮州往返交通：动车组/动车组报名截止时间：团期前1天18点产品特色重要提示1、公安厅规定：入住酒店时游客都须提供有效的身份证正本，若无酒店将不接待，小童未有身份证则须出示户口本；2、旅游车辆严禁超载，未成年小童及婴儿均需占有车位 游玩目的地： 汕头 南澳岛 潮州 行程天数： 2天 交通方式： 动车组/动车组 ¥919 起 查看详情 <清远2日游>玩转清泉湾高空漂流、梦幻水城、惊魂玻璃桥、任摘任食葡萄、入住景源艺术酒店/栢兰德金菱酒店 激情漂流【清远】旅游资源丰富，五大类资源各具，分布在各景区内的点达58处之多，是广东省旅游资源大市之一，素有中国温泉之乡、中国龙舟之乡、中国漂流之乡、中国旅游城市、中国宜居城市等美誉。 游玩目的地： 清远 青龙峡漂流 行程天数： 2天 交通方式： 汽车/汽车 ¥444 起 查看详情 <韶关丹霞山+长老峰+南华寺2日游>世界遗产丹霞山、广东名寺南华寺，升级入住曹溪温泉花园别墅 产品概要行程天数：2天1晚成团地点：深圳成团目的地：韶关往返交通：汽车/汽车报名截止时间：团期前1天11点产品特色丹霞山特色桂林山水甲天下，唯恐广东—丹霞。世界丹霞看中国，中国丹霞看仁化。南华寺特色南华寺是中国佛教名寺之一，是禅宗六祖惠能弘扬“南宗禅法”的发源地。风采楼特色风采楼 游玩目的地： 韶关 曹溪温泉 丹霞山 行程天数： 2天 交通方式： 汽车/汽车 ¥469 起 查看详情 <河源巴伐利亚2日游>巴伐利亚庄园、黑森林乐园泉、黄龙岩溶洞、5玻璃桥、客天下水晶温泉、恐龙水世界 产品概要行程天数：2天1晚成团地点：深圳成团目的地：河源往返交通：汽车/汽车报名截止时间：团期前1天18点产品特色重要提示1、旅游车辆严禁超载，未成年小童及婴儿均需占有车位。敬请客人按实际报名人数出行，未经旅行社同意不能临时增加人员（包括小童及婴儿），如车位不足，我社将拒绝上车。 游玩目的地： 河源 行程天数： 2天 交通方式： 汽车/汽车 ¥577 起 查看详情 <清远英德宝墩湖湖山温泉度假村2日游>住网红酒店宝墩湖温泉度假村别墅、温泉、山泉水泳道、仙桥地下河溶洞、浈阳坊旅游小镇 产品概要行程天数：2天1晚成团地点：深圳成团目的地：清远往返交通：汽车/汽车报名截止时间：团期前1天18点产品特色宝墩湖湖山温泉度假村英德宝墩湖湖山温泉度假村坐落于湖光山色的英宝望埠镇之中，拥有200多套别墅，以温泉养生为主题，并集餐饮、住宿、会议、康体、田园风光等多功能于一体的 游玩目的地： 行程天数： 2天 交通方式： 汽车/汽车 ¥650 起 查看详情 <清远黄腾峡漂流汽车2日游>漂流霸主 黄腾峡勇士漂流畅玩水上乐园 CS野战、激情越野车 入住云海碱泉温泉酒店 黄腾峡勇士漂流牛鱼嘴大樟沙滩 游玩目的地： 清远 黄腾峡漂流 行程天数： 2天 交通方式： 汽车/汽车 ¥429 起 查看详情 <潮汕2日游>入住金德宝凯悦国际温泉酒店温泉激情冲浪浸泡夏日清凉温泉潮州古城韩文公祠地道潮汕牛肉火锅任吃宴动车2天 产品概要行程天数：2天1晚成团地点：潮州成团目的地：潮州往返交通：动车组/动车组报名截止时间：团期前1天18点产品特色产品特色详情【舌尖美食】《地道潮汕正宗牛肉火锅》【小镇温泉】享受粤东温泉小镇自然出露的天然温泉资源【韩城文化】古朴典雅，肃穆端庄，赏一代文豪的纪念园【古城风韵】走 游玩目的地： 汕头 行程天数： 2天 交通方式： 动车组/动车组 ¥858 起 查看详情 <潮州古城+紫莲森林度假村+汕头南澳岛3日游>动车往返、住南澳岛上海边酒店、潮州紫莲度假村，体验潮汕文化，品尝潮汕特色美食，国庆团期下单立减 产品概要行程天数：3天2晚成团地点：深圳成团目的地：潮州往返交通：动车组/动车组报名截止时间：团期前1天14点产品特色特别优惠9月24日之前预订国庆团期的可以优惠100元/人重要提示1、公安厅规定：入住酒店时游客都须提供有效的身份证正本，若无酒店将不接待，小童未有身份证则须出示户 游玩目的地： 汕头 南澳岛 潮州 行程天数： 3天 交通方式： 动车组/动车组 ¥1334 起 查看详情 <增城从化2日游>增城白水寨、从化望谷温泉小镇、独立温泉池、天适樱花园 白水寨“中国第一瀑布”的白水寨景区，景区内建有9999级登山步径，总长6.6公里，19000多步，横跨三座高山，边接二大天池，号称“天南一梯”。海船木栈道是白水寨园区内受欢迎的游览线路，也是国内唯一 游玩目的地： 行程天数： 2天 交通方式： 汽车/汽车 ¥814 起 查看详情 <阳江2日游>阳江海陵岛、十里银滩、渔家乐游船、香家堡梦幻花世界 渔家乐游船【渔家乐游船】，出海畅游无限大海风光。海上风光秀丽、蓝天、绿岛、碧海混为一体，鸟鸣、渔歌、涛声此起彼伏，奇石与浪花起、海鸥为渔夫伴行，好一幅美丽壮阔的自然景画。旅途中，或鱼跃莺飞，霞光万丈， 游玩目的地： 阳江 海陵岛 行程天数： 2天 交通方式： 汽车/汽车 ¥596 起 查看详情 <江门佛山2日游>观凤仪里碉楼油菜花、泡纯真星泉温泉、顺德逢简水乡、南风古灶 凤仪里碉楼【凤仪里碉楼群】（游览约1小时）凤仪里碉楼古村落，又名\"女儿村\"，是塘口镇四九村委会下属一条自然村，已经有400多年的历史。凤仪里古村落占地面积约500多亩，里面的景致展示了开平大部分古村落 游玩目的地： 江门 行程天数： 2天 交通方式： 汽车/汽车 ¥596 起 查看详情 <江门古兜2日游>恩平锦江温泉、采摘时令水果、凤仪里碉楼、双合油菜花海 凤仪里碉楼【凤仪里碉楼群】（游览约1小时）凤仪里碉楼古村落，又名\"女儿村\"，是塘口镇四九村委会下属一条自然村，已经有400多年的历史。凤仪里古村落占地面积约500多亩，里面的景致展示了开平大部分古村落 游玩目的地： 江门 行程天数： 2天 交通方式： 汽车/汽车 ¥705 起 查看详情 <佛山2日游>梦里水乡百花园、三水金装卧佛、逢简水乡、清晖园、食滋补火锅宴、十二道锋味大盘鱼 逢简水乡『逢简水乡』、逢简水乡地处广东顺德区杏坛镇北端，锦鲤江畔，水资源以及水环境极优。绕村居水道达十公里有余，辖区水道达28公里之多。水光接天，碧波荡漾，曲折迂回有不尽之感觉。远离繁嚣，宽气清新宜 游玩目的地： 佛山 行程天数： 2天 交通方式： 汽车/汽车 ¥596 起 查看详情 <惠州2日游>中午出发懒人行程，宿舒适酒店，海滩夜晚BBQ，篝火晚会烟花秀，出海捕鱼自由活动无约束 产品概要行程天数：2天1晚成团地点：深圳成团目的地：惠州往返交通：汽车/汽车报名截止时间：团期前1天18点接待标准•用餐安排：一晚餐烧烤/一早餐牛奶加面包•住宿安排：一晚住宿金河酒店/新明园假日酒店 游玩目的地： 惠州 行程天数： 2天 交通方式： 汽车/汽车 ¥400 起 查看详情 <巽寮湾2日游>海之星游艇、一支箭、蜡像馆、永记生态园赏花 海之星【海之星游艇】来到美丽的巽寮湾、要享受她赋予的：阳光、海浪、奢华；也要观赏她的：美丽、梦幻与激情，漂亮的游艇一身雪白的船身在蔚蓝的大海上是那么耀眼，时尚的外型颇感奢华。沿途欣赏“海鸥岛、凤池岛、 游玩目的地： 巽寮湾 行程天数： 2天 交通方式： 汽车/汽车 ¥596 起 查看详情 <罗浮山2日游>罗浮山、哈斯塔特小镇、那里花开 罗浮山【罗浮山】，道孝圣地。罗浮山主峰飞云顶海拔1296米，峰顶盘圆平坦，花草并茂，云雾缭绕。参观全国十大道都明观——冲虚古观，冲虚古观为东晋著名的道教理论家、炼丹家、化学家、药物学家葛洪所创立。罗浮 游玩目的地： 罗浮山 行程天数： 2天 交通方式： 汽车/汽车 ¥596 起 查看详情 <清远连州地下河-湟川三峡2日游>观看桃花、探秘5A景区连州地下河（洞中一日，世上千年）、船游湟川三峡瀑布群、品连州风味宴、入住金瑶峰度假村 •用餐安排：品尝连州风味宴•住宿安排：入住全新酒店金瑶峰度假村标双•行程安排：往返旅游巴士，一人一正座•游玩安排：探秘连州地下河，船游湟川三峡•贴心赠送：赠送湟川三峡桃花岛，观赏桃花 游玩目的地： 清远 行程天数： 2天 交通方式： 汽车/汽车 ¥450 起 查看详情 <清远-英德2日游>入住云海碱性温泉酒店、无限次温泉、无边际泳池、清泉湾花海玻璃桥、天子山瀑布、七彩云足浴、水晶弹野战 云海碱性温泉38多个大小不一的温泉池中享受“温泉水滑洗凝”的贵妃泡浴待遇，尽洗疲劳，这些露天与半露天的温泉池镶嵌在鲜花碧草中，浓缩了中国园林艺术的精华，将亚洲温泉的古朴与浪漫发挥得淋漓尽致。 游玩目的地： 清远 行程天数： 2天 交通方式： 汽车/汽车 ¥398 起 查看详情 <珠海2日游>长隆海洋王国、大型烟花表演、圆明新园住长隆 产品概要行程天数：2天1晚成团地点：深圳成团目的地：珠海往返交通：汽车/汽车报名截止时间：团期前1天18点接待标准•行程安排：海洋王国门票、特别优惠1.65周岁以上的老人持有效证件现退景点门票 游玩目的地： 珠海 珠海长隆 行程天数： 2天 交通方式： 汽车/汽车 ¥780 起 查看详情 <惠州香溪古堡-龙门铁泉-奥地利小镇度假2日游>入住龙门汇都大酒店，浸泡龙门铁泉，含往返交通，含三正一早，游览那里花开主题公园 惠州龙门铁泉【浸泡】世界珍稀《黄金汤泉》，玩转欢乐冷暖水上世界【观赏】四季百花绽放名花异花斗争浪漫花海飘香【游览】香溪堡竹筏漂游、古堡探幽、竹车兜风【品尝】水库大头鱼宴 游玩目的地： 惠州 龙门铁泉 行程天数： 2天 交通方式： 汽车/汽车 ¥643 起 查看详情 <河源2日游>住五星万绿湖东方国际酒店、矿物汤泉、泳池、万绿湖镜花缘、万绿谷风景区 产品概要行程天数：2天1晚成团地点：深圳成团目的地：惠州往返交通：汽车/汽车报名截止时间：团期前1天18点重要提示1、旅游车辆严禁超载，未成年小童及婴儿均需占有车位。敬请客人按实际报名人数出行，未经旅 游玩目的地： 河源 行程天数： 2天 交通方式： 汽车/汽车 ¥673 起 查看详情 <珠海长隆海洋王国2日游>浪漫情侣游，长隆海洋王国、横琴烟花汇演，圆明新园、石景山公园、野狸岛、情侣路 简介当前珠海热门景点莫过于长隆海洋王国+烟花汇演，这是来珠海必玩必看的景点；夏天热门的项目莫过于玩水了，这么热的天气泡在水里，畅玩水上项目可谓是一大享受。本行程包含了以上提到的两点——长隆海洋王国+ 游玩目的地： 珠海 珠海长隆 行程天数： 2天 交通方式： 汽车/汽车 ¥758 起 查看详情 <珠海长隆2日游>纯玩无购物，珠海长隆海洋王国，唯美梦幻海洋街，5D视觉**，烟花汇演， 圆明新园，观港珠澳大桥 长隆海洋王国·长隆海洋王国是世界最大的海洋主题乐园，也是全球首创大型游乐设施与珍贵动物展区相结合的独特设计。·这里有亚洲第一台轨道最长的飞行过山车，和亚洲第一台水上过山车。·长隆海洋王国海洋馆同时荣获 游玩目的地： 珠海 珠海长隆 行程天数： 2天 交通方式： 汽车/汽车 ¥905 起 查看详情 高铁韶关B线：云门山玻璃桥、曹角湾古村、小坑水库、经律论文化小镇、翡翠玉观音、花世界、生肖广场、蓝山源岭南东方温泉酒店，双高铁两晚五星温泉美食享受三天团 ★刺激惊险——感受广东省规模最大的全透明高空景观玻璃桥；★归隐田园——感受清代古村落生活-曹角湾古村；★舌尖美食——安排当地特色餐饮，品尝地道韶关风味；★宿双五星——入住韶关蓝山源岭南东方温泉酒店+经律论温泉酒店；★品质出行——往返高铁，轻松出行，全程无购物，真正纯玩团！ 游玩目的地： 韶关 丹霞山 行程天数： 3天 交通方式： 高铁 ¥1529 起 查看详情 <清远巴士2日游>九瀑探险森林王国、**CS野战、尽享温泉 牛在“玩”清泉湾漂流+山水乐园新银盏温泉牛在“吃”享用清远餐，品尝正宗地道美食。 游玩目的地： 清远 黄腾峡漂流 深圳 行程天数： 2天 交通方式： 汽车/汽车 ¥453 起 查看详情 <韶关丹霞山-长老峰-曹溪温泉-南华寺2日游>住曹溪温泉度假村，览世界自然遗产（阴阳石），南华禅寺，韶关地标风采楼， 世界自然遗产丹霞山、南华寺、百年东街、风采楼、五马农业基地、入住曹溪温泉 游玩目的地： 韶关 曹溪温泉 丹霞山 东莞 行程天数： 2天 交通方式： 汽车/汽车 ¥590 起 查看详情 <清远2日游>古龙峡漂流、静山湖大马戏、卡丁车/越野车、灯光节、DIY野炊 惊魂玻璃桥高空玻璃吊桥建于清远牛鱼嘴风景区的悬崖上，桥全长达250米，悬空的桥身200米，离地高度超200米。近看，万丈深渊就在脚下仿佛置身于空中，蓝天白云近在咫尺。银盏森林温泉银盏森林温泉树木葱茏， 游玩目的地： 清远 古龙峡漂流 东莞 行程天数： 2天 交通方式： 汽车/汽车 ¥379 起 查看详情 <惠州龙门温泉直通车1晚2日游>入住依泉楼 1、泡罕有的“黄金泉”，其为地下深层天然自涌的温泉水，泉水颜色呈金黄色，对腰肌劳损、风湿性骨痛特有疗效；2、温泉项目齐全，任玩全国首创“天然黄金温泉蒸汽浴”、温泉冲浪、中药池、瀑布池、十二生肖池等； 游玩目的地： 惠州 东莞 龙门铁泉 行程天数： 2天 交通方式： 汽车/汽车 ¥453 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "桂林",
    "duration": 2,
    "price": 748,
    "priceUnit": "人",
    "departureDate": "2026-06-18",
    "returnDate": "2026-06-20",
    "transportType": "大巴往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "2早餐1正餐",
    "singleSupplement": 187,
    "singleSupplementNote": "单人出行需补单房差￥187，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 26,
    "totalSeats": 36,
    "highlights": [
      "桂林必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往桂林",
        "description": "今日安排桂林精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "告别桂林，返回温馨的家",
        "description": "今日安排桂林精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.4,
    "reviewCount": 300,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "海岛度假",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "海岛度假",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.457748",
    "updatedAt": "2026-05-07T01:02:13.457748"
  },
  {
    "id": "tour_88",
    "title": "<广州增城-从化2日游>住从化望谷温泉酒店、带私家温泉泡池、增城大丰门漂流、流溪河国家森林公园 望谷温泉酒店公寓望谷温泉拥有10多个功能温泉池区及大型阳光游泳池，虽然池区不多，但每个温泉池舒适、休闲、带给你无限惬意。当您拎着行李推开酒店公寓房门，一间干净整洁、舒适典雅的客房呈现在您的面前，让人为 游玩目的地： 广州 南昆山 行程天数： 2天 交通方式： 汽车/汽车 ¥748 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "广东",
    "duration": 2,
    "price": 748,
    "priceUnit": "人",
    "departureDate": "2026-08-03",
    "returnDate": "2026-08-05",
    "transportType": "大巴往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "2早餐1正餐",
    "singleSupplement": 187,
    "singleSupplementNote": "单人出行需补单房差￥187，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 16,
    "totalSeats": 31,
    "highlights": [
      "广东必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往广东",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "告别广东，返回温馨的家",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.8,
    "reviewCount": 28,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "海岛度假",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "海岛度假",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.457748",
    "updatedAt": "2026-05-07T01:02:13.457748"
  },
  {
    "id": "tour_89",
    "title": "<清远1日游>包含古龙峡全程漂，含船游北江小三峡，千人出游，百人好评贴心服务，纯玩无购物 产品概要行程天数：1天成团地点：深圳成团目的地：清远往返交通：汽车/汽车报名截止时间：团期前1天18点附加说明：可根据需要选择某段行程或升级行程，在该行程段分开安排或统一协调行程。接待标准•行程安排： 游玩目的地： 清远 古龙峡漂流 行程天数： 1天 交通方式： 汽车/汽车 ¥198 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "广东",
    "duration": 1,
    "price": 198,
    "priceUnit": "人",
    "departureDate": "2026-06-02",
    "returnDate": "2026-06-03",
    "transportType": "大巴往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "1早餐0正餐",
    "singleSupplement": 49,
    "singleSupplementNote": "单人出行需补单房差￥49，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 24,
    "totalSeats": 34,
    "highlights": [
      "广东必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往广东",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 3.8,
    "reviewCount": 422,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "自然风光",
      "纯玩",
      "品质"
    ],
    "isHot": true,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "自然风光",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.457748",
    "updatedAt": "2026-05-07T01:02:13.457748"
  },
  {
    "id": "tour_90",
    "title": "<清远古龙峡漂流汽车2日游>东莞出发、漂国际漂流主赛道古龙峡漂流、银盏森林温泉、CS野战、农夫庄园看花海 品途专线—“牛在哪””“牛在玩”—漂有水上过山车之称的古龙峡漂流，升级全程飞龙漂，体验国际漂流主赛道的惊险魅力。“牛在吃”来有“凤城”之称的清远，怎能不品尝正宗清远鸡，全程安排两个宴，《清远烧鸡宴》， 游玩目的地： 东莞 清远 古龙峡漂流 行程天数： 2天 交通方式： 汽车/汽车 ¥477 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "其他",
    "duration": 2,
    "price": 477,
    "priceUnit": "人",
    "departureDate": "2026-06-01",
    "returnDate": "2026-06-03",
    "transportType": "大巴往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "2早餐1正餐",
    "singleSupplement": 119,
    "singleSupplementNote": "单人出行需补单房差￥119，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 11,
    "totalSeats": 41,
    "highlights": [
      "其他必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往其他",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "告别其他，返回温馨的家",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.8,
    "reviewCount": 644,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "海岛度假",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "海岛度假",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.457748",
    "updatedAt": "2026-05-07T01:02:13.457748"
  },
  {
    "id": "tour_91",
    "title": "<清远1日游>东莞往返，体验古龙峡全程漂，游北江小三峡，贴心导游服务，纯玩无购物 古龙峡最刺激的漂流这个夏季激爽到底！这是浪尖上的过山车，是中国漂流的巅峰之作，是赛道长、落差大、流速快，最刺激的漂流！你敢来挑战吗* 游玩目的地： 东莞 清远 古龙峡漂流 行程天数： 1天 交通方式： 汽车/汽车 ¥198 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "其他",
    "duration": 1,
    "price": 198,
    "priceUnit": "人",
    "departureDate": "2026-05-14",
    "returnDate": "2026-05-15",
    "transportType": "大巴往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "1早餐0正餐",
    "singleSupplement": 49,
    "singleSupplementNote": "单人出行需补单房差￥49，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 15,
    "totalSeats": 40,
    "highlights": [
      "其他必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往其他",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.8,
    "reviewCount": 713,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "自然风光",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": true,
    "isFlashSale": true,
    "groupSize": "30人常规团",
    "theme": "自然风光",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.457748",
    "updatedAt": "2026-05-07T01:02:13.457748"
  },
  {
    "id": "tour_92",
    "title": "<深圳西冲沙滩-杨梅坑1日游>快艇冲浪登情人岛、环海单车、海滨BBQ烧烤 产品概要行程天数：1天0晚成团地点：东莞成团目的地：深圳往返交通：汽车/汽车报名截止时间：团期前1天18点组团形式：联合发团；本产品与其他旅行社联合发团。接待标准*贴心赠送：快艇与CS野战为二选一项目 游玩目的地： 西冲 海滨温泉 深圳 东莞 行程天数： 1天 交通方式： 汽车/汽车 ¥158 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "广东",
    "duration": 1,
    "price": 158,
    "priceUnit": "人",
    "departureDate": "2026-07-30",
    "returnDate": "2026-07-31",
    "transportType": "大巴往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "1早餐0正餐",
    "singleSupplement": 39,
    "singleSupplementNote": "单人出行需补单房差￥39，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 11,
    "totalSeats": 46,
    "highlights": [
      "广东必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往广东",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.5,
    "reviewCount": 742,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "海岛度假",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "海岛度假",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.457748",
    "updatedAt": "2026-05-07T01:02:13.457748"
  },
  {
    "id": "tour_93",
    "title": "<南澳西冲1日游>八千人出游、好评达9成、快艇环岛、海边BBQ、海边戏水游玩 ★杨梅坑环海骑行：近可观帆船游弋，远可望岛屿清影。★远离都市的喧嚣，投入到蔚蓝大海的怀抱中。 ★沙滩自助BBQ：有荤有素，我有美景，你有酒吗？ ★在沙滩赤脚漫步，心情一定 游玩目的地： 深圳 行程天数： 1天 交通方式： 汽车/汽车 ¥128 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "广东",
    "duration": 1,
    "price": 128,
    "priceUnit": "人",
    "departureDate": "2026-05-29",
    "returnDate": "2026-05-30",
    "transportType": "大巴往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "1早餐0正餐",
    "singleSupplement": 32,
    "singleSupplementNote": "单人出行需补单房差￥32，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 28,
    "totalSeats": 48,
    "highlights": [
      "广东必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往广东",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 3.9,
    "reviewCount": 336,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "海岛度假",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "海岛度假",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.457748",
    "updatedAt": "2026-05-07T01:02:13.457748"
  },
  {
    "id": "tour_94",
    "title": "<惠东2日游>住海滨温泉、温泉任泡、巽寮湾、海之星游艇、双月湾、海龟自然保护区、品一人一只鸡宴、海味霸王鸭 产品概要行程天数：2天1晚成团地点：深圳成团目的地：惠州往返交通：汽车/汽车报名截止时间：团期前1天17点产品特色产品特色详情★入住：海滨温泉度假酒店，享养生温泉（无限次任泡），儿童水上乐园★观赏：游览【港口海龟自然保护区】+【海之星游艇出海】★美食：品尝巽寮舌尖美食【海味霸王鸭 游玩目的地： 惠州 巽寮湾 海滨温泉 行程天数： 2天 交通方式： 汽车/汽车 ¥572 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "广东",
    "duration": 2,
    "price": 572,
    "priceUnit": "人",
    "departureDate": "2026-05-27",
    "returnDate": "2026-05-29",
    "transportType": "大巴往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "2早餐1正餐",
    "singleSupplement": 143,
    "singleSupplementNote": "单人出行需补单房差￥143，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 6,
    "totalSeats": 46,
    "highlights": [
      "广东必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往广东",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "告别广东，返回温馨的家",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.6,
    "reviewCount": 407,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "海岛度假",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "海岛度假",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.457748",
    "updatedAt": "2026-05-07T01:02:13.457748"
  },
  {
    "id": "tour_95",
    "title": "<清远2日游>（漂流季）清远黄腾峡勇士漂、新银盏温泉、葡萄任吃、欧风小镇、可升级挑战101米屋顶摩天轮 产品概要行程天数：2天1晚成团地点：深圳成团目的地：清远往返交通：汽车/汽车报名截止时间：团期前1天18点接待标准•行程安排：空调大巴，一人一正座•游玩安排：黄腾峡漂流水上乐园新银盏温泉牛鱼嘴玻璃桥 游玩目的地： 清远 新银盏温泉 黄腾峡漂流 行程天数： 2天 交通方式： 汽车/汽车 ¥491 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "广东",
    "duration": 2,
    "price": 491,
    "priceUnit": "人",
    "departureDate": "2026-06-24",
    "returnDate": "2026-06-26",
    "transportType": "大巴往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "2早餐1正餐",
    "singleSupplement": 122,
    "singleSupplementNote": "单人出行需补单房差￥122，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 16,
    "totalSeats": 31,
    "highlights": [
      "广东必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往广东",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "告别广东，返回温馨的家",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.1,
    "reviewCount": 94,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "海岛度假",
      "纯玩",
      "品质"
    ],
    "isHot": true,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "海岛度假",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.457748",
    "updatedAt": "2026-05-07T01:02:13.457748"
  },
  {
    "id": "tour_96",
    "title": "<清远1日游>全国首座空中盘旋1080度龙腾峡空中玻璃漂流、享受落差128米，时速78公里激情漂流 龙腾峡玻璃漂流万众瞩目龙腾峡空中玻璃漂流空中盘旋1080度全程5.6公里落差128米时速78公里 游玩目的地： 清远 黄腾峡漂流 行程天数： 1天 交通方式： 汽车/汽车 ¥196 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "其他",
    "duration": 1,
    "price": 196,
    "priceUnit": "人",
    "departureDate": "2026-06-10",
    "returnDate": "2026-06-11",
    "transportType": "大巴往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "1早餐0正餐",
    "singleSupplement": 49,
    "singleSupplementNote": "单人出行需补单房差￥49，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 13,
    "totalSeats": 33,
    "highlights": [
      "其他必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往其他",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.0,
    "reviewCount": 818,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "自然风光",
      "纯玩",
      "品质"
    ],
    "isHot": true,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "自然风光",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.457748",
    "updatedAt": "2026-05-07T01:02:13.457748"
  },
  {
    "id": "tour_97",
    "title": "<清远2日游>龙腾峡玻璃漂流 首创瀑布玻璃桥漂流 刺激开漂、西班牙小镇屋顶摩天轮、清远鸡火锅任吃、尽享湿身体验 产品概要行程天数：2天1晚成团地点：深圳成团目的地：清远往返交通：汽车/汽车报名截止时间：团期前1天18点 游玩目的地： 清远 黄腾峡漂流 行程天数： 2天 交通方式： 汽车/汽车 ¥322 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "广东",
    "duration": 2,
    "price": 322,
    "priceUnit": "人",
    "departureDate": "2026-06-08",
    "returnDate": "2026-06-10",
    "transportType": "大巴往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "2早餐1正餐",
    "singleSupplement": 80,
    "singleSupplementNote": "单人出行需补单房差￥80，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 23,
    "totalSeats": 43,
    "highlights": [
      "广东必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往广东",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "告别广东，返回温馨的家",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 3.5,
    "reviewCount": 653,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "美食之旅",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "美食之旅",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.457748",
    "updatedAt": "2026-05-07T01:02:13.457748"
  },
  {
    "id": "tour_98",
    "title": "<河源巴士2日游>入住五星万绿湖美思威尔顿酒店、巴伐利亚黑森林乐园、镜花缘、美食休闲纯玩 产品概要行程天数：2天1晚成团地点：深圳成团目的地：河源往返交通：汽车/汽车报名截止时间：团期前1天17点产品特色更多优质线路推介★畅游：巴伐利亚庄园异国风情小镇，打卡网红景点黑森林乐园无忧畅玩★体验：赏万绿湖畔枫叶，看镜花缘风情表演★入住：市区5星酒店，浸泡酒店汤泉★品尝：农家 游玩目的地： 河源 行程天数： 2天 交通方式： 汽车/汽车 ¥627 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "广东",
    "duration": 2,
    "price": 627,
    "priceUnit": "人",
    "departureDate": "2026-06-10",
    "returnDate": "2026-06-12",
    "transportType": "大巴往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "2早餐1正餐",
    "singleSupplement": 156,
    "singleSupplementNote": "单人出行需补单房差￥156，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 7,
    "totalSeats": 47,
    "highlights": [
      "广东必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往广东",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "告别广东，返回温馨的家",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.9,
    "reviewCount": 50,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "美食之旅",
      "纯玩",
      "品质"
    ],
    "isHot": true,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "美食之旅",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.457748",
    "updatedAt": "2026-05-07T01:02:13.457748"
  },
  {
    "id": "tour_99",
    "title": "<清远1日游>清远古龙峡云天波霸、纯玩无购物、西班牙风情小镇、挑战玻璃大峡谷 游玩目的地： 清远 古龙峡漂流 行程天数： 1天 交通方式： 汽车/汽车 ¥197 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "其他",
    "duration": 1,
    "price": 197,
    "priceUnit": "人",
    "departureDate": "2026-06-05",
    "returnDate": "2026-06-06",
    "transportType": "大巴往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "1早餐0正餐",
    "singleSupplement": 49,
    "singleSupplementNote": "单人出行需补单房差￥49，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 21,
    "totalSeats": 31,
    "highlights": [
      "其他必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往其他",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.9,
    "reviewCount": 762,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "民族风情",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "民族风情",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.457748",
    "updatedAt": "2026-05-07T01:02:13.457748"
  },
  {
    "id": "tour_100",
    "title": "<西冲2日游>入住酒店、杨梅坑、大鹏所城、农庄趣味活动 ★杨梅坑，沿海岸骑自行车！★远离都市的喧嚣，投入到蔚蓝大海的怀抱中。★全情投入海上逍遥，乘坐快艇出海，体验海上风驰电掣的快感！★沙滩自助BBQ：有荤有素，我有美景，你有酒吗？ 游玩目的地： 西冲 深圳 行程天数： 2天 交通方式： 汽车/汽车 ¥464 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "广东",
    "duration": 2,
    "price": 464,
    "priceUnit": "人",
    "departureDate": "2026-07-09",
    "returnDate": "2026-07-11",
    "transportType": "大巴往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "2早餐1正餐",
    "singleSupplement": 116,
    "singleSupplementNote": "单人出行需补单房差￥116，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 29,
    "totalSeats": 49,
    "highlights": [
      "广东必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往广东",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "告别广东，返回温馨的家",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.8,
    "reviewCount": 101,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "海岛度假",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "海岛度假",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.457748",
    "updatedAt": "2026-05-07T01:02:13.457748"
  },
  {
    "id": "tour_101",
    "title": "<清远古龙峡漂流-天子山瀑布2日游>天子山音乐派对、泳池BBQ啤酒任何、古龙峡全程漂流、天子山瀑布、七彩云足浴、葡萄园任吃 天子山轰趴轰趴开始[年青的我们、喝着啤酒唱着歌、尽情摇摆，狂魔乱舞，基情四射]【彩虹天幕泳池】无限次入园，畅泳真正的山泉水，清凉透彻，与大自然零接触.【BBQ晚餐】唱着啤酒唱着歌，BBQ自助烧烤【个 游玩目的地： 清远 古龙峡漂流 行程天数： 2天 交通方式： 汽车/汽车 ¥518 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "其他",
    "duration": 2,
    "price": 518,
    "priceUnit": "人",
    "departureDate": "2026-07-07",
    "returnDate": "2026-07-09",
    "transportType": "大巴往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "2早餐1正餐",
    "singleSupplement": 129,
    "singleSupplementNote": "单人出行需补单房差￥129，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 12,
    "totalSeats": 37,
    "highlights": [
      "其他必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往其他",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "告别其他，返回温馨的家",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.2,
    "reviewCount": 753,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "美食之旅",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "美食之旅",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.457748",
    "updatedAt": "2026-05-07T01:02:13.457748"
  },
  {
    "id": "tour_102",
    "title": "<清远古龙峡2日游>纯玩无购物，体验清凉刺激的漂流**，享受无限次泡温泉，DIY农家乐，**CS野战，可参加玻璃桥活动 产品概要行程天数：2天1晚成团地点：深圳成团目的地：清远往返交通：汽车/汽车报名截止时间：团期前2天17点接待标准•用餐安排：2正1早餐（1011/一桌），DIY自助野炊+水库大盘鱼•住 游玩目的地： 清远 古龙峡漂流 行程天数： 2天 交通方式： 汽车/汽车 ¥451 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "广东",
    "duration": 2,
    "price": 451,
    "priceUnit": "人",
    "departureDate": "2026-07-09",
    "returnDate": "2026-07-11",
    "transportType": "大巴往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "2早餐1正餐",
    "singleSupplement": 112,
    "singleSupplementNote": "单人出行需补单房差￥112，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 28,
    "totalSeats": 43,
    "highlights": [
      "广东必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往广东",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "告别广东，返回温馨的家",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.5,
    "reviewCount": 231,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "海岛度假",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "海岛度假",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.457748",
    "updatedAt": "2026-05-07T01:02:13.457748"
  },
  {
    "id": "tour_103",
    "title": "<惠州龙门温泉大观园度假村2日游>住南昆山温泉大观园酒店、享无限次温泉、欢乐水世界、昆山峡漂流、空中田园生态园、长津冰雪世界 南昆山温泉大观园温泉富含大量钙、镁、氡等对人体有益微量元素，最高水温达82摄氏度，岭南风情区分五个浸泡区，72个功能各异、各具的温泉池。温泉大观园温泉欢乐水世界引进了“冲关回旋”、“六彩滑道”、“动感 游玩目的地： 惠州 南昆山 温泉大观园 川龙峡漂流 行程天数： 2天 交通方式： 汽车/汽车 ¥678 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "其他",
    "duration": 2,
    "price": 678,
    "priceUnit": "人",
    "departureDate": "2026-07-10",
    "returnDate": "2026-07-12",
    "transportType": "大巴往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "2早餐1正餐",
    "singleSupplement": 169,
    "singleSupplementNote": "单人出行需补单房差￥169，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 5,
    "totalSeats": 40,
    "highlights": [
      "其他必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往其他",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "告别其他，返回温馨的家",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 3.5,
    "reviewCount": 784,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "海岛度假",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": true,
    "isFlashSale": true,
    "groupSize": "30人常规团",
    "theme": "海岛度假",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.457748",
    "updatedAt": "2026-05-07T01:02:13.457748"
  },
  {
    "id": "tour_104",
    "title": "<清远古龙峡漂流-银盏温泉2日游>古龙峡飞龙全程漂、银盏森林温泉、牛鱼嘴、水晶弹野战、农家乐野炊、深圳东莞出发 古龙峡漂流清远是中国漂流之乡，而古龙峡作为清远漂流的巅峰之作，被业界评论为“广东漂流看清远，清远漂流看古龙”古龙峡漂流，是广东至刺激的漂流，没有之一。高差达千米的古龙大峡谷赋予了漂流与众不同的，集瀑 游玩目的地： 清远 新银盏温泉 古龙峡漂流 行程天数： 2天 交通方式： 汽车/汽车 ¥428 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "广东",
    "duration": 2,
    "price": 428,
    "priceUnit": "人",
    "departureDate": "2026-06-25",
    "returnDate": "2026-06-27",
    "transportType": "大巴往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "2早餐1正餐",
    "singleSupplement": 107,
    "singleSupplementNote": "单人出行需补单房差￥107，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 14,
    "totalSeats": 49,
    "highlights": [
      "广东必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往广东",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "告别广东，返回温馨的家",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.9,
    "reviewCount": 723,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "海岛度假",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "海岛度假",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.457748",
    "updatedAt": "2026-05-07T01:02:13.457748"
  },
  {
    "id": "tour_105",
    "title": "<清远古龙峡2日游>古龙峡升级全程飞龙漂、挑战三项世界****的玻璃大峡谷云天波霸 古龙峡漂流清远古龙峡国际漂流赛场是国家AAAA级旅游景区，国际漂流大赛专业赛场。清远是中国漂流之乡，而古龙峡作为清远漂流的巅峰之作，以其全国至大的漂流落差、至刺激的漂流体验，被誉为：漂流之巅、落差之王 游玩目的地： 清远 古龙峡漂流 行程天数： 2天 交通方式： 汽车/汽车 ¥509 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "其他",
    "duration": 2,
    "price": 509,
    "priceUnit": "人",
    "departureDate": "2026-07-12",
    "returnDate": "2026-07-14",
    "transportType": "大巴往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "2早餐1正餐",
    "singleSupplement": 127,
    "singleSupplementNote": "单人出行需补单房差￥127，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 21,
    "totalSeats": 41,
    "highlights": [
      "其他必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往其他",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "告别其他，返回温馨的家",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.1,
    "reviewCount": 140,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "自然风光",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "自然风光",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.457748",
    "updatedAt": "2026-05-07T01:02:13.457748"
  },
  {
    "id": "tour_106",
    "title": "<韶关云门山玻璃桥-百丈崖漂流2日游>云门山登1638级祥云梯、广东省首座全透明高空玻璃桥、禅景**漂百丈崖漂流、马坝人遗址狮子岩 百丈崖峡谷漂流大宝山植物茂盛,树木参天,古藤缠绕,翠竹成林,紫蝶成群,潭水清澈,是漂流探险,享受自然,重拾童趣的首选地。百丈崖峡谷漂流全长3公里,落差达100米,有数十个回旋处，游客在60分钟的漂流 游玩目的地： 韶关 百丈崖漂流 丹霞山 行程天数： 2天 交通方式： 汽车/汽车 ¥468 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "广东",
    "duration": 2,
    "price": 468,
    "priceUnit": "人",
    "departureDate": "2026-05-27",
    "returnDate": "2026-05-29",
    "transportType": "大巴往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "2早餐1正餐",
    "singleSupplement": 117,
    "singleSupplementNote": "单人出行需补单房差￥117，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 27,
    "totalSeats": 42,
    "highlights": [
      "广东必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往广东",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "告别广东，返回温馨的家",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.4,
    "reviewCount": 443,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "自然风光",
      "纯玩",
      "品质"
    ],
    "isHot": true,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "自然风光",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.458748",
    "updatedAt": "2026-05-07T01:02:13.458748"
  },
  {
    "id": "tour_107",
    "title": "<清远黄腾峡2日游>纯玩无购物，黄腾峡勇士漂流，国际4A级生态旅游区，抖音玻璃桥，泡温泉，CS，农家乐DIY，含矿泉水 清远漂流★“漂”最刺激最好玩的自然水域漂流赛道【黄腾峡勇士漂】★“惊”体验广东省最高悬挂玻璃吊桥抖音网红【牛鱼嘴玻璃桥】★“玩”野战是模仿军事体验【水晶弹野战】★“泡”清远最受欢迎的原生态温泉【银盏森 游玩目的地： 清远 黄腾峡漂流 行程天数： 2天 交通方式： 汽车/汽车 ¥451 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "广东",
    "duration": 2,
    "price": 451,
    "priceUnit": "人",
    "departureDate": "2026-05-25",
    "returnDate": "2026-05-27",
    "transportType": "大巴往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "2早餐1正餐",
    "singleSupplement": 112,
    "singleSupplementNote": "单人出行需补单房差￥112，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 8,
    "totalSeats": 48,
    "highlights": [
      "广东必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往广东",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "告别广东，返回温馨的家",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.1,
    "reviewCount": 405,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "海岛度假",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "海岛度假",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.458748",
    "updatedAt": "2026-05-07T01:02:13.458748"
  },
  {
    "id": "tour_108",
    "title": "<惠州亚婆角-融创海湾半岛3日游>住2晚海湾半岛度假酒店180度海景房、30层高空全海景餐厅自助早、十里私家沙滩 住：2晚海湾半岛海景酒店★180度全海景房：酒店以阳台面朝大海的建筑格局，户户朝海，一趟进房门，就能感受到大海冲进眼帘。★海景自助餐厅：行程包含2次早餐，在30多楼层的海景餐厅品美味早餐，来一场与大海 游玩目的地： 惠州 巽寮湾 行程天数： 3天 交通方式： 汽车/汽车 ¥856 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "其他",
    "duration": 3,
    "price": 856,
    "priceUnit": "人",
    "departureDate": "2026-07-05",
    "returnDate": "2026-07-08",
    "transportType": "大巴往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "3早餐2正餐",
    "singleSupplement": 214,
    "singleSupplementNote": "单人出行需补单房差￥214，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 11,
    "totalSeats": 46,
    "highlights": [
      "其他必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往其他",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "告别其他，返回温馨的家",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.5,
    "reviewCount": 788,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "海岛度假",
      "纯玩",
      "品质"
    ],
    "isHot": true,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "海岛度假",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.458748",
    "updatedAt": "2026-05-07T01:02:13.458748"
  },
  {
    "id": "tour_109",
    "title": "<深圳西冲沙滩+较场尾+大鹏所城2日游>住西冲特色客栈、巴士往返 西冲沙滩中国八大海滩之一【深圳西冲沙滩】。这块净土，被深圳旅游行业知名人士三彩先生称作“深圳的香格里拉”，可以和三亚媲美的海滨度假胜地就是南澳西冲。西冲拥有深圳高水准沙滩、洁净的海域、引人入胜的海滨田 游玩目的地： 东部华侨城 西冲 深圳 行程天数： 2天 交通方式： 汽车/汽车 ¥198 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "三亚",
    "duration": 2,
    "price": 198,
    "priceUnit": "人",
    "departureDate": "2026-06-13",
    "returnDate": "2026-06-15",
    "transportType": "大巴往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "2早餐1正餐",
    "singleSupplement": 49,
    "singleSupplementNote": "单人出行需补单房差￥49，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 29,
    "totalSeats": 49,
    "highlights": [
      "三亚必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往三亚",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "告别三亚，返回温馨的家",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 3.9,
    "reviewCount": 234,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "海岛度假",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "海岛度假",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.458748",
    "updatedAt": "2026-05-07T01:02:13.458748"
  },
  {
    "id": "tour_110",
    "title": "<潮州古城-汕头南澳岛动车2日游>游潮州古城、江滨长廊、甲第巷、韩文公祠、汕头南澳岛青澳湾，品正宗潮汕牛肉火锅 产品概要行程天数：2天1晚成团地点：深圳成团目的地：潮州往返交通：动车组/动车组报名截止时间：团期前1天18点产品特色重要提示1、公安厅规定：入住酒店时游客都须提供有效的身份证正本，若无酒店将不接待，小童未有身份证则须出示户口本；2、旅游车辆严禁超载，未成年小童及婴儿均需占有车位 游玩目的地： 汕头 南澳岛 潮州 行程天数： 2天 交通方式： 动车组/动车组 ¥919 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "广东",
    "duration": 2,
    "price": 919,
    "priceUnit": "人",
    "departureDate": "2026-05-20",
    "returnDate": "2026-05-22",
    "transportType": "大巴往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "2早餐1正餐",
    "singleSupplement": 229,
    "singleSupplementNote": "单人出行需补单房差￥229，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 17,
    "totalSeats": 42,
    "highlights": [
      "广东必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往广东",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "告别广东，返回温馨的家",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 3.5,
    "reviewCount": 254,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "古镇文化",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "古镇文化",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.458748",
    "updatedAt": "2026-05-07T01:02:13.458748"
  },
  {
    "id": "tour_111",
    "title": "<清远2日游>玩转清泉湾高空漂流、梦幻水城、惊魂玻璃桥、任摘任食葡萄、入住景源艺术酒店/栢兰德金菱酒店 激情漂流【清远】旅游资源丰富，五大类资源各具，分布在各景区内的点达58处之多，是广东省旅游资源大市之一，素有中国温泉之乡、中国龙舟之乡、中国漂流之乡、中国旅游城市、中国宜居城市等美誉。 游玩目的地： 清远 青龙峡漂流 行程天数： 2天 交通方式： 汽车/汽车 ¥444 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "广东",
    "duration": 2,
    "price": 444,
    "priceUnit": "人",
    "departureDate": "2026-06-26",
    "returnDate": "2026-06-28",
    "transportType": "大巴往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "2早餐1正餐",
    "singleSupplement": 111,
    "singleSupplementNote": "单人出行需补单房差￥111，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 10,
    "totalSeats": 45,
    "highlights": [
      "广东必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往广东",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "告别广东，返回温馨的家",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.8,
    "reviewCount": 578,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "海岛度假",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": true,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "海岛度假",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.458748",
    "updatedAt": "2026-05-07T01:02:13.458748"
  },
  {
    "id": "tour_112",
    "title": "<韶关丹霞山+长老峰+南华寺2日游>世界遗产丹霞山、广东名寺南华寺，升级入住曹溪温泉花园别墅 产品概要行程天数：2天1晚成团地点：深圳成团目的地：韶关往返交通：汽车/汽车报名截止时间：团期前1天11点产品特色丹霞山特色桂林山水甲天下，唯恐广东—丹霞。世界丹霞看中国，中国丹霞看仁化。南华寺特色南华寺是中国佛教名寺之一，是禅宗六祖惠能弘扬“南宗禅法”的发源地。风采楼特色风采楼 游玩目的地： 韶关 曹溪温泉 丹霞山 行程天数： 2天 交通方式： 汽车/汽车 ¥469 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "桂林",
    "duration": 2,
    "price": 469,
    "priceUnit": "人",
    "departureDate": "2026-06-03",
    "returnDate": "2026-06-05",
    "transportType": "大巴往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "2早餐1正餐",
    "singleSupplement": 117,
    "singleSupplementNote": "单人出行需补单房差￥117，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 12,
    "totalSeats": 32,
    "highlights": [
      "桂林必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往桂林",
        "description": "今日安排桂林精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "告别桂林，返回温馨的家",
        "description": "今日安排桂林精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 3.6,
    "reviewCount": 714,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "海岛度假",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "海岛度假",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.458748",
    "updatedAt": "2026-05-07T01:02:13.458748"
  },
  {
    "id": "tour_113",
    "title": "<河源巴伐利亚2日游>巴伐利亚庄园、黑森林乐园泉、黄龙岩溶洞、5玻璃桥、客天下水晶温泉、恐龙水世界 产品概要行程天数：2天1晚成团地点：深圳成团目的地：河源往返交通：汽车/汽车报名截止时间：团期前1天18点产品特色重要提示1、旅游车辆严禁超载，未成年小童及婴儿均需占有车位。敬请客人按实际报名人数出行，未经旅行社同意不能临时增加人员（包括小童及婴儿），如车位不足，我社将拒绝上车。 游玩目的地： 河源 行程天数： 2天 交通方式： 汽车/汽车 ¥577 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "广东",
    "duration": 2,
    "price": 577,
    "priceUnit": "人",
    "departureDate": "2026-07-25",
    "returnDate": "2026-07-27",
    "transportType": "大巴往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "2早餐1正餐",
    "singleSupplement": 144,
    "singleSupplementNote": "单人出行需补单房差￥144，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 17,
    "totalSeats": 47,
    "highlights": [
      "广东必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往广东",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "告别广东，返回温馨的家",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 3.5,
    "reviewCount": 731,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "海岛度假",
      "纯玩",
      "品质"
    ],
    "isHot": true,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "海岛度假",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.458748",
    "updatedAt": "2026-05-07T01:02:13.458748"
  },
  {
    "id": "tour_114",
    "title": "<清远英德宝墩湖湖山温泉度假村2日游>住网红酒店宝墩湖温泉度假村别墅、温泉、山泉水泳道、仙桥地下河溶洞、浈阳坊旅游小镇 产品概要行程天数：2天1晚成团地点：深圳成团目的地：清远往返交通：汽车/汽车报名截止时间：团期前1天18点产品特色宝墩湖湖山温泉度假村英德宝墩湖湖山温泉度假村坐落于湖光山色的英宝望埠镇之中，拥有200多套别墅，以温泉养生为主题，并集餐饮、住宿、会议、康体、田园风光等多功能于一体的 游玩目的地： 行程天数： 2天 交通方式： 汽车/汽车 ¥650 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "广东",
    "duration": 2,
    "price": 650,
    "priceUnit": "人",
    "departureDate": "2026-07-03",
    "returnDate": "2026-07-05",
    "transportType": "大巴往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "2早餐1正餐",
    "singleSupplement": 162,
    "singleSupplementNote": "单人出行需补单房差￥162，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 8,
    "totalSeats": 33,
    "highlights": [
      "广东必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往广东",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "告别广东，返回温馨的家",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.8,
    "reviewCount": 114,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "海岛度假",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "海岛度假",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.458748",
    "updatedAt": "2026-05-07T01:02:13.458748"
  },
  {
    "id": "tour_115",
    "title": "<清远黄腾峡漂流汽车2日游>漂流霸主 黄腾峡勇士漂流畅玩水上乐园 CS野战、激情越野车 入住云海碱泉温泉酒店 黄腾峡勇士漂流牛鱼嘴大樟沙滩 游玩目的地： 清远 黄腾峡漂流 行程天数： 2天 交通方式： 汽车/汽车 ¥429 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "其他",
    "duration": 2,
    "price": 429,
    "priceUnit": "人",
    "departureDate": "2026-06-05",
    "returnDate": "2026-06-07",
    "transportType": "大巴往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "2早餐1正餐",
    "singleSupplement": 107,
    "singleSupplementNote": "单人出行需补单房差￥107，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 13,
    "totalSeats": 43,
    "highlights": [
      "其他必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往其他",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "告别其他，返回温馨的家",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.2,
    "reviewCount": 440,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "海岛度假",
      "纯玩",
      "品质"
    ],
    "isHot": true,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "海岛度假",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.458748",
    "updatedAt": "2026-05-07T01:02:13.458748"
  },
  {
    "id": "tour_116",
    "title": "<潮汕2日游>入住金德宝凯悦国际温泉酒店温泉激情冲浪浸泡夏日清凉温泉潮州古城韩文公祠地道潮汕牛肉火锅任吃宴动车2天 产品概要行程天数：2天1晚成团地点：潮州成团目的地：潮州往返交通：动车组/动车组报名截止时间：团期前1天18点产品特色产品特色详情【舌尖美食】《地道潮汕正宗牛肉火锅》【小镇温泉】享受粤东温泉小镇自然出露的天然温泉资源【韩城文化】古朴典雅，肃穆端庄，赏一代文豪的纪念园【古城风韵】走 游玩目的地： 汕头 行程天数： 2天 交通方式： 动车组/动车组 ¥858 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "其他",
    "duration": 2,
    "price": 858,
    "priceUnit": "人",
    "departureDate": "2026-07-09",
    "returnDate": "2026-07-11",
    "transportType": "大巴往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "2早餐1正餐",
    "singleSupplement": 214,
    "singleSupplementNote": "单人出行需补单房差￥214，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 13,
    "totalSeats": 48,
    "highlights": [
      "其他必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往其他",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "告别其他，返回温馨的家",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.3,
    "reviewCount": 688,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "海岛度假",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "海岛度假",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.458748",
    "updatedAt": "2026-05-07T01:02:13.458748"
  },
  {
    "id": "tour_117",
    "title": "<潮州古城+紫莲森林度假村+汕头南澳岛3日游>动车往返、住南澳岛上海边酒店、潮州紫莲度假村，体验潮汕文化，品尝潮汕特色美食，国庆团期下单立减 产品概要行程天数：3天2晚成团地点：深圳成团目的地：潮州往返交通：动车组/动车组报名截止时间：团期前1天14点产品特色特别优惠9月24日之前预订国庆团期的可以优惠100元/人重要提示1、公安厅规定：入住酒店时游客都须提供有效的身份证正本，若无酒店将不接待，小童未有身份证则须出示户 游玩目的地： 汕头 南澳岛 潮州 行程天数： 3天 交通方式： 动车组/动车组 ¥1334 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "广东",
    "duration": 3,
    "price": 1334,
    "priceUnit": "人",
    "departureDate": "2026-07-08",
    "returnDate": "2026-07-11",
    "transportType": "大巴往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "3早餐2正餐",
    "singleSupplement": 333,
    "singleSupplementNote": "单人出行需补单房差￥333，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 14,
    "totalSeats": 49,
    "highlights": [
      "广东必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往广东",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "告别广东，返回温馨的家",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.4,
    "reviewCount": 699,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "古镇文化",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "古镇文化",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.458748",
    "updatedAt": "2026-05-07T01:02:13.458748"
  },
  {
    "id": "tour_118",
    "title": "<潮州古城+紫莲森林度假村+汕头南澳岛3日游>动车往返、住南澳岛上海边酒店、潮州紫莲度假村，体验潮汕文化，品尝潮汕特色美食，国庆团期下单立减 产品概要行程天数：3天2晚成团地点：深圳成团目的地：潮州往返交通：动车组/动车组报名截止时间：团期前1天14点产品特色特别优惠9月24日之前预订国庆团期的可以优惠100元/人重要提示1、公安厅规定：入住酒店时游客都须提供有效的身份证正本，若无酒店将不接待，小童未有身份证则须出示户 游玩目的地： 汕头 南澳岛 潮州 行程天数： 3天 交通方式： 动车组/动车组",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "广东",
    "duration": 3,
    "price": 100,
    "priceUnit": "人",
    "departureDate": "2026-08-01",
    "returnDate": "2026-08-04",
    "transportType": "大巴往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "3早餐2正餐",
    "singleSupplement": 25,
    "singleSupplementNote": "单人出行需补单房差￥25，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 17,
    "totalSeats": 47,
    "highlights": [
      "广东必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往广东",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "告别广东，返回温馨的家",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.7,
    "reviewCount": 581,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "古镇文化",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "古镇文化",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.458748",
    "updatedAt": "2026-05-07T01:02:13.458748"
  },
  {
    "id": "tour_119",
    "title": "产品概要行程天数：3天2晚成团地点：深圳成团目的地：潮州往返交通：动车组/动车组报名截止时间：团期前1天14点产品特色特别优惠9月24日之前预订国庆团期的可以优惠100元/人重要提示1、公安厅规定：入住酒店时游客都须提供有效的身份证正本，若无酒店将不接待，小童未有身份证则须出示户",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "广东",
    "duration": 3,
    "price": 100,
    "priceUnit": "人",
    "departureDate": "2026-06-03",
    "returnDate": "2026-06-06",
    "transportType": "大巴往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "3早餐2正餐",
    "singleSupplement": 25,
    "singleSupplementNote": "单人出行需补单房差￥25，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 26,
    "totalSeats": 46,
    "highlights": [
      "广东必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往广东",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "告别广东，返回温馨的家",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 3.7,
    "reviewCount": 524,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "自然风光",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "自然风光",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.458748",
    "updatedAt": "2026-05-07T01:02:13.458748"
  },
  {
    "id": "tour_120",
    "title": "<增城从化2日游>增城白水寨、从化望谷温泉小镇、独立温泉池、天适樱花园 白水寨“中国第一瀑布”的白水寨景区，景区内建有9999级登山步径，总长6.6公里，19000多步，横跨三座高山，边接二大天池，号称“天南一梯”。海船木栈道是白水寨园区内受欢迎的游览线路，也是国内唯一 游玩目的地： 行程天数： 2天 交通方式： 汽车/汽车 ¥814 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "其他",
    "duration": 2,
    "price": 814,
    "priceUnit": "人",
    "departureDate": "2026-06-04",
    "returnDate": "2026-06-06",
    "transportType": "大巴往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "2早餐1正餐",
    "singleSupplement": 203,
    "singleSupplementNote": "单人出行需补单房差￥203，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 10,
    "totalSeats": 30,
    "highlights": [
      "其他必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往其他",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "告别其他，返回温馨的家",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.0,
    "reviewCount": 723,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "海岛度假",
      "纯玩",
      "品质"
    ],
    "isHot": true,
    "isNew": true,
    "isFlashSale": true,
    "groupSize": "30人常规团",
    "theme": "海岛度假",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.458748",
    "updatedAt": "2026-05-07T01:02:13.458748"
  },
  {
    "id": "tour_121",
    "title": "<阳江2日游>阳江海陵岛、十里银滩、渔家乐游船、香家堡梦幻花世界 渔家乐游船【渔家乐游船】，出海畅游无限大海风光。海上风光秀丽、蓝天、绿岛、碧海混为一体，鸟鸣、渔歌、涛声此起彼伏，奇石与浪花起、海鸥为渔夫伴行，好一幅美丽壮阔的自然景画。旅途中，或鱼跃莺飞，霞光万丈， 游玩目的地： 阳江 海陵岛 行程天数： 2天 交通方式： 汽车/汽车 ¥596 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "其他",
    "duration": 2,
    "price": 596,
    "priceUnit": "人",
    "departureDate": "2026-07-08",
    "returnDate": "2026-07-10",
    "transportType": "大巴往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "2早餐1正餐",
    "singleSupplement": 149,
    "singleSupplementNote": "单人出行需补单房差￥149，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 12,
    "totalSeats": 32,
    "highlights": [
      "其他必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往其他",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "告别其他，返回温馨的家",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.8,
    "reviewCount": 66,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "自然风光",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "自然风光",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.458748",
    "updatedAt": "2026-05-07T01:02:13.459748"
  },
  {
    "id": "tour_122",
    "title": "<江门佛山2日游>观凤仪里碉楼油菜花、泡纯真星泉温泉、顺德逢简水乡、南风古灶 凤仪里碉楼【凤仪里碉楼群】（游览约1小时）凤仪里碉楼古村落，又名\"女儿村\"，是塘口镇四九村委会下属一条自然村，已经有400多年的历史。凤仪里古村落占地面积约500多亩，里面的景致展示了开平大部分古村落 游玩目的地： 江门 行程天数： 2天 交通方式： 汽车/汽车 ¥596 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "其他",
    "duration": 2,
    "price": 596,
    "priceUnit": "人",
    "departureDate": "2026-05-21",
    "returnDate": "2026-05-23",
    "transportType": "大巴往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "2早餐1正餐",
    "singleSupplement": 149,
    "singleSupplementNote": "单人出行需补单房差￥149，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 21,
    "totalSeats": 41,
    "highlights": [
      "其他必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往其他",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "告别其他，返回温馨的家",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.0,
    "reviewCount": 460,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "海岛度假",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "海岛度假",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.459748",
    "updatedAt": "2026-05-07T01:02:13.459748"
  },
  {
    "id": "tour_123",
    "title": "<江门古兜2日游>恩平锦江温泉、采摘时令水果、凤仪里碉楼、双合油菜花海 凤仪里碉楼【凤仪里碉楼群】（游览约1小时）凤仪里碉楼古村落，又名\"女儿村\"，是塘口镇四九村委会下属一条自然村，已经有400多年的历史。凤仪里古村落占地面积约500多亩，里面的景致展示了开平大部分古村落 游玩目的地： 江门 行程天数： 2天 交通方式： 汽车/汽车 ¥705 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "其他",
    "duration": 2,
    "price": 705,
    "priceUnit": "人",
    "departureDate": "2026-05-19",
    "returnDate": "2026-05-21",
    "transportType": "大巴往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "2早餐1正餐",
    "singleSupplement": 176,
    "singleSupplementNote": "单人出行需补单房差￥176，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 19,
    "totalSeats": 39,
    "highlights": [
      "其他必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往其他",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "告别其他，返回温馨的家",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.5,
    "reviewCount": 73,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "海岛度假",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "海岛度假",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.459748",
    "updatedAt": "2026-05-07T01:02:13.459748"
  },
  {
    "id": "tour_124",
    "title": "<佛山2日游>梦里水乡百花园、三水金装卧佛、逢简水乡、清晖园、食滋补火锅宴、十二道锋味大盘鱼 逢简水乡『逢简水乡』、逢简水乡地处广东顺德区杏坛镇北端，锦鲤江畔，水资源以及水环境极优。绕村居水道达十公里有余，辖区水道达28公里之多。水光接天，碧波荡漾，曲折迂回有不尽之感觉。远离繁嚣，宽气清新宜 游玩目的地： 佛山 行程天数： 2天 交通方式： 汽车/汽车 ¥596 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "广东",
    "duration": 2,
    "price": 596,
    "priceUnit": "人",
    "departureDate": "2026-05-18",
    "returnDate": "2026-05-20",
    "transportType": "大巴往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "2早餐1正餐",
    "singleSupplement": 149,
    "singleSupplementNote": "单人出行需补单房差￥149，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 11,
    "totalSeats": 36,
    "highlights": [
      "广东必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往广东",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "告别广东，返回温馨的家",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.9,
    "reviewCount": 481,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "自然风光",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "自然风光",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.459748",
    "updatedAt": "2026-05-07T01:02:13.459748"
  },
  {
    "id": "tour_125",
    "title": "<惠州2日游>中午出发懒人行程，宿舒适酒店，海滩夜晚BBQ，篝火晚会烟花秀，出海捕鱼自由活动无约束 产品概要行程天数：2天1晚成团地点：深圳成团目的地：惠州往返交通：汽车/汽车报名截止时间：团期前1天18点接待标准•用餐安排：一晚餐烧烤/一早餐牛奶加面包•住宿安排：一晚住宿金河酒店/新明园假日酒店 游玩目的地： 惠州 行程天数： 2天 交通方式： 汽车/汽车 ¥400 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "广东",
    "duration": 2,
    "price": 400,
    "priceUnit": "人",
    "departureDate": "2026-05-15",
    "returnDate": "2026-05-17",
    "transportType": "大巴往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "2早餐1正餐",
    "singleSupplement": 100,
    "singleSupplementNote": "单人出行需补单房差￥100，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 15,
    "totalSeats": 30,
    "highlights": [
      "广东必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往广东",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "告别广东，返回温馨的家",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.8,
    "reviewCount": 152,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "海岛度假",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": true,
    "isFlashSale": true,
    "groupSize": "30人常规团",
    "theme": "海岛度假",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.459748",
    "updatedAt": "2026-05-07T01:02:13.459748"
  },
  {
    "id": "tour_126",
    "title": "<巽寮湾2日游>海之星游艇、一支箭、蜡像馆、永记生态园赏花 海之星【海之星游艇】来到美丽的巽寮湾、要享受她赋予的：阳光、海浪、奢华；也要观赏她的：美丽、梦幻与激情，漂亮的游艇一身雪白的船身在蔚蓝的大海上是那么耀眼，时尚的外型颇感奢华。沿途欣赏“海鸥岛、凤池岛、 游玩目的地： 巽寮湾 行程天数： 2天 交通方式： 汽车/汽车 ¥596 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "其他",
    "duration": 2,
    "price": 596,
    "priceUnit": "人",
    "departureDate": "2026-07-10",
    "returnDate": "2026-07-12",
    "transportType": "大巴往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "2早餐1正餐",
    "singleSupplement": 149,
    "singleSupplementNote": "单人出行需补单房差￥149，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 24,
    "totalSeats": 44,
    "highlights": [
      "其他必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往其他",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "告别其他，返回温馨的家",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 3.8,
    "reviewCount": 391,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "冰雪世界",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "冰雪世界",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.459748",
    "updatedAt": "2026-05-07T01:02:13.459748"
  },
  {
    "id": "tour_127",
    "title": "<罗浮山2日游>罗浮山、哈斯塔特小镇、那里花开 罗浮山【罗浮山】，道孝圣地。罗浮山主峰飞云顶海拔1296米，峰顶盘圆平坦，花草并茂，云雾缭绕。参观全国十大道都明观——冲虚古观，冲虚古观为东晋著名的道教理论家、炼丹家、化学家、药物学家葛洪所创立。罗浮 游玩目的地： 罗浮山 行程天数： 2天 交通方式： 汽车/汽车 ¥596 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "其他",
    "duration": 2,
    "price": 596,
    "priceUnit": "人",
    "departureDate": "2026-07-25",
    "returnDate": "2026-07-27",
    "transportType": "大巴往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "2早餐1正餐",
    "singleSupplement": 149,
    "singleSupplementNote": "单人出行需补单房差￥149，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 24,
    "totalSeats": 44,
    "highlights": [
      "其他必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往其他",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "告别其他，返回温馨的家",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.5,
    "reviewCount": 289,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "自然风光",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "自然风光",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.459748",
    "updatedAt": "2026-05-07T01:02:13.459748"
  },
  {
    "id": "tour_128",
    "title": "<清远连州地下河-湟川三峡2日游>观看桃花、探秘5A景区连州地下河（洞中一日，世上千年）、船游湟川三峡瀑布群、品连州风味宴、入住金瑶峰度假村 •用餐安排：品尝连州风味宴•住宿安排：入住全新酒店金瑶峰度假村标双•行程安排：往返旅游巴士，一人一正座•游玩安排：探秘连州地下河，船游湟川三峡•贴心赠送：赠送湟川三峡桃花岛，观赏桃花 游玩目的地： 清远 行程天数： 2天 交通方式： 汽车/汽车 ¥450 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "其他",
    "duration": 2,
    "price": 450,
    "priceUnit": "人",
    "departureDate": "2026-07-19",
    "returnDate": "2026-07-21",
    "transportType": "大巴往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "2早餐1正餐",
    "singleSupplement": 112,
    "singleSupplementNote": "单人出行需补单房差￥112，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 18,
    "totalSeats": 33,
    "highlights": [
      "其他必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往其他",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "告别其他，返回温馨的家",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.9,
    "reviewCount": 567,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "自然风光",
      "纯玩",
      "品质"
    ],
    "isHot": true,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "自然风光",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.459748",
    "updatedAt": "2026-05-07T01:02:13.459748"
  },
  {
    "id": "tour_129",
    "title": "<清远-英德2日游>入住云海碱性温泉酒店、无限次温泉、无边际泳池、清泉湾花海玻璃桥、天子山瀑布、七彩云足浴、水晶弹野战 云海碱性温泉38多个大小不一的温泉池中享受“温泉水滑洗凝”的贵妃泡浴待遇，尽洗疲劳，这些露天与半露天的温泉池镶嵌在鲜花碧草中，浓缩了中国园林艺术的精华，将亚洲温泉的古朴与浪漫发挥得淋漓尽致。 游玩目的地： 清远 行程天数： 2天 交通方式： 汽车/汽车 ¥398 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "其他",
    "duration": 2,
    "price": 398,
    "priceUnit": "人",
    "departureDate": "2026-07-15",
    "returnDate": "2026-07-17",
    "transportType": "大巴往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "2早餐1正餐",
    "singleSupplement": 99,
    "singleSupplementNote": "单人出行需补单房差￥99，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 24,
    "totalSeats": 34,
    "highlights": [
      "其他必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往其他",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "告别其他，返回温馨的家",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.1,
    "reviewCount": 48,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "海岛度假",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "海岛度假",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.459748",
    "updatedAt": "2026-05-07T01:02:13.459748"
  },
  {
    "id": "tour_130",
    "title": "<珠海2日游>长隆海洋王国、大型烟花表演、圆明新园住长隆 产品概要行程天数：2天1晚成团地点：深圳成团目的地：珠海往返交通：汽车/汽车报名截止时间：团期前1天18点接待标准•行程安排：海洋王国门票、特别优惠1.65周岁以上的老人持有效证件现退景点门票 游玩目的地： 珠海 珠海长隆 行程天数： 2天 交通方式： 汽车/汽车 ¥780 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "广东",
    "duration": 2,
    "price": 780,
    "priceUnit": "人",
    "departureDate": "2026-06-16",
    "returnDate": "2026-06-18",
    "transportType": "大巴往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "2早餐1正餐",
    "singleSupplement": 195,
    "singleSupplementNote": "单人出行需补单房差￥195，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 16,
    "totalSeats": 41,
    "highlights": [
      "广东必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往广东",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "告别广东，返回温馨的家",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.2,
    "reviewCount": 193,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "自然风光",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "自然风光",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.459748",
    "updatedAt": "2026-05-07T01:02:13.459748"
  },
  {
    "id": "tour_131",
    "title": "<惠州香溪古堡-龙门铁泉-奥地利小镇度假2日游>入住龙门汇都大酒店，浸泡龙门铁泉，含往返交通，含三正一早，游览那里花开主题公园 惠州龙门铁泉【浸泡】世界珍稀《黄金汤泉》，玩转欢乐冷暖水上世界【观赏】四季百花绽放名花异花斗争浪漫花海飘香【游览】香溪堡竹筏漂游、古堡探幽、竹车兜风【品尝】水库大头鱼宴 游玩目的地： 惠州 龙门铁泉 行程天数： 2天 交通方式： 汽车/汽车 ¥643 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "其他",
    "duration": 2,
    "price": 643,
    "priceUnit": "人",
    "departureDate": "2026-05-24",
    "returnDate": "2026-05-26",
    "transportType": "大巴往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "2早餐1正餐",
    "singleSupplement": 160,
    "singleSupplementNote": "单人出行需补单房差￥160，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 19,
    "totalSeats": 49,
    "highlights": [
      "其他必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往其他",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "告别其他，返回温馨的家",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.0,
    "reviewCount": 411,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "自然风光",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "自然风光",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.459748",
    "updatedAt": "2026-05-07T01:02:13.459748"
  },
  {
    "id": "tour_132",
    "title": "<河源2日游>住五星万绿湖东方国际酒店、矿物汤泉、泳池、万绿湖镜花缘、万绿谷风景区 产品概要行程天数：2天1晚成团地点：深圳成团目的地：惠州往返交通：汽车/汽车报名截止时间：团期前1天18点重要提示1、旅游车辆严禁超载，未成年小童及婴儿均需占有车位。敬请客人按实际报名人数出行，未经旅 游玩目的地： 河源 行程天数： 2天 交通方式： 汽车/汽车 ¥673 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "广东",
    "duration": 2,
    "price": 673,
    "priceUnit": "人",
    "departureDate": "2026-07-22",
    "returnDate": "2026-07-24",
    "transportType": "大巴往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "2早餐1正餐",
    "singleSupplement": 168,
    "singleSupplementNote": "单人出行需补单房差￥168，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 18,
    "totalSeats": 48,
    "highlights": [
      "广东必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往广东",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "告别广东，返回温馨的家",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 3.7,
    "reviewCount": 245,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "自然风光",
      "纯玩",
      "品质"
    ],
    "isHot": true,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "自然风光",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.459748",
    "updatedAt": "2026-05-07T01:02:13.459748"
  },
  {
    "id": "tour_133",
    "title": "<珠海长隆海洋王国2日游>浪漫情侣游，长隆海洋王国、横琴烟花汇演，圆明新园、石景山公园、野狸岛、情侣路 简介当前珠海热门景点莫过于长隆海洋王国+烟花汇演，这是来珠海必玩必看的景点；夏天热门的项目莫过于玩水了，这么热的天气泡在水里，畅玩水上项目可谓是一大享受。本行程包含了以上提到的两点——长隆海洋王国+ 游玩目的地： 珠海 珠海长隆 行程天数： 2天 交通方式： 汽车/汽车 ¥758 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "广东",
    "duration": 2,
    "price": 758,
    "priceUnit": "人",
    "departureDate": "2026-06-13",
    "returnDate": "2026-06-15",
    "transportType": "大巴往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "2早餐1正餐",
    "singleSupplement": 189,
    "singleSupplementNote": "单人出行需补单房差￥189，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 7,
    "totalSeats": 42,
    "highlights": [
      "广东必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往广东",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "告别广东，返回温馨的家",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 3.5,
    "reviewCount": 662,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "自然风光",
      "纯玩",
      "品质"
    ],
    "isHot": true,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "自然风光",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.459748",
    "updatedAt": "2026-05-07T01:02:13.459748"
  },
  {
    "id": "tour_134",
    "title": "<珠海长隆2日游>纯玩无购物，珠海长隆海洋王国，唯美梦幻海洋街，5D视觉**，烟花汇演， 圆明新园，观港珠澳大桥 长隆海洋王国·长隆海洋王国是世界最大的海洋主题乐园，也是全球首创大型游乐设施与珍贵动物展区相结合的独特设计。·这里有亚洲第一台轨道最长的飞行过山车，和亚洲第一台水上过山车。·长隆海洋王国海洋馆同时荣获 游玩目的地： 珠海 珠海长隆 行程天数： 2天 交通方式： 汽车/汽车 ¥905 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "广东",
    "duration": 2,
    "price": 905,
    "priceUnit": "人",
    "departureDate": "2026-07-20",
    "returnDate": "2026-07-22",
    "transportType": "大巴往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "2早餐1正餐",
    "singleSupplement": 226,
    "singleSupplementNote": "单人出行需补单房差￥226，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 28,
    "totalSeats": 38,
    "highlights": [
      "广东必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往广东",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "告别广东，返回温馨的家",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.5,
    "reviewCount": 222,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "自然风光",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "自然风光",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.459748",
    "updatedAt": "2026-05-07T01:02:13.459748"
  },
  {
    "id": "tour_135",
    "title": "高铁韶关B线：云门山玻璃桥、曹角湾古村、小坑水库、经律论文化小镇、翡翠玉观音、花世界、生肖广场、蓝山源岭南东方温泉酒店，双高铁两晚五星温泉美食享受三天团 ★刺激惊险——感受广东省规模最大的全透明高空景观玻璃桥；★归隐田园——感受清代古村落生活-曹角湾古村；★舌尖美食——安排当地特色餐饮，品尝地道韶关风味；★宿双五星——入住韶关蓝山源岭南东方温泉酒店+经律论温泉酒店；★品质出行——往返高铁，轻松出行，全程无购物，真正纯玩团！ 游玩目的地： 韶关 丹霞山 行程天数： 3天 交通方式： 高铁 ¥1529 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "广东",
    "duration": 3,
    "price": 1529,
    "originalPrice": 1737,
    "priceUnit": "人",
    "departureDate": "2026-05-31",
    "returnDate": "2026-06-03",
    "transportType": "大巴往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "3早餐2正餐",
    "singleSupplement": 382,
    "singleSupplementNote": "单人出行需补单房差￥382，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 6,
    "totalSeats": 41,
    "highlights": [
      "广东必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往广东",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "告别广东，返回温馨的家",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.7,
    "reviewCount": 436,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "海岛度假",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "discountRate": 12,
    "groupSize": "30人常规团",
    "theme": "海岛度假",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.459748",
    "updatedAt": "2026-05-07T01:02:13.459748"
  },
  {
    "id": "tour_136",
    "title": "<清远巴士2日游>九瀑探险森林王国、**CS野战、尽享温泉 牛在“玩”清泉湾漂流+山水乐园新银盏温泉牛在“吃”享用清远餐，品尝正宗地道美食。 游玩目的地： 清远 黄腾峡漂流 深圳 行程天数： 2天 交通方式： 汽车/汽车 ¥453 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "广东",
    "duration": 2,
    "price": 453,
    "priceUnit": "人",
    "departureDate": "2026-06-21",
    "returnDate": "2026-06-23",
    "transportType": "大巴往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "2早餐1正餐",
    "singleSupplement": 113,
    "singleSupplementNote": "单人出行需补单房差￥113，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 13,
    "totalSeats": 48,
    "highlights": [
      "广东必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往广东",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "告别广东，返回温馨的家",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.7,
    "reviewCount": 191,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "海岛度假",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "海岛度假",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.459748",
    "updatedAt": "2026-05-07T01:02:13.459748"
  },
  {
    "id": "tour_137",
    "title": "<韶关丹霞山-长老峰-曹溪温泉-南华寺2日游>住曹溪温泉度假村，览世界自然遗产（阴阳石），南华禅寺，韶关地标风采楼， 世界自然遗产丹霞山、南华寺、百年东街、风采楼、五马农业基地、入住曹溪温泉 游玩目的地： 韶关 曹溪温泉 丹霞山 东莞 行程天数： 2天 交通方式： 汽车/汽车 ¥590 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "其他",
    "duration": 2,
    "price": 590,
    "priceUnit": "人",
    "departureDate": "2026-07-05",
    "returnDate": "2026-07-07",
    "transportType": "大巴往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "2早餐1正餐",
    "singleSupplement": 147,
    "singleSupplementNote": "单人出行需补单房差￥147，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 18,
    "totalSeats": 38,
    "highlights": [
      "其他必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往其他",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "告别其他，返回温馨的家",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.2,
    "reviewCount": 579,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "海岛度假",
      "纯玩",
      "品质"
    ],
    "isHot": true,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "海岛度假",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.459748",
    "updatedAt": "2026-05-07T01:02:13.459748"
  },
  {
    "id": "tour_138",
    "title": "<清远2日游>古龙峡漂流、静山湖大马戏、卡丁车/越野车、灯光节、DIY野炊 惊魂玻璃桥高空玻璃吊桥建于清远牛鱼嘴风景区的悬崖上，桥全长达250米，悬空的桥身200米，离地高度超200米。近看，万丈深渊就在脚下仿佛置身于空中，蓝天白云近在咫尺。银盏森林温泉银盏森林温泉树木葱茏， 游玩目的地： 清远 古龙峡漂流 东莞 行程天数： 2天 交通方式： 汽车/汽车 ¥379 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "其他",
    "duration": 2,
    "price": 379,
    "priceUnit": "人",
    "departureDate": "2026-05-26",
    "returnDate": "2026-05-28",
    "transportType": "大巴往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "2早餐1正餐",
    "singleSupplement": 94,
    "singleSupplementNote": "单人出行需补单房差￥94，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 13,
    "totalSeats": 38,
    "highlights": [
      "其他必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往其他",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "告别其他，返回温馨的家",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.0,
    "reviewCount": 115,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "海岛度假",
      "纯玩",
      "品质"
    ],
    "isHot": true,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "海岛度假",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.459748",
    "updatedAt": "2026-05-07T01:02:13.459748"
  },
  {
    "id": "tour_139",
    "title": "<惠州龙门温泉直通车1晚2日游>入住依泉楼 1、泡罕有的“黄金泉”，其为地下深层天然自涌的温泉水，泉水颜色呈金黄色，对腰肌劳损、风湿性骨痛特有疗效；2、温泉项目齐全，任玩全国首创“天然黄金温泉蒸汽浴”、温泉冲浪、中药池、瀑布池、十二生肖池等； 游玩目的地： 惠州 东莞 龙门铁泉 行程天数： 2天 交通方式： 汽车/汽车 ¥453 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "其他",
    "duration": 2,
    "price": 453,
    "priceUnit": "人",
    "departureDate": "2026-07-14",
    "returnDate": "2026-07-16",
    "transportType": "大巴往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "2早餐1正餐",
    "singleSupplement": 113,
    "singleSupplementNote": "单人出行需补单房差￥113，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 15,
    "totalSeats": 45,
    "highlights": [
      "其他必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往其他",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "告别其他，返回温馨的家",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 3.9,
    "reviewCount": 353,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "海岛度假",
      "纯玩",
      "品质"
    ],
    "isHot": true,
    "isNew": true,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "海岛度假",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.459748",
    "updatedAt": "2026-05-07T01:02:13.459748"
  },
  {
    "id": "tour_140",
    "title": "<海南三亚双飞5日游>萌娃/情侣精选0购物，3晚温德姆/红树林等+1晚海棠湾喜来登/万丽/万达文华，游呀诺达&南山&蜈支洲岛，奔驰接机/享私家沙滩 •用餐安排：全程安排指定餐厅用餐，30元/人/餐的标准，围桌餐保证十菜一汤或自助餐•住宿安排：4晚连住/海立方度假酒店/三亚丽禾温德姆度假酒店，一线海景，15分钟步行至沙滩，尽享海湾风景。•游玩安排： 游玩目的地： 海南 三亚 行程天数： 5天 交通方式： 飞机/飞机 ¥2212 起 查看详情 <华东五市-乌镇-苏州园林-西湖双飞4日游>0购物，禅意拈花湾And西栅精品双客栈，50元餐标，舒心出游 产品概要行程天数：4天3晚成团地点：南京成团目的地：南京往返交通：飞机/飞机报名截止时间：团期前2天18点交通信息★航班时间不满意可以换吗？答：网站前台日历上的价格抓取的是当天所有航班中便宜的一套，如 游玩目的地： 苏州 杭州 上海 南京 行程天数： 4天 交通方式： 飞机/飞机 ¥2223 起 查看详情 <洛阳牡丹-少林寺-龙门石窟高铁3日游>全程0购物店，走进千年古都，穿越牡丹花海 河南全景【少林寺】：千年古刹，禅宗出庭，少林武术更是天下闻名；【龙门石窟】：三大石窟之一，世界文化遗产；【龙门石窟】：龙门石窟是中国石刻艺术宝库之一，现为世界文化遗产、全国重点文物保护单位、国家AAA 游玩目的地： 少林寺 龙门石窟 洛阳 行程天数： 3天 交通方式： 高铁二等座/高铁二等座 ¥2291 起 查看详情 <青海湖+茶卡盐湖+张掖丹霞+敦煌莫高窟双飞7日游>西北30人自营0购物，茶卡超长3H，5月团期车型升级稀缺陆地头等舱，深入祁连，可升级动车 •用餐安排：全新升级30元正餐+敦煌升级40元敦煌老味道餐，让舌尖跟上步伐的速度，一起去旅行！•住宿安排：青海湖1晚住宿，星空，草原，安宁陪伴你的夜晚。全程精选住宿，高性价比，省钱更舒适！•行程安排： 游玩目的地： 嘉峪关 西宁 青海 张掖 莫高窟 行程天数： 8天 交通方式： 飞机/飞机 ¥4149 起 查看详情 <桂林-阳朔-兴坪漓江-象鼻山-遇龙河-世外桃源-银子岩高铁3日游>深圳往返0自费/遇龙手撑竹筏/精致小团//豪餐盛景 【爸妈放心游】24小时专属客服，任何问题及时处理+舒适住宿，保证良好睡眠+品牌矿泉水畅饮。【2大1小三口档】独享儿童含早，哄好下一代，轻松游玩。【三人出行档】不想住2间房,可以退还单房差，我们将尽可能 游玩目的地： 桂林 阳朔 行程天数： 3天 交通方式： 高铁二等座/高铁二等座 ¥948 起 查看详情 <张家界-天门山-黄龙洞-玻璃栈道-凤凰古城单飞6日游>张家界进长沙出,森林公园二次入园,30元/人高餐标,享牛气冲天宴,长沙住宿升级高端酒店 【高点评高满意度】超1W客户的选择，超3K的真实点评，95%的超高满意度，国旅品质，您说了算！【客户自己选的明星导游】固定导游，甄选明星导游带团，无微不至的服务，贴心温馨的安排，让您享受管家式的旅途服 游玩目的地： 张家界 长沙 黄石寨 芙蓉镇 天门山 行程天数： 6天 交通方式： 飞机/飞机 ¥2495 起 查看详情 <云南-昆明-大理-丽江双飞双动车6日游>两晚丽江金茂/1晚温泉酒店/5A石林/玉龙雪山大索/印象丽江/洱海吉普旅拍/省内动车免劳累 【精华景点】6天玩转城市名片，丽江古城/玉龙雪山冰川公园大索道，大理古城/洱海，昆明石林。【超值赠送】雪山之巅大师之作，云南不可错过的一场大型实景演出—《印象丽江》【专业导游】专业导游团队，优质服务品 游玩目的地： 大理 昆明 云南 丽江 香格里拉 行程天数： 6天 交通方式： 飞机/飞机 ¥2708 起 查看详情 <成都-九寨沟-黄龙-都江堰-熊猫乐园双飞6日游>品途线路发班/品途专属团餐/川主寺升级2晚高标住宿/九寨沟闭园则更换牟尼沟和草原 产品概要行程天数：6天5晚成团地点：成都成团目的地：成都往返交通：飞机/飞机报名截止时间：团期前0天18点附加说明：本行程与其他团队客人拼往返用车。接待标准•用餐安排：熊猫小吃（价值48元/人），牦 游玩目的地： 成都 九寨沟 兰州 乐山 峨眉山 行程天数： 6天 交通方式： 飞机/飞机 ¥2812 起 查看详情 <新疆天池-可可托海-五彩滩-禾木-喀纳斯-魔鬼城-赛湖双飞9日游>网红双湖30人小团，1晚住禾木守望星空/晨曦，赠赛湖旅拍/享299元民族丝路秀 品途自营地接❤什么是品途专线？ 品途专线是品途旅游网独家推出的产品系列，行程自主研发、安排透明，提供高品质行程和优质服务，服务贴心周到倾力推荐【喀纳斯深度游】产品北疆是新疆最美丽最富饶的地 游玩目的地： 新疆 吐鲁番 乌鲁木齐 阿勒泰 喀什地区 克拉玛依 行程天数： 9天 交通方式： 飞机/飞机 ¥5335 起 查看详情 <北京双飞6日游>誉满京城首游推荐，五星酒店连住，2大免1小，听德云社相声，深度畅游北京20大景点，品正宗宫廷风味宴，24H无忧接送 全程连住北京市高大上五星或豪华型酒店！0购物更多时间！人气TOP二十大精华景点任你游！体验：High翻古都北京，探索人类历史奇迹奇观震撼您的身心品味：享用中南海御厨自助午餐——40元/人 游玩目的地： 北京 故宫 颐和园 行程天数： 6天 交通方式： 飞机/飞机 ¥3059 起 查看详情 <北京双飞5日游>（尾货）誉满京城首游推荐，****出游佳选，五星酒店连住2大免1小，听德云社相声品正宗宫廷风味宴，24H无忧接送享别样京城 全程连住北京市高大上五星或豪华型酒店！0购物更多时间！人气TOP二十大精华景点任你游！体验：High翻古都北京，探索人类历史奇迹奇观震撼您的身心品味：享用中南海御厨自助午餐——40元/人 游玩目的地： 北京 故宫 八达岭长城 颐和园 恭王府 鸟巢 行程天数： 5天 交通方式： 飞机/飞机 ¥2749 起 查看详情 <云南昆明-大理-丽江三飞6日游>纯玩0购物/JEEP越野/花海旅拍含10张精修照片/雪山大索道/看印象丽江/5A石林/鲜花大床 ❤礼庆双节超值赠送❤☆下单立减300元（指定团期）☆VIP贵宾厅接机☆旅行三宝1份/人☆旅拍精修10张/家庭☆鲜花铺床（半年内有效结婚证）☆生日蛋糕（以身份证为准）❤旅行In个性，玩法666【in 游玩目的地： 云南 丽江 昆明 大理 行程天数： 6天 交通方式： 飞机/飞机 ¥2913 起 查看详情 <郴州3日游>深圳往返，宿市区舒适酒店，一天自由活动，动可徒步登山早赏水雾，静可竹林洗肺船游东江，适合徒步、摄影爱好者，纯玩不进店 推荐理由：如果你对人生迷茫，如果你对生活迷茫，如果你有烦恼，如果....一切一切，那么请来小东江吧，这是一个原生态的地方，可以让你抛开一切城市繁华的压力，真正活在自己的世界里。如果你爱上一个人，那 游玩目的地： 郴州 行程天数： 3天 交通方式： 汽车/汽车 ¥521 起 查看详情 <河南-郭亮-云台山-龙门石窟-少林寺-开封双飞5日游>放心爸妈游，25人内精致小团，体验挂壁公路，精选高档酒店，纯玩0购物，24H接机 详情为什么选择国旅专线？❤国旅产品：一支年轻的团队，专一研究怎样让国旅贵宾完美出游，你值得拥有。❤住宿升级：全程精选酒店，给您一个舒适的睡眠。❤吃货专享：登封美食素斋，云台山国旅餐；让你安心享用 游玩目的地： 少林寺 龙门石窟 郑州 行程天数： 5天 交通方式： 飞机/飞机 ¥2509 起 查看详情 <云南-昆明-大理-丽江3飞6日游>昆明直飞丽江，两晚丽江金茂/1晚温泉酒店，5A石林/玉龙雪山冰川大索道/印象丽江，轻松出游 【精华景点】6天玩转城市名片，丽江古城/玉龙雪山冰川公园大索道，大理古城/洱海，昆明石林。【超值赠送】雪山之巅大师之作，云南不可错过的一场大型实景演出—《印象丽江》【专业导游】专业导游团队，优质服务品 游玩目的地： 大理 昆明 云南 行程天数： 6天 交通方式： 飞机/飞机 ¥4000 起 查看详情 <河南-云台山-龙门-少林寺-开封双飞4日游>25人精致小团，全程国际品牌Holiday inn，畅享恒温泳池，纯玩0购爸妈游 国旅专线专业为你❤国旅产品：一支年轻的团队，专一研究怎样让国旅贵宾完美出游，你值得拥有。❤住宿升级：沿途城市精选酒店，避免市场同行业其他线路每晚折回郑州，遭受多余的舟车劳顿之苦，给您一个舒适的睡眠 游玩目的地： 少林寺 龙门石窟 行程天数： 4天 交通方式： 飞机/飞机 ¥2189 起 查看详情 <青海湖+茶卡盐湖+张掖+敦煌双飞8日游>纯玩0购/9人内小团，24H接送机/不用等人/自由度高/无忧西北环游** 产品概要行程天数：8天7晚成团地点：西宁成团目的地：海西往返交通：飞机/飞机报名截止时间：团期前1天21点接待标准•用餐安排：全程不含餐，您自由选择，丰俭由己•住宿安排：茶卡镇双人标间，贴近茶卡盐湖 游玩目的地： 嘉峪关 西宁 张掖 青海 行程天数： 8天 交通方式： 飞机/飞机 ¥4580 起 查看详情 <成都-新都桥-稻城亚丁-海螺沟双飞8日游>纯玩0购物 入住3晚智选假日酒店/1晚稻城金珠大酒店 33人封顶 2次特色餐圣地祈福 √用心餐食：品尝餐，感受纯正的当地美食！√高档住宿：区别于常规团经济型住宿，此线路住宿全程精选高档型酒店！√优质导游：圈定导游，专业导游陪同，只为你提供贴心的服务！√贴心服务：出游中客服24小时贴心守 游玩目的地： 成都 花溪 阿坝 九寨沟 行程天数： 8天 交通方式： 火车/火车 ¥3366 起 查看详情 <贵州黄果树瀑布-荔波-西江-花溪湿地高铁5日游>专车专导0购物 观壮美大瀑布 赏世遗风情 探苗家文化 产品概要行程天数：5天4晚成团地点：贵阳成团目的地：安顺往返交通：高铁二等座/高铁二等座报名截止时间：团期前3天18点附加说明：可根据需要选择某段行程或升级行程，在该行程段分开安排或统一协调行程。接待 游玩目的地： 贵阳 黄果树 行程天数： 5天 交通方式： 高铁二等座/高铁二等座 ¥2219 起 查看详情 <黄山+宏村+屯溪老街+上海双飞5日游>云海奇松/徽派建筑，1晚山顶双标/观日出，1晚五星，含105元正餐，纯玩0购物 品黄山+赏宏村+行老街★纯玩经典：魅力魔都、黄山观日出、宏村徽州古名居。★美食之旅：品味小山城的慢生活，探秘舌尖上的徽州。★摄影之旅：合理的行程规划，让您有足够时间停下脚步，拍上几张。★黄山 游玩目的地： 上海 黄山 宏村 徽州古城 行程天数： 5天 交通方式： 飞机/飞机 ¥3168 起 查看详情 <北京-八达岭-故宫-颐和园-天坛双飞5日游>住连锁酒店 全年365天接送机场 参观华夏魔术城 增加圆明园 漫步老北京胡同 品尝烤鸭餐 ★专注行程每个细节※注重贵宾真实体验★◆【轻松舒适】：每天8小时充足睡眠时间，放慢脚步，感受北京慢生活，让您不再“走马观花“！◆【闲情逸致】：游览时间科学合理，纯净无死角畅游帝都北京经典景点！ 游玩目的地： 北京 行程天数： 5天 交通方式： 飞机/飞机 ¥2557 起 查看详情 <韶山-张家界-百龙电梯-天门山-玻璃栈道-凤凰古城高铁6日游>0购物,宿4晚高端/5星/黄龙洞,宿凤凰/含9景/135元特色餐,周4升航空座椅车型 国旅专线=品质服务+超高满意度1、牛服务：专业自营随往地接社，从计调到导游，均有丰富的从业经验，严格筛选服务之星导游队伍，24小时管家服务，为您的出行保驾护航。2、牛品质：含五大火爆景点（韶山+张家界 游玩目的地： 张家界 长沙 行程天数： 6天 交通方式： 高铁二等座/高铁二等座 ¥3757 起 查看详情 <海南三亚双飞4日游>17万人出游0购物，180度海景/海立方(供免费挖沙工具)/温德姆(赠欢迎水果)/国光豪生(隔条马路即沙滩)，度假雨林天堂，接机0等待 •用餐安排：全程安排指定餐厅用餐，30元/人/餐的标准，围桌餐保证十菜一汤或自助餐；其中两顿晚餐升级为40元/人社会小炒围桌餐；海南口味偏淡，还请您多多包含；重口味的亲们可以带些老干妈等调调口味•游玩 游玩目的地： 海南 三亚 行程天数： 4天 交通方式： 飞机/飞机 ¥1848 起 查看详情 <海南三亚双飞5日游>17万人出游0购物，180度海景/海立方(供免费挖沙工具)/温德姆(赠欢迎水果)/国光豪生(隔条马路即沙滩)，度假雨林天堂，接机0等待 •用餐安排：全程安排指定餐厅用餐，30元/人/餐的标准，围桌餐保证十菜一汤或自助餐；其中两顿晚餐升级为40元/人社会小炒围桌餐；海南口味偏淡，还请您多多包含；重口味的亲们可以带些老干妈等调调口味•住宿 游玩目的地： 海南 三亚 行程天数： 5天 交通方式： 飞机/飞机 ¥2158 起 查看详情 <海南三亚双飞4日游>20人精品小团0购物，国际五星温德姆/洲际皇冠假日/国光豪生连住，丰富自助早餐+多房型可选+玩乐设施，蜈支洲畅玩一天，接机0等待 •用餐安排：全程安排指定餐厅用餐，30元/人/餐的标准，围桌餐保证十菜一汤或自助餐•游玩安排：景点只去精华的，只安排三亚知名度和值得玩的5大黄金景点（亚龙湾沙滩、亚龙湾热带天堂森林公园、蜈支洲岛纯玩 游玩目的地： 海南 三亚 行程天数： 4天 交通方式： 飞机/飞机 ¥1948 起 查看详情 <海南三亚双飞7日游>20人精品小团0购物，国际五星温德姆/洲际皇冠假日/国光豪生连住，丰富自助早餐+多房型可选+玩乐设施，蜈支洲畅玩一天，接机0等待 •用餐安排：全程安排指定餐厅用餐，30元/人/餐的标准，围桌餐保证十菜一汤或自助餐•游玩安排：景点只去最精的，只安排三亚最具知名度和值得玩的5大黄金景点（亚龙湾沙滩、亚龙湾热带天堂森林公园、蜈支洲岛 游玩目的地： 海南 三亚 行程天数： 7天 交通方式： 飞机/飞机 ¥2768 起 查看详情 <海南三亚双飞5日游>错峰甄选0购物，全程连住一线海边酒店，可升海立方/国光/温德姆，呀诺达雨林寻宝&南山观音祈福，奔驰接机/品当地美食 •用餐安排：全程安排指定餐厅用餐，30元/人/餐的标准，围桌餐保证十菜一汤或自助餐•住宿安排：入住三亚阳光大酒店、三亚康年酒店、三亚国光豪生度假酒店，多种酒店及房型供您选择。•游玩安排：景点只去最精的 游玩目的地： 海南 三亚 行程天数： 5天 交通方式： 飞机/飞机 ¥1881 起 查看详情 <海南三亚双飞5日游>20人精品小团0购物，国际五星温德姆/洲际皇冠假日/国光豪生连住，丰富自助早餐+多房型可选+玩乐设施，蜈支洲畅玩一天，接机0等待 奔跑吧国旅国旅人自己的品牌【品牌住宿】：国际五星温德姆（丽禾温德姆、国光豪生）/万豪（山海天万豪）/喜来登（福朋喜来登）等品牌住宿，全年包房价格，优惠多多【专注产品】：产品经理反复踩线，畅销多年，每 游玩目的地： 海南 三亚 行程天数： 5天 交通方式： 飞机/飞机 ¥2308 起 查看详情 <海南三亚双飞6日游>20人精品小团0购物，国际五星温德姆/洲际皇冠假日/国光豪生连住，丰富自助早餐+多房型可选+玩乐设施，蜈支洲畅玩一天，接机0等待 奔跑吧国旅国旅人自己的品牌【品牌住宿】：国际五星温德姆（丽禾温德姆、国光豪生）/万豪（山海天万豪）/喜来登（福朋喜来登）品牌住宿，全年包房价格，优惠多多【专注产品】：产品经理反复踩线，畅销多年，每年 游玩目的地： 海南 三亚 行程天数： 6天 交通方式： 飞机/飞机 ¥2616 起 查看详情 <海南三亚双飞6日游>人气&亲子&蜜月，0购物，维景/天通/红树林/康年酒店自选连住，接机0等待，畅享蜈支洲一整天，万人出游甄选 •用餐安排：全程安排指定餐厅用餐，30元/人/餐的标准，围桌餐保证十菜一汤或自助餐；其中两顿晚餐升级为40元/人社会小炒围桌餐；海南口味偏淡，还请您多多包含；重口味的亲们可以带些老干妈等调调口味•住宿 游玩目的地： 三亚 海南 行程天数： 5天 交通方式： 飞机/飞机 ¥2310 起 查看详情 <海南三亚双飞5日游>乐开花爸妈游，纯玩0购物，国际五星国光豪生/康年/天通酒店自选，步行1分钟直达沙滩，蜈支洲一整天，24H接送机 臻品&自营定制乐开花爸妈游，只用星级导游，96%高满意度，我们一直在努力【精致度假】：没有舟车劳顿的辛苦，没有走马观花的紧凑，只在三亚，给你想要的自然风光。【个性住宿】：精挑细选海南不同湾区倍 游玩目的地： 三亚 海南 行程天数： 5天 交通方式： 飞机/飞机 ¥2285 起 查看详情 <海南三亚双飞4日游>错峰甄选0购物，全程连住一线海边酒店，可升海立方/国光/温德姆，呀诺达雨林寻宝&南山观音祈福，奔驰接机/品当地美食 •用餐安排：全程安排指定餐厅用餐，30元/人/餐的标准，围桌餐保证十菜一汤或自助餐•住宿安排：入住三亚阳光大酒店、三亚康年酒店、三亚国光豪生度假酒店，多酒店及多房型供您选择•游玩安排：景点只去最精的， 游玩目的地： 海南 三亚 行程天数： 4天 交通方式： 飞机/飞机 ¥1564 起 查看详情 <海南三亚双飞5日游>人气&亲子&蜜月，0购物，维景/天通/红树林/康年酒店自选连住，接机0等待，畅享蜈支洲一整天，万人出游甄选 行程天数：5天4晚 成团地点：三亚成团 目的地：三亚 往返交通：飞机/飞机 报名截止时间：团期前1天15点  全年畅销NO.1 游玩目的地： 三亚 海南 行程天数： 5天 交通方式： 飞机/飞机 ¥1950 起 查看详情 <北京双卧6日游>自营倾情打造/纯玩精品，热销4年超4万人选择，故宫全新深度游3H（含珍宝馆），获奖导游精讲慢游，网红餐厅特色体验，观升旗仪式 餐全新升级，唤醒舌头的味蕾，享受旅行的美好❤住的“安心”——商业圈五星配置大酒店，居住其中成为美的享受，尽享帝都别漾风情❤定的“放心”——全年销量TOP线路，40000+客人的选择，真实回访点评， 游玩目的地： 北京 行程天数： 6天 交通方式： 火车硬卧/火车硬卧 ¥2805 起 查看详情 <桂林-漓江-遇龙河-银子岩-世外桃源双动4日游>人气热销,一价全含,高档住宿/阳朔两晚连住,星级游船,网红新贵千古情/遇龙河漂流,广州往返 产品概要行程天数：4天3晚成团地点：桂林成团目的地：桂林往返交通：动车组/动车组报名截止时间：团期前1天16点组团形式：联合发团；本产品与其他旅行社联合发团。附加说明：本行程与其他团队客人拼往返用车。 游玩目的地： 桂林 阳朔 行程天数： 4天 交通方式： 动车组/动车组 ¥1889 起 查看详情 <海南三亚双飞6日游>纯玩0购物，2晚三亚湾住宿，3晚海棠湾酒店，可选呀诺达网红秋千/玻璃栈道，高性价比 【有爱的产品更走心】Designanalysis1：悠哉行程——RomanticIsland—分界洲岛，全方位体验民俗—椰田古寨；呀诺达雨林，天涯海角~；Designanalysis2：酒店升级 游玩目的地： 三亚 海南 行程天数： 6天 交通方式： 飞机/飞机 ¥2445 起 查看详情 <北京双飞5日游>自营倾情打造/纯玩精品，热销4年超4万人选择，故宫全新深度游3H（含珍宝馆），获奖导游精讲慢游，网红餐厅特色体验，观升旗仪式 •用餐安排：4酒店自助早餐，4风味地道正餐全新升级：川府热盆景或老北京胡同饭（40元/人）、农家春饼宴或艺麓苑自助（50元/人）、饺子宴（30元/人，8月20号团期开始升级为40元/人）、全聚德烤鸭或 游玩目的地： 北京 行程天数： 5天 交通方式： 飞机/飞机 ¥3079 起 查看详情 <北京双高或双动6日游>自营倾情打造/纯玩精品，热销4年超4万人选择，故宫全新深度游3H（含珍宝馆），获奖导游精讲慢游，网红餐厅特色体验，观升旗仪式 倾情推出“六心”服务❤行的“舒心”——区别于散拼每天换车换导，全程只安排一个导游，一辆旅游车，一车到底绝不套车，旅游更省心❤玩的“开心”——精选资深 游玩目的地： 北京 行程天数： 6天 交通方式： 高铁二等座/高铁二等座 ¥4017 起 查看详情 <云南-昆明-大理-丽江-香格里拉双飞8日游>自营超4万人出游/5A石林/玉龙雪山大索/印象丽江/双廊旅拍/大理海景房/安宁温泉/洱海骑行 行程天数：8天7晚 成团地点：昆明成团 目的地：昆明 往返交通：飞机/飞机 报名截止时间：团期前1天14点 附加说明： 本行程与 游玩目的地： 大理 昆明 行程天数： 8天 交通方式： 飞机/飞机 ¥2476 起 查看详情 <海南三亚双飞6日游>错峰甄选0购物，全程连住一线海边酒店，可升海立方/国光/温德姆，呀诺达雨林寻宝&南山观音祈福，奔驰接机/品当地美食 •用餐安排：全程安排指定餐厅用餐，30元/人/餐的标准，围桌餐保证十菜一汤或自助餐•住宿安排：入住三亚阳光大酒店、三亚康年酒店、三亚国光豪生度假酒店，多种酒店及房型供您选择。•游玩安排：景点只去最精的 游玩目的地： 海南 三亚 行程天数： 6天 交通方式： 飞机/飞机 ¥2076 起 查看详情 <桂林-漓江-阳朔动车3日游>戏耍漓江竹筏 VIP银子岩 爬古东瀑布 花海訾洲 摄影基地相公山 品阳朔啤酒鱼  24h接送 深圳往返 来桂林怎么玩的更高级？专业踩线设计！让您体验真正的船游桂林，放心出游，满分好评，品质保证； 一、我们用心设计：漓江AAAAA景区各段：草坪竹筏—兴坪游船—遇龙河竹筏，精准游览，人生必游20元 游玩目的地： 桂林 阳朔 行程天数： 3天 交通方式： 动车组/动车组 ¥1359 起 查看详情 <昆明+普者黑+弥勒双飞6日游>摄影之旅，高原水乡，三生若梦十里桃花，温泉spa，葡萄美酒，弥勒大佛，2人起订，独立小团 •用餐安排：云南美食，拥有一种藏在山水间的原味，就地取材，却不同食法。料广，色美，型巧，味全，看者胃开，闻者流涎，食者回味……高原红专属菜品，让你的味蕾，从这里开始体验一场真实的美味之旅。•住宿安排： 游玩目的地： 昆明 云南 行程天数： 6天 交通方式： 飞机/飞机 ¥4096 起 查看详情 <昆明-大理-丽江双飞6日游>高端酒店/抖音网红酒店，零自费/美食温泉，无人机花海航拍/千古情/洱海骑行/鲜花饼制作，爬西山跃龙门/贵族范 产品概要行程天数：6天5晚成团地点：昆明成团目的地：丽江往返交通：飞机/飞机报名截止时间：团期前2天18点组团形式：联合发团；本产品与其他旅行社联合发团。根据发团需要，本产品在部分行程段发生团友的变化 游玩目的地： 大理 昆明 丽江 云南 行程天数： 6天 交通方式： 飞机/飞机 ¥2876 起 查看详情 <云南-昆明-大理-丽江双飞6日游>纯玩无购物，玉龙雪山，露天温泉，洱海私人游船，自制鲜花饼体验，亲子蜜月畅游 行程天数：5天4晚成团地点：云南成团目的地：大理往返交通：飞机/飞机报名截止时间：团期前2天18点一米阳光  相隔丽江不远的玉龙雪山脚下，纳西族的人民到了谈婚论嫁的时候，姑娘和小 游玩目的地： 大理 昆明 丽江 云南 行程天数： 5天 交通方式： 飞机/飞机 ¥2970 起 查看详情 <云南-大理-丽江双飞5日游>纯玩0购物，揽蓝天入怀，醉饮风花雪月，享温泉时光，俯瞰洱海，三塔祈福，遇见内心深处好的自己 大理：合适的时间遇上适合的人，本就是一场不期而合的宿缘，所以也注定了此行回眸难忘的经久丽江：一片不以江而盛名的古城，一座久远传说中的艳遇之都，一个一生中不得不去的地方之一 游玩目的地： 大理 丽江 云南 行程天数： 5天 交通方式： 飞机/飞机 ¥3389 起 查看详情 <昆明-大理-丽江-泸沽湖双飞8日游>云南纯玩，昆明进出，神话石林，温泉时光，享视觉**，浅吟五朵金花，格姆女神山，探秘摩梭走婚，全景游 大丽中大理的悠远，丽江的柔软，时光打磨着记忆，若是人间有一处春色让人流连，便是有着七彩之滇的云南。云南得天独厚的自然条件，高原的地理位置，孕育了各地奇特秀丽的山水风光，是我心中的一个梦，优雅、神秘、多 游玩目的地： 大理 昆明 泸沽湖 丽江 云南 行程天数： 8天 交通方式： 飞机/飞机 ¥4130 起 查看详情 <云南-昆明-大理-丽江-玉龙雪山双飞6日游>雪山大索道登顶，含震撼印象丽江演出，洱海大游船，一晚五星一晚温泉，下单再减600，2人起订 •住宿安排：昆明温泉酒店+大理温泉+丽江客栈；默认安排标间双人床，如需大床房请提前备注，只能尽量安排不能保证。三人出游可以保证安排三人间或者加床。 游玩目的地： 大理 昆明 丽江 云南 行程天数： 6天 交通方式： 飞机/飞机 ¥2140 起 查看详情 <云南-大理-丽江双飞6日游>纯玩0购物，大理6大网红场景/含十张精修照片，天然温泉/花之城豪生大酒店/古城客栈，15道云南小吃/手抓饭 •用餐安排：傣族原味手抓饭，丽江纳西马帮菜，大理白族风味餐•住宿安排：昆明花之城毫生大酒店（美国温德姆旗下高端度假酒店），楚雄室内外温泉酒店，丽江入住四星客栈•游玩安排：精选大理6大网红场景，没组游客 游玩目的地： 大理 丽江 云南 昆明 行程天数： 6天 交通方式： 飞机/飞机 ¥3215 起 查看详情 <昆明-大理-丽江双高6日游>0购物，*系花园客栈，温泉spa，奔驰smart自驾/别克GL8环洱海旅拍，花海BBQ，丽江1天DIY 产品概要行程天数：6天5晚成团地点：昆明成团目的地：大理往返交通：高铁二等座/高铁二等座报名截止时间：团期前1天20点附加说明：根据发团需要。行程中将换当地用车或换当地导游。如遇出行当天人数不足10人 游玩目的地： 大理 昆明 丽江 行程天数： 6天 交通方式： 高铁二等座/高铁二等座 ¥3009 起 查看详情 <成都+西岭雪山+安仁古镇4日游>越野商务车出行，2至6人小团，指定入住锦泰温泉酒店，含花水湾温泉 线路【住宿问题】指定入住花水湾锦泰温泉酒店，入住酒店国旅上均有图片及评价，预定前可参考。【购物问题】全程没有任何购物店，沿途加油站，服务区的店不属于旅行购物店范畴，请不要混淆。 【服务升级】 游玩目的地： 成都 行程天数： 4天 交通方式： 飞机/飞机 ¥4362 起 查看详情 旅游选海外国旅有保障 品质保证 AAAAA级旅行社 旅游局认证 深圳旅游局认证 先行赔付 签约付款安全无忧 退款保障 3个工作日内退款保障 国内旅游旅游攻略",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "桂林",
    "duration": 5,
    "price": 2212,
    "priceUnit": "人",
    "departureDate": "2026-07-12",
    "returnDate": "2026-07-17",
    "transportType": "高铁往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "5早餐4正餐",
    "singleSupplement": 553,
    "singleSupplementNote": "单人出行需补单房差￥553，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 26,
    "totalSeats": 36,
    "highlights": [
      "桂林必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往桂林",
        "description": "今日安排桂林精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：桂林游览",
        "description": "今日安排桂林精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：桂林游览",
        "description": "今日安排桂林精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：桂林游览",
        "description": "今日安排桂林精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "告别桂林，返回温馨的家",
        "description": "今日安排桂林精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.4,
    "reviewCount": 376,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "海岛度假",
      "纯玩",
      "品质"
    ],
    "isHot": true,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "海岛度假",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.459748",
    "updatedAt": "2026-05-07T01:02:13.459748"
  },
  {
    "id": "tour_141",
    "title": "<海南三亚双飞5日游>萌娃/情侣精选0购物，3晚温德姆/红树林等+1晚海棠湾喜来登/万丽/万达文华，游呀诺达&南山&蜈支洲岛，奔驰接机/享私家沙滩 •用餐安排：全程安排指定餐厅用餐，30元/人/餐的标准，围桌餐保证十菜一汤或自助餐•住宿安排：4晚连住/海立方度假酒店/三亚丽禾温德姆度假酒店，一线海景，15分钟步行至沙滩，尽享海湾风景。•游玩安排： 游玩目的地： 海南 三亚 行程天数： 5天 交通方式： 飞机/飞机 ¥2212 起 查看详情 <华东五市-乌镇-苏州园林-西湖双飞4日游>0购物，禅意拈花湾And西栅精品双客栈，50元餐标，舒心出游 产品概要行程天数：4天3晚成团地点：南京成团目的地：南京往返交通：飞机/飞机报名截止时间：团期前2天18点交通信息★航班时间不满意可以换吗？答：网站前台日历上的价格抓取的是当天所有航班中便宜的一套，如 游玩目的地： 苏州 杭州 上海 南京 行程天数： 4天 交通方式： 飞机/飞机 ¥2223 起 查看详情 <洛阳牡丹-少林寺-龙门石窟高铁3日游>全程0购物店，走进千年古都，穿越牡丹花海 河南全景【少林寺】：千年古刹，禅宗出庭，少林武术更是天下闻名；【龙门石窟】：三大石窟之一，世界文化遗产；【龙门石窟】：龙门石窟是中国石刻艺术宝库之一，现为世界文化遗产、全国重点文物保护单位、国家AAA 游玩目的地： 少林寺 龙门石窟 洛阳 行程天数： 3天 交通方式： 高铁二等座/高铁二等座 ¥2291 起 查看详情 <青海湖+茶卡盐湖+张掖丹霞+敦煌莫高窟双飞7日游>西北30人自营0购物，茶卡超长3H，5月团期车型升级稀缺陆地头等舱，深入祁连，可升级动车 •用餐安排：全新升级30元正餐+敦煌升级40元敦煌老味道餐，让舌尖跟上步伐的速度，一起去旅行！•住宿安排：青海湖1晚住宿，星空，草原，安宁陪伴你的夜晚。全程精选住宿，高性价比，省钱更舒适！•行程安排： 游玩目的地： 嘉峪关 西宁 青海 张掖 莫高窟 行程天数： 8天 交通方式： 飞机/飞机 ¥4149 起 查看详情 <桂林-阳朔-兴坪漓江-象鼻山-遇龙河-世外桃源-银子岩高铁3日游>深圳往返0自费/遇龙手撑竹筏/精致小团//豪餐盛景 【爸妈放心游】24小时专属客服，任何问题及时处理+舒适住宿，保证良好睡眠+品牌矿泉水畅饮。【2大1小三口档】独享儿童含早，哄好下一代，轻松游玩。【三人出行档】不想住2间房,可以退还单房差，我们将尽可能 游玩目的地： 桂林 阳朔 行程天数： 3天 交通方式： 高铁二等座/高铁二等座 ¥948 起 查看详情 <张家界-天门山-黄龙洞-玻璃栈道-凤凰古城单飞6日游>张家界进长沙出,森林公园二次入园,30元/人高餐标,享牛气冲天宴,长沙住宿升级高端酒店 【高点评高满意度】超1W客户的选择，超3K的真实点评，95%的超高满意度，国旅品质，您说了算！【客户自己选的明星导游】固定导游，甄选明星导游带团，无微不至的服务，贴心温馨的安排，让您享受管家式的旅途服 游玩目的地： 张家界 长沙 黄石寨 芙蓉镇 天门山 行程天数： 6天 交通方式： 飞机/飞机 ¥2495 起 查看详情 <云南-昆明-大理-丽江双飞双动车6日游>两晚丽江金茂/1晚温泉酒店/5A石林/玉龙雪山大索/印象丽江/洱海吉普旅拍/省内动车免劳累 【精华景点】6天玩转城市名片，丽江古城/玉龙雪山冰川公园大索道，大理古城/洱海，昆明石林。【超值赠送】雪山之巅大师之作，云南不可错过的一场大型实景演出—《印象丽江》【专业导游】专业导游团队，优质服务品 游玩目的地： 大理 昆明 云南 丽江 香格里拉 行程天数： 6天 交通方式： 飞机/飞机 ¥2708 起 查看详情 <成都-九寨沟-黄龙-都江堰-熊猫乐园双飞6日游>品途线路发班/品途专属团餐/川主寺升级2晚高标住宿/九寨沟闭园则更换牟尼沟和草原 产品概要行程天数：6天5晚成团地点：成都成团目的地：成都往返交通：飞机/飞机报名截止时间：团期前0天18点附加说明：本行程与其他团队客人拼往返用车。接待标准•用餐安排：熊猫小吃（价值48元/人），牦 游玩目的地： 成都 九寨沟 兰州 乐山 峨眉山 行程天数： 6天 交通方式： 飞机/飞机 ¥2812 起 查看详情 <新疆天池-可可托海-五彩滩-禾木-喀纳斯-魔鬼城-赛湖双飞9日游>网红双湖30人小团，1晚住禾木守望星空/晨曦，赠赛湖旅拍/享299元民族丝路秀 品途自营地接❤什么是品途专线？ 品途专线是品途旅游网独家推出的产品系列，行程自主研发、安排透明，提供高品质行程和优质服务，服务贴心周到倾力推荐【喀纳斯深度游】产品北疆是新疆最美丽最富饶的地 游玩目的地： 新疆 吐鲁番 乌鲁木齐 阿勒泰 喀什地区 克拉玛依 行程天数： 9天 交通方式： 飞机/飞机 ¥5335 起 查看详情 <北京双飞6日游>誉满京城首游推荐，五星酒店连住，2大免1小，听德云社相声，深度畅游北京20大景点，品正宗宫廷风味宴，24H无忧接送 全程连住北京市高大上五星或豪华型酒店！0购物更多时间！人气TOP二十大精华景点任你游！体验：High翻古都北京，探索人类历史奇迹奇观震撼您的身心品味：享用中南海御厨自助午餐——40元/人 游玩目的地： 北京 故宫 颐和园 行程天数： 6天 交通方式： 飞机/飞机 ¥3059 起 查看详情 <北京双飞5日游>（尾货）誉满京城首游推荐，****出游佳选，五星酒店连住2大免1小，听德云社相声品正宗宫廷风味宴，24H无忧接送享别样京城 全程连住北京市高大上五星或豪华型酒店！0购物更多时间！人气TOP二十大精华景点任你游！体验：High翻古都北京，探索人类历史奇迹奇观震撼您的身心品味：享用中南海御厨自助午餐——40元/人 游玩目的地： 北京 故宫 八达岭长城 颐和园 恭王府 鸟巢 行程天数： 5天 交通方式： 飞机/飞机 ¥2749 起 查看详情 <云南昆明-大理-丽江三飞6日游>纯玩0购物/JEEP越野/花海旅拍含10张精修照片/雪山大索道/看印象丽江/5A石林/鲜花大床 ❤礼庆双节超值赠送❤☆下单立减300元（指定团期）☆VIP贵宾厅接机☆旅行三宝1份/人☆旅拍精修10张/家庭☆鲜花铺床（半年内有效结婚证）☆生日蛋糕（以身份证为准）❤旅行In个性，玩法666【in 游玩目的地： 云南 丽江 昆明 大理 行程天数： 6天 交通方式： 飞机/飞机 ¥2913 起 查看详情 <郴州3日游>深圳往返，宿市区舒适酒店，一天自由活动，动可徒步登山早赏水雾，静可竹林洗肺船游东江，适合徒步、摄影爱好者，纯玩不进店 推荐理由：如果你对人生迷茫，如果你对生活迷茫，如果你有烦恼，如果....一切一切，那么请来小东江吧，这是一个原生态的地方，可以让你抛开一切城市繁华的压力，真正活在自己的世界里。如果你爱上一个人，那 游玩目的地： 郴州 行程天数： 3天 交通方式： 汽车/汽车 ¥521 起 查看详情 <河南-郭亮-云台山-龙门石窟-少林寺-开封双飞5日游>放心爸妈游，25人内精致小团，体验挂壁公路，精选高档酒店，纯玩0购物，24H接机 详情为什么选择国旅专线？❤国旅产品：一支年轻的团队，专一研究怎样让国旅贵宾完美出游，你值得拥有。❤住宿升级：全程精选酒店，给您一个舒适的睡眠。❤吃货专享：登封美食素斋，云台山国旅餐；让你安心享用 游玩目的地： 少林寺 龙门石窟 郑州 行程天数： 5天 交通方式： 飞机/飞机 ¥2509 起 查看详情 <云南-昆明-大理-丽江3飞6日游>昆明直飞丽江，两晚丽江金茂/1晚温泉酒店，5A石林/玉龙雪山冰川大索道/印象丽江，轻松出游 【精华景点】6天玩转城市名片，丽江古城/玉龙雪山冰川公园大索道，大理古城/洱海，昆明石林。【超值赠送】雪山之巅大师之作，云南不可错过的一场大型实景演出—《印象丽江》【专业导游】专业导游团队，优质服务品 游玩目的地： 大理 昆明 云南 行程天数： 6天 交通方式： 飞机/飞机 ¥4000 起 查看详情 <河南-云台山-龙门-少林寺-开封双飞4日游>25人精致小团，全程国际品牌Holiday inn，畅享恒温泳池，纯玩0购爸妈游 国旅专线专业为你❤国旅产品：一支年轻的团队，专一研究怎样让国旅贵宾完美出游，你值得拥有。❤住宿升级：沿途城市精选酒店，避免市场同行业其他线路每晚折回郑州，遭受多余的舟车劳顿之苦，给您一个舒适的睡眠 游玩目的地： 少林寺 龙门石窟 行程天数： 4天 交通方式： 飞机/飞机 ¥2189 起 查看详情 <青海湖+茶卡盐湖+张掖+敦煌双飞8日游>纯玩0购/9人内小团，24H接送机/不用等人/自由度高/无忧西北环游** 产品概要行程天数：8天7晚成团地点：西宁成团目的地：海西往返交通：飞机/飞机报名截止时间：团期前1天21点接待标准•用餐安排：全程不含餐，您自由选择，丰俭由己•住宿安排：茶卡镇双人标间，贴近茶卡盐湖 游玩目的地： 嘉峪关 西宁 张掖 青海 行程天数： 8天 交通方式： 飞机/飞机 ¥4580 起 查看详情 <成都-新都桥-稻城亚丁-海螺沟双飞8日游>纯玩0购物 入住3晚智选假日酒店/1晚稻城金珠大酒店 33人封顶 2次特色餐圣地祈福 √用心餐食：品尝餐，感受纯正的当地美食！√高档住宿：区别于常规团经济型住宿，此线路住宿全程精选高档型酒店！√优质导游：圈定导游，专业导游陪同，只为你提供贴心的服务！√贴心服务：出游中客服24小时贴心守 游玩目的地： 成都 花溪 阿坝 九寨沟 行程天数： 8天 交通方式： 火车/火车 ¥3366 起 查看详情 <贵州黄果树瀑布-荔波-西江-花溪湿地高铁5日游>专车专导0购物 观壮美大瀑布 赏世遗风情 探苗家文化 产品概要行程天数：5天4晚成团地点：贵阳成团目的地：安顺往返交通：高铁二等座/高铁二等座报名截止时间：团期前3天18点附加说明：可根据需要选择某段行程或升级行程，在该行程段分开安排或统一协调行程。接待 游玩目的地： 贵阳 黄果树 行程天数： 5天 交通方式： 高铁二等座/高铁二等座 ¥2219 起 查看详情 <黄山+宏村+屯溪老街+上海双飞5日游>云海奇松/徽派建筑，1晚山顶双标/观日出，1晚五星，含105元正餐，纯玩0购物 品黄山+赏宏村+行老街★纯玩经典：魅力魔都、黄山观日出、宏村徽州古名居。★美食之旅：品味小山城的慢生活，探秘舌尖上的徽州。★摄影之旅：合理的行程规划，让您有足够时间停下脚步，拍上几张。★黄山 游玩目的地： 上海 黄山 宏村 徽州古城 行程天数： 5天 交通方式： 飞机/飞机 ¥3168 起 查看详情 <北京-八达岭-故宫-颐和园-天坛双飞5日游>住连锁酒店 全年365天接送机场 参观华夏魔术城 增加圆明园 漫步老北京胡同 品尝烤鸭餐 ★专注行程每个细节※注重贵宾真实体验★◆【轻松舒适】：每天8小时充足睡眠时间，放慢脚步，感受北京慢生活，让您不再“走马观花“！◆【闲情逸致】：游览时间科学合理，纯净无死角畅游帝都北京经典景点！ 游玩目的地： 北京 行程天数： 5天 交通方式： 飞机/飞机 ¥2557 起 查看详情 <韶山-张家界-百龙电梯-天门山-玻璃栈道-凤凰古城高铁6日游>0购物,宿4晚高端/5星/黄龙洞,宿凤凰/含9景/135元特色餐,周4升航空座椅车型 国旅专线=品质服务+超高满意度1、牛服务：专业自营随往地接社，从计调到导游，均有丰富的从业经验，严格筛选服务之星导游队伍，24小时管家服务，为您的出行保驾护航。2、牛品质：含五大火爆景点（韶山+张家界 游玩目的地： 张家界 长沙 行程天数： 6天 交通方式： 高铁二等座/高铁二等座 ¥3757 起 查看详情 <海南三亚双飞4日游>17万人出游0购物，180度海景/海立方(供免费挖沙工具)/温德姆(赠欢迎水果)/国光豪生(隔条马路即沙滩)，度假雨林天堂，接机0等待 •用餐安排：全程安排指定餐厅用餐，30元/人/餐的标准，围桌餐保证十菜一汤或自助餐；其中两顿晚餐升级为40元/人社会小炒围桌餐；海南口味偏淡，还请您多多包含；重口味的亲们可以带些老干妈等调调口味•游玩 游玩目的地： 海南 三亚 行程天数： 4天 交通方式： 飞机/飞机 ¥1848 起 查看详情 <海南三亚双飞5日游>17万人出游0购物，180度海景/海立方(供免费挖沙工具)/温德姆(赠欢迎水果)/国光豪生(隔条马路即沙滩)，度假雨林天堂，接机0等待 •用餐安排：全程安排指定餐厅用餐，30元/人/餐的标准，围桌餐保证十菜一汤或自助餐；其中两顿晚餐升级为40元/人社会小炒围桌餐；海南口味偏淡，还请您多多包含；重口味的亲们可以带些老干妈等调调口味•住宿 游玩目的地： 海南 三亚 行程天数： 5天 交通方式： 飞机/飞机 ¥2158 起 查看详情 <海南三亚双飞4日游>20人精品小团0购物，国际五星温德姆/洲际皇冠假日/国光豪生连住，丰富自助早餐+多房型可选+玩乐设施，蜈支洲畅玩一天，接机0等待 •用餐安排：全程安排指定餐厅用餐，30元/人/餐的标准，围桌餐保证十菜一汤或自助餐•游玩安排：景点只去精华的，只安排三亚知名度和值得玩的5大黄金景点（亚龙湾沙滩、亚龙湾热带天堂森林公园、蜈支洲岛纯玩 游玩目的地： 海南 三亚 行程天数： 4天 交通方式： 飞机/飞机 ¥1948 起 查看详情 <海南三亚双飞7日游>20人精品小团0购物，国际五星温德姆/洲际皇冠假日/国光豪生连住，丰富自助早餐+多房型可选+玩乐设施，蜈支洲畅玩一天，接机0等待 •用餐安排：全程安排指定餐厅用餐，30元/人/餐的标准，围桌餐保证十菜一汤或自助餐•游玩安排：景点只去最精的，只安排三亚最具知名度和值得玩的5大黄金景点（亚龙湾沙滩、亚龙湾热带天堂森林公园、蜈支洲岛 游玩目的地： 海南 三亚 行程天数： 7天 交通方式： 飞机/飞机 ¥2768 起 查看详情 <海南三亚双飞5日游>错峰甄选0购物，全程连住一线海边酒店，可升海立方/国光/温德姆，呀诺达雨林寻宝&南山观音祈福，奔驰接机/品当地美食 •用餐安排：全程安排指定餐厅用餐，30元/人/餐的标准，围桌餐保证十菜一汤或自助餐•住宿安排：入住三亚阳光大酒店、三亚康年酒店、三亚国光豪生度假酒店，多种酒店及房型供您选择。•游玩安排：景点只去最精的 游玩目的地： 海南 三亚 行程天数： 5天 交通方式： 飞机/飞机 ¥1881 起 查看详情 <海南三亚双飞5日游>20人精品小团0购物，国际五星温德姆/洲际皇冠假日/国光豪生连住，丰富自助早餐+多房型可选+玩乐设施，蜈支洲畅玩一天，接机0等待 奔跑吧国旅国旅人自己的品牌【品牌住宿】：国际五星温德姆（丽禾温德姆、国光豪生）/万豪（山海天万豪）/喜来登（福朋喜来登）等品牌住宿，全年包房价格，优惠多多【专注产品】：产品经理反复踩线，畅销多年，每 游玩目的地： 海南 三亚 行程天数： 5天 交通方式： 飞机/飞机 ¥2308 起 查看详情 <海南三亚双飞6日游>20人精品小团0购物，国际五星温德姆/洲际皇冠假日/国光豪生连住，丰富自助早餐+多房型可选+玩乐设施，蜈支洲畅玩一天，接机0等待 奔跑吧国旅国旅人自己的品牌【品牌住宿】：国际五星温德姆（丽禾温德姆、国光豪生）/万豪（山海天万豪）/喜来登（福朋喜来登）品牌住宿，全年包房价格，优惠多多【专注产品】：产品经理反复踩线，畅销多年，每年 游玩目的地： 海南 三亚 行程天数： 6天 交通方式： 飞机/飞机 ¥2616 起 查看详情 <海南三亚双飞6日游>人气&亲子&蜜月，0购物，维景/天通/红树林/康年酒店自选连住，接机0等待，畅享蜈支洲一整天，万人出游甄选 •用餐安排：全程安排指定餐厅用餐，30元/人/餐的标准，围桌餐保证十菜一汤或自助餐；其中两顿晚餐升级为40元/人社会小炒围桌餐；海南口味偏淡，还请您多多包含；重口味的亲们可以带些老干妈等调调口味•住宿 游玩目的地： 三亚 海南 行程天数： 5天 交通方式： 飞机/飞机 ¥2310 起 查看详情 <海南三亚双飞5日游>乐开花爸妈游，纯玩0购物，国际五星国光豪生/康年/天通酒店自选，步行1分钟直达沙滩，蜈支洲一整天，24H接送机 臻品&自营定制乐开花爸妈游，只用星级导游，96%高满意度，我们一直在努力【精致度假】：没有舟车劳顿的辛苦，没有走马观花的紧凑，只在三亚，给你想要的自然风光。【个性住宿】：精挑细选海南不同湾区倍 游玩目的地： 三亚 海南 行程天数： 5天 交通方式： 飞机/飞机 ¥2285 起 查看详情 <海南三亚双飞4日游>错峰甄选0购物，全程连住一线海边酒店，可升海立方/国光/温德姆，呀诺达雨林寻宝&南山观音祈福，奔驰接机/品当地美食 •用餐安排：全程安排指定餐厅用餐，30元/人/餐的标准，围桌餐保证十菜一汤或自助餐•住宿安排：入住三亚阳光大酒店、三亚康年酒店、三亚国光豪生度假酒店，多酒店及多房型供您选择•游玩安排：景点只去最精的， 游玩目的地： 海南 三亚 行程天数： 4天 交通方式： 飞机/飞机 ¥1564 起 查看详情 <海南三亚双飞5日游>人气&亲子&蜜月，0购物，维景/天通/红树林/康年酒店自选连住，接机0等待，畅享蜈支洲一整天，万人出游甄选 行程天数：5天4晚 成团地点：三亚成团 目的地：三亚 往返交通：飞机/飞机 报名截止时间：团期前1天15点  全年畅销NO.1 游玩目的地： 三亚 海南 行程天数： 5天 交通方式： 飞机/飞机 ¥1950 起 查看详情 <北京双卧6日游>自营倾情打造/纯玩精品，热销4年超4万人选择，故宫全新深度游3H（含珍宝馆），获奖导游精讲慢游，网红餐厅特色体验，观升旗仪式 餐全新升级，唤醒舌头的味蕾，享受旅行的美好❤住的“安心”——商业圈五星配置大酒店，居住其中成为美的享受，尽享帝都别漾风情❤定的“放心”——全年销量TOP线路，40000+客人的选择，真实回访点评， 游玩目的地： 北京 行程天数： 6天 交通方式： 火车硬卧/火车硬卧 ¥2805 起 查看详情 <桂林-漓江-遇龙河-银子岩-世外桃源双动4日游>人气热销,一价全含,高档住宿/阳朔两晚连住,星级游船,网红新贵千古情/遇龙河漂流,广州往返 产品概要行程天数：4天3晚成团地点：桂林成团目的地：桂林往返交通：动车组/动车组报名截止时间：团期前1天16点组团形式：联合发团；本产品与其他旅行社联合发团。附加说明：本行程与其他团队客人拼往返用车。 游玩目的地： 桂林 阳朔 行程天数： 4天 交通方式： 动车组/动车组 ¥1889 起 查看详情 <海南三亚双飞6日游>纯玩0购物，2晚三亚湾住宿，3晚海棠湾酒店，可选呀诺达网红秋千/玻璃栈道，高性价比 【有爱的产品更走心】Designanalysis1：悠哉行程——RomanticIsland—分界洲岛，全方位体验民俗—椰田古寨；呀诺达雨林，天涯海角~；Designanalysis2：酒店升级 游玩目的地： 三亚 海南 行程天数： 6天 交通方式： 飞机/飞机 ¥2445 起 查看详情 <北京双飞5日游>自营倾情打造/纯玩精品，热销4年超4万人选择，故宫全新深度游3H（含珍宝馆），获奖导游精讲慢游，网红餐厅特色体验，观升旗仪式 •用餐安排：4酒店自助早餐，4风味地道正餐全新升级：川府热盆景或老北京胡同饭（40元/人）、农家春饼宴或艺麓苑自助（50元/人）、饺子宴（30元/人，8月20号团期开始升级为40元/人）、全聚德烤鸭或 游玩目的地： 北京 行程天数： 5天 交通方式： 飞机/飞机 ¥3079 起 查看详情 <北京双高或双动6日游>自营倾情打造/纯玩精品，热销4年超4万人选择，故宫全新深度游3H（含珍宝馆），获奖导游精讲慢游，网红餐厅特色体验，观升旗仪式 倾情推出“六心”服务❤行的“舒心”——区别于散拼每天换车换导，全程只安排一个导游，一辆旅游车，一车到底绝不套车，旅游更省心❤玩的“开心”——精选资深 游玩目的地： 北京 行程天数： 6天 交通方式： 高铁二等座/高铁二等座 ¥4017 起 查看详情 <云南-昆明-大理-丽江-香格里拉双飞8日游>自营超4万人出游/5A石林/玉龙雪山大索/印象丽江/双廊旅拍/大理海景房/安宁温泉/洱海骑行 行程天数：8天7晚 成团地点：昆明成团 目的地：昆明 往返交通：飞机/飞机 报名截止时间：团期前1天14点 附加说明： 本行程与 游玩目的地： 大理 昆明 行程天数： 8天 交通方式： 飞机/飞机 ¥2476 起 查看详情 <海南三亚双飞6日游>错峰甄选0购物，全程连住一线海边酒店，可升海立方/国光/温德姆，呀诺达雨林寻宝&南山观音祈福，奔驰接机/品当地美食 •用餐安排：全程安排指定餐厅用餐，30元/人/餐的标准，围桌餐保证十菜一汤或自助餐•住宿安排：入住三亚阳光大酒店、三亚康年酒店、三亚国光豪生度假酒店，多种酒店及房型供您选择。•游玩安排：景点只去最精的 游玩目的地： 海南 三亚 行程天数： 6天 交通方式： 飞机/飞机 ¥2076 起 查看详情 <桂林-漓江-阳朔动车3日游>戏耍漓江竹筏 VIP银子岩 爬古东瀑布 花海訾洲 摄影基地相公山 品阳朔啤酒鱼  24h接送 深圳往返 来桂林怎么玩的更高级？专业踩线设计！让您体验真正的船游桂林，放心出游，满分好评，品质保证； 一、我们用心设计：漓江AAAAA景区各段：草坪竹筏—兴坪游船—遇龙河竹筏，精准游览，人生必游20元 游玩目的地： 桂林 阳朔 行程天数： 3天 交通方式： 动车组/动车组 ¥1359 起 查看详情 <昆明+普者黑+弥勒双飞6日游>摄影之旅，高原水乡，三生若梦十里桃花，温泉spa，葡萄美酒，弥勒大佛，2人起订，独立小团 •用餐安排：云南美食，拥有一种藏在山水间的原味，就地取材，却不同食法。料广，色美，型巧，味全，看者胃开，闻者流涎，食者回味……高原红专属菜品，让你的味蕾，从这里开始体验一场真实的美味之旅。•住宿安排： 游玩目的地： 昆明 云南 行程天数： 6天 交通方式： 飞机/飞机 ¥4096 起 查看详情 <昆明-大理-丽江双飞6日游>高端酒店/抖音网红酒店，零自费/美食温泉，无人机花海航拍/千古情/洱海骑行/鲜花饼制作，爬西山跃龙门/贵族范 产品概要行程天数：6天5晚成团地点：昆明成团目的地：丽江往返交通：飞机/飞机报名截止时间：团期前2天18点组团形式：联合发团；本产品与其他旅行社联合发团。根据发团需要，本产品在部分行程段发生团友的变化 游玩目的地： 大理 昆明 丽江 云南 行程天数： 6天 交通方式： 飞机/飞机 ¥2876 起 查看详情 <云南-昆明-大理-丽江双飞6日游>纯玩无购物，玉龙雪山，露天温泉，洱海私人游船，自制鲜花饼体验，亲子蜜月畅游 行程天数：5天4晚成团地点：云南成团目的地：大理往返交通：飞机/飞机报名截止时间：团期前2天18点一米阳光  相隔丽江不远的玉龙雪山脚下，纳西族的人民到了谈婚论嫁的时候，姑娘和小 游玩目的地： 大理 昆明 丽江 云南 行程天数： 5天 交通方式： 飞机/飞机 ¥2970 起 查看详情 <云南-大理-丽江双飞5日游>纯玩0购物，揽蓝天入怀，醉饮风花雪月，享温泉时光，俯瞰洱海，三塔祈福，遇见内心深处好的自己 大理：合适的时间遇上适合的人，本就是一场不期而合的宿缘，所以也注定了此行回眸难忘的经久丽江：一片不以江而盛名的古城，一座久远传说中的艳遇之都，一个一生中不得不去的地方之一 游玩目的地： 大理 丽江 云南 行程天数： 5天 交通方式： 飞机/飞机 ¥3389 起 查看详情 <昆明-大理-丽江-泸沽湖双飞8日游>云南纯玩，昆明进出，神话石林，温泉时光，享视觉**，浅吟五朵金花，格姆女神山，探秘摩梭走婚，全景游 大丽中大理的悠远，丽江的柔软，时光打磨着记忆，若是人间有一处春色让人流连，便是有着七彩之滇的云南。云南得天独厚的自然条件，高原的地理位置，孕育了各地奇特秀丽的山水风光，是我心中的一个梦，优雅、神秘、多 游玩目的地： 大理 昆明 泸沽湖 丽江 云南 行程天数： 8天 交通方式： 飞机/飞机 ¥4130 起 查看详情 <云南-昆明-大理-丽江-玉龙雪山双飞6日游>雪山大索道登顶，含震撼印象丽江演出，洱海大游船，一晚五星一晚温泉，下单再减600，2人起订 •住宿安排：昆明温泉酒店+大理温泉+丽江客栈；默认安排标间双人床，如需大床房请提前备注，只能尽量安排不能保证。三人出游可以保证安排三人间或者加床。 游玩目的地： 大理 昆明 丽江 云南 行程天数： 6天 交通方式： 飞机/飞机 ¥2140 起 查看详情 <云南-大理-丽江双飞6日游>纯玩0购物，大理6大网红场景/含十张精修照片，天然温泉/花之城豪生大酒店/古城客栈，15道云南小吃/手抓饭 •用餐安排：傣族原味手抓饭，丽江纳西马帮菜，大理白族风味餐•住宿安排：昆明花之城毫生大酒店（美国温德姆旗下高端度假酒店），楚雄室内外温泉酒店，丽江入住四星客栈•游玩安排：精选大理6大网红场景，没组游客 游玩目的地： 大理 丽江 云南 昆明 行程天数： 6天 交通方式： 飞机/飞机 ¥3215 起 查看详情 <昆明-大理-丽江双高6日游>0购物，*系花园客栈，温泉spa，奔驰smart自驾/别克GL8环洱海旅拍，花海BBQ，丽江1天DIY 产品概要行程天数：6天5晚成团地点：昆明成团目的地：大理往返交通：高铁二等座/高铁二等座报名截止时间：团期前1天20点附加说明：根据发团需要。行程中将换当地用车或换当地导游。如遇出行当天人数不足10人 游玩目的地： 大理 昆明 丽江 行程天数： 6天 交通方式： 高铁二等座/高铁二等座 ¥3009 起 查看详情 <成都+西岭雪山+安仁古镇4日游>越野商务车出行，2至6人小团，指定入住锦泰温泉酒店，含花水湾温泉 线路【住宿问题】指定入住花水湾锦泰温泉酒店，入住酒店国旅上均有图片及评价，预定前可参考。【购物问题】全程没有任何购物店，沿途加油站，服务区的店不属于旅行购物店范畴，请不要混淆。 【服务升级】 游玩目的地： 成都 行程天数： 4天 交通方式： 飞机/飞机 ¥4362 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "桂林",
    "duration": 5,
    "price": 2212,
    "priceUnit": "人",
    "departureDate": "2026-05-15",
    "returnDate": "2026-05-20",
    "transportType": "高铁往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "5早餐4正餐",
    "singleSupplement": 553,
    "singleSupplementNote": "单人出行需补单房差￥553，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 22,
    "totalSeats": 47,
    "highlights": [
      "桂林必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往桂林",
        "description": "今日安排桂林精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：桂林游览",
        "description": "今日安排桂林精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：桂林游览",
        "description": "今日安排桂林精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：桂林游览",
        "description": "今日安排桂林精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "告别桂林，返回温馨的家",
        "description": "今日安排桂林精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 3.7,
    "reviewCount": 445,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "海岛度假",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "海岛度假",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.460749",
    "updatedAt": "2026-05-07T01:02:13.460749"
  },
  {
    "id": "tour_142",
    "title": "<海南三亚双飞5日游>萌娃/情侣精选0购物，3晚温德姆/红树林等+1晚海棠湾喜来登/万丽/万达文华，游呀诺达&南山&蜈支洲岛，奔驰接机/享私家沙滩 •用餐安排：全程安排指定餐厅用餐，30元/人/餐的标准，围桌餐保证十菜一汤或自助餐•住宿安排：4晚连住/海立方度假酒店/三亚丽禾温德姆度假酒店，一线海景，15分钟步行至沙滩，尽享海湾风景。•游玩安排： 游玩目的地： 海南 三亚 行程天数： 5天 交通方式： 飞机/飞机 ¥2212 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "三亚",
    "duration": 5,
    "price": 2212,
    "priceUnit": "人",
    "departureDate": "2026-06-28",
    "returnDate": "2026-07-03",
    "transportType": "高铁往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "5早餐4正餐",
    "singleSupplement": 553,
    "singleSupplementNote": "单人出行需补单房差￥553，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 19,
    "totalSeats": 49,
    "highlights": [
      "三亚必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往三亚",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：三亚游览",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：三亚游览",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：三亚游览",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "告别三亚，返回温馨的家",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.6,
    "reviewCount": 621,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "海岛度假",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "海岛度假",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.460749",
    "updatedAt": "2026-05-07T01:02:13.460749"
  },
  {
    "id": "tour_143",
    "title": "<海南三亚双飞5日游>萌娃/情侣精选0购物，3晚温德姆/红树林等+1晚海棠湾喜来登/万丽/万达文华，游呀诺达&南山&蜈支洲岛，奔驰接机/享私家沙滩 •用餐安排：全程安排指定餐厅用餐，30元/人/餐的标准，围桌餐保证十菜一汤或自助餐•住宿安排：4晚连住/海立方度假酒店/三亚丽禾温德姆度假酒店，一线海景，15分钟步行至沙滩，尽享海湾风景。•游玩安排： 游玩目的地： 海南 三亚 行程天数： 5天 交通方式： 飞机/飞机",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "三亚",
    "duration": 5,
    "price": 30,
    "priceUnit": "人",
    "departureDate": "2026-08-03",
    "returnDate": "2026-08-08",
    "transportType": "高铁往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "5早餐4正餐",
    "singleSupplement": 7,
    "singleSupplementNote": "单人出行需补单房差￥7，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 26,
    "totalSeats": 36,
    "highlights": [
      "三亚必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往三亚",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：三亚游览",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：三亚游览",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：三亚游览",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "告别三亚，返回温馨的家",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.8,
    "reviewCount": 720,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "海岛度假",
      "纯玩",
      "品质"
    ],
    "isHot": true,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "海岛度假",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.460749",
    "updatedAt": "2026-05-07T01:02:13.460749"
  },
  {
    "id": "tour_144",
    "title": "<华东五市-乌镇-苏州园林-西湖双飞4日游>0购物，禅意拈花湾And西栅精品双客栈，50元餐标，舒心出游 产品概要行程天数：4天3晚成团地点：南京成团目的地：南京往返交通：飞机/飞机报名截止时间：团期前2天18点交通信息★航班时间不满意可以换吗？答：网站前台日历上的价格抓取的是当天所有航班中便宜的一套，如 游玩目的地： 苏州 杭州 上海 南京 行程天数： 4天 交通方式： 飞机/飞机 ¥2223 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "其他",
    "duration": 4,
    "price": 2223,
    "priceUnit": "人",
    "departureDate": "2026-07-26",
    "returnDate": "2026-07-30",
    "transportType": "高铁往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "4早餐3正餐",
    "singleSupplement": 555,
    "singleSupplementNote": "单人出行需补单房差￥555，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 28,
    "totalSeats": 33,
    "highlights": [
      "其他必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往其他",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "告别其他，返回温馨的家",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.9,
    "reviewCount": 565,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "自然风光",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "自然风光",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.460749",
    "updatedAt": "2026-05-07T01:02:13.460749"
  },
  {
    "id": "tour_145",
    "title": "<华东五市-乌镇-苏州园林-西湖双飞4日游>0购物，禅意拈花湾And西栅精品双客栈，50元餐标，舒心出游 产品概要行程天数：4天3晚成团地点：南京成团目的地：南京往返交通：飞机/飞机报名截止时间：团期前2天18点交通信息★航班时间不满意可以换吗？答：网站前台日历上的价格抓取的是当天所有航班中便宜的一套，如 游玩目的地： 苏州 杭州 上海 南京 行程天数： 4天 交通方式： 飞机/飞机",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "其他",
    "duration": 4,
    "price": 50,
    "priceUnit": "人",
    "departureDate": "2026-07-16",
    "returnDate": "2026-07-20",
    "transportType": "高铁往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "4早餐3正餐",
    "singleSupplement": 12,
    "singleSupplementNote": "单人出行需补单房差￥12，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 22,
    "totalSeats": 42,
    "highlights": [
      "其他必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往其他",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "告别其他，返回温馨的家",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.1,
    "reviewCount": 85,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "自然风光",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "自然风光",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.460749",
    "updatedAt": "2026-05-07T01:02:13.460749"
  },
  {
    "id": "tour_146",
    "title": "<洛阳牡丹-少林寺-龙门石窟高铁3日游>全程0购物店，走进千年古都，穿越牡丹花海 河南全景【少林寺】：千年古刹，禅宗出庭，少林武术更是天下闻名；【龙门石窟】：三大石窟之一，世界文化遗产；【龙门石窟】：龙门石窟是中国石刻艺术宝库之一，现为世界文化遗产、全国重点文物保护单位、国家AAA 游玩目的地： 少林寺 龙门石窟 洛阳 行程天数： 3天 交通方式： 高铁二等座/高铁二等座 ¥2291 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "其他",
    "duration": 3,
    "price": 2291,
    "originalPrice": 2517,
    "priceUnit": "人",
    "departureDate": "2026-06-23",
    "returnDate": "2026-06-26",
    "transportType": "大巴往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "3早餐2正餐",
    "singleSupplement": 572,
    "singleSupplementNote": "单人出行需补单房差￥572，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 25,
    "totalSeats": 45,
    "highlights": [
      "其他必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往其他",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "告别其他，返回温馨的家",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.3,
    "reviewCount": 244,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "户外徒步",
      "纯玩",
      "品质"
    ],
    "isHot": true,
    "isNew": true,
    "isFlashSale": false,
    "discountRate": 9,
    "groupSize": "30人常规团",
    "theme": "户外徒步",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.460749",
    "updatedAt": "2026-05-07T01:02:13.460749"
  },
  {
    "id": "tour_147",
    "title": "<青海湖+茶卡盐湖+张掖丹霞+敦煌莫高窟双飞7日游>西北30人自营0购物，茶卡超长3H，5月团期车型升级稀缺陆地头等舱，深入祁连，可升级动车 •用餐安排：全新升级30元正餐+敦煌升级40元敦煌老味道餐，让舌尖跟上步伐的速度，一起去旅行！•住宿安排：青海湖1晚住宿，星空，草原，安宁陪伴你的夜晚。全程精选住宿，高性价比，省钱更舒适！•行程安排： 游玩目的地： 嘉峪关 西宁 青海 张掖 莫高窟 行程天数： 8天 交通方式： 飞机/飞机 ¥4149 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "其他",
    "duration": 8,
    "price": 4149,
    "originalPrice": 5388,
    "priceUnit": "人",
    "departureDate": "2026-07-23",
    "returnDate": "2026-07-31",
    "transportType": "飞机往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "8早餐7正餐",
    "singleSupplement": 1037,
    "singleSupplementNote": "单人出行需补单房差￥1037，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 22,
    "totalSeats": 47,
    "highlights": [
      "其他必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往其他",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "第5天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 6,
        "title": "第6天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 7,
        "title": "第7天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 8,
        "title": "告别其他，返回温馨的家",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.9,
    "reviewCount": 99,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "自然风光",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "discountRate": 23,
    "groupSize": "30人常规团",
    "theme": "自然风光",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.460749",
    "updatedAt": "2026-05-07T01:02:13.460749"
  },
  {
    "id": "tour_148",
    "title": "<青海湖+茶卡盐湖+张掖丹霞+敦煌莫高窟双飞7日游>西北30人自营0购物，茶卡超长3H，5月团期车型升级稀缺陆地头等舱，深入祁连，可升级动车 •用餐安排：全新升级30元正餐+敦煌升级40元敦煌老味道餐，让舌尖跟上步伐的速度，一起去旅行！•住宿安排：青海湖1晚住宿，星空，草原，安宁陪伴你的夜晚。全程精选住宿，高性价比，省钱更舒适！•行程安排： 游玩目的地： 嘉峪关 西宁 青海 张掖 莫高窟 行程天数： 8天 交通方式： 飞机/飞机",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "其他",
    "duration": 8,
    "price": 30,
    "priceUnit": "人",
    "departureDate": "2026-07-18",
    "returnDate": "2026-07-26",
    "transportType": "飞机往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "8早餐7正餐",
    "singleSupplement": 7,
    "singleSupplementNote": "单人出行需补单房差￥7，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 16,
    "totalSeats": 46,
    "highlights": [
      "其他必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往其他",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "第5天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 6,
        "title": "第6天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 7,
        "title": "第7天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 8,
        "title": "告别其他，返回温馨的家",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.6,
    "reviewCount": 580,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "自然风光",
      "纯玩",
      "品质"
    ],
    "isHot": true,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "自然风光",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.460749",
    "updatedAt": "2026-05-07T01:02:13.460749"
  },
  {
    "id": "tour_149",
    "title": "<桂林-阳朔-兴坪漓江-象鼻山-遇龙河-世外桃源-银子岩高铁3日游>深圳往返0自费/遇龙手撑竹筏/精致小团//豪餐盛景 【爸妈放心游】24小时专属客服，任何问题及时处理+舒适住宿，保证良好睡眠+品牌矿泉水畅饮。【2大1小三口档】独享儿童含早，哄好下一代，轻松游玩。【三人出行档】不想住2间房,可以退还单房差，我们将尽可能 游玩目的地： 桂林 阳朔 行程天数： 3天 交通方式： 高铁二等座/高铁二等座 ¥948 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "桂林",
    "duration": 3,
    "price": 948,
    "priceUnit": "人",
    "departureDate": "2026-05-30",
    "returnDate": "2026-06-02",
    "transportType": "大巴往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "3早餐2正餐",
    "singleSupplement": 237,
    "singleSupplementNote": "单人出行需补单房差￥237，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 7,
    "totalSeats": 37,
    "highlights": [
      "桂林必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往桂林",
        "description": "今日安排桂林精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：桂林游览",
        "description": "今日安排桂林精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "告别桂林，返回温馨的家",
        "description": "今日安排桂林精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.7,
    "reviewCount": 325,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "亲子游",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "亲子游",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.460749",
    "updatedAt": "2026-05-07T01:02:13.460749"
  },
  {
    "id": "tour_150",
    "title": "<张家界-天门山-黄龙洞-玻璃栈道-凤凰古城单飞6日游>张家界进长沙出,森林公园二次入园,30元/人高餐标,享牛气冲天宴,长沙住宿升级高端酒店 【高点评高满意度】超1W客户的选择，超3K的真实点评，95%的超高满意度，国旅品质，您说了算！【客户自己选的明星导游】固定导游，甄选明星导游带团，无微不至的服务，贴心温馨的安排，让您享受管家式的旅途服 游玩目的地： 张家界 长沙 黄石寨 芙蓉镇 天门山 行程天数： 6天 交通方式： 飞机/飞机 ¥2495 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "张家界",
    "duration": 6,
    "price": 2495,
    "originalPrice": 3158,
    "priceUnit": "人",
    "departureDate": "2026-08-02",
    "returnDate": "2026-08-08",
    "transportType": "飞机往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "6早餐5正餐",
    "singleSupplement": 623,
    "singleSupplementNote": "单人出行需补单房差￥623，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 16,
    "totalSeats": 46,
    "highlights": [
      "张家界必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往张家界",
        "description": "今日安排张家界精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：张家界游览",
        "description": "今日安排张家界精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：张家界游览",
        "description": "今日安排张家界精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：张家界游览",
        "description": "今日安排张家界精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "第5天：张家界游览",
        "description": "今日安排张家界精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 6,
        "title": "告别张家界，返回温馨的家",
        "description": "今日安排张家界精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.3,
    "reviewCount": 760,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "古镇文化",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "discountRate": 21,
    "groupSize": "30人常规团",
    "theme": "古镇文化",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.460749",
    "updatedAt": "2026-05-07T01:02:13.460749"
  },
  {
    "id": "tour_151",
    "title": "<张家界-天门山-黄龙洞-玻璃栈道-凤凰古城单飞6日游>张家界进长沙出,森林公园二次入园,30元/人高餐标,享牛气冲天宴,长沙住宿升级高端酒店 【高点评高满意度】超1W客户的选择，超3K的真实点评，95%的超高满意度，国旅品质，您说了算！【客户自己选的明星导游】固定导游，甄选明星导游带团，无微不至的服务，贴心温馨的安排，让您享受管家式的旅途服 游玩目的地： 张家界 长沙 黄石寨 芙蓉镇 天门山 行程天数： 6天 交通方式： 飞机/飞机",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "张家界",
    "duration": 6,
    "price": 30,
    "priceUnit": "人",
    "departureDate": "2026-05-20",
    "returnDate": "2026-05-26",
    "transportType": "飞机往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "6早餐5正餐",
    "singleSupplement": 7,
    "singleSupplementNote": "单人出行需补单房差￥7，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 10,
    "totalSeats": 30,
    "highlights": [
      "张家界必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往张家界",
        "description": "今日安排张家界精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：张家界游览",
        "description": "今日安排张家界精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：张家界游览",
        "description": "今日安排张家界精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：张家界游览",
        "description": "今日安排张家界精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "第5天：张家界游览",
        "description": "今日安排张家界精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 6,
        "title": "告别张家界，返回温馨的家",
        "description": "今日安排张家界精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.8,
    "reviewCount": 216,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "古镇文化",
      "纯玩",
      "品质"
    ],
    "isHot": true,
    "isNew": true,
    "isFlashSale": true,
    "groupSize": "30人常规团",
    "theme": "古镇文化",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.460749",
    "updatedAt": "2026-05-07T01:02:13.460749"
  },
  {
    "id": "tour_152",
    "title": "<云南-昆明-大理-丽江双飞双动车6日游>两晚丽江金茂/1晚温泉酒店/5A石林/玉龙雪山大索/印象丽江/洱海吉普旅拍/省内动车免劳累 【精华景点】6天玩转城市名片，丽江古城/玉龙雪山冰川公园大索道，大理古城/洱海，昆明石林。【超值赠送】雪山之巅大师之作，云南不可错过的一场大型实景演出—《印象丽江》【专业导游】专业导游团队，优质服务品 游玩目的地： 大理 昆明 云南 丽江 香格里拉 行程天数： 6天 交通方式： 飞机/飞机 ¥2708 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "云南",
    "duration": 6,
    "price": 2708,
    "priceUnit": "人",
    "departureDate": "2026-06-15",
    "returnDate": "2026-06-21",
    "transportType": "飞机往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "6早餐5正餐",
    "singleSupplement": 677,
    "singleSupplementNote": "单人出行需补单房差￥677，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 21,
    "totalSeats": 41,
    "highlights": [
      "云南必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往云南",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：云南游览",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：云南游览",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：云南游览",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "第5天：云南游览",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 6,
        "title": "告别云南，返回温馨的家",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.9,
    "reviewCount": 188,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "海岛度假",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "海岛度假",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.460749",
    "updatedAt": "2026-05-07T01:02:13.460749"
  },
  {
    "id": "tour_153",
    "title": "<成都-九寨沟-黄龙-都江堰-熊猫乐园双飞6日游>品途线路发班/品途专属团餐/川主寺升级2晚高标住宿/九寨沟闭园则更换牟尼沟和草原 产品概要行程天数：6天5晚成团地点：成都成团目的地：成都往返交通：飞机/飞机报名截止时间：团期前0天18点附加说明：本行程与其他团队客人拼往返用车。接待标准•用餐安排：熊猫小吃（价值48元/人），牦 游玩目的地： 成都 九寨沟 兰州 乐山 峨眉山 行程天数： 6天 交通方式： 飞机/飞机 ¥2812 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "四川",
    "duration": 6,
    "price": 2812,
    "originalPrice": 3515,
    "priceUnit": "人",
    "departureDate": "2026-06-08",
    "returnDate": "2026-06-14",
    "transportType": "飞机往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "6早餐5正餐",
    "singleSupplement": 703,
    "singleSupplementNote": "单人出行需补单房差￥703，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 22,
    "totalSeats": 37,
    "highlights": [
      "四川必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往四川",
        "description": "今日安排四川精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：四川游览",
        "description": "今日安排四川精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：四川游览",
        "description": "今日安排四川精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：四川游览",
        "description": "今日安排四川精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "第5天：四川游览",
        "description": "今日安排四川精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 6,
        "title": "告别四川，返回温馨的家",
        "description": "今日安排四川精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.4,
    "reviewCount": 598,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "美食之旅",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "discountRate": 20,
    "groupSize": "30人常规团",
    "theme": "美食之旅",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.460749",
    "updatedAt": "2026-05-07T01:02:13.460749"
  },
  {
    "id": "tour_154",
    "title": "<成都-九寨沟-黄龙-都江堰-熊猫乐园双飞6日游>品途线路发班/品途专属团餐/川主寺升级2晚高标住宿/九寨沟闭园则更换牟尼沟和草原 产品概要行程天数：6天5晚成团地点：成都成团目的地：成都往返交通：飞机/飞机报名截止时间：团期前0天18点附加说明：本行程与其他团队客人拼往返用车。接待标准•用餐安排：熊猫小吃（价值48元/人），牦 游玩目的地： 成都 九寨沟 兰州 乐山 峨眉山 行程天数： 6天 交通方式： 飞机/飞机",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "四川",
    "duration": 6,
    "price": 48,
    "priceUnit": "人",
    "departureDate": "2026-07-08",
    "returnDate": "2026-07-14",
    "transportType": "飞机往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "6早餐5正餐",
    "singleSupplement": 12,
    "singleSupplementNote": "单人出行需补单房差￥12，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 9,
    "totalSeats": 39,
    "highlights": [
      "四川必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往四川",
        "description": "今日安排四川精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：四川游览",
        "description": "今日安排四川精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：四川游览",
        "description": "今日安排四川精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：四川游览",
        "description": "今日安排四川精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "第5天：四川游览",
        "description": "今日安排四川精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 6,
        "title": "告别四川，返回温馨的家",
        "description": "今日安排四川精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.1,
    "reviewCount": 254,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "美食之旅",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "美食之旅",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.460749",
    "updatedAt": "2026-05-07T01:02:13.460749"
  },
  {
    "id": "tour_155",
    "title": "产品概要行程天数：6天5晚成团地点：成都成团目的地：成都往返交通：飞机/飞机报名截止时间：团期前0天18点附加说明：本行程与其他团队客人拼往返用车。接待标准•用餐安排：熊猫小吃（价值48元/人），牦",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "四川",
    "duration": 6,
    "price": 48,
    "priceUnit": "人",
    "departureDate": "2026-07-31",
    "returnDate": "2026-08-06",
    "transportType": "飞机往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "6早餐5正餐",
    "singleSupplement": 12,
    "singleSupplementNote": "单人出行需补单房差￥12，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 18,
    "totalSeats": 43,
    "highlights": [
      "四川必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往四川",
        "description": "今日安排四川精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：四川游览",
        "description": "今日安排四川精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：四川游览",
        "description": "今日安排四川精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：四川游览",
        "description": "今日安排四川精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "第5天：四川游览",
        "description": "今日安排四川精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 6,
        "title": "告别四川，返回温馨的家",
        "description": "今日安排四川精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.3,
    "reviewCount": 737,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "美食之旅",
      "纯玩",
      "品质"
    ],
    "isHot": true,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "美食之旅",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.460749",
    "updatedAt": "2026-05-07T01:02:13.460749"
  },
  {
    "id": "tour_156",
    "title": "<新疆天池-可可托海-五彩滩-禾木-喀纳斯-魔鬼城-赛湖双飞9日游>网红双湖30人小团，1晚住禾木守望星空/晨曦，赠赛湖旅拍/享299元民族丝路秀 品途自营地接❤什么是品途专线？ 品途专线是品途旅游网独家推出的产品系列，行程自主研发、安排透明，提供高品质行程和优质服务，服务贴心周到倾力推荐【喀纳斯深度游】产品北疆是新疆最美丽最富饶的地 游玩目的地： 新疆 吐鲁番 乌鲁木齐 阿勒泰 喀什地区 克拉玛依 行程天数： 9天 交通方式： 飞机/飞机 ¥5335 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "新疆",
    "duration": 9,
    "price": 5335,
    "originalPrice": 6276,
    "priceUnit": "人",
    "departureDate": "2026-07-25",
    "returnDate": "2026-08-03",
    "transportType": "飞机往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "9早餐8正餐",
    "singleSupplement": 1333,
    "singleSupplementNote": "单人出行需补单房差￥1333，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 12,
    "totalSeats": 37,
    "highlights": [
      "新疆必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往新疆",
        "description": "今日安排新疆精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：新疆游览",
        "description": "今日安排新疆精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：新疆游览",
        "description": "今日安排新疆精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：新疆游览",
        "description": "今日安排新疆精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "第5天：新疆游览",
        "description": "今日安排新疆精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 6,
        "title": "第6天：新疆游览",
        "description": "今日安排新疆精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 7,
        "title": "第7天：新疆游览",
        "description": "今日安排新疆精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 8,
        "title": "第8天：新疆游览",
        "description": "今日安排新疆精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 9,
        "title": "告别新疆，返回温馨的家",
        "description": "今日安排新疆精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.3,
    "reviewCount": 807,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "民族风情",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "discountRate": 15,
    "groupSize": "30人常规团",
    "theme": "民族风情",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.460749",
    "updatedAt": "2026-05-07T01:02:13.460749"
  },
  {
    "id": "tour_157",
    "title": "<新疆天池-可可托海-五彩滩-禾木-喀纳斯-魔鬼城-赛湖双飞9日游>网红双湖30人小团，1晚住禾木守望星空/晨曦，赠赛湖旅拍/享299元民族丝路秀 品途自营地接❤什么是品途专线？ 品途专线是品途旅游网独家推出的产品系列，行程自主研发、安排透明，提供高品质行程和优质服务，服务贴心周到倾力推荐【喀纳斯深度游】产品北疆是新疆最美丽最富饶的地 游玩目的地： 新疆 吐鲁番 乌鲁木齐 阿勒泰 喀什地区 克拉玛依 行程天数： 9天 交通方式： 飞机/飞机",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "新疆",
    "duration": 9,
    "price": 299,
    "priceUnit": "人",
    "departureDate": "2026-06-29",
    "returnDate": "2026-07-08",
    "transportType": "飞机往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "9早餐8正餐",
    "singleSupplement": 74,
    "singleSupplementNote": "单人出行需补单房差￥74，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 25,
    "totalSeats": 40,
    "highlights": [
      "新疆必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往新疆",
        "description": "今日安排新疆精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：新疆游览",
        "description": "今日安排新疆精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：新疆游览",
        "description": "今日安排新疆精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：新疆游览",
        "description": "今日安排新疆精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "第5天：新疆游览",
        "description": "今日安排新疆精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 6,
        "title": "第6天：新疆游览",
        "description": "今日安排新疆精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 7,
        "title": "第7天：新疆游览",
        "description": "今日安排新疆精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 8,
        "title": "第8天：新疆游览",
        "description": "今日安排新疆精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 9,
        "title": "告别新疆，返回温馨的家",
        "description": "今日安排新疆精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.8,
    "reviewCount": 809,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "民族风情",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": true,
    "isFlashSale": true,
    "groupSize": "30人常规团",
    "theme": "民族风情",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.460749",
    "updatedAt": "2026-05-07T01:02:13.460749"
  },
  {
    "id": "tour_158",
    "title": "<北京双飞6日游>誉满京城首游推荐，五星酒店连住，2大免1小，听德云社相声，深度畅游北京20大景点，品正宗宫廷风味宴，24H无忧接送 全程连住北京市高大上五星或豪华型酒店！0购物更多时间！人气TOP二十大精华景点任你游！体验：High翻古都北京，探索人类历史奇迹奇观震撼您的身心品味：享用中南海御厨自助午餐——40元/人 游玩目的地： 北京 故宫 颐和园 行程天数： 6天 交通方式： 飞机/飞机 ¥3059 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "北京",
    "duration": 6,
    "price": 3059,
    "priceUnit": "人",
    "departureDate": "2026-06-08",
    "returnDate": "2026-06-14",
    "transportType": "飞机往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "6早餐5正餐",
    "singleSupplement": 764,
    "singleSupplementNote": "单人出行需补单房差￥764，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 13,
    "totalSeats": 43,
    "highlights": [
      "北京必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往北京",
        "description": "今日安排北京精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：北京游览",
        "description": "今日安排北京精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：北京游览",
        "description": "今日安排北京精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：北京游览",
        "description": "今日安排北京精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "第5天：北京游览",
        "description": "今日安排北京精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 6,
        "title": "告别北京，返回温馨的家",
        "description": "今日安排北京精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 3.6,
    "reviewCount": 222,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "自然风光",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "自然风光",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.460749",
    "updatedAt": "2026-05-07T01:02:13.460749"
  },
  {
    "id": "tour_159",
    "title": "<北京双飞6日游>誉满京城首游推荐，五星酒店连住，2大免1小，听德云社相声，深度畅游北京20大景点，品正宗宫廷风味宴，24H无忧接送 全程连住北京市高大上五星或豪华型酒店！0购物更多时间！人气TOP二十大精华景点任你游！体验：High翻古都北京，探索人类历史奇迹奇观震撼您的身心品味：享用中南海御厨自助午餐——40元/人 游玩目的地： 北京 故宫 颐和园 行程天数： 6天 交通方式： 飞机/飞机",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "北京",
    "duration": 6,
    "price": 40,
    "priceUnit": "人",
    "departureDate": "2026-08-02",
    "returnDate": "2026-08-08",
    "transportType": "飞机往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "6早餐5正餐",
    "singleSupplement": 10,
    "singleSupplementNote": "单人出行需补单房差￥10，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 20,
    "totalSeats": 40,
    "highlights": [
      "北京必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往北京",
        "description": "今日安排北京精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：北京游览",
        "description": "今日安排北京精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：北京游览",
        "description": "今日安排北京精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：北京游览",
        "description": "今日安排北京精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "第5天：北京游览",
        "description": "今日安排北京精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 6,
        "title": "告别北京，返回温馨的家",
        "description": "今日安排北京精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 3.5,
    "reviewCount": 661,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "自然风光",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": true,
    "isFlashSale": true,
    "groupSize": "30人常规团",
    "theme": "自然风光",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.460749",
    "updatedAt": "2026-05-07T01:02:13.460749"
  },
  {
    "id": "tour_160",
    "title": "<北京双飞5日游>（尾货）誉满京城首游推荐，****出游佳选，五星酒店连住2大免1小，听德云社相声品正宗宫廷风味宴，24H无忧接送享别样京城 全程连住北京市高大上五星或豪华型酒店！0购物更多时间！人气TOP二十大精华景点任你游！体验：High翻古都北京，探索人类历史奇迹奇观震撼您的身心品味：享用中南海御厨自助午餐——40元/人 游玩目的地： 北京 故宫 八达岭长城 颐和园 恭王府 鸟巢 行程天数： 5天 交通方式： 飞机/飞机 ¥2749 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "北京",
    "duration": 5,
    "price": 2749,
    "priceUnit": "人",
    "departureDate": "2026-06-04",
    "returnDate": "2026-06-09",
    "transportType": "高铁往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "5早餐4正餐",
    "singleSupplement": 687,
    "singleSupplementNote": "单人出行需补单房差￥687，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 13,
    "totalSeats": 38,
    "highlights": [
      "北京必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往北京",
        "description": "今日安排北京精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：北京游览",
        "description": "今日安排北京精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：北京游览",
        "description": "今日安排北京精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：北京游览",
        "description": "今日安排北京精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "告别北京，返回温馨的家",
        "description": "今日安排北京精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.5,
    "reviewCount": 812,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "自然风光",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "自然风光",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.460749",
    "updatedAt": "2026-05-07T01:02:13.460749"
  },
  {
    "id": "tour_161",
    "title": "<北京双飞5日游>（尾货）誉满京城首游推荐，****出游佳选，五星酒店连住2大免1小，听德云社相声品正宗宫廷风味宴，24H无忧接送享别样京城 全程连住北京市高大上五星或豪华型酒店！0购物更多时间！人气TOP二十大精华景点任你游！体验：High翻古都北京，探索人类历史奇迹奇观震撼您的身心品味：享用中南海御厨自助午餐——40元/人 游玩目的地： 北京 故宫 八达岭长城 颐和园 恭王府 鸟巢 行程天数： 5天 交通方式： 飞机/飞机",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "北京",
    "duration": 5,
    "price": 40,
    "priceUnit": "人",
    "departureDate": "2026-07-03",
    "returnDate": "2026-07-08",
    "transportType": "高铁往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "5早餐4正餐",
    "singleSupplement": 10,
    "singleSupplementNote": "单人出行需补单房差￥10，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 17,
    "totalSeats": 32,
    "highlights": [
      "北京必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往北京",
        "description": "今日安排北京精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：北京游览",
        "description": "今日安排北京精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：北京游览",
        "description": "今日安排北京精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：北京游览",
        "description": "今日安排北京精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "告别北京，返回温馨的家",
        "description": "今日安排北京精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.6,
    "reviewCount": 479,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "自然风光",
      "纯玩",
      "品质"
    ],
    "isHot": true,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "自然风光",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.460749",
    "updatedAt": "2026-05-07T01:02:13.460749"
  },
  {
    "id": "tour_162",
    "title": "<云南昆明-大理-丽江三飞6日游>纯玩0购物/JEEP越野/花海旅拍含10张精修照片/雪山大索道/看印象丽江/5A石林/鲜花大床 ❤礼庆双节超值赠送❤☆下单立减300元（指定团期）☆VIP贵宾厅接机☆旅行三宝1份/人☆旅拍精修10张/家庭☆鲜花铺床（半年内有效结婚证）☆生日蛋糕（以身份证为准）❤旅行In个性，玩法666【in 游玩目的地： 云南 丽江 昆明 大理 行程天数： 6天 交通方式： 飞机/飞机 ¥2913 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "云南",
    "duration": 6,
    "price": 2913,
    "priceUnit": "人",
    "departureDate": "2026-07-03",
    "returnDate": "2026-07-09",
    "transportType": "飞机往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "6早餐5正餐",
    "singleSupplement": 728,
    "singleSupplementNote": "单人出行需补单房差￥728，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 12,
    "totalSeats": 32,
    "highlights": [
      "云南必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往云南",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：云南游览",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：云南游览",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：云南游览",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "第5天：云南游览",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 6,
        "title": "告别云南，返回温馨的家",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.6,
    "reviewCount": 616,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "亲子游",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "亲子游",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.461749",
    "updatedAt": "2026-05-07T01:02:13.461749"
  },
  {
    "id": "tour_163",
    "title": "<云南昆明-大理-丽江三飞6日游>纯玩0购物/JEEP越野/花海旅拍含10张精修照片/雪山大索道/看印象丽江/5A石林/鲜花大床 ❤礼庆双节超值赠送❤☆下单立减300元（指定团期）☆VIP贵宾厅接机☆旅行三宝1份/人☆旅拍精修10张/家庭☆鲜花铺床（半年内有效结婚证）☆生日蛋糕（以身份证为准）❤旅行In个性，玩法666【in 游玩目的地： 云南 丽江 昆明 大理 行程天数： 6天 交通方式： 飞机/飞机",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "云南",
    "duration": 6,
    "price": 300,
    "priceUnit": "人",
    "departureDate": "2026-06-15",
    "returnDate": "2026-06-21",
    "transportType": "飞机往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "6早餐5正餐",
    "singleSupplement": 75,
    "singleSupplementNote": "单人出行需补单房差￥75，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 26,
    "totalSeats": 41,
    "highlights": [
      "云南必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往云南",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：云南游览",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：云南游览",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：云南游览",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "第5天：云南游览",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 6,
        "title": "告别云南，返回温馨的家",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.8,
    "reviewCount": 340,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "亲子游",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "亲子游",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.461749",
    "updatedAt": "2026-05-07T01:02:13.461749"
  },
  {
    "id": "tour_164",
    "title": "<郴州3日游>深圳往返，宿市区舒适酒店，一天自由活动，动可徒步登山早赏水雾，静可竹林洗肺船游东江，适合徒步、摄影爱好者，纯玩不进店 推荐理由：如果你对人生迷茫，如果你对生活迷茫，如果你有烦恼，如果....一切一切，那么请来小东江吧，这是一个原生态的地方，可以让你抛开一切城市繁华的压力，真正活在自己的世界里。如果你爱上一个人，那 游玩目的地： 郴州 行程天数： 3天 交通方式： 汽车/汽车 ¥521 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "广东",
    "duration": 3,
    "price": 521,
    "priceUnit": "人",
    "departureDate": "2026-07-10",
    "returnDate": "2026-07-13",
    "transportType": "大巴往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "3早餐2正餐",
    "singleSupplement": 130,
    "singleSupplementNote": "单人出行需补单房差￥130，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 28,
    "totalSeats": 43,
    "highlights": [
      "广东必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往广东",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "告别广东，返回温馨的家",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 3.7,
    "reviewCount": 338,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "户外徒步",
      "纯玩",
      "品质"
    ],
    "isHot": true,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "户外徒步",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.461749",
    "updatedAt": "2026-05-07T01:02:13.461749"
  },
  {
    "id": "tour_165",
    "title": "<河南-郭亮-云台山-龙门石窟-少林寺-开封双飞5日游>放心爸妈游，25人内精致小团，体验挂壁公路，精选高档酒店，纯玩0购物，24H接机 详情为什么选择国旅专线？❤国旅产品：一支年轻的团队，专一研究怎样让国旅贵宾完美出游，你值得拥有。❤住宿升级：全程精选酒店，给您一个舒适的睡眠。❤吃货专享：登封美食素斋，云台山国旅餐；让你安心享用 游玩目的地： 少林寺 龙门石窟 郑州 行程天数： 5天 交通方式： 飞机/飞机 ¥2509 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "其他",
    "duration": 5,
    "price": 2509,
    "priceUnit": "人",
    "departureDate": "2026-06-12",
    "returnDate": "2026-06-17",
    "transportType": "高铁往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "5早餐4正餐",
    "singleSupplement": 627,
    "singleSupplementNote": "单人出行需补单房差￥627，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 20,
    "totalSeats": 30,
    "highlights": [
      "其他必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往其他",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "告别其他，返回温馨的家",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.1,
    "reviewCount": 307,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "美食之旅",
      "纯玩",
      "品质"
    ],
    "isHot": true,
    "isNew": true,
    "isFlashSale": true,
    "groupSize": "30人常规团",
    "theme": "美食之旅",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.461749",
    "updatedAt": "2026-05-07T01:02:13.461749"
  },
  {
    "id": "tour_166",
    "title": "<云南-昆明-大理-丽江3飞6日游>昆明直飞丽江，两晚丽江金茂/1晚温泉酒店，5A石林/玉龙雪山冰川大索道/印象丽江，轻松出游 【精华景点】6天玩转城市名片，丽江古城/玉龙雪山冰川公园大索道，大理古城/洱海，昆明石林。【超值赠送】雪山之巅大师之作，云南不可错过的一场大型实景演出—《印象丽江》【专业导游】专业导游团队，优质服务品 游玩目的地： 大理 昆明 云南 行程天数： 6天 交通方式： 飞机/飞机 ¥4000 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "云南",
    "duration": 6,
    "price": 4000,
    "originalPrice": 4938,
    "priceUnit": "人",
    "departureDate": "2026-06-09",
    "returnDate": "2026-06-15",
    "transportType": "飞机往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "6早餐5正餐",
    "singleSupplement": 1000,
    "singleSupplementNote": "单人出行需补单房差￥1000，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 14,
    "totalSeats": 39,
    "highlights": [
      "云南必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往云南",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：云南游览",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：云南游览",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：云南游览",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "第5天：云南游览",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 6,
        "title": "告别云南，返回温馨的家",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.0,
    "reviewCount": 311,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "海岛度假",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "discountRate": 19,
    "groupSize": "30人常规团",
    "theme": "海岛度假",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.461749",
    "updatedAt": "2026-05-07T01:02:13.461749"
  },
  {
    "id": "tour_167",
    "title": "<河南-云台山-龙门-少林寺-开封双飞4日游>25人精致小团，全程国际品牌Holiday inn，畅享恒温泳池，纯玩0购爸妈游 国旅专线专业为你❤国旅产品：一支年轻的团队，专一研究怎样让国旅贵宾完美出游，你值得拥有。❤住宿升级：沿途城市精选酒店，避免市场同行业其他线路每晚折回郑州，遭受多余的舟车劳顿之苦，给您一个舒适的睡眠 游玩目的地： 少林寺 龙门石窟 行程天数： 4天 交通方式： 飞机/飞机 ¥2189 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "其他",
    "duration": 4,
    "price": 2189,
    "originalPrice": 2328,
    "priceUnit": "人",
    "departureDate": "2026-08-04",
    "returnDate": "2026-08-08",
    "transportType": "高铁往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "4早餐3正餐",
    "singleSupplement": 547,
    "singleSupplementNote": "单人出行需补单房差￥547，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 16,
    "totalSeats": 41,
    "highlights": [
      "其他必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往其他",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "告别其他，返回温馨的家",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.8,
    "reviewCount": 236,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "自然风光",
      "纯玩",
      "品质"
    ],
    "isHot": true,
    "isNew": false,
    "isFlashSale": false,
    "discountRate": 6,
    "groupSize": "30人常规团",
    "theme": "自然风光",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.461749",
    "updatedAt": "2026-05-07T01:02:13.461749"
  },
  {
    "id": "tour_168",
    "title": "<青海湖+茶卡盐湖+张掖+敦煌双飞8日游>纯玩0购/9人内小团，24H接送机/不用等人/自由度高/无忧西北环游** 产品概要行程天数：8天7晚成团地点：西宁成团目的地：海西往返交通：飞机/飞机报名截止时间：团期前1天21点接待标准•用餐安排：全程不含餐，您自由选择，丰俭由己•住宿安排：茶卡镇双人标间，贴近茶卡盐湖 游玩目的地： 嘉峪关 西宁 张掖 青海 行程天数： 8天 交通方式： 飞机/飞机 ¥4580 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "其他",
    "duration": 8,
    "price": 4580,
    "priceUnit": "人",
    "departureDate": "2026-05-16",
    "returnDate": "2026-05-24",
    "transportType": "飞机往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "8早餐7正餐",
    "singleSupplement": 1145,
    "singleSupplementNote": "单人出行需补单房差￥1145，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 22,
    "totalSeats": 32,
    "highlights": [
      "其他必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往其他",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "第5天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 6,
        "title": "第6天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 7,
        "title": "第7天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 8,
        "title": "告别其他，返回温馨的家",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.8,
    "reviewCount": 287,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "自然风光",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "自然风光",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.461749",
    "updatedAt": "2026-05-07T01:02:13.461749"
  },
  {
    "id": "tour_169",
    "title": "<成都-新都桥-稻城亚丁-海螺沟双飞8日游>纯玩0购物 入住3晚智选假日酒店/1晚稻城金珠大酒店 33人封顶 2次特色餐圣地祈福 √用心餐食：品尝餐，感受纯正的当地美食！√高档住宿：区别于常规团经济型住宿，此线路住宿全程精选高档型酒店！√优质导游：圈定导游，专业导游陪同，只为你提供贴心的服务！√贴心服务：出游中客服24小时贴心守 游玩目的地： 成都 花溪 阿坝 九寨沟 行程天数： 8天 交通方式： 火车/火车 ¥3366 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "四川",
    "duration": 8,
    "price": 3366,
    "priceUnit": "人",
    "departureDate": "2026-05-24",
    "returnDate": "2026-06-01",
    "transportType": "飞机往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "8早餐7正餐",
    "singleSupplement": 841,
    "singleSupplementNote": "单人出行需补单房差￥841，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 7,
    "totalSeats": 47,
    "highlights": [
      "四川必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往四川",
        "description": "今日安排四川精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：四川游览",
        "description": "今日安排四川精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：四川游览",
        "description": "今日安排四川精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：四川游览",
        "description": "今日安排四川精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "第5天：四川游览",
        "description": "今日安排四川精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 6,
        "title": "第6天：四川游览",
        "description": "今日安排四川精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 7,
        "title": "第7天：四川游览",
        "description": "今日安排四川精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 8,
        "title": "告别四川，返回温馨的家",
        "description": "今日安排四川精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 3.6,
    "reviewCount": 695,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "美食之旅",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "美食之旅",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.461749",
    "updatedAt": "2026-05-07T01:02:13.461749"
  },
  {
    "id": "tour_170",
    "title": "<贵州黄果树瀑布-荔波-西江-花溪湿地高铁5日游>专车专导0购物 观壮美大瀑布 赏世遗风情 探苗家文化 产品概要行程天数：5天4晚成团地点：贵阳成团目的地：安顺往返交通：高铁二等座/高铁二等座报名截止时间：团期前3天18点附加说明：可根据需要选择某段行程或升级行程，在该行程段分开安排或统一协调行程。接待 游玩目的地： 贵阳 黄果树 行程天数： 5天 交通方式： 高铁二等座/高铁二等座 ¥2219 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "贵州",
    "duration": 5,
    "price": 2219,
    "originalPrice": 2641,
    "priceUnit": "人",
    "departureDate": "2026-05-18",
    "returnDate": "2026-05-23",
    "transportType": "高铁往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "5早餐4正餐",
    "singleSupplement": 554,
    "singleSupplementNote": "单人出行需补单房差￥554，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 7,
    "totalSeats": 37,
    "highlights": [
      "贵州必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往贵州",
        "description": "今日安排贵州精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：贵州游览",
        "description": "今日安排贵州精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：贵州游览",
        "description": "今日安排贵州精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：贵州游览",
        "description": "今日安排贵州精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "告别贵州，返回温馨的家",
        "description": "今日安排贵州精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.1,
    "reviewCount": 606,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "古镇文化",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "discountRate": 16,
    "groupSize": "30人常规团",
    "theme": "古镇文化",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.461749",
    "updatedAt": "2026-05-07T01:02:13.461749"
  },
  {
    "id": "tour_171",
    "title": "<黄山+宏村+屯溪老街+上海双飞5日游>云海奇松/徽派建筑，1晚山顶双标/观日出，1晚五星，含105元正餐，纯玩0购物 品黄山+赏宏村+行老街★纯玩经典：魅力魔都、黄山观日出、宏村徽州古名居。★美食之旅：品味小山城的慢生活，探秘舌尖上的徽州。★摄影之旅：合理的行程规划，让您有足够时间停下脚步，拍上几张。★黄山 游玩目的地： 上海 黄山 宏村 徽州古城 行程天数： 5天 交通方式： 飞机/飞机 ¥3168 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "其他",
    "duration": 5,
    "price": 3168,
    "priceUnit": "人",
    "departureDate": "2026-07-20",
    "returnDate": "2026-07-25",
    "transportType": "高铁往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "5早餐4正餐",
    "singleSupplement": 792,
    "singleSupplementNote": "单人出行需补单房差￥792，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 21,
    "totalSeats": 36,
    "highlights": [
      "其他必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往其他",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "告别其他，返回温馨的家",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.4,
    "reviewCount": 31,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "古镇文化",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "古镇文化",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.461749",
    "updatedAt": "2026-05-07T01:02:13.461749"
  },
  {
    "id": "tour_172",
    "title": "<黄山+宏村+屯溪老街+上海双飞5日游>云海奇松/徽派建筑，1晚山顶双标/观日出，1晚五星，含105元正餐，纯玩0购物 品黄山+赏宏村+行老街★纯玩经典：魅力魔都、黄山观日出、宏村徽州古名居。★美食之旅：品味小山城的慢生活，探秘舌尖上的徽州。★摄影之旅：合理的行程规划，让您有足够时间停下脚步，拍上几张。★黄山 游玩目的地： 上海 黄山 宏村 徽州古城 行程天数： 5天 交通方式： 飞机/飞机",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "其他",
    "duration": 5,
    "price": 105,
    "priceUnit": "人",
    "departureDate": "2026-06-21",
    "returnDate": "2026-06-26",
    "transportType": "高铁往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "5早餐4正餐",
    "singleSupplement": 26,
    "singleSupplementNote": "单人出行需补单房差￥26，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 11,
    "totalSeats": 46,
    "highlights": [
      "其他必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往其他",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "告别其他，返回温馨的家",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.6,
    "reviewCount": 161,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "古镇文化",
      "纯玩",
      "品质"
    ],
    "isHot": true,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "古镇文化",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.461749",
    "updatedAt": "2026-05-07T01:02:13.461749"
  },
  {
    "id": "tour_173",
    "title": "<北京-八达岭-故宫-颐和园-天坛双飞5日游>住连锁酒店 全年365天接送机场 参观华夏魔术城 增加圆明园 漫步老北京胡同 品尝烤鸭餐 ★专注行程每个细节※注重贵宾真实体验★◆【轻松舒适】：每天8小时充足睡眠时间，放慢脚步，感受北京慢生活，让您不再“走马观花“！◆【闲情逸致】：游览时间科学合理，纯净无死角畅游帝都北京经典景点！ 游玩目的地： 北京 行程天数： 5天 交通方式： 飞机/飞机 ¥2557 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "北京",
    "duration": 5,
    "price": 2557,
    "priceUnit": "人",
    "departureDate": "2026-05-27",
    "returnDate": "2026-06-01",
    "transportType": "高铁往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "5早餐4正餐",
    "singleSupplement": 639,
    "singleSupplementNote": "单人出行需补单房差￥639，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 27,
    "totalSeats": 37,
    "highlights": [
      "北京必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往北京",
        "description": "今日安排北京精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：北京游览",
        "description": "今日安排北京精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：北京游览",
        "description": "今日安排北京精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：北京游览",
        "description": "今日安排北京精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "告别北京，返回温馨的家",
        "description": "今日安排北京精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.0,
    "reviewCount": 358,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "自然风光",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "自然风光",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.461749",
    "updatedAt": "2026-05-07T01:02:13.461749"
  },
  {
    "id": "tour_174",
    "title": "<韶山-张家界-百龙电梯-天门山-玻璃栈道-凤凰古城高铁6日游>0购物,宿4晚高端/5星/黄龙洞,宿凤凰/含9景/135元特色餐,周4升航空座椅车型 国旅专线=品质服务+超高满意度1、牛服务：专业自营随往地接社，从计调到导游，均有丰富的从业经验，严格筛选服务之星导游队伍，24小时管家服务，为您的出行保驾护航。2、牛品质：含五大火爆景点（韶山+张家界 游玩目的地： 张家界 长沙 行程天数： 6天 交通方式： 高铁二等座/高铁二等座 ¥3757 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "张家界",
    "duration": 6,
    "price": 3757,
    "priceUnit": "人",
    "departureDate": "2026-07-20",
    "returnDate": "2026-07-26",
    "transportType": "飞机往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "6早餐5正餐",
    "singleSupplement": 939,
    "singleSupplementNote": "单人出行需补单房差￥939，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 25,
    "totalSeats": 30,
    "highlights": [
      "张家界必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往张家界",
        "description": "今日安排张家界精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：张家界游览",
        "description": "今日安排张家界精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：张家界游览",
        "description": "今日安排张家界精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：张家界游览",
        "description": "今日安排张家界精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "第5天：张家界游览",
        "description": "今日安排张家界精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 6,
        "title": "告别张家界，返回温馨的家",
        "description": "今日安排张家界精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.9,
    "reviewCount": 632,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "古镇文化",
      "纯玩",
      "品质"
    ],
    "isHot": true,
    "isNew": true,
    "isFlashSale": true,
    "groupSize": "30人常规团",
    "theme": "古镇文化",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.461749",
    "updatedAt": "2026-05-07T01:02:13.461749"
  },
  {
    "id": "tour_175",
    "title": "<韶山-张家界-百龙电梯-天门山-玻璃栈道-凤凰古城高铁6日游>0购物,宿4晚高端/5星/黄龙洞,宿凤凰/含9景/135元特色餐,周4升航空座椅车型 国旅专线=品质服务+超高满意度1、牛服务：专业自营随往地接社，从计调到导游，均有丰富的从业经验，严格筛选服务之星导游队伍，24小时管家服务，为您的出行保驾护航。2、牛品质：含五大火爆景点（韶山+张家界 游玩目的地： 张家界 长沙 行程天数： 6天 交通方式： 高铁二等座/高铁二等座",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "张家界",
    "duration": 6,
    "price": 135,
    "priceUnit": "人",
    "departureDate": "2026-07-25",
    "returnDate": "2026-07-31",
    "transportType": "飞机往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "6早餐5正餐",
    "singleSupplement": 33,
    "singleSupplementNote": "单人出行需补单房差￥33，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 8,
    "totalSeats": 38,
    "highlights": [
      "张家界必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往张家界",
        "description": "今日安排张家界精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：张家界游览",
        "description": "今日安排张家界精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：张家界游览",
        "description": "今日安排张家界精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：张家界游览",
        "description": "今日安排张家界精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "第5天：张家界游览",
        "description": "今日安排张家界精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 6,
        "title": "告别张家界，返回温馨的家",
        "description": "今日安排张家界精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 3.6,
    "reviewCount": 684,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "古镇文化",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "古镇文化",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.461749",
    "updatedAt": "2026-05-07T01:02:13.461749"
  },
  {
    "id": "tour_176",
    "title": "<海南三亚双飞4日游>17万人出游0购物，180度海景/海立方(供免费挖沙工具)/温德姆(赠欢迎水果)/国光豪生(隔条马路即沙滩)，度假雨林天堂，接机0等待 •用餐安排：全程安排指定餐厅用餐，30元/人/餐的标准，围桌餐保证十菜一汤或自助餐；其中两顿晚餐升级为40元/人社会小炒围桌餐；海南口味偏淡，还请您多多包含；重口味的亲们可以带些老干妈等调调口味•游玩 游玩目的地： 海南 三亚 行程天数： 4天 交通方式： 飞机/飞机 ¥1848 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "三亚",
    "duration": 4,
    "price": 1848,
    "priceUnit": "人",
    "departureDate": "2026-07-24",
    "returnDate": "2026-07-28",
    "transportType": "高铁往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "4早餐3正餐",
    "singleSupplement": 462,
    "singleSupplementNote": "单人出行需补单房差￥462，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 24,
    "totalSeats": 44,
    "highlights": [
      "三亚必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往三亚",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：三亚游览",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：三亚游览",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "告别三亚，返回温馨的家",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 3.7,
    "reviewCount": 214,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "海岛度假",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "海岛度假",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.461749",
    "updatedAt": "2026-05-07T01:02:13.461749"
  },
  {
    "id": "tour_177",
    "title": "<海南三亚双飞4日游>17万人出游0购物，180度海景/海立方(供免费挖沙工具)/温德姆(赠欢迎水果)/国光豪生(隔条马路即沙滩)，度假雨林天堂，接机0等待 •用餐安排：全程安排指定餐厅用餐，30元/人/餐的标准，围桌餐保证十菜一汤或自助餐；其中两顿晚餐升级为40元/人社会小炒围桌餐；海南口味偏淡，还请您多多包含；重口味的亲们可以带些老干妈等调调口味•游玩 游玩目的地： 海南 三亚 行程天数： 4天 交通方式： 飞机/飞机",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "三亚",
    "duration": 4,
    "price": 30,
    "priceUnit": "人",
    "departureDate": "2026-07-02",
    "returnDate": "2026-07-06",
    "transportType": "高铁往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "4早餐3正餐",
    "singleSupplement": 7,
    "singleSupplementNote": "单人出行需补单房差￥7，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 15,
    "totalSeats": 45,
    "highlights": [
      "三亚必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往三亚",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：三亚游览",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：三亚游览",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "告别三亚，返回温馨的家",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.0,
    "reviewCount": 224,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "海岛度假",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": true,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "海岛度假",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.461749",
    "updatedAt": "2026-05-07T01:02:13.461749"
  },
  {
    "id": "tour_178",
    "title": "<海南三亚双飞5日游>17万人出游0购物，180度海景/海立方(供免费挖沙工具)/温德姆(赠欢迎水果)/国光豪生(隔条马路即沙滩)，度假雨林天堂，接机0等待 •用餐安排：全程安排指定餐厅用餐，30元/人/餐的标准，围桌餐保证十菜一汤或自助餐；其中两顿晚餐升级为40元/人社会小炒围桌餐；海南口味偏淡，还请您多多包含；重口味的亲们可以带些老干妈等调调口味•住宿 游玩目的地： 海南 三亚 行程天数： 5天 交通方式： 飞机/飞机 ¥2158 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "三亚",
    "duration": 5,
    "price": 2158,
    "originalPrice": 2480,
    "priceUnit": "人",
    "departureDate": "2026-07-14",
    "returnDate": "2026-07-19",
    "transportType": "高铁往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "5早餐4正餐",
    "singleSupplement": 539,
    "singleSupplementNote": "单人出行需补单房差￥539，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 25,
    "totalSeats": 30,
    "highlights": [
      "三亚必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往三亚",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：三亚游览",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：三亚游览",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：三亚游览",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "告别三亚，返回温馨的家",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.8,
    "reviewCount": 533,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "海岛度假",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": true,
    "isFlashSale": true,
    "discountRate": 13,
    "groupSize": "30人常规团",
    "theme": "海岛度假",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.461749",
    "updatedAt": "2026-05-07T01:02:13.461749"
  },
  {
    "id": "tour_179",
    "title": "<海南三亚双飞5日游>17万人出游0购物，180度海景/海立方(供免费挖沙工具)/温德姆(赠欢迎水果)/国光豪生(隔条马路即沙滩)，度假雨林天堂，接机0等待 •用餐安排：全程安排指定餐厅用餐，30元/人/餐的标准，围桌餐保证十菜一汤或自助餐；其中两顿晚餐升级为40元/人社会小炒围桌餐；海南口味偏淡，还请您多多包含；重口味的亲们可以带些老干妈等调调口味•住宿 游玩目的地： 海南 三亚 行程天数： 5天 交通方式： 飞机/飞机",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "三亚",
    "duration": 5,
    "price": 30,
    "priceUnit": "人",
    "departureDate": "2026-06-27",
    "returnDate": "2026-07-02",
    "transportType": "高铁往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "5早餐4正餐",
    "singleSupplement": 7,
    "singleSupplementNote": "单人出行需补单房差￥7，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 15,
    "totalSeats": 30,
    "highlights": [
      "三亚必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往三亚",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：三亚游览",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：三亚游览",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：三亚游览",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "告别三亚，返回温馨的家",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.5,
    "reviewCount": 818,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "海岛度假",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": true,
    "isFlashSale": true,
    "groupSize": "30人常规团",
    "theme": "海岛度假",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.461749",
    "updatedAt": "2026-05-07T01:02:13.461749"
  },
  {
    "id": "tour_180",
    "title": "<海南三亚双飞4日游>20人精品小团0购物，国际五星温德姆/洲际皇冠假日/国光豪生连住，丰富自助早餐+多房型可选+玩乐设施，蜈支洲畅玩一天，接机0等待 •用餐安排：全程安排指定餐厅用餐，30元/人/餐的标准，围桌餐保证十菜一汤或自助餐•游玩安排：景点只去精华的，只安排三亚知名度和值得玩的5大黄金景点（亚龙湾沙滩、亚龙湾热带天堂森林公园、蜈支洲岛纯玩 游玩目的地： 海南 三亚 行程天数： 4天 交通方式： 飞机/飞机 ¥1948 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "三亚",
    "duration": 4,
    "price": 1948,
    "priceUnit": "人",
    "departureDate": "2026-06-10",
    "returnDate": "2026-06-14",
    "transportType": "高铁往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "4早餐3正餐",
    "singleSupplement": 487,
    "singleSupplementNote": "单人出行需补单房差￥487，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 11,
    "totalSeats": 41,
    "highlights": [
      "三亚必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往三亚",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：三亚游览",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：三亚游览",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "告别三亚，返回温馨的家",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 3.6,
    "reviewCount": 117,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "海岛度假",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "海岛度假",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.461749",
    "updatedAt": "2026-05-07T01:02:13.461749"
  },
  {
    "id": "tour_181",
    "title": "<海南三亚双飞4日游>20人精品小团0购物，国际五星温德姆/洲际皇冠假日/国光豪生连住，丰富自助早餐+多房型可选+玩乐设施，蜈支洲畅玩一天，接机0等待 •用餐安排：全程安排指定餐厅用餐，30元/人/餐的标准，围桌餐保证十菜一汤或自助餐•游玩安排：景点只去精华的，只安排三亚知名度和值得玩的5大黄金景点（亚龙湾沙滩、亚龙湾热带天堂森林公园、蜈支洲岛纯玩 游玩目的地： 海南 三亚 行程天数： 4天 交通方式： 飞机/飞机",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "三亚",
    "duration": 4,
    "price": 30,
    "priceUnit": "人",
    "departureDate": "2026-07-12",
    "returnDate": "2026-07-16",
    "transportType": "高铁往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "4早餐3正餐",
    "singleSupplement": 7,
    "singleSupplementNote": "单人出行需补单房差￥7，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 22,
    "totalSeats": 42,
    "highlights": [
      "三亚必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往三亚",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：三亚游览",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：三亚游览",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "告别三亚，返回温馨的家",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.2,
    "reviewCount": 273,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "海岛度假",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "海岛度假",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.461749",
    "updatedAt": "2026-05-07T01:02:13.461749"
  },
  {
    "id": "tour_182",
    "title": "<海南三亚双飞7日游>20人精品小团0购物，国际五星温德姆/洲际皇冠假日/国光豪生连住，丰富自助早餐+多房型可选+玩乐设施，蜈支洲畅玩一天，接机0等待 •用餐安排：全程安排指定餐厅用餐，30元/人/餐的标准，围桌餐保证十菜一汤或自助餐•游玩安排：景点只去最精的，只安排三亚最具知名度和值得玩的5大黄金景点（亚龙湾沙滩、亚龙湾热带天堂森林公园、蜈支洲岛 游玩目的地： 海南 三亚 行程天数： 7天 交通方式： 飞机/飞机 ¥2768 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "三亚",
    "duration": 7,
    "price": 2768,
    "priceUnit": "人",
    "departureDate": "2026-06-10",
    "returnDate": "2026-06-17",
    "transportType": "飞机往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "7早餐6正餐",
    "singleSupplement": 692,
    "singleSupplementNote": "单人出行需补单房差￥692，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 11,
    "totalSeats": 31,
    "highlights": [
      "三亚必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往三亚",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：三亚游览",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：三亚游览",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：三亚游览",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "第5天：三亚游览",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 6,
        "title": "第6天：三亚游览",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 7,
        "title": "告别三亚，返回温馨的家",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.5,
    "reviewCount": 80,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "海岛度假",
      "纯玩",
      "品质"
    ],
    "isHot": true,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "海岛度假",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.461749",
    "updatedAt": "2026-05-07T01:02:13.461749"
  },
  {
    "id": "tour_183",
    "title": "<海南三亚双飞7日游>20人精品小团0购物，国际五星温德姆/洲际皇冠假日/国光豪生连住，丰富自助早餐+多房型可选+玩乐设施，蜈支洲畅玩一天，接机0等待 •用餐安排：全程安排指定餐厅用餐，30元/人/餐的标准，围桌餐保证十菜一汤或自助餐•游玩安排：景点只去最精的，只安排三亚最具知名度和值得玩的5大黄金景点（亚龙湾沙滩、亚龙湾热带天堂森林公园、蜈支洲岛 游玩目的地： 海南 三亚 行程天数： 7天 交通方式： 飞机/飞机",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "三亚",
    "duration": 7,
    "price": 30,
    "priceUnit": "人",
    "departureDate": "2026-05-15",
    "returnDate": "2026-05-22",
    "transportType": "飞机往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "7早餐6正餐",
    "singleSupplement": 7,
    "singleSupplementNote": "单人出行需补单房差￥7，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 19,
    "totalSeats": 44,
    "highlights": [
      "三亚必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往三亚",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：三亚游览",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：三亚游览",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：三亚游览",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "第5天：三亚游览",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 6,
        "title": "第6天：三亚游览",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 7,
        "title": "告别三亚，返回温馨的家",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.5,
    "reviewCount": 521,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "海岛度假",
      "纯玩",
      "品质"
    ],
    "isHot": true,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "海岛度假",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.461749",
    "updatedAt": "2026-05-07T01:02:13.461749"
  },
  {
    "id": "tour_184",
    "title": "<海南三亚双飞5日游>错峰甄选0购物，全程连住一线海边酒店，可升海立方/国光/温德姆，呀诺达雨林寻宝&南山观音祈福，奔驰接机/品当地美食 •用餐安排：全程安排指定餐厅用餐，30元/人/餐的标准，围桌餐保证十菜一汤或自助餐•住宿安排：入住三亚阳光大酒店、三亚康年酒店、三亚国光豪生度假酒店，多种酒店及房型供您选择。•游玩安排：景点只去最精的 游玩目的地： 海南 三亚 行程天数： 5天 交通方式： 飞机/飞机 ¥1881 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "三亚",
    "duration": 5,
    "price": 1881,
    "originalPrice": 2022,
    "priceUnit": "人",
    "departureDate": "2026-06-15",
    "returnDate": "2026-06-20",
    "transportType": "高铁往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "5早餐4正餐",
    "singleSupplement": 470,
    "singleSupplementNote": "单人出行需补单房差￥470，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 17,
    "totalSeats": 37,
    "highlights": [
      "三亚必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往三亚",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：三亚游览",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：三亚游览",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：三亚游览",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "告别三亚，返回温馨的家",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 3.7,
    "reviewCount": 371,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "美食之旅",
      "纯玩",
      "品质"
    ],
    "isHot": true,
    "isNew": false,
    "isFlashSale": false,
    "discountRate": 7,
    "groupSize": "30人常规团",
    "theme": "美食之旅",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.461749",
    "updatedAt": "2026-05-07T01:02:13.461749"
  },
  {
    "id": "tour_185",
    "title": "<海南三亚双飞5日游>错峰甄选0购物，全程连住一线海边酒店，可升海立方/国光/温德姆，呀诺达雨林寻宝&南山观音祈福，奔驰接机/品当地美食 •用餐安排：全程安排指定餐厅用餐，30元/人/餐的标准，围桌餐保证十菜一汤或自助餐•住宿安排：入住三亚阳光大酒店、三亚康年酒店、三亚国光豪生度假酒店，多种酒店及房型供您选择。•游玩安排：景点只去最精的 游玩目的地： 海南 三亚 行程天数： 5天 交通方式： 飞机/飞机",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "三亚",
    "duration": 5,
    "price": 30,
    "priceUnit": "人",
    "departureDate": "2026-07-13",
    "returnDate": "2026-07-18",
    "transportType": "高铁往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "5早餐4正餐",
    "singleSupplement": 7,
    "singleSupplementNote": "单人出行需补单房差￥7，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 27,
    "totalSeats": 37,
    "highlights": [
      "三亚必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往三亚",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：三亚游览",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：三亚游览",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：三亚游览",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "告别三亚，返回温馨的家",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.5,
    "reviewCount": 780,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "美食之旅",
      "纯玩",
      "品质"
    ],
    "isHot": true,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "美食之旅",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.461749",
    "updatedAt": "2026-05-07T01:02:13.461749"
  },
  {
    "id": "tour_186",
    "title": "<海南三亚双飞5日游>20人精品小团0购物，国际五星温德姆/洲际皇冠假日/国光豪生连住，丰富自助早餐+多房型可选+玩乐设施，蜈支洲畅玩一天，接机0等待 奔跑吧国旅国旅人自己的品牌【品牌住宿】：国际五星温德姆（丽禾温德姆、国光豪生）/万豪（山海天万豪）/喜来登（福朋喜来登）等品牌住宿，全年包房价格，优惠多多【专注产品】：产品经理反复踩线，畅销多年，每 游玩目的地： 海南 三亚 行程天数： 5天 交通方式： 飞机/飞机 ¥2308 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "三亚",
    "duration": 5,
    "price": 2308,
    "priceUnit": "人",
    "departureDate": "2026-05-23",
    "returnDate": "2026-05-28",
    "transportType": "高铁往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "5早餐4正餐",
    "singleSupplement": 577,
    "singleSupplementNote": "单人出行需补单房差￥577，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 9,
    "totalSeats": 44,
    "highlights": [
      "三亚必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往三亚",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：三亚游览",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：三亚游览",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：三亚游览",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "告别三亚，返回温馨的家",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.6,
    "reviewCount": 770,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "自然风光",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "自然风光",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.461749",
    "updatedAt": "2026-05-07T01:02:13.461749"
  },
  {
    "id": "tour_187",
    "title": "<海南三亚双飞6日游>20人精品小团0购物，国际五星温德姆/洲际皇冠假日/国光豪生连住，丰富自助早餐+多房型可选+玩乐设施，蜈支洲畅玩一天，接机0等待 奔跑吧国旅国旅人自己的品牌【品牌住宿】：国际五星温德姆（丽禾温德姆、国光豪生）/万豪（山海天万豪）/喜来登（福朋喜来登）品牌住宿，全年包房价格，优惠多多【专注产品】：产品经理反复踩线，畅销多年，每年 游玩目的地： 海南 三亚 行程天数： 6天 交通方式： 飞机/飞机 ¥2616 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "三亚",
    "duration": 6,
    "price": 2616,
    "originalPrice": 3311,
    "priceUnit": "人",
    "departureDate": "2026-07-08",
    "returnDate": "2026-07-14",
    "transportType": "飞机往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "6早餐5正餐",
    "singleSupplement": 654,
    "singleSupplementNote": "单人出行需补单房差￥654，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 21,
    "totalSeats": 36,
    "highlights": [
      "三亚必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往三亚",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：三亚游览",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：三亚游览",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：三亚游览",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "第5天：三亚游览",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 6,
        "title": "告别三亚，返回温馨的家",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 3.5,
    "reviewCount": 186,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "自然风光",
      "纯玩",
      "品质"
    ],
    "isHot": true,
    "isNew": false,
    "isFlashSale": false,
    "discountRate": 21,
    "groupSize": "30人常规团",
    "theme": "自然风光",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.461749",
    "updatedAt": "2026-05-07T01:02:13.461749"
  },
  {
    "id": "tour_188",
    "title": "<海南三亚双飞6日游>人气&亲子&蜜月，0购物，维景/天通/红树林/康年酒店自选连住，接机0等待，畅享蜈支洲一整天，万人出游甄选 •用餐安排：全程安排指定餐厅用餐，30元/人/餐的标准，围桌餐保证十菜一汤或自助餐；其中两顿晚餐升级为40元/人社会小炒围桌餐；海南口味偏淡，还请您多多包含；重口味的亲们可以带些老干妈等调调口味•住宿 游玩目的地： 三亚 海南 行程天数： 5天 交通方式： 飞机/飞机 ¥2310 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "三亚",
    "duration": 5,
    "price": 2310,
    "originalPrice": 3000,
    "priceUnit": "人",
    "departureDate": "2026-06-21",
    "returnDate": "2026-06-26",
    "transportType": "高铁往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "5早餐4正餐",
    "singleSupplement": 577,
    "singleSupplementNote": "单人出行需补单房差￥577，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 18,
    "totalSeats": 48,
    "highlights": [
      "三亚必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往三亚",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：三亚游览",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：三亚游览",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：三亚游览",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "告别三亚，返回温馨的家",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 3.6,
    "reviewCount": 414,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "亲子游",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "discountRate": 23,
    "groupSize": "30人常规团",
    "theme": "亲子游",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.462749",
    "updatedAt": "2026-05-07T01:02:13.462749"
  },
  {
    "id": "tour_189",
    "title": "<海南三亚双飞6日游>人气&亲子&蜜月，0购物，维景/天通/红树林/康年酒店自选连住，接机0等待，畅享蜈支洲一整天，万人出游甄选 •用餐安排：全程安排指定餐厅用餐，30元/人/餐的标准，围桌餐保证十菜一汤或自助餐；其中两顿晚餐升级为40元/人社会小炒围桌餐；海南口味偏淡，还请您多多包含；重口味的亲们可以带些老干妈等调调口味•住宿 游玩目的地： 三亚 海南 行程天数： 5天 交通方式： 飞机/飞机",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "三亚",
    "duration": 5,
    "price": 30,
    "priceUnit": "人",
    "departureDate": "2026-07-19",
    "returnDate": "2026-07-24",
    "transportType": "高铁往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "5早餐4正餐",
    "singleSupplement": 7,
    "singleSupplementNote": "单人出行需补单房差￥7，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 13,
    "totalSeats": 33,
    "highlights": [
      "三亚必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往三亚",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：三亚游览",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：三亚游览",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：三亚游览",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "告别三亚，返回温馨的家",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 3.8,
    "reviewCount": 646,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "亲子游",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "亲子游",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.462749",
    "updatedAt": "2026-05-07T01:02:13.462749"
  },
  {
    "id": "tour_190",
    "title": "<海南三亚双飞5日游>乐开花爸妈游，纯玩0购物，国际五星国光豪生/康年/天通酒店自选，步行1分钟直达沙滩，蜈支洲一整天，24H接送机 臻品&自营定制乐开花爸妈游，只用星级导游，96%高满意度，我们一直在努力【精致度假】：没有舟车劳顿的辛苦，没有走马观花的紧凑，只在三亚，给你想要的自然风光。【个性住宿】：精挑细选海南不同湾区倍 游玩目的地： 三亚 海南 行程天数： 5天 交通方式： 飞机/飞机 ¥2285 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "三亚",
    "duration": 5,
    "price": 2285,
    "priceUnit": "人",
    "departureDate": "2026-05-26",
    "returnDate": "2026-05-31",
    "transportType": "高铁往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "5早餐4正餐",
    "singleSupplement": 571,
    "singleSupplementNote": "单人出行需补单房差￥571，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 10,
    "totalSeats": 45,
    "highlights": [
      "三亚必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往三亚",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：三亚游览",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：三亚游览",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：三亚游览",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "告别三亚，返回温馨的家",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 3.8,
    "reviewCount": 795,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "海岛度假",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": true,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "海岛度假",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.462749",
    "updatedAt": "2026-05-07T01:02:13.462749"
  },
  {
    "id": "tour_191",
    "title": "<海南三亚双飞4日游>错峰甄选0购物，全程连住一线海边酒店，可升海立方/国光/温德姆，呀诺达雨林寻宝&南山观音祈福，奔驰接机/品当地美食 •用餐安排：全程安排指定餐厅用餐，30元/人/餐的标准，围桌餐保证十菜一汤或自助餐•住宿安排：入住三亚阳光大酒店、三亚康年酒店、三亚国光豪生度假酒店，多酒店及多房型供您选择•游玩安排：景点只去最精的， 游玩目的地： 海南 三亚 行程天数： 4天 交通方式： 飞机/飞机 ¥1564 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "三亚",
    "duration": 4,
    "price": 1564,
    "priceUnit": "人",
    "departureDate": "2026-07-06",
    "returnDate": "2026-07-10",
    "transportType": "高铁往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "4早餐3正餐",
    "singleSupplement": 391,
    "singleSupplementNote": "单人出行需补单房差￥391，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 23,
    "totalSeats": 43,
    "highlights": [
      "三亚必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往三亚",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：三亚游览",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：三亚游览",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "告别三亚，返回温馨的家",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.5,
    "reviewCount": 291,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "美食之旅",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "美食之旅",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.462749",
    "updatedAt": "2026-05-07T01:02:13.462749"
  },
  {
    "id": "tour_192",
    "title": "<海南三亚双飞4日游>错峰甄选0购物，全程连住一线海边酒店，可升海立方/国光/温德姆，呀诺达雨林寻宝&南山观音祈福，奔驰接机/品当地美食 •用餐安排：全程安排指定餐厅用餐，30元/人/餐的标准，围桌餐保证十菜一汤或自助餐•住宿安排：入住三亚阳光大酒店、三亚康年酒店、三亚国光豪生度假酒店，多酒店及多房型供您选择•游玩安排：景点只去最精的， 游玩目的地： 海南 三亚 行程天数： 4天 交通方式： 飞机/飞机",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "三亚",
    "duration": 4,
    "price": 30,
    "priceUnit": "人",
    "departureDate": "2026-07-22",
    "returnDate": "2026-07-26",
    "transportType": "高铁往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "4早餐3正餐",
    "singleSupplement": 7,
    "singleSupplementNote": "单人出行需补单房差￥7，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 27,
    "totalSeats": 47,
    "highlights": [
      "三亚必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往三亚",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：三亚游览",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：三亚游览",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "告别三亚，返回温馨的家",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.1,
    "reviewCount": 719,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "美食之旅",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "美食之旅",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.462749",
    "updatedAt": "2026-05-07T01:02:13.462749"
  },
  {
    "id": "tour_193",
    "title": "<海南三亚双飞5日游>人气&亲子&蜜月，0购物，维景/天通/红树林/康年酒店自选连住，接机0等待，畅享蜈支洲一整天，万人出游甄选 行程天数：5天4晚 成团地点：三亚成团 目的地：三亚 往返交通：飞机/飞机 报名截止时间：团期前1天15点  全年畅销NO.1 游玩目的地： 三亚 海南 行程天数： 5天 交通方式： 飞机/飞机 ¥1950 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "三亚",
    "duration": 5,
    "price": 1950,
    "priceUnit": "人",
    "departureDate": "2026-06-23",
    "returnDate": "2026-06-28",
    "transportType": "高铁往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "5早餐4正餐",
    "singleSupplement": 487,
    "singleSupplementNote": "单人出行需补单房差￥487，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 25,
    "totalSeats": 30,
    "highlights": [
      "三亚必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往三亚",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：三亚游览",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：三亚游览",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：三亚游览",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "告别三亚，返回温馨的家",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 3.6,
    "reviewCount": 332,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "亲子游",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": true,
    "isFlashSale": true,
    "groupSize": "30人常规团",
    "theme": "亲子游",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.462749",
    "updatedAt": "2026-05-07T01:02:13.462749"
  },
  {
    "id": "tour_194",
    "title": "<北京双卧6日游>自营倾情打造/纯玩精品，热销4年超4万人选择，故宫全新深度游3H（含珍宝馆），获奖导游精讲慢游，网红餐厅特色体验，观升旗仪式 餐全新升级，唤醒舌头的味蕾，享受旅行的美好❤住的“安心”——商业圈五星配置大酒店，居住其中成为美的享受，尽享帝都别漾风情❤定的“放心”——全年销量TOP线路，40000+客人的选择，真实回访点评， 游玩目的地： 北京 行程天数： 6天 交通方式： 火车硬卧/火车硬卧 ¥2805 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "北京",
    "duration": 6,
    "price": 2805,
    "originalPrice": 3224,
    "priceUnit": "人",
    "departureDate": "2026-06-09",
    "returnDate": "2026-06-15",
    "transportType": "飞机往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "6早餐5正餐",
    "singleSupplement": 701,
    "singleSupplementNote": "单人出行需补单房差￥701，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 12,
    "totalSeats": 37,
    "highlights": [
      "北京必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往北京",
        "description": "今日安排北京精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：北京游览",
        "description": "今日安排北京精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：北京游览",
        "description": "今日安排北京精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：北京游览",
        "description": "今日安排北京精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "第5天：北京游览",
        "description": "今日安排北京精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 6,
        "title": "告别北京，返回温馨的家",
        "description": "今日安排北京精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.3,
    "reviewCount": 37,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "民族风情",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "discountRate": 13,
    "groupSize": "30人常规团",
    "theme": "民族风情",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.462749",
    "updatedAt": "2026-05-07T01:02:13.462749"
  },
  {
    "id": "tour_195",
    "title": "<桂林-漓江-遇龙河-银子岩-世外桃源双动4日游>人气热销,一价全含,高档住宿/阳朔两晚连住,星级游船,网红新贵千古情/遇龙河漂流,广州往返 产品概要行程天数：4天3晚成团地点：桂林成团目的地：桂林往返交通：动车组/动车组报名截止时间：团期前1天16点组团形式：联合发团；本产品与其他旅行社联合发团。附加说明：本行程与其他团队客人拼往返用车。 游玩目的地： 桂林 阳朔 行程天数： 4天 交通方式： 动车组/动车组 ¥1889 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "桂林",
    "duration": 4,
    "price": 1889,
    "priceUnit": "人",
    "departureDate": "2026-07-16",
    "returnDate": "2026-07-20",
    "transportType": "高铁往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "4早餐3正餐",
    "singleSupplement": 472,
    "singleSupplementNote": "单人出行需补单房差￥472，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 29,
    "totalSeats": 44,
    "highlights": [
      "桂林必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往桂林",
        "description": "今日安排桂林精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：桂林游览",
        "description": "今日安排桂林精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：桂林游览",
        "description": "今日安排桂林精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "告别桂林，返回温馨的家",
        "description": "今日安排桂林精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.0,
    "reviewCount": 67,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "自然风光",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "自然风光",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.462749",
    "updatedAt": "2026-05-07T01:02:13.462749"
  },
  {
    "id": "tour_196",
    "title": "<海南三亚双飞6日游>纯玩0购物，2晚三亚湾住宿，3晚海棠湾酒店，可选呀诺达网红秋千/玻璃栈道，高性价比 【有爱的产品更走心】Designanalysis1：悠哉行程——RomanticIsland—分界洲岛，全方位体验民俗—椰田古寨；呀诺达雨林，天涯海角~；Designanalysis2：酒店升级 游玩目的地： 三亚 海南 行程天数： 6天 交通方式： 飞机/飞机 ¥2445 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "三亚",
    "duration": 6,
    "price": 2445,
    "originalPrice": 2601,
    "priceUnit": "人",
    "departureDate": "2026-05-28",
    "returnDate": "2026-06-03",
    "transportType": "飞机往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "6早餐5正餐",
    "singleSupplement": 611,
    "singleSupplementNote": "单人出行需补单房差￥611，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 26,
    "totalSeats": 41,
    "highlights": [
      "三亚必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往三亚",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：三亚游览",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：三亚游览",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：三亚游览",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "第5天：三亚游览",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 6,
        "title": "告别三亚，返回温馨的家",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 3.9,
    "reviewCount": 320,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "民族风情",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "discountRate": 6,
    "groupSize": "30人常规团",
    "theme": "民族风情",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.462749",
    "updatedAt": "2026-05-07T01:02:13.462749"
  },
  {
    "id": "tour_197",
    "title": "<北京双飞5日游>自营倾情打造/纯玩精品，热销4年超4万人选择，故宫全新深度游3H（含珍宝馆），获奖导游精讲慢游，网红餐厅特色体验，观升旗仪式 •用餐安排：4酒店自助早餐，4风味地道正餐全新升级：川府热盆景或老北京胡同饭（40元/人）、农家春饼宴或艺麓苑自助（50元/人）、饺子宴（30元/人，8月20号团期开始升级为40元/人）、全聚德烤鸭或 游玩目的地： 北京 行程天数： 5天 交通方式： 飞机/飞机 ¥3079 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "北京",
    "duration": 5,
    "price": 3079,
    "priceUnit": "人",
    "departureDate": "2026-07-11",
    "returnDate": "2026-07-16",
    "transportType": "高铁往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "5早餐4正餐",
    "singleSupplement": 769,
    "singleSupplementNote": "单人出行需补单房差￥769，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 18,
    "totalSeats": 48,
    "highlights": [
      "北京必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往北京",
        "description": "今日安排北京精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：北京游览",
        "description": "今日安排北京精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：北京游览",
        "description": "今日安排北京精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：北京游览",
        "description": "今日安排北京精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "告别北京，返回温馨的家",
        "description": "今日安排北京精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.7,
    "reviewCount": 496,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "自然风光",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "自然风光",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.462749",
    "updatedAt": "2026-05-07T01:02:13.462749"
  },
  {
    "id": "tour_198",
    "title": "<北京双飞5日游>自营倾情打造/纯玩精品，热销4年超4万人选择，故宫全新深度游3H（含珍宝馆），获奖导游精讲慢游，网红餐厅特色体验，观升旗仪式 •用餐安排：4酒店自助早餐，4风味地道正餐全新升级：川府热盆景或老北京胡同饭（40元/人）、农家春饼宴或艺麓苑自助（50元/人）、饺子宴（30元/人，8月20号团期开始升级为40元/人）、全聚德烤鸭或 游玩目的地： 北京 行程天数： 5天 交通方式： 飞机/飞机",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "北京",
    "duration": 5,
    "price": 40,
    "priceUnit": "人",
    "departureDate": "2026-06-20",
    "returnDate": "2026-06-25",
    "transportType": "高铁往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "5早餐4正餐",
    "singleSupplement": 10,
    "singleSupplementNote": "单人出行需补单房差￥10，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 11,
    "totalSeats": 46,
    "highlights": [
      "北京必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往北京",
        "description": "今日安排北京精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：北京游览",
        "description": "今日安排北京精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：北京游览",
        "description": "今日安排北京精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：北京游览",
        "description": "今日安排北京精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "告别北京，返回温馨的家",
        "description": "今日安排北京精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.0,
    "reviewCount": 784,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "自然风光",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "自然风光",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.462749",
    "updatedAt": "2026-05-07T01:02:13.462749"
  },
  {
    "id": "tour_199",
    "title": "<北京双高或双动6日游>自营倾情打造/纯玩精品，热销4年超4万人选择，故宫全新深度游3H（含珍宝馆），获奖导游精讲慢游，网红餐厅特色体验，观升旗仪式 倾情推出“六心”服务❤行的“舒心”——区别于散拼每天换车换导，全程只安排一个导游，一辆旅游车，一车到底绝不套车，旅游更省心❤玩的“开心”——精选资深 游玩目的地： 北京 行程天数： 6天 交通方式： 高铁二等座/高铁二等座 ¥4017 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "北京",
    "duration": 6,
    "price": 4017,
    "priceUnit": "人",
    "departureDate": "2026-05-20",
    "returnDate": "2026-05-26",
    "transportType": "飞机往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "6早餐5正餐",
    "singleSupplement": 1004,
    "singleSupplementNote": "单人出行需补单房差￥1004，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 16,
    "totalSeats": 31,
    "highlights": [
      "北京必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往北京",
        "description": "今日安排北京精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：北京游览",
        "description": "今日安排北京精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：北京游览",
        "description": "今日安排北京精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：北京游览",
        "description": "今日安排北京精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "第5天：北京游览",
        "description": "今日安排北京精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 6,
        "title": "告别北京，返回温馨的家",
        "description": "今日安排北京精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 3.5,
    "reviewCount": 302,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "自然风光",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "自然风光",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.462749",
    "updatedAt": "2026-05-07T01:02:13.462749"
  },
  {
    "id": "tour_200",
    "title": "<云南-昆明-大理-丽江-香格里拉双飞8日游>自营超4万人出游/5A石林/玉龙雪山大索/印象丽江/双廊旅拍/大理海景房/安宁温泉/洱海骑行 行程天数：8天7晚 成团地点：昆明成团 目的地：昆明 往返交通：飞机/飞机 报名截止时间：团期前1天14点 附加说明： 本行程与 游玩目的地： 大理 昆明 行程天数： 8天 交通方式： 飞机/飞机 ¥2476 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "云南",
    "duration": 8,
    "price": 2476,
    "originalPrice": 2813,
    "priceUnit": "人",
    "departureDate": "2026-06-19",
    "returnDate": "2026-06-27",
    "transportType": "飞机往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "8早餐7正餐",
    "singleSupplement": 619,
    "singleSupplementNote": "单人出行需补单房差￥619，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 17,
    "totalSeats": 37,
    "highlights": [
      "云南必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往云南",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：云南游览",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：云南游览",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：云南游览",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "第5天：云南游览",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 6,
        "title": "第6天：云南游览",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 7,
        "title": "第7天：云南游览",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 8,
        "title": "告别云南，返回温馨的家",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.2,
    "reviewCount": 753,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "海岛度假",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "discountRate": 12,
    "groupSize": "30人常规团",
    "theme": "海岛度假",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.462749",
    "updatedAt": "2026-05-07T01:02:13.462749"
  },
  {
    "id": "tour_201",
    "title": "<海南三亚双飞6日游>错峰甄选0购物，全程连住一线海边酒店，可升海立方/国光/温德姆，呀诺达雨林寻宝&南山观音祈福，奔驰接机/品当地美食 •用餐安排：全程安排指定餐厅用餐，30元/人/餐的标准，围桌餐保证十菜一汤或自助餐•住宿安排：入住三亚阳光大酒店、三亚康年酒店、三亚国光豪生度假酒店，多种酒店及房型供您选择。•游玩安排：景点只去最精的 游玩目的地： 海南 三亚 行程天数： 6天 交通方式： 飞机/飞机 ¥2076 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "三亚",
    "duration": 6,
    "price": 2076,
    "originalPrice": 2413,
    "priceUnit": "人",
    "departureDate": "2026-07-30",
    "returnDate": "2026-08-05",
    "transportType": "飞机往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "6早餐5正餐",
    "singleSupplement": 519,
    "singleSupplementNote": "单人出行需补单房差￥519，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 18,
    "totalSeats": 48,
    "highlights": [
      "三亚必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往三亚",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：三亚游览",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：三亚游览",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：三亚游览",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "第5天：三亚游览",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 6,
        "title": "告别三亚，返回温馨的家",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.1,
    "reviewCount": 525,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "美食之旅",
      "纯玩",
      "品质"
    ],
    "isHot": true,
    "isNew": false,
    "isFlashSale": false,
    "discountRate": 14,
    "groupSize": "30人常规团",
    "theme": "美食之旅",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.462749",
    "updatedAt": "2026-05-07T01:02:13.462749"
  },
  {
    "id": "tour_202",
    "title": "<海南三亚双飞6日游>错峰甄选0购物，全程连住一线海边酒店，可升海立方/国光/温德姆，呀诺达雨林寻宝&南山观音祈福，奔驰接机/品当地美食 •用餐安排：全程安排指定餐厅用餐，30元/人/餐的标准，围桌餐保证十菜一汤或自助餐•住宿安排：入住三亚阳光大酒店、三亚康年酒店、三亚国光豪生度假酒店，多种酒店及房型供您选择。•游玩安排：景点只去最精的 游玩目的地： 海南 三亚 行程天数： 6天 交通方式： 飞机/飞机",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "三亚",
    "duration": 6,
    "price": 30,
    "priceUnit": "人",
    "departureDate": "2026-06-14",
    "returnDate": "2026-06-20",
    "transportType": "飞机往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "6早餐5正餐",
    "singleSupplement": 7,
    "singleSupplementNote": "单人出行需补单房差￥7，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 18,
    "totalSeats": 33,
    "highlights": [
      "三亚必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往三亚",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：三亚游览",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：三亚游览",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：三亚游览",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "第5天：三亚游览",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 6,
        "title": "告别三亚，返回温馨的家",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.5,
    "reviewCount": 234,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "美食之旅",
      "纯玩",
      "品质"
    ],
    "isHot": true,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "美食之旅",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.462749",
    "updatedAt": "2026-05-07T01:02:13.462749"
  },
  {
    "id": "tour_203",
    "title": "<桂林-漓江-阳朔动车3日游>戏耍漓江竹筏 VIP银子岩 爬古东瀑布 花海訾洲 摄影基地相公山 品阳朔啤酒鱼  24h接送 深圳往返 来桂林怎么玩的更高级？专业踩线设计！让您体验真正的船游桂林，放心出游，满分好评，品质保证； 一、我们用心设计：漓江AAAAA景区各段：草坪竹筏—兴坪游船—遇龙河竹筏，精准游览，人生必游20元 游玩目的地： 桂林 阳朔 行程天数： 3天 交通方式： 动车组/动车组 ¥1359 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "桂林",
    "duration": 3,
    "price": 1359,
    "originalPrice": 1617,
    "priceUnit": "人",
    "departureDate": "2026-06-29",
    "returnDate": "2026-07-02",
    "transportType": "大巴往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "3早餐2正餐",
    "singleSupplement": 339,
    "singleSupplementNote": "单人出行需补单房差￥339，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 19,
    "totalSeats": 39,
    "highlights": [
      "桂林必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往桂林",
        "description": "今日安排桂林精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：桂林游览",
        "description": "今日安排桂林精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "告别桂林，返回温馨的家",
        "description": "今日安排桂林精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.5,
    "reviewCount": 248,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "摄影之旅",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "discountRate": 16,
    "groupSize": "30人常规团",
    "theme": "摄影之旅",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.462749",
    "updatedAt": "2026-05-07T01:02:13.462749"
  },
  {
    "id": "tour_204",
    "title": "<桂林-漓江-阳朔动车3日游>戏耍漓江竹筏 VIP银子岩 爬古东瀑布 花海訾洲 摄影基地相公山 品阳朔啤酒鱼  24h接送 深圳往返 来桂林怎么玩的更高级？专业踩线设计！让您体验真正的船游桂林，放心出游，满分好评，品质保证； 一、我们用心设计：漓江AAAAA景区各段：草坪竹筏—兴坪游船—遇龙河竹筏，精准游览，人生必游20元 游玩目的地： 桂林 阳朔 行程天数： 3天 交通方式： 动车组/动车组",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "桂林",
    "duration": 3,
    "price": 20,
    "priceUnit": "人",
    "departureDate": "2026-06-19",
    "returnDate": "2026-06-22",
    "transportType": "大巴往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "3早餐2正餐",
    "singleSupplement": 5,
    "singleSupplementNote": "单人出行需补单房差￥5，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 26,
    "totalSeats": 36,
    "highlights": [
      "桂林必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往桂林",
        "description": "今日安排桂林精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：桂林游览",
        "description": "今日安排桂林精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "告别桂林，返回温馨的家",
        "description": "今日安排桂林精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.1,
    "reviewCount": 107,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "摄影之旅",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "摄影之旅",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.462749",
    "updatedAt": "2026-05-07T01:02:13.462749"
  },
  {
    "id": "tour_205",
    "title": "<昆明+普者黑+弥勒双飞6日游>摄影之旅，高原水乡，三生若梦十里桃花，温泉spa，葡萄美酒，弥勒大佛，2人起订，独立小团 •用餐安排：云南美食，拥有一种藏在山水间的原味，就地取材，却不同食法。料广，色美，型巧，味全，看者胃开，闻者流涎，食者回味……高原红专属菜品，让你的味蕾，从这里开始体验一场真实的美味之旅。•住宿安排： 游玩目的地： 昆明 云南 行程天数： 6天 交通方式： 飞机/飞机 ¥4096 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "云南",
    "duration": 6,
    "price": 4096,
    "priceUnit": "人",
    "departureDate": "2026-07-08",
    "returnDate": "2026-07-14",
    "transportType": "飞机往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "6早餐5正餐",
    "singleSupplement": 1024,
    "singleSupplementNote": "单人出行需补单房差￥1024，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 29,
    "totalSeats": 34,
    "highlights": [
      "云南必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往云南",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：云南游览",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：云南游览",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：云南游览",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "第5天：云南游览",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 6,
        "title": "告别云南，返回温馨的家",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 3.7,
    "reviewCount": 195,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "海岛度假",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "海岛度假",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.462749",
    "updatedAt": "2026-05-07T01:02:13.462749"
  },
  {
    "id": "tour_206",
    "title": "<昆明-大理-丽江双飞6日游>高端酒店/抖音网红酒店，零自费/美食温泉，无人机花海航拍/千古情/洱海骑行/鲜花饼制作，爬西山跃龙门/贵族范 产品概要行程天数：6天5晚成团地点：昆明成团目的地：丽江往返交通：飞机/飞机报名截止时间：团期前2天18点组团形式：联合发团；本产品与其他旅行社联合发团。根据发团需要，本产品在部分行程段发生团友的变化 游玩目的地： 大理 昆明 丽江 云南 行程天数： 6天 交通方式： 飞机/飞机 ¥2876 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "云南",
    "duration": 6,
    "price": 2876,
    "priceUnit": "人",
    "departureDate": "2026-07-07",
    "returnDate": "2026-07-13",
    "transportType": "飞机往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "6早餐5正餐",
    "singleSupplement": 719,
    "singleSupplementNote": "单人出行需补单房差￥719，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 21,
    "totalSeats": 46,
    "highlights": [
      "云南必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往云南",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：云南游览",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：云南游览",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：云南游览",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "第5天：云南游览",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 6,
        "title": "告别云南，返回温馨的家",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.8,
    "reviewCount": 730,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "海岛度假",
      "纯玩",
      "品质"
    ],
    "isHot": true,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "海岛度假",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.462749",
    "updatedAt": "2026-05-07T01:02:13.462749"
  },
  {
    "id": "tour_207",
    "title": "<云南-昆明-大理-丽江双飞6日游>纯玩无购物，玉龙雪山，露天温泉，洱海私人游船，自制鲜花饼体验，亲子蜜月畅游 行程天数：5天4晚成团地点：云南成团目的地：大理往返交通：飞机/飞机报名截止时间：团期前2天18点一米阳光  相隔丽江不远的玉龙雪山脚下，纳西族的人民到了谈婚论嫁的时候，姑娘和小 游玩目的地： 大理 昆明 丽江 云南 行程天数： 5天 交通方式： 飞机/飞机 ¥2970 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "云南",
    "duration": 5,
    "price": 2970,
    "priceUnit": "人",
    "departureDate": "2026-07-11",
    "returnDate": "2026-07-16",
    "transportType": "高铁往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "5早餐4正餐",
    "singleSupplement": 742,
    "singleSupplementNote": "单人出行需补单房差￥742，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 5,
    "totalSeats": 30,
    "highlights": [
      "云南必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往云南",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：云南游览",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：云南游览",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：云南游览",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "告别云南，返回温馨的家",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 3.7,
    "reviewCount": 501,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "海岛度假",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": true,
    "isFlashSale": true,
    "groupSize": "30人常规团",
    "theme": "海岛度假",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.462749",
    "updatedAt": "2026-05-07T01:02:13.462749"
  },
  {
    "id": "tour_208",
    "title": "<云南-大理-丽江双飞5日游>纯玩0购物，揽蓝天入怀，醉饮风花雪月，享温泉时光，俯瞰洱海，三塔祈福，遇见内心深处好的自己 大理：合适的时间遇上适合的人，本就是一场不期而合的宿缘，所以也注定了此行回眸难忘的经久丽江：一片不以江而盛名的古城，一座久远传说中的艳遇之都，一个一生中不得不去的地方之一 游玩目的地： 大理 丽江 云南 行程天数： 5天 交通方式： 飞机/飞机 ¥3389 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "云南",
    "duration": 5,
    "price": 3389,
    "originalPrice": 3683,
    "priceUnit": "人",
    "departureDate": "2026-06-27",
    "returnDate": "2026-07-02",
    "transportType": "高铁往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "5早餐4正餐",
    "singleSupplement": 847,
    "singleSupplementNote": "单人出行需补单房差￥847，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 11,
    "totalSeats": 41,
    "highlights": [
      "云南必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往云南",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：云南游览",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：云南游览",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：云南游览",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "告别云南，返回温馨的家",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 3.6,
    "reviewCount": 223,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "海岛度假",
      "纯玩",
      "品质"
    ],
    "isHot": true,
    "isNew": false,
    "isFlashSale": false,
    "discountRate": 8,
    "groupSize": "30人常规团",
    "theme": "海岛度假",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.462749",
    "updatedAt": "2026-05-07T01:02:13.462749"
  },
  {
    "id": "tour_209",
    "title": "<昆明-大理-丽江-泸沽湖双飞8日游>云南纯玩，昆明进出，神话石林，温泉时光，享视觉**，浅吟五朵金花，格姆女神山，探秘摩梭走婚，全景游 大丽中大理的悠远，丽江的柔软，时光打磨着记忆，若是人间有一处春色让人流连，便是有着七彩之滇的云南。云南得天独厚的自然条件，高原的地理位置，孕育了各地奇特秀丽的山水风光，是我心中的一个梦，优雅、神秘、多 游玩目的地： 大理 昆明 泸沽湖 丽江 云南 行程天数： 8天 交通方式： 飞机/飞机 ¥4130 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "云南",
    "duration": 8,
    "price": 4130,
    "priceUnit": "人",
    "departureDate": "2026-06-26",
    "returnDate": "2026-07-04",
    "transportType": "飞机往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "8早餐7正餐",
    "singleSupplement": 1032,
    "singleSupplementNote": "单人出行需补单房差￥1032，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 28,
    "totalSeats": 43,
    "highlights": [
      "云南必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往云南",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：云南游览",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：云南游览",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：云南游览",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "第5天：云南游览",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 6,
        "title": "第6天：云南游览",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 7,
        "title": "第7天：云南游览",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 8,
        "title": "告别云南，返回温馨的家",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.4,
    "reviewCount": 415,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "海岛度假",
      "纯玩",
      "品质"
    ],
    "isHot": true,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "海岛度假",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.462749",
    "updatedAt": "2026-05-07T01:02:13.462749"
  },
  {
    "id": "tour_210",
    "title": "<云南-昆明-大理-丽江-玉龙雪山双飞6日游>雪山大索道登顶，含震撼印象丽江演出，洱海大游船，一晚五星一晚温泉，下单再减600，2人起订 •住宿安排：昆明温泉酒店+大理温泉+丽江客栈；默认安排标间双人床，如需大床房请提前备注，只能尽量安排不能保证。三人出游可以保证安排三人间或者加床。 游玩目的地： 大理 昆明 丽江 云南 行程天数： 6天 交通方式： 飞机/飞机 ¥2140 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "云南",
    "duration": 6,
    "price": 2140,
    "originalPrice": 2578,
    "priceUnit": "人",
    "departureDate": "2026-06-21",
    "returnDate": "2026-06-27",
    "transportType": "飞机往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "6早餐5正餐",
    "singleSupplement": 535,
    "singleSupplementNote": "单人出行需补单房差￥535，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 24,
    "totalSeats": 34,
    "highlights": [
      "云南必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往云南",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：云南游览",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：云南游览",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：云南游览",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "第5天：云南游览",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 6,
        "title": "告别云南，返回温馨的家",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.2,
    "reviewCount": 663,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "海岛度假",
      "纯玩",
      "品质"
    ],
    "isHot": true,
    "isNew": false,
    "isFlashSale": false,
    "discountRate": 17,
    "groupSize": "30人常规团",
    "theme": "海岛度假",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.462749",
    "updatedAt": "2026-05-07T01:02:13.462749"
  },
  {
    "id": "tour_211",
    "title": "<云南-大理-丽江双飞6日游>纯玩0购物，大理6大网红场景/含十张精修照片，天然温泉/花之城豪生大酒店/古城客栈，15道云南小吃/手抓饭 •用餐安排：傣族原味手抓饭，丽江纳西马帮菜，大理白族风味餐•住宿安排：昆明花之城毫生大酒店（美国温德姆旗下高端度假酒店），楚雄室内外温泉酒店，丽江入住四星客栈•游玩安排：精选大理6大网红场景，没组游客 游玩目的地： 大理 丽江 云南 昆明 行程天数： 6天 交通方式： 飞机/飞机 ¥3215 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "云南",
    "duration": 6,
    "price": 3215,
    "priceUnit": "人",
    "departureDate": "2026-05-14",
    "returnDate": "2026-05-20",
    "transportType": "飞机往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "6早餐5正餐",
    "singleSupplement": 803,
    "singleSupplementNote": "单人出行需补单房差￥803，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 7,
    "totalSeats": 42,
    "highlights": [
      "云南必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往云南",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：云南游览",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：云南游览",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：云南游览",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "第5天：云南游览",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 6,
        "title": "告别云南，返回温馨的家",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 3.6,
    "reviewCount": 207,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "海岛度假",
      "纯玩",
      "品质"
    ],
    "isHot": true,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "海岛度假",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.462749",
    "updatedAt": "2026-05-07T01:02:13.462749"
  },
  {
    "id": "tour_212",
    "title": "<昆明-大理-丽江双高6日游>0购物，*系花园客栈，温泉spa，奔驰smart自驾/别克GL8环洱海旅拍，花海BBQ，丽江1天DIY 产品概要行程天数：6天5晚成团地点：昆明成团目的地：大理往返交通：高铁二等座/高铁二等座报名截止时间：团期前1天20点附加说明：根据发团需要。行程中将换当地用车或换当地导游。如遇出行当天人数不足10人 游玩目的地： 大理 昆明 丽江 行程天数： 6天 交通方式： 高铁二等座/高铁二等座 ¥3009 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "云南",
    "duration": 6,
    "price": 3009,
    "originalPrice": 3907,
    "priceUnit": "人",
    "departureDate": "2026-08-04",
    "returnDate": "2026-08-10",
    "transportType": "飞机往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "6早餐5正餐",
    "singleSupplement": 752,
    "singleSupplementNote": "单人出行需补单房差￥752，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 26,
    "totalSeats": 41,
    "highlights": [
      "云南必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往云南",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：云南游览",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：云南游览",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：云南游览",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "第5天：云南游览",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 6,
        "title": "告别云南，返回温馨的家",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.2,
    "reviewCount": 687,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "海岛度假",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "discountRate": 23,
    "groupSize": "30人常规团",
    "theme": "海岛度假",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.462749",
    "updatedAt": "2026-05-07T01:02:13.462749"
  },
  {
    "id": "tour_213",
    "title": "<成都+西岭雪山+安仁古镇4日游>越野商务车出行，2至6人小团，指定入住锦泰温泉酒店，含花水湾温泉 线路【住宿问题】指定入住花水湾锦泰温泉酒店，入住酒店国旅上均有图片及评价，预定前可参考。【购物问题】全程没有任何购物店，沿途加油站，服务区的店不属于旅行购物店范畴，请不要混淆。 【服务升级】 游玩目的地： 成都 行程天数： 4天 交通方式： 飞机/飞机 ¥4362 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "四川",
    "duration": 4,
    "price": 4362,
    "priceUnit": "人",
    "departureDate": "2026-07-22",
    "returnDate": "2026-07-26",
    "transportType": "高铁往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "4早餐3正餐",
    "singleSupplement": 1090,
    "singleSupplementNote": "单人出行需补单房差￥1090，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 5,
    "totalSeats": 40,
    "highlights": [
      "四川必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往四川",
        "description": "今日安排四川精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：四川游览",
        "description": "今日安排四川精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：四川游览",
        "description": "今日安排四川精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "告别四川，返回温馨的家",
        "description": "今日安排四川精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 3.7,
    "reviewCount": 789,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "海岛度假",
      "纯玩",
      "品质"
    ],
    "isHot": true,
    "isNew": true,
    "isFlashSale": true,
    "groupSize": "30人常规团",
    "theme": "海岛度假",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.462749",
    "updatedAt": "2026-05-07T01:02:13.462749"
  },
  {
    "id": "tour_214",
    "title": "<泰国曼谷-芭提雅5晚6日游>爸妈舒心游/0购物0自费/专属用车/**导游/黄金屋/人妖秀/大船出海/四面佛/微管家保驾护航 【海岛风情】快艇出海沙美岛，感受如面粉一样细嫩的海沙，尽享南国热带的海洋魅力【精选酒店】全程入住四星品质酒店，跟团也享舒适好睡眠【本地美食】76楼国际自助餐，泰国风味餐，寻找泰国市场美食【精彩泰国】安 游玩目的地： 泰国 行程天数： 6天 交通方式： 飞机/飞机 ¥2327 起 查看详情 <泰国-普吉岛6日游>深圳直飞，3岛连游含浮潜，网红大自然餐厅 ，神仙半岛醉美日落，体验地道泰式按摩，4晚海边酒店 ★【优选资源】：不是价格至低，却是性价比至高的★【精选美食】：大自然缝纫机餐厅品尝当地芒果糯米饭★【酒店安排】：任性安排2晚国际五星酒店+2晚精品酒店★【五岛连游】：大小PP岛，珊瑚岛，神仙半岛，帝王 游玩目的地： 泰国 普吉岛 行程天数： 6天 交通方式： 飞机/飞机 ¥3273 起 查看详情 <德国+法国+瑞士+荷兰4国10日游>海航直飞欧洲，度假胜地琉森，保证拼房，无强制自费，全国联运 ☆【海南航空】Skytrax五星级航空直飞苏黎世；☆【莱茵瀑布】欧洲第一大瀑布；☆【法兰克福】欧洲金融之都；☆【阿姆斯特丹】畅游“北方威尼斯”；☆【布鲁塞尔大广场】参观欧洲最美的广场之一；☆【巴黎】 游玩目的地： 法国 荷兰 行程天数： 10天 交通方式： 飞机/飞机 ¥5029 起 查看详情 <美国东西岸+黄石+羚羊彩穴+夏威夷17-20日游>本土纯玩臻品,保证拼房/拒签无忧,大峡谷/大提顿/大瀑布,圣地亚哥,羚羊彩穴/马蹄湾,部分城市立减千元 银联返现活动1、活动时间：9.110.312、活动对象：持境内发行银联卡的国旅会员（卡号以62开头）3、活动内容：活动期间，国旅会员持62开头的银联卡（卡号以62开头）成功注册活动，并且：①在境外（不 游玩目的地： 加拿大 美国 墨西哥 行程天数： 12天 交通方式： 飞机/飞机 ¥21480 起 查看详情 <巴厘岛6或7日游>深圳直飞0购物千人出游，RIMAB屋顶天空下午茶，蓝梦岛恶魔眼泪，贝妮达岛浮潜 / 独木舟/海边秋千，精油Spa 游玩目的地： 巴厘岛 行程天数： 6天 交通方式： 飞机/飞机 ¥4129 起 查看详情 <迪拜+阿布扎比6日游>去程A380，全程国五，沙漠冲沙，棕榈岛缆车，火锅餐，阿拉伯餐，阿联酋航空，香港直飞 A行程搭乘阿联酋航空客机香港直航往返，不转机，去程A380！畅游阿联酋两大酋长国：迪拜、阿布扎比！宗教与文化的碰撞：扎耶德清真寺，迪拜博物馆等经典景点！2017年全新开幕的阿布扎比卢浮宫博物馆！览古镇 游玩目的地： 迪拜 阿联酋 行程天数： 6天 交通方式： 飞机/飞机 ¥5439 起 查看详情 <土耳其8-10日游>深圳集合，土航直飞，四飞，全程五星，一晚卡帕多奇亚洞穴酒店，棉花堡温泉酒店，安塔利亚，船游博斯普鲁斯海峡 ：【航空公司】：乘坐土耳其航空TK客机往返，四飞，舒适快捷!【品质住宿】：卡帕多奇亚洞穴酒店+伊斯坦布尔国际五星；棉花堡温泉酒店；；库萨达斯/安塔利亚海边酒店；【饮食】：棉花堡烤羊肉餐；卡帕多奇亚洞 游玩目的地： 土耳其 行程天数： 8天 交通方式： 飞机/飞机 ¥13965 起 查看详情 <土耳其12天游>香港直飞，2晚卡帕，烤鱼餐/瓦罐焖肉，全程车载WIFI，番红花城，图兹盐湖，温泉酒店，伊斯坦布尔一天自由活动，土耳其航空 【航空公司】土耳其国家航空公司，香港直飞往返航班，更好的服务与更简便的出行。【优质酒店】全程选用舒适酒店，不给您旅程任何不满的理由。 游玩目的地： 土耳其 安哥拉 行程天数： 12天 交通方式： 飞机/飞机 ¥7753 起 查看详情 <日本北海道5日游>当季预售 游童趣哆啦A梦乐园 登别海洋乐园 赏富良野花田 乘花田农耕车 尝薰衣草冰淇淋 品北海道三大蟹 2晚温泉 特别安排特别安排：富良野花田任吃香甜蜜瓜或时令水果+搭乘花田农耕车+薰衣草冰淇淋登别尼克斯海洋公园展示了大约350种11,000只海洋生物，国王企鹅大游行小樽运河、八音盒展览馆弥漫着浪漫的味道、电影情 游玩目的地： 日本 行程天数： 5天 交通方式： 飞机/飞机 ¥9314 起 查看详情 <土耳其8日游>土航直飞内陆双飞，全程五星，含博斯普鲁斯海峡游船，爱琴**中海海边/特色温泉酒店，洞穴瓦罐餐，烤鱼餐，可提前预定热气球 ♥最美看点♥♥精选住宿♥：全程五星酒店♥经典荟萃♥：含博斯普鲁斯海峡游船 ♥美食♥：卡帕多奇亚洞穴饭店瓦罐餐，伊斯坦布尔马尔马拉海景餐厅烤鱼餐，棉花堡中途享用土耳其烤羊肉餐，席林斯小镇水果酒 游玩目的地： 土耳其 行程天数： 8天 交通方式： 飞机/飞机 ¥9048 起 查看详情 <澳大利亚凯恩斯墨尔本10日游>深圳直飞澳洲 游船上享用西式晚餐、出海捉泥蟹、观看剪羊毛表演  凯恩斯世界遗产 花园城市墨尔本 产品概要行程天数：10天8晚成团地点：深圳成团目的地：凯恩斯往返交通：飞机/飞机报名截止时间：团期前20天18点接待标准•用餐安排：一般早餐为酒店西式，中式午晚餐六菜一汤或当地餐;•住宿安排：澳洲境内 游玩目的地： 澳大利亚 凯恩斯 行程天数： 10天 交通方式： 飞机/飞机 ¥13669 起 查看详情 <荷兰+比利时+法国11-12日游>广州出发，全程四星，漫画博物馆，风车村，奥塞美术馆，荷兰森林公园，品网红甜品，自由活动，全程wifi 线路：广州打指纹，专人陪同。1.舒适旅程：精选比利时航空公司客机，往返直飞避免转机的奔波与疲劳；2.星级享受：全程安排四星酒店，特别升级一晚夜宿羊角村，享受更舒适的住宿服务；3.服务升级：赠送奶酪王国 游玩目的地： 荷兰 天海邮轮 比利时 行程天数： 10天 交通方式： 飞机/飞机 ¥23053 起 查看详情 <土耳其12日游>可升热气球/洞穴，特色瓦罐餐/卡帕惬意连住，海底隧道列车，A线长寿之乡，B线番红花城，香港QR 春节班期特别赠送卡帕多奇亚katpatuka泥浴项目升级安排伊斯坦布尔海景餐厅烤肉餐升级安排中餐升级10菜一汤土耳其主色调神秘的蓝眼睛饰品 肃穆的蓝色清真寺醉人的蓝色地中海“对于土耳其：如果 游玩目的地： 土耳其 土耳其 行程天数： 12天 交通方式： 飞机/飞机 ¥6640 起 查看详情 <巴厘岛-新加坡5晚6日游>深圳直飞 全程五星酒店 蓝梦岛金银岛双岛出海 丛林大秋千 网红鸟巢 环球影城 国立大学 牛车水  仅2站购物 精选航班搭乘新加坡航空客机，体验空中五星服务，深圳往返，方便快捷！必玩景点不能放过巴厘岛：安排蓝梦岛出海，全新开业的蓝梦岛海边俱乐部及水上活动中心，畅享蓝梦水世界！安排皇家别墅下午茶，360℃热带雨林 游玩目的地： 新加坡 巴厘岛 行程天数： 6天 交通方式： 飞机/飞机 ¥8570 起 查看详情 <新西兰南北岛9日游>纯净游/深圳直飞/鲁冰花灿烂的季节/指环王取景地/瓦纳卡湖/伊甸山/罗托鲁亚湖/皇后镇/毛利文化村/喂羊驼 产品概要行程天数：9天7晚成团地点：深圳成团目的地：基督城往返交通：飞机/飞机报名截止时间：团期前15天18点特别优惠<新西兰纯南岛四飞9日游>深圳直飞，0购物，鲁冰花灿烂的季节， 游玩目的地： 新西兰 行程天数： 9天 交通方式： 飞机/飞机 ¥29329 起 查看详情 <以色列约旦9天游>深圳集合，死海漂浮，巴哈伊空中花园，耶路撒冷，船游加利利湖，车游瓦地伦，特色烤鱼餐 行程行程亮点：乘坐世界公认安全的航空公司以色列航空LY（深圳起，香港止）七彩流溢:船游加利利湖全球海拔至低点死海漂浮三教圣城:耶路撒冷神宗圣教:天使报喜堂伯利恒主诞教堂圣墓教堂苦路14站 游玩目的地： 以色列 行程天数： 9天 交通方式： 飞机/飞机 ¥19199 起 查看详情 <**全景深度-克鲁克+花园大道10日游>深圳集合，反季出行避暑好去处，花园大道，香槟日落，酒庄酒店，醉美南非 【金牌全景深度南非】亮点汇聚，应接不暇【著名城市一览】南半球最大的奢华娱乐中心太阳城【无限亲近自然】南非最大的野生动物保护区克鲁克国家公园、海豹岛、企鹅海滩感受地球生灵的其妙！【自然美景尽收】 游玩目的地： 南非 行程天数： 10天 交通方式： 飞机/飞机 ¥17292 起 查看详情 <彩虹之旅花园大道9日游>深圳集合，反季出行避暑好去处，花园大道，香槟日落，酒庄酒店，醉美南非 【畅游两大首都】比勒陀利亚（茨瓦内）、开普敦【领略经典岁月】约翰内斯堡、太阳城蕴藏历史文化，花园大道（奈斯纳+摩梭湾）【用心甄选酒店】非洲茅草屋顶酒店+约堡/开普敦四星酒店+花园大道四星酒店【晨游百年 游玩目的地： 南非 行程天数： 9天 交通方式： 飞机/飞机 ¥17814 起 查看详情 <南非9日游>深圳集合，含省时内陆飞，人间天路花园大道，特色风情酒店，品南非特色餐，A线信号山品香槟，B线观赏lesidi民俗村 A行程安排开普敦信号山品尝香槟，俯瞰开普敦市容；开普敦不容错过的美景之一【白色海滩】；【马来人文化街】，感受古老的文化气息与五颜六色的小房子B行程安排于lesidi民俗文化村，观赏独具当地的五大民族； 游玩目的地： 南非 行程天数： 9天 交通方式： 飞机/飞机 ¥11318 起 查看详情 <迪拜-阿布扎比6日游>香港直飞，畅游四个酋长国，迪拜奇迹花园，特别安排亚特兰蒂斯除夕夜安排丰盛跨年大餐 ：搭乘五星豪华阿联酋航空，香港直飞迪拜，享受舒适空中服务，体验空客A380大客机观多项世界之醉，领略奢华迪拜的魅力，感受当地风土人情，畅游四个酋长国：迪拜海湾上的明珠，阿拉伯联合酋长国第二大酋长国&n 游玩目的地： 迪拜 行程天数： 6天 交通方式： 飞机/飞机 ¥11531 起 查看详情 <新加坡4晚5日半自助游>深圳（香港）直飞 周末我在新加坡  全程四星酒店 纯玩无购物 两天自由活动 鱼尾狮 哈芝巷 滨海湾花园 倾情推荐纯玩保证：保证全程无任何指定购物点，无任何额外收费自费项目，更多游览观光休闲时间精选酒店：新加坡华星酒店或曼尔洛酒店或备选酒店。黄金航班：新加坡航空旗下胜安航空，享受一流空中服务，丰盛餐饮免费 游玩目的地： 新加坡 行程天数： 5天 交通方式： 飞机/飞机 ¥4097 起 查看详情 <新加坡4晚5日美食之旅游>香港直飞  鱼尾狮公园 滨海湾花园 克拉码头游船 乌节路 新加坡金沙*** 空中花园  娘惹体验馆 海洋馆 选择新加坡的八大理由:理由之一：新加坡是公认安全系数高，犯罪率低之一的国家，安全放心。理由之二：环境与食物极其卫生，文化和语言方面的共通，是东南亚中适合老人和小孩出游的国家理由之三：行程拒绝常规团队“ 游玩目的地： 新加坡 行程天数： 5天 交通方式： 飞机/飞机 ¥6959 起 查看详情 <美国-加拿大东西海岸17日游>深圳集中 加航直飞 美加东西海岸大环游  史丹利公园 自由女神游船 布查德花园 17里湾 丹麦村 ◆经典之旅自由女神游船，17里湾，布查德花园，尼亚加拉大瀑布，圣地亚哥一日游；◆增游美西旅游城市金融中心旧金山；◆沿加州一号公路欣赏绝美的太平洋海岸风光；◆游览充满丹麦风情的丹麦村，独具西西 游玩目的地： 行程天数： 17天 交通方式： 飞机/飞机 ¥22136 起 查看详情 <巴厘岛+新加坡5晚6日游>玩转双城 深圳去港回 蓝梦岛 金银岛双岛游  圣淘沙名胜世界 滨海湾花园 鱼尾狮公园 精华摘要巴厘岛——南纬8度的度假天堂；新加坡——时尚精尖的亚洲都会；纯朴·摩登·双城体验·为你开启！航班搭乘新加坡航空或圣安航空客机，全球最佳航空公司之一，体验空中五星服务。巴厘岛安排蓝梦岛+贝尼达 游玩目的地： 新加坡 巴厘岛 行程天数： 6天 交通方式： 飞机/飞机 ¥3511 起 查看详情 <以色列约旦10日游>国泰航空/香港直飞/圣城耶路撒冷/杰拉什古城/佩特拉古城/巴哈伊花园/红海/死海升级五星酒店/游船畅游加利利湖 ≈≈≈≈≈≈≈≈≈≈≈≈≈≈★★≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈★国泰航空公司，香港直飞特拉维夫，免除转机所带来的旅途疲劳。★全程当地酒店，死海、红海免费升级五星酒店。★特别体验：游船畅游澈彻明净的加利 游玩目的地： 以色列 行程天数： 10天 交通方式： 飞机/飞机 ¥13904 起 查看详情 <泰国-曼谷-芭堤雅4晚5日游>深圳往返、含导服费、 龙虎园、大皇宫玉佛寺、芭堤雅出海、海鲜升级、娜通花园餐厅，美食一网打尽 产品详情❤行程秒懂❤✿【行程】经典全览大皇宫、玉佛寺、热带水果园、泰式古法按摩、骑大象等；东芭乐园、双岛连游、神殿寺；✿【人气美食】泰式风味餐、印象暹罗自助餐、海鲜餐升级、芭堤雅音乐渔村、平均餐标 游玩目的地： 泰国 行程天数： 5天 交通方式： 飞机/飞机 ¥2325 起 查看详情 <新加坡双飞4晚5日半自助游>送乳胶枕，全新上线，可联运，2天自由活动，含新加坡游船，滨海湾花园，可配联运，4星酒店 体验贯穿于整个城市的新加坡河是新加坡的生命之河，乘游船观赏新加坡的城市风光。 游玩目的地： 新加坡 行程天数： 5天 交通方式： 飞机/飞机 ¥3694 起 查看详情 <迪拜-土耳其12日游>香港直飞，谢赫扎耶德大清真寺，地中海，爱琴海双海寻梦，以弗所古城、棉花堡、卡帕多奇亚，热气球 ：住宿：番红花城安排入住民宿，入住五星酒店，特别安排1晚卡帕多奇亚洞穴酒店，棉花堡1晚温泉酒店美景：亚欧大陆在此交汇，地中海，爱琴海双海寻梦，天然奇景棉花堡，外星美景卡帕多奇亚迪拜城市游览，领 游玩目的地： 安哥拉 行程天数： 13天 交通方式： 飞机/飞机 ¥9919 起 查看详情 <迪拜-土耳其13日游>迪拜博物馆、圣索非亚大教堂、蓝色清真寺、地中海，爱琴海双海寻梦，天然奇景棉花堡，外星美景卡帕多奇亚 ：住宿：番红花城安排入住民宿，入住五星酒店，特别安排1晚卡帕多奇亚洞穴酒店，棉花堡1晚温泉酒店美景：亚欧大陆在此交汇，地中海，爱琴海双海寻梦，天然奇景棉花堡，外星美景卡帕多奇亚迪拜城市游览，领 游玩目的地： 安哥拉 行程天数： 13天 交通方式： 飞机/飞机 ¥8289 起 查看详情 <俄罗斯-莫斯科+圣彼得堡9日游>南航深圳直飞，团队免签，冬宫，彼得保罗要塞，夏宫花园，圣三一教堂 &n 游玩目的地： 俄罗斯 瑞典 行程天数： 9天 交通方式： 飞机/飞机 ¥5292 起 查看详情 <新西兰南北岛4飞9日游>纯净游/深圳直飞/鲁冰花灿烂的季节/指环王取景地/瓦纳卡湖/伊甸山/罗托鲁亚湖/皇后镇/毛利文化村/喂羊驼 产品概要行程天数：9天7晚成团地点：深圳成团目的地：基督城往返交通：飞机/飞机报名截止时间：团期前15天17点重要提示新西兰旅游温馨小提示语言：新西兰的官方语言为英语，各大商场和酒店都有通晓各国语言 游玩目的地： 新西兰 行程天数： 9天 交通方式： 飞机/飞机 ¥16716 起 查看详情 <新西兰纯南岛4飞9日游>美食美景纯玩无购物/深圳直飞/鲁冰花灿烂的季节/好牧羊人教堂/淘金小镇箭镇/米尔福德峡湾/蓝眼企鹅/库克山/特色美食 产品概要行程天数：9天7晚成团地点：深圳成团目的地：基督城往返交通：飞机/飞机报名截止时间：团期前15天17点重要提示新西兰旅游温馨小提示语言：新西兰的官方语言为英语，各大商场和酒店都有通晓各国语 游玩目的地： 新西兰 行程天数： 9天 交通方式： 飞机/飞机 ¥20329 起 查看详情 <天竺韵印度6-8日游>深起港止/全程无自费/不进店/泰姬陵/阿格拉堡/莲花庙/琥珀堡/登纳哈加尔堡俯瞰斋普尔/瑜伽体验/赏歌舞剧 【甄选航班】：印度捷特航空印度五星航空公司，享受优质机舱服务和空中美食【尊享舒适】：全程五星酒店，升级2晚国际五星，享受安逸舒适的住宿体验。【黄金组合】：印度经典闻名“金三角”：新德里、阿格拉、斋普尔 游玩目的地： 印度 行程天数： 6天 交通方式： 飞机/飞机 ¥4978 起 查看详情 <土耳其12日游>可升热气球/洞穴，特色瓦罐餐/卡帕惬意连住，海底隧道列车，A线长寿之乡，B线番红花城，香港QR 重要提示蓝色清真寺官方发布通知：3月1日至5月15日蓝色清真寺将关闭维修，届时此景点将改为外观，如若情况允许并就近安排当天开门的其他清真寺，具体以境外实际安排为准，烦请注意此通知，谢谢！土耳其主色调神 游玩目的地： 安哥拉 行程天数： 12天 交通方式： 飞机/飞机 ¥6960 起 查看详情 <越南-河内--陆龙湾-下龙湾5日游>深圳直飞、全程四星带泳池酒店、单人保证拼房、莲花海鲜自助餐、含无限流量卡、含签证费 产品概要行程天数：5天3晚成团地点：深圳成团目的地：河内往返交通：飞机/飞机报名截止时间：团期前3天18点接待标准•用餐安排：全程当地美食体验，特别安排莲花海鲜自助餐•住宿安排：全程四星酒店•行程安排 游玩目的地： 越南 行程天数： 5天 交通方式： 飞机/飞机 ¥1729 起 查看详情 <日本东京-富士山-京都-大阪6日游>本州赏花 富士山芝樱祭 招财猫圣地 富士急乐园嗨玩 温泉旅馆 日式烤肉 相扑火锅 产品概要行程天数：6天5晚成团地点：深圳成团目的地：大阪往返交通：飞机/飞机报名截止时间：团期前15天0点接待标准•用餐安排：优质美食大放送：温泉会席料理、相扑火锅、蟹道乐、京都料理、日式烤肉•住宿 游玩目的地： 日本 名古屋 行程天数： 6天 交通方式： 飞机/飞机 ¥6203 起 查看详情 <俄罗斯双首都+谢镇9天游>南方航空 正点航班  广州起止 29人小团 爱国者公园 红场 冬宫 巴普诺夫森林公园 产品概要行程天数：8天6晚成团地点：广州成团目的地：莫斯科往返交通：飞机/飞机报名截止时间：团期前6天18点接待标准•用餐安排：两顿俄罗斯风味餐+中餐（餐标10美金）满足你的味蕾•住宿安排：全程舒适酒 游玩目的地： 俄罗斯 法国 瑞典 芬兰 行程天数： 8天 交通方式： 飞机/飞机 ¥10069 起 查看详情 <新加坡机票+当地5晚6日游>自营童趣狮城 品途专线 1单1团纯玩0购物，圣淘沙环球影城，SEA海洋馆，花芭山缆车，摩天轮，夜间动物园，半自助畅玩坡er县 •用餐安排：Day4特别赠送花芭山午餐一顿。•住宿安排：新加坡酒店任选，详见前台。•行程安排：1、半自助行程，轻松自由，张弛有度。2、安排13座小车+中文司机，专车游览，舒适不拼团。•游玩安排：一次玩 游玩目的地： 新加坡 行程天数： 6天 交通方式： 自行安排/自行安排 ¥6218 起 查看详情 <俄罗斯双城9日游>广州EO直飞，双点进出，不走回头路，冬宫博物馆，夏宫花园，卢日尼基足球场，谢尔盖耶夫镇，莫斯科大学，保证拼房 【航班优选】中国南方航空公司，深圳直飞，安全舒适，告别转机航班，让你轻松倒时差【酒店安排】全程入住舒适酒店，干净舒适❤❤❤❤❤❤❤❤❤❤❤❤❤❤❤❤❤【精彩行程】❤❤ 游玩目的地： 俄罗斯 行程天数： 9天 交通方式： 飞机/飞机 ¥8369 起 查看详情 <泰国曼谷-芭提雅6日游>乐开花爸妈游，深圳直飞0自费，安排三天午休，建立儿女微信群，大皇宫，水果园，56楼自助餐，东芭乐园，含泰国电话卡 行程◆专属于爸爸妈妈的旅游团，：『贴心安排1』六天行程三天午休，旅游休息两不误；『贴心升级2』建立儿女微信群，每日领队及时汇报，让家人放心、安心，老人家开心。◆：行程安排丰富，让您的旅途轻松、悠闲，充 游玩目的地： 泰国 行程天数： 6天 交通方式： 飞机/飞机 ¥4912 起 查看详情 <新加坡+民丹岛机票+当地4晚5日游>4人立减1500/单，0自费0购物，2人即可成行，圣淘沙，鱼尾狮公园，2晚新加坡网红酒店，双重体验 行程天数：5天4晚成团地点：新加坡成团目的地：新加坡往返交通：飞机/飞机报名截止时间：团期前4天18点 游玩目的地： 新加坡 行程天数： 5天 交通方式： 飞机/飞机 ¥6066 起 查看详情 <花少同款漫游英国机票+当地8晚10日游>爱丁堡、牛津、温德米尔湖区、三大古堡、爱丁堡城堡、温莎城堡、华威城堡，伦敦深度，全景环游不列颠 全景：纵览英格兰、苏格兰，花少推荐必游体验，全面畅游英伦美景；贴心：含首尾伦敦希斯罗机场34星酒店，全程含自助早餐，当地参团便捷，中文导游&外籍司机；文化之旅：莎士比亚出生地斯特拉福德小镇，世 游玩目的地： 英国 行程天数： 10天 交通方式： 飞机/飞机 ¥9888 起 查看详情 <北欧丹麦+挪威+芬兰+瑞典10日-13日游>哥本哈根进出童话王国哥本哈根，古老都城奥斯陆，A、B线幸福小镇德拉厄，C线双极光 •用餐安排：全程共含8顿正餐，中式午晚餐（5菜1汤）,810人一桌，具体用餐次数详见行程，不含餐部分敬请客人自理。（退餐标准为10欧/人/餐）•住宿安排：当地标准酒店双人间5晚(含西式早餐)，游轮2晚 游玩目的地： 丹麦 瑞典 芬兰 挪威 行程天数： 10天 交通方式： 飞机/飞机 ¥7729 起 查看详情 <泰国-清迈机票+当地4晚5日游>住1晚拜县  纯玩1 单1团 小黄屋 湖畔花园餐厅 美莎大象营 黑白庙游 赠泰国电话卡 介绍◆【闪耀亮点】打破常规、绝无套路、纯玩、无自费；2人起独立成团，①单①团不拼其它客人，专车+中文专导！◆【超强实力】泰国自己的地接社、保证纯玩、全程中文导游，24小时中文微信管家服务、无需担心语 游玩目的地： 泰国 公主邮轮 行程天数： 5天 交通方式： 自行安排/自行安排 ¥4430 起 查看详情 <莫斯科圣彼得堡机票+当地6晚8日游>全国出发，克宫，红场，新圣女公墓，亚历山大花园，冬宫，彼得夏宫，纯玩无购物 产品概要行程天数：8天6晚成团地点：莫斯科成团目的地：莫斯科往返交通：飞机/飞机报名截止时间：团期前20天0点接待标准•用餐安排：提供酒店自助式早餐和中式及俄式的午晚餐•住宿安排：提供当地酒店•行程安 游玩目的地： 行程天数： 8天 交通方式： 飞机/飞机 ¥11160 起 查看详情 <新马机票+当地5日游>全新上线，0购物0自费，4成人起订成团，新加坡团签，畅游新加坡花园城市，云顶高原，吉隆坡双峰塔 产品概要行程天数：5天4晚目的地：新加坡往返交通：飞机/飞机报名截止时间：团期前5天18点接待标准•用餐安排：全程餐标100元/位精心安排当地美食：黑胡椒螃蟹、海南鸡饭、养生肉骨茶、奶油虾、马来风光、 游玩目的地： 新加坡 行程天数： 5天 交通方式： 飞机/飞机 ¥8376 起 查看详情 <马来西亚仙本那机票+当地5晚6日游>渔乐海钓/跳岛游、深潜，花样玩法，沉底海钓/深海铁板钓，可升海底漫步/红树林，含电话卡插头/咬嘴 预定须知1、本产品需现询，二次确认，无法直接签约，请签约前咨询客服，为了顺利出签，方便安排行程，请于下单后2日内提供签证资料、快递地址（方便我们快递电话卡、充电转换插头），敬请谅解~3、★★★航 游玩目的地： 马来西亚 行程天数： 6天 交通方式： 飞机/飞机 ¥5327 起 查看详情 <莫斯科+圣彼得堡+双飞6晚8天游>北京直飞、可配联运、金环谢镇、克林姆林宫、俄罗式特色餐、红场、叶宫、夏宫花园 行程精选优质航班中国国际航空公司北京直飞莫斯科；前往世界四大博物馆之一的冬宫，细数俄罗斯举世无双的艺术瑰宝；前往有“俄罗斯的凡尔赛”之称的夏宫花园，畅游气势磅礴的大沙皇后花园；特别安排前往俄罗 游玩目的地： 行程天数： 8天 交通方式： 飞机/飞机 ¥7679 起 查看详情 <泰国曼谷-芭提雅-普吉岛-清迈机票+当地12日游>海岛游/黑白庙泰国双重体验，曼芭跟团，普清mini小团、DIY出行/花样升级包，含电话卡 泰国落地签免签证费★行程亮点：1.全程无自费，私属旅程，完美搭配。2.安排海滨魅力芭提雅海边酒店三晚。3.特别安排国家海洋公园罗勇沙美岛行程，精华绝不遗漏。4.安排一天半自由活动时间，放慢脚步，细 游玩目的地： 普吉岛 泰国 巴厘岛 天海邮轮 行程天数： 12天 交通方式： 飞机/飞机 ¥6912 起 查看详情 <泰国曼谷-芭提雅-苏梅岛机票+当地9日游>苏梅mini小团/花样升级包享蜜月之旅，0自费，四星住宿，芭提雅快艇出海/升级泳池别墅，含电话卡 泰国落地签免签证费◆行程亮点：打破常规、绝无套路、曼谷芭提雅跟团、苏梅岛DIY度假、一次玩转泰国曼谷、芭堤雅、苏梅岛三大风情名城，经典景点一网打尽！省时、省钱、省心！1、【芭提雅步行街】这是芭提雅出 游玩目的地： 泰国 苏梅岛 行程天数： 9天 交通方式： 飞机/飞机 ¥5996 起 查看详情 旅游选海外国旅有保障 品质保证 AAAAA级旅行社 旅游局认证 深圳旅游局认证 先行赔付 签约付款安全无忧 退款保障 3个工作日内退款保障 出境旅游旅游攻略",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "云南",
    "duration": 6,
    "price": 2327,
    "priceUnit": "人",
    "departureDate": "2026-05-24",
    "returnDate": "2026-05-30",
    "transportType": "飞机往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "6早餐5正餐",
    "singleSupplement": 581,
    "singleSupplementNote": "单人出行需补单房差￥581，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 22,
    "totalSeats": 37,
    "highlights": [
      "云南必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往云南",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：云南游览",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：云南游览",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：云南游览",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "第5天：云南游览",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 6,
        "title": "告别云南，返回温馨的家",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.1,
    "reviewCount": 444,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "海岛度假",
      "纯玩",
      "品质"
    ],
    "isHot": true,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "海岛度假",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.463749",
    "updatedAt": "2026-05-07T01:02:13.463749"
  },
  {
    "id": "tour_215",
    "title": "<泰国曼谷-芭提雅5晚6日游>爸妈舒心游/0购物0自费/专属用车/**导游/黄金屋/人妖秀/大船出海/四面佛/微管家保驾护航 【海岛风情】快艇出海沙美岛，感受如面粉一样细嫩的海沙，尽享南国热带的海洋魅力【精选酒店】全程入住四星品质酒店，跟团也享舒适好睡眠【本地美食】76楼国际自助餐，泰国风味餐，寻找泰国市场美食【精彩泰国】安 游玩目的地： 泰国 行程天数： 6天 交通方式： 飞机/飞机 ¥2327 起 查看详情 <泰国-普吉岛6日游>深圳直飞，3岛连游含浮潜，网红大自然餐厅 ，神仙半岛醉美日落，体验地道泰式按摩，4晚海边酒店 ★【优选资源】：不是价格至低，却是性价比至高的★【精选美食】：大自然缝纫机餐厅品尝当地芒果糯米饭★【酒店安排】：任性安排2晚国际五星酒店+2晚精品酒店★【五岛连游】：大小PP岛，珊瑚岛，神仙半岛，帝王 游玩目的地： 泰国 普吉岛 行程天数： 6天 交通方式： 飞机/飞机 ¥3273 起 查看详情 <德国+法国+瑞士+荷兰4国10日游>海航直飞欧洲，度假胜地琉森，保证拼房，无强制自费，全国联运 ☆【海南航空】Skytrax五星级航空直飞苏黎世；☆【莱茵瀑布】欧洲第一大瀑布；☆【法兰克福】欧洲金融之都；☆【阿姆斯特丹】畅游“北方威尼斯”；☆【布鲁塞尔大广场】参观欧洲最美的广场之一；☆【巴黎】 游玩目的地： 法国 荷兰 行程天数： 10天 交通方式： 飞机/飞机 ¥5029 起 查看详情 <美国东西岸+黄石+羚羊彩穴+夏威夷17-20日游>本土纯玩臻品,保证拼房/拒签无忧,大峡谷/大提顿/大瀑布,圣地亚哥,羚羊彩穴/马蹄湾,部分城市立减千元 银联返现活动1、活动时间：9.110.312、活动对象：持境内发行银联卡的国旅会员（卡号以62开头）3、活动内容：活动期间，国旅会员持62开头的银联卡（卡号以62开头）成功注册活动，并且：①在境外（不 游玩目的地： 加拿大 美国 墨西哥 行程天数： 12天 交通方式： 飞机/飞机 ¥21480 起 查看详情 <巴厘岛6或7日游>深圳直飞0购物千人出游，RIMAB屋顶天空下午茶，蓝梦岛恶魔眼泪，贝妮达岛浮潜 / 独木舟/海边秋千，精油Spa 游玩目的地： 巴厘岛 行程天数： 6天 交通方式： 飞机/飞机 ¥4129 起 查看详情 <迪拜+阿布扎比6日游>去程A380，全程国五，沙漠冲沙，棕榈岛缆车，火锅餐，阿拉伯餐，阿联酋航空，香港直飞 A行程搭乘阿联酋航空客机香港直航往返，不转机，去程A380！畅游阿联酋两大酋长国：迪拜、阿布扎比！宗教与文化的碰撞：扎耶德清真寺，迪拜博物馆等经典景点！2017年全新开幕的阿布扎比卢浮宫博物馆！览古镇 游玩目的地： 迪拜 阿联酋 行程天数： 6天 交通方式： 飞机/飞机 ¥5439 起 查看详情 <土耳其8-10日游>深圳集合，土航直飞，四飞，全程五星，一晚卡帕多奇亚洞穴酒店，棉花堡温泉酒店，安塔利亚，船游博斯普鲁斯海峡 ：【航空公司】：乘坐土耳其航空TK客机往返，四飞，舒适快捷!【品质住宿】：卡帕多奇亚洞穴酒店+伊斯坦布尔国际五星；棉花堡温泉酒店；；库萨达斯/安塔利亚海边酒店；【饮食】：棉花堡烤羊肉餐；卡帕多奇亚洞 游玩目的地： 土耳其 行程天数： 8天 交通方式： 飞机/飞机 ¥13965 起 查看详情 <土耳其12天游>香港直飞，2晚卡帕，烤鱼餐/瓦罐焖肉，全程车载WIFI，番红花城，图兹盐湖，温泉酒店，伊斯坦布尔一天自由活动，土耳其航空 【航空公司】土耳其国家航空公司，香港直飞往返航班，更好的服务与更简便的出行。【优质酒店】全程选用舒适酒店，不给您旅程任何不满的理由。 游玩目的地： 土耳其 安哥拉 行程天数： 12天 交通方式： 飞机/飞机 ¥7753 起 查看详情 <日本北海道5日游>当季预售 游童趣哆啦A梦乐园 登别海洋乐园 赏富良野花田 乘花田农耕车 尝薰衣草冰淇淋 品北海道三大蟹 2晚温泉 特别安排特别安排：富良野花田任吃香甜蜜瓜或时令水果+搭乘花田农耕车+薰衣草冰淇淋登别尼克斯海洋公园展示了大约350种11,000只海洋生物，国王企鹅大游行小樽运河、八音盒展览馆弥漫着浪漫的味道、电影情 游玩目的地： 日本 行程天数： 5天 交通方式： 飞机/飞机 ¥9314 起 查看详情 <土耳其8日游>土航直飞内陆双飞，全程五星，含博斯普鲁斯海峡游船，爱琴**中海海边/特色温泉酒店，洞穴瓦罐餐，烤鱼餐，可提前预定热气球 ♥最美看点♥♥精选住宿♥：全程五星酒店♥经典荟萃♥：含博斯普鲁斯海峡游船 ♥美食♥：卡帕多奇亚洞穴饭店瓦罐餐，伊斯坦布尔马尔马拉海景餐厅烤鱼餐，棉花堡中途享用土耳其烤羊肉餐，席林斯小镇水果酒 游玩目的地： 土耳其 行程天数： 8天 交通方式： 飞机/飞机 ¥9048 起 查看详情 <澳大利亚凯恩斯墨尔本10日游>深圳直飞澳洲 游船上享用西式晚餐、出海捉泥蟹、观看剪羊毛表演  凯恩斯世界遗产 花园城市墨尔本 产品概要行程天数：10天8晚成团地点：深圳成团目的地：凯恩斯往返交通：飞机/飞机报名截止时间：团期前20天18点接待标准•用餐安排：一般早餐为酒店西式，中式午晚餐六菜一汤或当地餐;•住宿安排：澳洲境内 游玩目的地： 澳大利亚 凯恩斯 行程天数： 10天 交通方式： 飞机/飞机 ¥13669 起 查看详情 <荷兰+比利时+法国11-12日游>广州出发，全程四星，漫画博物馆，风车村，奥塞美术馆，荷兰森林公园，品网红甜品，自由活动，全程wifi 线路：广州打指纹，专人陪同。1.舒适旅程：精选比利时航空公司客机，往返直飞避免转机的奔波与疲劳；2.星级享受：全程安排四星酒店，特别升级一晚夜宿羊角村，享受更舒适的住宿服务；3.服务升级：赠送奶酪王国 游玩目的地： 荷兰 天海邮轮 比利时 行程天数： 10天 交通方式： 飞机/飞机 ¥23053 起 查看详情 <土耳其12日游>可升热气球/洞穴，特色瓦罐餐/卡帕惬意连住，海底隧道列车，A线长寿之乡，B线番红花城，香港QR 春节班期特别赠送卡帕多奇亚katpatuka泥浴项目升级安排伊斯坦布尔海景餐厅烤肉餐升级安排中餐升级10菜一汤土耳其主色调神秘的蓝眼睛饰品 肃穆的蓝色清真寺醉人的蓝色地中海“对于土耳其：如果 游玩目的地： 土耳其 土耳其 行程天数： 12天 交通方式： 飞机/飞机 ¥6640 起 查看详情 <巴厘岛-新加坡5晚6日游>深圳直飞 全程五星酒店 蓝梦岛金银岛双岛出海 丛林大秋千 网红鸟巢 环球影城 国立大学 牛车水  仅2站购物 精选航班搭乘新加坡航空客机，体验空中五星服务，深圳往返，方便快捷！必玩景点不能放过巴厘岛：安排蓝梦岛出海，全新开业的蓝梦岛海边俱乐部及水上活动中心，畅享蓝梦水世界！安排皇家别墅下午茶，360℃热带雨林 游玩目的地： 新加坡 巴厘岛 行程天数： 6天 交通方式： 飞机/飞机 ¥8570 起 查看详情 <新西兰南北岛9日游>纯净游/深圳直飞/鲁冰花灿烂的季节/指环王取景地/瓦纳卡湖/伊甸山/罗托鲁亚湖/皇后镇/毛利文化村/喂羊驼 产品概要行程天数：9天7晚成团地点：深圳成团目的地：基督城往返交通：飞机/飞机报名截止时间：团期前15天18点特别优惠<新西兰纯南岛四飞9日游>深圳直飞，0购物，鲁冰花灿烂的季节， 游玩目的地： 新西兰 行程天数： 9天 交通方式： 飞机/飞机 ¥29329 起 查看详情 <以色列约旦9天游>深圳集合，死海漂浮，巴哈伊空中花园，耶路撒冷，船游加利利湖，车游瓦地伦，特色烤鱼餐 行程行程亮点：乘坐世界公认安全的航空公司以色列航空LY（深圳起，香港止）七彩流溢:船游加利利湖全球海拔至低点死海漂浮三教圣城:耶路撒冷神宗圣教:天使报喜堂伯利恒主诞教堂圣墓教堂苦路14站 游玩目的地： 以色列 行程天数： 9天 交通方式： 飞机/飞机 ¥19199 起 查看详情 <**全景深度-克鲁克+花园大道10日游>深圳集合，反季出行避暑好去处，花园大道，香槟日落，酒庄酒店，醉美南非 【金牌全景深度南非】亮点汇聚，应接不暇【著名城市一览】南半球最大的奢华娱乐中心太阳城【无限亲近自然】南非最大的野生动物保护区克鲁克国家公园、海豹岛、企鹅海滩感受地球生灵的其妙！【自然美景尽收】 游玩目的地： 南非 行程天数： 10天 交通方式： 飞机/飞机 ¥17292 起 查看详情 <彩虹之旅花园大道9日游>深圳集合，反季出行避暑好去处，花园大道，香槟日落，酒庄酒店，醉美南非 【畅游两大首都】比勒陀利亚（茨瓦内）、开普敦【领略经典岁月】约翰内斯堡、太阳城蕴藏历史文化，花园大道（奈斯纳+摩梭湾）【用心甄选酒店】非洲茅草屋顶酒店+约堡/开普敦四星酒店+花园大道四星酒店【晨游百年 游玩目的地： 南非 行程天数： 9天 交通方式： 飞机/飞机 ¥17814 起 查看详情 <南非9日游>深圳集合，含省时内陆飞，人间天路花园大道，特色风情酒店，品南非特色餐，A线信号山品香槟，B线观赏lesidi民俗村 A行程安排开普敦信号山品尝香槟，俯瞰开普敦市容；开普敦不容错过的美景之一【白色海滩】；【马来人文化街】，感受古老的文化气息与五颜六色的小房子B行程安排于lesidi民俗文化村，观赏独具当地的五大民族； 游玩目的地： 南非 行程天数： 9天 交通方式： 飞机/飞机 ¥11318 起 查看详情 <迪拜-阿布扎比6日游>香港直飞，畅游四个酋长国，迪拜奇迹花园，特别安排亚特兰蒂斯除夕夜安排丰盛跨年大餐 ：搭乘五星豪华阿联酋航空，香港直飞迪拜，享受舒适空中服务，体验空客A380大客机观多项世界之醉，领略奢华迪拜的魅力，感受当地风土人情，畅游四个酋长国：迪拜海湾上的明珠，阿拉伯联合酋长国第二大酋长国&n 游玩目的地： 迪拜 行程天数： 6天 交通方式： 飞机/飞机 ¥11531 起 查看详情 <新加坡4晚5日半自助游>深圳（香港）直飞 周末我在新加坡  全程四星酒店 纯玩无购物 两天自由活动 鱼尾狮 哈芝巷 滨海湾花园 倾情推荐纯玩保证：保证全程无任何指定购物点，无任何额外收费自费项目，更多游览观光休闲时间精选酒店：新加坡华星酒店或曼尔洛酒店或备选酒店。黄金航班：新加坡航空旗下胜安航空，享受一流空中服务，丰盛餐饮免费 游玩目的地： 新加坡 行程天数： 5天 交通方式： 飞机/飞机 ¥4097 起 查看详情 <新加坡4晚5日美食之旅游>香港直飞  鱼尾狮公园 滨海湾花园 克拉码头游船 乌节路 新加坡金沙*** 空中花园  娘惹体验馆 海洋馆 选择新加坡的八大理由:理由之一：新加坡是公认安全系数高，犯罪率低之一的国家，安全放心。理由之二：环境与食物极其卫生，文化和语言方面的共通，是东南亚中适合老人和小孩出游的国家理由之三：行程拒绝常规团队“ 游玩目的地： 新加坡 行程天数： 5天 交通方式： 飞机/飞机 ¥6959 起 查看详情 <美国-加拿大东西海岸17日游>深圳集中 加航直飞 美加东西海岸大环游  史丹利公园 自由女神游船 布查德花园 17里湾 丹麦村 ◆经典之旅自由女神游船，17里湾，布查德花园，尼亚加拉大瀑布，圣地亚哥一日游；◆增游美西旅游城市金融中心旧金山；◆沿加州一号公路欣赏绝美的太平洋海岸风光；◆游览充满丹麦风情的丹麦村，独具西西 游玩目的地： 行程天数： 17天 交通方式： 飞机/飞机 ¥22136 起 查看详情 <巴厘岛+新加坡5晚6日游>玩转双城 深圳去港回 蓝梦岛 金银岛双岛游  圣淘沙名胜世界 滨海湾花园 鱼尾狮公园 精华摘要巴厘岛——南纬8度的度假天堂；新加坡——时尚精尖的亚洲都会；纯朴·摩登·双城体验·为你开启！航班搭乘新加坡航空或圣安航空客机，全球最佳航空公司之一，体验空中五星服务。巴厘岛安排蓝梦岛+贝尼达 游玩目的地： 新加坡 巴厘岛 行程天数： 6天 交通方式： 飞机/飞机 ¥3511 起 查看详情 <以色列约旦10日游>国泰航空/香港直飞/圣城耶路撒冷/杰拉什古城/佩特拉古城/巴哈伊花园/红海/死海升级五星酒店/游船畅游加利利湖 ≈≈≈≈≈≈≈≈≈≈≈≈≈≈★★≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈★国泰航空公司，香港直飞特拉维夫，免除转机所带来的旅途疲劳。★全程当地酒店，死海、红海免费升级五星酒店。★特别体验：游船畅游澈彻明净的加利 游玩目的地： 以色列 行程天数： 10天 交通方式： 飞机/飞机 ¥13904 起 查看详情 <泰国-曼谷-芭堤雅4晚5日游>深圳往返、含导服费、 龙虎园、大皇宫玉佛寺、芭堤雅出海、海鲜升级、娜通花园餐厅，美食一网打尽 产品详情❤行程秒懂❤✿【行程】经典全览大皇宫、玉佛寺、热带水果园、泰式古法按摩、骑大象等；东芭乐园、双岛连游、神殿寺；✿【人气美食】泰式风味餐、印象暹罗自助餐、海鲜餐升级、芭堤雅音乐渔村、平均餐标 游玩目的地： 泰国 行程天数： 5天 交通方式： 飞机/飞机 ¥2325 起 查看详情 <新加坡双飞4晚5日半自助游>送乳胶枕，全新上线，可联运，2天自由活动，含新加坡游船，滨海湾花园，可配联运，4星酒店 体验贯穿于整个城市的新加坡河是新加坡的生命之河，乘游船观赏新加坡的城市风光。 游玩目的地： 新加坡 行程天数： 5天 交通方式： 飞机/飞机 ¥3694 起 查看详情 <迪拜-土耳其12日游>香港直飞，谢赫扎耶德大清真寺，地中海，爱琴海双海寻梦，以弗所古城、棉花堡、卡帕多奇亚，热气球 ：住宿：番红花城安排入住民宿，入住五星酒店，特别安排1晚卡帕多奇亚洞穴酒店，棉花堡1晚温泉酒店美景：亚欧大陆在此交汇，地中海，爱琴海双海寻梦，天然奇景棉花堡，外星美景卡帕多奇亚迪拜城市游览，领 游玩目的地： 安哥拉 行程天数： 13天 交通方式： 飞机/飞机 ¥9919 起 查看详情 <迪拜-土耳其13日游>迪拜博物馆、圣索非亚大教堂、蓝色清真寺、地中海，爱琴海双海寻梦，天然奇景棉花堡，外星美景卡帕多奇亚 ：住宿：番红花城安排入住民宿，入住五星酒店，特别安排1晚卡帕多奇亚洞穴酒店，棉花堡1晚温泉酒店美景：亚欧大陆在此交汇，地中海，爱琴海双海寻梦，天然奇景棉花堡，外星美景卡帕多奇亚迪拜城市游览，领 游玩目的地： 安哥拉 行程天数： 13天 交通方式： 飞机/飞机 ¥8289 起 查看详情 <俄罗斯-莫斯科+圣彼得堡9日游>南航深圳直飞，团队免签，冬宫，彼得保罗要塞，夏宫花园，圣三一教堂 &n 游玩目的地： 俄罗斯 瑞典 行程天数： 9天 交通方式： 飞机/飞机 ¥5292 起 查看详情 <新西兰南北岛4飞9日游>纯净游/深圳直飞/鲁冰花灿烂的季节/指环王取景地/瓦纳卡湖/伊甸山/罗托鲁亚湖/皇后镇/毛利文化村/喂羊驼 产品概要行程天数：9天7晚成团地点：深圳成团目的地：基督城往返交通：飞机/飞机报名截止时间：团期前15天17点重要提示新西兰旅游温馨小提示语言：新西兰的官方语言为英语，各大商场和酒店都有通晓各国语言 游玩目的地： 新西兰 行程天数： 9天 交通方式： 飞机/飞机 ¥16716 起 查看详情 <新西兰纯南岛4飞9日游>美食美景纯玩无购物/深圳直飞/鲁冰花灿烂的季节/好牧羊人教堂/淘金小镇箭镇/米尔福德峡湾/蓝眼企鹅/库克山/特色美食 产品概要行程天数：9天7晚成团地点：深圳成团目的地：基督城往返交通：飞机/飞机报名截止时间：团期前15天17点重要提示新西兰旅游温馨小提示语言：新西兰的官方语言为英语，各大商场和酒店都有通晓各国语 游玩目的地： 新西兰 行程天数： 9天 交通方式： 飞机/飞机 ¥20329 起 查看详情 <天竺韵印度6-8日游>深起港止/全程无自费/不进店/泰姬陵/阿格拉堡/莲花庙/琥珀堡/登纳哈加尔堡俯瞰斋普尔/瑜伽体验/赏歌舞剧 【甄选航班】：印度捷特航空印度五星航空公司，享受优质机舱服务和空中美食【尊享舒适】：全程五星酒店，升级2晚国际五星，享受安逸舒适的住宿体验。【黄金组合】：印度经典闻名“金三角”：新德里、阿格拉、斋普尔 游玩目的地： 印度 行程天数： 6天 交通方式： 飞机/飞机 ¥4978 起 查看详情 <土耳其12日游>可升热气球/洞穴，特色瓦罐餐/卡帕惬意连住，海底隧道列车，A线长寿之乡，B线番红花城，香港QR 重要提示蓝色清真寺官方发布通知：3月1日至5月15日蓝色清真寺将关闭维修，届时此景点将改为外观，如若情况允许并就近安排当天开门的其他清真寺，具体以境外实际安排为准，烦请注意此通知，谢谢！土耳其主色调神 游玩目的地： 安哥拉 行程天数： 12天 交通方式： 飞机/飞机 ¥6960 起 查看详情 <越南-河内--陆龙湾-下龙湾5日游>深圳直飞、全程四星带泳池酒店、单人保证拼房、莲花海鲜自助餐、含无限流量卡、含签证费 产品概要行程天数：5天3晚成团地点：深圳成团目的地：河内往返交通：飞机/飞机报名截止时间：团期前3天18点接待标准•用餐安排：全程当地美食体验，特别安排莲花海鲜自助餐•住宿安排：全程四星酒店•行程安排 游玩目的地： 越南 行程天数： 5天 交通方式： 飞机/飞机 ¥1729 起 查看详情 <日本东京-富士山-京都-大阪6日游>本州赏花 富士山芝樱祭 招财猫圣地 富士急乐园嗨玩 温泉旅馆 日式烤肉 相扑火锅 产品概要行程天数：6天5晚成团地点：深圳成团目的地：大阪往返交通：飞机/飞机报名截止时间：团期前15天0点接待标准•用餐安排：优质美食大放送：温泉会席料理、相扑火锅、蟹道乐、京都料理、日式烤肉•住宿 游玩目的地： 日本 名古屋 行程天数： 6天 交通方式： 飞机/飞机 ¥6203 起 查看详情 <俄罗斯双首都+谢镇9天游>南方航空 正点航班  广州起止 29人小团 爱国者公园 红场 冬宫 巴普诺夫森林公园 产品概要行程天数：8天6晚成团地点：广州成团目的地：莫斯科往返交通：飞机/飞机报名截止时间：团期前6天18点接待标准•用餐安排：两顿俄罗斯风味餐+中餐（餐标10美金）满足你的味蕾•住宿安排：全程舒适酒 游玩目的地： 俄罗斯 法国 瑞典 芬兰 行程天数： 8天 交通方式： 飞机/飞机 ¥10069 起 查看详情 <新加坡机票+当地5晚6日游>自营童趣狮城 品途专线 1单1团纯玩0购物，圣淘沙环球影城，SEA海洋馆，花芭山缆车，摩天轮，夜间动物园，半自助畅玩坡er县 •用餐安排：Day4特别赠送花芭山午餐一顿。•住宿安排：新加坡酒店任选，详见前台。•行程安排：1、半自助行程，轻松自由，张弛有度。2、安排13座小车+中文司机，专车游览，舒适不拼团。•游玩安排：一次玩 游玩目的地： 新加坡 行程天数： 6天 交通方式： 自行安排/自行安排 ¥6218 起 查看详情 <俄罗斯双城9日游>广州EO直飞，双点进出，不走回头路，冬宫博物馆，夏宫花园，卢日尼基足球场，谢尔盖耶夫镇，莫斯科大学，保证拼房 【航班优选】中国南方航空公司，深圳直飞，安全舒适，告别转机航班，让你轻松倒时差【酒店安排】全程入住舒适酒店，干净舒适❤❤❤❤❤❤❤❤❤❤❤❤❤❤❤❤❤【精彩行程】❤❤ 游玩目的地： 俄罗斯 行程天数： 9天 交通方式： 飞机/飞机 ¥8369 起 查看详情 <泰国曼谷-芭提雅6日游>乐开花爸妈游，深圳直飞0自费，安排三天午休，建立儿女微信群，大皇宫，水果园，56楼自助餐，东芭乐园，含泰国电话卡 行程◆专属于爸爸妈妈的旅游团，：『贴心安排1』六天行程三天午休，旅游休息两不误；『贴心升级2』建立儿女微信群，每日领队及时汇报，让家人放心、安心，老人家开心。◆：行程安排丰富，让您的旅途轻松、悠闲，充 游玩目的地： 泰国 行程天数： 6天 交通方式： 飞机/飞机 ¥4912 起 查看详情 <新加坡+民丹岛机票+当地4晚5日游>4人立减1500/单，0自费0购物，2人即可成行，圣淘沙，鱼尾狮公园，2晚新加坡网红酒店，双重体验 行程天数：5天4晚成团地点：新加坡成团目的地：新加坡往返交通：飞机/飞机报名截止时间：团期前4天18点 游玩目的地： 新加坡 行程天数： 5天 交通方式： 飞机/飞机 ¥6066 起 查看详情 <花少同款漫游英国机票+当地8晚10日游>爱丁堡、牛津、温德米尔湖区、三大古堡、爱丁堡城堡、温莎城堡、华威城堡，伦敦深度，全景环游不列颠 全景：纵览英格兰、苏格兰，花少推荐必游体验，全面畅游英伦美景；贴心：含首尾伦敦希斯罗机场34星酒店，全程含自助早餐，当地参团便捷，中文导游&外籍司机；文化之旅：莎士比亚出生地斯特拉福德小镇，世 游玩目的地： 英国 行程天数： 10天 交通方式： 飞机/飞机 ¥9888 起 查看详情 <北欧丹麦+挪威+芬兰+瑞典10日-13日游>哥本哈根进出童话王国哥本哈根，古老都城奥斯陆，A、B线幸福小镇德拉厄，C线双极光 •用餐安排：全程共含8顿正餐，中式午晚餐（5菜1汤）,810人一桌，具体用餐次数详见行程，不含餐部分敬请客人自理。（退餐标准为10欧/人/餐）•住宿安排：当地标准酒店双人间5晚(含西式早餐)，游轮2晚 游玩目的地： 丹麦 瑞典 芬兰 挪威 行程天数： 10天 交通方式： 飞机/飞机 ¥7729 起 查看详情 <泰国-清迈机票+当地4晚5日游>住1晚拜县  纯玩1 单1团 小黄屋 湖畔花园餐厅 美莎大象营 黑白庙游 赠泰国电话卡 介绍◆【闪耀亮点】打破常规、绝无套路、纯玩、无自费；2人起独立成团，①单①团不拼其它客人，专车+中文专导！◆【超强实力】泰国自己的地接社、保证纯玩、全程中文导游，24小时中文微信管家服务、无需担心语 游玩目的地： 泰国 公主邮轮 行程天数： 5天 交通方式： 自行安排/自行安排 ¥4430 起 查看详情 <莫斯科圣彼得堡机票+当地6晚8日游>全国出发，克宫，红场，新圣女公墓，亚历山大花园，冬宫，彼得夏宫，纯玩无购物 产品概要行程天数：8天6晚成团地点：莫斯科成团目的地：莫斯科往返交通：飞机/飞机报名截止时间：团期前20天0点接待标准•用餐安排：提供酒店自助式早餐和中式及俄式的午晚餐•住宿安排：提供当地酒店•行程安 游玩目的地： 行程天数： 8天 交通方式： 飞机/飞机 ¥11160 起 查看详情 <新马机票+当地5日游>全新上线，0购物0自费，4成人起订成团，新加坡团签，畅游新加坡花园城市，云顶高原，吉隆坡双峰塔 产品概要行程天数：5天4晚目的地：新加坡往返交通：飞机/飞机报名截止时间：团期前5天18点接待标准•用餐安排：全程餐标100元/位精心安排当地美食：黑胡椒螃蟹、海南鸡饭、养生肉骨茶、奶油虾、马来风光、 游玩目的地： 新加坡 行程天数： 5天 交通方式： 飞机/飞机 ¥8376 起 查看详情 <马来西亚仙本那机票+当地5晚6日游>渔乐海钓/跳岛游、深潜，花样玩法，沉底海钓/深海铁板钓，可升海底漫步/红树林，含电话卡插头/咬嘴 预定须知1、本产品需现询，二次确认，无法直接签约，请签约前咨询客服，为了顺利出签，方便安排行程，请于下单后2日内提供签证资料、快递地址（方便我们快递电话卡、充电转换插头），敬请谅解~3、★★★航 游玩目的地： 马来西亚 行程天数： 6天 交通方式： 飞机/飞机 ¥5327 起 查看详情 <莫斯科+圣彼得堡+双飞6晚8天游>北京直飞、可配联运、金环谢镇、克林姆林宫、俄罗式特色餐、红场、叶宫、夏宫花园 行程精选优质航班中国国际航空公司北京直飞莫斯科；前往世界四大博物馆之一的冬宫，细数俄罗斯举世无双的艺术瑰宝；前往有“俄罗斯的凡尔赛”之称的夏宫花园，畅游气势磅礴的大沙皇后花园；特别安排前往俄罗 游玩目的地： 行程天数： 8天 交通方式： 飞机/飞机 ¥7679 起 查看详情 <泰国曼谷-芭提雅-普吉岛-清迈机票+当地12日游>海岛游/黑白庙泰国双重体验，曼芭跟团，普清mini小团、DIY出行/花样升级包，含电话卡 泰国落地签免签证费★行程亮点：1.全程无自费，私属旅程，完美搭配。2.安排海滨魅力芭提雅海边酒店三晚。3.特别安排国家海洋公园罗勇沙美岛行程，精华绝不遗漏。4.安排一天半自由活动时间，放慢脚步，细 游玩目的地： 普吉岛 泰国 巴厘岛 天海邮轮 行程天数： 12天 交通方式： 飞机/飞机 ¥6912 起 查看详情 <泰国曼谷-芭提雅-苏梅岛机票+当地9日游>苏梅mini小团/花样升级包享蜜月之旅，0自费，四星住宿，芭提雅快艇出海/升级泳池别墅，含电话卡 泰国落地签免签证费◆行程亮点：打破常规、绝无套路、曼谷芭提雅跟团、苏梅岛DIY度假、一次玩转泰国曼谷、芭堤雅、苏梅岛三大风情名城，经典景点一网打尽！省时、省钱、省心！1、【芭提雅步行街】这是芭提雅出 游玩目的地： 泰国 苏梅岛 行程天数： 9天 交通方式： 飞机/飞机 ¥5996 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "云南",
    "duration": 6,
    "price": 2327,
    "originalPrice": 2644,
    "priceUnit": "人",
    "departureDate": "2026-06-19",
    "returnDate": "2026-06-25",
    "transportType": "飞机往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "6早餐5正餐",
    "singleSupplement": 581,
    "singleSupplementNote": "单人出行需补单房差￥581，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 21,
    "totalSeats": 41,
    "highlights": [
      "云南必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往云南",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：云南游览",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：云南游览",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：云南游览",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "第5天：云南游览",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 6,
        "title": "告别云南，返回温馨的家",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 3.7,
    "reviewCount": 631,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "海岛度假",
      "纯玩",
      "品质"
    ],
    "isHot": true,
    "isNew": false,
    "isFlashSale": false,
    "discountRate": 12,
    "groupSize": "30人常规团",
    "theme": "海岛度假",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.463749",
    "updatedAt": "2026-05-07T01:02:13.463749"
  },
  {
    "id": "tour_216",
    "title": "<泰国曼谷-芭提雅5晚6日游>爸妈舒心游/0购物0自费/专属用车/**导游/黄金屋/人妖秀/大船出海/四面佛/微管家保驾护航 【海岛风情】快艇出海沙美岛，感受如面粉一样细嫩的海沙，尽享南国热带的海洋魅力【精选酒店】全程入住四星品质酒店，跟团也享舒适好睡眠【本地美食】76楼国际自助餐，泰国风味餐，寻找泰国市场美食【精彩泰国】安 游玩目的地： 泰国 行程天数： 6天 交通方式： 飞机/飞机 ¥2327 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "其他",
    "duration": 6,
    "price": 2327,
    "priceUnit": "人",
    "departureDate": "2026-06-03",
    "returnDate": "2026-06-09",
    "transportType": "飞机往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "6早餐5正餐",
    "singleSupplement": 581,
    "singleSupplementNote": "单人出行需补单房差￥581，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 24,
    "totalSeats": 34,
    "highlights": [
      "其他必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往其他",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "第5天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 6,
        "title": "告别其他，返回温馨的家",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.7,
    "reviewCount": 529,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "海岛度假",
      "纯玩",
      "品质"
    ],
    "isHot": true,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "海岛度假",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.463749",
    "updatedAt": "2026-05-07T01:02:13.463749"
  },
  {
    "id": "tour_217",
    "title": "<泰国-普吉岛6日游>深圳直飞，3岛连游含浮潜，网红大自然餐厅 ，神仙半岛醉美日落，体验地道泰式按摩，4晚海边酒店 ★【优选资源】：不是价格至低，却是性价比至高的★【精选美食】：大自然缝纫机餐厅品尝当地芒果糯米饭★【酒店安排】：任性安排2晚国际五星酒店+2晚精品酒店★【五岛连游】：大小PP岛，珊瑚岛，神仙半岛，帝王 游玩目的地： 泰国 普吉岛 行程天数： 6天 交通方式： 飞机/飞机 ¥3273 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "广东",
    "duration": 6,
    "price": 3273,
    "originalPrice": 3636,
    "priceUnit": "人",
    "departureDate": "2026-05-19",
    "returnDate": "2026-05-25",
    "transportType": "飞机往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "6早餐5正餐",
    "singleSupplement": 818,
    "singleSupplementNote": "单人出行需补单房差￥818，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 8,
    "totalSeats": 33,
    "highlights": [
      "广东必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往广东",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "第5天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 6,
        "title": "告别广东，返回温馨的家",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.3,
    "reviewCount": 32,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "美食之旅",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "discountRate": 10,
    "groupSize": "30人常规团",
    "theme": "美食之旅",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.463749",
    "updatedAt": "2026-05-07T01:02:13.463749"
  },
  {
    "id": "tour_218",
    "title": "<德国+法国+瑞士+荷兰4国10日游>海航直飞欧洲，度假胜地琉森，保证拼房，无强制自费，全国联运 ☆【海南航空】Skytrax五星级航空直飞苏黎世；☆【莱茵瀑布】欧洲第一大瀑布；☆【法兰克福】欧洲金融之都；☆【阿姆斯特丹】畅游“北方威尼斯”；☆【布鲁塞尔大广场】参观欧洲最美的广场之一；☆【巴黎】 游玩目的地： 法国 荷兰 行程天数： 10天 交通方式： 飞机/飞机 ¥5029 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "三亚",
    "duration": 10,
    "price": 5029,
    "originalPrice": 6208,
    "priceUnit": "人",
    "departureDate": "2026-07-13",
    "returnDate": "2026-07-23",
    "transportType": "飞机往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "10早餐9正餐",
    "singleSupplement": 1257,
    "singleSupplementNote": "单人出行需补单房差￥1257，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 7,
    "totalSeats": 47,
    "highlights": [
      "三亚必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往三亚",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：三亚游览",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：三亚游览",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：三亚游览",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "第5天：三亚游览",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 6,
        "title": "第6天：三亚游览",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 7,
        "title": "第7天：三亚游览",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 8,
        "title": "第8天：三亚游览",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 9,
        "title": "第9天：三亚游览",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 10,
        "title": "告别三亚，返回温馨的家",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 3.6,
    "reviewCount": 169,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "自然风光",
      "纯玩",
      "品质"
    ],
    "isHot": true,
    "isNew": false,
    "isFlashSale": false,
    "discountRate": 19,
    "groupSize": "30人常规团",
    "theme": "自然风光",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.463749",
    "updatedAt": "2026-05-07T01:02:13.463749"
  },
  {
    "id": "tour_219",
    "title": "<美国东西岸+黄石+羚羊彩穴+夏威夷17-20日游>本土纯玩臻品,保证拼房/拒签无忧,大峡谷/大提顿/大瀑布,圣地亚哥,羚羊彩穴/马蹄湾,部分城市立减千元 银联返现活动1、活动时间：9.110.312、活动对象：持境内发行银联卡的国旅会员（卡号以62开头）3、活动内容：活动期间，国旅会员持62开头的银联卡（卡号以62开头）成功注册活动，并且：①在境外（不 游玩目的地： 加拿大 美国 墨西哥 行程天数： 12天 交通方式： 飞机/飞机 ¥21480 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "其他",
    "duration": 12,
    "price": 21480,
    "priceUnit": "人",
    "departureDate": "2026-05-22",
    "returnDate": "2026-06-03",
    "transportType": "飞机往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "12早餐11正餐",
    "singleSupplement": 5370,
    "singleSupplementNote": "单人出行需补单房差￥5370，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 21,
    "totalSeats": 31,
    "highlights": [
      "其他必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往其他",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "第5天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 6,
        "title": "第6天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 7,
        "title": "第7天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 8,
        "title": "第8天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 9,
        "title": "第9天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 10,
        "title": "第10天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 11,
        "title": "第11天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 12,
        "title": "告别其他，返回温馨的家",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.0,
    "reviewCount": 127,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "自然风光",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "自然风光",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.463749",
    "updatedAt": "2026-05-07T01:02:13.463749"
  },
  {
    "id": "tour_220",
    "title": "<巴厘岛6或7日游>深圳直飞0购物千人出游，RIMAB屋顶天空下午茶，蓝梦岛恶魔眼泪，贝妮达岛浮潜 / 独木舟/海边秋千，精油Spa 游玩目的地： 巴厘岛 行程天数： 6天 交通方式： 飞机/飞机 ¥4129 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "广东",
    "duration": 6,
    "price": 4129,
    "originalPrice": 4537,
    "priceUnit": "人",
    "departureDate": "2026-07-02",
    "returnDate": "2026-07-08",
    "transportType": "飞机往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "6早餐5正餐",
    "singleSupplement": 1032,
    "singleSupplementNote": "单人出行需补单房差￥1032，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 25,
    "totalSeats": 45,
    "highlights": [
      "广东必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往广东",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "第5天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 6,
        "title": "告别广东，返回温馨的家",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 3.9,
    "reviewCount": 546,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "自然风光",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": true,
    "isFlashSale": false,
    "discountRate": 9,
    "groupSize": "30人常规团",
    "theme": "自然风光",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.463749",
    "updatedAt": "2026-05-07T01:02:13.463749"
  },
  {
    "id": "tour_221",
    "title": "<迪拜+阿布扎比6日游>去程A380，全程国五，沙漠冲沙，棕榈岛缆车，火锅餐，阿拉伯餐，阿联酋航空，香港直飞 A行程搭乘阿联酋航空客机香港直航往返，不转机，去程A380！畅游阿联酋两大酋长国：迪拜、阿布扎比！宗教与文化的碰撞：扎耶德清真寺，迪拜博物馆等经典景点！2017年全新开幕的阿布扎比卢浮宫博物馆！览古镇 游玩目的地： 迪拜 阿联酋 行程天数： 6天 交通方式： 飞机/飞机 ¥5439 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "其他",
    "duration": 6,
    "price": 5439,
    "priceUnit": "人",
    "departureDate": "2026-07-17",
    "returnDate": "2026-07-23",
    "transportType": "飞机往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "6早餐5正餐",
    "singleSupplement": 1359,
    "singleSupplementNote": "单人出行需补单房差￥1359，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 23,
    "totalSeats": 33,
    "highlights": [
      "其他必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往其他",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "第5天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 6,
        "title": "告别其他，返回温馨的家",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.1,
    "reviewCount": 151,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "古镇文化",
      "纯玩",
      "品质"
    ],
    "isHot": true,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "古镇文化",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.463749",
    "updatedAt": "2026-05-07T01:02:13.463749"
  },
  {
    "id": "tour_222",
    "title": "<土耳其8-10日游>深圳集合，土航直飞，四飞，全程五星，一晚卡帕多奇亚洞穴酒店，棉花堡温泉酒店，安塔利亚，船游博斯普鲁斯海峡 ：【航空公司】：乘坐土耳其航空TK客机往返，四飞，舒适快捷!【品质住宿】：卡帕多奇亚洞穴酒店+伊斯坦布尔国际五星；棉花堡温泉酒店；；库萨达斯/安塔利亚海边酒店；【饮食】：棉花堡烤羊肉餐；卡帕多奇亚洞 游玩目的地： 土耳其 行程天数： 8天 交通方式： 飞机/飞机 ¥13965 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "广东",
    "duration": 8,
    "price": 13965,
    "priceUnit": "人",
    "departureDate": "2026-05-26",
    "returnDate": "2026-06-03",
    "transportType": "飞机往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "8早餐7正餐",
    "singleSupplement": 3491,
    "singleSupplementNote": "单人出行需补单房差￥3491，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 10,
    "totalSeats": 35,
    "highlights": [
      "广东必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往广东",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "第5天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 6,
        "title": "第6天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 7,
        "title": "第7天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 8,
        "title": "告别广东，返回温馨的家",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 3.7,
    "reviewCount": 173,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "海岛度假",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": true,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "海岛度假",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.463749",
    "updatedAt": "2026-05-07T01:02:13.463749"
  },
  {
    "id": "tour_223",
    "title": "<土耳其12天游>香港直飞，2晚卡帕，烤鱼餐/瓦罐焖肉，全程车载WIFI，番红花城，图兹盐湖，温泉酒店，伊斯坦布尔一天自由活动，土耳其航空 【航空公司】土耳其国家航空公司，香港直飞往返航班，更好的服务与更简便的出行。【优质酒店】全程选用舒适酒店，不给您旅程任何不满的理由。 游玩目的地： 土耳其 安哥拉 行程天数： 12天 交通方式： 飞机/飞机 ¥7753 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "其他",
    "duration": 12,
    "price": 7753,
    "priceUnit": "人",
    "departureDate": "2026-07-08",
    "returnDate": "2026-07-20",
    "transportType": "飞机往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "12早餐11正餐",
    "singleSupplement": 1938,
    "singleSupplementNote": "单人出行需补单房差￥1938，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 25,
    "totalSeats": 40,
    "highlights": [
      "其他必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往其他",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "第5天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 6,
        "title": "第6天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 7,
        "title": "第7天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 8,
        "title": "第8天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 9,
        "title": "第9天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 10,
        "title": "第10天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 11,
        "title": "第11天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 12,
        "title": "告别其他，返回温馨的家",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 3.6,
    "reviewCount": 790,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "海岛度假",
      "纯玩",
      "品质"
    ],
    "isHot": true,
    "isNew": true,
    "isFlashSale": true,
    "groupSize": "30人常规团",
    "theme": "海岛度假",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.463749",
    "updatedAt": "2026-05-07T01:02:13.463749"
  },
  {
    "id": "tour_224",
    "title": "<日本北海道5日游>当季预售 游童趣哆啦A梦乐园 登别海洋乐园 赏富良野花田 乘花田农耕车 尝薰衣草冰淇淋 品北海道三大蟹 2晚温泉 特别安排特别安排：富良野花田任吃香甜蜜瓜或时令水果+搭乘花田农耕车+薰衣草冰淇淋登别尼克斯海洋公园展示了大约350种11,000只海洋生物，国王企鹅大游行小樽运河、八音盒展览馆弥漫着浪漫的味道、电影情 游玩目的地： 日本 行程天数： 5天 交通方式： 飞机/飞机 ¥9314 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "其他",
    "duration": 5,
    "price": 9314,
    "priceUnit": "人",
    "departureDate": "2026-06-15",
    "returnDate": "2026-06-20",
    "transportType": "高铁往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "5早餐4正餐",
    "singleSupplement": 2328,
    "singleSupplementNote": "单人出行需补单房差￥2328，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 8,
    "totalSeats": 33,
    "highlights": [
      "其他必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往其他",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "告别其他，返回温馨的家",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.6,
    "reviewCount": 605,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "海岛度假",
      "纯玩",
      "品质"
    ],
    "isHot": true,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "海岛度假",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.463749",
    "updatedAt": "2026-05-07T01:02:13.463749"
  },
  {
    "id": "tour_225",
    "title": "<土耳其8日游>土航直飞内陆双飞，全程五星，含博斯普鲁斯海峡游船，爱琴**中海海边/特色温泉酒店，洞穴瓦罐餐，烤鱼餐，可提前预定热气球 ♥最美看点♥♥精选住宿♥：全程五星酒店♥经典荟萃♥：含博斯普鲁斯海峡游船 ♥美食♥：卡帕多奇亚洞穴饭店瓦罐餐，伊斯坦布尔马尔马拉海景餐厅烤鱼餐，棉花堡中途享用土耳其烤羊肉餐，席林斯小镇水果酒 游玩目的地： 土耳其 行程天数： 8天 交通方式： 飞机/飞机 ¥9048 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "其他",
    "duration": 8,
    "price": 9048,
    "priceUnit": "人",
    "departureDate": "2026-07-29",
    "returnDate": "2026-08-06",
    "transportType": "飞机往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "8早餐7正餐",
    "singleSupplement": 2262,
    "singleSupplementNote": "单人出行需补单房差￥2262，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 27,
    "totalSeats": 42,
    "highlights": [
      "其他必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往其他",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "第5天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 6,
        "title": "第6天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 7,
        "title": "第7天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 8,
        "title": "告别其他，返回温馨的家",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 3.8,
    "reviewCount": 815,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "海岛度假",
      "纯玩",
      "品质"
    ],
    "isHot": true,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "海岛度假",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.463749",
    "updatedAt": "2026-05-07T01:02:13.463749"
  },
  {
    "id": "tour_226",
    "title": "<澳大利亚凯恩斯墨尔本10日游>深圳直飞澳洲 游船上享用西式晚餐、出海捉泥蟹、观看剪羊毛表演  凯恩斯世界遗产 花园城市墨尔本 产品概要行程天数：10天8晚成团地点：深圳成团目的地：凯恩斯往返交通：飞机/飞机报名截止时间：团期前20天18点接待标准•用餐安排：一般早餐为酒店西式，中式午晚餐六菜一汤或当地餐;•住宿安排：澳洲境内 游玩目的地： 澳大利亚 凯恩斯 行程天数： 10天 交通方式： 飞机/飞机 ¥13669 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "广东",
    "duration": 10,
    "price": 13669,
    "priceUnit": "人",
    "departureDate": "2026-07-28",
    "returnDate": "2026-08-07",
    "transportType": "飞机往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "10早餐9正餐",
    "singleSupplement": 3417,
    "singleSupplementNote": "单人出行需补单房差￥3417，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 19,
    "totalSeats": 34,
    "highlights": [
      "广东必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往广东",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "第5天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 6,
        "title": "第6天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 7,
        "title": "第7天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 8,
        "title": "第8天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 9,
        "title": "第9天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 10,
        "title": "告别广东，返回温馨的家",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.5,
    "reviewCount": 396,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "自然风光",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "自然风光",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.463749",
    "updatedAt": "2026-05-07T01:02:13.463749"
  },
  {
    "id": "tour_227",
    "title": "<荷兰+比利时+法国11-12日游>广州出发，全程四星，漫画博物馆，风车村，奥塞美术馆，荷兰森林公园，品网红甜品，自由活动，全程wifi 线路：广州打指纹，专人陪同。1.舒适旅程：精选比利时航空公司客机，往返直飞避免转机的奔波与疲劳；2.星级享受：全程安排四星酒店，特别升级一晚夜宿羊角村，享受更舒适的住宿服务；3.服务升级：赠送奶酪王国 游玩目的地： 荷兰 天海邮轮 比利时 行程天数： 10天 交通方式： 飞机/飞机 ¥23053 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "广东",
    "duration": 10,
    "price": 23053,
    "priceUnit": "人",
    "departureDate": "2026-06-20",
    "returnDate": "2026-06-30",
    "transportType": "飞机往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "10早餐9正餐",
    "singleSupplement": 5763,
    "singleSupplementNote": "单人出行需补单房差￥5763，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 5,
    "totalSeats": 40,
    "highlights": [
      "广东必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往广东",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "第5天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 6,
        "title": "第6天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 7,
        "title": "第7天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 8,
        "title": "第8天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 9,
        "title": "第9天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 10,
        "title": "告别广东，返回温馨的家",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.1,
    "reviewCount": 105,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "自然风光",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": true,
    "isFlashSale": true,
    "groupSize": "30人常规团",
    "theme": "自然风光",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.463749",
    "updatedAt": "2026-05-07T01:02:13.463749"
  },
  {
    "id": "tour_228",
    "title": "<土耳其12日游>可升热气球/洞穴，特色瓦罐餐/卡帕惬意连住，海底隧道列车，A线长寿之乡，B线番红花城，香港QR 春节班期特别赠送卡帕多奇亚katpatuka泥浴项目升级安排伊斯坦布尔海景餐厅烤肉餐升级安排中餐升级10菜一汤土耳其主色调神秘的蓝眼睛饰品 肃穆的蓝色清真寺醉人的蓝色地中海“对于土耳其：如果 游玩目的地： 土耳其 土耳其 行程天数： 12天 交通方式： 飞机/飞机 ¥6640 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "其他",
    "duration": 12,
    "price": 6640,
    "priceUnit": "人",
    "departureDate": "2026-05-23",
    "returnDate": "2026-06-04",
    "transportType": "飞机往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "12早餐11正餐",
    "singleSupplement": 1660,
    "singleSupplementNote": "单人出行需补单房差￥1660，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 14,
    "totalSeats": 49,
    "highlights": [
      "其他必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往其他",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "第5天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 6,
        "title": "第6天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 7,
        "title": "第7天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 8,
        "title": "第8天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 9,
        "title": "第9天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 10,
        "title": "第10天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 11,
        "title": "第11天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 12,
        "title": "告别其他，返回温馨的家",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.9,
    "reviewCount": 501,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "自然风光",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "自然风光",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.464749",
    "updatedAt": "2026-05-07T01:02:13.464749"
  },
  {
    "id": "tour_229",
    "title": "<巴厘岛-新加坡5晚6日游>深圳直飞 全程五星酒店 蓝梦岛金银岛双岛出海 丛林大秋千 网红鸟巢 环球影城 国立大学 牛车水  仅2站购物 精选航班搭乘新加坡航空客机，体验空中五星服务，深圳往返，方便快捷！必玩景点不能放过巴厘岛：安排蓝梦岛出海，全新开业的蓝梦岛海边俱乐部及水上活动中心，畅享蓝梦水世界！安排皇家别墅下午茶，360℃热带雨林 游玩目的地： 新加坡 巴厘岛 行程天数： 6天 交通方式： 飞机/飞机 ¥8570 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "广东",
    "duration": 6,
    "price": 8570,
    "originalPrice": 11129,
    "priceUnit": "人",
    "departureDate": "2026-08-02",
    "returnDate": "2026-08-08",
    "transportType": "飞机往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "6早餐5正餐",
    "singleSupplement": 2142,
    "singleSupplementNote": "单人出行需补单房差￥2142，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 16,
    "totalSeats": 41,
    "highlights": [
      "广东必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往广东",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "第5天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 6,
        "title": "告别广东，返回温馨的家",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.5,
    "reviewCount": 682,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "自然风光",
      "纯玩",
      "品质"
    ],
    "isHot": true,
    "isNew": false,
    "isFlashSale": false,
    "discountRate": 23,
    "groupSize": "30人常规团",
    "theme": "自然风光",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.464749",
    "updatedAt": "2026-05-07T01:02:13.464749"
  },
  {
    "id": "tour_230",
    "title": "<新西兰南北岛9日游>纯净游/深圳直飞/鲁冰花灿烂的季节/指环王取景地/瓦纳卡湖/伊甸山/罗托鲁亚湖/皇后镇/毛利文化村/喂羊驼 产品概要行程天数：9天7晚成团地点：深圳成团目的地：基督城往返交通：飞机/飞机报名截止时间：团期前15天18点特别优惠<新西兰纯南岛四飞9日游>深圳直飞，0购物，鲁冰花灿烂的季节， 游玩目的地： 新西兰 行程天数： 9天 交通方式： 飞机/飞机 ¥29329 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "广东",
    "duration": 9,
    "price": 29329,
    "originalPrice": 31536,
    "priceUnit": "人",
    "departureDate": "2026-07-18",
    "returnDate": "2026-07-27",
    "transportType": "飞机往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "9早餐8正餐",
    "singleSupplement": 7332,
    "singleSupplementNote": "单人出行需补单房差￥7332，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 22,
    "totalSeats": 37,
    "highlights": [
      "广东必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往广东",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "第5天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 6,
        "title": "第6天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 7,
        "title": "第7天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 8,
        "title": "第8天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 9,
        "title": "告别广东，返回温馨的家",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.6,
    "reviewCount": 67,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "古镇文化",
      "纯玩",
      "品质"
    ],
    "isHot": true,
    "isNew": false,
    "isFlashSale": false,
    "discountRate": 7,
    "groupSize": "30人常规团",
    "theme": "古镇文化",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.464749",
    "updatedAt": "2026-05-07T01:02:13.464749"
  },
  {
    "id": "tour_231",
    "title": "<以色列约旦9天游>深圳集合，死海漂浮，巴哈伊空中花园，耶路撒冷，船游加利利湖，车游瓦地伦，特色烤鱼餐 行程行程亮点：乘坐世界公认安全的航空公司以色列航空LY（深圳起，香港止）七彩流溢:船游加利利湖全球海拔至低点死海漂浮三教圣城:耶路撒冷神宗圣教:天使报喜堂伯利恒主诞教堂圣墓教堂苦路14站 游玩目的地： 以色列 行程天数： 9天 交通方式： 飞机/飞机 ¥19199 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "广东",
    "duration": 9,
    "price": 19199,
    "originalPrice": 24614,
    "priceUnit": "人",
    "departureDate": "2026-07-27",
    "returnDate": "2026-08-05",
    "transportType": "飞机往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "9早餐8正餐",
    "singleSupplement": 4799,
    "singleSupplementNote": "单人出行需补单房差￥4799，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 12,
    "totalSeats": 47,
    "highlights": [
      "广东必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往广东",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "第5天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 6,
        "title": "第6天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 7,
        "title": "第7天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 8,
        "title": "第8天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 9,
        "title": "告别广东，返回温馨的家",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 3.5,
    "reviewCount": 489,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "自然风光",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "discountRate": 22,
    "groupSize": "30人常规团",
    "theme": "自然风光",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.464749",
    "updatedAt": "2026-05-07T01:02:13.464749"
  },
  {
    "id": "tour_232",
    "title": "<**全景深度-克鲁克+花园大道10日游>深圳集合，反季出行避暑好去处，花园大道，香槟日落，酒庄酒店，醉美南非 【金牌全景深度南非】亮点汇聚，应接不暇【著名城市一览】南半球最大的奢华娱乐中心太阳城【无限亲近自然】南非最大的野生动物保护区克鲁克国家公园、海豹岛、企鹅海滩感受地球生灵的其妙！【自然美景尽收】 游玩目的地： 南非 行程天数： 10天 交通方式： 飞机/飞机 ¥17292 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "广东",
    "duration": 10,
    "price": 17292,
    "originalPrice": 19429,
    "priceUnit": "人",
    "departureDate": "2026-06-27",
    "returnDate": "2026-07-07",
    "transportType": "飞机往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "10早餐9正餐",
    "singleSupplement": 4323,
    "singleSupplementNote": "单人出行需补单房差￥4323，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 25,
    "totalSeats": 40,
    "highlights": [
      "广东必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往广东",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "第5天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 6,
        "title": "第6天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 7,
        "title": "第7天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 8,
        "title": "第8天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 9,
        "title": "第9天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 10,
        "title": "告别广东，返回温馨的家",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.0,
    "reviewCount": 193,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "海岛度假",
      "纯玩",
      "品质"
    ],
    "isHot": true,
    "isNew": true,
    "isFlashSale": true,
    "discountRate": 11,
    "groupSize": "30人常规团",
    "theme": "海岛度假",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.464749",
    "updatedAt": "2026-05-07T01:02:13.464749"
  },
  {
    "id": "tour_233",
    "title": "<彩虹之旅花园大道9日游>深圳集合，反季出行避暑好去处，花园大道，香槟日落，酒庄酒店，醉美南非 【畅游两大首都】比勒陀利亚（茨瓦内）、开普敦【领略经典岁月】约翰内斯堡、太阳城蕴藏历史文化，花园大道（奈斯纳+摩梭湾）【用心甄选酒店】非洲茅草屋顶酒店+约堡/开普敦四星酒店+花园大道四星酒店【晨游百年 游玩目的地： 南非 行程天数： 9天 交通方式： 飞机/飞机 ¥17814 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "广东",
    "duration": 9,
    "price": 17814,
    "priceUnit": "人",
    "departureDate": "2026-07-29",
    "returnDate": "2026-08-07",
    "transportType": "飞机往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "9早餐8正餐",
    "singleSupplement": 4453,
    "singleSupplementNote": "单人出行需补单房差￥4453，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 24,
    "totalSeats": 34,
    "highlights": [
      "广东必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往广东",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "第5天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 6,
        "title": "第6天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 7,
        "title": "第7天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 8,
        "title": "第8天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 9,
        "title": "告别广东，返回温馨的家",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 3.6,
    "reviewCount": 452,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "古镇文化",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "古镇文化",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.464749",
    "updatedAt": "2026-05-07T01:02:13.464749"
  },
  {
    "id": "tour_234",
    "title": "<南非9日游>深圳集合，含省时内陆飞，人间天路花园大道，特色风情酒店，品南非特色餐，A线信号山品香槟，B线观赏lesidi民俗村 A行程安排开普敦信号山品尝香槟，俯瞰开普敦市容；开普敦不容错过的美景之一【白色海滩】；【马来人文化街】，感受古老的文化气息与五颜六色的小房子B行程安排于lesidi民俗文化村，观赏独具当地的五大民族； 游玩目的地： 南非 行程天数： 9天 交通方式： 飞机/飞机 ¥11318 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "广东",
    "duration": 9,
    "price": 11318,
    "originalPrice": 12040,
    "priceUnit": "人",
    "departureDate": "2026-07-04",
    "returnDate": "2026-07-13",
    "transportType": "飞机往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "9早餐8正餐",
    "singleSupplement": 2829,
    "singleSupplementNote": "单人出行需补单房差￥2829，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 29,
    "totalSeats": 39,
    "highlights": [
      "广东必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往广东",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "第5天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 6,
        "title": "第6天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 7,
        "title": "第7天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 8,
        "title": "第8天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 9,
        "title": "告别广东，返回温馨的家",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 3.7,
    "reviewCount": 253,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "海岛度假",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "discountRate": 6,
    "groupSize": "30人常规团",
    "theme": "海岛度假",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.464749",
    "updatedAt": "2026-05-07T01:02:13.464749"
  },
  {
    "id": "tour_235",
    "title": "<迪拜-阿布扎比6日游>香港直飞，畅游四个酋长国，迪拜奇迹花园，特别安排亚特兰蒂斯除夕夜安排丰盛跨年大餐 ：搭乘五星豪华阿联酋航空，香港直飞迪拜，享受舒适空中服务，体验空客A380大客机观多项世界之醉，领略奢华迪拜的魅力，感受当地风土人情，畅游四个酋长国：迪拜海湾上的明珠，阿拉伯联合酋长国第二大酋长国&n 游玩目的地： 迪拜 行程天数： 6天 交通方式： 飞机/飞机 ¥11531 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "其他",
    "duration": 6,
    "price": 11531,
    "priceUnit": "人",
    "departureDate": "2026-06-27",
    "returnDate": "2026-07-03",
    "transportType": "飞机往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "6早餐5正餐",
    "singleSupplement": 2882,
    "singleSupplementNote": "单人出行需补单房差￥2882，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 21,
    "totalSeats": 36,
    "highlights": [
      "其他必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往其他",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "第5天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 6,
        "title": "告别其他，返回温馨的家",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 3.9,
    "reviewCount": 156,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "自然风光",
      "纯玩",
      "品质"
    ],
    "isHot": true,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "自然风光",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.464749",
    "updatedAt": "2026-05-07T01:02:13.464749"
  },
  {
    "id": "tour_236",
    "title": "<新加坡4晚5日半自助游>深圳（香港）直飞 周末我在新加坡  全程四星酒店 纯玩无购物 两天自由活动 鱼尾狮 哈芝巷 滨海湾花园 倾情推荐纯玩保证：保证全程无任何指定购物点，无任何额外收费自费项目，更多游览观光休闲时间精选酒店：新加坡华星酒店或曼尔洛酒店或备选酒店。黄金航班：新加坡航空旗下胜安航空，享受一流空中服务，丰盛餐饮免费 游玩目的地： 新加坡 行程天数： 5天 交通方式： 飞机/飞机 ¥4097 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "广东",
    "duration": 5,
    "price": 4097,
    "priceUnit": "人",
    "departureDate": "2026-06-02",
    "returnDate": "2026-06-07",
    "transportType": "高铁往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "5早餐4正餐",
    "singleSupplement": 1024,
    "singleSupplementNote": "单人出行需补单房差￥1024，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 13,
    "totalSeats": 38,
    "highlights": [
      "广东必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往广东",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "告别广东，返回温馨的家",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.5,
    "reviewCount": 520,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "自然风光",
      "纯玩",
      "品质"
    ],
    "isHot": true,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "自然风光",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.464749",
    "updatedAt": "2026-05-07T01:02:13.464749"
  },
  {
    "id": "tour_237",
    "title": "<新加坡4晚5日美食之旅游>香港直飞  鱼尾狮公园 滨海湾花园 克拉码头游船 乌节路 新加坡金沙*** 空中花园  娘惹体验馆 海洋馆 选择新加坡的八大理由:理由之一：新加坡是公认安全系数高，犯罪率低之一的国家，安全放心。理由之二：环境与食物极其卫生，文化和语言方面的共通，是东南亚中适合老人和小孩出游的国家理由之三：行程拒绝常规团队“ 游玩目的地： 新加坡 行程天数： 5天 交通方式： 飞机/飞机 ¥6959 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "云南",
    "duration": 5,
    "price": 6959,
    "priceUnit": "人",
    "departureDate": "2026-07-03",
    "returnDate": "2026-07-08",
    "transportType": "高铁往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "5早餐4正餐",
    "singleSupplement": 1739,
    "singleSupplementNote": "单人出行需补单房差￥1739，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 6,
    "totalSeats": 46,
    "highlights": [
      "云南必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往云南",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：云南游览",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：云南游览",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：云南游览",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "告别云南，返回温馨的家",
        "description": "今日安排云南精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.9,
    "reviewCount": 793,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "古镇文化",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "古镇文化",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.464749",
    "updatedAt": "2026-05-07T01:02:13.464749"
  },
  {
    "id": "tour_238",
    "title": "<美国-加拿大东西海岸17日游>深圳集中 加航直飞 美加东西海岸大环游  史丹利公园 自由女神游船 布查德花园 17里湾 丹麦村 ◆经典之旅自由女神游船，17里湾，布查德花园，尼亚加拉大瀑布，圣地亚哥一日游；◆增游美西旅游城市金融中心旧金山；◆沿加州一号公路欣赏绝美的太平洋海岸风光；◆游览充满丹麦风情的丹麦村，独具西西 游玩目的地： 行程天数： 17天 交通方式： 飞机/飞机 ¥22136 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "广东",
    "duration": 17,
    "price": 22136,
    "originalPrice": 26669,
    "priceUnit": "人",
    "departureDate": "2026-06-16",
    "returnDate": "2026-07-03",
    "transportType": "飞机往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "17早餐16正餐",
    "singleSupplement": 5534,
    "singleSupplementNote": "单人出行需补单房差￥5534，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 15,
    "totalSeats": 40,
    "highlights": [
      "广东必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往广东",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "第5天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 6,
        "title": "第6天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 7,
        "title": "第7天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 8,
        "title": "第8天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 9,
        "title": "第9天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 10,
        "title": "第10天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 11,
        "title": "第11天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 12,
        "title": "第12天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 13,
        "title": "第13天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 14,
        "title": "第14天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 15,
        "title": "第15天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 16,
        "title": "第16天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 17,
        "title": "告别广东，返回温馨的家",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.2,
    "reviewCount": 95,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "民族风情",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": true,
    "isFlashSale": true,
    "discountRate": 17,
    "groupSize": "30人常规团",
    "theme": "民族风情",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.464749",
    "updatedAt": "2026-05-07T01:02:13.464749"
  },
  {
    "id": "tour_239",
    "title": "<巴厘岛+新加坡5晚6日游>玩转双城 深圳去港回 蓝梦岛 金银岛双岛游  圣淘沙名胜世界 滨海湾花园 鱼尾狮公园 精华摘要巴厘岛——南纬8度的度假天堂；新加坡——时尚精尖的亚洲都会；纯朴·摩登·双城体验·为你开启！航班搭乘新加坡航空或圣安航空客机，全球最佳航空公司之一，体验空中五星服务。巴厘岛安排蓝梦岛+贝尼达 游玩目的地： 新加坡 巴厘岛 行程天数： 6天 交通方式： 飞机/飞机 ¥3511 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "广东",
    "duration": 6,
    "price": 3511,
    "originalPrice": 4179,
    "priceUnit": "人",
    "departureDate": "2026-05-29",
    "returnDate": "2026-06-04",
    "transportType": "飞机往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "6早餐5正餐",
    "singleSupplement": 877,
    "singleSupplementNote": "单人出行需补单房差￥877，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 18,
    "totalSeats": 48,
    "highlights": [
      "广东必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往广东",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "第5天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 6,
        "title": "告别广东，返回温馨的家",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.5,
    "reviewCount": 810,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "自然风光",
      "纯玩",
      "品质"
    ],
    "isHot": true,
    "isNew": false,
    "isFlashSale": false,
    "discountRate": 16,
    "groupSize": "30人常规团",
    "theme": "自然风光",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.464749",
    "updatedAt": "2026-05-07T01:02:13.464749"
  },
  {
    "id": "tour_240",
    "title": "<以色列约旦10日游>国泰航空/香港直飞/圣城耶路撒冷/杰拉什古城/佩特拉古城/巴哈伊花园/红海/死海升级五星酒店/游船畅游加利利湖 ≈≈≈≈≈≈≈≈≈≈≈≈≈≈★★≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈★国泰航空公司，香港直飞特拉维夫，免除转机所带来的旅途疲劳。★全程当地酒店，死海、红海免费升级五星酒店。★特别体验：游船畅游澈彻明净的加利 游玩目的地： 以色列 行程天数： 10天 交通方式： 飞机/飞机 ¥13904 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "其他",
    "duration": 10,
    "price": 13904,
    "originalPrice": 16357,
    "priceUnit": "人",
    "departureDate": "2026-05-30",
    "returnDate": "2026-06-09",
    "transportType": "飞机往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "10早餐9正餐",
    "singleSupplement": 3476,
    "singleSupplementNote": "单人出行需补单房差￥3476，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 12,
    "totalSeats": 37,
    "highlights": [
      "其他必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往其他",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "第5天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 6,
        "title": "第6天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 7,
        "title": "第7天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 8,
        "title": "第8天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 9,
        "title": "第9天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 10,
        "title": "告别其他，返回温馨的家",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 3.7,
    "reviewCount": 578,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "古镇文化",
      "纯玩",
      "品质"
    ],
    "isHot": true,
    "isNew": false,
    "isFlashSale": false,
    "discountRate": 15,
    "groupSize": "30人常规团",
    "theme": "古镇文化",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.464749",
    "updatedAt": "2026-05-07T01:02:13.464749"
  },
  {
    "id": "tour_241",
    "title": "<泰国-曼谷-芭堤雅4晚5日游>深圳往返、含导服费、 龙虎园、大皇宫玉佛寺、芭堤雅出海、海鲜升级、娜通花园餐厅，美食一网打尽 产品详情❤行程秒懂❤✿【行程】经典全览大皇宫、玉佛寺、热带水果园、泰式古法按摩、骑大象等；东芭乐园、双岛连游、神殿寺；✿【人气美食】泰式风味餐、印象暹罗自助餐、海鲜餐升级、芭堤雅音乐渔村、平均餐标 游玩目的地： 泰国 行程天数： 5天 交通方式： 飞机/飞机 ¥2325 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "广东",
    "duration": 5,
    "price": 2325,
    "priceUnit": "人",
    "departureDate": "2026-06-17",
    "returnDate": "2026-06-22",
    "transportType": "高铁往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "5早餐4正餐",
    "singleSupplement": 581,
    "singleSupplementNote": "单人出行需补单房差￥581，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 27,
    "totalSeats": 37,
    "highlights": [
      "广东必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往广东",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "告别广东，返回温馨的家",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 3.5,
    "reviewCount": 196,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "美食之旅",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "美食之旅",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.464749",
    "updatedAt": "2026-05-07T01:02:13.464749"
  },
  {
    "id": "tour_242",
    "title": "<新加坡双飞4晚5日半自助游>送乳胶枕，全新上线，可联运，2天自由活动，含新加坡游船，滨海湾花园，可配联运，4星酒店 体验贯穿于整个城市的新加坡河是新加坡的生命之河，乘游船观赏新加坡的城市风光。 游玩目的地： 新加坡 行程天数： 5天 交通方式： 飞机/飞机 ¥3694 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "其他",
    "duration": 5,
    "price": 3694,
    "originalPrice": 3972,
    "priceUnit": "人",
    "departureDate": "2026-06-16",
    "returnDate": "2026-06-21",
    "transportType": "高铁往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "5早餐4正餐",
    "singleSupplement": 923,
    "singleSupplementNote": "单人出行需补单房差￥923，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 13,
    "totalSeats": 48,
    "highlights": [
      "其他必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往其他",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "告别其他，返回温馨的家",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.2,
    "reviewCount": 592,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "自然风光",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "discountRate": 7,
    "groupSize": "30人常规团",
    "theme": "自然风光",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.464749",
    "updatedAt": "2026-05-07T01:02:13.464749"
  },
  {
    "id": "tour_243",
    "title": "<迪拜-土耳其12日游>香港直飞，谢赫扎耶德大清真寺，地中海，爱琴海双海寻梦，以弗所古城、棉花堡、卡帕多奇亚，热气球 ：住宿：番红花城安排入住民宿，入住五星酒店，特别安排1晚卡帕多奇亚洞穴酒店，棉花堡1晚温泉酒店美景：亚欧大陆在此交汇，地中海，爱琴海双海寻梦，天然奇景棉花堡，外星美景卡帕多奇亚迪拜城市游览，领 游玩目的地： 安哥拉 行程天数： 13天 交通方式： 飞机/飞机 ¥9919 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "其他",
    "duration": 13,
    "price": 9919,
    "originalPrice": 12881,
    "priceUnit": "人",
    "departureDate": "2026-08-02",
    "returnDate": "2026-08-15",
    "transportType": "飞机往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "13早餐12正餐",
    "singleSupplement": 2479,
    "singleSupplementNote": "单人出行需补单房差￥2479，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 11,
    "totalSeats": 36,
    "highlights": [
      "其他必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往其他",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "第5天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 6,
        "title": "第6天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 7,
        "title": "第7天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 8,
        "title": "第8天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 9,
        "title": "第9天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 10,
        "title": "第10天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 11,
        "title": "第11天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 12,
        "title": "第12天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 13,
        "title": "告别其他，返回温馨的家",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.4,
    "reviewCount": 237,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "海岛度假",
      "纯玩",
      "品质"
    ],
    "isHot": true,
    "isNew": false,
    "isFlashSale": false,
    "discountRate": 23,
    "groupSize": "30人常规团",
    "theme": "海岛度假",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.464749",
    "updatedAt": "2026-05-07T01:02:13.464749"
  },
  {
    "id": "tour_244",
    "title": "<迪拜-土耳其13日游>迪拜博物馆、圣索非亚大教堂、蓝色清真寺、地中海，爱琴海双海寻梦，天然奇景棉花堡，外星美景卡帕多奇亚 ：住宿：番红花城安排入住民宿，入住五星酒店，特别安排1晚卡帕多奇亚洞穴酒店，棉花堡1晚温泉酒店美景：亚欧大陆在此交汇，地中海，爱琴海双海寻梦，天然奇景棉花堡，外星美景卡帕多奇亚迪拜城市游览，领 游玩目的地： 安哥拉 行程天数： 13天 交通方式： 飞机/飞机 ¥8289 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "其他",
    "duration": 13,
    "price": 8289,
    "priceUnit": "人",
    "departureDate": "2026-06-20",
    "returnDate": "2026-07-03",
    "transportType": "飞机往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "13早餐12正餐",
    "singleSupplement": 2072,
    "singleSupplementNote": "单人出行需补单房差￥2072，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 11,
    "totalSeats": 46,
    "highlights": [
      "其他必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往其他",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "第5天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 6,
        "title": "第6天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 7,
        "title": "第7天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 8,
        "title": "第8天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 9,
        "title": "第9天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 10,
        "title": "第10天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 11,
        "title": "第11天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 12,
        "title": "第12天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 13,
        "title": "告别其他，返回温馨的家",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 3.9,
    "reviewCount": 368,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "海岛度假",
      "纯玩",
      "品质"
    ],
    "isHot": true,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "海岛度假",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.464749",
    "updatedAt": "2026-05-07T01:02:13.464749"
  },
  {
    "id": "tour_245",
    "title": "<俄罗斯-莫斯科+圣彼得堡9日游>南航深圳直飞，团队免签，冬宫，彼得保罗要塞，夏宫花园，圣三一教堂 &n 游玩目的地： 俄罗斯 瑞典 行程天数： 9天 交通方式： 飞机/飞机 ¥5292 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "广东",
    "duration": 9,
    "price": 5292,
    "priceUnit": "人",
    "departureDate": "2026-07-16",
    "returnDate": "2026-07-25",
    "transportType": "飞机往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "9早餐8正餐",
    "singleSupplement": 1323,
    "singleSupplementNote": "单人出行需补单房差￥1323，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 29,
    "totalSeats": 49,
    "highlights": [
      "广东必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往广东",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "第5天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 6,
        "title": "第6天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 7,
        "title": "第7天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 8,
        "title": "第8天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 9,
        "title": "告别广东，返回温馨的家",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.8,
    "reviewCount": 750,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "自然风光",
      "纯玩",
      "品质"
    ],
    "isHot": true,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "自然风光",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.464749",
    "updatedAt": "2026-05-07T01:02:13.464749"
  },
  {
    "id": "tour_246",
    "title": "<新西兰南北岛4飞9日游>纯净游/深圳直飞/鲁冰花灿烂的季节/指环王取景地/瓦纳卡湖/伊甸山/罗托鲁亚湖/皇后镇/毛利文化村/喂羊驼 产品概要行程天数：9天7晚成团地点：深圳成团目的地：基督城往返交通：飞机/飞机报名截止时间：团期前15天17点重要提示新西兰旅游温馨小提示语言：新西兰的官方语言为英语，各大商场和酒店都有通晓各国语言 游玩目的地： 新西兰 行程天数： 9天 交通方式： 飞机/飞机 ¥16716 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "广东",
    "duration": 9,
    "price": 16716,
    "priceUnit": "人",
    "departureDate": "2026-07-17",
    "returnDate": "2026-07-26",
    "transportType": "飞机往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "9早餐8正餐",
    "singleSupplement": 4179,
    "singleSupplementNote": "单人出行需补单房差￥4179，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 6,
    "totalSeats": 46,
    "highlights": [
      "广东必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往广东",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "第5天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 6,
        "title": "第6天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 7,
        "title": "第7天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 8,
        "title": "第8天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 9,
        "title": "告别广东，返回温馨的家",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 3.9,
    "reviewCount": 494,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "古镇文化",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "古镇文化",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.464749",
    "updatedAt": "2026-05-07T01:02:13.464749"
  },
  {
    "id": "tour_247",
    "title": "<新西兰纯南岛4飞9日游>美食美景纯玩无购物/深圳直飞/鲁冰花灿烂的季节/好牧羊人教堂/淘金小镇箭镇/米尔福德峡湾/蓝眼企鹅/库克山/特色美食 产品概要行程天数：9天7晚成团地点：深圳成团目的地：基督城往返交通：飞机/飞机报名截止时间：团期前15天17点重要提示新西兰旅游温馨小提示语言：新西兰的官方语言为英语，各大商场和酒店都有通晓各国语 游玩目的地： 新西兰 行程天数： 9天 交通方式： 飞机/飞机 ¥20329 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "广东",
    "duration": 9,
    "price": 20329,
    "priceUnit": "人",
    "departureDate": "2026-06-16",
    "returnDate": "2026-06-25",
    "transportType": "飞机往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "9早餐8正餐",
    "singleSupplement": 5082,
    "singleSupplementNote": "单人出行需补单房差￥5082，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 10,
    "totalSeats": 40,
    "highlights": [
      "广东必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往广东",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "第5天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 6,
        "title": "第6天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 7,
        "title": "第7天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 8,
        "title": "第8天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 9,
        "title": "告别广东，返回温馨的家",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 3.9,
    "reviewCount": 295,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "美食之旅",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": true,
    "isFlashSale": true,
    "groupSize": "30人常规团",
    "theme": "美食之旅",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.464749",
    "updatedAt": "2026-05-07T01:02:13.464749"
  },
  {
    "id": "tour_248",
    "title": "<天竺韵印度6-8日游>深起港止/全程无自费/不进店/泰姬陵/阿格拉堡/莲花庙/琥珀堡/登纳哈加尔堡俯瞰斋普尔/瑜伽体验/赏歌舞剧 【甄选航班】：印度捷特航空印度五星航空公司，享受优质机舱服务和空中美食【尊享舒适】：全程五星酒店，升级2晚国际五星，享受安逸舒适的住宿体验。【黄金组合】：印度经典闻名“金三角”：新德里、阿格拉、斋普尔 游玩目的地： 印度 行程天数： 6天 交通方式： 飞机/飞机 ¥4978 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "其他",
    "duration": 6,
    "price": 4978,
    "priceUnit": "人",
    "departureDate": "2026-07-30",
    "returnDate": "2026-08-05",
    "transportType": "飞机往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "6早餐5正餐",
    "singleSupplement": 1244,
    "singleSupplementNote": "单人出行需补单房差￥1244，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 18,
    "totalSeats": 43,
    "highlights": [
      "其他必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往其他",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "第5天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 6,
        "title": "告别其他，返回温馨的家",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.2,
    "reviewCount": 388,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "美食之旅",
      "纯玩",
      "品质"
    ],
    "isHot": true,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "美食之旅",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.464749",
    "updatedAt": "2026-05-07T01:02:13.464749"
  },
  {
    "id": "tour_249",
    "title": "<土耳其12日游>可升热气球/洞穴，特色瓦罐餐/卡帕惬意连住，海底隧道列车，A线长寿之乡，B线番红花城，香港QR 重要提示蓝色清真寺官方发布通知：3月1日至5月15日蓝色清真寺将关闭维修，届时此景点将改为外观，如若情况允许并就近安排当天开门的其他清真寺，具体以境外实际安排为准，烦请注意此通知，谢谢！土耳其主色调神 游玩目的地： 安哥拉 行程天数： 12天 交通方式： 飞机/飞机 ¥6960 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "其他",
    "duration": 12,
    "price": 6960,
    "priceUnit": "人",
    "departureDate": "2026-07-28",
    "returnDate": "2026-08-09",
    "transportType": "飞机往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "12早餐11正餐",
    "singleSupplement": 1740,
    "singleSupplementNote": "单人出行需补单房差￥1740，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 21,
    "totalSeats": 31,
    "highlights": [
      "其他必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往其他",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "第5天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 6,
        "title": "第6天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 7,
        "title": "第7天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 8,
        "title": "第8天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 9,
        "title": "第9天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 10,
        "title": "第10天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 11,
        "title": "第11天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 12,
        "title": "告别其他，返回温馨的家",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.0,
    "reviewCount": 778,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "自然风光",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "自然风光",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.464749",
    "updatedAt": "2026-05-07T01:02:13.464749"
  },
  {
    "id": "tour_250",
    "title": "<越南-河内--陆龙湾-下龙湾5日游>深圳直飞、全程四星带泳池酒店、单人保证拼房、莲花海鲜自助餐、含无限流量卡、含签证费 产品概要行程天数：5天3晚成团地点：深圳成团目的地：河内往返交通：飞机/飞机报名截止时间：团期前3天18点接待标准•用餐安排：全程当地美食体验，特别安排莲花海鲜自助餐•住宿安排：全程四星酒店•行程安排 游玩目的地： 越南 行程天数： 5天 交通方式： 飞机/飞机 ¥1729 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "广东",
    "duration": 5,
    "price": 1729,
    "priceUnit": "人",
    "departureDate": "2026-06-19",
    "returnDate": "2026-06-24",
    "transportType": "高铁往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "5早餐4正餐",
    "singleSupplement": 432,
    "singleSupplementNote": "单人出行需补单房差￥432，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 27,
    "totalSeats": 32,
    "highlights": [
      "广东必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往广东",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "告别广东，返回温馨的家",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.8,
    "reviewCount": 139,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "美食之旅",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "美食之旅",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.465750",
    "updatedAt": "2026-05-07T01:02:13.465750"
  },
  {
    "id": "tour_251",
    "title": "<日本东京-富士山-京都-大阪6日游>本州赏花 富士山芝樱祭 招财猫圣地 富士急乐园嗨玩 温泉旅馆 日式烤肉 相扑火锅 产品概要行程天数：6天5晚成团地点：深圳成团目的地：大阪往返交通：飞机/飞机报名截止时间：团期前15天0点接待标准•用餐安排：优质美食大放送：温泉会席料理、相扑火锅、蟹道乐、京都料理、日式烤肉•住宿 游玩目的地： 日本 名古屋 行程天数： 6天 交通方式： 飞机/飞机 ¥6203 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "广东",
    "duration": 6,
    "price": 6203,
    "priceUnit": "人",
    "departureDate": "2026-06-18",
    "returnDate": "2026-06-24",
    "transportType": "飞机往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "6早餐5正餐",
    "singleSupplement": 1550,
    "singleSupplementNote": "单人出行需补单房差￥1550，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 7,
    "totalSeats": 37,
    "highlights": [
      "广东必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往广东",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "第5天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 6,
        "title": "告别广东，返回温馨的家",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 3.9,
    "reviewCount": 799,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "海岛度假",
      "纯玩",
      "品质"
    ],
    "isHot": true,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "海岛度假",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.465750",
    "updatedAt": "2026-05-07T01:02:13.465750"
  },
  {
    "id": "tour_252",
    "title": "<俄罗斯双首都+谢镇9天游>南方航空 正点航班  广州起止 29人小团 爱国者公园 红场 冬宫 巴普诺夫森林公园 产品概要行程天数：8天6晚成团地点：广州成团目的地：莫斯科往返交通：飞机/飞机报名截止时间：团期前6天18点接待标准•用餐安排：两顿俄罗斯风味餐+中餐（餐标10美金）满足你的味蕾•住宿安排：全程舒适酒 游玩目的地： 俄罗斯 法国 瑞典 芬兰 行程天数： 8天 交通方式： 飞机/飞机 ¥10069 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "广东",
    "duration": 8,
    "price": 10069,
    "originalPrice": 11187,
    "priceUnit": "人",
    "departureDate": "2026-05-17",
    "returnDate": "2026-05-25",
    "transportType": "飞机往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "8早餐7正餐",
    "singleSupplement": 2517,
    "singleSupplementNote": "单人出行需补单房差￥2517，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 20,
    "totalSeats": 35,
    "highlights": [
      "广东必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往广东",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "第5天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 6,
        "title": "第6天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 7,
        "title": "第7天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 8,
        "title": "告别广东，返回温馨的家",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.2,
    "reviewCount": 740,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "自然风光",
      "纯玩",
      "品质"
    ],
    "isHot": true,
    "isNew": true,
    "isFlashSale": false,
    "discountRate": 10,
    "groupSize": "30人常规团",
    "theme": "自然风光",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.465750",
    "updatedAt": "2026-05-07T01:02:13.465750"
  },
  {
    "id": "tour_253",
    "title": "<新加坡机票+当地5晚6日游>自营童趣狮城 品途专线 1单1团纯玩0购物，圣淘沙环球影城，SEA海洋馆，花芭山缆车，摩天轮，夜间动物园，半自助畅玩坡er县 •用餐安排：Day4特别赠送花芭山午餐一顿。•住宿安排：新加坡酒店任选，详见前台。•行程安排：1、半自助行程，轻松自由，张弛有度。2、安排13座小车+中文司机，专车游览，舒适不拼团。•游玩安排：一次玩 游玩目的地： 新加坡 行程天数： 6天 交通方式： 自行安排/自行安排 ¥6218 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "其他",
    "duration": 6,
    "price": 6218,
    "originalPrice": 7582,
    "priceUnit": "人",
    "departureDate": "2026-06-14",
    "returnDate": "2026-06-20",
    "transportType": "飞机往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "6早餐5正餐",
    "singleSupplement": 1554,
    "singleSupplementNote": "单人出行需补单房差￥1554，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 5,
    "totalSeats": 45,
    "highlights": [
      "其他必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往其他",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "第5天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 6,
        "title": "告别其他，返回温馨的家",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.2,
    "reviewCount": 344,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "自然风光",
      "纯玩",
      "品质"
    ],
    "isHot": true,
    "isNew": true,
    "isFlashSale": false,
    "discountRate": 18,
    "groupSize": "30人常规团",
    "theme": "自然风光",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.465750",
    "updatedAt": "2026-05-07T01:02:13.465750"
  },
  {
    "id": "tour_254",
    "title": "<俄罗斯双城9日游>广州EO直飞，双点进出，不走回头路，冬宫博物馆，夏宫花园，卢日尼基足球场，谢尔盖耶夫镇，莫斯科大学，保证拼房 【航班优选】中国南方航空公司，深圳直飞，安全舒适，告别转机航班，让你轻松倒时差【酒店安排】全程入住舒适酒店，干净舒适❤❤❤❤❤❤❤❤❤❤❤❤❤❤❤❤❤【精彩行程】❤❤ 游玩目的地： 俄罗斯 行程天数： 9天 交通方式： 飞机/飞机 ¥8369 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "广东",
    "duration": 9,
    "price": 8369,
    "priceUnit": "人",
    "departureDate": "2026-05-26",
    "returnDate": "2026-06-04",
    "transportType": "飞机往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "9早餐8正餐",
    "singleSupplement": 2092,
    "singleSupplementNote": "单人出行需补单房差￥2092，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 10,
    "totalSeats": 35,
    "highlights": [
      "广东必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往广东",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "第5天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 6,
        "title": "第6天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 7,
        "title": "第7天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 8,
        "title": "第8天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 9,
        "title": "告别广东，返回温馨的家",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 3.7,
    "reviewCount": 809,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "自然风光",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": true,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "自然风光",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.465750",
    "updatedAt": "2026-05-07T01:02:13.465750"
  },
  {
    "id": "tour_255",
    "title": "<泰国曼谷-芭提雅6日游>乐开花爸妈游，深圳直飞0自费，安排三天午休，建立儿女微信群，大皇宫，水果园，56楼自助餐，东芭乐园，含泰国电话卡 行程◆专属于爸爸妈妈的旅游团，：『贴心安排1』六天行程三天午休，旅游休息两不误；『贴心升级2』建立儿女微信群，每日领队及时汇报，让家人放心、安心，老人家开心。◆：行程安排丰富，让您的旅途轻松、悠闲，充 游玩目的地： 泰国 行程天数： 6天 交通方式： 飞机/飞机 ¥4912 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "广东",
    "duration": 6,
    "price": 4912,
    "priceUnit": "人",
    "departureDate": "2026-05-31",
    "returnDate": "2026-06-06",
    "transportType": "飞机往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "6早餐5正餐",
    "singleSupplement": 1228,
    "singleSupplementNote": "单人出行需补单房差￥1228，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 10,
    "totalSeats": 45,
    "highlights": [
      "广东必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往广东",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "第5天：广东游览",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 6,
        "title": "告别广东，返回温馨的家",
        "description": "今日安排广东精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 3.6,
    "reviewCount": 171,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "自然风光",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": true,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "自然风光",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.465750",
    "updatedAt": "2026-05-07T01:02:13.465750"
  },
  {
    "id": "tour_256",
    "title": "<新加坡+民丹岛机票+当地4晚5日游>4人立减1500/单，0自费0购物，2人即可成行，圣淘沙，鱼尾狮公园，2晚新加坡网红酒店，双重体验 行程天数：5天4晚成团地点：新加坡成团目的地：新加坡往返交通：飞机/飞机报名截止时间：团期前4天18点 游玩目的地： 新加坡 行程天数： 5天 交通方式： 飞机/飞机 ¥6066 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "其他",
    "duration": 5,
    "price": 6066,
    "priceUnit": "人",
    "departureDate": "2026-06-09",
    "returnDate": "2026-06-14",
    "transportType": "高铁往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "5早餐4正餐",
    "singleSupplement": 1516,
    "singleSupplementNote": "单人出行需补单房差￥1516，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 23,
    "totalSeats": 38,
    "highlights": [
      "其他必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往其他",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "告别其他，返回温馨的家",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.3,
    "reviewCount": 233,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "自然风光",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "自然风光",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.465750",
    "updatedAt": "2026-05-07T01:02:13.465750"
  },
  {
    "id": "tour_257",
    "title": "<花少同款漫游英国机票+当地8晚10日游>爱丁堡、牛津、温德米尔湖区、三大古堡、爱丁堡城堡、温莎城堡、华威城堡，伦敦深度，全景环游不列颠 全景：纵览英格兰、苏格兰，花少推荐必游体验，全面畅游英伦美景；贴心：含首尾伦敦希斯罗机场34星酒店，全程含自助早餐，当地参团便捷，中文导游&外籍司机；文化之旅：莎士比亚出生地斯特拉福德小镇，世 游玩目的地： 英国 行程天数： 10天 交通方式： 飞机/飞机 ¥9888 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "其他",
    "duration": 10,
    "price": 9888,
    "priceUnit": "人",
    "departureDate": "2026-07-21",
    "returnDate": "2026-07-31",
    "transportType": "飞机往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "10早餐9正餐",
    "singleSupplement": 2472,
    "singleSupplementNote": "单人出行需补单房差￥2472，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 27,
    "totalSeats": 37,
    "highlights": [
      "其他必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往其他",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "第5天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 6,
        "title": "第6天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 7,
        "title": "第7天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 8,
        "title": "第8天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 9,
        "title": "第9天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 10,
        "title": "告别其他，返回温馨的家",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.8,
    "reviewCount": 248,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "古镇文化",
      "纯玩",
      "品质"
    ],
    "isHot": true,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "古镇文化",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.465750",
    "updatedAt": "2026-05-07T01:02:13.465750"
  },
  {
    "id": "tour_258",
    "title": "<北欧丹麦+挪威+芬兰+瑞典10日-13日游>哥本哈根进出童话王国哥本哈根，古老都城奥斯陆，A、B线幸福小镇德拉厄，C线双极光 •用餐安排：全程共含8顿正餐，中式午晚餐（5菜1汤）,810人一桌，具体用餐次数详见行程，不含餐部分敬请客人自理。（退餐标准为10欧/人/餐）•住宿安排：当地标准酒店双人间5晚(含西式早餐)，游轮2晚 游玩目的地： 丹麦 瑞典 芬兰 挪威 行程天数： 10天 交通方式： 飞机/飞机 ¥7729 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "其他",
    "duration": 10,
    "price": 7729,
    "priceUnit": "人",
    "departureDate": "2026-07-26",
    "returnDate": "2026-08-05",
    "transportType": "飞机往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "10早餐9正餐",
    "singleSupplement": 1932,
    "singleSupplementNote": "单人出行需补单房差￥1932，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 29,
    "totalSeats": 49,
    "highlights": [
      "其他必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往其他",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "第5天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 6,
        "title": "第6天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 7,
        "title": "第7天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 8,
        "title": "第8天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 9,
        "title": "第9天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 10,
        "title": "告别其他，返回温馨的家",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.4,
    "reviewCount": 248,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "自然风光",
      "纯玩",
      "品质"
    ],
    "isHot": true,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "自然风光",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.465750",
    "updatedAt": "2026-05-07T01:02:13.465750"
  },
  {
    "id": "tour_259",
    "title": "<泰国-清迈机票+当地4晚5日游>住1晚拜县  纯玩1 单1团 小黄屋 湖畔花园餐厅 美莎大象营 黑白庙游 赠泰国电话卡 介绍◆【闪耀亮点】打破常规、绝无套路、纯玩、无自费；2人起独立成团，①单①团不拼其它客人，专车+中文专导！◆【超强实力】泰国自己的地接社、保证纯玩、全程中文导游，24小时中文微信管家服务、无需担心语 游玩目的地： 泰国 公主邮轮 行程天数： 5天 交通方式： 自行安排/自行安排 ¥4430 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "其他",
    "duration": 5,
    "price": 4430,
    "originalPrice": 5337,
    "priceUnit": "人",
    "departureDate": "2026-07-25",
    "returnDate": "2026-07-30",
    "transportType": "高铁往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "5早餐4正餐",
    "singleSupplement": 1107,
    "singleSupplementNote": "单人出行需补单房差￥1107，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 18,
    "totalSeats": 38,
    "highlights": [
      "其他必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往其他",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "告别其他，返回温馨的家",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 3.8,
    "reviewCount": 348,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "自然风光",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "discountRate": 17,
    "groupSize": "30人常规团",
    "theme": "自然风光",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.465750",
    "updatedAt": "2026-05-07T01:02:13.465750"
  },
  {
    "id": "tour_260",
    "title": "<莫斯科圣彼得堡机票+当地6晚8日游>全国出发，克宫，红场，新圣女公墓，亚历山大花园，冬宫，彼得夏宫，纯玩无购物 产品概要行程天数：8天6晚成团地点：莫斯科成团目的地：莫斯科往返交通：飞机/飞机报名截止时间：团期前20天0点接待标准•用餐安排：提供酒店自助式早餐和中式及俄式的午晚餐•住宿安排：提供当地酒店•行程安 游玩目的地： 行程天数： 8天 交通方式： 飞机/飞机 ¥11160 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "其他",
    "duration": 8,
    "price": 11160,
    "priceUnit": "人",
    "departureDate": "2026-06-09",
    "returnDate": "2026-06-17",
    "transportType": "飞机往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "8早餐7正餐",
    "singleSupplement": 2790,
    "singleSupplementNote": "单人出行需补单房差￥2790，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 26,
    "totalSeats": 46,
    "highlights": [
      "其他必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往其他",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "第5天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 6,
        "title": "第6天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 7,
        "title": "第7天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 8,
        "title": "告别其他，返回温馨的家",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.2,
    "reviewCount": 786,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "自然风光",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "自然风光",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.465750",
    "updatedAt": "2026-05-07T01:02:13.465750"
  },
  {
    "id": "tour_261",
    "title": "<新马机票+当地5日游>全新上线，0购物0自费，4成人起订成团，新加坡团签，畅游新加坡花园城市，云顶高原，吉隆坡双峰塔 产品概要行程天数：5天4晚目的地：新加坡往返交通：飞机/飞机报名截止时间：团期前5天18点接待标准•用餐安排：全程餐标100元/位精心安排当地美食：黑胡椒螃蟹、海南鸡饭、养生肉骨茶、奶油虾、马来风光、 游玩目的地： 新加坡 行程天数： 5天 交通方式： 飞机/飞机 ¥8376 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "三亚",
    "duration": 5,
    "price": 8376,
    "priceUnit": "人",
    "departureDate": "2026-06-24",
    "returnDate": "2026-06-29",
    "transportType": "高铁往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "5早餐4正餐",
    "singleSupplement": 2094,
    "singleSupplementNote": "单人出行需补单房差￥2094，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 7,
    "totalSeats": 42,
    "highlights": [
      "三亚必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往三亚",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：三亚游览",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：三亚游览",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：三亚游览",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "告别三亚，返回温馨的家",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 3.5,
    "reviewCount": 330,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "美食之旅",
      "纯玩",
      "品质"
    ],
    "isHot": true,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "美食之旅",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.465750",
    "updatedAt": "2026-05-07T01:02:13.465750"
  },
  {
    "id": "tour_262",
    "title": "<新马机票+当地5日游>全新上线，0购物0自费，4成人起订成团，新加坡团签，畅游新加坡花园城市，云顶高原，吉隆坡双峰塔 产品概要行程天数：5天4晚目的地：新加坡往返交通：飞机/飞机报名截止时间：团期前5天18点接待标准•用餐安排：全程餐标100元/位精心安排当地美食：黑胡椒螃蟹、海南鸡饭、养生肉骨茶、奶油虾、马来风光、 游玩目的地： 新加坡 行程天数： 5天 交通方式： 飞机/飞机",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "三亚",
    "duration": 5,
    "price": 100,
    "priceUnit": "人",
    "departureDate": "2026-05-19",
    "returnDate": "2026-05-24",
    "transportType": "高铁往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "5早餐4正餐",
    "singleSupplement": 25,
    "singleSupplementNote": "单人出行需补单房差￥25，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 6,
    "totalSeats": 36,
    "highlights": [
      "三亚必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往三亚",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：三亚游览",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：三亚游览",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：三亚游览",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "告别三亚，返回温馨的家",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.2,
    "reviewCount": 37,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "美食之旅",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "美食之旅",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.465750",
    "updatedAt": "2026-05-07T01:02:13.465750"
  },
  {
    "id": "tour_263",
    "title": "产品概要行程天数：5天4晚目的地：新加坡往返交通：飞机/飞机报名截止时间：团期前5天18点接待标准•用餐安排：全程餐标100元/位精心安排当地美食：黑胡椒螃蟹、海南鸡饭、养生肉骨茶、奶油虾、马来风光、",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "三亚",
    "duration": 5,
    "price": 100,
    "priceUnit": "人",
    "departureDate": "2026-06-16",
    "returnDate": "2026-06-21",
    "transportType": "高铁往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "5早餐4正餐",
    "singleSupplement": 25,
    "singleSupplementNote": "单人出行需补单房差￥25，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 7,
    "totalSeats": 32,
    "highlights": [
      "三亚必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往三亚",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：三亚游览",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：三亚游览",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：三亚游览",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "告别三亚，返回温馨的家",
        "description": "今日安排三亚精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.3,
    "reviewCount": 268,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "美食之旅",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "美食之旅",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.465750",
    "updatedAt": "2026-05-07T01:02:13.465750"
  },
  {
    "id": "tour_264",
    "title": "<马来西亚仙本那机票+当地5晚6日游>渔乐海钓/跳岛游、深潜，花样玩法，沉底海钓/深海铁板钓，可升海底漫步/红树林，含电话卡插头/咬嘴 预定须知1、本产品需现询，二次确认，无法直接签约，请签约前咨询客服，为了顺利出签，方便安排行程，请于下单后2日内提供签证资料、快递地址（方便我们快递电话卡、充电转换插头），敬请谅解~3、★★★航 游玩目的地： 马来西亚 行程天数： 6天 交通方式： 飞机/飞机 ¥5327 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "其他",
    "duration": 6,
    "price": 5327,
    "priceUnit": "人",
    "departureDate": "2026-06-06",
    "returnDate": "2026-06-12",
    "transportType": "飞机往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "6早餐5正餐",
    "singleSupplement": 1331,
    "singleSupplementNote": "单人出行需补单房差￥1331，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 14,
    "totalSeats": 34,
    "highlights": [
      "其他必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往其他",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "第5天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 6,
        "title": "告别其他，返回温馨的家",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.1,
    "reviewCount": 799,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "自然风光",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "自然风光",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.465750",
    "updatedAt": "2026-05-07T01:02:13.465750"
  },
  {
    "id": "tour_265",
    "title": "<莫斯科+圣彼得堡+双飞6晚8天游>北京直飞、可配联运、金环谢镇、克林姆林宫、俄罗式特色餐、红场、叶宫、夏宫花园 行程精选优质航班中国国际航空公司北京直飞莫斯科；前往世界四大博物馆之一的冬宫，细数俄罗斯举世无双的艺术瑰宝；前往有“俄罗斯的凡尔赛”之称的夏宫花园，畅游气势磅礴的大沙皇后花园；特别安排前往俄罗 游玩目的地： 行程天数： 8天 交通方式： 飞机/飞机 ¥7679 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "北京",
    "duration": 8,
    "price": 7679,
    "originalPrice": 9598,
    "priceUnit": "人",
    "departureDate": "2026-06-28",
    "returnDate": "2026-07-06",
    "transportType": "飞机往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "8早餐7正餐",
    "singleSupplement": 1919,
    "singleSupplementNote": "单人出行需补单房差￥1919，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 16,
    "totalSeats": 31,
    "highlights": [
      "北京必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往北京",
        "description": "今日安排北京精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：北京游览",
        "description": "今日安排北京精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：北京游览",
        "description": "今日安排北京精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：北京游览",
        "description": "今日安排北京精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "第5天：北京游览",
        "description": "今日安排北京精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 6,
        "title": "第6天：北京游览",
        "description": "今日安排北京精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 7,
        "title": "第7天：北京游览",
        "description": "今日安排北京精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 8,
        "title": "告别北京，返回温馨的家",
        "description": "今日安排北京精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": true,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 3.8,
    "reviewCount": 774,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "自然风光",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "discountRate": 20,
    "groupSize": "30人常规团",
    "theme": "自然风光",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.465750",
    "updatedAt": "2026-05-07T01:02:13.465750"
  },
  {
    "id": "tour_266",
    "title": "<泰国曼谷-芭提雅-普吉岛-清迈机票+当地12日游>海岛游/黑白庙泰国双重体验，曼芭跟团，普清mini小团、DIY出行/花样升级包，含电话卡 泰国落地签免签证费★行程亮点：1.全程无自费，私属旅程，完美搭配。2.安排海滨魅力芭提雅海边酒店三晚。3.特别安排国家海洋公园罗勇沙美岛行程，精华绝不遗漏。4.安排一天半自由活动时间，放慢脚步，细 游玩目的地： 普吉岛 泰国 巴厘岛 天海邮轮 行程天数： 12天 交通方式： 飞机/飞机 ¥6912 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "其他",
    "duration": 12,
    "price": 6912,
    "originalPrice": 8429,
    "priceUnit": "人",
    "departureDate": "2026-07-12",
    "returnDate": "2026-07-24",
    "transportType": "飞机往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "12早餐11正餐",
    "singleSupplement": 1728,
    "singleSupplementNote": "单人出行需补单房差￥1728，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 21,
    "totalSeats": 36,
    "highlights": [
      "其他必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往其他",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "第5天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 6,
        "title": "第6天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 7,
        "title": "第7天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 8,
        "title": "第8天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 9,
        "title": "第9天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 10,
        "title": "第10天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 11,
        "title": "第11天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 12,
        "title": "告别其他，返回温馨的家",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.7,
    "reviewCount": 377,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "海岛度假",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "discountRate": 18,
    "groupSize": "30人常规团",
    "theme": "海岛度假",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.465750",
    "updatedAt": "2026-05-07T01:02:13.465750"
  },
  {
    "id": "tour_267",
    "title": "<泰国曼谷-芭提雅-苏梅岛机票+当地9日游>苏梅mini小团/花样升级包享蜜月之旅，0自费，四星住宿，芭提雅快艇出海/升级泳池别墅，含电话卡 泰国落地签免签证费◆行程亮点：打破常规、绝无套路、曼谷芭提雅跟团、苏梅岛DIY度假、一次玩转泰国曼谷、芭堤雅、苏梅岛三大风情名城，经典景点一网打尽！省时、省钱、省心！1、【芭提雅步行街】这是芭提雅出 游玩目的地： 泰国 苏梅岛 行程天数： 9天 交通方式： 飞机/飞机 ¥5996 起 查看详情",
    "source": "品途",
    "sourceLogo": "/icons/品途.png",
    "destination": "其他",
    "duration": 9,
    "price": 5996,
    "priceUnit": "人",
    "departureDate": "2026-05-26",
    "returnDate": "2026-06-04",
    "transportType": "飞机往返",
    "accommodationLevel": "舒适型",
    "accommodationStars": 3,
    "meals": "9早餐8正餐",
    "singleSupplement": 1499,
    "singleSupplementNote": "单人出行需补单房差￥1499，这是OTA通常不透明的隐藏费用。",
    "availableSeats": 18,
    "totalSeats": 43,
    "highlights": [
      "其他必打卡",
      "特色美食",
      "精品住宿"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "出发前往其他",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 2,
        "title": "第2天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 3,
        "title": "第3天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 4,
        "title": "第4天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 5,
        "title": "第5天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 6,
        "title": "第6天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 7,
        "title": "第7天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 8,
        "title": "第8天：其他游览",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐",
          "午餐"
        ],
        "accommodation": "当地酒店",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      },
      {
        "day": 9,
        "title": "告别其他，返回温馨的家",
        "description": "今日安排其他精彩活动，感受当地独特魅力。",
        "meals": [
          "早餐"
        ],
        "accommodation": "温馨的家",
        "activities": [
          "景点游览",
          "自由活动"
        ]
      }
    ],
    "inclusions": [
      "往返交通",
      "酒店住宿",
      "景点门票",
      "导游服务"
    ],
    "exclusions": [
      "个人消费",
      "单房差",
      "自费项目"
    ],
    "importantNotes": [
      "请携带有效身份证件",
      "行程可能因天气调整"
    ],
    "visaRequirements": "无需签证（国内游）",
    "travelInsurance": true,
    "tourGuideService": true,
    "freeWiFi": false,
    "childPolicy": "2-12岁儿童不占床享半价",
    "cancellationPolicy": "出发前7天可无损退改",
    "refundPolicy": "未消费项目按实结算退还",
    "rating": 4.0,
    "reviewCount": 29,
    "bookingUrl": "http://gz.ptotour.com/line/list.aspx",
    "images": [],
    "tags": [
      "民族风情",
      "纯玩",
      "品质"
    ],
    "isHot": false,
    "isNew": false,
    "isFlashSale": false,
    "groupSize": "30人常规团",
    "theme": "民族风情",
    "suitableFor": [
      "亲子",
      "情侣"
    ],
    "difficulty": "轻松",
    "season": "全年",
    "language": "中文导游",
    "createdAt": "2026-05-07T01:02:13.465750",
    "updatedAt": "2026-05-07T01:02:13.465750"
  }
];
