import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

const outputFiles = {
  full: path.join(root, 'public', 'data', 'tours.json'),
  list: path.join(root, 'public', 'data', 'tours-list.json'),
  meta: path.join(root, 'public', 'data', 'tours-meta.json'),
};
const auditReportFile = path.join(root, 'audit', 'data-integrity-report.json');

const rawFiles = [
  'src/data/raw_jrt365_full.json',
  'src/data/raw_saihuitong_full.json',
  'src/data/raw_kanghui.json',
  'src/data/raw_gdcts_full.json',
  'src/data/raw_pintu_full.json',
  'src/data/raw_gzl_api.json',
];

const gzlRawFile = 'src/data/raw_gzl_api.json';
const MIN_DEPARTURE_YEAR = 2000;
const MAX_DEPARTURE_YEAR_OFFSET = 3;

const sourceRules = {
  '假日通': { min: 150, ratio: 0.55, requireStructuredDates: true },
  '康辉': { min: 850, ratio: 0.7 },
  '广东中旅': { min: 400, ratio: 0.75 },
  '品途': { min: 120, ratio: 0.75 },
  '广州去旅行': { min: 35, ratio: 0.75 },
  '暴走村': { min: 50, ratio: 0.45 },
  '广之旅': { min: 1800, ratio: 0.75, requireStructuredDates: true },
};

const invalidImageTokens = [
  'lazyimg',
  '{{',
  '}}',
  'data:image/gif;base64,r0lgodlhaqabaia',
];

function readJson(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing JSON file: ${path.relative(root, filePath)}`);
  }

  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function asArray(value, filePath) {
  if (Array.isArray(value)) {
    return value;
  }

  for (const key of ['tours', 'data', 'items', 'list']) {
    if (Array.isArray(value?.[key])) {
      return value[key];
    }
  }

  throw new Error(`Expected an array in ${path.relative(root, filePath)}`);
}

function sourceOf(item) {
  return String(item?.source || item?.platform || item?.site || '').trim();
}

function stableTourKey(item) {
  const source = sourceOf(item);
  const sourceId = String(item?.sourceId || item?.prodCode || item?.prodcode || '').trim();
  const url = String(item?.url || item?.bookingUrl || '').trim();
  const title = String(item?.title || item?.name || '').trim();
  const price = String(item?.price || '').trim();

  if (sourceId) {
    return `${source}|id:${sourceId}`;
  }
  if (url) {
    return `${source}|url:${url.toLowerCase()}`;
  }
  return `${source}|title:${title}|price:${price}`;
}

function normalizeDepartureDates(values) {
  const maxYear = new Date().getFullYear() + MAX_DEPARTURE_YEAR_OFFSET;
  const seen = new Set();
  const normalized = [];

  for (const value of values || []) {
    if (!value) {
      continue;
    }

    const text = String(value).trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
      continue;
    }

    const year = Number(text.slice(0, 4));
    if (year < MIN_DEPARTURE_YEAR || year > maxYear) {
      continue;
    }

    if (seen.has(text)) {
      continue;
    }

    seen.add(text);
    normalized.push(text);
  }

  normalized.sort();
  return normalized;
}

function structuredDepartureDatesOf(item) {
  return normalizeDepartureDates([
    ...(Array.isArray(item?.departureDates) ? item.departureDates : []),
    ...(Array.isArray(item?.departureDaysList) ? item.departureDaysList : []),
    item?.departureDate,
  ]);
}

function hasStructuredDepartureDates(item) {
  return structuredDepartureDatesOf(item).length > 0;
}

function hasInvalidDepartureDateToken(item) {
  const maxYear = new Date().getFullYear() + MAX_DEPARTURE_YEAR_OFFSET;
  const values = [
    ...(Array.isArray(item?.departureDates) ? item.departureDates : []),
    ...(Array.isArray(item?.departureDaysList) ? item.departureDaysList : []),
    item?.departureDate,
  ];

  return values.some((value) => {
    const text = String(value || '').trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
      return false;
    }
    const year = Number(text.slice(0, 4));
    return year < MIN_DEPARTURE_YEAR || year > maxYear;
  });
}

function countBySource(items) {
  const counts = {};
  for (const item of items) {
    const source = sourceOf(item);
    if (!source) {
      continue;
    }
    counts[source] = (counts[source] || 0) + 1;
  }
  return counts;
}

function loadRawCounts() {
  const bySource = {};
  const seenBySource = {};

  for (const relativePath of rawFiles) {
    const filePath = path.join(root, relativePath);
    if (!fs.existsSync(filePath)) {
      continue;
    }

    const rawItems = asArray(readJson(filePath), filePath);
    for (const item of rawItems) {
      if (!item || typeof item !== 'object') {
        continue;
      }

      const source = sourceOf(item);
      if (!source || !sourceRules[source]) {
        continue;
      }

      const title = String(item.title || item.name || '').trim();
      const price = Number(item.price || 0);
      if (title.length <= 5 || !(price > 0)) {
        continue;
      }

      const rule = sourceRules[source];
      if (rule?.requireStructuredDates && !hasStructuredDepartureDates(item)) {
        continue;
      }

      seenBySource[source] ||= new Set();
      seenBySource[source].add(stableTourKey(item));
    }
  }

  for (const [source, keys] of Object.entries(seenBySource)) {
    bySource[source] = keys.size;
  }

  return bySource;
}

function collectImages(tour) {
  const images = Array.isArray(tour.images) ? tour.images : [];
  if (tour.image) {
    images.push(tour.image);
  }
  if (tour.img) {
    images.push(tour.img);
  }
  return images.map((image) => String(image || '').trim()).filter(Boolean);
}

function imageFileExists(imageUrl) {
  const cleanPath = imageUrl.split('?')[0].replace(/^\/+/, '');
  const localPath = path.join(root, 'public', cleanPath.startsWith('data/') ? cleanPath : imageUrl.replace(/^\/+/, ''));
  return fs.existsSync(localPath);
}

function normalizeUrl(value) {
  return String(value || '').trim().toLowerCase();
}

function fail(errors, message) {
  errors.push(message);
}

function writeAuditReport(report) {
  fs.mkdirSync(path.dirname(auditReportFile), { recursive: true });
  fs.writeFileSync(auditReportFile, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
}

const errors = [];
const warnings = [];

const fullTours = asArray(readJson(outputFiles.full), outputFiles.full);
const listTours = asArray(readJson(outputFiles.list), outputFiles.list);
const meta = readJson(outputFiles.meta);
const rawGzlTours = fs.existsSync(path.join(root, gzlRawFile))
  ? asArray(readJson(path.join(root, gzlRawFile)), path.join(root, gzlRawFile))
  : [];
const rawJrtFile = path.join(root, 'src/data/raw_jrt365_full.json');
const rawJrtTours = fs.existsSync(rawJrtFile)
  ? asArray(readJson(rawJrtFile), rawJrtFile)
  : [];

if (fullTours.length !== listTours.length) {
  fail(errors, `List/full count mismatch: tours.json=${fullTours.length}, tours-list.json=${listTours.length}`);
}

if (Number(meta.totalRecords) !== fullTours.length) {
  fail(errors, `Meta totalRecords mismatch: meta=${meta.totalRecords}, tours.json=${fullTours.length}`);
}

if (Number(meta.listRecords) !== listTours.length) {
  fail(errors, `Meta listRecords mismatch: meta=${meta.listRecords}, tours-list.json=${listTours.length}`);
}

const detailDir = path.join(root, 'public', 'data', 'tour-details');
const detailFiles = fs.existsSync(detailDir)
  ? fs.readdirSync(detailDir).filter((file) => file.endsWith('.json'))
  : [];
if (detailFiles.length !== fullTours.length) {
  fail(errors, `Detail shard count mismatch: details=${detailFiles.length}, tours.json=${fullTours.length}`);
}

const outputCounts = countBySource(fullTours);
const rawCounts = loadRawCounts();
const rawStructuredJrtKeys = new Set(
  rawJrtTours
    .filter((tour) => sourceOf(tour) === '假日通')
    .filter((tour) => String(tour.title || tour.name || '').trim().length > 5)
    .filter((tour) => Number(tour.price || 0) > 0)
    .filter((tour) => hasStructuredDepartureDates(tour))
    .map((tour) => stableTourKey(tour)),
);

for (const [source, rule] of Object.entries(sourceRules)) {
  const outputCount = outputCounts[source] || 0;
  const rawCount = rawCounts[source] || 0;
  const dynamicMin = rawCount > 0 ? Math.floor(rawCount * rule.ratio) : 0;
  const required = Math.max(rule.min, dynamicMin);

  if (outputCount < required) {
    fail(
      errors,
      `${source} output count too low: output=${outputCount}, required>=${required}, rawUnique=${rawCount}, ratio=${rule.ratio}`,
    );
  }
}

const expectedSources = Object.keys(sourceRules);
for (const source of expectedSources) {
  if (sourceRules[source]?.allowMissing) {
    continue;
  }
  if (!Object.prototype.hasOwnProperty.call(outputCounts, source)) {
    fail(errors, `Missing expected source in output: ${source}`);
  }
}

const fullIds = new Set();
for (const tour of fullTours) {
  if (!tour?.id) {
    fail(errors, `Tour without id: ${JSON.stringify(tour).slice(0, 160)}`);
    continue;
  }

  if (fullIds.has(tour.id)) {
    fail(errors, `Duplicate tour id: ${tour.id}`);
  }
  fullIds.add(tour.id);

  if (sourceOf(tour) === '广之旅' && !hasStructuredDepartureDates(tour)) {
    fail(errors, `GZL tour missing valid structured departure dates: ${tour.id} ${tour.bookingUrl || tour.url || ''}`);
  }

  const bookingUrl = normalizeUrl(tour?.bookingUrl || tour?.url);
  if (bookingUrl.includes('jrt365.com')) {
    if (!String(tour.sourceId || '').trim()) {
      fail(errors, `JRT365 tour missing sourceId: ${tour.id} ${tour.bookingUrl || tour.url || ''}`);
    }
    if (!hasStructuredDepartureDates(tour)) {
      fail(errors, `JRT365 tour missing structured departure dates: ${tour.id} ${tour.bookingUrl || tour.url || ''}`);
    }
    if (!rawStructuredJrtKeys.has(stableTourKey(tour))) {
      fail(errors, `JRT365 tour missing raw structured-date backing: ${tour.id} ${tour.bookingUrl || tour.url || ''}`);
    }
  }

  const images = collectImages(tour);
  if (images.length === 0) {
    warnings.push(`Tour without image: ${tour.id} ${tour.title || ''}`);
    continue;
  }

  for (const image of images) {
    const lowerImage = image.toLowerCase();
    if (invalidImageTokens.some((token) => lowerImage.includes(token))) {
      fail(errors, `Invalid placeholder image for ${tour.id}: ${image}`);
    }

    if (image.startsWith('/data/image-cache/') && !imageFileExists(image)) {
      fail(errors, `Missing cached image for ${tour.id}: ${image}`);
    }
  }
}

const listIds = new Set(listTours.map((tour) => tour?.id).filter(Boolean));
for (const id of fullIds) {
  if (!listIds.has(id)) {
    fail(errors, `Tour exists in full data but is missing from list data: ${id}`);
  }
}

const rawGzlByUrl = new Map(
  rawGzlTours
    .filter((tour) => normalizeUrl(tour?.url))
    .map((tour) => [normalizeUrl(tour.url), tour]),
);

for (const rawGzl of rawGzlTours) {
  if (hasInvalidDepartureDateToken(rawGzl)) {
    fail(
      errors,
      `raw_gzl_api.json contains invalid GZL departure date token: ${rawGzl.sourceId || rawGzl.url || rawGzl.title || ''}`,
    );
  }
}

let gzlSchedulePriceChecks = 0;
for (const tour of fullTours) {
  const bookingUrl = normalizeUrl(tour?.bookingUrl || tour?.url);
  if (!bookingUrl) continue;

  const rawGzl = rawGzlByUrl.get(bookingUrl);
  if (!rawGzl || rawGzl.priceSource !== 'scheduleDateMap') {
    continue;
  }

  gzlSchedulePriceChecks += 1;
  const outputPrice = Number(tour.price);
  const rawPrice = Number(rawGzl.price);
  const startingPrice = Number(rawGzl.startingPrice);

  if (outputPrice !== rawPrice) {
    fail(
      errors,
      [
        'GZL schedule price mismatch:',
        `tour=${tour.id}`,
        `url=${bookingUrl}`,
        `outputPrice=${outputPrice}`,
        `rawPrice=${rawPrice}`,
        `startingPrice=${Number.isFinite(startingPrice) ? startingPrice : 'n/a'}`,
      ].join(' '),
    );
  }

  if (
    Number.isFinite(startingPrice) &&
    startingPrice !== rawPrice &&
    outputPrice === startingPrice
  ) {
    fail(
      errors,
      [
        'GZL startingPrice regression:',
        `tour=${tour.id}`,
        `url=${bookingUrl}`,
        `outputPrice=${outputPrice}`,
        `startingPrice=${startingPrice}`,
        `rawPrice=${rawPrice}`,
      ].join(' '),
    );
  }
}

console.log('Data integrity audit');
console.log(`- total: ${fullTours.length}`);
console.log(`- detail shards: ${detailFiles.length}`);
console.log(`- source counts: ${JSON.stringify(outputCounts)}`);
console.log(`- raw unique counts: ${JSON.stringify(rawCounts)}`);
console.log(`- gzl schedule price checks: ${gzlSchedulePriceChecks}`);

const report = {
  generatedAt: new Date().toISOString(),
  status: errors.length > 0 ? 'failed' : 'passed',
  files: {
    full: path.relative(root, outputFiles.full),
    list: path.relative(root, outputFiles.list),
    meta: path.relative(root, outputFiles.meta),
    details: path.relative(root, detailDir),
    report: path.relative(root, auditReportFile),
  },
  counts: {
    totalTours: fullTours.length,
    listTours: listTours.length,
    detailShards: detailFiles.length,
    gzlSchedulePriceChecks,
  },
  sourceCounts: outputCounts,
  rawUniqueCounts: rawCounts,
  warnings,
  errors,
};

if (warnings.length) {
  console.warn(`Warnings (${warnings.length}):`);
  for (const warning of warnings.slice(0, 20)) {
    console.warn(`- ${warning}`);
  }
}

if (errors.length) {
  writeAuditReport(report);
  console.error(`Audit report written to: ${path.relative(root, auditReportFile)}`);
  console.error(`Errors (${errors.length}):`);
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

writeAuditReport(report);
console.log(`Audit report written to: ${path.relative(root, auditReportFile)}`);
console.log('Data integrity audit passed');
