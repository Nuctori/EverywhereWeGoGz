import fs from 'node:fs';
import path from 'node:path';
import QRCode from 'qrcode';

const DEFAULT_TOURS_FILE = 'public/data/tours.json';
const DEFAULT_WINDOW_DAYS = 21;
const DEFAULT_MAX_CANDIDATES = 18;
const DEFAULT_MAX_ARTICLE_ITEMS = 25;
const DEFAULT_JSON_MAX_TOKENS = 8192;
const DEFAULT_AUTHOR = '老广去边度';
const DEFAULT_COVER = '/brand/laoguang-logo-full.jpg';
const DEFAULT_WEBSITE_URL = 'https://nuctori.github.io/EverywhereWeGoGz/';
const FORBIDDEN_PHRASES = [
  '最低价',
  '全网最低',
  '百分百成团',
  '闭眼冲',
  '错过再等一年',
  '必须去',
  '必去',
  '最适合',
  '第一',
  '唯一',
];

const SUMMER_KEYWORDS = [
  '避暑',
  '清凉',
  '漂流',
  '海岛',
  '海边',
  '沙滩',
  '草原',
  '森林',
  '峡谷',
  '亲水',
  '玩水',
  '温泉',
  '山',
  '湖',
  '亲子',
  '暑假',
];

const SCENIC_KEYWORDS = [
  '山水',
  '峡谷',
  '瀑布',
  '丹霞',
  '峰林',
  '森林',
  '溶洞',
  '茶山',
  '山居',
  '畔山',
  '云顶',
  '溪谷',
  '溪',
  '湖',
  '草原',
  '氧吧',
];

const WATER_KEYWORDS = [
  '漂流',
  '亲水',
  '玩水',
  '戏水',
  '山泉',
  '玩漂',
  '溯溪',
  '冲浪',
];

const COASTAL_KEYWORDS = [
  '海边',
  '海岛',
  '沙滩',
  '蓝眼泪',
  '赶海',
  '海风',
  '海景',
  '东山岛',
  '海陵岛',
];

const HOT_SPRING_KEYWORDS = [
  '温泉',
  '泡汤',
  '汤泉',
  '私汤',
  '带池',
  '泡池',
  '雅泡',
  '御泉',
  '汤池',
];

const HOTEL_RELAX_KEYWORDS = [
  '酒店',
  '度假村',
  '民宿',
  '别墅',
  '山房',
  '庄园',
  '美宿',
  '泳池',
  '恒温池',
];

const FOOD_CULTURE_KEYWORDS = [
  '美食',
  '早茶',
  '海鲜',
  '乳鸽',
  '陈皮',
  '宴',
  '古镇',
  '古城',
  '博物馆',
  '寺',
  '夜游',
  '人文',
];

const FAMILY_PLAY_KEYWORDS = [
  '夏令营',
  '乐园',
  '动物园',
  '马戏',
  '萌宠',
  '亲子营',
  '水上乐园',
];

const LONG_HAUL_KEYWORDS = [
  '高铁',
  '动车',
  '飞机',
  '跨国',
  '边境',
  '秘境',
  '香格里拉',
  '川西',
  '新疆',
];

const DOMESTIC_NEARBY_DESTINATIONS = new Set([
  '广东',
  '广西',
  '湖南',
  '江西',
  '福建',
  '贵州',
  '港澳',
  '桂林',
  '厦门',
  '张家界',
  '三亚',
  '云南',
  '四川',
  '华东',
]);

const SITE_BASE_URL = 'https://nuctori.github.io/EverywhereWeGoGz/';
const WEATHER_OVERVIEW_IMAGE = 'https://file.gzl.cn/group1/M00/31/55/wKkBH1-XfHqAXFtHAAE1-x29ZjY556.jpg';
const DEPARTURE_WEATHER_COORDS = {
  destination: '广州',
  latitude: 23.1291,
  longitude: 113.2644,
  timezone: 'Asia/Shanghai',
};
const WEATHER_FETCH_TIMEOUT_MS = 10000;
const ARTICLE_BUCKET_ORDER = [
  '山水亲水',
  '海边海岛',
  '酒店泡池',
  '亲子玩乐',
  '美食人文',
  '周末轻出发',
  '长线风景',
];
const ARTICLE_BUCKET_META = {
  山水亲水: {
    title: '山水亲水',
    intro: '这组最吃香的是能把体感直接拉下来的真山真水，树荫、溪谷、瀑布和亲水玩法都在，适合这周想把闷热感实打实卸掉的人。',
  },
  海边海岛: {
    title: '海边海岛',
    intro: '这组把海风、开阔和松弛感放在第一位，适合想借两天把节奏放慢、顺手把心情吹开的人。',
  },
  酒店泡池: {
    title: '住下来慢慢玩',
    intro: '如果你这周更想舒服地歇一歇，这组就看住得好不好、池子够不够松弛、白天晚上能不能把人留在度假感里。',
  },
  亲子玩乐: {
    title: '亲子玩乐',
    intro: '这组更适合带着家人慢慢玩，重点不是赶多少景点，而是大人小孩都能玩得住、节奏也不会太折腾。',
  },
  美食人文: {
    title: '美食人文',
    intro: '想把这周过得更有滋味，就看这组。吃得到地方味道，也能顺手把城市气质和慢节奏一起带回来。',
  },
  周末轻出发: {
    title: '周末轻出发',
    intro: '时间卡得紧的时候，这组最方便。距离不远、准备不重，适合临时起意也能顺手出发。',
  },
  长线风景: {
    title: '请假也值得的长线',
    intro: '愿意多请一两天假，就把风景密度拉满。真正出彩的往往不是远，而是现在去刚好对味。',
  },
};

function stripWrappingQuotes(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

async function fetchWithTimeout(url, init = {}, timeoutMs = WEATHER_FETCH_TIMEOUT_MS, fetchImpl = globalThis.fetch) {
  if (typeof fetchImpl !== 'function') {
    throw new Error('fetch is not available');
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetchImpl(url, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

export function parseEnvText(text) {
  const result = {};
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const index = line.indexOf('=');
    if (index <= 0) continue;
    const key = line.slice(0, index).trim();
    const value = stripWrappingQuotes(line.slice(index + 1).trim());
    result[key] = value;
  }
  return result;
}

export function loadEnvFiles(rootDir, fileNames = ['.env.local', '.env']) {
  for (const fileName of fileNames) {
    const fullPath = path.join(rootDir, fileName);
    if (!fs.existsSync(fullPath)) continue;
    const parsed = parseEnvText(fs.readFileSync(fullPath, 'utf8'));
    for (const [key, value] of Object.entries(parsed)) {
      if (!process.env[key]) process.env[key] = value;
    }
  }
}

function decodeMaybeBase64(value) {
  if (!value) return '';
  try {
    return Buffer.from(value, 'base64').toString('utf8').trim();
  } catch {
    return '';
  }
}

export function resolveDeepSeekConfig(env = process.env) {
  const apiKey =
    env.DEEPSEEK_API_KEY?.trim() ||
    decodeMaybeBase64(env.DEEPSEEK_API_KEY_B64) ||
    env.VITE_AI_FALLBACK_API_KEY?.trim() ||
    decodeMaybeBase64(env.VITE_AI_FALLBACK_API_KEY_B64) ||
    '';
  const baseUrl =
    env.DEEPSEEK_BASE_URL?.trim() ||
    env.VITE_AI_FALLBACK_BASE_URL?.trim() ||
    'https://api.deepseek.com/v1';
  const model =
    env.DEEPSEEK_MODEL?.trim() ||
    env.VITE_AI_FALLBACK_MODEL?.trim() ||
    'deepseek-chat';

  if (!apiKey) {
    throw new Error('DeepSeek API key is missing. Expected DEEPSEEK_API_KEY or VITE_AI_FALLBACK_API_KEY.');
  }

  return { apiKey, baseUrl, model };
}

export function readToursData(rootDir, filePath = DEFAULT_TOURS_FILE) {
  const fullPath = path.join(rootDir, filePath);
  const parsed = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
  return Array.isArray(parsed) ? parsed : parsed.tours || parsed.items || [];
}

export function toDateKey(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatMonthDay(dateKey) {
  const [year, month, day] = String(dateKey || '').split('-').map(Number);
  if (!year || !month || !day) return String(dateKey || '').trim();
  return `${month}月${day}日`;
}

function addDays(dateKey, days) {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  return toDateKey(date);
}

function diffDays(fromDateKey, toDateKey) {
  const [fromYear, fromMonth, fromDay] = fromDateKey.split('-').map(Number);
  const [toYear, toMonth, toDay] = toDateKey.split('-').map(Number);
  const fromDate = new Date(fromYear, fromMonth - 1, fromDay);
  const toDate = new Date(toYear, toMonth - 1, toDay);
  return Math.round((toDate - fromDate) / (24 * 60 * 60 * 1000));
}

function monthToSeason(month) {
  if ([3, 4, 5].includes(month)) return '春季';
  if ([6, 7, 8].includes(month)) return '夏季';
  if ([9, 10, 11].includes(month)) return '秋季';
  return '冬季';
}

function getWeekWindow(runDate) {
  const [year, month, day] = runDate.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const dayOfWeek = date.getDay() || 7;
  const monday = new Date(date);
  monday.setDate(date.getDate() - dayOfWeek + 1);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { start: toDateKey(monday), end: toDateKey(sunday) };
}

function normalizeDestination(value) {
  return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '未标注目的地';
}

function slugifyText(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeMarkdown(value) {
  return String(value || '').replace(/\|/g, '\\|');
}

function getTourSiteUrl(tourId) {
  return `${SITE_BASE_URL}?tour=${encodeURIComponent(tourId)}&source=wechat`;
}

function getTourQrRelativePath(tourId) {
  return path.posix.join('qr', `${safeSlug(tourId)}.png`);
}

function chooseTourImage(tour) {
  if (Array.isArray(tour.images) && tour.images.length > 0) {
    return tour.images[0];
  }
  return '';
}

function normalizeArticleImageUrl(value) {
  const src = String(value || '').trim();
  if (!src) return '';
  if (/^https?:\/\//i.test(src)) return src;
  if (src.startsWith('/')) {
    return `${SITE_BASE_URL.replace(/\/$/, '')}${src}`;
  }
  return src;
}

function safeSlug(value) {
  return String(value || '')
    .replace(/[^\w\u4e00-\u9fa5-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'tour';
}

export async function ensureTourQrAsset(outputDir, tourId) {
  const qrDir = path.join(outputDir, 'qr');
  fs.mkdirSync(qrDir, { recursive: true });
  const filePath = path.join(qrDir, `${safeSlug(tourId)}.png`);
  if (!fs.existsSync(filePath)) {
    await QRCode.toFile(filePath, getTourSiteUrl(tourId), {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 320,
      color: {
        dark: '#111111',
        light: '#ffffff',
      },
    });
  }
  return filePath;
}

export async function ensureWeeklyArticleQrAssets(outputDir, tours) {
  await Promise.all((tours || []).map((tour) => ensureTourQrAsset(outputDir, tour.id)));
}

export async function ensureReferencedQrAssets(outputDir, markdown) {
  const refs = new Set();
  const regex = /\((qr\/[^)\s]+\.png)\)/gi;
  for (const match of String(markdown || '').matchAll(regex)) {
    const fileName = path.basename(match[1] || '');
    const tourId = fileName.replace(/\.png$/i, '').trim();
    if (tourId) refs.add(tourId);
  }
  await Promise.all([...refs].map((tourId) => ensureTourQrAsset(outputDir, tourId)));
}

function summarizeDepartureDates(dates, limit = 4) {
  const list = Array.isArray(dates) ? dates.filter(Boolean) : [];
  if (list.length <= limit) return list.join('、');
  return `${list.slice(0, limit).join('、')} 等${list.length}个班期`;
}

function priceLabel(tour) {
  if (typeof tour.price !== 'number') return '价格以供应商页面为准';
  const unit = tour.priceUnit || '元/人';
  if (unit.includes('元')) return `${tour.price}${unit}起`;
  return `${tour.price}元/${unit}起`;
}

function durationLabel(tour) {
  if (typeof tour.duration === 'number' && Number.isFinite(tour.duration)) {
    return `${tour.duration}天`;
  }
  return '行程天数以供应商页面为准';
}

function suitabilityLabel(tour) {
  const list = Array.isArray(tour.suitableFor) ? tour.suitableFor.filter(Boolean) : [];
  return list.length > 0 ? list.join('、') : '亲子、情侣、朋友结伴';
}

function highlightLabel(tour) {
  if (Array.isArray(tour.experienceSignals) && tour.experienceSignals.length > 0) {
    return [...new Set(tour.experienceSignals)].slice(0, 4).join('、');
  }
  const parts = [
    ...(Array.isArray(tour.highlights) ? tour.highlights : []),
    ...(Array.isArray(tour.tags) ? tour.tags : []),
  ].filter(Boolean);
  return [...new Set(parts)].slice(0, 4).join('、') || '按当季热门玩法筛出';
}

function textBlob(tour) {
  return [
    tour.title,
    tour.destination,
    tour.theme,
    ...(tour.tags || []),
    ...(tour.highlights || []),
    ...(tour.suitableFor || []),
  ]
    .filter(Boolean)
    .join(' ');
}

function experienceBlob(tour) {
  return [tour.title].filter(Boolean).join(' ');
}

function getTravelWindowDates(tour, runDate, endDate) {
  const departureDates = Array.isArray(tour.departureDates) ? tour.departureDates : [];
  const candidates = departureDates.length > 0 ? departureDates : [tour.departureDate].filter(Boolean);
  return candidates
    .filter((date) => typeof date === 'string' && date >= runDate && date <= endDate)
    .sort();
}

function hasSummerSignals(tour) {
  const blob = textBlob(tour);
  return SUMMER_KEYWORDS.some((keyword) => blob.includes(keyword));
}

function isGenericDestination(destination) {
  return destination === '其他' || destination === '未标注目的地';
}

function countKeywordHits(blob, keywords) {
  return keywords.reduce((count, keyword) => (blob.includes(keyword) ? count + 1 : count), 0);
}

function inferRouteFamily(title) {
  const normalized = slugifyText(title)
    .replace(/[（(][^）)]*[）)]/g, ' ')
    .replace(/\d+\s*天/g, ' ')
    .replace(/(含早|含餐|食\d+餐|带池|泡池|雅泡|私汤|升级房|升级版|豪华版|标准版|平价之选|品质之选|超低价|慢生活|食宿升级|1号楼|2号楼|3号楼|威士忌雅泡|威士忌畔山|高铁|动车|双动|双高|纯玩)/g, ' ')
    .replace(/[·丨|｜/]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\s+/g, '');
  return normalized || slugifyText(title) || '未分组线路';
}

function inferExperienceSignals(tour) {
  const blob = experienceBlob(tour);
  const signals = [];
  if (countKeywordHits(blob, SCENIC_KEYWORDS) > 0) signals.push('山水避暑');
  if (countKeywordHits(blob, WATER_KEYWORDS) > 0) signals.push('亲水玩水');
  if (countKeywordHits(blob, COASTAL_KEYWORDS) > 0) signals.push('海边海风');
  if (countKeywordHits(blob, HOT_SPRING_KEYWORDS) > 0) signals.push('温泉泡池');
  if (countKeywordHits(blob, HOTEL_RELAX_KEYWORDS) > 0) signals.push('酒店放松');
  if (countKeywordHits(blob, FOOD_CULTURE_KEYWORDS) > 0) signals.push('美食人文');
  if (countKeywordHits(blob, FAMILY_PLAY_KEYWORDS) > 0) signals.push('亲子玩乐');
  if (countKeywordHits(blob, LONG_HAUL_KEYWORDS) > 0) signals.push('长线风景');
  if (tour.suitableFor?.includes('亲子') && !signals.includes('亲子玩乐')) {
    signals.push('亲子友好');
  }
  return [...new Set(signals)];
}

function getExperienceHitCounts(tour) {
  const blob = experienceBlob(tour);
  return {
    scenic: countKeywordHits(blob, SCENIC_KEYWORDS),
    water: countKeywordHits(blob, WATER_KEYWORDS),
    coastal: countKeywordHits(blob, COASTAL_KEYWORDS),
    hotSpring: countKeywordHits(blob, HOT_SPRING_KEYWORDS),
    hotel: countKeywordHits(blob, HOTEL_RELAX_KEYWORDS),
    food: countKeywordHits(blob, FOOD_CULTURE_KEYWORDS),
    family: countKeywordHits(blob, FAMILY_PLAY_KEYWORDS),
    longHaul: countKeywordHits(blob, LONG_HAUL_KEYWORDS),
  };
}

function hasWeekendDeparture(windowDates) {
  return windowDates.some((dateKey) => {
    const dayOfWeek = new Date(`${dateKey}T00:00:00`).getDay();
    return dayOfWeek === 5 || dayOfWeek === 6 || dayOfWeek === 0;
  });
}

function classifyTourBucket(tour, experienceSignals = inferExperienceSignals(tour)) {
  const destination = normalizeDestination(tour.destination);
  const hits = getExperienceHitCounts(tour);
  if (hits.family > 0 && hits.water > 0) {
    return '亲子玩乐';
  }
  if (hits.coastal > 0) {
    return '海边海岛';
  }
  if (hits.scenic > 0 || hits.water > 0) {
    return '山水亲水';
  }
  if (hits.food >= 2 || (hits.food > 0 && hits.scenic === 0 && hits.coastal === 0)) {
    return '美食人文';
  }
  if (hits.family > 0 || experienceSignals.includes('亲子玩乐')) {
    return '亲子玩乐';
  }
  if (
    hits.hotSpring > 0 ||
    hits.hotel > 1 ||
    ((hits.hotel > 0 || experienceSignals.includes('酒店放松')) && hits.scenic === 0 && hits.water === 0)
  ) {
    return '酒店泡池';
  }
  if (
    hits.longHaul > 0 ||
    experienceSignals.includes('长线风景') ||
    tour.duration >= 5 ||
    !DOMESTIC_NEARBY_DESTINATIONS.has(destination)
  ) {
    return '长线风景';
  }
  return '周末轻出发';
}

function scoreTour(tour, runDate, windowDates) {
  const destination = normalizeDestination(tour.destination);
  const firstDate = windowDates[0];
  const daysUntilDeparture = firstDate ? diffDays(runDate, firstDate) : 999;
  const availabilityConfidence = tour.dataQuality?.availabilityConfidence || tour.meta?.dataQuality?.availabilityConfidence || 'unknown';
  const routeFamily = inferRouteFamily(tour.title);
  const experienceSignals = inferExperienceSignals(tour);
  const bucket = classifyTourBucket(tour, experienceSignals);
  const departureSpread = new Set(windowDates).size;
  const weekendFriendly = hasWeekendDeparture(windowDates);
  const highlightCount = new Set([
    ...(Array.isArray(tour.highlights) ? tour.highlights : []),
    ...(Array.isArray(tour.tags) ? tour.tags : []),
  ].filter(Boolean)).size;
  let score = 0;

  score += Math.max(0, 18 - Math.min(daysUntilDeparture, 18));
  if (availabilityConfidence === 'high') score += 18;
  if (availabilityConfidence === 'medium') score += 10;
  if (Array.isArray(tour.images) && tour.images.length > 0) score += 10;
  if (typeof tour.bookingUrl === 'string' && tour.bookingUrl.trim()) score += 8;

  if (tour.duration >= 2 && tour.duration <= 4) score += 16;
  else if (tour.duration >= 5 && tour.duration <= 6) score += 11;
  else if (tour.duration >= 7 && tour.duration <= 8) score += 4;
  else if (tour.duration > 8) score -= 8;

  if (typeof tour.price === 'number') {
    if (tour.price >= 199 && tour.price <= 3999) score += 12;
    else if (tour.price <= 6999) score += 6;
    else if (tour.price >= 15000) score -= 12;
  }

  if (DOMESTIC_NEARBY_DESTINATIONS.has(destination)) score += 16;
  if (isGenericDestination(destination)) score -= 14;
  if (hasSummerSignals(tour)) score += 10;
  if (tour.title?.includes('暑假')) score += 6;
  if (tour.suitableFor?.includes('亲子')) score += 2;
  if (tour.isFlashSale) score += 4;
  if (tour.isHot) score += 3;
  score += Math.min(8, Math.max(0, departureSpread - 1) * 2);
  if (weekendFriendly) score += 4;
  score += Math.min(10, experienceSignals.length * 2);
  score += Math.min(6, highlightCount);
  if (bucket === '山水亲水') score += 6;
  if (bucket === '海边海岛') score += 5;
  if (bucket === '酒店泡池') score += 4;
  if (bucket === '美食人文') score += 3;
  if (experienceSignals.includes('山水避暑') && experienceSignals.includes('温泉泡池')) score += 3;
  if (experienceSignals.includes('山水避暑') && experienceSignals.includes('亲水玩水')) score += 4;

  return {
    score,
    daysUntilDeparture,
    availabilityConfidence,
    destination,
    firstDate,
    routeFamily,
    bucket,
    experienceSignals,
    departureSpread,
    weekendFriendly,
    highlightCount,
  };
}

function summarizePriceRange(tours) {
  const prices = tours.map((tour) => tour.price).filter((value) => typeof value === 'number').sort((a, b) => a - b);
  if (prices.length === 0) return '价格以供应商页面为准';
  return `${prices[0]}-${prices[prices.length - 1]}元/${tours[0]?.priceUnit || '人'}`;
}

function deriveThemeHints(selectedTours, season) {
  const hints = [];
  if (season === '夏季') {
    hints.push('周边避暑');
    hints.push('亲子短途');
    hints.push('山水清凉');
  }

  if (selectedTours.some((tour) => (tour.theme || '').includes('亲子') || tour.suitableFor?.includes('亲子'))) {
    hints.push('暑期亲子');
  }
  if (selectedTours.some((tour) => textBlob(tour).includes('海'))) {
    hints.push('玩水度假');
  }
  return [...new Set(hints)].slice(0, 4);
}

function compareEditorialPriority(left, right) {
  return (
    right.editorialScore - left.editorialScore ||
    right.departureSpread - left.departureSpread ||
    Number(right.weekendFriendly) - Number(left.weekendFriendly) ||
    right.experienceSignals.length - left.experienceSignals.length ||
    right.highlightCount - left.highlightCount ||
    left.price - right.price
  );
}

function applyCrowdingPenalties(scoredTours) {
  const familyCounts = new Map();
  const destinationCounts = new Map();
  const bucketCounts = new Map();

  return scoredTours
    .map((tour) => {
      const familyRank = (familyCounts.get(tour.routeFamily) || 0) + 1;
      const destinationRank = (destinationCounts.get(tour.destination) || 0) + 1;
      const bucketRank = (bucketCounts.get(tour.bucket) || 0) + 1;
      familyCounts.set(tour.routeFamily, familyRank);
      destinationCounts.set(tour.destination, destinationRank);
      bucketCounts.set(tour.bucket, bucketRank);

      const familyPenalty = familyRank > 1 ? Math.min(24, (familyRank - 1) * 8) : 0;
      const destinationPenalty = destinationRank > 4 ? Math.min(12, (destinationRank - 4) * 3) : 0;
      const bucketPenalty = bucketRank > 10 ? Math.min(10, (bucketRank - 10) * 2) : 0;
      const editorialScore = tour.editorialScore - familyPenalty - destinationPenalty - bucketPenalty;

      return {
        ...tour,
        editorialScore,
        routeFamilyRank: familyRank,
        editorialReasons: [
          ...tour.editorialReasons,
          familyRank === 1 ? '同系列优先保留首推' : `同系列第${familyRank}条，适度降权`,
        ],
      };
    })
    .sort(compareEditorialPriority);
}

function pickToursByStages(candidateTours, limit, stages) {
  const picked = [];
  const usedIds = new Set();
  const bucketCounts = new Map();
  const destinationCounts = new Map();
  const familyCounts = new Map();

  for (const stage of stages) {
    const stageLimit = Math.min(limit, stage.until);
    let progressed = true;
    while (picked.length < stageLimit && progressed) {
      progressed = false;
      for (const tour of candidateTours) {
        if (usedIds.has(tour.id)) continue;
        const bucketCount = bucketCounts.get(tour.bucket) || 0;
        const destinationCount = destinationCounts.get(tour.destination) || 0;
        const familyCount = familyCounts.get(tour.routeFamily) || 0;
        if (bucketCount >= stage.maxPerBucket) continue;
        if (destinationCount >= stage.maxPerDestination) continue;
        if (familyCount >= stage.maxPerFamily) continue;
        picked.push(tour);
        usedIds.add(tour.id);
        bucketCounts.set(tour.bucket, bucketCount + 1);
        destinationCounts.set(tour.destination, destinationCount + 1);
        familyCounts.set(tour.routeFamily, familyCount + 1);
        progressed = true;
        if (picked.length >= stageLimit) break;
      }
    }
    if (picked.length >= limit) return picked;
  }

  for (const tour of candidateTours) {
    if (usedIds.has(tour.id)) continue;
    picked.push(tour);
    usedIds.add(tour.id);
    if (picked.length >= limit) break;
  }

  return picked;
}

function buildCandidatePool(scoredTours, limit) {
  return pickToursByStages(scoredTours, limit, [
    { until: Math.min(limit, 18), maxPerBucket: 4, maxPerDestination: 3, maxPerFamily: 1 },
    { until: Math.min(limit, 32), maxPerBucket: 7, maxPerDestination: 5, maxPerFamily: 1 },
    { until: limit, maxPerBucket: 12, maxPerDestination: 8, maxPerFamily: 2 },
  ]);
}

function rebalanceSelectedTours(candidateTours, maxArticleItems) {
  return pickToursByStages(candidateTours, maxArticleItems, [
    { until: Math.min(maxArticleItems, 10), maxPerBucket: 3, maxPerDestination: 2, maxPerFamily: 1 },
    { until: Math.min(maxArticleItems, 18), maxPerBucket: 5, maxPerDestination: 3, maxPerFamily: 1 },
    { until: maxArticleItems, maxPerBucket: 7, maxPerDestination: 4, maxPerFamily: 2 },
  ]);
}

export function resolveArticleAssetUrl(assetPath, websiteUrl = DEFAULT_WEBSITE_URL) {
  if (!assetPath || typeof assetPath !== 'string') return '';
  if (/^https?:\/\//i.test(assetPath)) return assetPath;
  const normalizedWebsiteUrl = websiteUrl.replace(/\/$/, '');
  if (assetPath.startsWith('/')) {
    return `${normalizedWebsiteUrl}${assetPath}`;
  }
  return `${normalizedWebsiteUrl}/${assetPath.replace(/^\.\//, '')}`;
}

function formatTourForPrompt(tour) {
  const primaryImage = normalizeArticleImageUrl(chooseTourImage(tour));
  return {
    id: tour.id,
    title: tour.title,
    source: tour.source,
    destination: normalizeDestination(tour.destination),
    duration: tour.duration,
    price: tour.price,
    priceUnit: tour.priceUnit,
    theme: tour.theme,
    suitableFor: tour.suitableFor || [],
    tags: tour.tags || [],
    highlights: tour.highlights || [],
    departureDates: tour.selectedDepartureDates || [],
    transportType: tour.transportType,
    accommodationLevel: tour.accommodationLevel,
    bookingUrl: tour.bookingUrl,
    images: (tour.images || []).map(normalizeArticleImageUrl),
    siteUrl: getTourSiteUrl(tour.id),
    qrPath: getTourQrRelativePath(tour.id),
    primaryImage,
    bucket: tour.bucket || classifyTourBucket(tour),
    routeFamily: tour.routeFamily || inferRouteFamily(tour.title),
    experienceSignals: Array.isArray(tour.experienceSignals) ? tour.experienceSignals : inferExperienceSignals(tour),

    images: tour.images || [],
    articleImages: (tour.images || []).slice(0, 3).map((assetPath) => resolveArticleAssetUrl(assetPath)),
    dataQuality: {
      availabilityConfidence: tour.availabilityConfidence,
      riskFlags: tour.dataQuality?.riskFlags || tour.meta?.dataQuality?.riskFlags || [],
    },
    editorialScore: tour.editorialScore,
    editorialReasons: tour.editorialReasons,
  };
}

export function buildWeeklyArticleContext(tours, options = {}) {
  const runDate = options.runDate || toDateKey();
  const windowDays = options.windowDays || DEFAULT_WINDOW_DAYS;
  const maxCandidates = options.maxCandidates || DEFAULT_MAX_CANDIDATES;
  const maxArticleItems = options.maxArticleItems || DEFAULT_MAX_ARTICLE_ITEMS;
  const endDate = addDays(runDate, windowDays);
  const [year, month] = runDate.split('-').map(Number);
  const season = monthToSeason(month);
  const weekWindow = getWeekWindow(runDate);

  const filtered = tours
    .map((tour) => {
      const selectedDepartureDates = getTravelWindowDates(tour, runDate, endDate);
      if (selectedDepartureDates.length === 0) return null;

      const score = scoreTour(tour, runDate, selectedDepartureDates);
      return {
        ...tour,
        selectedDepartureDates,
        editorialScore: score.score,
        availabilityConfidence: score.availabilityConfidence,
        bucket: score.bucket,
        routeFamily: score.routeFamily,
        experienceSignals: score.experienceSignals,
        departureSpread: score.departureSpread,
        weekendFriendly: score.weekendFriendly,
        highlightCount: score.highlightCount,
        editorialReasons: [
          `${score.daysUntilDeparture}天内可出发`,
          score.availabilityConfidence === 'high' ? '班期可信度高' : '班期需二次确认',
          `${score.bucket}优先入池`,
          score.weekendFriendly ? '周末出发更顺手' : '工作日班期也可消化',
          hasSummerSignals(tour) ? `${season}语境下更好写` : '以常规卖点切入',
        ],
      };
    })
    .filter(Boolean)
    .sort(compareEditorialPriority);

  const diversified = applyCrowdingPenalties(filtered);
  const candidateLimit = Math.max(maxCandidates, maxArticleItems * 2);
  const scanLimit = Math.min(diversified.length, Math.max(candidateLimit * 4, maxArticleItems * 8, 160));
  const candidateTours = buildCandidatePool(diversified.slice(0, scanLimit), candidateLimit);
  const selectedTours = rebalanceSelectedTours(candidateTours, maxArticleItems);
  const themeHints = deriveThemeHints(selectedTours, season);

  return {
    runDate,
    season,
    weekWindow,
    articleGoal: '每周旅行团公众号推荐文章',
    editorialContext: {
      audience: '广州及周边出发、想近期报名旅行团的公众号读者',
      tone: '实用、轻松、像熟悉线路的旅行顾问',
      themeHints,
      departureWindowDays: windowDays,
      priceRangeHint: summarizePriceRange(selectedTours),
    },
    selectionDiagnostics: {
      totalTours: tours.length,
      eligibleTours: filtered.length,
      scannedTours: scanLimit,
      candidatePoolSize: candidateTours.length,
      selectedSize: selectedTours.length,
      bucketCounts: candidateTours.reduce((result, tour) => {
        result[tour.bucket] = (result[tour.bucket] || 0) + 1;
        return result;
      }, {}),
    },
    selectionRules: {
      onlyUseToursWithUpcomingDepartureDates: true,
      preferReliableDepartureDates: true,
      preferWithImages: true,
      maxCandidates,
      maxArticleItems,
      avoidClaims: [
        '不要承诺一定成团',
        '不要承诺最低价',
        '不要虚构库存',
        '不要虚构具体天气预报',
        '不要写绝对化广告词',
      ],
    },
    candidateTours: candidateTours.map(formatTourForPrompt),
    selectedTours: selectedTours.map(formatTourForPrompt),
  };
}

export function buildWeeklyArticlePrompt(context) {
  const selectedTourBlock = context.selectedTours
    .map((tour, index) => {
      const lines = [
        `${index + 1}. ${tour.title}`,
        `目的地：${tour.destination}`,
        `时长：${tour.duration}天`,
        `价格：${tour.price}${tour.priceUnit || '元/人'}`,
        `近期班期：${(tour.departureDates || []).join('、')}`,
        `主题：${tour.theme || '未标注'}`,
        `适合人群：${(tour.suitableFor || []).join('、') || '未标注'}`,
        `亮点：${(tour.highlights || []).slice(0, 4).join('、') || '未标注'}`,
        `标签：${(tour.tags || []).slice(0, 4).join('、') || '未标注'}`,
        `线路家族：${tour.routeFamily || '未归类'}`,
        `体验关键词：${(tour.experienceSignals || []).join('、') || '常规短线'}`,
        `站内详情：${tour.siteUrl}`,
        `二维码文件：${tour.qrPath}`,
        `分组：${tour.bucket}`,
        `公众号分大类：${getArticleBucketMeta(tour.bucket).title}`,

        `正文配图：${(tour.articleImages || []).join('、') || '未标注'}`,
        `预订链接：${tour.bookingUrl}`,
      ];
      return lines.join('\n');
    })
    .join('\n\n');

  return [
    '你是一名擅长写微信公众号的旅行编辑。',
    '请只根据提供的 JSON 素材与线路事实写作，不要编造任何产品信息。',
    '你这次不要输出整篇 Markdown，只输出一个 JSON 对象，方便程序拼接成固定版式的公众号文章。',
    '',
    '写作要求：',
    `- 文章日期语境：${context.runDate}，当前季节是${context.season}`,
    `- 周窗口：${context.weekWindow.start} 到 ${context.weekWindow.end}`,
    `- 读者：${context.editorialContext.audience}`,
    `- 基调：${context.editorialContext.tone}`,
    `- 选题方向：${context.editorialContext.themeHints.join('、') || '周度出游推荐'}`,
    '- 标题适合公众号，但不要夸张标题党，不要像营销口号',
    '- weatherLead 要把未来7天体感、季节节奏、节假日/时令玩法判断写在前头，但只能做保守表达，不要写成确定性天气预报',
    '- intro 是开场导语，要像老广熟门熟路地给朋友出主意，不要像答题或思维链展示',
    '- groupIntros 要按“公众号分大类”给每个分组都写一段 40 到 80 字的导语，语气要像种草，不要像解释栏目，也不要重复“这组/这一组/如果你更想”这种开场',
    '- 每条线路只写三个字段：recommendationTitle、reason、reminder',
    '- 程序会按“公众号分大类”自动分组排版，所以你不要再额外发明新的栏目名，只把每条线路写得具体、有种草感',
    '- reason 必须 55 字以上，要讲清为什么当下去会更舒服或更值得，不要空泛，不要写“推荐方向”“取舍”“可以理解为”这种解释腔',
    '- recommendationTitle 可以比原产品名更像公众号小标题，但不能改错事实',
    '- reminder 用一句自然提醒补班期、节奏、适合人群或出发前注意点',
    '- 不要重复同一个 destination 的同一套说法，不要把多条线路写成一个模子',
    '- 能写真山水、亲水、森林、海风、泳池、水世界，就不要硬把所有“带池”都写成温泉放松',    '- 不要使用“最佳、第一、最低价、必去、百分百成团、错过再等一年”等绝对化表达',
    '- 不要编造出发城市、库存、优惠、成团率、景区政策',
    '- 不要输出 Markdown 代码块，不要输出解释，只输出 JSON',
    '',
    '本次优先采用的线路：',
    selectedTourBlock,
    '',
    '输出 JSON 格式：',
    '{',
    '  "title": "..." ,',
    '  "summary": "..." ,',
    '  "intro": "..." ,',
    '  "weatherLead": "..." ,',
    '  "groupIntros": [',
    '    {',
    '      "bucket": "山水亲水",',
    '      "intro": "..."',
    '    }',
    '  ]',
    '  "items": [',
    '    {',
    '      "id": "tour_xxx",',
    '      "recommendationTitle": "..." ,',
    '      "reason": "..." ,',
    '      "reminder": "..."',
    '    }',
    '  ]',
    '}',  ].join('\n');
}

function hasMarkdownImage(lines, startIndex, endIndex) {
  for (let index = startIndex; index < endIndex; index += 1) {
    if (/!\[[^\]]*]\(([^)]+)\)/.test(lines[index])) return true;
  }
  return false;
}

export function enrichWeeklyArticleMedia(article, context, options = {}) {
  const websiteUrl = options.websiteUrl || DEFAULT_WEBSITE_URL;
  const lines = article.replace(/\r\n/g, '\n').split('\n');
  const h1Index = lines.findIndex((line) => /^#\s+/.test(line.trim()));
  const firstSectionIndex = lines.findIndex((line) => /^##\s+/.test(line.trim()));
  const heroTour = context.selectedTours[0];
  const heroImageUrl = resolveArticleAssetUrl(heroTour?.images?.[0] || '', websiteUrl);
  let heroInserted = false;

  if (heroImageUrl && h1Index >= 0) {
    const heroRegionEnd = firstSectionIndex >= 0 ? firstSectionIndex : lines.length;
    if (!hasMarkdownImage(lines, h1Index + 1, heroRegionEnd)) {
      lines.splice(h1Index + 1, 0, '', `![${heroTour?.title || '线路配图'}](${heroImageUrl})`, '');
      heroInserted = true;
    }
  }

  context.selectedTours.forEach((tour, tourIndex) => {
    const sectionIndex = lines.findIndex((line) => /^##\s+/.test(line.trim()) && line.includes(tour.title));
    if (sectionIndex < 0) return;

    const nextSectionIndex = lines.findIndex(
      (line, index) => index > sectionIndex && /^##\s+/.test(line.trim()),
    );
    const sectionEnd = nextSectionIndex >= 0 ? nextSectionIndex : lines.length;
    if (hasMarkdownImage(lines, sectionIndex + 1, sectionEnd)) return;
    if (heroInserted && tourIndex === 0) return;

    const imageUrl = resolveArticleAssetUrl(tour.images?.[0] || '', websiteUrl);
    if (!imageUrl) return;
    lines.splice(sectionIndex + 1, 0, '', `![${tour.title}](${imageUrl})`, '');
  });

  return lines.join('\n').replace(/\n{4,}/g, '\n\n\n');
}

function normalizeBaseUrl(baseUrl) {
  return baseUrl.replace(/\/$/, '');
}

function getChatCompletionsUrl(baseUrl) {
  const normalized = normalizeBaseUrl(baseUrl);
  if (normalized.endsWith('/chat/completions')) return normalized;
  if (/\/v\d+$/.test(normalized)) return `${normalized}/chat/completions`;
  return `${normalized}/v1/chat/completions`;
}

function getAiContent(payload) {
  const choice = payload?.choices?.[0];
  const content = choice?.message?.content;
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => (typeof part?.text === 'string' ? part.text : ''))
      .filter(Boolean)
      .join('\n');
  }
  throw new Error('DeepSeek response did not contain message content.');
}

function stripMarkdownFence(text) {
  const trimmed = text.trim();
  const match = trimmed.match(/^```[a-zA-Z]*\n([\s\S]*?)\n```$/);
  return match ? match[1].trim() : trimmed;
}

function parseJsonPayload(text) {
  const cleaned = stripMarkdownFence(text).trim();
  return JSON.parse(cleaned);
}

function normalizeAiText(value) {
  return String(value || '')
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function normalizeAiItemMap(payload, context) {
  const itemsById = new Map();
  const rawItems = Array.isArray(payload?.items) ? payload.items : [];
  for (const item of rawItems) {
    if (!item || typeof item !== 'object') continue;
    const id = String(item.id || '').trim();
    if (!id) continue;
    itemsById.set(id, {
      recommendationTitle: normalizeAiText(item.recommendationTitle || ''),
      reason: normalizeAiText(item.reason || ''),
      reminder: normalizeAiText(item.reminder || ''),
    });
  }

  return context.selectedTours.map((tour) => {
    const item = itemsById.get(tour.id) || {};
    return {
      id: tour.id,
      recommendationTitle: item.recommendationTitle || '',
      reason: item.reason || '',
      reminder: item.reminder || '',
    };
  });
}

function normalizeAiGroupIntroMap(payload) {
  const groupIntros = new Map();
  const rawItems = Array.isArray(payload?.groupIntros) ? payload.groupIntros : [];
  for (const item of rawItems) {
    if (!item || typeof item !== 'object') continue;
    const bucket = String(item.bucket || '').trim();
    if (!bucket) continue;
    const intro = normalizeAiText(item.intro || '');
    if (!intro) continue;
    groupIntros.set(bucket, intro);
  }
  return groupIntros;
}

function buildFallbackIntro(context) {
  const advice = context.editorialContext.themeHints.join('、') || '近场清凉、山水与亲水玩法';
  return `这周广州和周边更适合挑有树荫、有水体、能把节奏放慢的线路来走。比起纯城市暴走，${advice}这一类行程更容易把闷热感卸下来；如果时间不多，住下来放松的酒店线也更适合周末接一口气。`;
}

function buildFallbackWeatherLead(context) {
  return `进入${context.season}后，华南通常会反复出现闷热和阵雨，出游更适合优先看体感而不是只看公里数。瀑布、峡谷、森林步道、漂流、海边、泳池和住下来慢慢玩的线路，这周都会比纯暴晒型路线更顺手。`;
}

export async function fetchDepartureWeatherWindow(runDate, fetchImpl = globalThis.fetch) {
  const query = new URLSearchParams({
    latitude: String(DEPARTURE_WEATHER_COORDS.latitude),
    longitude: String(DEPARTURE_WEATHER_COORDS.longitude),
    daily: 'temperature_2m_max,temperature_2m_min,precipitation_probability_max',
    timezone: DEPARTURE_WEATHER_COORDS.timezone,
    forecast_days: '7',
  });
  const response = await fetchWithTimeout(
    `https://api.open-meteo.com/v1/forecast?${query.toString()}`,
    {},
    WEATHER_FETCH_TIMEOUT_MS,
    fetchImpl,
  );
  if (!response.ok) {
    throw new Error(`Weather API failed: ${response.status}`);
  }

  const data = await response.json();
  const times = Array.isArray(data?.daily?.time) ? data.daily.time : [];
  const maxTemps = Array.isArray(data?.daily?.temperature_2m_max) ? data.daily.temperature_2m_max : [];
  const minTemps = Array.isArray(data?.daily?.temperature_2m_min) ? data.daily.temperature_2m_min : [];
  const rainProbs = Array.isArray(data?.daily?.precipitation_probability_max)
    ? data.daily.precipitation_probability_max
    : [];

  const normalizedRunDate = String(runDate || '').trim();
  const rawDays = times.map((date, index) => ({
    date,
    maxTemp: Math.round(Number(maxTemps[index])),
    minTemp: Math.round(Number(minTemps[index])),
    rainProbability: Math.round(Number(rainProbs[index])),
  })).filter((day) => day.date && Number.isFinite(day.maxTemp) && Number.isFinite(day.minTemp) && Number.isFinite(day.rainProbability));

  const days = rawDays
    .filter((day) => !normalizedRunDate || day.date >= normalizedRunDate)
    .slice(0, 7);

  if (days.length === 0) {
    throw new Error('Weather API returned no daily forecast rows.');
  }

  return {
    source: 'open-meteo',
    destination: DEPARTURE_WEATHER_COORDS.destination,
    days,
  };
}

function buildWeatherRouteTips(context) {
  const tips = [];
  const buckets = new Set((context.selectedTours || []).map((tour) => tour.bucket));
  const hasCoastal = buckets.has('海边海岛');
  const hasWater = buckets.has('山水亲水') || buckets.has('亲子玩乐');
  const hasLongHaul = (context.selectedTours || []).some((tour) => {
    const destination = normalizeDestination(tour.destination);
    return destination && !['广东', '港澳'].includes(destination) && Number(tour.duration || 0) >= 3;
  });

  if (hasWater) {
    tips.push('山水溯溪和玩水线更适合带防滑鞋、替换衣物和防水袋');
  }
  if (hasCoastal) {
    tips.push('海边海岛线临出发前再补看一次阵雨窗口和风浪提示');
  }
  if (hasLongHaul) {
    tips.push('跨省高铁和山地线早晚体感通常比广州低一截，轻薄外套别省');
  }
  if (tips.length === 0) {
    tips.push('夏季线路普遍更吃体感，防晒、防蚊和轻便替换衣物带上会更从容');
  }
  return tips;
}

function describeForecastDay(day) {
  const notes = [];
  if (day.maxTemp >= 35) {
    notes.push('白天暴晒感会更强');
  } else if (day.maxTemp >= 33) {
    notes.push('午后体感偏闷');
  }
  if (day.rainProbability >= 70) {
    notes.push('阵雨概率高');
  } else if (day.rainProbability >= 40) {
    notes.push('有阵雨可能');
  }
  return notes.length > 0 ? `，${notes.join('，')}` : '';
}

export function buildDetailedWeatherLead(context, baseLead, weatherWindow = null) {
  const lines = [];
  const intro = normalizeAiText(baseLead || buildFallbackWeatherLead(context));
  if (intro) {
    lines.push(intro);
  }

  if (weatherWindow?.days?.length) {
    const minTemp = Math.min(...weatherWindow.days.map((day) => day.minTemp));
    const maxTemp = Math.max(...weatherWindow.days.map((day) => day.maxTemp));
    const maxRain = Math.max(...weatherWindow.days.map((day) => day.rainProbability));
    lines.push('');
    lines.push(
      `按${weatherWindow.destination || '广州'}出发地未来7天看，整体大致在 ${minTemp}-${maxTemp}℃，最高降雨概率约 ${maxRain}%，还是典型的高温闷热夹午后阵雨节奏。`,
    );
    lines.push('');
    for (const day of weatherWindow.days) {
      lines.push(
        `- ${formatMonthDay(day.date)}：${day.minTemp}-${day.maxTemp}℃，降雨概率约 ${day.rainProbability}%${describeForecastDay(day)}`,
      );
    }
  } else {
    lines.push('');
    lines.push('- 出发前最好再补看一次广州逐日预报，夏季通常还是高温闷热夹午后阵雨的节奏。');
  }

  lines.push(`- 玩法提醒：${buildWeatherRouteTips(context).join('；')}`);
  return lines.join('\n');
}

function defaultReasonForTour(tour) {
  const destination = normalizeDestination(tour.destination);
  const departureHint = summarizeDepartureDates(tour.departureDates, 4);
  const highlights = highlightLabel(tour);
  const suitableFor = suitabilityLabel(tour);
  return `这条线现在值得出发，重点不只是目的地顺眼，而是它的玩法和眼下体感很对路。${destination}这一线能打的通常是${highlights}，比起只在城里兜圈，更容易把这周的闷热感卸下来。对${suitableFor}来说，它既有看点，也不至于把行程排得太赶；近期班期有${departureHint}，${priceLabel(tour)}，是那种现在翻出来会立刻想认真看看详情的路线。`;
}

function defaultReminderForTour(tour) {
  return `线路为${durationLabel(tour)}，近期班期以供应商页面实时展示为准；如果是亲水、海边或山地玩法，出发前记得顺手看一眼当周天气和集合通知。`;
}

function getArticleBucketMeta(bucket) {
  return ARTICLE_BUCKET_META[bucket] || {
    title: bucket || '本周推荐',
    intro: '这一组是适合本周顺手出发的线路，玩法和节奏各不相同，可以按自己想要的体感来挑。',
  };
}

function groupSelectedToursForArticle(selectedTours) {
  const groups = new Map();
  for (const tour of selectedTours || []) {
    const bucket = tour.bucket || '周末轻出发';
    if (!groups.has(bucket)) {
      groups.set(bucket, {
        bucket,
        ...getArticleBucketMeta(bucket),
        tours: [],
      });
    }
    groups.get(bucket).tours.push(tour);
  }

  return [...groups.values()].sort((left, right) => {
    const leftIndex = ARTICLE_BUCKET_ORDER.indexOf(left.bucket);
    const rightIndex = ARTICLE_BUCKET_ORDER.indexOf(right.bucket);
    const safeLeftIndex = leftIndex === -1 ? ARTICLE_BUCKET_ORDER.length : leftIndex;
    const safeRightIndex = rightIndex === -1 ? ARTICLE_BUCKET_ORDER.length : rightIndex;
    return safeLeftIndex - safeRightIndex;
  });
}

function renderTourSection(tour, aiItem, index) {
  const title = aiItem.recommendationTitle || slugifyText(tour.title);
  const reason = aiItem.reason || defaultReasonForTour(tour);
  const reminder = aiItem.reminder || defaultReminderForTour(tour);
  const image = tour.primaryImage || normalizeArticleImageUrl(chooseTourImage(tour));
  const siteUrl = tour.siteUrl || getTourSiteUrl(tour.id);
  const qrPath = tour.qrPath || getTourQrRelativePath(tour.id);
  const departureHint = summarizeDepartureDates(tour.departureDates, 4);

  return [
    '---',
    '',
    `#### ${index}. ${title}`,
    '',
    image ? `![${escapeMarkdown(tour.title)}](${image})` : '',
    '',
    reason,
    '',
    `**适合**：${suitabilityLabel(tour)}｜当下看点：${highlightLabel(tour)}`,
    `**行程**：${durationLabel(tour)}｜${priceLabel(tour)}｜近期班期 ${departureHint || '以页面为准'}`,
    `**提醒**：${reminder}`,
    '',
    '[查看行程](' + siteUrl + ')',
    '',
    '扫码查看详情',
    '',
    `![${escapeMarkdown(tour.title)} 报名二维码](${qrPath})`,
  ]
    .filter(Boolean)
    .join('\n');
}

export function renderWeeklyArticle(context, aiPayload) {
  const frontmatter = [
    '---',
    `title: "${(aiPayload.title || '本周值得认真看的25条线路').replaceAll('"', '\\"')}"`,
    `summary: "${(aiPayload.summary || buildFallbackIntro(context)).replaceAll('"', '\\"')}"`,
    `author: "${DEFAULT_AUTHOR}"`,
    `cover: "${context.selectedTours[0]?.primaryImage || context.selectedTours[0]?.images?.[0] || DEFAULT_COVER}"`,
    '---',
  ].join('\n');

  const intro = normalizeAiText(aiPayload.intro || buildFallbackIntro(context));
  const weatherLead = normalizeAiText(aiPayload.weatherLead || buildFallbackWeatherLead(context));
  const aiGroupIntros = normalizeAiGroupIntroMap(aiPayload);
  const items = normalizeAiItemMap(aiPayload, context);
  const itemsById = new Map(items.map((item) => [item.id, item]));
  const groupedSections = [];
  let recommendationIndex = 1;

  for (const group of groupSelectedToursForArticle(context.selectedTours)) {
    if (groupedSections.length > 0) {
      groupedSections.push('---');
      groupedSections.push('');
    }
    groupedSections.push(`### ${group.title}`);
    groupedSections.push('');
    groupedSections.push(normalizeAiText(aiGroupIntros.get(group.bucket) || group.intro));
    groupedSections.push('');
    for (const tour of group.tours) {
      groupedSections.push(renderTourSection(tour, itemsById.get(tour.id) || {}, recommendationIndex));
      groupedSections.push('');
      recommendationIndex += 1;
    }
  }

  return [
    frontmatter,
    '',
    `# ${aiPayload.title || '本周值得认真看的25条线路'}`,
    '',
    intro,
    '',
    '## 未来7天出游提醒',
    '',
    weatherLead,
    '',
    `![本周天气与季节提醒](${WEATHER_OVERVIEW_IMAGE})`,
    '',
    '## 本周推荐',
    '',
    ...groupedSections,
    '',
    '以上班期、价格和行程信息请以供应商页面实时展示为准，想看完整行程、图文详情和报名入口，直接点每条线路下方的“查看行程”或扫码进入老广去边度站内详情。',
  ].join('\n');
}

export async function generateWeeklyArticle(context, config, options = {}) {
  const prompt = buildWeeklyArticlePrompt(context);
  const maxTokens = options.maxTokens || DEFAULT_JSON_MAX_TOKENS;
  const response = await fetch(getChatCompletionsUrl(config.baseUrl), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      temperature: 0.7,
      max_tokens: maxTokens,
      response_format: {
        type: 'json_object',
      },
      messages: [
        {
          role: 'system',
          content: '你写作稳健、像旅行编辑而不是销售，不夸张，不编造产品事实。必须返回严格 json。',
        },
        {
          role: 'user',
          content: `${prompt}\n\n素材 JSON：\n${JSON.stringify(context, null, 2)}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`DeepSeek API failed: ${response.status} ${text.slice(0, 300)}`);
  }

  const payload = await response.json();
  const rawContent = getAiContent(payload);
  const structured = parseJsonPayload(rawContent);
  if (options.outputDir) {
    await ensureWeeklyArticleQrAssets(options.outputDir, context.selectedTours);
  }
  const article = renderWeeklyArticle(context, structured);
  return {
    prompt,
    article,
    structured,
    rawResponse: payload,
  };
}

function parseFrontmatter(article) {
  const match = article.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;
  const pairs = {};
  for (const line of match[1].split(/\r?\n/)) {
    const index = line.indexOf(':');
    if (index <= 0) continue;
    const key = line.slice(0, index).trim();
    const value = stripWrappingQuotes(line.slice(index + 1).trim());
    pairs[key] = value;
  }
  return pairs;
}

export function validateGeneratedArticle(article, context) {
  const issues = [];
  const frontmatter = parseFrontmatter(article);
  if (!frontmatter) {
    issues.push('Missing frontmatter block.');
  } else {
    for (const field of ['title', 'summary', 'author', 'cover']) {
      if (!frontmatter[field]) issues.push(`Missing frontmatter field: ${field}.`);
    }
    if (frontmatter.author !== DEFAULT_AUTHOR) {
      issues.push(`Author must be ${DEFAULT_AUTHOR}.`);
    }
  }

  for (const phrase of FORBIDDEN_PHRASES) {
    if (article.includes(phrase)) issues.push(`Contains forbidden phrase: ${phrase}`);
  }
  if (article.includes('quickchart.io')) {
    issues.push('Article should not use external QR service URLs.');
  }
  if (!article.includes('## 本周推荐')) {
    issues.push('Article is missing the main recommendation section heading.');
  }
  if ((article.match(/^###\s+/gm) || []).length === 0) {
    issues.push('Article is missing grouped recommendation headings.');
  }
  if ((article.match(/^    /gm) || []).length > 0) {
    issues.push('Article should not contain indentation artifacts.');
  }

  const mentionedSelectedTours = context.selectedTours.filter((tour) => article.includes(tour.title)).length;
  if (mentionedSelectedTours < Math.min(3, context.selectedTours.length)) {
    issues.push('Article did not mention enough selected tours by title.');
  }

  for (const tour of context.selectedTours) {
    const siteUrl = getTourSiteUrl(tour.id);
    const qrPath = tour.qrPath || getTourQrRelativePath(tour.id);
    if (!article.includes(siteUrl)) {
      issues.push(`Missing site URL for ${tour.id}.`);
    }
    if (!article.includes(qrPath)) {
      issues.push(`Missing QR path for ${tour.id}.`);
    }
    if (!article.includes(`报名二维码`)) {
      issues.push(`Missing QR block for ${tour.id}.`);
    }
  }

  const qrCount = (article.match(/扫码查看详情/g) || []).length;
  if (qrCount < context.selectedTours.length) {
    issues.push('Not every selected tour rendered a QR block.');
  }

  return {
    ok: issues.length === 0,
    issues,
    mentionedSelectedTours,
    expectedSelectedTours: context.selectedTours.length,
  };
}

export function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

export function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

export function defaultOutputDir(rootDir, runDate) {
  return path.join(rootDir, 'weekly-wechat-posts', runDate);
}

export function getDefaultAuthor() {
  return DEFAULT_AUTHOR;
}

export function rebuildWeeklyArticleFromStructured(context, structured) {
  return renderWeeklyArticle(context, structured);
}

export function getDefaultWebsiteUrl() {
  return DEFAULT_WEBSITE_URL;
}
