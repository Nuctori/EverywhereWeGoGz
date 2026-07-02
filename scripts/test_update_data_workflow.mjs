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
  'crawl-kanghui:',
  'crawl-gdcts:',
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
  'Crawl Kanghui full',
  'Crawl GDCTS full',
  'Crawl GZL API full',
  'Crawl Outdoors full',
  'Crawl HTTP aggregate sources',
]) {
  mustInclude(`- name: ${stepName}`, `expected workflow step ${stepName} to exist`);
  const stepStart = workflow.indexOf(`- name: ${stepName}`);
  const stepChunk = workflow.slice(stepStart, stepStart + 300);
  assert.ok(stepChunk.includes('timeout-minutes:'), `expected ${stepName} to have a timeout budget`);
}

for (const artifactName of [
  'name: raw-jrt365',
  'name: raw-saihuitong',
  'name: raw-pintu',
  'name: raw-kanghui',
  'name: raw-gdcts',
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
  '- crawl-kanghui',
  '- crawl-gdcts',
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
  'Download Kanghui raw data',
  'Download GDCTS raw data',
  'Download GZL raw data',
  'Download Outdoors raw data',
  'Download HTTP aggregate raw data',
  'Prepare raw source updates',
  'Merge crawled data',
  'Split merged data',
  'Optimize cached images',
  'Audit merged data',
]) {
  mustInclude(`- name: ${stepName}`, `expected update job step ${stepName} to exist`);
}

mustInclude(
  'node scripts/prepare_raw_artifacts.mjs --artifact-root artifacts --data-dir src/data --max-stale-days 7 --report audit/raw-source-update-report.json --state src/data/raw-source-state.json',
  'expected workflow to prepare source-level raw diffs before merging',
);
mustInclude('continue-on-error: true', 'expected raw artifact downloads to allow stale fallback handling');
mustInclude("steps.raw_sources.outputs.rebuild_required == 'true'", 'expected downstream merge to run when raw or pipeline changed');
mustInclude('GDCTS_AVAILABILITY_FILTER: 1', 'expected GDCTS availability filtering to be enabled by default');
mustInclude('OUTDOORS_AVAILABILITY_FILTER: 1', 'expected outdoors availability filtering to be enabled by default');

const gitAddMatch = workflow.match(/git add ([^\r\n]+)/);
assert.ok(gitAddMatch, 'expected Check if data changed to stage generated data files');

const gitAddCommand = gitAddMatch[1];
for (const requiredPath of [
  'public/data/tours-index.json',
  'public/data/tours-page-*.json',
  'public/data/tour-details',
  'public/data/image-cache',
  'src/data/raw_gdcts_full.json',
  'src/data/raw-source-state.json',
]) {
  assert.ok(
    gitAddCommand.includes(requiredPath),
    `expected git add command to include ${requiredPath}`,
  );
}

console.log('update-data workflow audit passed');
