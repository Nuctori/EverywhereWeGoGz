// 需求分类头：原语封闭集归一校验 + profile 覆盖口径 锁定。
// 架构：用户原话 → 原语规格由模型分类调用（classifyExperienceDemandSpec）完成；
// 词面解析只是无 AI 时的 fallback。本测试离线锁定分类输出的归一纪律与
// profile 覆盖口径，不发起网络调用。
// 跑法: node --no-warnings --experimental-strip-types --loader ./scripts/ts-alias-loader.mjs scripts/test_demand_classifier.mjs
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
const list = JSON.parse(fs.readFileSync(path.join(root, 'public', 'data', 'tours-list.json'), 'utf8'));
const tours = toursListSchema.safeParse(list).data;
const { normalizeClassifiedDemandSpec, getDemandSatisfiedCount, buildTourPrimitive } = hooks;

// ── 1. 归一校验：封闭原语集 ──
const valid = normalizeClassifiedDemandSpec({
  demands: [
    { terms: ['海边沙滩', '泡汤'], relation: 'and' },   // 泡汤不是标签 → 剔除
    { terms: ['温泉泡汤'], relation: 'or' },
  ],
  avoid: ['户外徒步', ' invented '],
});
check('非标签词项被剔除、合法标签保留',
  JSON.stringify(valid?.demands) === JSON.stringify([
    { terms: ['海边沙滩'], relation: 'and' },
    { terms: ['温泉泡汤'], relation: 'or' },
  ]) && JSON.stringify(valid?.avoid) === JSON.stringify(['户外徒步']),
  JSON.stringify(valid));
check('source 标记 classifier', valid?.source === 'classifier');

check('空 demand 被丢弃、关系归一（非法 relation → and）',
  JSON.stringify(normalizeClassifiedDemandSpec({
    demands: [{ terms: [], relation: 'or' }, { terms: ['亲子家庭'], relation: 'xor' }],
  })) === JSON.stringify({ demands: [{ terms: ['亲子家庭'], relation: 'and' }], avoid: [], source: 'classifier' }));

check('全空输出返回 null（调用方退回词面 fallback）',
  normalizeClassifiedDemandSpec({ demands: [], avoid: [] }) === null);
check('非对象输入返回 null', normalizeClassifiedDemandSpec(null) === null && normalizeClassifiedDemandSpec('x') === null);

// ── 2. profile 覆盖口径：只认结构化档案，不做语料扫描 ──
const andSpec = [{ terms: ['海边沙滩', '温泉泡汤'], relation: 'and' }];
const springOnly = tours.find((t) => {
  const p = buildTourPrimitive(t);
  return p.experienceCategories.includes('温泉泡汤') && !p.experienceCategories.includes('海边沙滩');
});
if (springOnly) {
  const primitive = buildTourPrimitive(springOnly);
  check('profile：档案无海边 → AND 需求不满足（即使语料蹭到海边词）',
    getDemandSatisfiedCount(andSpec, primitive, 'profile') === 0);
  check('lexical：语料扫描口径维持原行为（fallback 不回归）',
    getDemandSatisfiedCount(andSpec, primitive, 'lexical') ===
    getDemandSatisfiedCount(andSpec, primitive));
}

// ── 3. 分类规格下传：executeAiSearchRounds 的分离度门走 profile 口径 ──
// 口径与生产一致：贴合 = profile 档案命中需求（滨海温泉两栖属贴合），
// 纯温泉（档案有温泉无海边）只能进异题补位段且受动态上限约束。
const classified = normalizeClassifiedDemandSpec({
  demands: [{ terms: ['海边沙滩'], relation: 'and' }],
  avoid: ['温泉泡汤'],
});
const executed = hooks.executeAiSearchRounds(
  tours,
  ['海边沙滩度假', '温泉品质特价'],
  '便宜的沙滩旅游',       // 词面 fallback 也解析出同样需求
  classified ?? undefined,
);
const profileOf = (t) => {
  const p = buildTourPrimitive(t);
  return {
    beach: p.experienceCategories.includes('海边沙滩'),
    spring: p.experienceCategories.includes('温泉泡汤'),
  };
};
const profiles = executed.searchedTours.map(profileOf);
const alignedCount = profiles.filter((s) => s.beach).length;
const pureSpring = profiles.filter((s) => s.spring && !s.beach).length;
check('分类规格下传：贴合一侧保位、纯温泉受动态上限约束',
  profiles.length > 0 && pureSpring <= Math.max(0, 12 - alignedCount),
  `检索层 ${profiles.length} 条，贴合 ${alignedCount}，纯温泉 ${pureSpring}（上限 ${Math.max(0, 12 - alignedCount)}）`);
const lastAligned = profiles.reduce((last, s, i) => (s.beach ? i : last), -1);
const firstPureSpring = profiles.findIndex((s) => s.spring && !s.beach);
check('分类规格下传：贴合候选排在纯温泉之前',
  firstPureSpring === -1 || firstPureSpring > lastAligned,
  `贴合末位 ${lastAligned}，纯温泉首位 ${firstPureSpring}`);

// ── 适配档位编码：单调性 + 可解码 ──
const { encodeSuitabilityGrade, decodeSuitabilityGrade } = hooks;
const gradeSamples = [];
for (let cov = 0; cov <= 3; cov++) {
  for (let fit = 0; fit <= 3; fit++) {
    for (const near of [0, 1]) {
      for (const clean of [0, 1]) {
        const g = encodeSuitabilityGrade({ demandCoverage: cov, constraintFit: fit, constraintNear: near, qualityClean: clean === 1 });
        const d = decodeSuitabilityGrade(g);
        check('编码可解码且保真', d.demandCoverage === cov && d.constraintFit === fit && d.constraintNear === near && d.qualityClean === (clean === 1));
        gradeSamples.push({ cov, fit, near, clean: clean === 1, g });
      }
    }
  }
}
// 字典序单调：元组逐位优先级与整数序一致
const gradeTuples = [
  { demandCoverage: 0, constraintFit: 0, constraintNear: 0, qualityClean: false },
  { demandCoverage: 1, constraintFit: 0, constraintNear: 0, qualityClean: false },
  { demandCoverage: 2, constraintFit: 0, constraintNear: 0, qualityClean: false },
  { demandCoverage: 2, constraintFit: 1, constraintNear: 0, qualityClean: false },
  { demandCoverage: 2, constraintFit: 1, constraintNear: 1, qualityClean: false },
  { demandCoverage: 2, constraintFit: 1, constraintNear: 1, qualityClean: true },
];
let monoOk = true;
for (let i = 1; i < gradeTuples.length; i++) {
  const a = encodeSuitabilityGrade(gradeTuples[i - 1]);
  const b = encodeSuitabilityGrade(gradeTuples[i]);
  if (!(a < b)) {
    monoOk = false;
    check('适配档位单调', false, JSON.stringify(gradeTuples[i - 1]) + '→' + a + ' vs ' + JSON.stringify(gradeTuples[i]) + '→' + b);
  }
}
check('适配档位随字典序元组单调递增', monoOk);

if (failures > 0) {
  console.error(`\n${failures} 项失败`);
  process.exit(1);
}
console.log('\n需求分类头（原语 + profile 口径）验证全部通过');
