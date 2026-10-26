// AI 链路健壮性：取消信号合并 + 生成形态约束。
//
// 这里的断言分两类：
//   1. mergeAbortSignals —— 竞速控制器与用户取消信号必须并联，任一方 abort
//      都要掐断底层 fetch。早先直接覆盖 signal，用户点取消后请求仍跑到超时，
//      手机上叠加出多个 35s 在途请求。
//   2. 生成形态约束 —— 曾经把主调用拆成两路并行（前段详细 + 后段简要），
//      实测总时长 34.7s→20.8s 但首屏一秒没提前（首屏由流式预览决定），
//      而并发翻倍导致免费额度撞 429、手机端一直转圈。已回退单路。
//      这两条断言把"回退"钉住，防止有人再次引入并行。
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
const { mergeAbortSignals } = hooks;

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

// ── 2. 生成形态约束 ───────────────────────────────────────────────────
{
  const source = fs.readFileSync(path.join(root, 'src', 'lib', 'ai-recommendation.ts'), 'utf8');

  // 主调用必须是单次 await，不能是两路并行。
  // 用"出现 allSettled([headCall, tailCall])"这种形态做判据。
  check(
    'form: 主排序调用不再并行两路',
    !/Promise\.allSettled\(\[\s*headCallPromise/.test(source) &&
      !/headCallPromise/.test(source) &&
      !/tailCallPromise/.test(source),
  );

  // 候选切分函数必须已删除（防止并行残骸复活）
  check(
    'form: 并行候选切分函数已移除',
    !/splitCandidatePoolsForParallelGeneration/.test(source),
  );

  // 分类头仍必须使用独立短超时
  check(
    'form: 分类头使用独立短超时',
    /timeoutMs: AI_CLASSIFIER_TIMEOUT_MS,/.test(source),
  );

  // 用户取消不降级到本地兜底（取消就是取消）
  check(
    'form: 用户取消不降级到本地兜底',
    /if \(signal\?\.aborted \|\| \(error instanceof DOMException && error\.name === 'AbortError'\)\) \{/.test(source),
  );

  // 流式预览仍接通（首屏体验的主路径）
  check(
    'form: 流式预览 onPartialItems 仍接通',
    /onPartialItems: emitPartialPreview,/.test(source),
  );

  // 主调用仍带 signal 透传
  check(
    'form: 主调用透传取消信号',
    /maxTokens: 2400,[\s\S]{0,250}\.\.\.\(signal \? \{ signal \} : \{\}\),/.test(source),
  );
}

console.log(failures === 0 ? '\nALL PASS' : `\n${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);

