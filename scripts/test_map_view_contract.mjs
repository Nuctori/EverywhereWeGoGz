import fs from 'node:fs';

const source = fs.readFileSync('src/sections/MapView.tsx', 'utf8');
const detailModal = fs.readFileSync('src/sections/TourDetailModal.tsx', 'utf8');
const tilePool = fs.readFileSync('src/lib/map-tile-pool.ts', 'utf8');
const app = fs.readFileSync('src/App.tsx', 'utf8');
const main = fs.readFileSync('src/main.tsx', 'utf8');
const mapTours = fs.readFileSync('src/hooks/use-map-tours.ts', 'utf8');
const serviceWorker = fs.readFileSync('public/sw.js', 'utf8');

const assert = (condition, message) => {
  if (!condition) throw new Error(`[map-view-contract] ${message}`);
};

assert(source.includes("'tileerror'"), 'MapView must observe tile failures');
assert(source.includes('MAP_TILE_PROVIDERS.length'), 'MapView must use the tile provider pool');
assert(source.includes('providerIndex'), 'MapView must advance through tile providers');
assert(source.includes('setProviderIndex(0)'), 'retry must restart the tile provider pool');
assert(!source.includes('tileLoadCountRef.current > 0) return'), 'partial tile success must not block provider fallback');
assert(source.includes('底图暂时无法连接'), 'MapView must expose a visible tile fallback');
assert(source.includes('所有免费瓦片源都不可用'), 'tile fallback must explain the provider pool failure');
assert(source.includes('重新尝试'), 'tile fallback must provide a retry action');
assert(source.includes('scrollWheelZoom: true'), 'MapView must enable wheel zoom');
assert(source.includes('tourIds.map'), 'marker selection must resolve tours from the place tour ids');
assert(!source.includes('slice(0, MAP_TOUR_LIMIT)'), 'place panel must expose every tour indexed at the selected destination');
assert(source.includes('PlaceToursPanel'), 'marker selection must open the place tour panel');
assert(source.includes('marker.options.title = locationLabel'), 'markers must expose the specific mined location label');
assert(source.includes("className: 'destination-marker-icon'"), 'individual destination markers must not depend on missing Leaflet image assets');
assert(source.includes('selectTour'), 'map tour cards must open the existing tour detail flow');
assert(source.includes('setSelectedPlace(null);'), 'opening tour details must close the place panel');
assert(source.includes('onTourClick={openTourDetail}'), 'place panel must use the single-step tour detail handler');
assert(source.includes('z-[40]'), 'expanded map must remain below the tour detail modal layer');
assert((detailModal.match(/z-\[80\]/g) || []).length >= 2, 'desktop and mobile tour detail layers must sit above the expanded map');
assert(source.includes('embedded?: boolean'), 'MapView must support an embedded homepage placement');
// 内嵌预览与展开态占位现在合并进同一个 `embedded &&` 分支（展开时内嵌位置留占位撑住布局），
// 旧断言的字面量 `!expanded && embedded` 在该重构后不再存在，故按现行结构断言两段语义。
assert(
  source.includes('{embedded && (') && source.includes('地图已放大，关闭后回到这里。'),
  'embedded MapView must render the homepage preview and hold its slot while expanded',
);
assert(source.includes("'正在加载已定位地点…'"), 'homepage map must not label an in-flight location load as zero places');
assert(source.includes('放大地图'), 'home map must provide an expand control');
assert(source.includes('点地点，直接看对应旅行团'), 'expanded map must keep place-first interaction');
assert(mapTours.includes('tour-map-place-cards/'), 'map tours must load compact cards per selected place');
assert(mapTours.includes('PLACE_TOUR_CHUNK_SIZE'), 'map tours must bound each place card request');
assert(mapTours.includes('${chunkIndex}.json'), 'map tours must request the next place card chunk');
assert(source.includes('加载更多线路'), 'place panels must expose incremental loading for large destinations');
assert(source.includes('placeToursComplete'), 'place panels must know when all destination cards are loaded');
assert(!mapTours.includes("getDataUrl('tour-map-cards.json')"), 'map tours must not block on the all-tour card index');
assert(serviceWorker.includes("self.location.hostname === 'localhost'"), 'local development must bypass the CDN service worker data path');
assert(main.includes('navigator.serviceWorker.getRegistrations()'), 'local development must remove stale service worker registrations');
assert(main.includes("['localhost', '127.0.0.1', '::1']"), 'local service worker bypass must cover local hostnames');
assert(source.includes('map.remove()'), 'MapView must clean up the Leaflet instance');
assert(source.includes('wgs84ToGcj02'), 'MapView must convert coordinates for GCJ-02 tiles');
const focusBusLine = source.match(/const focusBusLine = \(line: BusLine\) => \{([\s\S]*?)\n  \};/)?.[1] ?? '';
assert(/\.filter\(\(point\) => point != null\);\s*if \(points\.length < 2\) return;\s*const bounds = L\.latLngBounds\(points\)/.test(focusBusLine),
  'Bus focus must discard null converted points and require two usable points before fitting bounds');
assert(source.includes('isWithinChinaCoverage'), 'MapView must keep the domestic provider at a usable China viewport');
assert(source.includes('viewportPlaces'), 'MapView must adapt the viewport to provider coverage');
assert(source.includes('map.getZoom() < 3'), 'MapView must avoid blank low-zoom domestic raster tiles');
assert(source.includes('PlaceClusterPanel'), 'dense destination markers must expose a place chooser');
assert(source.includes('zoomend moveend'), 'destination markers must regroup after map navigation');
assert(source.includes('相近地点'), 'dense destination chooser must explain why it is shown');
assert(source.includes('fanOutMarkerPixels'), 'distinct nearby places must use a deterministic fan-out layout');
assert(source.includes('markerCollisionRadius'), 'marker collision distance must respond to zoom level');
assert(source.includes('maxIndependentMarkers'), 'independent marker capacity must respond to zoom level');
assert(source.includes('const zoom = map.getZoom()'), 'marker rendering must read the current map zoom');
assert(source.includes('const maximumZoom = map.getMaxZoom()'), 'marker rendering must know the tile layer maximum zoom');
assert(source.includes("data-map-zoom"), 'MapView must expose its current zoom for runtime verification');
assert(source.includes("data-map-max-zoom"), 'MapView must expose its configured maximum zoom for runtime verification');
assert(source.includes('atMaximumZoom'), 'maximum zoom must disable destination clustering');
assert(source.includes('FULL_DETAIL_ZOOM'), 'detail zoom must disable clustering before the absolute tile maximum');
assert(source.includes('Number.POSITIVE_INFINITY'), 'maximum zoom must allow every nearby destination marker');
assert(source.includes('setClusterPlaces((current) => current.length > 0 ? [] : current)'), 'maximum zoom must close stale cluster panels');
assert(source.includes('containerPointToLatLng(candidate.pixel)'), 'fan-out markers must be converted back to map coordinates');
assert(source.includes('place.placeId.localeCompare'), 'fan-out ordering must be stable by place identity');
assert(source.includes('locality'), 'map place chooser must expose town or street locality');
assert(source.includes('town'), 'map view must distinguish town-level destinations');
assert(mapTours.includes('function isApproximateMapPoint'), 'map tours must classify approximate destination points');
assert(mapTours.includes("point.coordinateSource === 'fallback'"), 'map tours must identify coarse fallback points');
assert(mapTours.includes("point.level === 'city'"), 'map tours must identify city-level points');
assert(mapTours.includes("point.coordinateSource === 'inferred' && point.confidence === 'low'"), 'map tours must identify low-confidence inferred points');
assert(mapTours.includes('approximateTourCount'), 'map tours must expose approximate route count without hiding locations');
assert(source.includes('min(280px,calc(100%_-_1.5rem))'), 'compact map panels must keep a readable width on narrow maps');
assert(!source.includes('min(330px,42%)'), 'compact map panels must not use percentage width that causes character wrapping');
assert(tilePool.includes("id: 'amap-direct'"), 'tile pool must prefer the domestic AMap tile source');
assert(tilePool.includes("id: 'osm-bfsu'"), 'tile pool must include the BFSU fallback');
assert(tilePool.includes("id: 'osm-bjtu'"), 'tile pool must include the BJTU fallback');
assert(tilePool.includes("id: 'osm-official'"), 'tile pool must include the official OSM fallback');
assert(tilePool.includes("coordinateSystem: 'gcj02'"), 'tile pool must declare GCJ-02 coordinates');
assert(tilePool.includes('export function wgs84ToGcj02'), 'tile pool must expose the coordinate conversion');
// App 改成懒加载后再挂载（首屏不为地图付解析成本），挂载点由 MapView 变成 MapComponent，
// 且带未加载时的占位分支；断言按现行结构走，同时守住 embedded/expanded/onExpandedChange 三个契约。
assert(
  app.includes('<MapComponent embedded expanded={mapExpanded} onExpandedChange={setMapExpanded} />') &&
    app.includes('map={MapComponent ?'),
  'MapView must be mounted in the Hero homepage panel',
);
assert(app.includes('<Header onOpenMap={openMap} />'), 'header must provide a compact map entry');

console.log(JSON.stringify({ checked: 'MapView', tilePool: true, tileFallback: true, searchIntegration: true, headerIntegration: true }));
