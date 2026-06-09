import { strict as assert } from 'node:assert';
import {
  __aiRecommendationTestHooks,
} from '../src/lib/ai-recommendation.ts';
import type { AiRecommendationCandidate } from '../src/types/tour.ts';

const {
  auditAiRecommendationsStrict,
  auditAiRecommendations,
  buildAiMessages,
  buildHardIntentFromText,
  buildLiteAiMessages,
  buildRecommendationAuditContext,
  buildRouteAtlas,
  buildTourPrimitive,
  collectAvoidHints,
  collectLiteralAvoidHints,
  compactCandidates,
  allowsPublicInterestForTurn,
  finalizeRecommendationSummary,
  getConcreteAiReason,
  getPrimitiveConflictReasons,
  matchesActiveDateFilters,
  matchesDateWindow,
  mergeAiAndLocalRecommendations,
  mergeIntentWithMemory,
  rewriteRecommendationCopy,
  resolvePromptDateWindow,
  sanitizeAiBudgetBoundsForTurn,
  sanitizeAiIntentForTurn,
  validateAiItems,
} = __aiRecommendationTestHooks;

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
assert.ok(mergedCapItems.length > 24);
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
assert.ok(priceContextCompacted.some((item) => item.userTermHits.includes('温泉')));
assert.ok(priceContextCompacted.some((item) => item.userTermHits.includes('沙滩')));
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
  [],
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
assert.ok(vagueReasonItems[0].reason?.includes('看点：'));
assert.ok(vagueReasonItems[0].reason?.includes('参考价'));
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
assert.ok(highPriceReasonRewrite[0].reason?.includes('参考价：￥30,999'));
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
assert.ok(noBudgetReasonRewrite[0].reason?.includes('参考价：￥30,999'));
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
assert.ok(inventedBudgetFitRewrite[0].reason?.includes('参考价：￥30,999'));
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
assert.ok(staleMemoryBudgetRewrite[0].reason?.includes('参考价：￥30,999'));
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
assert.ok(closeToBudgetRewrite[0].reason?.includes('参考价：￥30,999'));
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
assert.ok(/古村|山水|广东县域/.test(noPublicInterestRewrite[0].reason || ''));

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
assert.ok(weirdSemanticSummary.includes('说明：部分偏好在候选里没有明确标签'));
assert.ok(weirdSemanticSummary.includes('推荐方向：'));

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
assert.ok(nonInternalPublicInterestSummary.includes('推荐方向：'));

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
assert.ok(!promptPublicInterestPattern.test(nonPublicFullPrompt));
assert.ok(!promptPublicInterestPattern.test(nonPublicLitePrompt));
assert.ok(!/玩水清凉|清凉玩水/.test(nonPublicFullPrompt));
assert.ok(!/玩水清凉|清凉玩水/.test(nonPublicLitePrompt));
assert.ok(!/玩水/.test(nonPublicFullPrompt));
assert.ok(!/玩水/.test(nonPublicLitePrompt));

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

const zhHardIntent = buildHardIntentFromText(
  '周末2天，预算800以内，想清凉一点，但不想去海边，也不要坐飞机',
  baseFilters,
);
assert.equal(zhHardIntent?.budgetMax, 800);
assert.equal(zhHardIntent?.tripDaysMin, 1);
assert.equal(zhHardIntent?.tripDaysMax, 3);
assert.ok(collectLiteralAvoidHints('不想去海边，也不要坐飞机').includes('海边'));
assert.ok(zhHardIntent?.avoid?.includes('飞机'));

const strictMismatchIntent = buildHardIntentFromText(
  '500元以下，7天以上，住五星酒店，去新疆，还要天气特别好',
  baseFilters,
);
assert.equal(strictMismatchIntent?.budgetMax, 500);
assert.equal(strictMismatchIntent?.tripDaysMin, 7);
assert.equal(strictMismatchIntent?.tripDaysMax, null);

const nearBudgetIntent = buildHardIntentFromText(
  '预算2000以内，但希望接近2000的品质，不要一堆299，想去云南或者桂林看自然风景，5天左右',
  baseFilters,
);
assert.equal(nearBudgetIntent?.budgetMax, 2000);
assert.equal(nearBudgetIntent?.tripDaysMin, 4);
assert.equal(nearBudgetIntent?.tripDaysMax, 6);
assert.equal(nearBudgetIntent?.budgetPriority, null);

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
const strictAudited = auditAiRecommendationsStrict(
  [
    { tourId: 'strict-over-budget', score: 100, reason: '模型偏好', matchedSignals: ['酒店'] },
    { tourId: 'strict-flight-beach', score: 98, reason: '模型偏好', matchedSignals: ['海边'] },
    { tourId: 'strict-good', score: 70, reason: '字段匹配', matchedSignals: ['预算', '天数'] },
  ],
  [],
  [strictGoodTour, strictOverBudgetTour, strictFlightBeachTour],
  zhHardIntent,
);
assert.equal(strictAudited[0].tourId, 'strict-good');
assert.ok(strictAudited.find((item) => item.tourId === 'strict-over-budget')?.reason?.includes('需放宽条件'));
assert.ok(strictAudited.find((item) => item.tourId === 'strict-flight-beach')?.reason?.includes('需放宽条件'));

console.log('AI recommendation audit passed');
