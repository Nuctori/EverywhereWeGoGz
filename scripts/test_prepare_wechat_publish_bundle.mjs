import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { preparePublishBundle } from './lib/wechat_publish.mjs';

const rootDir = process.cwd();
const outDir = path.join(rootDir, 'weekly-wechat-posts', '2099-01-01-test');
const expectedSourceUrl = 'https://nuctori.github.io/EverywhereWeGoGz/';
const previousSourceUrl = process.env.WECHAT_CONTENT_SOURCE_URL;
process.env.WECHAT_CONTENT_SOURCE_URL = expectedSourceUrl;

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'article.md'), `---
title: "测试文章"
summary: "测试摘要"
author: "老广去边度"
cover: "/data/image-cache/jrttp.jrt365.com_8066/238e10f60f6c77e6.webp"
---

# 标题

正文
`, 'utf8');

const result = await preparePublishBundle(rootDir, { outDir });
assert.ok(result.bundlePath.endsWith('publish-bundle.json'));
assert.ok(fs.existsSync(result.bundle.htmlPath));
assert.ok(fs.existsSync(result.bundle.uploadCoverPath));
assert.equal(result.bundle.title, '测试文章');
assert.equal(result.bundle.sourceUrl, expectedSourceUrl);

const workflow = fs.readFileSync(path.join(rootDir, '.github', 'workflows', 'weekly-wechat-article.yml'), 'utf8');
assert.ok(
  workflow.includes(`WECHAT_CONTENT_SOURCE_URL: ${expectedSourceUrl}`),
  'expected weekly workflow to provide a default WeChat source URL',
);

if (previousSourceUrl === undefined) {
  delete process.env.WECHAT_CONTENT_SOURCE_URL;
} else {
  process.env.WECHAT_CONTENT_SOURCE_URL = previousSourceUrl;
}

console.log('wechat publish bundle tests passed');
