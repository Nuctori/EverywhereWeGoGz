import fs from 'node:fs';

const hook = fs.readFileSync('src/hooks/use-map-tours.ts', 'utf8');
const view = fs.readFileSync('src/sections/MapView.tsx', 'utf8');
const geoPlaces = JSON.parse(fs.readFileSync('public/data/geo-places.json', 'utf8'));
const mapCards = JSON.parse(fs.readFileSync('public/data/tour-map-cards.json', 'utf8'));
const toursIndex = JSON.parse(fs.readFileSync('public/data/tours-index.json', 'utf8'));
const placeCardsDir = 'public/data/tour-map-place-cards';
const placeCardDirs = fs.readdirSync(placeCardsDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);
const legacyPlaceCardFiles = fs.readdirSync(placeCardsDir).filter((file) => file.endsWith('.json'));

function assert(condition, message) {
  if (!condition) throw new Error(`[map-data-loading] ${message}`);
}

assert(hook.includes("geo-places.json"), 'map hook must load the compact place index');
assert(hook.includes('geoPlacesSchema.parse'), 'place data must use the runtime schema');
assert(hook.includes('placesLoading: false'), 'place loading must finish before place cards');
assert(hook.includes('placesError') && hook.includes('toursError'), 'place and tour errors must remain independent');
assert(hook.includes('tour-map-place-cards/'), 'place panels must load their own compact card file');
assert(hook.includes('fetchToursForPlace'), 'place cards must load on demand after selecting a place');
assert(hook.includes('PLACE_TOUR_CHUNK_SIZE'), 'place cards must load in bounded chunks');
assert(hook.includes('placeToursComplete'), 'place card loading must expose completion state');
assert(!hook.includes("getDataUrl('tour-map-cards.json')"), 'the all-tour card index must not block map interaction');
assert(!hook.includes('locations.set(point.placeId'), 'tour summary geo points must not replace generated destination places');
assert(view.includes('placesLoading'), 'MapView must expose the place loading state');
assert(view.includes('placeToursLoading'), 'place panels must expose their own card loading state');
assert(view.includes('fetchToursForPlace'), 'MapView must request cards for the selected place');
assert(geoPlaces.length > 0 && geoPlaces.length < 1000, 'geo place index must stay compact');
assert(geoPlaces.some((place) => place.roles.includes('destination')), 'geo place index must contain destinations');
const destinationPlaces = geoPlaces.filter((place) => place.roles.includes('destination'));
assert(mapCards.length === toursIndex.length, 'map card index must cover every tour summary');
assert(fs.statSync('public/data/tour-map-cards.json').size < fs.statSync('public/data/tours-index.json').size, 'map card index must be smaller than the full geo index');
assert(placeCardDirs.length === destinationPlaces.length, 'every destination place must have a lazy card directory');
assert(legacyPlaceCardFiles.length === 0, 'legacy unbounded place card files must not remain');
const currentTourIds = new Set(mapCards.map((tour) => tour.id));
const activeDestinationPlaces = destinationPlaces.filter((place) => place.tourIds.some((tourId) => currentTourIds.has(tourId)));
assert(activeDestinationPlaces.length === destinationPlaces.length, 'every generated destination place must retain at least one current tour card');
for (const place of destinationPlaces) {
  const placeDir = `${placeCardsDir}/${place.placeId}`;
  const chunkFiles = fs.readdirSync(placeDir)
    .filter((file) => file.endsWith('.json'))
    .sort((left, right) => Number.parseInt(left) - Number.parseInt(right));
  assert(chunkFiles.length > 0, `${place.name} must have at least one lazy card chunk`);
  assert(chunkFiles.every((file, index) => file === `${index}.json`), `${place.name} chunks must be contiguous and zero-indexed`);
  assert(chunkFiles.slice(0, -1).every((file) => JSON.parse(fs.readFileSync(`${placeDir}/${file}`, 'utf8')).length === 24), `${place.name} non-final chunks must stay bounded at 24 cards`);
  assert(chunkFiles.every((file) => fs.statSync(`${placeDir}/${file}`).size < 20000), `${place.name} card chunks must stay below 20KB`);
  const cards = chunkFiles.flatMap((file) => JSON.parse(fs.readFileSync(`${placeDir}/${file}`, 'utf8')));
  const expectedIds = place.tourIds.filter((tourId) => currentTourIds.has(tourId));
  assert(cards.length === expectedIds.length, `${place.name} lazy card file must cover every indexed tour`);
  assert(cards.every((tour) => expectedIds.includes(tour.id)), `${place.name} lazy card file must not contain another place's tour`);
}

console.log(JSON.stringify({
  checked: 'map-data-loading',
  places: geoPlaces.length,
  destinationPlaces: destinationPlaces.length,
  activeDestinationPlaces: activeDestinationPlaces.length,
  placeCardDirs: placeCardDirs.length,
}));
