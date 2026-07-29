import fs from 'node:fs';

const source = fs.readFileSync('src/sections/MapView.tsx', 'utf8');
const tilePool = fs.readFileSync('src/lib/map-tile-pool.ts', 'utf8');
const app = fs.readFileSync('src/App.tsx', 'utf8');

const assert = (condition, message) => {
  if (!condition) throw new Error(`[map-view-contract] ${message}`);
};

assert(source.includes("'tileerror'"), 'MapView must observe tile failures');
assert(source.includes('MAP_TILE_PROVIDERS.length'), 'MapView must use the tile provider pool');
assert(source.includes('providerIndex'), 'MapView must advance through tile providers');
assert(source.includes('底图暂时无法连接'), 'MapView must expose a visible tile fallback');
assert(source.includes('所有免费瓦片源都不可用'), 'tile fallback must explain the provider pool failure');
assert(source.includes('重新尝试'), 'tile fallback must provide a retry action');
assert(source.includes('onPlaceSelect(place.name)'), 'MapView must route place selection to the existing search flow');
assert(source.includes('map.remove()'), 'MapView must clean up the Leaflet instance');
assert(source.includes('wgs84ToGcj02'), 'MapView must convert coordinates for GCJ-02 tiles');
assert(source.includes('isWithinChinaCoverage'), 'MapView must keep the domestic provider at a usable China viewport');
assert(source.includes('viewportPlaces'), 'MapView must adapt the viewport to provider coverage');
assert(tilePool.includes("id: 'amap-direct'"), 'tile pool must prefer the domestic AMap tile source');
assert(tilePool.includes("id: 'osm-bfsu'"), 'tile pool must include the BFSU fallback');
assert(tilePool.includes("id: 'osm-bjtu'"), 'tile pool must include the BJTU fallback');
assert(tilePool.includes("id: 'osm-official'"), 'tile pool must include the official OSM fallback');
assert(tilePool.includes("coordinateSystem: 'gcj02'"), 'tile pool must declare GCJ-02 coordinates');
assert(tilePool.includes('export function wgs84ToGcj02'), 'tile pool must expose the coordinate conversion');
assert(app.includes('<Header>') && app.includes('<MapView onPlaceSelect={handleSearch} />'), 'MapView must be mounted in the Header bar');

console.log(JSON.stringify({ checked: 'MapView', tilePool: true, tileFallback: true, searchIntegration: true, headerIntegration: true }));
