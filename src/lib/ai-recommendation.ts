import type {
  AiProviderConfig,
  AiRecommendationCandidate,
  AiRecommendationItem,
  AiRecommendationMessage,
  AiRecommendationRequest,
  AiRecommendationResult,
  AiWeatherContext,
} from '@/types/tour';

const AI_CONFIG_STORAGE_KEY = 'travel-ai-provider-config';
const MAX_AI_CANDIDATES = 120;

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

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

function getLatestUserText(messages: AiRecommendationMessage[]) {
  return messages
    .filter((message) => message.role === 'user')
    .map((message) => message.content)
    .join(' ');
}

function parseBudget(text: string) {
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
    if (tour.destination.includes(hint) || corpus.includes(normalizeText(hint))) {
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
    .slice(0, 6)
    .map((tour, index) => ({
      tourId: tour.id,
      score: 10 - index,
      reason: tour.isHot ? '热门线路，适合作为推荐备选' : '综合热度和价格表现较稳',
      matchedSignals: tour.isHot ? ['热门线路'] : ['综合排序靠前'],
    }));
}

function localRecommendations(tours: AiRecommendationCandidate[], text: string) {
  const normalizedText = normalizeText(text);
  const items = tours
    .map((tour) => scoreTour(tour, normalizedText))
    .filter((item): item is AiRecommendationItem => Boolean(item))
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  return items.length > 0 ? items : fallbackRecommendations(tours);
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
) {
  const tourById = new Map(tours.map((tour) => [tour.id, tour]));
  const ranked = localItems
    .map((item) => tourById.get(item.tourId))
    .filter((tour): tour is AiRecommendationCandidate => Boolean(tour));
  const rankedIds = new Set(ranked.map((tour) => tour.id));
  const rest = tours.filter((tour) => !rankedIds.has(tour.id));
  const selected = [...ranked, ...rest].slice(0, MAX_AI_CANDIDATES);

  return selected.map((tour) => ({
    id: tour.id,
    title: tour.title,
    source: tour.source,
    destination: tour.destination,
    duration: tour.duration,
    price: tour.price,
    departureDate: tour.departureDate,
    transportType: tour.transportType,
    accommodationLevel: tour.accommodationLevel,
    meals: tour.meals,
    highlights: tour.highlights?.slice(0, 4) ?? [],
    tags: tour.tags?.slice(0, 6) ?? [],
    isHot: tour.isHot,
    theme: tour.theme,
    suitableFor: tour.suitableFor?.slice(0, 4) ?? [],
    leisureLevel: tour.leisureLevel,
    season: tour.season,
    rating: tour.rating,
    groupSize: tour.groupSize,
    hotDepartureDates: tour.hotDepartureDates?.slice(0, 6) ?? [],
  }));
}

function getLikelyDestination(text: string, tours: AiRecommendationCandidate[]) {
  const [hint] = collectDestinationHints(text);
  if (hint) return hint;

  const destinationCounts = new Map<string, number>();
  for (const tour of tours.slice(0, 40)) {
    if (!tour.destination) continue;
    destinationCounts.set(tour.destination, (destinationCounts.get(tour.destination) || 0) + 1);
  }

  return [...destinationCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || '';
}

function getLikelyTravelDate(tours: AiRecommendationCandidate[]) {
  return tours.find((tour) => tour.departureDate)?.departureDate;
}

function getSeasonAdvice(destination: string, travelDate?: string) {
  const month = travelDate ? new Date(travelDate).getMonth() + 1 : new Date().getMonth() + 1;
  const advice: string[] = [];

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

  if ([3, 4, 5].includes(month)) {
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
  text: string,
  tours: AiRecommendationCandidate[],
): Promise<AiWeatherContext> {
  const destination = getLikelyDestination(text, tours);
  const travelDate = getLikelyTravelDate(tours);
  const seasonAdvice = getSeasonAdvice(destination, travelDate);
  const coords = findCoords(destination);

  if (!destination || !coords) {
    return {
      destination,
      travelDate,
      forecastSummary: '未匹配到可查询天气的目的地，使用季节和目的地常识辅助判断。',
      seasonAdvice,
      source: 'seasonal-rule',
    };
  }

  try {
    const params = new URLSearchParams({
      latitude: String(coords.latitude),
      longitude: String(coords.longitude),
      daily: 'temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code',
      timezone: 'auto',
      forecast_days: '7',
    });
    const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);
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
      destination,
      travelDate,
      forecastSummary: `${destination}未来7天约 ${minTemp}-${maxTemp}℃，最高降水概率约 ${maxRain}%。`,
      seasonAdvice,
      source: 'open-meteo',
    };
  } catch {
    return {
      destination,
      travelDate,
      forecastSummary: '天气接口暂时不可用，使用季节和目的地常识辅助判断。',
      seasonAdvice,
      source: 'seasonal-rule',
    };
  }
}

function buildAiMessages(params: {
  userText: string;
  messages: AiRecommendationMessage[];
  candidates: ReturnType<typeof compactCandidates>;
  weatherContext: AiWeatherContext;
  searchQuery: string;
}) {
  const systemPrompt = [
    '你是旅行团推荐顾问，需要根据用户需求、天气、季节、目的地常识和给定旅行团候选列表推荐线路。',
    '只能推荐候选列表中真实存在的 tourId，不允许编造线路、价格、班期或服务。',
    '天气和世界知识只用于判断舒适度、风险和适配理由；线路事实必须来自候选列表。',
    '如果用户提到老人、儿童、轻松、怕累，应降低高强度、长途奔波和极端天气目的地优先级。',
    '如果天气或季节不适合，要在理由中说明风险，并优先推荐更稳妥的候选。',
    '严格输出 JSON，不要 Markdown，不要额外解释。',
  ].join('\n');

  const userPayload = {
    task: '从 candidateTours 中选出最多 8 条旅行团，按适合程度排序。',
    outputSchema: {
      summary: '一句中文总结，说明推荐依据',
      items: [
        {
          tourId: '候选列表里的 id',
          score: '0-100 的数字',
          reason: '一句中文推荐理由，结合用户需求/天气/季节/线路特点',
          matchedSignals: ['3到5个中文匹配信号'],
        },
      ],
    },
    userNeed: params.userText,
    searchQuery: params.searchQuery,
    recentConversation: params.messages.slice(-8).map(({ role, content }) => ({ role, content })),
    weatherContext: params.weatherContext,
    candidateTours: params.candidates,
  };

  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: JSON.stringify(userPayload) },
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
    .slice(0, 8)
    .map((item, index) => ({
      tourId: String(item.tourId),
      score: Number.isFinite(Number(item.score)) ? Number(item.score) : 80 - index,
      reason: item.reason?.trim() || '综合用户需求、天气和线路特点后较为合适',
      matchedSignals: Array.isArray(item.matchedSignals)
        ? item.matchedSignals.map(String).slice(0, 5)
        : ['AI综合推荐'],
    }));
}

async function callAiApi(params: {
  config: AiProviderConfig;
  messages: ReturnType<typeof buildAiMessages>;
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
}: AiRecommendationRequest): Promise<AiRecommendationResult> {
  const text = getLatestUserText(messages);
  const filteredCandidates = candidateTours.filter((tour) => {
    if (activeFilters.destination && !tour.destination.includes(activeFilters.destination)) return false;
    if (activeFilters.source && tour.source !== activeFilters.source) return false;
    if (activeFilters.theme && tour.theme !== activeFilters.theme) return false;
    if (activeFilters.duration && activeFilters.duration !== 11 && tour.duration !== activeFilters.duration) return false;
    if (activeFilters.duration === 11 && tour.duration < 11) return false;
    if (activeFilters.minPrice !== null && tour.price < activeFilters.minPrice) return false;
    if (activeFilters.maxPrice !== null && tour.price > activeFilters.maxPrice) return false;
    return true;
  });
  const availableCandidates = filteredCandidates.length > 0 ? filteredCandidates : candidateTours;
  const localItems = localRecommendations(availableCandidates, text);
  const config = getResolvedAiConfig(aiConfig);

  if (!config) {
    return {
      conversationId,
      summary: '当前未配置 AI 接口，已先按目的地、预算、天数和行程强度做本地预匹配。',
      items: localItems,
      generatedAt: new Date().toISOString(),
      source: 'local-preview',
    };
  }

  try {
    const weatherContext = await fetchWeatherContext(text, availableCandidates);
    const compactedCandidates = compactCandidates(availableCandidates, localItems);
    const aiResponse = await callAiApi({
      config,
      messages: buildAiMessages({
        userText: text,
        messages,
        candidates: compactedCandidates,
        weatherContext,
        searchQuery,
      }),
    });
    const aiItems = validateAiItems(aiResponse, availableCandidates);

    if (aiItems.length === 0) {
      throw new Error('AI returned no valid tour ids');
    }

    return {
      conversationId,
      summary:
        typeof aiResponse.summary === 'string' && aiResponse.summary.trim()
          ? aiResponse.summary.trim()
          : '已结合用户需求、天气、季节和线路特点生成推荐。',
      items: aiItems,
      generatedAt: new Date().toISOString(),
      source: 'ai-api',
    };
  } catch {
    return {
      conversationId,
      summary: 'AI 接口暂时不可用，已先使用本地规则按需求做预匹配。',
      items: localItems,
      generatedAt: new Date().toISOString(),
      source: 'local-preview',
    };
  }
}
