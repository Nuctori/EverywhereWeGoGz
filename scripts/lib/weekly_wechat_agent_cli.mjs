import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import {
  buildTourDetailUrl,
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
const MAX_FAMILY_REPEAT_PER_RESEARCH = 1;
const MAX_DESTINATION_REPEAT_PER_RESEARCH = 2;
const DEFAULT_REPAIR_ATTEMPTS = 1;
const RESEARCH_EXCLUSION_HINTS = ['降级', '季节已过', '无清凉', '无季节红利', '非本周主推', '夏季闷热'];
const TOUR_FAMILY_PATTERNS = [
  { id: 'detian', keywords: ['德天', '通灵', '明仕', '靖西', '鹅泉', '崇左', '古龙山'] },
  { id: 'weizhou', keywords: ['涠洲', '北海', '鳄鱼山', '石螺口', '银滩'] },
  { id: 'guilin_yangshuo', keywords: ['桂林', '阳朔', '漓江', '遇龙河'] },
  { id: 'pingtan', keywords: ['平潭', '猴研岛', '蓝眼泪', '风车海'] },
  { id: 'doublemoon', keywords: ['双月湾', '檀悦', '华美达'] },
  { id: 'changsha', keywords: ['长沙', '岳阳', '武汉', '黄鹤楼', '岳阳楼', '东湖'] },
];

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
  const stripped = stripMarkdownFence(text).replace(/^\s*json\s*\n/i, '').trim();
  return JSON.parse(stripped);
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
    '- 不要把雅泡/带池/温泉写成词义解释题，只判断值不值得推荐。',
    '- 要主动压制同质化',
    '- 德天/涠洲/桂林/平潭/双月湾这类同家族、同核心景区、同城市酒店变体，不要重复铺开；每个家族只保留当周最强的一条。',
    '- 不要完全照抄分数或现成入选结果，要结合天气、时令和文案可写性重新挑重点线路',
    '- featured_route_ids 只保留 6 条重点线路，且同一线路家族不要重复霸榜。',
    '- research 里的文字是给编辑团队内部看的，不是给读者看的。seasonal_observations、reason、editorial_angle 都要写成内部判断标签，不要写成可直接复述到成稿里的整句文案。',
    '- 对存在季节错位、信息冲突、理由过弱的线路，要直接降级或换线，不要输出“已过季但……”“作为补充”“预算有限也可”这种找补理由。',
    '- 夏季优先把山水、森林、峡谷、漂流、溪水、海岛、近海、泳池水世界这些真正带清凉体感的线放前面；纯温泉酒店线只能作为周末放松补位。',
    '- recommendation_groups 每条都请给出简短内部 reason，格式像“丰水期瀑布体感强，3天动车适合亲子”，不要写成面向读者的整段文案，也不要写“当前数据里……”“能打的……”这类口头禅。',
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
    detailUrl: buildTourDetailUrl(tour),
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

function detectTourFamilyId(tour) {
  const text = `${tour?.title || ''} ${tour?.destination || ''}`;
  const matched = TOUR_FAMILY_PATTERNS.find((pattern) =>
    pattern.keywords.some((keyword) => text.includes(keyword)),
  );
  return matched?.id || '';
}

function deriveTourFamilyKey(tour) {
  const detected = detectTourFamilyId(tour);
  if (detected) return detected;
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

function collectResearchExcludedIds(research) {
  const excluded = new Set();
  const lines = [
    ...(Array.isArray(research?.editorial_risks) ? research.editorial_risks : []),
    ...(Array.isArray(research?.duplicate_watchouts) ? research.duplicate_watchouts : []),
  ];

  for (const rawLine of lines) {
    const line = String(rawLine || '');
    const ids = [...line.matchAll(/tour_[\w-]+/g)].map((match) => match[0]);
    if (ids.length === 0) continue;

    if (RESEARCH_EXCLUSION_HINTS.some((hint) => line.includes(hint))) {
      ids.forEach((tourId) => excluded.add(tourId));
    }

    const keepMatch = line.match(/只保留\s+(tour_[\w-]+)/);
    if (keepMatch) {
      const kept = keepMatch[1];
      for (const tourId of ids) {
        if (tourId !== kept) excluded.add(tourId);
      }
    }
  }

  return excluded;
}

function normalizeResearch(research, context) {
  const lookup = buildTourLookup(context);
  const excludedIds = collectResearchExcludedIds(research);
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
        if (excludedIds.has(tourId)) continue;
        const tour = lookup.get(tourId);
        const familyKey = deriveTourFamilyKey(tour);
        const destinationKey = deriveTourDestinationKey(tour);
        if ((routeUsage.get(tourId) || 0) >= 1) continue;
        if ((familyUsage.get(familyKey) || 0) >= MAX_FAMILY_REPEAT_PER_RESEARCH) continue;
        if ((destinationUsage.get(destinationKey) || 0) >= MAX_DESTINATION_REPEAT_PER_RESEARCH) continue;
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
      if (excludedIds.has(item.tour_id)) continue;
      const tour = lookup.get(item.tour_id);
      if (!tour) continue;
      const familyKey = deriveTourFamilyKey(tour);
      const destinationKey = deriveTourDestinationKey(tour);
      if ((routeUsage.get(item.tour_id) || 0) >= 1) continue;
      if ((familyUsage.get(familyKey) || 0) >= MAX_FAMILY_REPEAT_PER_RESEARCH) continue;
      if ((destinationUsage.get(destinationKey) || 0) >= MAX_DESTINATION_REPEAT_PER_RESEARCH) continue;
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
    if (excludedIds.has(tourId)) return false;
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
  const recommendationGroups = (Array.isArray(research?.recommendation_groups) ? research.recommendation_groups : [])
    .map((group, index) => {
      const tours = (Array.isArray(group?.recommendations) ? group.recommendations : [])
        .map((item) => lookup.get(item?.tour_id))
        .filter(Boolean);
      if (tours.length === 0) return null;
      return {
        id: group?.group_id || group?.id || `research-group-${index + 1}`,
        label: group?.group_label || group?.label || `推荐组${index + 1}`,
        description: group?.angle || group?.editorial_angle || '',
        tours,
      };
    })
    .filter(Boolean);
  const curatedCandidateTours = recommendationGroups.flatMap((group) => group.tours || []);
  const selectedTours = (research?.featured_route_ids || [])
    .map((tourId) => lookup.get(tourId))
    .filter(Boolean)
    .slice(0, 6);
  return {
    ...context,
    selectedTours: selectedTours.length > 0 ? selectedTours : context.selectedTours,
    recommendationGroups: recommendationGroups.length > 0 ? recommendationGroups : context.recommendationGroups,
    aiSelectionBuckets: recommendationGroups.length > 0 ? recommendationGroups : context.aiSelectionBuckets,
    candidateTours: curatedCandidateTours.length > 0 ? curatedCandidateTours : context.candidateTours,
  };
}

function buildWriterPrompt(context, researchJson, variantIndex) {
  return [
    '你是资深旅行编辑，要写公众号文章，而不是解释题面。',
    '请根据给定 context 和 research JSON 输出完整 Markdown 文章。',
    '必须包含 frontmatter：title, summary, author, cover。',
    '结构必须是：',
    '1. 本周天气与出游节奏',
    '2. 本周25条推荐（可分组，但必须逐条展开）',
    '3. 结尾提醒',
    '要求：',
    '- author 固定写 "老广旅行"',
    '- 不要出现“速览”“当前数据里”“可以理解为”“别误会成”“模型判断”“候选线路”“综合排序”',
    '- 不要出现“当前数据里能打的清凉感主要是”“带池、酒店放松类线路可保留”“作为补充”“适合预算有限”“樱花已过季”“季节红利弱”这种研究备注或找补句。',
    '- 不要写“同第2条”“同第4条”“侧重亲子”“侧重度假”这种拿前文凑数的写法；每条都必须像独立推荐。',
    '- 导语至少 1 张图，每条推荐至少 1 张图',
    '- 每条推荐都要有 [查看行程](链接)；链接统一使用 detailUrl，不要直接输出 bookingUrl',
    '- 25 条推荐严格使用 research JSON 里清洗后的推荐结果，合计正好 25 条，不要私自扩成 30 条以上。',
    '- 优先用 featured_route_ids 对应的 6 条作为写得更深的线路，但正文里 25 条都要有完整推荐文案。',
    '- 每条推荐至少 50 个中文字符，至少 3 句，必须写出为什么这周值得去、适合谁、现场体验或节奏感、班期/价格/交通提醒。',
    '- 交代受众时不要每条都机械写“适合……”，全篇尽量少用这个词，改成“带娃去会更省心 / 情侣去会更松弛 / 周末想换空气的人会更喜欢 / 上班族请一天假也走得动”这种自然说法。',
    '- 山水清凉组优先写真山水、森林、漂流、亲水、泳池、近海，不要让纯温泉酒店线挤占清凉主位。',
    '- 每条推荐都要先写“为什么现在去会舒服/会值”，再写适合谁、现场最有记忆点的画面，最后自然带出班期、价格或交通提醒。',
    '- 文案要让人想出发，不要像给推荐结果写批注，也不要解释“为什么把温泉算作清凉”“为什么这条放在这个组”。',
    '- 25 条都一条一条写，不要再出现“其中6条深度推荐”这类旧结构。',
    '- 只能写 context JSON 里的 recommendationGroups / selectedTours 已经列出的线路，不要从旧候选池里再额外挑新线。',
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
    '终审重点：文案口吻、天气开头、25条逐条推荐、是否种草、图片、站内详情链接、二维码位置、真实性。',
    '硬性要求：不要出现“速览”“当前数据里”“可以理解为”“别误会成”“模型判断”“候选线路”“综合排序”“作为补充”“适合预算有限”“樱花已过季”“其中6条深度推荐”“同第2条”“同第4条”“侧重亲子”“侧重度假”；每条推荐至少 50 个中文字符。',
    '全篇不要反复把“适合”写成统一句式；交代受众时请改写成更自然的表达，不要 25 条都像模板填空。',
    '请重点删掉像内部批注、解释推荐逻辑、找补季节错位、机械重复天气句式的写法。成稿必须像给读者看的旅行推荐，而不是像在交作业。',
    '只能保留 context / research 里已经圈定的 25 条线路，不要把旧候选池里的相似线路再捞回来凑数。',
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

function buildRepairPrompt(context, researchJson, article, validation) {
  return [
    '你是返工编辑，上一版文章没有通过终审。',
    '请只输出修订后的完整 Markdown 成稿，不要解释。',
    '请在保留结构和大部分有效内容的前提下，逐项修掉这些硬伤：',
    ...(validation?.issues || []).map((issue) => `- ${issue}`),
    '返工要求：',
    '- 删除“适合预算有限”“季节虽过”“已过季”“同第2条”“侧重亲子”“侧重度假”这类做题腔或找补句。',
    '- 同一个 detailUrl 不能在正文里重复出现；如果两条路线太像，只保留更像当周主推的一条，换成别的候选。',
    '- 不要把“适合……”写成每条都重复的模板句，换成更自然的受众表达。',
    '- 必须保持 25 条推荐，每条独立成段，至少 3 句。',
    '- 只能使用 context / research 中真实存在的线路和事实，不要编造。',
    '',
    'research JSON：',
    JSON.stringify(researchJson, null, 2),
    '',
    'context JSON：',
    JSON.stringify(buildAgentContextPayload(context), null, 2),
    '',
    '待修订成稿：',
    article,
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
  let resolvedArticle = finalArticle;
  let validation = validateGeneratedArticle(resolvedArticle, writingContext);

  const repairAttempts = Math.max(0, Number(options.repairAttempts ?? DEFAULT_REPAIR_ATTEMPTS));
  for (let attempt = 0; attempt < repairAttempts && !validation.ok; attempt += 1) {
    const repairedPath = path.join(outDir, `article.repair-${attempt + 1}.md`);
    await execRunner({
      cwd: rootDir,
      prompt: buildRepairPrompt(writingContext, research, resolvedArticle, validation),
      outputPath: repairedPath,
      model: aiderModel,
    });
    resolvedArticle = ensureArticleFrontmatter(
      stripMarkdownFence(fs.readFileSync(repairedPath, 'utf8')),
      writingContext,
      [resolvedArticle, ...candidates],
    );
    fs.writeFileSync(finalPath, resolvedArticle, 'utf8');
    validation = validateGeneratedArticle(resolvedArticle, writingContext);
  }

  fs.writeFileSync(finalPath, resolvedArticle, 'utf8');
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
    article: resolvedArticle,
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
  parseJsonResponse,
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
