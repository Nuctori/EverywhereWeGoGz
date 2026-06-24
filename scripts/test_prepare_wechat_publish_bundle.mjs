import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { prepareCoverForUpload, preparePublishBundle } from './lib/wechat_publish.mjs';

const rootDir = process.cwd();
const outDir = path.join(rootDir, 'weekly-wechat-posts', '2099-01-01-test');
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
assert.equal(result.bundle.sourceUrl, 'https://nuctori.github.io/EverywhereWeGoGz/');

const remoteCoverOutput = await prepareCoverForUpload(
  'https://nuctori.github.io/EverywhereWeGoGz/data/image-cache/jrttp.jrt365.com_8066/238e10f60f6c77e6.webp',
  outDir,
);
assert.ok(fs.existsSync(remoteCoverOutput));

console.log('wechat publish bundle tests passed');
