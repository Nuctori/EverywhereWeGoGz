import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const workflow = fs.readFileSync(path.join(process.cwd(), '.github', 'workflows', 'refresh-osm-poi.yml'), 'utf8');

for (const snippet of [
  "- cron: '33 4 1 * *'",
  'workflow_dispatch:',
  'group: tour-data-writes',
  'python -u scripts/osm_poi_index.py',
  'python scripts/test_osm_poi_index.py',
  'python scripts/audit_osm_poi_index.py',
  'python -u scripts/rebuild_geo_data.py',
  'node scripts/test_geo_data_layer.mjs',
  'git add public/data/osm-poi-index.json public/data/tours.json',
  'bash scripts/push_generated_commit.sh',
]) {
  assert.ok(workflow.includes(snippet), `expected OSM POI workflow to include ${snippet}`);
}
assert.ok(
  /pip install [^\n]*osmium/.test(workflow),
  'expected OSM POI workflow to install pyosmium before building the index',
);
// 断言钉在"安装了 osmium"上，而不是某一种 pip 写法：工作流曾从
// `pip install osmium` 加固为
// `python -m pip install --disable-pip-version-check --no-input osmium`，
// 当时这条断言没跟着改，导致 preflight 恒失败、整轮数据更新被拦在门外。
assert.ok(!workflow.includes('.osm.pbf'), 'raw OSM extracts must not be staged or committed');

console.log('OSM POI workflow audit passed');
