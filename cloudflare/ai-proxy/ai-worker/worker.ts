// EWG AI Proxy —— 前端唯一 LLM 入口。上游 key 全部存 Worker secrets，
// 前端 bundle 里只有本 Worker 的地址，实现"客户端不明文"。
// 防护：Origin 白名单 + 每 IP 滑窗限速 + 上游主机硬白名单；上游按序重试。

import { readUpstreamError, readUsableBody } from './upstream-body.ts';

const ALLOWED_ORIGINS = new Set([
  'https://nuctori.github.io',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
]);

// 每 IP 每分钟允许的请求数。免费版 Workers 没有持久存储，这是 isolate 内存近似值。
const RATE_LIMIT_PER_MINUTE = 20;

// Per-isolate metadata only: never share a request, response, or credential.
const DEFAULT_COOLDOWN_MS = 30_000;
const HEADER_BUDGET_MS = 25_000;
type Health = { until: number; probing: boolean };
const upstreamHealth = new Map<string, Health>();

function retryAfterMs(value: string | null, now: number): number {
  if (!value) return DEFAULT_COOLDOWN_MS;
  const v = value.trim();
  const delay = /^\d+$/.test(v) ? Number(v) * 1000 : Date.parse(v) - now;
  return Number.isFinite(delay) ? Math.max(1000, delay) : DEFAULT_COOLDOWN_MS;
}

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
// api.z.ai 曾尝试接入：key 有效但 Workers 出口被 WAF 拦成 405 HTML，不列入。
const UPSTREAM_HOSTS = new Set([
  'open.bigmodel.cn', 'api.siliconflow.cn', 'openrouter.ai', 'ai-gateway.kilo.ai',
  'text.pollinations.ai', 'oai.aihorde.net',
  // 2026-11-21 实测可用的公开免费线路（默认关闭，见 README「新增免费线路」）。
  'opencode.ai', 'oai.endpoints.kepler.ai.cloud.ovh.net', 'api.llm7.io', 'blockrun.ai',
]);
// 2026-11-21 实测：dots / ernie 在 Kilo 网关已 404（旧 id 下架），下列两个仍 200。
const KILO_FREE_MODELS = [
  ['beam', 'reflection/beam-free'],
  ['nemotron-vl', 'nvidia/nemotron-3.5-super-vl:free'],
] as const;

// OpenCode 官方 CLI 的请求指纹（sst/opencode: packages/opencode/src/session/llm/request.ts）。
// User-Agent 固定 `opencode/<version>`；opencode 自家 provider 另带 x-opencode-* 四个头，
// 其他 provider 走 x-session-affinity。只在需要「官方客户端」身份的上游启用。
function opencodeClientHeaders(env: Record<string, string>, sessionID: string): Record<string, string> {
  const version = (env.OPENCODE_VERSION || '1.0.0').trim();
  return {
    'User-Agent': `opencode/${version}`,
    'x-opencode-session': sessionID,
    'x-opencode-request': `${sessionID}-msg`,
    'x-opencode-client': (env.OPENCODE_CLIENT || 'cli').trim(),
    ...(env.OPENCODE_PROJECT_ID ? { 'x-opencode-project': env.OPENCODE_PROJECT_ID.trim() } : {}),
  };
}


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

    const { thinking: _thinking, ...standard } = forwarded;
    const { response_format: _format, ...kiloBody } = standard;
    const candidates: Array<{
      label: string; url: string; model: string; key?: string;
      payload: Record<string, unknown>; timeout: number;
      headers?: Record<string, string>;
    }> = [];
    const addKeys = (label: string, url: string, model: string, keys: Array<string | undefined>, payload: Record<string, unknown>) => {
      const configured = keys.filter(Boolean).length;
      keys.forEach((key, index) => {
        if (key) candidates.push({ label: configured > 1 ? `${label}#${index + 1}` : label, url, model, key, payload, timeout: 8000 });
      });
    };
    addKeys('bigmodel', 'https://open.bigmodel.cn/api/paas/v4/chat/completions', 'GLM-4.7-Flash',
      [env.BIGMODEL_API_KEY, env.BIGMODEL_API_KEY_2], forwarded);
    if (env.ENABLE_KILO_FREE === '1') {
      for (const [label, model] of KILO_FREE_MODELS) {
        candidates.push({ label: `kilo:${label}`, url: 'https://ai-gateway.kilo.ai/api/v1/chat/completions', model, payload: kiloBody, timeout: 6000 });
      }
    }
    addKeys('siliconflow', 'https://api.siliconflow.cn/v1/chat/completions', 'Qwen/Qwen3.5-4B', [env.SILICONFLOW_API_KEY], standard);
    const openRouterModel = 'poolside/laguna-xs-2.1:free';
    if (openRouterModel.endsWith(':free')) addKeys('openrouter', 'https://openrouter.ai/api/v1/chat/completions', openRouterModel,
      [env.OPENROUTER_API_KEY, env.OPENROUTER_API_KEY_2], standard);

    // OpenCode Zen（默认关闭）。官方免费额度只对 OpenCode 客户端放行，2026-11-21 实测
    // 匿名调用被 429 FreeUsageLimitError 拦下，纯头部伪装不构成充分条件，只作尽力而为候选。
    if (env.ENABLE_OPENCODE_ZEN === '1') {
      candidates.push({
        label: 'opencode-zen',
        url: 'https://opencode.ai/inference/openai/v1/chat/completions',
        model: (env.OPENCODE_ZEN_MODEL || 'big-pickle').trim(),
        key: (env.OPENCODE_ZEN_KEY || 'public').trim(),
        payload: standard,
        timeout: 6000,
        headers: opencodeClientHeaders(env, crypto.randomUUID()),
      });
    }
    // 境外匿名免费线路（默认关闭）：不带 key、不转发客户端鉴权。顺序按 2026-11-21 中文 JSON
    // 压测定序：BlockRun 1.5s 且字段更全 → LLM7 3.3s → OVH 质量最好但只有 2 RPM/IP，放最后。
    if (env.ENABLE_EXTRA_KEYLESS === '1') {
      candidates.push({ label: 'blockrun', url: 'https://blockrun.ai/api/v1/chat/completions',
        model: (env.BLOCKRUN_MODEL || 'poolside/laguna-xs-2.1').trim(), payload: standard, timeout: 7000 });
      const llm7Token = env.LLM7_TOKEN?.trim();
      candidates.push({ label: 'llm7', url: 'https://api.llm7.io/v1/chat/completions',
        model: (env.LLM7_MODEL || 'gpt-oss:20b').trim(), ...(llm7Token ? { key: llm7Token } : {}), payload: standard, timeout: 7000 });
      candidates.push({ label: 'ovh', url: 'https://oai.endpoints.kepler.ai.cloud.ovh.net/v1/chat/completions',
        model: (env.OVH_MODEL || 'Qwen3.8-27B').trim(), payload: standard, timeout: 7000 });
    }

    const mode = forwarded.stream === true ? 'sse' : 'json';
    const maxTokens = forwarded.max_tokens;
    if (env.ENABLE_POLLINATIONS_CLASSIC === '1' && mode === 'json' && typeof maxTokens === 'number' && maxTokens > 0 && maxTokens <= 768) {
      candidates.push({ label: 'pollinations', url: 'https://text.pollinations.ai/openai', model: 'openai', payload: kiloBody, timeout: 5000 });
    }
    const hordeModel = (mode === 'sse' ? env.AI_HORDE_SSE_MODEL : env.AI_HORDE_JSON_MODEL)?.trim();
    if (hordeModel) {
      candidates.push({ label: 'aihorde', url: 'https://oai.aihorde.net/v1/chat/completions', model: hordeModel,
        payload: { ...kiloBody, horde: { availability_mode: 'fail_fast', context_fit: 'reject', trusted_workers: true } }, timeout: 5500 });
    }
    const deadline = Date.now() + HEADER_BUDGET_MS;
    const failures: string[] = [];
    let retryIn = Infinity;
    let attempted = false;
    for (const item of candidates) {
      const started = Date.now();
      if (request.signal.aborted || started >= deadline) break;
      const id = `${item.label}:${mode}`;
      const prior = upstreamHealth.get(id);
      if (prior && (prior.probing || prior.until > started)) {
        console.info('ai_upstream', { upstream: item.label, mode, event: prior.probing ? 'probe_in_flight' : 'cooldown_skip' });
        retryIn = Math.min(retryIn, prior.probing ? 1000 : prior.until - started);
        continue;
      }
      const pool = item.label.startsWith('kilo:') ? upstreamHealth.get('kilo:gateway') : undefined;
      if (pool && (pool.probing || pool.until > started)) {
        retryIn = Math.min(retryIn, pool.probing ? 1000 : pool.until - started);
        console.info('ai_upstream', { upstream: 'kilo', mode, event: 'gateway_cooldown_skip' });
        continue;
      }
      if (prior) prior.probing = true;
      if (pool) pool.probing = true;
      attempted = true;
      const controller = new AbortController();
      let timer: ReturnType<typeof setTimeout>;
      const arm = () => {
        clearTimeout(timer);
        timer = setTimeout(() => controller.abort(), Math.max(0, Math.min(item.timeout, deadline - Date.now())));
      };
      arm();
      let status = 'unavailable';
      let cooldown = DEFAULT_COOLDOWN_MS;
      let shouldCool = true;
      let gatewayLimited = false;
      let accepted = false;
      const signal = AbortSignal.any([request.signal, controller.signal]);
      try {
        const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(item.headers || {}) };
        if (item.key) headers.Authorization = `Bearer ${item.key}`;
        if (item.label.startsWith('openrouter')) {
          headers['HTTP-Referer'] = 'https://nuctori.github.io/EverywhereWeGoGz/';
          headers['X-OpenRouter-Title'] = 'EverywhereWeGoGz';
        }
        const send = () => fetch(assertSafeUpstreamUrl(item.url), {
          method: 'POST', redirect: 'manual', headers,
          signal,
          body: JSON.stringify({ ...item.payload, model: item.model }),
        });
        let result = await send();
        if (result.status === 429 && item.label.startsWith('bigmodel') && !prior && !result.headers.has('Retry-After')) {
          const { code } = await readUpstreamError(result, signal);
          if (code === '1305' && !signal.aborted && Date.now() + 800 < deadline) {
            await new Promise<void>(resolve => {
              const finish = () => { clearTimeout(delay); signal.removeEventListener('abort', finish); resolve(); };
              const delay = setTimeout(finish, 800);
              signal.addEventListener('abort', finish, { once: true });
            });
            if (!signal.aborted) result = await send();
          }
        }
        const type = result.headers.get('Content-Type') || '';
        status = String(result.status);
        const body = result.ok && /^(application\/json|text\/event-stream)\b/i.test(type)
          ? await readUsableBody(result, mode === 'sse', signal, arm) : null;
        if (body && !signal.aborted) {
          accepted = true;
          shouldCool = false;
          // An older in-flight success may not erase a newer cooldown.
          if (prior?.probing && prior.until <= started && upstreamHealth.get(id) === prior) upstreamHealth.delete(id);
          if (pool?.probing && pool.until <= started && upstreamHealth.get('kilo:gateway') === pool) upstreamHealth.delete('kilo:gateway');
          return new Response(body, { status: result.status, headers: {
            ...cors, 'Content-Type': type, 'X-EWG-Upstream': item.label,
          } });
        }
        if (result.status === 429 || result.status === 503 || (result.status === 402 && item.label === 'pollinations')) {
          cooldown = retryAfterMs(result.headers.get('Retry-After'), Date.now());
        }
        if (result.status === 429 && item.label.startsWith('kilo:') && result.body) {
          const reader = result.body.getReader();
          const cancel = () => { void reader.cancel().catch(() => {}); };
          signal.addEventListener('abort', cancel, { once: true });
          try {
            const decoder = new TextDecoder();
            let detail = '';
            while (!signal.aborted && detail.length < 4096) {
              const part = await reader.read();
              if (part.done) {
                const message = JSON.parse(detail + decoder.decode())?.error?.message;
                gatewayLimited = /^Rate limit exceeded for free models\.?$/i.test(typeof message === 'string' ? message.trim() : '');
                break;
              }
              detail += decoder.decode(part.value.subarray(0, 4096), { stream: true });
            }
          } catch { /* Unknown 429 scope: cool only this model and mode. */ }
          finally { signal.removeEventListener('abort', cancel); cancel(); }
        } else if (!result.body?.locked) void result.body?.cancel().catch(() => {});
        if (result.ok) status = 'invalid or empty response';
        // Request-specific errors do not indicate provider health.
        shouldCool = ![400, 413, 422].includes(result.status);
      } catch {
        if (controller.signal.aborted) status = 'header timeout';
      } finally {
        clearTimeout(timer);
        if (prior) prior.probing = false;
        if (pool) pool.probing = false;
        console.info('ai_upstream', { upstream: item.label, mode, probe: Boolean(prior || pool), status, elapsedMs: Date.now() - started,
          event: request.signal.aborted ? 'cancelled' : accepted ? 'content_ok' : gatewayLimited ? 'gateway_rate_limited' : 'failed' });
        if (shouldCool && !request.signal.aborted) {
          const key = gatewayLimited ? 'kilo:gateway' : id;
          const until = Date.now() + cooldown;
          const current = upstreamHealth.get(key);
          if (current) current.until = Math.max(current.until, until);
          else upstreamHealth.set(key, { until, probing: false });
        }
      }
      failures.push(`${item.label}: ${status}`);
    }

    if (request.signal.aborted) return new Response(null, { status: 499, headers: cors });
    if (!attempted && Number.isFinite(retryIn)) return Response.json({ error: { message: 'All available AI upstreams are cooling down' } }, {
      status: 503, headers: { ...cors, 'Retry-After': String(Math.max(1, Math.ceil(retryIn / 1000))) },
    });
    return Response.json({ error: { message: `all upstreams failed: ${failures.join(' | ') || 'no upstream configured'}` } }, { status: 502, headers: cors });
  },
};
