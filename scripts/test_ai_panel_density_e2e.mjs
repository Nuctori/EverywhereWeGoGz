// AI 面板结果卡的信息密度回归。
// 曾经的形态：摘要渲染两遍（标题卡 + 状态卡）、生成过程回执常驻、
// 对话记录固定 224px、技术标签铺满一行，展开后整卡 1046px，把列表推到第二屏。
// 这里用一份注入的历史结果量真实渲染高度，并逐条守住"不重复、不常驻技术细节"。
import { chromium } from 'playwright';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = path.resolve('dist');
const server = http.createServer((req, res) => {
  let p = decodeURIComponent((req.url || '/').split('?')[0]).replace(/^\/EverywhereWeGoGz/, '');
  if (!p || p === '/') p = '/index.html';
  const file = path.join(root, p);
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404);
    res.end();
    return;
  }
  res.setHeader('Content-Type', ({ '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json' })[path.extname(file)] || 'application/octet-stream');
  fs.createReadStream(file).pipe(res);
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));

const SUMMARY = '奔县游的核心是人少景美性价比高，避开拥挤的景区，去那些有特色的小城或乡村。10月天气转凉，适合户外活动。';

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}/EverywhereWeGoGz/`);
  await page.locator('.tour-card h3').first().waitFor({ timeout: 60000 });

  const titles = await page.evaluate(() =>
    [...document.querySelectorAll('.tour-card h3')].map((heading) => heading.textContent.trim()),
  );
  await page.evaluate(
    ({ tourNames, summary }) => {
      const now = new Date().toISOString();
      const items = tourNames.slice(0, 24).map((tourId, index) => ({
        tourId,
        score: 0.9 - index * 0.02,
        reason: '温泉配住宿一价打包，价格压在预算内。',
        matchedSignals: ['广州出发'],
        recommendationTier: index < 5 ? 'ai-detailed' : 'ai-brief',
        reasonSource: 'ai',
      }));
      const message = (id, role, content) => ({ id, role, content, createdAt: now });
      localStorage.setItem('travel-ai-chat-state-v2', JSON.stringify({
        conversationId: 'panel-density',
        input: '',
        messages: [
          message('m0', 'assistant', '告诉我预算、天数、目的地和同行人。'),
          message('m1', 'user', '便宜的奔县游'),
          message('m2', 'assistant', '我先按你这轮条件排好了。'),
          message('m3', 'user', '想到附近的镇子逛，品尝特色。'),
          message('m4', 'assistant', '已按这轮新要求重新排好了。'),
        ],
        result: {
          conversationId: 'panel-density',
          summary,
          items,
          generatedAt: now,
          source: 'ai-api',
          assumptions: ['预算有限，优先周边游'],
          tradeoffs: ['远端目的地耗时重'],
          usage: { model: 'GLM-4.7-Flash', promptTokens: 20326, cachedPromptTokens: 0, tokensSeen: true, completionTokens: 2500 },
          refinementMode: 'multi-round',
          searchRounds: [{ query: '广东温泉小镇', hitCount: 42 }],
          status: { mode: 'ai', label: 'AI 已完成推荐', detail: '已结合需求理解、天气和候选排序，给出 24 条建议。' },
        },
      }));
    },
    { tourNames: titles, summary: SUMMARY },
  );
  await page.reload();
  await page.locator('.tour-card h3').first().waitFor({ timeout: 60000 });
  await page.waitForTimeout(1200);

  const panelHeight = () =>
    page.evaluate(() => {
      const panel = [...document.querySelectorAll('div')].find(
        (node) => String(node.className).includes('rounded-[24px]') && String(node.className).includes('mb-4'),
      );
      return panel ? Math.round(panel.getBoundingClientRect().height) : null;
    });

  // 1. 收起态：结果卡提示 + 摘要 + 操作行。
  const collapsed = await panelHeight();
  assert.ok(collapsed !== null, 'AI panel must render with a stored result');
  assert.ok(collapsed <= 280, `collapsed panel is too tall: ${collapsed}px`);

  // 2. 摘要只能出现一次（曾经标题卡和结果卡各渲染一遍）。
  const summaryCount = await page.evaluate((summary) => {
    const text = document.body.innerText;
    return text.split(summary).length - 1;
  }, SUMMARY.slice(0, 24));
  assert.equal(summaryCount, 1, `summary rendered ${summaryCount} times, expected exactly 1`);

  // 3. 生成过程回执（"已生成 N 条建议"）不该常驻在结果态。
  const progressRecall = await page.evaluate(() => document.body.innerText.includes('并展示'));
  assert.equal(progressRecall, false, 'generation receipt must not stay visible after the result lands');

  // 4. 技术标签默认收起在「这轮是怎么排的」里。
  assert.equal(
    await page.getByText('前缀缓存未命中', { exact: false }).isVisible().catch(() => false),
    false,
    'token/cache badges must be collapsed by default',
  );
  assert.equal(
    await page.getByText('多轮查找轨迹', { exact: false }).isVisible().catch(() => false),
    false,
    'multi-round trace must be collapsed by default',
  );

  // 5. 展开细节后整体高度必须收敛（曾达 1046px）。
  await page.getByRole('button', { name: '查看详情' }).first().click();
  await page.waitForTimeout(600);
  const expanded = await panelHeight();
  assert.ok(expanded !== null && expanded <= 620, `expanded panel is too tall: ${expanded}px (list gets pushed off screen)`);

  // 6. 追问输入框要撑满宽度，不能缩成一小截。
  const inputWidth = await page.evaluate(() => {
    const panel = [...document.querySelectorAll('div')].find(
      (node) => String(node.className).includes('rounded-[24px]') && String(node.className).includes('mb-4'),
    );
    const input = panel?.querySelector('input');
    return input ? Math.round(input.getBoundingClientRect().width) : 0;
  });
  assert.ok(inputWidth >= 600, `follow-up input is collapsed to ${inputWidth}px`);

  // 7. 对话记录默认折叠，展开后才有气泡。
  const transcriptToggle = page.getByRole('button', { name: /对话记录 · \d+ 条/ });
  assert.equal(await transcriptToggle.getAttribute('aria-expanded'), 'false', 'transcript must start collapsed');
  await transcriptToggle.click();
  await page.waitForTimeout(400);
  const afterTranscript = await panelHeight();
  assert.ok(afterTranscript > expanded, 'expanding the transcript must reveal content');

  assert.deepEqual(errors, [], `no runtime errors: ${errors.join(' | ')}`);
  console.info(
    `PASS: 收起 ${collapsed}px → 展开 ${expanded}px（阈值 620）→ 展开对话 ${afterTranscript}px；摘要仅 1 次，输入框 ${inputWidth}px`,
  );
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
