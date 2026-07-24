import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const mergePath = path.join(process.cwd(), 'scripts', 'merge_data.py');
const mergeScript = fs.readFileSync(mergePath, 'utf8');

for (const marker of [
  'def load_detail_results(',
  'def raw_to_tour(',
  'def filter_unavailable_tours(',
]) {
  assert.ok(mergeScript.includes(marker), `expected merge_data.py to include ${marker}`);
}

assert.ok(mergeScript.includes('raw_to_tour'), 'expected merge_data.py to keep raw_to_tour coverage');
assert.ok(mergeScript.includes('tour["updatedAt"] = existing["updatedAt"]'), 'expected merge_data.py to avoid timestamp-only data diffs');
assert.ok(mergeScript.includes('if not os.path.exists(os.path.join(data_dir, "raw_jrt365_full.json"))'), 'legacy JRT365 data should only be used when the full crawl is unavailable');
assert.ok(mergeScript.includes('SCHEDULE_REQUIRED_SOURCES'), 'schedule-required sources should be filtered before conversion');
assert.ok(mergeScript.includes('raw.get("departureDates")'), 'merge should preserve structured raw departure dates');
assert.ok(
  mergeScript.includes('if image_cache_mode in {"remote", "skip", "off"} and parsed.scheme == \'https\':'),
  'remote image mode should preserve HTTP downloads',
);
assert.ok(mergeScript.includes('def prefetch_image_cache('), 'merge should prefetch image cache concurrently');
assert.ok(mergeScript.includes('def build_source_meta('), 'merge should preserve source-specific metadata');
assert.ok(mergeScript.includes('syntheticFields'), 'merge should label generated fields instead of presenting them as source facts');
assert.ok(mergeScript.includes('"startingPrice"') && mergeScript.includes('"productType"') && mergeScript.includes('raw_meta.get(key)'), 'merge should retain extracted GZL fields');
assert.ok(mergeScript.includes('isinstance(raw_attributes, dict)'), 'source metadata must tolerate malformed legacy attributes');
assert.ok(mergeScript.includes('"accommodationStars": "synthetic"') && mergeScript.includes('"visaRequirements": "synthetic"'), 'all generated detail fields must be classified');
assert.ok(mergeScript.includes("duration_source = 'source' if raw_days else ('inferred' if title_days else 'unknown')"), 'duration provenance must distinguish source, inferred, and unknown values');
assert.ok(mergeScript.includes('meals_value') && mergeScript.includes('transport_value') && mergeScript.includes('raw_tags'), 'available source/detail values should feed legacy fields when present');
assert.ok(mergeScript.includes('if not isinstance(meals, list):'), 'malformed itinerary meals must keep the legacy fallback');
assert.ok(mergeScript.includes('isinstance(source_features, list) and source_features'), 'empty source features must not overwrite compatible fallback values');
assert.ok(mergeScript.includes('def string_list(value)') && mergeScript.includes('raw_tags = string_list(raw.get("tags"))'), 'legacy list fields must be normalized before entering the runtime schema');

console.log('merge data observability audit passed');
