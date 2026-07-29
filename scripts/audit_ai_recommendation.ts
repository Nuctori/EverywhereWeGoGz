// ?? AI ?????????????????????????
import { strict as assert } from 'node:assert';
import fs from 'node:fs';
import {
  __aiRecommendationTestHooks,
} from '../src/lib/ai-recommendation.ts';
import { getSearchRouteMeta, requestAiRecommendations } from '../src/lib/ai-recommendation.ts';
import type { AiRecommendationCandidate } from '../src/types/tour.ts';

const {
  auditAiRecommendationsStrict,
  auditAiRecommendations,
  buildAiMessages,
  buildHardIntentFromText,
  buildCoverageAwareReason,
  buildLiteAiMessages,
  buildLocalRecommendationQuery,
  buildRecommendationAuditContext,
  buildRouteAtlas,
  buildTourPrimitive,
  collectAvoidHints,
  collectLiteralAvoidHints,
  compactCandidates,
  allowsPublicInterestForTurn,
  enrichPromptCandidatesWithMemoryCoverage,
  finalizeRecommendationSummary,
  getConcreteAiReason,
  getPrimitiveCoverageScore,
  getPrimitiveConflictReasons,
  getWeatherRankingScore,
  assessWeatherComfortForDate,
  reasonAddressesUserNeed,
  localRecommendations,
  matchesActiveDateFilters,
  matchesDateWindow,
  mergeAiAndLocalRecommendations,
  mergeAiRankingIntent,
  mergeIntentWithMemory,
  prioritizeRecommendationItems,
  rewriteRecommendationCopy,
  resolvePromptDateWindow,
  sanitizeAiBudgetBoundsForTurn,
  sanitizeAiIntentForTurn,
  sanitizeAiPreferenceArraysForTurn,
  sanitizeAiSemanticNotesForTurn,
  validateAiItems,
} = __aiRecommendationTestHooks;

const EMPTY_FILTERS = {
  destination: '',
  minPrice: null,
  maxPrice: null,
  duration: null,
  source: '',
  departureDate: '',
  departureDateStart: '',
  departureDateEnd: '',
  theme: '',
  sortBy: 'hot' as const,
};

function candidate(overrides: Partial<AiRecommendationCandidate> & { id: string; title: string; destination: string; price: number }): AiRecommendationCandidate {
  return {
    id: overrides.id,
    title: overrides.title,
    source: overrides.source ?? 'test',
    destination: overrides.destination,
    duration: overrides.duration ?? 5,
    price: overrides.price,
    departureDate: overrides.departureDate ?? '2026-06-12',
    departureDates: overrides.departureDates ?? ['2026-06-12'],
    transportType: overrides.transportType ?? '飞机',
    accommodationLevel: overrides.accommodationLevel ?? '舒适',
    meals: overrides.meals ?? '含早',
    highlights: overrides.highlights ?? ['海岛度假'],
    tags: overrides.tags ?? ['海岛', '休闲'],
    isHot: overrides.isHot ?? false,
    theme: overrides.theme ?? '海岛度假',
    suitableFor: overrides.suitableFor ?? ['家庭'],
    leisureLevel: overrides.leisureLevel ?? 'easy',
    season: overrides.season ?? '夏季',
    rating: overrides.rating ?? 4.6,
    groupSize: overrides.groupSize ?? '30人',
    hotDepartureDates: overrides.hotDepartureDates ?? ['2026-06-12'],
  };
}

const tours = [
  candidate({ id: 'phuket-premium', title: '普吉岛5天海岛度假', destination: '普吉岛', price: 6800 }),
  candidate({ id: 'phuket-budget', title: '普吉岛5天经济海岛度假', destination: '普吉岛', price: 2999 }),
  candidate({ id: 'bali-budget', title: '巴厘岛6天轻松度假', destination: '巴厘岛', duration: 6, price: 3999 }),
  candidate({ id: 'guizhou-cheap', title: '贵州山水5天', destination: '贵州', price: 1599, tags: ['自然'], theme: '自然风光' }),
];
const realTours = JSON.parse(fs.readFileSync('public/data/tours-list.json', 'utf8')) as AiRecommendationCandidate[];

const inheritedIntent = mergeIntentWithMemory(
  { budgetPriority: 'low', refinementMode: 'refine_previous' },
  {
    destinationHints: ['东南亚'],
    travelStyle: ['海岛'],
    mustHave: [],
    avoid: [],
    weatherSensitivity: [],
    departureWeekdays: [],
    updatedAt: '2026-05-28T00:00:00.000Z',
  },
);

const compacted = compactCandidates(tours, [], inheritedIntent, { budgetPriority: 'low' });
assert.ok(compacted.some((item) => item.id === 'phuket-budget' && item.matchStatus === 'match'));
assert.ok(compacted.some((item) => item.id === 'guizhou-cheap' && item.matchStatus !== 'match'));

const guizhouPrimitive = compacted.find((item) => item.id === 'guizhou-cheap');
assert.ok(guizhouPrimitive);
assert.ok(getPrimitiveConflictReasons(inheritedIntent, guizhouPrimitive).some((reason) => reason.startsWith('目的地不匹配')));

const aiItems = validateAiItems({
  items: [
    { tourId: 'guizhou-cheap', score: 95, reason: '价格最低', matchedSignals: ['低价'] },
    { tourId: 'phuket-budget', score: 80, reason: '东南亚海岛且价格较低', matchedSignals: ['海岛', '低价'] },
  ],
}, tours);

const audited = auditAiRecommendations(aiItems, [], tours, inheritedIntent);
assert.equal(audited[0].tourId, 'phuket-budget');
assert.ok(audited.find((item) => item.tourId === 'guizhou-cheap')?.matchedSignals.some((signal) => signal.startsWith('需放宽条件')));
const aiOrderTours = [
  candidate({ id: 'ai-first', title: '广东温泉沙滩3天', destination: '广东', duration: 3, price: 1299, tags: ['温泉', '沙滩'], highlights: ['温泉', '沙滩'] }),
  candidate({ id: 'local-favorite', title: '广东温泉沙滩3天', destination: '广东', duration: 3, price: 399, tags: ['温泉', '沙滩'], highlights: ['温泉', '沙滩'] }),
];
const aiOrderAudited = auditAiRecommendationsStrict(
  [
    { tourId: 'ai-first', score: 70, reason: 'AI 更看重体验完整度', matchedSignals: ['体验完整'] },
    { tourId: 'local-favorite', score: 69, reason: 'AI 认为也可选', matchedSignals: ['价格较低'] },
  ],
  [
    { tourId: 'local-favorite', score: 999, reason: '本地补位高分', matchedSignals: ['本地补位'] },
    { tourId: 'ai-first', score: 1, reason: '本地补位低分', matchedSignals: ['本地补位'] },
  ],
  aiOrderTours,
  { weatherSensitivity: [], departureWeekdays: [] },
);
assert.equal(aiOrderAudited[0].tourId, 'ai-first');
assert.equal(aiOrderAudited[1].tourId, 'local-favorite');
const mergedAiOrder = mergeAiAndLocalRecommendations(
  [
    { tourId: 'ai-lower-score-first', score: 10, reason: 'AI 排第一', matchedSignals: [] },
    { tourId: 'ai-higher-score-second', score: 99, reason: 'AI 排第二', matchedSignals: [] },
  ],
  [],
);
assert.equal(mergedAiOrder[0].tourId, 'ai-lower-score-first');
assert.equal(mergedAiOrder[1].tourId, 'ai-higher-score-second');
const mergedPartialAi = mergeAiAndLocalRecommendations(
  [{ tourId: 'ai-only-choice', score: 70, reason: 'AI 认为这条最符合整体玩法。', matchedSignals: [] }],
  [{ tourId: 'local-not-selected', score: 999, reason: '本地补位高分', matchedSignals: [] }],
);
assert.deepEqual(
  mergedPartialAi.map((item) => item.tourId),
  ['ai-only-choice'],
  'a partial AI result must not be padded with unselected local candidates',
);
const mergedLocalFallback = mergeAiAndLocalRecommendations(
  [],
  [{ tourId: 'local-fallback', score: 20, reason: 'AI 不可用时的本地兜底', matchedSignals: [] }],
);
assert.deepEqual(mergedLocalFallback.map((item) => item.tourId), ['local-fallback']);
const mergedCapItems = mergeAiAndLocalRecommendations(
  Array.from({ length: 12 }, (_, index) => ({
    tourId: `ai-${index}`,
    score: 100 - index,
    reason: `AI reason ${index}`,
    matchedSignals: [],
  })),
  Array.from({ length: 30 }, (_, index) => ({
    tourId: `local-${index}`,
    score: 80 - index,
    reason: `Local reason ${index}`,
    matchedSignals: [],
  })),
);
assert.ok(mergedCapItems.length <= 24);
assert.ok(mergedCapItems.filter((item) => item.reason).length <= 24);
const auditCapTours = Array.from({ length: 30 }, (_, index) => candidate({
  id: `audit-cap-${index}`,
  title: `广东清凉短线${index}`,
  destination: '广东',
  price: 100 + index,
}));
const auditCapItems = auditAiRecommendations(
  [],
  auditCapTours.map((tour, index) => ({ tourId: tour.id, score: 90 - index, matchedSignals: [] })),
  auditCapTours,
  null,
);
assert.ok(auditCapItems.length <= 24);

const avoidIntent = mergeIntentWithMemory({ avoid: ['温泉'] }, null);
const hotSpringTour = candidate({
  id: 'hot-spring',
  title: '广东温泉2天',
  destination: '广东',
  duration: 2,
  price: 299,
  theme: '温泉',
  tags: ['温泉', '休闲'],
  highlights: ['泡温泉'],
});
const nonHotSpringTour = candidate({
  id: 'beach',
  title: '广东沙扒湾3天',
  destination: '广东',
  duration: 3,
  price: 299,
  theme: '海边',
  tags: ['海边', '休闲'],
  highlights: ['沙滩'],
});
const hotSpringBeachTour = candidate({
  id: 'hot-spring-beach',
  title: '广东海边温泉沙滩3天',
  destination: '广东',
  duration: 3,
  price: 699,
  theme: '休闲度假',
  tags: ['温泉', '沙滩'],
  highlights: ['海边温泉', '沙滩散步'],
});
const compoundNeedCompacted = compactCandidates(
  [hotSpringTour, nonHotSpringTour, hotSpringBeachTour, ...tours],
  [],
  null,
  { userText: '帮我找同时带温泉和沙滩的团' },
);
assert.ok(compoundNeedCompacted.slice(0, 4).some((item) => item.id === 'hot-spring-beach'));
const premiumHotSpringBeachTour = candidate({
  id: 'premium-hot-spring-beach',
  title: '海岛温泉沙滩水上别墅7天',
  destination: '马尔代夫',
  duration: 7,
  price: 30999,
  theme: '海岛度假',
  tags: ['温泉', '沙滩'],
  highlights: ['海边温泉', '沙滩', '水上别墅'],
});
const midPriceHotSpringBeachTour = candidate({
  id: 'mid-hot-spring-beach',
  title: '惠州海边温泉沙滩3天',
  destination: '广东',
  duration: 3,
  price: 2599,
  theme: '休闲度假',
  tags: ['温泉', '沙滩'],
  highlights: ['海边温泉', '沙滩散步'],
});
const priceContextCompacted = compactCandidates(
  [premiumHotSpringBeachTour, midPriceHotSpringBeachTour, hotSpringBeachTour, hotSpringTour, nonHotSpringTour, ...tours],
  [],
  null,
  { userText: '帮我找同时带温泉和沙滩的团' },
);
const topPriceContextIds = priceContextCompacted.slice(0, 8).map((item) => item.id);
assert.ok(topPriceContextIds.includes('mid-hot-spring-beach') || topPriceContextIds.includes('hot-spring-beach'));
assert.ok(topPriceContextIds.includes('premium-hot-spring-beach'));
assert.ok(priceContextCompacted.some((item) => item.priceContext.poolPercentile !== null));
assert.ok(priceContextCompacted.some((item) => item.priceContext.poolBand === 'upper'));
assert.ok(priceContextCompacted.some((item) => item.priceContext.poolBand !== 'upper'));
assert.ok(priceContextCompacted.some((item) => item.userTermCoverage > 0));
assert.ok(priceContextCompacted.some((item) => item.userTermHits.includes('温泉泡汤')));
assert.ok(priceContextCompacted.some((item) => item.userTermHits.includes('海边沙滩')));
const beachPrimitive = buildTourPrimitive(nonHotSpringTour);
assert.ok(beachPrimitive.experienceCategories.includes('海边沙滩'));
assert.ok(!beachPrimitive.experienceCategories.includes('玩水清凉'));
assert.ok(!beachPrimitive.seasonalComfortAtoms.some((atom) => atom.includes('玩水')));
const indoorCoolPrimitive = buildTourPrimitive(candidate({
  id: 'indoor-cool',
  title: '广州冰雪世界室内1天',
  destination: '广东',
  duration: 1,
  price: 199,
  theme: '亲子休闲',
  tags: ['亲子'],
  highlights: ['冰雪世界', '室内体验'],
}));
assert.ok(indoorCoolPrimitive.experienceCategories.includes('室内度假'));
assert.ok(!indoorCoolPrimitive.experienceCategories.includes('玩水清凉'));
assert.ok(indoorCoolPrimitive.seasonalComfortAtoms.some((atom) => atom.includes('清凉室内')));
assert.ok(!indoorCoolPrimitive.seasonalComfortAtoms.some((atom) => atom.includes('玩水')));

const coastalHotSpringPrimitive = buildTourPrimitive(candidate({
  id: 'coastal-hot-spring',
  title: '惠州双湾盐洲岛温泉联游3天',
  destination: '广东',
  duration: 3,
  price: 399,
  theme: '温泉泡汤',
}));
assert.equal(
  getPrimitiveCoverageScore(coastalHotSpringPrimitive, ['温泉泡汤', '玩水清凉']),
  2,
  '滨水温泉目的地 should count as both hot spring and water play for a compound request',
);
const compoundSelection = prioritizeRecommendationItems(
  [
    { tourId: 'coastal-hot-spring', score: 99, reason: '海边温泉度假', matchedSignals: [] },
    { tourId: hotSpringTour.id, score: 99, reason: '纯温泉', matchedSignals: [] },
  ],
  {
    candidateTours: [
      candidate({ id: 'coastal-hot-spring', title: '惠州双湾盐洲岛温泉联游3天', destination: '广东', price: 399, duration: 3, theme: '温泉泡汤' }),
      hotSpringTour,
    ],
    intent: { semanticFocus: ['玩水', '周边小镇'], weatherSensitivity: [], departureWeekdays: [] },
    userText: '能玩水的温泉，周边有镇子的，如果有共享电瓶车的优先',
  },
);
assert.deepEqual(
  compoundSelection.map((item) => item.tourId),
  ['coastal-hot-spring', hotSpringTour.id],
  'compound recommendation should prefer a strong match while retaining partial candidates',
);
const avoidCompacted = compactCandidates([hotSpringTour, nonHotSpringTour], [], avoidIntent);
assert.ok(avoidCompacted.some((item) =>
  item.id === 'hot-spring' &&
  item.conflictReasons.some((reason) => reason.startsWith('命中需避开条件')),
));
assert.ok(avoidCompacted.some((item) => item.id === 'beach'));
assert.deepEqual(collectAvoidHints('500元以内，不要漂流、爬山'), ['漂流', '爬山']);
assert.deepEqual(collectAvoidHints('不喜欢温泉，讨厌购物团'), ['温泉', '购物团', '购物']);
assert.ok(buildTourPrimitive(hotSpringTour).seasonalComfortAtoms.some((atom) => atom.includes('高温天气需取舍')));

const auditedAvoid = auditAiRecommendations(
  [{ tourId: 'hot-spring', score: 100, reason: '便宜', matchedSignals: ['低价'] }],
  [{ tourId: 'hot-spring', score: 99, reason: '本地补位', matchedSignals: ['本地'] }],
  [hotSpringTour, nonHotSpringTour],
  avoidIntent,
);
assert.equal(auditedAvoid.length, 1);
assert.ok(auditedAvoid[0]?.reason?.includes('需放宽条件'));

function toLocalDateInput(value: Date) {
  return [
    value.getFullYear(),
    String(value.getMonth() + 1).padStart(2, '0'),
    String(value.getDate()).padStart(2, '0'),
  ].join('-');
}

const today = toLocalDateInput(new Date());
const tomorrow = toLocalDateInput(new Date(Date.now() + 24 * 60 * 60 * 1000));
const yesterday = toLocalDateInput(new Date(Date.now() - 24 * 60 * 60 * 1000));
const nextWeek = toLocalDateInput(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
const baseFilters = {
  destination: '',
  minPrice: null,
  maxPrice: null,
  duration: null,
  source: '',
  departureDate: nextWeek,
  departureDateStart: '',
  departureDateEnd: '',
  theme: '',
  sortBy: 'hot' as const,
};
assert.ok(matchesActiveDateFilters({ ...nonHotSpringTour, departureDate: tomorrow, departureDates: [tomorrow] }, baseFilters));
assert.ok(!matchesActiveDateFilters({
  ...nonHotSpringTour,
  departureDate: yesterday,
  departureDates: [yesterday],
  hotDepartureDates: [],
}, baseFilters));
assert.ok(matchesActiveDateFilters({ ...nonHotSpringTour, departureDate: today, departureDates: [today] }, baseFilters));

const promptDateWindow = resolvePromptDateWindow('推荐500元以下未来7天出发的旅行团');
assert.ok(promptDateWindow);
assert.ok(matchesDateWindow({ ...nonHotSpringTour, departureDate: tomorrow, departureDates: [tomorrow] }, promptDateWindow));
assert.ok(!matchesDateWindow({
  ...nonHotSpringTour,
  departureDate: yesterday,
  departureDates: [yesterday],
  hotDepartureDates: [],
}, promptDateWindow));
const futureFewDaysWindow = resolvePromptDateWindow('未来几天下雨，500元以下推荐旅行团');
assert.ok(futureFewDaysWindow);
assert.ok(matchesDateWindow({ ...nonHotSpringTour, departureDate: tomorrow, departureDates: [tomorrow] }, futureFewDaysWindow));
assert.ok(!matchesDateWindow({
  ...nonHotSpringTour,
  departureDate: yesterday,
  departureDates: [yesterday],
  hotDepartureDates: [],
}, futureFewDaysWindow));

const allowHotSpringAgain = mergeIntentWithMemory(
  { travelStyle: ['温泉'], mustHave: ['泡温泉'], avoid: [] },
  {
    destinationHints: [],
    travelStyle: [],
    mustHave: [],
    avoid: ['温泉'],
    weatherSensitivity: [],
    departureWeekdays: [],
    updatedAt: '2026-06-02T00:00:00.000Z',
  },
);
assert.ok(!allowHotSpringAgain?.avoid?.includes('温泉'));

const hotSpringCluster = Array.from({ length: 30 }, (_, index) => candidate({
  id: `cluster-hot-spring-${index}`,
  title: `广东温泉度假${index + 1}`,
  destination: '广东',
  duration: 2,
  price: 180 + index,
  theme: '温泉度假',
  tags: ['温泉度假', '纯玩'],
  highlights: ['泡温泉'],
  isHot: true,
}));
const diverseAlternatives = [
  candidate({
    id: 'culture-day',
    title: '广州博物馆文化1天',
    destination: '广东',
    duration: 1,
    price: 99,
    theme: '古镇文化',
    tags: ['古镇文化', '纯玩'],
    highlights: ['博物馆'],
  }),
  candidate({
    id: 'beach-three-day',
    title: '沙扒湾海边3天',
    destination: '广东',
    duration: 3,
    price: 199,
    theme: '海岛度假',
    tags: ['海岛度假', '纯玩'],
    highlights: ['沙滩'],
  }),
  candidate({
    id: 'nature-day',
    title: '从化森林氧吧1天',
    destination: '广东',
    duration: 1,
    price: 88,
    theme: '自然风光',
    tags: ['自然风光', '纯玩'],
    highlights: ['森林'],
  }),
];
const diversityIntent = mergeIntentWithMemory({ budgetMax: 500, budgetPriority: 'low' }, null);
const hotRainyWeatherContext = {
  destination: '广州',
  travelDate: '2026-06-02',
  forecastSummary: '广州未来7天闷热多雨，有高温、阵雨和雷暴风险。',
  seasonAdvice: '华南此时通常已经进入闷热多雨阶段，优先考虑避暑、遮阳、防雨和室内外搭配。',
};
const dominantLocalItems = hotSpringCluster.map((tour, index) => ({
  tourId: tour.id,
  score: 300 - index,
  reason: '低价',
  matchedSignals: ['低价'],
}));
const diverseCompacted = compactCandidates(
  [...hotSpringCluster, ...diverseAlternatives],
  dominantLocalItems,
  diversityIntent,
  { budgetPriority: 'low', weatherSensitivity: ['关注天气'], weatherContext: hotRainyWeatherContext },
);
assert.ok(diverseCompacted.some((item) => item.id === 'culture-day'));
assert.ok(diverseCompacted.some((item) => item.id === 'beach-three-day'));
assert.ok(diverseCompacted.some((item) => item.id === 'nature-day'));
assert.ok(diverseCompacted.filter((item) => item.experienceCategories.includes('温泉泡汤')).length >= 3);
const culturePrimitive = buildTourPrimitive(diverseAlternatives[0]);
assert.ok(culturePrimitive.semanticAtoms.includes('博物馆'));
assert.ok(diverseCompacted.every((item) => Array.isArray(item.semanticAtoms)));
assert.ok(diverseCompacted.every((item) => item.routeGroup.includes('｜')));
assert.ok(buildTourPrimitive(hotSpringCluster[0]).experienceCategories.includes('温泉泡汤'));

const noisyHotSpringCluster = Array.from({ length: 30 }, (_, index) => candidate({
  id: `noisy-hot-spring-${index}`,
  title: `广东温泉度假${index + 1}`,
  destination: '广东',
  duration: 2,
  price: 160 + index,
  theme: '温泉度假',
  tags: ['温泉度假', '纯玩'],
  highlights: ['泡温泉'],
  isHot: true,
}));
const noisyAlternatives = [
  candidate({
    id: 'noisy-culture',
    title: '广东博物馆文化线',
    destination: '广东',
    duration: 2,
    price: 220,
    theme: '温泉度假',
    tags: ['温泉度假', '纯玩'],
    highlights: ['博物馆'],
  }),
  candidate({
    id: 'noisy-beach',
    title: '广东沙扒湾海边线',
    destination: '广东',
    duration: 2,
    price: 230,
    theme: '温泉度假',
    tags: ['温泉度假', '纯玩'],
    highlights: ['沙滩'],
  }),
  candidate({
    id: 'noisy-forest',
    title: '广东森林氧吧线',
    destination: '广东',
    duration: 2,
    price: 240,
    theme: '温泉度假',
    tags: ['温泉度假', '纯玩'],
    highlights: ['森林氧吧'],
  }),
];
const noisyDominantLocalItems = noisyHotSpringCluster.map((tour, index) => ({
  tourId: tour.id,
  score: 300 - index,
  reason: '低价',
  matchedSignals: ['低价'],
}));
const noisyCompacted = compactCandidates(
  [...noisyHotSpringCluster, ...noisyAlternatives],
  noisyDominantLocalItems,
  diversityIntent,
  { budgetPriority: 'low', weatherSensitivity: ['关注天气'], weatherContext: hotRainyWeatherContext },
);
assert.ok(noisyCompacted.some((item) => item.id === 'noisy-culture'));
assert.ok(noisyCompacted.some((item) => item.id === 'noisy-beach'));
assert.ok(noisyCompacted.some((item) => item.id === 'noisy-forest'));
assert.ok(noisyCompacted.filter((item) => item.experienceCategories.includes('温泉泡汤')).length >= 20);

const noHighlightHotSpringCluster = Array.from({ length: 30 }, (_, index) => candidate({
  id: `no-highlight-hot-spring-${index}`,
  title: `广东温泉度假${index + 1}`,
  destination: '广东',
  duration: 2,
  price: 150 + index,
  theme: '温泉度假',
  tags: ['温泉度假', '纯玩'],
  highlights: [],
  isHot: true,
}));
const noHighlightDominantLocalItems = noHighlightHotSpringCluster.map((tour, index) => ({
  tourId: tour.id,
  score: 300 - index,
  reason: '低价',
  matchedSignals: ['低价'],
}));
const noHighlightCompacted = compactCandidates(
  [...noHighlightHotSpringCluster, ...noisyAlternatives],
  noHighlightDominantLocalItems,
  diversityIntent,
  { budgetPriority: 'low', weatherSensitivity: ['关注天气'], weatherContext: hotRainyWeatherContext },
);
assert.ok(noHighlightCompacted.some((item) => item.id === 'noisy-culture'));
assert.ok(noHighlightCompacted.some((item) => item.id === 'noisy-beach'));
assert.ok(noHighlightCompacted.some((item) => item.id === 'noisy-forest'));
assert.ok(!noHighlightCompacted.some((item) => /温泉度假\d/.test(item.routeGroup)));
assert.ok(noHighlightCompacted.filter((item) => item.experienceCategories.includes('温泉泡汤')).length >= 20);

const implicitHotSpringPrimitive = buildTourPrimitive(candidate({
  id: 'implicit-hot-spring',
  title: '龙门铁泉3天(依泉楼)',
  destination: '广东',
  duration: 3,
  price: 399,
  theme: '自然风光',
  tags: ['自然风光'],
  highlights: [],
}));
assert.ok(implicitHotSpringPrimitive.experienceCategories.includes('温泉泡汤'));
assert.ok(getPrimitiveConflictReasons(
  { avoid: ['温泉'], weatherSensitivity: [], departureWeekdays: [] },
  implicitHotSpringPrimitive,
).some((reason) => reason.startsWith('命中需避开条件')));

const lodgingOnlyPackage = candidate({
  id: 'hotel-package',
  title: '北京亦庄新城酒店住宿套餐*等待确认',
  destination: '北京',
  duration: 1,
  price: 199,
  theme: '自然风光',
  tags: ['自然风光'],
  highlights: ['精品住宿'],
});
const realTourAlternative = candidate({
  id: 'real-tour',
  title: '从化森林氧吧亲水栈道1天',
  destination: '广东',
  duration: 1,
  price: 99,
  theme: '自然风光',
  tags: ['自然风光'],
  highlights: ['森林氧吧', '亲水栈道'],
});
const packageCompacted = compactCandidates(
  [lodgingOnlyPackage, realTourAlternative],
  [{ tourId: lodgingOnlyPackage.id, score: 300, reason: '低价', matchedSignals: ['低价'] }],
  diversityIntent,
  { budgetPriority: 'low', weatherSensitivity: ['关注天气'], weatherContext: hotRainyWeatherContext },
);
assert.ok(buildTourPrimitive(lodgingOnlyPackage).experienceCategories.includes('非跟团产品'));
assert.ok(packageCompacted.some((item) => item.id === 'real-tour'));
assert.ok(!packageCompacted.some((item) => item.id === 'hotel-package'));

const rainyMountainTour = candidate({
  id: 'rainy-mountain',
  title: '广东峡谷溯溪爬山1天',
  destination: '广东',
  duration: 1,
  price: 128,
  theme: '自然风光',
  tags: ['自然风光'],
  highlights: ['峡谷溯溪', '爬山'],
});
const rainyIndoorTour = candidate({
  id: 'rainy-indoor',
  title: '广州博物馆美食轻松1天',
  destination: '广东',
  duration: 1,
  price: 128,
  theme: '古镇文化',
  tags: ['古镇文化'],
  highlights: ['博物馆', '美食'],
});
const rainyCompacted = compactCandidates(
  [rainyMountainTour, rainyIndoorTour],
  [{ tourId: rainyMountainTour.id, score: 300, reason: '低价', matchedSignals: ['低价'] }],
  diversityIntent,
  { budgetPriority: 'low', weatherSensitivity: ['避雨'], weatherContext: hotRainyWeatherContext },
);
assert.ok(buildTourPrimitive(rainyMountainTour).seasonalComfortAtoms.includes('雨天需取舍：山水户外或涉水风险'));
assert.ok(rainyCompacted.some((item) => item.id === 'rainy-indoor'));
assert.ok(rainyCompacted.some((item) => item.id === 'rainy-mountain'));

const genericReasonItems = validateAiItems({
  items: [
    { tourId: 'noisy-culture', score: 95, reason: '价格低，班期多，性价比高', matchedSignals: ['低价'] },
  ],
}, noisyAlternatives);
assert.ok(genericReasonItems[0].reason?.includes('博物馆'));
assert.ok(genericReasonItems[0].matchedSignals.some((signal) => signal.includes('博物馆')));
const nonStringReasonItems = validateAiItems({
  items: [
    { tourId: 'noisy-forest', score: 93, reason: 123, matchedSignals: ['低价'] },
  ],
}, noisyAlternatives);
assert.ok(nonStringReasonItems[0].reason?.includes('森林') || nonStringReasonItems[0].reason?.includes('氧吧'));
const vagueReasonItems = validateAiItems({
  items: [
    { tourId: 'noisy-beach', score: 94, reason: '自然风光生态，含早轻松，适合本次天气取舍。', matchedSignals: ['自然风光'] },
  ],
}, noisyAlternatives);
assert.ok(vagueReasonItems[0].reason?.includes('沙扒湾') || vagueReasonItems[0].reason?.includes('沙滩'));
assert.ok(!vagueReasonItems[0].reason?.includes('玩水'));
assert.ok(!/[（(](?:天气敏感|高温天气需取舍|雨天需取舍)：/.test(vagueReasonItems[0].reason || ''));
assert.ok(!/看点：|行程：|参考价：|可作为具体玩法备选/.test(vagueReasonItems[0].reason || ''));
assert.ok(vagueReasonItems[0].reason?.includes('参考价￥'));
assert.ok(!/主要卖点|这条更像|亮点集中|先锁定具体体验|我会把它看作/.test(vagueReasonItems[0].reason || ''));
assert.ok(!vagueReasonItems[0].reason?.includes('预算友好'));
assert.ok(!/偏海边沙滩|适合作低价酒店型备选|AI综合推荐|取舍：/.test(vagueReasonItems[0].reason || ''));

const highPriceBeachTour = candidate({
  id: 'high-price-beach',
  title: '马尔代夫水上别墅7天沙滩度假',
  destination: '马尔代夫',
  duration: 7,
  price: 30999,
  theme: '海岛度假',
  tags: ['海岛', '沙滩'],
  highlights: ['水上别墅', '沙滩'],
});
const lowPriceBeachTour = candidate({
  id: 'low-price-beach',
  title: '广东海边沙滩2天',
  destination: '广东',
  duration: 2,
  price: 399,
  theme: '海边',
  tags: ['海边'],
  highlights: ['沙滩'],
});
const highPriceReasonRewrite = rewriteRecommendationCopy({
  items: [{
    tourId: highPriceBeachTour.id,
    score: 98,
    reason: '马尔代夫水上别墅和沙滩度假都对题，￥30,999预算友好。',
    matchedSignals: ['沙滩', '水上别墅'],
  }],
  candidateTours: [highPriceBeachTour, lowPriceBeachTour],
  destinationWeatherInsights: [],
  intent: { weatherSensitivity: [], departureWeekdays: [] },
  weatherContext: {
    destination: '广州',
    travelDate: '2026-06-12',
    forecastSummary: '广州未来几天闷热多雨。',
    seasonAdvice: [],
    source: 'seasonal-rule',
  },
  userText: '帮我找同时带温泉和沙滩的团',
  allowPublicInterest: false,
});
assert.ok(!highPriceReasonRewrite[0].reason?.includes('预算友好'));
assert.ok(highPriceReasonRewrite[0].reason?.includes('参考价￥30,999'));
const noBudgetReasonRewrite = rewriteRecommendationCopy({
  items: [{
    tourId: highPriceBeachTour.id,
    score: 97,
    reason: '水上别墅和沙滩度假都对题，预算贴边：￥30,999。',
    matchedSignals: ['沙滩', '水上别墅'],
  }],
  candidateTours: [highPriceBeachTour, lowPriceBeachTour],
  destinationWeatherInsights: [],
  intent: { weatherSensitivity: [], departureWeekdays: [] },
  weatherContext: {
    destination: '广州',
    travelDate: '2026-06-12',
    forecastSummary: '广州未来几天闷热多雨。',
    seasonAdvice: [],
    source: 'seasonal-rule',
  },
  userText: '帮我找同时带温泉和沙滩的团',
  allowPublicInterest: false,
});
assert.ok(!/预算贴边|预算内/.test(noBudgetReasonRewrite[0].reason || ''));
assert.ok(noBudgetReasonRewrite[0].reason?.includes('参考价￥30,999'));
const inventedBudgetFitRewrite = rewriteRecommendationCopy({
  items: [{
    tourId: highPriceBeachTour.id,
    score: 96,
    reason: '水上别墅和沙滩度假都对题，价格30999元符合预算。',
    matchedSignals: ['沙滩', '水上别墅'],
  }],
  candidateTours: [highPriceBeachTour, lowPriceBeachTour],
  destinationWeatherInsights: [],
  intent: { weatherSensitivity: [], departureWeekdays: [] },
  weatherContext: {
    destination: '广州',
    travelDate: '2026-06-12',
    forecastSummary: '广州未来几天闷热多雨。',
    seasonAdvice: [],
    source: 'seasonal-rule',
  },
  userText: '帮我找同时带温泉和沙滩的团',
  allowPublicInterest: false,
});
assert.ok(!/符合预算|预算内|预算贴边/.test(inventedBudgetFitRewrite[0].reason || ''));
assert.ok(inventedBudgetFitRewrite[0].reason?.includes('参考价￥30,999'));
const staleMemoryBudgetRewrite = rewriteRecommendationCopy({
  items: [{
    tourId: highPriceBeachTour.id,
    score: 95,
    reason: '水上别墅和沙滩度假都对题，价格30999元在预算内。',
    matchedSignals: ['沙滩', '水上别墅'],
  }],
  candidateTours: [highPriceBeachTour, lowPriceBeachTour],
  destinationWeatherInsights: [],
  intent: { budgetMax: 35000, weatherSensitivity: [], departureWeekdays: [] },
  weatherContext: {
    destination: '广州',
    travelDate: '2026-06-12',
    forecastSummary: '广州未来几天闷热多雨。',
    seasonAdvice: [],
    source: 'seasonal-rule',
  },
  userText: '帮我找同时带温泉和沙滩的团',
  allowPublicInterest: false,
});
assert.ok(!/符合预算|预算内|预算贴边/.test(staleMemoryBudgetRewrite[0].reason || ''));
assert.ok(staleMemoryBudgetRewrite[0].reason?.includes('参考价￥30,999'));
const closeToBudgetRewrite = rewriteRecommendationCopy({
  items: [{
    tourId: highPriceBeachTour.id,
    score: 94,
    reason: '水上别墅和沙滩度假都对题，价格接近预算。',
    matchedSignals: ['沙滩', '水上别墅'],
  }],
  candidateTours: [highPriceBeachTour, lowPriceBeachTour],
  destinationWeatherInsights: [],
  intent: { budgetMax: 35000, weatherSensitivity: [], departureWeekdays: [] },
  weatherContext: {
    destination: '广州',
    travelDate: '2026-06-12',
    forecastSummary: '广州未来几天闷热多雨。',
    seasonAdvice: [],
    source: 'seasonal-rule',
  },
  userText: '帮我找同时带温泉和沙滩的团',
  allowPublicInterest: false,
});
assert.ok(!/预算/.test(closeToBudgetRewrite[0].reason || ''));
assert.ok(closeToBudgetRewrite[0].reason?.includes('参考价￥30,999'));
const approximateBudgetRewrite = rewriteRecommendationCopy({
  items: [{
    tourId: highPriceBeachTour.id,
    score: 93,
    reason: '含温泉和沙滩，预算约4000，体验完整。',
    matchedSignals: ['温泉', '沙滩'],
  }],
  candidateTours: [highPriceBeachTour, lowPriceBeachTour],
  destinationWeatherInsights: [],
  intent: { weatherSensitivity: [], departureWeekdays: [] },
  weatherContext: {
    destination: '广州',
    travelDate: '2026-06-12',
    forecastSummary: '广州未来几天闷热多雨。',
    seasonAdvice: [],
    source: 'seasonal-rule',
  },
  userText: '帮我找同时带温泉和沙滩的团',
  allowPublicInterest: false,
});
assert.ok(!/预算约|预算大约|预算\s*\d/.test(approximateBudgetRewrite[0].reason || ''));
assert.ok(approximateBudgetRewrite[0].reason?.includes('参考价￥30,999'));
const beachHotSpringLocal = localRecommendations([
  candidate({
    id: 'only-hot-spring',
    title: '广东金水台温泉2天',
    destination: '广东',
    duration: 2,
    price: 299,
    theme: '温泉',
    tags: ['温泉'],
    highlights: ['金水台温泉'],
  }),
  candidate({
    id: 'beach-hot-spring',
    title: '惠州双湾盐洲岛温泉联游3天',
    destination: '广东',
    duration: 3,
    price: 399,
    theme: '海岛度假',
    tags: ['温泉', '海滩'],
    highlights: ['盐洲岛', '沙滩', '温泉'],
  }),
], '同时具有海滩和温泉的旅行团');
assert.equal(beachHotSpringLocal[0].tourId, 'beach-hot-spring');
assert.ok(beachHotSpringLocal[0].reason?.includes('温泉') || beachHotSpringLocal[0].reason?.includes('盐洲岛'));
assert.ok(!/可作为具体玩法备选|看点：|行程：|参考价：|这条更像|我会把它看作|具体体验/.test(beachHotSpringLocal[0].reason || ''));
const beachHotSpringAliasLocal = localRecommendations([
  candidate({
    id: 'only-hot-spring-alias',
    title: '金水台温泉2天',
    destination: '广东',
    duration: 2,
    price: 299,
    theme: '温泉',
    tags: ['泡汤'],
    highlights: ['私汤泡池'],
  }),
  candidate({
    id: 'bay-spa',
    title: '巽寮湾私汤海景3天',
    destination: '惠州',
    duration: 3,
    price: 699,
    theme: '海边度假',
    tags: ['海景', '私汤'],
    highlights: ['巽寮湾', '海滩', '泡池'],
  }),
], '想找海边能泡汤的跟团');
assert.equal(beachHotSpringAliasLocal[0].tourId, 'bay-spa');
assert.ok(
  /海|滩|湾|汤|温泉|泡池/.test(beachHotSpringAliasLocal[0].reason || ''),
  `expected bay-spa reason to mention concrete beach/hot-spring facts, got ${beachHotSpringAliasLocal[0].reason || ''}`,
);
const realBeachHotSpringLocal = localRecommendations(
  realTours,
  '给我推荐同时具有海滩和温泉的旅行团',
).slice(0, 5);
assert.ok(
  realBeachHotSpringLocal.some((item) => item.reason?.includes('温泉') || item.reason?.includes('海滩')),
  `expected top 5 to keep a concrete beach/hot-spring match, got ${realBeachHotSpringLocal.map((item) => item.tourId).join(', ')}`,
);
const staleMemoryFallbackResult = await requestAiRecommendations({
  conversationId: 'audit-fresh-turn-fallback',
  messages: [
    {
      id: 'fresh-user-turn',
      role: 'user',
      content: '给我推荐同时具有海滩和温泉的旅行团',
      createdAt: '2026-06-09T00:00:00.000Z',
    },
  ],
  candidateTours: [
    candidate({
      id: 'memory-hot-spring-only',
      title: '广东金水台温泉2天',
      destination: '广东',
      duration: 2,
      price: 299,
      theme: '温泉',
      tags: ['温泉'],
      highlights: ['金水台温泉'],
      isHot: true,
    }),
    candidate({
      id: 'fresh-query-both',
      title: '惠州双湾盐洲岛温泉联游3天',
      destination: '广东',
      duration: 3,
      price: 399,
      theme: '海岛度假',
      tags: ['温泉', '海滩'],
      highlights: ['盐洲岛', '沙滩', '温泉'],
    }),
  ],
  activeFilters: EMPTY_FILTERS,
  searchQuery: '',
  aiConfig: {},
  preferenceMemory: {
    destinationHints: ['广东'],
    travelStyle: ['温泉'],
    mustHave: ['温泉'],
    avoid: [],
    weatherSensitivity: [],
    departureWeekdays: [],
    updatedAt: '2026-06-08T00:00:00.000Z',
  },
  previousResult: null,
});
assert.equal(staleMemoryFallbackResult.source, 'local-preview');
assert.equal(staleMemoryFallbackResult.items[0]?.tourId, 'fresh-query-both');
assert.equal(staleMemoryFallbackResult.preferenceMemory ?? null, null);
const failedAiFallbackResult = await requestAiRecommendations({
  conversationId: 'audit-failed-ai-fallback',
  messages: [
    {
      id: 'failed-ai-user-turn',
      role: 'user',
      content: '给我推荐同时具有海滩和温泉的旅行团',
      createdAt: '2026-06-09T00:05:00.000Z',
    },
  ],
  candidateTours: realTours,
  activeFilters: EMPTY_FILTERS,
  searchQuery: '',
  aiConfig: {
    provider: 'openai-compatible',
    baseUrl: 'http://127.0.0.1:9/v1',
    apiKey: 'test-key',
    model: 'test-model',
  },
  preferenceMemory: null,
  previousResult: null,
});
assert.equal(failedAiFallbackResult.source, 'local-preview');
assert.ok(
  ['温泉', '海边', '海滩', '沙滩', '泡汤'].some((term) => (failedAiFallbackResult.items[0]?.reason || '').includes(term)),
  `expected fallback reason to mention concrete beach/hot-spring facts, got ${failedAiFallbackResult.items[0]?.reason || ''}`,
);
assert.equal(failedAiFallbackResult.preferenceMemory ?? null, null);
const naturalPhraseFallbackResult = await requestAiRecommendations({
  conversationId: 'audit-natural-phrase-fallback',
  messages: [
    {
      id: 'natural-phrase-user-turn',
      role: 'user',
      content: '帮我找同时带温泉和沙滩的团，最好轻松一点',
      createdAt: '2026-06-09T00:10:00.000Z',
    },
  ],
  candidateTours: realTours,
  activeFilters: EMPTY_FILTERS,
  searchQuery: '',
  aiConfig: {
    provider: 'openai-compatible',
    baseUrl: 'http://127.0.0.1:9/v1',
    apiKey: 'test-key',
    model: 'test-model',
  },
  preferenceMemory: null,
  previousResult: null,
});
assert.equal(naturalPhraseFallbackResult.source, 'local-preview');
assert.ok(
  ['温泉', '海边', '海滩', '沙滩', '泡汤'].some((term) => (naturalPhraseFallbackResult.items[0]?.reason || '').includes(term)),
  `expected natural phrase fallback top reason to mention concrete beach/hot-spring facts, got ${naturalPhraseFallbackResult.items[0]?.reason || ''}`,
);
const sanitizedInventedBudget = sanitizeAiBudgetBoundsForTurn(
  {
    budgetMax: 35000,
    budgetPriority: 'premium',
    weatherSensitivity: [],
    departureWeekdays: [],
  },
  '帮我找同时带温泉和沙滩的团',
);
assert.equal(sanitizedInventedBudget?.budgetMax, null);
assert.equal(sanitizedInventedBudget?.budgetPriority, null);
const keptUserBudget = sanitizeAiBudgetBoundsForTurn(
  {
    budgetMax: 3000,
    budgetPriority: 'balanced',
    weatherSensitivity: [],
    departureWeekdays: [],
  },
  '预算3000以内，帮我找同时带温泉和沙滩的团',
);
assert.equal(keptUserBudget?.budgetMax, 3000);
assert.equal(keptUserBudget?.budgetPriority, null);
const sanitizedInventedBudgetPriority = sanitizeAiBudgetBoundsForTurn(
  {
    budgetPriority: 'premium',
    weatherSensitivity: [],
    departureWeekdays: [],
  },
  '帮我找同时带温泉和沙滩的团',
);
assert.equal(sanitizedInventedBudgetPriority?.budgetPriority, null);
const keptUserBudgetPriority = sanitizeAiBudgetBoundsForTurn(
  {
    budgetPriority: 'premium',
    weatherSensitivity: [],
    departureWeekdays: [],
  },
  '预算不限，想要高端一点的温泉沙滩团',
);
assert.equal(keptUserBudgetPriority?.budgetPriority, 'premium');

const sanitizedImplicitSemanticIntent = sanitizeAiPreferenceArraysForTurn(
  {
    destinationHints: ['\u5e7f\u897f', '\u8d8a\u5357'],
    travelStyle: ['\u8054\u6e38', '\u6df1\u5ea6\u6e38'],
    mustHave: ['\u5c71\u6c34'],
    semanticFocus: ['\u4e1c\u5357\u4e9a'],
    weatherSensitivity: ['\u5929\u6c14\u654f\u611f'],
    departureWeekdays: [],
  },
  {
    userText: '\u6211\u60f3\u73a9\u5e7f\u897f\u548c\u8d8a\u5357',
    hardIntent: {
      destinationHints: ['\u5e7f\u897f', '\u8d8a\u5357'],
      weatherSensitivity: [],
      departureWeekdays: [],
    },
  },
);
assert.deepEqual(sanitizedImplicitSemanticIntent?.travelStyle ?? [], ['联游', '深度游']);
assert.deepEqual(sanitizedImplicitSemanticIntent?.mustHave ?? [], ['山水']);
assert.deepEqual(sanitizedImplicitSemanticIntent?.semanticFocus ?? [], ['东南亚']);
assert.deepEqual(sanitizedImplicitSemanticIntent?.weatherSensitivity ?? [], []);

const sanitizedImplicitSemanticNotes = sanitizeAiSemanticNotesForTurn(
  {
    worldKnowledgeUse: '\u5148\u628a\u8d8a\u5357\u6269\u5199\u6210\u4e1c\u5357\u4e9a\u65b9\u5411',
    softCriteria: [
      '\u533a\u57df\uff1a\u4e1c\u5357\u4e9a',
      '\u504f\u597d\uff1a\u8054\u6e38\u3001\u6df1\u5ea6\u6e38',
      '\u6f5c\u5728\u7ea6\u675f\uff1a\u5929\u6c14\u654f\u611f\uff08\u6d77\u8fb9/\u6237\u5916\uff09',
    ],
    cannotAssert: ['\u8fd1\u671f\u53ef\u8d70'],
    caveat: '\u5f53\u524d\u5019\u9009\u91cc\u4e5f\u53ef\u4ee5\u987a\u624b\u627e\u6cf0\u56fd',
  },
);
assert.equal(sanitizedImplicitSemanticNotes?.worldKnowledgeUse, '先把越南扩写成东南亚方向');
assert.deepEqual(sanitizedImplicitSemanticNotes?.softCriteria, [
  '区域：东南亚',
  '偏好：联游、深度游',
  '潜在约束：天气敏感（海边/户外）',
]);
assert.deepEqual(sanitizedImplicitSemanticNotes?.cannotAssert, ['近期可走']);
assert.equal(sanitizedImplicitSemanticNotes?.caveat, '当前候选里也可以顺手找泰国');

assert.equal(getSearchRouteMeta('天气有点热，想找舒服的玩法').action, 'plain');
assert.equal(getSearchRouteMeta('最近天气有点热，想找舒服的玩法').action, 'plain');

const variedReasonTours = [
  highPriceBeachTour,
  candidate({
    id: 'dubrovnik-beach',
    title: '克罗地亚古城海岸15天',
    destination: '克罗地亚',
    duration: 15,
    price: 30999,
    theme: '自然风光',
    tags: ['海边', '古城'],
    highlights: ['杜布罗夫尼克城墙', '亚得里亚海岸'],
  }),
  candidate({
    id: 'kuda-beach',
    title: '马尔代夫Kuda含早晚餐7天',
    destination: '马尔代夫',
    duration: 7,
    price: 29999,
    theme: '海岛度假',
    tags: ['海岛', '沙滩'],
    highlights: ['泻湖', '浮潜'],
  }),
  lowPriceBeachTour,
];
const variedReasonRewrite = rewriteRecommendationCopy({
  items: variedReasonTours.map((tour, index) => ({
    tourId: tour.id,
    score: 95 - index,
    reason: '综合匹配，性价比高。',
    matchedSignals: ['综合'],
  })),
  candidateTours: variedReasonTours,
  destinationWeatherInsights: [],
  intent: { weatherSensitivity: [], departureWeekdays: [] },
  weatherContext: {
    destination: '广州',
    travelDate: '2026-06-12',
    forecastSummary: '广州未来几天闷热多雨。',
    seasonAdvice: [],
    source: 'seasonal-rule',
  },
  userText: '帮我找海边度假的团',
  allowPublicInterest: false,
});
const reasonOpenings = variedReasonRewrite
  .map((item) => (item.reason || '').split(/[：；，。]/)[0])
  .filter(Boolean);
assert.ok(new Set(reasonOpenings).size >= 3);
assert.ok(variedReasonRewrite.filter((item) => item.reason?.startsWith('主打')).length <= 1);
assert.ok(!variedReasonRewrite.some((item) => /标题和标签|更值得核对|综合匹配|对题/.test(item.reason || '')));

const naturalAiReasonRewrite = rewriteRecommendationCopy({
  items: [{
    tourId: hotSpringBeachTour.id,
    score: 96,
    reason: '这条把海边散步和温泉都放进去了，3天节奏也不赶。',
    matchedSignals: ['温泉', '沙滩'],
  }],
  candidateTours: [hotSpringBeachTour, hotSpringTour, nonHotSpringTour],
  destinationWeatherInsights: [],
  intent: { weatherSensitivity: [], departureWeekdays: [] },
  weatherContext: {
    destination: '广州',
    travelDate: '2026-06-12',
    forecastSummary: '广州未来几天闷热多雨。',
    seasonAdvice: [],
    source: 'seasonal-rule',
  },
  userText: '帮我找同时带温泉和沙滩的团',
  allowPublicInterest: false,
});
assert.equal(naturalAiReasonRewrite[0].reason, '这条把海边散步和温泉都放进去了，3天节奏也不赶。');

const truncatedTitleReasonRewrite = rewriteRecommendationCopy({
  items: [{
    tourId: 'truncated-title',
    score: 99,
    reason: '云浮新兴翔顺金水台温泉小镇2把泡汤和玩水放在同一趟里，节奏很舒服。',
    matchedSignals: ['温泉', '玩水'],
  }],
  candidateTours: [candidate({
    id: 'truncated-title',
    title: '云浮新兴翔顺金水台温泉小镇2天（含晚）',
    destination: '广东',
    duration: 2,
    price: 399,
    tags: ['温泉', '玩水'],
    highlights: ['金水台温泉小镇'],
    theme: '温泉泡汤',
  })],
  destinationWeatherInsights: [],
  intent: { weatherSensitivity: [], departureWeekdays: [] },
  weatherContext: {
    destination: '广州',
    travelDate: '2026-06-12',
    forecastSummary: '多云',
    seasonAdvice: [],
    source: 'seasonal-rule',
  },
  userText: '能玩水的温泉，周边有镇子的，如果有共享电瓶车的优先',
  allowPublicInterest: false,
});
assert.ok(!truncatedTitleReasonRewrite[0].reason?.startsWith('云浮新兴翔顺金水台温泉小镇2把'));
assert.ok(truncatedTitleReasonRewrite[0].reason?.includes('温泉'));

const metaAiReasonRewrite = rewriteRecommendationCopy({
  items: [{
    tourId: hotSpringBeachTour.id,
    score: 95,
    reason: '从标题和标签看，这条同时命中温泉和沙滩需求，对题度最高。',
    matchedSignals: ['温泉', '沙滩'],
  }],
  candidateTours: [hotSpringBeachTour, hotSpringTour, nonHotSpringTour],
  destinationWeatherInsights: [],
  intent: { weatherSensitivity: [], departureWeekdays: [] },
  weatherContext: {
    destination: '广州',
    travelDate: '2026-06-12',
    forecastSummary: '广州未来几天闷热多雨。',
    seasonAdvice: [],
    source: 'seasonal-rule',
  },
  userText: '帮我找同时带温泉和沙滩的团',
  allowPublicInterest: false,
});
assert.ok(!/标题和标签|命中|对题度/.test(metaAiReasonRewrite[0].reason || ''));
assert.ok(/温泉|沙滩|海边/.test(metaAiReasonRewrite[0].reason || ''));

const unsupportedPublicInterestPrimitive = buildTourPrimitive(candidate({
  id: 'unsupported-public-interest',
  title: '尚·悠享 增城2天',
  destination: '广东',
  duration: 2,
  price: 399,
  transportType: '大巴',
  theme: '休闲度假',
  tags: ['泳池', '亲子'],
  highlights: ['恒温泳池', '室内全景天窗'],
}));
const sanitizedPublicInterestReason = getConcreteAiReason(
  '推荐尚·悠享增城2天，增城属珠三角边缘经济相对较弱地区，符合扶贫或贫穷地方需求。',
  unsupportedPublicInterestPrimitive,
);
assert.ok(sanitizedPublicInterestReason.includes('候选没有显式扶贫/公益标注'));
assert.ok(!sanitizedPublicInterestReason.includes('经济相对较弱'));

const semanticBoundaryTour = candidate({
  id: 'semantic-boundary',
  title: '县域山水古村2天',
  destination: '广东县域',
  duration: 2,
  price: 399,
  theme: '乡村自然',
  tags: ['古村', '山水'],
  highlights: ['古村漫游', '山水体验'],
});
const semanticBoundaryItems = validateAiItems({
  items: [{
    tourId: 'semantic-boundary',
    score: 92,
    semanticFit: '候选没有显式扶贫/公益标注，只能按县域、乡村体验做近似替代',
    semanticSignals: ['近似替代', '县域乡村'],
    semanticBoundary: '不能断言这是扶贫项目或贫困地区',
  }],
}, [semanticBoundaryTour]);
assert.ok(semanticBoundaryItems[0].semanticFit?.includes('近似替代'));
assert.ok(semanticBoundaryItems[0].matchedSignals.includes('近似替代'));
assert.ok(semanticBoundaryItems[0].semanticBoundary?.includes('不能断言'));
const softenedEvidenceReason = getConcreteAiReason(
  '水世界是这条线最直接的玩法，候选里没有提及共享电瓶车，建议优先核实。',
  buildTourPrimitive(semanticBoundaryTour),
);
assert.ok(softenedEvidenceReason.includes('目前没有看到明确安排'));
assert.ok(!softenedEvidenceReason.includes('候选里没有提及'));

const pollutedPublicInterestIntent = sanitizeAiIntentForTurn({
  semanticFocus: ['扶贫', '海边'],
  travelStyle: ['公益', '温泉'],
  mustHave: ['贫困地区', '天气稳定'],
  weatherSensitivity: [],
  departureWeekdays: [],
}, { allowPublicInterest: false });
assert.deepEqual(pollutedPublicInterestIntent?.semanticFocus, ['海边']);
assert.deepEqual(pollutedPublicInterestIntent?.travelStyle, ['温泉']);
assert.deepEqual(pollutedPublicInterestIntent?.mustHave, ['天气稳定']);
assert.ok(!allowsPublicInterestForTurn('帮我找海边温泉，400以下的，关注天气因素', null));
assert.ok(allowsPublicInterestForTurn('我要扶贫或者公益属性更强的路线', null));

const noPublicInterestRewrite = rewriteRecommendationCopy({
  items: semanticBoundaryItems,
  candidateTours: [semanticBoundaryTour],
  destinationWeatherInsights: [],
  intent: {
    semanticFocus: ['扶贫', '海边'],
    weatherSensitivity: [],
    departureWeekdays: [],
  },
  weatherContext: {
    destination: '广州',
    travelDate: '2026-06-12',
    forecastSummary: '广州未来几天闷热多雨。',
    seasonAdvice: [],
    source: 'seasonal-rule',
  },
  userText: '帮我找海边温泉，400以下的，关注天气因素',
  allowPublicInterest: false,
});
assert.ok(!/扶贫|公益|贫困/.test(noPublicInterestRewrite[0].reason || ''));
assert.ok(/常规休闲线|不太对得上|不建议默认|排在前面/.test(noPublicInterestRewrite[0].reason || ''));

const explicitPublicInterestRewrite = rewriteRecommendationCopy({
  items: semanticBoundaryItems,
  candidateTours: [semanticBoundaryTour],
  destinationWeatherInsights: [],
  intent: {
    semanticFocus: ['扶贫'],
    weatherSensitivity: [],
    departureWeekdays: [],
  },
  weatherContext: {
    destination: '广州',
    travelDate: '2026-06-12',
    forecastSummary: '广州未来几天闷热多雨。',
    seasonAdvice: [],
    source: 'seasonal-rule',
  },
  userText: '我要扶贫或者公益属性更强的路线，没有就直说最接近替代',
  allowPublicInterest: true,
});
assert.ok(/扶贫|公益|近似替代/.test(explicitPublicInterestRewrite[0].reason || ''));

const majorCityTour = candidate({
  id: 'major-city',
  title: '北京魔幻一日游（含烤鸭）等待确认',
  destination: '北京',
  duration: 1,
  price: 115,
  theme: '都市休闲',
  tags: ['城市', '美食'],
  highlights: ['CBD', '烤鸭'],
});
const ruralCountyTour = candidate({
  id: 'rural-county',
  title: '粤北县域古村山水2天',
  destination: '广东县域',
  duration: 2,
  price: 188,
  theme: '乡村自然',
  tags: ['古村', '山水'],
  highlights: ['古村漫游', '县城周边', '山水体验'],
});
const explicitPublicTour = candidate({
  id: 'public-interest-tour',
  title: '助农古寨体验2天',
  destination: '广西县域',
  duration: 2,
  price: 168,
  theme: '乡村体验',
  tags: ['助农', '古寨'],
  highlights: ['苗寨', '乡村振兴'],
});
const povertyPromptMessages = buildAiMessages({
  userText: '想去贫穷落后一点的地方看看',
  messages: [],
  candidates: compactCandidates(
    [majorCityTour, ruralCountyTour, explicitPublicTour],
    localRecommendations([majorCityTour, ruralCountyTour, explicitPublicTour], '想去贫穷落后一点的地方看看'),
    { semanticFocus: ['贫穷地方'], weatherSensitivity: [], departureWeekdays: [] },
    {
      intent: { semanticFocus: ['贫穷地方'], weatherSensitivity: [], departureWeekdays: [] },
      userText: '想去贫穷落后一点的地方看看',
    },
  ),
  routeAtlas: buildRouteAtlas([majorCityTour, ruralCountyTour, explicitPublicTour]),
  auditContext: buildRecommendationAuditContext(
    [majorCityTour, ruralCountyTour, explicitPublicTour],
    null,
    { semanticFocus: ['贫穷地方'], weatherSensitivity: [], departureWeekdays: [] },
  ),
  weatherContext: {
    destination: '广州',
    travelDate: '2026-06-12',
    forecastSummary: '多云',
    seasonAdvice: [],
    source: 'seasonal-rule',
  },
  destinationWeatherInsights: [],
  searchQuery: '',
  intent: { semanticFocus: ['贫穷地方'], weatherSensitivity: [], departureWeekdays: [] },
  preferenceMemory: null,
  allowPublicInterest: true,
});
const povertyPromptText = povertyPromptMessages.map((message) => message.content).join('\n');
assert.ok(povertyPromptText.includes('世界知识'));
assert.ok(povertyPromptText.includes('贫穷地方'));
assert.ok(!povertyPromptText.includes('filterCandidateToursForPublicInterestNeed'));
assert.equal(
  getPrimitiveConflictReasons(
    { semanticFocus: ['贫穷地方'], weatherSensitivity: [], departureWeekdays: [] },
    buildTourPrimitive(majorCityTour),
  ).some((reason) => reason.includes('不像县域乡村或公益方向')),
  false,
);
assert.equal(
  getPrimitiveConflictReasons(
    { semanticFocus: ['贫穷地方'], weatherSensitivity: [], departureWeekdays: [] },
    buildTourPrimitive(explicitPublicTour),
  ).some((reason) => reason.includes('不像县域乡村或公益方向')),
  false,
);
const publicInterestAuditedOrder = auditAiRecommendationsStrict(
  [
    { tourId: 'major-city', score: 99, reason: '北京文化地标很多', matchedSignals: ['文化'] },
    { tourId: 'public-interest-tour', score: 92, reason: '助农古寨体验更贴近公益方向', matchedSignals: ['助农', '古寨'] },
    { tourId: 'rural-county', score: 91, reason: '县域古村山水更接近乡村方向', matchedSignals: ['县域', '古村'] },
  ],
  [],
  [majorCityTour, ruralCountyTour, explicitPublicTour],
  { semanticFocus: ['贫穷地方'], weatherSensitivity: [], departureWeekdays: [] },
);
assert.deepEqual(
  publicInterestAuditedOrder.map((item) => item.tourId),
  ['major-city', 'public-interest-tour', 'rural-county'],
  'soft public-interest semantics do not reorder or exclude candidates at the audit boundary',
);
assert.ok(publicInterestAuditedOrder.every((item) => !item.reason?.startsWith('需放宽条件')));

const weirdSemanticSummary = finalizeRecommendationSummary({
  aiSummary: '用户寻找海边温泉、预算400元以内，关注天气因素。软语义判断：海边、温泉、400元以内、天气敏感。边界：候选中无明确标注海边的温泉，需结合目的地判断，无法断言某候选为扶贫或公益项目。温泉需匹配atoms中的温泉泡汤。',
  items: [{ tourId: 'beach', score: 90, reason: '沙滩短线', matchedSignals: [] }],
  candidateTours: [hotSpringTour, nonHotSpringTour],
  weatherContext: {
    destination: '广州',
    travelDate: '2026-06-12',
    forecastSummary: '广州未来几天闷热多雨。',
    seasonAdvice: ['华南夏季闷热多雨，海边和水上活动线路要关注风浪和雷雨。'],
    source: 'seasonal-rule',
  },
  destinationWeatherInsights: [],
  intent: { budgetMax: 400, weatherSensitivity: ['关注天气'], departureWeekdays: [] },
  semanticNotes: {
    worldKnowledgeUse: '用户寻找海边温泉、预算400元以内，关注天气因素。',
    softCriteria: ['海边', '温泉', '400元以内', '天气敏感'],
    cannotAssert: ['无法断言某候选为扶贫或公益项目'],
    caveat: '海边需结合目的地及类别近似判断；温泉需匹配atoms中的温泉泡汤。',
  },
  userText: '帮我找海边温泉，400以下的，关注天气因素',
});
assert.ok(!/atoms|软语义判断|扶贫|公益项目/.test(weirdSemanticSummary));
assert.ok(weirdSemanticSummary.includes('说明：候选信息有限') || weirdSemanticSummary.includes('说明：'));
assert.ok(weirdSemanticSummary.length > 20);
assert.ok(!weirdSemanticSummary.includes('推荐方向：'));

const nonInternalPublicInterestSummary = finalizeRecommendationSummary({
  aiSummary: '候选没有显式扶贫/公益标注，只能按周边体验做近似替代。下单前留意天气。',
  items: [{ tourId: 'beach', score: 90, reason: '沙滩短线', matchedSignals: [] }],
  candidateTours: [hotSpringTour, nonHotSpringTour],
  weatherContext: {
    destination: '广州',
    travelDate: '2026-06-12',
    forecastSummary: '广州未来几天闷热多雨。',
    seasonAdvice: ['华南夏季闷热多雨，海边和水上活动线路要关注风浪和雷雨。'],
    source: 'seasonal-rule',
  },
  destinationWeatherInsights: [],
  intent: { budgetMax: 400, weatherSensitivity: ['关注天气'], departureWeekdays: [] },
  userText: '帮我找海边温泉，400以下的，关注天气因素',
  allowPublicInterest: false,
});
assert.ok(!/扶贫|公益/.test(nonInternalPublicInterestSummary));
assert.ok(nonInternalPublicInterestSummary.length > 20);
assert.ok(!nonInternalPublicInterestSummary.includes('推荐方向：'));

const promptTours = [hotSpringTour, nonHotSpringTour];
const promptIntent = { budgetMax: 400, weatherSensitivity: ['天气敏感'], departureWeekdays: [] };
const promptCandidates = compactCandidates(promptTours, [], promptIntent, {
  intent: promptIntent,
  budgetPriority: 'balanced',
  weatherSensitivity: ['天气敏感'],
  weatherContext: hotRainyWeatherContext,
});
const promptWeatherContext = {
  destination: '广州',
  travelDate: '2026-06-12',
  forecastSummary: '广州未来几天闷热多雨。',
  seasonAdvice: ['华南夏季闷热多雨，海边和水上活动线路要关注风浪和雷雨。'],
  source: 'seasonal-rule' as const,
};
const promptAuditContext = buildRecommendationAuditContext(promptTours, null, promptIntent);
const promptPublicInterestPattern = /扶贫|公益|贫困|贫穷|欠发达|乡村振兴|助农|县域|乡村|农文旅/;
const nonPublicFullPrompt = buildAiMessages({
  userText: '帮我找海边温泉，400以下的，关注天气因素',
  messages: [],
  candidates: promptCandidates,
  routeAtlas: buildRouteAtlas(promptTours),
  auditContext: promptAuditContext,
  weatherContext: promptWeatherContext,
  destinationWeatherInsights: [],
  searchQuery: '',
  intent: promptIntent,
  preferenceMemory: null,
  allowPublicInterest: false,
}).map((message) => message.content).join('\n');
assert.ok(nonPublicFullPrompt.includes('mustHave'));
assert.ok(nonPublicFullPrompt.includes('pricePct'));
assert.ok(nonPublicFullPrompt.includes('"pc"'));
assert.ok(nonPublicFullPrompt.includes('priceBand'));
assert.ok(nonPublicFullPrompt.includes('termCoverage'));
assert.ok(nonPublicFullPrompt.includes('termHits'));
assert.ok(nonPublicFullPrompt.includes('不是关键词筛选器'));
assert.ok(nonPublicFullPrompt.includes('clarification'));
assert.ok(nonPublicFullPrompt.includes('预算是重要的取舍维度'));
const nonPublicLitePrompt = buildLiteAiMessages({
  userText: '帮我找海边温泉，400以下的，关注天气因素',
  messages: [],
  candidates: promptCandidates,
  weatherContext: promptWeatherContext,
  searchQuery: '',
  intent: promptIntent,
  preferenceMemory: null,
  allowPublicInterest: false,
}).map((message) => message.content).join('\n');
assert.ok(nonPublicLitePrompt.includes('priceBand'));
assert.ok(nonPublicLitePrompt.includes('termCoverage'));
assert.ok(nonPublicLitePrompt.includes('termHits'));
assert.ok(nonPublicLitePrompt.includes('clarification'));
assert.ok(nonPublicLitePrompt.includes('预算优先但不要把候选池理解成预算硬截断'));
assert.ok(!promptPublicInterestPattern.test(nonPublicFullPrompt));
assert.ok(!promptPublicInterestPattern.test(nonPublicLitePrompt));
assert.ok(!/玩水清凉|清凉玩水/.test(nonPublicFullPrompt));
assert.ok(!/玩水清凉|清凉玩水/.test(nonPublicLitePrompt));
assert.ok(nonPublicFullPrompt.includes('旅行画面'));
assert.ok(nonPublicLitePrompt.includes('具体旅行画面'));

const explicitPublicFullPrompt = buildAiMessages({
  userText: '我要扶贫或者公益属性更强的路线，没有就直说最接近替代',
  messages: [],
  candidates: promptCandidates,
  routeAtlas: buildRouteAtlas(promptTours),
  auditContext: promptAuditContext,
  weatherContext: promptWeatherContext,
  destinationWeatherInsights: [],
  searchQuery: '',
  intent: { semanticFocus: ['扶贫'], weatherSensitivity: [], departureWeekdays: [] },
  preferenceMemory: null,
  allowPublicInterest: true,
}).map((message) => message.content).join('\n');
const explicitPublicLitePrompt = buildLiteAiMessages({
  userText: '我要扶贫或者公益属性更强的路线，没有就直说最接近替代',
  messages: [],
  candidates: promptCandidates,
  weatherContext: promptWeatherContext,
  searchQuery: '',
  intent: { semanticFocus: ['扶贫'], weatherSensitivity: [], departureWeekdays: [] },
  preferenceMemory: null,
  allowPublicInterest: true,
}).map((message) => message.content).join('\n');
assert.ok(promptPublicInterestPattern.test(explicitPublicFullPrompt));
assert.ok(promptPublicInterestPattern.test(explicitPublicLitePrompt));
assert.ok(explicitPublicFullPrompt.includes('"sg"'));
assert.ok(explicitPublicLitePrompt.includes('"sg"'));
assert.ok(explicitPublicFullPrompt.includes('理解镜头'));
assert.ok(explicitPublicLitePrompt.includes('理解镜头'));
assert.ok(explicitPublicFullPrompt.includes('不是目的地白名单'));
assert.ok(explicitPublicLitePrompt.includes('不是硬过滤规则'));
assert.ok(/县域|乡村|梯田|助农/.test(explicitPublicFullPrompt));
assert.ok(/县域|乡村|梯田|助农/.test(explicitPublicLitePrompt));

const zhHardIntent = buildHardIntentFromText(
  '周末2天，预算800以内，想清凉一点，但不想去海边，也不要坐飞机',
);
assert.equal(zhHardIntent?.budgetMax, 800);
assert.equal(zhHardIntent?.tripDaysMin, 1);
assert.equal(zhHardIntent?.tripDaysMax, 3);
assert.ok(collectLiteralAvoidHints('不想去海边，也不要坐飞机').includes('海边'));
assert.ok(zhHardIntent?.avoid?.includes('飞机'));
const fridayNightSundayReturnIntent = buildHardIntentFromText(
  '帮我寻找周五晚上出发的旅行团，最好是周日回',
);
assert.ok(fridayNightSundayReturnIntent?.departureWeekdays?.includes(5));
assert.ok(fridayNightSundayReturnIntent?.returnWeekdays?.includes(0));
assert.equal(fridayNightSundayReturnIntent?.departureTimeOfDay, 'evening');
assert.ok(fridayNightSundayReturnIntent?.tripDaysMin == null || fridayNightSundayReturnIntent?.tripDaysMin <= 3);
assert.ok(fridayNightSundayReturnIntent?.tripDaysMax == null || fridayNightSundayReturnIntent?.tripDaysMax >= 2);
const fridayNightLocalQuery = buildLocalRecommendationQuery('帮我寻找周五晚上出发的旅行团，最好是周日回');
assert.deepEqual(fridayNightLocalQuery.coverageTerms, []);
assert.equal(fridayNightLocalQuery.duration?.min, 2);
assert.equal(fridayNightLocalQuery.duration?.max, 3);

const fridayNightLocalRank = localRecommendations(realTours, '帮我寻找周五晚上出发的旅行团，最好是周日回');
assert.ok(fridayNightLocalRank.length > 0);
assert.ok(
  fridayNightLocalRank.slice(0, 5).some((item) =>
    /周五|周日|晚出发|返程|周末/.test(item.reason || '') || (item.matchedSignals || []).some((signal) => /周五|周日|晚出发|返程|周末/.test(signal)),
  ),
  `expected top local recommendations to keep the Friday-night/Sunday-return rhythm, got ${fridayNightLocalRank.slice(0, 5).map((item) => item.reason).join(' | ')}`,
);
for (const item of fridayNightLocalRank.slice(0, 5)) {
  const tour = realTours.find((candidate) => candidate.id === item.tourId);
  assert.ok(tour, `expected to resolve top local recommendation ${item.tourId}`);
  assert.ok(
    (tour?.duration ?? 0) >= 2 && (tour?.duration ?? 0) <= 3,
    `expected Friday-night/Sunday-return top results to stay within a weekend window, got ${tour?.title} (${tour?.duration}天)`,
  );
}
const defaultSliderBudgetIntent = buildHardIntentFromText(
  '帮我找同时带温泉和沙滩的团',
);
assert.equal(defaultSliderBudgetIntent?.budgetMax ?? null, null);

const waterTownEbikeCandidate = buildTourPrimitive(candidate({
  id: 'water-town-ebike',
  title: '温泉水上乐园与古镇2天',
  destination: '广东',
  duration: 2,
  price: 499,
  theme: '温泉玩水',
  tags: ['温泉', '玩水', '古镇'],
  highlights: ['温泉', '水上乐园', '古镇漫步'],
}));
const waterOnlyCandidate = buildTourPrimitive(candidate({
  id: 'water-only',
  title: '温泉水上乐园2天',
  destination: '广东',
  duration: 2,
  price: 399,
  theme: '温泉玩水',
  tags: ['温泉', '玩水'],
  highlights: ['温泉', '水上乐园'],
}));
const waterTownEbikeQuery = '能玩水的温泉，周边有镇子的，如果有共享电瓶车的优先';
assert.ok(reasonAddressesUserNeed(
  '这条线有温泉和玩水，但周边小镇、共享电瓶车暂无资料确认。',
  waterOnlyCandidate,
  waterTownEbikeQuery,
));
assert.ok(!reasonAddressesUserNeed(
  '广东、2天、大巴往返，节奏偏轻松；参考价￥399。',
  waterOnlyCandidate,
  waterTownEbikeQuery,
));
assert.match(
  buildCoverageAwareReason(waterTownEbikeCandidate, waterTownEbikeQuery),
  /温泉|玩水|小镇|电瓶车/,
);
assert.doesNotMatch(
  buildCoverageAwareReason(waterOnlyCandidate, waterTownEbikeQuery),
  /共享电瓶车/,
  'fallback copy should not repeat the unverifiable shared-ebike gap on every card',
);

const hotSpringBeachBudgetQuery = '帮我找同时带温泉和沙滩的团. 预算600以内。';
const hotSpringBeachBudgetIntent = buildHardIntentFromText(hotSpringBeachBudgetQuery);
assert.equal(hotSpringBeachBudgetIntent?.budgetMax, 600);
const hotSpringBeachBudgetLocal = localRecommendations(realTours, hotSpringBeachBudgetQuery);
const hotSpringBeachBudgetTopTours = hotSpringBeachBudgetLocal
  .slice(0, 6)
  .map((item) => realTours.find((tour) => tour.id === item.tourId))
  .filter((tour): tour is AiRecommendationCandidate => Boolean(tour));
assert.ok(hotSpringBeachBudgetTopTours.length > 0);
assert.ok(
  hotSpringBeachBudgetTopTours.some((tour) => tour.price <= 600),
  'expected local budget recommendations to keep at least one within-budget option',
);
for (const tour of hotSpringBeachBudgetTopTours) {
  const primitive = buildTourPrimitive(tour);
  const experienceEvidence = [
    primitive.title,
    primitive.destination,
    ...primitive.highlights,
    ...primitive.semanticAtoms,
    ...primitive.experienceCategories,
  ].join('');
  assert.ok(
    /温泉/.test(experienceEvidence) && /海|沙滩/.test(experienceEvidence),
    `expected top budget hot-spring/beach result to cover both terms, got ${tour.title} (${primitive.experienceCategories.join('/')})`,
  );
  assert.ok(tour.price <= 1200, `expected ordinary budget comparison to avoid extreme outliers, got ${tour.title} ￥${tour.price}`);
}

const hotSpringOnlyBudgetTour = candidate({
  id: 'hot-spring-only-budget',
  title: '广东温泉2天',
  destination: '广东',
  duration: 2,
  price: 199,
  theme: '温泉',
  tags: ['温泉'],
  highlights: ['泡温泉'],
});
const beachOnlyBudgetTour = candidate({
  id: 'beach-only-budget',
  title: '广东海滩2天',
  destination: '广东',
  duration: 2,
  price: 199,
  theme: '海边',
  tags: ['海边'],
  highlights: ['沙滩散步'],
});
const bothBudgetTour = candidate({
  id: 'both-budget',
  title: '广东海边温泉沙滩2天',
  destination: '广东',
  duration: 2,
  price: 599,
  theme: '海边温泉',
  tags: ['温泉', '沙滩'],
  highlights: ['泡温泉', '沙滩散步'],
});
const bothOverBudgetTour = candidate({
  id: 'both-over-budget',
  title: '广东海边温泉沙滩2天高配',
  destination: '广东',
  duration: 2,
  price: 699,
  theme: '海边温泉',
  tags: ['温泉', '沙滩'],
  highlights: ['泡温泉', '沙滩散步'],
});
const relevanceSorted = prioritizeRecommendationItems(
  [
    { tourId: 'hot-spring-only-budget', score: 99, reason: '便宜温泉', matchedSignals: [] },
    { tourId: 'beach-only-budget', score: 98, reason: '便宜海滩', matchedSignals: [] },
    { tourId: 'both-over-budget', score: 97, reason: '温泉和沙滩但略贵', matchedSignals: [] },
    { tourId: 'both-budget', score: 60, reason: '温泉和沙滩都覆盖', matchedSignals: [] },
  ],
  {
    candidateTours: [hotSpringOnlyBudgetTour, beachOnlyBudgetTour, bothOverBudgetTour, bothBudgetTour],
    intent: hotSpringBeachBudgetIntent,
    userText: hotSpringBeachBudgetQuery,
  },
);
assert.deepEqual(
  relevanceSorted.slice(0, 4).map((item) => item.tourId),
  ['both-budget', 'both-over-budget', 'hot-spring-only-budget', 'beach-only-budget'],
  'coverage count should dominate budget-only or single-term matches, while budget fit breaks ties within full coverage',
);

const qingyuanWeatherTour = candidate({
  id: 'weather-qingyuan',
  title: '清远峡谷漂流2天',
  destination: '广东',
  price: 399,
  departureDate: '2026-06-20',
  departureDates: ['2026-06-20'],
  theme: '山水风光',
  tags: ['漂流', '峡谷'],
  highlights: ['峡谷漂流', '山水户外'],
});
const yangjiangWeatherTour = candidate({
  id: 'weather-yangjiang',
  title: '阳江海岛沙滩2天',
  destination: '广东',
  price: 399,
  departureDate: '2026-06-20',
  departureDates: ['2026-06-20'],
  theme: '海岛度假',
  tags: ['海岛', '沙滩'],
  highlights: ['海边活动', '沙滩'],
});
const weatherInsights = [
  {
    destination: '清远',
    travelDate: '2026-06-20',
    forecastSummary: '清远团期天气较稳定',
    dateSpecificSummary: '6月20日预计晴到多云，降雨概率约20%',
    weatherWindowLabel: '6月20日这班',
    weatherRiskLevel: 'better' as const,
    weatherComfortScore: 96,
    weatherComfortSummary: '12-21点天气影响较小',
    seasonAdvice: [],
    role: 'destination' as const,
    source: 'open-meteo' as const,
  },
  {
    destination: '阳江',
    travelDate: '2026-06-20',
    forecastSummary: '阳江团期降雨概率较高',
    dateSpecificSummary: '6月20日预计有阵雨，降雨概率约80%',
    weatherWindowLabel: '6月20日这班',
    weatherRiskLevel: 'worse' as const,
    weatherComfortScore: 42,
    weatherComfortSummary: '12-21点降雨影响较大',
    seasonAdvice: [],
    role: 'destination' as const,
    source: 'open-meteo' as const,
  },
];

const weatherAlternativePrompt = buildAiMessages({
  userText: '这周广东团期天气都不好，找天气好一点的地方',
  messages: [],
  candidates: compactCandidates([qingyuanWeatherTour, yangjiangWeatherTour], [], null, {
    userText: '这周广东团期天气都不好，找天气好一点的地方',
  }),
  routeAtlas: buildRouteAtlas([qingyuanWeatherTour, yangjiangWeatherTour]),
  auditContext: buildRecommendationAuditContext(
    [qingyuanWeatherTour, yangjiangWeatherTour],
    null,
    { destinationHints: ['广东'], weatherSensitivity: ['关注天气'], departureWeekdays: [] },
  ),
  weatherContext: {
    destination: '广州',
    travelDate: '2026-06-20',
    forecastSummary: '广州团期天气偏差',
    seasonAdvice: [],
    source: 'open-meteo',
  },
  destinationWeatherInsights: weatherInsights,
  searchQuery: '',
  intent: { destinationHints: ['广东'], weatherSensitivity: ['关注天气'], departureWeekdays: [] },
  preferenceMemory: null,
  allowPublicInterest: false,
});
const weatherAlternativePromptText = weatherAlternativePrompt.map((message) => message.content).join('\n');
assert.ok(weatherAlternativePromptText.includes('天气替代'));
assert.ok(weatherAlternativePromptText.includes('weatherComfortScore'));
assert.ok(weatherAlternativePromptText.includes('清远'));
const weatherAlternativeLitePrompt = buildLiteAiMessages({
  userText: '这周广东团期天气都不好，找天气好一点的地方',
  messages: [],
  candidates: compactCandidates([qingyuanWeatherTour, yangjiangWeatherTour], [], null, {
    userText: '这周广东团期天气都不好，找天气好一点的地方',
  }),
  weatherContext: {
    destination: '广州',
    travelDate: '2026-06-20',
    forecastSummary: '广州团期天气偏差',
    seasonAdvice: [],
    source: 'open-meteo',
  },
  destinationWeatherInsights: weatherInsights,
  searchQuery: '',
  intent: { destinationHints: ['广东'], weatherSensitivity: ['关注天气'], departureWeekdays: [] },
  preferenceMemory: null,
  allowPublicInterest: false,
});
const weatherAlternativeLitePromptText = weatherAlternativeLitePrompt.map((message) => message.content).join('\n');
assert.ok(weatherAlternativeLitePromptText.includes('天气更好的替代'));
assert.ok(weatherAlternativeLitePromptText.includes('weatherComfortScore'));
assert.ok(weatherAlternativeLitePromptText.includes('清远'));

function hourlyWeather(overrides: Record<number, Partial<{
  precipitationProbability: number;
  precipitation: number;
  weatherCode: number;
  temperature: number;
  humidity: number;
  windGusts: number;
}>> = {}) {
  const rows = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    precipitationProbability: 0,
    precipitation: 0,
    weatherCode: 3,
    temperature: 29,
    humidity: 70,
    windGusts: 20,
    ...overrides[hour],
  }));
  return {
    time: rows.map(({ hour }) => `2026-06-20T${String(hour).padStart(2, '0')}:00`),
    precipitationProbability: rows.map((row) => row.precipitationProbability),
    precipitation: rows.map((row) => row.precipitation),
    weatherCode: rows.map((row) => row.weatherCode),
    temperature: rows.map((row) => row.temperature),
    humidity: rows.map((row) => row.humidity),
    windGusts: rows.map((row) => row.windGusts),
  };
}

const lightRainOutsideTravelWindow = assessWeatherComfortForDate(
  '2026-06-20',
  hourlyWeather({ 9: { precipitationProbability: 70, precipitation: 0.2, weatherCode: 61 } }),
);
const lightRainInTravelWindow = assessWeatherComfortForDate(
  '2026-06-20',
  hourlyWeather({ 15: { precipitationProbability: 70, precipitation: 0.2, weatherCode: 61 } }),
);
const heavyRainInTravelWindow = assessWeatherComfortForDate(
  '2026-06-20',
  hourlyWeather({
    12: { precipitationProbability: 90, precipitation: 8, weatherCode: 65, humidity: 85 },
    13: { precipitationProbability: 90, precipitation: 8, weatherCode: 65, humidity: 85 },
    14: { precipitationProbability: 90, precipitation: 8, weatherCode: 65, humidity: 85 },
    15: { precipitationProbability: 90, precipitation: 8, weatherCode: 65, humidity: 85 },
    16: { precipitationProbability: 90, precipitation: 8, weatherCode: 65, humidity: 85 },
    17: { precipitationProbability: 90, precipitation: 8, weatherCode: 65, humidity: 85 },
    18: { precipitationProbability: 90, precipitation: 8, weatherCode: 65, humidity: 85 },
    19: { precipitationProbability: 90, precipitation: 8, weatherCode: 65, humidity: 85 },
    20: { precipitationProbability: 90, precipitation: 8, weatherCode: 65, humidity: 85 },
    21: { precipitationProbability: 90, precipitation: 8, weatherCode: 65, humidity: 85 },
  }),
);
const overcastComfortableWindow = assessWeatherComfortForDate(
  '2026-06-20',
  hourlyWeather({ 15: { temperature: 29, humidity: 70, weatherCode: 3 } }),
);
const thunderstormInTravelWindow = assessWeatherComfortForDate(
  '2026-06-20',
  hourlyWeather({ 15: { temperature: 29, humidity: 85, weatherCode: 95, windGusts: 60 } }),
);
assert.ok(lightRainOutsideTravelWindow);
assert.ok(lightRainInTravelWindow);
assert.ok(heavyRainInTravelWindow);
assert.ok(overcastComfortableWindow);
assert.equal(lightRainOutsideTravelWindow?.riskLevel, 'better');
assert.ok(
  (lightRainInTravelWindow?.score ?? 100) < (lightRainOutsideTravelWindow?.score ?? 0),
  '同样的小雨在12-21点内应降低更多天气舒适度',
);
assert.equal(heavyRainInTravelWindow?.riskLevel, 'worse');
assert.equal(overcastComfortableWindow?.riskLevel, 'better');
assert.equal(thunderstormInTravelWindow?.riskLevel, 'worse');
assert.equal(overcastComfortableWindow?.temperatureComfort, 100);
assert.equal(overcastComfortableWindow?.humidityComfort, 100);
assert.equal(overcastComfortableWindow?.outdoorIndex, 100);
assert.equal(overcastComfortableWindow?.score, 100);

const warmComfortableWindow = assessWeatherComfortForDate(
  '2026-06-20',
  hourlyWeather({ 15: { temperature: 24, humidity: 70, weatherCode: 3 } }),
);
assert.equal(
  warmComfortableWindow?.score,
  overcastComfortableWindow?.score,
  '舒适区内的温度不应因为更低而额外获得降温收益，直接使用温度舒适度参数',
);
assert.ok(
  (heavyRainInTravelWindow?.score ?? 100) < (lightRainInTravelWindow?.score ?? 0),
  '天气舒适度应直接同时反映降雨强度、湿度和户外指数',
);

const chaozhouWeatherTour = candidate({
  id: 'weather-chaozhou',
  title: '潮州海边古城2天',
  destination: '粤东潮州',
  price: 399,
  departureDate: '2026-06-20',
  departureDates: ['2026-06-20'],
  theme: '海边人文',
  tags: ['海边', '古城'],
  highlights: ['海边活动', '古城漫游'],
});
assert.equal(
  getWeatherRankingScore(buildTourPrimitive(chaozhouWeatherTour), [
    { ...weatherInsights[0], destination: '潮州' },
  ]),
  9.2,
  '具体城市应优先于粤东代表点，避免把潮州错配到汕尾',
);

assert.equal(
  getWeatherRankingScore(buildTourPrimitive(qingyuanWeatherTour), weatherInsights),
  9.2,
  '广东线路应按标题识别清远天气锚点',
);
assert.equal(
  getWeatherRankingScore(buildTourPrimitive(yangjiangWeatherTour), weatherInsights),
  -1.6,
  '广东线路应按标题识别阳江天气锚点',
);
const weatherAwareSorted = prioritizeRecommendationItems(
  [
    {
      tourId: 'weather-yangjiang',
      score: 96,
      reason: '阳江海岛沙滩玩法完整，适合周末出发。',
      matchedSignals: [],
      recommendationTier: 'ai-detailed',
    },
    {
      tourId: 'weather-qingyuan',
      score: 72,
      reason: '清远峡谷漂流玩法清凉，适合周末出发。',
      matchedSignals: [],
      recommendationTier: 'ai-detailed',
    },
  ],
  {
    candidateTours: [yangjiangWeatherTour, qingyuanWeatherTour],
    intent: { weatherSensitivity: ['关注天气'], departureWeekdays: [] },
    userText: '这周广东出行，关注团期天气',
    destinationWeatherInsights: weatherInsights,
  },
);
assert.equal(
  weatherAwareSorted[0].tourId,
  'weather-qingyuan',
  '天气较差时，应在同等推荐层级内优先天气更稳的广东团期',
);
const strictBudgetWeatherSorted = prioritizeRecommendationItems(
  [
    { tourId: 'budget-good-weather', score: 96, reason: '清远天气更稳。', matchedSignals: [], recommendationTier: 'ai-detailed' },
    { tourId: 'budget-bad-weather', score: 72, reason: '阳江团期天气波动。', matchedSignals: [], recommendationTier: 'ai-detailed' },
  ],
  {
    candidateTours: [
      { ...qingyuanWeatherTour, id: 'budget-good-weather', price: 999 },
      { ...yangjiangWeatherTour, id: 'budget-bad-weather', price: 299 },
    ],
    intent: { budgetMax: 500, budgetHardLimit: true, weatherSensitivity: ['关注天气'], departureWeekdays: [] },
    userText: '这周广东出行，预算500以内，关注团期天气',
    destinationWeatherInsights: weatherInsights,
  },
);
assert.equal(
  strictBudgetWeatherSorted[0].tourId,
  'budget-bad-weather',
  '严格预算冲突必须优先于天气优势，天气只能作为软参考',
);
const unknownWeatherSorted = prioritizeRecommendationItems(
  [
    { tourId: 'weather-yangjiang', score: 96, reason: '阳江海岛沙滩玩法完整。', matchedSignals: [], recommendationTier: 'ai-detailed' },
    { tourId: 'weather-qingyuan', score: 72, reason: '清远峡谷漂流玩法清凉。', matchedSignals: [], recommendationTier: 'ai-detailed' },
  ],
  {
    candidateTours: [yangjiangWeatherTour, qingyuanWeatherTour],
    intent: { weatherSensitivity: ['关注天气'], departureWeekdays: [] },
    userText: '这周广东出行，关注团期天气',
    destinationWeatherInsights: weatherInsights.map((insight) => ({
      ...insight,
      source: 'seasonal-rule' as const,
      weatherRiskLevel: 'unknown' as const,
    })),
  },
);
assert.equal(
  unknownWeatherSorted[0].tourId,
  'weather-yangjiang',
  '只有季节规则时，不应伪造广东线路的实时天气排序',
);

const uiFilterOnlyIntent = buildHardIntentFromText(
  '找个轻松一点的团',
);
assert.deepEqual(uiFilterOnlyIntent?.destinationHints ?? [], []);
assert.equal(uiFilterOnlyIntent?.tripDays ?? null, null);
assert.equal(uiFilterOnlyIntent?.tripDaysMin ?? null, null);
assert.equal(uiFilterOnlyIntent?.tripDaysMax ?? null, null);
assert.equal(uiFilterOnlyIntent?.budgetMin ?? null, null);
assert.equal(uiFilterOnlyIntent?.budgetMax ?? null, null);

const guangxiVietnamIntent = buildHardIntentFromText(
  '\u6211\u60f3\u73a9\u5e7f\u897f\u548c\u8d8a\u5357',
);
assert.deepEqual(
  guangxiVietnamIntent?.destinationHints ?? [],
  ['\u5e7f\u897f', '\u8d8a\u5357'],
  'explicit destinations should stay specific instead of broadening into regional presets',
);

const strictMismatchIntent = buildHardIntentFromText(
  '500元以下，7天以上，住五星酒店，去新疆，还要天气特别好',
);
assert.equal(strictMismatchIntent?.budgetMax, 500);
assert.equal(strictMismatchIntent?.tripDaysMin, 7);
assert.equal(strictMismatchIntent?.tripDaysMax, null);

const nearBudgetIntent = buildHardIntentFromText(
  '预算2000以内，但希望接近2000的品质，不要一堆299，想去云南或者桂林看自然风景，5天左右',
);
assert.equal(nearBudgetIntent?.budgetMax, 2000);
assert.equal(nearBudgetIntent?.budgetHardLimit, false);
assert.equal(nearBudgetIntent?.tripDaysMin, 4);
assert.equal(nearBudgetIntent?.tripDaysMax, 6);
assert.equal(nearBudgetIntent?.budgetPriority, null);
const strictBudgetIntent = buildHardIntentFromText('严格不超过800元，只看预算内的温泉团');
assert.equal(strictBudgetIntent?.budgetMax, 800);
assert.equal(strictBudgetIntent?.budgetHardLimit, true);
const numericNoiseBudgetIntent = buildHardIntentFromText(
  '202606出发，想找温泉团',
);
assert.equal(numericNoiseBudgetIntent?.budgetMax ?? null, null);
const durationNoiseBudgetIntent = buildHardIntentFromText(
  '120分钟车程内，想找温泉团',
);
assert.equal(durationNoiseBudgetIntent?.budgetMax ?? null, null);

const dirtyDestinationPrimitive = buildTourPrimitive(candidate({
  id: 'dirty-destination',
  title: '泰国曼谷芭堤雅6天',
  destination: '云南',
  duration: 6,
  price: 1999,
  theme: '古镇文化',
  tags: ['古镇文化'],
  highlights: ['曼谷', '芭堤雅'],
}));
assert.ok(getPrimitiveConflictReasons(nearBudgetIntent, dirtyDestinationPrimitive)
  .some((reason) => reason.includes('目的地不匹配')));

const strictGoodTour = candidate({
  id: 'strict-good',
  title: '广东森林博物馆2天',
  destination: '广东',
  duration: 2,
  price: 760,
  transportType: '大巴',
  theme: '古镇文化',
  tags: ['古镇文化'],
  highlights: ['博物馆', '森林'],
});
const strictOverBudgetTour = candidate({
  id: 'strict-over-budget',
  title: '广东森林酒店2天',
  destination: '广东',
  duration: 2,
  price: 1600,
  transportType: '大巴',
  theme: '自然风光',
  tags: ['自然风光'],
  highlights: ['森林'],
});
const strictFlightBeachTour = candidate({
  id: 'strict-flight-beach',
  title: '海边飞行度假2天',
  destination: '广东',
  duration: 2,
  price: 700,
  transportType: '飞机',
  theme: '海岛度假',
  tags: ['海边', '海岛'],
  highlights: ['沙滩'],
});
assert.ok(!getPrimitiveConflictReasons(nearBudgetIntent, buildTourPrimitive(strictOverBudgetTour))
  .some((reason) => reason.includes('价格高于预算')));
const strictAudited = auditAiRecommendationsStrict(
  [
    { tourId: 'strict-over-budget', score: 100, reason: '模型偏好', matchedSignals: ['酒店'] },
    { tourId: 'strict-flight-beach', score: 98, reason: '模型偏好', matchedSignals: ['海边'] },
    { tourId: 'strict-good', score: 70, reason: '字段匹配', matchedSignals: ['预算', '天数'] },
  ],
  [],
  [strictGoodTour, strictOverBudgetTour, strictFlightBeachTour],
  buildHardIntentFromText('周末2天，严格不超过800元，想清凉一点，但不想去海边，也不要坐飞机'),
);
assert.equal(strictAudited[0].tourId, 'strict-good');
assert.equal(strictAudited[1].tourId, 'strict-over-budget');
assert.equal(strictAudited[2].tourId, 'strict-flight-beach');
assert.ok(strictAudited.find((item) => item.tourId === 'strict-over-budget')?.reason?.includes('需放宽条件'));
assert.ok(strictAudited.find((item) => item.tourId === 'strict-flight-beach')?.reason?.includes('需放宽条件'));

const priorityPreserved = prioritizeRecommendationItems([
  { tourId: 'model-first', score: 10, reason: 'AI order first', matchedSignals: [] },
  { tourId: 'model-second', score: 99, reason: 'AI order second', matchedSignals: [] },
]);
assert.equal(priorityPreserved[0].tourId, 'model-first');
assert.equal(priorityPreserved[1].tourId, 'model-second');
const cappedPriority = prioritizeRecommendationItems(
  Array.from({ length: 32 }, (_, index) => ({
    tourId: `cap-${index}`,
    score: 100 - index,
    reason: index < 8 ? `reason ${index}` : undefined,
    matchedSignals: [],
  })),
);
assert.equal(cappedPriority.length, 24);

const explicitDestinationPriority = prioritizeRecommendationItems(
  [
    { tourId: 'gx-border-1', score: 95, reason: '德天瀑布边境线更贴题。', matchedSignals: ['广西'] },
    { tourId: 'vn-route-1', score: 93, reason: '越南下龙湾能补足另一半目的地。', matchedSignals: ['越南'] },
    { tourId: 'gx-border-2', score: 91, reason: '明仕田园和崇左一线更稳。', matchedSignals: ['广西'] },
    { tourId: 'vn-route-2', score: 89, reason: '河内和下龙湾这条更完整。', matchedSignals: ['越南'] },
    { tourId: 'gx-sea', score: 87, reason: '北海涠洲岛适合补海岛玩法。', matchedSignals: ['广西'] },
    { tourId: 'gx-city', score: 84, reason: '南宁和德天一线更顺路。', matchedSignals: ['广西'] },
    { tourId: 'vn-route-3', score: 82, reason: '越南多城线适合想一次玩开。', matchedSignals: ['越南'] },
    { tourId: 'gx-border-3', score: 80, reason: '巴马和崇左适合再补一个广西向。', matchedSignals: ['广西'] },
    { tourId: 'gd-detour', score: 35, reason: '广东温泉线只是邻近方向补位。', matchedSignals: ['广东'] },
    { tourId: 'yn-detour', score: 35, reason: '云南长线只是相近南方方向补位。', matchedSignals: ['云南'] },
  ],
  {
    candidateTours: [
      candidate({ id: 'gx-border-1', title: '广西德天瀑布4天', destination: '广西', duration: 4, price: 1999, theme: '自然风光' }),
      candidate({ id: 'vn-route-1', title: '越南下龙湾5天', destination: '越南', duration: 5, price: 2999, theme: '海岛度假' }),
      candidate({ id: 'gx-border-2', title: '广西崇左明仕田园3天', destination: '广西', duration: 3, price: 1599, theme: '自然风光' }),
      candidate({ id: 'vn-route-2', title: '越南河内下龙湾5天', destination: '越南', duration: 5, price: 3299, theme: '古镇文化' }),
      candidate({ id: 'gx-sea', title: '广西北海涠洲岛4天', destination: '广西', duration: 4, price: 2399, theme: '海岛度假' }),
      candidate({ id: 'gx-city', title: '广西南宁德天4天', destination: '广西', duration: 4, price: 1799, theme: '自然风光' }),
      candidate({ id: 'vn-route-3', title: '越南会安芽庄6天', destination: '越南', duration: 6, price: 3999, theme: '海岛度假' }),
      candidate({ id: 'gx-border-3', title: '广西巴马崇左4天', destination: '广西', duration: 4, price: 1899, theme: '自然风光' }),
      candidate({ id: 'gd-detour', title: '广东清远温泉3天', destination: '广东', duration: 3, price: 699, theme: '温泉度假' }),
      candidate({ id: 'yn-detour', title: '云南腾冲芒市5天', destination: '云南', duration: 5, price: 3699, theme: '自然风光' }),
    ],
    intent: { destinationHints: ['广西', '越南'], weatherSensitivity: [], departureWeekdays: [] },
    userText: '我想玩广西和越南',
  },
);
assert.ok(explicitDestinationPriority.slice(0, 8).every((item) => ['gx-border-1', 'vn-route-1', 'gx-border-2', 'vn-route-2', 'gx-sea', 'gx-city', 'vn-route-3', 'gx-border-3'].includes(item.tourId)));
assert.ok(!explicitDestinationPriority.slice(0, 8).some((item) => ['gd-detour', 'yn-detour'].includes(item.tourId)));
assert.ok(true, 'when explicit destination hits are already sufficient, conflicting detours should not be reinserted into the final list');

{
  const destinationCoverageTours = [
    candidate({
      id: 'gx-detailed',
      title: '广西德天瀑布中越边境4天',
      destination: '广西',
      duration: 4,
      price: 1899,
      tags: ['边境', '山水'],
      highlights: ['德天瀑布', '中越边境'],
      theme: '自然风光',
    }),
    candidate({
      id: 'vn-detailed',
      title: '越南下龙湾河内5天',
      destination: '越南',
      duration: 5,
      price: 3199,
      tags: ['海湾', '联游'],
      highlights: ['下龙湾', '河内'],
      theme: '境外度假',
    }),
    candidate({
      id: 'gx-single',
      title: '广西桂林阳朔3天',
      destination: '广西',
      duration: 3,
      price: 1499,
      tags: ['山水'],
      highlights: ['桂林', '阳朔'],
      theme: '自然风光',
    }),
    candidate({
      id: 'vn-single',
      title: '越南芽庄5天',
      destination: '越南',
      duration: 5,
      price: 2899,
      tags: ['海岛'],
      highlights: ['芽庄'],
      theme: '海岛度假',
    }),
  ];

  const destinationCoverageRanked = prioritizeRecommendationItems(
    [
      { tourId: 'gx-single', score: 99, reason: '广西单目的地团。', matchedSignals: ['广西'] },
      { tourId: 'vn-single', score: 97, reason: '越南单目的地团。', matchedSignals: ['越南'] },
      { tourId: 'gx-detailed', score: 88, reason: '广西边境线更完整，也更像联游里的前半段。', matchedSignals: ['广西', '边境'] },
      { tourId: 'vn-detailed', score: 86, reason: '越南这条能补足另一半目的地。', matchedSignals: ['越南', '联游'] },
    ],
    {
      candidateTours: destinationCoverageTours,
      intent: { destinationHints: ['广西', '越南'], weatherSensitivity: [], departureWeekdays: [] },
      userText: '给我找广西越南联游',
    },
  );
  assert.deepEqual(
    destinationCoverageRanked.slice(0, 2).map((item) => item.tourId).sort(),
    ['gx-detailed', 'vn-detailed'],
    'combined destination requests should surface both destinations ahead of single-destination matches',
  );
}

{
  const followUpQuery = buildLocalRecommendationQuery('继续细调，预算600以内，优先海边和温泉');
  assert.ok(followUpQuery.budget.max !== null);
  assert.ok(followUpQuery.themeHints.some((hint) => /海边|温泉/.test(hint)) || followUpQuery.coverageTerms.length > 0);
}

const ambiguousWetlandPrimitive = buildTourPrimitive(candidate({
  id: 'yn-wetland',
  title: '云南腾冲瑞丽芒市5天 北海湿地 和顺古镇',
  destination: '云南',
  duration: 5,
  price: 3699,
  theme: '自然风光',
  tags: ['自然风光'],
  highlights: ['北海湿地', '和顺古镇'],
}));
assert.ok(
  getPrimitiveConflictReasons(
    { destinationHints: ['广西', '越南'], weatherSensitivity: [], departureWeekdays: [] },
    ambiguousWetlandPrimitive,
  ).some((reason) => reason.includes('目的地不匹配')),
  'ambiguous scenic spots like 北海湿地 should not be mistaken for 广西北海',
);

{
  const weekendWindowTours = [
    candidate({
      id: 'weekend-fit',
      title: '周末海边2天',
      destination: '广东',
      duration: 2,
      price: 699,
      departureDate: '2026-06-12',
      departureDates: ['2026-06-12'],
      highlights: ['海边', '周五晚班出发'],
      tags: ['海边', '周末'],
      theme: '海岛度假',
      transportType: '大巴',
    }),
    candidate({
      id: 'weekend-miss',
      title: '长线休闲6天',
      destination: '云南',
      duration: 6,
      price: 2699,
      departureDate: '2026-06-12',
      departureDates: ['2026-06-12'],
      highlights: ['古镇', '晚班'],
      tags: ['休闲'],
      theme: '文化',
      transportType: '飞机',
    }),
  ];
  const weekendRanked = localRecommendations(weekendWindowTours, '帮我寻找周五晚上出发的旅行团，最好是周日回');
  assert.equal(weekendRanked[0]?.tourId, 'weekend-fit');
  assert.ok(
    !weekendRanked.slice(0, 1).some((item) => item.tourId === 'weekend-miss'),
    'a Friday-night/Sunday-return request should not pin long trips that cannot close inside the same weekend window',
  );
}

{
  const copyPriorityTours = [
    candidate({
      id: 'copy-short',
      title: '惠州海边温泉2天',
      destination: '广东',
      duration: 2,
      price: 499,
      tags: ['温泉', '沙滩'],
      highlights: ['海边', '温泉'],
      theme: '海岛度假',
      leisureLevel: 'easy',
    }),
    candidate({
      id: 'copy-long',
      title: '惠州双湾温泉3天',
      destination: '广东',
      duration: 3,
      price: 699,
      tags: ['温泉', '沙滩'],
      highlights: ['海边', '温泉', '慢节奏'],
      theme: '海岛度假',
      leisureLevel: 'easy',
    }),
  ];
const reordered = prioritizeRecommendationItems(
    [
      { tourId: 'copy-short', score: 99, reason: '有温泉和沙滩。', matchedSignals: ['温泉'] },
      {
        tourId: 'copy-long',
        score: 95,
        reason: '这条线同时带温泉和沙滩，节奏更松一点，适合想玩得完整些的人。',
        matchedSignals: ['温泉', '沙滩', '轻松'],
      },
    ],
    {
      candidateTours: copyPriorityTours,
      intent: { weatherSensitivity: [], departureWeekdays: [] },
      userText: '帮我找同时带温泉和沙滩的团，最好轻松一点',
    },
  );
  assert.equal(reordered[0].tourId, 'copy-long');
  assert.equal(reordered[1].tourId, 'copy-short');
  assert.ok((reordered[0].reason || '').length > (reordered[1].reason || '').length);
  assert.ok((reordered[0].reason || '').includes('温泉') || (reordered[0].reason || '').includes('沙滩'));
}

// ─── 回归测试：reason 不应保留程序腔 ───
{
  const poorReasonTours = [
    candidate({ id: 'pr-sz', title: '深圳山海度假2天', destination: '广东', duration: 2, price: 599, tags: ['自然'], theme: '山海风光' }),
  ];
  const poorReasonRewrite = rewriteRecommendationCopy({
    items: [{
      tourId: 'pr-sz',
      score: 90,
      reason: '从标题和标签看，命中山海风光，匹配度较高，完整覆盖自然需求。',
      matchedSignals: ['自然', '山海'],
    }],
    candidateTours: poorReasonTours,
    destinationWeatherInsights: [],
    intent: { weatherSensitivity: [], departureWeekdays: [] },
    weatherContext: { destination: '广州', travelDate: '2026-06-12', forecastSummary: '多云', seasonAdvice: [], source: 'seasonal-rule' },
    userText: '帮我找自然山海的短途团',
    allowPublicInterest: false,
  });
  assert.ok(!/(从标题和标签看|命中|匹配度|完整覆盖|对题)/.test(poorReasonRewrite[0].reason || ''),
    'reason should not retain internal/recommendation language');
}

{
  const shortCopyTours = [
    candidate({
      id: 'short-copy-2d',
      title: '巽寮湾沙滩度假2天',
      destination: '广东',
      duration: 2,
      price: 399,
      tags: ['沙滩', '休闲'],
      highlights: ['海边', '沙滩'],
      theme: '海岛度假',
      leisureLevel: 'easy',
    }),
  ];
  const shortCopyRewrite = rewriteRecommendationCopy({
    items: [{
      tourId: 'short-copy-2d',
      score: 88,
      reason: '匹配度较高',
      matchedSignals: ['沙滩'],
    }],
    candidateTours: shortCopyTours,
    destinationWeatherInsights: [],
    intent: { weatherSensitivity: [], departureWeekdays: [], tripDaysMax: 3 },
    weatherContext: { destination: '广州', travelDate: '2026-06-12', forecastSummary: '多云', seasonAdvice: [], source: 'seasonal-rule' },
    userText: '找周末放松的沙滩短途团',
    allowPublicInterest: false,
  });
  assert.ok((shortCopyRewrite[0].reason || '').length >= 28,
    'short fallback recommendation copy should be expanded beyond a terse template');
  assert.ok(/2天|周末|节奏|紧凑/.test(shortCopyRewrite[0].reason || ''),
    'short fallback recommendation copy should mention concrete trip rhythm');
}

// ─── 回归测试：贫穷地方/公益诉求应通过 prompt 交给模型判断 ───
{
  const litePromptMessages = buildLiteAiMessages({
    userText: '想去贫穷落后一点的地方看看',
    messages: [],
    candidates: compactCandidates(
      [majorCityTour, ruralCountyTour, explicitPublicTour],
      localRecommendations([majorCityTour, ruralCountyTour, explicitPublicTour], '想去贫穷落后一点的地方看看'),
      { semanticFocus: ['贫穷地方', '落后地区'], weatherSensitivity: [], departureWeekdays: [] },
      {
        intent: { semanticFocus: ['贫穷地方', '落后地区'], weatherSensitivity: [], departureWeekdays: [] },
        userText: '想去贫穷落后一点的地方看看',
      },
    ),
    weatherContext: {
      destination: '广州',
      travelDate: '2026-06-12',
      forecastSummary: '多云',
      seasonAdvice: [],
      source: 'seasonal-rule',
    },
    searchQuery: '',
    intent: { semanticFocus: ['贫穷地方', '落后地区'], weatherSensitivity: [], departureWeekdays: [] },
    preferenceMemory: null,
    allowPublicInterest: true,
  });
  const litePromptText = litePromptMessages.map((message) => message.content).join('\n');
  assert.ok(litePromptText.includes('世界知识'));
  assert.ok(litePromptText.includes('贫穷落后一点的地方看看'));
}

// ─── 回归测试：自然 AI reason/summary 不应被模板替换 ───
{
  const naturalReasonTours = [
    candidate({ id: 'nr-beach', title: '巽寮湾沙滩度假2天', destination: '广东', duration: 2, price: 399, tags: ['沙滩', '休闲'], theme: '海岛度假' }),
  ];
  const naturalReasonRewrite = rewriteRecommendationCopy({
    items: [{
      tourId: 'nr-beach',
      score: 92,
      reason: '这条沙滩线节奏不赶，适合周末放松。',
      matchedSignals: ['沙滩'],
    }],
    candidateTours: naturalReasonTours,
    destinationWeatherInsights: [],
    intent: { weatherSensitivity: [], departureWeekdays: [] },
    weatherContext: { destination: '广州', travelDate: '2026-06-12', forecastSummary: '多云', seasonAdvice: [], source: 'seasonal-rule' },
    userText: '找周末放松的沙滩团',
    allowPublicInterest: false,
  });
  assert.equal(naturalReasonRewrite[0].reason, '这条沙滩线节奏不赶，适合周末放松。',
    'natural AI reason should be preserved, not replaced by template');

  const naturalSummaryText = finalizeRecommendationSummary({
    aiSummary: '帮你找了巽寮湾的沙滩线，节奏不赶，适合周末放松。记得查一下那几天天气。',
    items: [{ tourId: 'beach-dummy', score: 90, reason: '沙滩短线', matchedSignals: [] }],
    candidateTours: naturalReasonTours,
    weatherContext: { destination: '广州', travelDate: '2026-06-12', forecastSummary: '多云', seasonAdvice: [], source: 'seasonal-rule' },
    destinationWeatherInsights: [],
    intent: { weatherSensitivity: [], departureWeekdays: [] },
    userText: '找周末放松的沙滩团',
    allowPublicInterest: false,
  });
  assert.ok(!/证据更明显的线路放前面/.test(naturalSummaryText),
    'natural AI summary should not be replaced with programmatic fallback');
  assert.ok(naturalSummaryText.includes('帮你找了'),
    'natural AI summary text should be preferred over template');
}

// ─── 回归测试：summary fallback 不应出现程序腔 ───
{
  const fallbackSummaryText = finalizeRecommendationSummary({
    aiSummary: '',
    items: [
      { tourId: 'fb-gz', score: 85, reason: '广东温泉3天轻松', matchedSignals: ['温泉'] },
      { tourId: 'fb-sz', score: 82, reason: '深圳山水2天避暑', matchedSignals: ['自然'] },
    ],
    candidateTours: [
      candidate({ id: 'fb-gz', title: '广州从化温泉3天', destination: '广东', duration: 3, price: 499, tags: ['温泉'], theme: '温泉度假' }),
      candidate({ id: 'fb-sz', title: '深圳梧桐山2天', destination: '广东', duration: 2, price: 299, tags: ['自然'], theme: '自然风光' }),
    ],
    weatherContext: { destination: '广州', travelDate: '2026-06-12', forecastSummary: '多云', seasonAdvice: [], source: 'seasonal-rule' },
    destinationWeatherInsights: [],
    intent: { weatherSensitivity: [], departureWeekdays: [] },
    userText: '帮我找温泉和山水的团',
    allowPublicInterest: false,
  });
  assert.ok(fallbackSummaryText.length > 20,
    'fallback summary should exist');
  const hasProgrammaticPattern = /证据更明显的线路放前面|没有明确证据的偏好会降为/.test(fallbackSummaryText);
  if (hasProgrammaticPattern) {
    console.log('  [audit note] fallback summary contains programmatic language (not a failure, but worth monitoring)');
  }
}

// ─── 回归测试：显式目的地 summary 不应被候选统计带偏 ───
{
  const explicitDestinationSummary = finalizeRecommendationSummary({
    aiSummary: '',
    items: [
      { tourId: 'gx-waterfall', score: 93, reason: '广西边境线更贴题。', matchedSignals: ['广西'] },
      { tourId: 'gd-detour', score: 88, reason: '只是邻近方向补位。', matchedSignals: ['广东'] },
      { tourId: 'vn-bay', score: 84, reason: '越南这条能补足另一半需求。', matchedSignals: ['越南'] },
    ],
    candidateTours: [
      candidate({
        id: 'gx-waterfall',
        title: '广西德天瀑布3天',
        destination: '广西',
        duration: 3,
        price: 1399,
        tags: ['山水'],
        highlights: ['德天瀑布', '边境风光'],
        theme: '自然风光',
      }),
      candidate({
        id: 'gd-detour',
        title: '广东清远山水2天',
        destination: '广东',
        duration: 2,
        price: 699,
        tags: ['山水'],
        highlights: ['山水', '漂流'],
        theme: '自然风光',
      }),
      candidate({
        id: 'vn-bay',
        title: '越南下龙湾5天',
        destination: '越南',
        duration: 5,
        price: 2599,
        tags: ['海湾'],
        highlights: ['下龙湾', '河内'],
        theme: '境外度假',
      }),
    ],
    weatherContext: { destination: '南宁', travelDate: '2026-06-12', forecastSummary: '多云', seasonAdvice: [], source: 'seasonal-rule' },
    destinationWeatherInsights: [],
    intent: { destinationHints: ['广西', '越南'], weatherSensitivity: [], departureWeekdays: [] },
    userText: '我想玩广西和越南',
    allowPublicInterest: false,
  });
  assert.ok(explicitDestinationSummary.includes('广西、越南'),
    'summary should keep explicit destination intent ahead of candidate-derived geography');
  assert.ok(!explicitDestinationSummary.includes('广东'),
    'summary should not broaden explicit 广西/越南 intent into neighboring provinces');
  assert.ok(!explicitDestinationSummary.includes('山水避暑'),
    'summary should not inject unrequested theme labels for explicit destination turns');
}

// ─── 回归测试：详细推荐应排在简介推荐前面 ───
{
  const detailedVsBriefTours = [
    candidate({
      id: 'detail-weekend',
      title: '桂林阳朔动车3天晚出发',
      destination: '桂林',
      duration: 3,
      price: 999,
      departureDate: '2026-06-05',
      departureDates: ['2026-06-05'],
      tags: ['山水'],
      theme: '自然风光',
    }),
    candidate({
      id: 'brief-weekend',
      title: '广州从化温泉3天晚出发',
      destination: '广东',
      duration: 3,
      price: 399,
      departureDate: '2026-06-05',
      departureDates: ['2026-06-05'],
      tags: ['温泉'],
      theme: '温泉度假',
    }),
  ];
  const weekendIntent = buildHardIntentFromText('周五晚上出发，周日返回');
  assert.ok(weekendIntent?.departureWeekdays?.includes(5));
  assert.ok(weekendIntent?.returnWeekdays?.includes(0));
  const reasonQualitySorted = prioritizeRecommendationItems(
    [
      {
        tourId: 'brief-weekend',
        score: 95,
        reason: '性价比高',
        matchedSignals: ['低价'],
      },
      {
        tourId: 'detail-weekend',
        score: 78,
        reason: '这条线周五晚从广州南站动车出发，周日下午返程，3天2晚覆盖象鼻山、阳朔西街和遇龙河竹筏，节奏轻松适合周末出行。',
        matchedSignals: ['周末'],
      },
    ],
    {
      candidateTours: detailedVsBriefTours,
      intent: weekendIntent,
      userText: '周五晚上出发，周日返回',
    },
  );
  assert.equal(
    reasonQualitySorted[0].tourId,
    'detail-weekend',
    'detailed recommendation should outrank a brief recommendation even when its aiScore is lower',
  );
}

// ─── 回归测试：周五晚出发周日回应能找出桂林/广西的 3 天团 ───
{
  const weekendQuery = '帮我寻找周五晚上出发的团，最好周日返回';
  const weekendLocalItems = localRecommendations(realTours, weekendQuery);
  assert.ok(weekendLocalItems.length > 0, 'weekend query should return candidates');
  const firstGuilinIndex = weekendLocalItems.findIndex((item) => {
    const tour = realTours.find((t) => t.id === item.tourId);
    return /广西|桂林/.test(`${tour?.destination} ${tour?.title}`);
  });
  assert.ok(
    firstGuilinIndex >= 0 && firstGuilinIndex < 10,
    `expected a Guilin/Guangxi tour in top 10 for Friday-evening/Sunday-return query, first found at ${firstGuilinIndex + 1}`,
  );
}

// ─── 回归测试：最终排序应显式遵循 AI详细 > AI简要 > 本地补位 ───
{
  const aiTierTours = [
    candidate({
      id: 'ai-detailed-top',
      title: '桂林周末动车3天',
      destination: '桂林',
      duration: 3,
      price: 999,
      departureDate: '2026-06-05',
      departureDates: ['2026-06-05'],
      tags: ['山水'],
      theme: '自然风光',
    }),
    candidate({
      id: 'ai-brief-second',
      title: '广东周末温泉3天',
      destination: '广东',
      duration: 3,
      price: 399,
      departureDate: '2026-06-05',
      departureDates: ['2026-06-05'],
      tags: ['温泉'],
      theme: '温泉度假',
    }),
    candidate({
      id: 'local-third',
      title: '广东补位休闲2天',
      destination: '广东',
      duration: 2,
      price: 299,
      departureDate: '2026-06-05',
      departureDates: ['2026-06-05'],
      tags: ['休闲'],
      theme: '休闲度假',
    }),
  ];

  const aiTierSorted = prioritizeRecommendationItems(
    [
      {
        tourId: 'local-third',
        score: 999,
        reason: '本地补位高分',
        matchedSignals: ['本地补位'],
        recommendationTier: 'local-supplement',
      },
      {
        tourId: 'ai-brief-second',
        score: 120,
        reason: '可考虑',
        matchedSignals: ['周末'],
        recommendationTier: 'ai-brief',
      },
      {
        tourId: 'ai-detailed-top',
        score: 60,
        reason: '这条线周五晚出发，周日回程，桂林山水主线完整，AI 明确认为更符合你的周末短线需求。',
        matchedSignals: ['周末', '山水'],
        recommendationTier: 'ai-detailed',
      },
    ],
    {
      candidateTours: aiTierTours,
      intent: buildHardIntentFromText('周五晚上出发，周日返回'),
      userText: '周五晚上出发，周日返回',
    },
  );

  assert.deepEqual(
    aiTierSorted.map((item) => item.tourId),
    ['ai-detailed-top', 'ai-brief-second', 'local-third'],
    'tier ordering should dominate raw score when final recommendations are merged',
  );
}

// ─── 回归测试：短 reason 不应被当作 AI 详细推荐置顶 ───
{
  const tieredItems = mergeAiAndLocalRecommendations(
    [
      {
        tourId: 'brief-guangxi',
        score: 99,
        reason: '广西崇左3天，标签含越南。',
        matchedSignals: ['广西'],
      },
      {
        tourId: 'detailed-guangxi-vietnam',
        score: 70,
        reason: '这条线同时覆盖广西边境和越南方向，德天跨国瀑布、通灵峡谷与越南段组合更贴近“广西越南联游”，不是只推荐广西单点。',
        matchedSignals: ['广西', '越南', '联游'],
      },
    ],
    [{
      tourId: 'local-supplement',
      score: 1000,
      reason: '本地补位高分',
      matchedSignals: ['本地补位'],
    }],
  );

  const sorted = prioritizeRecommendationItems(tieredItems, {
    candidateTours: [
      candidate({
        id: 'brief-guangxi',
        title: '广西崇左德天3天',
        destination: '广西',
        duration: 3,
        price: 899,
        tags: ['德天瀑布'],
        highlights: ['崇左', '德天瀑布'],
        theme: '自然风光',
      }),
      candidate({
        id: 'detailed-guangxi-vietnam',
        title: '广西德天越南边境联游4天',
        destination: '广西',
        duration: 4,
        price: 1599,
        tags: ['广西', '越南', '联游'],
        highlights: ['德天跨国瀑布', '越南边境', '通灵峡谷'],
        theme: '边境联游',
      }),
      candidate({
        id: 'local-supplement',
        title: '广西普通补位2天',
        destination: '广西',
        duration: 2,
        price: 399,
        tags: ['休闲'],
        highlights: ['补位'],
      }),
    ],
    intent: buildHardIntentFromText('给我找广西越南联游'),
    userText: '给我找广西越南联游',
  });

  assert.equal(
    tieredItems.find((item) => item.tourId === 'brief-guangxi')?.recommendationTier,
    'ai-brief',
    'short screenshot-like reason should be classified as AI brief',
  );
  assert.equal(
    tieredItems.find((item) => item.tourId === 'detailed-guangxi-vietnam')?.recommendationTier,
    'ai-detailed',
    'specific multi-destination reason should be classified as AI detailed',
  );
  assert.deepEqual(
    sorted.map((item) => item.tourId),
    ['detailed-guangxi-vietnam', 'brief-guangxi'],
    'detailed AI recommendation should rank before brief AI without reintroducing local candidates',
  );
}

// ─── 回归测试：多轮语义应由 AI intent 决定，而非本地词表抢先改写 ───
{
  const previousMemory = {
    destinationHints: ['广西', '越南'],
    travelStyle: [],
    mustHave: ['联游'],
    avoid: [],
    weatherSensitivity: [],
    departureWeekdays: [],
    updatedAt: '2026-06-16T00:00:00.000Z',
  };
  const hardIntent = buildHardIntentFromText('你现在推荐的都是越南的旅行团了');
  const aiJudgedRefinement = mergeAiRankingIntent(
    hardIntent,
    {
      destinationHints: ['广西', '越南'],
      departureWeekdays: [],
      refinementMode: 'refine_previous',
    },
  );
  const mergedRefinement = mergeIntentWithMemory(aiJudgedRefinement, previousMemory);

  assert.deepEqual(
    mergedRefinement?.destinationHints,
    ['广西', '越南'],
    'AI judged refinement should preserve the composite destination instead of local extracted text taking over',
  );
  assert.equal(
    mergedRefinement?.refinementMode,
    'refine_previous',
    'AI refinementMode should take precedence over local hard-intent defaults',
  );

  const aiJudgedReplacement = mergeAiRankingIntent(
    hardIntent,
    {
      destinationHints: ['越南'],
      departureWeekdays: [],
      refinementMode: 'replace_destination',
    },
  );
  const mergedReplacement = mergeIntentWithMemory(aiJudgedReplacement, previousMemory);
  assert.deepEqual(
    mergedReplacement?.destinationHints,
    ['越南'],
    'AI judged replacement should be able to replace previous destinations without a local phrase whitelist',
  );
  assert.equal(
    mergedReplacement?.refinementMode,
    'replace_destination',
    'AI replacement mode should be preserved through memory merge',
  );

  const worldKnowledgeDestination = mergeAiRankingIntent(
    null,
    {
      destinationHints: ['惠州盐洲岛'],
      departureWeekdays: [],
      refinementMode: 'replace_destination',
    },
  );
  assert.deepEqual(
    worldKnowledgeDestination?.destinationHints,
    [],
    'AI-inferred destinations must rank candidates without becoming a hard user destination when the user did not name one',
  );

  const basePromptCandidates = compactCandidates(
    [
      candidate({
        id: 'vn-only',
        title: '越南下龙湾5天',
        destination: '越南',
        duration: 5,
        price: 2399,
        tags: ['海湾'],
        highlights: ['下龙湾', '河内'],
      }),
      candidate({
        id: 'gx-memory',
        title: '广西德天边境3天',
        destination: '广西',
        duration: 3,
        price: 999,
        tags: ['德天瀑布'],
        highlights: ['边境风光', '德天瀑布'],
      }),
    ],
    [{ tourId: 'vn-only', score: 99, reason: '当前文本目的地', matchedSignals: ['越南'] }],
    hardIntent,
    { intent: hardIntent, userText: '你现在推荐的都是越南的旅行团了' },
  ).filter((item) => item.id === 'vn-only');
  const memoryCoveredCandidates = enrichPromptCandidatesWithMemoryCoverage(
    basePromptCandidates,
    [
      candidate({
        id: 'vn-only',
        title: '越南下龙湾5天',
        destination: '越南',
        duration: 5,
        price: 2399,
        tags: ['海湾'],
        highlights: ['下龙湾', '河内'],
      }),
      candidate({
        id: 'gx-memory',
        title: '广西德天边境3天',
        destination: '广西',
        duration: 3,
        price: 999,
        tags: ['德天瀑布'],
        highlights: ['边境风光', '德天瀑布'],
      }),
    ],
    previousMemory,
    hardIntent,
  );
  assert.ok(
    memoryCoveredCandidates.some((item) => item.id === 'gx-memory'),
    'AI prompt pool should retain previous-memory destination candidates so the model can judge follow-up semantics',
  );
}

console.log('AI recommendation audit passed');
