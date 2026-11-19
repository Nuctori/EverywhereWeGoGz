import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// 契约测试：2026-11-16 的红就是从这里漏掉的——凭证坏了仍继续跑，最后在
// Install Aider 撞上 numpy 构建失败。这里把「短路 + 解释器固定」钉住。
const workflowPath =
  process.env.WEEKLY_WECHAT_WORKFLOW_PATH ||
  path.join(process.cwd(), '.github', 'workflows', 'weekly-wechat-article.yml');
const workflow = fs.readFileSync(workflowPath, 'utf8').replace(/\r\n/g, '\n');

function mustInclude(snippet, message) {
  assert.ok(workflow.includes(snippet), message);
}

function mustNotInclude(snippet, message) {
  assert.ok(!workflow.includes(snippet), message);
}

mustInclude('workflow_dispatch:', 'expected weekly workflow to stay manually dispatchable');
mustInclude('      - Update Tour Data', 'expected weekly workflow to follow the data pipeline');

// 凭证预检必须真正短路：独立 job + needs 输出，而不是一个 exit 0 的假停步。
mustInclude('  credentials:', 'expected a dedicated credentials job');
mustInclude('issues: write', 'expected credentials job to be able to open the tracking issue');
mustInclude('needs: credentials', 'expected publish job to depend on the credentials job');
mustInclude(
  "if: needs.credentials.outputs.ok == 'true'",
  'expected publish job to be gated on the credentials output',
);
mustInclude(
  'echo "ok=false" >> "$GITHUB_OUTPUT"',
  'expected failed precheck to record ok=false for the publish job gate',
);
mustNotInclude(
  'Stop if credentials are broken',
  'a step-level exit 0 cannot stop the rest of the job; gate the job instead',
);

// aider-chat 锁 numpy==1.24.3：必须用带 wheel 的 3.11，且统一走 python。
mustInclude('python-version: "3.11"', 'expected Aider install to pin Python 3.11');
mustInclude('python -m pip install --user aider-chat', 'expected Aider install to use the pinned python');
mustNotInclude(
  'python3 -m pip install --user aider-chat',
  'system python3 on ubuntu runners is 3.12+, where numpy 1.24.3 has no wheel',
);
mustInclude('python scripts/test_deploy_remote_wechat_publish.py', 'expected relay tests to use the pinned python');
mustInclude('python scripts/deploy_remote_wechat_publish.py', 'expected publish relay to use the pinned python');

console.log('weekly wechat workflow contract passed');
