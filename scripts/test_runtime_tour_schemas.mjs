import assert from 'node:assert/strict';
import fs from 'node:fs';

import { geoPlacesSchema, tourDetailSchema, toursPageSchema } from '../src/lib/runtime-schemas.ts';

const sample = JSON.parse(fs.readFileSync('public/data/tour-details/tour_1.json', 'utf8'));
const parsed = tourDetailSchema.parse(sample);
// 空 mealCounts 省略契约用合成样本验证——活数据探针（tour_1）是否带真实三餐
// 取决于当轮抓取，2026-09-05 起 tour_1 带了合法的 {1,1,1}，不能再用它断言空值。
const emptyMealsParsed = tourDetailSchema.parse({ ...sample, mealCounts: {} });
assert.equal(emptyMealsParsed.mealCounts, undefined, 'normalized empty mealCounts should be omitted');
const legacyParsed = tourDetailSchema.parse({ ...sample, mealCounts: null });
assert.equal(legacyParsed.mealCounts, null, 'legacy null mealCounts must remain readable');

const provenanceParsed = tourDetailSchema.parse({
  ...sample,
  geoResolution: {
    input: { destination: '广东', hasTitle: true, itineraryDays: 3, accommodationDays: 2, highlightCount: 1 },
    mining: {
      status: 'resolved',
      candidateLabels: ['肇庆蓝钟温泉'],
      candidateSources: ['title'],
      rejectedLabels: ['广州'],
      reasons: ['departure-mention'],
    },
    osm: { status: 'ambiguous', reason: 'same-name-candidates', label: '肇庆蓝钟温泉' },
    geocoder: { status: 'no-match', queries: ['肇庆蓝钟温泉 广东 中国'], reason: 'cache-miss' },
    final: { status: 'unmapped' },
  },
});
assert.equal(provenanceParsed.geoResolution?.mining.candidateLabels[0], '肇庆蓝钟温泉');

const legacyGeoPlace = geoPlacesSchema.parse([{
  placeId: 'legacy-city',
  name: '肇庆',
  normalizedName: '肇庆',
  province: '广东',
  city: '肇庆',
  latitude: 23.05,
  longitude: 112.46,
  coordinateSystem: 'wgs84',
  level: 'city',
  coordinateSource: 'catalog',
  precision: 'city',
  source: 'catalog',
  confidence: 'medium',
  tourIds: ['tour_legacy'],
  tourCount: 1,
  roles: ['destination'],
}]);
assert.equal(legacyGeoPlace[0].precision, 'approximate', 'legacy semantic precision must remain readable');

const firstPage = JSON.parse(fs.readFileSync('public/data/tours-page-0.json', 'utf8'));
const pageParsed = toursPageSchema.parse(firstPage);
assert.ok(pageParsed.items.length > 0, 'the initial tour page must remain runtime-readable');

const legacyEmptyCountsPage = toursPageSchema.parse({
  ...firstPage,
  items: [
    {
      ...firstPage.items[0],
      meta: {
        ...firstPage.items[0].meta,
        structuredDetails: {
          ...firstPage.items[0].meta.structuredDetails,
          mealCounts: {},
        },
      },
    },
  ],
});
assert.equal(
  legacyEmptyCountsPage.items[0].meta?.structuredDetails?.mealCounts,
  undefined,
  'legacy empty mealCounts must not reject an entire tour page',
);

console.log('runtime tour schema compatibility passed');
