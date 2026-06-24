import assert from 'node:assert/strict';
import {
  buildDraftPayload,
  buildQrFallbackUrl,
  injectQrFallbackIntoMarkdown,
  markdownToHtml,
  parseFrontmatter,
} from './lib/wechat_publish.mjs';

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

const markdownWithQr = injectQrFallbackIntoMarkdown(markdown, {
  sourceUrl: 'https://nuctori.github.io/EverywhereWeGoGz/',
});
assert.ok(markdownWithQr.includes('## 行程链接与二维码'));
assert.ok(markdownWithQr.includes('微信内如果外链无法直接打开，可在文末扫码继续查看：'));
assert.ok(markdownWithQr.includes('![清远峡谷漂流2天 二维码](') || markdownWithQr.includes('![阅读原文 二维码]('));
assert.ok(buildQrFallbackUrl('https://example.com/qingyuan').includes('quickchart.io/qr'));
assert.ok(!markdownWithQr.includes('> 微信内打开外链不稳定'));
assert.ok(!markdownWithQr.includes('![线路二维码]('));

const htmlWithQr = markdownToHtml(parseFrontmatter(markdownWithQr).body);
assert.ok(htmlWithQr.includes('行程链接与二维码'));
assert.ok(htmlWithQr.includes('<img src="https://quickchart.io/qr'));
assert.ok(!htmlWithQr.includes('&gt; 微信内'));

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
