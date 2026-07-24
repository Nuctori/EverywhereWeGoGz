import assert from 'node:assert/strict';
import { classifyTourRegion, getTourGeoCoverage, resolveTourGeo } from '../src/lib/tour-geo.ts';

const tour = (destination, title = destination) => ({
  id: destination,
  title,
  source: '测试',
  destination,
  duration: 3,
  price: 399,
  priceUnit: '人',
  departureDate: '2026-08-01',
  transportType: '',
  accommodationLevel: '',
  meals: '',
  singleSupplementNote: '',
  highlights: [],
  rating: 0,
  bookingUrl: '',
  images: [],
  tags: [],
  isHot: false,
  isNew: false,
  isFlashSale: false,
  groupSize: '',
  theme: '',
  leisureLevel: 'easy',
  suitableFor: [],
  season: '',
});

assert.equal(classifyTourRegion({ country: '中国', province: '广东' }), 'local');
assert.equal(classifyTourRegion({ country: '中国', province: '广西' }), 'nearby-province');
assert.equal(classifyTourRegion({ country: '中国', province: '北京' }), 'national');
assert.equal(classifyTourRegion({ country: '越南' }), 'international');
assert.equal(resolveTourGeo(tour('巽寮湾'))?.name, '惠州');
assert.equal(resolveTourGeo(tour('越南河内下龙湾'))?.region, 'international');
assert.equal(resolveTourGeo(tour('北京', '广州往返北京5天'))?.name, '北京');
assert.equal(resolveTourGeo(tour('其他', '广州出发桂林阳朔4天'))?.name, '桂林');
assert.equal(resolveTourGeo(tour('未知目的地'))?.name, undefined);
assert.deepEqual(getTourGeoCoverage([
  tour('广东', '惠州温泉3天'),
  tour('北京'),
  tour('未知目的地'),
]), { total: 3, mapped: 2, unmapped: 1 });
assert.deepEqual(getTourGeoCoverage([
  tour('广东', '惠州温泉3天'),
  tour('北京'),
], 'local'), { total: 1, mapped: 1, unmapped: 0 });

console.log('Tour geo audit passed');
