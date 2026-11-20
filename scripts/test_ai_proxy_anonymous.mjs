import assert from 'node:assert/strict';
import worker from '../cloudflare/ai-proxy/ai-worker/worker.ts';
const original = globalThis.fetch;
const calls = [];
const model = 'test/community-model';
const env = { ENABLE_POLLINATIONS_CLASSIC: '1', AI_HORDE_JSON_MODEL: model, AI_HORDE_SSE_MODEL: model };
const run = (vars, stream = false, max_tokens = 128) => worker.fetch(new Request('https://ai.114124.xyz/v1/chat/completions', {
  method: 'POST', headers: { Origin: 'https://nuctori.github.io', Authorization: 'Bearer browser-only' },
  body: JSON.stringify({ stream, max_tokens, model:'ignored', messages: [{ role:'user', content:'测试' }] }),
}), vars);
try {
  globalThis.fetch = async (url, init) => {
    const body = JSON.parse(init.body);
    calls.push([new URL(url).hostname, body]);
    assert.equal(new Headers(init.headers).has('Authorization'), false);
    assert.equal(init.redirect, 'manual');
    if (url === 'https://text.pollinations.ai/openai') return new Response('', {status:402, headers:{'Retry-After':'45'}});
    assert.equal(url, 'https://oai.aihorde.net/v1/chat/completions');
    assert.equal(body.model, model);
    assert.equal(body.horde.availability_mode,'fail_fast');
    return body.stream ? new Response('data: {"choices":[{"delta":{"content":"ok"}}]}\n\ndata: [DONE]\n\n',{headers:{'Content-Type':'text/event-stream'}}) : Response.json({choices:[{message:{content:'ok'}}]});
  };
  assert.equal((await run({})).status,502);
  assert.equal(calls.length,0);
  assert.equal((await run(env)).headers.get('X-EWG-Upstream'),'aihorde');
  assert.equal((await run(env)).headers.get('X-EWG-Upstream'),'aihorde');
  assert.equal((await run(env,true)).headers.get('X-EWG-Upstream'),'aihorde');
  assert.deepEqual(calls.map(([host])=>host),['text.pollinations.ai','oai.aihorde.net','oai.aihorde.net','oai.aihorde.net']);
  assert.equal(calls[0][1].model,'openai');
  calls.length=0;
  assert.equal((await run({ ENABLE_POLLINATIONS_CLASSIC:'1' },false,1800)).status,502);
  assert.equal((await run({ AI_HORDE_JSON_MODEL:model },true)).status,502);
  assert.equal(calls.length,0);
  globalThis.fetch = async (url, init) => {
    assert.equal(new URL(url).hostname,'open.bigmodel.cn');
    assert.equal(new Headers(init.headers).get('Authorization'),'Bearer glm');
    return Response.json({choices:[{message:{content:'ok'}}]});
  };
  assert.equal((await run({...env,BIGMODEL_API_KEY:'glm'})).headers.get('X-EWG-Upstream'),'bigmodel');
  console.log('PASS anonymous opt-in, short JSON gate, 402 cooldown, Horde fail-fast and independent stream opt-in');
} finally {globalThis.fetch=original;}
