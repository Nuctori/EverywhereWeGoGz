// 延迟 SSE 尾部，验证列表在终态前显示模型理由；不依赖外部网关。
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
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.setHeader('Content-Type', ({ '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json' })[path.extname(file)] || 'application/octet-stream');
  fs.createReadStream(file).pipe(res);
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => {
    const realFetch = window.fetch.bind(window);
    window.fetch = async (input, init) => {
      const url = String(input);
      if (!url.includes('chat/completions')) return realFetch(input, init);
      const request = JSON.parse(init?.body || '{}');
      const prompt = JSON.stringify(request.messages);
      if (!prompt.includes('rank_5detailed_10brief')) {
        return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({ queries: ['推荐线路'], demands: [], destinations: [] }) } }] }), { headers: { 'content-type': 'application/json' } });
      }
      if (window.__hangRecommendation) return new Response(new ReadableStream(), { headers: { 'content-type': 'text/event-stream' } });
      const index = await (await realFetch('/EverywhereWeGoGz/data/tours-index.json')).json();
      const ids = new Set([...prompt.matchAll(/tour_\d+/g)].map(m => m[0]));
      const tour = index.find(t => ids.has(t.id) && t.price > 0);
      if (!tour) throw new Error('fixture must select a real prompt candidate');
      window.__partialAttempts = (window.__partialAttempts || 0) + 1;
      window.__partialTest = { selected: tour.id, finished: false };
      const encoder = new TextEncoder();
      const frame = content => encoder.encode('data: ' + JSON.stringify({ choices: [{ delta: { content } }] }) + '\n\n');
      return new Response(new ReadableStream({ start(controller) {
        controller.enqueue(frame('{"items":[' + JSON.stringify({ tourId: tour.id, score: 95, reason: '流式测试专属推荐理由', matchedSignals: ['行程体验'] })));
        window.__finishPartialTest = () => {
          controller.enqueue(frame('],"summary":"模型推荐摘要"}'));
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
          window.__partialTest.finished = true;
        };
      } }), { headers: { 'content-type': 'text/event-stream' } });
    };
  });
  await page.goto(`http://127.0.0.1:${server.address().port}/EverywhereWeGoGz/`);
  await page.locator('.tour-card h3').first().waitFor({ timeout: 60000 });
  await page.locator('input').first().fill('帮我挑一些线路');
  await page.getByRole('button', { name: 'AI 帮我挑' }).first().click();
  const reason = page.locator('.tour-card').filter({ hasText: '流式测试专属推荐理由' }).first();
  await reason.waitFor({ timeout: 60000 });
  assert.equal(await page.evaluate(() => window.__partialTest.finished), false, 'card must appear while SSE is still open');
  console.log('PASS: SSE 未结束，列表已显示模型生成的首条推荐理由');
  await page.getByRole('button', { name: '取消这次查找', exact: true }).waitFor();
  assert.equal(await page.getByRole('progressbar', { name: '推荐生成进度' }).getAttribute('aria-valuenow') !== null, true);
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.getByRole('button', { name: '重新查找', exact: true }).waitFor();
  assert.ok(await reason.isVisible(), 'background interruption must retain the validated preview');
  const checkpoint = await page.evaluate(() => JSON.parse(localStorage.getItem('travel-ai-chat-state-v2')));
  assert.ok(checkpoint.pendingPrompt, 'interrupted prompt must be persisted');
  assert.ok(checkpoint.result.items.some((item) => item.reason === '流式测试专属推荐理由'));
  assert.equal(await page.evaluate(() => window.__partialAttempts), 1, 'hidden page must not retry');
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
    document.dispatchEvent(new Event('visibilitychange'));
    window.dispatchEvent(new Event('pageshow'));
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.waitForFunction(() => window.__partialAttempts === 2);
  await page.getByRole('button', { name: '先看 1 条', exact: true }).click();
  assert.ok(await reason.isVisible());
  await page.reload();
  await page.waitForFunction(() => window.__partialAttempts === 1);
  await page.getByRole('button', { name: '先看 1 条', exact: true }).waitFor();
  console.log('PASS: 前台事件去重自动重试，重载自动恢复，先看N条可点击');
  // Both persisted recovery allowances are now consumed. Another interruption
  // must retain content without silently starting a fourth request.
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.getByRole('button', { name: '重新查找', exact: true }).waitFor();
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.waitForTimeout(300);
  assert.equal(await page.evaluate(() => window.__partialAttempts), 1, 'automatic retries must be bounded across reload');
  await page.getByRole('button', { name: '重新查找', exact: true }).click();
  await page.waitForFunction(() => window.__partialAttempts === 2);
  await page.getByRole('button', { name: '取消这次查找', exact: true }).click();
  await page.getByRole('button', { name: '取消这次查找', exact: true }).waitFor({ state: 'hidden' });
  await page.evaluate(() => { document.dispatchEvent(new Event('visibilitychange')); window.dispatchEvent(new Event('pageshow')); });
  await page.waitForTimeout(300);
  assert.equal(await page.evaluate(() => window.__partialAttempts), 2, 'explicit cancellation must not auto-resume');
  assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('travel-ai-chat-state-v2')).pendingPrompt), null);
  console.log('PASS: 自动恢复额度跨刷新保留，主动取消不重启');
  await page.getByRole('textbox', { name: '补充旅行条件' }).fill('帮我挑一些线路');
  await page.getByRole('button', { name: '继续细调', exact: true }).click();
  await page.waitForFunction(() => window.__partialAttempts === 3);
  await page.evaluate(() => window.__finishPartialTest());
  await page.getByText('AI完成', { exact: true }).first().waitFor({ timeout: 30000 });
  assert.deepEqual(errors, []);
  console.log('PASS: SSE 结束后进入完成态，无运行时错误');
  await page.waitForFunction(() => JSON.parse(localStorage.getItem('travel-ai-chat-state-v2')).messages.some(m => m.role === 'assistant' && m.content.includes('排好')));
  const assistantsBefore = await page.evaluate(() => JSON.parse(localStorage.getItem('travel-ai-chat-state-v2')).messages.filter(m => m.role === 'assistant').length);
  await page.evaluate(() => { window.__hangRecommendation = true; });
  const began = Date.now();
  await page.getByRole('textbox', { name: '补充旅行条件' }).fill('预算再降低一点');
  await page.getByRole('button', { name: '继续细调', exact: true }).click();
  await page.getByRole('button', { name: '取消这次查找', exact: true }).waitFor();
  await page.getByRole('button', { name: '取消这次查找', exact: true }).waitFor({ state: 'hidden', timeout: 33000 });
  assert.ok(Date.now() - began < 33000, 'whole UI request must stop near 30s');
  assert.ok(await reason.isVisible(), 'deadline without new partial must preserve prior AI result');
  assert.equal(await page.getByText('AI完成', { exact: true }).count(), 1, 'prior result remains identifiable');
  assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('travel-ai-chat-state-v2')).messages.filter(m => m.role === 'assistant').length), assistantsBefore, 'deadline must not add a success receipt');
  console.log(`PASS: 无新partial的细调在 ${Date.now() - began}ms 停止并保留旧AI结果`);
  await page.getByRole('button', { name: '清空', exact: true }).click();
  assert.equal(await page.locator('.tour-card').filter({ hasText: '流式测试专属推荐理由' }).count(), 0, 'clear must remove preview and final recommendations');
  console.log('PASS: 清空 AI 后不残留增量推荐');
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
