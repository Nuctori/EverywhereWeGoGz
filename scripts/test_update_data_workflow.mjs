import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const workflowPath = path.join(process.cwd(), '.github', 'workflows', 'update-data.yml');
const workflow = fs.readFileSync(workflowPath, 'utf8');

function stepIndex(stepName) {
  const marker = `- name: ${stepName}`;
  const index = workflow.indexOf(marker);
  assert.notEqual(index, -1, `expected workflow step "${stepName}" to exist`);
  return index;
}

function stepBlock(stepName) {
  const start = stepIndex(stepName);
  const nextStep = workflow.indexOf('\n      - name:', start + 1);
  return workflow.slice(start, nextStep === -1 ? undefined : nextStep);
}

const jrtIndex = stepIndex('Crawl JRT365 full');
const saihuitongIndex = stepIndex('Crawl Saihuitong full');
const pintuIndex = stepIndex('Crawl Pintu full');
const gzlIndex = stepIndex('Crawl GZL API full');
const outdoorsIndex = stepIndex('Crawl Outdoors full');
const httpAggregateIndex = stepIndex('Crawl HTTP aggregate sources');
const mergeIndex = stepIndex('Merge crawled data');
const splitIndex = stepIndex('Split merged data');
const optimizeIndex = stepIndex('Optimize cached images');
const auditIndex = stepIndex('Audit merged data');

assert.ok(
  workflow.includes('skip_crawls:'),
  'expected workflow_dispatch skip_crawls input to exist for fast manual verification',
);
assert.ok(
  workflow.includes("if: github.event_name != 'workflow_dispatch' || github.event.inputs.skip_crawls != 'true'"),
  'expected crawl steps to be skippable only for manual verification runs',
);
for (const stepName of [
  'Crawl JRT365 full',
  'Crawl Saihuitong full',
  'Crawl Pintu full',
  'Crawl GZL API full',
  'Crawl Outdoors full',
  'Crawl HTTP aggregate sources',
]) {
  assert.ok(
    stepBlock(stepName).includes('timeout-minutes: 60'),
    `expected ${stepName} to have a timeout budget`,
  );
}
assert.ok(
  jrtIndex < saihuitongIndex &&
    saihuitongIndex < pintuIndex &&
    pintuIndex < gzlIndex &&
    gzlIndex < outdoorsIndex &&
    outdoorsIndex < httpAggregateIndex,
  'crawl steps should stay independently visible and ordered before merge',
);
assert.ok(
  httpAggregateIndex < mergeIndex,
  'HTTP aggregate crawl should complete before Merge crawled data',
);

assert.ok(
  mergeIndex < splitIndex,
  'Split merged data should run after Merge crawled data',
);
assert.ok(
  splitIndex < optimizeIndex,
  'Optimize cached images should run after Split merged data',
);
assert.ok(
  optimizeIndex < auditIndex,
  'Audit merged data should run after Optimize cached images',
);

const gitAddMatch = workflow.match(/git add ([^\r\n]+)/);
assert.ok(gitAddMatch, 'expected Check if data changed to stage generated data files');

const gitAddCommand = gitAddMatch[1];
for (const requiredPath of [
  'public/data/tours-index.json',
  'public/data/tours-page-*.json',
  'public/data/tour-details',
  'public/data/image-cache',
]) {
  assert.ok(
    gitAddCommand.includes(requiredPath),
    `expected git add command to include ${requiredPath}`,
  );
}

console.log('update-data workflow audit passed');
