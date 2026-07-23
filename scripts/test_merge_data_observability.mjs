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

console.log('merge data observability audit passed');
