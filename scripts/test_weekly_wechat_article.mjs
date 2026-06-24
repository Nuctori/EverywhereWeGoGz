import assert from 'node:assert/strict';
import {
  buildWeeklyArticleContext,
  buildWeeklyArticlePrompt,
  validateGeneratedArticle,
} from './lib/weekly_wechat_article.mjs';

const tours = [
  {
    id: 'tour-summer-nearby',
    title: '清远峡谷漂流2天',
    source: '测试源',
    destination: '广东',
    duration: 2,
    price: 699,
    priceUnit: '元/人',
    departureDate: '2026-06-26',
    departureDates: ['2026-06-26', '2026-06-28'],
    transportType: '大巴',
    accommodationLevel: '舒适型',
    highlights: ['漂流', '峡谷', '清凉'],
    tags: ['漂流', '避暑'],
    suitableFor: ['亲子'],
    images: ['/data/image-cache/qingyuan.webp'],
    bookingUrl: 'https://example.com/qingyuan',
    theme: '自然风光',
    isHot: true,
    dataQuality: { availabilityConfidence: 'high' },
  },
  {
    id: 'tour-long-haul',
    title: '欧洲深度12天',
    source: '测试源',
    destination: '其他',
    duration: 12,
    price: 19999,
    priceUnit: '元/人',
    departureDate: '2026-06-30',
    departureDates: ['2026-06-30'],
    transportType: '飞机',
    accommodationLevel: '豪华型',
    highlights: ['博物馆'],
    tags: ['文化'],
    suitableFor: ['情侣'],
    images: ['/data/image-cache/europe.webp'],
    bookingUrl: 'https://example.com/europe',
    theme: '人文',
    dataQuality: { availabilityConfidence: 'high' },
  },
  {
    id: 'tour-guizhou',
    title: '贵州山水避暑4天',
    source: '测试源',
    destination: '贵州',
    duration: 4,
    price: 2399,
    priceUnit: '元/人',
    departureDate: '2026-06-29',
    departureDates: ['2026-06-29', '2026-07-01'],
    transportType: '高铁',
    accommodationLevel: '舒适型',
    highlights: ['山水', '避暑'],
    tags: ['避暑', '亲子'],
    suitableFor: ['亲子', '朋友'],
    images: ['/data/image-cache/guizhou.webp'],
    bookingUrl: 'https://example.com/guizhou',
    theme: '自然风光',
    isHot: true,
    dataQuality: { availabilityConfidence: 'high' },
  },
];

const context = buildWeeklyArticleContext(tours, {
  runDate: '2026-06-24',
  windowDays: 14,
  maxCandidates: 6,
  maxArticleItems: 2,
});

assert.equal(context.selectedTours.length, 2);
assert.equal(context.selectedTours[0].id, 'tour-summer-nearby');
assert.ok(context.selectedTours.some((tour) => tour.id === 'tour-guizhou'));
assert.ok(!context.selectedTours.some((tour) => tour.id === 'tour-long-haul'));
assert.equal(context.season, '夏季');

const prompt = buildWeeklyArticlePrompt(context);
assert.ok(prompt.includes('frontmatter'));
assert.ok(prompt.includes('清远峡谷漂流2天'));
assert.ok(prompt.includes('贵州山水避暑4天'));

const article = `---
title: "本周适合出发的两条线路"
summary: "按近期班期整理的短线与避暑线。"
author: "老广旅行"
cover: "/data/image-cache/qingyuan.webp"
---

# 本周适合出发的两条线路

## 清远峡谷漂流2天

这条线路更适合夏天想找清凉感的人。

## 贵州山水避暑4天

这条线路更适合想找山水避暑的人。
`;

const validation = validateGeneratedArticle(article, context);
assert.equal(validation.ok, true);

console.log('weekly wechat article tests passed');
