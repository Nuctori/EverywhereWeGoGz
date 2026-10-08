// EWG AI Proxy —— 前端唯一 LLM 入口。上游 key 全部存 Worker secrets，
// 前端 bundle 里只有本 Worker 的地址，实现"客户端不明文"。
// 防护：Origin 白名单 + 每 IP 滑窗限速 + 上游主机硬白名单；上游按序重试。

const ALLOWED_ORIGINS = new Set([
  'https://nuctori.github.io',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
]);

// 每 IP 每分钟允许的请求数。免费版 Workers 没有持久存储，这是 isolate 内存近似值。
const RATE_LIMIT_PER_MINUTE = 20;

// 换下一个 upstream 前必须命中的失败状态。
const RETRYABLE_STATUS = new Set([401, 402, 403, 404, 408, 429, 500, 502, 503, 504]);

const rateBuckets = new Map<string, number[]>();

function corsHeaders(origin: string) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, content-type',
    'Access-Control-Max-Age': '86400',
  };
}

// 上游目标硬白名单：协议必须 https、主机必须在枚举内。
const UPSTREAM_HOSTS = new Set(['open.bigmodel.cn', 'api.siliconflow.cn', 'openrouter.ai']);

function assertSafeUpstreamUrl(url: string): string {
  const parsed = new URL(url);
  if (parsed.protocol !== 'https:') throw new Error('upstream protocol blocked');
  if (!UPSTREAM_HOSTS.has(parsed.hostname)) throw new Error('upstream host blocked');
  return url;
}

// 只透传白名单字段，剥离客户端塞进来的其它顶层参数。
function pickForwardFields(incoming: unknown): Record<string, unknown> {
  const forwarded: Record<string, unknown> = {};
  if (incoming && typeof incoming === 'object') {
    const source = incoming as Record<string, unknown>;
    if (Array.isArray(source.messages)) forwarded.messages = source.messages;
    if (typeof source.temperature === 'number') forwarded.temperature = source.temperature;
    if (typeof source.max_tokens === 'number') forwarded.max_tokens = source.max_tokens;
    if (source.response_format && typeof source.response_format === 'object') {
      forwarded.response_format = source.response_format;
    }
    if (typeof source.stream === 'boolean') forwarded.stream = source.stream;
    if (source.thinking && typeof source.thinking === 'object') {
      forwarded.thinking = source.thinking;
    }
  }
  return forwarded;
}

export default {
  async fetch(request: Request, env: Record<string, string>): Promise<Response> {
    const origin = request.headers.get('Origin') || '';
    const cors = corsHeaders(origin);

    if (request.method === 'OPTIONS') {
      if (!ALLOWED_ORIGINS.has(origin)) return new Response(null, { status: 403 });
      return new Response(null, { status: 204, headers: cors });
    }
    if (request.method !== 'POST') {
      return new Response('method not allowed', { status: 405, headers: cors });
    }
    if (!ALLOWED_ORIGINS.has(origin)) {
      return new Response(JSON.stringify({ error: { message: 'origin not allowed' } }), {
        status: 403,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    // 每 IP 滑窗限速（isolate 内存近似值）。
    const now = Date.now();
    const windowStart = now - 60_000;
    const ipKey = String(request.headers.get('CF-Connecting-IP') || 'unknown');
    const recentHits = (rateBuckets.get(ipKey) || []).filter((ts) => ts > windowStart);
    if (recentHits.length >= RATE_LIMIT_PER_MINUTE) {
      rateBuckets.set(ipKey, recentHits);
      return new Response(
        JSON.stringify({ error: { message: 'rate limited, slow down', code: '429' } }),
        { status: 429, headers: { ...cors, 'Content-Type': 'application/json' } },
      );
    }
    recentHits.push(now);
    rateBuckets.set(ipKey, recentHits);
    if (rateBuckets.size > 10_000) {
      for (const [key, timestamps] of rateBuckets) {
        if (timestamps.every((ts) => ts <= windowStart)) rateBuckets.delete(key);
      }
    }

    let incomingBody: unknown;
    try {
      incomingBody = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: { message: 'invalid json body' } }), {
        status: 400,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }
    const forwarded = pickForwardFields(incomingBody);

    const failures: string[] = [];

    // upstream 1：智谱开放平台 GLM（免费模型，思维链开启）
    if (env.BIGMODEL_API_KEY) {
      try {
        const upstreamUrl = assertSafeUpstreamUrl(
          'https://open.bigmodel.cn/api/paas/v4/chat/completions',
        );
        const upstreamResponse = await fetch(upstreamUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${env.BIGMODEL_API_KEY}`,
          },
          body: JSON.stringify({ ...forwarded, model: 'GLM-4.7-Flash' }),
        });
        if (upstreamResponse.ok) {
          const headers = new Headers(upstreamResponse);
          headers.set('Access-Control-Allow-Origin', origin);
          headers.set('X-EWG-Upstream', 'bigmodel');
          return new Response(upstreamResponse.body, {
            status: upstreamResponse.status,
            headers,
          });
        }
        const detail = await upstreamResponse.text().catch(() => '');
        failures.push(`bigmodel: ${upstreamResponse.status} ${detail.slice(0, 300)}`);
        if (!RETRYABLE_STATUS.has(upstreamResponse.status)) {
          return new Response(JSON.stringify({ error: { message: failures.join(' | ') } }), {
            status: upstreamResponse.status,
            headers: { ...cors, 'Content-Type': 'application/json' },
          });
        }
      } catch (error) {
        failures.push(`bigmodel: ${String(error)}`);
      }
    } else {
      failures.push('bigmodel: no key configured');
    }

    // upstream 2：硅基流动 Qwen（免费小模型；thinking 参数 GLM 专属，剥离）
    if (env.SILICONFLOW_API_KEY) {
      try {
        const { thinking: _dropped, ...baseForwarded } = forwarded;
        const upstreamUrl = assertSafeUpstreamUrl('https://api.siliconflow.cn/v1/chat/completions');
        const upstreamResponse = await fetch(upstreamUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${env.SILICONFLOW_API_KEY}`,
          },
          body: JSON.stringify({ ...baseForwarded, model: 'Qwen/Qwen3.5-4B' }),
        });
        if (upstreamResponse.ok) {
          const headers = new Headers(upstreamResponse);
          headers.set('Access-Control-Allow-Origin', origin);
          headers.set('X-EWG-Upstream', 'siliconflow');
          return new Response(upstreamResponse.body, {
            status: upstreamResponse.status,
            headers,
          });
        }
        const detail = await upstreamResponse.text().catch(() => '');
        failures.push(`siliconflow: ${upstreamResponse.status} ${detail.slice(0, 300)}`);
        if (!RETRYABLE_STATUS.has(upstreamResponse.status)) {
          return new Response(JSON.stringify({ error: { message: failures.join(' | ') } }), {
            status: upstreamResponse.status,
            headers: { ...cors, 'Content-Type': 'application/json' },
          });
        }
      } catch (error) {
        failures.push(`siliconflow: ${String(error)}`);
      }
    } else {
      failures.push('siliconflow: no key configured');
    }

    // upstream 3：OpenRouter 免费档兜底
    if (env.OPENROUTER_API_KEY) {
      try {
        const { thinking: _dropped, ...baseForwarded } = forwarded;
        const upstreamUrl = assertSafeUpstreamUrl('https://openrouter.ai/api/v1/chat/completions');
        const upstreamResponse = await fetch(upstreamUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
            'HTTP-Referer': 'https://nuctori.github.io/EverywhereWeGoGz/',
            'X-OpenRouter-Title': 'EverywhereWeGoGz',
          },
          body: JSON.stringify({ ...baseForwarded, model: 'poolside/laguna-xs-2.1:free' }),
        });
        if (upstreamResponse.ok) {
          const headers = new Headers(upstreamResponse);
          headers.set('Access-Control-Allow-Origin', origin);
          headers.set('X-EWG-Upstream', 'openrouter');
          return new Response(upstreamResponse.body, {
            status: upstreamResponse.status,
            headers,
          });
        }
        const detail = await upstreamResponse.text().catch(() => '');
        failures.push(`openrouter: ${upstreamResponse.status} ${detail.slice(0, 300)}`);
        if (!RETRYABLE_STATUS.has(upstreamResponse.status)) {
          return new Response(JSON.stringify({ error: { message: failures.join(' | ') } }), {
            status: upstreamResponse.status,
            headers: { ...cors, 'Content-Type': 'application/json' },
          });
        }
      } catch (error) {
        failures.push(`openrouter: ${String(error)}`);
      }
    } else {
      failures.push('openrouter: no key configured');
    }

    return new Response(
      JSON.stringify({ error: { message: `all upstreams failed: ${failures.join(' | ')}` } }),
      { status: 502, headers: { ...cors, 'Content-Type': 'application/json' } },
    );
  },
};