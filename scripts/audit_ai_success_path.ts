import { strict as assert } from 'node:assert';
import {
  __aiRecommendationTestHooks,
} from '../src/lib/ai-recommendation.ts';
import type { AiRecommendationCandidate } from '../src/types/tour.ts';

const {
  auditAiRecommendationsStrict,
  prioritizeRecommendationItems,
  rewriteRecommendationCopy,
  keepAiItemsForCompoundExperience,
} = __aiRecommendationTestHooks;

function candidate(
  overrides: Partial<AiRecommendationCandidate> & { id: string; title: string; destination: string; price: number },
): AiRecommendationCandidate {
  return {
    id: overrides.id,
    title: overrides.title,
    source: overrides.source ?? 'test',
    destination: overrides.destination,
    duration: overrides.duration ?? 3,
    price: overrides.price,
    departureDate: overrides.departureDate ?? '2026-06-12',
    departureDates: overrides.departureDates ?? ['2026-06-12'],
    transportType: overrides.transportType ?? '大巴',
    accommodationLevel: overrides.accommodationLevel ?? '舒适',
    meals: overrides.meals ?? '含早',
    highlights: overrides.highlights ?? ['轻松度假'],
    tags: overrides.tags ?? ['休闲'],
    isHot: overrides.isHot ?? false,
    theme: overrides.theme ?? '休闲度假',
    suitableFor: overrides.suitableFor ?? ['情侣'],
    leisureLevel: overrides.leisureLevel ?? 'easy',
    season: overrides.season ?? '夏季',
    rating: overrides.rating ?? 4.6,
    groupSize: overrides.groupSize ?? '20人',
    hotDepartureDates: overrides.hotDepartureDates ?? ['2026-06-12'],
  };
}

const aiOrderTours = [
  candidate({
    id: 'ai-first',
    title: '广东双湾慢玩3天',
    destination: '广东',
    price: 1299,
    tags: ['海边', '轻松'],
    highlights: ['双湾', '慢节奏'],
  }),
  candidate({
    id: 'ai-second',
    title: '广东温泉小住3天',
    destination: '广东',
    price: 1199,
    tags: ['温泉', '轻松'],
    highlights: ['温泉', '住得舒服'],
  }),
  candidate({
    id: 'local-supplement',
    title: '广东海边酒店3天',
    destination: '广东',
    price: 999,
    tags: ['海边'],
    highlights: ['酒店', '海边'],
  }),
];

const preservedAiOrder = auditAiRecommendationsStrict(
  [
    { tourId: 'ai-first', score: 70, reason: 'AI 更看重整体节奏。', matchedSignals: ['节奏'] },
    { tourId: 'ai-second', score: 69, reason: 'AI 认为也合适。', matchedSignals: ['体验'] },
  ],
  [
    { tourId: 'local-supplement', score: 99, reason: '本地补位高分', matchedSignals: ['本地补位'] },
  ],
  aiOrderTours,
  { weatherSensitivity: [], departureWeekdays: [] },
);
assert.deepEqual(
  preservedAiOrder.map((item) => item.tourId),
  ['ai-first', 'ai-second', 'local-supplement'],
  'strict audit should keep valid AI items ahead of local supplements in AI order',
);

const destinationIntent = { destinationHints: ['广西', '越南'], weatherSensitivity: [], departureWeekdays: [] };
const destinationTours = [
  candidate({
    id: 'guangxi-match',
    title: '广西德天瀑布3天',
    destination: '广西',
    price: 1399,
    tags: ['山水'],
    highlights: ['德天瀑布', '边境风光'],
    theme: '自然风光',
  }),
  candidate({
    id: 'vietnam-local',
    title: '越南下龙湾5天',
    destination: '越南',
    duration: 5,
    price: 2599,
    tags: ['海湾'],
    highlights: ['下龙湾', '河内'],
    theme: '境外度假',
  }),
  candidate({
    id: 'inner-mongolia-conflict',
    title: '内蒙古草原双飞5天',
    destination: '内蒙古',
    duration: 5,
    price: 999,
    tags: ['草原'],
    highlights: ['草原骑马', '烤全羊'],
    theme: '自然风光',
    transportType: '飞机',
  }),
];

const strictConflictAudited = auditAiRecommendationsStrict(
  [
    { tourId: 'inner-mongolia-conflict', score: 99, reason: 'AI 误判为热门低价。', matchedSignals: ['热门'] },
    { tourId: 'guangxi-match', score: 75, reason: '广西方向更贴题。', matchedSignals: ['目的地匹配'] },
  ],
  [
    { tourId: 'vietnam-local', score: 88, reason: '本地补足另一条明确方向。', matchedSignals: ['目的地匹配'] },
  ],
  destinationTours,
  destinationIntent,
);
assert.deepEqual(
  strictConflictAudited.map((item) => item.tourId),
  ['guangxi-match', 'vietnam-local', 'inner-mongolia-conflict'],
  'strict audit should only push hard conflicts behind valid AI items and local supplements',
);
assert.ok(strictConflictAudited[2]?.reason?.includes('需放宽条件'));

const validOrderPreserved = prioritizeRecommendationItems(
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
    candidateTours: [
      candidate({ id: 'copy-short', title: '惠州海边温泉2天', destination: '广东', price: 499, tags: ['温泉', '沙滩'], highlights: ['海边', '温泉'] }),
      candidate({ id: 'copy-long', title: '惠州双湾温泉3天', destination: '广东', price: 699, tags: ['温泉', '沙滩'], highlights: ['海边', '温泉', '慢节奏'] }),
    ],
    intent: { weatherSensitivity: [], departureWeekdays: [] },
    userText: '帮我找同时带温泉和沙滩的团',
  },
);
assert.equal(validOrderPreserved[0].tourId, 'copy-short');
assert.equal(validOrderPreserved[1].tourId, 'copy-long');

const alternativesLast = prioritizeRecommendationItems([
  strictConflictAudited[2],
  strictConflictAudited[0],
  strictConflictAudited[1],
]);
assert.deepEqual(
  alternativesLast.map((item) => item.tourId),
  ['guangxi-match', 'vietnam-local', 'inner-mongolia-conflict'],
  'final prioritization should only move alternative items to the end',
);

const shortCopyCandidate = candidate({
  id: 'short-copy',
  title: '惠州海边温泉2天',
  destination: '广东',
  price: 599,
  tags: ['温泉', '沙滩'],
  highlights: ['海边温泉', '沙滩散步'],
  theme: '海岛度假',
});
const expandedShortCopy = rewriteRecommendationCopy({
  items: [
    { tourId: 'short-copy', score: 90, reason: '海边温泉。', matchedSignals: ['温泉'] },
  ],
  candidateTours: [shortCopyCandidate],
  destinationWeatherInsights: [],
  intent: { weatherSensitivity: [], departureWeekdays: [] },
  weatherContext: {
    destination: '惠州',
    travelDate: '2026-06-12',
    forecastSummary: '未来几天闷热多云。',
    seasonAdvice: ['适合留意防晒和节奏安排。'],
    source: 'seasonal-rule',
  },
  userText: '想找海边温泉，文案说人话一点',
  allowPublicInterest: false,
});
assert.ok((expandedShortCopy[0]?.reason?.length ?? 0) > '海边温泉。'.length);

const semanticFitAfterFormulaicReason = rewriteRecommendationCopy({
  items: [{
    tourId: 'semantic-copy',
    score: 96,
    reason: '如果你是冲着温泉和海边去的，这条线会更有针对性',
    semanticFit: '盐洲岛把海边的慢节奏和温泉放在同一趟里，适合想带孩子玩水又不想把行程排满的家庭。',
    semanticBoundary: '共享电动车是否方便需要出发前确认。',
    matchedSignals: ['海边', '温泉'],
  }],
  candidateTours: [candidate({
    id: 'semantic-copy',
    title: '惠州双湾盐洲岛温泉联游3天',
    destination: '广东',
    price: 799,
    tags: ['温泉', '海边', '玩水'],
    highlights: ['盐洲岛', '温泉', '海边慢游'],
    theme: '海岛度假',
  })],
  destinationWeatherInsights: [],
  intent: { weatherSensitivity: [], departureWeekdays: [] },
  weatherContext: {
    destination: '惠州',
    travelDate: '2026-06-12',
    forecastSummary: '',
    seasonAdvice: [],
    source: 'seasonal-rule',
  },
  userText: '适合带孩子的海边温泉，附近最好能骑电动车逛逛',
  allowPublicInterest: false,
});
assert.ok(semanticFitAfterFormulaicReason[0]?.reason?.includes('盐洲岛'));
assert.ok(!semanticFitAfterFormulaicReason[0]?.reason?.startsWith('如果你是冲着'));
assert.ok(semanticFitAfterFormulaicReason[0]?.reason?.includes('共享电动车'));

const weakCompoundCandidate = candidate({
  id: 'weak-compound',
  title: '金水台温泉2天',
  destination: '广东',
  price: 329,
  tags: ['温泉'],
  highlights: ['泡汤'],
});
assert.deepEqual(
  keepAiItemsForCompoundExperience(
    [{ tourId: 'weak-compound', score: 99, reason: '温泉价格合适。', matchedSignals: ['温泉'] }],
    [weakCompoundCandidate],
    '能玩水的温泉，周边有镇子的，如果有共享电瓶车的优先',
  ),
  [{ tourId: 'weak-compound', score: 99, reason: '温泉价格合适。', matchedSignals: ['温泉'] }],
  'when no strong compound candidate exists, retain the AI-selected nearest alternative',
);

const unselectedStrongCandidate = candidate({
  id: 'unselected-strong',
  title: '海边温泉嬉水3天',
  destination: '广东',
  price: 499,
  tags: ['温泉', '玩水'],
  highlights: ['温泉', '嬉水'],
});
assert.deepEqual(
  keepAiItemsForCompoundExperience(
    [{ tourId: 'weak-compound', score: 60, reason: '温泉可泡。', matchedSignals: ['温泉'] }],
    [unselectedStrongCandidate, weakCompoundCandidate],
    '能玩水的温泉，周边有镇子的，如果有共享电瓶车的优先',
  ).map((item) => item.tourId),
  ['weak-compound'],
  'an AI omission must degrade to its selected alternative instead of returning an empty result',
);

const strongCompoundCandidate = candidate({
  id: 'strong-compound',
  title: '惠州双湾盐洲岛温泉嬉水3天',
  destination: '广东',
  price: 399,
  tags: ['温泉', '玩水'],
  highlights: ['温泉', '嬉水', '海边'],
});
const weakMixedCandidate = candidate({
  id: 'weak-mixed',
  title: '惠州温泉小镇2天',
  destination: '广东',
  price: 329,
  tags: ['温泉', '小镇'],
  highlights: ['温泉', '小镇漫步'],
});
assert.deepEqual(
  keepAiItemsForCompoundExperience(
    [
      { tourId: 'strong-compound', score: 80, reason: '温泉和玩水都对得上。', matchedSignals: ['温泉', '玩水'] },
      { tourId: 'weak-mixed', score: 99, reason: '温泉和小镇都不错。', matchedSignals: ['温泉', '小镇'] },
    ],
    [strongCompoundCandidate, weakMixedCandidate],
    '能玩水的温泉，周边有镇子的，如果有共享电瓶车的优先',
  ).map((item) => item.tourId),
  ['strong-compound'],
  'when a core-coverage candidate exists, weak mixed candidates must not be padded into recommendations',
);

console.log('AI success-path audit passed');
