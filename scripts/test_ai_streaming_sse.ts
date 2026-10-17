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
console.info('[1/11] SSE 增量解析器（跨 chunk 缓冲 / 注释 / 坏行 / DONE）通过');

// ====== 2. CRLF 行尾 + done 后继续 push 必须为空 ======
{
  const parser = createAiSseStreamParser();
  const events = parser.push('data: {"choices":[{"delta":{"content":"ok"}}]}\r\ndata: [DONE]\r\n');
  assert.deepEqual(events.map((event) => event.type), ['content', 'done'], 'CRLF line endings should parse');
  assert.deepEqual(parser.push('data: {"choices":[{"delta":{"content":"late"}}]}\n'), [], 'push after done must be a no-op');
}
console.info('[2/11] CRLF 行尾与 DONE 幂等通过');

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

    assert.equal(capturedRequestBody?.stream, true, 'GLM primary request must ask for SSE streaming');
    assert.deepEqual(capturedRequestBody?.stream_options, { include_usage: true }, 'streaming must request trailing usage');
    // 2026-10-14 起 GLM 思维链强制关闭：开 thinking 会在结构化大任务上死循环
    // 吃满输出预算，正文归零直接降级本地补位。
    assert.deepEqual(capturedRequestBody?.thinking, { type: 'disabled' });
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
    console.info('[3/11] callAiApi 流式分支（SSE→增量回调→同口径解析）通过');
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
    console.info('[4/11] 供应商忽略 stream 参数的整包回退通过');
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
    console.info('[5/11] search-plan schema 流式解析通过');
  } finally {
    globalThis.fetch = originalFetch;
  }
}

// ====== 6. 输出吃满 max_tokens（tokens_seen/content_missing）：首次按调用方
// 预算发请求（思维链已关，不再抬 16k 地板），重试必须升压 max_tokens 而不是
// 同参复现必败 ======
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
      3600,
      'request must use the caller budget verbatim now that thinking is force-disabled',
    );
    assert.equal(
      requestBodies[1]?.max_tokens,
      32768,
      'retry after tokens_seen starvation must escalate max_tokens up to the ceiling',
    );
    const items = (result.parsed as { items?: unknown[] }).items;
    assert.deepEqual(items, ['恢复'], 'escalated retry must still parse through the shared schema');
    console.info('[6/11] 输出吃满预算→升压 max_tokens 重试通过');
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
    console.info('[7/11] 缺 content-type 的 SSE 嗅探通过');
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
    console.info('[8/11] 缺 content-type 的整包 JSON 回退通过');
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
    console.info('[9/11] 网关 502 退避重试通过');
  } finally {
    globalThis.fetch = originalFetch;
  }
}

// ====== 10. 半截正文 + finish_reason=length：必须落进 tokens_seen 口径并
// 升压重试（3600 → 32768），而不是报 json_parse_failed 直接降级本地补位。
// 现场：GLM-4.7-Flash 正文在 items 中间被输出预算掐断；原实现只在正文完全
// 为空时才认 tokens_seen，且升压条件 attempt===0 让第二次重发同一份预算。 ======
{
  const truncatedBody = [
    sseFrame('{"choices":[{"delta":{"content":"{\\"intentNotes\\":{\\"w\\":\\"先看预算\\"},\\"items\\":[{\\"tourId\\":\\"t1\\",\\"sf\\":"}}]}'),
    sseFrame('{"choices":[{"delta":{},"finish_reason":"length"}],"usage":{"prompt_tokens":900,"completion_tokens":3600,"total_tokens":4500}}'),
    sseFrame('[DONE]'),
  ];
  const healthyBody = [
    sseFrame('{"choices":[{"delta":{"content":"{\\"items\\":[\\"恢复\\"]}"}}]}'),
    sseFrame('{"choices":[{"delta":{},"finish_reason":"stop"}]}'),
    sseFrame('[DONE]'),
  ];
  const requestBodies: Array<Record<string, unknown>> = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (_input: unknown, init?: { body?: string }) => {
    requestBodies.push(JSON.parse(init?.body ?? '{}') as Record<string, unknown>);
    const frames = requestBodies.length === 1 ? truncatedBody : healthyBody;
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
    assert.equal(requestBodies.length, 2, 'truncated (finish_reason=length) response must be retried');
    assert.equal(requestBodies[1]?.max_tokens, 32768, 'retry must escalate the output budget');
    assert.deepEqual((result.parsed as { items?: unknown[] }).items, ['恢复']);
    console.info('[10/11] 半截正文 finish_reason=length → tokens_seen 升压重试通过');
  } finally {
    globalThis.fetch = originalFetch;
  }
}

// ====== 11. 坏 JSON 的错误证据与修复：结构坏了也必须给出解析器原文、正文长度、
// 尾部残片与 finish_reason，不能只剩一句 "AI response is not JSON"；字符串内
// 裸换行这种常见走样应就地修复后走通解析。 ======
{
  const makeStreamResponse = (frames: string[]) => {
    let frameCursor = 0;
    const stream = new ReadableStream<Uint8Array>({
      pull(controller) {
        if (frameCursor < frames.length) {
          controller.enqueue(encoder.encode(frames[frameCursor]));
          frameCursor += 1;
        } else {
          controller.close();
        }
      },
    });
    return new Response(stream, { status: 200, headers: { 'content-type': 'text/event-stream' } });
  };

  const originalFetch = globalThis.fetch;
  try {
    // 11a：真结构错误（items 不是数组）。
    globalThis.fetch = (async () => makeStreamResponse([
      'data: {"choices":[{"delta":{"content":"{\\"items\\": \\"oops\\"}"}}]}\n\n',
      'data: {"choices":[{"delta":{},"finish_reason":"stop"}]}\n\n',
      'data: [DONE]\n\n',
    ])) as typeof fetch;
    let message = '';
    try {
      await callAiApi({
        configs: [{ baseUrl: 'https://ai.114124.xyz/v1', model: 'GLM-4.7-Flash', apiKey: 'test-key' }],
        messages: [{ role: 'user', content: 'q' }],
        maxTokens: 3600,
        schema: 'recommendation',
      });
    } catch (error) {
      message = error instanceof Error ? error.message : String(error);
    }
    assert.ok(message.includes('schema_invalid'), `expected schema_invalid, got: ${message}`);
    assert.ok(message.includes('items missing'), 'schema failure must name the missing field');

    // 11b：字符串内裸换行 —— 应被修复并解析成功。
    globalThis.fetch = (async () => makeStreamResponse([
      'data: {"choices":[{"delta":{"content":"{\\"items\\":[\\"a\\nb\\"]}"}}]}\n\n',
      'data: {"choices":[{"delta":{},"finish_reason":"stop"}]}\n\n',
      'data: [DONE]\n\n',
    ])) as typeof fetch;
    const repaired = await callAiApi({
      configs: [{ baseUrl: 'https://ai.114124.xyz/v1', model: 'GLM-4.7-Flash', apiKey: 'test-key' }],
      messages: [{ role: 'user', content: 'q' }],
      maxTokens: 3600,
      schema: 'recommendation',
    });
    assert.deepEqual(
      (repaired.parsed as { items?: unknown[] }).items,
      ['a\nb'],
      'bare newline inside a JSON string must be repaired, not fatal',
    );

    // 11c：半截 JSON 且 finish_reason=stop（结构真的坏了）：错误串必须带证据。
    globalThis.fetch = (async () => makeStreamResponse([
      'data: {"choices":[{"delta":{"content":"{\\"items\\":[{\\"tourId\\":\\"t1\\","}}]}\n\n',
      'data: {"choices":[{"delta":{},"finish_reason":"stop"}]}\n\n',
      'data: [DONE]\n\n',
    ])) as typeof fetch;
    message = '';
    try {
      await callAiApi({
        configs: [{ baseUrl: 'https://api.z.ai/api/paas/v4', model: 'GLM-4.7-Flash', apiKey: 'test-key' }],
        messages: [{ role: 'user', content: 'q' }],
        maxTokens: 3600,
        schema: 'recommendation',
      });
    } catch (error) {
      message = error instanceof Error ? error.message : String(error);
    }
    assert.ok(message.includes('json_parse_failed'), `expected json_parse_failed, got: ${message}`);
    assert.ok(message.includes('chars='), 'parse failure must report the content length');
    assert.ok(message.includes('tail='), 'parse failure must report the tail fragment');
    assert.ok(message.includes('finish_reason=stop'), 'parse failure must report finish_reason');
    console.info('[11/11] 坏 JSON 错误证据与裸换行修复通过');
  } finally {
    globalThis.fetch = originalFetch;
  }
}

console.info('AI streaming contract tests passed');
