import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const crawlerScripts = [
  'scripts/crawl_jrt365_full.py',
  'scripts/crawl_saihuitong_full.py',
  'scripts/crawl_pintu_full.py',
  'scripts/crawl_gzl_api.py',
  'scripts/crawl_outdoors_full.py',
  'scripts/full_crawl_v3.py',
  'scripts/merge_data.py',
];

const check = spawnSync(
  'python',
  ['-m', 'py_compile', ...crawlerScripts],
  {
    cwd: process.cwd(),
    encoding: 'utf8',
  },
);

assert.equal(
  check.status,
  0,
  `crawler syntax audit failed\nstdout:\n${check.stdout}\nstderr:\n${check.stderr}`,
);

for (const script of crawlerScripts) {
  assert.ok(path.extname(script) === '.py', `expected Python crawler script: ${script}`);
}

console.log('crawler syntax audit passed');
