import fs from 'node:fs';
import path from 'node:path';

const DEFAULT_TOURS_FILE = 'public/data/tours.json';
const DEFAULT_WINDOW_DAYS = 21;
const DEFAULT_MAX_CANDIDATES = 36;
const DEFAULT_MAX_ARTICLE_ITEMS = 6;
const DEFAULT_MAX_GROUP_ITEMS = 5;
const DEFAULT_GROUP_RECOMMENDATION_TOTAL = 25;
const DEFAULT_AI_BUCKET_SIZE = 6;
const DEFAULT_AUTHOR = '老广旅行';
const DEFAULT_WEBSITE_URL = 'https://nuctori.github.io/EverywhereWeGoGz/';
const GUANGZHOU_COORDS = { latitude: 23.1291, longitude: 113.2644 };
const MAX_ROUTE_FAMILY_PER_ARTICLE = 1;
const MAX_DESTINATION_CLUSTER_PER_ARTICLE = 2;

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
  '速览',
  '当前数据里',
  '从数据看',
  '候选线路',
  '综合排序',
  '模型判断',
  '可以理解为',
  '别误会成',
  '可保留',
  '能打的',
  '作为补充',
  '适合预算有限',
  '樱花已过季',
  '其中6条深度推荐',
  '季节红利弱',
];

const REPETITIVE_PHRASE_LIMITS = [
  { phrase: '雷雨间隙', max: 2 },
  { phrase: '适合', max: 14 },
];

const NATURAL_COOLING_KEYWORDS = [
  '避暑',
  '清凉',
  '漂流',
  '海岛',
  '海边',
  '沙滩',
  '海湾',
  '银滩',
  '草原',
  '森林',
  '森林公园',
  '峡谷',
  '大峡谷',
  '瀑布',
  '山水',
  '山谷',
  '溪谷',
  '溯溪',
  '亲水',
  '玩水',
  '竹筏',
  '田园',
  '湿地',
  '暑假',
  'cool',
  'summer',
  'rafting',
  'beach',
  'coast',
  'island',
  'forest',
  'gorge',
  'waterfall',
  'water',
  'lake',
  'mountain',
  'mountain scenery',
];

const WATER_PLAY_KEYWORDS = [
  '泳池',
  '无边泳池',
  '恒温泳池',
  '水上乐园',
  '玩水',
  '亲水',
  '戏水',
  'pool',
  'infinity pool',
  'water park',
];

const HOT_SPRING_KEYWORDS = ['温泉', '私汤', '泡池', '汤泉', 'hot spring', 'spring resort'];
const FAMILY_KEYWORDS = ['亲子', '家庭', '带娃', '母婴', 'family', 'kid', 'kids', 'parent-child'];
const RESORT_KEYWORDS = ['度假', '酒店', '休闲', '美食', '放松', 'resort', 'hotel', 'relax', 'staycation'];
const RAIL_KEYWORDS = ['高铁', '动车', '火车', 'high-speed rail', 'rail', 'train'];
const FLOWER_KEYWORDS = ['荷花', '绣球', '花海', '花期', '荷塘', '樱花', '向日葵', '花'];
const RED_LEAF_KEYWORDS = ['红叶', '银杏', '枫叶', '秋色'];

const WEATHER_CODE_LABELS = {
  0: '晴',
  1: '大致晴',
  2: '多云',
  3: '阴天',
  45: '有雾',
  48: '有雾',
  51: '毛毛雨',
  53: '小雨',
  55: '中雨',
  61: '小雨',
  63: '中雨',
  65: '大雨',
  71: '小雪',
  73: '中雪',
  75: '大雪',
  80: '阵雨',
  81: '阵雨',
  82: '强阵雨',
  95: '雷阵雨',
  96: '雷阵雨',
  99: '强雷雨',
};

const DOMESTIC_NEARBY_DESTINATIONS = new Set([
  '广东',
  '广西',
  '湖南',
  '江西',
  '福建',
  '港澳',
  '桂林',
  '厦门',
]);

const PREFERENCE_GROUPS = [
  {
    id: 'family_short_break',
    label: '亲子短途',
    description: '适合带娃出行，2 到 4 天优先，尽量轻松不折腾。',
    matches: (tour, meta) => meta.isFamilyFriendly && tour.duration >= 2 && tour.duration <= 4,
  },
  {
    id: 'mountain_water_cooling',
    label: '山水清凉',
    description: '更符合夏季常识的清凉线，比如山水、漂流、森林、亲水。',
    matches: (_tour, meta) => meta.hasNaturalCoolingSignals || meta.hasWaterPlaySignals,
  },
  {
    id: 'weekend_nearby',
    label: '周末近场',
    description: '更适合广州及周边用户周末或小假期说走就走。',
    matches: (tour, meta) => meta.isNearby && tour.duration >= 2 && tour.duration <= 3,
  },
  {
    id: 'rail_escape',
    label: '高铁轻出省',
    description: '想走远一点，但更偏向高铁、动车这类省心交通方式。',
    matches: (tour, meta) => meta.isRailFriendly || /高铁|动车|火车/.test(tour.transportType || ''),
  },
  {
    id: 'budget_friendly',
    label: '预算友好',
    description: '价格更容易下手，适合临时起意的周度出游。',
    matches: (tour) => typeof tour.price === 'number' && tour.price <= 999,
  },
  {
    id: 'relaxing_resort',
    label: '轻松度假',
    description: '更偏酒店休闲、温泉或放松路线，但是否适合本周需要 AI 用常识再判断。',
    matches: (_tour, meta) => meta.hasHotSpringSignals || meta.hasResortSignals,
  },
];

function stripWrappingQuotes(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
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

function normalizeClusterText(value) {
  return String(value || '')
    .normalize('NFKC')
    .replace(/（[^）]*）|\([^)]*\)|【[^】]*】|<[^>]*>/g, ' ')
    .replace(/\d+\s*天.*$/g, ' ')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .toLowerCase();
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

function buildSignalBlob(parts) {
  return parts
    .flat()
    .filter(Boolean)
    .map((value) => String(value).toLowerCase())
    .join(' ');
}

function containsAny(text, keywords) {
  return keywords.some((keyword) => text.includes(keyword));
}

function countKeywordHits(text, keywords) {
  return keywords.reduce((count, keyword) => (text.includes(keyword) ? count + 1 : count), 0);
}

function getTravelWindowDates(tour, runDate, endDate) {
  const departureDates = Array.isArray(tour.departureDates) ? tour.departureDates : [];
  const candidates = departureDates.length > 0 ? departureDates : [tour.departureDate].filter(Boolean);
  return candidates
    .filter((date) => typeof date === 'string' && date >= runDate && date <= endDate)
    .sort();
}

function buildTourMeta(tour, destination) {
  const itineraryText = (tour.itinerary || [])
    .flatMap((day) => [day?.title, ...(day?.activities || [])])
    .filter(Boolean);
  const primaryBlob = buildSignalBlob([tour.title, ...(tour.highlights || []), ...itineraryText]);
  const supportingBlob = buildSignalBlob([tour.destination, tour.theme, ...(tour.tags || []), ...(tour.suitableFor || [])]);
  const blob = buildSignalBlob([primaryBlob, supportingBlob]);
  const naturalCoolingHits =
    countKeywordHits(primaryBlob, NATURAL_COOLING_KEYWORDS) +
    Math.max(0, countKeywordHits(supportingBlob, NATURAL_COOLING_KEYWORDS) - 1);
  const waterPlayHits =
    countKeywordHits(primaryBlob, WATER_PLAY_KEYWORDS) +
    countKeywordHits(supportingBlob, WATER_PLAY_KEYWORDS);
  const hotSpringHits = countKeywordHits(blob, HOT_SPRING_KEYWORDS);
  const resortHits = countKeywordHits(blob, RESORT_KEYWORDS);
  const hasNaturalCoolingSignals = naturalCoolingHits > 0;
  const hasWaterPlaySignals = waterPlayHits > 0;
  const hasCoolingSignals = hasNaturalCoolingSignals || hasWaterPlaySignals;
  const hasHotSpringSignals = containsAny(blob, HOT_SPRING_KEYWORDS);
  const hasResortSignals = containsAny(blob, RESORT_KEYWORDS);
  return {
    text: blob,
    destination,
    isNearby: DOMESTIC_NEARBY_DESTINATIONS.has(destination),
    isFamilyFriendly: containsAny(blob, FAMILY_KEYWORDS),
    naturalCoolingHits,
    waterPlayHits,
    hotSpringHits,
    resortHits,
    hasNaturalCoolingSignals,
    hasWaterPlaySignals,
    hasCoolingSignals,
    hasHotSpringSignals,
    hasResortSignals,
    hasHotSpringOnlySignals: hasHotSpringSignals && !hasNaturalCoolingSignals && !hasWaterPlaySignals,
    hasResortOnlySignals: hasResortSignals && !hasNaturalCoolingSignals && !hasWaterPlaySignals,
    isRailFriendly: containsAny(`${tour.transportType || ''} ${blob}`, RAIL_KEYWORDS),
    hasFlowerSignals: containsAny(blob, FLOWER_KEYWORDS),
    hasRedLeafSignals: containsAny(blob, RED_LEAF_KEYWORDS),
  };
}

function getSeasonalPriorityAdjustment(meta, season) {
  if (season === '夏季') {
    if (meta.hasNaturalCoolingSignals) return 10;
    if (meta.hasWaterPlaySignals) return 6;
    if (meta.hasHotSpringOnlySignals) return -8;
    if (meta.hasResortOnlySignals) return -3;
  }

  if (season === '冬季' && meta.hasHotSpringSignals) {
    return 6;
  }

  return 0;
}

function isGenericDestination(destination) {
  return destination === '其他' || destination === '未标注目的地';
}

export function scoreWeeklyArticleTour(tour, runDate, windowDates) {
  const destination = normalizeDestination(tour.destination);
  const meta = buildTourMeta(tour, destination);
  const firstDate = windowDates[0];
  const daysUntilDeparture = firstDate ? diffDays(runDate, firstDate) : 999;
  const availabilityConfidence =
    tour.dataQuality?.availabilityConfidence ||
    tour.meta?.dataQuality?.availabilityConfidence ||
    'unknown';
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

  if (meta.isNearby) score += 16;
  if (isGenericDestination(destination)) score -= 14;
  score += getSeasonalPriorityAdjustment(meta, monthToSeason(Number(runDate.split('-')[1])));
  if (meta.hasNaturalCoolingSignals) score += Math.min(10, meta.naturalCoolingHits * 2);
  if (meta.hasWaterPlaySignals) score += Math.min(6, meta.waterPlayHits * 2);
  if (meta.hasHotSpringOnlySignals) score -= 8;
  if (meta.isFamilyFriendly) score += 4;
  if (tour.isFlashSale) score += 4;
  if (tour.isHot) score += 3;

  return {
    score,
    daysUntilDeparture,
    availabilityConfidence,
    destination,
    firstDate,
    meta,
  };
}

function summarizePriceRange(tours) {
  const prices = tours
    .map((tour) => tour.price)
    .filter((value) => typeof value === 'number')
    .sort((a, b) => a - b);
  if (prices.length === 0) return '价格以供应商页面为准';
  return `${prices[0]}-${prices[prices.length - 1]}${tours[0]?.priceUnit || '元/人'}`;
}

function deriveThemeHints(candidateGroups, season) {
  const hints = [];

  if (season === '夏季') {
    hints.push('山水清凉');
    hints.push('亲水近海');
    hints.push('周末近场');
    hints.push('轻松住一晚');
  } else {
    hints.push('短途休闲');
    hints.push('中短线出游');
  }

  if (candidateGroups.some((group) => group.id === 'family_short_break')) {
    hints.push('亲子友好');
  }
  if (candidateGroups.some((group) => group.id === 'mountain_water_cooling')) {
    hints.push('山水清凉');
  }
  if (candidateGroups.some((group) => group.id === 'relaxing_resort')) {
    hints.push('度假放松');
  }

  return [...new Set(hints)].slice(0, 5);
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

function summarizeSeasonFit(meta, season) {
  if (season === '夏季') {
    if (meta.hasNaturalCoolingSignals) return '更符合夏季常识，优先往真山水、漂流、峡谷、亲水体验上写';
    if (meta.hasWaterPlaySignals && meta.hasHotSpringSignals) return '既有玩水感也有放松属性，适合写成周末休整线，不用只盯着温泉';
    if (meta.hasWaterPlaySignals) return '更适合写成轻松降温线，把泳池、玩水和节奏感写具体';
    if (meta.hasHotSpringSignals) return '更适合写成周末放松、带池休闲或酒店度假，不必硬往避暑主线靠';
    return '没有明显季节红利，适合当作补充选择而不是主推';
  }

  if (season === '冬季' && meta.hasHotSpringSignals) {
    return '更符合冬季放松语境，可以把温泉和休闲感写得更自然';
  }

  return '需要结合班期、受众和本周出游节奏来判断是否值得写';
}

function formatTourForPrompt(tour) {
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
    detailUrl: buildTourDetailUrl(tour),
    images: tour.images || [],
    articleImages: (tour.images || []).slice(0, 3).map((assetPath) => resolveArticleAssetUrl(assetPath)),
    dataQuality: {
      availabilityConfidence: tour.availabilityConfidence,
      riskFlags: tour.dataQuality?.riskFlags || tour.meta?.dataQuality?.riskFlags || [],
    },
    editorialScore: tour.editorialScore,
    editorialReasons: tour.editorialReasons,
    editorialMeta: tour.editorialMeta,
  };
}

export function buildTourDetailUrl(tour, websiteUrl = DEFAULT_WEBSITE_URL) {
  if (!tour?.id) return websiteUrl;
  const resolved = new URL(websiteUrl);
  resolved.searchParams.set('tour', String(tour.id));
  resolved.searchParams.set('source', 'wechat');
  return resolved.toString();
}

function deriveRouteClusterKey(tour) {
  const normalizedTitle = normalizeClusterText(tour.title);
  if (normalizedTitle) return normalizedTitle.split(/\s+/).slice(0, 3).join('-');
  return normalizeClusterText(tour.destination) || 'misc';
}

function deriveThemeClusterKey(tour) {
  const meta = tour.editorialMeta || {};
  if (meta.hasNaturalCoolingSignals) return 'natural-cooling';
  if (meta.hasWaterPlaySignals) return meta.hasHotSpringSignals ? 'water-relax' : 'water-play';
  if (meta.hasHotSpringSignals || meta.hasResortSignals) return 'resort';
  if (meta.isRailFriendly) return 'rail';
  const theme = normalizeClusterText(tour.theme);
  return theme || 'general';
}

function rankTourForGroup(groupId, tour) {
  const meta = tour.editorialMeta || {};
  const base = tour.editorialScore || 0;

  if (groupId === 'mountain_water_cooling') {
    return (
      base +
      meta.naturalCoolingHits * 20 +
      meta.waterPlayHits * 12 -
      meta.hotSpringHits * 8 -
      meta.resortHits * 5 -
      (meta.hasHotSpringOnlySignals ? 60 : 0)
    );
  }

  if (groupId === 'relaxing_resort') {
    return (
      base +
      meta.hotSpringHits * 18 +
      meta.resortHits * 10 +
      meta.waterPlayHits * 6 -
      meta.naturalCoolingHits * 4
    );
  }

  if (groupId === 'weekend_nearby' || groupId === 'family_short_break') {
    return (
      base +
      meta.waterPlayHits * 8 +
      meta.naturalCoolingHits * 6 -
      (meta.hasHotSpringOnlySignals ? 6 : 0)
    );
  }

  return base;
}

function pickDiversifiedCandidateTours(sortedTours, maxCount) {
  const selected = [];
  const routeCounts = new Map();
  const destinationCounts = new Map();
  const themeCounts = new Map();

  const tryPick = (tour, relaxed = false) => {
    const routeKey = deriveRouteClusterKey(tour);
    const destinationKey = normalizeDestination(tour.destination);
    const themeKey = deriveThemeClusterKey(tour);
    const routeCap = relaxed ? 2 : 1;
    const destinationCap = relaxed ? 5 : 3;
    const themeCap = relaxed ? 8 : 5;

    if ((routeCounts.get(routeKey) || 0) >= routeCap) return false;
    if ((destinationCounts.get(destinationKey) || 0) >= destinationCap) return false;
    if ((themeCounts.get(themeKey) || 0) >= themeCap) return false;

    selected.push(tour);
    routeCounts.set(routeKey, (routeCounts.get(routeKey) || 0) + 1);
    destinationCounts.set(destinationKey, (destinationCounts.get(destinationKey) || 0) + 1);
    themeCounts.set(themeKey, (themeCounts.get(themeKey) || 0) + 1);
    return true;
  };

  for (const tour of sortedTours) {
    if (selected.length >= maxCount) break;
    tryPick(tour, false);
  }

  for (const tour of sortedTours) {
    if (selected.length >= maxCount) break;
    if (selected.some((item) => item.id === tour.id)) continue;
    tryPick(tour, true);
  }

  return selected;
}

function buildCandidateGroups(candidateTours, maxPerGroup = DEFAULT_MAX_GROUP_ITEMS) {
  return PREFERENCE_GROUPS
    .map((group) => {
      const tours = candidateTours
        .filter((tour) => group.matches(tour, tour.editorialMeta))
        .sort((left, right) => rankTourForGroup(group.id, right) - rankTourForGroup(group.id, left))
        .slice(0, maxPerGroup);
      if (tours.length === 0) return null;
      return {
        id: group.id,
        label: group.label,
        description: group.description,
        tours,
      };
    })
    .filter(Boolean);
}

function buildRecommendationGroups(candidateGroups, maxTotal = DEFAULT_GROUP_RECOMMENDATION_TOTAL) {
  const groups = candidateGroups.map((group) => ({
    id: group.id,
    label: group.label,
    description: group.description,
    tours: [],
  }));
  const offsets = new Map(groups.map((group) => [group.id, 0]));
  const selectedIds = new Set();
  const selectedRouteFamilies = new Map();
  const selectedDestinations = new Map();
  let total = 0;

  while (total < maxTotal) {
    let pickedThisRound = false;
    for (const group of groups) {
      const sourceGroup = candidateGroups.find((item) => item.id === group.id);
      if (!sourceGroup) continue;
      let offset = offsets.get(group.id) || 0;
      while (offset < sourceGroup.tours.length && selectedIds.has(sourceGroup.tours[offset].id)) {
        offset += 1;
      }
      offsets.set(group.id, offset);
      const tour = sourceGroup.tours[offset];
      if (!tour) continue;
      const routeKey = deriveRouteClusterKey(tour);
      const destinationKey = normalizeDestination(tour.destination);
      if ((selectedRouteFamilies.get(routeKey) || 0) >= MAX_ROUTE_FAMILY_PER_ARTICLE) {
        offsets.set(group.id, offset + 1);
        continue;
      }
      if ((selectedDestinations.get(destinationKey) || 0) >= MAX_DESTINATION_CLUSTER_PER_ARTICLE) {
        offsets.set(group.id, offset + 1);
        continue;
      }
      group.tours.push(tour);
      selectedIds.add(tour.id);
      selectedRouteFamilies.set(routeKey, (selectedRouteFamilies.get(routeKey) || 0) + 1);
      selectedDestinations.set(destinationKey, (selectedDestinations.get(destinationKey) || 0) + 1);
      offsets.set(group.id, offset + 1);
      total += 1;
      pickedThisRound = true;
      if (total >= maxTotal) break;
    }
    if (!pickedThisRound) break;
  }

  return groups.filter((group) => group.tours.length > 0);
}

function buildAiSelectionBuckets(candidateTours, bucketSize = DEFAULT_AI_BUCKET_SIZE) {
  const buckets = PREFERENCE_GROUPS
    .map((group) => {
      const tours = candidateTours
        .filter((tour) => group.matches(tour, tour.editorialMeta))
        .sort((left, right) => rankTourForGroup(group.id, right) - rankTourForGroup(group.id, left))
        .slice(0, bucketSize);
      if (tours.length === 0) return null;
      return {
        id: group.id,
        label: group.label,
        description: group.description,
        tours,
      };
    })
    .filter(Boolean);

  const selectedIds = new Set(buckets.flatMap((bucket) => bucket.tours.map((tour) => tour.id)));
  const overflow = candidateTours.filter((tour) => !selectedIds.has(tour.id)).slice(0, bucketSize * 2);
  if (overflow.length > 0) {
    buckets.push({
      id: 'editorial_wildcard',
      label: '编辑补位',
      description: '前面几组之外，但也可能因为天气、节点或文案可写性值得入选。',
      tours: overflow,
    });
  }

  return buckets;
}

function getSupplementalRecommendationGroups(candidateTours, selectedIds) {
  const buckets = new Map([
    [
      'nearby_more',
      {
        id: 'nearby_more',
        label: '周边加看',
        description: '前面几组之外，仍适合近期出发的广东周边与短途补充线。',
        tours: [],
      },
    ],
    [
      'midrange_more',
      {
        id: 'midrange_more',
        label: '中短线加看',
        description: '适合多请 1 到 2 天假期，节奏比周末线更松一点。',
        tours: [],
      },
    ],
    [
      'farther_more',
      {
        id: 'farther_more',
        label: '远线加看',
        description: '想趁近期认真出门一趟，可以从这些更远的线路里挑。',
        tours: [],
      },
    ],
    [
      'premium_more',
      {
        id: 'premium_more',
        label: '品质长线',
        description: '预算更宽松或假期更完整时，可留意这些品质感更强的线。',
        tours: [],
      },
    ],
  ]);

  for (const tour of candidateTours) {
    if (selectedIds.has(tour.id)) continue;
    const meta = tour.editorialMeta || {};
    const duration = Number(tour.duration) || 0;
    const price = Number(tour.price) || 0;
    let bucketId = 'midrange_more';

    if (price >= 5000 || duration >= 7) {
      bucketId = 'premium_more';
    } else if (!meta.isNearby && (duration >= 5 || !meta.isRailFriendly)) {
      bucketId = 'farther_more';
    } else if (meta.isNearby && duration <= 3) {
      bucketId = 'nearby_more';
    }

    buckets.get(bucketId)?.tours.push(tour);
  }

  return Array.from(buckets.values()).filter((group) => group.tours.length > 0);
}

function fillRecommendationGroups(groups, maxTotal) {
  const filledGroups = groups.map((group) => ({ ...group, tours: [] }));
  const sourceMap = new Map(groups.map((group) => [group.id, group]));
  const offsets = new Map(groups.map((group) => [group.id, 0]));
  const selectedIds = new Set();
  const selectedRouteFamilies = new Map();
  const selectedDestinations = new Map();
  let total = 0;

  while (total < maxTotal) {
    let pickedThisRound = false;

    for (const group of filledGroups) {
      const sourceGroup = sourceMap.get(group.id);
      if (!sourceGroup) continue;
      let offset = offsets.get(group.id) || 0;
      while (offset < sourceGroup.tours.length && selectedIds.has(sourceGroup.tours[offset].id)) {
        offset += 1;
      }
      offsets.set(group.id, offset);
      const tour = sourceGroup.tours[offset];
      if (!tour) continue;
      const routeKey = deriveRouteClusterKey(tour);
      const destinationKey = normalizeDestination(tour.destination);
      if ((selectedRouteFamilies.get(routeKey) || 0) >= MAX_ROUTE_FAMILY_PER_ARTICLE) {
        offsets.set(group.id, offset + 1);
        continue;
      }
      if ((selectedDestinations.get(destinationKey) || 0) >= MAX_DESTINATION_CLUSTER_PER_ARTICLE) {
        offsets.set(group.id, offset + 1);
        continue;
      }
      group.tours.push(tour);
      selectedIds.add(tour.id);
      selectedRouteFamilies.set(routeKey, (selectedRouteFamilies.get(routeKey) || 0) + 1);
      selectedDestinations.set(destinationKey, (selectedDestinations.get(destinationKey) || 0) + 1);
      offsets.set(group.id, offset + 1);
      total += 1;
      pickedThisRound = true;
      if (total >= maxTotal) break;
    }

    if (!pickedThisRound) break;
  }

  return filledGroups.filter((group) => group.tours.length > 0);
}

function pickSelectedTours(candidateGroups, candidateTours, maxArticleItems) {
  const selected = [];
  const selectedIds = new Set();
  const routeCounts = new Map();
  const destinationCounts = new Map();
  const groupOffsets = new Map(candidateGroups.map((group) => [group.id, 0]));

  while (selected.length < maxArticleItems) {
    let pickedThisRound = false;
    for (const group of candidateGroups) {
      let offset = groupOffsets.get(group.id) || 0;
      while (offset < group.tours.length && selectedIds.has(group.tours[offset].id)) {
        offset += 1;
      }
      groupOffsets.set(group.id, offset);
      const tour = group.tours[offset];
      if (!tour) continue;
      const routeKey = deriveRouteClusterKey(tour);
      const destinationKey = normalizeDestination(tour.destination);
      if ((routeCounts.get(routeKey) || 0) >= MAX_ROUTE_FAMILY_PER_ARTICLE) {
        groupOffsets.set(group.id, offset + 1);
        continue;
      }
      if ((destinationCounts.get(destinationKey) || 0) >= 1) {
        groupOffsets.set(group.id, offset + 1);
        continue;
      }
      selected.push(tour);
      selectedIds.add(tour.id);
      routeCounts.set(routeKey, (routeCounts.get(routeKey) || 0) + 1);
      destinationCounts.set(destinationKey, (destinationCounts.get(destinationKey) || 0) + 1);
      groupOffsets.set(group.id, offset + 1);
      pickedThisRound = true;
      if (selected.length >= maxArticleItems) break;
    }
    if (!pickedThisRound) break;
  }

  for (const tour of candidateTours) {
    if (selected.length >= maxArticleItems) break;
    if (selectedIds.has(tour.id)) continue;
    const routeKey = deriveRouteClusterKey(tour);
    const destinationKey = normalizeDestination(tour.destination);
    if ((routeCounts.get(routeKey) || 0) >= MAX_ROUTE_FAMILY_PER_ARTICLE) continue;
    if ((destinationCounts.get(destinationKey) || 0) >= MAX_DESTINATION_CLUSTER_PER_ARTICLE) continue;
    selected.push(tour);
    selectedIds.add(tour.id);
    routeCounts.set(routeKey, (routeCounts.get(routeKey) || 0) + 1);
    destinationCounts.set(destinationKey, (destinationCounts.get(destinationKey) || 0) + 1);
  }

  return selected;
}

function describeWeatherCode(code) {
  return WEATHER_CODE_LABELS[code] || '天气多变';
}

function summarizeWeatherWindow(days) {
  if (!Array.isArray(days) || days.length === 0) {
    return '未来7天天气接口暂不可用，正文只做保守的季节提示。';
  }
  const maxTemps = days.map((day) => day.temperatureMax).filter((value) => typeof value === 'number');
  const minTemps = days.map((day) => day.temperatureMin).filter((value) => typeof value === 'number');
  const rainyDays = days.filter((day) => (day.precipitationProbabilityMax || 0) >= 50).length;
  const maxTemp = maxTemps.length > 0 ? Math.max(...maxTemps) : null;
  const minTemp = minTemps.length > 0 ? Math.min(...minTemps) : null;
  const firstLabel = describeWeatherCode(days[0]?.weatherCode);
  const rainHint =
    rainyDays >= 4 ? '本周带雨天偏多，短途和酒店型线路更从容。'
      : rainyDays >= 2 ? '有几天可能阵雨，玩水和山线建议带上轻便雨具。'
        : '整体雨水压力不算重，周末更适合安排户外线。';
  return `未来7天广州大致在${minTemp ?? '--'}-${maxTemp ?? '--'}°C之间，起步以${firstLabel}开场。${rainHint}`;
}

function buildCalendarSignals(runDate) {
  const nextWeekendStart = getWeekWindow(runDate).start;
  const secondWeekendStart = addDays(nextWeekendStart, 7);
  const [year, month, day] = runDate.split('-').map(Number);
  const signals = [
    `最近两个周末窗口分别是 ${nextWeekendStart} 起和 ${secondWeekendStart} 起。`,
  ];

  if (month === 6 && day >= 15) {
    signals.push('已经进入暑期预热阶段，亲子短途和近场酒店线通常会比平时更快被订走。');
  }
  if (month === 7 || month === 8) {
    signals.push('正值暑期，清凉线和亲子线更容易起量，热门班期适合提前锁。');
  }
  if (month === 9 || month === 10) {
    signals.push('进入中秋国庆筹备期，适合提前看中短线和高铁线的节奏。');
  }
  if (month === 11) {
    signals.push('红叶和温泉语境会逐渐更自然，但仍建议以具体线路页面为准。');
  }

  return signals;
}

function buildSeasonalOutlook(candidateTours, runDate, season) {
  const signals = [];
  const metas = candidateTours.map((tour) => tour.editorialMeta || {});

  if (season === '夏季') {
    signals.push('这周闷热和阵雨会反复出现，真山水、树荫、溪水、海风这类场景更容易把体感降下来。');
  } else if (season === '秋季') {
    signals.push('秋天更适合安排高铁中短线、城市漫游和轻山线，节奏不用赶。');
  } else if (season === '冬季') {
    signals.push('冬季更适合把温泉、住一晚放松和节庆节点结合起来看。');
  } else {
    signals.push('春季更适合把花景、近郊轻徒步和周末短途放在前面。');
  }

  if (metas.some((meta) => meta.hasCoolingSignals)) {
    signals.push('像瀑布、峡谷、森林步道、漂流、海岛和近海这样的线路，这周会比纯城市逛吃更有出发欲。');
  }
  if (metas.some((meta) => meta.hasHotSpringSignals || meta.hasResortSignals)) {
    signals.push('如果想把行程放轻一点，带泳池、水世界或住下来慢慢玩的酒店线，也能接住周末放松和亲子需求。');
  }
  if (metas.some((meta) => meta.hasFlowerSignals)) {
    signals.push('荷花、绣球这类夏季花景可以顺手提一句，但别把花况写得太满。');
  }
  if (metas.some((meta) => meta.hasRedLeafSignals)) {
    signals.push('带红叶或银杏关键词的线路先当季节伏笔看，具体还是以线路页同步信息为准。');
  }

  return [...signals, ...buildCalendarSignals(runDate)].slice(0, 6);
}

function buildFallbackWeatherOutlook(runDate) {
  return {
    location: '广州',
    headline: '未来7天天气接口暂不可用，正文只保留保守的季节和出游节奏提示。',
    days: Array.from({ length: 7 }, (_, index) => ({
      date: addDays(runDate, index),
      summary: '待天气接口恢复',
    })),
    source: 'fallback',
  };
}

export async function fetchWeatherOutlook(options = {}) {
  const fetchImpl = options.fetchImpl || fetch;
  const latitude = options.latitude || GUANGZHOU_COORDS.latitude;
  const longitude = options.longitude || GUANGZHOU_COORDS.longitude;
  const forecastDays = options.forecastDays || 7;
  const location = options.location || '广州';
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', String(latitude));
  url.searchParams.set('longitude', String(longitude));
  url.searchParams.set('timezone', 'Asia/Shanghai');
  url.searchParams.set('forecast_days', String(forecastDays));
  url.searchParams.set(
    'daily',
    ['weather_code', 'temperature_2m_max', 'temperature_2m_min', 'precipitation_probability_max'].join(','),
  );

  const response = await fetchImpl(url, { method: 'GET' });
  if (!response.ok) {
    throw new Error(`Weather API failed: ${response.status}`);
  }

  const payload = await response.json();
  const daily = payload?.daily;
  if (!daily?.time || !Array.isArray(daily.time)) {
    throw new Error('Weather API missing daily forecast data.');
  }

  const days = daily.time.map((date, index) => {
    const temperatureMax = daily.temperature_2m_max?.[index];
    const temperatureMin = daily.temperature_2m_min?.[index];
    const precipitationProbabilityMax = daily.precipitation_probability_max?.[index];
    const weatherCode = daily.weather_code?.[index];
    const summary = `${describeWeatherCode(weatherCode)}，${temperatureMin}-${temperatureMax}°C，降雨概率约${precipitationProbabilityMax ?? '--'}%`;
    return {
      date,
      temperatureMax,
      temperatureMin,
      precipitationProbabilityMax,
      weatherCode,
      summary,
    };
  });

  return {
    location,
    source: 'open-meteo',
    headline: summarizeWeatherWindow(days),
    days,
  };
}

export function buildWeeklyArticleContext(tours, options = {}) {
  const runDate = options.runDate || toDateKey();
  const windowDays = options.windowDays || DEFAULT_WINDOW_DAYS;
  const maxCandidates = options.maxCandidates || DEFAULT_MAX_CANDIDATES;
  const maxArticleItems = options.maxArticleItems || DEFAULT_MAX_ARTICLE_ITEMS;
  const maxGroupRecommendationTotal =
    options.maxGroupRecommendationTotal || DEFAULT_GROUP_RECOMMENDATION_TOTAL;
  const endDate = addDays(runDate, windowDays);
  const [, month] = runDate.split('-').map(Number);
  const season = monthToSeason(month);
  const weekWindow = getWeekWindow(runDate);

  const filtered = tours
    .map((tour) => {
      const selectedDepartureDates = getTravelWindowDates(tour, runDate, endDate);
      if (selectedDepartureDates.length === 0) return null;
      if (!Array.isArray(tour.images) || tour.images.length === 0) return null;
      if (typeof tour.bookingUrl !== 'string' || !tour.bookingUrl.trim()) return null;

      const score = scoreWeeklyArticleTour(tour, runDate, selectedDepartureDates);
      return {
        ...tour,
        selectedDepartureDates,
        editorialScore: score.score,
        availabilityConfidence: score.availabilityConfidence,
        editorialMeta: score.meta,
        editorialReasons: [
          `${score.daysUntilDeparture}天内可出发`,
          score.availabilityConfidence === 'high' ? '班期可信度高' : '班期需要二次确认',
          score.meta.isNearby ? '更适合周度推荐' : '更适合作为中短线备选',
          summarizeSeasonFit(score.meta, season),
        ],
      };
    })
    .filter(Boolean)
    .sort((left, right) => right.editorialScore - left.editorialScore);

  const candidateTours = pickDiversifiedCandidateTours(filtered, maxCandidates);
  const candidateGroups = buildCandidateGroups(candidateTours);
  const aiSelectionBuckets = buildAiSelectionBuckets(
    candidateTours,
    options.aiBucketSize || DEFAULT_AI_BUCKET_SIZE,
  );
  const seededRecommendationGroups = buildRecommendationGroups(candidateGroups, maxGroupRecommendationTotal);
  const seededRecommendationIds = new Set(
    seededRecommendationGroups.flatMap((group) => group.tours.map((tour) => tour.id)),
  );
  const supplementalGroups = getSupplementalRecommendationGroups(candidateTours, seededRecommendationIds);
  const recommendationGroups = fillRecommendationGroups(
    [...candidateGroups, ...supplementalGroups],
    maxGroupRecommendationTotal,
  );
  const selectedTours = pickSelectedTours(candidateGroups, candidateTours, maxArticleItems);
  const themeHints = deriveThemeHints(candidateGroups, season);
  const weatherOutlook = options.weatherOutlook || buildFallbackWeatherOutlook(runDate);
  const seasonalOutlook = options.seasonalOutlook || buildSeasonalOutlook(candidateTours, runDate, season);

  return {
    runDate,
    season,
    weekWindow,
    generationMode: options.generationMode || 'single-pass-deepseek',
    weatherOutlook,
    seasonalOutlook,
    articleGoal: '每周旅行团公众号推荐文章',
    editorialContext: {
      audience: '广州及周边出发、想近期报名旅行团的公众号读者',
      tone: '实用、轻松、像熟悉线路的旅行顾问',
      themeHints,
      departureWindowDays: windowDays,
      priceRangeHint: summarizePriceRange(selectedTours),
      groupingGoal: '先按偏好分组，再用常识判断这周真正值得写哪几条',
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
        '不要写绝对化广告语',
      ],
    },
    candidateTours: candidateTours.map(formatTourForPrompt),
    candidateGroups: candidateGroups.map((group) => ({
      id: group.id,
      label: group.label,
      description: group.description,
      tours: group.tours.map(formatTourForPrompt),
    })),
    aiSelectionBuckets: aiSelectionBuckets.map((group) => ({
      id: group.id,
      label: group.label,
      description: group.description,
      tours: group.tours.map(formatTourForPrompt),
    })),
    recommendationGroups: recommendationGroups.map((group) => ({
      id: group.id,
      label: group.label,
      description: group.description,
      tours: group.tours.map(formatTourForPrompt),
    })),
    selectedTours: selectedTours.map(formatTourForPrompt),
  };
}

export function buildWeeklyArticlePrompt(context) {
  const groupedCandidateBlock = (context.recommendationGroups || context.candidateGroups)
    .map((group) => {
      const lines = [
        `### ${group.label}`,
        `分组意图：${group.description}`,
      ];
      for (const tour of group.tours) {
        lines.push(
          [
            `- ${tour.title}`,
            `  目的地：${tour.destination}`,
            `  时长：${tour.duration}天`,
            `  价格：${tour.price}${tour.priceUnit || '元/人'}`,
            `  近期班期：${(tour.departureDates || []).join('、') || '未标注'}`,
            `  适合人群：${(tour.suitableFor || []).join('、') || '未标注'}`,
            `  亮点：${(tour.highlights || []).slice(0, 4).join('、') || '未标注'}`,
            `  标签：${(tour.tags || []).slice(0, 4).join('、') || '未标注'}`,
            `  季节判断提示：${(tour.editorialReasons || []).slice(-1)[0] || '请自行判断'}`,
            `  正文配图：${(tour.articleImages || []).join('、') || '未标注'}`,
            `  站内详情链接：${tour.detailUrl}`,
            `  供应商链接（仅供核对，不要写入正文）：${tour.bookingUrl}`,
          ].join('\n'),
        );
      }
      return lines.join('\n');
    })
    .join('\n\n');

  const aiSelectionBlock = (context.aiSelectionBuckets || [])
    .map((group) => {
      const lines = [
        `### ${group.label}`,
        `给编辑的提示：${group.description}`,
      ];
      for (const tour of group.tours) {
        lines.push(
          [
            `- ${tour.title}`,
            `  目的地：${tour.destination}`,
            `  时长：${tour.duration}天`,
            `  价格：${tour.price}${tour.priceUnit || '元/人'}`,
            `  班期：${(tour.departureDates || []).join('、') || '未标注'}`,
            `  亮点：${(tour.highlights || []).slice(0, 5).join('、') || '未标注'}`,
            `  标签：${(tour.tags || []).slice(0, 5).join('、') || '未标注'}`,
            `  编辑提示：${(tour.editorialReasons || []).join('；') || '未标注'}`,
            `  配图：${(tour.articleImages || []).join('、') || '未标注'}`,
            `  站内详情链接：${tour.detailUrl}`,
            `  供应商链接（仅供核对，不要写入正文）：${tour.bookingUrl}`,
          ].join('\n'),
        );
      }
      return lines.join('\n');
    })
    .join('\n\n');

  const selectedTourTitles = context.selectedTours.map((tour) => tour.title).join('、');
  const selectedTourDetailBlock = context.selectedTours
    .map((tour) =>
      [
        `- ${tour.title}`,
        `  目的地：${tour.destination}`,
        `  班期：${(tour.departureDates || []).join('、') || '未标注'}`,
        `  价格：${tour.price}${tour.priceUnit || '元/人'}`,
        `  亮点：${(tour.highlights || []).slice(0, 4).join('、') || '未标注'}`,
        `  站内详情链接：${tour.detailUrl}`,
        `  供应商链接（仅供核对，不要写入正文）：${tour.bookingUrl}`,
      ].join('\n'),
    )
    .join('\n\n');
  const weatherBlock = [
    `天气总述：${context.weatherOutlook?.headline || '暂无天气数据'}`,
    ...((context.weatherOutlook?.days || []).map((day) => `- ${day.date}：${day.summary}`)),
  ].join('\n');
  const seasonalBlock = (context.seasonalOutlook || []).map((item) => `- ${item}`).join('\n');
  const groupedTotal = (context.recommendationGroups || []).reduce(
    (sum, group) => sum + group.tours.length,
    0,
  );

  return [
    '你是一名擅长写微信公众号的旅行编辑。',
    '请只根据提供的 JSON 素材与线路事实写作，不要编造任何产品信息。',
    '',
    '写作要求：',
    `- 文章日期语境：${context.runDate}，当前季节是${context.season}`,
    `- 周窗口：${context.weekWindow.start} 到 ${context.weekWindow.end}`,
    `- 读者：${context.editorialContext.audience}`,
    `- 基调：${context.editorialContext.tone}`,
    `- 选题方向：${context.editorialContext.themeHints.join('、') || '周度出游推荐'}`,
    `- 分组目标：${context.editorialContext.groupingGoal}`,
    `- 当前生成模式：${context.generationMode || 'single-pass-deepseek'}`,
    '- 输出 Markdown，且必须带 frontmatter：title, summary, author, cover',
    `- author 固定写 "${DEFAULT_AUTHOR}"`,
    `- cover 使用第一条已入选线路的首图：${context.selectedTours[0]?.images?.[0] || ''}`,
    `- 阅读原文链接固定指向：${DEFAULT_WEBSITE_URL}`,
    '- 先写“本周天气与出游节奏”，必须用给定的未来7天天气和时令提示来开头。',
    `- 天气开头之后，直接进入“本周 ${groupedTotal} 条推荐”。可以按给定分组分段，但不要出现“速览”二字，也不要写成一句话清单。`,
    `- 这 ${groupedTotal} 条线路都要逐条展开，一条线路一个小标题，每条至少 50 个中文字符。`,
    '- 候选线路已经按偏好分组，你需要自己判断这周真正值得写哪些，不要机械照抄分组。',
    '- 不要完全依赖既有分数顺序，请在更丰富的 AI 候选池里重新判断这周最值得主推的线路。',
    '- 如果高分线路明显同质化，可以主动跳过，换成更有差异、更好写、更符合天气节奏的备选。',
    '- 夏季可以保留带池、酒店放松、雅泡这类线路，但写法应自然，直接写放松感、亲子感、周末度假感即可。',
    `- 默认主推备选是这些线路：${selectedTourTitles}，但如果 AI 候选池里有更合适、更不重复的线路，可以替换。`,
    '- 正文使用 Markdown 图片语法配图，导语至少 1 张图，每条线路至少 1 张图，优先使用提供的“正文配图”URL。',
    '- 标题适合公众号，但不要夸张标题党。',
    '- 推荐应该体现分组差异，比如亲子短途、周末近场、真山水清凉、带泳池/温泉的休整线、高铁轻出省、预算友好、轻松度假。',
    '- 山水清凉组优先写真山水、漂流、森林、峡谷、亲水、泳池等清凉体验，不要让纯温泉/酒店线挤占主位。',
    '- 文案要像编辑在邀人出门，不要像在解释你的筛选过程，更不要复述研究备注。',
    '- 每条线路都要写得像能直接发的编辑推荐，不要只剩标题清单。',
    '- 每条线路至少写 3 句有效文案：这周为什么值得去、适合谁、现场体验/节奏感、班期/价格/交通里的关键信息。',
    '- 每条线路都要写清楚：为什么这周值得去、适合谁、线路信息、提醒、查看行程链接。',
    '- 面向读者直接说人话，不要出现“当前数据里”“候选线路”“综合排序”“模型判断”“可以理解为”“别误会成”这类幕后分析句子。',
    '- 不要写“当前数据里能打的清凉感主要是……”“带池、酒店放松类线路可保留”“作为补充”“适合预算有限”“樱花已过季”这种像批注、打分或找补的话。',
    '- 不要把每条都写成“雷雨间隙去……”，天气只在确实影响体验时轻轻带一下，句式要拉开。',
    '- 如果一条线路只有低价、补位、过季或解释概念这类理由，就不要硬主推，换成同组里更鲜活、更有当下理由的备选。',
    '- 每条线路的链接统一写成 Markdown 链接 [查看行程](站内详情链接)，不要把供应商原始链接写进正文。',
    '- 每条线路的“查看行程”后面单独留出二维码位置，二维码会放在具体推荐正文下面。',
    '- 不要使用“最佳、第一、最低价、必去、百分百成团、错过再等一年”等绝对化表达。',
    '- 不要编造出发城市、库存、优惠、成团率、景区政策。',
    '- 价格、班期必须与素材一致；正文链接统一使用站内详情链接。',
    '- 结尾要提醒具体行程、班期和价格以站内详情页同步信息为准，并引导读者查看行程。',
    '',
    '天气素材：',
    weatherBlock,
    '',
    '时令与节奏提示：',
    seasonalBlock || '- 暂无',
    '',
    '分组候选线路：',
    groupedCandidateBlock,
    '',
    'AI 候选池（供你二次挑选，不必完全按已有入选顺序）：',
    aiSelectionBlock,
    '',
    '默认优先展开线路（仅供参考，可被 AI 候选池里的更优线路替换）：',
    selectedTourDetailBlock,
    '',
    '输出格式示例：',
    '---',
    'title: "..."',
    'summary: "..."',
    `author: "${DEFAULT_AUTHOR}"`,
    `cover: "${context.selectedTours[0]?.images?.[0] || ''}"`,
    '---',
    '',
    '# 标题',
    '',
    '![导语配图](https://example.com/hero.jpg)',
    '',
    '## 本周 25 条推荐',
    '',
    '### 分组名',
    '',
    '#### 线路A',
    '',
    '这里写 3 句以上、至少 50 个中文字符的推荐文案，说明为什么这周值得去、适合谁、现场的清凉感或放松感从哪里来，再自然带出班期、价格或交通提醒。',
    '',
    '[查看行程](站内详情链接)',
    '',
    '#### 线路B',
    '',
    '这里继续写完整推荐，不要偷懒写成一句话清单，也不要解释命名或暴露筛选过程。',
    '',
    '[查看行程](站内详情链接)',
    '',
    '## 出行提醒',
  ].join('\n');
}

function hasMarkdownImage(lines, startIndex, endIndex) {
  for (let index = startIndex; index < endIndex; index += 1) {
    if (/!\[[^\]]*]\(([^)]+)\)/.test(lines[index])) return true;
  }
  return false;
}

function normalizeTourTitleForMatch(value) {
  return String(value || '')
    .normalize('NFKC')
    .replace(/[`~!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?~！@#￥%……&*（）—+=【】；：‘’“”《》，。？、\s]/g, '')
    .replace(/[0-9]+\uFE0F?\u20E3/g, '')
    .replace(/[^\p{L}\p{N}]/gu, '')
    .toLowerCase();
}

const TOUR_TITLE_NOISE_PATTERNS = [
  /【[^】]*】/g,
  /＜[^＞]*＞|<[^>]*>/g,
  /（[^）]*）|\([^)]*\)/g,
  /\b\d+\s*[天日晚]\b/gu,
  /一家一团|等待确认|纯玩0购物|纯玩|品质|深度|休闲|直通车|高铁|动车|大巴|豪华酒店|超豪华酒店|网红民宿|成团/g,
  /跨国/g,
];

function extractTourTitleFragments(value) {
  let working = String(value || '').normalize('NFKC');
  for (const pattern of TOUR_TITLE_NOISE_PATTERNS) {
    working = working.replace(pattern, ' ');
  }

  const fragments = new Set();
  for (const part of working.split(/[＊*|/、，。,.\-—_:：；（）()\[\]【】<>《》\s+]+/u)) {
    const normalized = normalizeTourTitleForMatch(part);
    if (normalized.length >= 3) fragments.add(normalized);
  }
  return [...fragments];
}

function articleMentionsTourTitle(article, title) {
  const normalizedArticle = normalizeTourTitleForMatch(article);
  const normalizedTitle = normalizeTourTitleForMatch(title);
  if (!normalizedArticle || !normalizedTitle) return false;
  if (normalizedArticle.includes(normalizedTitle)) return true;

  const matchedFragments = extractTourTitleFragments(title).filter((fragment) => normalizedArticle.includes(fragment));
  if (matchedFragments.length >= 2) return true;
  return matchedFragments.some((fragment) => fragment.length >= 5);
}

function listFeaturedSectionIndices(lines) {
  const featuredIntroIndex = lines.findIndex((line) => /^##\s+/.test(line.trim()) && /重点线路|细看/.test(line));
  const startIndex = featuredIntroIndex >= 0 ? featuredIntroIndex + 1 : 0;
  const indices = [];
  for (let index = startIndex; index < lines.length; index += 1) {
    if (/^##\s+/.test(lines[index].trim()) && index > startIndex) break;
    if (/^###\s+/.test(lines[index].trim())) indices.push(index);
  }
  return indices;
}

function resolveTourSectionIndex(lines, tour, tourIndex, featuredSectionIndices, assignedSectionIndices) {
  const directIndex = lines.findIndex(
    (line, index) =>
      /^#{2,3}\s+/.test(line.trim()) &&
      !assignedSectionIndices.has(index) &&
      articleMentionsTourTitle(line, tour.title),
  );
  if (directIndex >= 0) return directIndex;

  const orderedFallback = featuredSectionIndices[tourIndex];
  if (orderedFallback != null && !assignedSectionIndices.has(orderedFallback)) return orderedFallback;
  return -1;
}

function buildSectionEntries(lines, tours) {
  const featuredSectionIndices = listFeaturedSectionIndices(lines);
  const assignedSectionIndices = new Set();
  const sectionEntries = tours
    .map((tour, tourIndex) => {
      const sectionIndex = resolveTourSectionIndex(
        lines,
        tour,
        tourIndex,
        featuredSectionIndices,
        assignedSectionIndices,
      );
      if (sectionIndex < 0) return null;
      assignedSectionIndices.add(sectionIndex);
      return { tour, sectionIndex };
    })
    .filter(Boolean)
    .sort((left, right) => left.sectionIndex - right.sectionIndex)
    .map((entry, index, items) => ({
      ...entry,
      sectionEnd: index + 1 < items.length ? items[index + 1].sectionIndex : lines.length,
    }));

  return sectionEntries.sort((left, right) => right.sectionIndex - left.sectionIndex);
}

function buildQrImageUrl(bookingUrl) {
  return `https://quickchart.io/qr?format=png&ecLevel=M&margin=2&size=320&text=${encodeURIComponent(bookingUrl)}`;
}

function listArticleTours(context) {
  const deduped = new Map();
  for (const group of context.recommendationGroups || []) {
    for (const tour of group.tours || []) {
      if (tour?.id && !deduped.has(tour.id)) deduped.set(tour.id, tour);
    }
  }
  for (const tour of context.selectedTours || []) {
    if (tour?.id && !deduped.has(tour.id)) deduped.set(tour.id, tour);
  }
  return [...deduped.values()];
}

export function enrichWeeklyArticleMedia(article, context, options = {}) {
  const websiteUrl = options.websiteUrl || DEFAULT_WEBSITE_URL;
  const lines = article.replace(/\r\n/g, '\n').split('\n');
  const h1Index = lines.findIndex((line) => /^#\s+/.test(line.trim()));
  const firstSectionIndex = lines.findIndex((line) => /^##\s+/.test(line.trim()));
  const articleTours = listArticleTours(context);
  const heroTour = context.selectedTours[0] || articleTours[0];
  const heroImageUrl = resolveArticleAssetUrl(heroTour?.images?.[0] || '', websiteUrl);

  if (heroImageUrl && h1Index >= 0) {
    const heroRegionEnd = firstSectionIndex >= 0 ? firstSectionIndex : lines.length;
    if (!hasMarkdownImage(lines, h1Index + 1, heroRegionEnd)) {
      lines.splice(h1Index + 1, 0, '', `![${heroTour?.title || '线路配图'}](${heroImageUrl})`, '');
    }
  }

  const sectionEntries = buildSectionEntries(lines, articleTours);

  sectionEntries.forEach(({ tour, sectionIndex, sectionEnd }) => {
    const imageUrl = resolveArticleAssetUrl(tour.images?.[0] || '', websiteUrl);
    const detailUrl = buildTourDetailUrl(tour, websiteUrl);
    const sectionLines = lines.slice(sectionIndex, sectionEnd);
    const insertAfterHeading = [];
    if (imageUrl && !hasMarkdownImage(lines, sectionIndex + 1, sectionEnd)) {
      insertAfterHeading.push('', `![${tour.title}](${imageUrl})`, '');
    }

    const hasBookingLink = detailUrl
      ? sectionLines.some((line) => line.includes(detailUrl) || line.includes('查看行程'))
      : true;
    const hasQrImage = sectionLines.some((line) => line.includes('quickchart.io/qr') || line.includes('报名二维码'));
    const insertBeforeNextSection = [];
    if (detailUrl && !hasBookingLink) {
      insertBeforeNextSection.push('', `[查看行程](${detailUrl})`);
    }
    if (detailUrl && !hasQrImage) {
      insertBeforeNextSection.push('', `![${tour.title} 报名二维码](${buildQrImageUrl(detailUrl)})`);
    }
    if (insertBeforeNextSection.length > 0) insertBeforeNextSection.push('');

    if (insertBeforeNextSection.length > 0) lines.splice(sectionEnd, 0, ...insertBeforeNextSection);
    if (insertAfterHeading.length > 0) lines.splice(sectionIndex + 1, 0, ...insertAfterHeading);
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

export async function generateWeeklyArticle(context, config, options = {}) {
  const prompt = buildWeeklyArticlePrompt(context);
  const response = await fetch(getChatCompletionsUrl(config.baseUrl), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      temperature: 0.7,
      max_tokens: options.maxTokens || 2600,
      messages: [
        {
          role: 'system',
          content:
            '你写作要像旅行编辑而不是销售，重视季节常识、读者体验和信息可信度，不夸张，不编造产品事实。',
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
  return {
    prompt,
    article: stripMarkdownFence(getAiContent(payload)),
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
  }

  for (const phrase of FORBIDDEN_PHRASES) {
    if (article.includes(phrase)) issues.push(`Contains forbidden phrase: ${phrase}`);
  }
  for (const { phrase, max } of REPETITIVE_PHRASE_LIMITS) {
    const count = article.split(phrase).length - 1;
    if (count > max) {
      issues.push(`Phrase "${phrase}" is overused (${count} times).`);
    }
  }

  const articleLines = article.replace(/\r\n/g, '\n').split('\n');
  const articleTours = listArticleTours(context);
  const sectionEntries = buildSectionEntries(articleLines, articleTours);
  for (const entry of sectionEntries) {
    const rawSection = articleLines.slice(entry.sectionIndex, entry.sectionEnd).join('\n');
    const visibleText = rawSection
      .replace(/^#+\s+/gm, '')
      .replace(/!\[[^\]]*]\([^)]+\)/g, '')
      .replace(/\[[^\]]+]\([^)]+\)/g, '')
      .replace(/[`>*_-]/g, '')
      .replace(/\s+/g, '');
    if (visibleText.length < 50) {
      issues.push(`Section for "${entry.tour.title}" is too short; expected at least 50 visible characters.`);
    }
    const sentenceCount = (rawSection.match(/[。！？!?]+/g) || []).length;
    if (sentenceCount < 3) {
      issues.push(`Section for "${entry.tour.title}" needs at least 3 sentences.`);
    }
  }

  const mentionedSelectedTours = context.selectedTours.filter((tour) =>
    articleMentionsTourTitle(article, tour.title),
  ).length;
  if (mentionedSelectedTours < Math.min(3, context.selectedTours.length)) {
    issues.push('Article did not mention enough selected tours by title.');
  }
  if (!/天气|出游节奏/.test(article)) {
    issues.push('Article is missing the opening weather / travel rhythm section.');
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

export function getDefaultWebsiteUrl() {
  return DEFAULT_WEBSITE_URL;
}
