// 车盈网数据层契约（三层）：
//   public/data/cyw/lines.json      全部线路 + 完整站点序列
//   public/data/cyw/schedule.json   线路 × 日期 × 班次[时间,票价分,余位]
//   public/data/bus-lines-cyw.json  地图图层视图（<2MB，必须与 schedule 同源）
import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const linesPath = path.join(root, 'public/data/cyw/lines.json');
const schedulePath = path.join(root, 'public/data/cyw/schedule.json');
const mapPath = path.join(root, 'public/data/bus-lines-cyw.json');
const rawPath = path.join(root, 'src/data/raw_cyw_full.json');

const CHINA = { minLat: 18, maxLat: 54, minLng: 73, maxLng: 135 };
const insideChina = (lat, lng) =>
  Number.isFinite(lat) && Number.isFinite(lng)
  && lat >= CHINA.minLat && lat <= CHINA.maxLat
  && lng >= CHINA.minLng && lng <= CHINA.maxLng;

for (const file of [linesPath, schedulePath, mapPath, rawPath]) {
  assert.ok(existsSync(file), `缺少生成物：${path.relative(root, file)}，先跑 npm run data:bus-lines-cyw`);
}

const linesPayload = JSON.parse(readFileSync(linesPath, 'utf8'));
const schedulePayload = JSON.parse(readFileSync(schedulePath, 'utf8'));
const mapPayload = JSON.parse(readFileSync(mapPath, 'utf8'));

// ---- lines.json：全量线路，站点不截断 ----
assert.ok(Array.isArray(linesPayload.lines) && linesPayload.lines.length > 0, 'lines.json 没有线路');
assert.equal(linesPayload.coordinateSystem, 'gcj02', '车盈网坐标系必须是 gcj02');
assert.ok(Array.isArray(linesPayload.stats?.dates) && linesPayload.stats.dates.length >= 30, '日期窗口小于 30 天');

const lineIds = new Set();
let stopTotal = 0;
for (const line of linesPayload.lines) {
  assert.match(line.id, /^cyw-[0-9a-f]{10}$/, `线路 id 非法：${line.id}`);
  assert.ok(!lineIds.has(line.id), `线路 id 重复：${line.id}`);
  lineIds.add(line.id);
  assert.ok(typeof line.name === 'string' && line.name.length > 0, `${line.id} 缺少线路名`);
  assert.ok(Array.isArray(line.stops) && line.stops.length >= 2, `${line.id} 站点不足`);
  assert.ok(line.stops.some((s) => s.role === 'board'), `${line.id} 没有上车站点`);
  assert.ok(line.stops.some((s) => s.role === 'alight'), `${line.id} 没有下车站点`);
  for (const stop of line.stops) {
    assert.ok(typeof stop.name === 'string' && stop.name.trim().length > 0, `${line.id} 有站点缺名称`);
    assert.ok(insideChina(stop.lat, stop.lng), `${line.id}「${stop.name}」坐标越界：${stop.lat},${stop.lng}`);
  }
  stopTotal += line.stops.length;
}

// ---- schedule.json：46 天全量班次 ----
assert.ok(Array.isArray(schedulePayload.dates) && schedulePayload.dates.length > 0, 'schedule 缺日期列表');
const dates = schedulePayload.dates;
assert.deepEqual([...dates].sort(), dates, 'dates 必须升序');
assert.equal(new Set(dates).size, dates.length, 'dates 有重复');

let departureTotal = 0;
let matchedLines = 0;
for (const [lineId, perDate] of Object.entries(schedulePayload.schedule)) {
  assert.ok(lineIds.has(lineId), `schedule 里有 lines.json 不存在���线路：${lineId}`);
  matchedLines += 1;
  const dayKeys = Object.keys(perDate);
  assert.ok(dayKeys.length > 0, `${lineId} 没有任何日期`);
  for (const date of dayKeys) {
    assert.ok(dates.includes(date), `${lineId} 出现窗口外日期：${date}`);
    const departures = perDate[date];
    assert.ok(Array.isArray(departures) && departures.length > 0, `${lineId}@${date} 班次为空`);
    let previousTime = '';
    for (const departure of departures) {
      const [time, priceFen, seats] = departure;
      assert.match(time, /^\d{2}:\d{2}$/, `${lineId}@${date} 班次格式非法：${time}`);
      assert.ok(time > previousTime, `${lineId}@${date} 班次未按时间升序：${time} 在 ${previousTime} 之后`);
      previousTime = time;
      assert.ok(Number.isInteger(priceFen) && priceFen >= 0, `${lineId}@${date} 票价异常：${priceFen}`);
      assert.ok(Number.isInteger(seats) && seats >= 0, `${lineId}@${date} 余位异常：${seats}`);
    }
    departureTotal += departures.length;
  }
}
assert.equal(matchedLines, linesPayload.lines.length, 'schedule 与 lines 的线路集合不一致');
assert.ok(departureTotal >= 70000, `班次总量过低：${departureTotal}（应接近一次全量抓取）`);

// ---- 图层视图：预算 + 与 schedule 同源 ----
assert.ok(statSync(mapPath).size < 2 * 1024 * 1024, 'bus-lines-cyw.json 不应超过 2MB');
assert.ok(Array.isArray(mapPayload.routes) && mapPayload.routes.length > 0, '图层没有线路');
for (const route of mapPayload.routes) {
  assert.ok(route.id.startsWith('cyw-'), `图层线路 id 前缀错误：${route.id}`);
  assert.equal(route.coordinateSystem, 'gcj02', `${route.id} 坐标系必须是 gcj02`);
  const perDate = schedulePayload.schedule[route.id];
  assert.ok(perDate, `${route.id} 在 schedule 中不存在`);
  const dayTimes = perDate[route.date];
  assert.ok(dayTimes, `${route.id} 的图层日期 ${route.date} 在 schedule 中无数据`);
  // 关键：图层展示的班次必须属于它自己声明的那个日期
  for (const time of route.departTimes) {
    assert.ok(
      dayTimes.some(([scheduled]) => scheduled === time),
      `${route.id}@${route.date} 的班次 ${time} 不在该日期的 schedule 里（date 与 departTimes 不同源）`,
    );
  }
  assert.ok(route.stops.length >= 2, `${route.id} 站点不足`);
}

console.log(
  `[bus-lines-cyw] OK ${linesPayload.lines.length} 线路 / ${stopTotal} 站点 / ${dates.length} 天 / `
  + `${departureTotal} 班次 / 图层 ${mapPayload.routes.length} 条 ${(statSync(mapPath).size / 1024).toFixed(0)}KB`,
);
