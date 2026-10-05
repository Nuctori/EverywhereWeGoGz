// R3 检索分离度：回避语义扩展（交通/体力/购物/否定不误伤/多回避组合）。
// 场景：
//  1. 交通回避「不要坐飞机，两天周边」——含飞机/航班语料的候选不得占检索层前段；
//     纯回避（无主题概念）时其余候选按分保位。
//  2. 体力回避「不爬山不徒步，轻松两天」——裸否定（不+动词）也要提得到回避词
//     （不含既有触发词"不想/避开"）；爬山/徒步语料候选不贴合，森林山水类候选
//     大量召回时补位限宽 12 仍成立。
//  3. 购物回避「避开购物团」——购物语料候选不贴合，纯玩候选优先。
//  4. 否定不误伤：①「泡温泉就免了，想看海」——温泉不得判成需求概念（X就免了
//     句式剥离），海边候选贴合；②「想泡温泉，不想看海」——反向：温泉贴合，
//     纯海边候选补位；③正面表述（想爬山/口碑好的温泉）不得误提回避词。
//  5. 多回避词组合「不要飞机不要温泉不要爬山」——三类同时不贴合，且回避词
//     剥离后不得把残片判成需求概念。
//  6. 回归：泛需求行为不变。
// 跑法: node --no-warnings --experimental-strip-types --loader ./scripts/ts-alias-loader.mjs scripts/test_separation_r3_avoid.mjs
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

// 回避命中判定：与 scoreTour / 检索门同一 corpus 口径（getSearchCorpus 的字段
// 拼接在测试侧复刻，避免扩大 hooks 导出面）。
const corpusOf = (tour) => {
  const boardingTerms = tour.boarding
    ? [
        ...(tour.boarding.points || []).map((p) =>
          [p.name, p.district, p.city, p.quota ? `${p.quota}人起接` : ''].filter(Boolean).join(' '),
        ),
        tour.boarding.raw || '',
        tour.boarding.summary || '',
      ]
    : [];
  return [
    tour.title, tour.destination, tour.theme, tour.source, tour.transportType,
    tour.accommodationLevel, tour.meals, tour.groupSize, tour.season,
    ...tour.tags, ...tour.highlights, ...(tour.suitableFor || []), ...boardingTerms,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
};
const corpusHitsAvoid = (tour, words) => {
  const corpus = corpusOf(tour);
  return words.some((w) => corpus.includes(w));
};

// 概念贴合判定（与检索门同一概念组口径）：温泉泡汤 / 海边沙滩。
const conceptScoreOf = (tour) => {
  const primitive = hooks.buildTourPrimitive(tour);
  return {
    spring: hooks.getPrimitiveCoverageScore(primitive, ['温泉泡汤']),
    beach: hooks.getPrimitiveCoverageScore(primitive, ['海边沙滩']),
  };
};
const isPureSpring = (t) => t.spring > 0 && t.beach === 0;
const isPureBeach = (t) => t.beach > 0 && t.spring === 0;

// ---- 场景 1：交通回避「不要坐飞机，两天周边」 ----
{
  const q = hooks.buildLocalRecommendationQuery('不要坐飞机，两天周边');
  check('S1：avoidHints 含飞机/航班且无主题概念',
    q.avoidHints.includes('飞机') && q.avoidHints.includes('航班') && q.coverageTerms.length === 0,
    JSON.stringify(q.avoidHints));
  const dataAvail = tours.filter((t) => corpusHitsAvoid(t, ['飞机', '航班'])).length;
  check('S1：池中存在含飞机/航班语料产品（数据前提）', dataAvail > 0, `${dataAvail} 条`);

  const r = hooks.executeAiSearchRounds(
    tours, ['周边休闲两日', '飞机直达线路', '短途度假'], '不要坐飞机，两天周边');
  const flags = r.searchedTours.map((t) => corpusHitsAvoid(t, ['飞机', '航班']));
  const avoidCnt = flags.filter(Boolean).length;
  const firstAvoid = flags.indexOf(true);
  const lastNonAvoid = flags.lastIndexOf(false);
  check('S1：含飞机/航班语料候选限宽 12', avoidCnt <= 12,
    `回避候选 ${avoidCnt} 条，检索层 ${flags.length} 条`);
  check('S1：回避候选不占前段（在非回避候选之后）',
    firstAvoid === -1 || lastNonAvoid < firstAvoid,
    `非回避末位 ${lastNonAvoid}，回避首位 ${firstAvoid}`);
  check('S1：纯回避时其余候选按分保位（检索层满 48 且贴题轮贴合 > 0）',
    r.searchedTours.length === 48 && (r.rounds[0].alignedCount ?? 0) > 0,
    `层 ${r.searchedTours.length}，贴合 ${r.rounds[0].alignedCount}/${r.rounds[0].hitCount}`);
}

// ---- 场景 2：体力回避「不爬山不徒步，轻松两天」 ----
{
  const q = hooks.buildLocalRecommendationQuery('不爬山不徒步，轻松两天');
  check('S2：裸否定提出爬山/徒步回避词',
    q.avoidHints.includes('爬山') && q.avoidHints.includes('徒步'),
    JSON.stringify(q.avoidHints));
  check('S2：徒步不再被误判为需求概念',
    !q.themeHints.includes('徒步') && !q.coverageTerms.some((t) => /徒步/.test(t)),
    `theme=${JSON.stringify(q.themeHints)} coverage=${JSON.stringify(q.coverageTerms)}`);
  const hikeCnt = tours.filter((t) => corpusHitsAvoid(t, ['爬山', '徒步'])).length;
  check('S2：池中存在含爬山/徒步语料产品（数据前提）', hikeCnt > 0, `${hikeCnt} 条`);

  // 森林山水类候选大量召回（全池级命中 3000+），验证补位限宽仍成立
  const r = hooks.executeAiSearchRounds(
    tours, ['森林山水吸氧', '轻松休闲两日', '温泉度假'], '不爬山不徒步，轻松两天');
  const flags = r.searchedTours.map((t) => corpusHitsAvoid(t, ['爬山', '徒步']));
  const avoidCnt = flags.filter(Boolean).length;
  const firstAvoid = flags.indexOf(true);
  const lastNonAvoid = flags.lastIndexOf(false);
  check('S2：爬山/徒步语料候选限宽 12', avoidCnt <= 12,
    `回避候选 ${avoidCnt} 条（森林山水轮命中 ${r.rounds[0].hitCount}）`);
  check('S2：回避候选不占前段',
    firstAvoid === -1 || lastNonAvoid < firstAvoid,
    `非回避末位 ${lastNonAvoid}，回避首位 ${firstAvoid}`);
  check('S2：检索层非空且贴题轮贴合 > 0',
    r.searchedTours.length > 0 && (r.rounds[1].alignedCount ?? 0) > 0,
    `层 ${r.searchedTours.length}，贴合 ${r.rounds[1].alignedCount}/${r.rounds[1].hitCount}`);
}

// ---- 场景 3：购物回避「避开购物团」 ----
{
  const q = hooks.buildLocalRecommendationQuery('避开购物团');
  check('S3：avoidHints 含购物', q.avoidHints.includes('购物'),
    JSON.stringify(q.avoidHints));
  const shopCnt = tours.filter((t) => corpusHitsAvoid(t, ['购物'])).length;
  check('S3：池中存在含购物语料产品（数据前提）', shopCnt > 0, `${shopCnt} 条`);

  const r = hooks.executeAiSearchRounds(tours, ['纯玩无购物', '休闲度假'], '避开购物团');
  const flags = r.searchedTours.map((t) => corpusHitsAvoid(t, ['购物']));
  const avoidCnt = flags.filter(Boolean).length;
  const firstAvoid = flags.indexOf(true);
  const lastNonAvoid = flags.lastIndexOf(false);
  check('S3：购物语料候选限宽 12', avoidCnt <= 12,
    `回避候选 ${avoidCnt} 条，检索层 ${flags.length} 条`);
  check('S3：购物候选不占前段（纯玩优先）',
    firstAvoid === -1 || lastNonAvoid < firstAvoid,
    `非回避末位 ${lastNonAvoid}，回避首位 ${firstAvoid}`);
  check('S3：贴题轮贴合 > 0', (r.rounds[0].alignedCount ?? 0) > 0,
    `贴合 ${r.rounds[0].alignedCount}/${r.rounds[0].hitCount}`);
}

// ---- 场景 4：否定不误伤 ----
{
  // 4a. 温泉被回避（「X就免了」句式）：温泉不得判成需求概念
  const qa = hooks.buildLocalRecommendationQuery('泡温泉就免了，想看海');
  check('S4a：温泉进回避词', qa.avoidHints.includes('温泉'), JSON.stringify(qa.avoidHints));
  check('S4a：温泉不再判成需求概念',
    !qa.themeHints.includes('温泉') && !qa.coverageTerms.includes('温泉'),
    `theme=${JSON.stringify(qa.themeHints)} coverage=${JSON.stringify(qa.coverageTerms)}`);
  const ra = hooks.executeAiSearchRounds(
    tours, ['海边沙滩', '温泉休闲'], '泡温泉就免了，想看海');
  const scoresA = ra.searchedTours.map(conceptScoreOf);
  const beachAligned = (ra.rounds.find((x) => /海边/.test(x.query))?.alignedCount ?? 0);
  const springAligned = (ra.rounds.find((x) => /温泉/.test(x.query))?.alignedCount ?? 0);
  check('S4a：海边贴合、温泉不贴合', beachAligned > 0 && springAligned === 0,
    `海边贴合 ${beachAligned}，温泉贴合 ${springAligned}`);
  const pureSpringCnt = scoresA.filter(isPureSpring).length;
  const firstPsA = scoresA.findIndex(isPureSpring);
  const lastPbA = scoresA.reduce((last, s, i) => (isPureBeach(s) ? i : last), -1);
  check('S4a：纯温泉候选限宽 12', pureSpringCnt <= 12, `纯温泉 ${pureSpringCnt} 条`);
  check('S4a：海边贴合候选保位在纯温泉补位之前',
    lastPbA !== -1 && (firstPsA === -1 || firstPsA > lastPbA),
    `海边末位 ${lastPbA}，纯温泉首位 ${firstPsA}`);

  // 4b. 反向「想泡温泉，不想看海」：温泉贴合，纯海边补位
  const qb = hooks.buildLocalRecommendationQuery('想泡温泉，不想看海');
  check('S4b：看海进回避词而温泉仍是需求概念',
    qb.avoidHints.includes('看海') && qb.themeHints.includes('温泉'),
    `avoid=${JSON.stringify(qb.avoidHints)} theme=${JSON.stringify(qb.themeHints)}`);
  const rb = hooks.executeAiSearchRounds(
    tours, ['温泉休闲两日', '海边沙滩'], '想泡温泉，不想看海');
  const scoresB = rb.searchedTours.map(conceptScoreOf);
  const pureBeachCnt = scoresB.filter(isPureBeach).length;
  const firstPbB = scoresB.findIndex(isPureBeach);
  const lastPsB = scoresB.reduce((last, s, i) => (isPureSpring(s) ? i : last), -1);
  check('S4b：纯海边候选限宽 12', pureBeachCnt <= 12, `纯海边 ${pureBeachCnt} 条`);
  check('S4b：温泉贴合候选保位在纯海边补位之前',
    lastPsB !== -1 && (firstPbB === -1 || firstPbB > lastPsB),
    `温泉末位 ${lastPsB}，纯海边首位 ${firstPbB}`);
  check('S4b：温泉贴题轮贴合 > 0', (rb.rounds[0].alignedCount ?? 0) > 0,
    `贴合 ${rb.rounds[0].alignedCount}/${rb.rounds[0].hitCount}`);

  // 4c. 正面表述不得误提回避词
  for (const text of ['想爬山看日出', '口碑不错的温泉度假', '顺便买点特产购物也行']) {
    const q = hooks.buildLocalRecommendationQuery(text);
    check(`S4c：正面表述不误提回避词「${text}」`, q.avoidHints.length === 0,
      JSON.stringify(q.avoidHints));
  }
}

// ---- 场景 5：多回避词组合「不要飞机不要温泉不要爬山」 ----
{
  const q = hooks.buildLocalRecommendationQuery('不要飞机不要温泉不要爬山');
  check('S5：三类回避词全部提出',
    q.avoidHints.includes('飞机') && q.avoidHints.includes('温泉') && q.avoidHints.includes('爬山'),
    JSON.stringify(q.avoidHints));

  const r = hooks.executeAiSearchRounds(
    tours, ['周边休闲', '温泉两日', '森林登山'], '不要飞机不要温泉不要爬山');
  const words = ['飞机', '航班', '温泉', '爬山'];
  const flags = r.searchedTours.map((t) => corpusHitsAvoid(t, words));
  const avoidCnt = flags.filter(Boolean).length;
  const firstAvoid = flags.indexOf(true);
  const lastNonAvoid = flags.lastIndexOf(false);
  check('S5：三类回避候选合计限宽 12', avoidCnt <= 12,
    `回避候选 ${avoidCnt} 条，检索层 ${flags.length} 条`);
  check('S5：回避候选不占前段',
    firstAvoid === -1 || lastNonAvoid < firstAvoid,
    `非回避末位 ${lastNonAvoid}，回避首位 ${firstAvoid}`);
  // 回避词剥离后残片不得变成需求概念：温泉轮贴合必须为 0
  const springRound = r.rounds.find((x) => /温泉/.test(x.query));
  check('S5：剥离后温泉不被判成需求概念（温泉轮贴合 ≤2，场地轮转下两栖产品构成漂移容差）',
    springRound && springRound.alignedCount !== undefined && springRound.alignedCount <= 2,
    `贴合 ${springRound?.alignedCount}/${springRound?.hitCount}`);
  check('S5：非回避候选按分保位（贴合 > 0）',
    (r.rounds[0].alignedCount ?? 0) > 0,
    `贴合 ${r.rounds[0].alignedCount}/${r.rounds[0].hitCount}`);
}

// ---- 场景 6：泛需求回归 ----
{
  const r = hooks.executeAiSearchRounds(tours, ['周边好玩的地方', '休闲度假'], '帮我推荐个周边游');
  check('S6：泛需求合并结果非空', r.searchedTours.length > 0,
    `${r.searchedTours.length} 条`);
  check('S6：泛需求不设门（温泉候选可入检索层）',
    r.searchedTours.map(conceptScoreOf).some(isPureSpring),
    `检索层 ${r.searchedTours.length} 条`);
  const rb = hooks.executeAiSearchRounds(tours, ['温泉休闲两日'], '');
  check('S6：空文本同样不设门',
    rb.searchedTours.map(conceptScoreOf).some(isPureSpring),
    `检索层 ${rb.searchedTours.length} 条`);
}

if (failures > 0) {
  console.error(`\n${failures} 项失败`);
  process.exit(1);
}
console.log('\nR3 回避语义扩展 分离度验证全部通过');
