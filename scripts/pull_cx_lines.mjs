// 创想巴士（车盈网白牌小程序 wxb5f1e7327d7fbb6a）全量线路采集。
//
// 数据面：POST https://sale-api-public.dz.busboss.cn/api/custombus/line-class-day/v2/list
//   Authorization: Bearer <JWT>；按「出发城市 → 到达城市」逐对翻页，拿到的每条 item 就是一个班次，
//   带出发/到达站点序列、坐标（geocoder）、票价、余位。
//
// 身份：tmp/cx-token.json（access_token + refresh_token，都由本机微信小程序抓包取得）。
//   令牌属于用户本人微信身份，只放 tmp/（gitignore），不入库。
//
// 用法：
//   node scripts/pull_cx_lines.mjs                 # 今天，广东 21 城全量
//   node scripts/pull_cx_lines.mjs --days 1        # 明天
//   node scripts/pull_cx_lines.mjs --pairs 4401:4403,4401:4419
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TOKEN_PATH = path.join(root, 'tmp', 'cx-token.json');
const OUT = path.join(root, 'src', 'data', 'raw_cx_lines.json');
const RAW_DIR = path.join(root, 'tmp', 'cx-pairs');

const API = 'https://sale-api-public.dz.busboss.cn/api/custombus/line-class-day/v2/list';
const AUTH = 'https://sale-auth.dz.busboss.cn/connect/token';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 MicroMessenger/7.0.20.1781(0x6700143B) NetType/WIFI MiniProgramEnv/Windows WindowsWechat/WMPF';

/** 广东 21 个地级市（adcode 前 4 位）。区县级作为起点实测返回 0 条，只用市级。 */
const GD_CITIES = {
  4401: '广州市', 4402: '韶关市', 4403: '深圳市', 4404: '珠海市', 4405: '汕头市',
  4406: '佛山市', 4407: '江门市', 4408: '湛江市', 4409: '茂名市', 4412: '肇庆市',
  4413: '惠州市', 4414: '梅州市', 4415: '汕尾市', 4416: '河源市', 4417: '阳江市',
  4418: '清远市', 4419: '东莞市', 4420: '中山市', 4451: '潮州市', 4452: '揭阳市',
  4453: '云浮市',
};

const args = process.argv.slice(2);
const argOf = (name, fallback) => {
  const hit = args.find((arg) => arg.startsWith(`--${name}`));
  return hit ? hit.split('=')[1] ?? args[args.indexOf(hit) + 1] : fallback;
};

const dayOffset = Number(argOf('days', '0'));
const pairsArg = argOf('pairs', '');
const pageSize = 50;

const shanghaiDay = (offset) => {
  const now = new Date(Date.now() + 8 * 3600 * 1000 + offset * 86400 * 1000);
  return now.toISOString().slice(0, 10);
};

const readToken = () => {
  if (!existsSync(TOKEN_PATH)) throw new Error(`缺少令牌文件：${path.relative(root, TOKEN_PATH)}（先抓包，见 docs/busboss-miniprogram-api.md）`);
  return JSON.parse(readFileSync(TOKEN_PATH, 'utf8'));
};

const writeToken = (token) => writeFileSync(TOKEN_PATH, JSON.stringify(token, null, 1));

const decodeExp = (jwt) => {
  try {
    const payload = JSON.parse(Buffer.from(String(jwt).split('.')[1], 'base64url').toString('utf8'));
    return Number(payload.exp) || 0;
  } catch {
    return 0;
  }
};

/** 无条件刷新：401 之后必须换一张新令牌再发，不能拿旧的硬重试。 */
const refreshNow = async (token) => {
  if (!token?.refresh_token) {
    throw new Error('access_token 失效且没有 refresh_token：打开一次创想巴士小程序，重新抓 /connect/token');
  }
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: 'WeChatMiniProgram',
    refresh_token: token.refresh_token,
  });
  const response = await fetch(AUTH, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': UA },
    body,
  });
  if (!response.ok) throw new Error(`刷新令牌失败 HTTP ${response.status}`);
  const merged = { ...token, ...(await response.json()) };
  writeToken(merged);
  return merged;
};

const refreshIfNeeded = async (token) => {
  const left = decodeExp(token.access_token) - Math.floor(Date.now() / 1000);
  return left > 300 ? token : refreshNow(token);
};

// 主循环持有的最新凭据：401 时由 listPage 的 onUnauthorized 刷新后写回。
let activeToken = null;
const forceRefreshToken = async () => {
  activeToken = await refreshNow(activeToken ?? readToken());
  return activeToken;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** 401 是令牌轮换瞬间的抖动，429 是网关限流：都要退避重试，而不是把这一对丢掉。 */
const retryDelayMs = (message, index) => {
  if (String(message).includes('429')) return 15000 * (index + 1);
  return 1200 * (index + 1);
};
const isRetryable = (message) => String(message).includes('401') || String(message).includes('429');

/** 401 = 令牌链断了，再跑下去 420 个城市对只会拿到 420 个 401，必须中止本轮。 */
export const isFatalAuthError = (error) => String(error?.message ?? '').includes('401');

export const withRetry = async (fn, attempts = 4) => {
  let last;
  for (let index = 0; index < attempts; index += 1) {
    try {
      return await fn();
    } catch (error) {
      last = error;
      if (!isRetryable(error.message)) throw error;
      await sleep(retryDelayMs(error.message, index));
    }
  }
  throw last;
};

/**
 * 造一个 listPage。401 的处理在重试内部：先让调用方刷新令牌，再用新 bearer 重发，
 * 否则拿同一个过期令牌重试 4 次只是在浪费时间。
 * onUnauthorized 由调用方注入（真实实现走 refreshNow），测试里替换成假的。
 */
export const makeListPage = ({
  apiUrl = API,
  ua = UA,
  fetchImpl = fetch,
  size = pageSize,
  onUnauthorized = null,
  retries = 4,
} = {}) => async (initialToken, pair, date, skipCount) => {
  const [from, to] = pair;
  let current = initialToken;
  return withRetry(async () => {
    const bearer = typeof current === 'string' ? current : current?.access_token;
    const response = await fetchImpl(apiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${bearer}`,
        'Content-Type': 'application/json',
        platform: 'mp-weixin',
        xweb_xhr: '1',
        Referer: 'https://servicewechat.com/wxb5f1e7327d7fbb6a/1/page-frame.html',
        'User-Agent': ua,
      },
      body: JSON.stringify({
        skipCount,
        maxResultCount: size,
        classDate: date,
        start: { type: 'Region', value: { id: from, level: 1 } },
        end: { type: 'Region', value: { id: to, level: 1 } },
      }),
    });
    if (!response.ok) {
      const detail = String(await response.text()).slice(0, 200);
      if (response.status === 401 && onUnauthorized) {
        current = await onUnauthorized();
      }
      throw new Error(`HTTP ${response.status} ${detail}`);
    }
    return response.json();
  }, retries);
};

const listPage = makeListPage({
  onUnauthorized: () => forceRefreshToken(),
});

const pullPair = async (token, pair, date) => {
  const cacheFile = path.join(RAW_DIR, `${date}_${pair[0]}_${pair[1]}.json`);
  if (existsSync(cacheFile)) return JSON.parse(readFileSync(cacheFile, 'utf8'));
  const all = [];
  let skip = 0;
  for (let page = 0; page < 20; page += 1) {
    const payload = await listPage(token, pair, date, skip);
    const items = payload.items ?? [];
    all.push(...items);
    const total = Number(payload.totalCount ?? 0);
    if (items.length < pageSize || all.length >= total) break;
    skip += pageSize;
    await sleep(150);
  }
  const record = { pair, date, total: all.length, items: all };
  mkdirSync(RAW_DIR, { recursive: true });
  writeFileSync(cacheFile, JSON.stringify(record));
  return record;
};

/** geocoder 是 "lng,lat"。 */
const parseGeocoder = (geocoder) => {
  const [lng, lat] = String(geocoder ?? '').split(',').map(Number);
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
};

const main = async () => {
  const date = shanghaiDay(dayOffset);
  let token = await refreshIfNeeded(readToken());
  activeToken = token;

  const cities = Object.keys(GD_CITIES);
  const pairs = pairsArg
    ? pairsArg.split(',').map((item) => item.split(':').map((id) => Number(id.trim())))
    : cities.flatMap((from) => cities.filter((to) => to !== from).map((to) => [from, to]));

  const lines = new Map();
  let requests = 0;
  let failures = 0;
  let fatal = null;

  for (const pair of pairs) {
    requests += 1;
    try {
      token = await refreshIfNeeded(activeToken ?? token);
      activeToken = token;
      const record = await pullPair(token, pair, date);
      for (const item of record.items) {
        const key = String(item.lineId ?? '').toUpperCase();
        if (!key) continue;
        const entry = lines.get(key) ?? {
          lineId: key,
          lineName: String(item.lineName ?? ''),
          dataSourceCode: String(item.dataSourceCode ?? ''),
          shifts: new Map(),
          board: new Map(),
          alight: new Map(),
        };
        entry.shifts.set(String(item.id ?? `${key}-${item.classTime}`), {
          classTime: String(item.classTime ?? ''),
          priceYuan: Number(item.lineClassDayPrice ?? 0) || null,
          canSaleCount: Number(item.canSaleCount ?? 0) || 0,
          fromNodeId: item.startNodeList?.[0]?.nodeId ?? '',
          toNodeId: item.arrivalNodeList?.[0]?.nodeId ?? '',
        });
        for (const node of item.startNodeList ?? []) {
          const point = parseGeocoder(node.geocoder);
          if (!point) continue;
          entry.board.set(String(node.nodeId ?? node.nodeName), {
            name: String(node.nodeName ?? '').trim(),
            ...point,
            cityName: String(node.cityName ?? ''),
            districtName: String(node.districtName ?? ''),
            classTime: String(node.classTime ?? ''),
          });
        }
        for (const node of item.arrivalNodeList ?? []) {
          const point = parseGeocoder(node.geocoder);
          if (!point) continue;
          entry.alight.set(String(node.nodeId ?? node.nodeName), {
            name: String(node.nodeName ?? '').trim(),
            ...point,
            cityName: String(node.cityName ?? ''),
            districtName: String(node.districtName ?? ''),
            classTime: String(node.classTime ?? ''),
            runTime: Number(node.runTime ?? 0) || 0,
            mileage: Number(node.mileage ?? 0) || 0,
          });
        }
        lines.set(key, entry);
      }
      process.stdout.write(`[cx] ${pair[0]}->${pair[1]} ${record.total}\n`);
    } catch (error) {
      failures += 1;
      process.stderr.write(`[cx] ${pair[0]}->${pair[1]} 失败：${error.message}\n`);
      // 令牌链断了：后面的城市对只会拿到同样的 401，别再磨 420 次。
      if (isFatalAuthError(error)) {
        fatal = error;
        break;
      }
      await sleep(8000);
    }
    await sleep(350);
  }

  const routes = [...lines.values()].map((entry) => ({
    lineId: entry.lineId,
    lineName: entry.lineName,
    dataSourceCode: entry.dataSourceCode,
    departTimes: [...entry.shifts.values()].map((shift) => shift.classTime).filter(Boolean).sort(),
    priceYuan: Math.min(...[...entry.shifts.values()].map((shift) => shift.priceYuan ?? Infinity)) || null,
    board: [...entry.board.values()],
    alight: [...entry.alight.values()],
    shiftCount: entry.shifts.size,
  }));
  const withShifts = routes.filter((route) => route.board.length > 0 && route.alight.length > 0);
  const partial = failures > 0 || Boolean(fatal);
  writeFileSync(OUT, JSON.stringify({
    pulledAt: new Date().toISOString(),
    date,
    tenant: 'wxb5f1e7327d7fbb6a',
    platform: 'sale-api-public.dz.busboss.cn',
    pairs: pairs.length,
    requests,
    failures,
    // 半份数据必须自带标记：下游能看出这不是一次完整采集。
    partial,
    abortedBy: fatal ? String(fatal.message).slice(0, 200) : null,
    routes: withShifts,
  }, null, 1));
  process.stdout.write(`[cx] ${withShifts.length} 条线路（${routes.length - withShifts.length} 条缺站点被跳过）/${requests} 个城市对 -> ${path.relative(root, OUT)}\n`);
  if (fatal) {
    process.stderr.write('[cx] 本轮中止：令牌失效，数据是半份（partial=true）。重新抓一次 /connect/token 再跑。\n');
    process.exitCode = 1;
  }
};

// 只有被直接执行时才跑采集：被测试 import 时不能顺手把 420 个城市对打一遍。
const invokedDirectly = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) {
  main().catch((error) => {
    process.stderr.write(`[cx] 失败：${error.message}\n`);
    process.exitCode = 1;
  });
}
