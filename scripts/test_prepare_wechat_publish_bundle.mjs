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

[查看线路](https://example.com/test-line)
`, 'utf8');

const result = await preparePublishBundle(rootDir, { outDir });
assert.ok(result.bundlePath.endsWith('publish-bundle.json'));
assert.ok(fs.existsSync(result.bundle.htmlPath));
assert.ok(fs.existsSync(result.bundle.uploadCoverPath));
assert.equal(result.bundle.title, '测试文章');
assert.equal(result.bundle.sourceUrl, 'https://nuctori.github.io/EverywhereWeGoGz/');
const bundledMarkdownWithQr = fs.readFileSync(result.bundle.markdownPathWithQr, 'utf8');
const bundledHtml = fs.readFileSync(result.bundle.htmlPath, 'utf8');
assert.ok(bundledMarkdownWithQr.includes('地址：https://example.com/test-line'));
assert.ok(bundledMarkdownWithQr.includes('报名二维码'));
assert.ok(bundledHtml.includes('地址：https://example.com/test-line'));
assert.ok(bundledHtml.includes('inline-images/'));

const remoteCoverOutput = await prepareCoverForUpload(
  'https://nuctori.github.io/EverywhereWeGoGz/data/image-cache/jrttp.jrt365.com_8066/238e10f60f6c77e6.webp',
  outDir,
);
assert.ok(fs.existsSync(remoteCoverOutput));

console.log('wechat publish bundle tests passed');
