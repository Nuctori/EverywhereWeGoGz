// 把「滴滴站点巴士」的原始拉取（pStationSug）整理成地图图层数据。
//
// 原始响应是「出发城市 → 可达城市 → 区县 → 站点」的四层结构，一个出发城市一份响应。
// 这里把它翻转成两条独立的事实：
//   origins: 出发城市（含它的全部可用站点）
//   routes : 出发城市 → 每一个可达城市（含到达城市的可用站点）
// 站点巴士接口只给站点坐标、不给逐条线路的站点序列，所以生成物只描述
// 「哪两个城市之间有线路」，地图上按弧线示意，不声称是实际公路路径。
//
// 用法: node scripts/build_bus_routes.mjs [--source <raw.json>] [--out <bus-routes.json>]
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const CHINA_BBOX = { minLat: 18, maxLat: 54, minLng: 73, maxLng: 135 };
const PLACEHOLDER_STATION = /任意站点/;

const args = process.argv.slice(2);
const argValue = (name, fallback) => {
  const index = args.indexOf(name);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
};

const sourcePath = path.resolve(root, argValue('--source', path.join('src', 'data', 'raw_didi_bus_station_sug.json')));
const outPath = path.resolve(root, argValue('--out', path.join('public', 'data', 'bus-routes.json')));

if (!existsSync(sourcePath)) {
  throw new Error(
    `找不到原始拉取：${sourcePath}\n`
    + '把滴滴 pStationSug 的响应（含 广州市/江门市 两份 city_list_v2）放到该路径，'
    + '或用 --source 指定。',
  );
}

const insideChina = (lat, lng) =>
  Number.isFinite(lat) && Number.isFinite(lng)
  && lat >= CHINA_BBOX.minLat && lat <= CHINA_BBOX.maxLat
  && lng >= CHINA_BBOX.minLng && lng <= CHINA_BBOX.maxLng;

const raw = JSON.parse(readFileSync(sourcePath, 'utf8'));

function harvestStations(city) {
  const byId = new Map();
  const push = (station, countyName) => {
    const id = Number(station?.station_id);
    const name = typeof station?.name === 'string' ? station.name.trim() : '';
    const lat = Number(station?.lat);
    const lng = Number(station?.lng);
    if (!Number.isInteger(id) || id <= 0) return;
    if (!name || PLACEHOLDER_STATION.test(name)) return;
    if (!insideChina(lat, lng)) return;
    byId.set(id, { id, name, lat, lng, county: countyName || '' });
  };

  for (const county of city.counties ?? []) {
    for (const station of county.stations ?? []) push(station, county.name);
  }
  // 部分城市把站点直接挂在 city.stations 上，和 counties 下的站点是同一批（按 id 去重）。
  for (const station of city.stations ?? []) push(station, '');

  return [...byId.values()].sort((left, right) => left.name.localeCompare(right.name, 'zh-Hans-CN'));
}

// 城市档案：同一个城市可能在多份响应里出现（例如 广州市 出现在「江门市」的响应里），
// 取第一份带坐标的即可；站点取并集。
const cityProfiles = new Map();
function rememberCity(city) {
  const cityId = Number(city?.cityid);
  const name = typeof city?.name === 'string' ? city.name.trim() : '';
  if (!Number.isInteger(cityId) || cityId <= 0 || !name) return null;
  const profile = cityProfiles.get(cityId)
    ?? { cityId, name, lat: Number.NaN, lng: Number.NaN, stations: new Map(), provinceVotes: new Map() };
  const lat = Number(city?.lat);
  const lng = Number(city?.lng);
  if (!insideChina(profile.lat, profile.lng) && insideChina(lat, lng)) {
    profile.lat = lat;
    profile.lng = lng;
  }
  // 省份用区县行政区划代码的前两位判定（44 广东 / 45 广西 / 81 香港），
  // 不靠城市名列举；同一城市下区县前缀不一致时取出现次数最多的那个。
  for (const county of city.counties ?? []) {
    const code = String(county?.county_id ?? '');
    if (!/^\d{6}$/.test(code)) continue;
    const prefix = code.slice(0, 2);
    profile.provinceVotes.set(prefix, (profile.provinceVotes.get(prefix) ?? 0) + 1);
  }
  for (const station of harvestStations(city)) {
    if (!profile.stations.has(station.id)) profile.stations.set(station.id, station);
  }
  cityProfiles.set(cityId, profile);
  return profile;
}

/** 取票数最高的省份前缀；没有任何区县代码时返回 unknown（按非广东处理）。 */
function provinceCodeOf(profile) {
  const ranked = [...profile.provinceVotes.entries()].sort((left, right) => right[1] - left[1]);
  return ranked[0]?.[0] ?? 'unknown';
}

const originNames = Object.keys(raw);

// 先扫一遍所有响应：出发城市自己的城市档案不一定在自己的响应里
// （「广州市」这条响应只列可达城市，它作为城市出现在「江门市」的响应里）。
for (const originName of originNames) {
  for (const group of raw[originName]?.city_list_v2 ?? []) {
    for (const city of group.cities ?? []) rememberCity(city);
  }
}

const cityIdByName = new Map([...cityProfiles.values()].map((profile) => [profile.name, profile.cityId]));
const originCityIds = new Map();
for (const originName of originNames) {
  const cityId = cityIdByName.get(originName);
  if (!cityId) {
    throw new Error(`原始数据里找不到出发城市「${originName}」自己的城市档案（含城市中心坐标）`);
  }
  originCityIds.set(originName, cityId);
}

const toStationList = (profile) =>
  [...profile.stations.values()].sort((left, right) => left.name.localeCompare(right.name, 'zh-Hans-CN'));

const origins = [...originCityIds.entries()]
  .map(([name, cityId]) => {
    const profile = cityProfiles.get(cityId);
    const stations = toStationList(profile);
    if (stations.length === 0) throw new Error(`出发城市 ${name} 没有可用站点`);
    return { cityId, name, lat: profile.lat, lng: profile.lng, stations };
  })
  .sort((left, right) => left.name.localeCompare(right.name, 'zh-Hans-CN'));

const routes = [];
for (const originName of originNames) {
  const originCityId = originCityIds.get(originName);
  for (const group of raw[originName]?.city_list_v2 ?? []) {
    for (const city of group.cities ?? []) {
      const profile = rememberCity(city);
      if (!profile || profile.cityId === originCityId) continue;
      const stations = toStationList(profile);
      if (stations.length === 0) continue; // 没有可用站点的城市当作不可达，宁缺毋滥
      routes.push({
        id: `${originCityId}-${profile.cityId}`,
        originCityId,
        destination: {
          cityId: profile.cityId,
          name: profile.name,
          lat: profile.lat,
          lng: profile.lng,
          stationCount: stations.length,
          provinceCode: provinceCodeOf(profile),
        },
        stations,
      });
    }
  }
}

if (routes.length < 20) {
  throw new Error(`只解析出 ${routes.length} 条线路，少于 20 条，原始数据可能不完整，拒绝覆盖`);
}

routes.sort((left, right) =>
  left.originCityId - right.originCityId
  || left.destination.name.localeCompare(right.destination.name, 'zh-Hans-CN'));

// 生成时间取自原始文件名里的拉取时间戳，保证同样的输入产出同样的文件（不制造无谓 diff）。
const stampMatch = path.basename(sourcePath).match(/(\d{8})-(\d{4})/);
let generatedAt = new Date(statSync(sourcePath).mtimeMs).toISOString();
if (stampMatch) {
  const [, ymd, hm] = stampMatch;
  const iso = `${ymd.slice(0, 4)}-${ymd.slice(4, 6)}-${ymd.slice(6, 8)}T${hm.slice(0, 2)}:${hm.slice(2, 4)}:00+08:00`;
  if (!Number.isNaN(Date.parse(iso))) generatedAt = new Date(iso).toISOString();
}

const payload = {
  generatedAt,
  coordinateSystem: 'gcj02',
  source: {
    provider: '滴滴站点巴士',
    api: 'pStationSug',
    pulledAt: stampMatch ? `${stampMatch[1]}-${stampMatch[2]}` : '',
    note: '站点与城市中心坐标来自滴滴 H5 接口（GCJ-02）；线路只表示两城之间存在站点巴士，地图上按弧线示意，不是实际行驶路径。',
  },
  origins,
  routes,
};

mkdirSync(path.dirname(outPath), { recursive: true });
writeFileSync(outPath, `${JSON.stringify(payload)}\n`);

const stationTotal = routes.reduce((sum, route) => sum + route.stations.length, 0);
console.log(
  `[bus-routes] ${path.relative(root, outPath)}：${origins.length} 个出发城市 / ${routes.length} 条线路 / ${stationTotal} 个到达站`,
);
