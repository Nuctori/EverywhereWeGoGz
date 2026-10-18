import { strict as assert } from 'node:assert';
import fs from 'node:fs';

const appSource = fs.readFileSync('src/App.tsx', 'utf8');
const tourListSource = fs.readFileSync('src/sections/TourList.tsx', 'utf8');
const aiPanelSource = fs.readFileSync('src/sections/AiRecommendPanel.tsx', 'utf8');

const aiSearchBody = appSource.match(/const handleAiSearch = \(nextQuery\?: string\) => \{([\s\S]*?)\n  \};/)?.[1] || '';
assert.ok(aiSearchBody.includes('setAiSearchRequest'), 'AI search should still dispatch an AI request');
assert.ok(
  aiSearchBody.includes('setSubmittedSearchQuery(prompt)') && aiSearchBody.includes('searchQuery: prompt'),
  'AI search should sync the prompt into the search query so the relevance-ranked long tail below the pinned recommendations has context',
);
assert.ok(
  aiSearchBody.includes("scrollIntoView({ behavior: 'smooth' })"),
  'AI search click should smooth-scroll the result list into view',
);

assert.match(
  tourListSource,
  /const isAiSearchMode = Boolean\(aiRecommendationResult\);/,
  'pending AI requests must not switch TourList into AI mode before results exist',
);
assert.match(
  tourListSource,
  /if \(isAiSearchMode && isAiRecommendedTour\) \{\s*return true;/,
  'AI mode should pin AI-selected tours at the top of the list',
);
assert.doesNotMatch(
  tourListSource,
  /if \(isAiSearchMode && !isAiRecommendedTour\) \{/,
  'AI mode must keep the relevance-ranked long tail below the pinned segment instead of truncating the list to 15 items',
);

assert.ok(
  aiPanelSource.includes('waitForNextPaint') &&
    aiPanelSource.includes('await waitForNextPaint()') &&
    aiPanelSource.indexOf('await waitForNextPaint()') < aiPanelSource.indexOf('requestAiRecommendations({'),
  'AI recommendation work should start after the loading UI has had a chance to paint',
);
assert.ok(
  aiPanelSource.includes('scheduleIdleWork') && aiPanelSource.includes('saveStoredAiChatState'),
  'AI chat storage writes should be scheduled away from the click handler path',
);

// 相关性排序必须在排序前算一次：塞进比较器会为每条线路重复计算 O(n log n) 次。
// 6483 条实测 28ms → 143ms，正好压在点搜索那一帧上（用户反馈"点搜索卡几秒"）。
assert.doesNotMatch(
  tourListSource,
  /result\.sort\(\s*\(a, b\) =>\s*getTourSearchRelevance\(/,
  'relevance sort must precompute scores instead of calling getTourSearchRelevance inside the comparator',
);
assert.match(
  tourListSource,
  /relevanceByTour/,
  'relevance sort should keep a precomputed score map keyed by tour',
);

// 进行中进度要跨标签页可见：写入 storage、监听 storage 事件、结束后撤下。
assert.ok(
  aiPanelSource.includes('saveStoredAiProgress') && aiPanelSource.includes('subscribeStoredAiProgress'),
  'AI progress must be persisted and subscribed so another tab can see an in-flight run',
);
assert.ok(
  /finally \{[\s\S]{0,400}clearStoredAiProgress\(\)/.test(aiPanelSource),
  'every request exit (success/fallback/superseded) must withdraw the in-flight progress marker',
);

console.info('AI interaction performance audit passed');
