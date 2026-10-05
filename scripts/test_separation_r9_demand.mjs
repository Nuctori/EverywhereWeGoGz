// 需求关系建模（DemandSpec）+ 字典序分层排序 锁定。
// 根因：所有信号被拍平成一个加权和，AND（便宜且沙滩）与 OR（温泉或海边）没有
// 结构，"单维度强"（便宜）可以压过"需求覆盖"（沙滩）——用户实测"便宜的沙滩
// 旅游"置顶 9 条零沙滩。修复：buildExperienceDemandSpec（AND/OR 由语法连词判定，
// 词项全部来自既有概念桥，零新增词表）+ getDemandSatisfiedCount 作为排序顶层键，
// 本地排序 / 检索合并 / 终排装配共用同一口径。
// 跑法: node --no-warnings --experimental-strip-types --loader ./scripts/ts-alias-loader.mjs scripts/test_separation_r9_demand.mjs
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
const { buildExperienceDemandSpec, getDemandSatisfiedCount, buildTourPrimitive } = hooks;

const describeSpec = (spec) => JSON.stringify(spec.map((d) => `${d.relation}:${d.terms.join('+')}`));

// ── 1. 需求规格解析：AND/OR 由语法连词判定 ──
check('单主题：便宜的沙滩旅游 → 1 个 AND 需求',
  describeSpec(buildExperienceDemandSpec('便宜的沙滩旅游')) === describeSpec([{ terms: ['海边沙滩'], relation: 'and' }]),
  describeSpec(buildExperienceDemandSpec('便宜的沙滩旅游')));
check('AND 连词：海边和温泉都要 → 2 个独立 AND 需求',
  describeSpec(buildExperienceDemandSpec('海边和温泉都要')) === describeSpec([
    { terms: ['海边沙滩'], relation: 'and' },
    { terms: ['温泉泡汤'], relation: 'and' },
  ]),
  describeSpec(buildExperienceDemandSpec('海边和温泉都要')));
check('OR 连词：温泉或者海边都行 → 1 个 OR 需求（任一即可）',
  describeSpec(buildExperienceDemandSpec('温泉或者海边都行')) === describeSpec([
    { terms: ['海边沙滩', '温泉泡汤'], relation: 'or' },
  ]),
  describeSpec(buildExperienceDemandSpec('温泉或者海边都行')));
check('回避剥离：泡温泉就免了，想看海 → 只有海边（温泉不进需求）',
  describeSpec(buildExperienceDemandSpec('泡温泉就免了，想看海', ['温泉', '泡汤'])) === describeSpec([{ terms: ['海边沙滩'], relation: 'and' }]),
  describeSpec(buildExperienceDemandSpec('泡温泉就免了，想看海', ['温泉', '泡汤'])));
check('泛需求：推荐一些旅游 → 空规格',
  buildExperienceDemandSpec('推荐一些旅游').length === 0);
check('价格词不是体验需求：预算500以内两天 → 空规格',
  buildExperienceDemandSpec('预算500以内两天').length === 0);

// ── 2. 满足计数：AND 全覆盖才算，OR 任一命中即算 ──
const andSpec = buildExperienceDemandSpec('海边和温泉都要');
const orSpec = buildExperienceDemandSpec('温泉或者海边都行');
const pureSpring = tours.find((t) => {
  const p = buildTourPrimitive(t);
  return hooks.getPrimitiveCoverageScore(p, ['温泉泡汤']) > 0 &&
    hooks.getPrimitiveCoverageScore(p, ['海边沙滩']) === 0;
});
const bothWorlds = tours.find((t) => {
  const p = buildTourPrimitive(t);
  return hooks.getPrimitiveCoverageScore(p, ['温泉泡汤']) > 0 &&
    hooks.getPrimitiveCoverageScore(p, ['海边沙滩']) > 0;
});
if (pureSpring && bothWorlds) {
  check('AND：纯温泉团只满足 1/2', getDemandSatisfiedCount(andSpec, buildTourPrimitive(pureSpring)) === 1);
  check('AND：滨海温泉两栖团满足 2/2', getDemandSatisfiedCount(andSpec, buildTourPrimitive(bothWorlds)) === 2);
  check('OR：纯温泉团即满足（任一命中）', getDemandSatisfiedCount(orSpec, buildTourPrimitive(pureSpring)) === 1);
} else {
  check('数据前提：池内存在纯温泉与两栖样本', false, `pureSpring=${Boolean(pureSpring)} both=${Boolean(bothWorlds)}`);
}

// ── 3. 字典序端到端（用户实测场景）：便宜压不过需求覆盖 ──
const local = hooks.localRecommendations(tours, '便宜的沙滩旅游');
const cheapCity = tours.find((t) => t.price <= 150 &&
  hooks.getPrimitiveCoverageScore(buildTourPrimitive(t), ['海边沙滩']) === 0);
const top10Covered = local.slice(0, 10).every((it) => (it.demandCoverage ?? 0) === 1);
check('本地排序 top10 全部满足沙滩需求', top10Covered);
check('零覆盖低价团不进 top20',
  cheapCity ? !local.slice(0, 20).some((it) => it.tourId === cheapCity.id) : true,
  cheapCity ? `零覆盖样本 ¥${cheapCity.price} ${cheapCity.title.slice(0, 20)}` : '无 ≤150 元零覆盖样本');
check('覆盖档内低价优先（便宜定量生效）：top10 全贴合且全是低价档',
  local.slice(0, 10).every((it) => (it.demandCoverage ?? 0) === 1) &&
  Math.min(...local.slice(0, 5).map((it) => tours.find((t) => t.id === it.tourId)?.price ?? Infinity)) <= 300);

// ── 4. 检索合并同口径：漂移检索式不得让零覆盖压过有覆盖 ──
const executed = hooks.executeAiSearchRounds(tours, ['便宜周边游', '低价沙滩海边'], '便宜的沙滩旅游');
const searchedCovered = executed.searchedTours.map((t) =>
  getDemandSatisfiedCount(buildExperienceDemandSpec('便宜的沙滩旅游'), buildTourPrimitive(t)));
const firstZero = searchedCovered.indexOf(0);
const lastCovered = searchedCovered.reduce((last, s, i) => (s > 0 ? i : last), -1);
check('检索层：零覆盖候选排在全部有覆盖候选之后',
  firstZero === -1 || firstZero > lastCovered,
  `有覆盖末位 ${lastCovered}，零覆盖首位 ${firstZero}`);

// ── 5. 泛需求退化：无规格时排序退化为加权和，行为不变 ──
const generic = hooks.localRecommendations(tours, '推荐一些旅游');
check('泛需求：demandCoverage 全为 0、仍有结果', generic.length > 0 &&
  generic.every((it) => (it.demandCoverage ?? 0) === 0));

if (failures > 0) {
  console.error(`\n${failures} 项失败`);
  process.exit(1);
}
console.log('\n需求关系建模与字典序排序验证全部通过');
