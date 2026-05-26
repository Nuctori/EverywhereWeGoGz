import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

const outputFiles = {
  full: path.join(root, 'public', 'data', 'tours.json'),
  list: path.join(root, 'public', 'data', 'tours-list.json'),
  meta: path.join(root, 'public', 'data', 'tours-meta.json'),
};

const rawFiles = [
  'src/data/raw_jrt365_full.json',
  'src/data/raw_saihuitong_full.json',
  'src/data/raw_kanghui.json',
  'src/data/raw_gdcts_full.json',
  'src/data/raw_pintu_full.json',
  'src/data/raw_gzl_api.json',
];

const sourceRules = {
  '假日通': { min: 180, ratio: 0.75 },
  '康辉': { min: 850, ratio: 0.7 },
  '广东中旅': { min: 400, ratio: 0.75 },
  '品途': { min: 120, ratio: 0.75 },
  '广州去旅行': { min: 35, ratio: 0.75 },
  '暴走村': { min: 90, ratio: 0.75 },
  '广之旅': { min: 1900, ratio: 0.6 },
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

function fail(errors, message) {
  errors.push(message);
}

const errors = [];
const warnings = [];

const fullTours = asArray(readJson(outputFiles.full), outputFiles.full);
const listTours = asArray(readJson(outputFiles.list), outputFiles.list);
const meta = readJson(outputFiles.meta);

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

console.log('Data integrity audit');
console.log(`- total: ${fullTours.length}`);
console.log(`- detail shards: ${detailFiles.length}`);
console.log(`- source counts: ${JSON.stringify(outputCounts)}`);
console.log(`- raw unique counts: ${JSON.stringify(rawCounts)}`);

if (warnings.length) {
  console.warn(`Warnings (${warnings.length}):`);
  for (const warning of warnings.slice(0, 20)) {
    console.warn(`- ${warning}`);
  }
}

if (errors.length) {
  console.error(`Errors (${errors.length}):`);
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log('Data integrity audit passed');
