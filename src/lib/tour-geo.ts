import type { TourSummary } from '@/types/tour';

export type TourRegion = 'local' | 'nearby-province' | 'national' | 'international';

export interface TourGeoPoint {
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  province?: string;
  region: TourRegion;
  confidence: 'medium';
  source: 'local-destination-atlas';
}

interface GeoEntry {
  aliases: string[];
  name: string;
  country: string;
  province?: string;
  latitude: number;
  longitude: number;
}

// MVP 使用可审计的城市/国家中心点；未知目的地不强行落点。
const DESTINATION_ATLAS: GeoEntry[] = [
  { aliases: ['广州', '广州市'], name: '广州', country: '中国', province: '广东', latitude: 23.1291, longitude: 113.2644 },
  { aliases: ['深圳', '深圳市'], name: '深圳', country: '中国', province: '广东', latitude: 22.5431, longitude: 114.0579 },
  { aliases: ['珠海', '珠海市'], name: '珠海', country: '中国', province: '广东', latitude: 22.271, longitude: 113.5767 },
  { aliases: ['惠州', '惠州市', '巽寮湾', '双月湾'], name: '惠州', country: '中国', province: '广东', latitude: 23.1115, longitude: 114.4152 },
  { aliases: ['清远', '清远市', '英德'], name: '清远', country: '中国', province: '广东', latitude: 23.6818, longitude: 113.056 },
  { aliases: ['韶关', '韶关市', '丹霞山'], name: '韶关', country: '中国', province: '广东', latitude: 24.8104, longitude: 113.5972 },
  { aliases: ['肇庆', '肇庆市', '鼎湖山'], name: '肇庆', country: '中国', province: '广东', latitude: 23.0472, longitude: 112.4651 },
  { aliases: ['佛山', '佛山市', '顺德'], name: '佛山', country: '中国', province: '广东', latitude: 23.0218, longitude: 113.1219 },
  { aliases: ['江门', '江门市', '台山'], name: '江门', country: '中国', province: '广东', latitude: 22.5787, longitude: 113.0815 },
  { aliases: ['阳江', '阳江市', '海陵岛'], name: '阳江', country: '中国', province: '广东', latitude: 21.8579, longitude: 111.9822 },
  { aliases: ['汕头', '汕头市', '南澳'], name: '汕头', country: '中国', province: '广东', latitude: 23.3541, longitude: 116.6819 },
  { aliases: ['潮州', '潮州市'], name: '潮州', country: '中国', province: '广东', latitude: 23.6567, longitude: 116.6226 },
  { aliases: ['湛江', '湛江市'], name: '湛江', country: '中国', province: '广东', latitude: 21.2707, longitude: 110.3594 },
  { aliases: ['茂名', '茂名市'], name: '茂名', country: '中国', province: '广东', latitude: 21.6627, longitude: 110.9255 },
  { aliases: ['桂林', '桂林市', '阳朔'], name: '桂林', country: '中国', province: '广西', latitude: 25.2736, longitude: 110.2902 },
  { aliases: ['南宁', '南宁市', '崇左', '德天'], name: '南宁', country: '中国', province: '广西', latitude: 22.817, longitude: 108.3665 },
  { aliases: ['张家界', '凤凰', '长沙', '湖南'], name: '张家界', country: '中国', province: '湖南', latitude: 29.1171, longitude: 110.4792 },
  { aliases: ['厦门', '厦门市', '武夷山', '福建'], name: '厦门', country: '中国', province: '福建', latitude: 24.4798, longitude: 118.0894 },
  { aliases: ['海口', '三亚', '海南', '蜈支洲岛'], name: '三亚', country: '中国', province: '海南', latitude: 18.2528, longitude: 109.5119 },
  { aliases: ['昆明', '大理', '丽江', '云南', '西双版纳'], name: '昆明', country: '中国', province: '云南', latitude: 25.0389, longitude: 102.7183 },
  { aliases: ['成都', '九寨沟', '四川'], name: '成都', country: '中国', province: '四川', latitude: 30.5728, longitude: 104.0668 },
  { aliases: ['重庆', '重庆市'], name: '重庆', country: '中国', province: '重庆', latitude: 29.563, longitude: 106.5516 },
  { aliases: ['北京', '北京市'], name: '北京', country: '中国', province: '北京', latitude: 39.9042, longitude: 116.4074 },
  { aliases: ['上海', '上海市'], name: '上海', country: '中国', province: '上海', latitude: 31.2304, longitude: 121.4737 },
  { aliases: ['西安', '陕西', '华山'], name: '西安', country: '中国', province: '陕西', latitude: 34.3416, longitude: 108.9398 },
  { aliases: ['新疆', '乌鲁木齐', '喀纳斯', '伊犁'], name: '乌鲁木齐', country: '中国', province: '新疆', latitude: 43.8256, longitude: 87.6168 },
  { aliases: ['西藏', '拉萨', '林芝'], name: '拉萨', country: '中国', province: '西藏', latitude: 29.652, longitude: 91.1721 },
  { aliases: ['内蒙古', '呼伦贝尔', '呼和浩特'], name: '呼和浩特', country: '中国', province: '内蒙古', latitude: 40.8414, longitude: 111.7519 },
  { aliases: ['哈尔滨', '黑龙江', '漠河'], name: '哈尔滨', country: '中国', province: '黑龙江', latitude: 45.8038, longitude: 126.5349 },
  { aliases: ['越南', '河内', '下龙湾', '胡志明', '芽庄', '岘港'], name: '越南', country: '越南', latitude: 21.0285, longitude: 105.8542 },
  { aliases: ['泰国', '曼谷', '普吉', '清迈'], name: '泰国', country: '泰国', latitude: 13.7563, longitude: 100.5018 },
  { aliases: ['日本', '东京', '大阪', '京都', '北海道'], name: '日本', country: '日本', latitude: 35.6762, longitude: 139.6503 },
  { aliases: ['韩国', '首尔', '济州'], name: '韩国', country: '韩国', latitude: 37.5665, longitude: 126.978 },
  { aliases: ['新加坡'], name: '新加坡', country: '新加坡', latitude: 1.3521, longitude: 103.8198 },
  { aliases: ['马来西亚', '吉隆坡', '沙巴'], name: '马来西亚', country: '马来西亚', latitude: 3.139, longitude: 101.6869 },
  { aliases: ['印度尼西亚', '巴厘岛', '印尼'], name: '印度尼西亚', country: '印度尼西亚', latitude: -8.4095, longitude: 115.1889 },
  { aliases: ['澳大利亚', '悉尼', '墨尔本'], name: '澳大利亚', country: '澳大利亚', latitude: -33.8688, longitude: 151.2093 },
  { aliases: ['法国', '巴黎'], name: '法国', country: '法国', latitude: 48.8566, longitude: 2.3522 },
  { aliases: ['英国', '伦敦'], name: '英国', country: '英国', latitude: 51.5074, longitude: -0.1278 },
  { aliases: ['美国', '纽约', '洛杉矶', '夏威夷'], name: '美国', country: '美国', latitude: 40.7128, longitude: -74.006 },
];

const NEARBY_PROVINCES = new Set(['广西', '湖南', '江西', '福建', '海南']);

function findDestinationInText(text: string) {
  return DESTINATION_ATLAS
    .filter((entry) => entry.aliases.some((alias) => text.includes(alias)))
    .sort((a, b) => b.aliases.reduce((n, alias) => n + (text.includes(alias) ? alias.length : 0), 0) - a.aliases.reduce((n, alias) => n + (text.includes(alias) ? alias.length : 0), 0))[0];
}

function findDestination(tour: TourSummary) {
  const normalizedDestination = tour.destination.trim();
  const destinationMatch = findDestinationInText(normalizedDestination);
  if (destinationMatch) return destinationMatch;

  // 目的地字段缺失或为“其他”时，优先读取出发/往返关键词之后的标题部分。
  const titleAfterDeparture = tour.title.split(/(?:往返|出发|起程|集合)/).pop() || tour.title;
  return findDestinationInText(titleAfterDeparture) || findDestinationInText(tour.title);
}

export function classifyTourRegion(entry: Pick<GeoEntry, 'country' | 'province'>): TourRegion {
  if (entry.country !== '中国') return 'international';
  if (entry.province === '广东') return 'local';
  if (entry.province && NEARBY_PROVINCES.has(entry.province)) return 'nearby-province';
  return 'national';
}

export function resolveTourGeo(tour: TourSummary): TourGeoPoint | null {
  const entry = findDestination(tour);
  if (!entry) return null;
  return {
    name: entry.name,
    latitude: entry.latitude,
    longitude: entry.longitude,
    country: entry.country,
    province: entry.province,
    region: classifyTourRegion(entry),
    confidence: 'medium',
    source: 'local-destination-atlas',
  };
}

export function getTourGeoCoverage(tours: TourSummary[], region: TourRegion | 'all' = 'all') {
  let total = 0;
  let mapped = 0;
  tours.forEach((tour) => {
    const geo = resolveTourGeo(tour);
    if (region !== 'all' && geo?.region !== region) return;
    total += 1;
    if (geo) mapped += 1;
  });
  return { total, mapped, unmapped: total - mapped };
}

export const TOUR_REGION_LABELS: Record<TourRegion, string> = {
  local: '省内周边',
  'nearby-province': '周边跨省',
  national: '全国',
  international: '跨国',
};
