import type {
  AiProviderConfig,
  AiPreferenceMemory,
  AiRecommendationCandidate,
  AiRecommendationItem,
  AiRecommendationMessage,
  AiRecommendationProgress,
  AiRecommendationSubstep,
  AiRecommendationRequest,
  AiRecommendationResult,
  AiWeatherContext,
  FilterState,
} from '@/types/tour';

const AI_CONFIG_STORAGE_KEY = 'travel-ai-provider-config';
const MAX_AI_CANDIDATES = 180;
const MAX_AI_COMMENTARY_ITEMS = 18;
const ROUTE_ATLAS_MAX_GROUPS = 18;
const ROUTE_ATLAS_MAX_EXAMPLES = 4;
const DEFAULT_DEPARTURE_CITY = '广州';
const WEEKDAY_LABELS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

function withActiveSubstep(
  items: Array<{ id: string; label: string; detail?: string }>,
  activeId: string,
): AiRecommendationSubstep[] {
  const activeIndex = items.findIndex((item) => item.id === activeId);

  return items.map((item, index) => ({
    ...item,
    status: activeIndex === -1 ? 'pending' : index < activeIndex ? 'done' : index === activeIndex ? 'active' : 'pending',
  }));
}

interface AiTravelIntent {
  tripDays?: number | null;
  tripDaysMin?: number | null;
  tripDaysMax?: number | null;
  departureWeekdays?: number[];
  departureTimeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night' | 'any' | null;
  destinationHints?: string[];
  budgetMax?: number | null;
  budgetMin?: number | null;
  travelStyle?: string[];
  mustHave?: string[];
  avoid?: string[];
  weatherSensitivity?: string[];
  budgetPriority?: 'low' | 'balanced' | 'premium' | null;
  refinementMode?: 'new_search' | 'refine_previous' | 'broaden' | 'replace_destination' | null;
  confidence?: number;
}

interface RecommendationContext {
  budgetPriority?: AiTravelIntent['budgetPriority'];
}

interface DestinationWeatherInsight extends AiWeatherContext {
  role: 'departure' | 'destination';
  queryReason?: string;
  bestSeasonNote?: string;
}

interface CandidateAuditPrimitive extends RecommendationPrimitive {
  matchStatus: 'match' | 'soft_conflict' | 'fallback';
  conflictReasons: string[];
  priceContext: {
    poolPercentile: number | null;
    pricePerDay: number | null;
  };
}

const THEME_KEYWORDS = [
  '亲子',
  '美食',
  '温泉',
  '海岛',
  '摄影',
  '徒步',
  '休闲',
  '自然',
  '文化',
  '避暑',
  '滑雪',
  '邮轮',
  '老人',
  '家庭',
];

const DESTINATION_ALIASES: Record<string, string[]> = {
  桂林: ['桂林', '阳朔', '漓江'],
  三亚: ['三亚', '海南', '海口'],
  云南: ['云南', '昆明', '大理', '丽江', '香格里拉', '西双版纳'],
  张家界: ['张家界', '天门山', '武陵源'],
  西藏: ['西藏', '拉萨', '林芝'],
  新疆: ['新疆', '乌鲁木齐', '喀纳斯', '伊犁'],
  日本: ['日本', '东京', '大阪', '京都', '北海道'],
  韩国: ['韩国', '首尔', '济州'],
  欧洲: ['欧洲', '法国', '意大利', '瑞士', '德国', '西班牙'],
  贵州: ['贵州', '贵阳', '黄果树', '荔波'],
  四川: ['四川', '成都', '九寨沟', '峨眉山'],
  广东: ['广东', '广州', '深圳', '珠海', '潮汕'],
  东南亚: [
    '东南亚',
    '泰国',
    '普吉',
    '普吉岛',
    '苏梅',
    '芭提雅',
    '曼谷',
    '马来西亚',
    '沙巴',
    '仙本那',
    '越南',
    '芽庄',
    '下龙湾',
    '美奈',
    '巴厘',
    '巴厘岛',
    '印度尼西亚',
    '菲律宾',
    '长滩',
    '薄荷岛',
    '新加坡',
    '新马',
  ],
};

const DESTINATION_COORDS: Record<string, { latitude: number; longitude: number }> = {
  桂林: { latitude: 25.2736, longitude: 110.2900 },
  三亚: { latitude: 18.2528, longitude: 109.5119 },
  海南: { latitude: 20.0174, longitude: 110.3492 },
  云南: { latitude: 25.0389, longitude: 102.7183 },
  张家界: { latitude: 29.1171, longitude: 110.4792 },
  西藏: { latitude: 29.6525, longitude: 91.1721 },
  新疆: { latitude: 43.8256, longitude: 87.6168 },
  日本: { latitude: 35.6762, longitude: 139.6503 },
  韩国: { latitude: 37.5665, longitude: 126.9780 },
  欧洲: { latitude: 48.8566, longitude: 2.3522 },
  贵州: { latitude: 26.6470, longitude: 106.6302 },
  四川: { latitude: 30.5728, longitude: 104.0668 },
  广东: { latitude: 23.1291, longitude: 113.2644 },
};

type StoredAiProviderConfig = Partial<AiProviderConfig>;
type RecommendationPrimitive = ReturnType<typeof buildTourPrimitive>;
type RouteAtlas = ReturnType<typeof buildRouteAtlas>;
type RecommendationAuditContext = ReturnType<typeof buildRecommendationAuditContext>;

function percentile(sortedValues: number[], ratio: number) {
  if (sortedValues.length === 0) return null;
  const index = Math.min(sortedValues.length - 1, Math.max(0, Math.floor((sortedValues.length - 1) * ratio)));
  return sortedValues[index];
}

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

function getLatestUserText(messages: AiRecommendationMessage[]) {
  return messages
    .filter((message) => message.role === 'user')
    .at(-1)?.content ?? '';
}

function parseBudget(text: string) {
  const compactBudgetMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:k|K|千)/);
  if (compactBudgetMatch) {
    const value = Number(compactBudgetMatch[1]) * 1000;
    if (Number.isFinite(value)) {
      return { min: 0, max: value * (text.includes('左右') ? 1.2 : 1) };
    }
  }

  const match = text.match(/(\d{3,6})\s*(?:元|块|以内|以下|左右)?/);
  if (!match) return null;
  const value = Number(match[1]);
  if (!Number.isFinite(value)) return null;

  if (text.includes('以上') || text.includes('起')) {
    return { min: value, max: Number.POSITIVE_INFINITY };
  }

  return { min: 0, max: value * (text.includes('左右') ? 1.2 : 1) };
}

function parseDuration(text: string) {
  const rangeMatch = text.match(/(\d{1,2})\s*[-到至]\s*(\d{1,2})\s*天/);
  if (rangeMatch) {
    return {
      min: Number(rangeMatch[1]),
      max: Number(rangeMatch[2]),
    };
  }

  const exactMatch = text.match(/(\d{1,2})\s*天/);
  if (!exactMatch) return null;
  const value = Number(exactMatch[1]);

  if (text.includes('以上')) {
    return { min: value, max: Number.POSITIVE_INFINITY };
  }

  if (text.includes('以内') || text.includes('以下')) {
    return { min: 0, max: value };
  }

  return { min: Math.max(0, value - 1), max: value + 1 };
}

function collectDestinationHints(text: string) {
  return Object.entries(DESTINATION_ALIASES)
    .filter(([, aliases]) => aliases.some((alias) => text.includes(alias)))
    .map(([destination]) => destination);
}

function getDestinationAliasesForHint(hint: string) {
  const normalizedHint = hint.trim().toLowerCase();
  if (!normalizedHint) return [];

  const directAliases = DESTINATION_ALIASES[hint];
  if (directAliases) return [hint, ...directAliases];

  const aliasEntry = Object.entries(DESTINATION_ALIASES).find(([, aliases]) =>
    aliases.some((alias) => alias.toLowerCase() === normalizedHint),
  );

  return aliasEntry ? [aliasEntry[0], ...aliasEntry[1]] : [hint];
}

function destinationHintsMatchCorpus(destinationHints: string[] | undefined, corpus: string) {
  if (!destinationHints?.length) return true;
  const normalizedCorpus = corpus.toLowerCase();

  return destinationHints.some((hint) =>
    getDestinationAliasesForHint(hint).some((alias) =>
      normalizedCorpus.includes(alias.toLowerCase()),
    ),
  );
}

function collectThemeHints(text: string) {
  return THEME_KEYWORDS.filter((keyword) => text.includes(keyword));
}

function getSearchCorpus(tour: AiRecommendationCandidate) {
  return [
    tour.title,
    tour.destination,
    tour.theme,
    tour.source,
    tour.transportType,
    tour.accommodationLevel,
    tour.meals,
    tour.groupSize,
    tour.season,
    ...tour.tags,
    ...tour.highlights,
    ...(tour.suitableFor || []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function scoreTour(tour: AiRecommendationCandidate, text: string): AiRecommendationItem | null {
  const corpus = getSearchCorpus(tour);
  const destinationHints = collectDestinationHints(text);
  const themeHints = collectThemeHints(text);
  const budget = parseBudget(text);
  const duration = parseDuration(text);
  const signals: string[] = [];
  let score = 0;

  for (const hint of destinationHints) {
    if (destinationHintsMatchCorpus([hint], `${tour.destination} ${tour.title} ${corpus}`)) {
      score += 18;
      signals.push(`目的地匹配：${hint}`);
      break;
    }
  }

  for (const hint of themeHints) {
    if (corpus.includes(normalizeText(hint))) {
      score += 10;
      signals.push(`偏好匹配：${hint}`);
    }
  }

  if (budget) {
    if (tour.price >= budget.min && tour.price <= budget.max) {
      score += 12;
      signals.push(`预算接近：￥${tour.price.toLocaleString()}`);
    } else if (Number.isFinite(budget.max) && tour.price <= budget.max * 1.25) {
      score += 5;
      signals.push('价格略高但仍可比较');
    }
  }

  if (duration && tour.duration >= duration.min && tour.duration <= duration.max) {
    score += 10;
    signals.push(`天数合适：${tour.duration}天`);
  }

  if (text.includes('轻松') || text.includes('休闲') || text.includes('老人')) {
    if (tour.leisureLevel === 'easy') {
      score += 10;
      signals.push('行程强度较轻');
    } else if (tour.leisureLevel === 'hard') {
      score -= 8;
    }
  }

  if (text.includes('近期') || text.includes('马上') || text.includes('本周')) {
    score += Math.min(tour.hotDepartureDates?.length ?? 0, 3) * 3;
    if ((tour.hotDepartureDates?.length ?? 0) > 0) {
      signals.push('近期班期较多');
    }
  }

  if (tour.isHot) score += 4;
  if (tour.rating >= 4.7) score += 3;

  if (score <= 0) return null;

  return {
    tourId: tour.id,
    score,
    reason: signals.slice(0, 3).join('，') || '综合匹配度较高',
    matchedSignals: signals.slice(0, 5),
  };
}

function fallbackRecommendations(tours: AiRecommendationCandidate[]): AiRecommendationItem[] {
  return [...tours]
    .sort((a, b) =>
      (b.isHot ? 1 : 0) - (a.isHot ? 1 : 0) ||
      (b.rating || 0) - (a.rating || 0) ||
      a.price - b.price,
    )
    .map((tour, index) => ({
      tourId: tour.id,
      score: Math.max(1, 100 - index),
      reason: index < MAX_AI_COMMENTARY_ITEMS
        ? tour.isHot ? '热门线路，适合作为推荐备选' : '综合热度和价格表现较稳'
        : undefined,
      matchedSignals: tour.isHot ? ['热门线路'] : ['综合排序靠前'],
    }));
}

function localRecommendations(tours: AiRecommendationCandidate[], text: string) {
  const normalizedText = normalizeText(text);
  const items = tours
    .map((tour) => scoreTour(tour, normalizedText))
    .filter((item): item is AiRecommendationItem => Boolean(item))
    .sort((a, b) => b.score - a.score)
    .map((item, index) => ({
      ...item,
      reason: index < MAX_AI_COMMENTARY_ITEMS ? item.reason : undefined,
    }));

  return items.length > 0 ? items : fallbackRecommendations(tours);
}

function inferLocalIntent(text: string): AiTravelIntent | null {
  const budget = parseBudget(text);
  const duration = parseDuration(text);
  const destinationHints = collectDestinationHints(text);
  const travelStyle = collectThemeHints(text);
  const mustHave = ['游泳', '泳池', '浮潜', '潜水', '浆板', '桨板', 'sup', 'SUP']
    .filter((keyword) => text.includes(keyword));

  if (!budget && !duration && destinationHints.length === 0 && travelStyle.length === 0 && mustHave.length === 0) {
    return null;
  }

  return {
    budgetMin: budget?.min ?? null,
    budgetMax: budget?.max ?? null,
    tripDaysMin: duration?.min ?? null,
    tripDaysMax: duration?.max ?? null,
    destinationHints,
    travelStyle,
    mustHave,
  };
}

function buildLocalRecommendationText(
  userText: string,
  preferenceMemory: AiPreferenceMemory | null | undefined,
) {
  const memoryTerms = [
    ...(preferenceMemory?.destinationHints || []),
    ...(preferenceMemory?.travelStyle || []),
    ...(preferenceMemory?.mustHave || []),
    preferenceMemory?.budgetMax ? `${preferenceMemory.budgetMax}元以内` : '',
    preferenceMemory?.tripDays ? `${preferenceMemory.tripDays}天` : '',
    preferenceMemory?.tripDaysMin || preferenceMemory?.tripDaysMax
      ? `${preferenceMemory.tripDaysMin ?? 0}-${preferenceMemory.tripDaysMax ?? ''}天`
      : '',
  ];

  return uniqueStrings([userText, ...memoryTerms]).join(' ');
}

function buildEffectiveUserText(
  userText: string,
  preferenceMemory: AiPreferenceMemory | null | undefined,
) {
  return buildLocalRecommendationText(userText, preferenceMemory);
}

function stripRecommendationCommentary(item: AiRecommendationItem): AiRecommendationItem {
  return {
    ...item,
    reason: undefined,
    matchedSignals: [],
  };
}

function limitRecommendationCommentary(items: AiRecommendationItem[]): AiRecommendationItem[] {
  let commentaryCount = 0;

  return items.map((item) => {
    if (!item.reason) {
      return stripRecommendationCommentary(item);
    }

    commentaryCount += 1;
    return commentaryCount <= MAX_AI_COMMENTARY_ITEMS
      ? item
      : stripRecommendationCommentary(item);
  });
}

function mergeAiAndLocalRecommendations(
  aiItems: AiRecommendationItem[],
  localItems: AiRecommendationItem[],
): AiRecommendationItem[] {
  const seenTourIds = new Set<string>();
  const merged: AiRecommendationItem[] = [];

  for (const item of [...aiItems, ...localItems]) {
    if (seenTourIds.has(item.tourId)) continue;
    seenTourIds.add(item.tourId);
    merged.push(item);
  }

  return limitRecommendationCommentary(merged);
}

function uniqueStrings(values: Array<string | undefined | null>) {
  return [...new Set(values.map((value) => value?.trim()).filter((value): value is string => Boolean(value)))];
}

function uniqueNumbers(values: Array<number | undefined | null>) {
  return [...new Set(values.filter((value): value is number => Number.isFinite(value)))];
}

function mergePreferenceMemory(
  previous: AiPreferenceMemory | null | undefined,
  intent: AiTravelIntent | null,
): AiPreferenceMemory {
  const replacesDestination = intent?.refinementMode === 'replace_destination' || intent?.refinementMode === 'new_search';
  const hasNewDestination = Boolean(intent?.destinationHints?.length);

  return {
    destinationHints: uniqueStrings(
      hasNewDestination && replacesDestination
        ? intent?.destinationHints || []
        : [...(previous?.destinationHints || []), ...(intent?.destinationHints || [])],
    ).slice(-12),
    travelStyle: uniqueStrings([
      ...(previous?.travelStyle || []),
      ...(intent?.travelStyle || []),
    ]).slice(-16),
    mustHave: uniqueStrings([
      ...(previous?.mustHave || []),
      ...(intent?.mustHave || []),
    ]).slice(-16),
    avoid: uniqueStrings([
      ...(previous?.avoid || []),
      ...(intent?.avoid || []),
    ]).slice(-16),
    weatherSensitivity: uniqueStrings([
      ...(previous?.weatherSensitivity || []),
      ...(intent?.weatherSensitivity || []),
    ]).slice(-12),
    budgetMin: intent?.budgetMin ?? previous?.budgetMin ?? null,
    budgetMax: intent?.budgetMax ?? previous?.budgetMax ?? null,
    budgetPriority: intent?.budgetPriority ?? previous?.budgetPriority ?? null,
    tripDays: intent?.tripDays ?? previous?.tripDays ?? null,
    tripDaysMin: intent?.tripDaysMin ?? previous?.tripDaysMin ?? null,
    tripDaysMax: intent?.tripDaysMax ?? previous?.tripDaysMax ?? null,
    departureWeekdays: uniqueNumbers([
      ...(previous?.departureWeekdays || []),
      ...(intent?.departureWeekdays || []),
    ]).filter((weekday) => weekday >= 0 && weekday <= 6),
    departureTimeOfDay: intent?.departureTimeOfDay ?? previous?.departureTimeOfDay ?? null,
    refinementMode: intent?.refinementMode ?? previous?.refinementMode ?? null,
    updatedAt: new Date().toISOString(),
  };
}

function getDepartureDates(tour: AiRecommendationCandidate) {
  return [
    ...(tour.departureDates || []),
    ...(tour.hotDepartureDates || []),
    tour.departureDate,
  ]
    .filter(Boolean)
    .filter((date, index, all) => all.indexOf(date) === index);
}

function getWeekday(date: string) {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.getDay();
}

function inferScheduleHints(tour: AiRecommendationCandidate) {
  const corpus = getSearchCorpus(tour);
  const dates = getDepartureDates(tour);
  const weekdays = dates
    .map(getWeekday)
    .filter((day): day is number => day !== null);
  const textWeekdays = WEEKDAY_LABELS
    .map((label, weekday) => {
      const short = label.replace('周', '');
      const matched =
        corpus.includes(label) ||
        corpus.includes(`星期${short}`) ||
        corpus.includes(`礼拜${short}`) ||
        (weekday === 0 && (corpus.includes('周天') || corpus.includes('星期天')));
      return matched ? weekday : null;
    })
    .filter((weekday): weekday is number => weekday !== null);
  const uniqueWeekdays = [...new Set([...weekdays, ...textWeekdays])].sort((a, b) => a - b);
  const eveningDeparture = /晚|晚上|夜间|夜发|夜游|卧铺|夕发|夜宿/.test(corpus);
  const recurringText = /每周|天天|全年|逢周|固定发团|班期/.test(corpus);

  return {
    departureDates: dates.slice(0, 10),
    departureWeekdays: uniqueWeekdays,
    departureWeekdayLabels: uniqueWeekdays.map((weekday) => WEEKDAY_LABELS[weekday]),
    timeOfDayHints: eveningDeparture ? ['evening', 'night'] : [],
    hasEveningOrNightDeparture: eveningDeparture,
    hasRecurringScheduleText: recurringText,
    rawScheduleText: [tour.title, tour.departureDate, ...(tour.hotDepartureDates || [])]
      .filter(Boolean)
      .join(' · ')
      .slice(0, 220),
  };
}

function buildTourPrimitive(tour: AiRecommendationCandidate) {
  return {
    id: tour.id,
    title: tour.title,
    source: tour.source,
    destination: tour.destination,
    tripDays: tour.duration,
    price: tour.price,
    theme: tour.theme,
    tags: tour.tags?.slice(0, 6) ?? [],
    highlights: tour.highlights?.slice(0, 4) ?? [],
    transportType: tour.transportType,
    accommodationLevel: tour.accommodationLevel,
    meals: tour.meals,
    leisureLevel: tour.leisureLevel,
    suitableFor: tour.suitableFor?.slice(0, 4) ?? [],
    season: tour.season,
    rating: tour.rating,
    groupSize: tour.groupSize,
    isHot: tour.isHot,
    schedule: inferScheduleHints(tour),
  };
}

function getAtlasRegions(tour: AiRecommendationCandidate) {
  const corpus = getSearchCorpus(tour);
  const regions = Object.entries(DESTINATION_ALIASES)
    .filter(([destination, aliases]) =>
      tour.destination.includes(destination) ||
      aliases.some((alias) => corpus.includes(alias.toLowerCase())),
    )
    .map(([destination]) => destination);

  if (regions.length > 0) return regions;
  return [tour.destination || '其他'];
}

function getAtlasGroupKey(tour: AiRecommendationCandidate) {
  const [region] = getAtlasRegions(tour);
  return `${region}｜${tour.theme || '综合'}`;
}

function formatRange(values: number[]) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return {
    min: sorted[0],
    p25: percentile(sorted, 0.25),
    median: sorted[Math.floor(sorted.length / 2)],
    p75: percentile(sorted, 0.75),
    max: sorted[sorted.length - 1],
  };
}

function buildRouteAtlas(tours: AiRecommendationCandidate[], intent: AiTravelIntent | null) {
  const groups = new Map<string, {
    key: string;
    region: string;
    theme: string;
    count: number;
    prices: number[];
    days: number[];
    keywords: Map<string, number>;
    examples: Array<{ id: string; title: string; price: number; days: number; destination: string }>;
    relevance: number;
  }>();
  const intentText = [
    ...(intent?.destinationHints || []),
    ...(intent?.travelStyle || []),
    ...(intent?.mustHave || []),
  ].join(' ').toLowerCase();

  for (const tour of tours) {
    const key = getAtlasGroupKey(tour);
    const [region, theme] = key.split('｜');
    const group = groups.get(key) || {
      key,
      region,
      theme,
      count: 0,
      prices: [],
      days: [],
      keywords: new Map<string, number>(),
      examples: [],
      relevance: 0,
    };
    const corpus = getSearchCorpus(tour);

    group.count += 1;
    group.prices.push(tour.price);
    group.days.push(tour.duration);
    group.relevance +=
      (intent?.destinationHints?.length && destinationHintsMatchCorpus(intent.destinationHints, `${tour.destination} ${tour.title}`) ? 30 : 0) +
      (intentText && corpus.includes(intentText) ? 10 : 0) +
      (tour.isHot ? 3 : 0) +
      Math.max(0, 8 - Math.min(tour.price / 1000, 8));

    for (const keyword of [
      tour.destination,
      tour.theme,
      tour.transportType,
      ...tour.tags.slice(0, 4),
      ...tour.highlights.slice(0, 3),
    ].filter(Boolean)) {
      group.keywords.set(keyword, (group.keywords.get(keyword) || 0) + 1);
    }

    if (group.examples.length < ROUTE_ATLAS_MAX_EXAMPLES) {
      group.examples.push({
        id: tour.id,
        title: tour.title,
        price: tour.price,
        days: tour.duration,
        destination: tour.destination,
      });
    }

    groups.set(key, group);
  }

  return [...groups.values()]
    .sort((a, b) => b.relevance - a.relevance || b.count - a.count)
    .slice(0, ROUTE_ATLAS_MAX_GROUPS)
    .map((group) => ({
      region: group.region,
      theme: group.theme,
      count: group.count,
      priceRange: formatRange(group.prices),
      dayRange: formatRange(group.days),
      keywords: [...group.keywords.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([keyword]) => keyword),
      examples: group.examples,
    }));
}

function summarizeToursForAudit(tours: AiRecommendationCandidate[]) {
  const prices = tours
    .map((tour) => tour.price)
    .filter((price) => Number.isFinite(price) && price > 0)
    .sort((a, b) => a - b);
  const days = tours
    .map((tour) => tour.duration)
    .filter((day) => Number.isFinite(day) && day > 0)
    .sort((a, b) => a - b);
  const destinations = new Map<string, number>();
  const themes = new Map<string, number>();

  for (const tour of tours) {
    if (tour.destination) destinations.set(tour.destination, (destinations.get(tour.destination) || 0) + 1);
    if (tour.theme) themes.set(tour.theme, (themes.get(tour.theme) || 0) + 1);
  }

  const topEntries = (values: Map<string, number>) =>
    [...values.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, count]) => ({ name, count }));

  return {
    count: tours.length,
    priceRange: formatRange(prices),
    dayRange: formatRange(days),
    topDestinations: topEntries(destinations),
    topThemes: topEntries(themes),
  };
}

function buildRecommendationAuditContext(
  candidateTours: AiRecommendationCandidate[],
  previousResult: AiRecommendationResult | null | undefined,
  effectiveIntent: AiTravelIntent | null = null,
) {
  const candidateById = new Map(candidateTours.map((tour) => [tour.id, tour]));
  const previousTours = previousResult?.items
    .map((item) => candidateById.get(item.tourId))
    .filter((tour): tour is AiRecommendationCandidate => Boolean(tour))
    .slice(0, 80) ?? [];
  const inheritedDestinationTours = effectiveIntent?.destinationHints?.length
    ? candidateTours.filter((tour) => destinationHintsMatchCorpus(
      effectiveIntent.destinationHints,
      `${tour.destination} ${tour.title}`,
    ))
    : [];

  return {
    previousResult: previousResult ? {
      summary: previousResult.summary,
      source: previousResult.source,
      topResultSnapshot: summarizeToursForAudit(previousTours.slice(0, 18)),
      allPinnedSnapshot: summarizeToursForAudit(previousTours),
    } : null,
    effectivePoolSnapshot: summarizeToursForAudit(inheritedDestinationTours.length > 0 ? inheritedDestinationTours : candidateTours),
    businessKnowledge: [
      '多轮短句通常是在上一轮需求上追加偏好；除非明确换目的地或重开搜索，应继承上一轮目的地、主题、天数和同行人偏好。',
      '相对价格需求要与上一轮推荐和同目的地/同主题/相近天数的价格分布比较，不应只按全站绝对低价排序。',
      '低价推荐仍需保留班期真实性、目的地匹配、天数合理、行程强度和天气风险；价格只是收窄和排序因素。',
      '如果便宜候选会牺牲海岛度假属性、班期或舒适度，应在 summary 和 reason 里直说取舍。',
    ],
  };
}

function intentMatchesPrimitive(intent: AiTravelIntent | null, primitive: RecommendationPrimitive) {
  return getPrimitiveConflictReasons(intent, primitive).length === 0;
}

function getPrimitiveConflictReasons(intent: AiTravelIntent | null, primitive: RecommendationPrimitive) {
  const reasons: string[] = [];
  if (!intent) return reasons;

  if (intent.tripDays && primitive.tripDays !== intent.tripDays) {
    reasons.push(`天数不是${intent.tripDays}天`);
  }
  if (intent.tripDaysMin && primitive.tripDays < intent.tripDaysMin) {
    reasons.push(`天数少于${intent.tripDaysMin}天`);
  }
  if (intent.tripDaysMax && primitive.tripDays > intent.tripDaysMax) {
    reasons.push(`天数超过${intent.tripDaysMax}天`);
  }
  if (intent.budgetMin && primitive.price < intent.budgetMin) {
    reasons.push(`价格低于预算下限￥${intent.budgetMin.toLocaleString()}`);
  }
  if (intent.budgetMax && primitive.price > intent.budgetMax) {
    reasons.push(`价格高于预算上限￥${intent.budgetMax.toLocaleString()}`);
  }

  const weekdays = intent.departureWeekdays?.filter((day) => Number.isInteger(day)) ?? [];
  if (weekdays.length > 0) {
    const hasWeekday = primitive.schedule.departureWeekdays.some((weekday) => weekdays.includes(weekday));
    if (!hasWeekday) {
      reasons.push(`缺少${weekdays.map((weekday) => WEEKDAY_LABELS[weekday]).join('/')}出发班期`);
    }
  }

  if (
    (intent.departureTimeOfDay === 'evening' || intent.departureTimeOfDay === 'night') &&
    !primitive.schedule.hasEveningOrNightDeparture
  ) {
    reasons.push('未识别到晚间或夜间出发');
  }

  if (intent.destinationHints?.length) {
    const destinationCorpus = `${primitive.destination} ${primitive.title}`;
    if (!destinationHintsMatchCorpus(intent.destinationHints, destinationCorpus)) {
      reasons.push(`目的地不匹配：${intent.destinationHints.join('/')}`);
    }
  }

  return reasons;
}

function primitiveMatchesDestination(intent: AiTravelIntent | null, primitive: RecommendationPrimitive) {
  if (!intent?.destinationHints?.length) return true;
  return destinationHintsMatchCorpus(intent.destinationHints, `${primitive.destination} ${primitive.title}`);
}

function rankPrimitive(
  primitive: RecommendationPrimitive,
  localItems: AiRecommendationItem[],
  context?: RecommendationContext,
) {
  const localRank = localItems.findIndex((item) => item.tourId === primitive.id);
  const pricePenalty = context?.budgetPriority === 'low'
    ? Math.min(primitive.price / 250, 80)
    : context?.budgetPriority === 'premium'
      ? Math.max(0, 12 - Math.min(primitive.price / 1000, 12))
    : Math.min(primitive.price / 1000, 12);

  return (
    (localRank >= 0 ? 200 - localRank * 8 : 0) +
    (primitive.isHot ? 16 : 0) +
    Math.min(primitive.schedule.departureDates.length, 6) * 3 +
    (primitive.schedule.hasRecurringScheduleText ? 5 : 0) +
    (primitive.rating || 0) * 2 -
    pricePenalty
  );
}

function getPricePercentile(price: number, sortedPrices: number[]) {
  if (!Number.isFinite(price) || sortedPrices.length === 0) return null;
  const cheaperOrEqualCount = sortedPrices.filter((value) => value <= price).length;
  return Math.round((cheaperOrEqualCount / sortedPrices.length) * 100);
}

function annotateCandidatePrimitive(
  primitive: RecommendationPrimitive,
  intent: AiTravelIntent | null,
  sortedPrices: number[],
  matchStatus: CandidateAuditPrimitive['matchStatus'],
) {
  return {
    ...primitive,
    matchStatus,
    conflictReasons: getPrimitiveConflictReasons(intent, primitive),
    priceContext: {
      poolPercentile: getPricePercentile(primitive.price, sortedPrices),
      pricePerDay: primitive.tripDays > 0 ? Math.round(primitive.price / primitive.tripDays) : null,
    },
  } satisfies CandidateAuditPrimitive;
}

function readStoredAiConfig(): StoredAiProviderConfig {
  if (typeof window === 'undefined') return {};

  try {
    return JSON.parse(window.localStorage.getItem(AI_CONFIG_STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

export function getAiProviderConfig(): StoredAiProviderConfig {
  return readStoredAiConfig();
}

export function saveAiProviderConfig(config: StoredAiProviderConfig) {
  if (typeof window === 'undefined') return;

  const cleaned = Object.fromEntries(
    Object.entries(config).filter(([, value]) => typeof value === 'string' && value.trim()),
  );

  window.localStorage.setItem(AI_CONFIG_STORAGE_KEY, JSON.stringify(cleaned));
}

export function clearAiProviderConfig() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(AI_CONFIG_STORAGE_KEY);
}

function getResolvedAiConfig(override?: Partial<AiProviderConfig>): AiProviderConfig | null {
  const stored = readStoredAiConfig();
  const config = {
    apiKey:
      override?.apiKey ||
      stored.apiKey ||
      import.meta.env.VITE_AI_DEFAULT_API_KEY ||
      '',
    baseUrl:
      override?.baseUrl ||
      stored.baseUrl ||
      import.meta.env.VITE_AI_DEFAULT_BASE_URL ||
      '',
    model:
      override?.model ||
      stored.model ||
      import.meta.env.VITE_AI_DEFAULT_MODEL ||
      '',
  };

  if (!config.apiKey || !config.baseUrl || !config.model) return null;
  return config;
}

function compactCandidates(
  tours: AiRecommendationCandidate[],
  localItems: AiRecommendationItem[],
  intent: AiTravelIntent | null = null,
  context?: RecommendationContext,
) {
  const primitives = tours.map(buildTourPrimitive);
  const sortedPrices = primitives
    .map((primitive) => primitive.price)
    .filter((price) => Number.isFinite(price) && price > 0)
    .sort((a, b) => a - b);
  const hasDestinationIntent = Boolean(intent?.destinationHints?.length);
  const destinationMatches = hasDestinationIntent
    ? primitives.filter((primitive) => primitiveMatchesDestination(intent, primitive))
    : primitives;
  const strictMatches = destinationMatches.filter((primitive) => intentMatchesPrimitive(intent, primitive));
  const softConflicts = (hasDestinationIntent && destinationMatches.length > 0
    ? destinationMatches.filter((primitive) => !strictMatches.some((match) => match.id === primitive.id))
    : primitives.filter((primitive) => !strictMatches.some((match) => match.id === primitive.id)))
    .sort((a, b) => rankPrimitive(b, localItems, context) - rankPrimitive(a, localItems, context))
    .slice(0, Math.max(24, Math.floor(MAX_AI_CANDIDATES * 0.25)));
  const fallbackPool = primitives
    .filter((primitive) =>
      !strictMatches.some((match) => match.id === primitive.id) &&
      !softConflicts.some((match) => match.id === primitive.id),
    )
    .sort((a, b) => rankPrimitive(b, localItems, context) - rankPrimitive(a, localItems, context))
    .slice(0, 12);

  return [
    ...strictMatches
      .sort((a, b) => rankPrimitive(b, localItems, context) - rankPrimitive(a, localItems, context))
      .map((primitive) => annotateCandidatePrimitive(primitive, intent, sortedPrices, 'match')),
    ...softConflicts.map((primitive) => annotateCandidatePrimitive(primitive, intent, sortedPrices, 'soft_conflict')),
    ...fallbackPool.map((primitive) => annotateCandidatePrimitive(primitive, intent, sortedPrices, 'fallback')),
  ]
    .slice(0, MAX_AI_CANDIDATES);
}

function extractRecentUserTexts(messages: AiRecommendationMessage[], limit = 6) {
  return messages
    .filter((message) => message.role === 'user')
    .slice(-limit)
    .map((message) => message.content.trim())
    .filter(Boolean);
}

function parseDateString(value: string | null | undefined) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDateInput(value: Date) {
  return value.toISOString().slice(0, 10);
}

function getEarliestDate(values: Array<string | null | undefined>) {
  const parsed = values
    .map(parseDateString)
    .filter((value): value is Date => Boolean(value))
    .sort((a, b) => a.getTime() - b.getTime());

  return parsed[0] ? formatDateInput(parsed[0]) : undefined;
}

function getLikelyTravelDate(text: string, tours: AiRecommendationCandidate[]) {
  if (/(未来7天|未来七天|近7天|近七天|最近|这周|本周|这几天)/.test(text)) {
    return new Date().toISOString().slice(0, 10);
  }

  return tours.find((tour) => tour.departureDate)?.departureDate;
}

function resolveWeatherContext(params: {
  text: string;
  messages: AiRecommendationMessage[];
  searchQuery: string;
  activeFilters: FilterState;
  preferenceMemory: AiPreferenceMemory | null | undefined;
  tours: AiRecommendationCandidate[];
}) {
  const inferredFrom: string[] = [];
  const recentUserTexts = extractRecentUserTexts(params.messages);
  const destinationSources = [
    params.text,
    ...recentUserTexts,
    params.searchQuery,
    params.activeFilters.destination,
    ...(params.preferenceMemory?.destinationHints || []),
  ].filter(Boolean);

  let destination = '';
  for (const sourceText of destinationSources) {
    const [hint] = collectDestinationHints(sourceText);
    if (hint) {
      destination = hint;
      if (sourceText === params.text) {
        inferredFrom.push('当前提问');
      } else if (recentUserTexts.includes(sourceText)) {
        inferredFrom.push('近期对话');
      } else if (sourceText === params.searchQuery) {
        inferredFrom.push('搜索词');
      } else if (sourceText === params.activeFilters.destination) {
        inferredFrom.push('当前筛选');
      } else {
        inferredFrom.push('偏好记忆');
      }
      break;
    }
  }

  if (!destination) {
    destination = DEFAULT_DEPARTURE_CITY;
    inferredFrom.push('默认出发地');
  }

  const prefersCurrentDate = /(未来7天|未来七天|近7天|近七天|最近|这周|本周|这几天|当前|现在|这个月|本月)/.test(
    [params.text, ...recentUserTexts].join(' '),
  );
  let travelDate: string | undefined;

  if (prefersCurrentDate) {
    travelDate = formatDateInput(new Date());
    inferredFrom.push('当前日期');
  } else {
    travelDate =
      params.activeFilters.departureDateStart ||
      params.activeFilters.departureDate ||
      getEarliestDate([
        params.activeFilters.departureDateStart,
        params.activeFilters.departureDate,
        params.activeFilters.departureDateEnd,
      ]) ||
      getEarliestDate(params.tours.flatMap((tour) => [
        tour.departureDate,
        ...(tour.departureDates || []),
        ...(tour.hotDepartureDates || []),
      ])) ||
      getLikelyTravelDate(params.text, params.tours);

    if (travelDate) {
      if (params.activeFilters.departureDateStart || params.activeFilters.departureDate || params.activeFilters.departureDateEnd) {
        inferredFrom.push('出发日期筛选');
      } else {
        inferredFrom.push('候选线路班期');
      }
    }
  }

  return {
    destination,
    travelDate,
    inferredFrom: uniqueStrings(inferredFrom),
  };
}

function getDestinationBestSeasonNote(destination: string, corpus = '') {
  const text = `${destination} ${corpus}`;

  if (/(北海道|新疆|喀纳斯|九寨沟|额济纳|稻城|川西)/.test(text)) {
    return '这类目的地观赏体验通常对季节窗口很敏感，旺季景观更强，但天气、温差和人流波动也更明显。';
  }
  if (/(三亚|海南|海岛|普吉|巴厘|长滩|沙巴|仙本那|芽庄)/.test(text)) {
    return '海岛和海边玩法更依赖晴天、风浪和降雨窗口，连续降雨、强对流或台风天会明显影响体验。';
  }
  if (/(桂林|贵州|云南|张家界|黄山|草原|呼伦贝尔|香格里拉)/.test(text)) {
    return '山水和高原草原类目的地通常存在更明显的观赏期与雨季差异，能见度、路况和体感温差都值得单独判断。';
  }
  if (/(樱花|红叶|赏花|花海|银杏|雪景|冰雪|避暑)/.test(text)) {
    return '这类主题本身就依赖最佳观赏期，建议结合天气与季节窗口一起判断，不宜只看价格。';
  }

  return '如目的地玩法明显依赖景观窗口、晴雨条件或季节体感，建议把天气与观赏期作为排序因子一起考虑。';
}

function shouldInspectDestinationWeather(tour: AiRecommendationCandidate, searchCorpus: string) {
  const text = `${tour.destination} ${tour.theme} ${tour.title} ${searchCorpus}`;
  return /(海岛|海边|沙滩|潜水|浮潜|玩水|漂流|峡谷|山水|草原|雪|冰|温泉|避暑|赏花|花海|红叶|樱花|银杏|日出|星空|摄影|自然)/
    .test(text);
}

function buildDestinationWeatherCandidates(
  tours: AiRecommendationCandidate[],
  localItems: AiRecommendationItem[],
  searchQuery: string,
  intent: AiTravelIntent | null,
) {
  const scoreByTourId = new Map(localItems.map((item) => [item.tourId, item.score]));
  const grouped = new Map<string, {
    destination: string;
    score: number;
    evidence: string[];
    corpus: string;
  }>();

  for (const tour of tours.slice(0, 80)) {
    const corpus = getSearchCorpus(tour);
    const destination = getAtlasRegions(tour)[0] || tour.destination;
    if (!destination) continue;
    if (!shouldInspectDestinationWeather(tour, corpus)) continue;

    const relevance =
      (scoreByTourId.get(tour.id) || 0) +
      (tour.isHot ? 6 : 0) +
      (intent?.destinationHints?.length && destinationHintsMatchCorpus(intent.destinationHints, `${tour.destination} ${tour.title}`) ? 16 : 0) +
      (searchQuery && corpus.includes(searchQuery.toLowerCase()) ? 8 : 0);
    const existing = grouped.get(destination) || {
      destination,
      score: 0,
      evidence: [],
      corpus,
    };

    existing.score = Math.max(existing.score, relevance);
    existing.corpus = `${existing.corpus} ${corpus}`.slice(0, 500);
    existing.evidence = uniqueStrings([
      ...existing.evidence,
      tour.theme,
      ...tour.tags.slice(0, 2),
      ...tour.highlights.slice(0, 2),
    ]).slice(0, 6);
    grouped.set(destination, existing);
  }

  return [...grouped.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);
}

function isSouthChinaHotRainySeason(destination: string, month: number) {
  if (![5, 6, 7, 8, 9, 10].includes(month)) return false;

  return ['广东', '广州', '深圳', '珠海', '佛山', '东莞', '中山', '惠州', '海南', '三亚', '海口', '广西']
    .some((name) => destination.includes(name));
}

function getSeasonAdvice(destination: string, travelDate?: string) {
  const month = travelDate ? new Date(travelDate).getMonth() + 1 : new Date().getMonth() + 1;
  const advice: string[] = [];

  if (isSouthChinaHotRainySeason(destination, month)) {
    advice.push('华南此时通常已经进入闷热多雨阶段，体感更接近夏季，选线路时应优先考虑避暑、遮阳、防雨和室内外搭配。');
    advice.push('广东、海南和沿海线路要额外关注强降雨、雷暴和台风预警，海边、玩水和长时间暴晒项目不宜盲目优先。');
  }

  if ([6, 7, 8, 9].includes(month)) {
    advice.push('夏秋季需关注高温、暴雨和沿海台风风险，老人亲子优先选择节奏轻、室内外搭配合理的线路。');
    if (['贵州', '云南', '桂林', '四川'].some((name) => destination.includes(name))) {
      advice.push('山水和高海拔目的地相对适合避暑，但雨季要留意山路和漂流类活动安排。');
    }
    if (['三亚', '海南', '广东'].some((name) => destination.includes(name))) {
      advice.push('海岛和沿海线路要结合天气预警判断，遇到台风或强降雨应降低推荐优先级。');
    }
  }

  if ([11, 12, 1, 2].includes(month)) {
    advice.push('冬季适合温泉、南方暖线、冰雪主题；高海拔和北方线路要关注低温、结冰和交通延误。');
    if (['西藏', '新疆', '四川'].some((name) => destination.includes(name))) {
      advice.push('高海拔或长距离线路不宜盲目推荐给老人、儿童或怕冷用户。');
    }
  }

  if ([3, 4, 5].includes(month) && !isSouthChinaHotRainySeason(destination, month)) {
    advice.push('春季适合踏青赏花、山水自然和短途休闲，但南方回南天和连续降雨会影响体验。');
  }

  if (advice.length === 0) {
    advice.push('按出发月份、目的地气候和用户同行人群综合判断舒适度。');
  }

  return advice;
}

function findCoords(destination: string) {
  const entry = Object.entries(DESTINATION_COORDS).find(([name]) => destination.includes(name));
  return entry?.[1] || DESTINATION_COORDS[destination];
}

async function fetchWeatherContext(
  params: {
    text: string;
    messages: AiRecommendationMessage[];
    searchQuery: string;
    activeFilters: FilterState;
    preferenceMemory: AiPreferenceMemory | null | undefined;
    tours: AiRecommendationCandidate[];
  },
): Promise<AiWeatherContext> {
  const { destination, travelDate, inferredFrom } = resolveWeatherContext(params);
  return fetchDestinationWeatherInsight({
    destination,
    travelDate,
    inferredFrom,
    role: 'departure',
    queryReason: inferredFrom?.includes('默认出发地')
      ? '默认作为广州出发天气与出行风险提示'
      : '根据当前上下文推断的主天气锚点',
  });
}

async function fetchDestinationWeatherInsight(params: {
  destination: string;
  travelDate?: string;
  inferredFrom?: string[];
  role: 'departure' | 'destination';
  queryReason?: string;
  corpus?: string;
}): Promise<DestinationWeatherInsight> {
  const seasonAdvice = getSeasonAdvice(params.destination, params.travelDate);
  const coords = findCoords(params.destination);
  const bestSeasonNote = getDestinationBestSeasonNote(params.destination, params.corpus || '');

  if (!params.destination || !coords) {
    return {
      destination: params.destination,
      travelDate: params.travelDate,
      forecastSummary: '未匹配到可查询天气的目的地，使用季节和世界知识辅助判断。',
      seasonAdvice,
      inferredFrom: params.inferredFrom,
      queryReason: params.queryReason,
      bestSeasonNote,
      role: params.role,
      source: 'seasonal-rule',
    };
  }

  try {
    const query = new URLSearchParams({
      latitude: String(coords.latitude),
      longitude: String(coords.longitude),
      daily: 'temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code',
      timezone: 'auto',
      forecast_days: '7',
    });
    const response = await fetch(`https://api.open-meteo.com/v1/forecast?${query.toString()}`);
    if (!response.ok) throw new Error(`Weather API failed: ${response.status}`);

    const data = await response.json();
    const daily = data.daily;
    const maxTemps: number[] = daily?.temperature_2m_max ?? [];
    const minTemps: number[] = daily?.temperature_2m_min ?? [];
    const rainProbs: number[] = daily?.precipitation_probability_max ?? [];
    const maxTemp = Math.round(Math.max(...maxTemps));
    const minTemp = Math.round(Math.min(...minTemps));
    const maxRain = Math.round(Math.max(...rainProbs));

    return {
      destination: params.destination,
      travelDate: params.travelDate,
      forecastSummary: `${params.destination}未来7天约 ${minTemp}-${maxTemp}℃，最高降水概率约 ${maxRain}%。`,
      seasonAdvice,
      inferredFrom: params.inferredFrom,
      queryReason: params.queryReason,
      bestSeasonNote,
      role: params.role,
      source: 'open-meteo',
    };
  } catch {
    return {
      destination: params.destination,
      travelDate: params.travelDate,
      forecastSummary: '天气接口暂时不可用，使用季节和世界知识辅助判断。',
      seasonAdvice,
      inferredFrom: params.inferredFrom,
      queryReason: params.queryReason,
      bestSeasonNote,
      role: params.role,
      source: 'seasonal-rule',
    };
  }
}

function buildAiMessages(params: {
  userText: string;
  messages: AiRecommendationMessage[];
  candidates: ReturnType<typeof compactCandidates>;
  routeAtlas: RouteAtlas;
  auditContext: RecommendationAuditContext;
  weatherContext: AiWeatherContext;
  destinationWeatherInsights: DestinationWeatherInsight[];
  searchQuery: string;
  intent: AiTravelIntent | null;
  preferenceMemory: AiPreferenceMemory | null;
}) {
  const systemPrompt = [
    '你是旅行团推荐顾问，需要根据用户需求、天气、季节、目的地常识和给定旅行团候选列表推荐线路。',
    '只能推荐候选列表中真实存在的 tourId，不允许编造线路、价格、班期或服务。',
    '候选里的 schedule、tripDays、price、destination、theme、leisureLevel 是推荐原语，请优先用这些结构化原语判断硬条件。',
    'candidateTours 里的 matchStatus=match 表示完全匹配；soft_conflict/fallback 带有 conflictReasons，只能在没有足够 match 或需要说明取舍时靠后使用。',
    'routeAtlas 是全站线路地图，用来理解哪些区域/主题通常有哪些天数和价格；但最终 items 仍只能来自 candidateTours。',
    'auditContext 提供上一轮推荐摘要、有效候选池价格分布和业务知识；处理“便宜点、轻松点、再近点”等短句时，必须结合 auditContext 和 preferenceMemory 继承上下文。',
    '如果用户需求与全站线路地图明显冲突，例如预算或天数不现实，请在 summary 里说明取舍，并推荐最接近的真实候选。',
    '例如用户说“周五晚上出发的3日游”，应理解为 departureWeekdays 包含 5、hasEveningOrNightDeparture 为 true、tripDays 为 3。',
    '天气和世界知识只用于判断舒适度、风险和适配理由；线路事实必须来自候选列表和推荐原语。',
    '如果用户提到老人、儿童、轻松、怕累，应降低高强度、长途奔波和极端天气目的地优先级。',
    '如果天气或季节不适合，要在理由中说明风险，并优先推荐更稳妥的候选。',
    'summary 必须优先反映 weatherContext 的真实结论；如果已出现高温、闷热、暴雨或台风风险，不要再写成“春季踏青”这类泛化判断。',
    'weatherContext.destination、travelDate 和 inferredFrom 是从当前提问、近几轮对话、搜索词、筛选器、偏好记忆和候选线路池综合推断出的上下文；回答天气和季节时优先依赖这些上下文，不要只看最后一句字面。',
    '如果 inferredFrom 包含“默认出发地”，就把 weatherContext 当作广州出发天气和出行风险提示，不要把这份天气表述成所有候选目的地的实时天气。',
    'destinationWeatherInsights 是针对少数高相关、明显受天气或最佳观赏期影响的目的地补充查询结果。你应自行决定哪些结果值得引用，并利用世界知识判断是否处于更合适的观赏窗口。',
    '严格输出 JSON，不要 Markdown，不要额外解释。',
  ].join('\n');

  const userPayload = {
    task: `从 candidateTours 中选出所有适合的旅行团，按适合程度排序；只给前 ${MAX_AI_COMMENTARY_ITEMS} 条写 reason 和 matchedSignals，其余条目只需要 tourId 和 score。`,
    outputSchema: {
      summary: '一句中文总结，说明推荐依据',
      items: [
        {
          tourId: '候选列表里的 id',
          score: '0-100 的数字',
          reason: `仅前 ${MAX_AI_COMMENTARY_ITEMS} 条需要，一句中文推荐理由，结合用户需求/天气/季节/线路特点`,
          matchedSignals: `仅前 ${MAX_AI_COMMENTARY_ITEMS} 条需要，3到5个中文匹配信号`,
        },
      ],
    },
    userNeed: params.userText,
    searchQuery: params.searchQuery,
    recentConversation: params.messages.slice(-8).map(({ role, content }) => ({ role, content })),
    preferenceMemory: params.preferenceMemory,
    interpretedIntent: params.intent,
    weatherContext: params.weatherContext,
    destinationWeatherInsights: params.destinationWeatherInsights,
    routeAtlas: params.routeAtlas,
    auditContext: params.auditContext,
    candidateTours: params.candidates,
  };

  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: JSON.stringify(userPayload) },
  ];
}

function buildIntentMessages(params: {
  userText: string;
  messages: AiRecommendationMessage[];
  searchQuery: string;
  preferenceMemory: AiPreferenceMemory | null;
  auditContext: RecommendationAuditContext;
}) {
  return [
    {
      role: 'system',
      content: [
        '你负责把旅行团自然语言需求理解成结构化意图。',
        '不要推荐线路，只抽取约束和偏好。',
        '如果用户这轮明确提出新的目的地或区域，优先把它视为覆盖旧目的地；预算、天数、出行风格等可从 existingPreferenceMemory 继承。',
        '如果用户本轮是“便宜点、再便宜、贵一点、轻松点、更多选择”等相对表达，不要丢弃上一轮上下文；用 refinementMode 表达它是在上一轮基础上收窄、放宽或换方向。',
        'budgetPriority 表示相对价格偏好：low=更便宜/性价比优先，balanced=均衡，premium=更舒适或高预算；不要用关键词硬猜，要结合 recentConversation 和 auditContext 判断。',
        'weekday 使用 0-6 表示周日到周六；周五是 5。',
        '如果用户说晚上、晚、夜发、夜间、周五晚，departureTimeOfDay 应为 evening 或 night。',
        '如果不确定就留 null 或空数组，不要硬猜。',
        '严格输出 JSON，不要 Markdown。',
      ].join('\n'),
    },
    {
      role: 'user',
      content: JSON.stringify({
        outputSchema: {
          tripDays: '精确行程天数，数字或 null',
          tripDaysMin: '最少天数，数字或 null',
          tripDaysMax: '最多天数，数字或 null',
          departureWeekdays: '出发星期数组，0=周日，5=周五',
          departureTimeOfDay: 'morning|afternoon|evening|night|any|null',
          destinationHints: ['目的地词'],
          budgetMin: '最低预算或 null',
          budgetMax: '最高预算或 null',
          travelStyle: ['亲子、老人、轻松、徒步、海边等偏好'],
          mustHave: ['必须满足的条件'],
          avoid: ['需要避开的条件'],
          weatherSensitivity: ['怕热、避雨、台风风险、避寒等'],
          budgetPriority: 'low|balanced|premium|null',
          refinementMode: 'new_search|refine_previous|broaden|replace_destination|null',
          confidence: '0-1',
        },
        userNeed: params.userText,
        searchQuery: params.searchQuery,
        existingPreferenceMemory: params.preferenceMemory,
        auditContext: params.auditContext,
        recentConversation: params.messages.slice(-8).map(({ role, content }) => ({ role, content })),
      }),
    },
  ];
}

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.replace(/\/$/, '');
}

function getChatCompletionsUrl(baseUrl: string) {
  const normalized = normalizeBaseUrl(baseUrl);
  if (normalized.endsWith('/chat/completions')) return normalized;
  if (normalized.endsWith('/v1')) return `${normalized}/chat/completions`;
  return `${normalized}/v1/chat/completions`;
}

function parseAiJson(content: string) {
  try {
    return JSON.parse(content);
  } catch {
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('AI response is not JSON');
    return JSON.parse(match[0]);
  }
}

function emitProgress(
  callback: AiRecommendationRequest['onProgress'],
  progress: AiRecommendationProgress,
) {
  callback?.(progress);
}

export const __aiRecommendationTestHooks = {
  auditAiRecommendations,
  buildTourPrimitive,
  compactCandidates,
  getPrimitiveConflictReasons,
  mergeAiAndLocalRecommendations,
  mergeIntentWithMemory,
  normalizeIntent,
  validateAiItems,
};

function validateAiItems(
  value: unknown,
  candidateTours: AiRecommendationCandidate[],
): AiRecommendationItem[] {
  const candidateIds = new Set(candidateTours.map((tour) => tour.id));
  const rawItems = Array.isArray((value as { items?: unknown[] })?.items)
    ? (value as { items: unknown[] }).items
    : [];

  return rawItems
    .map((item) => item as Partial<AiRecommendationItem>)
    .filter((item) => item.tourId && candidateIds.has(item.tourId))
    .map((item, index) => ({
      tourId: String(item.tourId),
      score: Number.isFinite(Number(item.score)) ? Number(item.score) : 80 - index,
      reason: index < MAX_AI_COMMENTARY_ITEMS
        ? item.reason?.trim() || '综合用户需求、天气和线路特点后较为合适'
        : undefined,
      matchedSignals: index < MAX_AI_COMMENTARY_ITEMS && Array.isArray(item.matchedSignals)
        ? item.matchedSignals.map(String).slice(0, 5)
        : index < MAX_AI_COMMENTARY_ITEMS ? ['AI综合推荐'] : [],
    }));
}

function getConflictSeverity(reasons: string[]) {
  return reasons.reduce((severity, reason) => {
    if (reason.startsWith('目的地不匹配')) return severity + 60;
    if (reason.startsWith('价格高于') || reason.startsWith('价格低于')) return severity + 18;
    if (reason.startsWith('天数')) return severity + 14;
    if (reason.startsWith('缺少') || reason.startsWith('未识别')) return severity + 10;
    return severity + 8;
  }, 0);
}

function getAuditNote(reasons: string[]) {
  if (reasons.length === 0) return null;
  const visibleReasons = reasons.slice(0, 2).join('；');
  return `审计提示：${visibleReasons}`;
}

function auditAiRecommendations(
  aiItems: AiRecommendationItem[],
  localItems: AiRecommendationItem[],
  candidateTours: AiRecommendationCandidate[],
  intent: AiTravelIntent | null,
): AiRecommendationItem[] {
  const primitiveByTourId = new Map(candidateTours.map((tour) => [tour.id, buildTourPrimitive(tour)]));
  const auditedAiItems: AiRecommendationItem[] = [];

  for (const item of aiItems) {
    const primitive = primitiveByTourId.get(item.tourId);
    if (!primitive) continue;

    const conflictReasons = getPrimitiveConflictReasons(intent, primitive);
    const conflictSeverity = getConflictSeverity(conflictReasons);
    const auditNote = getAuditNote(conflictReasons);
    const score = Math.max(0, item.score - conflictSeverity);
    if (score <= 0) continue;

    auditedAiItems.push({
      ...item,
      score,
      reason: auditNote && item.reason
        ? `${item.reason}（${auditNote.replace('审计提示：', '')}）`
        : item.reason,
      matchedSignals: auditNote
        ? [...item.matchedSignals.filter((signal) => !signal.startsWith('审计提示')), auditNote].slice(0, 5)
        : item.matchedSignals,
    });
  }

  const auditedIds = new Set(auditedAiItems.map((item) => item.tourId));
  const supplementalItems = localItems
    .filter((item) => !auditedIds.has(item.tourId))
    .map((item) => {
      const primitive = primitiveByTourId.get(item.tourId);
      const conflictReasons = primitive ? getPrimitiveConflictReasons(intent, primitive) : [];
      const conflictSeverity = getConflictSeverity(conflictReasons);
      return {
        ...item,
        score: Math.max(0, item.score - conflictSeverity),
      };
    })
    .filter((item) => item.score > 0)
    .slice(0, 24);

  return [...auditedAiItems, ...supplementalItems].sort((a, b) => b.score - a.score);
}

function normalizeIntent(value: unknown): AiTravelIntent | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as AiTravelIntent;
  return {
    tripDays: raw.tripDays ? Number(raw.tripDays) : null,
    tripDaysMin: raw.tripDaysMin ? Number(raw.tripDaysMin) : null,
    tripDaysMax: raw.tripDaysMax ? Number(raw.tripDaysMax) : null,
    departureWeekdays: Array.isArray(raw.departureWeekdays)
      ? raw.departureWeekdays.map(Number).filter((day) => Number.isInteger(day) && day >= 0 && day <= 6)
      : [],
    departureTimeOfDay: raw.departureTimeOfDay || null,
    destinationHints: Array.isArray(raw.destinationHints) ? raw.destinationHints.map(String).filter(Boolean) : [],
    budgetMin: raw.budgetMin ? Number(raw.budgetMin) : null,
    budgetMax: raw.budgetMax ? Number(raw.budgetMax) : null,
    travelStyle: Array.isArray(raw.travelStyle) ? raw.travelStyle.map(String).filter(Boolean) : [],
    mustHave: Array.isArray(raw.mustHave) ? raw.mustHave.map(String).filter(Boolean) : [],
    avoid: Array.isArray(raw.avoid) ? raw.avoid.map(String).filter(Boolean) : [],
    weatherSensitivity: Array.isArray(raw.weatherSensitivity)
      ? raw.weatherSensitivity.map(String).filter(Boolean)
      : [],
    budgetPriority: ['low', 'balanced', 'premium'].includes(String(raw.budgetPriority))
      ? raw.budgetPriority as AiTravelIntent['budgetPriority']
      : null,
    refinementMode: ['new_search', 'refine_previous', 'broaden', 'replace_destination'].includes(String(raw.refinementMode))
      ? raw.refinementMode as AiTravelIntent['refinementMode']
      : null,
    confidence: Number.isFinite(Number(raw.confidence)) ? Number(raw.confidence) : undefined,
  };
}

function normalizeDepartureTimeOfDay(value: unknown): AiTravelIntent['departureTimeOfDay'] {
  return ['morning', 'afternoon', 'evening', 'night', 'any'].includes(String(value))
    ? value as AiTravelIntent['departureTimeOfDay']
    : null;
}

function mergeIntentWithMemory(
  intent: AiTravelIntent | null,
  memory: AiPreferenceMemory | null | undefined,
): AiTravelIntent | null {
  if (!intent && !memory) return null;

  return {
    ...(intent || {}),
    destinationHints: intent?.destinationHints?.length ? intent.destinationHints : memory?.destinationHints || [],
    travelStyle: intent?.travelStyle?.length ? intent.travelStyle : memory?.travelStyle || [],
    mustHave: intent?.mustHave?.length ? intent.mustHave : memory?.mustHave || [],
    avoid: intent?.avoid?.length ? intent.avoid : memory?.avoid || [],
    weatherSensitivity: intent?.weatherSensitivity?.length
      ? intent.weatherSensitivity
      : memory?.weatherSensitivity || [],
    budgetMin: intent?.budgetMin ?? memory?.budgetMin ?? null,
    budgetMax: intent?.budgetMax ?? memory?.budgetMax ?? null,
    budgetPriority: intent?.budgetPriority ?? memory?.budgetPriority ?? null,
    tripDays: intent?.tripDays ?? memory?.tripDays ?? null,
    tripDaysMin: intent?.tripDaysMin ?? memory?.tripDaysMin ?? null,
    tripDaysMax: intent?.tripDaysMax ?? memory?.tripDaysMax ?? null,
    departureWeekdays: intent?.departureWeekdays?.length
      ? intent.departureWeekdays
      : memory?.departureWeekdays || [],
    departureTimeOfDay: normalizeDepartureTimeOfDay(intent?.departureTimeOfDay ?? memory?.departureTimeOfDay),
    refinementMode: intent?.refinementMode ?? memory?.refinementMode ?? null,
  };
}

async function callAiApi(params: {
  config: AiProviderConfig;
  messages: ReturnType<typeof buildAiMessages> | ReturnType<typeof buildIntentMessages>;
}) {
  const response = await fetch(getChatCompletionsUrl(params.config.baseUrl), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${params.config.apiKey}`,
    },
    body: JSON.stringify({
      model: params.config.model,
      messages: params.messages,
      temperature: 0.25,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    throw new Error(`AI API failed: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (typeof content !== 'string') {
    throw new Error('AI API response missing message content');
  }

  return parseAiJson(content);
}

export async function requestAiRecommendations({
  conversationId,
  messages,
  candidateTours,
  activeFilters,
  searchQuery,
  aiConfig,
  preferenceMemory,
  previousResult,
  onProgress,
}: AiRecommendationRequest): Promise<AiRecommendationResult> {
  emitProgress(onProgress, {
    stage: 'queued',
    label: '已收到需求',
    detail: '正在整理你的出发时间、预算、天数和偏好。',
    progress: 12,
    substeps: withActiveSubstep(
      [
        { id: 'capture', label: '接收本次条件' },
        { id: 'normalize', label: '整理预算和天数' },
        { id: 'prepare', label: '准备进入需求理解' },
      ],
      'normalize',
    ),
  });

  const text = getLatestUserText(messages);
  const localIntent = inferLocalIntent(text);
  const inheritedPreferenceMemory = mergePreferenceMemory(preferenceMemory, localIntent);
  const localRecommendationText = buildEffectiveUserText(text, inheritedPreferenceMemory);
  const hasPromptDestination = Boolean(localIntent?.destinationHints?.length);
  const promptMatchesActiveDestination = hasPromptDestination && activeFilters.destination
    ? destinationHintsMatchCorpus(localIntent?.destinationHints, activeFilters.destination)
    : true;
  const filteredCandidates = candidateTours.filter((tour) => {
    if (
      activeFilters.destination &&
      promptMatchesActiveDestination &&
      !tour.destination.includes(activeFilters.destination)
    ) {
      return false;
    }
    if (activeFilters.source && tour.source !== activeFilters.source) return false;
    if (activeFilters.theme && tour.theme !== activeFilters.theme) return false;
    if (activeFilters.duration && activeFilters.duration !== 11 && tour.duration !== activeFilters.duration) return false;
    if (activeFilters.duration === 11 && tour.duration < 11) return false;
    if (activeFilters.minPrice !== null && tour.price < activeFilters.minPrice) return false;
    if (activeFilters.maxPrice !== null && tour.price > activeFilters.maxPrice) return false;
    return true;
  });
  const availableCandidates = filteredCandidates.length > 0 ? filteredCandidates : candidateTours;
  const localItems = localRecommendations(availableCandidates, localRecommendationText);
  const config = getResolvedAiConfig(aiConfig);
  const initialAuditContext = buildRecommendationAuditContext(
    candidateTours,
    previousResult,
    mergeIntentWithMemory(localIntent, inheritedPreferenceMemory),
  );

  emitProgress(onProgress, {
    stage: config ? 'intent' : 'fallback',
    label: config ? '准备调用 AI' : '未配置 AI，改用本地推荐',
    detail: config
      ? `将从 ${availableCandidates.length} 条候选线路中理解需求并生成推荐。`
      : `正在按当前条件从 ${availableCandidates.length} 条候选线路中做规则匹配。`,
    progress: config ? 20 : 100,
    substeps: config
      ? withActiveSubstep(
          [
            { id: 'scope', label: '圈定候选范围' },
            { id: 'intent', label: '提取偏好和约束' },
            { id: 'handoff', label: '准备上下文补充' },
          ],
          'intent',
        )
      : withActiveSubstep(
          [
            { id: 'scope', label: '圈定候选范围' },
            { id: 'rules', label: '按规则筛选线路' },
            { id: 'fallback', label: '生成备用结果' },
          ],
          'rules',
        ),
  });

  if (!config) {
    return {
      conversationId,
      summary: '当前未配置 AI 接口，已先按目的地、预算、天数和行程强度做本地预匹配。',
      items: localItems,
      generatedAt: new Date().toISOString(),
      source: 'local-preview',
      status: {
        mode: 'local-only',
        label: '本次使用本地规则推荐',
        detail: `因为没有可用的 AI 配置，已直接筛出 ${localItems.length} 条候选线路。`,
      },
      preferenceMemory: inheritedPreferenceMemory,
    };
  }

  try {
    const intentResponse = await callAiApi({
      config,
      messages: buildIntentMessages({
        userText: text,
        messages,
        searchQuery,
        preferenceMemory: inheritedPreferenceMemory,
        auditContext: initialAuditContext,
      }),
    });
    const intent = normalizeIntent(intentResponse);
    const nextPreferenceMemory = mergePreferenceMemory(inheritedPreferenceMemory, intent);
    const effectiveIntent = mergeIntentWithMemory(intent, nextPreferenceMemory);
    const effectiveUserText = buildEffectiveUserText(text, nextPreferenceMemory);
    const auditContext = buildRecommendationAuditContext(candidateTours, previousResult, effectiveIntent);
    emitProgress(onProgress, {
      stage: 'context',
      label: '正在补充行程上下文',
      detail: `正在结合天气、季节和候选池信息，范围约 ${availableCandidates.length} 条线路。`,
      progress: 56,
      substeps: withActiveSubstep(
        [
          { id: 'weather', label: '补充天气信息' },
          { id: 'season', label: '结合季节与时令' },
          { id: 'candidate', label: '汇总候选池特征' },
        ],
        'season',
      ),
    });
    const weatherContext = await fetchWeatherContext({
      text: effectiveUserText,
      messages,
      searchQuery,
      activeFilters,
      preferenceMemory: nextPreferenceMemory,
      tours: availableCandidates,
    });
    const destinationWeatherCandidates = buildDestinationWeatherCandidates(
      availableCandidates,
      localItems,
      searchQuery,
      effectiveIntent,
    );
    const destinationWeatherInsights = await Promise.all(
      destinationWeatherCandidates.map((candidate) =>
        fetchDestinationWeatherInsight({
          destination: candidate.destination,
          travelDate: weatherContext.travelDate,
          inferredFrom: ['候选目的地补充查询'],
          role: 'destination',
          queryReason: `该目的地天气和观赏期可能显著影响体验：${candidate.evidence.join(' / ')}`,
          corpus: candidate.corpus,
        }),
      ),
    );
    const compactedCandidates = compactCandidates(
      availableCandidates,
      localItems,
      effectiveIntent,
      { budgetPriority: effectiveIntent?.budgetPriority },
    );
    const routeAtlas = buildRouteAtlas(candidateTours, effectiveIntent);
    emitProgress(onProgress, {
      stage: 'ranking',
      label: '正在生成推荐结果',
      detail: `AI 正在对 ${compactedCandidates.length} 条高相关候选线路做排序和取舍。`,
      progress: 82,
      substeps: withActiveSubstep(
        [
          { id: 'compact', label: '筛出高相关候选' },
          { id: 'rank', label: '结合偏好做排序' },
          { id: 'summary', label: '准备推荐摘要' },
        ],
        'rank',
      ),
    });
    const aiResponse = await callAiApi({
      config,
      messages: buildAiMessages({
        userText: effectiveUserText,
        messages,
        candidates: compactedCandidates,
        routeAtlas,
        auditContext,
        weatherContext,
        destinationWeatherInsights,
        searchQuery,
        intent: effectiveIntent,
        preferenceMemory: nextPreferenceMemory,
      }),
    });
    const aiItems = auditAiRecommendations(
      validateAiItems(aiResponse, availableCandidates),
      localItems,
      availableCandidates,
      effectiveIntent,
    );

    if (aiItems.length === 0) {
      throw new Error('AI returned no valid tour ids');
    }

    const mergedItems = mergeAiAndLocalRecommendations(aiItems, localItems);
    emitProgress(onProgress, {
      stage: 'completed',
      label: '推荐结果已生成',
      detail: `已完成排序，并置顶 ${mergedItems.length} 条候选线路。`,
      progress: 100,
      substeps: withActiveSubstep(
        [
          { id: 'ranked', label: '排序结果已完成' },
          { id: 'top', label: '置顶匹配线路' },
          { id: 'ready', label: '返回推荐摘要' },
        ],
        'ready',
      ),
    });

    return {
      conversationId,
      summary:
        typeof aiResponse.summary === 'string' && aiResponse.summary.trim()
          ? aiResponse.summary.trim()
          : '已结合用户需求、天气、季节和线路特点生成推荐。',
      items: mergedItems,
      generatedAt: new Date().toISOString(),
      source: 'ai-api',
      status: {
        mode: 'ai',
        label: 'AI 已完成推荐',
        detail: `已结合需求理解、天气和候选线路排序，输出 ${mergedItems.length} 条结果。`,
      },
      preferenceMemory: nextPreferenceMemory,
    };
  } catch {
    emitProgress(onProgress, {
      stage: 'fallback',
      label: 'AI 暂不可用，已切换备用方案',
      detail: `正在按本地规则从 ${availableCandidates.length} 条候选线路里给出可用结果。`,
      progress: 100,
      substeps: withActiveSubstep(
        [
          { id: 'detect', label: '检测 AI 不可用' },
          { id: 'rules', label: '切换本地规则' },
          { id: 'return', label: '返回备用推荐' },
        ],
        'return',
      ),
    });

    return {
      conversationId,
      summary: 'AI 接口暂时不可用，已先使用本地规则按需求做预匹配。',
      items: localItems,
      generatedAt: new Date().toISOString(),
      source: 'local-preview',
      status: {
        mode: 'fallback',
        label: 'AI 未完成，本次已降级到本地推荐',
        detail: `为了不中断结果展示，已先返回 ${localItems.length} 条本地规则筛选结果。`,
      },
      preferenceMemory: inheritedPreferenceMemory,
    };
  }
}
