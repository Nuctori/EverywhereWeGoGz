import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const workflowPath = path.join(process.cwd(), '.github', 'workflows', 'update-data.yml');
const workflow = fs.readFileSync(workflowPath, 'utf8');
const packageJsonPath = path.join(process.cwd(), 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

function mustInclude(snippet, message) {
  assert.ok(workflow.includes(snippet), message);
}

mustInclude("- cron: '0 3 * * 1'", 'expected scheduled update-data workflow to run weekly on Monday UTC');
mustInclude('skip_crawls:', 'expected workflow_dispatch skip_crawls input to exist for fast manual verification');

for (const jobName of [
  'preflight:',
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
  assert.ok(/timeout-minutes:\s+\d+/.test(stepChunk), `expected ${stepName} to have a timeout budget`);
}

const gzlStepStart = workflow.indexOf('- name: Crawl GZL API full');
assert.ok(gzlStepStart > -1, 'expected GZL crawl step to exist');
assert.ok(
  workflow.slice(gzlStepStart, gzlStepStart + 300).includes('timeout-minutes: 180'),
  'expected GZL API crawl to keep its extended timeout budget',
);

for (const stepName of [
  'Crawl JRT365 full',
  'Crawl Saihuitong full',
  'Crawl Pintu full',
  'Crawl Outdoors full',
  'Crawl HTTP aggregate sources',
]) {
  const stepStart = workflow.indexOf(`- name: ${stepName}`);
  const stepChunk = workflow.slice(stepStart, stepStart + 300);
  assert.ok(stepChunk.includes('timeout-minutes: 60'), `expected ${stepName} to keep a 60 minute timeout`);
}

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
  '- preflight',
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

assert.ok(
  packageJson.scripts?.['audit:crawler-syntax'],
  'expected package script for crawler syntax audit to exist',
);

const preflightStart = workflow.indexOf('preflight:');
const firstCrawlStart = workflow.indexOf('crawl-jrt365:');
assert.ok(preflightStart > -1 && firstCrawlStart > preflightStart, 'expected preflight job before crawl jobs');
const preflightJob = workflow.slice(preflightStart, firstCrawlStart);
for (const snippet of [
  '- name: Verify crawler syntax',
  'npm run audit:crawler-syntax',
  '- name: Verify update workflow contract',
  'npm run audit:update-data-workflow',
]) {
  assert.ok(preflightJob.includes(snippet), `expected preflight job to include ${snippet}`);
}

for (const [jobName, nextJobName] of [
  ['crawl-jrt365:', 'crawl-saihuitong:'],
  ['crawl-saihuitong:', 'crawl-pintu:'],
  ['crawl-pintu:', 'crawl-gzl-api:'],
  ['crawl-gzl-api:', 'crawl-outdoors:'],
  ['crawl-outdoors:', 'crawl-http-aggregate:'],
  ['crawl-http-aggregate:', 'update-and-deploy:'],
]) {
  const start = workflow.indexOf(jobName);
  const end = workflow.indexOf(nextJobName);
  assert.ok(start > -1 && end > start, `expected ${jobName} job block to be found`);
  const job = workflow.slice(start, end);
  assert.ok(job.includes('needs: preflight'), `expected ${jobName} to depend on preflight`);
}

const updateJobStart = workflow.indexOf('update-and-deploy:');
assert.ok(updateJobStart > -1, 'expected update-and-deploy job block to be found');
const updateJob = workflow.slice(updateJobStart);
assert.ok(updateJob.includes("needs.preflight.result == 'success'"), 'expected update job to require preflight success');

const jrtJobStart = workflow.indexOf('crawl-jrt365:');
const nextJobStart = workflow.indexOf('crawl-saihuitong:');
assert.ok(jrtJobStart > -1 && nextJobStart > jrtJobStart, 'expected crawl-jrt365 job block to be found');
const jrtJob = workflow.slice(jrtJobStart, nextJobStart);
assert.ok(
  packageJson.scripts?.['audit:jrt365-crawl-guard'],
  'expected package script for the JRT365 crawl guard to exist',
);
assert.ok(
  jrtJob.includes('- name: Verify JRT365 crawl guard'),
  'expected crawl-jrt365 job to verify the empty-output guard before crawling',
);
assert.ok(
  jrtJob.indexOf('- name: Verify JRT365 crawl guard') < jrtJob.indexOf('- name: Crawl JRT365 full'),
  'expected JRT365 crawl guard verification to run before the external crawl',
);
assert.ok(
  jrtJob.includes('npm run audit:jrt365-crawl-guard'),
  'expected crawl-jrt365 job to run audit:jrt365-crawl-guard',
);

console.log('update-data workflow audit passed');
