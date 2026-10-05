// R2 检索分离度：目的地点名 × 主题门交互。
// 场景：
//  1. 目的地主导「从化温泉两天」——温泉概念贴合，漂移检索式（海滩漂流）带回的
//     海边候选只能少量补位（限宽 12），温泉贴合候选保位在前。
//  2. 目的地+主题双信号「阳江海陵岛海边沙滩2天」——海陵岛候选保位在前且不被挤出；
//     异题（温泉/城市）候选限宽补位。
//  3. 目的地在池外/极少「漠河雪乡5天」——提不出概念组标签时门不启用（不硬排除），
//     合并结果非空、漠河候选仍在（行为与既往泛合并一致）。
//  4. 「湾」字地名边界「惠州双月湾两天」——真双月湾候选判成贴合且保位在前，
//     不因概念提取歧义被挤出；纯温泉等非海滨候选只作补位。
//  5. 回归：泛需求（无目的地无主题）不设门，行为与既往一致。
// 跑法: node --no-warnings --experimental-strip-types --loader ./scripts/ts-alias-loader.mjs scripts/test_separation_r2_destination.mjs
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

// 主题判定复用结构化概念表（与检索门同一口径）：
// 温泉 = 命中「温泉泡汤」；海滨 = 命中「海边沙滩」（含 AI 路径别名超集）。
// 纯温泉 = 温泉命中且海滨 0 分；纯海滨 = 海滨命中且温泉 0 分。
const scoresOf = (tour) => {
  const primitive = hooks.buildTourPrimitive(tour);
  return {
    spring: hooks.getPrimitiveCoverageScore(primitive, ['温泉泡汤']),
    beach: hooks.getPrimitiveCoverageScore(primitive, ['海边沙滩']),
  };
};
const themeOf = (tour) => {
  const { spring, beach } = scoresOf(tour);
  return { spring: spring > 0, beach: beach > 0 };
};
const isPureSpring = (theme) => theme.spring && !theme.beach;
const isPureBeach = (theme) => theme.beach && !theme.spring;
const lastIndexOf = (themes, pred) =>
  themes.reduce((last, t, i) => (pred(t) ? i : last), -1);

// 数据前提
const poolDoubleMoon = tours.filter((t) => /双月湾/.test(t.title ?? ''));
const poolHailing = tours.filter((t) => /海陵岛/.test(t.title ?? ''));
const poolMohe = tours.filter((t) => /漠河/.test(t.title ?? ''));
check('数据前提：池中存在双月湾产品', poolDoubleMoon.length > 0, `${poolDoubleMoon.length} 条`);
check('数据前提：池中存在海陵岛产品', poolHailing.length > 0, `${poolHailing.length} 条`);
check('数据前提：池中存在漠河产品', poolMohe.length > 0, `${poolMohe.length} 条`);

// ---- 场景 1：目的地主导「从化温泉两天」 ----
const case1 = hooks.executeAiSearchRounds(
  tours,
  ['从化温泉度假酒店', '海滩漂流', '温泉休闲两日'],
  '从化温泉两天',
);
const c1Themes = case1.searchedTours.map(themeOf);
const c1SpringRound = case1.rounds.find((r) => /温泉/.test(r.query) && !/海滩/.test(r.query));
check('场景1：温泉贴题轮贴合数 > 0',
  c1SpringRound && (c1SpringRound.alignedCount ?? 0) > 0,
  `贴合 ${c1SpringRound?.alignedCount}/${c1SpringRound?.hitCount}`);
const c1DriftRound = case1.rounds.find((r) => /海滩漂流/.test(r.query));
check('场景1：海滩漂移轮贴合数低于贴题轮',
  c1SpringRound && c1DriftRound
    && (c1DriftRound.alignedCount ?? 0) < (c1SpringRound.alignedCount ?? 0),
  `漂移贴合 ${c1DriftRound?.alignedCount} vs 贴题 ${c1SpringRound?.alignedCount}`);
const c1PureBeach = c1Themes.filter(isPureBeach).length;
check('场景1：海边候选限宽 12', c1PureBeach <= 12,
  `纯海滨补位 ${c1PureBeach} 条，检索层 ${c1Themes.length} 条`);
const c1LastSpring = lastIndexOf(c1Themes, isPureSpring);
const c1FirstBeach = c1Themes.findIndex(isPureBeach);
check('场景1：纯温泉贴合候选保位在纯海滨补位之前',
  c1LastSpring !== -1 && (c1FirstBeach === -1 || c1FirstBeach > c1LastSpring),
  `纯温泉末位 ${c1LastSpring}，纯海滨首位 ${c1FirstBeach}`);
check('场景1：合并结果非空', c1Themes.length > 0, `${c1Themes.length} 条`);

// ---- 场景 2：目的地+主题「阳江海陵岛海边沙滩2天」 ----
const hailingIds = new Set(poolHailing.map((t) => t.id));
const case2 = hooks.executeAiSearchRounds(
  tours,
  ['阳江海陵岛海边沙滩', '温泉特价两日', '城市逛吃美食'],
  '阳江海陵岛海边沙滩2天',
);
const c2Themes = case2.searchedTours.map(themeOf);
check('场景2：合并结果非空', c2Themes.length > 0, `${c2Themes.length} 条`);
const c2HailingIdx = case2.searchedTours.reduce(
  (last, t, i) => (hailingIds.has(t.id) ? i : last), -1);
check('场景2：海陵岛候选进入检索层（未被挤出）', c2HailingIdx !== -1,
  `首条海陵岛位于第 ${c2HailingIdx + 1} 位`);
const c2BeachRound = case2.rounds[0];
check('场景2：贴题轮贴合数 > 0',
  (c2BeachRound.alignedCount ?? 0) > 0,
  `贴合 ${c2BeachRound.alignedCount}/${c2BeachRound.hitCount}`);
const c2OffTheme = c2Themes.filter((t) => !t.beach).length;
check('场景2：非海滨（异题）候选限宽 12', c2OffTheme <= 12,
  `异题补位 ${c2OffTheme} 条`);
const c2FirstOff = c2Themes.findIndex((t) => !t.beach);
check('场景2：海滨贴合候选保位在异题补位之前',
  c2FirstOff === -1 || c2HailingIdx !== -1,
  `异题首位 ${c2FirstOff}，海陵岛首位 ${c2HailingIdx}`);
if (c2FirstOff !== -1 && c2HailingIdx !== -1) {
  check('场景2：海陵岛候选位于异题补位之前', c2HailingIdx < c2FirstOff,
    `海陵岛 ${c2HailingIdx} < 异题首位 ${c2FirstOff}`);
}

// ---- 场景 3：池外/极少目的地「漠河雪乡5天」不设门误杀 ----
const moheIds = new Set(poolMohe.map((t) => t.id));
const case3 = hooks.executeAiSearchRounds(
  tours,
  ['漠河雪乡冰雪', '东北赏秋'],
  '漠河雪乡5天',
);
check('场景3：合并结果非空（不得为空）', case3.searchedTours.length > 0,
  `${case3.searchedTours.length} 条`);
const c3MoheIdx = case3.searchedTours.reduce(
  (last, t, i) => (moheIds.has(t.id) ? i : last), -1);
check('场景3：漠河候选仍可进入检索层', c3MoheIdx !== -1,
  `首条漠河位于第 ${c3MoheIdx + 1} 位`);

// ---- 场景 4：「湾」字地名边界「惠州双月湾两天」 ----
const doubleMoonIds = new Set(poolDoubleMoon.map((t) => t.id));
const case4 = hooks.executeAiSearchRounds(
  tours,
  ['惠州双月湾沙滩', '温泉休闲两日', '城市逛吃'],
  '惠州双月湾两天',
);
const c4Themes = case4.searchedTours.map(themeOf);
check('场景4：合并结果非空', c4Themes.length > 0, `${c4Themes.length} 条`);
const c4DmIdx = case4.searchedTours.reduce(
  (last, t, i) => (doubleMoonIds.has(t.id) ? i : last), -1);
check('场景4：真双月湾候选进入检索层（未被挤出）', c4DmIdx !== -1,
  `首条双月湾位于第 ${c4DmIdx + 1} 位`);
const c4FirstDm = case4.searchedTours.findIndex((t) => doubleMoonIds.has(t.id));
const c4FirstNonBeach = c4Themes.findIndex((t) => !t.beach);
if (c4FirstNonBeach !== -1 && c4FirstDm !== -1) {
  check('场景4：双月湾贴合候选保位在非海滨补位之前', c4FirstDm < c4FirstNonBeach,
    `双月湾首位 ${c4FirstDm} < 非海滨首位 ${c4FirstNonBeach}`);
}
// 门不是全池贴合：贴合数必须显著小于命中数（top-36 切片内贴题属正常，
// 但 2662 条命中不可能全部贴合「惠州双月湾」概念）。
const c4Round = case4.rounds[0];
check('场景4：贴题轮贴合数 > 0 且远小于命中数（非全池误判贴合）',
  (c4Round.alignedCount ?? 0) > 0 && (c4Round.alignedCount ?? 0) < c4Round.hitCount,
  `贴合 ${c4Round.alignedCount}/${c4Round.hitCount}`);
const c4PureSpring = c4Themes.filter(isPureSpring).length;
check('场景4：纯温泉候选限宽 12', c4PureSpring <= 12,
  `纯温泉补位 ${c4PureSpring} 条`);

// ---- 场景 5：泛需求回归（无目的地无主题） ----
const case5 = hooks.executeAiSearchRounds(
  tours,
  ['周边好玩的地方', '休闲度假'],
  '帮我推荐个周边游',
);
check('场景5：泛需求合并结果非空', case5.searchedTours.length > 0,
  `${case5.searchedTours.length} 条`);
check('场景5：泛需求不设门（温泉候选可入检索层）',
  case5.searchedTours.map(themeOf).some(isPureSpring),
  `检索层 ${case5.searchedTours.length} 条`);
const case5b = hooks.executeAiSearchRounds(tours, ['温泉休闲两日'], '');
check('场景5：空文本同样不设门',
  case5b.searchedTours.map(themeOf).some(isPureSpring),
  `检索层 ${case5b.searchedTours.length} 条`);

if (failures > 0) {
  console.error(`\n${failures} 项失败`);
  process.exit(1);
}
console.log('\nR2 目的地 × 主题门 分离度验证全部通过');
