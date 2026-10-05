// R9 最终装配层核心体验覆盖纪律（enforceCoreCoverageDiscipline）锁定。
// 缺陷（用户实测）："便宜的沙滩旅游" AI 置顶 9 条里 7 条城市观光/温泉、零沙滩，
// 池内 ≤300 元沙滩团 54 条——检索层/重点层已健康（R7/R8），根因在最终可见装配
// 没有主题纪律：AI 项排序严格保模型顺序，零覆盖候选可占满头部。
// 修复：字典序稳定排序——需求满足数（AND/OR 需求规格）为顶层键，有覆盖排前、
// 同档保模型原序、零覆盖不被删减（排序制天然无空页风险，无 MIN_VISIBLE 放宽闸）。
// requestAiRecommendations 本体需 AI API，这里用 __aiRecommendationTestHooks
// 导出的纪律函数（生产单点接入处同一函数）离线锁定不变量。
// 跑法: node --no-warnings --experimental-strip-types --loader ./scripts/ts-alias-loader.mjs scripts/test_separation_r9_assembly.mjs
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

const discipline = hooks.enforceCoreCoverageDiscipline;
const getTerms = hooks.getCoverageTermsForQuality;
const scoreOf = (tour, terms) => hooks.getPrimitiveCoverageScore(hooks.buildTourPrimitive(tour), terms);
const item = (tourId, tier = 'ai-detailed', score = 100) => ({
  tourId,
  score,
  reason: `候选 ${tourId} 的看点与行程节奏说明。`,
  matchedSignals: [],
  recommendationTier: tier,
});

// ── 需求概念提取口径（与 executeAiSearchRounds 同款：只认概念组标签，价格词剔除）──
const beachTerms = getTerms('便宜的沙滩旅游');
check('需求概念：便宜的沙滩旅游 → [海边沙滩]（价格词不进概念）',
  JSON.stringify(beachTerms) === JSON.stringify(['海边沙滩']),
  JSON.stringify(beachTerms));
check('需求概念：泛需求（推荐一些旅游）提不出概念', getTerms('推荐一些旅游').length === 0);

const beachTours = tours.filter((t) => scoreOf(t, beachTerms) > 0);
const cityTours = tours.filter((t) => scoreOf(t, beachTerms) === 0);
check('池内沙滩贴合候选充足（≥6，纪律不会触发放宽）', beachTours.length >= 6,
  `beach=${beachTours.length} city=${cityTours.length}`);

// ── 场景 1：用户实测复现——展示分段保序：重点段（ai-detailed）整段在前、
// 普通段（ai-brief）整段在后；段内按需求满足数排序（贴合在前、保组内原序）──
{
  const aiOrder = [...cityTours.slice(0, 7), ...beachTours.slice(0, 2)]
    .map((t, i) => item(t.id, i < 5 ? 'ai-detailed' : 'ai-brief', 95 - i));
  const out = discipline(aiOrder, { candidateTours: tours, userText: '便宜的沙滩旅游' });
  check('S1 条数不变（不删除不隐藏）', out.length === aiOrder.length, `${out.length}`);
  const outDetailed = out.filter((it) => it.recommendationTier === 'ai-detailed');
  const outBrief = out.filter((it) => it.recommendationTier === 'ai-brief');
  check('S1 分段保序：重点段 5 条整段在前、普通段 4 条整段在后',
    outDetailed.length === 5 && outBrief.length === 4 &&
    out.slice(0, 5).every((it) => it.recommendationTier === 'ai-detailed') &&
    out.slice(5).every((it) => it.recommendationTier === 'ai-brief'),
    `detailed=${outDetailed.length} brief=${outBrief.length}`);
  check('S1 段内满足数排序：普通段贴合项置顶于本段（沙滩 brief 在本段前 2）',
    outBrief.slice(0, 2).every((it) => {
      const t = tours.find((c) => c.id === it.tourId);
      return t && scoreOf(t, beachTerms) > 0;
    }));
  check('S1 组内保持 AI 原顺序（贴合组与零覆盖组各自保序）', (() => {
    const ids = out.map((it) => it.tourId);
    const beachIds = aiOrder.slice(7).map((it) => it.tourId);
    const cityIds = aiOrder.slice(0, 7).map((it) => it.tourId);
    const pickedBeach = ids.filter((id) => beachIds.includes(id));
    const pickedCity = ids.filter((id) => cityIds.includes(id));
    return JSON.stringify(pickedBeach) === JSON.stringify(beachIds)
      && JSON.stringify(pickedCity) === JSON.stringify(cityIds);
  })());
  check('S1 低价贴合供给充足（数据 sanity：池内 ≥20 条 ≤300 元沙滩团）',
    tours.filter((t) => scoreOf(t, beachTerms) > 0 && (t.price ?? t.currentPrice ?? 0) <= 300).length >= 20);
}

// ── 场景 2：多主题需求按任一命中计覆盖（海边+温泉都要，温泉团也算贴合）──
{
  const springTerms = ['温泉泡汤'];
  const springTours = tours.filter((t) => scoreOf(t, springTerms) > 0 && scoreOf(t, beachTerms) === 0);
  check('S2 前置：池内存在纯温泉贴合候选', springTours.length >= 6, `spring=${springTours.length}`);
  const bothTerms = getTerms('海边和温泉都要');
  check('S2 需求概念：海边和温泉都要 → 双概念', bothTerms.length === 2, JSON.stringify(bothTerms));
  const aiOrder = [...springTours.slice(0, 6), ...cityTours.filter((t) => scoreOf(t, bothTerms) === 0).slice(0, 2)]
    .map((t, i) => item(t.id, 'ai-detailed', 90 - i));
  const out = discipline(aiOrder, { candidateTours: tours, userText: '海边和温泉都要' });
  check('S2 温泉团（任一概念命中）计为贴合、保持在前', out.slice(0, 6).every((it) => {
    const t = tours.find((c) => c.id === it.tourId);
    return t && scoreOf(t, bothTerms) > 0;
  }));
  check('S2 零覆盖候选被压后', out.slice(6).every((it) => {
    const t = tours.find((c) => c.id === it.tourId);
    return !t || scoreOf(t, bothTerms) === 0;
  }));
}

// ── 场景 3：池内贴合候选稀少（3 < MIN_VISIBLE）——分段保序下贴合项在本段
// 置顶、零覆盖项不丢弃；重点段（detailed 零覆盖）整段在前是版式规则本身 ──
{
  const scarceBeach = beachTours.slice(0, 3); // 3 < 6
  const scarcePool = [...cityTours.slice(0, 20), ...scarceBeach];
  const aiOrder = [...cityTours.slice(0, 6), ...scarceBeach]
    .map((t, i) => item(t.id, i < 6 ? 'ai-detailed' : 'ai-brief', 95 - i));
  const out = discipline(aiOrder, { candidateTours: scarcePool, userText: '便宜的沙滩旅游' });
  check('S3 普通段（brief）3 条贴合置顶于本段',
    out.filter((it) => it.recommendationTier === 'ai-brief').slice(0, 3).every((it) => {
      const t = scarcePool.find((c) => c.id === it.tourId);
      return t && scoreOf(t, beachTerms) > 0;
    }));
  check('S3 纪律是排序不是删减：条目总数与集合不变',
    out.length === aiOrder.length &&
    JSON.stringify([...out].sort((a, b) => a.tourId.localeCompare(b.tourId)).map((it) => it.tourId)) ===
    JSON.stringify([...aiOrder].sort((a, b) => a.tourId.localeCompare(b.tourId)).map((it) => it.tourId)));
  // 对照：贴合的 detailed 位（重点段）在本段内置顶（段内满足数生效）。
  const mixedDetailed = [...beachTours.slice(0, 2), ...cityTours.slice(0, 6)]
    .map((t) => item(t.id, 'ai-detailed', 90));
  const outFull = discipline(mixedDetailed, { candidateTours: tours, userText: '便宜的沙滩旅游' });
  check('S3 对照：重点段内贴合置顶（池内贴合充足）', outFull.slice(0, 2).every((it) => {
    const t = tours.find((c) => c.id === it.tourId);
    return t && scoreOf(t, beachTerms) > 0;
  }));
}

// ── 场景 4：泛需求（提不出概念）完全不变 ──
{
  const aiOrder = cityTours.slice(0, 9).map((t, i) => item(t.id, 'ai-detailed', 95 - i));
  const out = discipline(aiOrder, { candidateTours: tours, userText: '推荐一些旅游' });
  check('S4 泛需求无概念：顺序不变',
    JSON.stringify(out.map((it) => it.tourId)) === JSON.stringify(aiOrder.map((it) => it.tourId)));
}

// ── 场景 5：AI 项与本地补位分段保序——重点段 → 普通段 → 补位段，段内满足数 ──
{
  const aiOrder = [
    ...cityTours.slice(0, 5).map((t) => item(t.id, 'ai-detailed', 95)),
    item(beachTours[0].id, 'ai-brief', 80),
    ...cityTours.slice(5, 7).map((t) => item(t.id, 'local-supplement', 0)),
    item(beachTours[1].id, 'local-supplement', 0),
  ];
  const out = discipline(aiOrder, { candidateTours: tours, userText: '便宜的沙滩旅游' });
  check('S5 分段保序：普通段在重点段后、补位段殿后', (() => {
    const ranks = out.map((it) => (it.recommendationTier === 'ai-detailed' ? 0 : it.recommendationTier === 'ai-brief' ? 1 : 2));
    return ranks.every((r, i) => i === 0 || r >= ranks[i - 1]);
  })(), ranks明文());
  function ranks明文() {
    return out.map((it) => it.recommendationTier ?? 'local-supplement').join('→');
  }
  check('S5 补位段内贴合置顶（段内满足数生效）', (() => {
    const supp = out.filter((it) => it.recommendationTier === 'local-supplement');
    const t0 = tours.find((c) => c.id === supp[0].tourId);
    return t0 && scoreOf(t0, beachTerms) > 0;
  })());
  check('S5 总数不变', out.length === aiOrder.length);
}

// ── 场景 6：边界——空列表 / 单条 / 全贴合 原样返回 ──
{
  check('S6 空列表安全', discipline([], { candidateTours: tours, userText: '便宜的沙滩旅游' }).length === 0);
  const single = [item(beachTours[0].id)];
  check('S6 单条安全（原样返回）',
    discipline(single, { candidateTours: tours, userText: '便宜的沙滩旅游' }) === single);
  const allBeach = beachTours.slice(0, 8).map((t) => item(t.id));
  const outAll = discipline(allBeach, { candidateTours: tours, userText: '便宜的沙滩旅游' });
  check('S6 全贴合：顺序不变', JSON.stringify(outAll.map((it) => it.tourId)) === JSON.stringify(allBeach.map((it) => it.tourId)));
}

console.log(failures === 0 ? '\nR9 全部断言通过' : `\nR9 失败 ${failures} 项`);
process.exit(failures === 0 ? 0 : 1);
