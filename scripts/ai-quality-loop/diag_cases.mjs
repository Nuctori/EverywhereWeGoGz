// 诊断 runner：对指定查询跑真实全链路并输出完整诊断
// （分类头规格 → 适配档位分布 → 终排 items 全量事实）。
// 跑法: node --no-warnings --experimental-strip-types --loader ./scripts/ts-alias-loader.mjs scripts/ai-quality-loop/diag_cases.mjs
import fs from 'node:fs';

function loadEnvLocal() {
  const path = new URL('../../.env.local', import.meta.url);
  if (!fs.existsSync(path)) return {};
  const env = {};
  for (const line of fs.readFileSync(path, 'utf8').split('\n')) {
    const idx = line.indexOf('=');
    if (idx > 0 && !line.startsWith('#')) env[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  }
  return env;
}
const ENV_LOCAL = loadEnvLocal();
for (const [key, value] of Object.entries(ENV_LOCAL)) {
  if (!(key in process.env)) process.env[key] = value;
}

const mod = await import('../../src/lib/ai-recommendation.ts');
const hooks = mod.__aiRecommendationTestHooks;
const tours = JSON.parse(fs.readFileSync('public/data/tours-list.json', 'utf8'));

const CASES = [
  '不泡温泉,就想看看海发发呆,两天,人均600',
  '阳江海陵岛海边度假酒店2天',
  '清远温泉两天游,人均500内',
];

const apiKey = process.env.VITE_AI_DEFAULT_API_KEY;
const baseUrl = process.env.VITE_AI_DEFAULT_BASE_URL;
const model = process.env.VITE_AI_DEFAULT_MODEL;
const aiConfig = { apiKey, baseUrl, model };

for (const q of CASES) {
  console.log('\n==================================================');
  console.log('查询:', q);
  // 离线口径对照
  const spec = hooks.buildExperienceDemandSpec(q);
  console.log('词面 fallback spec:', JSON.stringify(spec));
  const query = hooks.buildLocalRecommendationQuery(q);
  console.log('transportHints:', JSON.stringify(query.transportHints), '| bp:', query.budgetPriority);

  // live 分类头（与管线同款调用）
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: '你是旅行需求分类头。把用户的一句旅行需求分类到封闭的体验原语集上，只输出严格 JSON，不要解释。原语集（只能使用这些标签，不得发明新标签）：海边沙滩、温泉泡汤、玩水清凉、森林山水、文化逛城、美食体验、亲子家庭、户外徒步、滑雪、邮轮、周边小镇、共享电瓶车。规则：每个被点名的体验主题归到对应原语；并列默认各自独立一条 demand（relation="and"）；「或/或者/都行/任选」连接的主题合并为一条 demand（relation="or"）；「不要/不想/避开/免了/没有…也行」的主题放进 avoid（原语标签）；金额、天数、出发时段、目的地、上车点是结构化约束，不输出。没有可识别的体验主题时输出 {"demands":[],"avoid":[]}。严格输出 JSON：{"demands":[{"terms":["原语"],"relation":"and"}],"avoid":["原语"]}' },
        { role: 'user', content: q },
      ],
      max_tokens: 300,
      thinking: { type: 'disabled' },
    }),
    signal: AbortSignal.timeout(60000),
  });
  const text = await res.text();
  let classified = null;
  try {
    const envelope = JSON.parse(text);
    const raw = String(envelope.choices?.[0]?.message?.content || '').replace(/<think>[\s\S]*?<\/think>/g, '').trim();
    classified = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] || 'null');
  } catch {}
  console.log('live 分类头:', JSON.stringify(classified));

  // 真实全链路
  const result = await mod.requestAiRecommendations({
    conversationId: `diag-${Date.now()}`,
    messages: [{ id: 'm1', role: 'user', content: q, createdAt: new Date().toISOString() }],
    candidateTours: tours,
    activeFilters: {},
    searchQuery: '',
    aiConfig,
  });
  console.log('mode:', result.status?.mode || result.source, '| items:', result.items.length);
  const tiers = result.items.map((it) => it.recommendationTier || '-');
  console.log('档位序列:', tiers.slice(0, 25).join(','));
  for (const it of result.items.slice(0, 15)) {
    const t = tours.find((x) => x.id === it.tourId);
    console.log(`  ${it.recommendationTier || '-'} 适配${it.suitabilityGrade ?? '-'} ¥${t?.price ?? '?'} ${t?.duration ?? '?'}天 ${String(t?.title || it.title || '?').slice(0, 30)}`);
  }
  await new Promise((r) => setTimeout(r, 8000));
}
console.log('\nDIAG DONE');
