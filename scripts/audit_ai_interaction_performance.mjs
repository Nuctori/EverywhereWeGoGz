import { strict as assert } from 'node:assert';
import fs from 'node:fs';

const appSource = fs.readFileSync('src/App.tsx', 'utf8');
const tourListSource = fs.readFileSync('src/sections/TourList.tsx', 'utf8');
const aiPanelSource = fs.readFileSync('src/sections/AiRecommendPanel.tsx', 'utf8');

const aiSearchBody = appSource.match(/const handleAiSearch = \(nextQuery\?: string\) => \{([\s\S]*?)\n  \};/)?.[1] || '';
assert.ok(aiSearchBody.includes('setAiSearchRequest'), 'AI search should still dispatch an AI request');
assert.ok(
  !aiSearchBody.includes('setSubmittedSearchQuery(prompt)'),
  'AI search click must not submit the natural-language prompt into the plain list search path',
);
assert.ok(
  aiSearchBody.includes('requestAnimationFrame'),
  'AI search scroll should be scheduled after the click frame instead of running immediately',
);

assert.match(
  tourListSource,
  /const isAiSearchMode = Boolean\(aiRecommendationResult\);/,
  'pending AI requests must not switch TourList into AI mode before results exist',
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

console.info('AI interaction performance audit passed');
