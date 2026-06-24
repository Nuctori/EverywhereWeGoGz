import fs from 'node:fs';
import path from 'node:path';

const DEFAULT_TOURS_FILE = 'public/data/tours.json';
const DEFAULT_WINDOW_DAYS = 21;
const DEFAULT_MAX_CANDIDATES = 18;
const DEFAULT_MAX_ARTICLE_ITEMS = 5;
const DEFAULT_AUTHOR = '老广旅行';
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

  const candidateTours = filtered.slice(0, maxCandidates);
  const articleTours = [];
  const destinationCounts = new Map();
  for (const tour of candidateTours) {
    const destination = normalizeDestination(tour.destination);
    const count = destinationCounts.get(destination) || 0;
    if (count >= 1 && articleTours.length < Math.max(3, maxArticleItems - 1)) continue;
    articleTours.push(tour);
    destinationCounts.set(destination, count + 1);
    if (articleTours.length >= maxArticleItems) break;
  }

  const selectedTours = articleTours.length > 0 ? articleTours : candidateTours.slice(0, maxArticleItems);
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
        `正文配图：${(tour.articleImages || []).join('、') || '未标注'}`,
        `预订链接：${tour.bookingUrl}`,
      ];
      return lines.join('\n');
    })
    .join('\n\n');

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
    '- 输出 Markdown，且必须带 frontmatter：title, summary, author, cover',
    `- author 固定写 "${DEFAULT_AUTHOR}"`,
    `- cover 使用第一条线路的首图：${context.selectedTours[0]?.images?.[0] || ''}`,
    `- 阅读原文链接固定指向：${DEFAULT_WEBSITE_URL}`,
    '- 标题适合公众号，但不要夸张标题党',
    '- 开头先给本周出游判断，再分段推荐线路',
    '- 每条线路写清楚：为什么这周值得看、适合谁、线路信息、提醒',
    '- 正文使用 Markdown 图片语法配图，导语至少 1 张图，每条线路至少 1 张图，优先使用提供的“正文配图”URL',
    '- 天气和季节只能做保守表达，例如“更适合避暑”“更适合亲子出游”，不要写成确定性预报',
    '- 不要使用“最佳、第一、最低价、必去、百分百成团、错过再等一年”等绝对化表达',
    '- 不要编造出发城市、库存、优惠、成团率、景区政策',
    '- 价格、班期、链接必须与素材一致',
    '- 结尾要提醒以供应商页面为准，并引导读者查看行程',
    '',
    '本次优先采用的线路：',
    selectedTourBlock,
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
    '正文……',
  ].join('\n');
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
      max_tokens: options.maxTokens || 2200,
      messages: [
        {
          role: 'system',
          content: '你写作稳健、像旅行编辑而不是销售，不夸张，不编造产品事实。',
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

  const mentionedSelectedTours = context.selectedTours.filter((tour) => article.includes(tour.title)).length;
  if (mentionedSelectedTours < Math.min(3, context.selectedTours.length)) {
    issues.push('Article did not mention enough selected tours by title.');
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
