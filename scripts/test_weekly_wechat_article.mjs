import assert from 'node:assert/strict';
import {
  buildWeeklyArticleContext,
  buildWeeklyArticlePrompt,
  enrichWeeklyArticleMedia,
  fetchWeatherOutlook,
  getDefaultWebsiteUrl,
  validateGeneratedArticle,
} from './lib/weekly_wechat_article.mjs';

const tours = [
  {
    id: 'tour-qingyuan',
    title: 'Qingyuan Gorge Rafting 2D',
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
    id: 'tour-hotspring',
    title: 'Jinshuitai Hot Spring 2D',
    source: 'fixture',
    destination: 'Guangdong',
    duration: 2,
    price: 299,
    priceUnit: 'per person',
    departureDate: '2026-06-25',
    departureDates: ['2026-06-25', '2026-06-27'],
    transportType: 'bus',
    accommodationLevel: 'comfort',
    highlights: ['hot spring', 'hotel', 'food'],
    tags: ['hot spring', 'resort'],
    suitableFor: ['family'],
    images: ['/data/image-cache/hotspring.webp'],
    bookingUrl: 'https://example.com/hotspring',
    theme: 'resort',
    isHot: true,
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
    highlights: ['mountain water', 'forest', 'local food'],
    tags: ['cool escape', 'family'],
    suitableFor: ['family', 'friends'],
    images: ['/data/image-cache/hezhou.webp'],
    bookingUrl: 'https://example.com/hezhou',
    theme: 'nature',
    isHot: true,
    dataQuality: { availabilityConfidence: 'high' },
  },
  {
    id: 'tour-hunan-rail',
    title: 'Hunan High-Speed Rail 4D',
    source: 'fixture',
    destination: 'Hunan',
    duration: 4,
    price: 1299,
    priceUnit: 'per person',
    departureDate: '2026-06-30',
    departureDates: ['2026-06-30'],
    transportType: 'high-speed rail',
    accommodationLevel: 'comfort',
    highlights: ['mountain scenery', 'rail', 'summer trip'],
    tags: ['rail', 'nature'],
    suitableFor: ['couple'],
    images: ['/data/image-cache/hunan.webp'],
    bookingUrl: 'https://example.com/hunan',
    theme: 'nature',
    dataQuality: { availabilityConfidence: 'high' },
  },
];

const weatherOutlook = await fetchWeatherOutlook({
  location: '广州',
  fetchImpl: async () => ({
    ok: true,
    async json() {
      return {
        daily: {
          time: ['2026-06-24', '2026-06-25', '2026-06-26', '2026-06-27', '2026-06-28', '2026-06-29', '2026-06-30'],
          weather_code: [2, 80, 3, 1, 95, 2, 0],
          temperature_2m_max: [32, 31, 30, 33, 29, 31, 34],
          temperature_2m_min: [26, 25, 25, 26, 24, 25, 26],
          precipitation_probability_max: [35, 70, 60, 20, 85, 40, 15],
        },
      };
    },
  }),
});

const context = buildWeeklyArticleContext(tours, {
  runDate: '2026-06-24',
  windowDays: 14,
  maxCandidates: 10,
  maxArticleItems: 3,
  weatherOutlook,
});

assert.equal(context.season, '夏季');
assert.equal(context.generationMode, 'single-pass-deepseek');
assert.equal(context.selectedTours.length, 3);
assert.ok(context.candidateGroups.length >= 3);
assert.ok(context.recommendationGroups.length >= 3);
assert.ok(
  context.recommendationGroups.reduce((sum, group) => sum + group.tours.length, 0) >= 4,
);
assert.ok(context.candidateGroups.some((group) => group.id === 'family_short_break'));
assert.ok(context.candidateGroups.some((group) => group.id === 'mountain_water_cooling'));
assert.ok(context.candidateGroups.some((group) => group.id === 'relaxing_resort'));
assert.ok(context.weatherOutlook.headline.includes('未来7天广州大致在'));
assert.ok(context.seasonalOutlook.some((item) => item.includes('带池')));

const hotSpringCandidate = context.candidateTours.find((tour) => tour.id === 'tour-hotspring');
assert.ok(hotSpringCandidate);
assert.ok(
  hotSpringCandidate.editorialReasons.some((reason) =>
    reason.includes('周末放松'),
  ),
);

const prompt = buildWeeklyArticlePrompt(context);
assert.ok(prompt.includes('本周天气与出游节奏'));
assert.ok(prompt.includes('本周 4 条分组推荐速览'));
assert.ok(prompt.includes('不要解释线路命名'));
assert.ok(prompt.includes('### 亲子短途'));
assert.ok(prompt.includes('### 高铁轻出省'));
assert.ok(prompt.includes('Qingyuan Gorge Rafting 2D'));
assert.ok(prompt.includes('Jinshuitai Hot Spring 2D'));
assert.ok(prompt.includes(getDefaultWebsiteUrl()));

const article = `---
title: "This Week's Guangzhou Summer Tours"
summary: "Three grouped tour ideas for family, cooling nature, and a rail escape."
author: "Lao Guang Travel"
cover: "/data/image-cache/qingyuan.webp"
---

# This Week's Guangzhou Summer Tours

## 本周天气与出游节奏

未来7天广州大致在25-34°C之间，周末有阵雨，短途和酒店型线路更从容。

## Qingyuan Gorge Rafting 2D

This route works for families who want a cooling short break.

## Hezhou West Creek 3D (Yuequanju + 4 Meals)

This route fits readers who want mountain water and a slower pace.

## Hunan High-Speed Rail 4D

This route is better for readers who want to travel a bit farther by rail.
`;

const validation = validateGeneratedArticle(article, context);
assert.equal(validation.ok, true);

const enriched = enrichWeeklyArticleMedia(article, context, {
  websiteUrl: getDefaultWebsiteUrl(),
});
assert.ok(
  enriched.includes(
    '![Qingyuan Gorge Rafting 2D](https://nuctori.github.io/EverywhereWeGoGz/data/image-cache/qingyuan.webp)',
  ),
);
assert.ok(
  enriched.includes(
    '![Hezhou West Creek 3D (Yuequanju + 4 Meals)](https://nuctori.github.io/EverywhereWeGoGz/data/image-cache/hezhou.webp)',
  ),
);
assert.ok(
  enriched.includes(
    '![Hunan High-Speed Rail 4D](https://nuctori.github.io/EverywhereWeGoGz/data/image-cache/hunan.webp)',
  ),
);

const articleWithLooseTitles = `---
title: "This Week's Guangzhou Summer Tours"
summary: "Three grouped tour ideas for family, cooling nature, and a rail escape."
author: "Lao Guang Travel"
cover: "/data/image-cache/qingyuan.webp"
---

# This Week's Guangzhou Summer Tours

## 本周天气与出游节奏

未来7天广州大致在25-34°C之间，周末有阵雨，短途和酒店型线路更从容。

## 1. Qingyuan Gorge Rafting 2D - Family Weekend

This route works for families who want a cooling short break.

## 2. Hezhou West Creek 3D - Yuequanju 4 Meals Cool Escape

This route fits readers who want mountain water and a slower pace.

## 3. Hunan High-Speed Rail 4D - Light Out-of-Province Trip

This route is better for readers who want to travel a bit farther by rail.
`;

const looseValidation = validateGeneratedArticle(articleWithLooseTitles, context);
assert.equal(looseValidation.ok, true);

const enrichedLooseTitles = enrichWeeklyArticleMedia(articleWithLooseTitles, context, {
  websiteUrl: getDefaultWebsiteUrl(),
});
assert.ok(
  enrichedLooseTitles.includes(
    '![Hunan High-Speed Rail 4D](https://nuctori.github.io/EverywhereWeGoGz/data/image-cache/hunan.webp)',
  ),
);

console.log('weekly wechat article tests passed');
