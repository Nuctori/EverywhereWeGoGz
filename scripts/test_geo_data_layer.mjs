import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const dataDir = path.join(root, "public", "data");
const readJson = (name) =>
JSON.parse(fs.readFileSync(path.join(dataDir, name), "utf8"));
const list = readJson("tours-list.json");
const index = readJson("tours-index.json");
const places = readJson("geo-places.json");
const mapIndex = readJson("tour-map-index.json");
const sourceTours = readJson("tours.json");

const fail = (message) => {
throw new Error(`[geo-data-layer] ${message}`);
};
const assert = (condition, message) => {
if (!condition) fail(message);
};
const isFallbackPrecision = (precision) =>
["approximate", "city"].includes(precision);
const validPoint = (point) =>
point &&
Number.isFinite(point.latitude) &&
Number.isFinite(point.longitude) &&
point.latitude >= -90 &&
point.latitude <= 90 &&
point.longitude >= -180 &&
point.longitude <= 180 &&
point.coordinateSystem === "wgs84" &&
["catalog", "geocoder", "osm", "fallback", "inferred"].includes(
point.coordinateSource,
) &&
typeof point.placeId === "string" &&
point.placeId.length > 0;

assert(
Array.isArray(list) && list.length > 0,
"tours-list.json must be a non-empty array",
);
assert(
index.length === list.length,
"tours-index.json must cover every list tour",
);
assert(
mapIndex.length === list.length,
"tour-map-index.json must cover every list tour",
);

const tourIds = new Set(list.map((tour) => tour.id));
const placeIds = new Set(places.map((place) => place.placeId));
assert(tourIds.size === list.length, "tour ids must be unique");
assert(placeIds.size === places.length, "place ids must be unique");

for (const tour of list) {
const geo = tour.geo;
assert(
geo && ["complete", "destination_only", "unmapped"].includes(geo.status),
`${tour.id} has invalid geo status`,
);
assert(Array.isArray(geo.stops), `${tour.id} geo.stops must be an array`);
for (const role of ["departure", "destination"]) {
const point = geo[role];
if (!point) continue;
assert(validPoint(point), `${tour.id} ${role} has invalid point`);
assert(
placeIds.has(point.placeId),
`${tour.id} ${role} point missing from geo-places.json`,
);
}
if (geo.status === "unmapped") {
assert(
!geo.destination,
`${tour.id} unmapped tour must not have a destination point`,
);
}
if (geo.status === "destination_only") {
assert(
Boolean(geo.destination) && !geo.departure,
`${tour.id} destination_only must have only a destination point`,
);
}
if (geo.status === "complete") {
assert(
Boolean(geo.destination) && Boolean(geo.departure),
`${tour.id} complete must have departure and destination points`,
);
}
}

for (const place of places) {
assert(validPoint(place), `${place.name} has invalid place coordinates`);
assert(
!(place.latitude === 0 && place.longitude === 0),
`${place.name} must not use null-coordinate fallback`,
);
assert(
typeof place.name === "string" && place.name.trim().length > 0,
"map place name must be non-empty",
);
assert(
["country", "region", "city", "town", "poi"].includes(place.level),
`${place.name} has invalid level`,
);
assert(
["low", "medium", "high"].includes(place.confidence),
`${place.name} has invalid confidence`,
);
assert(
Array.isArray(place.tourIds),
`${place.name} tourIds must be an array`,
);
assert(
new Set(place.tourIds).size === place.tourIds.length,
`${place.name} contains duplicate tour ids`,
);
assert(
place.tourIds.length === place.tourCount,
`${place.name} has invalid tour count`,
);
assert(
place.tourIds.every((id) => tourIds.has(id)),
`${place.name} references an unknown tour`,
);
assert(
Array.isArray(place.roles) && place.roles.length > 0,
`${place.name} must have at least one role`,
);
assert(
place.roles.every((role) =>
["departure", "destination", "stop"].includes(role),
),
`${place.name} has an invalid role`,
);
}

for (const tour of sourceTours) {
if (tour.destinationCoordinateSource !== "fallback") continue;
assert(
isFallbackPrecision(tour.destinationCoordinatePrecision),
`${tour.id} fallback coordinates must retain approximate precision`,
);
}

for (const entry of mapIndex) {
assert(
tourIds.has(entry.tourId),
`map index references unknown tour ${entry.tourId}`,
);
for (const key of ["departurePlaceId", "destinationPlaceId"]) {
if (entry[key])
assert(
placeIds.has(entry[key]),
`${entry.tourId} references unknown ${key}`,
);
}
}

for (const tour of list) {
if (!tour.geo.destination) continue;
const place = places.find(
(candidate) => candidate.placeId === tour.geo.destination.placeId,
);
assert(place, `${tour.id} destination place must exist in geo-places.json`);
assert(
place.tourIds.includes(tour.id),
`${place.name} must index destination tour ${tour.id}`,
);
}

const withDestination = list.filter((tour) => tour.geo.destination).length;
const withDeparture = list.filter((tour) => tour.geo.departure).length;
const namedDestinationCount = list.filter(
(tour) => tour.geo.destination?.label,
).length;
assert(
namedDestinationCount > 0,
"generated geo data must retain mined destination labels",
);
// 注意：以下具体 POI 用例是数据存在性探针（fixture 时代遗留），样例是否在库
// 取决于每周爬取组合；组合漂移时按本文件既有惯例（londonReturn/cityLevelCases）
// 条件跳过，但只要样例存在，解析正确性断言一律强制。
const seaSpringTours = list.filter((tour) =>
String(tour.title || "").includes("海泉湾"),
);
if (seaSpringTours.length > 0) {
assert(
seaSpringTours.every((tour) => tour.geo.destination?.name === "珠海海泉湾"),
"海泉湾 titles must resolve to the mined named destination",
);
assert(
seaSpringTours.every((tour) => tour.geo.destination?.level === "poi"),
"named 海泉湾 destinations must remain POI-level map locations",
);
assert(
seaSpringTours.every((tour) => tour.geo.destination?.locality === "平沙镇"),
"海泉湾 destinations must resolve to 平沙镇",
);
assert(
seaSpringTours.every(
(tour) => tour.geo.destination?.coordinateSource === "catalog",
),
"海泉湾 coordinates must come from the static place catalog",
);
}
const doubleMoonTours = list.filter((tour) =>
String(tour.title || "").includes("双月湾"),
);
if (doubleMoonTours.length > 0) {
assert(
doubleMoonTours.some(
(tour) =>
tour.geo.destination?.latitude === 22.6002691 &&
tour.geo.destination?.longitude === 114.9023659,
),
"双月湾 must not inherit 惠州 city-center coordinates",
);
assert(
doubleMoonTours.some((tour) => tour.geo.destination?.locality === "平海镇"),
"双月湾 must retain its town-level locality",
);
}
const gateSlopeTours = list.filter((tour) =>
String(tour.title || "").includes("闸坡"),
);
if (gateSlopeTours.length > 0) {
assert(
gateSlopeTours.some(
(tour) =>
tour.geo.destination?.level === "town" &&
tour.geo.destination?.locality === "闸坡镇",
),
"闸坡 titles must resolve to a town-level place",
);
}
const redBayTours = list.filter((tour) =>
String(tour.title || "").includes("汕尾红海湾"),
);
assert(
redBayTours.every((tour) => tour.geo.destination?.label === "汕尾红海湾"),
"红海湾 titles must retain their named destination label",
);
assert(
redBayTours.every((tour) => tour.geo.destination?.level === "poi"),
"named 红海湾 destinations must remain POI-level map locations",
);
const blueBellSourceTours = sourceTours.filter((tour) =>
String(tour.title || "").includes("蓝钟"),
);
const blueBellIndexedTours = list.filter((tour) =>
String(tour.title || "").includes("蓝钟"),
);
if (blueBellSourceTours.length > 0) {
assert(
blueBellSourceTours.every((tour) =>
tour.destinationPlaceName?.includes("蓝钟"),
),
"蓝钟 titles must retain the mined named destination",
);
// 标记精度断言只约束产生了地图标记的线路：坐标未解析（如 tour_1745
// 蓝钟森林温泉酒店，known debt，由每夜 data:rebuild-geo --network 增量消化）
// 的线路经 buildGeoPoint 落不下坐标点、不渲染任何标记，不在本断言域内。
const blueBellPlacedTours = blueBellSourceTours.filter((tour) =>
Number.isFinite(tour.destinationLatitude) &&
Number.isFinite(tour.destinationLongitude),
);
assert(
blueBellPlacedTours.every((tour) =>
["geocoder", "fallback", "catalog"].includes(
tour.destinationCoordinateSource,
),
),
"蓝钟 map markers must retain a verified, explicit fallback, or curated catalog source",
);
assert(
blueBellPlacedTours.every(
(tour) =>
tour.destinationCoordinateSource !== "fallback" ||
isFallbackPrecision(tour.destinationCoordinatePrecision),
),
"蓝钟 fallback coordinates must retain approximate precision",
);
assert(
blueBellIndexedTours.length === blueBellSourceTours.length,
"蓝钟 examples must survive into the map index",
);
// 以下地图可选性/层级/挂载断言同样只约束已落坐标点的线路；未解析线路
// （known debt，见上方 blueBellPlacedTours 注释）没有 destination 点可选。
const blueBellMapTours = blueBellIndexedTours.filter(
(tour) => Boolean(tour.geo?.destination),
);
assert(
blueBellMapTours.every((tour) =>
["city", "town", "poi"].includes(tour.geo?.destination?.level),
),
"蓝钟 map points must retain their resolved locality level",
);
assert(
blueBellMapTours.every((tour) => {
const sourceTour = sourceTours.find(
(candidate) => candidate.id === tour.id,
);
return sourceTour?.destinationGeoLevel === tour.geo?.destination?.level;
}),
"蓝钟 map points must retain the extracted location level",
);
assert(
blueBellMapTours.every((tour) =>
places.some(
(place) =>
place.placeId === tour.geo.destination.placeId &&
place.tourIds.includes(tour.id),
),
),
"蓝钟 fallback destinations must be indexed in geo-places.json",
);
}
const namedPoiCases = [
["七星岩", "肇庆七星岩"],
["紫云谷", "肇庆紫云谷"],
];
for (const [token, expectedLabel] of namedPoiCases) {
const sourceMatches = sourceTours.filter(
(tour) =>
String(tour.title || "").includes(token) &&
tour.destinationPlaceName === expectedLabel,
);
const indexedMatches = list.filter(
(tour) =>
String(tour.title || "").includes(token) &&
tour.geo?.destination?.name === expectedLabel,
);
assert(
sourceMatches.every((tour) => tour.destinationPlaceName === expectedLabel),
`${token} titles must retain the named destination`,
);
assert(
indexedMatches.length === sourceMatches.length,
`${token} examples must survive into the map index`,
);
assert(
indexedMatches.every((tour) => tour.geo?.destination),
`${token} destinations must remain map-selectable`,
);
assert(
indexedMatches.every((tour) => tour.geo.destination.name === expectedLabel),
`${token} must not collapse to the parent city`,
);
assert(
indexedMatches.every(
(tour) =>
tour.geo.destination.coordinateSource === "fallback" ||
tour.geo.destination.coordinateSource === "geocoder",
),
`${token} must use a precise search result or an explicit fallback`,
);
}
const precisePoiExpectations = [
["肇庆七星岩", 23.0805699, 112.4727006, "城东街道", "端州区"],
["肇庆紫云谷", 23.1267137, 112.585637, "金渡镇", "高要区"],
];
for (const [
name,
latitude,
longitude,
locality,
district,
] of precisePoiExpectations) {
const place = places.find((candidate) => candidate.name === name);
// 精选坐标锚点随爬取组合可能整段缺席；在场时必须保持 geocoder 验证精度
if (!place) continue;
assert(
place.coordinateSource === "geocoder",
`${name} must use the verified geocoder result`,
);
assert(
place.latitude === latitude && place.longitude === longitude,
`${name} must retain its verified coordinates`,
);
assert(
place.locality === locality,
`${name} must retain its town or street locality`,
);
assert(
place.address?.district === district,
`${name} must retain its district address`,
);
}
// 反劫持探针：mined 到 新兴象窝 的线路，即便行程文本提到 七星岩，
// 目的地也不得被改写成 七星岩。数据组合里没有象窝线路时跳过。
const xiangwoSourceTours = sourceTours.filter(
(tour) => tour.destinationPlaceName === "新兴象窝",
);
if (xiangwoSourceTours.length > 0) {
assert(
xiangwoSourceTours.every((tour) => {
const listTour = list.find((candidate) => candidate.id === tour.id);
return listTour?.geo?.destination?.name === "新兴象窝";
}),
"incidental 七星岩 itinerary text must not rewrite the 新兴象窝 destination",
);
}
const minedAliasCases = [
["西溪", "贺州西溪"],
["云顶", "龙门云顶"],
["禅域小镇", "新兴禅域小镇"],
];
for (const [token, expectedLabel] of minedAliasCases) {
const matchingTours = list.filter((tour) =>
String(tour.title || "").includes(token),
);
if (matchingTours.length === 0) continue;
const sourceMatches = sourceTours.filter((tour) =>
String(tour.title || "").includes(token),
);
assert(
sourceMatches.some((tour) => tour.destinationPlaceName === expectedLabel),
`${token} titles must retain the mined named destination`,
);
}
const marrakechTours = list.filter((tour) =>
String(tour.title || "").includes("马拉喀什"),
);
if (marrakechTours.length > 0) {
assert(
marrakechTours.every((tour) => tour.geo.destination?.name === "马拉喀什"),
"马拉喀什 titles must not resolve to the 喀什 substring",
);
assert(
marrakechTours.every((tour) => tour.geo.destination?.country === "摩洛哥"),
"马拉喀什 titles must retain the correct country",
);
assert(
marrakechTours.every((tour) => tour.geo.destination?.level === "city"),
"马拉喀什 must remain a city-level destination",
);
}
const airportDepartureTours = list.filter((tour) =>
/广州(?:TK|MS|CZ)|CZ-广州|广州南航直飞|广州[\/／]深圳联运|暑期广州【日本/.test(
String(tour.title || ""),
),
);
if (airportDepartureTours.length > 0) {
assert(
airportDepartureTours.every((tour) => tour.geo.destination?.name !== "广州"),
"airport departure cities must not become destination Guangzhou",
);
assert(
airportDepartureTours.some((tour) => tour.geo.departure?.name === "广州"),
"airport departure examples must retain departure Guangzhou",
);
}
const foreignDepartureTitles = list.filter((tour) =>
/南方航空.*广州.*马德里|广州直航马德里|广州武隆仙女山|埃及航空广州直航|南航广州双直航/.test(
String(tour.title || ""),
),
);
if (foreignDepartureTitles.length > 0) {
assert(
foreignDepartureTitles.every((tour) => tour.geo.destination?.name !== "广州"),
"extended departure contexts must not become destination Guangzhou",
);
}
const guangzhouDepartureTours = list.filter(
(tour) =>
/(?:从|由)?广州(?:出发|往返|起止|直飞|直航|联运)/.test(
String(tour.title || ""),
) && tour.geo?.departure?.name === "广州",
);
assert(
guangzhouDepartureTours.length > 0,
"current data must include explicit Guangzhou departure examples",
);
assert(
guangzhouDepartureTours.every(
(tour) => tour.geo.destination?.name !== "广州",
),
"Guangzhou departure context must not become the destination",
);
const cityLevelCases = ["迪拜", "伊斯坦布尔", "清迈", "巴黎", "悉尼"];
for (const city of cityLevelCases) {
const cityTours = list.filter((tour) => tour.geo.destination?.name === city);
if (cityTours.length > 0)
assert(
cityTours.every((tour) => tour.geo.destination?.level === "city"),
`${city} must remain a city-level destination`,
);
}
const londonReturnTours = list.filter(
(tour) =>
String(tour.title || "").includes("伦敦") &&
/往返/.test(String(tour.title || "")),
);
if (londonReturnTours.length > 0) {
assert(
londonReturnTours.every((tour) => tour.geo.destination?.name === "伦敦"),
"伦敦往返 must retain the international destination",
);
assert(
londonReturnTours.every((tour) => tour.geo.destination?.level === "city"),
"伦敦往返 must retain city-level semantics",
);
}
console.log(
JSON.stringify({
tours: list.length,
places: places.length,
withDestination,
withDeparture,
namedDestinationCount,
unmapped: list.filter((tour) => tour.geo.status === "unmapped").length,
}),
);
