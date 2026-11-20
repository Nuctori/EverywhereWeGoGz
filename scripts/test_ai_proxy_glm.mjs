import assert from 'node:assert/strict';
import worker from '../cloudflare/ai-proxy/ai-worker/worker.ts';
const env = { BIGMODEL_API_KEY: 'test' };
const run = stream => worker.fetch(new Request('https://ai.114124.xyz/v1/chat/completions', {
  method:'POST', headers:{Origin:'https://nuctori.github.io'}, body:JSON.stringify({stream,messages:[{role:'user',content:'test'}]}),
}), env);
const saved = globalThis.fetch;
const set = globalThis.setTimeout;
try {
  let calls = 0;
  globalThis.fetch = async () => ++calls === 1
    ? Response.json({error:{code:'1305'}}, {status:429})
    : Response.json({choices:[{message:{content:'ok'}}]});
  assert.equal((await run(false)).status, 200, 'transient GLM overload recovers in the same request');
  assert.equal(calls, 2);
  let requested = 0;
  globalThis.setTimeout = (fn, ms, ...args) => set(fn, ms === 8000 ? 100 : ms, ...args);
  const encoder = new TextEncoder();
  globalThis.fetch = async () => {
    requested++;
    return new Response(new ReadableStream({ start(c) {
      c.enqueue(encoder.encode('data: {"choices":[{"delta":{"reasoning_content":"thinking"}}]}\n\n'));
      set(() => { try { c.enqueue(encoder.encode('data: {"choices":[{"delta":{"reasoning_content":"more thinking"}}]}\n\n')); } catch {} }, 60);
      set(() => { try { c.enqueue(encoder.encode('data: {"choices":[{"delta":{"content":"ok"}}]}\n\ndata: [DONE]\n\n')); c.close(); } catch {} }, 120);
    }}), {headers:{'Content-Type':'text/event-stream'}});
  };
  const sse = await run(true);
  assert.equal(sse.status, 200);
  assert.match(await sse.text(), /\[DONE\]/);
  assert.equal(requested, 1);
  console.log('PASS GLM transient overload retry and progressing slow SSE');
} finally {globalThis.fetch = saved; globalThis.setTimeout = set;}
