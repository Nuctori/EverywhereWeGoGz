import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const mergePath = path.join(process.cwd(), 'scripts', 'merge_data.py');
const mergeScript = fs.readFileSync(mergePath, 'utf8');

for (const marker of [
  'import time',
  'import subprocess',
  'if hasattr(sys.stdout, "reconfigure")',
  'sys.stdout.reconfigure(line_buffering=True)',
  'def log_stage(',
  'log_stage("load detail results"',
  'log_stage("merge pipeline complete"',
  '[transform]',
]) {
  assert.ok(mergeScript.includes(marker), `expected merge_data.py to include ${marker}`);
}

assert.ok(mergeScript.includes('load detail results'), 'expected merge_data.py to keep the detail load stage log');
assert.ok(mergeScript.includes('raw_to_tour'), 'expected merge_data.py to keep raw_to_tour coverage');
assert.ok(mergeScript.includes('tour["updatedAt"] = existing["updatedAt"]'), 'expected merge_data.py to avoid timestamp-only data diffs');

console.log('merge data observability audit passed');
