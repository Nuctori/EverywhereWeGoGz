import assert from 'node:assert/strict';
import {
  buildDraftPayload,
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
assert.ok(html.includes('<h1>本周适合出发的线路</h1>'));
assert.ok(html.includes('<h2>清远峡谷漂流2天</h2>'));
assert.ok(html.includes('<ul>'));
assert.ok(html.includes('<a href="https://example.com/qingyuan">查看线路</a>'));

const supportBlockHtml = markdownToHtml(`
[查看行程](https://nuctori.github.io/EverywhereWeGoGz/?tour=tour_2705&source=wechat)

地址：https://nuctori.github.io/EverywhereWeGoGz/?tour=tour_2705&source=wechat

扫码查看详情

![查看行程 报名二维码](https://quickchart.io/qr?text=tour_2705)
`);
assert.ok(supportBlockHtml.includes('详情地址'));
assert.ok(supportBlockHtml.includes('扫码查看详情'));
assert.ok(supportBlockHtml.includes('width:200px'));
assert.ok(supportBlockHtml.includes('老广去边度站内详情页'));
assert.ok(!supportBlockHtml.includes('<p>地址：https://nuctori.github.io/EverywhereWeGoGz/?tour=tour_2705&amp;source=wechat</p>'));

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
