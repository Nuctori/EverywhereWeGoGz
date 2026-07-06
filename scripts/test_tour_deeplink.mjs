import assert from 'node:assert/strict';
import {
  findTourDeepLinkResolution,
  inflateTourSummaryFromIndexEntry,
  readTourDeepLink,
} from '../src/lib/tour-deeplink.ts';

const parsed = readTourDeepLink('?tour=tour_4519&source=wechat');
assert.deepEqual(parsed, {
  tourId: 'tour_4519',
  sourceId: null,
});

const stableTarget = readTourDeepLink('?tour=tour_4519&sourceId=stable-123');
assert.deepEqual(stableTarget, {
  tourId: 'tour_4519',
  sourceId: 'stable-123',
});

const summaryCollections = [
  [
    { id: 'tour_4519', sourceId: 'legacy-a', title: 'Legacy match' },
    { id: 'tour_9000', sourceId: 'stable-123', title: 'Stable match' },
  ],
];
const indexTours = [
  { id: 'tour_4519', sourceId: 'legacy-a', page: 1 },
  { id: 'tour_9000', sourceId: 'stable-123', page: 7 },
];

assert.deepEqual(
  findTourDeepLinkResolution(
    { tourId: 'tour_4519', sourceId: 'stable-123' },
    summaryCollections,
    indexTours,
  ),
  {
    tourId: 'tour_9000',
    page: 7,
    matchedBy: 'sourceId',
  },
);

assert.deepEqual(
  findTourDeepLinkResolution({ tourId: 'tour_4519', sourceId: null }, summaryCollections, indexTours),
  {
    tourId: 'tour_4519',
    page: 1,
    matchedBy: 'tourId',
  },
);

assert.deepEqual(
  findTourDeepLinkResolution({ tourId: 'tour_4519', sourceId: null }, [], indexTours),
  {
    tourId: 'tour_4519',
    page: 1,
    matchedBy: 'tourId',
  },
);

const inflated = inflateTourSummaryFromIndexEntry({
  id: 'tour_9000',
  sourceId: 'stable-123',
  title: 'Stable match',
  source: '假日通',
  destination: '广东',
  duration: 3,
  price: 199,
  bookingUrl: 'https://example.com/tour/9000',
  departureDate: '',
  transportType: '大巴往返',
  accommodationLevel: '舒适型',
  meals: '',
  highlights: ['特色美食'],
  tags: ['纯玩'],
  isHot: false,
  isNew: true,
  isFlashSale: false,
  theme: '海岛度假',
  leisureLevel: 'easy',
  rating: 0,
  groupSize: '30人常规团',
  suitableFor: [],
  season: '全年',
  page: 7,
});

assert.equal(inflated.priceUnit, '人');
assert.deepEqual(inflated.images, []);
assert.equal(inflated.sourceId, 'stable-123');

console.log('Tour deeplink resolver test passed.');
