import assert from 'node:assert/strict';
import {
  buildOrderKey,
  createOrders,
  getCompletedArticleIds,
  getPendingOrders,
  mergeProcessedArticleIds,
  parseCompletedOrderKeys,
} from './run_wechat_sup_orders.mjs';

assert.deepEqual(parseCompletedOrderKeys('["article-1:18958"]'), ['article-1:18958']);
assert.deepEqual(parseCompletedOrderKeys('article-1:18958,article-2:18944'), [
  'article-1:18958',
  'article-2:18944',
]);
assert.equal(buildOrderKey('article-1', '18958'), 'article-1:18958');

const articles = [
  { articleId: 'article-1', url: 'https://example.com/1' },
  { articleId: 'article-2', url: 'https://example.com/2' },
];
const products = [
  { target: { key: '18958' }, goods: { serial_number: 'sn-1' } },
  { target: { key: '18944' }, goods: { serial_number: 'sn-2' } },
];
const completed = new Set(['article-1:18958']);
assert.deepEqual(
  getPendingOrders(articles, products, completed).map(({ article, target }) => `${article.articleId}:${target.key}`),
  ['article-1:18944', 'article-2:18958', 'article-2:18944'],
);
assert.deepEqual(getCompletedArticleIds(articles, products.map(({ target }) => target), new Set([
  'article-1:18958',
  'article-1:18944',
  'article-2:18958',
])), ['article-1']);

const orderResult = await createOrders(
  [
    { article: articles[0], target: { key: '18958', quantity: 3 }, goods: { serial_number: 'sn-1', buy_min_limit: 1, buy_max_limit: 10, buy_rate: 1, is_close: 2 } },
    { article: articles[0], target: { key: '18944', quantity: 10 }, goods: { serial_number: 'sn-2', buy_min_limit: 1, buy_max_limit: 10, buy_rate: 1, is_close: 2 } },
  ],
  new Set(),
  async (payload) => {
    if (payload.goods_sn === 'sn-2') {
      throw new Error('simulated SUP failure');
    }
    return { data: { order_sn: 'order-1' } };
  },
);
assert.deepEqual(orderResult.orders.map((order) => order.orderSn), ['order-1']);
assert.deepEqual(orderResult.errors.map((error) => error.productKey), ['18944']);
assert.equal(orderResult.completedOrderKeys.has('article-1:18958'), true);
assert.equal(orderResult.completedOrderKeys.has('article-1:18944'), false);
const previousIds = Array.from({ length: 100 }, (_, index) => `old-${index}`);
assert.deepEqual(mergeProcessedArticleIds(previousIds, ['new-article']), [
  'new-article',
  ...previousIds.slice(0, 99),
]);

console.log('run_wechat_sup_orders tests passed');
