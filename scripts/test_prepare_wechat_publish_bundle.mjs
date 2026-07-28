import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { preparePublishBundle } from './lib/wechat_publish.mjs';

const rootDir = process.cwd();
const outDir = path.join(rootDir, 'weekly-wechat-posts', '2099-01-01-test');
const expectedSourceUrl = 'https://nuctori.github.io/EverywhereWeGoGz/';
const sourceImagePath = path.join(
  rootDir,
  'public',
  'data',
  'image-cache',
  `.wechat-bundle-test-${process.pid}.png`,
);
const sourceImageUrl = `${expectedSourceUrl}data/image-cache/${path.basename(sourceImagePath)}`;
const previousSourceUrl = process.env.WECHAT_CONTENT_SOURCE_URL;
process.env.WECHAT_CONTENT_SOURCE_URL = expectedSourceUrl;

fs.mkdirSync(outDir, { recursive: true });
await sharp({
  create: {
    width: 4096,
    height: 2730,
    channels: 3,
    background: '#2f6f68',
  },
})
  .png()
  .toFile(sourceImagePath);
fs.writeFileSync(path.join(outDir, 'article.md'), `---
title: "测试文章"
summary: "测试摘要"
author: "老广去边度"
cover: "/data/image-cache/jrttp.jrt365.com_8066/238e10f60f6c77e6.webp"
---

# 标题

正文
![测试图片](${sourceImageUrl})
`, 'utf8');

const result = await preparePublishBundle(rootDir, { outDir });
assert.ok(result.bundlePath.endsWith('publish-bundle.json'));
assert.ok(fs.existsSync(result.bundle.htmlPath));
assert.ok(fs.existsSync(result.bundle.uploadCoverPath));
assert.equal(result.bundle.title, '测试文章');
assert.equal(result.bundle.sourceUrl, expectedSourceUrl);

const generatedHtml = fs.readFileSync(result.bundle.htmlPath, 'utf8');
const assetMatch = generatedHtml.match(/src="(wechat-assets\/[^\"]+\.jpg)"/);
assert.ok(assetMatch, 'expected bundle HTML to reference a normalized JPEG asset');
const assetMetadata = await sharp(path.join(path.dirname(result.bundle.htmlPath), assetMatch[1])).metadata();
assert.equal(assetMetadata.format, 'jpeg');
assert.ok(assetMetadata.width <= 2000);
assert.ok(assetMetadata.height <= 2000);

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
fs.rmSync(sourceImagePath, { force: true });

console.log('wechat publish bundle tests passed');
