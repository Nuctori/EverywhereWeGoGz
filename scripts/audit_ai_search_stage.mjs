import { strict as assert } from 'node:assert';
import fs from 'node:fs';

const tourListSource = fs.readFileSync('src/sections/TourList.tsx', 'utf8');
const aiPanelSource = fs.readFileSync('src/sections/AiRecommendPanel.tsx', 'utf8');

// AI 搜索阶段（请求已发出、首条结果未落地）不能把列表清空：
// 这一阶段必须识别出来，并且沿用清空搜索前的搜索词/过滤条件。
assert.match(
  tourListSource,
  /const isAiSearching = Boolean\(aiSearchRequest && !aiRecommendationResult\);/,
  'TourList must distinguish the AI-searching stage from the AI-result stage',
);
assert.ok(
  tourListSource.includes("const queryForRanking = isAiSearching ? '' : normalizedSearchQuery;"),
  'while AI is searching, the list must ignore the submitted query instead of narrowing to zero results',
);
assert.ok(
  tourListSource.includes('const activeDisplayFilters = isAiSearching ? searchStageFilters : effectiveFilters;'),
  'while AI is searching, the list must fall back to pre-search filters instead of the ones derived from the query',
);
assert.ok(
  tourListSource.includes("aiRecommendationResult ? 'ai' : isAiSearching ? 'ai-searching' : 'plain',"),
  'the visible-count reset key must change when AI search starts and when it lands, not only once a result exists',
);
assert.ok(
  tourListSource.includes('searchingVersion={aiSearchRequest?.id ?? 0}'),
  'TourList must tell the AI panel which search round is in flight',
);

// 面板：搜索阶段给占位卡（带取消），并入参变化时清掉上一轮进度。
assert.ok(
  aiPanelSource.includes('export const AI_PENDING_CARD_ID'),
  'panel should export the pending-card id used during the search stage',
);
assert.ok(
  aiPanelSource.includes('if (!hasAiActivity && !searching)') && aiPanelSource.includes('if (!hasAiActivity) {'),
  'panel must render a lightweight pending card during the search stage instead of returning null',
);
assert.ok(
  aiPanelSource.includes('取消这次查找'),
  'the pending card must offer a cancel action so a mis-typed prompt can be abandoned',
);
assert.match(
  aiPanelSource,
  /useEffect\(\(\) => \{\s*if \(searchingVersion === 0\) return;/,
  'each new AI search round must reset stale progress/conversation state',
);
assert.doesNotMatch(
  aiPanelSource,
  /onResultChange\(null\);\s*\n\s*setProgressState\(null\);\s*\n\s*setExpandedStage\(null\);\s*\n\s*setDetailsOpen\(false\);\s*\n\s*setFollowUpInput\(''\);\s*\n\s*void submitPrompt/,
  'the request effect must not clear the result right before requesting (searchingVersion owns that reset)',
);

console.info('AI search stage audit passed');
