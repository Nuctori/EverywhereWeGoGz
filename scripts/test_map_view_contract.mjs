import fs from 'node:fs';

const source = fs.readFileSync('src/sections/MapView.tsx', 'utf8');

const assert = (condition, message) => {
  if (!condition) throw new Error(`[map-view-contract] ${message}`);
};

assert(source.includes("'tileerror'"), 'MapView must observe tile failures');
assert(source.includes('底图暂时无法加载'), 'MapView must expose a visible tile fallback');
assert(source.includes('地点列表和线路搜索仍可用'), 'tile fallback must preserve usable alternatives');
assert(source.includes('onPlaceSelect(place.name)'), 'MapView must route place selection to the existing search flow');
assert(source.includes('map.remove()'), 'MapView must clean up the Leaflet instance');

console.log(JSON.stringify({ checked: 'MapView', tileFallback: true, searchIntegration: true }));
