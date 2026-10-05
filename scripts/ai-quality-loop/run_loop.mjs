// AI 推荐质量评测环：真实管线 + 可配置供应商 + LLM 评审。
// 结果写 tmp/aiq/results-<tag>.jsonl，支持断点续跑（同 id 跳过）。
// 配置解析顺序：AI_QUALITY_* 环境变量 > .env.local 的 VITE_AI_DEFAULT_* >
// VITE_AI_SECONDARY_* > VITE_AI_FALLBACK_*——与应用内置默认供应商同源。
import fs from 'node:fs';

function loadEnvLocal() {
  const path = new URL('../../.env.local', import.meta.url);
  if (!fs.existsSync(path)) return {};
  const env = {};
    const NL = String.fromCharCode(10);
    for (const line of fs.readFileSync(path, 'utf8').split(NL)) {
    const idx = line.indexOf('=');
    if (idx > 0 && !line.startsWith('#')) env[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  }
  return env;
}

const ENV_LOCAL = loadEnvLocal();
// .env.local 注入 process.env：被测管线内部用 readRuntimeEnv(VITE_AI_*) 解析
// 供应商链，node 进程不自动加载 env 文件，必须显式注入（已存在的环境变量优先）。
for (const [key, value] of Object.entries(ENV_LOCAL)) {
  if (!(key in process.env)) process.env[key] = value;
}
const envOrLocal = (key) => process.env[key] ?? ENV_LOCAL[key] ?? '';

const CONFIG_CHAIN = [
  {
    name: 'default',
    apiKey: process.env.AI_QUALITY_TOKEN ?? envOrLocal('VITE_AI_DEFAULT_API_KEY'),
    baseUrl: process.env.AI_QUALITY_BASE_URL ?? envOrLocal('VITE_AI_DEFAULT_BASE_URL'),
    model: process.env.AI_QUALITY_DRIVER ?? envOrLocal('VITE_AI_DEFAULT_MODEL') ?? 'GLM-4.7-Flash',
  },
  {
    name: 'secondary',
    apiKey: envOrLocal('VITE_AI_SECONDARY_API_KEY'),
    baseUrl: envOrLocal('VITE_AI_SECONDARY_BASE_URL') || envOrLocal('VITE_AI_DEFAULT_BASE_URL'),
    model: envOrLocal('VITE_AI_SECONDARY_MODEL'),
  },
  {
    name: 'fallback',
    apiKey: envOrLocal('VITE_AI_FALLBACK_API_KEY') || envOrLocal('VITE_AI_FALLBACK_API_KEY_B64') && Buffer.from(envOrLocal('VITE_AI_FALLBACK_API_KEY_B64'), 'base64').toString('utf8'),
    baseUrl: envOrLocal('VITE_AI_FALLBACK_BASE_URL') || envOrLocal('VITE_AI_DEFAULT_BASE_URL'),
    model: envOrLocal('VITE_AI_FALLBACK_MODEL'),
  },
].filter((config) => config.apiKey && config.baseUrl && config.model);

if (CONFIG_CHAIN.length === 0) {
  console.error('没有可用评测配置：AI_QUALITY_TOKEN 或 .env.local 的 VITE_AI_DEFAULT_* 均缺失');
  process.exit(1);
}

const PRIMARY = CONFIG_CHAIN[0];
const KEY = PRIMARY.apiKey;
const PROXY = PRIMARY.baseUrl;
const DRIVER = PRIMARY.model; // 被测管线的供应商
// 裁判默认用被测同源模型：代理上的第三方命名空间模型会随平台上下架/子路由
// 故障而 400，裁判挂了会让整轮评分变成 0/0/0 的假回退。
const JUDGE = process.env.AI_QUALITY_JUDGE ?? DRIVER;
// 裁判/被测任一返回非 JSON 时重试一次，降低单次抖动对整轮分数的影响。
const JUDGE_RETRIES = Number(process.env.AI_QUALITY_JUDGE_RETRIES ?? 1);

const mod = await import('../../src/lib/ai-recommendation.ts');
const { requestAiRecommendations } = mod;
const tours = JSON.parse(fs.readFileSync('public/data/tours-list.json','utf8'));
const tourById = new Map(tours.map(t=>[t.id,t]));
// 被测集：bank6 全部（主题分离/交通偏好新用例）+ bank1/3/5 各抽样前 10 条。
const BANK_FILES = {
  bank1: './queries.json',
  bank3: './queries-bank3.json',
  bank5: './queries-bank5.json',
  bank6: './queries-bank6.json',
};
const BANK_PREFIX = { bank1: 'b1', bank3: 'b3', bank5: 'b5', bank6: 's' };
function loadEvalSet() {
  const cases = [];
  for (const [bank, file] of Object.entries(BANK_FILES)) {
    const items = JSON.parse(fs.readFileSync(new URL(file, import.meta.url), 'utf8'));
    const take = bank === 'bank6' ? items : items.slice(0, 10);
    for (const { id, q, expect } of take) {
      cases.push({ id: `${BANK_PREFIX[bank]}-${id}`, q, expect });
    }
  }
  return cases;
}
const queries = loadEvalSet();

const aiConfig = { apiKey: KEY, baseUrl: PROXY, model: DRIVER };
const RESULTS = process.env.AI_QUALITY_RESULTS ?? 'tmp/aiq/results-loop.jsonl';
const done = new Set(fs.existsSync(RESULTS) ? fs.readFileSync(RESULTS,'utf8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l).id) : []);

async function judgeOnce(query, items, expect) {
  const lines = items.slice(0, 12).map((it, i) => `${i+1}. ${it.title} | ${it.destination ?? ''} | ${it.duration ?? '?'}天 | ¥${it.price ?? '?'}` +
    (it.reason ? ` | 理由: ${String(it.reason).slice(0,80)}` : '')).join('\n');
  const sys = '你是旅游推荐质量评审。给定用户需求与推荐结果,输出严格 JSON 对象(不要 markdown 代码块、不要解释):{"relevance":1-5,"constraint":1-5,"reason_quality":1-5,"issues":"一句话主要问题,无则空串"}。relevance=结果与需求相关度;constraint=显式约束(目的地/预算/天数/同行人)满足度;reason_quality=理由是否具体不套话。';
  const body = JSON.stringify({ model: JUDGE, messages: [
    { role: 'system', content: sys },
    { role: 'user', content: `需求: ${query}\n约束: ${JSON.stringify(expect)}\n结果:\n${lines || '(空)'}` },
  ], max_tokens: 2000, temperature: 0.1, thinking: { type: 'disabled' } });
  const res = await fetch(`${PROXY}/chat/completions`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY}` },
    body, signal: AbortSignal.timeout(90000),
  });
  if (!res.ok) throw new Error(`judge HTTP ${res.status}`);
  const text = await res.text();
  const jsonLine = text.split('\n').find(l => l.startsWith('data: {'))?.slice(6) || text;
  const envelope = JSON.parse(jsonLine);
  const message = envelope.choices?.[0]?.message ?? {};
  const raw = (String(message.content || '') + String(message.reasoning_content || '')).replace(/<think>[\s\S]*?<\/think>/g, '').trim();
  const m = raw.match(/\{[\s\S]*\}/);
  if (!m) throw new Error('judge 未返回 JSON');
  const parsed = JSON.parse(m[0]);
  if (typeof parsed.relevance !== 'number') throw new Error('judge JSON 缺字段');
  return parsed;
}

// 裁判重试：429 指数退避（免费档 RPM 限制， pipeline 每例已消耗多次调用），
// 非 JSON/网络错/5xx 也重试——单次抖动不应把整条打成 0 分。
async function judge(query, items, expect) {
  const waits = [5000, 15000, 30000, 60000, 60000];
  let lastError = '';
  for (let attempt = 0; attempt <= waits.length; attempt += 1) {
    try {
      return await judgeOnce(query, items, expect);
    } catch (e) {
      lastError = String(e).slice(0, 80);
      if (attempt < waits.length) await new Promise((r) => setTimeout(r, waits[attempt]));
    }
  }
  return { relevance: 0, constraint: 0, reason_quality: 0, issues: `judge-fail:${lastError}`, judgeFailed: true };
}

for (const { id, q, expect } of queries) {
  if (done.has(id)) { console.log(`${id} skip(done)`); continue; }
  if (done.size > 0) await new Promise((r) => setTimeout(r, 20000)); // 例间节流：免费档 RPM 有限，慢即是快
  const started = Date.now();
  try {
    const result = await requestAiRecommendations({
      conversationId: `loop-${id}`,
      messages: [{ id: `m-${id}`, role: 'user', content: q, createdAt: new Date().toISOString() }],
      candidateTours: tours,
      activeFilters: {},
      searchQuery: '',
      aiConfig,
    });
    const ms = Date.now() - started;
    const items = (result.items || []).slice(0, 15);
    const hallucinated = items.filter(it => !tourById.has(it.tourId)).map(it => it.tourId);
    const verdict = await judge(q, items.map(it => ({ ...it, ...(tourById.get(it.tourId) || {}) })), expect);
    const row = {
      id, q, ms,
      mode: result.status?.mode || result.source,
      statusLabel: result.status?.label || '',
      itemCount: items.length,
      tiers: items.map(it => it.recommendationTier || '-').join(','),
      top5: items.slice(0, 5).map(it => `${(tourById.get(it.tourId)?.title || it.title || '?').slice(0, 22)}¥${tourById.get(it.tourId)?.price ?? '?'}`),
      hallucinated,
      verdict,
    };
    fs.appendFileSync(RESULTS, JSON.stringify(row) + '\n');
    console.log(`${id} ${ms}ms mode=${row.mode} items=${row.itemCount} judge=${verdict.relevance}/${verdict.constraint}/${verdict.reason_quality} ${verdict.issues ? '⚠' + String(verdict.issues).slice(0,60) : ''}`);
  } catch (e) {
    fs.appendFileSync(RESULTS, JSON.stringify({ id, q, error: String(e).slice(0, 160), ms: Date.now() - started }) + '\n');
    console.log(`${id} ERROR ${String(e).slice(0, 90)}`);
  }
}
console.log('LOOP DONE');

// REJUDGE 模式：AI_QUALITY_REJUDGE=1 时，对 results 文件里 judgeFailed 的行
// 只重跑裁判（1 次调用/行，带退避），就地更新——网关限流是间歇的，事后补判
// 能恢复大部分 0 分行，不必重跑整条管线。
if (process.env.AI_QUALITY_REJUDGE === '1') {
  const NL = String.fromCharCode(10);
  const rows = fs.readFileSync(RESULTS, 'utf8').trim().split(NL).filter(Boolean).map((l) => JSON.parse(l));
  const failed = rows.filter((row) => row.q && (row.verdict?.judgeFailed || String(row.verdict?.issues || '').startsWith('judge-fail')));
  console.log(`REJUDGE: ${failed.length} 行待补判`);
  for (const row of failed) {
    const verdict = await judge(row.q, (row.top5 || []).map((title, i) => ({ title, price: '?' })), {});
    row.verdict = verdict;
    row.judgeFailed = Boolean(verdict.judgeFailed);
    console.log(`REJUDGE ${row.id}: ${verdict.relevance}/${verdict.constraint}/${verdict.reason_quality}`);
    await new Promise((r) => setTimeout(r, 4000));
  }
  fs.writeFileSync(RESULTS, rows.map((row) => JSON.stringify(row)).join(NL) + '\n');
  console.log('REJUDGE DONE');
}
