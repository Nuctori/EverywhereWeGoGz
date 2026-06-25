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

const prompt = buildWeeklyArticlePrompt(context);
assert.ok(prompt.includes('"weatherLead"'));
assert.ok(prompt.includes('清远峡谷漂流2天'));
assert.ok(prompt.includes('tour-summer-nearby'));
assert.ok(prompt.includes('二维码文件'));

const qrOutDir = path.join(process.cwd(), 'tmp', 'weekly-wechat-article-qr-test');
fs.mkdirSync(qrOutDir, { recursive: true });
await ensureWeeklyArticleQrAssets(qrOutDir, context.selectedTours);
assert.ok(fs.existsSync(path.join(qrOutDir, 'qr', 'tour-summer-nearby.png')));

const article = renderWeeklyArticle(context, {
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
});

const validation = validateGeneratedArticle(article, context);
assert.equal(validation.ok, true);
assert.ok(article.includes(`author: "${getDefaultAuthor()}"`));
assert.ok(article.includes('扫码查看详情'));
assert.ok(article.includes('qr/tour-summer-nearby.png'));

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
assert.ok(generated.article.includes('扫码查看详情'));

console.log('weekly wechat article tests passed');
