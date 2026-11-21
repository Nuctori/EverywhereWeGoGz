import assert from 'node:assert/strict';
import worker from '../cloudflare/ai-proxy/ai-worker/worker.ts';
const realFetch = globalThis.fetch;
const realNow = Date.now;
let now = realNow(), phase = 'failed', release, entered;
const calls = [];
const env = { ENABLE_KILO_FREE: '1' };
const dots = 'reflection/beam-free';
const ernie = 'nvidia/nemotron-3.5-super-vl:free';
let ip = 0;
function run(stream = false, signal) {
  return worker.fetch(new Request('https://ai.114124.xyz/v1/chat/completions', {
    method: 'POST', headers: { Origin: 'https://nuctori.github.io', 'CF-Connecting-IP': String(++ip) },
    signal, body: JSON.stringify({ stream, messages: [{ role: 'user', content: '测试' }] }),
  }), env);
}
try {
  Date.now = () => now;
  globalThis.fetch = async (_url, init) => {
    const { model, stream } = JSON.parse(init.body);
    calls.push([model, stream]);
    if (model === dots && phase === 'failed' && !stream) return new Response('{}', { status: 429, headers: { 'Retry-After': '3' } });
    if (model === dots && phase === 'half-open') await new Promise(resolve => { release = resolve; entered(); });
    if (phase === 'all-failed') return new Response('{}', { status: 429, headers: { 'Retry-After': '5' } });
    return stream ? new Response('data: {"choices":[{"delta":{"content":"ok"}}]}\n\ndata: [DONE]\n\n', { headers: { 'Content-Type': 'text/event-stream' } }) : Response.json({ choices: [{ message: { content: 'ok' } }] });
  };
  assert.equal((await run()).headers.get('x-ewg-upstream'), 'kilo:nemotron-vl');
  now += 2999;
  calls.length = 0;
  assert.equal((await run()).headers.get('x-ewg-upstream'), 'kilo:nemotron-vl');
  assert.deepEqual(calls, [[ernie, false]], 'skip the recently rate-limited model');
  assert.equal((await run(true)).headers.get('x-ewg-upstream'), 'kilo:beam', 'SSE health is independent');
  now += 1;
  phase = 'half-open';
  const started = new Promise(resolve => { entered = resolve; });
  const probe = run();
  await started;
  try { assert.equal((await run()).headers.get('x-ewg-upstream'), 'kilo:nemotron-vl', 'only one half-open request'); } finally { release(); }
  assert.equal((await probe).headers.get('x-ewg-upstream'), 'kilo:beam');
  phase = 'ok';
  assert.equal((await run()).headers.get('x-ewg-upstream'), 'kilo:beam');
  phase = 'all-failed';
  await run();
  calls.length = 0;
  const cooled = await run();
  assert.equal(cooled.status, 503);
  assert.equal(cooled.headers.get('retry-after'), '5');
  assert.deepEqual(calls, []);
  now += 5000;
  phase = 'half-open';
  const abort = new AbortController();
  const abortProbeEntered = new Promise(resolve => { entered = resolve; });
  const abortedProbe = run(false, abort.signal);
  await abortProbeEntered;
  abort.abort();
  release();
  assert.equal((await abortedProbe).status, 499);
  phase = 'ok';
  assert.equal((await run()).headers.get('x-ewg-upstream'), 'kilo:beam', 'cancelled probe must not lock or penalize the upstream');
  // A request from the healthy period can fail while a newer probe is in flight.
  const held = [];
  globalThis.fetch = async (_url, init) => {
    if (JSON.parse(init.body).model !== dots) return Response.json({ choices: [{ message: { content: 'ok' } }] });
    return new Promise(resolve => held.push(resolve));
  };
  async function waitHeld(count) {
    for (let i = 0; i < 40 && held.length < count; i++) await new Promise(resolve => setImmediate(resolve));
    assert.equal(held.length, count);
  }
  const slow = run();
  const firstFailure = run();
  await waitHeld(2);
  held[1](new Response(null, {status:429, headers:{'Retry-After':'1'}}));
  await firstFailure;
  now += 1000;
  const halfOpen = run();
  await waitHeld(3);
  held[0](new Response(null, {status:429, headers:{'Retry-After':'1'}}));
  await slow;
  held[2](Response.json({ choices: [{ message: { content: 'ok' } }] }));
  await halfOpen;
  now += 1000;
  globalThis.fetch = async () => Response.json({ choices: [{ message: { content: 'ok' } }] });
  assert.equal((await run()).headers.get('x-ewg-upstream'), 'kilo:beam', 'late failure must not leave half-open locked');
  console.log('PASS cooldown, mode isolation, half-open recovery, cancellation and fast 503');
} finally { globalThis.fetch = realFetch; Date.now = realNow; }
