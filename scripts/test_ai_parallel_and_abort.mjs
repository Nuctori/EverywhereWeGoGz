// AI 链路健壮性：取消信号合并 + 并行生成的候选切分。
//
// 两处都是"看不见但错了很难发现"的逻辑：
//   1. mergeAbortSignals —— 竞速控制器与用户取消信号必须并联，任一方 abort
//      都要掐断底层 fetch。早先直接覆盖 signal，用户点取消后请求仍跑到超时，
//      手机上叠加出多个 35s 在途请求。
//   2. splitCandidatePoolsForParallelGeneration —— 并行两路的候选池必须严格
//      不相交。一旦某个 tourId 同时进两路，下游审计按先到先得去重会静默丢掉
//      后段那条，表现为"少给了几条"（不报错、不易察觉）。
//
// 跑法: node --no-warnings --experimental-strip-types --loader ./scripts/ts-alias-loader.mjs scripts/test_ai_parallel_and_abort.mjs
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
const { mergeAbortSignals, splitCandidatePoolsForParallelGeneration } = hooks;

// ── 1. mergeAbortSignals ──────────────────────────────────────────────
{
  // 全空 → undefined（不额外造对象）
  check('merge: 无信号返回 undefined', mergeAbortSignals(undefined, null) === undefined);

  // 单个信号 → 原样返回同一个对象（不做包装，避免无谓开销）
  const only = new AbortController();
  check('merge: 单信号原样返回同一对象', mergeAbortSignals(only.signal) === only.signal);

  // 两个信号：任一 abort 都要传导
  const a = new AbortController();
  const b = new AbortController();
  const mergedAB = mergeAbortSignals(a.signal, b.signal);
  check('merge: 初始未 abort', mergedAB.aborted === false);
  a.abort();
  check('merge: 第一个 abort 后合成信号 abort', mergedAB.aborted === true);

  const c = new AbortController();
  const d = new AbortController();
  const mergedCD = mergeAbortSignals(c.signal, d.signal);
  d.abort();
  check('merge: 第二个 abort 同样传导', mergedCD.aborted === true);

  // 已经 abort 的输入 → 立刻返回 aborted 的合成信号
  const dead = new AbortController();
  dead.abort(new Error('cancelled-by-user'));
  const alive = new AbortController();
  const mergedDead = mergeAbortSignals(dead.signal, alive.signal);
  check('merge: 输入已 abort 时合成信号立刻 abort', mergedDead.aborted === true);
  check(
    'merge: abort 原因被透传',
    mergedDead.reason instanceof Error && mergedDead.reason.message === 'cancelled-by-user',
    String(mergedDead.reason),
  );
}

// ── 2. splitCandidatePoolsForParallelGeneration ───────────────────────
{
  const make = (id) => ({ id, title: `tour-${id}` });
  const focusFull = ['f1', 'f2', 'f3', 'f4'].map(make);
  const stableCandidates = ['s1', 's2', 's3'].map(make);

  const split = splitCandidatePoolsForParallelGeneration({ focusFull, stableCandidates });
  const headIds = new Set(split.head.focusFull.map((item) => item.id));
  const tailIds = new Set([
    ...split.tail.focusFull.map((item) => item.id),
    ...split.tail.stableCandidates.map((item) => item.id),
  ]);

  check(
    'split: head 按详细档容量切池（headLimit 的 1.6 倍，封顶 focus 长度）',
    split.head.focusFull.length === 4,
    `got ${split.head.focusFull.length}`,
  );
  check('split: head 不含稳定池', split.head.stableCandidates.length === 0);

  // headLimit 可调：给 5 时 head 池应收紧到 8 条以内（5*1.6=8）
  const tight = splitCandidatePoolsForParallelGeneration({
    focusFull: Array.from({ length: 20 }, (_, i) => make(`t${i}`)),
    stableCandidates: [],
    headLimit: 5,
  });
  check('split: headLimit 生效', tight.head.focusFull.length === 8, `got ${tight.head.focusFull.length}`);

  const overlap = [...headIds].filter((id) => tailIds.has(id));
  check('split: 两路候选严格不相交', overlap.length === 0, `overlap=${overlap.join(',')}`);

  // 覆盖性：head + tail 合起来必须覆盖全部输入（不能丢候选）
  const allInputIds = new Set([...focusFull, ...stableCandidates].map((item) => item.id));
  const coveredIds = new Set([...headIds, ...tailIds]);
  const missing = [...allInputIds].filter((id) => !coveredIds.has(id));
  check('split: 全部候选都被覆盖，无丢失', missing.length === 0, `missing=${missing.join(',')}`);

  // 边界：focus 只有 1 条时 head 仍要拿到 1 条（不能切出空池）
  const tiny = splitCandidatePoolsForParallelGeneration({
    focusFull: [make('only')],
    stableCandidates: [make('s1')],
  });
  check('split: focus 单条时 head 非空', tiny.head.focusFull.length === 1);
  check(
    'split: focus 单条时 tail 仍拿到稳定池',
    tiny.tail.stableCandidates.length === 1,
  );

  // 边界：focus 为空时不崩
  const empty = splitCandidatePoolsForParallelGeneration({ focusFull: [], stableCandidates: [make('s1')] });
  check('split: focus 为空时不抛错', Array.isArray(empty.head.focusFull) && Array.isArray(empty.tail.stableCandidates));
}

// ── 3. 静态约束：主调用必须是并行两路，且不再有单发 3600 ────────────
{
  const source = fs.readFileSync(path.join(root, 'src', 'lib', 'ai-recommendation.ts'), 'utf8');
  check(
    'source: 主排序调用使用 Promise.allSettled 并行两路',
    /Promise\.allSettled\(\[headCallPromise, tailCallPromise\]\)/.test(source),
  );
  check(
    'source: 全部候选只喂给并行切分函数，不再整体进单次生成',
    /splitCandidatePoolsForParallelGeneration\(\{\s*\n\s*focusFull: focusGraded,/.test(source),
  );
  check(
    'source: 分类头使用独立短超时',
    /timeoutMs: AI_CLASSIFIER_TIMEOUT_MS,/.test(source),
  );
  check(
    'source: 用户取消不降级到本地兜底（取消就是取消）',
    /if \(signal\?\.aborted \|\| \(error instanceof DOMException && error\.name === 'AbortError'\)\) \{/.test(source),
  );
}

console.log(failures === 0 ? '\nALL PASS' : `\n${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);
