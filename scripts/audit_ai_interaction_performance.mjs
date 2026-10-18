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

// 空闲预热的节奏必须让它"在用户点击之前跑完"：每片实测约 10ms、约 65 片，
// 间隔 700ms 时总时长 ~46s，而截止只有 20s，预热永远只能覆盖 45%，
// 剩下的条目就会在点击那一帧冷算（约 350ms）—— 用户反馈的"点 AI 帮我挑卡很久"。
{
  const gapMatch = aiPanelSource.match(/const WARM_PIECE_GAP_MS = (\d[\d_]*);/);
  const deadlineMatch = aiPanelSource.match(/const WARM_DEADLINE_MS = (\d[\d_]*);/);
  assert.ok(gapMatch, 'warmup piece gap must stay a named constant');
  assert.ok(deadlineMatch, 'warmup deadline must stay a named constant');
  const gap = Number(gapMatch[1].replace(/_/g, ''));
  const deadline = Number(deadlineMatch[1].replace(/_/g, ''));
  // 按实测 65 片、每片约 10ms 推算完成全部预热所需时间。
  const PIECES = 65;
  const PIECE_MS = 10;
  const fullWarmMs = PIECES * (PIECE_MS + gap);
  assert.ok(
    fullWarmMs < deadline,
    `warmup must finish all pieces before the deadline: ${fullWarmMs}ms >= ${deadline}ms ` +
      '(a deadline shorter than the full schedule leaves items cold at click time)',
  );
  assert.ok(
    fullWarmMs < 10_000,
    `warmup must finish well within a user's time-to-click: ${fullWarmMs}ms`,
  );
  // 单片必须留在一帧预算内，否则预热本身就会卡界面。
  assert.ok(PIECE_MS < 50, 'a warmup piece must stay under a frame budget');
}

// 用户点得比预热快时，点击路径要自己把池子补热，而不是让请求内部零散地冷算。
assert.match(
  aiPanelSource,
  /if \(!isAiRecommendationPoolWarm\(tours\)\) \{/,
  'the click path must top up a not-yet-warm pool before starting the request',
);

console.info('AI interaction performance audit passed');
