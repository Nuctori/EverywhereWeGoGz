import { strict as assert } from 'node:assert';
import {
  __aiRecommendationTestHooks,
} from '../src/lib/ai-recommendation.ts';
import type { AiRecommendationCandidate } from '../src/types/tour.ts';

const {
  auditAiRecommendations,
  compactCandidates,
  getPrimitiveConflictReasons,
  mergeIntentWithMemory,
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

console.log('AI recommendation audit passed');
