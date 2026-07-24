import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const dataPath = path.join(root, 'public', 'data', 'tours.json');
const reportPath = path.join(root, 'audit', 'geo-report.json');
const tours = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const errors = [];
const warnings = [];
const counts = {
  totalTours: tours.length,
  complete: 0,
  destinationOnly: 0,
  unmapped: 0,
  unknownRouteRegion: 0,
  departureCity: 0,
  destinationCoordinates: 0,
};
const validRegions = new Set(['local', 'nearby-province', 'national', 'international', 'unknown']);

function isCoordinate(value, min, max) {
  return typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
}

for (const tour of tours) {
  const id = String(tour.id || 'unknown');
  const status = String(tour.geoStatus || '');
  if (!['complete', 'destination_only', 'unmapped'].includes(status)) {
    errors.push(`${id}: invalid geoStatus=${status || '<missing>'}`);
  } else if (status === 'complete') counts.complete += 1;
  else if (status === 'destination_only') counts.destinationOnly += 1;
  else counts.unmapped += 1;

  if (tour.departureCity) counts.departureCity += 1;
  const hasLat = tour.destinationLatitude !== undefined;
  const hasLon = tour.destinationLongitude !== undefined;
  if (hasLat !== hasLon) errors.push(`${id}: destination coordinates are incomplete`);
  if (hasLat && (!isCoordinate(tour.destinationLatitude, -90, 90) || !isCoordinate(tour.destinationLongitude, -180, 180))) {
    errors.push(`${id}: destination coordinates are out of range`);
  }
  if (hasLat && hasLon) counts.destinationCoordinates += 1;

  if (tour.departureLatitude !== undefined && (!isCoordinate(tour.departureLatitude, -90, 90) || !isCoordinate(tour.departureLongitude, -180, 180))) {
    errors.push(`${id}: departure coordinates are out of range`);
  }
  if (!validRegions.has(tour.routeRegion)) errors.push(`${id}: invalid routeRegion=${tour.routeRegion || '<missing>'}`);
  if (tour.routeRegion === 'unknown') counts.unknownRouteRegion += 1;
  if (status === 'complete' && (!tour.departureCity || !tour.departureProvince || !tour.destinationCity)) {
    errors.push(`${id}: complete geo status is missing normalized place fields`);
  }
}

const departureCoverage = counts.totalTours ? counts.departureCity / counts.totalTours : 0;
const destinationCoverage = counts.totalTours ? counts.destinationCoordinates / counts.totalTours : 0;
if (departureCoverage < 0.8) warnings.push(`departure coverage ${(departureCoverage * 100).toFixed(1)}% is below 80%`);
if (destinationCoverage < 0.8) warnings.push(`destination coordinate coverage ${(destinationCoverage * 100).toFixed(1)}% is below 80%`);

const report = {
  status: errors.length ? 'error' : warnings.length ? 'warning' : 'ok',
  counts,
  coverage: { departure: departureCoverage, destinationCoordinates: destinationCoverage },
  errors,
  warnings,
};
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(JSON.stringify(report, null, 2));
if (errors.length) process.exitCode = 1;
