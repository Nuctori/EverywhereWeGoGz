import assert from 'node:assert/strict';
import worker from '../cloudflare/ai-proxy/ai-worker/worker.ts';
const saved = globalThis.fetch;
const seen = [];
let zenStatus = 200;
let blockrunStatus = 200;
const body = { model: 'client-model', stream: false, thinking: { type: 'enabled' }, messages: [{ role: 'user', content: '测试' }] };
const run = (vars) => worker.fetch(new Request('https://ai.114124.xyz/v1/chat/completions', {
  method: 'POST', headers: { Origin: 'https://nuctori.github.io', Authorization: 'Bearer browser-only' },
  body: JSON.stringify(body),
}), vars);
try {
  globalThis.fetch = async (url, init) => {
    const parsed = JSON.parse(init.body);
    const host = new URL(url).hostname;
    seen.push({ host, url, model: parsed.model, headers: new Headers(init.headers) });
    if (host === 'opencode.ai' && zenStatus === 429) {
      return Response.json({ type: 'error', error: { type: 'FreeUsageLimitError', message: 'Free usage limit reached.' } }, { status: 429, headers: { 'Retry-After': '60' } });
    }
    if (host === 'blockrun.ai' && blockrunStatus === 429) {
      return Response.json({ error: { message: 'rate limited' } }, { status: 429, headers: { 'Retry-After': '30' } });
    }
    return Response.json({ choices: [{ message: { content: 'ok' } }] });
  };

  // 未开启任何开关时，不得产生任何上游请求（现有行为不变）。
  assert.equal((await run({})).status, 502);
  assert.deepEqual(seen, [], 'default env must not probe the new lanes');

  // OpenCode Zen：官方客户端指纹 + 公开 token。
  const zen = await run({ ENABLE_OPENCODE_ZEN: '1' });
  assert.equal(zen.status, 200);
  assert.equal(zen.headers.get('x-ewg-upstream'), 'opencode-zen');
  assert.equal(seen.length, 1);
  const zenCall = seen[0];
  assert.equal(zenCall.url, 'https://opencode.ai/inference/openai/v1/chat/completions');
  assert.equal(zenCall.model, 'big-pickle');
  assert.equal(zenCall.headers.get('authorization'), 'Bearer public');
  assert.equal(zenCall.headers.get('user-agent'), 'opencode/1.0.0');
  assert.equal(zenCall.headers.get('x-opencode-client'), 'cli');
  assert.ok(zenCall.headers.get('x-opencode-session'), 'session header is required by the opencode client profile');
  assert.equal(zenCall.headers.get('x-opencode-request'), `${zenCall.headers.get('x-opencode-session')}-msg`);
  assert.equal(zenCall.headers.get('x-opencode-project'), null, 'project header is only sent when configured');

  // 额外匿名线路：2026-11-21 中文 JSON 压测后定序 BlockRun → LLM7 → OVH（OVH 只有 2 RPM）。
  seen.length = 0;
  const extra = await run({ ENABLE_EXTRA_KEYLESS: '1' });
  assert.equal(extra.headers.get('x-ewg-upstream'), 'blockrun');
  assert.equal(seen.length, 1);
  assert.equal(seen[0].host, 'blockrun.ai');
  assert.equal(seen[0].model, 'poolside/laguna-xs-2.1');
  assert.equal(seen[0].headers.has('authorization'), false);

  // BlockRun 限流时降级到 LLM7，客户端鉴权仍然不外泄。
  seen.length = 0;
  blockrunStatus = 429;
  const degraded = await run({ ENABLE_EXTRA_KEYLESS: '1' });
  assert.equal(degraded.headers.get('x-ewg-upstream'), 'llm7');
  assert.deepEqual(seen.map(call => call.host), ['blockrun.ai', 'api.llm7.io']);
  assert.equal(seen[1].headers.has('authorization'), false);

  // Zen 被限流时直接降级到匿名线路；BlockRun 仍在上一轮的 30 秒冷却里被跳过。
  seen.length = 0;
  zenStatus = 429;
  const zenDown = await run({ ENABLE_OPENCODE_ZEN: '1', ENABLE_EXTRA_KEYLESS: '1' });
  assert.equal(zenDown.headers.get('x-ewg-upstream'), 'llm7');
  assert.deepEqual(seen.map(call => call.host), ['opencode.ai', 'api.llm7.io']);
  console.log('PASS opencode zen client headers, measured keyless ordering and default-off isolation');
} finally { globalThis.fetch = saved; }
