// 全量校验地图地点数据的交叉一致性。test_geo_data_layer.mjs 只跑 fixture，
// 真实 public/data 缺少同口径的门，c5fa00fa7 修的两类错标（出发/目的 tourIds
// 混挂、精度缺省）此前没有全量回归守卫。只读公开产物，不改任何数据。
// 用法：npm run audit:map-place-consistency
import fs from 'node:fs';
import path from 'node:path';

const dataDir = path.join(process.cwd(), 'public', 'data');
const CHUNK_SIZE = 24;

const errors = [];
const warnings = [];
const fail = (message) => errors.push(message);
const warn = (message) => warnings.push(message);

function loadJson(fileName) {
  return JSON.parse(fs.readFileSync(path.join(dataDir, fileName), 'utf8'));
}

const places = loadJson('geo-places.json');
const mapIndex = loadJson('tour-map-index.json');
const mapCards = loadJson('tour-map-cards.json');
const toursList = loadJson('tours-list.json');
const toursMeta = loadJson('tours-meta.json');

// ===== 基础标识：placeId 唯一、卡片 id 唯一 =====
const placesById = new Map();
for (const place of places) {
  if (placesById.has(place.placeId)) {
    fail(`重复 placeId: ${place.placeId}（${place.name}）`);
  }
  placesById.set(place.placeId, place);
}

const cardIds = new Set();
for (const card of mapCards) {
  if (!card?.id) fail(`tour-map-cards.json 存在无 id 条目`);
  else if (cardIds.has(card.id)) fail(`tour-map-cards.json 重复卡片 id: ${card.id}`);
  cardIds.add(card?.id);
}

const listIds = new Set(toursList.map((tour) => tour?.id).filter(Boolean));
const indexByTourId = new Map();
for (const entry of mapIndex) {
  if (indexByTourId.has(entry.tourId)) fail(`tour-map-index.json 重复 tourId: ${entry.tourId}`);
  indexByTourId.set(entry.tourId, entry);
}

// ===== 数量对账：index/cards/list/meta 必须同源同量 =====
if (mapIndex.length !== mapCards.length) {
  fail(`tour-map-index(${mapIndex.length}) 与 tour-map-cards(${mapCards.length}) 数量不一致`);
}
if (toursList.length !== mapCards.length) {
  fail(`tours-list(${toursList.length}) 与 tour-map-cards(${mapCards.length}) 数量不一致`);
}
if (toursMeta.totalRecords !== toursList.length) {
  fail(`tours-meta.totalRecords(${toursMeta.totalRecords}) 与 tours-list(${toursList.length}) 不一致`);
}

// ===== 地点字段与坐标健全性 =====
const levels = ['country', 'region', 'city', 'town', 'poi'];
for (const place of places) {
  const label = `${place.name}(${place.placeId})`;
  if (!place.name || !place.city) fail(`${label} 缺 name/city`);
  if (place.coordinateSystem !== 'wgs84') fail(`${label} coordinateSystem=${place.coordinateSystem}`);
  if (!levels.includes(place.level)) fail(`${label} 非法 level=${place.level}`);
  if (!['low', 'medium', 'high'].includes(place.confidence)) fail(`${label} 非法 confidence=${place.confidence}`);
  // 精度缺省补齐（c5fa00fa7）后不允许再出现无精度地点
  if (!['exact', 'approximate'].includes(place.precision)) fail(`${label} 缺失/非法 precision=${place.precision}`);
  if (!Number.isFinite(place.latitude) || !Number.isFinite(place.longitude)) {
    fail(`${label} 坐标非数值: ${place.latitude},${place.longitude}`);
    continue;
  }
  if (place.latitude < -90 || place.latitude > 90 || place.longitude < -180 || place.longitude > 180) {
    fail(`${label} 坐标越界: ${place.latitude},${place.longitude}`);
  }
  if (place.latitude === 0 && place.longitude === 0) {
    fail(`${label} 坐标为 (0,0) 占位值`);
  }
}

// ===== 挂载列表自洽：roles/tourCount 推导、id 引用存在 =====
for (const place of places) {
  const label = `${place.name}(${place.placeId})`;
  for (const key of ['tourIds', 'departureTourIds']) {
    const ids = place[key];
    if (!Array.isArray(ids)) {
      fail(`${label} 缺 ${key} 数组`);
      continue;
    }
    if (new Set(ids).size !== ids.length) fail(`${label} ${key} 存在重复 id`);
    for (const id of ids) {
      if (!cardIds.has(id)) fail(`${label} ${key} 引用不存在的卡片 ${id}`);
    }
  }
  const expectedRoles = [
    ...(place.tourIds?.length > 0 ? ['destination'] : []),
    ...(place.departureTourIds?.length > 0 ? ['departure'] : []),
  ];
  if (JSON.stringify(place.roles) !== JSON.stringify(expectedRoles)) {
    fail(`${label} roles=${JSON.stringify(place.roles)} 与挂载推导 ${JSON.stringify(expectedRoles)} 不一致`);
  }
  if (place.tourCount !== place.tourIds?.length) {
    fail(`${label} tourCount=${place.tourCount} 与 tourIds.length=${place.tourIds?.length} 不一致`);
  }
}

// ===== 核心：正向挂载——地点声称的每条线路，权威挂载表必须指向同一地点 =====
// （c5fa00fa7 的混挂主症状：出发角色的线路出现在目的地点的 tourIds 里）
for (const place of places) {
  const label = `${place.name}(${place.placeId})`;
  for (const id of place.tourIds ?? []) {
    const entry = indexByTourId.get(id);
    if (!entry) {
      fail(`${label} tourIds 引用 ${id} 但 tour-map-index 无此线路`);
    } else if (entry.destinationPlaceId !== place.placeId) {
      const actual = entry.destinationPlaceId
        ? placesById.get(entry.destinationPlaceId)?.name ?? entry.destinationPlaceId
        : '（无目的地挂载）';
      fail(`错挂[目的] ${id} 挂在 ${label}，权威挂载指向 ${actual}`);
    }
  }
  for (const id of place.departureTourIds ?? []) {
    const entry = indexByTourId.get(id);
    if (!entry) {
      fail(`${label} departureTourIds 引用 ${id} 但 tour-map-index 无此线路`);
    } else if (entry.departurePlaceId !== place.placeId) {
      fail(`错挂[出发] ${id} 挂在 ${label}，权威挂载指向 ${entry.departurePlaceId ?? '（无）'}`);
    }
  }
}

// ===== 核心：反向覆盖——权威挂载表的每个 placeId，地点侧必须收到该线路 =====
for (const entry of mapIndex) {
  if (!cardIds.has(entry.tourId)) fail(`tour-map-index 引用不存在的卡片 ${entry.tourId}`);
  if (entry.destinationPlaceId) {
    const place = placesById.get(entry.destinationPlaceId);
    if (!place) fail(`${entry.tourId} 目的地 placeId ${entry.destinationPlaceId} 不在 geo-places 中`);
    else if (!place.tourIds.includes(entry.tourId)) {
      fail(`漏挂[目的] ${entry.tourId} 应挂在 ${place.name}(${place.placeId}) 的 tourIds`);
    }
  } else {
    for (const place of places) {
      if (place.tourIds?.includes(entry.tourId)) {
        fail(`错挂[目的] ${entry.tourId} 无目的地挂载却出现在 ${place.name} 的 tourIds`);
        break;
      }
    }
  }
  if (entry.departurePlaceId) {
    const place = placesById.get(entry.departurePlaceId);
    if (!place) fail(`${entry.tourId} 出发地 placeId ${entry.departurePlaceId} 不在 geo-places 中`);
    else if (!place.departureTourIds.includes(entry.tourId)) {
      fail(`漏挂[出发] ${entry.tourId} 应挂在 ${place.name}(${place.placeId}) 的 departureTourIds`);
    }
  } else {
    for (const place of places) {
      if (place.departureTourIds?.includes(entry.tourId)) {
        fail(`错挂[出发] ${entry.tourId} 无出发挂载却出现在 ${place.name} 的 departureTourIds`);
        break;
      }
    }
  }
}

// ===== 分片卡片：目的地地点的分片内容必须与 tourIds 逐一同序 =====
const placeCardsDir = path.join(dataDir, 'tour-map-place-cards');
const cardsById = new Map(mapCards.map((card) => [card.id, card]));
const destinationPlaces = places.filter((place) => place.roles.includes('destination'));
const seenDirs = new Set();
for (const place of destinationPlaces) {
  const dir = path.join(placeCardsDir, place.placeId);
  seenDirs.add(place.placeId);
  if (!fs.existsSync(dir)) {
    fail(`${place.name}(${place.placeId}) 缺分片目录`);
    continue;
  }
  const files = fs.readdirSync(dir).filter((file) => file.endsWith('.json')).sort(
    (left, right) => Number(path.basename(left, '.json')) - Number(path.basename(right, '.json')),
  );
  const chunkIds = [];
  let shapeBroken = false;
  files.forEach((file, i) => {
    if (path.basename(file, '.json') !== String(i)) {
      fail(`${place.name} 分片文件名断裂: ${file}`);
      shapeBroken = true;
    }
    const chunk = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
    if (!Array.isArray(chunk) || chunk.length === 0 || (i < files.length - 1 && chunk.length !== CHUNK_SIZE)) {
      fail(`${place.name} 分片 ${file} 形状异常（长度 ${Array.isArray(chunk) ? chunk.length : '非数组'}）`);
      shapeBroken = true;
    }
    chunkIds.push(...chunk.map((card) => card?.id));
  });
  if (shapeBroken) continue;
  if (chunkIds.length !== place.tourIds.length) {
    fail(`${place.name} 分片卡片数 ${chunkIds.length} ≠ tourIds 数 ${place.tourIds.length}`);
  } else if (chunkIds.some((id, i) => id !== place.tourIds[i])) {
    fail(`${place.name} 分片内容与 tourIds 顺序不一致`);
  }
}
const orphanDirs = fs.existsSync(placeCardsDir)
  ? fs.readdirSync(placeCardsDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && !seenDirs.has(entry.name))
      .map((entry) => entry.name)
  : [];
for (const orphan of orphanDirs) fail(`孤儿分片目录（无对应目的地地点）: ${orphan}`);

// ===== 近重复警告：同城市同名地点坐标相距 <1km 但 placeId 不同（疑似拆分标记） =====
function haversine(left, right) {
  const rad = Math.PI / 180;
  const dLat = (right.latitude - left.latitude) * rad;
  const dLng = (right.longitude - left.longitude) * rad;
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(left.latitude * rad) * Math.cos(right.latitude * rad) * Math.sin(dLng / 2) ** 2;
  return 6371000 * 2 * Math.asin(Math.sqrt(a));
}
const groups = new Map();
for (const place of places) {
  const key = `${place.city}|${place.normalizedName || place.name}`;
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(place);
}
for (const [key, group] of groups) {
  if (group.length < 2) continue;
  for (let i = 0; i < group.length; i += 1) {
    for (let j = i + 1; j < group.length; j += 1) {
      // 纯出发地点不渲染标记（前端按 role 过滤），与目的地重合不构成重复标记
      const visiblePair = group[i].roles.includes('destination') && group[j].roles.includes('destination');
      if (!visiblePair) continue;
      const distance = haversine(group[i], group[j]);
      if (distance < 1000) {
        warn(`近重复地点（相距 ${Math.round(distance)}m）: ${group[i].placeId} / ${group[j].placeId} @ ${key}`);
      }
    }
  }
}

// ===== 汇总 =====
const departureOnly = places.filter((place) => place.roles.length === 1 && place.roles[0] === 'departure').length;
console.log(`地点 ${places.length}（目的地 ${destinationPlaces.length}，纯出发 ${departureOnly}），线路 ${toursList.length}，分片目录 ${destinationPlaces.length}`);
for (const message of warnings.slice(0, 20)) console.log(`WARN: ${message}`);
if (warnings.length > 20) console.log(`WARN: ...另有 ${warnings.length - 20} 条近重复警告`);
if (errors.length > 0) {
  for (const message of errors.slice(0, 30)) console.error(`ERROR: ${message}`);
  if (errors.length > 30) console.error(`ERROR: ...另有 ${errors.length - 30} 条`);
  console.error(`地图地点一致性审计失败：${errors.length} 处错误`);
  process.exit(1);
}
console.log('地图地点一致性审计通过');
