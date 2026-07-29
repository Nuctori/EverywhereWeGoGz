const API_ROOT = 'https://api.weixin.qq.com/cgi-bin';
const DEFAULT_COUNT = 20;
const MAX_TRACKED_ARTICLES = 100;

function parseArgs(argv) {
  const args = new Map();
  for (let index = 2; index < argv.length; index += 1) {
    const key = argv[index];
    if (!key.startsWith('--')) {
      throw new Error(`Unexpected argument: ${key}`);
    }
    args.set(key.slice(2), argv[index + 1] || '');
    index += 1;
  }
  return args;
}

export function parsePreviousArticleIds(value, legacyArticleId = '') {
  if (Array.isArray(value)) {
    return value.filter(Boolean).map(String);
  }

  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.filter(Boolean).map(String);
      }
    } catch {
      return value.split(',').map((id) => id.trim()).filter(Boolean);
    }
  }

  return legacyArticleId ? [String(legacyArticleId)] : [];
}

export function getPublishedArticles(payload) {
  if (!payload || payload.errcode) {
    const message = payload?.errmsg || `WeChat API error ${payload?.errcode ?? 'unknown'}`;
    throw new Error(message);
  }

  const items = Array.isArray(payload.item) ? payload.item : [];
  return items.map((item) => {
    const content = item.content || {};
    const newsItem = Array.isArray(content.news_item) ? content.news_item[0] : null;
    const articleId = item.article_id;

    if (!articleId) {
      throw new Error('A published item has no article_id');
    }

    return {
      articleId,
      title: newsItem?.title || '',
      url: newsItem?.url || '',
      updateTime: Number(content.update_time ?? item.update_time ?? 0),
    };
  });
}

export function getLatestPublishedArticle(payload) {
  return getPublishedArticles(payload)[0] || null;
}

export function buildPublishedArticlesRequest(count) {
  return { offset: 0, count, no_content: 0 };
}

export function buildCheckResult(payload, previousArticleIds = [], options = {}) {
  const articles = getPublishedArticles(payload);
  const previousIds = parsePreviousArticleIds(previousArticleIds);
  const previousSet = new Set(previousIds);
  const baselineInitialized = options.initializeBaseline === true || previousIds.length === 0;
  const newArticles = baselineInitialized
    ? []
    : articles.filter((article) => !previousSet.has(article.articleId));
  const nextProcessedArticleIds = [...new Set([
    ...articles.map((article) => article.articleId),
    ...previousIds,
  ])].slice(0, MAX_TRACKED_ARTICLES);

  return {
    checkedAt: new Date().toISOString(),
    articles,
    newArticles,
    previousArticleIds: previousIds,
    baselineInitialized,
    hasNewArticle: newArticles.length > 0,
    nextProcessedArticleIds,
  };
}

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${JSON.stringify(payload)}`);
  }

  return payload;
}

async function getAccessToken(appId, appSecret) {
  const url = new URL(`${API_ROOT}/token`);
  url.searchParams.set('grant_type', 'client_credential');
  url.searchParams.set('appid', appId);
  url.searchParams.set('secret', appSecret);

  const payload = await fetchJson(url);
  if (payload.errcode) {
    throw new Error(`Failed to get WeChat access token: ${payload.errmsg || payload.errcode}`);
  }

  return payload.access_token;
}

async function fetchPublishedArticles(accessToken, count) {
  const url = new URL(`${API_ROOT}/freepublish/batchget`);
  url.searchParams.set('access_token', accessToken);

  return fetchJson(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(buildPublishedArticlesRequest(count)),
  });
}

async function main() {
  const args = parseArgs(process.argv);
  const appId = args.get('app-id') || process.env.WECHAT_APP_ID;
  const appSecret = args.get('app-secret') || process.env.WECHAT_APP_SECRET;
  const count = Number(args.get('count') || DEFAULT_COUNT);
  const previousArticleIdsRaw = args.get('previous-article-ids') || '';
  const legacyArticleId = args.get('legacy-article-id') || '';
  const previousArticleIds = parsePreviousArticleIds(previousArticleIdsRaw, legacyArticleId);
  const legacyOnlyMigration = parsePreviousArticleIds(previousArticleIdsRaw).length === 0
    && Boolean(legacyArticleId);

  if (!appId || !appSecret) {
    throw new Error('WECHAT_APP_ID and WECHAT_APP_SECRET are required');
  }
  if (!Number.isInteger(count) || count < 1 || count > 100) {
    throw new Error('count must be an integer between 1 and 100');
  }

  const accessToken = await getAccessToken(appId, appSecret);
  const payload = await fetchPublishedArticles(accessToken, count);
  console.log(JSON.stringify(buildCheckResult(payload, previousArticleIds, {
    initializeBaseline: legacyOnlyMigration,
  })));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
