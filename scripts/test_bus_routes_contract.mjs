// 站点巴士图层的数据契约：public/data/bus-routes.json 必须与原始拉取一致，
// 且每一行都能被地图安全消费（坐标在中国境内、站点非占位项、线路不重复）。
import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
// 默认校验提交到仓库的生成物；可选参数用于校验一次临时生成（例如改了生成脚本先验后覆盖）。
const outputPath = path.resolve(root, process.argv[2] ?? path.join('public', 'data', 'bus-routes.json'));
const rawPath = path.join(root, 'src', 'data', 'raw_didi_bus_station_sug.json');

const CHINA_BBOX = { minLat: 18, maxLat: 54, minLng: 73, maxLng: 135 };
const PLACEHOLDER_STATION = /任意站点/;

const fail = (message) => {
  throw new Error(`[bus-routes] ${message}`);
};

const insideChina = (lat, lng) =>
  Number.isFinite(lat) && Number.isFinite(lng)
  && lat >= CHINA_BBOX.minLat && lat <= CHINA_BBOX.maxLat
  && lng >= CHINA_BBOX.minLng && lng <= CHINA_BBOX.maxLng;

assert.ok(existsSync(outputPath), `生成物缺失：${path.relative(root, outputPath)}，先跑 npm run data:bus-routes`);
assert.ok(statSync(outputPath).size < 5 * 1024 * 1024, 'bus-routes.json 不应超过 5MB');

const payload = JSON.parse(readFileSync(outputPath, 'utf8'));

assert.equal(payload.coordinateSystem, 'gcj02', '滴滴返回的是 GCJ-02 坐标，必须显式声明');
assert.equal(typeof payload.generatedAt, 'string');
assert.equal(payload.source?.provider, '滴滴站点巴士');
assert.ok(Array.isArray(payload.origins) && payload.origins.length === 2, `应有 2 个出发城市，实际 ${payload.origins?.length}`);
assert.ok(Array.isArray(payload.routes) && payload.routes.length >= 20, `至少 20 条线路，实际 ${payload.routes?.length}`);

const originsByName = new Map(payload.origins.map((origin) => [origin.name, origin]));
assert.deepEqual([...originsByName.keys()].sort(), ['广州市', '江门市']);

for (const origin of payload.origins) {
  assert.ok(Number.isInteger(origin.cityId) && origin.cityId > 0, `${origin.name} 缺少 cityId`);
  assert.ok(insideChina(origin.lat, origin.lng), `${origin.name} 城市中心坐标越界：${origin.lat},${origin.lng}`);
  assert.ok(Array.isArray(origin.stations) && origin.stations.length > 0, `${origin.name} 缺少出发站点`);
}

const isRealStation = (station) =>
  Number.isInteger(station.id) && station.id > 0
  && typeof station.name === 'string' && station.name.trim().length > 0
  && !PLACEHOLDER_STATION.test(station.name)
  && insideChina(station.lat, station.lng);

for (const origin of payload.origins) {
  for (const station of origin.stations) {
    assert.ok(isRealStation(station), `${origin.name} 出发站点非法：${JSON.stringify(station)}`);
  }
}

const routeIds = new Set();
const routePairs = new Set();
const routeStationTotal = { count: 0 };

for (const route of payload.routes) {
  assert.ok(typeof route.id === 'string' && route.id.length > 0, '线路缺少 id');
  assert.ok(!routeIds.has(route.id), `线路 id 重复：${route.id}`);
  routeIds.add(route.id);

  const origin = payload.origins.find((entry) => entry.cityId === route.originCityId);
  assert.ok(origin, `线路 ${route.id} 的出发城市 ${route.originCityId} 不在 origins 中`);
  assert.ok(route.destination && Number.isInteger(route.destination.cityId), `线路 ${route.id} 缺少到达城市`);
  assert.notEqual(route.destination.cityId, route.originCityId, `线路 ${route.id} 不应是出发城市自己`);
  assert.ok(insideChina(route.destination.lat, route.destination.lng), `线路 ${route.id} 到达城市坐标越界`);
  assert.ok(typeof route.destination.name === 'string' && route.destination.name.length > 0);

  assert.ok(Array.isArray(route.stations) && route.stations.length > 0, `线路 ${route.id} 没有站点`);
  const stationIds = new Set();
  for (const station of route.stations) {
    assert.ok(isRealStation(station), `线路 ${route.id} 站点非法：${JSON.stringify(station)}`);
    assert.ok(!stationIds.has(station.id), `线路 ${route.id} 站点重复：${station.id}`);
    stationIds.add(station.id);
  }
  assert.equal(
    route.destination.stationCount,
    route.stations.length,
    `线路 ${route.id} 的 stationCount 与站点列表不一致`,
  );
  routeStationTotal.count += route.stations.length;
  routePairs.add(`${route.originCityId}->${route.destination.cityId}`);
}

assert.ok(routeStationTotal.count > 400, `站点总量过少（${routeStationTotal.count}），可能拉到了异常空数据`);

// 每个目的地都要带省份代码（区县行政区划前缀）：44 广东、45 广西、81 香港。
// 非广东线路保留在图上，但必须能被区分（地图用灰色虚线标注），不能在数据层就丢掉。
for (const route of payload.routes) {
  assert.match(
    String(route.destination.provinceCode),
    /^\d{2}$/,
    `线路 ${route.id}（${route.destination.name}）缺少两位省份代码`,
  );
}

// 坐标正确性：站点必须落在自己城市附近。最远的真实情况是清远连州（约 141km），
// 超过 150km 基本可以判定坐标串了城市，宁可让测试失败也不要在图上画错点。
const MAX_STATION_OFFSET_KM = 150;
const distanceKm = (a, b) => {
  const toRad = (value) => (value * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(h)));
};

for (const origin of payload.origins) {
  for (const station of origin.stations) {
    const offset = distanceKm(origin, station);
    assert.ok(
      offset <= MAX_STATION_OFFSET_KM,
      `${origin.name} 的站点「${station.name}」离城市中心 ${Math.round(offset)}km，坐标可能有误`,
    );
  }
}

for (const route of payload.routes) {
  for (const station of route.stations) {
    const offset = distanceKm(route.destination, station);
    assert.ok(
      offset <= MAX_STATION_OFFSET_KM,
      `${route.destination.name} 的站点「${station.name}」离城市中心 ${Math.round(offset)}km，坐标可能有误`,
    );
  }
}

for (const origin of payload.origins) {
  const served = payload.routes.filter((route) => route.originCityId === origin.cityId);
  assert.ok(served.length > 0, `${origin.name} 没有任何线路`);
}

// 与原始响应对齐（原始文件在仓库里时才做）：每个「出发城市 → 可达城市」都必须出现，
// 且不多出数据里没有的城市对。原始响应不随仓库分发时，这一步跳过并明确说明，
// 而不是让它静默通过。
if (existsSync(rawPath)) {
  const raw = JSON.parse(readFileSync(rawPath, 'utf8'));
  const expectedPairs = new Set();
  for (const [originName, data] of Object.entries(raw)) {
    const origin = originsByName.get(originName);
    assert.ok(origin, `原始数据里的出发城市 ${originName} 未出现在生成物中`);
    for (const group of data.city_list_v2 ?? []) {
      for (const city of group.cities ?? []) {
        if (city.cityid === origin.cityId) continue;
        expectedPairs.add(`${origin.cityId}->${city.cityid}`);
      }
    }
  }

  const missingPairs = [...expectedPairs].filter((pair) => !routePairs.has(pair));
  const extraPairs = [...routePairs].filter((pair) => !expectedPairs.has(pair));
  if (missingPairs.length || extraPairs.length) {
    fail(`线路城市对与原始数据不一致，缺 ${JSON.stringify(missingPairs)}，多 ${JSON.stringify(extraPairs)}`);
  }
} else {
  console.log(`[bus-routes] 跳过原始响应交叉校验：${path.relative(root, rawPath)} 不在仓库里`);
}

console.log(
  `[bus-routes] ok：${payload.origins.length} 个出发城市 / ${payload.routes.length} 条线路 / ${routeStationTotal.count} 个站点`,
);
