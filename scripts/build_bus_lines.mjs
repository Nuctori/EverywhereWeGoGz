// 把「线路级」数据整理成地图用的 bus-lines.json：每条线路一条记录，stops 按上车点→下车点排序。
//
// 两个来源，坐标系不同，所以每条线路自己带 coordinateSystem：
//   - 乔巴士（qbs）班次站点：OSM/Nominatim 补的坐标，WGS-84
//   - 滴滴 pGetSelectStationPointPageInfo：接口原生 GCJ-02
// 任一端缺坐标的线路会被丢弃：只有一半点的线路画出来会断头。
import { readFileSync, writeFileSync, mkdirSync, statSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const qbsPath = path.join(root, 'src/data/raw_qbs_bus_lines.json');
const didiPath = path.join(root, 'src/data/raw_didi_routes_full.json');
const outputPath = path.join(root, 'public/data/bus-lines.json');
const cxOutputPath = path.join(root, 'public/data/bus-lines-cx.json');

const CHINA = { minLat: 18, maxLat: 54, minLng: 73, maxLng: 135 };
const insideChina = (lat, lng) =>
  Number.isFinite(lat) && Number.isFinite(lng)
  && lat >= CHINA.minLat && lat <= CHINA.maxLat
  && lng >= CHINA.minLng && lng <= CHINA.maxLng;

/** adcode 前缀字典（不是匹配规则）：省份 + 广东地级市。 */
const CITY_BY_PREFIX = {
  4401: '广州市', 4402: '韶关市', 4403: '深圳市', 4404: '珠海市', 4405: '汕头市',
  4406: '佛山市', 4407: '江门市', 4408: '湛江市', 4409: '茂名市', 4412: '肇庆市',
  4413: '惠州市', 4414: '梅州市', 4415: '汕尾市', 4416: '河源市', 4417: '阳江市',
  4418: '清远市', 4419: '东莞市', 4420: '中山市', 4451: '潮州市', 4452: '揭阳市',
  4453: '云浮市',
};
const cityOf = (adcode) => CITY_BY_PREFIX[String(adcode ?? '').slice(0, 4)] ?? '';
/** 城市名 → adcode，给只带 cityName 的来源（创想巴士）补区划码。 */
const CITY_ADCODE_BY_NAME = Object.fromEntries(
  Object.entries(CITY_BY_PREFIX).map(([adcode, name]) => [name, adcode]),
);

const routes = [];
const seen = new Set();
const providers = [];
const raws = [];
let droppedLines = 0;
let droppedStops = 0;

const median = (values) => {
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.floor(sorted.length / 2)];
};

const push = (route, board, alight, extra) => {
  if (board.length === 0 || alight.length === 0) {
    droppedLines += 1;
    return;
  }
  // 上车点都在出发城市、下车点都在目的地城市。用各自的中位数当城市锚点：
  // 同名地名（「唐家」「乌石」）被地理编码匹配到别的市时，靠这个把它挡掉。
  const boardAnchor = { lat: median(board.map((stop) => stop.lat)), lng: median(board.map((stop) => stop.lng)) };
  const alightAnchor = { lat: median(alight.map((stop) => stop.lat)), lng: median(alight.map((stop) => stop.lng)) };
  const near = (stop, anchor) => Math.abs(stop.lat - anchor.lat) <= 0.8 && Math.abs(stop.lng - anchor.lng) <= 0.8;
  // 区县/城市级坐标是按 adcode 算出来的，可信；只有"按名字命中"的节点级坐标可能同名串市，
  // 这类才需要落在本城市锚点附近。
  const trusted = (stop) => stop.precision !== 'node';

  const boardKept = board.filter((stop) => trusted(stop) || near(stop, boardAnchor));
  const alightKept = alight.filter((stop) => trusted(stop) || near(stop, alightAnchor));
  droppedStops += (board.length - boardKept.length) + (alight.length - alightKept.length);
  if (boardKept.length === 0 || alightKept.length === 0) {
    droppedLines += 1;
    return;
  }

  // 下车点按"从出发城市往目的地走"的方向排序：乔巴士给的下车点顺序不是地理顺序，
  // 照原序连线会在县城之间来回跳。
  const dirLat = alightAnchor.lat - boardAnchor.lat;
  const dirLng = (alightAnchor.lng - boardAnchor.lng) * Math.cos((boardAnchor.lat * Math.PI) / 180);
  const along = (stop) => (stop.lat - boardAnchor.lat) * dirLat
    + (stop.lng - boardAnchor.lng) * Math.cos((boardAnchor.lat * Math.PI) / 180) * dirLng;
  const orderedAlight = [...alightKept].sort((left, right) => along(left) - along(right));

  if (seen.has(route.id)) return;
  seen.add(route.id);
  const originCity = route.originCity || cityOf(boardKept[0].adcode) || '';
  const destinationCity = route.destinationCity || cityOf(alightKept[0].adcode) || '';
  // 省份代码统一用两位数字前缀（44=广东），前端只认这个，和滴滴那份数据保持一致。
  const guangdong = new Set(Object.values(CITY_BY_PREFIX));
  const provinceCode = guangdong.has(originCity) && guangdong.has(destinationCity) ? '44' : 'unknown';

  // 同一站点可能在上车点/下车点列表里各出现一次（区县兜底后坐标也相同），只保留第一次。
  const stops = [];
  const seenStops = new Set();
  for (const stop of [...boardKept, ...orderedAlight]) {
    const key = `${stop.name}|${stop.lat.toFixed(5)}|${stop.lng.toFixed(5)}`;
    if (seenStops.has(key)) continue;
    seenStops.add(key);
    stops.push(stop);
  }

  routes.push({
    ...route,
    originCity,
    destinationCity,
    provinceCode,
    stops,
    ...extra,
  });
};

const toStop = (station, role) => {
  const lat = Number(station.lat);
  const lng = Number(station.lng);
  if (!insideChina(lat, lng)) {
    droppedStops += 1;
    return null;
  }
  return {
    name: String(station.name ?? '').trim(),
    lat,
    lng,
    role,
    // node=地名精确命中，county=退到区县中心，city=退到城市中心
    precision: String(station.precision ?? 'node'),
    arriveTime: String(station.arrive_time ?? station.arriveTime ?? ''),
    // 乔巴士站点带 adcode，滴滴站点带 county_id：都归一化成 6 位行政区划代码，
    // 否则滴滴线路的省份判不出来，会被整片误标成"跨境/跨省"灰线。
    adcode: String(station.adcode ?? station.county_id ?? ''),
    // cityName 只在建库时用来补 adcode，不写进产物（每条线路几千个站点，白占体积）。
    ...(station.cityName ? { cityName: String(station.cityName) } : {}),
  };
};

// ---- 乔巴士：首次拉到的真实线路（同一条线路会出现在多个班次里，按 line_id 去重）----
if (existsSync(qbsPath)) {
  const raw = JSON.parse(readFileSync(qbsPath, 'utf8'));
  providers.push('乔巴士（ylxweb）');
  raws.push(path.basename(qbsPath));
  for (const file of raw.routes ?? []) {
    for (const line of file.lines ?? []) {
      const board = (line.board_stations ?? []).map((station) => toStop(station, 'board')).filter(Boolean);
      const alight = (line.alight_stations ?? []).map((station) => toStop(station, 'alight')).filter(Boolean);
      push({
        id: `qbs-${line.line_id}`,
        name: String(line.name ?? '').trim() || `qbs-${line.line_id}`,
        coordinateSystem: 'wgs84',
        date: file.date ?? '',
        departTimes: [...new Set(line.depart_times ?? [])].sort(),
        priceFen: Number(line.price_fen) > 0 ? Number(line.price_fen) : null,
        carrier: String(line.carrier ?? ''),
      }, board, alight, {});
    }
  }
}

// ---- 滴滴线路（pull_didi_full.py 全量导出：route_id → 有序站点 + 班次）----
// 这段不经过 push()：push 里的"离城市锚点 0.8° 内"是为乔巴士的地理编码污染设计的，
// 滴滴坐标是接口原生 GCJ-02，跨市线路（燕塘→黄埠横跨 1.6°）会被它整段误删。
const shiftByRoute = new Map();
const parseClock = (msg) => {
  const m = String(msg ?? '').match(/(\d{1,2}:\d{2})/);
  return m ? m[1].padStart(5, '0') : '';
};
const parseFen = (msg) => {
  const m = String(msg ?? '').match(/(\d+(?:\.\d+)?)/);
  const fen = m ? Math.round(Number(m[1]) * 100) : 0;
  return fen > 0 ? fen : null;
};

if (existsSync(didiPath)) {
  const raw = JSON.parse(readFileSync(didiPath, 'utf8'));
  providers.push('滴滴站点巴士');
  raws.push(path.basename(didiPath));

  for (const shift of raw.shifts ?? []) {
    const key = String(shift.route_id ?? '');
    if (!key) continue;
    const entry = shiftByRoute.get(key) ?? { times: new Set(), prices: [], duration: '' };
    const clock = parseClock(shift.time_msg);
    if (clock) entry.times.add(clock);
    const fen = parseFen(shift.fee_msg);
    if (fen) entry.prices.push(fen);
    if (shift.duration_text) entry.duration = shift.duration_text;
    shiftByRoute.set(key, entry);
  }

  // 城市 id -> 名称：滴滴站点带 city_id，出发地筛选要靠它
  const cityName = new Map();
  const cityListPath = path.join(root, 'src/data/raw_didi_city_list.json');
  if (existsSync(cityListPath)) {
    for (const city of JSON.parse(readFileSync(cityListPath, 'utf8'))) {
      cityName.set(String(city.cityId), city.name);
    }
  }

  for (const [routeId, stations] of Object.entries(raw.routes ?? {})) {
    const board = [];
    const alight = [];
    for (const station of stations ?? []) {
      const stop = toStop(station, Number(station.type) === 1 ? 'board' : 'alight');
      if (!stop) continue;
      stop.cityId = String(station.city_id ?? '');
      (stop.role === 'board' ? board : alight).push(stop);
    }
    if (board.length === 0 || alight.length === 0) { droppedLines += 1; continue; }

    const shift = shiftByRoute.get(routeId) ?? { times: new Set(), prices: [], duration: '' };
    const prices = shift.prices.filter((fen) => Number.isFinite(fen));
    seen.add(`didi-${routeId}`);
    routes.push({
      id: `didi-${routeId}`,
      name: `${board[0].name} → ${alight[alight.length - 1].name}`,
      coordinateSystem: 'gcj02',
      date: String(raw.pulled_at ?? ''),
      originCity: cityName.get(board[0].cityId) ?? '',
      destinationCity: cityName.get(alight[alight.length - 1].cityId) ?? '',
      departTimes: [...shift.times].sort(),
      priceFen: prices.length ? Math.min(...prices) : null,
      carrier: '滴滴站点巴士',
      durationText: shift.duration ?? '',
      provinceCode: String(board[0].adcode ?? '').slice(0, 2) === '44' ? '44' : 'unknown',
      stops: [...board, ...alight],
    });
  }
}

// ---- 创想巴士（车盈网白牌小程序 wxb5f1e7327d7fbb6a）----
// pull_cx_lines.mjs 的产物：按 lineId 归并好的线路，站点坐标是接口原生 GCJ-02，
// 与滴滴同一坐标系，所以同样绕开 push() 的城市锚点过滤。
const cxPath = path.join(root, 'src/data/raw_cx_lines.json');
if (existsSync(cxPath)) {
  const raw = JSON.parse(readFileSync(cxPath, 'utf8'));
  providers.push('创想巴士');
  raws.push(path.basename(cxPath));

  const guangdongNames = new Set(Object.values(CITY_BY_PREFIX));
  const modeCity = (stations) => {
    const tally = new Map();
    for (const station of stations) {
      const city = String(station.cityName ?? '');
      if (city) tally.set(city, (tally.get(city) ?? 0) + 1);
    }
    return [...tally.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ?? '';
  };
  const centroid = (stops) => ({
    lat: stops.reduce((sum, stop) => sum + stop.lat, 0) / stops.length,
    lng: stops.reduce((sum, stop) => sum + stop.lng, 0) / stops.length,
  });

  for (const line of raw.routes ?? []) {
    const boardRaw = (line.board ?? []).map((station) => ({ ...station, role: 'board' }));
    const alightRaw = (line.alight ?? []).map((station) => ({ ...station, role: 'alight' }));
    // 出发/目的地按「出现最多的城市」判定：一条线路的上车点常横跨深圳+东莞，
    // 取数组第一个会随机落到东莞或深圳，卡片上的城市就对不上了。
    const originCity = modeCity(boardRaw);
    const destinationCity = modeCity(alightRaw);

    const boardPairs = boardRaw
      .map((station) => ({ nodeId: String(station.nodeId ?? ''), stop: toStop(station, 'board') }))
      .filter((item) => item.stop);
    const alightPairs = alightRaw
      .map((station) => ({ nodeId: String(station.nodeId ?? ''), stop: toStop(station, 'alight') }))
      .filter((item) => item.stop);
    const board = boardPairs.map((item) => item.stop);
    const alight = alightPairs.map((item) => item.stop);
    if (board.length === 0 || alight.length === 0) { droppedLines += 1; continue; }

    for (const stop of [...board, ...alight]) {
      const adcode = CITY_ADCODE_BY_NAME[String(stop.cityName ?? '')];
      if (adcode) stop.adcode = adcode;
      delete stop.cityName;
    }

    // 接口给的上下车点是「这个线路经过的站点名单」，不是行车顺序。
    // 直接用数组顺序连线，多上车点的线路会画成横穿两座城市的蜘蛛网
    // （见「深圳、东莞-茂名、化州」64 个上车点）。按行进方向排序后再串：
    // 取跨度更大的那根轴排序（广深往粤西这类东西向走廊按经度，南向的按纬度），
    // 两根轴等权相乘排序会让「偏北一点但更东」的点插到中间，连线还是折返。
    const from = centroid(board);
    const to = centroid(alight);
    const dirLat = to.lat - from.lat;
    const dirLng = (to.lng - from.lng) * Math.cos((from.lat * Math.PI) / 180);
    const useLongitude = Math.abs(dirLng) >= Math.abs(dirLat);
    const travelKey = useLongitude
      ? (stop) => stop.lng * Math.sign(dirLng)
      : (stop) => stop.lat * Math.sign(dirLat);
    const orderedBoard = [...board].sort((left, right) => travelKey(left) - travelKey(right));
    const orderedAlight = [...alight].sort((left, right) => travelKey(left) - travelKey(right));

    // 一条线路有几十个上下车点，串成一根折线就是蜘蛛网（同一班车被画成横穿两座城市）。
    // 按班次切成「一上一下」的段：每个段就是一次真实行程。
    const boardByNode = new Map(boardPairs.map((item) => [item.nodeId, item.stop]));
    const alightByNode = new Map(alightPairs.map((item) => [item.nodeId, item.stop]));
    const seenSegments = new Set();
    const segments = [];
    for (const trip of line.trips ?? []) {
      const from = boardByNode.get(String(trip.fromNodeId ?? ''));
      const to = alightByNode.get(String(trip.toNodeId ?? ''));
      if (!from || !to) continue;
      const key = `${from.name}|${to.name}`;
      if (seenSegments.has(key)) continue;
      seenSegments.add(key);
      segments.push([from, to]);
    }

    const orderedStops = [...orderedBoard, ...orderedAlight];
    const stopIndex = new Map(orderedStops.map((stop, index) => [stop, index]));
    const segmentPairs = [];
    for (const segment of segments) {
      const [from, to] = segment;
      const a = stopIndex.get(from);
      const b = stopIndex.get(to);
      if (a === undefined || b === undefined || a === b) continue;
      segmentPairs.push([a, b]);
    }

    const minutes = Number(line.alight?.[0]?.runTime ?? 0);
    const priceFen = Number(line.priceYuan) > 0 ? Math.round(Number(line.priceYuan) * 100) : null;

    seen.add(`cx-${line.lineId}`);
    routes.push({
      id: `cx-${line.lineId}`,
      name: String(line.lineName ?? '').trim() || `${orderedBoard[0].name} → ${orderedAlight[orderedAlight.length - 1].name}`,
      coordinateSystem: 'gcj02',
      date: String(raw.pulledAt ?? '').slice(0, 10),
      originCity,
      destinationCity,
      departTimes: [...new Set(line.departTimes ?? [])].sort(),
      priceFen,
      carrier: '创想巴士',
      durationText: minutes > 0 ? `${Math.floor(minutes / 60)}小时${minutes % 60}分` : '',
      provinceCode: guangdongNames.has(originCity) && guangdongNames.has(destinationCity) ? '44' : 'unknown',
      stops: orderedStops,
      // 班次分段写成「stops 下标对」：每对就是一次真实行程（一上一下）。
      // 不这样写会整段复制站点对象，文件直接冲到 2.4MB。老渠道没有该字段，仍按 stops 画。
      ...(segmentPairs.length > 0 ? { segments: segmentPairs } : {}),
    });
  }
}

if (routes.length === 0) {
  throw new Error('一条可用线路都没有（站点缺坐标？），拒绝写出空数据覆盖线上文件');
}
routes.sort((left, right) => left.id.localeCompare(right.id));

// 分两个文件写：单文件已经 3.8MB，前端一次性 parse + zod 校验会明显卡顿；
// 创想巴士单独一份，前端并行取、合并使用，任一源失败也不拖垮另一边。
const cxRoutes = routes.filter((route) => route.id.startsWith('cx-'));
const baseRoutes = routes.filter((route) => !route.id.startsWith('cx-'));
const cxProvider = providers.filter((name) => name.includes('创想巴士'));
const baseProviders = providers.filter((name) => !name.includes('创想巴士'));
const cxRaw = raws.filter((name) => name.includes('cx'));
const baseRaw = raws.filter((name) => !name.includes('cx'));

const writePayload = (target, payload) => {
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, JSON.stringify(payload, null, 1));
  return statSync(target).size;
};

const generatedAt = new Date().toISOString().slice(0, 10);
const baseSize = writePayload(outputPath, {
  generatedAt,
  source: { providers: baseProviders, raw: baseRaw },
  routes: baseRoutes,
});
// 创想巴士那份**无条件覆盖写**：这次采集一条可用线路都没有时也要写成空文件，
// 否则上一轮的旧文件会被前端当新数据取走（新主线 + 过期支线）。
const cxSize = writePayload(cxOutputPath, {
  generatedAt,
  source: { providers: cxProvider.length ? cxProvider : ['创想巴士'], raw: cxRaw },
  routes: cxRoutes,
});

const stopCount = routes.reduce((sum, route) => sum + route.stops.length, 0);
console.log(
  `[bus-lines] ${routes.length} 条线路 / ${stopCount} 个站点 -> ${path.relative(root, outputPath)}`
  + (droppedLines ? `（跳过 ${droppedLines} 条缺坐标线路、${droppedStops} 个缺坐标站点）` : ''),
);
console.log(`[bus-lines] 文件大小 ${(baseSize / 1024).toFixed(0)}KB`
  + ` + 创想巴士 ${(cxSize / 1024).toFixed(0)}KB（${cxRoutes.length} 条）`);
