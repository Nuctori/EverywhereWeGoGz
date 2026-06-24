import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import {
  buildWeeklyArticleContext,
  ensureDir,
  fetchWeatherOutlook,
  getDefaultAuthor,
  getDefaultWebsiteUrl,
  loadEnvFiles,
  readToursData,
  toDateKey,
  validateGeneratedArticle,
  writeJson,
} from './weekly_wechat_article.mjs';

const DEFAULT_AIDER_MODEL = 'deepseek/deepseek-chat';
const DEFAULT_AIDER_BASE_URL = 'https://api.deepseek.com/v1';
const DEFAULT_CANDIDATE_VARIANTS = 2;

function parseArgs(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];
    if (arg === '--date' && next) {
      options.runDate = next;
      index += 1;
    } else if (arg === '--out-dir' && next) {
      options.outDir = next;
      index += 1;
    } else if (arg === '--window-days' && next) {
      options.windowDays = Number(next);
      index += 1;
    } else if (arg === '--max-candidates' && next) {
      options.maxCandidates = Number(next);
      index += 1;
    } else if (arg === '--max-article-items' && next) {
      options.maxArticleItems = Number(next);
      index += 1;
    } else if (arg === '--variant-count' && next) {
      options.variantCount = Number(next);
      index += 1;
    } else if (arg === '--aider-model' && next) {
      options.aiderModel = next;
      index += 1;
    }
  }
  return options;
}

function stripMarkdownFence(text) {
  const trimmed = String(text || '').trim();
  const match = trimmed.match(/^```[a-zA-Z]*\n([\s\S]*?)\n```$/);
  return match ? match[1].trim() : trimmed;
}

function parseJsonResponse(text) {
  return JSON.parse(stripMarkdownFence(text));
}

function parseFrontmatterBlock(article) {
  const match = String(article || '').match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;

  const fields = {};
  for (const line of match[1].split(/\r?\n/)) {
    const separatorIndex = line.indexOf(':');
    if (separatorIndex <= 0) continue;
    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();
    value = value.replace(/^['"]|['"]$/g, '');
    fields[key] = value;
  }
  return fields;
}

function buildFrontmatterBlock(fields) {
  return [
    '---',
    `title: "${String(fields.title || '').replace(/"/g, '\\"')}"`,
    `summary: "${String(fields.summary || '').replace(/"/g, '\\"')}"`,
    `author: "${String(fields.author || '').replace(/"/g, '\\"')}"`,
    `cover: "${String(fields.cover || '').replace(/"/g, '\\"')}"`,
    '---',
  ].join('\n');
}

function deriveArticleTitle(article) {
  const headingMatch = String(article || '').match(/^#\s+(.+)$/m);
  return headingMatch ? headingMatch[1].trim() : '';
}

function deriveArticleSummary(article) {
  const lines = String(article || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  for (const line of lines) {
    if (line.startsWith('#')) continue;
    if (line.startsWith('![')) continue;
    if (line === '---') continue;
    return line.slice(0, 120);
  }
  return '';
}

export function ensureArticleFrontmatter(article, context, candidateArticles = []) {
  const existing = parseFrontmatterBlock(article);
  const candidateFrontmatters = candidateArticles
    .map((item) => parseFrontmatterBlock(item))
    .filter(Boolean);

  const merged = {
    title:
      existing?.title ||
      candidateFrontmatters.find((item) => item.title)?.title ||
      deriveArticleTitle(article) ||
      '广州出发本周旅行团推荐',
    summary:
      existing?.summary ||
      candidateFrontmatters.find((item) => item.summary)?.summary ||
      deriveArticleSummary(article) ||
      '结合天气、时令和出发班期整理的本周旅行团推荐。',
    author:
      existing?.author ||
      candidateFrontmatters.find((item) => item.author)?.author ||
      getDefaultAuthor(),
    cover:
      existing?.cover ||
      candidateFrontmatters.find((item) => item.cover)?.cover ||
      context.selectedTours?.[0]?.articleImages?.[0] ||
      context.selectedTours?.[0]?.images?.[0] ||
      '',
  };

  const hasAllRequiredFields = merged.title && merged.summary && merged.author && merged.cover;
  if (!hasAllRequiredFields) {
    return article;
  }

  const body = existing ? String(article).replace(/^---\n[\s\S]*?\n---\n?/, '').trim() : String(article).trim();
  return `${buildFrontmatterBlock(merged)}\n\n${body}\n`;
}

function normalizeAiderModel(model) {
  const trimmed = String(model || '').trim();
  if (!trimmed) {
    return DEFAULT_AIDER_MODEL;
  }
  if (trimmed.includes('/')) {
    return trimmed;
  }
  const normalized = trimmed.toLowerCase();
  if (normalized.includes('reasoner') || normalized.includes('r1')) {
    return 'deepseek/deepseek-reasoner';
  }
  if (normalized.startsWith('deepseek')) {
    return DEFAULT_AIDER_MODEL;
  }
  return trimmed;
}

function extractAiderReplyFromHistory(text) {
  const content = String(text || '');
  const marker = 'LLM RESPONSE ';
  const markerIndex = content.lastIndexOf(marker);
  if (markerIndex === -1) {
    return sanitizeAiderReply(content);
  }

  const section = content.slice(markerIndex);
  const firstLineBreak = section.indexOf('\n');
  if (firstLineBreak === -1) {
    return '';
  }

  let body = section.slice(firstLineBreak + 1).trim();
  return sanitizeAiderReply(body);
}

function sanitizeAiderReply(text) {
  let body = String(text || '')
    .replace(/^\s*ASSISTANT\s*/i, '')
    .split(/\r?\n/)
    .map((line) => line.replace(/^ASSISTANT\s*/, ''))
    .join('\n')
    .trim();

  const patchMatch = body.match(/<<<<<<< SEARCH\s*[\r\n]+=======\s*([\s\S]*?)\s*>>>>>>> REPLACE/);
  if (patchMatch) {
    body = patchMatch[1].trim();
  }

  const markdownBlockMatch = body.match(/```(?:markdown)?\s*([\s\S]*?)\s*```/i);
  if (markdownBlockMatch) {
    body = markdownBlockMatch[1].trim();
  }

  const articleNameMatch = body.match(/^article(?:-[\w.]+)?\.md\s*/i);
  if (articleNameMatch) {
    body = body.slice(articleNameMatch[0].length).trim();
  }

  return stripMarkdownFence(body);
}

function getAiderBinary() {
  const userScripts = path.join(process.env.APPDATA || '', 'Python', 'Python310', 'Scripts', 'aider.exe');
  return fs.existsSync(userScripts) ? userScripts : 'aider';
}

function buildAiderEnv() {
  const env = { ...process.env };
  env.AIDER_MODEL = env.AIDER_MODEL || DEFAULT_AIDER_MODEL;
  env.AIDER_OPENAI_API_KEY = env.AIDER_OPENAI_API_KEY || env.DEEPSEEK_API_KEY || '';
  env.AIDER_OPENAI_API_BASE = env.AIDER_OPENAI_API_BASE || env.DEEPSEEK_BASE_URL || DEFAULT_AIDER_BASE_URL;
  env.AIDER_ANALYTICS = 'false';
  env.AIDER_SHOW_RELEASE_NOTES = 'false';
  env.AIDER_GITIGNORE = 'false';
  env.AIDER_AUTO_COMMITS = 'false';
  env.AIDER_DIRTY_COMMITS = 'false';
  env.AIDER_ATTRIBUTE_AUTHOR = 'false';
  env.AIDER_ATTRIBUTE_COMMITTER = 'false';
  env.AIDER_ATTRIBUTE_CO_AUTHORED_BY = 'false';
  env.AIDER_FANCY_INPUT = 'false';
  env.AIDER_SHOW_MODEL_WARNINGS = 'false';
  env.AIDER_CHECK_MODEL_ACCEPTS_SETTINGS = 'false';
  env.AIDER_DARK_MODE = 'false';
  env.AIDER_LIGHT_MODE = 'false';
  env.AIDER_PRETTY = 'false';
  env.AIDER_STREAM = 'false';
  env.AIDER_YES_ALWAYS = 'true';
  env.AIDER_DISABLE_PLAYWRIGHT = 'true';
  env.AIDER_ENCODING = 'utf-8';
  return env;
}

function buildResearchPrompt(context) {
  const sampleBuckets = (context.aiSelectionBuckets || []).map((bucket) => ({
    id: bucket.id,
    label: bucket.label,
    description: bucket.description,
    tours: bucket.tours.map((tour, index) => ({
      rank: index + 1,
      id: tour.id,
      title: tour.title,
      destination: tour.destination,
      duration: tour.duration,
      price: tour.price,
      priceUnit: tour.priceUnit,
      departureDates: tour.departureDates,
      transportType: tour.transportType,
      bookingUrl: tour.bookingUrl,
      highlights: tour.highlights,
      tags: tour.tags,
      editorialReasons: tour.editorialReasons,
    })),
  }));

  return [
    '你是每周旅游选题研究员，不是写手。',
    '请基于天气、时令和候选线路，做本周公众号选题研究。',
    '只输出 JSON，不要输出任何解释或 Markdown。',
    'JSON 必须包含这些字段：',
    'opening_weather_summary, seasonal_observations, recommendation_groups, featured_route_ids, editorial_risks, duplicate_watchouts',
    '要求：',
    '- recommendation_groups 总条数要凑满 25 条',
    '- recommendation_groups 合计必须正好 25 条，不要写成 30 条、40 条。',
    '- 不要把雅泡/带池/温泉写成词义解释题，只判断值不值得推荐',
    '- 要主动压制同质化',
    '- 不要完全照抄分数或现成入选结果，要结合天气、时令和文案可写性重新挑重点线路',
    '- featured_route_ids 只保留 6 条重点线路，且同一线路家族不要重复霸榜。',
    '',
    `运行日期：${context.runDate}`,
    `季节：${context.season}`,
    `天气：${context.weatherOutlook?.headline || '暂无'}`,
    `时令提示：${(context.seasonalOutlook || []).join(' | ')}`,
    '',
    '分桶候选线路 JSON：',
    JSON.stringify(sampleBuckets, null, 2),
  ].join('\n');
}

function compactTourForAgent(tour) {
  return {
    id: tour.id,
    title: tour.title,
    destination: tour.destination,
    duration: tour.duration,
    price: tour.price,
    priceUnit: tour.priceUnit,
    departureDates: (tour.departureDates || []).slice(0, 4),
    transportType: tour.transportType,
    bookingUrl: tour.bookingUrl,
    highlights: (tour.highlights || []).slice(0, 5),
    tags: (tour.tags || []).slice(0, 5),
    articleImages: (tour.articleImages || []).slice(0, 2),
    editorialReasons: (tour.editorialReasons || []).slice(0, 4),
  };
}

function compactGroupForAgent(group) {
  return {
    id: group.id,
    label: group.label,
    description: group.description,
    tours: (group.tours || []).map(compactTourForAgent),
  };
}

function buildAgentContextPayload(context) {
  return {
    runDate: context.runDate,
    season: context.season,
    weekWindow: context.weekWindow,
    weatherOutlook: context.weatherOutlook,
    seasonalOutlook: context.seasonalOutlook,
    aiSelectionBuckets: (context.aiSelectionBuckets || []).map(compactGroupForAgent),
    recommendationGroups: (context.recommendationGroups || []).map(compactGroupForAgent),
    selectedTours: (context.selectedTours || []).map(compactTourForAgent),
  };
}

const TITLE_TOKEN_STOPWORDS = new Set([
  '广州', '往返', '纯玩', '品质', '直通车', '高铁', '动车', '双飞', '双动', '一家一团',
  '等待确认', '酒店', '豪华', '超豪华', '亲子', '情侣', '暑期', '周末', '自由行',
  '天', '日', '游', '线', '团', '版', '大巴',
]);

function normalizeRouteToken(value) {
  return String(value || '')
    .normalize('NFKC')
    .replace(/（[^）]*）|\([^)]*\)|【[^】]*】|<[^>]*>/g, ' ')
    .replace(/\d+\s*[天日晚]\b/gu, ' ')
    .replace(/[＊*|/、，。,.\-—_:：；（）()\[\]【】<>《》]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function deriveTitleTokens(title) {
  return normalizeRouteToken(title)
    .split(/\s+/)
    .filter((token) => token && token.length >= 2 && !TITLE_TOKEN_STOPWORDS.has(token));
}

function deriveTourFamilyKey(tour) {
  const tokens = deriveTitleTokens(tour?.title || '');
  if (tokens.length > 0) return tokens.slice(0, 3).join('|');
  return normalizeRouteToken(tour?.destination || '') || String(tour?.id || 'misc');
}

function deriveTourDestinationKey(tour) {
  const destination = normalizeRouteToken(tour?.destination || '');
  if (destination) return destination;

  const titleTokens = deriveTitleTokens(tour?.title || '');
  if (titleTokens.length > 0) return titleTokens[0];
  return String(tour?.id || 'misc');
}

function buildTourLookup(context) {
  const map = new Map();
  for (const tour of context.candidateTours || []) map.set(tour.id, tour);
  for (const tour of context.selectedTours || []) map.set(tour.id, tour);
  for (const bucket of context.aiSelectionBuckets || []) {
    for (const tour of bucket.tours || []) {
      map.set(tour.id, tour);
    }
  }
  return map;
}

function normalizeResearch(research, context) {
  const lookup = buildTourLookup(context);
  const groups = Array.isArray(research?.recommendation_groups) ? research.recommendation_groups : [];
  const routeUsage = new Map();
  const familyUsage = new Map();
  const destinationUsage = new Map();
  let total = 0;

  const normalizedGroups = groups
    .map((group) => {
      const recommendations = Array.isArray(group?.recommendations) ? group.recommendations : [];
      const picked = [];
      for (const item of recommendations) {
        const tourId = item?.tour_id;
        if (!tourId || !lookup.has(tourId)) continue;
        const tour = lookup.get(tourId);
        const familyKey = deriveTourFamilyKey(tour);
        const destinationKey = deriveTourDestinationKey(tour);
        if ((routeUsage.get(tourId) || 0) >= 2) continue;
        if ((familyUsage.get(familyKey) || 0) >= 2) continue;
        if ((destinationUsage.get(destinationKey) || 0) >= 3) continue;
        picked.push({
          tour_id: tourId,
          title: tour.title,
          reason: item?.reason || '',
          editorial_angle: item?.editorial_angle || '',
        });
        routeUsage.set(tourId, (routeUsage.get(tourId) || 0) + 1);
        familyUsage.set(familyKey, (familyUsage.get(familyKey) || 0) + 1);
        destinationUsage.set(destinationKey, (destinationUsage.get(destinationKey) || 0) + 1);
        total += 1;
        if (total >= 25) break;
      }
      if (picked.length === 0) return null;
      return {
        ...group,
        recommendations: picked,
      };
    })
    .filter(Boolean);

  const fallbackGroups = (context.recommendationGroups || []).map((group) => ({
    group_id: group.id,
    group_label: group.label,
    recommendations: (group.tours || []).map((tour) => ({
      tour_id: tour.id,
      title: tour.title,
      reason: (tour.editorialReasons || [])[0] || '',
      editorial_angle: (tour.editorialReasons || [])[3] || '',
    })),
  }));

  for (const group of fallbackGroups) {
    if (total >= 25) break;
    const existing =
      normalizedGroups.find((item) => item.group_id === group.group_id || item.group_label === group.group_label) ||
      (() => {
        const created = { ...group, recommendations: [] };
        normalizedGroups.push(created);
        return created;
      })();
    for (const item of group.recommendations) {
      if (total >= 25) break;
      if ((existing.recommendations || []).some((entry) => entry.tour_id === item.tour_id)) continue;
      const tour = lookup.get(item.tour_id);
      if (!tour) continue;
      const familyKey = deriveTourFamilyKey(tour);
      const destinationKey = deriveTourDestinationKey(tour);
      if ((routeUsage.get(item.tour_id) || 0) >= 2) continue;
      if ((familyUsage.get(familyKey) || 0) >= 2) continue;
      if ((destinationUsage.get(destinationKey) || 0) >= 3) continue;
      existing.recommendations.push({ ...item });
      routeUsage.set(item.tour_id, (routeUsage.get(item.tour_id) || 0) + 1);
      familyUsage.set(familyKey, (familyUsage.get(familyKey) || 0) + 1);
      destinationUsage.set(destinationKey, (destinationUsage.get(destinationKey) || 0) + 1);
      total += 1;
    }
  }

  const normalizedFeatured = [];
  const featuredIds = Array.isArray(research?.featured_route_ids) ? research.featured_route_ids : [];
  const featuredFamilyUsage = new Map();
  const featuredDestinationUsage = new Map();

  const tryPickFeatured = (tourId) => {
    if (!tourId || normalizedFeatured.includes(tourId)) return false;
    const tour = lookup.get(tourId);
    if (!tour) return false;
    const familyKey = deriveTourFamilyKey(tour);
    const destinationKey = deriveTourDestinationKey(tour);
    if ((featuredFamilyUsage.get(familyKey) || 0) >= 1) return false;
    if ((featuredDestinationUsage.get(destinationKey) || 0) >= 1) return false;
    normalizedFeatured.push(tourId);
    featuredFamilyUsage.set(familyKey, (featuredFamilyUsage.get(familyKey) || 0) + 1);
    featuredDestinationUsage.set(destinationKey, (featuredDestinationUsage.get(destinationKey) || 0) + 1);
    return true;
  };

  for (const tourId of featuredIds) {
    if (normalizedFeatured.length >= 6) break;
    tryPickFeatured(tourId);
  }

  for (const group of normalizedGroups) {
    for (const item of group.recommendations || []) {
      if (normalizedFeatured.length >= 6) break;
      tryPickFeatured(item.tour_id);
    }
    if (normalizedFeatured.length >= 6) break;
  }

  for (const tour of context.selectedTours || []) {
    if (normalizedFeatured.length >= 6) break;
    tryPickFeatured(tour.id);
  }

  return {
    ...research,
    recommendation_groups: normalizedGroups,
    featured_route_ids: normalizedFeatured,
  };
}

function applyResearchSelectionToContext(context, research) {
  const lookup = buildTourLookup(context);
  const selectedTours = (research?.featured_route_ids || [])
    .map((tourId) => lookup.get(tourId))
    .filter(Boolean)
    .slice(0, 6);
  if (selectedTours.length === 0) return context;
  return {
    ...context,
    selectedTours,
  };
}

function buildWriterPrompt(context, researchJson, variantIndex) {
  return [
    '你是资深旅行编辑，要写公众号文章，而不是解释题面。',
    '请根据给定 context 和 research JSON 输出完整 Markdown 文章。',
    '必须包含 frontmatter：title, summary, author, cover。',
    '结构必须是：',
    '1. 本周天气与出游节奏',
    '2. 本周25条分组推荐速览',
    '3. 这周更值得细看的 6 条重点线路',
    '4. 结尾提醒',
    '要求：',
    '- author 固定写 "老广旅行"',
    '- 不要出现“可以理解为”“别误会成”“模型判断”',
    '- 导语至少 1 张图，每条重点线路至少 1 张图',
    '- 每条重点线路都要有 [查看行程](链接)',
    '- “本周25条分组推荐速览”严格使用 research JSON 里清洗后的推荐结果，合计正好 25 条，不要私自扩成 30 条以上。',
    '- 重点线路优先使用 featured_route_ids 对应的 6 条，不要再换回一堆同区域同玩法的近亲线路。',
    `- 当前是候选版本 ${variantIndex}，请把标题、导语和侧重点与另一版拉开`,
    `- 阅读原文固定：${getDefaultWebsiteUrl()}`,
    '',
    'research JSON：',
    JSON.stringify(researchJson, null, 2),
    '',
    'context JSON：',
    JSON.stringify(buildAgentContextPayload(context), null, 2),
  ].join('\n');
}

function buildReviewerPrompt(context, researchJson, candidates) {
  return [
    '你是终审编辑，请从两篇候选稿里选出更适合发公众号的一篇，并直接输出修订后的最终 Markdown。',
    '只能输出最终 Markdown，不要解释。',
    '终审重点：文案口吻、天气开头、25条速览、重点线路差异、图片、链接、真实性。',
    '',
    'research JSON：',
    JSON.stringify(researchJson, null, 2),
    '',
    'context JSON：',
    JSON.stringify(buildAgentContextPayload(context), null, 2),
    '',
    '候选稿 A：',
    candidates[0],
    '',
    '候选稿 B：',
    candidates[1] || '',
  ].join('\n');
}

function runAiderMessage({ cwd, prompt, outputPath, model }) {
  return new Promise((resolve, reject) => {
    const env = buildAiderEnv();
    if (!env.AIDER_OPENAI_API_KEY) {
      reject(new Error('Missing DeepSeek token for Aider. Expected DEEPSEEK_API_KEY in environment.'));
      return;
    }

    const sessionDir = path.join(cwd, '.tmp-aider-session');
    ensureDir(sessionDir);
    const historyPath = path.join(sessionDir, `${path.basename(outputPath)}.llm-history.log`);
    const historyInputPath = path.join(sessionDir, '.aider.input.history');
    const historyChatPath = path.join(sessionDir, '.aider.chat.history.md');
    const messagePath = path.join(sessionDir, `${path.basename(outputPath)}.prompt.md`);
    const resolvedModel = normalizeAiderModel(model || env.AIDER_MODEL || DEFAULT_AIDER_MODEL);
    fs.writeFileSync(messagePath, prompt, 'utf8');

    const args = [
      '--model',
      resolvedModel,
      '--openai-api-key',
      env.AIDER_OPENAI_API_KEY,
      '--openai-api-base',
      env.AIDER_OPENAI_API_BASE,
      '--message-file',
      messagePath,
      '--yes-always',
      '--no-git',
      '--no-gitignore',
      '--no-auto-commits',
      '--no-dirty-commits',
      '--no-detect-urls',
      '--map-tokens',
      '0',
      '--map-refresh',
      'manual',
      '--input-history-file',
      historyInputPath,
      '--chat-history-file',
      historyChatPath,
      '--llm-history-file',
      historyPath,
      '--no-pretty',
      '--no-stream',
      '--no-check-update',
      '--no-show-model-warnings',
      '--no-check-model-accepts-settings',
      '--encoding',
      'utf-8',
      '--line-endings',
      'lf',
    ];

    const child = spawn(getAiderBinary(), args, {
      cwd: sessionDir,
      stdio: ['ignore', 'pipe', 'pipe'],
      env,
    });

    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => {
      stdout += String(chunk);
    });
    child.stderr.on('data', (chunk) => {
      stderr += String(chunk);
    });
    child.on('error', reject);
    child.on('close', (code) => {
      const combined = `${stdout}\n${stderr}`.trim();
      if (code !== 0) {
        reject(new Error(`aider failed (${code})\n${combined}`.trim()));
        return;
      }

      const historyText = fs.existsSync(historyPath) ? fs.readFileSync(historyPath, 'utf8') : '';
      const reply = extractAiderReplyFromHistory(historyText || combined);
      if (!reply) {
        reject(new Error(`aider returned no assistant reply\n${combined}`.trim()));
        return;
      }

      fs.writeFileSync(outputPath, `${reply.trim()}\n`, 'utf8');
      resolve({ stdout, stderr, reply, model: resolvedModel });
    });
  });
}

export async function generateWeeklyArticleWithAgentCli(rootDir, options = {}) {
  loadEnvFiles(rootDir);
  const runDate = options.runDate || toDateKey();
  const tours = readToursData(rootDir);
  const execRunner = options.execRunner || runAiderMessage;

  let weatherOutlook = options.weatherOutlook;
  if (!weatherOutlook) {
    try {
      weatherOutlook = await fetchWeatherOutlook({ location: '广州' });
    } catch (error) {
      console.warn(error instanceof Error ? error.message : String(error));
    }
  }

  const context = buildWeeklyArticleContext(tours, {
    runDate,
    windowDays: options.windowDays,
    maxCandidates: options.maxCandidates,
    maxArticleItems: options.maxArticleItems,
    weatherOutlook,
    generationMode: 'aider-deepseek-multi-pass',
  });

  const outDir = options.outDir ? path.resolve(rootDir, options.outDir) : path.join(rootDir, 'weekly-wechat-posts', runDate);
  ensureDir(outDir);

  writeJson(path.join(outDir, 'weekly-context.json'), context);
  writeJson(path.join(outDir, 'selected-tours.json'), context.selectedTours);

  const aiderModel = options.aiderModel || process.env.AIDER_MODEL || DEFAULT_AIDER_MODEL;
  const researchPath = path.join(outDir, 'agent-research.json');
  const variantCount = Math.max(2, Number(options.variantCount || DEFAULT_CANDIDATE_VARIANTS));

  await execRunner({
    cwd: rootDir,
    prompt: buildResearchPrompt(context),
    outputPath: researchPath,
    model: aiderModel,
  });

  const researchRaw = parseJsonResponse(fs.readFileSync(researchPath, 'utf8'));
  const research = normalizeResearch(researchRaw, context);
  fs.writeFileSync(researchPath, `${JSON.stringify(research, null, 2)}\n`, 'utf8');
  const writingContext = applyResearchSelectionToContext(context, research);
  writeJson(path.join(outDir, 'selected-tours.json'), writingContext.selectedTours);
  const candidatePaths = [];
  const candidates = [];

  await Promise.all(
    Array.from({ length: variantCount }, async (_, index) => {
      const variantNo = index + 1;
      const outputPath = path.join(outDir, `candidate-${variantNo}.md`);
      candidatePaths.push(outputPath);
      await execRunner({
        cwd: rootDir,
        prompt: buildWriterPrompt(writingContext, research, variantNo),
        outputPath,
        model: aiderModel,
      });
      candidates[index] = stripMarkdownFence(fs.readFileSync(outputPath, 'utf8'));
    }),
  );

  const finalPath = path.join(outDir, 'article.raw.md');
  await execRunner({
    cwd: rootDir,
    prompt: buildReviewerPrompt(writingContext, research, candidates),
    outputPath: finalPath,
    model: aiderModel,
  });

  const finalArticle = ensureArticleFrontmatter(
    stripMarkdownFence(fs.readFileSync(finalPath, 'utf8')),
    writingContext,
    candidates,
  );
  fs.writeFileSync(finalPath, finalArticle, 'utf8');
  const validation = validateGeneratedArticle(finalArticle, writingContext);
  writeJson(path.join(outDir, 'validation.json'), validation);
  writeJson(path.join(outDir, 'generation-meta.json'), {
    runDate,
    generatedAt: new Date().toISOString(),
    generationMode: context.generationMode,
    aiderModel: normalizeAiderModel(aiderModel),
    validationOk: validation.ok,
    candidatePaths: candidatePaths.map((filePath) => path.relative(rootDir, filePath)),
  });

  return {
    context: writingContext,
    outDir,
    article: finalArticle,
    validation,
    research,
    candidatePaths,
    finalPath,
  };
}

export {
  extractAiderReplyFromHistory,
  normalizeResearch,
  normalizeAiderModel,
};

if (import.meta.url === `file://${process.argv[1]}`) {
  const rootDir = process.cwd();
  const options = parseArgs(process.argv.slice(2));

  generateWeeklyArticleWithAgentCli(rootDir, options)
    .then((result) => {
      process.stdout.write(`${JSON.stringify({
        ok: true,
        outDir: path.relative(rootDir, result.outDir),
        generationMode: result.context.generationMode,
        validationOk: result.validation.ok,
      }, null, 2)}\n`);
    })
    .catch((error) => {
      console.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    });
}
