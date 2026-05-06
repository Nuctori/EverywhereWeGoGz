import type { Tour } from '@/types/tour';

export const sources = [
  { name: '假日通', logo: '/icons/jiari.png', color: '#FF6B35' },
  { name: '广州去旅行', logo: '/icons/qu.png', color: '#4ECDC4' },
  { name: '康辉', logo: '/icons/kanghui.png', color: '#1A535C' },
  { name: '暴走村', logo: '/icons/baozou.png', color: '#FFE66D' },
  { name: '广之旅', logo: '/icons/gzl.png', color: '#FF006E' },
  { name: '广东中旅', logo: '/icons/gdzl.png', color: '#8338EC' },
  { name: '品途', logo: '/icons/pintu.png', color: '#3A86FF' },
];

export const destinations = [
  '桂林', '阳朔', '张家界', '凤凰古城', '九寨沟', '稻城亚丁',
  '云南大理', '丽江', '西双版纳', '海南三亚', '厦门', '西藏拉萨',
  '新疆', '内蒙古', '东北雪乡', '贵州', '四川成都', '西安',
  '北京', '上海', '杭州', '苏州', '黄山', '庐山',
];

export const themes = [
  '自然风光', '古镇文化', '海岛度假', '冰雪世界', '民族风情',
  '美食之旅', '亲子游', '蜜月游', '摄影之旅', '户外徒步',
];

const accommodations = [
  { level: '经济型', stars: 2 },
  { level: '舒适型', stars: 3 },
  { level: '高档型', stars: 4 },
  { level: '豪华型', stars: 5 },
];

const transports = ['高铁往返', '飞机往返', '大巴往返', '飞机去高铁回', '自驾'];
const difficulties = ['休闲', '轻松', '适中', '挑战'];
const seasons = ['春季', '夏季', '秋季', '冬季', '全年'];
const languages = ['中文导游', '中英文导游', '粤语导游'];
const groupSizes = ['15人精品团', '30人常规团', '50人大团', '私家团'];

const highlightsPool = [
  '漓江竹筏漂流', '象鼻山打卡', '两江四湖夜游', '阳朔西街',
  '天门山玻璃栈道', '张家界森林公园', '凤凰古城夜景', '沱江泛舟',
  '五花海倒影', '诺日朗瀑布', '藏族家访', '经幡祈福',
  '洱海骑行', '玉龙雪山', '蓝月谷', '拉市海',
  '天涯海角', '南山海上观音', '亚龙湾沙滩', '蜈支洲岛',
  '鼓浪屿漫步', '南普陀寺', '环岛路骑行', '曾厝垵美食',
  '布达拉宫', '大昭寺', '纳木错', '羊卓雍措',
  '天池', '喀纳斯湖', '禾木村', '赛里木湖',
];

const inclusionsPool = [
  '往返交通', '酒店住宿', '景点门票', '导游服务', '旅游保险',
  '每日早餐', '特色正餐', '接送机服务', '景区交通车', '行李托运',
];

const exclusionsPool = [
  '个人消费', '单房差', '自费项目', '签证费用', '小费',
  '超重行李费', '行程外景点', '洗衣费', '电话费', '酒水饮料',
];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomItems<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function generateItinerary(days: number, dest: string): Tour['itinerary'] {
  const result = [];
  const destHighlights = highlightsPool.filter((h) =>
    (dest.includes('桂林') && (h.includes('漓江') || h.includes('象鼻') || h.includes('两江') || h.includes('阳朔'))) ||
    (dest.includes('张家界') && (h.includes('天门') || h.includes('张家界') || h.includes('凤凰'))) ||
    (dest.includes('九寨沟') && (h.includes('五花海') || h.includes('诺日朗') || h.includes('藏族'))) ||
    (dest.includes('云南') && (h.includes('洱海') || h.includes('玉龙') || h.includes('蓝月') || h.includes('拉市'))) ||
    (dest.includes('三亚') && (h.includes('天涯') || h.includes('南山') || h.includes('亚龙湾') || h.includes('蜈支洲'))) ||
    (dest.includes('厦门') && (h.includes('鼓浪屿') || h.includes('南普陀') || h.includes('环岛') || h.includes('曾厝垵'))) ||
    (dest.includes('西藏') && (h.includes('布达拉') || h.includes('大昭') || h.includes('纳木') || h.includes('羊卓'))) ||
    (dest.includes('新疆') && (h.includes('天池') || h.includes('喀纳斯') || h.includes('禾木') || h.includes('赛里木')))
  );
  const fallback = highlightsPool.slice(0, 10);
  const pool = destHighlights.length > 0 ? destHighlights : fallback;

  for (let d = 1; d <= days; d++) {
    const acts = randomItems(pool, Math.min(3, pool.length));
    result.push({
      day: d,
      title: d === 1 ? `出发前往${dest}` : d === days ? `告别${dest}，返回温馨的家` : `${dest}深度游览·第${d}天`,
      description: `今日安排${acts.join('、')}等精彩活动，感受${dest}的独特魅力。`,
      meals: randomItems(['早餐', '午餐', '晚餐'], Math.floor(Math.random() * 2) + 2),
      accommodation: d === days ? '温馨的家' : `${randomItem(accommodations).level}酒店`,
      activities: acts,
    });
  }
  return result;
}

export const tours: Tour[] = [];

let idCounter = 1;

// 为每个来源站点生成多个旅行团
sources.forEach((source, sourceIdx) => {
  destinations.slice(sourceIdx * 3, sourceIdx * 3 + 5).forEach((dest) => {
    const duration = Math.floor(Math.random() * 5) + 2; // 2-6天
    const basePrice = 500 + Math.floor(Math.random() * 3000);
    const singleSupplement = Math.floor(basePrice * 0.25);
    const discountRate = Math.random() > 0.7 ? Math.floor(Math.random() * 20) + 5 : undefined;
    const price = discountRate ? Math.floor(basePrice * (1 - discountRate / 100)) : basePrice;
    const acc = randomItem(accommodations);
    const theme = randomItem(themes);
    const isHot = Math.random() > 0.6;
    const isNew = Math.random() > 0.7;
    const isFlashSale = Math.random() > 0.85;
    const availableSeats = Math.floor(Math.random() * 30) + 1;
    const totalSeats = availableSeats + Math.floor(Math.random() * 20);

    const departure = new Date();
    departure.setDate(departure.getDate() + Math.floor(Math.random() * 60) + 7);
    const returnD = new Date(departure);
    returnD.setDate(returnD.getDate() + duration);

    tours.push({
      id: `tour_${idCounter++}`,
      title: `${dest}${duration}日${theme}·${randomItem(['纯玩无购物', '品质之选', '网红打卡', '经典线路'])}`,
      source: source.name,
      sourceLogo: source.logo,
      destination: dest,
      duration,
      price,
      originalPrice: discountRate ? basePrice : undefined,
      priceUnit: '人',
      departureDate: departure.toISOString().split('T')[0],
      returnDate: returnD.toISOString().split('T')[0],
      transportType: randomItem(transports),
      accommodationLevel: acc.level,
      accommodationStars: acc.stars,
      meals: `${duration}早餐${duration > 2 ? duration - 1 : ''}正餐`,
      singleSupplement,
      singleSupplementNote: `单人出行需补单房差￥${singleSupplement}，这是OTA通常不透明的隐藏费用。本团精选${acc.level}酒店，确保单人参团也能享受独立私密空间。`,
      availableSeats,
      totalSeats,
      highlights: randomItems(highlightsPool, Math.min(5, highlightsPool.length)),
      itinerary: generateItinerary(duration, dest),
      inclusions: randomItems(inclusionsPool, 6),
      exclusions: randomItems(exclusionsPool, 4),
      importantNotes: [
        '请务必携带有效身份证件',
        '行程可能因天气等不可抗力因素调整',
        '建议购买个人旅游意外险',
      ],
      visaRequirements: '无需签证（国内游）',
      travelInsurance: true,
      tourGuideService: true,
      freeWiFi: Math.random() > 0.5,
      childPolicy: '2-12岁儿童不占床享半价，占床与成人同价',
      cancellationPolicy: '出发前7天可无损退改，3-7天退50%，3天内不可退',
      refundPolicy: '未消费项目按实结算退还',
      rating: +(3.5 + Math.random() * 1.5).toFixed(1),
      reviewCount: Math.floor(Math.random() * 500) + 10,
      bookingUrl: '#',
      images: [],
      tags: [theme, randomItem(['纯玩', '品质', '特价']), randomItem(['含餐', '自由活动时间充足'])],
      isHot,
      isNew,
      isFlashSale,
      flashSaleEndTime: isFlashSale
        ? new Date(Date.now() + Math.random() * 86400000 * 3).toISOString()
        : undefined,
      discountRate,
      groupSize: randomItem(groupSizes),
      theme,
      suitableFor: randomItems(['亲子', '情侣', '朋友', '父母'], 2),
      difficulty: randomItem(difficulties),
      season: randomItem(seasons),
      language: randomItem(languages),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  });
});

// 补充更多数据让列表丰富
for (let i = 0; i < 20; i++) {
  const source = randomItem(sources);
  const dest = randomItem(destinations);
  const duration = Math.floor(Math.random() * 5) + 2;
  const basePrice = 600 + Math.floor(Math.random() * 3500);
  const singleSupplement = Math.floor(basePrice * 0.3);
  const discountRate = Math.random() > 0.75 ? Math.floor(Math.random() * 25) + 5 : undefined;
  const price = discountRate ? Math.floor(basePrice * (1 - discountRate / 100)) : basePrice;
  const acc = randomItem(accommodations);
  const theme = randomItem(themes);
  const departure = new Date();
  departure.setDate(departure.getDate() + Math.floor(Math.random() * 90) + 5);
  const returnD = new Date(departure);
  returnD.setDate(returnD.getDate() + duration);
  const availableSeats = Math.floor(Math.random() * 25) + 2;

  tours.push({
    id: `tour_${idCounter++}`,
    title: `${dest}${duration}日${theme}·${randomItem(['超值特惠', '限量发售', '口碑爆款', '新品首发'])}`,
    source: source.name,
    sourceLogo: source.logo,
    destination: dest,
    duration,
    price,
    originalPrice: discountRate ? basePrice : undefined,
    priceUnit: '人',
    departureDate: departure.toISOString().split('T')[0],
    returnDate: returnD.toISOString().split('T')[0],
    transportType: randomItem(transports),
    accommodationLevel: acc.level,
    accommodationStars: acc.stars,
    meals: `${duration}早餐${duration > 2 ? duration - 1 : ''}正餐`,
    singleSupplement,
    singleSupplementNote: `单人出行需补单房差￥${singleSupplement}。我们与${source.name}深度合作，直接展示真实成本，拒绝隐形消费。`,
    availableSeats,
    totalSeats: availableSeats + Math.floor(Math.random() * 15),
    highlights: randomItems(highlightsPool, 4),
    itinerary: generateItinerary(duration, dest),
    inclusions: randomItems(inclusionsPool, 5),
    exclusions: randomItems(exclusionsPool, 3),
    importantNotes: ['请提前30分钟到达集合地点', '高原地区注意防晒保暖'],
    visaRequirements: '无需签证（国内游）',
    travelInsurance: Math.random() > 0.2,
    tourGuideService: true,
    freeWiFi: Math.random() > 0.4,
    childPolicy: '2-12岁儿童按身高收费：1.2m以下半价，1.2m以上全价',
    cancellationPolicy: '出发前15天无损退改，7-15天退70%，3-7天退30%，3天内不可退',
    refundPolicy: '行程中未消费项目按实结算，3个工作日内原路退回',
    rating: +(3.2 + Math.random() * 1.8).toFixed(1),
    reviewCount: Math.floor(Math.random() * 800) + 5,
    bookingUrl: '#',
    images: [],
    tags: [theme, randomItem(['含接送', '无购物', '深度体验'])],
    isHot: Math.random() > 0.55,
    isNew: Math.random() > 0.65,
    isFlashSale: Math.random() > 0.9,
    flashSaleEndTime: Math.random() > 0.9 ? new Date(Date.now() + Math.random() * 86400000 * 2).toISOString() : undefined,
    discountRate,
    groupSize: randomItem(groupSizes),
    theme,
    suitableFor: randomItems(['亲子', '情侣', '独行客', '银发族', '摄影爱好者'], Math.floor(Math.random() * 2) + 1),
    difficulty: randomItem(difficulties),
    season: randomItem(seasons),
    language: randomItem(languages),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}
