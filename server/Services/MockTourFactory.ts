import type { Tour } from '../Contracts/Tour';
import { resolveSourceIcon } from './SourceIconResolver';

const SOURCES = ['假日通', '广州去旅行', '康辉', '暴走团', '广之旅', '广东中旅', '品途'];
const DESTINATIONS = ['桂林', '三亚', '云南', '张家界', '厦门', '西藏', '新疆'];
const THEMES = ['自然风光', '海岛度假', '民族文化', '亲子游', '徒步'];

function randomItem<T>(source: T[]): T {
  return source[Math.floor(Math.random() * source.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function createMockTours(count: number): Tour[] {
  const nowIso = new Date().toISOString();

  return Array.from({ length: count }, (_, index) => {
    const source = randomItem(SOURCES);
    const destination = randomItem(DESTINATIONS);
    const duration = randomInt(2, 7);
    const price = randomInt(699, 5299);
    const departure = new Date();
    departure.setDate(departure.getDate() + randomInt(5, 90));
    const returning = new Date(departure);
    returning.setDate(returning.getDate() + duration);
    const theme = randomItem(THEMES);

    return {
      id: `tour_${index + 1}`,
      title: `${destination}${duration}日 ${theme}精品团`,
      source,
      sourceLogo: `/icons/${resolveSourceIcon(source)}`,
      destination,
      duration,
      price,
      originalPrice: Math.random() > 0.65 ? Math.floor(price * 1.2) : undefined,
      priceUnit: '人',
      departureDate: departure.toISOString().slice(0, 10),
      returnDate: returning.toISOString().slice(0, 10),
      transportType: randomItem(['高铁往返', '飞机往返', '大巴往返']),
      accommodationLevel: randomItem(['经济型', '舒适型', '高档型']),
      accommodationStars: randomInt(2, 4),
      meals: `${duration}早${Math.max(0, duration - 1)}正`,
      singleSupplement: Math.floor(price * 0.25),
      singleSupplementNote: '单人出行可能涉及单房差，以实际预订结果为准。',
      availableSeats: randomInt(3, 30),
      totalSeats: 30,
      highlights: ['精选景点打卡', '特色美食体验', '专业导游服务'],
      itinerary: [],
      inclusions: ['往返交通', '酒店住宿', '景点门票', '导游服务'],
      exclusions: ['个人消费', '单房差', '自费项目'],
      importantNotes: ['请携带有效身份证件', '行程可能因天气因素调整'],
      visaRequirements: '国内线路无需签证',
      travelInsurance: true,
      tourGuideService: true,
      freeWiFi: Math.random() > 0.5,
      childPolicy: '儿童按身高和占床规则收费',
      cancellationPolicy: '出发前可按政策免费退改',
      refundPolicy: '未消费项目按实际结算',
      rating: Number((3.7 + Math.random() * 1.3).toFixed(1)),
      reviewCount: randomInt(10, 500),
      bookingUrl: '#',
      images: [],
      tags: [theme, randomItem(['无购物', '品质团', '特价'])],
      isHot: Math.random() > 0.55,
      isNew: Math.random() > 0.7,
      isFlashSale: Math.random() > 0.88,
      flashSaleEndTime: undefined,
      discountRate: Math.random() > 0.7 ? randomInt(5, 20) : undefined,
      groupSize: randomItem(['15人精品团', '30人常规团', '50人大团']),
      theme,
      suitableFor: randomItem([
        ['亲子', '朋友'],
        ['情侣', '亲子'],
        ['朋友', '父母'],
      ]),
      difficulty: randomItem(['休闲', '轻松', '适中']),
      season: randomItem(['春季', '夏季', '秋季', '冬季', '全年']),
      language: '中文导游',
      createdAt: nowIso,
      updatedAt: nowIso,
    };
  });
}
