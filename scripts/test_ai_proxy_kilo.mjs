import assert from 'node:assert/strict';
import worker from '../cloudflare/ai-proxy/ai-worker/worker.ts';
const original = globalThis.fetch;
const calls = [];
let fail = false;
let stream = false;
function request() {
  return new Request('https://ai.114124.xyz/v1/chat/completions', {
    method: 'POST', headers: { Origin: 'https://nuctori.github.io', Authorization: 'Bearer client-only' },
    body: JSON.stringify({ model: 'paid', stream, thinking: { type: 'enabled' }, messages: [{ role: 'user', content: '测试' }] }),
  });
}
try {
  globalThis.fetch = async (url, init) => {
    const body = JSON.parse(init.body);
    calls.push(body.model);
    assert.equal(url, 'https://ai-gateway.kilo.ai/api/v1/chat/completions');
    assert.equal(new Headers(init.headers).has('Authorization'), false);
    assert.equal(init.redirect, 'manual');
    assert.equal(body.thinking, undefined);
    if (fail && calls.length === 1) return new Response('{}', {status:429});
    return new Response(stream ? 'data: {"choices":[{"delta":{"content":"ok"}}]}\n\ndata: [DONE]\n\n' : '{"choices":[{"message":{"content":"ok"}}]}', {headers:{'Content-Type': stream ? 'text/event-stream' : 'application/json'}});
  };
  assert.equal((await worker.fetch(request(), {})).status, 502);
  assert.deepEqual(calls, []);
  let reply = await worker.fetch(request(), { ENABLE_KILO_FREE: '1' });
  assert.equal(reply.status, 200);
  assert.deepEqual(calls, ['reflection/beam-free']);
  calls.length = 0; fail = true; stream = true;
  reply = await worker.fetch(request(), { ENABLE_KILO_FREE: '1' });
  assert.equal(reply.headers.get('x-ewg-upstream'), 'kilo:nemotron-vl');
  assert.equal(await reply.text(), 'data: {"choices":[{"delta":{"content":"ok"}}]}\n\ndata: [DONE]\n\n');
  assert.deepEqual(calls, ['reflection/beam-free','nvidia/nemotron-3.5-super-vl:free']);
  console.log('PASS opt-in, fixed free models, no credential forwarding, 429 fallback and SSE pass-through');
} finally { globalThis.fetch = original; }

