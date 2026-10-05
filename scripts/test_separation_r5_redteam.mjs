// R5 红队轮：站在攻击者立场，设法让"异题候选混进检索层贴合段/前 24"。
// 被测保证（executeAiSearchRounds）：用户点名体验主题时，贴合候选保位在前、
// 回避主题与异题候选只能进补位段（限宽 12）。
// 攻击面：
//  A 文本形态：纯标点 / 超长文本埋点 / 英文数字混杂 / 概念词嵌在词组（避暑山庄）
//  B 「湾」字地名蹭海滨别名超集（R2 已接受的 0.4% 设计，量化确认不恶化）
//  C 结构攻击：queries 全空串 / 重复 / 超长 / 单条；userText 只含回避词
//  D 边界：候选池只有异题 / 只有贴合 / 48/12/36 数量
//  E 语义歧义：比喻（像温泉一样）、否定嵌套（不要孩子吵闹）、避免词+多概念
// 判定：污染进入贴合段且产品语义解释得通＝攻击成功（缺陷）；仅进补位限宽内
// 或语义本就贴合＝防守成功（断言 PASS 固化）。
// 跑法: node --no-warnings --experimental-strip-types --loader ./scripts/ts-alias-loader.mjs scripts/test_separation_r5_redteam.mjs
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
    hike: hooks.getPrimitiveCoverageScore(p, ['森林山水']),
    family: hooks.getPrimitiveCoverageScore(p, ['亲子家庭']),
  };
};
const isPureSpring = (t) => t.spring > 0 && t.beach === 0;
const isPureBeach = (t) => t.beach > 0 && t.spring === 0;

// 搜索语料（与门内 avoid 命中同一 getSearchCorpus 口径，含上车点）。
const searchCorpusOf = (tour) => {
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
  ].filter(Boolean).join(' ').toLowerCase();
};

// 补位段结构断言：贴合候选必须整体排在异题补位之前，且补位 ≤12。
function assertOrdering(tag, r, isAlignedFn, isForeignFn) {
  const alignedFlags = r.searchedTours.map(isAlignedFn);
  const foreignFlags = r.searchedTours.map(isForeignFn);
  const lastAligned = alignedFlags.lastIndexOf(true);
  const firstForeign = foreignFlags.indexOf(true);
  const foreignCnt = foreignFlags.filter(Boolean).length;
  check(`${tag}：异题候选限宽 12`, foreignCnt <= 12, `异题 ${foreignCnt} 条`);
  check(
    `${tag}：贴合候选保位在异题补位之前`,
    lastAligned === -1 || firstForeign === -1 || firstForeign > lastAligned,
    `贴合末位 ${lastAligned}，异题首位 ${firstForeign}`,
  );
  return { foreignCnt, lastAligned, firstForeign };
}

// ---------- A 文本形态攻击 ----------
{
  // A1 纯标点 userText：提不出概念 → 门不激活，不崩溃、层非空
  const r = hooks.executeAiSearchRounds(tours, ['温泉休闲两日'], '！！！？？？~~~~。。。');
  check('A1：纯标点不崩溃且检索层非空', r.searchedTours.length > 0, `${r.searchedTours.length} 条`);
  check('A1：纯标点无概念门不激活', r.rounds[0].alignedCount === undefined, `alignedCount=${r.rounds[0].alignedCount}`);

  // A2 超长文本尾部埋点：门仍按埋点概念设防
  const junk = '随便哪里都行吃喝玩乐放松心情无所谓'.repeat(160) + '海边沙滩';
  const q = hooks.buildLocalRecommendationQuery(junk);
  check('A2：超长文本尾部埋点仍提取出海边概念',
    q.coverageTerms.some((t) => /海边|沙滩/.test(t)), `coverage=${JSON.stringify(q.coverageTerms)}`);
  const r2 = hooks.executeAiSearchRounds(tours, ['温泉休闲两日', '海边沙滩'], junk);
  assertOrdering('A2', r2,
    (t) => { const s = scoreOf(t); return s.beach > 0; },
    (t) => isPureSpring(scoreOf(t)));

  // A3 英文/数字混杂
  const mixed = 'want beach 海边沙滩 3天2晚 budget600 RMB';
  const q3 = hooks.buildLocalRecommendationQuery(mixed);
  check('A3：英文数字混杂仍提取海边概念',
    q3.coverageTerms.some((t) => /海边|沙滩/.test(t)), `coverage=${JSON.stringify(q3.coverageTerms)}`);

  // A4 概念词嵌在词组：避暑山庄（文化景点名嵌「避暑」森林别名）
  const q4 = hooks.buildLocalRecommendationQuery('想去避暑山庄逛逛');
  const c4 = q4.coverageTerms.filter((t) => /森林|文化/.test(t));
  check('A4：避暑山庄——「避暑」归一到森林山水（避暑=山林清凉语义，池内无承德线，'
    + '按广东周边池语义解释得通，防守成功固化）',
    c4.some((t) => /森林/.test(t)), `coverage=${JSON.stringify(q4.coverageTerms)}`);
}

// ---------- B 「湾」字蹭海滨（R2 已接受设计，量化回归） ----------
{
  const r = hooks.executeAiSearchRounds(tours, ['海边沙滩两日', '温泉休闲'], '海边沙滩');
  // 名字带「湾」的纯温泉候选会经「湾」别名被判贴合——R2 已确认为刻意滨水
  // 地名设计（全池仅 0.4% 超集）。红队确认未恶化：不得进入贴合段的比例失控。
  const wanSpringAligned = r.searchedTours.filter((t) => {
    const s = scoreOf(t);
    const corpus = searchCorpusOf(t);
    return s.spring > 0 && s.beach > 0 && corpus.includes('湾') && !corpus.includes('海');
  });
  check('B：「湾」字温泉候选借别名判贴合的数量保持极小（R2 接受的滨水地名超集）',
    wanSpringAligned.length <= 6, `${wanSpringAligned.length} 条：${wanSpringAligned.slice(0, 3).map((t) => t.title).join(' / ')}`);
}

// ---------- C 结构攻击：queries / userText 形态 ----------
{
  // C1 空 queries
  const r1 = hooks.executeAiSearchRounds(tours, [], '海边沙滩');
  check('C1：空 queries 不崩溃且层为空', Array.isArray(r1.searchedTours) && r1.searchedTours.length === 0,
    `${r1.searchedTours.length} 条`);
  const r1b = hooks.executeAiSearchRounds(tours, ['', '   '], '海边沙滩');
  check('C1b：全空串 queries 不崩溃', Array.isArray(r1b.searchedTours), `${r1b.searchedTours.length} 条`);

  // C2 重复同一条 query：合并去重，层不膨胀
  const r2 = hooks.executeAiSearchRounds(tours, ['海边沙滩两日', '海边沙滩两日', '海边沙滩两日'], '海边沙滩');
  check('C2：重复 query 层不超 48', r2.searchedTours.length <= 48, `${r2.searchedTours.length} 条`);
  assertOrdering('C2', r2, (t) => scoreOf(t).beach > 0, (t) => isPureSpring(scoreOf(t)));

  // C3 超长 query（1 万字）
  const longQuery = '温泉' + '周边好玩'.repeat(2000);
  const r3 = hooks.executeAiSearchRounds(tours, [longQuery], '海边沙滩');
  check('C3：超长 query 不崩溃且异题温泉仍限宽',
    r3.searchedTours.map(scoreOf).filter(isPureSpring).length <= 12,
    `纯温泉 ${r3.searchedTours.map(scoreOf).filter(isPureSpring).length} 条`);

  // C4 userText 只含回避词
  const r4 = hooks.executeAiSearchRounds(tours, ['温泉休闲两日', '森林吸氧'], '避开温泉');
  assertOrdering('C4', r4,
    (t) => scoreOf(t).spring === 0,
    (t) => isPureSpring(scoreOf(t)));
  check('C4：回避-only 门激活（有 alignedCount 字段）',
    r4.rounds.every((x) => x.alignedCount !== undefined), '');
}

// ---------- D 边界：池构成 48/12/36 ----------
{
  const pureSpringPool = tours.filter((t) => isPureSpring(scoreOf(t)));
  const pureBeachPool = tours.filter((t) => isPureBeach(scoreOf(t)));
  check('D：数据前提（纯温泉/纯海滩池非空）', pureSpringPool.length > 0 && pureBeachPool.length > 0,
    `spring=${pureSpringPool.length} beach=${pureBeachPool.length}`);

  // D1 池只有异题：贴合 0 → 补位限宽 12 生效（可见性 ≥6 由 MIN_VISIBLE 下游兜底）
  const r1 = hooks.executeAiSearchRounds(pureSpringPool, ['温泉两日'], '海边沙滩');
  check('D1：池只有异题时候选层 ≤12', r1.searchedTours.length <= 12, `${r1.searchedTours.length} 条`);

  // D2 池只有贴合：全部保位。单 query 只有各轮 top-36 进合并层是基线锁定
  //    行为（R2 记录：门以 top-36 切片计贴合），层大小 = min(36, 池大小)。
  const r2 = hooks.executeAiSearchRounds(pureBeachPool, ['海边沙滩两日'], '海边沙滩');
  check('D2：池只有贴合时候选层 = min(36, 池大小)（top-36 基线切片）',
    r2.searchedTours.length === Math.min(36, pureBeachPool.length),
    `${r2.searchedTours.length}/${Math.min(36, pureBeachPool.length)}`);
}

// ---------- E 语义歧义 / 否定嵌套 ----------
{
  // E1 比喻表述「像温泉一样暖和」：字面点名了温泉概念，门按温泉设防——
  //    用户自己说出了主题词，语义解释得通，防守成功固化。
  const q1 = hooks.buildLocalRecommendationQuery('想要像温泉一样暖和的地方');
  check('E1：比喻句字面含温泉仍归一温泉概念（点名即主题，防守成功）',
    q1.coverageTerms.some((t) => /温泉/.test(t)), `coverage=${JSON.stringify(q1.coverageTerms)}`);

  // E2 否定嵌套「不要孩子吵闹」：孩子→亲子家庭归一剥离，亲子不得成需求概念
  const q2 = hooks.buildLocalRecommendationQuery('不要孩子吵闹的团，想泡温泉');
  check('E2：温泉仍是需求概念', q2.coverageTerms.some((t) => /温泉/.test(t)),
    `coverage=${JSON.stringify(q2.coverageTerms)}`);
  check('E2：亲子家庭不得成需求概念',
    !q2.coverageTerms.some((t) => /亲子|家庭/.test(t))
      && !q2.themeHints.some((t) => /亲子|家庭/.test(t)),
    `coverage=${JSON.stringify(q2.coverageTerms)} theme=${JSON.stringify(q2.themeHints)}`);
  const r2 = hooks.executeAiSearchRounds(tours, ['亲子乐园两日', '温泉休闲'], '不要孩子吵闹的团，想泡温泉');
  assertOrdering('E2', r2,
    (t) => scoreOf(t).spring > 0,
    (t) => { const s = scoreOf(t); return s.spring === 0 && s.family > 0; });

  // E3 「避开温泉，想看海也想徒步」：「海」单字概念归一已由语法切词修复
  //    （有/也/想/看/去/玩 进切分停用词后，山/海单字经概念归一保留）——需求
  //    规格为 [海边沙滩, 户外徒步] 两条 AND；门按满足任一需求设防：海滩或
  //    徒步候选保位，纯温泉异题仍限宽补位。
  const q3 = hooks.buildLocalRecommendationQuery('避开温泉，想看海也想徒步');
  check('E3：温泉剥离，海边沙滩与户外徒步都是需求概念',
    q3.coverageTerms.some((t) => /徒步|户外/.test(t))
      && q3.coverageTerms.some((t) => /海边|沙滩/.test(t))
      && !q3.coverageTerms.some((t) => /温泉/.test(t)),
    `coverage=${JSON.stringify(q3.coverageTerms)}`);
  const r3 = hooks.executeAiSearchRounds(tours, ['海边沙滩', '森林徒步', '温泉休闲'], '避开温泉，想看海也想徒步');
  // 门口径（与生产 executeAiSearchRounds 一致）：满足任一需求概念且语料
  // 不碰回避词 = 贴合。
  const aligned3 = (t) => {
    const s = scoreOf(t);
    return (hooks.getPrimitiveCoverageScore(hooks.buildTourPrimitive(t), ['户外徒步']) > 0
      || s.beach > 0) && s.spring === 0 && !searchCorpusOf(t).includes('温泉');
  };
  assertOrdering('E3', r3, aligned3, (t) => !aligned3(t));

  // E4 「没有温泉也行」式宽容表述：字面把温泉放进回避位。若未剥离，温泉会
  //    回流成需求概念，纯温泉候选灌进贴合段——攻击面固化验证。
  const q4 = hooks.buildLocalRecommendationQuery('没有温泉也行，主要想爬山');
  const springLeak = q4.coverageTerms.some((t) => /温泉/.test(t));
  check('E4：「没有温泉」式宽容表述不把温泉判成需求概念', springLeak === false,
    `coverage=${JSON.stringify(q4.coverageTerms)}`);
  if (springLeak === false) {
    const r4 = hooks.executeAiSearchRounds(tours, ['温泉休闲', '森林徒步'], '没有温泉也行，主要想爬山');
    const aligned4 = (t) => {
      const s = scoreOf(t);
      return hooks.getPrimitiveCoverageScore(hooks.buildTourPrimitive(t), ['户外徒步']) > 0
        && s.spring === 0 && !searchCorpusOf(t).includes('温泉');
    };
    assertOrdering('E4', r4, aligned4, (t) => !aligned4(t));
  }
}

if (failures > 0) {
  console.error(`\n${failures} 项失败`);
  process.exit(1);
}
console.log('\nR5 红队分离度验证全部通过');
