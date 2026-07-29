import assert from 'node:assert/strict';
import {
  SUP_ORDER_URI,
  TARGET_PRODUCTS,
  buildAppToken,
  buildAuthHeaders,
  buildOrderPayload,
  normalizeGoodsList,
  resolveTargetGoods,
} from './sup_protocol.mjs';

assert.equal(
  buildAppToken('app', 'secret', SUP_ORDER_URI, 1656057600),
  '19c08869c0953a92f1550e7d5b1f3b611510d9ac',
);
assert.deepEqual(buildAuthHeaders('app', 'secret', SUP_ORDER_URI, 1656057600), {
  AppId: 'app',
  AppToken: '19c08869c0953a92f1550e7d5b1f3b611510d9ac',
  AppTimestamp: '1656057600',
});

const goods = normalizeGoodsList({
  code: 0,
  data: {
    data: [
      { serial_number: 'goods-18958', name: TARGET_PRODUCTS[0].name, buy_min_limit: 1, buy_max_limit: 400, buy_rate: 1, is_close: 2 },
      { serial_number: 'goods-18944', name: TARGET_PRODUCTS[1].name, buy_min_limit: 10, buy_max_limit: 2000, buy_rate: 10, is_close: 2 },
    ],
  },
});
const first = resolveTargetGoods(goods, TARGET_PRODUCTS[0], '');
assert.equal(first.serial_number, 'goods-18958');
assert.equal(resolveTargetGoods(goods, TARGET_PRODUCTS[1], '').serial_number, 'goods-18944');
assert.deepEqual(buildOrderPayload(first, TARGET_PRODUCTS[0], 'https://mp.weixin.qq.com/s/article-3'), {
  goods_sn: 'goods-18958',
  buy_number: 3,
  buy_params: { url: 'https://mp.weixin.qq.com/s/article-3' },
});
assert.deepEqual(buildOrderPayload(goods[1], TARGET_PRODUCTS[1], 'https://example.com').buy_number, 10);
assert.throws(() => buildOrderPayload(goods[1], { ...TARGET_PRODUCTS[1], quantity: 11 }, 'https://example.com'), /multiple/);
assert.throws(() => normalizeGoodsList({ code: 100, message: 'IP not allowed' }), /IP not allowed/);

console.log('sup_protocol tests passed');
