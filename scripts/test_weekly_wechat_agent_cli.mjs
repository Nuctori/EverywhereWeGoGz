import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { generateWeeklyArticleWithAgentCli } from './lib/weekly_wechat_agent_cli.mjs';

const rootDir = process.cwd();
const outDir = path.join(rootDir, 'weekly-wechat-posts', '2099-02-02-agent-test');
fs.rmSync(outDir, { recursive: true, force: true });

let writerCalls = 0;

const fakeExecRunner = async ({ prompt, outputPath }) => {
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

## 本周25条分组推荐速览

### 亲子短途
- 亲子线1

## Qingyuan Gorge Rafting 2D

![Qingyuan Gorge Rafting 2D](https://nuctori.github.io/EverywhereWeGoGz/data/image-cache/qingyuan.webp)

[查看行程](https://example.com/qingyuan)

## Hezhou West Creek 3D (Yuequanju + 4 Meals)

![Hezhou West Creek 3D (Yuequanju + 4 Meals)](https://nuctori.github.io/EverywhereWeGoGz/data/image-cache/hezhou.webp)

[查看行程](https://example.com/hezhou)

## Hunan High-Speed Rail 4D

![Hunan High-Speed Rail 4D](https://nuctori.github.io/EverywhereWeGoGz/data/image-cache/hunan.webp)

[查看行程](https://example.com/hunan)
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

## 本周25条分组推荐速览

### 亲子短途
- 亲子线1

## Qingyuan Gorge Rafting 2D

![Qingyuan Gorge Rafting 2D](https://nuctori.github.io/EverywhereWeGoGz/data/image-cache/qingyuan.webp)

[查看行程](https://example.com/qingyuan)

## Hezhou West Creek 3D (Yuequanju + 4 Meals)

![Hezhou West Creek 3D (Yuequanju + 4 Meals)](https://nuctori.github.io/EverywhereWeGoGz/data/image-cache/hezhou.webp)

[查看行程](https://example.com/hezhou)

## Hunan High-Speed Rail 4D

![Hunan High-Speed Rail 4D](https://nuctori.github.io/EverywhereWeGoGz/data/image-cache/hunan.webp)

[查看行程](https://example.com/hunan)
`, 'utf8');
    return;
  }

  fs.writeFileSync(outputPath, `---
title: "终审版：这周更值得发的旅行团清单"
summary: "把清凉、亲子、近场和高铁轻出省放在同一篇里。"
author: "老广旅行"
cover: "/data/image-cache/qingyuan.webp"
---

# 终审版：这周更值得发的旅行团清单

## 本周天气与出游节奏

未来7天广州闷热带阵雨，近场和带池休闲线更舒服。

## 本周25条分组推荐速览

### 亲子短途
- 亲子线1

## Qingyuan Gorge Rafting 2D

![Qingyuan Gorge Rafting 2D](https://nuctori.github.io/EverywhereWeGoGz/data/image-cache/qingyuan.webp)

[查看行程](https://example.com/qingyuan)

## Hezhou West Creek 3D (Yuequanju + 4 Meals)

![Hezhou West Creek 3D (Yuequanju + 4 Meals)](https://nuctori.github.io/EverywhereWeGoGz/data/image-cache/hezhou.webp)

[查看行程](https://example.com/hezhou)

## Hunan High-Speed Rail 4D

![Hunan High-Speed Rail 4D](https://nuctori.github.io/EverywhereWeGoGz/data/image-cache/hunan.webp)

[查看行程](https://example.com/hunan)
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
assert.ok(result.validation.ok);
assert.ok(fs.existsSync(path.join(outDir, 'agent-research.json')));
assert.ok(fs.existsSync(path.join(outDir, 'candidate-1.md')));
assert.ok(fs.existsSync(path.join(outDir, 'candidate-2.md')));
assert.ok(fs.existsSync(path.join(outDir, 'article.raw.md')));
assert.ok(result.article.includes('本周天气与出游节奏'));

console.log('weekly wechat agent cli tests passed');
