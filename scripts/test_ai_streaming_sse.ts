// AI 流式链路契约测试：SSE 增量解析器纯函数 + callAiApi 思维链供应商流式分支。
// 覆盖：跨 chunk 半行缓冲、CRLF、keep-alive 注释、坏 JSON 行跳过、[DONE]、
// usage 采集、流式→非流式同一解析口径、供应商忽略 stream 参数时的整包回退、
// search-plan schema 流式解析、思维链吃满 max_tokens 后的升压重试。
// 运行：npm run test:ai-streaming
import { strict as assert } from 'node:assert';
import {
  __aiRecommendationTestHooks,
} from '../src/lib/ai-recommendation.ts';

const { createAiSseStreamParser, callAiApi } = __aiRecommendationTestHooks;

const encoder = new TextEncoder();
function sseFrame(payload: string) {
  return encoder.encode(`data: ${payload}\n\n`);
}

// ====== 1. 增量解析器：3 字符一小块喂入，跨 chunk 半行必须缓冲拼装 ======
{
  const body = [
    ': keep-alive',
    'data: {"choices":[{"delta":{"reasoning_content":"先看"}}]}',
    'data: {"choices":[{"delta":{"reasoning_content":"目的地"}}]}',
    'data: {"choices":[{"delta":{"content":"{\\"items\\":"}}]}',
    'data: {broken json line',
    'data: {"choices":[{"delta":{},"finish_reason":null}],"usage":{"prompt_tokens":10,"completion_tokens":5,"total_tokens":15}}',
    'data: [DONE]',
    '',
  ].join('\n');

  const parser = createAiSseStreamParser();
  const collected: Array<{ type: string; text?: string; message?: string }> = [];
  for (let index = 0; index < body.length; index += 3) {
    for (const event of parser.push(body.slice(index, index + 3))) {
      collected.push(event as { type: string; text?: string; message?: string });
    }
  }

  assert.deepEqual(
    collected.map((event) => event.type),
    ['reasoning', 'reasoning', 'content', 'usage', 'done'],
    'SSE parser should skip comments/malformed lines and surface reasoning/content/usage/done in order',
  );
  assert.equal(collected[0].text, '先看');
  assert.equal(collected[1].text, '目的地');
  assert.equal(collected[2].text, '{"items":');
  assert.ok(parser.isDone(), 'parser should be done after [DONE]');
}
console.info('[1/9] SSE 增量解析器（跨 chunk 缓冲 / 注释 / 坏行 / DONE）通过');

// ====== 2. CRLF 行尾 + done 后继续 push 必须为空 ======
{
  const parser = createAiSseStreamParser();
  const events = parser.push('data: {"choices":[{"delta":{"content":"ok"}}]}\r\ndata: [DONE]\r\n');
  assert.deepEqual(events.map((event) => event.type), ['content', 'done'], 'CRLF line endings should parse');
  assert.deepEqual(parser.push('data: {"choices":[{"delta":{"content":"late"}}]}\n'), [], 'push after done must be a no-op');
}
console.info('[2/9] CRLF 行尾与 DONE 幂等通过');

// ====== 3. callAiApi 思维链供应商流式分支（mock fetch SSE） ======
{
  const streamBody = [
    sseFrame('{"choices":[{"delta":{"reasoning_content":"思考A"}}]}'),
    sseFrame('{"choices":[{"delta":{"reasoning_content":"思考B"}}]}'),
    sseFrame('{"choices":[{"delta":{"content":"{\\"summary\\":\\"测试摘要\\",\\"items\\":"}}]}'),
    sseFrame('{"choices":[{"delta":{"content":"[\\"占位\\"]}"}}]}'),
    sseFrame('{"choices":[{"delta":{}}],"usage":{"prompt_tokens":120,"completion_tokens":80,"completion_tokens_details":{"reasoning_tokens":40},"total_tokens":200}}'),
    sseFrame('[DONE]'),
  ];
  let capturedRequestBody: Record<string, unknown> | null = null;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (_input: unknown, init?: { body?: string }) => {
    capturedRequestBody = JSON.parse(init?.body ?? '{}') as Record<string, unknown>;
    let frameCursor = 0;
    const stream = new ReadableStream<Uint8Array>({
      pull(controller) {
        if (frameCursor < streamBody.length) {
          controller.enqueue(streamBody[frameCursor]);
          frameCursor += 1;
        } else {
          controller.close();
        }
      },
    });
    return new Response(stream, { status: 200, headers: { 'content-type': 'text/event-stream' } });
  }) as typeof fetch;

  try {
    const deltas: Array<{ reasoning: string; content: string }> = [];
    const result = await callAiApi({
      configs: [{ baseUrl: 'https://api.z.ai/api/paas/v4', model: 'GLM-4.7-Flash', apiKey: 'test-key' }],
      messages: [{ role: 'system', content: 's' }, { role: 'user', content: 'q' }],
      maxTokens: 512,
      schema: 'recommendation',
      onStreamDelta: (delta) => deltas.push({ reasoning: delta.reasoningDelta, content: delta.contentDelta }),
    });

    assert.equal(capturedRequestBody?.stream, true, 'thinking provider request must ask for SSE streaming');
    assert.deepEqual(capturedRequestBody?.stream_options, { include_usage: true }, 'streaming must request trailing usage');
    assert.deepEqual(capturedRequestBody?.thinking, { type: 'enabled' });
    assert.deepEqual(
      deltas.map((delta) => delta.reasoning).join(''),
      '思考A思考B',
      'reasoning deltas must stream through onStreamDelta in order',
    );
    assert.ok(deltas.some((delta) => delta.content.length > 0), 'content deltas must also stream');
    assert.equal(result.reasoningText, '思考A思考B', 'accumulated reasoning must reach the non-stream result shape');
    const items = (result.parsed as { items?: unknown[] }).items;
    assert.deepEqual(items, ['占位'], 'accumulated content must parse through the shared recommendation schema');
    const usage = (result as { usage?: { tokensSeen?: boolean; reasoningTokens?: number } }).usage;
    assert.equal(usage?.tokensSeen, true, 'trailing usage chunk must feed the usage summary');
    assert.equal(usage?.reasoningTokens, 40, 'reasoning token count must survive the streaming path');
    console.info('[3/9] callAiApi 流式分支（SSE→增量回调→同口径解析）通过');
  } finally {
    globalThis.fetch = originalFetch;
  }
}

// ====== 4. 供应商忽略 stream 参数：整包 JSON 回退路径仍可用 ======
{
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () =>
    new Response(
      JSON.stringify({
        choices: [{
          message: {
            content: '{"summary":"整包摘要","items":[{"tourId":"t2","score":80,"reason":"整包","matchedSignals":[]}]}',
            reasoning_content: '整包思维链',
          },
        }],
        usage: { prompt_tokens: 1, completion_tokens: 2, total_tokens: 3 },
      }),
      { status: 200, headers: { 'content-type': 'application/json' } },
    )) as typeof fetch;

  try {
    const deltas: unknown[] = [];
    const result = await callAiApi({
      configs: [{ baseUrl: 'https://api.z.ai/api/paas/v4', model: 'GLM-4.7-Flash', apiKey: 'test-key' }],
      messages: [{ role: 'user', content: 'q' }],
      maxTokens: 512,
      schema: 'recommendation',
      onStreamDelta: (delta) => deltas.push(delta),
    });
    const items = (result.parsed as { items?: Array<{ tourId?: string }> }).items;
    assert.equal(items?.[0]?.tourId, 't2', 'full-json fallback must parse when provider ignores stream');
    assert.equal(result.reasoningText, '整包思维链');
    assert.equal(deltas.length, 0, 'no delta callbacks on the full-json fallback path');
    console.info('[4/9] 供应商忽略 stream 参数的整包回退通过');
  } finally {
    globalThis.fetch = originalFetch;
  }
}

// ====== 5. search-plan schema 走流式：queries 校验复用同一解析口径 ======
{
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () => {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(sseFrame('{"choices":[{"delta":{"reasoning_content":"规划中"}}]}'));
        controller.enqueue(sseFrame('{"choices":[{"delta":{"content":"{\\"queries\\":[\\"海边 一日\\",\\"温泉 周末\\"]}"}}]}'));
        controller.enqueue(sseFrame('[DONE]'));
        controller.close();
      },
    });
    return new Response(stream, { status: 200, headers: { 'content-type': 'text/event-stream' } });
  }) as typeof fetch;

  try {
    const result = await callAiApi({
      configs: [{ baseUrl: 'https://api.z.ai/api/paas/v4', model: 'GLM-4.7-Flash', apiKey: 'test-key' }],
      messages: [{ role: 'user', content: 'q' }],
      maxTokens: 512,
      schema: 'search-plan',
    });
    const queries = (result.parsed as { queries?: string[] }).queries;
    assert.deepEqual(queries, ['海边 一日', '温泉 周末'], 'search-plan schema must validate on the streaming path');
    assert.equal(result.reasoningText, '规划中');
    console.info('[5/9] search-plan schema 流式解析通过');
  } finally {
    globalThis.fetch = originalFetch;
  }
}

// ====== 6. 思维链吃满 max_tokens（tokens_seen/content_missing）：首次按新地板
// 发请求，重试必须升压 max_tokens 而不是同参复现必败 ======
{
  const starvedBody = [
    sseFrame('{"choices":[{"delta":{"reasoning_content":"一直思考"}}]}'),
    sseFrame('{"choices":[{"delta":{}}],"usage":{"prompt_tokens":300,"completion_tokens":16384,"completion_tokens_details":{"reasoning_tokens":16300},"total_tokens":16684}}'),
    sseFrame('[DONE]'),
  ];
  const healthyBody = [
    sseFrame('{"choices":[{"delta":{"content":"{\\"summary\\":\\"升压后成功\\",\\"items\\":[\\"恢复\\"]}"}}]}'),
    sseFrame('{"choices":[{"delta":{}}],"usage":{"prompt_tokens":300,"completion_tokens":900,"completion_tokens_details":{"reasoning_tokens":600},"total_tokens":1200}}'),
    sseFrame('[DONE]'),
  ];
  const requestBodies: Array<Record<string, unknown>> = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (_input: unknown, init?: { body?: string }) => {
    requestBodies.push(JSON.parse(init?.body ?? '{}') as Record<string, unknown>);
    const frames = requestBodies.length === 1 ? starvedBody : healthyBody;
    let frameCursor = 0;
    const stream = new ReadableStream<Uint8Array>({
      pull(controller) {
        if (frameCursor < frames.length) {
          controller.enqueue(frames[frameCursor]);
          frameCursor += 1;
        } else {
          controller.close();
        }
      },
    });
    return new Response(stream, { status: 200, headers: { 'content-type': 'text/event-stream' } });
  }) as typeof fetch;

  try {
    const result = await callAiApi({
      configs: [{ baseUrl: 'https://ai.114124.xyz/v1', model: 'GLM-4.7-Flash', apiKey: 'test-key' }],
      messages: [{ role: 'user', content: 'q' }],
      maxTokens: 3600,
      schema: 'recommendation',
    });
    assert.equal(requestBodies.length, 2, 'starved first attempt must escalate and retry once');
    assert.equal(
      requestBodies[0]?.max_tokens,
      16384,
      'thinking request must lift max_tokens to the starvation-safe floor regardless of caller budget',
    );
    assert.equal(
      requestBodies[1]?.max_tokens,
      32768,
      'retry after tokens_seen starvation must double max_tokens up to the ceiling',
    );
    const items = (result.parsed as { items?: unknown[] }).items;
    assert.deepEqual(items, ['恢复'], 'escalated retry must still parse through the shared schema');
    console.info('[6/9] 思维链吃满预算→升压 max_tokens 重试通过');
  } finally {
    globalThis.fetch = originalFetch;
  }
}

// ====== 7. content-type 不可信：OpenRouter 的 SSE 不带 Content-Type 头。
// 响应体是 SSE 就按流消费；是整包 JSON（无 content-type 变体）也要能回退解析，
// 两条路都不允许炸出裸 SyntaxError。 ======
{
  const makeStream = (frames: string[]) => {
    let frameCursor = 0;
    return new ReadableStream<Uint8Array>({
      pull(controller) {
        if (frameCursor < frames.length) {
          controller.enqueue(encoder.encode(frames[frameCursor]));
          frameCursor += 1;
        } else {
          controller.close();
        }
      },
    });
  };

  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () =>
    // 注意：不给 content-type（headers 里只有无关字段）。
    new Response(makeStream([
      'data: {"choices":[{"delta":{"reasoning_content":"无头思考"}}]}\n\n',
      'data: {"choices":[{"delta":{"content":"{\\"summary\\":\\"无头SSE\\",\\"items\\":[\\"嗅探\\"]}"}}]}\n\n',
      'data: [DONE]\n\n',
    ]), { status: 200, headers: { 'x-unrelated': '1' } })) as typeof fetch;

  try {
    const result = await callAiApi({
      // OpenRouter 藏在 Worker 反代后面，客户端视角是 thinking 端点（走 SSE 路径）。
      configs: [{ baseUrl: 'https://ai.114124.xyz/v1', model: 'free-model', apiKey: 'test-key' }],
      messages: [{ role: 'user', content: 'q' }],
      maxTokens: 512,
      schema: 'recommendation',
    });
    const items = (result.parsed as { items?: unknown[] }).items;
    assert.deepEqual(items, ['嗅探'], 'SSE body without content-type must be consumed as a stream');
    assert.equal(result.reasoningText, '无头思考', 'reasoning must survive the sniff path');
    console.info('[7/9] 缺 content-type 的 SSE 嗅探通过');
  } finally {
    globalThis.fetch = originalFetch;
  }
}

{
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () =>
    new Response(
      JSON.stringify({
        choices: [{ message: { content: '{"summary":"无头整包","items":[{"tourId":"t9","score":70,"reason":"整包","matchedSignals":[]}]}' } }],
        usage: { prompt_tokens: 1, completion_tokens: 2, total_tokens: 3 },
      }),
      // 整包 JSON 但没带 content-type：嗅探后退回整包解析，不能炸裸 SyntaxError。
      { status: 200, headers: {} },
    )) as typeof fetch;

  try {
    const result = await callAiApi({
      configs: [{ baseUrl: 'https://example.gateway/v1', model: 'gateway-model', apiKey: 'test-key' }],
      messages: [{ role: 'user', content: 'q' }],
      maxTokens: 512,
      schema: 'recommendation',
    });
    const items = (result.parsed as { items?: Array<{ tourId?: string }> }).items;
    assert.equal(items?.[0]?.tourId, 't9', 'whole-json body without content-type must fall back to json parsing');
    console.info('[8/9] 缺 content-type 的整包 JSON 回退通过');
  } finally {
    globalThis.fetch = originalFetch;
  }
}

// ====== 9. 网关 502（all upstreams failed）：429/5xx 必须退避重试一次，
// 第二次成功要能正常返回，不能一次性判死落本地补位。 ======
{
  const originalFetch = globalThis.fetch;
  let callCount = 0;
  globalThis.fetch = (async () => {
    callCount += 1;
    if (callCount === 1) {
      return new Response(
        JSON.stringify({ error: { message: 'all upstreams failed: bigmodel: 429 ... | openrouter#1: 429 ...' } }),
        { status: 502, headers: { 'content-type': 'application/json' } },
      );
    }
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(sseFrame('{"choices":[{"delta":{"content":"{\\"summary\\":\\"重试成功\\",\\"items\\":[\\"复活\\"]}"}}]}'));
        controller.enqueue(sseFrame('[DONE]'));
        controller.close();
      },
    });
    return new Response(stream, { status: 200, headers: { 'content-type': 'text/event-stream' } });
  }) as typeof fetch;

  try {
    const result = await callAiApi({
      configs: [{ baseUrl: 'https://ai.114124.xyz/v1', model: 'GLM-4.7-Flash', apiKey: 'test-key' }],
      messages: [{ role: 'user', content: 'q' }],
      maxTokens: 512,
      schema: 'recommendation',
    });
    assert.equal(callCount, 2, 'a 502 from the gateway must be retried once before giving up');
    const items = (result.parsed as { items?: unknown[] }).items;
    assert.deepEqual(items, ['复活'], 'the retried attempt must parse through the shared schema');
    console.info('[9/9] 网关 502 退避重试通过');
  } finally {
    globalThis.fetch = originalFetch;
  }
}

console.info('AI streaming contract tests passed');
