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

const mergeIndex = stepIndex('Merge crawled data');
const splitIndex = stepIndex('Split merged data');
const optimizeIndex = stepIndex('Optimize cached images');
const auditIndex = stepIndex('Audit merged data');

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
