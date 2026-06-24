import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  buildDraftPayload,
  buildQrFallbackUrl,
  injectQrFallbackIntoMarkdown,
  markdownToHtml,
  parseFrontmatter,
  prepareInlineImageAssetsForHtml,
} from './lib/wechat_publish.mjs';

const rootDir = process.cwd();
const markdown = `---
title: "本周线路推荐"
summary: "适合近期出发的三条线。"
author: "老广去边度"
cover: "/data/image-cache/cover.webp"
---

# 本周适合出发的线路

![导语配图](https://nuctori.github.io/EverywhereWeGoGz/data/image-cache/cover.webp)

## 清远峡谷漂流2天

这条线路适合想找清凉感的人。

- 近期班期：2026-06-24
- 参考价格：699元/人

[查看线路](https://example.com/qingyuan)
`;

const parsed = parseFrontmatter(markdown);
assert.equal(parsed.data.title, '本周线路推荐');
assert.equal(parsed.data.cover, '/data/image-cache/cover.webp');
assert.ok(parsed.body.includes('# 本周适合出发的线路'));

const html = markdownToHtml(parsed.body);
assert.ok(html.includes('>本周适合出发的线路</h1>') || html.includes('本周适合出发的线路</h1>'));
assert.ok(html.includes('src="https://nuctori.github.io/EverywhereWeGoGz/data/image-cache/cover.webp"'));
assert.ok(html.includes('alt="导语配图"'));
assert.ok(html.includes('清远峡谷漂流2天</h2>'));
assert.ok(html.includes('• 近期班期：2026-06-24'));
assert.ok(html.includes('href="https://example.com/qingyuan"'));
assert.ok(html.includes('>查看线路</a>'));
assert.ok(html.includes('<div style="margin:18px 0 20px;text-align:center;"><img src="https://nuctori.github.io/EverywhereWeGoGz/data/image-cache/cover.webp"'));

const inlineAssetDir = path.join(rootDir, 'weekly-wechat-posts', '2099-01-01-test-inline');
fs.rmSync(inlineAssetDir, { recursive: true, force: true });
fs.mkdirSync(inlineAssetDir, { recursive: true });
const originalFetch = globalThis.fetch;
const samplePng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO2Y8S0AAAAASUVORK5CYII=',
  'base64',
);
globalThis.fetch = async (url) => ({
  ok: true,
  headers: {
    get(name) {
      return String(name).toLowerCase() === 'content-type'
        ? String(url).includes('b.png')
          ? 'image/png'
          : 'image/webp'
        : null;
    },
  },
  async arrayBuffer() {
    return samplePng;
  },
});
try {
  const preparedInline = await prepareInlineImageAssetsForHtml(
    '<p><img src="https://example.com/a.webp"></p><p><img src="https://example.com/b.png"></p>',
    inlineAssetDir,
  );
  assert.ok(preparedInline.html.includes('inline-images/01-a.jpg'));
  assert.ok(preparedInline.html.includes('inline-images/02-b.png'));
  assert.ok(fs.existsSync(path.join(inlineAssetDir, 'inline-images')));
  assert.ok(fs.existsSync(path.join(inlineAssetDir, 'inline-images', '01-a.jpg')));
  assert.ok(fs.existsSync(path.join(inlineAssetDir, 'inline-images', '02-b.png')));
} finally {
  globalThis.fetch = originalFetch;
}

const markdownWithQr = injectQrFallbackIntoMarkdown(markdown, {
  sourceUrl: 'https://nuctori.github.io/EverywhereWeGoGz/',
});
assert.ok(markdownWithQr.includes('地址：https://example.com/qingyuan'));
assert.ok(markdownWithQr.includes('> 扫码查看详情'));
assert.ok(markdownWithQr.includes('报名二维码'));
assert.ok(buildQrFallbackUrl('https://example.com/qingyuan').includes('quickchart.io/qr'));

const htmlWithQr = markdownToHtml(parseFrontmatter(markdownWithQr).body);
assert.ok(htmlWithQr.includes('地址：https://example.com/qingyuan'));
assert.ok(htmlWithQr.includes('<img src="https://quickchart.io/qr'));
assert.ok(htmlWithQr.includes('扫码查看详情'));

const htmlForFeatureBlock = markdownToHtml(`## 重点线路\n\n### 清远峡谷漂流2天\n![线路图](https://example.com/feature.jpg)\n适合周末找清凉感。\n[查看线路](https://example.com/feature)`);
assert.ok(htmlForFeatureBlock.includes('<h3'));
assert.ok(htmlForFeatureBlock.includes('<div style="margin:18px 0 20px;text-align:center;"><img src="https://example.com/feature.jpg" alt="线路图" style="display:block;width:100%;height:auto;border-radius:8px;"></div>'));
assert.ok(htmlForFeatureBlock.includes('适合周末找清凉感。'));
assert.ok(htmlForFeatureBlock.includes('href="https://example.com/feature"'));

const htmlForOrderedList = markdownToHtml(`## 一周推荐\n\n1. 第一条\n2. 第二条\n\n> 提示\n> ![二维码](https://example.com/qr.png)`);
assert.ok(htmlForOrderedList.includes('1. 第一条'));
assert.ok(htmlForOrderedList.includes('2. 第二条'));
assert.ok(htmlForOrderedList.includes('提示'));
assert.ok(htmlForOrderedList.includes('qr.png'));

const payload = buildDraftPayload({
  frontmatter: parsed.data,
  html,
  thumbMediaId: 'thumb123',
  sourceUrl: 'https://laoguang.example/article',
  commentsOpen: true,
  fansOnly: false,
});

assert.equal(payload.articles[0].title, '本周线路推荐');
assert.equal(payload.articles[0].thumb_media_id, 'thumb123');
assert.equal(payload.articles[0].content_source_url, 'https://laoguang.example/article');
assert.equal(payload.articles[0].need_open_comment, 1);
assert.equal(payload.articles[0].only_fans_can_comment, 0);

console.log('wechat publish tests passed');
