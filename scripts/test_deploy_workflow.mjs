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
mustInclude('git worktree add --detach', 'expected CDN artifact publishing to use the checked-out repository credentials');
mustInclude('push --force origin HEAD:cdn-assets', 'expected CDN artifact branch push');
mustInclude('cp -a dist/.', 'expected built dist directory to be published to CDN branch');
mustInclude('uses: actions/setup-python@v5', 'expected Python runtime for structured data audits');
mustInclude('python -m pip install requests beautifulsoup4 lxml', 'expected dependencies for structured data audits');

// 数据管线用 GITHUB_TOKEN push，不会触发 push 事件；必须由 workflow_run 把
// 自动落库的数据带到 cdn-assets，否则线上数据只会在人工 push 时前进一格。
mustInclude('workflow_run:', 'expected deploy workflow to react to data pipeline completions');
mustInclude(
  'workflows: ["Update Tour Data", "Refresh Availability Cache"]',
  'expected deploy workflow to watch both data pipelines',
);
mustInclude(
  'github.event.workflow_run.conclusion == \'success\'',
  'expected workflow_run deploys to require a successful data pipeline',
);

assert.ok(
  workflow.indexOf('- name: Verify deploy workflow contract') < workflow.indexOf('- name: Install dependencies'),
  'expected deploy workflow self-check to run before dependency install',
);

console.log('deploy workflow audit passed');
