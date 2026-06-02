import { strict as assert } from 'node:assert';
import {
  __aiRecommendationTestHooks,
} from '../src/lib/ai-recommendation.ts';
import type { AiRecommendationCandidate } from '../src/types/tour.ts';

const {
  auditAiRecommendations,
  collectAvoidHints,
  compactCandidates,
  getPrimitiveConflictReasons,
  matchesActiveDateFilters,
  matchesDateWindow,
  mergeIntentWithMemory,
  resolvePromptDateWindow,
  shouldUseAiIntentExtraction,
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
assert.ok(audited.find((item) => item.tourId === 'guizhou-cheap')?.matchedSignals.some((signal) => signal.startsWith('审计提示')));

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
const avoidCompacted = compactCandidates([hotSpringTour, nonHotSpringTour], [], avoidIntent);
assert.ok(!avoidCompacted.some((item) => item.id === 'hot-spring'));
assert.ok(avoidCompacted.some((item) => item.id === 'beach'));
assert.deepEqual(collectAvoidHints('500元以内，不要漂流、爬山'), ['漂流', '爬山']);
assert.deepEqual(collectAvoidHints('不喜欢温泉，讨厌购物团'), ['温泉', '购物团']);
assert.ok(shouldUseAiIntentExtraction('不喜欢温泉', { travelStyle: ['温泉'] }));
assert.ok(shouldUseAiIntentExtraction('受不了暴晒，别安排海边暴走', null));

const auditedAvoid = auditAiRecommendations(
  [{ tourId: 'hot-spring', score: 100, reason: '便宜', matchedSignals: ['低价'] }],
  [],
  [hotSpringTour, nonHotSpringTour],
  avoidIntent,
);
assert.equal(auditedAvoid.length, 0);

const today = new Date().toISOString().slice(0, 10);
const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
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
assert.ok(!matchesActiveDateFilters({ ...nonHotSpringTour, departureDate: yesterday, departureDates: [yesterday] }, baseFilters));
assert.ok(matchesActiveDateFilters({ ...nonHotSpringTour, departureDate: today, departureDates: [today] }, baseFilters));

const promptDateWindow = resolvePromptDateWindow('推荐500元以下未来7天出发的旅行团');
assert.ok(promptDateWindow);
assert.ok(matchesDateWindow({ ...nonHotSpringTour, departureDate: tomorrow, departureDates: [tomorrow] }, promptDateWindow));
assert.ok(!matchesDateWindow({ ...nonHotSpringTour, departureDate: yesterday, departureDates: [yesterday] }, promptDateWindow));

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

console.log('AI recommendation audit passed');
