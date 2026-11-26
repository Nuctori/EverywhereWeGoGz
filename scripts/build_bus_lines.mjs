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

if (routes.length === 0) {
  throw new Error('一条可用线路都没有（站点缺坐标？），拒绝写出空数据覆盖线上文件');
}

routes.sort((left, right) => left.id.localeCompare(right.id));

mkdirSync(path.dirname(outputPath), { recursive: true });
writeFileSync(outputPath, JSON.stringify({
  generatedAt: new Date().toISOString().slice(0, 10),
  source: { providers, raw: raws },
  routes,
}, null, 1));

const stopCount = routes.reduce((sum, route) => sum + route.stops.length, 0);
console.log(
  `[bus-lines] ${routes.length} 条线路 / ${stopCount} 个站点 -> ${path.relative(root, outputPath)}`
  + (droppedLines ? `（跳过 ${droppedLines} 条缺坐标线路、${droppedStops} 个缺坐标站点）` : ''),
);
console.log(`[bus-lines] 文件大小 ${(statSync(outputPath).size / 1024).toFixed(0)}KB`);
