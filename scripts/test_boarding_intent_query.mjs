// 「X上车」意图链路验证：本地查询解析 → 候选门控 → 本地打分。
// 跑法: node --experimental-strip-types --loader ./scripts/ts-alias-loader.mjs scripts/test_boarding_intent_query.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let failures = 0;
function check(name, ok, detail = '') {
  const mark = ok ? 'PASS' : 'FAIL';
  if (!ok) failures += 1;
  console.log(`${mark} ${name}${detail ? ` — ${detail}` : ''}`);
}

const ai = await import('../src/lib/ai-recommendation.ts');
const hooks = ai.__aiRecommendationTestHooks;
const { toursListSchema } = await import('../src/lib/runtime-schemas.ts');

const list = JSON.parse(
  fs.readFileSync(path.join(root, 'public', 'data', 'tours-list.json'), 'utf8'),
);
const parsed = toursListSchema.safeParse(list);
if (!parsed.success) {
  console.error('tours-list schema 解析失败', parsed.error.issues.slice(0, 2));
  process.exit(1);
}
const tours = parsed.data;

// 1. 意图解析："增城上车"进 boardingHints，不再混进 destinationHints
const query = hooks.buildLocalRecommendationQuery('增城上车的旅行团');
check('boardingHints 提取 增城',
  JSON.stringify(query.boardingHints) === JSON.stringify(['增城']),
  JSON.stringify(query.boardingHints));
check('目的地提示不再包含 增城',
  !query.destinationHints.includes('增城'),
  JSON.stringify(query.destinationHints));

// 2. 对照组："从广州出发去惠州" → boarding=[广州]，destination=[惠州]
const q2 = hooks.buildLocalRecommendationQuery('从广州出发去惠州的团');
check('出发地/目的地分得开',
  q2.boardingHints.includes('广州') && q2.destinationHints.includes('惠州'),
  `boarding=${JSON.stringify(q2.boardingHints)} dest=${JSON.stringify(q2.destinationHints)}`);

// 3. 门控：目的地不同、但上车点命中的候选，不再被目的地门控拒掉
const boardingTour = tours.find(
  (t) => t.boarding && JSON.stringify(t.boarding).includes('增城'),
);
if (!boardingTour) {
  check('数据中存在上车点含增城的线路', false, '当前目录没有，数据侧需先补采集');
} else {
  const primitive = hooks.buildTourPrimitive(boardingTour);
  const intent = hooks.normalizeIntent({
    boardingHints: ['增城'],
    destinationHints: ['惠州'], // 故意给一个冲突目的地，验证上车点命中能放行
  });
  check('上车点命中放行目的地门控',
    hooks.candidateMatchesDestinationIntent(intent, primitive));
  const noBoardingIntent = hooks.normalizeIntent({ destinationHints: ['惠州'] });
  check('无上车点意图时门控行为不变（惠州意图拒绝东山岛线路）',
    !hooks.candidateMatchesDestinationIntent(noBoardingIntent, primitive));
}

// 4. 本地打分端到端：查询"增城上车的旅行团"，唯一含增城上车点的线路应进入结果
const recs = hooks.localRecommendations(tours, '增城上车的旅行团');
const ids = new Set((recs || []).map((r) => r.tourId || r.id));
if (boardingTour) {
  check('含增城上车点的线路进入本地推荐',
    ids.has(boardingTour.id) || (recs || []).some((r) => r.tour?.id === boardingTour.id),
    `结果 ${ids.size} 条`);
} else {
  check('localRecommendations 可运行', Array.isArray(recs));
}

if (failures > 0) {
  console.error(`\n${failures} 项失败`);
  process.exit(1);
}
console.log('\n上车点意图链路验证全部通过');
