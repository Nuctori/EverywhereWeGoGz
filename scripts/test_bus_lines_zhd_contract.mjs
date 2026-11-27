// 智惠大巴数据层契约（三层 + 供应商标签）：
//   public/data/zhd/lines.json      线路 + 完整站点 + supplier
//   public/data/zhd/schedule.json   线路 × 日期 × 班次[时间,票价分,余位,供应商下标]
//   public/data/bus-lines-zhd.json  地图图层视图（<2MB，与 schedule 同源）
import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const linesPath = path.join(root, 'public/data/zhd/lines.json');
const schedulePath = path.join(root, 'public/data/zhd/schedule.json');
const mapPath = path.join(root, 'public/data/bus-lines-zhd.json');

for (const file of [linesPath, schedulePath, mapPath]) {
  assert.ok(existsSync(file), `缺少生成物：${path.relative(root, file)}，先跑 npm run data:bus-lines-zhd`);
}

const CHINA = { minLat: 18, maxLat: 54, minLng: 73, maxLng: 135 };
const insideChina = (lat, lng) =>
  Number.isFinite(lat) && Number.isFinite(lng)
  && lat >= CHINA.minLat && lat <= CHINA.maxLat
  && lng >= CHINA.minLng && lng <= CHINA.maxLng;

// 独立供应商标签是这次的核心诉求：至少 3 家，且都不是车盈网自营
const KNOWN = new Set(['gzl', 'kgyx', 'zhjc', 'dadui', 'tbs', 'ylx', 'xh', 'cyw']);

const linesPayload = JSON.parse(readFileSync(linesPath, 'utf8'));
const schedulePayload = JSON.parse(readFileSync(schedulePath, 'utf8'));
const mapPayload = JSON.parse(readFileSync(mapPath, 'utf8'));

assert.ok(Array.isArray(linesPayload.lines) && linesPayload.lines.length > 0, 'lines.json 没有线路');
assert.equal(linesPayload.coordinateSystem, 'gcj02');
const supplierCodes = new Set(linesPayload.lines.map((l) => l.supplier));
assert.ok(supplierCodes.size >= 3, `供应商不足 3 家：${[...supplierCodes].join(',')}`);
assert.ok(!supplierCodes.has('cyw'), '车盈网自营数据不应出现在智惠大巴增量里（会与 cyw 源重复）');
for (const code of supplierCodes) assert.ok(KNOWN.has(code), `未知供应商代码：${code}`);
assert.ok(Array.isArray(linesPayload.suppliers) && linesPayload.suppliers.length === supplierCodes.size, 'suppliers 表与线路里的供应商不一致');

const dates = schedulePayload.dates;
// 智惠大巴的放票窗口比车盈网短（望远端多为空），20 天以上即视为完整
assert.ok(Array.isArray(dates) && dates.length >= 20, `日期窗口过短：${dates?.length}`);
assert.deepEqual([...dates].sort(), dates, 'dates 必须升序');
const supplierIndexByCode = Object.fromEntries(schedulePayload.suppliers.map((s, i) => [s.code, i]));

const lineIds = new Set();
let stopTotal = 0;
for (const line of linesPayload.lines) {
  const code = line.supplier;
  assert.ok(line.id.startsWith(`zhd-${code}-`), `线路 id 未按供应商加前缀：${line.id}（supplier=${code}）`);
  assert.ok(!lineIds.has(line.id), `线路 id 重复：${line.id}`);
  lineIds.add(line.id);
  assert.ok(typeof line.supplierLabel === 'string' && line.supplierLabel.length > 0, `${line.id} 缺少供应商中文标签`);
  assert.ok(Array.isArray(line.stops) && line.stops.length >= 2, `${line.id} 站点不足`);
  for (const stop of line.stops) {
    assert.ok(stop.name.trim().length > 0, `${line.id} 有站点缺名称`);
    assert.ok(insideChina(stop.lat, stop.lng), `${line.id}「${stop.name}」坐标越界：${stop.lat},${stop.lng}`);
  }
  stopTotal += line.stops.length;
}

let departures = 0;
let supplierTagged = 0;
for (const [lineId, perDate] of Object.entries(schedulePayload.schedule)) {
  assert.ok(lineIds.has(lineId), `schedule 里有 lines.json 不存在的线路：${lineId}`);
  for (const [date, rows] of Object.entries(perDate)) {
    assert.ok(dates.includes(date), `${lineId} 出现窗口外日期：${date}`);
    let previous = '';
    for (const row of rows) {
      const [time, priceFen, seats, supplierIdx] = row;
      assert.match(time, /^\d{2}:\d{2}$/, `${lineId}@${date} 班次格式非法：${time}`);
      assert.ok(time >= previous, `${lineId}@${date} 班次未按时间升序`);
      previous = time;
      assert.ok(Number.isInteger(priceFen) && priceFen >= 0, `${lineId}@${date} 票价异常`);
      assert.ok(Number.isInteger(seats) && seats >= 0, `${lineId}@${date} 余位异常`);
      assert.ok(
        Number.isInteger(supplierIdx) && supplierIdx >= 0 && supplierIdx < schedulePayload.suppliers.length,
        `${lineId}@${date} 供应商下标越界：${supplierIdx}`,
      );
      supplierTagged += 1;
    }
    departures += rows.length;
  }
}
assert.ok(departures >= 20000, `班次总量过低：${departures}`);
assert.equal(supplierTagged, departures, '有班次缺供应商标签');

assert.ok(statSync(mapPath).size < 2 * 1024 * 1024, 'bus-lines-zhd.json 不应超过 2MB');
for (const route of mapPayload.routes) {
  assert.ok(route.id.startsWith('zhd-'), `图层 id 前缀错误：${route.id}`);
  assert.ok(route.supplier && KNOWN.has(route.supplier), `${route.id} 缺供应商标签`);
  const dayTimes = schedulePayload.schedule[route.id]?.[route.date];
  assert.ok(dayTimes, `${route.id} 的图层日期 ${route.date} 在 schedule 中无数据`);
  for (const time of route.departTimes) {
    assert.ok(dayTimes.some(([t]) => t === time), `${route.id}@${route.date} 的班次 ${time} 不在该日期 schedule 里`);
  }
}

console.log(
  `[bus-lines-zhd] OK ${linesPayload.lines.length} 线路 / ${stopTotal} 站点 / ${dates.length} 天 / `
  + `${departures} 班次 / 供应商 ${[...supplierCodes].join(',')} / 图层 ${mapPayload.routes.length} 条 `
  + `${(statSync(mapPath).size / 1024).toFixed(0)}KB`,
);
