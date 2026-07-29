import fs from 'node:fs';
import {
  DEFAULT_SUP_API_BASE_URL,
  SUP_GOODS_LIST_URI,
  SUP_ORDER_URI,
  TARGET_PRODUCTS,
  buildAuthHeaders,
  buildOrderPayload,
  normalizeGoodsList,
  resolveTargetGoods,
} from './sup_protocol.mjs';

export function parseCompletedOrderKeys(value) {
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
      return value.split(',').map((key) => key.trim()).filter(Boolean);
    }
  }

  return [];
}

export function buildOrderKey(articleId, productKey) {
  return `${articleId}:${productKey}`;
}

export function getPendingOrders(newArticles, selectedProducts, completedOrderKeys) {
  return newArticles.flatMap((article) => selectedProducts
    .filter(({ target }) => !completedOrderKeys.has(buildOrderKey(article.articleId, target.key)))
    .map(({ target, goods }) => ({ article, target, goods })));
}

export function getCompletedArticleIds(newArticles, targets, completedOrderKeys) {
  return newArticles
    .filter((article) => targets.every((target) => (
      completedOrderKeys.has(buildOrderKey(article.articleId, target.key))
    )))
    .map((article) => article.articleId);
}

export function mergeProcessedArticleIds(previousIds, completedArticleIds) {
  return [...new Set([...completedArticleIds, ...previousIds])].slice(0, 100);
}

export async function createOrders(pendingOrders, completedOrderKeys, requestOrder) {
  const nextCompletedOrderKeys = new Set(completedOrderKeys);
  const orders = [];
  const errors = [];

  for (const { article, target, goods: product } of pendingOrders) {
    try {
      const payload = buildOrderPayload(product, target, article.url);
      const response = await requestOrder(payload, article, target);
      const order = {
        articleId: article.articleId,
        articleUrl: article.url,
        productKey: target.key,
        quantity: target.quantity,
        orderSn: response.data?.order_sn || response.data?.serial_number || '',
      };
      orders.push(order);
      nextCompletedOrderKeys.add(buildOrderKey(article.articleId, target.key));
    } catch (error) {
      errors.push({
        articleId: article.articleId,
        productKey: target.key,
        message: error.message,
      });
    }
  }

  return { orders, errors, completedOrderKeys: nextCompletedOrderKeys };
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

function writeResult(outputPath, result) {
  const serialized = JSON.stringify(result);
  if (outputPath) {
    fs.writeFileSync(outputPath, `${serialized}\n`, 'utf8');
  }
  console.log(serialized);
}

async function requestJson(baseUrl, appId, appSecret, uri, options = {}) {
  const timestamp = Math.floor(Date.now() / 1000);
  const response = await fetch(`${baseUrl}${uri}`, {
    ...options,
    headers: {
      ...buildAuthHeaders(appId, appSecret, uri, timestamp),
      'content-type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(`SUP HTTP ${response.status}: ${JSON.stringify(payload)}`);
  }
  if (payload.code !== 0) {
    throw new Error(`SUP API error ${payload.code}: ${payload.message || payload.msg || 'unknown error'}`);
  }

  return payload;
}

async function main() {
  const args = parseArgs(process.argv);
  const checkResultPath = args.get('check-result');
  const outputPath = args.get('output');
  const execute = args.get('execute') === 'true';
  const appId = process.env.SUP_APP_ID;
  const appSecret = process.env.SUP_APP_SECRET;
  const baseUrl = (process.env.SUP_API_BASE_URL || DEFAULT_SUP_API_BASE_URL).replace(/\/$/, '');

  if (!checkResultPath) {
    throw new Error('--check-result is required');
  }

  const checkResult = JSON.parse(fs.readFileSync(checkResultPath, 'utf8'));
  const previousIds = Array.isArray(checkResult.previousArticleIds) ? checkResult.previousArticleIds : [];
  const newArticles = Array.isArray(checkResult.newArticles) ? checkResult.newArticles : [];
  const completedOrderKeys = new Set(parseCompletedOrderKeys(process.env.COMPLETED_ORDER_KEYS));

  if (checkResult.baselineInitialized) {
    writeResult(outputPath, {
      status: 'baseline_initialized',
      updateState: true,
      processedArticleIds: checkResult.nextProcessedArticleIds,
      completedOrderKeys: [...completedOrderKeys],
      orders: [],
    });
    return;
  }

  if (newArticles.length === 0) {
    writeResult(outputPath, {
      status: 'no_new_articles',
      updateState: false,
      processedArticleIds: previousIds,
      completedOrderKeys: [...completedOrderKeys],
      orders: [],
    });
    return;
  }

  if (!appId || !appSecret) {
    throw new Error('SUP_APP_ID and SUP_APP_SECRET are required when new articles are found');
  }

  const goodsPayload = await requestJson(baseUrl, appId, appSecret, SUP_GOODS_LIST_URI, { method: 'GET' });
  const goods = normalizeGoodsList(goodsPayload);
  const selectedProducts = TARGET_PRODUCTS.map((target) => ({
    target,
    goods: resolveTargetGoods(goods, target, process.env[target.overrideEnv] || ''),
  }));

  const pendingOrders = getPendingOrders(newArticles, selectedProducts, completedOrderKeys);
  const preflight = pendingOrders.map(({ article, target, goods: product }) => {
    const payload = buildOrderPayload(product, target, article.url);
    return {
      articleId: article.articleId,
      articleUrl: article.url,
      productKey: target.key,
      goodsSn: payload.goods_sn,
      quantity: payload.buy_number,
    };
  });

  if (!execute) {
    writeResult(outputPath, {
      status: 'preflight_only',
      updateState: false,
      processedArticleIds: previousIds,
      completedOrderKeys: [...completedOrderKeys],
      preflight,
      orders: [],
    });
    return;
  }

  const orderResult = await createOrders(
    pendingOrders,
    completedOrderKeys,
    async (payload) => requestJson(baseUrl, appId, appSecret, SUP_ORDER_URI, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  );

  const completedArticleIds = getCompletedArticleIds(
    newArticles,
    TARGET_PRODUCTS,
    orderResult.completedOrderKeys,
  );
  writeResult(outputPath, {
    status: orderResult.errors.length > 0 ? 'partial_failure' : 'orders_created',
    updateState: true,
    processedArticleIds: mergeProcessedArticleIds(previousIds, completedArticleIds),
    completedOrderKeys: [...orderResult.completedOrderKeys].slice(-500),
    preflight,
    orders: orderResult.orders,
    errors: orderResult.errors,
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
