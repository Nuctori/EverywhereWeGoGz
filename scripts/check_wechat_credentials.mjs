#!/usr/bin/env node
// 凭证预检：坏了→去重开 issue→exit 1；好了→自动关掉历史 issue→exit 0。
// 调用方（workflow）用 continue-on-error 吸收失败，让调度任务凭证过期时保持绿灯，
// 红叉只留给真正阻断数据的 bug。修复凭证后下一轮自动关闭 issue。
import { execFileSync } from 'node:child_process';

const appId = process.env.WECHAT_APP_ID || '';
const appSecret = process.env.WECHAT_APP_SECRET || '';
const repo = process.env.GITHUB_REPOSITORY || '';
const LABEL = 'wechat-credentials';
const TITLE = '微信公众号凭证失效——相关定时任务已自动跳过';

function gh(args, optional = false) {
  try {
    return execFileSync('gh', args, { encoding: 'utf8' });
  } catch (error) {
    if (optional) return '';
    throw error;
  }
}

// 本地跑（无 GITHUB_REPOSITORY）禁止碰远程 issue，避免用个人凭证误创建。
const issueOpsEnabled = Boolean(repo);

function closeResolvedIssues() {
  if (!issueOpsEnabled) return;
  try {
    const open = JSON.parse(gh(['issue', 'list', '--state', 'open', '--label', LABEL, '--json', 'number'], true) || '[]');
    for (const issue of open) {
      gh(['issue', 'close', String(issue.number), '--comment', '凭证预检通过，自动关闭。'], true);
    }
  } catch {
    // 关不掉历史 issue 不影响本轮
  }
}

function openIssue(detail) {
  if (!issueOpsEnabled) {
    console.log('(本地运行：跳过 issue 操作。诊断如下)\n' + detail);
    return;
  }
  try {
    gh(['label', 'create', LABEL, '--color', 'D93F0B', '--description', '微信公众号 appId/secret 失效', '--force'], true);
    const open = JSON.parse(gh(['issue', 'list', '--state', 'open', '--label', LABEL, '--json', 'number'], true) || '[]');
    if (open.length === 0) {
      gh(['issue', 'create', '--label', LABEL, '--title', TITLE, '--body', detail]);
    } else {
      // 诊断会随错误码变化（如 IP 白名单→appid 错误），刷新正文为最新结论
      gh(['issue', 'comment', String(open[0].number), '--body', detail]);
    }
  } catch (error) {
    console.warn(`issue 操作失败（忽略）：${error.message}`);
  }
}

if (!appId || !appSecret) {
  openIssue('`WECHAT_APP_ID` / `WECHAT_APP_SECRET` secret 缺失。到仓库 Settings → Secrets and variables → Actions 配置后重跑。');
  console.error('WeChat credentials missing.');
  process.exit(1);
}

let body;
try {
  const response = await fetch(
    `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${encodeURIComponent(appId)}&secret=${encodeURIComponent(appSecret)}`,
    { signal: AbortSignal.timeout(15000) },
  );
  body = await response.json().catch(() => ({}));
} catch (error) {
  openIssue(`WeChat token 接口请求失败：${error.message}。多为网络抖动，下一轮会自动重试。`);
  console.error('WeChat token request failed.');
  process.exit(1);
}

if (body.access_token) {
  closeResolvedIssues();
  console.log('WeChat credentials OK.');
  process.exit(0);
}

const hints = {
  40013: 'appid 不正确',
  40125: 'appsecret 不正确（可能已重置，需要更新 secret）',
  40001: 'appsecret 无效或已过期，需要更新 secret',
  40164: '调用 IP 不在公众号白名单——GitHub runner IP 每次都变，需在公众号后台「IP 白名单」关闭或清空限制',
  45009: '接口调用频率超限，下一轮自动重试即可',
};
const hint = hints[body.errcode] || '见微信公众平台文档错误码说明';
openIssue(
  [
    `WeChat token 接口返回：\`errcode=${body.errcode ?? 'n/a'} errmsg=${body.errmsg ?? 'unknown'}\``,
    '',
    `诊断：${hint}`,
    '',
    '修复后下一轮调度会自动关闭本 issue。凭证有效期间，相关定时工作流将保持绿灯跳过，不再制造红叉。',
  ].join('\n'),
);
console.error(`WeChat credentials invalid: errcode=${body.errcode} errmsg=${body.errmsg}`);
process.exit(1);
