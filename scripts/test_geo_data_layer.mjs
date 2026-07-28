import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const dataDir = path.join(root, 'public', 'data');
const readJson = (name) => JSON.parse(fs.readFileSync(path.join(dataDir, name), 'utf8'));
const list = readJson('tours-list.json');
const index = readJson('tours-index.json');
const places = readJson('geo-places.json');
const mapIndex = readJson('tour-map-index.json');

const fail = (message) => {
  throw new Error(`[geo-data-layer] ${message}`);
};
const assert = (condition, message) => {
  if (!condition) fail(message);
};
const validPoint = (point) => point
  && Number.isFinite(point.latitude)
  && Number.isFinite(point.longitude)
  && point.latitude >= -90 && point.latitude <= 90
  && point.longitude >= -180 && point.longitude <= 180
  && point.coordinateSystem === 'wgs84'
  && typeof point.placeId === 'string' && point.placeId.length > 0;

assert(Array.isArray(list) && list.length > 0, 'tours-list.json must be a non-empty array');
assert(index.length === list.length, 'tours-index.json must cover every list tour');
assert(mapIndex.length === list.length, 'tour-map-index.json must cover every list tour');

const tourIds = new Set(list.map((tour) => tour.id));
const placeIds = new Set(places.map((place) => place.placeId));
assert(tourIds.size === list.length, 'tour ids must be unique');
assert(placeIds.size === places.length, 'place ids must be unique');

for (const tour of list) {
  const geo = tour.geo;
  assert(geo && ['complete', 'destination_only', 'unmapped'].includes(geo.status), `${tour.id} has invalid geo status`);
  assert(Array.isArray(geo.stops), `${tour.id} geo.stops must be an array`);
  for (const role of ['departure', 'destination']) {
    const point = geo[role];
    if (!point) continue;
    assert(validPoint(point), `${tour.id} ${role} has invalid point`);
    assert(placeIds.has(point.placeId), `${tour.id} ${role} point missing from geo-places.json`);
  }
  if (geo.status === 'unmapped') {
    assert(!geo.destination, `${tour.id} unmapped tour must not have a destination point`);
  }
  if (geo.status === 'destination_only') {
    assert(Boolean(geo.destination) && !geo.departure, `${tour.id} destination_only must have only a destination point`);
  }
  if (geo.status === 'complete') {
    assert(Boolean(geo.destination) && Boolean(geo.departure), `${tour.id} complete must have departure and destination points`);
  }
}

for (const place of places) {
  assert(validPoint(place), `${place.name} has invalid place coordinates`);
  assert(Array.isArray(place.tourIds) && place.tourIds.length === place.tourCount, `${place.name} has invalid tour count`);
  assert(place.tourIds.every((id) => tourIds.has(id)), `${place.name} references an unknown tour`);
  assert(Array.isArray(place.roles) && place.roles.length > 0, `${place.name} must have at least one role`);
}

for (const entry of mapIndex) {
  assert(tourIds.has(entry.tourId), `map index references unknown tour ${entry.tourId}`);
  for (const key of ['departurePlaceId', 'destinationPlaceId']) {
    if (entry[key]) assert(placeIds.has(entry[key]), `${entry.tourId} references unknown ${key}`);
  }
}

const withDestination = list.filter((tour) => tour.geo.destination).length;
const withDeparture = list.filter((tour) => tour.geo.departure).length;
console.log(JSON.stringify({
  tours: list.length,
  places: places.length,
  withDestination,
  withDeparture,
  unmapped: list.filter((tour) => tour.geo.status === 'unmapped').length,
}));
