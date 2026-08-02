import fs from 'node:fs';

const hook = fs.readFileSync('src/hooks/use-map-tours.ts', 'utf8');
const view = fs.readFileSync('src/sections/MapView.tsx', 'utf8');
const geoPlaces = JSON.parse(fs.readFileSync('public/data/geo-places.json', 'utf8'));
const mapCards = JSON.parse(fs.readFileSync('public/data/tour-map-cards.json', 'utf8'));
const toursIndex = JSON.parse(fs.readFileSync('public/data/tours-index.json', 'utf8'));

function assert(condition, message) {
  if (!condition) throw new Error(`[map-data-loading] ${message}`);
}

assert(hook.includes("geo-places.json"), 'map hook must load the compact place index');
assert(hook.includes('geoPlacesSchema.parse'), 'place data must use the runtime schema');
assert(hook.includes('placesLoading: false'), 'place loading must finish before the tour index');
assert(hook.includes('placesError') && hook.includes('toursError'), 'place and tour errors must remain independent');
assert(hook.includes("getDataUrl('tour-map-cards.json')"), 'map cards must use the compact map card index');
assert(hook.includes('mergeGeoPlacesWithTours(generatedPlaces, tours)'), 'tour summaries must enrich the generated place index without replacing it');
assert(hook.includes('currentTourIds'), 'map place associations must be reconciled against the loaded tour cards');
assert(!hook.includes('locations.set(point.placeId'), 'tour summary geo points must not replace generated destination places');
assert(view.includes('placesLoading'), 'MapView must expose the place loading state');
assert(view.includes('loading={toursLoading}'), 'place panels must wait for tour summaries, not map coordinates');
assert(geoPlaces.length > 0 && geoPlaces.length < 1000, 'geo place index must stay compact');
assert(geoPlaces.some((place) => place.roles.includes('destination')), 'geo place index must contain destinations');
const destinationPlaces = geoPlaces.filter((place) => place.roles.includes('destination'));
assert(mapCards.length === toursIndex.length, 'map card index must cover every tour summary');
assert(fs.statSync('public/data/tour-map-cards.json').size < fs.statSync('public/data/tours-index.json').size, 'map card index must be smaller than the full geo index');
const currentTourIds = new Set(mapCards.map((tour) => tour.id));
const activeDestinationPlaces = destinationPlaces.filter((place) => place.tourIds.some((tourId) => currentTourIds.has(tourId)));
assert(activeDestinationPlaces.length === destinationPlaces.length, 'every generated destination place must retain at least one current tour card');

console.log(JSON.stringify({
  checked: 'map-data-loading',
  places: geoPlaces.length,
  destinationPlaces: destinationPlaces.length,
  activeDestinationPlaces: activeDestinationPlaces.length,
}));
