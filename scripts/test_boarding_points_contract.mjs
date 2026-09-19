// 上车点数据链路守卫。
//
// 为什么需要这道守卫：Zod 默认会静默丢弃 schema 之外的键。若 runtime-schemas 漏加
// boarding，数据在 data/*.json 里看着完好，前端却拿不到——这类退化不会报错，只会
// 让功能无声失效。故此处对"类型 → schema → 产物 → 语料"逐层断言。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = path.join(root, 'public', 'data');

let failures = 0;
function check(name, ok, detail = '') {
  const mark = ok ? 'PASS' : 'FAIL';
  if (!ok) failures += 1;
  console.log(`${mark} ${name}${detail ? ` — ${detail}` : ''}`);
}

const { toursListSchema, tourBoardingSchema } = await import(
  '../src/lib/runtime-schemas.ts'
);

// 1. schema 本身必须接受 boarding（含 null district/quota/time，源站常缺）
const sample = {
  points: [
    { name: '增城中海城市广场', district: '增城区', quota: '4', city: null, time: null },
    { name: '珠江新城B2', district: null, quota: null },
  ],
  raw: '增城区：增城中海城市广场、新塘汇美麦当劳',
  summary: '增城中海城市广场 等2个上车点',
};
const parsed = tourBoardingSchema.safeParse(sample);
check('tourBoardingSchema 接受真实形态', parsed.success,
  parsed.success ? '' : JSON.stringify(parsed.error.issues.slice(0, 2)));

// 2. points 缺省为 []，防止下游 .map 崩溃
const noPoints = tourBoardingSchema.safeParse({ raw: 'x' });
check('tourBoardingSchema 缺 points 时默认空数组',
  noPoints.success && Array.isArray(noPoints.data.points));

// 3. 列表 schema 不能丢掉 boarding（Zod 静默 strip 是本功能最大风险）
const listPath = path.join(dataDir, 'tours-list.json');
if (fs.existsSync(listPath)) {
  const list = JSON.parse(fs.readFileSync(listPath, 'utf8'));
  const withBoarding = list.filter((t) => t.boarding);
  const result = toursListSchema.safeParse(list);
  check('toursListSchema 解析全量列表', result.success,
    result.success ? '' : JSON.stringify(result.error.issues.slice(0, 2)));

  if (result.success) {
    const survived = result.data.filter((t) => t.boarding).length;
    check('boarding 经 schema 后仍保留', survived === withBoarding.length,
      `原始 ${withBoarding.length} → 解析后 ${survived}`);
  }

  // 4. 结构化站点必须带 name，否则展示层会出现空白条目
  const badPoint = withBoarding
    .flatMap((t) => t.boarding.points || [])
    .find((p) => !p || typeof p.name !== 'string' || !p.name.trim());
  check('站点条目均有 name', !badPoint, badPoint ? JSON.stringify(badPoint) : '');

  // 5. raw 是 AI 语义判断的依据，有结构化点的记录应同时有原文（便于跨词命中）
  const pointsNoRaw = withBoarding
    .filter((t) => (t.boarding.points || []).length > 0)
    .filter((t) => !String(t.boarding.raw || '').trim());
  check('有站点即有 raw 原文', pointsNoRaw.length === 0,
    pointsNoRaw.length ? `${pointsNoRaw.length} 条缺 raw` : '');

  console.log(`\n列表合计 ${list.length} 条，含上车点 ${withBoarding.length} 条`);
} else {
  check('tours-list.json 存在', false, '先运行 split_tour_data.mjs');
}

// 6. AI 候选类型必须暴露 boarding，否则 getSearchCorpus 永远拿不到
const typesSource = fs.readFileSync(path.join(root, 'src', 'types', 'tour.ts'), 'utf8');
const candidateBlock = typesSource.match(
  /export type AiRecommendationCandidate = Pick<[\s\S]*?>;/,
);
check('AiRecommendationCandidate 含 boarding',
  Boolean(candidateBlock && candidateBlock[0].includes("'boarding'")));

// 7. 语料构造要真的读 boarding（防止类型加了但语料没接）
const aiSource = fs.readFileSync(path.join(root, 'src', 'lib', 'ai-recommendation.ts'), 'utf8');
const corpusBlock = aiSource.match(/function getSearchCorpus[\s\S]*?\n}/);
check('getSearchCorpus 注入 boarding 原文',
  Boolean(corpusBlock && corpusBlock[0].includes('boarding')));

if (failures > 0) {
  console.error(`\n${failures} 项失败`);
  process.exit(1);
}
console.log('\n全部通过');
