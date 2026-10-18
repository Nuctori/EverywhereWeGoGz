// 流式预览期间的稳定性回归：
// 1) 列表不能因为流式增量到达而重新从顶部加载（用户反馈的"不停刷新闪动"）；
// 2) 结果条数不能来回跳（用户反馈的"输出统计无效"）。
// 做法：mock SSE 分多次推送 items，记录每次推送后的
//   - 列表首条标题（应当保持不变，直到出现真正更靠前的推荐）
//   - 卡片数与「共 N 条」数字（不应当出现"先变小再变大"的抖动）
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

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await page.addInitScript(() => {
    const realFetch = window.fetch.bind(window);
    window.fetch = async (input, init) => {
      const url = String(input);
      if (!url.includes('chat/completions')) return realFetch(input, init);
      const prompt = JSON.stringify(JSON.parse(init?.body || '{}').messages || []);
      // 前置的分类/规划调用：给最小合法 JSON，避免真实外网依赖。
      if (!prompt.includes('rank_5detailed_10brief')) {
        return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({ queries: ['推荐线路'], demands: [], destinations: [] }) } }] }), { headers: { 'content-type': 'application/json' } });
      }
      const index = await (await realFetch('/EverywhereWeGoGz/data/tours-index.json')).json();
      const ids = new Set([...prompt.matchAll(/tour_\d+/g)].map((m) => m[0]));
      const picks = index.filter((t) => ids.has(t.id) && t.price > 0).slice(0, 6);
      if (picks.length < 6) throw new Error('fixture must find at least 6 real prompt candidates');

      const encoder = new TextEncoder();
      window.__stream = { picks: picks.map((t) => t.id), finished: false };
      return new Response(new ReadableStream({ start(controller) {
        const send = (text) => controller.enqueue(encoder.encode('data: ' + JSON.stringify({ choices: [{ delta: { content: text } }] }) + '\n\n'));
        send('{"items":[');
        let sent = 0;
        window.__pushNext = () => {
          if (sent < picks.length) {
            const piece = JSON.stringify({
              tourId: picks[sent].id,
              score: 95 - sent,
              reason: `流式稳定性测试第 ${sent + 1} 条理由`,
              matchedSignals: ['行程体验'],
            });
            send((sent === 0 ? '' : ',') + piece);
            sent += 1;
            return;
          }
          send('],"summary":"模型推荐摘要"}');
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
          window.__stream.finished = true;
        };
      } }), { headers: { 'content-type': 'text/event-stream' } });
    };
  });

  await page.goto(`http://127.0.0.1:${server.address().port}/EverywhereWeGoGz/`);
  await page.locator('.tour-card h3').first().waitFor({ timeout: 60000 });
  await page.locator('input').first().fill('便宜的奔县游');
  await page.getByRole('button', { name: 'AI 帮我挑' }).first().click();

  const snapshot = () => page.evaluate(() => {
    const first = document.querySelector('#tour-list .tour-card h3');
    const countText = document.body.innerText.match(/共\s*([\d,]+)\s*条/);
    return {
      first: first ? first.textContent.trim().slice(0, 24) : '',
      cards: document.querySelectorAll('#tour-list .tour-card').length,
      total: countText ? Number(countText[1].replace(/,/g, '')) : null,
    };
  });

  await page.waitForFunction(() => typeof window.__pushNext === 'function', null, { timeout: 60000 });
  await page.getByRole('button', { name: 'AI 调节', exact: true }).click();
  const trail = [];
  let previousOutputChars = 0;
  // 逐条推送，观察每次增量到达后的界面状态。
  for (let step = 0; step < 6; step += 1) {
    await page.waitForFunction(() => typeof window.__pushNext === 'function', null, { timeout: 60000 });
    await page.evaluate(() => window.__pushNext());
    await page.waitForTimeout(1100);
    trail.push(await snapshot());
    await page.locator('.tour-card').filter({ hasText: '流式稳定性测试第 1 条理由' }).first().waitFor();
    const output = await page.getByRole('button', { name: /正在生成结果.*已输出/ }).innerText();
    const chars = Number(output.match(/已输出\s*(\d+)\s*字/)?.[1]);
    assert.ok(chars > previousOutputChars, `正文计数应递增：${previousOutputChars} → ${chars}`);
    previousOutputChars = chars;
    assert.ok(await page.getByText('AI 已挑出部分线路', { exact: true }).first().isVisible(), '条目到达后不能倒退到思考阶段');
  }

  // 统计不能抖动：整个流式过程中「共 N 条」必须始终是同一个数。
  const totals = new Set(trail.map((s) => s.total));
  assert.equal(totals.size, 1, `result count must stay stable during streaming, saw ${[...totals].join(' → ')}`);

  // 列表不能被重置：卡片数不能出现"变少再变多"（重置回初始分片就会这样）。
  for (let index = 1; index < trail.length; index += 1) {
    assert.ok(
      trail[index].cards >= trail[index - 1].cards,
      `list must not shrink mid-stream (${trail[index - 1].cards} → ${trail[index].cards})`,
    );
  }

  // 首条标题：一旦首条推荐出现，后续增量只能把它往前插，不能整批换掉。
  const firsts = trail.map((s) => s.first);
  assert.ok(new Set(firsts).size <= 2, `list must not reshuffle on every chunk, saw ${new Set(firsts).size} different top cards`);

  await page.evaluate(() => window.__pushNext());
  await page.waitForFunction(() => window.__stream.finished === true, null, { timeout: 30000 });
  await page.waitForTimeout(1200);
  const final = await snapshot();
  assert.ok(final.total > 0, '正式结果恢复页面筛选后仍应有长尾结果');
  await page.waitForTimeout(1100);
  assert.equal((await snapshot()).total, final.total, '正式结果计数应稳定');
  assert.deepEqual(errors, [], `no runtime errors: ${errors.join(' | ')}`);

  console.info(`PASS: 流式期间统计恒为 ${[...totals][0]} 条，列表未重置，首条仅变化 ${new Set(firsts).size - 1} 次`);
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
