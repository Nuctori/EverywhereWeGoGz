import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// Contract for the daily JRT365 source-health workflow. The source renders a
// large share of delisted tours as "hollow" pages (HTTP 200, empty title and
// price). The crawler used to record those as hasDetailContent=true, so a
// whole-catalog refresh could not reveal them. This job exists to notice that
// between weekly runs.

const workflowPath = path.join(
  process.cwd(),
  '.github',
  'workflows',
  'check-jrt365-health.yml',
);
assert.ok(fs.existsSync(workflowPath), 'expected check-jrt365-health.yml to exist');

const workflow = fs.readFileSync(workflowPath, 'utf8').replace(/\r\n/g, '\n');
const packageJson = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'),
);

function mustInclude(snippet, message) {
  assert.ok(workflow.includes(snippet), message);
}

// Runs daily, not weekly: a hollow-out is a source-side event that can happen
// any day, and waiting for Monday leaves dead tours on the site all week.
mustInclude("- cron: '0 5 * * *'", 'expected a daily schedule');
mustInclude('workflow_dispatch:', 'expected manual dispatch to be available');
mustInclude('force_recrawl:', 'expected a force_recrawl escape hatch');

// Must share the data-write lock. push_generated_commit.sh rebases then pushes
// and aborts on conflict, so interleaving with another data writer loses the run.
const sharedWriteLock =
  'concurrency:\n  group: tour-data-writes\n  cancel-in-progress: false';
assert.ok(
  workflow.includes(sharedWriteLock),
  'expected the health workflow to share the tour-data-writes lock',
);
mustInclude('permissions:\n  contents: write', 'expected contents write permission');

// Probe gates the re-crawl; exit code 3 is the "needs recrawl" signal.
mustInclude('python -u scripts/check_jrt365_health.py', 'expected the health probe step');
mustInclude('needs_recrawl', 'expected the probe result to gate the re-crawl');
assert.ok(
  workflow.includes('"$code" = "3"') || workflow.includes("'$code' = '3'"),
  'expected exit code 3 to be treated as the needs-recrawl signal',
);
assert.ok(
  workflow.indexOf('- name: Probe JRT365 source health') <
    workflow.indexOf('- name: Re-crawl JRT365 source only'),
  'expected the probe to run before the re-crawl',
);

// Single-channel re-crawl reuses the crawler's refresh mode rather than
// re-running all seven crawl jobs.
mustInclude("JRT365_REFRESH_EXISTING: '1'", 'expected refresh-existing crawl mode');
mustInclude("JRT365_PRUNE_HOLLOW: '1'", 'expected hollow tours to be pruned');
mustInclude('python -u scripts/crawl_jrt365_full.py', 'expected the crawler to be invoked');

// Once hollow tours are pruned the merged output must be regenerated, or the
// surviving tours lose their raw backing and the integrity audit fails.
for (const step of [
  '- name: Merge data',
  '- name: Split merged data',
  '- name: Optimize cached images',
  '- name: Audit merged data',
  '- name: Commit data changes',
]) {
  mustInclude(step, `expected step ${step} to exist`);
}

// The integrity audit is the gate that catches a prune that went too far.
const auditStart = workflow.indexOf('- name: Audit merged data');
assert.ok(auditStart > -1, 'expected the audit step');
assert.ok(
  !workflow.slice(auditStart, auditStart + 200).includes('continue-on-error'),
  'expected the integrity audit to remain a blocking gate',
);

// The availability cache is owned by refresh-availability-cache.yml; merge
// rewrites it as a side effect, so it must be discarded before committing.
mustInclude(
  'git restore src/data/tour-availability-cache.json',
  'expected the availability cache to be restored before committing',
);
mustInclude('bash scripts/push_generated_commit.sh', 'expected the generated-commit publisher');

// Publishing goes through the shared publisher, never a force push.
assert.ok(!workflow.includes('git push --force'), 'health workflow must not force push');

assert.ok(
  packageJson.scripts?.['check:jrt365-health'],
  'expected a check:jrt365-health package script',
);
assert.ok(
  packageJson.scripts?.['test:jrt365-hollow'],
  'expected a test:jrt365-hollow package script',
);

// update-data.yml's contract test slices jobs by the first occurrence of each
// job name; a job name that prefixes `crawl-jrt365:` would break that slice.
assert.ok(
  !/^\s{2}crawl-jrt365[-a-z]*:/m.test(workflow),
  'health workflow job name must not prefix crawl-jrt365: used by update-data.yml',
);

console.log('jrt365 health workflow audit passed');
