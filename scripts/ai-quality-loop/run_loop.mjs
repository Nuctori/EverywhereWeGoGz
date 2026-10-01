// AI 推荐质量评测环：真实管线 + 可配置供应商 + LLM 评审。
// 结果写 tmp/aiq/results-<tag>.jsonl，支持断点续跑（同 id 跳过）。
import fs from 'node:fs';

const KEY = process.env.AI_QUALITY_TOKEN ?? '';
const PROXY = process.env.AI_QUALITY_BASE_URL ?? '';
const DRIVER = process.env.AI_QUALITY_DRIVER ?? 'gemini-3-flash'; // 被测管线的供应商
const JUDGE = process.env.AI_QUALITY_JUDGE ?? 'zhushu/moonshotai/kimi-k3';

const mod = await import('../../src/lib/ai-recommendation.ts');
const { requestAiRecommendations } = mod;
const tours = JSON.parse(fs.readFileSync('public/data/tours-list.json','utf8'));
const tourById = new Map(tours.map(t=>[t.id,t]));
const queries = JSON.parse(fs.readFileSync(new URL('./queries.json', import.meta.url),'utf8'));

const aiConfig = { apiKey: KEY, baseUrl: PROXY, model: DRIVER };
const RESULTS = process.env.AI_QUALITY_RESULTS ?? 'tmp/aiq/results-loop.jsonl';
const done = new Set(fs.existsSync(RESULTS) ? fs.readFileSync(RESULTS,'utf8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l).id) : []);

async function judge(query, items, expect) {
  const lines = items.slice(0, 12).map((it, i) => `${i+1}. ${it.title} | ${it.destination ?? ''} | ${it.duration ?? '?'}天 | ¥${it.price ?? '?'}` +
    (it.reason ? ` | 理由: ${String(it.reason).slice(0,80)}` : '')).join('\n');
  const sys = '你是旅游推荐质量评审。给定用户需求与推荐结果,输出严格 JSON:{"relevance":1-5,"constraint":1-5,"reason_quality":1-5,"issues":"一句话主要问题,无则空串"}。relevance=结果与需求相关度;constraint=显式约束(目的地/预算/天数/同行人)满足度;reason_quality=理由是否具体不套话。只输出 JSON。';
  const body = JSON.stringify({ model: JUDGE, messages: [
    { role: 'system', content: sys },
    { role: 'user', content: `需求: ${query}\n约束: ${JSON.stringify(expect)}\n结果:\n${lines || '(空)'}` },
  ], max_tokens: 400, temperature: 0.1 });
  try {
    const res = await fetch(`${PROXY}/chat/completions`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY}` },
      body, signal: AbortSignal.timeout(90000),
    });
    const text = await res.text();
    const jsonLine = text.split('\n').find(l => l.startsWith('data: {'))?.slice(6) || text;
    const raw = String(JSON.parse(jsonLine).choices?.[0]?.message?.content || '');
    const m = raw.match(/\{[\s\S]*\}/);
    return m ? JSON.parse(m[0]) : { relevance: 0, constraint: 0, reason_quality: 0, issues: 'judge-parse-fail' };
  } catch (e) {
    return { relevance: 0, constraint: 0, reason_quality: 0, issues: `judge-fail:${String(e).slice(0,40)}` };
  }
}

for (const { id, q, expect } of queries) {
  if (done.has(id)) { console.log(`${id} skip(done)`); continue; }
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
