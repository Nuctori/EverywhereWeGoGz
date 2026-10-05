// R7 重点层合成路径锁定：检索层（executeAiSearchRounds → annotateSearchedHitCompacted）
// 与下游 focus 层合成的交互（requestAiRecommendations 内 focusById 构造）。
// 生产顺序：searchedCompacted 在前 → selectCoverageFocusCompacted(全池) 去重补足 →
// slice MAX_AI_FOCUS_CANDIDATES=24。requestAiRecommendations 本体需 AI API 无法离线跑，
// 这里用 __aiRecommendationTestHooks 导出的零件离线复刻合成并锁定不变量。
// 跑法: node --no-warnings --experimental-strip-types --loader ./scripts/ts-alias-loader.mjs scripts/test_separation_r7_focus.mjs
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
if (parsed.success === false) {
  console.error('tours-list schema 解析失败', parsed.error.issues.slice(0, 2));
  process.exit(1);
}
const tours = parsed.data;

// 概念贴合判定（与检索门同一概念组口径）。
const scoreOf = (tour) => {
  const p = hooks.buildTourPrimitive(tour);
  return {
    spring: hooks.getPrimitiveCoverageScore(p, ['温泉泡汤']),
    beach: hooks.getPrimitiveCoverageScore(p, ['海边沙滩']),
  };
};
const isPureSpring = (t) => t.spring > 0 && t.beach === 0;

const MAX_AI_FOCUS_CANDIDATES = 24;

// 生产合成路径的离线复刻（1:1 对照 requestAiRecommendations 内 focusById 构造）：
// searched 注解在前 → coverage focus(全池) 补足 → Map 首见去重 → slice 24。
function composeFocus(searchedTours, allTours, context) {
  const searchedCompacted = searchedTours.length > 0
    ? hooks.annotateSearchedHitCompacted(searchedTours, null, context)
    : [];
  const coverageFocus = hooks.selectCoverageFocusCompacted(allTours, [], null, context);
  const focusById = new Map();
  for (const candidate of [...searchedCompacted, ...coverageFocus]) {
    if (!focusById.has(candidate.id)) focusById.set(candidate.id, candidate);
  }
  return [...focusById.values()].slice(0, MAX_AI_FOCUS_CANDIDATES);
}

// 通用不变量：去重（同 id 不重复）+ 总量 ≤24 + searched 候选整体保位在前。
function assertInvariants(tag, composed, searchedIds) {
  const ids = composed.map((c) => c.id);
  check(`${tag}：合成去重（同 id 不重复出现）`, new Set(ids).size === ids.length,
    `共 ${ids.length} 条、去重后 ${new Set(ids).size} 条`);
  check(`${tag}：focus 总量 ≤ ${MAX_AI_FOCUS_CANDIDATES}`, composed.length <= MAX_AI_FOCUS_CANDIDATES,
    `${composed.length} 条`);
  const searchedFlags = composed.map((c) => searchedIds.has(c.id));
  const lastSearched = searchedFlags.lastIndexOf(true);
  const gapIdx = searchedFlags.indexOf(false);
  check(`${tag}：searched 候选保位在前（coverage 只做尾部补足）`,
    lastSearched === -1 || gapIdx === -1 || gapIdx > lastSearched,
    `searched 末位 ${lastSearched}，首个补位 ${gapIdx}`);
}

// ---------- 场景 1：贴合充足 ----------
{
  const userText = '海边沙滩度假2天';
  const queries = ['海边沙滩度假', '温泉品质特价', '休闲城市经济游'];
  const r = hooks.executeAiSearchRounds(tours, queries, userText);
  const searchedIds = new Set(r.searchedTours.map((t) => t.id));
  const searchedBeach = r.searchedTours.filter((t) => scoreOf(t).beach > 0).length;
  const composed = composeFocus(r.searchedTours, tours, { userText });
  assertInvariants('S1', composed, searchedIds);
  const beachCount = composed.filter((c) => {
    const tour = tours.find((t) => t.id === c.id);
    return tour && scoreOf(tour).beach > 0;
  }).length;
  const pureSpringCount = composed.filter((c) => {
    const tour = tours.find((t) => t.id === c.id);
    return tour && isPureSpring(scoreOf(tour));
  }).length;
  check('S1：前提（检索层含贴合候选 ≥12）', searchedBeach >= 12, `searched 贴合 ${searchedBeach} 条`);
  check('S1：top-24 贴合候选占多数（≥12）', beachCount >= 12, `贴合 ${beachCount}/${composed.length}`);
  check('S1：纯温泉为 0', pureSpringCount === 0, `纯温泉 ${pureSpringCount} 条`);
}

// ---------- 场景 2：贴合稀少（R6 动态补位收缩后的合成端回归） ----------
{
  const userText = '海边沙滩两天';
  const queries = ['温泉品质特价'];
  const r = hooks.executeAiSearchRounds(tours, queries, userText);
  const searchedIds = new Set(r.searchedTours.map((t) => t.id));
  const searchedBeach = r.searchedTours.filter((t) => scoreOf(t).beach > 0).length;
  const searchedPureSpring = r.searchedTours.filter((t) => isPureSpring(scoreOf(t))).length;
  const composed = composeFocus(r.searchedTours, tours, { userText });
  assertInvariants('S2', composed, searchedIds);
  const beachCount = composed.filter((c) => {
    const tour = tours.find((t) => t.id === c.id);
    return tour && scoreOf(tour).beach > 0;
  }).length;
  const pureSpringCount = composed.filter((c) => {
    const tour = tours.find((t) => t.id === c.id);
    return tour && isPureSpring(scoreOf(tour));
  }).length;
  // 动态补位上限：driftShare = max(0, 12 - 贴合数)。天数精确化等解析调整会
  // 微调构成数，这里锁不变量而非具体数字。
  check('S2：前提（检索层有贴合且异题补位不超动态上限）',
    searchedBeach >= 1 && searchedPureSpring <= Math.max(0, 12 - searchedBeach),
    `searched 贴合 ${searchedBeach} 条、异题温泉 ${searchedPureSpring} 条（上限 ${Math.max(0, 12 - searchedBeach)}）`);
  check('S2：coverage focus 补足后 top-24 贴合仍占多数（≥12）',
    beachCount >= 12, `贴合 ${beachCount}/${composed.length}（回填了 ${Math.max(0, beachCount - searchedBeach)} 条）`);
  check('S2：纯温泉不超检索层带入量（合成不得放大）',
    pureSpringCount <= searchedPureSpring, `纯温泉 ${pureSpringCount} 条 ≤ 检索层带入 ${searchedPureSpring} 条`);
}

// ---------- 场景 3：泛需求（userText='' 提不出概念） ----------
{
  const userText = '';
  const queries = ['海边沙滩度假', '温泉品质特价'];
  const r = hooks.executeAiSearchRounds(tours, queries, userText);
  check('S3：前提（检索层非空）', r.searchedTours.length > 0, `${r.searchedTours.length} 条`);
  const searchedIds = new Set(r.searchedTours.map((t) => t.id));
  let composed = [];
  let threw = false;
  try {
    composed = composeFocus(r.searchedTours, tours, { userText });
  } catch (error) {
    threw = true;
    console.error(error);
  }
  check('S3：空 userText 合成不报错', threw === false);
  assertInvariants('S3', composed, searchedIds);
  // coverage focus 提不出概念 → 不缩水也不放大：合成层 = min(searched 数量, 24)
  // （coverageMatches 空，只剩价格带代表补足）。
  check('S3：合成层不缩水（= min(searched, 24) + 价格带代表）',
    composed.length >= Math.min(r.searchedTours.length, MAX_AI_FOCUS_CANDIDATES),
    `合成 ${composed.length} 条 / searched ${r.searchedTours.length} 条`);
  // 与既往行为一致：空 userText 时 coverage focus 的 matches 段为空（无概念可提）。
  const coverageOnly = hooks.selectCoverageFocusCompacted(tours, [], null, { userText: '' });
  check('S3：coverage focus 空概念时仍输出（价格带代表兜底，不崩溃）',
    Array.isArray(coverageOnly), `${coverageOnly.length} 条价格带/兜底候选`);
}

// ---------- 场景 4：顺序不变量（结构攻击形态） ----------
{
  // searched 候选与 coverage focus 高度重叠时，去重保首见（searched 版本优先）。
  const userText = '海边沙滩度假2天';
  const r = hooks.executeAiSearchRounds(tours, ['海边沙滩度假'], userText);
  const composed = composeFocus(r.searchedTours, tours, { userText });
  const ids = composed.map((c) => c.id);
  check('S4：重叠池下仍无重复 id', new Set(ids).size === ids.length, `${ids.length} 条`);
  check('S4：重叠池下总量 ≤24', composed.length <= MAX_AI_FOCUS_CANDIDATES, `${composed.length} 条`);

  // 空 searched（检索失败回退路径）：合成层退化为纯 coverage focus，仍合法。
  const composedEmpty = composeFocus([], tours, { userText });
  const idsEmpty = composedEmpty.map((c) => c.id);
  check('S4：空 searched 时合成层合法（去重 + ≤24）',
    new Set(idsEmpty).size === idsEmpty.length && composedEmpty.length <= MAX_AI_FOCUS_CANDIDATES,
    `${composedEmpty.length} 条`);
  check('S4：空 searched 时 coverage focus 仍回填贴合候选',
    composedEmpty.some((c) => {
      const tour = tours.find((t) => t.id === c.id);
      return tour && scoreOf(tour).beach > 0;
    }),
    `贴合 ${composedEmpty.filter((c) => {
      const tour = tours.find((t) => t.id === c.id);
      return tour && scoreOf(tour).beach > 0;
    }).length} 条`);
}

if (failures > 0) {
  console.error(`\n${failures} 项失败`);
  process.exit(1);
}
console.log('\nR7 重点层合成路径验证全部通过');
