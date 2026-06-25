import fs from 'node:fs';
import path from 'node:path';
import QRCode from 'qrcode';

const DEFAULT_TOURS_FILE = 'public/data/tours.json';
const DEFAULT_WINDOW_DAYS = 21;
const DEFAULT_MAX_CANDIDATES = 18;
const DEFAULT_MAX_ARTICLE_ITEMS = 25;
const DEFAULT_JSON_MAX_TOKENS = 8192;
const DEFAULT_AUTHOR = '老广去边度';

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

function scoreTour(tour, runDate, windowDates) {
  const destination = normalizeDestination(tour.destination);
  const firstDate = windowDates[0];
  const daysUntilDeparture = firstDate ? diffDays(runDate, firstDate) : 999;
  const availabilityConfidence = tour.dataQuality?.availabilityConfidence || tour.meta?.dataQuality?.availabilityConfidence || 'unknown';
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
  if (tour.suitableFor?.includes('亲子')) score += 4;
  if (tour.isFlashSale) score += 4;
  if (tour.isHot) score += 3;

  return {
    score,
    daysUntilDeparture,
    availabilityConfidence,
    destination,
    firstDate,
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

function classifyTourBucket(tour) {
  const blob = textBlob(tour);
  const destination = normalizeDestination(tour.destination);
  if (blob.includes('夏令营') || blob.includes('亲子') || (tour.suitableFor || []).includes('亲子')) {
    return '亲子清凉';
  }
  if (blob.includes('漂流') || blob.includes('瀑布') || blob.includes('峡谷') || blob.includes('山') || blob.includes('湖') || blob.includes('森林') || blob.includes('溪')) {
    return '山水避暑';
  }
  if (blob.includes('海') || blob.includes('沙滩') || blob.includes('海岛') || blob.includes('蓝眼泪')) {
    return '海风玩水';
  }
  if (blob.includes('泳池') || blob.includes('水世界') || blob.includes('温泉') || blob.includes('酒店')) {
    return '住下来放松';
  }
  if (tour.duration >= 5 || !DOMESTIC_NEARBY_DESTINATIONS.has(destination)) {
    return '远一点也值得';
  }
  return '周末就能走';
}

function rebalanceSelectedTours(candidateTours, maxArticleItems) {
  const picked = [];
  const usedIds = new Set();
  const bucketCounts = new Map();
  const destinationCounts = new Map();

  for (const tour of candidateTours) {
    const bucket = classifyTourBucket(tour);
    const destination = normalizeDestination(tour.destination);
    const bucketCount = bucketCounts.get(bucket) || 0;
    const destinationCount = destinationCounts.get(destination) || 0;
    const allowAnotherBucket = picked.length >= Math.min(8, maxArticleItems);
    const allowAnotherDestination = picked.length >= Math.min(12, maxArticleItems);
    if (!allowAnotherBucket && bucketCount >= 1) continue;
    if (!allowAnotherDestination && destinationCount >= 1) continue;
    picked.push(tour);
    usedIds.add(tour.id);
    bucketCounts.set(bucket, bucketCount + 1);
    destinationCounts.set(destination, destinationCount + 1);
    if (picked.length >= maxArticleItems) return picked;
  }

  for (const tour of candidateTours) {
    if (usedIds.has(tour.id)) continue;
    picked.push(tour);
    usedIds.add(tour.id);
    if (picked.length >= maxArticleItems) break;
  }

  return picked;
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
    bucket: classifyTourBucket(tour),
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
      if (!Array.isArray(tour.images) || tour.images.length === 0) return null;
      if (typeof tour.bookingUrl !== 'string' || !tour.bookingUrl.trim()) return null;

      const score = scoreTour(tour, runDate, selectedDepartureDates);
      return {
        ...tour,
        selectedDepartureDates,
        editorialScore: score.score,
        availabilityConfidence: score.availabilityConfidence,
        editorialReasons: [
          `${score.daysUntilDeparture}天内可出发`,
          score.availabilityConfidence === 'high' ? '班期可信度高' : '班期需二次确认',
          DOMESTIC_NEARBY_DESTINATIONS.has(score.destination) ? '更适合周度推荐' : '适合作为中长线备选',
          hasSummerSignals(tour) ? `${season}语境下更好写` : '以常规卖点切入',
        ],
      };
    })
    .filter(Boolean)
    .sort((left, right) => right.editorialScore - left.editorialScore);

  const candidateTours = filtered.slice(0, Math.max(maxCandidates, maxArticleItems * 2));
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
        `站内详情：${tour.siteUrl}`,
        `二维码文件：${tour.qrPath}`,
        `分组：${tour.bucket}`,
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
    '- 每条线路只写三个字段：recommendationTitle、reason、reminder',
    '- reason 必须 55 字以上，要讲清为什么当下去会更舒服或更值得，不要空泛，不要写“推荐方向”“取舍”“可以理解为”这种解释腔',
    '- recommendationTitle 可以比原产品名更像公众号小标题，但不能改错事实',
    '- reminder 用一句自然提醒补班期、节奏、适合人群或出发前注意点',
    '- 不要重复同一个 destination 的同一套说法，不要把多条线路写成一个模子',
    '- 能写真山水、亲水、森林、海风、泳池、水世界，就不要硬把所有“带池”都写成温泉放松',
    '- 不要使用“最佳、第一、最低价、必去、百分百成团、错过再等一年”等绝对化表达',
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
    '  "items": [',
    '    {',
    '      "id": "tour_xxx",',
    '      "recommendationTitle": "..." ,',
    '      "reason": "..." ,',
    '      "reminder": "..."',
    '    }',
    '  ]',
    '}',
  ].join('\n');
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

function buildFallbackIntro(context) {
  const advice = context.editorialContext.themeHints.join('、') || '近场清凉、山水与亲水玩法';
  return `这周广州和周边更适合挑有树荫、有水体、能把节奏放慢的线路来走。比起纯城市暴走，${advice}这一类行程更容易把闷热感卸下来；如果时间不多，住下来放松的酒店线也更适合周末接一口气。`;
}

function buildFallbackWeatherLead(context) {
  return `进入${context.season}后，华南通常会反复出现闷热和阵雨，出游更适合优先看体感而不是只看公里数。瀑布、峡谷、森林步道、漂流、海边、泳池和住下来慢慢玩的线路，这周都会比纯暴晒型路线更顺手。`;
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

function renderTourSection(tour, aiItem, index) {
  const title = aiItem.recommendationTitle || slugifyText(tour.title);
  const reason = aiItem.reason || defaultReasonForTour(tour);
  const reminder = aiItem.reminder || defaultReminderForTour(tour);
  const image = tour.primaryImage || normalizeArticleImageUrl(chooseTourImage(tour));
  const siteUrl = tour.siteUrl || getTourSiteUrl(tour.id);
  const qrPath = tour.qrPath || getTourQrRelativePath(tour.id);
  const departureHint = summarizeDepartureDates(tour.departureDates, 4);

  return [
    `## ${index + 1}. ${title}`,
    '',
    image ? `![${escapeMarkdown(tour.title)}](${image})` : '',
    '',
    reason,
    '',
    `- 适合谁：${suitabilityLabel(tour)}`,
    `- 为什么当下去：${highlightLabel(tour)}`,
    `- 行程信息：${durationLabel(tour)}｜${priceLabel(tour)}｜近期班期 ${departureHint || '以页面为准'}`,
    `- 出发提醒：${reminder}`,
    '',
    '[查看行程](' + siteUrl + ')',
    '',
    `地址：${siteUrl}`,
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
    `cover: "${context.selectedTours[0]?.primaryImage || context.selectedTours[0]?.images?.[0] || ''}"`,
    '---',
  ].join('\n');

  const intro = normalizeAiText(aiPayload.intro || buildFallbackIntro(context));
  const weatherLead = normalizeAiText(aiPayload.weatherLead || buildFallbackWeatherLead(context));
  const items = normalizeAiItemMap(aiPayload, context);
  const sections = context.selectedTours.map((tour, index) => renderTourSection(tour, items[index] || {}, index));

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
    ...sections,
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
