// 网关故障/限流时的重试策略审计。
//
// 背景：线上实测点一次「AI 帮我挑」，三个"小请求"（prompt 仅 344/853/630 token）
// 却各花 27s/32s/60s。原因不是模型慢，是重试策略把故障当成了限流：
//   1. `shouldRetry = status === 429 || status >= 500` 之后，
//      `lastRateLimitedStatus = shouldRetry ? status : 0`——于是 502 也会
//      按"限流"走 AI_PROVIDER_RATE_RETRY_DELAY_MS（4000ms）的长退避。
//      网关抖一下，一次点击就白白多等 8 秒。
//   2. 5xx 是网关自身故障，重试同一个网关是确定性复现；内层还要重试满
//      maxAttempts(3) 次才轮到外层换 provider。
// 这里同时守住"源码里的策略"和"真实错误文案能否被识别"两件事。
import { strict as assert } from 'node:assert';
import fs from 'node:fs';

const source = fs.readFileSync('src/lib/ai-recommendation.ts', 'utf8');

// --- 1. 只有 429 才配长退避 ---
assert.match(
  source,
  /lastRateLimitedStatus = shouldRetry && response\.status === 429 \? response\.status : 0;/,
  '5xx must not be treated as rate limiting: only 429 may trigger the long backoff, ' +
    'otherwise a 502 costs an extra 4s per attempt',
);

// --- 2. 5xx 只重试一次就交给外层换 provider ---
assert.match(
  source,
  /if \(\/\\\]: 5\\d\\d\\b\/\.test\(providerLastError\.message\)\) \{\s*shouldRetry = attempt === 0;\s*\}/,
  'a 5xx must stop retrying the same provider after one attempt so the outer loop ' +
    'can fail over to the next endpoint',
);

// --- 3. 退避常量本身要分档合理 ---
{
  const fast = source.match(/const AI_PROVIDER_RETRY_DELAY_MS = (\d+);/);
  const slow = source.match(/const AI_PROVIDER_RATE_RETRY_DELAY_MS = (\d+);/);
  assert.ok(fast && slow, 'both retry delays must stay named constants');
  const fastMs = Number(fast[1]);
  const slowMs = Number(slow[1]);
  assert.ok(
    fastMs > 0 && fastMs <= 1000,
    `the generic retry delay must stay short: ${fastMs}ms`,
  );
  assert.ok(
    slowMs >= fastMs,
    `the rate-limit backoff must not be shorter than the generic retry: ${slowMs} vs ${fastMs}`,
  );
}

// --- 4. 真实错误文案必须能被 5xx 判定识别（正则不能只写在注释里）---
{
  const detected = (message) => /\]: 5\d\d\b/.test(message);
  const cases = [
    ['AI API failed [glm-4.7-flash]: 502 Bad Gateway', true],
    ['AI API failed [glm-4.7-flash]: 503 ', true],
    ['AI API failed [glm-4.7-flash]: 500 Internal Server Error', true],
    ['AI API failed [glm-4.7-flash]: 504 Gateway Timeout', true],
    ['AI API failed [glm-4.7-flash]: 429 Too Many Requests', false],
    ['AI API failed [glm-4.7-flash]: 401 Unauthorized', false],
    ['AI API timeout [glm-4.7-flash] after 60000ms', false],
  ];
  for (const [message, expected] of cases) {
    assert.equal(
      detected(message),
      expected,
      `5xx detection wrong for: ${message} (expected ${expected ? 'match' : 'no match'})`,
    );
  }
}

// --- 5. 分类头必须在超时/失败时不阻断主链路 ---
{
  const fn = source.slice(source.indexOf('async function classifyExperienceDemandSpec'));
  const body = fn.slice(0, fn.indexOf('\nfunction extractCandidateCoverageTerms'));
  assert.ok(
    /catch \{[\s\S]{0,200}return null;/.test(body),
    'the classifier must degrade to null instead of throwing through the main path',
  );
}

console.info('AI provider retry policy audit passed');
