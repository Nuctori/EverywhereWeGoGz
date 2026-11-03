// 回归：AI 没跑完时，移动端必须能看出为什么没完成。
// 历史问题：气泡胶囊对超时/接口报错/切后台/断网只显示同一句
// “查找未完成，内容已保留”，用户拿不到任何可判断的信息。
// 本用例让排序调用抛网络错误，断言：
//   1) 胶囊不再落回那句通用文案，而是给出降级状态；
//   2) 打开面板后能读到降级原因与接口原始错误；
//   3) 仍保留手动「继续本轮」的入口。
import { chromium } from 'playwright';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = path.resolve(process.env.AI_FAILURE_DIST || 'dist');
const FIXTURE_ERROR = 'Failed to fetch (failure-reason fixture)';
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

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript((fixtureError) => {
    const realFetch = window.fetch.bind(window);
    window.fetch = async (input, init) => {
      const url = String(input);
      if (!url.includes('chat/completions')) return realFetch(input, init);
      const prompt = JSON.stringify(JSON.parse(init?.body || '{}').messages);
      // 分类头正常返回，保证排序调用是真正发起的那一步。
      if (!prompt.includes('rank_5detailed_10brief')) {
        return new Response(
          JSON.stringify({ choices: [{ message: { content: JSON.stringify({ queries: ['推荐线路'], demands: [], destinations: [] }) } }] }),
          { headers: { 'content-type': 'application/json' } },
        );
      }
      window.__rankingAttempts = (window.__rankingAttempts || 0) + 1;
      throw new TypeError(fixtureError);
    };
  }, FIXTURE_ERROR);

  await page.goto(`http://127.0.0.1:${server.address().port}/EverywhereWeGoGz/`);
  await page.locator('.tour-card h3').first().waitFor({ timeout: 60000 });
  await page.locator('input').first().fill('帮我挑一些线路');
  await page.getByRole('button', { name: 'AI 帮我挑' }).first().click();

  // 1) 胶囊必须从“查找未完成，内容已保留”切换成能说明状态/原因的文案。
  // 注意 pendingPrompt 在请求一开始就写入了，不能用它判断“已结束”；
  // 这里等胶囊进入带“未完成”的终态文案（且不是那句通用兜底）再断言。
  const capsule = page.getByRole('button', { name: /^打开 AI 面板/ });
  await capsule.waitFor();
  await page.waitForFunction(() => {
    const el = document.querySelector('button[aria-label^="打开 AI 面板"]');
    if (!el) return false;
    const label = el.getAttribute('aria-label') || '';
    return label.includes('未完成') && !label.includes('查找未完成，内容已保留');
  }, null, { timeout: 60000 });
  assert.ok(await page.evaluate(() => (window.__rankingAttempts || 0) >= 1), 'fixture must reach the ranking call');
  const capsuleLabel = (await capsule.getAttribute('aria-label')) || '';
  assert.match(
    capsuleLabel,
    /未完成|降级|中断/,
    `capsule must name the interruption instead of a generic line, got: ${capsuleLabel}`,
  );

  // 2) 打开面板即可读到原因与接口原始错误（不需要再展开详情）。
  await capsule.click();
  const panel = page.getByRole('dialog', { name: 'AI 帮你挑', exact: true });
  await panel.waitFor();
  const panelText = await panel.innerText();
  assert.match(panelText, /AI 未完成|本次查找未完成|降级/, `panel must explain the outcome, got: ${panelText.slice(0, 400)}`);
  assert.ok(panelText.includes(FIXTURE_ERROR), `panel must surface the provider error, got: ${panelText.slice(0, 400)}`);

  // 3) 手动恢复入口仍在。
  await panel.getByRole('button', { name: '继续本轮', exact: true }).waitFor();
  assert.deepEqual(errors, []);
  console.log('PASS mobile failure reason: capsule names the interruption, panel carries the provider error');
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
