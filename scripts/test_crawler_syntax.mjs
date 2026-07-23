import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
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

const saihuitongCrawler = fs.readFileSync('scripts/crawl_saihuitong_full.py', 'utf8');
assert.ok(saihuitongCrawler.includes("'扫码'"), 'saihuitong crawler should exclude QR-code ad entries');
assert.ok(saihuitongCrawler.includes("'已结束'"), 'saihuitong crawler should exclude ended entries');

const gzlCrawler = fs.readFileSync('scripts/crawl_gzl_api.py', 'utf8');
assert.ok(gzlCrawler.includes('班期解析'), 'GZL crawler should report schedule parsing progress');

console.log('crawler syntax audit passed');
