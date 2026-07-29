import assert from 'node:assert/strict';
globalThis.fetch = async (url, init = {}) => {
  if (String(url).includes('/media/uploadimg')) {
    const media = init.body?.get?.('media');
    if (media?.arrayBuffer) {
      const metadata = await sharp(Buffer.from(await media.arrayBuffer())).metadata();
      uploadedImageMetadata.push({
        name: media.name,
        type: media.type,
        width: metadata.width,
        height: metadata.height,
      });
    }
    return new Response(JSON.stringify({ url: 'https://mmbiz.qpic.cn/mock-uploaded.png' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  throw new Error(`Unexpected fetch url in test: ${url}`);
};
import {
  buildDraftPayload,
  rewriteHtmlImagesForWechat,
  markdownToHtml,
  parseFrontmatter,
  WECHAT_INLINE_IMAGE_MAX_EDGE,
} from './lib/wechat_publish.mjs';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const uploadedImageMetadata = [];

const markdown = `---
title: "本周线路推荐"
summary: "适合近期出发的三条线。"
author: "老广去边度"
cover: "/data/image-cache/cover.webp"
---

# 本周适合出发的线路

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
assert.ok(html.includes('<h1 style='));
assert.ok(html.includes('本周适合出发的线路'));
assert.ok(html.includes('<h2 style='));
assert.ok(html.includes('清远峡谷漂流2天'));
assert.ok(html.includes('<ul style='));
assert.ok(html.includes('<a href="https://example.com/qingyuan">查看线路</a>'));

const groupedHtml = markdownToHtml(`
## 本周推荐

### 山水亲水

更适合这周先挑真山真水和有树荫的方向。

---

#### 1. 清远峡谷漂流2天

这条线路现在看，重点是漂流和峡谷都能直接把体感往下拉。
`);
assert.ok(groupedHtml.includes('border-left:4px solid #0f766e'));
assert.ok(groupedHtml.includes('font-size:19px'));
assert.ok(groupedHtml.includes('font-size:18px'));
assert.ok(groupedHtml.includes('border-top:1px solid #dbe4ea'));

const infoLinesHtml = markdownToHtml(`
**适合**：亲子、朋友｜当下看点：峡谷和漂流
**行程**：2天｜399元/人｜近期班期 2026-06-27
**提醒**：出发前查看天气并准备替换衣物
`);
assert.ok(infoLinesHtml.includes('适合'));
assert.ok(infoLinesHtml.includes('行程'));
assert.ok(infoLinesHtml.includes('border-left:3px solid #e7a23b'));
assert.ok(infoLinesHtml.includes('background:#fff9ed'));

const legacyInfoLinesHtml = markdownToHtml('提醒：旧文章也应使用提醒样式');
assert.ok(legacyInfoLinesHtml.includes('background:#fff9ed'));

const supportBlockHtml = markdownToHtml(`
[查看行程](https://nuctori.github.io/EverywhereWeGoGz/?tour=tour_2705&source=wechat)

扫码查看详情

![查看行程 报名二维码](qr/tour_2705.png)
`);
assert.ok(supportBlockHtml.includes('扫码查看详情'));
assert.ok(supportBlockHtml.includes('width:180px'));
assert.ok(supportBlockHtml.includes('长按识别二维码，查看完整行程'));
assert.ok(!supportBlockHtml.includes('详情地址'));
assert.ok(!supportBlockHtml.includes('source=wechat</div>'));
assert.ok(supportBlockHtml.includes('qr/tour_2705.png'));

const legacySupportBlockHtml = markdownToHtml(`
[查看行程](https://example.com/tour)

地址：https://example.com/tour

扫码查看详情

![报名二维码](qr/legacy.png)
`);
assert.ok(!legacySupportBlockHtml.includes('详情地址'));
assert.ok(legacySupportBlockHtml.includes('qr/legacy.png'));

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

const tmpRoot = process.cwd();
const inlineDir = path.join(tmpRoot, 'tmp', 'wechat-inline-image-test');
fs.mkdirSync(inlineDir, { recursive: true });
const inlineImage = path.join(inlineDir, 'inline-test.png');
fs.writeFileSync(
  inlineImage,
  Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+XgnsAAAAASUVORK5CYII=', 'base64'),
);
fs.mkdirSync(path.join(inlineDir, 'qr'), { recursive: true });
fs.writeFileSync(
  path.join(inlineDir, 'qr', 'tour_2705.png'),
  Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+XgnsAAAAASUVORK5CYII=', 'base64'),
);

const rewritten = await rewriteHtmlImagesForWechat(
  tmpRoot,
  path.join(inlineDir, 'article.md'),
  `<p><img src="${inlineImage}" alt="inline"></p>`,
  'token123',
);
assert.ok(rewritten.includes('https://mmbiz.qpic.cn/'));

const publicImagePath = path.join(tmpRoot, 'public', 'data', 'image-cache', 'wechat-inline-test.png');
fs.mkdirSync(path.dirname(publicImagePath), { recursive: true });
fs.writeFileSync(
  publicImagePath,
  Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+XgnsAAAAASUVORK5CYII=', 'base64'),
);
const publicImageRewritten = await rewriteHtmlImagesForWechat(
  tmpRoot,
  path.join(inlineDir, 'article.md'),
  `<p><img src="/data/image-cache/wechat-inline-test.png" alt="public"></p>`,
  'token123',
);
assert.ok(publicImageRewritten.includes('https://mmbiz.qpic.cn/'));

const qrRewritten = await rewriteHtmlImagesForWechat(
  tmpRoot,
  path.join(inlineDir, 'article.md'),
  supportBlockHtml,
  'token123',
);
assert.ok(qrRewritten.includes('https://mmbiz.qpic.cn/'));

const oversizedImagePath = path.join(inlineDir, 'oversized.png');
await sharp({
  create: {
    width: 4096,
    height: 2730,
    channels: 3,
    background: '#2f6f68',
  },
})
  .png()
  .toFile(oversizedImagePath);
const oversizedRewritten = await rewriteHtmlImagesForWechat(
  tmpRoot,
  path.join(inlineDir, 'article.md'),
  `<p><img src="${oversizedImagePath}" alt="oversized"></p>`,
  'token123',
);
assert.ok(oversizedRewritten.includes('https://mmbiz.qpic.cn/'));
const oversizedUpload = uploadedImageMetadata.at(-1);
assert.equal(oversizedUpload.type, 'image/jpeg');
assert.match(oversizedUpload.name, /\.jpg$/);
assert.ok(oversizedUpload.width <= WECHAT_INLINE_IMAGE_MAX_EDGE);
assert.ok(oversizedUpload.height <= WECHAT_INLINE_IMAGE_MAX_EDGE);
fs.rmSync(inlineDir, { recursive: true, force: true });
fs.rmSync(publicImagePath, { force: true });

console.log('wechat publish tests passed');
