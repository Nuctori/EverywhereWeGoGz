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
  mergeScript.includes('if image_cache_mode in {"remote", "skip", "off"}:'),
  'remote/skip image modes should preserve remote URLs',
);
assert.ok(mergeScript.includes('def prefetch_image_cache('), 'merge should prefetch image cache concurrently');
assert.ok(mergeScript.includes('def build_source_meta('), 'merge should preserve source-specific metadata');
assert.ok(mergeScript.includes('syntheticFields'), 'merge should retain provenance metadata for compatibility');
assert.ok(mergeScript.includes('"startingPrice"') && mergeScript.includes('"productType"') && mergeScript.includes('raw_meta.get(key)'), 'merge should retain extracted GZL fields');
assert.ok(mergeScript.includes('isinstance(raw_attributes, dict)'), 'source metadata must tolerate malformed legacy attributes');
assert.ok(mergeScript.includes('"accommodationStars": "unknown"') && mergeScript.includes('"visaRequirements": "unknown"'), 'unavailable detail fields must remain unknown');
assert.ok(mergeScript.includes("duration_source = 'source' if raw_days else ('inferred' if title_days else 'unknown')"), 'duration provenance must distinguish source, inferred, and unknown values');
assert.ok(mergeScript.includes('meals_value') && mergeScript.includes('transport_value') && mergeScript.includes('raw_tags'), 'available source/detail values should feed legacy fields when present');
assert.ok(mergeScript.includes('group_size = group_match.group(0) if group_match else ""'), 'group size must not fall back to a fabricated fixed value');
assert.ok(mergeScript.includes('"highlights": detail.get("highlights", [])'), 'highlights must not fall back to fabricated generic claims');
assert.ok(/if not days:\r?\n        return None/.test(mergeScript), 'records without a source or title duration must be rejected');
assert.ok(mergeScript.includes('if not isinstance(meals, list):'), 'malformed itinerary meals must keep the legacy fallback');
assert.ok(mergeScript.includes('isinstance(source_features, list) and source_features'), 'empty source features must not overwrite compatible fallback values');
assert.ok(mergeScript.includes('def string_list(value)') && mergeScript.includes('raw_tags = string_list(raw.get("tags"))'), 'legacy list fields must be normalized before entering the runtime schema');
assert.ok(mergeScript.includes('def write_json_atomically(') && mergeScript.includes('os.replace(temp_path, path)'), 'merged JSON should be written atomically');
assert.ok(mergeScript.includes('def nonnegative_number(value, default=0)'), 'numeric source fields must be normalized without inventing values');

console.log('merge data observability audit passed');
