// B1 换主题槽位 live 验证：双轮对话（上一轮主题 → 本轮换主题/追加/放弃），
// 观察分类头输出的最终需求规格是否符合槽位语义。
// 跑法: node --no-warnings --experimental-strip-types --loader ./scripts/ts-alias-loader.mjs scripts/ai-quality-loop/diag_b1_slots.mjs
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
const apiKey = process.env.VITE_AI_DEFAULT_API_KEY;
const baseUrl = process.env.VITE_AI_DEFAULT_BASE_URL;
const model = process.env.VITE_AI_DEFAULT_MODEL;

// 与 classifyExperienceDemandSpec 同款槽位规则提示
const SYSTEM = [
  '你是旅行需求分类头。把用户的一句旅行需求分类到封闭的体验原语集上，只输出严格 JSON，不要解释。',
  `原语集（只能使用这些标签，不得发明新标签）：海边沙滩、温泉泡汤、玩水清凉、森林山水、文化逛城、美食体验、亲子家庭、户外徒步、滑雪、邮轮、周边小镇、共享电瓶车。`,
  '规则：每个被点名的体验主题归到对应原语；并列默认各自独立一条 demand（relation="and"）；「或/或者/都行/任选」连接的主题合并为一条 demand（relation="or"）；「不要/不想/避开/免了/没有…也行」的主题放进 avoid（原语标签）；金额、天数、出发时段、目的地、上车点是结构化约束，不输出；没有可识别的体验主题时输出 {"demands":[],"avoid":[]}。',
].join('\n');

const SLOT_RULE = (previousDemands) => ({
  role: 'user',
  content: `上一轮的需求规格（JSON）：${JSON.stringify(previousDemands)}。追问槽位规则：本轮原话表达放弃/替换旧主题（算了/不X了/换/别再提）时，把该旧主题移入 avoid，只保留本轮点名的新主题为 demand；本轮是追加新主题时，旧主题保留为 demand；本轮只是补充约束（预算/天数）时，沿用上一轮全部 demand。`,
});

async function classify(userText, previousDemands) {
  const messages = [{ role: 'system', content: SYSTEM }, { role: 'user', content: userText }];
  if (previousDemands?.length) messages.push(SLOT_RULE(previousDemands));
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model, messages, max_tokens: 300, thinking: { type: 'disabled' } }),
    signal: AbortSignal.timeout(60000),
  });
  const text = await res.text();
  try {
    const envelope = JSON.parse(text);
    const message = envelope.choices?.[0]?.message ?? {};
    const raw = (String(message.content || '') + String(message.reasoning_content || ''))
      .replace(/<think>[\s\S]*?<\/think>/g, '')
      .trim();
    return JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] || 'null');
  } catch {
    return { error: `HTTP ${res.status} ${text.slice(0, 80)}` };
  }
}

const CASES = [
  {
    name: '放弃旧主题：算了还是去海边吧 温泉',
    previous: [{ terms: ['温泉泡汤'], relation: 'and' }],
    userText: '算了还是去海边吧 温泉',
    expect: '海边沙滩 ∈ demands；温泉泡汤 ∈ avoid 或不在 demands',
  },
  {
    name: '放弃旧主题：不去温泉了 海边两天',
    previous: [{ terms: ['温泉泡汤'], relation: 'and' }],
    userText: '不去温泉了 海边两天',
    expect: '海边沙滩 ∈ demands；温泉泡汤 ∈ avoid 或不在 demands',
  },
  {
    name: '追加主题：带老人 从化温泉（上轮海边）',
    previous: [{ terms: ['海边沙滩'], relation: 'and' }],
    userText: '带老人去从化泡温泉,节奏不要太赶',
    expect: '温泉泡汤 ∈ demands（旧主题海边按槽位规则保留或移入 avoid，均说明取舍）',
  },
];

let pass = 0;
for (const c of CASES) {
  let out = await classify(c.userText, c.previous);
  if (!out || out.error || (!out.demands && !out.avoid)) {
    await new Promise((r) => setTimeout(r, 8000));
    out = await classify(c.userText, c.previous);
  }
  const demands = JSON.stringify(out?.demands ?? []);
  const avoid = JSON.stringify(out?.avoid ?? []);
  const beachIn = JSON.stringify(out).includes('海边沙滩');
  const springIn = JSON.stringify(out).includes('温泉泡汤');
  const ok = Boolean(out) && beachIn && !springIn;
  if (ok) pass += 1;
  console.log(`${ok ? 'PASS' : 'CHECK'} ${c.name}`);
  console.log(`   demands=${demands} avoid=${avoid}`);
  await new Promise((r) => setTimeout(r, 4000));
}
console.log(`\nB1 槽位 live 验证：${pass}/${CASES.length} 例符合槽位语义（放弃旧主题 → 新主题为唯一 demand）`);
