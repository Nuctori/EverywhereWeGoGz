// 线路明细（乔巴士）数据契约：每条线路必须是一条能画的折线，且两端都有真实坐标。
import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputPath = path.join(root, 'public/data/bus-lines.json');

const CHINA = { minLat: 18, maxLat: 54, minLng: 73, maxLng: 135 };
const fail = (message) => {
  throw new Error(`[bus-lines] ${message}`);
};
const insideChina = (lat, lng) =>
  Number.isFinite(lat) && Number.isFinite(lng)
  && lat >= CHINA.minLat && lat <= CHINA.maxLat
  && lng >= CHINA.minLng && lng <= CHINA.maxLng;

assert.ok(existsSync(outputPath), `生成物缺失：${path.relative(root, outputPath)}，先跑 npm run data:bus-lines`);
assert.ok(statSync(outputPath).size < 2 * 1024 * 1024, 'bus-lines.json 不应超过 2MB');

const payload = JSON.parse(readFileSync(outputPath, 'utf8'));
assert.equal(typeof payload.generatedAt, 'string');
assert.ok(Array.isArray(payload.source?.providers) && payload.source.providers.length > 0, '缺少数据来源说明');
assert.ok(Array.isArray(payload.routes) && payload.routes.length > 0, '至少要有 1 条线路');

const ids = new Set();
let stopTotal = 0;
for (const route of payload.routes) {
  assert.ok(typeof route.id === 'string' && /^(qbs|didi|cx)-/.test(route.id), `线路 id 非法：${route.id}`);
  assert.ok(!ids.has(route.id), `线路 id 重复：${route.id}`);
  ids.add(route.id);
  assert.ok(route.name.length > 0, `${route.id} 缺少线路名`);
  // 两个来源坐标系不同，必须逐条声明，前端据此换算
  assert.ok(
    route.coordinateSystem === 'wgs84' || route.coordinateSystem === 'gcj02',
    `${route.id} 坐标系非法：${route.coordinateSystem}`,
  );
  assert.ok(Array.isArray(route.departTimes), `${route.id} 班次字段不是数组`);
  assert.ok(route.priceFen === null || route.priceFen > 0, `${route.id} 票价异常：${route.priceFen}`);

  const stops = route.stops;
  assert.ok(Array.isArray(stops) && stops.length >= 2, `${route.id} 至少要有上车点和下车点`);

  for (const stop of stops) {
    assert.ok(typeof stop.name === 'string' && stop.name.trim().length > 0, `${route.id} 有站点缺名称`);
    assert.ok(insideChina(stop.lat, stop.lng), `${route.id} 的站点「${stop.name}」坐标越界：${stop.lat},${stop.lng}`);
    assert.ok(stop.role === 'board' || stop.role === 'alight', `${route.id} 的站点「${stop.name}」角色非法：${stop.role}`);
    assert.ok(
      ['node', 'county', 'city'].includes(stop.precision ?? 'node'),
      `${route.id} 的站点「${stop.name}」精度标记非法：${stop.precision}`,
    );
  }
  // 站点顺序必须是「先上车站、后下车站」，否则连线会在两个城市之间来回跳。
  const firstAlight = stops.findIndex((stop) => stop.role === 'alight');
  assert.ok(firstAlight > 0, `${route.id} 没有上车点`);
  assert.ok(
    stops.slice(firstAlight).every((stop) => stop.role === 'alight'),
    `${route.id} 的站点顺序不是"上车点在前、下车点在后"`,
  );

  // 同一线路内不应出现完全重复的站点（同一名字同一坐标）
  const seenStops = new Set();
  for (const stop of stops) {
    const key = `${stop.name}|${stop.lat.toFixed(5)}|${stop.lng.toFixed(5)}`;
    assert.ok(!seenStops.has(key), `${route.id} 站点重复：${stop.name}`);
    seenStops.add(key);
  }
  stopTotal += stops.length;
}

console.log(`[bus-lines] ok：${payload.routes.length} 条线路 / ${stopTotal} 个站点`);

// 创想巴士（车盈网白牌小程序）原始数据在库里时，成品必须真的带上了它的线路：
// 只声明来源却不落线路，等于把一家渠道静默丢掉。
const cxRawPath = path.join(root, 'src/data/raw_cx_lines.json');
const cxOutputPath = path.join(root, 'public/data/bus-lines-cx.json');
if (existsSync(cxRawPath)) {
  const cxRaw = JSON.parse(readFileSync(cxRawPath, 'utf8'));
  const cxRawLines = (cxRaw.routes ?? []).filter(
    (route) => (route.board ?? []).length > 0 && (route.alight ?? []).length > 0,
  );
  assert.ok(cxRawLines.length > 0, 'raw_cx_lines.json 里没有任何可用线路，先重新采集');
  assert.ok(existsSync(cxOutputPath), '缺少 bus-lines-cx.json，先跑 npm run data:bus-lines');
  assert.ok(statSync(cxOutputPath).size < 2 * 1024 * 1024, 'bus-lines-cx.json 不应超过 2MB');

  const cxPayload = JSON.parse(readFileSync(cxOutputPath, 'utf8'));
  assert.ok(
    cxPayload.source?.providers?.some((name) => name.includes('创想巴士')),
    'bus-lines-cx.json 的 source.providers 没写创想巴士',
  );
  assert.equal(
    cxPayload.routes.length,
    cxRawLines.length,
    `创想巴士线路数对不上：原始 ${cxRawLines.length} 条，成品 ${cxPayload.routes.length} 条`,
  );
  for (const route of cxPayload.routes) {
    assert.ok(route.id.startsWith('cx-'), `创想巴士线路 id 前缀不对：${route.id}`);
    // 这家渠道的坐标是接口原生 GCJ-02，混成 wgs84 会让整条线在底图上偏 500 米。
    assert.equal(route.coordinateSystem, 'gcj02', `${route.id} 坐标系应为 gcj02`);
  }
  const overlapped = cxPayload.routes.filter((route) => ids.has(route.id));
  assert.equal(overlapped.length, 0, `两个文件出现重复线路 id：${overlapped[0]?.id}`);
  console.log(`[bus-lines] 创想巴士：${cxPayload.routes.length} 条线路已接入`);
}
