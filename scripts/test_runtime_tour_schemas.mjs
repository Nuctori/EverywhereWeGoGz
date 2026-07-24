import assert from 'node:assert/strict';
import fs from 'node:fs';

import { tourDetailSchema } from '../src/lib/runtime-schemas.ts';

const sample = JSON.parse(fs.readFileSync('public/data/tour-details/tour_1.json', 'utf8'));
const parsed = tourDetailSchema.parse(sample);
assert.equal(parsed.mealCounts, undefined, 'normalized empty mealCounts should be omitted');
const legacyParsed = tourDetailSchema.parse({ ...sample, mealCounts: null });
assert.equal(legacyParsed.mealCounts, null, 'legacy null mealCounts must remain readable');

console.log('runtime tour schema compatibility passed');
