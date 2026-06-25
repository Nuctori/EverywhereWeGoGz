import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { preparePublishBundle } from './lib/wechat_publish.mjs';

const rootDir = process.cwd();
const outDir = path.join(rootDir, 'weekly-wechat-posts', '2099-01-01-test');
const webpBytes = fs.readFileSync(path.join(rootDir, 'public', 'data', 'image-cache', 'jrttp.jrt365.com_8066', '238e10f60f6c77e6.webp'));
globalThis.fetch = async (url) => {
  if (String(url) === 'https://example.com/sample.webp') {
    return new Response(webpBytes, {
      status: 200,
      headers: { 'Content-Type': 'image/webp' },
    });
  }
  throw new Error(`Unexpected fetch url in bundle test: ${url}`);
};

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'article.md'), `---
title: "测试文章"
summary: "测试摘要"
author: "老广去边度"
cover: "/data/image-cache/jrttp.jrt365.com_8066/238e10f60f6c77e6.webp"
---

# 标题

正文

![外链图片](https://example.com/sample.webp)

![报名二维码](qr/tour_test.png)
`, 'utf8');

const result = await preparePublishBundle(rootDir, { outDir });
assert.ok(result.bundlePath.endsWith('publish-bundle.json'));
assert.ok(fs.existsSync(result.bundle.htmlPath));
assert.ok(fs.existsSync(result.bundle.uploadCoverPath));
assert.ok(fs.existsSync(path.join(outDir, 'qr')));
assert.ok(fs.existsSync(path.join(outDir, 'qr', 'tour_test.png')));
assert.ok(fs.existsSync(path.join(outDir, 'wechat-assets')));
assert.ok(fs.readdirSync(path.join(outDir, 'wechat-assets')).some((file) => file.endsWith('.jpg')));
assert.equal(result.bundle.title, '测试文章');
assert.ok(!fs.readFileSync(result.bundle.htmlPath, 'utf8').includes('https://example.com/sample.webp'));
assert.ok(fs.readFileSync(result.bundle.htmlPath, 'utf8').includes('wechat-assets/'));

console.log('wechat publish bundle tests passed');
