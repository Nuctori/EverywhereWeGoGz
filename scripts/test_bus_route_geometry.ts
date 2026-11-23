import assert from 'node:assert/strict';
import { buildBusRouteArc, buildBusRouteCorridor, busPointForProvider, GCJ02_TO_WGS84_TOLERANCE } from '../src/lib/bus-route-geometry.ts';
import { wgs84ToGcj02, type MapTileProvider } from '../src/lib/map-tile-pool.ts';

const start = { lat: 23.129163, lng: 113.264435 }; // 广州市
const far = { lat: 21.270708, lng: 110.359377 }; // 湛江市

const arc = buildBusRouteArc(start, far);
assert.ok(arc.length >= 8, `arc should be sampled, got ${arc.length} points`);
assert.deepEqual(arc[0], [start.lat, start.lng]);
assert.deepEqual(arc[arc.length - 1], [far.lat, far.lng]);

const mid = arc[Math.floor(arc.length / 2)];
const chordMid = { lat: (start.lat + far.lat) / 2, lng: (start.lng + far.lng) / 2 };
const chordLength = Math.hypot(far.lat - start.lat, far.lng - start.lng);
const bowDistance = Math.hypot(mid[0] - chordMid.lat, mid[1] - chordMid.lng);
assert.ok(
  bowDistance > chordLength * 0.02,
  `arc should visibly bow away from the straight chord, bow=${bowDistance.toFixed(4)} chord=${chordLength.toFixed(4)}`,
);

// 广东的省界在海上：弧线必须往北（内陆）鼓，否则广州→湛江/香港会横穿北部湾和珠江口，
// 看起来像巴士开进了海里。
assert.ok(
  mid[0] > chordMid.lat,
  `arc must bow inland (north), got apex lat ${mid[0].toFixed(4)} vs chord mid ${chordMid.lat.toFixed(4)}`,
);

// 东向线路同理：广州→汕头往北鼓。
const east = { lat: 23.354, lng: 116.682 };
const eastArc = buildBusRouteArc(start, east);
const eastMid = eastArc[Math.floor(eastArc.length / 2)];
assert.ok(
  eastMid[0] > (start.lat + east.lat) / 2,
  `eastbound arc must bow inland too, got ${eastMid[0].toFixed(4)}`,
);

// ---- 沿途站点串成的走廊：线路必须穿过两座城市的真实上下车点 ----
const originStops = [
  { lat: 23.152, lng: 113.301 },
  { lat: 23.101, lng: 113.215 },
];
const destStops = [
  { lat: 21.302, lng: 110.402 },
  { lat: 20.336, lng: 110.163 }, // 徐闻，雷州半岛最南
];
const corridor = buildBusRouteCorridor(start, originStops, destStops, far);

const hasVertex = (point: { lat: number; lng: number }) =>
  corridor.some(([lat, lng]) => Math.abs(lat - point.lat) < 1e-9 && Math.abs(lng - point.lng) < 1e-9);
for (const stop of [...originStops, ...destStops]) {
  assert.ok(hasVertex(stop), `corridor must pass through every stop, missing ${stop.lat},${stop.lng}`);
}
assert.ok(hasVertex(start) && hasVertex(far), 'corridor must include both city centres');
assert.equal(corridor.length, 2 + originStops.length + destStops.length, 'corridor keeps every vertex');

// 走廊只能由真实站点组成：任何一段都不该甩到最南站点之外（否则又画到北部湾里了）。
const minLat = Math.min(...corridor.map(([lat]) => lat));
const maxLat = Math.max(...corridor.map(([lat]) => lat));
assert.ok(
  minLat >= Math.min(20.336, far.lat) - 1e-9 && maxLat <= Math.max(23.152, start.lat) + 1e-9,
  `corridor must stay within the stops (lat ${minLat.toFixed(3)}..${maxLat.toFixed(3)})`,
);

// 顶点按行进方向单调排列，不会来回折返。
const along = ([lat, lng]: [number, number]) => (lat - start.lat) * (far.lat - start.lat)
  + (lng - start.lng) * (far.lng - start.lng) * Math.cos((start.lat * Math.PI) / 180);
for (let index = 1; index < corridor.length; index += 1) {
  assert.ok(
    along(corridor[index]) >= along(corridor[index - 1]) - 1e-12,
    `corridor must advance monotonically, break at vertex ${index}`,
  );
}

// A degenerate (identical) pair must not produce NaN and must stay a valid 2-point line.
const degenerate = buildBusRouteArc(start, start);
assert.ok(degenerate.length >= 2);
assert.ok(degenerate.every(([lat, lng]) => Number.isFinite(lat) && Number.isFinite(lng)));

// GCJ-02 is what 滴滴 returns; a GCJ-02 city must survive a round trip through WGS-84.
const roundTrip = busPointForProvider(start, provider('gcj02'));
assert.ok(
  Math.abs(roundTrip[0] - start.lat) < GCJ02_TO_WGS84_TOLERANCE
  && Math.abs(roundTrip[1] - start.lng) < GCJ02_TO_WGS84_TOLERANCE,
  `gcj02 provider must keep 滴滴 coordinates unchanged, got ${JSON.stringify(roundTrip)}`,
);

const asWgs84 = busPointForProvider(start, provider('wgs84'));
const backToGcj02 = wgs84ToGcj02(asWgs84[0], asWgs84[1]);
assert.ok(Array.isArray(backToGcj02), 'wgs84ToGcj02 must stay an array');
assert.ok(
  Math.abs(backToGcj02[0] - start.lat) < 1e-5 && Math.abs(backToGcj02[1] - start.lng) < 1e-5,
  `gcj02 -> wgs84 -> gcj02 must round trip, got ${JSON.stringify(backToGcj02)}`,
);
assert.ok(
  Math.abs(asWgs84[0] - start.lat) > 1e-4 || Math.abs(asWgs84[1] - start.lng) > 1e-4,
  'a gcj02 point rendered on a wgs84 basemap must actually be shifted',
);

// Points outside the GCJ-02 transform's coverage stay untouched on either basemap.
const tokyo = { lat: 35.6812, lng: 139.7671 };
const tokyoOnWgs84 = busPointForProvider(tokyo, provider('wgs84'));
assert.ok(Math.abs(tokyoOnWgs84[0] - tokyo.lat) < 1e-6 && Math.abs(tokyoOnWgs84[1] - tokyo.lng) < 1e-6);

function provider(coordinateSystem: 'wgs84' | 'gcj02'): MapTileProvider {
  return {
    id: `test-${coordinateSystem}`,
    label: coordinateSystem,
    url: 'https://example.invalid/{z}/{x}/{y}.png',
    attribution: '',
    coordinateSystem,
  };
}

console.log('[bus-route-geometry] all assertions passed');
