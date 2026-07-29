import { createHash } from 'node:crypto';

export const DEFAULT_SUP_API_BASE_URL = 'https://sup.yileyuns.com';
export const SUP_ORDER_URI = '/openapi/customer/Goods/Buy/';
export const SUP_GOODS_LIST_URI = '/openapi/customer/Goods/List/';

export const TARGET_PRODUCTS = [
  {
    key: '18958',
    name: '公众号文章爱心、拇指、转发三连',
    quantity: 3,
    overrideEnv: 'SUP_GOODS_18958_SN',
  },
  {
    key: '18944',
    name: '精选24小时公众号曲线阅读',
    quantity: 10,
    overrideEnv: 'SUP_GOODS_18944_SN',
  },
];

export function buildAppToken(appId, appSecret, uri, timestamp) {
  return createHash('sha1')
    .update(`${appId}${appSecret}${uri}${timestamp}`, 'utf8')
    .digest('hex');
}

export function buildAuthHeaders(appId, appSecret, uri, timestamp) {
  return {
    AppId: appId,
    AppToken: buildAppToken(appId, appSecret, uri, timestamp),
    AppTimestamp: String(timestamp),
  };
}

export function normalizeGoodsList(payload) {
  if (!payload || payload.code !== 0) {
    throw new Error(`SUP goods list failed: ${payload?.message || payload?.msg || 'unknown error'}`);
  }

  const goods = Array.isArray(payload.data) ? payload.data : payload.data?.data;
  if (!Array.isArray(goods)) {
    throw new Error('SUP goods list response has no data array');
  }

  return goods;
}

export function resolveTargetGoods(goods, target, overrideSerialNumber = '') {
  const serialNumber = overrideSerialNumber.trim();
  if (serialNumber) {
    const selected = goods.find((item) => String(item.serial_number) === serialNumber);
    if (!selected) {
      throw new Error(`${target.key}: configured goods serial number was not found`);
    }
    return selected;
  }

  const matches = goods.filter((item) => String(item.name || '').includes(target.name));
  if (matches.length !== 1) {
    throw new Error(`${target.key}: expected one goods match for ${target.name}, found ${matches.length}`);
  }

  return matches[0];
}

export function validatePurchase(goods, target, articleUrl) {
  if (!articleUrl) {
    throw new Error(`${target.key}: article URL is empty`);
  }
  if (Number(goods.is_close) === 1) {
    throw new Error(`${target.key}: goods is closed`);
  }
  if (target.quantity < Number(goods.buy_min_limit) || target.quantity > Number(goods.buy_max_limit)) {
    throw new Error(`${target.key}: quantity ${target.quantity} is outside the allowed range`);
  }
  if (Number(goods.buy_rate) > 1 && target.quantity % Number(goods.buy_rate) !== 0) {
    throw new Error(`${target.key}: quantity ${target.quantity} is not a multiple of buy_rate`);
  }
}

export function buildOrderPayload(goods, target, articleUrl) {
  validatePurchase(goods, target, articleUrl);
  return {
    goods_sn: String(goods.serial_number),
    buy_number: target.quantity,
    buy_params: { url: articleUrl },
  };
}
