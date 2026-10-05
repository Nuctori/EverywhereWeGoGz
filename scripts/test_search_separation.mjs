// 多轮检索分离度：明确体验主题需求下，跨轮合并不得让异题主题产品挤占重点层。
// 场景回归：用户明确要海边沙滩，检索规划师仍可能产出「温泉特价」类漂移检索式，
// 各轮满分候选按 bestScore 同台竞争时，温泉产品会混进 top-48 甚至排到沙滩前面。
// 跑法: node --no-warnings --experimental-strip-types --loader ./scripts/ts-alias-loader.mjs scripts/test_search_separation.mjs
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

// 主题判定复用结构化概念表：贴合 = 命中需求概念（海边沙滩）；
// 纯温泉 = 温泉泡汤命中且海边沙滩不命中（滨海温泉两栖产品属贴合）。
const themeOf = (tour) => {
  const primitive = hooks.buildTourPrimitive(tour);
  return {
    beach: hooks.getPrimitiveCoverageScore(primitive, ['海边沙滩']) > 0,
    spring: hooks.getPrimitiveCoverageScore(primitive, ['温泉泡汤']) > 0,
  };
};
const isPureSpringTheme = (theme) => theme.spring && !theme.beach;

// 模拟截图场景：第 1 条检索式贴题，第 2/3 条主题漂移。
const driftedQueries = ['海边沙滩度假', '温泉品质特价', '休闲城市经济游'];

// 1. 明确沙滩需求：合并后贴合候选全量保位，纯温泉不得进入重点层前段。
const gated = hooks.executeAiSearchRounds(tours, driftedQueries, '海边沙滩度假2天预算1000内');
const focusThemes = gated.searchedTours.slice(0, 24).map(themeOf);
const focusPureSpring = focusThemes.filter(isPureSpringTheme);
check('重点层前 24 无纯温泉', focusPureSpring.length === 0,
  `纯温泉 ${focusPureSpring.length} 条`);

// 合并序：所有贴合候选（含滨海温泉两栖）排在纯温泉候选之前，纯温泉只能补位。
const allThemes = gated.searchedTours.map(themeOf);
const lastAlignedIndex = allThemes.reduce((last, theme, index) => (theme.beach ? index : last), -1);
const firstPureSpringIndex = allThemes.findIndex(isPureSpringTheme);
check('贴合候选排在纯温泉候选之前',
  firstPureSpringIndex === -1 || firstPureSpringIndex > lastAlignedIndex,
  `贴合末位 ${lastAlignedIndex}，纯温泉首位 ${firstPureSpringIndex}`);

// 2. 轮次轨迹带贴合计数（可观测分离度）：贴题轮贴合 > 0；漂移轮即便有少量
// 滨海温泉两栖候选（同时命中海边概念，属贴合），贴合数也应显著低于贴题轮。
const [beachRound, springRound] = gated.rounds;
check('贴题轮报告贴合数且 > 0',
  beachRound.alignedCount !== undefined && beachRound.alignedCount > 0,
  `「${beachRound.query}」贴合 ${beachRound.alignedCount}/${beachRound.hitCount}`);
check('漂移轮贴合数显著低于贴题轮',
  springRound.alignedCount !== undefined && springRound.alignedCount < beachRound.alignedCount,
  `「${springRound.query}」贴合 ${springRound.alignedCount}/${springRound.hitCount}`);

// 3. 泛需求（提取不出概念主题）行为不变：温泉候选仍可进入合并结果。
const generic = hooks.executeAiSearchRounds(tours, ['温泉品质特价'], '帮我推荐个周边游');
check('泛需求不设门', generic.searchedTours.map(themeOf).some(isPureSpringTheme),
  `合并 ${generic.searchedTours.length} 条`);

// 4. 需求点名多主题（沙滩+温泉都要）时，温泉候选贴合需求、不设门。
const bothDemands = hooks.executeAiSearchRounds(tours, ['温泉品质特价'], '想泡温泉也想看海，海边沙滩和温泉都要');
check('多主题需求下温泉候选贴合',
  bothDemands.rounds[0].alignedCount !== undefined && bothDemands.rounds[0].alignedCount > 0,
  `贴合 ${bothDemands.rounds[0].alignedCount}/${bothDemands.rounds[0].hitCount}`);

// 5. 需求主题在池中无候选时退化行为：不误杀，仍有结果（宽一点兜底）。
const unsatisfiable = hooks.executeAiSearchRounds(tours, ['温泉品质特价'], '滑雪场玩雪2天');
check('需求主题无候选时退化为普通合并',
  unsatisfiable.searchedTours.length > 0 && unsatisfiable.rounds[0].alignedCount === 0,
  `合并 ${unsatisfiable.searchedTours.length} 条，贴合 ${unsatisfiable.rounds[0].alignedCount}`);

// 6. 回避语义：明确"避开温泉"时温泉候选不贴合（回避命中语料），只能进异题
// 补位段；且「避开温泉」不会被当成想要温泉（剥离回避短语后再提需求概念）。
// 单轮整漂（无贴题轮）时贴合候选为 0，异题补位段限宽 12——污染有上界。
const avoidSpring = hooks.executeAiSearchRounds(tours, ['温泉品质特价'], '海边沙滩度假，避开温泉');
const avoidSpringThemes = avoidSpring.searchedTours.map(themeOf);
check('回避温泉时温泉候选限宽 12',
  avoidSpringThemes.filter((theme) => theme.spring).length <= 12,
  `温泉候选 ${avoidSpringThemes.filter((theme) => theme.spring).length} 条，检索层 ${avoidSpring.searchedTours.length} 条`);
check('「避开温泉」不被当成需求概念',
  avoidSpring.rounds[0].alignedCount === 0,
  `贴合 ${avoidSpring.rounds[0].alignedCount}/${avoidSpring.rounds[0].hitCount}`);

// 7. 整轮漂移兜底：异题补位段不超过 12 条，其余名额留给贴合候选。
const allDrift = hooks.executeAiSearchRounds(tours, ['温泉品质特价', '休闲城市经济游'], '海边沙滩度假2天');
const driftThemes = allDrift.searchedTours.map(themeOf);
const driftAligned = driftThemes.filter((theme) => theme.beach).length;
check('整轮漂移时异题候选限宽 12',
  driftThemes.length - driftAligned <= 12,
  `检索层 ${driftThemes.length} 条，贴合 ${driftAligned}`);
check('整轮漂移时贴合候选仍保位在前',
  (() => {
    const firstPureSpring = driftThemes.findIndex(isPureSpringTheme);
    const lastAligned = driftThemes.reduce((last, theme, index) => (theme.beach ? index : last), -1);
    return firstPureSpring === -1 || firstPureSpring > lastAligned;
  })(),
  `贴合末位 ${driftThemes.reduce((last, theme, index) => (theme.beach ? index : last), -1)}，纯温泉首位 ${driftThemes.findIndex(isPureSpringTheme)}`);

// 8. 独立复核 E2E 回归：单条全漂移检索式 + 贴合候选稀少时，异题补位随贴合数
// 动态收缩（12-贴合数），不得在贴合稀少时仍以 12 条满额挤进重点层前段。
const singleDrift = hooks.executeAiSearchRounds(tours, ['温泉品质特价'], '海边沙滩两天');
const singleThemes = singleDrift.searchedTours.map(themeOf);
const singleAligned = singleThemes.filter((theme) => theme.beach).length;
const singleDrifted = singleThemes.length - singleAligned;
check('贴合稀少时异题补位动态收缩',
  singleDrifted <= Math.max(0, 12 - singleAligned),
  `贴合 ${singleAligned}，异题补位 ${singleDrifted}（上限 ${Math.max(0, 12 - singleAligned)}）`);

if (failures > 0) {
  console.error(`\n${failures} 项失败`);
  process.exit(1);
}
console.log('\n多轮检索分离度验证全部通过');
