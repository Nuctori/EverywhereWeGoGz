// R4 检索分离度：泛需求保护 + 记忆继承回归。
// effectiveUserText = buildLocalRecommendationText(text, memory) 的拼接形态
// （用户原话 + memory 的 destinationHints/travelStyle/mustHave/avoid("避开X")/
//   budget/days 片段）。本测试用文本拼接模拟该构造，不调用私有函数。
// 场景：
//  1. 泛需求纯文本（"帮我推荐个周边游"/"便宜的两天团"）——提不出概念组标签、
//     无回避词 → 门不激活，异题候选不限宽、可入检索层（行为与既往一致）。
//  2. 记忆注入不污染：原话"预算压到600" + 记忆片段"海边沙滩 从化温泉 亲子 避开爬山"
//     —— 多概念并存时贴合=命中任一概念：a) 海边/温泉各概念候选均保位贴合；
//     b) "避开爬山"剥离后爬山/徒步不判成需求概念，爬山候选不贴合。
//  3. 记忆 avoid 注入：原话"想看海" + 记忆拼接"避开温泉"——温泉不得成为需求
//     概念，温泉候选不贴合、限宽补位（R3 裸否定句式的拼接注入路径回归）。
//  4. follow-up 语义：第一轮"海边沙滩两天"，追问"预算压到600"（memory 继承海边）
//     —— 合并门按海边设门不失效：海边贴合，纯温泉异题候选限宽 12。
// 跑法: node --no-warnings --experimental-strip-types --loader ./scripts/ts-alias-loader.mjs scripts/test_separation_r4_memory.mjs
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

// 爬山/徒步语料命中判定（与 R3 同一 corpus 口径）。
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
const corpusHits = (tour, words) => {
  const corpus = corpusOf(tour);
  return words.some((w) => corpus.includes(w));
};

// 概念贴合判定（与检索门同一概念组口径）。
const conceptScoreOf = (tour) => {
  const primitive = hooks.buildTourPrimitive(tour);
  return {
    spring: hooks.getPrimitiveCoverageScore(primitive, ['温泉泡汤']),
    beach: hooks.getPrimitiveCoverageScore(primitive, ['海边沙滩']),
    hike: hooks.getPrimitiveCoverageScore(primitive, ['森林山水']),
  };
};
const isPureSpring = (t) => t.spring > 0 && t.beach === 0;
const isPureBeach = (t) => t.beach > 0 && t.spring === 0;

// 拼接形态模拟：effectiveUserText = 原话 + memory 片段拼接。
const joined = (...parts) => parts.filter(Boolean).join(' ');

// ---- 场景 1：泛需求纯文本 → 门不激活 ----
{
  for (const text of ['帮我推荐个周边游', '便宜的两天团']) {
    const q = hooks.buildLocalRecommendationQuery(text);
    check(`S1：「${text}」提不出概念组标签`,
      q.coverageTerms.length === 0,
      `coverage=${JSON.stringify(q.coverageTerms)}`);
    check(`S1：「${text}」无回避词`,
      q.avoidHints.length === 0,
      JSON.stringify(q.avoidHints));
  }
  const r = hooks.executeAiSearchRounds(
    tours, ['温泉休闲两日', '周边好玩的地方'], '帮我推荐个周边游');
  check('S1：泛需求检索层非空',
    r.searchedTours.length > 0, `${r.searchedTours.length} 条`);
  check('S1：门不激活（异题温泉候选不限宽、可入检索层）',
    r.searchedTours.map(conceptScoreOf).some(isPureSpring),
    `检索层 ${r.searchedTours.length} 条`);
  check('S1：泛需求贴题轮不设门（无贴合计数字段）',
    r.rounds[0].alignedCount === undefined,
    `alignedCount=${r.rounds[0].alignedCount}`);
  const rb = hooks.executeAiSearchRounds(
    tours, ['温泉休闲两日', '森林山水'], '便宜的两天团');
  check('S1：便宜两天团同样不设门（温泉候选可入层）',
    rb.searchedTours.map(conceptScoreOf).some(isPureSpring) && rb.searchedTours.length > 0,
    `检索层 ${rb.searchedTours.length} 条`);
}

// ---- 场景 2：记忆注入不污染（多概念并存 + 避开爬山剥离） ----
{
  // 模拟 buildLocalRecommendationText：原话 + memory 拼接（avoid 片段拼成"避开X"）
  const userText = joined('预算压到600', '海边沙滩', '从化温泉', '亲子', '避开爬山');
  const q = hooks.buildLocalRecommendationQuery(userText);
  check('S2：拼接文本提取出海边/温泉概念',
    q.coverageTerms.some((t) => /海边|沙滩/.test(t))
      && q.coverageTerms.some((t) => /温泉/.test(t)),
    `coverage=${JSON.stringify(q.coverageTerms)}`);
  check('S2：「避开爬山」进入回避词',
    q.avoidHints.includes('爬山'), JSON.stringify(q.avoidHints));
  check('S2：爬山/徒步不判成需求概念',
    !q.themeHints.some((t) => /爬山|徒步/.test(t))
      && !q.coverageTerms.some((t) => /爬山|徒步|户外/.test(t)),
    `theme=${JSON.stringify(q.themeHints)} coverage=${JSON.stringify(q.coverageTerms)}`);

  const r = hooks.executeAiSearchRounds(
    tours, ['海边沙滩两日', '从化温泉亲子', '森林登山吸氧'], userText);
  // a) 多概念并存：贴合=命中任一概念 → 各概念候选都保位贴合
  const beachAligned = r.rounds.find((x) => /海边/.test(x.query))?.alignedCount ?? 0;
  const springAligned = r.rounds.find((x) => /温泉/.test(x.query))?.alignedCount ?? 0;
  check('S2a：海边概念候选贴合保位', beachAligned > 0, `贴合 ${beachAligned}`);
  check('S2a：温泉概念候选贴合保位', springAligned > 0, `贴合 ${springAligned}`);
  // b) 避开爬山剥离：纯户外徒步概念候选（不同时命中温泉/海边/亲子）不贴合
  const pureHikeCnt = tours.filter((t) => {
    const p = hooks.buildTourPrimitive(t);
    return hooks.getPrimitiveCoverageScore(p, ['户外徒步', '森林山水']) > 0
      && hooks.getPrimitiveCoverageScore(p, ['温泉泡汤', '海边沙滩', '亲子家庭']) === 0;
  }).length;
  check('S2b：池中存在纯户外徒步概念产品（数据前提）', pureHikeCnt > 0, `${pureHikeCnt} 条`);
  const pureHikeInLayer = r.searchedTours.filter((t) => {
    const p = hooks.buildTourPrimitive(t);
    return hooks.getPrimitiveCoverageScore(p, ['户外徒步', '森林山水']) > 0
      && hooks.getPrimitiveCoverageScore(p, ['温泉泡汤', '海边沙滩', '亲子家庭']) === 0;
  }).length;
  check('S2b：纯徒步概念候选不贴合、仅限宽补位（≤12）', pureHikeInLayer <= 12,
    `检索层纯徒步概念 ${pureHikeInLayer} 条`);
}

// ---- 场景 3：记忆 avoid 注入「避开温泉」+ 原话「想看海」 ----
{
  const userText = joined('想看海', '避开温泉');
  const q = hooks.buildLocalRecommendationQuery(userText);
  check('S3：温泉进入回避词', q.avoidHints.includes('温泉'),
    JSON.stringify(q.avoidHints));
  check('S3：温泉不得判成需求概念',
    !q.themeHints.some((t) => /温泉/.test(t)) && !q.coverageTerms.some((t) => /温泉/.test(t)),
    `theme=${JSON.stringify(q.themeHints)} coverage=${JSON.stringify(q.coverageTerms)}`);
  check('S3：海边仍是需求概念',
    q.coverageTerms.some((t) => /海边|沙滩|海/.test(t)),
    `coverage=${JSON.stringify(q.coverageTerms)}`);

  const r = hooks.executeAiSearchRounds(tours, ['海边沙滩', '温泉休闲'], userText);
  const beachAligned = r.rounds.find((x) => /海边/.test(x.query))?.alignedCount ?? 0;
  const springAligned = r.rounds.find((x) => /温泉/.test(x.query))?.alignedCount ?? 0;
  check('S3：海边贴合、温泉不贴合', beachAligned > 0 && springAligned === 0,
    `海边贴合 ${beachAligned}，温泉贴合 ${springAligned}`);
  const scores = r.searchedTours.map(conceptScoreOf);
  const pureSpringCnt = scores.filter(isPureSpring).length;
  const firstPs = scores.findIndex(isPureSpring);
  const lastPb = scores.reduce((last, s, i) => (isPureBeach(s) ? i : last), -1);
  check('S3：纯温泉候选限宽 12', pureSpringCnt <= 12, `纯温泉 ${pureSpringCnt} 条`);
  check('S3：海边贴合候选保位在纯温泉补位之前',
    lastPb !== -1 && (firstPs === -1 || firstPs > lastPb),
    `海边末位 ${lastPb}，纯温泉首位 ${firstPs}`);
}

// ---- 场景 4：follow-up 语义（memory 继承海边，原话只有预算） ----
{
  const userText = joined('预算压到600', '海边沙滩'); // memory 继承的海边目的地片段
  const q = hooks.buildLocalRecommendationQuery(userText);
  check('S4：海边概念从继承片段提出',
    q.coverageTerms.some((t) => /海边|沙滩/.test(t)),
    `coverage=${JSON.stringify(q.coverageTerms)}`);
  check('S4：预算原话不产生噪声概念/回避',
    q.avoidHints.length === 0,
    `avoid=${JSON.stringify(q.avoidHints)}`);

  const r = hooks.executeAiSearchRounds(
    tours, ['海边沙滩两日', '温泉休闲'], userText);
  const beachAligned = r.rounds.find((x) => /海边/.test(x.query))?.alignedCount ?? 0;
  // 温泉轮里贴合的只能是海边概念（混合产品）；纯温泉候选不得贴合
  const springRound = r.rounds.find((x) => /温泉/.test(x.query));
  check('S4：门按海边设门不失效（海边贴合）',
    beachAligned > 0, `海边贴合 ${beachAligned}`);
  check('S4：纯温泉候选不贴合（检索层纯温泉仅补位）',
    r.searchedTours.map(conceptScoreOf).filter(isPureSpring).length <= 12,
    `纯温泉 ${r.searchedTours.map(conceptScoreOf).filter(isPureSpring).length} 条`);
  const scores = r.searchedTours.map(conceptScoreOf);
  const pureSpringCnt = scores.filter(isPureSpring).length;
  const firstPs = scores.findIndex(isPureSpring);
  const lastPb = scores.reduce((last, s, i) => (isPureBeach(s) ? i : last), -1);
  check('S4：异题纯温泉候选限宽 12', pureSpringCnt <= 12, `纯温泉 ${pureSpringCnt} 条`);
  check('S4：海边贴合候选保位在纯温泉补位之前',
    lastPb !== -1 && (firstPs === -1 || firstPs > lastPb),
    `海边末位 ${lastPb}，纯温泉首位 ${firstPs}`);
  check('S4：检索层非空', r.searchedTours.length > 0, `${r.searchedTours.length} 条`);
}

if (failures > 0) {
  console.error(`\n${failures} 项失败`);
  process.exit(1);
}
console.log('\nR4 泛需求 + 记忆继承 分离度验证全部通过');
