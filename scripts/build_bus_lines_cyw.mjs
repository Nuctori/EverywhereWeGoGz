// 车盈网（busboss）全量班次 → 项目数据层
//
// 输入：tmp/busboss-recon/data/records.jsonl.gz（crawl.cjs 全量抓取产物，
//       每行 = 一个 (起点城市, 到达省, 日期, 班次)）。
//
// 输出（三层，互不重叠）：
//   public/data/cyw/lines.json      全部线路 + 完整站点序列（不截断，供详情/检索）
//   public/data/cyw/schedule.json   线路 × 日期 × 班次[时间,票价分,余位]（46 天全量，供查询/推荐）
//   public/data/bus-lines-cyw.json  地图图层视图（取最早可售日、站点截断，<2MB 硬预算）
//   src/data/raw_cyw_full.json      归并后的线路原始件（审计/回溯用）
//
// 口径：按 lineId 合成一条线路；班次按 record.date 归档，
//       图层视图只取"最早可售日期"的那一天的班次（date 与 departTimes 必须同源）。
import { createReadStream, existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createInterface } from 'node:readline';
import { createGunzip } from 'node:zlib';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const inputPath = process.env.CYW_RECORDS
  || path.join(root, 'tmp/busboss-recon/data/records.jsonl.gz');

const dataDir = path.join(root, 'public/data/cyw');
const linesOutPath = path.join(dataDir, 'lines.json');
const scheduleOutPath = path.join(dataDir, 'schedule.json');
const mapOutPath = path.join(root, 'public/data/bus-lines-cyw.json');
const rawOutPath = path.join(root, 'src/data/raw_cyw_full.json');

/* 地图视图的体积预算：主 bus-lines.json 约 1.9MB，附加源控制在 2MB 以内 */
const MAP_MAX_BOARD = 6;
const MAP_MAX_ALIGHT = 5;
const MAP_MAX_TIMES = 24;
const MAP_MAX_BYTES = 2 * 1024 * 1024;
const COORD_DP = 5;

const CHINA = { minLat: 18, maxLat: 54, minLng: 73, maxLng: 135 };
const insideChina = (lat, lng) =>
  Number.isFinite(lat) && Number.isFinite(lng)
  && lat >= CHINA.minLat && lat <= CHINA.maxLat
  && lng >= CHINA.minLng && lng <= CHINA.maxLng;

/** "lng,lat" → {lat,lng}，越界/缺失返回 null */
const parseGeocoder = (value) => {
  if (typeof value !== 'string') return null;
  const [lngText, latText] = value.split(',');
  const lng = Number(lngText);
  const lat = Number(latText);
  return insideChina(lat, lng) ? { lat, lng } : null;
};

const toStop = (node, role) => {
  const point = parseGeocoder(node.geo);
  if (!point) return null;
  return {
    name: String(node.name || '').trim(),
    lat: Number(point.lat.toFixed(COORD_DP)),
    lng: Number(point.lng.toFixed(COORD_DP)),
    role,
    precision: 'node',
    arriveTime: String(node.time || '').slice(0, 5),
    adcode: '',
  };
};

if (!existsSync(inputPath)) {
  throw new Error(`missing crawl output: ${path.relative(root, inputPath)} (run tmp/busboss-recon/crawl.cjs crawl first)`);
}

/** lineId -> { line, originCity, best stops, byDate: Map<date, Map<time, {priceFen, seats}>> } */
const byLine = new Map();
let rows = 0;
let skippedNoCoord = 0;

const rl = createInterface({ input: createReadStream(inputPath).pipe(createGunzip()), crlfDelay: Infinity });
for await (const line of rl) {
  if (!line.trim()) continue;
  let record;
  try {
    record = JSON.parse(line);
  } catch {
    continue;
  }
  rows += 1;

  const boarding = (record.boarding || []).map((node) => toStop(node, 'board')).filter(Boolean);
  const alighting = (record.alighting || []).map((node) => toStop(node, 'alight')).filter(Boolean);
  if (boarding.length === 0 || alighting.length === 0 || !record.date) {
    skippedNoCoord += 1;
    continue;
  }

  const key = String(record.lineId || record.line || '');
  if (!key) continue;
  let entry = byLine.get(key);
  if (!entry) {
    entry = {
      line: record.line || 'cyw-line',
      originCity: record.originName || '',
      boarding: [],
      alighting: [],
      bestScore: -1,
      byDate: new Map(),
    };
    byLine.set(key, entry);
  }

  // 站点取"最完整的那条班次记录"，避免不同起点城市查到的同一线路互相覆盖成残缺序列
  const score = boarding.length + alighting.length;
  if (score > entry.bestScore) {
    entry.bestScore = score;
    entry.boarding = boarding;
    entry.alighting = alighting;
  }

  // 班次按日期归档：时间必须和日期同源，不能把别的日期的班次塞进最早日期
  const time = String(record.time || '').slice(0, 5);
  if (!/^\d{2}:\d{2}$/.test(time)) continue;
  let day = entry.byDate.get(record.date);
  if (!day) {
    day = new Map();
    entry.byDate.set(record.date, day);
  }
  const priceFen = Number.isFinite(record.price) && record.price > 0 ? Math.round(record.price * 100) : 0;
  const seats = Number.isFinite(record.seats) ? record.seats : 0;
  const previous = day.get(time);
  // 同一线路同一天同一时刻可能被多个起点城市查到：合并成一条，票价取低、余位取高
  if (!previous) day.set(time, { priceFen, seats });
  else day.set(time, { priceFen: Math.min(previous.priceFen || priceFen, priceFen || previous.priceFen) || 0, seats: Math.max(previous.seats, seats) });
}

const dates = new Set();
for (const entry of byLine.values()) for (const date of entry.byDate.keys()) dates.add(date);
const sortedDates = [...dates].sort();

const lines = [];
const schedule = {};
const mapRoutes = [];
let departureTotal = 0;

for (const [lineId, entry] of byLine) {
  const stops = [...entry.boarding, ...entry.alighting];
  if (stops.length < 2) continue;
  const digest = createHash('sha1').update(lineId).digest('hex').slice(0, 10);
  const routeId = `cyw-${digest}`;
  const earliestDate = [...entry.byDate.keys()].sort()[0];

  lines.push({
    id: routeId,
    name: entry.line,
    carrier: '车盈网',
    coordinateSystem: 'gcj02',
    originCity: entry.originCity,
    firstDate: earliestDate,
    stops,
  });

  const perDate = {};
  for (const date of [...entry.byDate.keys()].sort()) {
    const day = entry.byDate.get(date);
    const rowsForDay = [...day.entries()].sort(([a], [b]) => a.localeCompare(b));
    perDate[date] = rowsForDay.map(([time, meta]) => [time, meta.priceFen, meta.seats]);
    departureTotal += rowsForDay.length;
  }
  schedule[routeId] = perDate;

  // 图层视图：只取最早可售那天，站点截断，保证 <2MB
  const earliest = schedule[routeId][earliestDate].slice(0, MAP_MAX_TIMES);
  if (earliest.length === 0) continue;
  const priceFen = earliest.reduce((min, row) => (row[1] > 0 && (min === null || row[1] < min) ? row[1] : min), null);
  mapRoutes.push({
    id: routeId,
    name: entry.line,
    coordinateSystem: 'gcj02',
    date: earliestDate,
    originCity: entry.originCity,
    destinationCity: '',
    departTimes: earliest.map((row) => row[0]),
    priceFen,
    carrier: '车盈网',
    provinceCode: '44',
    stops: [...entry.boarding.slice(0, MAP_MAX_BOARD), ...entry.alighting.slice(0, MAP_MAX_ALIGHT)],
  });
}

lines.sort((a, b) => a.id.localeCompare(b.id));
mapRoutes.sort((a, b) => a.id.localeCompare(b.id));
if (lines.length === 0) throw new Error('no usable route (missing coordinates?) — refusing to write empty data');

const generatedAt = new Date().toISOString().slice(0, 10);
const stats = {
  sourceRows: rows,
  lines: lines.length,
  dates: sortedDates.length,
  departures: departureTotal,
  droppedRows: skippedNoCoord,
};

mkdirSync(dataDir, { recursive: true });

const linesPayload = { generatedAt, coordinateSystem: 'gcj02', stats: { ...stats, dates: sortedDates }, lines };
writeFileSync(linesOutPath, JSON.stringify(linesPayload));

const schedulePayload = { generatedAt, dates: sortedDates, schedule };
writeFileSync(scheduleOutPath, JSON.stringify(schedulePayload));

const mapPayload = {
  generatedAt,
  source: { providers: ['车盈网'], raw: ['raw_cyw_full.json'] },
  routes: mapRoutes,
};
const mapSerialized = JSON.stringify(mapPayload);
if (Buffer.byteLength(mapSerialized) > MAP_MAX_BYTES) {
  throw new Error(`bus-lines-cyw.json exceeds 2MB budget (${(Buffer.byteLength(mapSerialized) / 1024).toFixed(0)}KB); lower MAP_MAX_BOARD/MAP_MAX_ALIGHT`);
}
writeFileSync(mapOutPath, mapSerialized);
writeFileSync(rawOutPath, JSON.stringify({ generatedAt, stats, lines, schedule }));

const kb = (p) => (statSync(p).size / 1024).toFixed(0);
console.log(
  `[cyw] ${rows} 抓取行 → ${lines.length} 线路 / ${sortedDates.length} 天 / ${departureTotal} 班次 `
  + `（丢弃 ${skippedNoCoord} 行缺坐标或无日期）`,
);
console.log(
  `[cyw] lines.json ${kb(linesOutPath)}KB · schedule.json ${kb(scheduleOutPath)}KB · `
  + `图层 bus-lines-cyw.json ${kb(mapOutPath)}KB，${mapRoutes.length} 条`,
);
