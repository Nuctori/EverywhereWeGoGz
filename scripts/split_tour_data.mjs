// ? tours.json ????????????????????????
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
const geoPlacesPath = path.join(dataDir, 'geo-places.json');
const tourMapIndexPath = path.join(dataDir, 'tour-map-index.json');
// ?? token ?????????????????????????
const invalidImageTokens = ['lazyimg', '{{', '}}'];
const writeRetries = 5;
const placeholderLabel = '老广精选线路';

function nonEmpty(value) {
  const text = String(value ?? '').trim();
  return text || undefined;
}

function normalizeGeoPrecision(value) {
  const precision = nonEmpty(value);
  if (!precision) return undefined;
  if (precision === 'exact' || precision === 'approximate') return precision;
  if (precision === 'poi') return 'exact';
  if (['country', 'region', 'city', 'town'].includes(precision)) return 'approximate';
  return undefined;
}

function validCoordinate(latitude, longitude) {
  const missing = (value) => value === null || value === undefined || (typeof value === 'string' && value.trim() === '');
  if (missing(latitude) || missing(longitude)) return false;
  const numericLatitude = Number(latitude);
  const numericLongitude = Number(longitude);
  return Number.isFinite(numericLatitude) && Number.isFinite(numericLongitude)
    && numericLatitude >= -90 && numericLatitude <= 90
    && numericLongitude >= -180 && numericLongitude <= 180;
}

function buildPlaceId(point) {
  return crypto.createHash('sha1')
    .update([
      point.country || '', point.province || '', point.city || '', point.name || '',
      point.locality || '', point.level || '',
    ].join('|'))
    .digest('hex')
    .slice(0, 16);
}

function buildGeoPoint(tour, role) {
  const destination = role === 'destination';
  const latitude = tour[destination ? 'destinationLatitude' : 'departureLatitude'];
  const longitude = tour[destination ? 'destinationLongitude' : 'departureLongitude'];
  const cityName = nonEmpty(tour[destination ? 'destinationCity' : 'departureCity']);
  const name = destination ? (nonEmpty(tour.destinationPlaceName) || cityName) : cityName;
  if (!name || !cityName || !validCoordinate(latitude, longitude)) return undefined;
  const semanticLevel = nonEmpty(tour[destination ? 'destinationGeoLevel' : 'departureGeoLevel']);
  const precision = normalizeGeoPrecision(tour[destination ? 'destinationCoordinatePrecision' : 'departureCoordinatePrecision']);
  const level = ['country', 'region', 'city', 'town', 'poi'].includes(semanticLevel)
    ? semanticLevel
    : (name !== cityName ? 'poi' : 'city');
  const locality = nonEmpty(tour[destination ? 'destinationLocality' : 'departureLocality']);
  const address = destination && tour.destinationAddress && typeof tour.destinationAddress === 'object'
    ? Object.fromEntries(Object.entries(tour.destinationAddress).filter(([, value]) => nonEmpty(value)))
    : undefined;
  const coordinateSource = nonEmpty(tour[destination ? 'destinationCoordinateSource' : 'departureCoordinateSource'])
    || (tour.geoSource === 'local-place-catalog' ? 'catalog' : tour.geoSource === 'osm' ? 'osm' : 'inferred');

  const point = {
    name,
    normalizedName: name,
    country: nonEmpty(tour[destination ? 'destinationCountry' : 'departureCountry']),
    province: nonEmpty(tour[destination ? 'destinationProvince' : 'departureProvince']),
    city: cityName,
    latitude: Number(latitude),
    longitude: Number(longitude),
    coordinateSystem: 'wgs84',
    level,
    ...(semanticLevel && semanticLevel !== level ? { semanticLevel } : {}),
    ...(locality ? { locality } : {}),
    ...(address && Object.keys(address).length > 0 ? { address } : {}),
    coordinateSource,
    ...(precision ? { precision } : {}),
    source: tour.geoSource === 'local-place-catalog' ? 'catalog' : tour.geoSource === 'geocoder' ? 'geocoder' : tour.geoSource === 'osm' ? 'osm' : 'inferred',
    confidence: ['low', 'medium', 'high'].includes(tour.geoConfidence) ? tour.geoConfidence : 'low',
  };
  return { placeId: buildPlaceId(point), ...point, ...(name !== cityName ? { label: name } : {}) };
}

function buildGeo(tour) {
  const departure = buildGeoPoint(tour, 'departure');
  const destination = buildGeoPoint(tour, 'destination');
  const status = destination
    ? (departure ? 'complete' : 'destination_only')
    : 'unmapped';
  return {
    ...(departure ? { departure } : {}),
    ...(destination ? { destination } : {}),
    stops: [],
    status,
    routeRegion: tour.routeRegion || 'unknown',
  };
}
const destinationKeywordMap = [
  ['华东', ['华东', '江南', '上海', '苏州', '杭州', '南京', '无锡', '乌镇', '周庄', '南浔', '西湖', '外滩', '迪士尼', '拈花湾', '牛首山']],
  ['广东', ['广东', '广州', '深圳', '珠海', '从化', '增城', '龙门', '新丰', '英德', '佛冈', '江门', '惠州', '双月湾', '巽寮湾', '古兜', '恩平', '新兴', '清远', '沙扒湾', '温泉']],
  ['云南', ['云南', '昆明', '大理', '丽江', '西双版纳', '腾冲', '芒市', '瑞丽', '香格里拉', '普洱']],
  ['三亚', ['三亚', '海南', '海口', '蜈支洲', '天涯海角']],
  ['北京', ['北京', '故宫', '长城']],
  ['四川', ['四川', '成都', '九寨沟', '黄龙', '稻城', '四姑娘山']],
  ['新疆', ['新疆', '乌鲁木齐', '喀什', '伊犁', '喀纳斯', '天山']],
  ['贵州', ['贵州', '贵阳', '黄果树', '荔波', '西江']],
  ['桂林', ['桂林', '阳朔', '漓江']],
  ['西藏', ['西藏', '拉萨', '布达拉宫', '林芝']],
  ['张家界', ['张家界', '天门山']],
  ['厦门', ['厦门', '鼓浪屿']],
  ['西安', ['西安', '兵马俑']],
  ['青甘', ['青海', '甘肃', '青甘', '西宁', '兰州', '敦煌', '张掖', '嘉峪关', '茶卡', '莫高窟']],
  ['内蒙古', ['内蒙', '内蒙古', '呼伦贝尔', '海拉尔', '满洲里', '鄂尔多斯', '草原']],
  ['湖南', ['湖南', '长沙', '郴州', '莽山', '湘西', '凤凰古城']],
  ['湖北', ['湖北', '武汉', '恩施', '神农架']],
  ['江西', ['江西', '南昌', '婺源', '三清山', '庐山', '景德镇', '赣州']],
  ['山东', ['山东', '青岛', '济南', '烟台', '威海', '泰山', '曲阜', '淄博']],
  ['河南', ['河南', '郑州', '开封', '洛阳', '云台山', '老君山']],
  ['重庆', ['重庆', '武隆', '仙女山', '洪崖洞']],
  ['港澳', ['香港', '澳门', '麦理浩径', '维港']],
  ['广西', ['广西', '贺州', '北海', '涠洲岛', '德天', '崇左', '百色']],
  ['福建', ['福建', '泉州', '福州', '平潭', '武夷山', '漳州']],
];
const knownSourceLogos = new Set([
  '假日通',
  '广州去旅行',
  '康辉',
  '暴走村',
  '广之旅',
  '广东中旅',
  '品途',
  '天涯户外',
]);

// ?????????/???????????????? tour-details ??
const listFields = new Set([
  'id',
  'sourceId',
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
  'meta',
  'dataQuality',
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
  const escapedSource = safeSource
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#e2e8f0"/><stop offset="100%" stop-color="#cbd5e1"/></linearGradient></defs><rect width="800" height="600" fill="url(#g)"/><rect x="60" y="60" width="680" height="480" rx="32" fill="#f8fafc" opacity="0.88"/><text x="400" y="290" text-anchor="middle" font-size="42" fill="#475569" font-family="Arial, sans-serif">${placeholderLabel}</text><text x="400" y="350" text-anchor="middle" font-size="26" fill="#64748b" font-family="Arial, sans-serif">${escapedSource}</text></svg>`;
  fs.writeFileSync(filePath, svg, 'utf8');

  return `/data/image-cache/placeholders/${filename}`;
}

function refreshExistingPlaceholderLabels() {
  if (!fs.existsSync(imageCacheDir)) return 0;
  let rewritten = 0;
  for (const file of fs.readdirSync(imageCacheDir)) {
    if (!file.endsWith('.svg')) continue;
    const filePath = path.join(imageCacheDir, file);
    const current = fs.readFileSync(filePath, 'utf8');
    const next = current.replace(/图片暂不可用/g, placeholderLabel);
    if (next !== current) {
      fs.writeFileSync(filePath, next, 'utf8');
      rewritten += 1;
    }
  }
  return rewritten;
}

// Windows ????????????????????????????
function writeTextFileWithRetry(filePath, content) {
  if (fs.existsSync(filePath)) {
    try {
      if (fs.readFileSync(filePath, 'utf8') === content) return;
    } catch {
      // Continue to the retry loop when a concurrent file observer briefly holds the file.
    }
  }

  let lastError;

  for (let attempt = 1; attempt <= writeRetries; attempt += 1) {
    const tempPath = `${filePath}.${process.pid}.${attempt}.tmp`;
    try {
      fs.writeFileSync(tempPath, content, 'utf8');
      fs.renameSync(tempPath, filePath);
      return;
    } catch (error) {
      lastError = error;
      // Some Windows file observers deny replace-style rename even after the
      // target is readable. Copy the complete temp file as a last-resort
      // fallback so a generated index can still be refreshed.
      if (fs.existsSync(tempPath)) {
        try {
          fs.copyFileSync(tempPath, filePath);
          fs.unlinkSync(tempPath);
          return;
        } catch {
          // Continue with the retry loop when the target is still locked.
        }
      }
      if (fs.existsSync(tempPath)) {
        try {
          fs.unlinkSync(tempPath);
        } catch {
          // The next attempt uses a unique temp path.
        }
      }
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, attempt * 75);
    }
  }

  throw lastError;
}

function compactJson(value) {
  return `${JSON.stringify(value)}\n`;
}

function prettyJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function isEmptyObject(value) {
  return value !== null
    && typeof value === 'object'
    && !Array.isArray(value)
    && Object.keys(value).length === 0;
}

function normalizeTourPayload(payload) {
  if (payload.mealCounts === null || isEmptyObject(payload.mealCounts)) {
    delete payload.mealCounts;
  }
  if (
    payload.meta?.structuredDetails?.mealCounts === null ||
    isEmptyObject(payload.meta?.structuredDetails?.mealCounts)
  ) {
    delete payload.meta.structuredDetails.mealCounts;
  }
  return payload;
}

// ??????????/??/?????????????????
function inferDestinationFromTour(tour) {
  const title = String(tour.title || '').trim();
  const candidates = [
    title,
    ...(Array.isArray(tour.highlights) ? tour.highlights : []),
    ...(Array.isArray(tour.tags) ? tour.tags : []),
  ]
    .map((value) => String(value || '').trim())
    .filter(Boolean)
    .join(' ');

  for (const [destination, keywords] of destinationKeywordMap) {
    if (keywords.some((keyword) => candidates.includes(keyword))) {
      return destination;
    }
  }

  return '';
}

let sanitizedImages = 0;
let normalizedDestinations = 0;
let normalizedSourceLogos = 0;
for (const tour of tours) {
  const images = Array.isArray(tour.images) ? tour.images : [];
  const validImages = images.map((image) => String(image || '').trim()).filter((image) => !isInvalidImage(image));

  if (validImages.length !== images.length || validImages.length === 0) {
    sanitizedImages += 1;
    tour.images = validImages.length > 0 ? validImages : [placeholderImage(tour.source)];
  }

  if (!tour.sourceLogo || knownSourceLogos.has(String(tour.source || '').trim())) {
    const nextSourceLogo = `/icons/${tour.source}.png`;
    if (tour.sourceLogo !== nextSourceLogo) {
      normalizedSourceLogos += 1;
      tour.sourceLogo = nextSourceLogo;
    }
  }

  if (!tour.destination || tour.destination === '其他') {
    const inferredDestination = inferDestinationFromTour(tour);
    if (inferredDestination && inferredDestination !== tour.destination) {
      normalizedDestinations += 1;
      tour.destination = inferredDestination;
    }
  }
}

if (sanitizedImages > 0 || normalizedDestinations > 0 || normalizedSourceLogos > 0) {
  fs.writeFileSync(sourcePath, compactJson(tours), 'utf8');
}
const refreshedPlaceholders = refreshExistingPlaceholderLabels();

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
  listTour.geo = buildGeo(tour);
  normalizeTourPayload(listTour);
  normalizeTourPayload(detailTour);

  const detailFile = `${tour.id}.json`;
  writeTextFileWithRetry(path.join(detailsDir, detailFile), compactJson(detailTour));
  existingDetailFiles.delete(detailFile);
  return listTour;
});

for (const staleFile of existingDetailFiles) {
  const stalePath = path.join(detailsDir, staleFile);
  if (fs.existsSync(stalePath)) {
    fs.unlinkSync(stalePath);
  }
}

writeTextFileWithRetry(listPath, compactJson(listTours));

const placeMap = new Map();
const tourMapIndex = listTours.map((tour) => {
  for (const role of ['departure', 'destination']) {
    const point = tour.geo?.[role];
    if (!point) continue;
    const existing = placeMap.get(point.placeId);
    if (existing) {
      if (!existing.tourIds.includes(tour.id)) existing.tourIds.push(tour.id);
      if (!existing.roles.includes(role)) existing.roles.push(role);
      if (existing.confidence !== point.confidence) existing.confidence = 'medium';
    } else {
      placeMap.set(point.placeId, { ...point, tourIds: [tour.id], roles: [role] });
    }
  }
  return {
    tourId: tour.id,
    departurePlaceId: tour.geo?.departure?.placeId,
    destinationPlaceId: tour.geo?.destination?.placeId,
    status: tour.geo?.status || 'unmapped',
  };
});

const geoPlaces = [...placeMap.values()]
  .map((place) => ({ ...place, tourCount: place.tourIds.length }))
  .sort((left, right) => right.tourCount - left.tourCount || left.name.localeCompare(right.name));
writeTextFileWithRetry(geoPlacesPath, compactJson(geoPlaces));
writeTextFileWithRetry(tourMapIndexPath, compactJson(tourMapIndex));

// ====== Generate tours-index.json + tours-page-*.json chunks ======
const PAGE_SIZE = 24;
const indexFields = [
  'id',
  'sourceId',
  'title',
  'price',
  'destination',
  'duration',
  'source',
  'bookingUrl',
  'theme',
  'departureDate',
  'departureDates',
  'hotDepartureDates',
  'transportType',
  'tags',
  'isHot',
  'isNew',
  'isFlashSale',
  'leisureLevel',
  'rating',
  'suitableFor',
  'season',
  'geo',
];
const indexTours = listTours.map((tour, index) => {
  const idx = {};
  for (const key of indexFields) {
    if (key in tour) idx[key] = tour[key];
  }
  idx.page = Math.floor(index / PAGE_SIZE);
  return idx;
});
writeTextFileWithRetry(path.join(dataDir, 'tours-index.json'), compactJson(indexTours));
writeTextFileWithRetry(
  path.join(dataDir, 'tour-deeplink-index.json'),
  compactJson(indexTours.map(({ id, sourceId, page }) => ({ id, sourceId, page }))),
);

const totalPages = Math.ceil(listTours.length / PAGE_SIZE);
const pageDir = path.join(dataDir);
for (let page = 0; page < totalPages; page++) {
  const start = page * PAGE_SIZE;
  const end = Math.min(start + PAGE_SIZE, listTours.length);
  const pageData = {
    meta: { page, pageSize: PAGE_SIZE, total: listTours.length },
    items: listTours.slice(start, end),
  };
  writeTextFileWithRetry(path.join(pageDir, `tours-page-${page}.json`), compactJson(pageData));
}
console.log(`tours-index.json ${Buffer.byteLength(JSON.stringify(indexTours), 'utf8')} bytes`);
console.log(`tour-deeplink-index.json ${fs.statSync(path.join(dataDir, 'tour-deeplink-index.json')).size} bytes`);
console.log(`Generated ${totalPages} page chunks (tours-page-0.json ~ tours-page-${totalPages - 1}.json)`);


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
    geoPlaces: {
      path: 'data/geo-places.json',
      size: fs.statSync(geoPlacesPath).size,
    },
    mapIndex: {
      path: 'data/tour-map-index.json',
      size: fs.statSync(tourMapIndexPath).size,
    },
  },
};

writeTextFileWithRetry(metaPath, prettyJson(meta));

console.log(`Split ${tours.length} tours`);
console.log(`sanitized images ${sanitizedImages}`);
console.log(`normalized destinations ${normalizedDestinations}`);
console.log(`normalized source logos ${normalizedSourceLogos}`);
console.log(`refreshed placeholders ${refreshedPlaceholders}`);
console.log(`tours.json ${sourceSize}`);
console.log(`tours-list.json ${listSize}`);
console.log(`tour-details ${detailFiles.length} files, ${detailSize}`);
console.log('tours-meta.json written');
