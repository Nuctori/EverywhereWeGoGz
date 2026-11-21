import assert from 'node:assert/strict';
import worker from '../cloudflare/ai-proxy/ai-worker/worker.ts';
const saved = globalThis.fetch;
const good = 'data: {"choices":[{"delta":{"content":"正文"}}]}\n\ndata: [DONE]\n\n';
const req = (stream) => new Request('https://ai.114124.xyz/v1/chat/completions', {method:'POST', headers:{Origin:'https://nuctori.github.io'},body:JSON.stringify({stream,messages:[{role:'user',content:'测试'}]})});
const call = (stream) => worker.fetch(req(stream),{ENABLE_KILO_FREE:'1',SILICONFLOW_API_KEY:'test-key'});
const seen=[];
try {
 globalThis.fetch = async (_url, init) => { const {model}=JSON.parse(init.body); seen.push(model); return new Response(model.includes('beam')?'data: [DONE]\n\n':good,{headers:{'Content-Type':'text/event-stream'}}); };
 assert.equal(await (await call(true)).text(),good);
 assert.equal(await (await call(true)).text(),good);
 assert.equal(seen.filter(m=>m.includes('beam')).length,1);
 seen.length=0;
 globalThis.fetch = async (_url, init) => { const {model,stream}=JSON.parse(init.body); seen.push(model); return model.includes('beam')?Response.json({error:{message:'Rate limit exceeded for free models'}},{status:429,headers:{'Retry-After':'60'}}):stream?new Response(good,{headers:{'Content-Type':'text/event-stream'}}):Response.json({choices:[{message:{content:'ok'}}]}); };
 assert.equal((await call(false)).headers.get('x-ewg-upstream'),'siliconflow');
 assert.equal((await call(true)).headers.get('x-ewg-upstream'),'siliconflow');
 assert.deepEqual(seen,['reflection/beam-free','Qwen/Qwen3.5-4B','Qwen/Qwen3.5-4B']);
 console.log('PASS empty SSE fallback and shared Kilo rate-limit cooldown');
 const keyed = { BIGMODEL_API_KEY:'glm-only', ENABLE_KILO_FREE:'1', SILICONFLOW_API_KEY:'qwen-only', OPENROUTER_API_KEY:'router-only' };
 const hops = [];
 const models = [];
 globalThis.fetch = async (url, init) => {
   const host = new URL(url).hostname;
   const auth = new Headers(init.headers).get('authorization');
   hops.push([host, auth]);
   models.push([host, JSON.parse(init.body).model]);
   if (host === 'api.siliconflow.cn') return Response.json({choices:[]}); // HTTP 200, no usable JSON content
   if (host === 'openrouter.ai') return Response.json({choices:[{message:{content:'ok'}}]});
   return new Response(null,{status:503});
 };
 assert.equal((await worker.fetch(req(false),keyed)).headers.get('x-ewg-upstream'),'openrouter');
 assert.deepEqual(hops,[['open.bigmodel.cn','Bearer glm-only'],['api.siliconflow.cn','Bearer qwen-only'],['openrouter.ai','Bearer router-only']]);
 // The :free id must be one OpenRouter still serves; poolside/laguna-xs-2.1:free was delisted.
 const openrouterModel = models.find(([host]) => host === 'openrouter.ai')?.[1];
 assert.equal(openrouterModel, 'google/gemma-4-26b-a4b-it:free');
 assert.ok(openrouterModel.endsWith(':free'), 'OpenRouter lane must stay on a zero-priced id');
 let streamCalls = 0, streamController;
 const firstFrame = 'data: {"choices":[{"delta":{"content":"正文"}}]}\n\n';
 globalThis.fetch = async () => {
   streamCalls++;
   return new Response(new ReadableStream({start(c){streamController=c;c.enqueue(new TextEncoder().encode(firstFrame));}}),{headers:{'Content-Type':'text/event-stream'}});
 };
 const forwarded = await worker.fetch(req(true),keyed);
 const reader = forwarded.body.getReader();
 assert.equal(new TextDecoder().decode((await reader.read()).value),firstFrame);
 streamController.error(new Error('upstream disconnected'));
 await assert.rejects(reader.read(),/upstream disconnected/);
 assert.equal(streamCalls,1);
 console.log('PASS keyed fallback, invalid JSON fallback, credential isolation and no midstream splice');
} finally {globalThis.fetch=saved;}
