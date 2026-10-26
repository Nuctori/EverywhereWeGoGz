// AI 流式链路契约测试：SSE 增量解析器纯函数 + callAiApi 思维链供应商流式分支。
// 覆盖：跨 chunk 半行缓冲、CRLF、keep-alive 注释、坏 JSON 行跳过、[DONE]、
// usage 采集、流式→非流式同一解析口径、供应商忽略 stream 参数时的整包回退、
// search-plan schema 流式解析、思维链吃满 max_tokens 后的升压重试。
// 运行：npm run test:ai-streaming
import { strict as assert } from 'node:assert';
import {
  __aiRecommendationTestHooks,
} from '../src/lib/ai-recommendation.ts';

const { createAiSseStreamParser, callAiApi, describeAiItemsShapeIssue, requestAiFormatCorrection, salvageAiItemsFromResponse, validateAiItems } = __aiRecommendationTestHooks;

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

// ====== 12. 现场回归：items 回成【位置数组】且正文在数组中途被掐断 ======
// GLM-4.7-Flash 真实响应（22755 字符）尾部是 `..."广东 2天 温泉泡汤",["2026-10`：
// 元素不是 schema 要求的 {tourId,...} 对象，而是 [标题,目的地,天数,价格,...] 位置数组。
// 原恢复逻辑只认 {} 对象，一条都救不回来 → 整轮降级到本地补位。
// 现在要求：完好的位置数组元素必须被救回，不能因为半截就丢掉全部。
{
  const originalFetch = globalThis.fetch;
  const makeSseResponse = (frames: string[]) => {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        for (const frame of frames) controller.enqueue(new TextEncoder().encode(frame));
        controller.close();
      },
    });
    return new Response(stream, { status: 200, headers: { 'content-type': 'text/event-stream' } });
  };
  const positionalItems = Array.from({ length: 25 }, (_, index) => [
    `喜运来温泉2天(${index}号楼)`, '广东', 2, 189, '海岛度假', '假日通', 'easy', 1,
    '广东 2天 温泉泡汤', ['2026-10-01', '2026-10-02'], `天然温泉池，第 ${index} 条`,
  ]);
  let body = '';
  for (const item of positionalItems) body = `${body}${body ? ',' : ''}${JSON.stringify(item)}`;
  const cut = body.lastIndexOf('"2026-10-01"');
  const truncatedContent = `{"items":[${body.slice(0, cut)}"2026-10`;

  const frames = [
    `data: ${JSON.stringify({ choices: [{ delta: { content: truncatedContent } }] })}\n\n`,
    // 现场就是不老实报 stop 的
    'data: {"choices":[{"delta":{},"finish_reason":"stop"}],"usage":{"completion_tokens":9000}}\n\n',
    'data: [DONE]\n\n',
  ];
  let callCount = 0;
  globalThis.fetch = (async () => {
    callCount += 1;
    return makeSseResponse(frames);
  }) as typeof fetch;

  try {
    const result = await callAiApi({
      configs: [{ baseUrl: 'https://ai.114124.xyz/v1', model: 'GLM-4.7-Flash', apiKey: 'test-key' }],
      messages: [{ role: 'user', content: 'q' }],
      maxTokens: 3600,
      schema: 'recommendation',
    });
    const items = (result.parsed as { items?: unknown[] }).items ?? [];
    assert.ok(
      items.length >= 20,
      `truncated positional-array items must be recovered, got ${items.length} (was 0 before the fix)`,
    );
    assert.ok(Array.isArray(items[0]), 'recovered elements keep their original positional-array shape');
    // 救回完整内容后不该再多跑一轮模型（那要再等几十秒）
    assert.equal(callCount, 1, 'a recoverable body must not trigger a redundant retry');
    console.info(`[12/13] 位置数组半截正文恢复通过（救回 ${items.length}/25 条）`);
  } finally {
    globalThis.fetch = originalFetch;
  }
}

// ====== 13. 截断判定的边界：不能把"结构坏了"也当成"被预算掐断" ======
// 升压重试对"模型回了废话"是无效的（同参必败），却要多等两轮生成。
// 只有确实像 JSON 又没写完的正文才算截断。
{
  const originalFetch = globalThis.fetch;
  const sse = (payload: string) => `data: ${payload}\n\n`;
  const driveWith = (content: string) => {
    const frames = [
      sse(JSON.stringify({ choices: [{ delta: { content } }] })),
      sse(JSON.stringify({ choices: [{ delta: {}, finish_reason: 'stop' }] })),
      sse('[DONE]'),
    ];
    return frames;
  };
  const runCount = async (content: string) => {
    let calls = 0;
    globalThis.fetch = (async () => {
      calls += 1;
      const frames = driveWith(content);
      const stream = new ReadableStream<Uint8Array>({
        start(controller) {
          for (const frame of frames) controller.enqueue(new TextEncoder().encode(frame));
          controller.close();
        },
      });
      return new Response(stream, { status: 200, headers: { 'content-type': 'text/event-stream' } });
    }) as typeof fetch;
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
    return { calls, message };
  };

  try {
    // 不像 JSON 的废话：结构坏了，重试无用，必须只打一轮。
    const garbage = await runCount('here is some text without braces');
    assert.equal(garbage.calls, 1, 'non-JSON prose must not be retried as if it were truncated output');
    assert.ok(garbage.message.includes('json_parse_failed'), 'prose must still be reported as a parse failure');
    assert.ok(
      !garbage.message.includes('tokens_seen'),
      'prose must not be labelled tokens_seen — that would escalate the budget for nothing',
    );

    // 确实是 JSON 却没写完：必须走升压重试。
    const truncated = await runCount('{"items":["ok","half');
    assert.ok(truncated.calls > 1, 'a genuinely truncated JSON body must be retried with a bigger budget');
    assert.ok(truncated.message.includes('tokens_seen'), 'genuinely truncated JSON must be labelled tokens_seen');
    console.info('[13/13] 截断判定边界（废话不重试 / 真截断重试）通过');
  } finally {
    globalThis.fetch = originalFetch;
  }
}

// ====== 14. 受限格式追问：一条都没救回来时，回头提醒模型一次 ======
// 约定：只在 items 形状/映射错到零可用条目时追问，且必须把错误原文摆给模型，
// 不能静默重发同一份 prompt（同参必败）。有救回任何条目时绝不追问。
{
  const originalFetch = globalThis.fetch;
  const sse = (payload: string) => `data: ${payload}\n\n`;
  const makeResponse = (content: string) => {
    const frames = [
      sse(JSON.stringify({ choices: [{ delta: { content } }] })),
      sse(JSON.stringify({ choices: [{ delta: {}, finish_reason: 'stop' }] })),
      sse('[DONE]'),
    ];
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        for (const frame of frames) controller.enqueue(new TextEncoder().encode(frame));
        controller.close();
      },
    });
    return new Response(stream, { status: 200, headers: { 'content-type': 'text/event-stream' } });
  };

  try {
    // 14a：位置数组这种"零可用条目"的形状，追问提示必须点明收到了什么。
    const issue = describeAiItemsShapeIssue({ items: [['标题A', '广东', 2, 189]] });
    assert.ok(issue.includes('数组'), `shape issue must name the array shape, got: ${issue}`);
    assert.ok(issue.includes('tourId'), 'shape issue must state the expected object contract');

    // 14b：追问真的发出，且最后一条消息带着错误原文（"至少提醒一次"）。
    const bodies: Array<Record<string, unknown>> = [];
    globalThis.fetch = (async (_input: unknown, init?: { body?: string }) => {
      bodies.push(JSON.parse(init?.body ?? '{}') as Record<string, unknown>);
      return makeResponse('{"items":[{"tourId":"t1","reason":"ok"}]}');
    }) as typeof fetch;

    const retried = await requestAiFormatCorrection({
      configs: [{ baseUrl: 'https://ai.114124.xyz/v1', model: 'GLM-4.7-Flash', apiKey: 'test-key' }],
      messages: [{ role: 'system', content: 'S' }, { role: 'user', content: 'U' }] as never,
      schema: 'recommendation',
      issue,
      startedAt: Date.now(),
    });
    assert.equal(bodies.length, 1, 'exactly one correction request must be sent');
    const sentMessages = (bodies[0]?.messages ?? []) as Array<{ role: string; content: string }>;
    assert.equal(sentMessages.length, 3, 'the correction must append one message to the original prompt');
    const reminder = sentMessages[sentMessages.length - 1]?.content ?? '';
    assert.ok(reminder.includes('不符合约定'), 'the reminder must tell the model the reply was off-contract');
    assert.ok(reminder.includes('数组'), 'the reminder must quote the actual shape problem back to the model');
    assert.deepEqual(
      (retried?.parsed as { items?: unknown[] })?.items,
      [{ tourId: 't1', reason: 'ok' }],
      'the correction response must be returned for re-validation',
    );

    // 14c：预算耗尽时不许再追问（不能让用户多等一轮）。
    const beforeBudget = bodies.length;
    const skipped = await requestAiFormatCorrection({
      configs: [{ baseUrl: 'https://ai.114124.xyz/v1', model: 'GLM-4.7-Flash', apiKey: 'test-key' }],
      messages: [{ role: 'user', content: 'U' }] as never,
      schema: 'recommendation',
      issue,
      startedAt: Date.now() - 10 * 60_000,
    });
    assert.equal(skipped, null, 'an exhausted time budget must skip the correction entirely');
    assert.equal(bodies.length, beforeBudget, 'no request may be sent once the budget is exhausted');

    // 14d：追问本身失败时返回 null，调用方照常降级，不把异常抛给上层。
    globalThis.fetch = (async () => new Response('boom', { status: 500 })) as typeof fetch;
    const failed = await requestAiFormatCorrection({
      configs: [{ baseUrl: 'https://ai.114124.xyz/v1', model: 'GLM-4.7-Flash', apiKey: 'test-key' }],
      messages: [{ role: 'user', content: 'U' }] as never,
      schema: 'recommendation',
      issue,
      startedAt: Date.now(),
    });
    assert.equal(failed, null, 'a failed correction must resolve to null instead of throwing');

    console.info('[14/14] 受限格式追问（带错误原文 / 预算封顶 / 失败不抛出）通过');
  } finally {
    globalThis.fetch = originalFetch;
  }
}

// ====== 15. 合法 JSON 但顶层没有 items（现场 schema_invalid: items missing）======
// 模型把条目放到别的键下或嵌一层时，内容其实是好的，不该整轮降级到本地补位。
// 只要能确认"这确实是一组分条目的对象"就认回来；摘要/字符串数组绝不误认。
{
  const originalFetch = globalThis.fetch;
  const sse = (payload: string) => `data: ${payload}\n\n`;
  const drive = async (content: string) => {
    const frames = [
      sse(JSON.stringify({ choices: [{ delta: { content } }] })),
      sse(JSON.stringify({ choices: [{ delta: {}, finish_reason: 'stop' }] })),
      sse('[DONE]'),
    ];
    globalThis.fetch = (async () => {
      const stream = new ReadableStream<Uint8Array>({
        start(controller) {
          for (const frame of frames) controller.enqueue(new TextEncoder().encode(frame));
          controller.close();
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
      return { items: ((result.parsed as { items?: unknown[] }).items ?? []).length, message: '' };
    } catch (error) {
      return { items: -1, message: error instanceof Error ? error.message : String(error) };
    }
  };

  try {
    // 15a：嵌套一层 + 改名的键，都必须认回来。
    const nested = await drive(JSON.stringify({
      summary: '摘要',
      recommendations: { items: [{ tourId: 't1', reason: '好' }, { tourId: 't2' }] },
    }));
    assert.equal(nested.items, 2, `nested items must be salvaged, got: ${nested.message}`);

    const renamed = await drive(JSON.stringify({ summary: '摘要', picks: [{ tourId: 't1' }, { tourId: 't2' }] }));
    assert.equal(renamed.items, 2, `a renamed item list must be salvaged, got: ${renamed.message}`);

    // 15b：真的没有条目时，仍然按原口径报 schema_invalid（不能凭空造候选）。
    const empty = await drive(JSON.stringify({ summary: '只有摘要，没有条目' }));
    assert.equal(empty.items, -1, 'a response with no item list must still fail');
    assert.ok(empty.message.includes('items missing'), `expected items missing, got: ${empty.message}`);

    // 15c：纯文案数组不能被当成候选列表。
    assert.equal(
      salvageAiItemsFromResponse({ summary: '这是一段摘要', tradeoffs: ['取舍一', '取舍二'] }),
      null,
      'summary/tradeoffs string arrays must never be mistaken for candidate items',
    );
    console.info('[15/15] 顶层缺 items 的抢救（嵌套/改名认回，摘要不误认）通过');
  } finally {
    globalThis.fetch = originalFetch;
  }
}

// ---------------------------------------------------------------------------
// 16：列式编码回复（ck 声明列名 + 每行位置数组）。
// 线上真实事故：模型返回
//   { "v":"...", "ck":["id","title",...], "pc":[...], "candidates":[["tour_44","标题",...]] }
// 顶层键叫 candidates、每行是位置数组、且单元格里还有数组（日期列表、星期列表）。
// 旧实现有两处会崩：
//   1. looksLikeItem 要求"每个单元格都不是 object"，而 typeof [] === 'object'，
//      于是含日期数组的行被判成"不像条目"，整份回复认不回来；
//   2. 就算认回来，行归一化按位置猜列（第一列当标题），真实第一列是 id，
//      结果一条都匹配不到候选线路，仍判 items_unmapped 降级。
// 两条都要挡住，否则用户看到的就是"AI 用不了、已切本地推荐"。
// ---------------------------------------------------------------------------
async function test16ColumnarReply() {
  const columnarReply = {
    v: '2026-10-05-suitability-grade-v4',
    ck: [
      'id', 'title', 'destination', 'days', 'price', 'theme', 'source', 'pace', 'hot',
      'routeGroup', 'dates', 'weekdays', 'night', 'pricePerDay', 'tags', 'highlights',
      'atoms', 'cats', 'seasonAtoms', 'pricePct', 'priceBand',
    ],
    pc: [148, 1899, 3299, 4899, 42399],
    candidates: [
      ['tour_44', '梦境黄姚（西溪温泉）动车3天1', '广东', 3, 859, '海岛度假', '假日通', 'easy', 1,
        '广东 3天 温泉泡汤', ['2026-10-24'], [6], 0, 286, [], [], ['梦境黄姚动车'], ['温泉泡汤'],
        ['高温天气需取舍：温泉泡汤'], 25, 'lower'],
      ['tour_24', '三水温泉3天(欧式别墅)', '广东', 3, 499, '海岛度假', '假日通', 'easy', 1,
        '广东 3天 温泉泡汤/室内度假', ['2026-10-23'], [0, 1, 2], 0, 166, [], [], ['三水温泉'],
        ['温泉泡汤', '室内度假'], ['高温天气需取舍：温泉泡汤'], 24, 'lower'],
    ],
  };

  // 16a：单元格里含数组的行必须仍然被认成条目（线上事故的直接原因）。
  const salvaged = salvageAiItemsFromResponse(columnarReply);
  assert.ok(salvaged, 'a columnar reply with array cells must be salvaged, got null');
  assert.equal(salvaged.length, 2, `expected 2 salvaged rows, got ${salvaged?.length}`);

  // 16b：纯字符串行（无嵌套数组）同样要认。
  const flat = salvageAiItemsFromResponse({ candidates: [['a', 'b', 'c'], ['d', 'e', 'f']] });
  assert.equal(flat?.length, 2, 'flat positional rows must be salvaged');

  // 16c：单元格里嵌的是普通对象（不是位置编码）时不能硬认。
  assert.equal(
    salvageAiItemsFromResponse({ candidates: [{ nested: { deep: true } }, { more: { x: 1 } }] }),
    null,
    'rows of plain nested objects must not be mistaken for positional items',
  );

  // 16d：ck 列名必须真的被用来映射，否则 id 会被当成标题、一条都匹配不上。
  // 这里要喂完整的候选字段：buildTourPrimitive 需要 title/destination/价格等，
  // 只给 id+title 会在提原子那步炸掉，测的就不是本次要守的东西了。
  const makeTour = (id: string, title: string) => ({
    id,
    title,
    source: '假日通',
    destination: '广东',
    duration: 3,
    price: 499,
    departureDate: '2026-10-23',
    departureDates: ['2026-10-23', '2026-10-25'],
    transportType: 'bus',
    accommodationLevel: 'comfort',
    meals: ['breakfast'],
    highlights: ['温泉'],
    tags: ['温泉'],
    isHot: false,
    theme: '温泉泡汤',
    suitableFor: ['family'],
    leisureLevel: 'relaxed',
    season: 'autumn',
    rating: 4.5,
    groupSize: 20,
    hotDepartureDates: [],
  });
  const fakeTours = [
    makeTour('tour_44', '梦境黄姚（西溪温泉）动车3天1'),
    makeTour('tour_24', '三水温泉3天(欧式别墅)'),
  ] as unknown as Parameters<typeof validateAiItems>[1];
  const validated = validateAiItems(
    { ...columnarReply, items: salvaged as unknown[] },
    fakeTours,
  );
  assert.equal(
    validated.length,
    2,
    `columnar rows must map through ck to real tour ids, got ${validated.length}`,
  );
  assert.equal(validated[0].tourId, 'tour_44', `expected tour_44 first, got ${validated[0].tourId}`);
  assert.equal(validated[1].tourId, 'tour_24', `expected tour_24 second, got ${validated[1].tourId}`);

  console.info('[16/16] 列式编码回复（ck+位置数组）认回并按列名映射通过');
}

await test16ColumnarReply();

// 增量只读顶层 items，不能误认嵌套数据或列式回复。
{
  const extract = __aiRecommendationTestHooks.extractCompletedStreamItems;
  const one = { tourId: 'tour_1', score: 90, reason: '含括号[]和引号"的理由', matchedSignals: ['温泉'] };
  const prefix = '{"summary":"摘要","items":[' + JSON.stringify(one);
  assert.deepEqual(extract(prefix), [one]);
  assert.deepEqual(extract(prefix + ',{"tourId":"half'), [one]);
  assert.equal(extract('{"intent":{"items":[{"tourId":"wrong"}]}}'), null);
  assert.equal(extract('{"candidates":[["tour_1",90]]}'), null);
  assert.equal(extract('{"items":['), null);
  const full = prefix + ',' + JSON.stringify({ ...one, tourId: 'tour_2' }) + ']}';
  const arrivals: number[] = [];
  let previous = 0;
  for (let i = 0; i <= full.length; i++) {
    const count = extract(full.slice(0, i))?.length ?? 0;
    if (count > previous) arrivals.push(i);
    previous = count;
  }
  assert.equal(arrivals.length, 2);
  assert.ok(arrivals[0] < arrivals[1] && arrivals[1] < full.length);
}

// 真正的 SSE 接线测试：暂停网络尾部，首条必须已经回调，主 Promise 仍未完成。
{
  const originalFetch = globalThis.fetch;
  let controller!: ReadableStreamDefaultController<Uint8Array>;
  const partials: unknown[][] = [];
  let resolveFirst!: () => void;
  const first = new Promise<void>((resolve) => { resolveFirst = resolve; });
  globalThis.fetch = (async () => new Response(new ReadableStream<Uint8Array>({
    start(c) { controller = c; },
  }), { headers: { 'content-type': 'text/event-stream' } })) as typeof fetch;
  const emit = (content: string) => controller.enqueue(sseFrame(JSON.stringify({ choices: [{ delta: { content } }] })));
  let completed = false;
  try {
    const pending = callAiApi({
      configs: [{ baseUrl: 'https://api.z.ai/api/paas/v4', model: 'GLM-4.7-Flash', apiKey: 'test' }],
      messages: [{ role: 'user', content: '测试' }],
      onPartialItems(items) {
        partials.push(items);
        if (items.length === 1) resolveFirst();
      },
    }).then((result) => { completed = true; return result; });
    await Promise.resolve();
    emit('{"summary":"摘要","items":[{"tourId":"tour_1","score":90,"reason":"温泉","matchedSignals":[]}');
    await first;
    assert.equal(completed, false, 'first item must arrive before stream completion');
    emit(',{"tourId":"tour_2","score":80,"reason":"古镇","matchedSignals":[]}]}');
    controller.enqueue(sseFrame('[DONE]'));
    controller.close();
    await pending;
    assert.deepEqual(partials.map((items) => items.length), [0, 1, 2]);
  } finally { globalThis.fetch = originalFetch; }
}
// Transport chunk boundaries may split the first SSE field name before its colon.
{
  const originalFetch = globalThis.fetch;
  for (const firstChunk of ['d', 'da', 'dat', 'data', ' ', '\n']) {
    const partials: unknown[][] = [];
    const content = '{"items":[{"tourId":"tour_1","score":90,"reason":"offline","matchedSignals":[]}],"summary":"offline"}';
    const frame = 'data: ' + JSON.stringify({ choices: [{ delta: { content } }] }) + '\n\ndata: [DONE]\n\n';
    const chunks = firstChunk.trim() ? [firstChunk, frame.slice(firstChunk.length)] : [firstChunk, frame];
    globalThis.fetch = (async () => new Response(new ReadableStream<Uint8Array>({ start(controller) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
      controller.close();
    } }), { headers: { 'content-type': 'text/event-stream' } })) as typeof fetch;
    try {
      await callAiApi({ configs: [{ baseUrl: 'https://api.z.ai/api/paas/v4', model: 'GLM-4.7-Flash', apiKey: 'test' }],
        messages: [{ role: 'user', content: 'offline' }], onPartialItems: (items) => partials.push(items) });
      assert.equal(partials.at(-1)?.length, 1, `split prefix ${JSON.stringify(firstChunk)} must stream`);
    } finally { globalThis.fetch = originalFetch; }
  }
}
console.info('AI streaming contract tests passed');


// Closed order is available before reasons; fragmented/escaped JSON is never guessed.
{
  const extract = __aiRecommendationTestHooks.extractCompletedStreamItems;
  assert.equal(extract('{"order":["a",', 'order'), null);
  assert.deepEqual(extract('{"summary":"order: [fake]", "order":["a]b","c"],"items":[', 'order'), ['a]b', 'c']);
  assert.deepEqual(extract('{"metadata":{"order":["wrong"]},"order":["right"]', 'order'), ['right']);
  assert.equal(extract('{"order":["broken",]}', 'order'), null);
  console.log('PASS closed top-level order extraction is chunk-safe and string-aware');
}
