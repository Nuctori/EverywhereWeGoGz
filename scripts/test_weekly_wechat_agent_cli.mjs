import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  dedupeArticleRouteBlocks,
  ensureArticleFrontmatter,
  extractAiderReplyFromHistory,
  generateWeeklyArticleWithAgentCli,
  normalizeResearch,
  normalizeAiderModel,
  parseJsonResponse,
} from './lib/weekly_wechat_agent_cli.mjs';
import {
  buildTourDetailUrl,
  enrichWeeklyArticleMedia,
  getDefaultWebsiteUrl,
} from './lib/weekly_wechat_article.mjs';

const rootDir = process.cwd();
const outDir = path.join(rootDir, 'weekly-wechat-posts', '2099-02-02-agent-test');
fs.rmSync(outDir, { recursive: true, force: true });

let writerCalls = 0;
let repairCalls = 0;
const seenPrompts = [];

const fakeExecRunner = async ({ prompt, outputPath }) => {
  seenPrompts.push(prompt);
  if (prompt.includes('你是每周旅游选题研究员')) {
    fs.writeFileSync(outputPath, `${JSON.stringify({
      opening_weather_summary: '未来7天广州闷热带阵雨，近场和带池休闲线更舒服。',
      seasonal_observations: [
        '暑期预热已经开始，周末近场线更容易先满。',
        '山水和亲水线比纯酒店更容易种草。',
        '带池和雅泡路线可以写成放松感，不用解释词义。',
        '花期信息只做可关注提示，不写死花况。',
      ],
      recommendation_groups: [
        { label: '亲子短途', angle: '带娃不折腾', items: Array.from({ length: 5 }, (_, i) => `亲子线${i + 1}`) },
        { label: '山水清凉', angle: '找降温感', items: Array.from({ length: 5 }, (_, i) => `山水线${i + 1}`) },
        { label: '周末近场', angle: '说走就走', items: Array.from({ length: 5 }, (_, i) => `近场线${i + 1}`) },
        { label: '高铁轻出省', angle: '走远一点', items: Array.from({ length: 5 }, (_, i) => `高铁线${i + 1}`) },
        { label: '轻松度假', angle: '周末放松', items: Array.from({ length: 5 }, (_, i) => `度假线${i + 1}`) },
      ],
      featured_route_ids: ['tour-qingyuan', 'tour-hezhou', 'tour-hunan-rail'],
      editorial_risks: ['别写成做题腔', '别同质化', '别编天气'],
      duplicate_watchouts: ['温泉线不要堆太多', '同城酒店不要挤在前排'],
    }, null, 2)}\n`, 'utf8');
    return;
  }

  if (prompt.includes('候选版本 1')) {
    writerCalls += 1;
    fs.writeFileSync(outputPath, `---
title: "版本A：广州本周出游清单"
summary: "清凉、近场和轻出省都照顾到了。"
author: "老广旅行"
cover: "/data/image-cache/qingyuan.webp"
---

# 版本A：广州本周出游清单

## 本周天气与出游节奏

未来7天广州闷热带阵雨，近场和带池休闲线更舒服。

## 本周25条推荐

### 山水清凉

#### Qingyuan Gorge Rafting 2D

![Qingyuan Gorge Rafting 2D](https://nuctori.github.io/EverywhereWeGoGz/data/image-cache/qingyuan.webp)

这条线一上来就能把人从闷热里拽出来，峡谷水声、漂流和短途节奏都很适合周末出发。带娃家庭、想找一点玩水感的朋友，或者只想请很少时间换个空气的人，这周看它都会比较顺手。

[查看行程](https://nuctori.github.io/EverywhereWeGoGz/?tour=tour-qingyuan&source=wechat)

#### Hezhou West Creek 3D (Yuequanju + 4 Meals)

![Hezhou West Creek 3D (Yuequanju + 4 Meals)](https://nuctori.github.io/EverywhereWeGoGz/data/image-cache/hezhou.webp)

这条更适合想认真躲开城市热气的人，山水、树荫和住下来慢慢走的节奏会比赶景点舒服很多。要是你更想要两三天都沉在溪谷和清爽空气里，它会比纯酒店放松线更有当下出发的理由。

[查看行程](https://nuctori.github.io/EverywhereWeGoGz/?tour=tour-hezhou&source=wechat)

#### Hunan High-Speed Rail 4D

![Hunan High-Speed Rail 4D](https://nuctori.github.io/EverywhereWeGoGz/data/image-cache/hunan.webp)

[查看行程](https://nuctori.github.io/EverywhereWeGoGz/?tour=tour-hunan-rail&source=wechat)

如果这周想把范围放大一点，高铁线会比长途大巴更轻松，四天节奏也方便把山景和换城住两晚的松弛感一起收下。对情侣、朋友结伴和想趁周中请假接周末的人来说，这类线路的舒适度会更高。
`, 'utf8');
    return;
  }

  if (prompt.includes('候选版本 2')) {
    writerCalls += 1;
    fs.writeFileSync(outputPath, `---
title: "版本B：这周出发会更舒服的25条线"
summary: "更偏编辑口吻的一版。"
author: "老广旅行"
cover: "/data/image-cache/qingyuan.webp"
---

# 版本B：这周出发会更舒服的25条线

## 本周天气与出游节奏

未来7天广州闷热带阵雨，近场和带池休闲线更舒服。

## 本周25条推荐

### 山水清凉

#### Qingyuan Gorge Rafting 2D

![Qingyuan Gorge Rafting 2D](https://nuctori.github.io/EverywhereWeGoGz/data/image-cache/qingyuan.webp)

这条线最讨喜的地方是清凉感来得很直接，漂流、峡谷和两天一晚的周末节奏都没有负担。想找一条到站就能玩水、又不必把体力压得太满的路线，这周先看它很合理。

[查看行程](https://nuctori.github.io/EverywhereWeGoGz/?tour=tour-qingyuan&source=wechat)

#### Hezhou West Creek 3D (Yuequanju + 4 Meals)

![Hezhou West Creek 3D (Yuequanju + 4 Meals)](https://nuctori.github.io/EverywhereWeGoGz/data/image-cache/hezhou.webp)

这条线路的优势在于不只是看山水，而是真的能把人放进溪谷和树影里慢慢走。天气一闷，这种有水有林、还有地方风味托住节奏的线路，往往比城市逛吃或纯酒店住一晚更让人想马上出发。

[查看行程](https://nuctori.github.io/EverywhereWeGoGz/?tour=tour-hezhou&source=wechat)

#### Hunan High-Speed Rail 4D

![Hunan High-Speed Rail 4D](https://nuctori.github.io/EverywhereWeGoGz/data/image-cache/hunan.webp)

[查看行程](https://nuctori.github.io/EverywhereWeGoGz/?tour=tour-hunan-rail&source=wechat)

如果你想趁这周顺手换个空气，高铁轻出省的舒适感会很明显，出发和落地都更省心。四天的长度也刚好能让人把看山、住两晚和回程缓冲一起安排进去，不会有赶路比玩还累的感觉。
`, 'utf8');
    return;
  }

  if (prompt.includes('你是返工编辑')) {
    repairCalls += 1;
    fs.writeFileSync(outputPath, `---
title: "返工版：这周出发会更舒服的25条线"
summary: "返工后去掉了做题腔。"
author: "老广旅行"
cover: "/data/image-cache/qingyuan.webp"
---

# 返工版：这周出发会更舒服的25条线

## 本周天气与出游节奏

未来7天广州闷热带阵雨，近场和带池休闲线更舒服。

## 本周25条推荐

### 山水清凉

#### Qingyuan Gorge Rafting 2D

![Qingyuan Gorge Rafting 2D](https://nuctori.github.io/EverywhereWeGoGz/data/image-cache/qingyuan.webp)

这条线清凉感来得很直接，峡谷水声和漂流一开场就能把城市闷热感切掉。周末只请一点时间也能成行，带娃家庭和想找玩水节奏的朋友都容易喜欢。到了现场最舒服的瞬间，是山风卷着水雾一起扑过来。

[查看行程](https://nuctori.github.io/EverywhereWeGoGz/?tour=tour-qingyuan&source=wechat)

#### Hezhou West Creek 3D (Yuequanju + 4 Meals)

![Hezhou West Creek 3D (Yuequanju + 4 Meals)](https://nuctori.github.io/EverywhereWeGoGz/data/image-cache/hezhou.webp)

这条更适合想认真躲开城市热气的人，山水、树荫和住下来慢慢走的节奏会比赶景点舒服很多。要是你更想要两三天都沉在溪谷和清爽空气里，它会比纯酒店放松线更有当下出发的理由。溪谷边坐下来听水声的那一刻，会特别想把手机先放下。

[查看行程](https://nuctori.github.io/EverywhereWeGoGz/?tour=tour-hezhou&source=wechat)

#### Hunan High-Speed Rail 4D

![Hunan High-Speed Rail 4D](https://nuctori.github.io/EverywhereWeGoGz/data/image-cache/hunan.webp)

如果这周想把范围放大一点，高铁线会比长途大巴更轻松，四天节奏也方便把山景和换城住两晚的松弛感一起收下。对情侣、朋友结伴和想趁周中请假接周末的人来说，这类线路的舒适度会更高。高铁落地后的节奏也更利落，不会把体力先耗在路上。

[查看行程](https://nuctori.github.io/EverywhereWeGoGz/?tour=tour-hunan-rail&source=wechat)
`, 'utf8');
    return;
  }

  fs.writeFileSync(outputPath, `# 终审版：这周更值得发的旅行团清单

## 本周天气与出游节奏

未来7天广州闷热带阵雨，近场和带池休闲线更舒服。

## 本周25条推荐

### 山水清凉

#### Qingyuan Gorge Rafting 2D

![Qingyuan Gorge Rafting 2D](https://nuctori.github.io/EverywhereWeGoGz/data/image-cache/qingyuan.webp)

这条线一上来就有很直接的清凉反馈，峡谷玩水和周末短途的组合很容易让人愿意现在就出发。无论是带娃、朋友结伴，还是想从城市热气里暂时抽离一下，它都很有说服力。

[查看行程](https://nuctori.github.io/EverywhereWeGoGz/?tour=tour-qingyuan&source=wechat)

#### Hezhou West Creek 3D (Yuequanju + 4 Meals)

![Hezhou West Creek 3D (Yuequanju + 4 Meals)](https://nuctori.github.io/EverywhereWeGoGz/data/image-cache/hezhou.webp)

这条更像是把山水和慢节奏一起打包，适合想在这周认真离开城市两三天的人。西溪一带的溪谷、树荫和地方风味都有夏天出走的味道，闷热周里去这种地方，体感会明显比纯城市停留舒服。

[查看行程](https://nuctori.github.io/EverywhereWeGoGz/?tour=tour-hezhou&source=wechat)

#### Hunan High-Speed Rail 4D

![Hunan High-Speed Rail 4D](https://nuctori.github.io/EverywhereWeGoGz/data/image-cache/hunan.webp)

[查看行程](https://nuctori.github.io/EverywhereWeGoGz/?tour=tour-hunan-rail&source=wechat)

如果这周想把半径拉远一点，高铁线的轻松感会比自驾或长途大巴更友好。四天节奏能把山景、换城市住两晚的松弛感和出行效率一起兼顾，比较适合预算有限的人。作为补充，它也能接住想认真透口气的人。
`, 'utf8');
};

const weatherOutlook = {
  location: '广州',
  headline: '未来7天广州闷热带阵雨，近场和带池休闲线更舒服。',
  days: [],
  source: 'fixture',
};

const result = await generateWeeklyArticleWithAgentCli(rootDir, {
  runDate: '2099-02-02',
  outDir,
  maxCandidates: 10,
  maxArticleItems: 3,
  weatherOutlook,
  execRunner: fakeExecRunner,
});

assert.equal(result.context.generationMode, 'aider-deepseek-multi-pass');
assert.equal(writerCalls, 2);
assert.equal(repairCalls, 1);
assert.ok(result.validation.ok);
assert.ok(fs.existsSync(path.join(outDir, 'agent-research.json')));
assert.ok(fs.existsSync(path.join(outDir, 'candidate-1.md')));
assert.ok(fs.existsSync(path.join(outDir, 'candidate-2.md')));
assert.ok(fs.existsSync(path.join(outDir, 'article.raw.md')));
assert.ok(result.article.includes('本周天气与出游节奏'));
assert.ok(result.article.startsWith('---\n'));
assert.ok(
  result.article.includes('title: "版本A：广州本周出游清单"') ||
  result.article.includes('title: "版本B：这周出发会更舒服的25条线"') ||
  result.article.includes('title: "返工版：这周出发会更舒服的25条线"'),
);
assert.ok(!result.article.includes('当前数据里'));
assert.ok(!result.article.includes('作为补充'));
assert.ok(!result.article.includes('其中6条深度推荐'));
assert.ok(fs.existsSync(path.join(outDir, 'weekly-context.json')));
const storedContext = JSON.parse(fs.readFileSync(path.join(outDir, 'weekly-context.json'), 'utf8'));
assert.ok(Array.isArray(storedContext.aiSelectionBuckets || []));
if ((storedContext.candidateTours || []).length > 0) {
  assert.ok((storedContext.aiSelectionBuckets || []).length > 0);
}
const enrichedArticle = enrichWeeklyArticleMedia(
  ensureArticleFrontmatter(result.article, result.context, []),
  result.context,
  { websiteUrl: getDefaultWebsiteUrl() },
);
assert.ok(enrichedArticle.includes('Qingyuan Gorge Rafting 2D'));
assert.ok(enrichedArticle.includes(buildTourDetailUrl({ id: 'tour-qingyuan' }, getDefaultWebsiteUrl())));

assert.equal(normalizeAiderModel('deepseek-v4-flash'), 'deepseek/deepseek-chat');
assert.equal(normalizeAiderModel('deepseek-reasoner'), 'deepseek/deepseek-reasoner');
assert.deepEqual(parseJsonResponse('json\n{"ok":true}\n'), { ok: true });

const researchDedupeContext = {
  candidateTours: [
    { id: 'gx-a', title: '广西崇左德天瀑布3天', destination: '广西崇左' },
    { id: 'gx-b', title: '广西崇左通灵峡谷3天', destination: '广西崇左' },
    { id: 'gx-c', title: '广西崇左明仕田园4天', destination: '广西崇左' },
    { id: 'gx-d', title: '广西崇左古龙山4天', destination: '广西崇左' },
    { id: 'wz-a', title: '北海涠洲岛4天', destination: '广西北海' },
    { id: 'wz-b', title: '北海涠洲岛3天', destination: '广西北海' },
    { id: 'qy-a', title: '清远紫云谷2天', destination: '广东清远' },
    { id: 'sz-a', title: '深圳大鹏海边2天', destination: '广东深圳' },
    { id: 'xm-a', title: '厦门鼓浪屿3天', destination: '福建厦门' },
    { id: 'cs-a', title: '长沙岳阳武汉4天', destination: '湖南长沙' },
  ],
  selectedTours: [],
  aiSelectionBuckets: [],
  recommendationGroups: [],
};

const normalizedResearch = normalizeResearch(
  {
    recommendation_groups: [
      {
        group_id: 'cooling',
        group_label: '山水清凉',
        recommendations: [
          { tour_id: 'gx-a' },
          { tour_id: 'gx-b' },
          { tour_id: 'gx-c' },
          { tour_id: 'gx-d' },
          { tour_id: 'wz-a' },
          { tour_id: 'wz-b' },
          { tour_id: 'qy-a' },
          { tour_id: 'sz-a' },
          { tour_id: 'xm-a' },
          { tour_id: 'cs-a' },
        ],
      },
      {
        group_id: 'escape',
        group_label: '高铁轻出省',
        recommendations: [
          { tour_id: 'gx-a' },
          { tour_id: 'gx-b' },
          { tour_id: 'gx-c' },
          { tour_id: 'wz-a' },
          { tour_id: 'wz-b' },
          { tour_id: 'qy-a' },
        ],
      },
    ],
    featured_route_ids: ['gx-a', 'gx-b', 'gx-c', 'wz-a', 'wz-b', 'qy-a', 'sz-a'],
  },
  researchDedupeContext,
);

assert.equal(
  normalizedResearch.recommendation_groups
    .flatMap((group) => group.recommendations.map((item) => item.tour_id))
    .filter((tourId) => tourId.startsWith('gx-')).length,
  1,
);
assert.deepEqual(normalizedResearch.featured_route_ids, ['gx-a', 'wz-a', 'qy-a', 'sz-a', 'xm-a', 'cs-a']);
const normalizedIds = normalizedResearch.recommendation_groups
  .flatMap((group) => group.recommendations.map((item) => item.tour_id));
assert.equal(normalizedIds.filter((tourId) => tourId.startsWith('gx-')).length <= 1, true);
assert.ok(normalizedIds.length >= 6);
const researchPrompt = seenPrompts.find((prompt) => prompt.includes('你是每周旅游选题研究员')) || '';
assert.ok(researchPrompt.includes('内部判断标签'));
assert.ok(researchPrompt.includes('不是给读者看的'));

const fillContext = {
  candidateTours: [
    { id: 'a', title: '广东清远峡谷2天', destination: '广东清远', editorialReasons: ['可出发', '', '', '山水清凉'] },
    { id: 'b', title: '广东阳江海边2天', destination: '广东阳江', editorialReasons: ['可出发', '', '', '近海降温'] },
    { id: 'c', title: '福建厦门3天', destination: '福建厦门', editorialReasons: ['可出发', '', '', '海风舒服'] },
    { id: 'd', title: '云南香格里拉4天', destination: '云南', editorialReasons: ['可出发', '', '', '高原清凉'] },
    { id: 'e', title: '新疆北疆8天', destination: '新疆', editorialReasons: ['可出发', '', '', '长线避暑'] },
  ],
  selectedTours: [],
  aiSelectionBuckets: [],
  recommendationGroups: [],
};

const filledResearch = normalizeResearch(
  {
    recommendation_groups: [
      {
        group_id: 'seed',
        group_label: '初始推荐',
        recommendations: [{ tour_id: 'a' }, { tour_id: 'b' }],
      },
    ],
    featured_route_ids: ['a'],
  },
  fillContext,
);
const filledIds = filledResearch.recommendation_groups.flatMap((group) => group.recommendations.map((item) => item.tour_id));
assert.equal(new Set(filledIds).size, filledIds.length);
assert.ok(filledIds.length > 2);
assert.ok(filledResearch.recommendation_groups.some((group) => group.group_id === 'balanced_more'));

const dedupeContext = {
  recommendationGroups: [
    {
      id: 'test',
      label: '测试',
      tours: [
        {
          id: 'tour-a',
          title: '清远峡谷漂流2天',
          destination: '广东清远',
          price: 699,
          priceUnit: '元/人',
          departureDates: ['2026-06-26'],
          suitableFor: ['亲子'],
          articleImages: ['https://example.com/a.jpg'],
          highlights: ['峡谷漂流'],
          tags: ['玩水'],
        },
        {
          id: 'tour-b',
          title: '阳江海陵岛2天',
          destination: '广东阳江',
          price: 499,
          priceUnit: '元/人',
          departureDates: ['2026-06-27'],
          suitableFor: ['情侣'],
          articleImages: ['https://example.com/b.jpg'],
          highlights: ['海陵岛'],
          tags: ['海风'],
        },
      ],
    },
  ],
  candidateTours: [
    {
      id: 'tour-a',
      title: '清远峡谷漂流2天',
      destination: '广东清远',
      price: 699,
      priceUnit: '元/人',
      departureDates: ['2026-06-26'],
      suitableFor: ['亲子'],
      articleImages: ['https://example.com/a.jpg'],
      highlights: ['峡谷漂流'],
      tags: ['玩水'],
    },
    {
      id: 'tour-b',
      title: '阳江海陵岛2天',
      destination: '广东阳江',
      price: 499,
      priceUnit: '元/人',
      departureDates: ['2026-06-27'],
      suitableFor: ['情侣'],
      articleImages: ['https://example.com/b.jpg'],
      highlights: ['海陵岛'],
      tags: ['海风'],
    },
  ],
  fallbackCandidateTours: [
    {
      id: 'tour-a',
      title: '清远峡谷漂流2天',
      destination: '广东清远',
      price: 699,
      priceUnit: '元/人',
      departureDates: ['2026-06-26'],
      suitableFor: ['亲子'],
      articleImages: ['https://example.com/a.jpg'],
      highlights: ['峡谷漂流'],
      tags: ['玩水'],
    },
    {
      id: 'tour-b',
      title: '阳江海陵岛2天',
      destination: '广东阳江',
      price: 499,
      priceUnit: '元/人',
      departureDates: ['2026-06-27'],
      suitableFor: ['情侣'],
      articleImages: ['https://example.com/b.jpg'],
      highlights: ['海陵岛'],
      tags: ['海风'],
    },
    {
      id: 'tour-c',
      title: '贺州西溪森林3天',
      destination: '广西贺州',
      price: 899,
      priceUnit: '元/人',
      departureDates: ['2026-06-28'],
      suitableFor: ['朋友'],
      articleImages: ['https://example.com/c.jpg'],
      highlights: ['森林溪谷'],
      tags: ['避暑'],
    },
    {
      id: 'tour-d',
      title: '清远紫云谷2天',
      destination: '广东清远',
      price: 599,
      priceUnit: '元/人',
      departureDates: ['2026-06-29'],
      suitableFor: ['朋友'],
      articleImages: ['https://example.com/d.jpg'],
      highlights: ['溪谷亲水'],
      tags: ['山水'],
    },
  ],
};

const articleWithDuplicateLinks = `**清远峡谷漂流2天**

[查看行程](https://nuctori.github.io/EverywhereWeGoGz/?tour=tour-a&source=wechat)

**清远峡谷漂流2天 再写一次**

[查看行程](https://nuctori.github.io/EverywhereWeGoGz/?tour=tour-a&source=wechat)`;

const dedupedArticle = dedupeArticleRouteBlocks(articleWithDuplicateLinks, dedupeContext).article;
assert.equal((dedupedArticle.match(/tour=tour-a/g) || []).length, 1);
assert.equal((dedupedArticle.match(/tour=tour-b/g) || []).length, 1);
assert.ok(dedupedArticle.includes('**阳江海陵岛2天**'));

const articleWithRepeatedDeepSections = `### 山水清凉

**1. 清远峡谷漂流2天**

这条线路先写一遍。

[查看行程](https://nuctori.github.io/EverywhereWeGoGz/?tour=tour-a&source=wechat)

### 补充推荐（确保25条）

**23. 清远峡谷漂流2天（深度版）**

这条线路又写了一遍。

[查看行程](https://nuctori.github.io/EverywhereWeGoGz/?tour=tour-a&source=wechat)`;

const dedupedDeepSections = dedupeArticleRouteBlocks(articleWithRepeatedDeepSections, dedupeContext).article;
assert.equal((dedupedDeepSections.match(/tour=tour-a/g) || []).length, 1);
assert.equal((dedupedDeepSections.match(/tour=tour-b/g) || []).length, 1);
assert.ok(dedupedDeepSections.includes('**23. 阳江海陵岛2天**'));

const articleWithRepeatedTailBlocks = `### 周末近场

**1. 清远峡谷漂流2天**

第一条。

[查看行程](https://nuctori.github.io/EverywhereWeGoGz/?tour=tour-a&source=wechat)

**2. 阳江海陵岛2天**

第二条。

[查看行程](https://nuctori.github.io/EverywhereWeGoGz/?tour=tour-b&source=wechat)

### 补充推荐（确保25条）

**20. 清远峡谷漂流2天（周末补位）**

重复第一条。

[查看行程](https://nuctori.github.io/EverywhereWeGoGz/?tour=tour-a&source=wechat)

**21. 阳江海陵岛2天（补充）**

重复第二条。

[查看行程](https://nuctori.github.io/EverywhereWeGoGz/?tour=tour-b&source=wechat)`;

const dedupedTailBlocks = dedupeArticleRouteBlocks(articleWithRepeatedTailBlocks, dedupeContext).article;
assert.equal((dedupedTailBlocks.match(/tour=tour-a/g) || []).length, 1);
assert.equal((dedupedTailBlocks.match(/tour=tour-b/g) || []).length, 1);
assert.equal((dedupedTailBlocks.match(/tour=tour-c/g) || []).length, 1);
assert.equal((dedupedTailBlocks.match(/tour=tour-d/g) || []).length, 1);
assert.ok(dedupedTailBlocks.includes('**20. 贺州西溪森林3天**'));
assert.ok(dedupedTailBlocks.includes('**21. 清远紫云谷2天**'));

const generatedResult = await generateWeeklyArticleWithAgentCli(rootDir, {
  runDate: '2099-02-02',
  outDir: path.relative(rootDir, outDir),
  execRunner: fakeExecRunner,
  repairAttempts: 1,
});
assert.ok(/##\s*(?:1\.\s*)?本周天气与出游节奏/.test(generatedResult.article));
assert.ok(!generatedResult.article.includes('同第1条'));
assert.ok(!generatedResult.article.includes('同第2条'));
assert.ok(!generatedResult.article.includes('同第3条'));
assert.ok(generatedResult.validation.ok);

assert.equal(
  extractAiderReplyFromHistory(`Update git name\nLLM RESPONSE 2026-06-24T15:36:33\nASSISTANT\n{"ok":true}\n`),
  '{"ok":true}',
);
assert.equal(
  extractAiderReplyFromHistory(`LLM RESPONSE 2026-06-24T15:36:33
ASSISTANT article.md
ASSISTANT \`\`\`markdown
ASSISTANT <<<<<<< SEARCH
ASSISTANT =======
ASSISTANT ---
ASSISTANT title: "示例标题"
ASSISTANT summary: "示例摘要"
ASSISTANT cover: "https://example.com/cover.jpg"
ASSISTANT ---
ASSISTANT # 正文
ASSISTANT >>>>>>> REPLACE
ASSISTANT \`\`\`
`),
  `---
title: "示例标题"
summary: "示例摘要"
cover: "https://example.com/cover.jpg"
---
# 正文`,
);

console.log('weekly wechat agent cli tests passed');
