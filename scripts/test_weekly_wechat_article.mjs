import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  buildWeeklyArticleContext,
  buildWeeklyArticlePrompt,
  generateWeeklyArticle,
  getDefaultAuthor,
  ensureWeeklyArticleQrAssets,
  renderWeeklyArticle,
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
assert.equal(context.season, '夏季');
assert.ok(new Set(context.selectedTours.map((tour) => tour.bucket)).size >= 1);
assert.ok(context.selectedTours.every((tour) => tour.siteUrl.includes('source=wechat')));
assert.ok(context.selectionDiagnostics.eligibleTours >= context.selectedTours.length);

const balancedTours = [
  {
    id: 'hotel-a',
    title: '金水台温泉2天（带池）',
    source: '测试源',
    destination: '广东',
    duration: 2,
    price: 299,
    priceUnit: '元/人',
    departureDates: ['2026-06-26', '2026-06-27', '2026-06-28'],
    transportType: '大巴',
    accommodationLevel: '舒适型',
    highlights: ['精品住宿', '泳池'],
    tags: ['温泉', '带池'],
    suitableFor: ['亲子', '情侣'],
    images: ['/data/image-cache/hotel-a.webp'],
    bookingUrl: 'https://example.com/hotel-a',
    theme: '酒店度假',
    dataQuality: { availabilityConfidence: 'high' },
  },
  {
    id: 'hotel-b',
    title: '金水台温泉3天(食4餐）',
    source: '测试源',
    destination: '广东',
    duration: 3,
    price: 499,
    priceUnit: '元/人',
    departureDates: ['2026-06-26', '2026-06-27'],
    transportType: '大巴',
    accommodationLevel: '舒适型',
    highlights: ['精品住宿', '温泉'],
    tags: ['温泉', '含餐'],
    suitableFor: ['亲子', '情侣'],
    images: ['/data/image-cache/hotel-b.webp'],
    bookingUrl: 'https://example.com/hotel-b',
    theme: '酒店度假',
    dataQuality: { availabilityConfidence: 'high' },
  },
  {
    id: 'hotel-c',
    title: '金水台温泉3天带池（食3餐）',
    source: '测试源',
    destination: '广东',
    duration: 3,
    price: 479,
    priceUnit: '元/人',
    departureDates: ['2026-06-27'],
    transportType: '大巴',
    accommodationLevel: '舒适型',
    highlights: ['精品住宿', '温泉'],
    tags: ['温泉', '带池'],
    suitableFor: ['亲子', '情侣'],
    images: ['/data/image-cache/hotel-c.webp'],
    bookingUrl: 'https://example.com/hotel-c',
    theme: '酒店度假',
    dataQuality: { availabilityConfidence: 'high' },
  },
  {
    id: 'mountain-a',
    title: '紫云谷山水溯溪2天',
    source: '测试源',
    destination: '广东',
    duration: 2,
    price: 399,
    priceUnit: '元/人',
    departureDates: ['2026-06-27', '2026-06-28'],
    transportType: '大巴',
    accommodationLevel: '舒适型',
    highlights: ['山水', '溯溪'],
    tags: ['避暑', '森林'],
    suitableFor: ['朋友', '情侣'],
    images: ['/data/image-cache/mountain-a.webp'],
    bookingUrl: 'https://example.com/mountain-a',
    theme: '自然风光',
    isHot: true,
    dataQuality: { availabilityConfidence: 'high' },
  },
  {
    id: 'sea-a',
    title: '东山岛海边玩水4天',
    source: '测试源',
    destination: '福建',
    duration: 4,
    price: 1099,
    priceUnit: '元/人',
    departureDates: ['2026-06-26', '2026-06-27'],
    transportType: '动车',
    accommodationLevel: '舒适型',
    highlights: ['海边', '沙滩'],
    tags: ['海风', '玩水'],
    suitableFor: ['情侣', '朋友'],
    images: ['/data/image-cache/sea-a.webp'],
    bookingUrl: 'https://example.com/sea-a',
    theme: '海岛度假',
    isHot: true,
    dataQuality: { availabilityConfidence: 'high' },
  },
  {
    id: 'food-a',
    title: '中山江门美食2天(含餐)',
    source: '测试源',
    destination: '广东',
    duration: 2,
    price: 399,
    priceUnit: '元/人',
    departureDates: ['2026-06-25', '2026-06-30'],
    transportType: '大巴',
    accommodationLevel: '舒适型',
    highlights: ['美食', '早茶'],
    tags: ['乳鸽', '陈皮'],
    suitableFor: ['朋友', '长辈'],
    images: ['/data/image-cache/food-a.webp'],
    bookingUrl: 'https://example.com/food-a',
    theme: '美食',
    dataQuality: { availabilityConfidence: 'high' },
  },
  {
    id: 'family-a',
    title: '长隆水上乐园2天',
    source: '测试源',
    destination: '广东',
    duration: 2,
    price: 699,
    priceUnit: '元/人',
    departureDates: ['2026-06-26', '2026-06-27'],
    transportType: '大巴',
    accommodationLevel: '舒适型',
    highlights: ['乐园', '玩水'],
    tags: ['亲子', '暑假'],
    suitableFor: ['亲子'],
    images: ['/data/image-cache/family-a.webp'],
    bookingUrl: 'https://example.com/family-a',
    theme: '亲子',
    isHot: true,
    dataQuality: { availabilityConfidence: 'high' },
  },
  {
    id: 'long-a',
    title: '云南香格里拉高铁6天',
    source: '测试源',
    destination: '云南',
    duration: 6,
    price: 2099,
    priceUnit: '元/人',
    departureDates: ['2026-06-29'],
    transportType: '高铁',
    accommodationLevel: '舒适型',
    highlights: ['高原', '风景'],
    tags: ['秘境', '长线'],
    suitableFor: ['朋友', '情侣'],
    images: ['/data/image-cache/long-a.webp'],
    bookingUrl: 'https://example.com/long-a',
    theme: '自然风光',
    dataQuality: { availabilityConfidence: 'high' },
  },
];

const balancedContext = buildWeeklyArticleContext(balancedTours, {
  runDate: '2026-06-24',
  windowDays: 14,
  maxCandidates: 10,
  maxArticleItems: 5,
});

assert.ok(new Set(balancedContext.candidateTours.map((tour) => tour.editorialScore)).size > 1);
assert.ok(new Set(balancedContext.selectedTours.map((tour) => tour.bucket)).size >= 4);
assert.ok(balancedContext.selectedTours.some((tour) => tour.bucket === '酒店泡池'));
assert.ok(balancedContext.selectedTours.some((tour) => tour.bucket === '山水亲水'));
assert.ok(balancedContext.selectedTours.some((tour) => tour.bucket === '海边海岛'));
const routeFamilyCounts = balancedContext.selectedTours.reduce((result, tour) => {
  result[tour.routeFamily] = (result[tour.routeFamily] || 0) + 1;
  return result;
}, {});
assert.ok(Math.max(...Object.values(routeFamilyCounts)) <= 1);

const prompt = buildWeeklyArticlePrompt(context);
assert.ok(prompt.includes('"weatherLead"'));
assert.ok(prompt.includes('清远峡谷漂流2天'));
assert.ok(prompt.includes('tour-summer-nearby'));
assert.ok(prompt.includes('二维码文件'));
assert.ok(prompt.includes('线路家族'));
assert.ok(prompt.includes('体验关键词'));

const qrOutDir = path.join(process.cwd(), 'tmp', 'weekly-wechat-article-qr-test');
fs.mkdirSync(qrOutDir, { recursive: true });
await ensureWeeklyArticleQrAssets(qrOutDir, context.selectedTours);
assert.ok(fs.existsSync(path.join(qrOutDir, 'qr', 'tour-summer-nearby.png')));

const article = renderWeeklyArticle(context, {
  title: '本周适合出发的两条线路',
  summary: '按近期班期整理的短线与避暑线。',
  intro: '这一周更适合挑有清凉体感、路上不折腾的短线来走。',
  weatherLead: '华南夏季常见闷热和阵雨，瀑布、山水、森林一类线路会比纯城市逛吃更舒服。',
  groupIntros: [
    {
      bucket: '山水亲水',
      intro: '这一组看的是能把人一下子从闷热里拎出来的水声和树荫，适合想把周末真的过清爽一点的人。',
    },
  ],
  items: [
    {
      id: 'tour-summer-nearby',
      recommendationTitle: '清远峡谷漂流2天',
      reason: '这条线路更适合夏天想找清凉感的人，峡谷、漂流和近场车程放在一起，周末出发不累，现场的水声和树荫也能把体感明显压下来。',
      reminder: '班期近，适合周末轻装出发，遇雨天也记得带一件轻便替换衣物。',
    },
    {
      id: 'tour-guizhou',
      recommendationTitle: '贵州山水避暑4天',
      reason: '如果这周想认真避暑，贵州这条山水线比单纯住酒店更有出门的意义，风景密度高，节奏也不会被压得太满，适合想把小长假用得更值的人。',
      reminder: '4天行程更适合留一点机动时间，班期和集合信息以供应商页面为准。',
    },
  ],
});

const validation = validateGeneratedArticle(article, context);
assert.equal(validation.ok, true);
assert.ok(article.includes(`author: "${getDefaultAuthor()}"`));
assert.ok(article.includes('## 本周推荐'));
assert.ok(article.includes('### 山水亲水'));
assert.ok(article.includes('#### 1. 清远峡谷漂流2天'));
assert.ok(article.includes('这一组看的是能把人一下子从闷热里拎出来的水声和树荫'));
assert.ok(article.includes('![清远峡谷漂流2天 报名二维码](qr/tour-summer-nearby.png)'));
assert.ok(article.includes('想持续看这类线路整理，点开公众号主页关注“老广去边度”。'));
assert.ok((article.match(/^---$/gm) || []).length >= context.selectedTours.length + 2);

const groupedArticle = renderWeeklyArticle(balancedContext, {
  title: '本周适合出发的五条线路',
  summary: '按玩法分组整理的样例文章。',
  intro: '这周更适合先按玩法挑方向，再看哪条线的班期和节奏最顺手。',
  weatherLead: '闷热和阵雨反复出现时，山水、海风、亲子玩水和住下来慢慢玩的线路更容易把体感拉回来。',
  groupIntros: [
    { bucket: '山水亲水', intro: '这组把山里和水边的清凉感都拉满了，适合现在就想往自然里躲一躲的人。' },
    { bucket: '海边海岛', intro: '海风和开阔感是这组的主角，适合想把周末过得更松一点的人。' },
  ],
  items: balancedContext.selectedTours.map((tour) => ({
    id: tour.id,
    recommendationTitle: tour.title,
    reason: defaultReasonText(tour),
    reminder: '班期与集合信息以供应商页面实时展示为准。',
  })),
});
assert.ok(groupedArticle.includes('### 山水亲水'));
assert.ok(groupedArticle.includes('### 海边海岛'));
assert.ok(groupedArticle.includes('### 住下来慢慢玩') || groupedArticle.includes('### 亲子玩乐'));

let capturedRequest = null;
globalThis.fetch = async (url, init) => {
  capturedRequest = { url: String(url), init };
  return new Response(JSON.stringify({
    choices: [
      {
        message: {
          content: JSON.stringify({
            title: '本周适合出发的两条线路',
            summary: '按近期班期整理的短线与避暑线。',
            intro: '这一周更适合挑有清凉体感、路上不折腾的短线来走。',
            weatherLead: '华南夏季常见闷热和阵雨，瀑布、山水、森林一类线路会比纯城市逛吃更舒服。',
            items: [
              {
                id: 'tour-summer-nearby',
                recommendationTitle: '清远峡谷漂流2天',
                reason: '这条线路更适合夏天想找清凉感的人，峡谷、漂流和近场车程放在一起，周末出发不累，现场的水声和树荫也能把体感明显压下来。',
                reminder: '班期近，适合周末轻装出发，遇雨天也记得带一件轻便替换衣物。',
              },
              {
                id: 'tour-guizhou',
                recommendationTitle: '贵州山水避暑4天',
                reason: '如果这周想认真避暑，贵州这条山水线比单纯住酒店更有出门的意义，风景密度高，节奏也不会被压得太满，适合想把小长假用得更值的人。',
                reminder: '4天行程更适合留一点机动时间，班期和集合信息以供应商页面为准。',
              },
            ],
          }),
        },
      },
    ],
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

const generated = await generateWeeklyArticle(context, {
  apiKey: 'test-key',
  baseUrl: 'https://api.deepseek.com/v1',
  model: 'deepseek-chat',
}, {
  outputDir: qrOutDir,
  maxTokens: 4096,
});

assert.ok(capturedRequest);
const requestBody = JSON.parse(capturedRequest.init.body);
assert.equal(requestBody.response_format.type, 'json_object');
assert.equal(requestBody.max_tokens, 4096);
assert.ok(generated.article.includes('报名二维码'));

console.log('weekly wechat article tests passed');

function defaultReasonText(tour) {
  return `${tour.title}这条线放在这周看，胜在玩法本身就能把闷热感往下压。它不只是去一个地方打卡，而是把${(tour.experienceSignals || []).join('、') || '当季舒适体感'}放进了行程节奏里，对想认真放松、又不想空跑一趟的人来说，会比纯赶景点更值得现在出发。`;
}
