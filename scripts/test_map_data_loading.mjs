import fs from 'node:fs';

const hook = fs.readFileSync('src/hooks/use-map-tours.ts', 'utf8');
const view = fs.readFileSync('src/sections/MapView.tsx', 'utf8');
const geoPlaces = JSON.parse(fs.readFileSync('public/data/geo-places.json', 'utf8'));

function assert(condition, message) {
  if (!condition) throw new Error(`[map-data-loading] ${message}`);
}

assert(hook.includes("geo-places.json"), 'map hook must load the compact place index');
assert(hook.includes('geoPlacesSchema.parse'), 'place data must use the runtime schema');
assert(hook.includes('placesLoading: false'), 'place loading must finish before the tour index');
assert(hook.includes('placesError') && hook.includes('toursError'), 'place and tour errors must remain independent');
assert(hook.includes("getDataUrl('tours-index.json')"), 'tour summaries must remain available for the place panel');
assert(hook.includes('mapPlacesFromTours(tours)'), 'tour summaries must rebuild destination-only tour associations');
assert(view.includes('placesLoading'), 'MapView must expose the place loading state');
assert(view.includes('loading={toursLoading}'), 'place panels must wait for tour summaries, not map coordinates');
assert(geoPlaces.length > 0 && geoPlaces.length < 1000, 'geo place index must stay compact');
assert(geoPlaces.some((place) => place.roles.includes('destination')), 'geo place index must contain destinations');

console.log(JSON.stringify({
  checked: 'map-data-loading',
  places: geoPlaces.length,
  destinationPlaces: geoPlaces.filter((place) => place.roles.includes('destination')).length,
}));
