// 智惠大巴（多供应商）→ 项目数据层
//
// 输入：tmp/busboss-recon/data/zhihuiba.jsonl.gz（zhihuiba-crawl.cjs 抓取产物）
// 输出：
//   public/data/zhd/lines.json      线路 + 完整站点 + 供应商标签
//   public/data/zhd/schedule.json   线路 × 日期 × 班次[时间,票价分,余位,供应商下标]
//   public/data/bus-lines-zhd.json  地图图层视图（增量供应商，<2MB）
//   src/data/raw_zhihuiba_full.json 归档
//
// 口径：智惠大巴不传 ArrivalCityCode 时返回的是"多供应商直通车/包车"（广之旅、空港快线、
// 珠江客运、大队巴士、TBS、一路行、新和），不含车盈网自营班次，与出行助手那份天然不重复。
// 聚合键含站点集合：同一 LineGID 下不同上下车组合是不同产品，不能合并。
import { createReadStream, existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createInterface } from 'node:readline';
import { createGunzip } from 'node:zlib';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const inputPath = process.env.ZHD_RECORDS || path.join(root, 'tmp/busboss-recon/data/zhihuiba.jsonl.gz');

const dataDir = path.join(root, 'public/data/zhd');
const linesOut = path.join(dataDir, 'lines.json');
const scheduleOut = path.join(dataDir, 'schedule.json');
const mapOut = path.join(root, 'public/data/bus-lines-zhd.json');
const rawOut = path.join(root, 'src/data/raw_zhihuiba_full.json');

const MAP_MAX_BOARD = 6;
const MAP_MAX_ALIGHT = 5;
const MAP_MAX_TIMES = 24;
const MAP_MAX_BYTES = 2 * 1024 * 1024;
const COORD_DP = 5;

/** DataSourceCode → {code,label}：智惠大巴聚合了多家客运/直通车供应商 */
const SUPPLIERS = {
  GZLBusNew: { code: 'gzl', label: '广之旅·中港直通' },
  'KGYXBus-BaiYun': { code: 'kgyx', label: '空港快线·白云机场' },
  ZHJCBus: { code: 'zhjc', label: '珠江客运·中港巴士' },
  DaDuiBusOTA: { code: 'dadui', label: '大队巴士' },
  'TBS-duigong': { code: 'tbs', label: 'TBS 对公' },
  'YiLuXingWeb-YangYangBus': { code: 'ylx', label: '一路行·扬扬巴士' },
  'gdlwsp-XinHe': { code: 'xh', label: '广东联网售票·新和' },
  cheyingwang: { code: 'cyw', label: '车盈网' },
};
const supplierOf = (raw) => SUPPLIERS[raw] || {
  code: String(raw || 'unknown').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8) || 'unknown',
  label: String(raw || '未知供应商'),
};

const CHINA = { minLat: 18, maxLat: 54, minLng: 73, maxLng: 135 };
const insideChina = (lat, lng) =>
  Number.isFinite(lat) && Number.isFinite(lng)
  && lat >= CHINA.minLat && lat <= CHINA.maxLat
  && lng >= CHINA.minLng && lng <= CHINA.maxLng;

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
  throw new Error(`missing crawl output: ${path.relative(root, inputPath)} (run tmp/busboss-recon/zhihuiba-crawl.cjs crawl first)`);
}

/** key = supplier|lineId|boardNames>alightNames */
const byLine = new Map();
let rows = 0;
let skipped = 0;

const rl = createInterface({ input: createReadStream(inputPath).pipe(createGunzip()), crlfDelay: Infinity });
for await (const line of rl) {
  if (!line.trim()) continue;
  let record;
  try { record = JSON.parse(line); } catch { continue; }
  rows += 1;
  if (!record.date || !record.id) { skipped += 1; continue; }

  const boarding = (record.boarding || []).map((n) => toStop(n, 'board')).filter(Boolean);
  const alighting = (record.alighting || []).map((n) => toStop(n, 'alight')).filter(Boolean);
  if (!boarding.length || !alighting.length) { skipped += 1; continue; }

  const supplier = supplierOf(record.supplier);
  const sig = [supplier.code, record.lineId || record.line, boarding.map((s) => s.name).join('|'), alighting.map((s) => s.name).join('|')].join('\u0001');
  let entry = byLine.get(sig);
  if (!entry) {
    // 同一站点组合下不同记录可能有更长的站点序列，取最完整的一条
    entry = {
      supplier: supplier.code,
      supplierLabel: supplier.label,
      line: record.line || 'zhd-line',
      boarding,
      alighting,
      bestScore: boarding.length + alighting.length,
      byDate: new Map(),
    };
    byLine.set(sig, entry);
  } else {
    const score = boarding.length + alighting.length;
    if (score > entry.bestScore) {
      entry.bestScore = score;
      entry.boarding = boarding;
      entry.alighting = alighting;
    }
  }

  const time = String(record.time || '').slice(0, 5);
  if (!/^\d{2}:\d{2}$/.test(time)) continue;
  let day = entry.byDate.get(record.date);
  if (!day) { day = new Map(); entry.byDate.set(record.date, day); }
  const priceFen = Number.isFinite(record.price) && record.price > 0 ? Math.round(record.price * 100) : 0;
  const seats = Number.isFinite(record.seats) ? record.seats : 0;
  const prev = day.get(time);
  if (!prev) day.set(time, { priceFen, seats });
  else day.set(time, {
    priceFen: Math.min(prev.priceFen || priceFen, priceFen || prev.priceFen) || 0,
    seats: Math.max(prev.seats, seats),
  });
}

const supplierCodes = [...new Set([...byLine.values()].map((e) => e.supplier))].sort();
const supplierIndex = Object.fromEntries(supplierCodes.map((s, i) => [s, i]));
const supplierLabels = Object.fromEntries([...byLine.values()].map((e) => [e.supplier, e.supplierLabel]));

const dates = new Set();
for (const e of byLine.values()) for (const d of e.byDate.keys()) dates.add(d);
const sortedDates = [...dates].sort();

const lines = [];
const schedule = {};
const mapRoutes = [];
let departures = 0;

for (const [sig, entry] of byLine) {
  const stops = [...entry.boarding, ...entry.alighting];
  if (stops.length < 2 || entry.byDate.size === 0) continue;
  const digest = createHash('sha1').update(sig).digest('hex').slice(0, 10);
  const routeId = `zhd-${entry.supplier}-${digest}`;
  const firstDate = [...entry.byDate.keys()].sort()[0];

  lines.push({
    id: routeId,
    name: entry.line,
    supplier: entry.supplier,
    supplierLabel: entry.supplierLabel,
    carrier: '智惠大巴',
    coordinateSystem: 'gcj02',
    firstDate,
    stops,
  });

  const perDate = {};
  for (const date of [...entry.byDate.keys()].sort()) {
    const day = entry.byDate.get(date);
    perDate[date] = [...day.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([time, meta]) => [time, meta.priceFen, meta.seats, supplierIndex[entry.supplier]]);
    departures += perDate[date].length;
  }
  schedule[routeId] = perDate;

  const earliest = schedule[routeId][firstDate].slice(0, MAP_MAX_TIMES);
  if (!earliest.length) continue;
  const priceFen = earliest.reduce((min, r) => (r[1] > 0 && (min === null || r[1] < min) ? r[1] : min), null);
  mapRoutes.push({
    id: routeId,
    name: entry.line,
    coordinateSystem: 'gcj02',
    date: firstDate,
    originCity: '',
    destinationCity: '',
    departTimes: [...new Set(earliest.map((r) => r[0]))],
    priceFen,
    carrier: entry.supplierLabel,
    supplier: entry.supplier,
    supplierLabel: entry.supplierLabel,
    provinceCode: '44',
    stops: [...entry.boarding.slice(0, MAP_MAX_BOARD), ...entry.alighting.slice(0, MAP_MAX_ALIGHT)],
  });
}

lines.sort((a, b) => a.id.localeCompare(b.id));
mapRoutes.sort((a, b) => a.id.localeCompare(b.id));
if (!lines.length) throw new Error('no usable line (missing coordinates?) — refusing to write empty data');

const generatedAt = new Date().toISOString().slice(0, 10);
const supplierList = supplierCodes.map((code) => ({ code, label: supplierLabels[code] }));
const stats = { sourceRows: rows, lines: lines.length, dates: sortedDates.length, departures, droppedRows: skipped, suppliers: supplierCodes };

mkdirSync(dataDir, { recursive: true });
writeFileSync(linesOut, JSON.stringify({ generatedAt, coordinateSystem: 'gcj02', stats, suppliers: supplierList, lines }));
writeFileSync(scheduleOut, JSON.stringify({ generatedAt, suppliers: supplierList, dates: sortedDates, schedule }));

const mapPayload = { generatedAt, source: { providers: ['智惠大巴'], raw: ['raw_zhihuiba_full.json'] }, routes: mapRoutes };
const mapSerialized = JSON.stringify(mapPayload);
if (Buffer.byteLength(mapSerialized) > MAP_MAX_BYTES) {
  throw new Error(`bus-lines-zhd.json exceeds 2MB budget (${(Buffer.byteLength(mapSerialized) / 1024).toFixed(0)}KB)`);
}
writeFileSync(mapOut, mapSerialized);
writeFileSync(rawOut, JSON.stringify({ generatedAt, stats, suppliers: supplierList, lines, schedule }));

const kb = (p) => (statSync(p).size / 1024).toFixed(0);
console.log(`[zhd] ${rows} 抓取行 → ${lines.length} 线路 / ${sortedDates.length} 天 / ${departures} 班次（丢弃 ${skipped}）`);
console.log(`[zhd] 供应商 ${supplierCodes.length} 家: ${supplierList.map((s) => `${s.code}(${s.label})`).join(', ')}`);
console.log(`[zhd] lines.json ${kb(linesOut)}KB · schedule.json ${kb(scheduleOut)}KB · 图层 ${kb(mapOut)}KB（${mapRoutes.length} 条）`);
