import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';

const root = process.cwd();
const dataDir = path.join(root, 'public', 'data');
const sourcePath = path.join(dataDir, 'tours.json');
const listPath = path.join(dataDir, 'tours-list.json');
const metaPath = path.join(dataDir, 'tours-meta.json');
const detailsDir = path.join(dataDir, 'tour-details');
const imageCacheDir = path.join(dataDir, 'image-cache', 'placeholders');
const invalidImageTokens = ['lazyimg', '{{', '}}'];
const writeRetries = 5;

const listFields = new Set([
  'id',
  'title',
  'source',
  'destination',
  'duration',
  'price',
  'originalPrice',
  'priceUnit',
  'departureDate',
  'transportType',
  'accommodationLevel',
  'meals',
  'singleSupplementNote',
  'bookingUrl',
  'images',
  'tags',
  'highlights',
  'isHot',
  'isNew',
  'isFlashSale',
  'flashSaleEndTime',
  'discountRate',
  'groupSize',
  'theme',
  'suitableFor',
  'leisureLevel',
  'season',
  'rating',
  'departureDates',
  'hotDepartureDates',
]);

const tours = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));

function isInvalidImage(value) {
  const image = String(value || '').trim();
  const lowerImage = image.toLowerCase();
  return !image || invalidImageTokens.some((token) => lowerImage.includes(token));
}

function placeholderImage(source) {
  fs.mkdirSync(imageCacheDir, { recursive: true });
  const safeSource = String(source || '旅行团');
  const filename = `${crypto.createHash('sha1').update(safeSource).digest('hex').slice(0, 12)}.svg`;
  const filePath = path.join(imageCacheDir, filename);

  if (!fs.existsSync(filePath)) {
    const escapedSource = safeSource
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#e2e8f0"/><stop offset="100%" stop-color="#cbd5e1"/></linearGradient></defs><rect width="800" height="600" fill="url(#g)"/><rect x="60" y="60" width="680" height="480" rx="32" fill="#f8fafc" opacity="0.88"/><text x="400" y="290" text-anchor="middle" font-size="42" fill="#475569" font-family="Arial, sans-serif">图片暂不可用</text><text x="400" y="350" text-anchor="middle" font-size="26" fill="#64748b" font-family="Arial, sans-serif">${escapedSource}</text></svg>`;
    fs.writeFileSync(filePath, svg, 'utf8');
  }

  return `/data/image-cache/placeholders/${filename}`;
}

function writeTextFileWithRetry(filePath, content) {
  let lastError;

  for (let attempt = 1; attempt <= writeRetries; attempt += 1) {
    try {
      fs.writeFileSync(filePath, content, 'utf8');
      return;
    } catch (error) {
      lastError = error;
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, attempt * 75);
    }
  }

  throw lastError;
}

let sanitizedImages = 0;
for (const tour of tours) {
  const images = Array.isArray(tour.images) ? tour.images : [];
  const validImages = images.map((image) => String(image || '').trim()).filter((image) => !isInvalidImage(image));

  if (validImages.length !== images.length || validImages.length === 0) {
    sanitizedImages += 1;
    tour.images = validImages.length > 0 ? validImages : [placeholderImage(tour.source)];
  }
}

if (sanitizedImages > 0) {
  fs.writeFileSync(sourcePath, JSON.stringify(tours), 'utf8');
}

fs.mkdirSync(detailsDir, { recursive: true });

const existingDetailFiles = new Set(
  fs.readdirSync(detailsDir).filter((file) => file.endsWith('.json')),
);

const listTours = tours.map((tour) => {
  const listTour = {};
  const detailTour = {};

  for (const [key, value] of Object.entries(tour)) {
    if (listFields.has(key)) {
      listTour[key] = value;
    } else {
      detailTour[key] = value;
    }
  }

  const detailFile = `${tour.id}.json`;
  writeTextFileWithRetry(path.join(detailsDir, detailFile), JSON.stringify(detailTour));
  existingDetailFiles.delete(detailFile);
  return listTour;
});

for (const staleFile of existingDetailFiles) {
  fs.unlinkSync(path.join(detailsDir, staleFile));
}

writeTextFileWithRetry(listPath, JSON.stringify(listTours));

const sourceSize = fs.statSync(sourcePath).size;
const listSize = fs.statSync(listPath).size;
const detailFiles = fs.readdirSync(detailsDir).filter((file) => file.endsWith('.json'));
const detailSize = detailFiles.reduce((total, file) => {
  return total + fs.statSync(path.join(detailsDir, file)).size;
}, 0);

const sourceStats = {};
const destinationStats = {};
let latestUpdatedAt = null;

for (const tour of tours) {
  if (tour.source) {
    sourceStats[tour.source] = (sourceStats[tour.source] || 0) + 1;
  }

  if (tour.destination) {
    destinationStats[tour.destination] = (destinationStats[tour.destination] || 0) + 1;
  }

  if (tour.updatedAt && (!latestUpdatedAt || tour.updatedAt > latestUpdatedAt)) {
    latestUpdatedAt = tour.updatedAt;
  }
}

const meta = {
  generatedAt: new Date().toISOString(),
  latestUpdatedAt,
  totalRecords: tours.length,
  listRecords: listTours.length,
  detailFiles: detailFiles.length,
  sourceStats,
  destinationStats,
  files: {
    raw: {
      path: 'data/tours.json',
      size: sourceSize,
    },
    list: {
      path: 'data/tours-list.json',
      size: listSize,
    },
    details: {
      path: 'data/tour-details/',
      size: detailSize,
    },
  },
};

writeTextFileWithRetry(metaPath, JSON.stringify(meta, null, 2));

console.log(`Split ${tours.length} tours`);
console.log(`sanitized images ${sanitizedImages}`);
console.log(`tours.json ${sourceSize}`);
console.log(`tours-list.json ${listSize}`);
console.log(`tour-details ${detailFiles.length} files, ${detailSize}`);
console.log('tours-meta.json written');
