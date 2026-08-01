import assert from 'node:assert/strict';
import fs from 'node:fs';

import { tourDetailSchema, toursPageSchema } from '../src/lib/runtime-schemas.ts';

const sample = JSON.parse(fs.readFileSync('public/data/tour-details/tour_1.json', 'utf8'));
const parsed = tourDetailSchema.parse(sample);
assert.equal(parsed.mealCounts, undefined, 'normalized empty mealCounts should be omitted');
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
