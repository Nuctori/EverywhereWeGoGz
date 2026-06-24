import assert from 'node:assert/strict';
import {
  buildWeeklyArticleContext,
  buildWeeklyArticlePrompt,
  enrichWeeklyArticleMedia,
  getDefaultWebsiteUrl,
  validateGeneratedArticle,
} from './lib/weekly_wechat_article.mjs';

const tours = [
  {
    id: 'tour-qingyuan',
    title: 'Qingyuan Gorge Rafting 2D (Private Pool)',
    source: 'fixture',
    destination: 'Guangdong',
    duration: 2,
    price: 699,
    priceUnit: 'per person',
    departureDate: '2026-06-26',
    departureDates: ['2026-06-26', '2026-06-28'],
    transportType: 'bus',
    accommodationLevel: 'comfort',
    highlights: ['rafting', 'gorge', 'cool escape'],
    tags: ['summer', 'family'],
    suitableFor: ['family'],
    images: ['/data/image-cache/qingyuan.webp'],
    bookingUrl: 'https://example.com/qingyuan',
    theme: 'nature',
    isHot: true,
    dataQuality: { availabilityConfidence: 'high' },
  },
  {
    id: 'tour-europe',
    title: 'Europe Deep Tour 12D',
    source: 'fixture',
    destination: 'Europe',
    duration: 12,
    price: 19999,
    priceUnit: 'per person',
    departureDate: '2026-06-30',
    departureDates: ['2026-06-30'],
    transportType: 'flight',
    accommodationLevel: 'luxury',
    highlights: ['museum'],
    tags: ['culture'],
    suitableFor: ['couple'],
    images: ['/data/image-cache/europe.webp'],
    bookingUrl: 'https://example.com/europe',
    theme: 'culture',
    dataQuality: { availabilityConfidence: 'high' },
  },
  {
    id: 'tour-hezhou',
    title: 'Hezhou West Creek 3D (Yuequanju + 4 Meals)',
    source: 'fixture',
    destination: 'Guangxi',
    duration: 3,
    price: 799,
    priceUnit: 'per person',
    departureDate: '2026-06-29',
    departureDates: ['2026-06-29', '2026-07-01'],
    transportType: 'bus',
    accommodationLevel: 'comfort',
    highlights: ['mountain spring', 'forest', 'local food'],
    tags: ['cool escape', 'family'],
    suitableFor: ['family', 'friends'],
    images: ['/data/image-cache/hezhou.webp'],
    bookingUrl: 'https://example.com/hezhou',
    theme: 'nature',
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
assert.equal(context.selectedTours[0].id, 'tour-qingyuan');
assert.ok(context.selectedTours.some((tour) => tour.id === 'tour-hezhou'));
assert.ok(!context.selectedTours.some((tour) => tour.id === 'tour-europe'));

const prompt = buildWeeklyArticlePrompt(context);
assert.ok(prompt.includes('frontmatter'));
assert.ok(prompt.includes('Qingyuan Gorge Rafting 2D (Private Pool)'));
assert.ok(prompt.includes('Hezhou West Creek 3D (Yuequanju + 4 Meals)'));
assert.ok(prompt.includes(getDefaultWebsiteUrl()));
assert.ok(prompt.includes('https://nuctori.github.io/EverywhereWeGoGz/data/image-cache/qingyuan.webp'));
assert.ok(prompt.includes('https://nuctori.github.io/EverywhereWeGoGz/data/image-cache/hezhou.webp'));

const article = `---
title: "This Week's Easy Summer Getaways"
summary: "Two nearby tours with cooler mountain-and-water plans."
author: "Lao Guang Travel"
cover: "/data/image-cache/qingyuan.webp"
---

# This Week's Easy Summer Getaways

## Qingyuan Gorge Rafting 2D (Private Pool)

This one fits families who want a short cooling break.

## Hezhou West Creek 3D (Yuequanju + 4 Meals)

This one works for readers who want mountain water and an easier hot-spring stay.
`;

const validation = validateGeneratedArticle(article, context);
assert.equal(validation.ok, true);

const enriched = enrichWeeklyArticleMedia(article, context, {
  websiteUrl: getDefaultWebsiteUrl(),
});
assert.ok(enriched.includes('![Qingyuan Gorge Rafting 2D (Private Pool)](https://nuctori.github.io/EverywhereWeGoGz/data/image-cache/qingyuan.webp)'));
assert.ok(enriched.includes('![Hezhou West Creek 3D (Yuequanju + 4 Meals)](https://nuctori.github.io/EverywhereWeGoGz/data/image-cache/hezhou.webp)'));

const articleWithLooseTitles = `---
title: "This Week's Easy Summer Getaways"
summary: "Two nearby tours with cooler mountain-and-water plans."
author: "Lao Guang Travel"
cover: "/data/image-cache/qingyuan.webp"
---

# This Week's Easy Summer Getaways

## 1. Qingyuan Gorge Rafting 2D - Private Pool Weekend

This one fits families who want a short cooling break.

## 2. Hezhou West Creek 3D - Yuequanju 4 Meals Mountain Spring Break

This one works for readers who want mountain water and an easier hot-spring stay.
`;

const looseValidation = validateGeneratedArticle(articleWithLooseTitles, context);
assert.equal(looseValidation.ok, true);

const enrichedLooseTitles = enrichWeeklyArticleMedia(articleWithLooseTitles, context, {
  websiteUrl: getDefaultWebsiteUrl(),
});
assert.ok(enrichedLooseTitles.includes('![Hezhou West Creek 3D (Yuequanju + 4 Meals)](https://nuctori.github.io/EverywhereWeGoGz/data/image-cache/hezhou.webp)'));

console.log('weekly wechat article tests passed');
