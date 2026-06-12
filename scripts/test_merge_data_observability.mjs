import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const mergePath = path.join(process.cwd(), 'scripts', 'merge_data.py');
const mergeScript = fs.readFileSync(mergePath, 'utf8');

for (const marker of [
  'sys.stdout.reconfigure(line_buffering=True)',
  'print(f"[寮€濮媇 {datetime.utcnow().isoformat()}Z")',
  'print("[鍒嗙墖] 瑙﹀彂 split_tour_data.mjs")',
  'log_stage("merge_data main", started_at)',
]) {
  assert.ok(mergeScript.includes(marker), `expected merge_data.py to include ${marker}`);
}

for (const label of [
  'read existing tours.json',
  'read legacy backup',
  'dedupe raw records',
  'filter valid raw records',
  'load detail results',
  'availability filter',
]) {
  assert.ok(
    mergeScript.includes(label),
    `expected merge_data.py to log ${label}`,
  );
}

console.log('merge data observability audit passed');
