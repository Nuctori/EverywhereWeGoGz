import assert from 'node:assert/strict';
import fs from 'node:fs';

import { tourDetailSchema, toursPageSchema } from '../src/lib/runtime-schemas.ts';

const sample = JSON.parse(fs.readFileSync('public/data/tour-details/tour_1.json', 'utf8'));
const parsed = tourDetailSchema.parse(sample);
assert.equal(parsed.mealCounts, undefined, 'normalized empty mealCounts should be omitted');
const legacyParsed = tourDetailSchema.parse({ ...sample, mealCounts: null });
assert.equal(legacyParsed.mealCounts, null, 'legacy null mealCounts must remain readable');

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
