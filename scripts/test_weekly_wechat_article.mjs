import assert from 'node:assert/strict';
import {
  buildTourDetailUrl,
  buildWeeklyArticleContext,
  buildWeeklyArticlePrompt,
  enrichWeeklyArticleMedia,
  fetchWeatherOutlook,
  getDefaultWebsiteUrl,
  scoreWeeklyArticleTour,
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
assert.ok(Array.isArray(context.aiSelectionBuckets));
assert.ok(context.aiSelectionBuckets.length >= context.candidateGroups.length);
assert.ok(context.aiSelectionBuckets.some((group) => group.id === 'mountain_water_cooling'));
assert.ok(context.weatherOutlook.headline.includes('未来7天广州大致在'));
assert.ok(context.seasonalOutlook.some((item) => item.includes('泳池') || item.includes('水世界')));
const coolingGroup = context.candidateGroups.find((group) => group.id === 'mountain_water_cooling');
assert.ok(coolingGroup);
assert.ok(coolingGroup.tours.some((tour) => tour.id === 'tour-qingyuan'));
assert.ok(!coolingGroup.tours.some((tour) => tour.id === 'tour-hotspring'));

const hotSpringCandidate = context.candidateTours.find((tour) => tour.id === 'tour-hotspring');
assert.ok(hotSpringCandidate);
assert.ok(
  hotSpringCandidate.editorialReasons.some((reason) =>
    reason.includes('周末放松'),
  ),
);

const prompt = buildWeeklyArticlePrompt(context);
assert.ok(prompt.includes('本周天气与出游节奏'));
assert.ok(prompt.includes('本周 4 条推荐'));
assert.ok(prompt.includes('每条至少 50 个中文字符'));
assert.ok(!prompt.includes('分组推荐速览'));
assert.ok(prompt.includes('### 亲子短途'));
assert.ok(prompt.includes('### 高铁轻出省'));
assert.ok(prompt.includes('Qingyuan Gorge Rafting 2D'));
assert.ok(prompt.includes('Jinshuitai Hot Spring 2D'));
assert.ok(prompt.includes(getDefaultWebsiteUrl()));

const article = `---
title: "这周想找清凉感，广州出发可以这样玩"
summary: "雷雨和闷热一起出现的这周，更适合把真山水、亲水活动和轻松住一晚的节奏排进周末。"
author: "老广旅行"
cover: "/data/image-cache/qingyuan.webp"
---

# 这周想找清凉感，广州出发可以这样玩

## 本周天气与出游节奏

未来7天广州大致在25-34°C之间，周末有阵雨，真山水、漂流和住下来慢慢放松的路线会更吃香。想避开闷热硬扛的感觉，这周更适合挑车程不算太折腾、到了就能进山进水的线路。

## Qingyuan Gorge Rafting 2D

这条线的好处是清凉感来得很直接，到了峡谷和漂流段就能把广州城里的闷热切开。周末只请很少时间也能走，带娃家庭、想放空的上班族，或者想找点玩水动感的朋友都会比较容易有满足感。要是你这周只想用最短时间换回一点清爽，它会很容易成为先出发的那条。

## Hezhou West Creek 3D (Yuequanju + 4 Meals)

这条更像是把山水和慢节奏一起打包，适合想认真离开城市两三天的人。西溪一带的溪谷、树荫和地方风味都比较有夏天出走的气质，天气闷的时候去这种有水有林的地方，体感会比纯城市逛吃舒服很多。要是你更想把节奏放慢一点，这种住下来慢慢走的线路会比赶景点更讨喜。

## Hunan High-Speed Rail 4D

如果这周想把半径拉远一点，高铁线的轻松感会比自驾硬撑来得友好。四天节奏能把山景、换个城市住两晚的松弛感和出行效率一起兼顾，比较适合情侣、朋友结伴，或者想趁这周顺手换个空气的人。对不想把时间都耗在赶路上的人来说，它的节奏会更省心。
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
    `![Qingyuan Gorge Rafting 2D 报名二维码](https://quickchart.io/qr?format=png&ecLevel=M&margin=2&size=320&text=${encodeURIComponent(buildTourDetailUrl(tours[0], getDefaultWebsiteUrl()))})`,
  ),
);
assert.ok(enriched.includes(`[查看行程](${buildTourDetailUrl(tours[0], getDefaultWebsiteUrl())})`));
assert.ok(
  enriched.includes(
    '![Hezhou West Creek 3D (Yuequanju + 4 Meals)](https://nuctori.github.io/EverywhereWeGoGz/data/image-cache/hezhou.webp)',
  ),
);
assert.ok(
  enriched.includes(
    `![Hezhou West Creek 3D (Yuequanju + 4 Meals) 报名二维码](https://quickchart.io/qr?format=png&ecLevel=M&margin=2&size=320&text=${encodeURIComponent(buildTourDetailUrl(tours[2], getDefaultWebsiteUrl()))})`,
  ),
);
assert.ok(
  enriched.includes(
    '![Hunan High-Speed Rail 4D](https://nuctori.github.io/EverywhereWeGoGz/data/image-cache/hunan.webp)',
  ),
);
assert.ok(
  enriched.includes(
    `![Hunan High-Speed Rail 4D 报名二维码](https://quickchart.io/qr?format=png&ecLevel=M&margin=2&size=320&text=${encodeURIComponent(buildTourDetailUrl(tours[3], getDefaultWebsiteUrl()))})`,
  ),
);
assert.ok(
  enriched.includes(
    `地址：${buildTourDetailUrl(tours[0], getDefaultWebsiteUrl())}`,
  ),
);
assert.ok(
  enriched.includes(
    `地址：${buildTourDetailUrl(tours[2], getDefaultWebsiteUrl())}`,
  ),
);
assert.ok(
  enriched.includes(
    `地址：${buildTourDetailUrl(tours[3], getDefaultWebsiteUrl())}`,
  ),
);
assert.ok(
  enriched.indexOf('![Qingyuan Gorge Rafting 2D](https://nuctori.github.io/EverywhereWeGoGz/data/image-cache/qingyuan.webp)') <
    enriched.indexOf(`[查看行程](${buildTourDetailUrl(tours[0], getDefaultWebsiteUrl())})`),
);
assert.ok(
  enriched.indexOf(`[查看行程](${buildTourDetailUrl(tours[0], getDefaultWebsiteUrl())})`) <
    enriched.indexOf(`地址：${buildTourDetailUrl(tours[0], getDefaultWebsiteUrl())}`),
);
assert.ok(
  enriched.indexOf(`地址：${buildTourDetailUrl(tours[0], getDefaultWebsiteUrl())}`) <
    enriched.indexOf(
      `![Qingyuan Gorge Rafting 2D 报名二维码](https://quickchart.io/qr?format=png&ecLevel=M&margin=2&size=320&text=${encodeURIComponent(buildTourDetailUrl(tours[0], getDefaultWebsiteUrl()))})`,
    ),
);

const articleWithLooseTitles = `---
title: "这周想找清凉感，广州出发可以这样玩"
summary: "雷雨和闷热一起出现的这周，更适合把真山水、亲水活动和轻松住一晚的节奏排进周末。"
author: "老广旅行"
cover: "/data/image-cache/qingyuan.webp"
---

# 这周想找清凉感，广州出发可以这样玩

## 本周天气与出游节奏

未来7天广州大致在25-34°C之间，周末有阵雨，真山水、漂流和住下来慢慢放松的路线会更吃香。想避开闷热硬扛的感觉，这周更适合挑车程不算太折腾、到了就能进山进水的线路。

## 1. Qingyuan Gorge Rafting 2D - Family Weekend

这条线的好处是清凉感来得很直接，到了峡谷和漂流段就能把广州城里的闷热切开。周末只请很少时间也能走，带娃家庭、想放空的上班族，或者想找点玩水动感的朋友都会比较容易有满足感。要是你这周只想用最短时间换回一点清爽，它会很容易成为先出发的那条。

## 2. Hezhou West Creek 3D - Yuequanju 4 Meals Cool Escape

这条更像是把山水和慢节奏一起打包，适合想认真离开城市两三天的人。西溪一带的溪谷、树荫和地方风味都比较有夏天出走的气质，天气闷的时候去这种有水有林的地方，体感会比纯城市逛吃舒服很多。想把周末过得更松一点的人，会更容易喜欢这种不急着赶景点的节奏。

## 3. Hunan High-Speed Rail 4D - Light Out-of-Province Trip

如果这周想把半径拉远一点，高铁线的轻松感会比自驾硬撑来得友好。四天节奏能把山景、换个城市住两晚的松弛感和出行效率一起兼顾，比较适合情侣、朋友结伴，或者想趁这周顺手换个空气的人。对想省下赶路体力的人来说，这类线路的舒服感会来得更稳定。
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
assert.ok(
  enrichedLooseTitles.includes(
    `![Qingyuan Gorge Rafting 2D 报名二维码](https://quickchart.io/qr?format=png&ecLevel=M&margin=2&size=320&text=${encodeURIComponent(buildTourDetailUrl(tours[0], getDefaultWebsiteUrl()))})`,
  ),
);
assert.ok(
  enrichedLooseTitles.includes(
    `![Hezhou West Creek 3D (Yuequanju + 4 Meals) 报名二维码](https://quickchart.io/qr?format=png&ecLevel=M&margin=2&size=320&text=${encodeURIComponent(buildTourDetailUrl(tours[2], getDefaultWebsiteUrl()))})`,
  ),
);

const articleWithBoldRecommendationTitles = `---
title: "这周想找清凉感，广州出发可以这样玩"
summary: "雷雨和闷热一起出现的这周，更适合把真山水、亲水活动和轻松住一晚的节奏排进周末。"
author: "老广旅行"
cover: "/data/image-cache/qingyuan.webp"
---

# 这周想找清凉感，广州出发可以这样玩

## 本周天气与出游节奏

未来7天广州大致在25-34°C之间，周末有阵雨，真山水、漂流和住下来慢慢放松的路线会更吃香。想避开闷热硬扛的感觉，这周更适合挑车程不算太折腾、到了就能进山进水的线路。

## 本周25条推荐

### 亲子短途

**1. Qingyuan Gorge Rafting 2D**

这条线的好处是清凉感来得很直接，到了峡谷和漂流段就能把广州城里的闷热切开。周末只请很少时间也能走，带娃家庭、想放空的上班族，或者想找点玩水动感的朋友都会比较容易有满足感。

[查看行程](${buildTourDetailUrl(tours[0], getDefaultWebsiteUrl())})

**2. Hezhou West Creek 3D (Yuequanju + 4 Meals)**

这条更像是把山水和慢节奏一起打包，适合想认真离开城市两三天的人。西溪一带的溪谷、树荫和地方风味都比较有夏天出走的气质，天气闷的时候去这种有水有林的地方，体感会比纯城市逛吃舒服很多。

[查看行程](${buildTourDetailUrl(tours[2], getDefaultWebsiteUrl())})
`;

const enrichedBoldTitles = enrichWeeklyArticleMedia(articleWithBoldRecommendationTitles, context, {
  websiteUrl: getDefaultWebsiteUrl(),
});
assert.ok(
  enrichedBoldTitles.includes(
    '![Qingyuan Gorge Rafting 2D](https://nuctori.github.io/EverywhereWeGoGz/data/image-cache/qingyuan.webp)',
  ),
);
assert.ok(
  enrichedBoldTitles.includes(
    '![Hezhou West Creek 3D (Yuequanju + 4 Meals)](https://nuctori.github.io/EverywhereWeGoGz/data/image-cache/hezhou.webp)',
  ),
);
assert.ok(
  enrichedBoldTitles.includes(
    `地址：${buildTourDetailUrl(tours[0], getDefaultWebsiteUrl())}`,
  ),
);
assert.ok(
  enrichedBoldTitles.includes(
    `地址：${buildTourDetailUrl(tours[2], getDefaultWebsiteUrl())}`,
  ),
);
assert.ok(
  enrichedBoldTitles.includes(
    `![Qingyuan Gorge Rafting 2D 报名二维码](https://quickchart.io/qr?format=png&ecLevel=M&margin=2&size=320&text=${encodeURIComponent(buildTourDetailUrl(tours[0], getDefaultWebsiteUrl()))})`,
  ),
);

const articleWithMetaLeak = `---
title: "测试标题"
summary: "测试摘要"
author: "老广旅行"
cover: "/data/image-cache/qingyuan.webp"
---

# 测试标题

## 本周天气与出游节奏

未来7天广州闷热带阵雨，真山水和玩水线会更舒服。

## Qingyuan Gorge Rafting 2D

当前数据里能打的清凉感主要是山水和漂流。这条线作为补充也可以看看，适合预算有限。雷雨间隙去峡谷玩水，雷雨间隙再去漂流，雷雨间隙回酒店休息。
`;

const leakedValidation = validateGeneratedArticle(articleWithMetaLeak, context);
assert.equal(leakedValidation.ok, false);
assert.ok(leakedValidation.issues.some((issue) => issue.includes('当前数据里')));
assert.ok(leakedValidation.issues.some((issue) => issue.includes('作为补充')));
assert.ok(leakedValidation.issues.some((issue) => issue.includes('适合预算有限')));
assert.ok(leakedValidation.issues.some((issue) => issue.includes('雷雨间隙')));

const articleWithDuplicateRoute = `---
title: "测试标题"
summary: "测试摘要"
author: "老广旅行"
cover: "/data/image-cache/qingyuan.webp"
---

# 测试标题

## 本周天气与出游节奏

未来7天广州闷热带阵雨，真山水和玩水线会更舒服。

## Qingyuan Gorge Rafting 2D

这条线很适合这周出发，峡谷漂流降温直接，玩完一身清爽。带娃和朋友结伴都很容易玩得开心，周末只请很少时间也能成行。最舒服的时刻是进入漂流河道后，山风和水雾一起扑过来。

[查看行程](https://example.com/qingyuan)

## Qingyuan Gorge Rafting 2D 再写一遍

同第2条，但侧重亲子。这条线依旧很适合家庭，孩子会喜欢玩水。班期和价格也差不多。

[查看行程](https://example.com/qingyuan)
`;

const duplicateValidation = validateGeneratedArticle(articleWithDuplicateRoute, context);
assert.equal(duplicateValidation.ok, false);
assert.ok(duplicateValidation.issues.some((issue) => issue.includes('same route detail URL')));
assert.ok(duplicateValidation.issues.some((issue) => issue.includes('同第')));

const articleWithOverusedAudienceTemplate = `---
title: "测试标题"
summary: "测试摘要"
author: "老广旅行"
cover: "/data/image-cache/qingyuan.webp"
---

# 测试标题

## 本周天气与出游节奏

未来7天广州闷热带阵雨，真山水和玩水线会更舒服。

## Qingyuan Gorge Rafting 2D

这条线适合家庭，适合情侣，适合朋友，适合周末想换空气的人。峡谷漂流降温直接，玩完一身清爽，周末只请很少时间也能成行。最舒服的时刻是进入漂流河道后，山风和水雾一起扑过来。

## Hezhou West Creek 3D (Yuequanju + 4 Meals)

这条线适合家庭，适合情侣，适合朋友，适合想认真离开城市两三天的人。西溪一带的溪谷、树荫和地方风味都比较有夏天出走的气质，天气闷的时候去这种有水有林的地方，体感会比纯城市逛吃舒服很多。想把周末过得更松一点的人，会更容易喜欢这种不急着赶景点的节奏。

## Hunan High-Speed Rail 4D

这条线适合家庭，适合情侣，适合朋友，适合上班族请一天假接周末的人。四天节奏能把山景、换个城市住两晚的松弛感和出行效率一起兼顾，对想省下赶路体力的人来说，这类线路的舒服感会来得更稳定。要是你想在这周顺手把半径拉远一点，这类高铁线会比长途自驾更省心。
`;

const audienceTemplateValidation = validateGeneratedArticle(articleWithOverusedAudienceTemplate, context);
assert.equal(audienceTemplateValidation.ok, false);
assert.ok(audienceTemplateValidation.issues.some((issue) => issue.includes('模板句')));

const naturalCoolingFixture = {
  id: 'natural-cooling',
  title: '紫云谷溯溪漂流2天',
  destination: '广东',
  duration: 2,
  price: 599,
  departureDates: ['2026-06-26'],
  bookingUrl: 'https://example.com/ziyun',
  images: ['/data/image-cache/ziyun.webp'],
  highlights: ['紫云谷', '峡谷溯溪', '漂流'],
  tags: ['自然风光', '亲水'],
  theme: '自然风光',
  dataQuality: { availabilityConfidence: 'high' },
};

const hybridPoolFixture = {
  id: 'hybrid-pool',
  title: '从化泳池温泉2天',
  destination: '广东',
  duration: 2,
  price: 499,
  departureDates: ['2026-06-26'],
  bookingUrl: 'https://example.com/pool',
  images: ['/data/image-cache/pool.webp'],
  highlights: ['无边泳池', '泡池放松'],
  tags: ['度假', '亲水'],
  theme: '度假',
  dataQuality: { availabilityConfidence: 'high' },
};

const hotSpringOnlyFixture = {
  id: 'hot-only',
  title: '新兴温泉酒店2天',
  destination: '广东',
  duration: 2,
  price: 399,
  departureDates: ['2026-06-26'],
  bookingUrl: 'https://example.com/hot',
  images: ['/data/image-cache/hot.webp'],
  highlights: ['温泉', '酒店'],
  tags: ['度假'],
  theme: '度假',
  dataQuality: { availabilityConfidence: 'high' },
};

const naturalScore = scoreWeeklyArticleTour(naturalCoolingFixture, '2026-06-25', ['2026-06-26']);
const hybridScore = scoreWeeklyArticleTour(hybridPoolFixture, '2026-06-25', ['2026-06-26']);
const hotOnlyScore = scoreWeeklyArticleTour(hotSpringOnlyFixture, '2026-06-25', ['2026-06-26']);

assert.equal(naturalScore.meta.hasNaturalCoolingSignals, true);
assert.ok(naturalScore.meta.naturalCoolingHits >= 3);
assert.equal(hybridScore.meta.hasWaterPlaySignals, true);
assert.equal(hybridScore.meta.hasHotSpringSignals, true);
assert.equal(hotOnlyScore.meta.hasHotSpringOnlySignals, true);
assert.equal(hotOnlyScore.meta.hasWaterPlaySignals, false);
assert.ok(naturalScore.score > hybridScore.score);
assert.ok(hybridScore.score > hotOnlyScore.score);

console.log('weekly wechat article tests passed');
