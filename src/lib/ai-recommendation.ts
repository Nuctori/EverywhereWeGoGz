import type {
  AiRecommendationCandidate,
  AiRecommendationItem,
  AiRecommendationMessage,
  AiRecommendationRequest,
  AiRecommendationResult,
} from '@/types/tour';

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
};

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

  if (duration) {
    if (tour.duration >= duration.min && tour.duration <= duration.max) {
      score += 10;
      signals.push(`天数合适：${tour.duration}天`);
    }
  }

  if (text.includes('轻松') || text.includes('休闲') || text.includes('老人')) {
    if (tour.leisureLevel === 'easy') {
      score += 10;
      signals.push('行程强度较轻');
    }
  }

  if (text.includes('近期') || text.includes('马上') || text.includes('本周')) {
    score += Math.min(tour.hotDepartureDates?.length ?? 0, 3) * 3;
    if ((tour.hotDepartureDates?.length ?? 0) > 0) {
      signals.push('近期班期较多');
    }
  }

  if (tour.isHot) {
    score += 4;
  }

  if (tour.rating >= 4.7) {
    score += 3;
  }

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

export async function requestAiRecommendations({
  conversationId,
  messages,
  candidateTours,
}: AiRecommendationRequest): Promise<AiRecommendationResult> {
  const text = getLatestUserText(messages);
  const normalizedText = normalizeText(text);
  const items = candidateTours
    .map((tour) => scoreTour(tour, normalizedText))
    .filter((item): item is AiRecommendationItem => Boolean(item))
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  const finalItems = items.length > 0 ? items : fallbackRecommendations(candidateTours);

  return {
    conversationId,
    summary:
      finalItems.length > 0
        ? '我先按目的地、预算、天数和行程强度做了一版本地预匹配。'
        : '暂时没有足够线索，先给出综合热度较高的线路。',
    items: finalItems,
    generatedAt: new Date().toISOString(),
    source: 'local-preview',
  };
}
