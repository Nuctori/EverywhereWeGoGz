import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const workflowPath = path.join(process.cwd(), '.github', 'workflows', 'deploy.yml');
const workflow = fs.readFileSync(workflowPath, 'utf8');

function mustInclude(snippet, message) {
  assert.ok(workflow.includes(snippet), message);
}

mustInclude('name: Deploy GitHub Pages', 'expected deploy workflow name');
mustInclude('concurrency:', 'expected Pages deploy concurrency control');
mustInclude('group: pages', 'expected a single Pages concurrency group');
mustInclude('cancel-in-progress: true', 'expected newer Pages runs to cancel older queued deployments');
mustInclude('- name: Verify deploy workflow contract', 'expected deploy workflow self-check step');
mustInclude('npm run audit:deploy-workflow', 'expected deploy workflow to run its self-check');
mustInclude('uses: actions/upload-pages-artifact@v3', 'expected official Pages artifact upload action');
mustInclude('uses: actions/deploy-pages@v4', 'expected official Pages deploy action');

assert.ok(
  workflow.indexOf('- name: Verify deploy workflow contract') < workflow.indexOf('- name: Install dependencies'),
  'expected deploy workflow self-check to run before dependency install',
);

console.log('deploy workflow audit passed');
