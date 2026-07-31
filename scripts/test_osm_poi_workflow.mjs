import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const workflow = fs.readFileSync(path.join(process.cwd(), '.github', 'workflows', 'refresh-osm-poi.yml'), 'utf8');

for (const snippet of [
  "- cron: '33 4 1 * *'",
  'workflow_dispatch:',
  'group: tour-data-writes',
  'pip install osmium',
  'python -u scripts/osm_poi_index.py',
  'python scripts/test_osm_poi_index.py',
  'git add public/data/osm-poi-index.json',
  'bash scripts/push_generated_commit.sh',
]) {
  assert.ok(workflow.includes(snippet), `expected OSM POI workflow to include ${snippet}`);
}
assert.ok(!workflow.includes('.osm.pbf'), 'raw OSM extracts must not be staged or committed');

console.log('OSM POI workflow audit passed');
