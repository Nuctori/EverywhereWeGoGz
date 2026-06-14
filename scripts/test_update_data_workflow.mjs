import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const workflowPath = path.join(process.cwd(), '.github', 'workflows', 'update-data.yml');
const workflow = fs.readFileSync(workflowPath, 'utf8');

function mustInclude(snippet, message) {
  assert.ok(workflow.includes(snippet), message);
}

mustInclude("- cron: '0 3 * * 1'", 'expected scheduled update-data workflow to run weekly on Monday UTC');
mustInclude('skip_crawls:', 'expected workflow_dispatch skip_crawls input to exist for fast manual verification');

for (const jobName of [
  'crawl-jrt365:',
  'crawl-saihuitong:',
  'crawl-pintu:',
  'crawl-gzl-api:',
  'crawl-outdoors:',
  'crawl-http-aggregate:',
  'update-and-deploy:',
]) {
  mustInclude(jobName, `expected workflow job ${jobName} to exist`);
}

for (const stepName of [
  'Crawl JRT365 full',
  'Crawl Saihuitong full',
  'Crawl Pintu full',
  'Crawl GZL API full',
  'Crawl Outdoors full',
  'Crawl HTTP aggregate sources',
]) {
  mustInclude(`- name: ${stepName}`, `expected workflow step ${stepName} to exist`);
  const stepStart = workflow.indexOf(`- name: ${stepName}`);
  const stepChunk = workflow.slice(stepStart, stepStart + 300);
  assert.ok(stepChunk.includes('timeout-minutes: 60'), `expected ${stepName} to have a timeout budget`);
}

mustInclude(
  'run: python -u scripts/full_crawl_final.py',
  'expected HTTP aggregate crawl job to use the compileable full_crawl_final.py entrypoint',
);

for (const artifactName of [
  'name: raw-jrt365',
  'name: raw-saihuitong',
  'name: raw-pintu',
  'name: raw-gzl-api',
  'name: raw-outdoors',
  'name: raw-http',
]) {
  mustInclude(artifactName, `expected artifact ${artifactName} to exist`);
}

mustInclude('needs:', 'expected fan-in update job to declare job dependencies');
for (const dependency of [
  '- crawl-jrt365',
  '- crawl-saihuitong',
  '- crawl-pintu',
  '- crawl-gzl-api',
  '- crawl-outdoors',
  '- crawl-http-aggregate',
]) {
  mustInclude(dependency, `expected update job to depend on ${dependency}`);
}

for (const stepName of [
  'Download JRT365 raw data',
  'Download Saihuitong raw data',
  'Download Pintu raw data',
  'Download GZL raw data',
  'Download Outdoors raw data',
  'Download HTTP aggregate raw data',
  'Merge crawled data',
  'Split merged data',
  'Optimize cached images',
  'Audit merged data',
]) {
  mustInclude(`- name: ${stepName}`, `expected update job step ${stepName} to exist`);
}

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

