// 排序基线：对固定输入跑 prioritizeRecommendationItems / auditAiRecommendationsStrict，
// 输出 tourId 顺序快照。用法：node --experimental-strip-types --loader ./scripts/ts-alias-loader.mjs scripts/sort_baseline_snapshot.ts [--write]
// --write 时把结果写入 tmp/sort-baseline.json，否则与已有文件对比。
import * as fs from 'node:fs';
import { __aiRecommendationTestHooks as hooks } from '../src/lib/ai-recommendation.ts';
const {
  auditAiRecommendationsStrict,
  prioritizeRecommendationItems,
  mergeAiAndLocalRecommendations,
  localRecommendations,
  fallbackRecommendations,
} = hooks;
import type {
  AiRecommendationCandidate,
  AiRecommendationItem,
} from '../src/lib/ai-recommendation.ts';

const realTours = JSON.parse(
  fs.readFileSync('public/data/tours-list.json', 'utf8'),
) as AiRecommendationCandidate[];
const pool = realTours.slice(0, 120);

// 三类意图快照：目的地+预算、复合体验（温泉+沙滩+玩水）、多目的地
const scenarios = [
  {
    name: 'guangdong-beach-budget',
    userText: '帮我找沙滩好一点的团，预算1000内，从广州出发',
    intent: {
      destinationHints: ['广东'],
      budgetMax: 1000,
      budgetMin: null,
      budgetHardLimit: false,
      tripDays: null,
      tripDaysMin: null,
      tripDaysMax: null,
      departureWithinDays: null,
      departureWeekdays: [],
      returnWeekdays: [],
      departureTimeOfDay: null,
      avoid: [],
      weatherSensitivity: [],
      travelStyle: [],
      mustHave: [],
      semanticFocus: [],
      nearestAlternativeOkay: null,
      budgetPriority: 'low' as const,
      refinementMode: 'new_search' as const,
      confidence: 0.8,
    },
  },
  {
    name: 'compound-hotspring-beach',
    userText: '能玩水的温泉，周边有镇子的，如果有共享电瓶车的优先',
    intent: {
      destinationHints: [],
      budgetMax: null,
      budgetMin: null,
      budgetHardLimit: false,
      tripDays: null,
      tripDaysMin: null,
      tripDaysMax: null,
      departureWithinDays: null,
      departureWeekdays: [],
      returnWeekdays: [],
      departureTimeOfDay: null,
      avoid: [],
      weatherSensitivity: [],
      travelStyle: [],
      mustHave: [],
      semanticFocus: [],
      nearestAlternativeOkay: null,
      budgetPriority: null,
      refinementMode: 'new_search' as const,
      confidence: 0.7,
    },
  },
  {
    name: 'multi-destination',
    userText: '桂林和北海都想去看看，5天内',
    intent: {
      destinationHints: ['桂林', '广西'],
      budgetMax: null,
      budgetMin: null,
      budgetHardLimit: false,
      tripDays: null,
      tripDaysMin: 2,
      tripDaysMax: 5,
      departureWithinDays: null,
      departureWeekdays: [],
      returnWeekdays: [],
      departureTimeOfDay: null,
      avoid: [],
      weatherSensitivity: [],
      travelStyle: [],
      mustHave: [],
      semanticFocus: [],
      nearestAlternativeOkay: true,
      budgetPriority: null,
      refinementMode: 'new_search' as const,
      confidence: 0.75,
    },
  },
];

// 模拟 AI 返回：走真实链路 mergeAiAndLocalRecommendations 打 ai-* tier
function fakeAiItems(
  tours: AiRecommendationCandidate[],
  seed: number,
): AiRecommendationItem[] {
  const shuffled = [...tours].sort(
    (a, b) =>
      ((a.id.charCodeAt(4) * seed) % 97) - ((b.id.charCodeAt(4) * seed) % 97),
  );
  return shuffled.slice(0, 10).map((tour, index) => ({
    tourId: tour.id,
    score: Math.max(5, 95 - index * 9),
    reason:
      index < 6
        ? `体验判断第${index + 1}位：${tour.title.slice(0, 12)}适合这个方向，节奏和玩法值得比较。`
        : '',
    matchedSignals: index < 6 ? ['体验判断'] : [],
  }));
}

const snapshot: Record<string, string[]> = {};
for (const scenario of scenarios) {
  const local = localRecommendations(pool, scenario.userText);
  const fallback = fallbackRecommendations(pool);
  const localForMerge = [...local, ...fallback].slice(0, 40);
  const aiItems = fakeAiItems(pool, 7);
  const audited = auditAiRecommendationsStrict(
    aiItems,
    [],
    pool,
    scenario.intent as never,
  );
  const merged = mergeAiAndLocalRecommendations(audited, localForMerge);
  const prioritized = prioritizeRecommendationItems(merged, {
    candidateTours: pool,
    intent: scenario.intent as never,
    userText: scenario.userText,
    destinationWeatherInsights: [],
  });
  snapshot[scenario.name] = prioritized.map((item) => item.tourId);
}

const outPath = 'tmp/sort-baseline.json';
if (process.argv.includes('--write')) {
  fs.mkdirSync('tmp', { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(snapshot, null, 2));
  console.log('baseline written:', outPath);
  for (const [name, ids] of Object.entries(snapshot)) {
    console.log(name, '→', ids.slice(0, 6).join(','), `(${ids.length})`);
  }
} else {
  const baseline = JSON.parse(fs.readFileSync(outPath, 'utf8')) as Record<
    string,
    string[]
  >;
  let same = true;
  for (const [name, ids] of Object.entries(snapshot)) {
    const expected = baseline[name] || [];
    const equal = JSON.stringify(ids) === JSON.stringify(expected);
    console.log(`${equal ? 'MATCH' : 'DIFF '} ${name}`);
    if (!equal) {
      same = false;
      console.log('  baseline:', expected.slice(0, 8).join(','));
      console.log('  current :', ids.slice(0, 8).join(','));
      const setDiff = ids
        .filter((id) => !expected.includes(id))
        .concat(expected.filter((id) => !ids.includes(id)));
      console.log('  set diff:', setDiff.join(',') || '(同集合，仅顺序变化)');
    }
  }
  process.exit(same ? 0 : 1);
}
