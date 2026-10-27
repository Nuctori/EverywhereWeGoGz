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
      const index = await (await realFetch('/EverywhereWeGoGz/data/tours-index.json')).json();
      const ids = new Set([...prompt.matchAll(/tour_\d+/g)].map(m => m[0]));
      const tour = index.find(t => ids.has(t.id) && t.price > 0);
      if (!tour) throw new Error('fixture must select a real prompt candidate');
      window.__partialAttempts = (window.__partialAttempts || 0) + 1;
      window.__partialTest = { selected: tour.id, finished: false };
      init?.signal?.addEventListener('abort', () => { window.__streamAborts = (window.__streamAborts || 0) + 1; });
      const encoder = new TextEncoder();
      const frame = content => encoder.encode('data: ' + JSON.stringify({ choices: [{ delta: { content } }] }) + '\n\n');
      return new Response(new ReadableStream({ start(controller) {
        controller.enqueue(frame('{"order":' + JSON.stringify([tour.id]) + ',"items":['));
        window.__addPartialReason = () => controller.enqueue(frame(JSON.stringify({ tourId: tour.id, score: 95, reason: '流式测试专属推荐理由', matchedSignals: ['行程体验'] })));
        if (!window.__holdReasons) window.__addPartialReason();
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
  const capsule = page.getByRole('button', { name: /^打开 AI 面板/ });
  await capsule.waitFor();
  await page.locator('.tour-card').filter({ hasText: '流式测试专属推荐理由' }).first().waitFor();
  assert.equal(await page.getByRole('dialog').count(), 0, 'generation must not auto-open modal');
  await capsule.click();
  const panel = page.getByRole('dialog', { name: 'AI 帮你挑', exact: true });
  await panel.waitFor();
  assert.equal(await panel.evaluate(el => el.contains(document.activeElement)), true, 'focus enters non-input dialog container');
  assert.equal(await page.getByRole('textbox', { name: '补充旅行条件' }).isEnabled(), true);
  await page.getByRole('button', { name: '收起并查看线路', exact: true }).click();
  await panel.waitFor({ state: 'hidden' });
  assert.equal(await page.evaluate(() => window.__partialAttempts), 1, 'closing must not cancel/restart stream');
  assert.equal(await page.evaluate(() => window.__streamAborts || 0), 0, 'opening/closing must not abort transport');
  await page.evaluate(() => window.__finishPartialTest());
  await capsule.waitFor();
  assert.equal(await page.getByRole('dialog').count(), 0, 'completion must not auto-open');
  await page.getByText('筛选线路', { exact: true }).click();
  await page.getByRole('button', { name: '更多筛选', exact: true }).click();
  await page.getByRole('dialog').waitFor();
  assert.equal(await capsule.count(), 0, 'filter dialog must hide capsule');
  await page.keyboard.press('Escape');
  await capsule.waitFor();
  await page.locator('.tour-card').first().click();
  await page.getByRole('dialog').waitFor();
  assert.equal(await capsule.count(), 0, 'tour details must hide capsule');
  await page.keyboard.press('Escape');
  await capsule.waitFor();
  await page.evaluate(() => { Object.defineProperty(window.visualViewport, 'height', { configurable: true, value: 400 }); window.visualViewport.dispatchEvent(new Event('resize')); });
  await capsule.waitFor({ state: 'hidden' });
  await page.evaluate(() => { Object.defineProperty(window.visualViewport, 'height', { configurable: true, value: 844 }); window.visualViewport.dispatchEvent(new Event('resize')); });
  await capsule.waitFor();
  const box = await capsule.boundingBox();
  assert.ok(box.x >= 0 && box.x + box.width <= 390 && box.y + box.height <= 844);
  await capsule.click();
  await panel.waitFor();
  await page.getByRole('button', { name: '清空', exact: true }).click();
  await panel.waitFor({ state: 'hidden' });
  assert.equal(await capsule.count(), 0, 'clear must remove capsule');
  await page.locator('input').first().fill('帮我挑一些线路');
  await page.getByRole('button', { name: 'AI 帮我挑' }).first().click();
  await capsule.waitFor();
  assert.equal(await page.getByRole('dialog').count(), 0, 'next turn after clear must not auto-open');
  await capsule.click();
  await panel.waitFor();
  await page.keyboard.press('Escape');
  await panel.waitFor({ state: 'hidden' });
  assert.equal(await capsule.evaluate(el => document.activeElement === el), true, 'Escape returns focus to capsule');
  assert.deepEqual(errors, []);
  console.log('PASS mobile capsule: no auto-open, background streaming, filter avoidance, viewport fit, clear');
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
