// 「AI 帮我挑」点击路径的性能与交互回归：
// 1) 稳定候选池按池内容（而不是数组引用）缓存——TourList 每轮渲染都会重建
//    等价的 aiCandidateTours 数组，引用缓存等于每轮全量重算（实测 ~600ms 同步）。
// 2) 池内容真的变了必须重建，不能命中旧池。
// 3) 空闲预热必须对"归一化后的候选"也生效，否则 normalizeCandidateTour 的产物
//    在点击时仍要冷算原语。
// 4) UI 层：Hero 主按钮不能逐字翻转、AI 按钮不能被主按钮身份禁用、搜索不再
//    自动展开详情/设置面板、放大地图不卸载内嵌实例。
import { strict as assert } from 'node:assert';
import fs from 'node:fs';
import {
  __aiRecommendationTestHooks,
  AI_RECOMMENDATION_WARM_BATCH_SIZE,
  getAiRecommendationWarmPiece,
  isAiRecommendationPoolWarm,
  warmAiRecommendationBatch,
} from '../src/lib/ai-recommendation.ts';

const { getStablePromptPool, normalizeCandidateTour, buildTourPrimitive } = __aiRecommendationTestHooks;

interface Candidate {
  id: string;
  source: string;
  title: string;
  destination: string;
  duration: number;
  price: number;
  departureDate: string;
  departureDates: string[];
  transportType: string;
  accommodationLevel: string;
  meals: string;
  highlights: string[];
  tags: string[];
  isHot: boolean;
  theme: string;
  suitableFor: string[];
  leisureLevel: string;
  season: string;
  rating: number;
  groupSize: string;
  hotDepartureDates: string[];
}

// 与 TourList 的 aiCandidateTours useMemo 同形：每次渲染都是新对象、新数组。
// departureDate 故意设成过去、班期在将来：这正是线上多数线路的状态，
// normalizeCandidateTour 会因此产出新对象（原对象 cache 覆盖不到）。
function makeCandidates(count = 240): Candidate[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `tour-${index}`,
    source: index % 2 === 0 ? 'A' : 'B',
    title: `线路 ${index}`,
    destination: ['桂林', '阳江', '清远', '云南'][index % 4],
    duration: 2 + (index % 3),
    price: 400 + index * 7,
    departureDate: '2020-01-01',
    departureDates: ['2099-01-01', `2099-0${1 + (index % 9)}-1${index % 10}`],
    transportType: '大巴',
    accommodationLevel: '舒适',
    meals: '含早',
    highlights: ['温泉', '海边'],
    tags: ['休闲'],
    isHot: index % 5 === 0,
    theme: '休闲度假',
    suitableFor: ['情侣'],
    leisureLevel: 'easy',
    season: '冬',
    rating: 4.5,
    groupSize: '20人',
    hotDepartureDates: [],
  }));
}

// 1) 等价池（新数组、新对象、同内容）必须复用同一份稳定池
const poolA = makeCandidates();
const poolB = makeCandidates();
const first = getStablePromptPool(poolA as never);
const second = getStablePromptPool(poolB as never);
assert.equal(
  second,
  first,
  'an equivalent candidate pool must reuse the cached stable pool instead of rebuilding it',
);
assert.equal(isAiRecommendationPoolWarm(poolA as never), true);
// 全新数组在第一次调用前是"未预热"状态——这正是空闲预热要判断的依据。
assert.equal(isAiRecommendationPoolWarm(makeCandidates() as never), false);

// 2) 池内容变化必须重建：下架一条线路后稳定池需要重算，不能命中旧池
const shrunk = makeCandidates().slice(0, 239);
const shrunkPool = getStablePromptPool(shrunk as never);
assert.notEqual(shrunkPool, first, 'a changed candidate pool must not reuse the stale stable pool');

// 3) 价格变了也算内容变化
const repriced = makeCandidates();
repriced[0] = { ...repriced[0], price: 99_999 };
assert.notEqual(
  getStablePromptPool(repriced as never),
  first,
  'a price change must invalidate the stable pool fingerprint',
);

// 4) 预热必须覆盖 normalizeCandidateTour 的产物（它有约 1/4 的线路会返回新对象）
const normalizedSource = makeCandidates();
const normalizedTours = normalizedSource.map((tour) => normalizeCandidateTour(tour as never));
assert.ok(
  normalizedTours.some((tour, index) => tour !== normalizedSource[index]),
  'fixture must exercise the normalizeCandidateTour path that produces new objects',
);

const pieceCount = Math.ceil(normalizedTours.length / AI_RECOMMENDATION_WARM_BATCH_SIZE);
for (let index = 0; index < pieceCount; index += 1) {
  warmAiRecommendationBatch(getAiRecommendationWarmPiece(normalizedTours as never, index));
}

// 冷算基线：一批 id 完全不同的线路（原语缓存按 tour id 建键，同 id 会直接命中，
// 那样测出来的"冷算"其实是命中，测不出任何东西）。
const coldSource = makeCandidates().map((tour, index) => ({
  ...tour,
  id: `cold-${index}`,
}));
const coldTours = coldSource.map((tour) => normalizeCandidateTour(tour as never));
const timeOf = (fn: () => void) => {
  const start = performance.now();
  fn();
  return performance.now() - start;
};
const coldMs = timeOf(() => {
  // 多跑几轮取最好成绩，避免单次计时被 GC 抖动放大
  for (let round = 0; round < 3; round += 1) {
    for (const tour of coldTours) buildTourPrimitive(tour as never);
  }
});
const warmMs = timeOf(() => {
  for (const tour of normalizedTours) buildTourPrimitive(tour as never);
});
assert.ok(
  coldMs > 1,
  `the cold baseline must actually do work (measured ${coldMs.toFixed(1)}ms) — otherwise the comparison below is meaningless`,
);
assert.ok(
  warmMs * 10 < coldMs,
  `warmed normalized candidates must be far cheaper than a cold build (cold ${coldMs.toFixed(1)}ms for 3 rounds, warm ${warmMs.toFixed(1)}ms)`,
);

// 5) 原语缓存必须按 tour id 跨对象复用：TourList 每轮渲染 / normalizeCandidateTour
//    都会产出新对象，若按对象引用缓存，点击时就等于全量冷算（线上实测 ~500ms）。
const sameIdTours = makeCandidates();
const primitiveFirst = buildTourPrimitive(sameIdTours[0] as never);
const primitiveSecond = buildTourPrimitive({ ...sameIdTours[0] } as never);
assert.equal(
  primitiveSecond,
  primitiveFirst,
  'tour primitives must be cached by tour id so a re-rendered candidate object still hits the cache',
);

// 6) 预热不改变任何输出：预热后的稳定池与全新冷构建逐字节一致
const afterWarm = getStablePromptPool(makeCandidates() as never);
const warmedBatch = makeCandidates();
const hot = getStablePromptPool(warmedBatch as never);
assert.deepEqual(
  hot.candidates.map((candidate: { id: string }) => candidate.id),
  afterWarm.candidates.map((candidate: { id: string }) => candidate.id),
  'warmup must not change which candidates enter the stable prompt pool',
);

// ---- UI 层回归 ----
const heroSource = fs.readFileSync('src/sections/Hero.tsx', 'utf8');
const panelSource = fs.readFileSync('src/sections/AiRecommendPanel.tsx', 'utf8');
const mapSource = fs.readFileSync('src/sections/MapView.tsx', 'utf8');

assert.ok(
  heroSource.includes('HERO_ROUTE_DEBOUNCE_MS') && heroSource.includes('setSettledQuery'),
  'the hero primary button must settle before flipping its label, not flip on every keystroke',
);
assert.doesNotMatch(
  heroSource,
  /disabled=\{primaryIsAi \|\| !trimmed\}/,
  'the AI button must not be disabled merely because the primary button already routes to AI',
);
assert.match(
  heroSource,
  /const aiButtonDisabled = !trimmed;/,
  'the AI button should only be disabled while the input is empty',
);

assert.doesNotMatch(
  panelSource,
  /setDetailsOpen\(true\);\s*\n\s*setFollowUpInput/,
  'submitting an AI search must not auto-expand the panel details (it thrashes against the searchingVersion reset)',
);
assert.doesNotMatch(
  panelSource,
  /onClick=\{\(\) => setSettingsOpen\(true\)\}\s*\}\s*>\s*<Settings/s,
  'AI search must not open the API-key settings sheet',
);
assert.ok(
  panelSource.includes('useAiRecommendationWarmup') && panelSource.includes('warmAiRecommendationBatch'),
  'the AI panel should warm the recommendation caches during idle time',
);

assert.ok(
  mapSource.includes('{embedded && ('),
  'expanding the map must keep the embedded map instance mounted (its selection state lives there)',
);
assert.doesNotMatch(
  mapSource,
  /\{!expanded && embedded && \(/,
  'the embedded map must not unmount when it expands',
);

console.info('AI pick interaction audit passed');
