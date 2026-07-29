const API_ROOT = 'https://api.weixin.qq.com/cgi-bin';

export function getLatestPublishedArticle(payload) {
  if (!payload || payload.errcode) {
    const message = payload?.errmsg || `WeChat API error ${payload?.errcode ?? 'unknown'}`;
    throw new Error(message);
  }

  const item = Array.isArray(payload.item) ? payload.item[0] : null;
  if (!item) {
    return null;
  }

  const content = item.content || {};
  const newsItem = Array.isArray(content.news_item) ? content.news_item[0] : null;
  const articleId = item.article_id;

  if (!articleId) {
    throw new Error('The latest published item has no article_id');
  }

  return {
    articleId,
    title: newsItem?.title || '',
    url: newsItem?.url || '',
    updateTime: Number(content.update_time ?? item.update_time ?? 0),
  };
}

export function buildCheckResult(payload, previousArticleId = '') {
  const latestArticle = getLatestPublishedArticle(payload);
  const previousId = previousArticleId || '';

  return {
    checkedAt: new Date().toISOString(),
    latestArticle,
    previousArticleId: previousId || null,
    hasNewArticle: Boolean(latestArticle && previousId && latestArticle.articleId !== previousId),
    shouldUpdateBaseline: Boolean(latestArticle && latestArticle.articleId !== previousId),
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

async function fetchLatestPublishedArticle(accessToken) {
  const url = new URL(`${API_ROOT}/freepublish/batchget`);
  url.searchParams.set('access_token', accessToken);

  return fetchJson(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ offset: 0, count: 1, no_content: 1 }),
  });
}

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

async function main() {
  const args = parseArgs(process.argv);
  const appId = args.get('app-id') || process.env.WECHAT_APP_ID;
  const appSecret = args.get('app-secret') || process.env.WECHAT_APP_SECRET;
  const previousArticleId = args.get('previous-article-id') || '';

  if (!appId || !appSecret) {
    throw new Error('WECHAT_APP_ID and WECHAT_APP_SECRET are required');
  }

  const accessToken = await getAccessToken(appId, appSecret);
  const payload = await fetchLatestPublishedArticle(accessToken);
  const result = buildCheckResult(payload, previousArticleId);
  console.log(JSON.stringify(result));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
