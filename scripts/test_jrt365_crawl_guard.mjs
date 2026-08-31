import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const crawlerPath = path.join(process.cwd(), 'scripts', 'crawl_jrt365_full.py');
const crawlerSource = fs.readFileSync(crawlerPath, 'utf8');
const mainIndex = crawlerSource.indexOf('def main():');
assert.ok(mainIndex > -1, 'expected JRT365 crawler to define main()');
const mainSource = crawlerSource.slice(mainIndex);
const guardIndex = mainSource.indexOf(
  'assert_min_raw_items(items, output_path)',
);
const writeIndex = mainSource.indexOf(
  'with open(output_path, "w", encoding="utf-8")',
);

assert.ok(
  guardIndex > -1,
  'expected JRT365 crawler main() to call assert_min_raw_items',
);
assert.ok(
  writeIndex > -1,
  'expected JRT365 crawler main() to write through output_path',
);
assert.ok(
  guardIndex < writeIndex,
  'expected JRT365 crawl guard to run before writing raw data',
);

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'jrt365-crawl-guard-'));
const tempScripts = path.join(tempRoot, 'scripts');
const tempData = path.join(tempRoot, 'src', 'data');
fs.mkdirSync(tempScripts, { recursive: true });
fs.mkdirSync(tempData, { recursive: true });
const tempCrawlerPath = path.join(tempScripts, 'crawl_jrt365_full.py');
const tempRawPath = path.join(tempData, 'raw_jrt365_full.json');
fs.copyFileSync(crawlerPath, tempCrawlerPath);
fs.writeFileSync(tempRawPath, '[{"title":"sentinel"}]\n', 'utf8');

const check = spawnSync(
  'python',
  [
    '-c',
    String.raw`
import importlib.util
import os

spec = importlib.util.spec_from_file_location("crawl_jrt365_full_under_test", os.environ["CRAWLER_UNDER_TEST"])
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

assert_min_raw_items = module.assert_min_raw_items
try:
    assert_min_raw_items([], "src/data/raw_jrt365_full.json")
except SystemExit as exc:
    assert "crawl produced 0 items" in str(exc)
    assert "refusing to overwrite" in str(exc)
else:
    raise AssertionError("empty JRT365 crawl output should fail fast")

assert_min_raw_items([{"title": "valid"}], "src/data/raw_jrt365_full.json")

os.environ["JRT365_MIN_RAW_ITEMS"] = "2"
try:
    assert_min_raw_items([{"title": "only one"}], "src/data/raw_jrt365_full.json")
except SystemExit as exc:
    assert "below JRT365_MIN_RAW_ITEMS=2" in str(exc)
else:
    raise AssertionError("below-threshold JRT365 crawl output should fail fast")

os.environ["JRT365_MIN_RAW_ITEMS"] = "0"
assert_min_raw_items([], "src/data/raw_jrt365_full.json")

os.environ.pop("JRT365_MIN_RAW_ITEMS", None)
module.fetch = lambda: []
# e3a10f2: 0 items with existing file keeps sentinel and returns normally
module.main()
with open(os.environ["RAW_UNDER_TEST"], "r", encoding="utf-8") as f:
    assert f.read() == '[{"title":"sentinel"}]\n'

# 0 items with NO existing file must still fail fast via the guard
import tempfile
tmp_no_file = tempfile.mkdtemp()
empty_path = os.path.join(tmp_no_file, "raw_jrt365_full.json")
try:
    module.assert_min_raw_items([], empty_path)
except SystemExit as exc:
    assert "crawl produced 0 items" in str(exc)
else:
    raise AssertionError("empty JRT365 crawl output should fail fast when no existing file")
`,
  ],
  {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: {
      ...process.env,
      CRAWLER_UNDER_TEST: tempCrawlerPath,
      RAW_UNDER_TEST: tempRawPath,
    },
  },
);

assert.equal(
  check.status,
  0,
  `JRT365 crawl guard test failed\nstdout:\n${check.stdout}\nstderr:\n${check.stderr}`,
);

console.log('jrt365 crawl guard audit passed');
