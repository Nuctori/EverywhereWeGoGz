// R1 检索分离度：玩水/漂流 vs 温泉。
// 场景：用户想漂流/玩水时，漂移检索式（温泉休闲等）带回来的纯温泉候选
// 不得挤占检索层前段；字面"漂流"产品要保位在前。反向"泡温泉"需求下，
// 海滩漂移轮只允许少量补位（限宽 12）。泛需求行为不变。
// 跑法: node --no-warnings --experimental-strip-types --loader ./scripts/ts-alias-loader.mjs scripts/test_separation_r1_water.mjs
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

// 主题判定复用结构化概念表：
// 玩水贴合 = 命中「玩水清凉」概念；纯温泉 = 命中「温泉泡汤」且不命中玩水清凉
// （汤泉+玩水两栖产品属贴合）。字面漂流 = 标题/线路语料含"漂流"。
const themeOf = (tour) => {
  const primitive = hooks.buildTourPrimitive(tour);
  return {
    water: hooks.getPrimitiveCoverageScore(primitive, ['玩水清凉']) > 0,
    spring: hooks.getPrimitiveCoverageScore(primitive, ['温泉泡汤']) > 0,
    literalRafting: /漂流/.test(`${tour.title ?? ''} ${tour.route ?? ''} ${tour.highlights ?? ''}`),
  };
};
const isPureSpring = (theme) => theme.spring && !theme.water;
const queries = ['漂流刺激一日', '温泉休闲两日', '周边看山'];

// 1. 明确漂流需求（字面词）：检索层前 24 不得被纯温泉占位。
const rafting = hooks.executeAiSearchRounds(tours, queries, '想漂流，最好刺激点的');
const raftingThemes = rafting.searchedTours.map(themeOf);
const top24PureSpring = raftingThemes.slice(0, 24).filter(isPureSpring);
check('漂流需求：前 24 无纯温泉', top24PureSpring.length === 0,
  `纯温泉占位 ${top24PureSpring.length} 条`);

// 字面漂流产品真实存在于池中（否则断言无意义），且保位在纯温泉之前。
const poolLiteralRafting = tours.map(themeOf).filter((t) => t.literalRafting).length;
check('池中存在字面漂流产品（数据前提）', poolLiteralRafting > 0, `${poolLiteralRafting} 条`);
const mergedThemes = raftingThemes;
const lastRaftingIdx = mergedThemes.reduce(
  (last, t, i) => (t.literalRafting ? i : last), -1);
const firstPureSpringIdx = mergedThemes.findIndex(isPureSpring);
check('漂流需求：字面漂流产品保位在纯温泉之前',
  lastRaftingIdx !== -1 && (firstPureSpringIdx === -1 || firstPureSpringIdx > lastRaftingIdx),
  `漂流末位 ${lastRaftingIdx}，纯温泉首位 ${firstPureSpringIdx}`);

// 漂流主题轮（贴题）贴合计数 > 0 且高于温泉漂移轮。
const raftRound = rafting.rounds[0];
const springRound = rafting.rounds.find((r) => /温泉/.test(r.query));
check('漂流贴题轮贴合数 > 0',
  raftRound.alignedCount !== undefined && raftRound.alignedCount > 0,
  `「${raftRound.query}」贴合 ${raftRound.alignedCount}/${raftRound.hitCount}`);
if (springRound) {
  check('温泉漂移轮贴合数低于贴题轮',
    springRound.alignedCount < raftRound.alignedCount,
    `「${springRound.query}」贴合 ${springRound.alignedCount}/${springRound.hitCount}`);
}

// 2. 概念需求「玩水清凉」（无字面"漂流"）：贴合候选保位，纯温泉不进前 24。
const waterCool = hooks.executeAiSearchRounds(tours, queries, '天太热了，想玩水清凉一下');
const waterCoolThemes = waterCool.searchedTours.map(themeOf);
check('玩水清凉需求：前 24 无纯温泉',
  waterCoolThemes.slice(0, 24).filter(isPureSpring).length === 0,
  `纯温泉占位 ${waterCoolThemes.slice(0, 24).filter(isPureSpring).length} 条`);
const lastWaterIdx = waterCoolThemes.reduce((last, t, i) => (t.water ? i : last), -1);
const firstPsWaterIdx = waterCoolThemes.findIndex(isPureSpring);
check('玩水清凉需求：贴合候选保位在纯温泉之前',
  lastWaterIdx !== -1 && (firstPsWaterIdx === -1 || firstPsWaterIdx > lastWaterIdx),
  `玩水贴合末位 ${lastWaterIdx}，纯温泉首位 ${firstPsWaterIdx}`);
check('玩水清凉贴题轮贴合数 > 0',
  waterCool.rounds[0].alignedCount > 0,
  `贴合 ${waterCool.rounds[0].alignedCount}/${waterCool.rounds[0].hitCount}`);

// 3. 反向：需求"泡温泉"，漂移检索式「海滩度假」带回来的海边候选只允许补位 ≤12。
const springNeed = hooks.executeAiSearchRounds(tours, ['海滩度假', '温泉休闲两日'], '想泡温泉，放松一下');
const springNeedThemes = springNeed.searchedTours.map(themeOf);
const beachLike = springNeedThemes.filter((t) => t.water && !t.spring).length;
check('泡温泉需求：海边候选限宽 12', beachLike <= 12,
  `海边候选 ${beachLike} 条，检索层 ${springNeedThemes.length} 条`);
const lastSpringIdx = springNeedThemes.reduce((last, t, i) => (t.spring ? i : last), -1);
const firstBeachIdx = springNeedThemes.findIndex((t) => t.water && !t.spring);
check('泡温泉需求：温泉贴合候选保位在海边补位之前',
  lastSpringIdx !== -1 && (firstBeachIdx === -1 || firstBeachIdx > lastSpringIdx),
  `温泉末位 ${lastSpringIdx}，海边首位 ${firstBeachIdx}`);

// 4. 泛需求（提不出概念）：行为与既往一致，温泉候选仍可进入合并结果。
const generic = hooks.executeAiSearchRounds(tours, queries, '');
check('泛需求不设门（温泉候选可入合并结果）',
  generic.searchedTours.map(themeOf).some(isPureSpring),
  `合并 ${generic.searchedTours.length} 条`);
const genericText = hooks.executeAiSearchRounds(tours, ['温泉休闲两日'], '帮我推荐个周边游');
check('泛需求文本同样不设门',
  genericText.searchedTours.map(themeOf).some(isPureSpring),
  `合并 ${genericText.searchedTours.length} 条`);

if (failures > 0) {
  console.error(`\n${failures} 项失败`);
  process.exit(1);
}
console.log('\nR1 玩水/漂流 vs 温泉 分离度验证全部通过');
