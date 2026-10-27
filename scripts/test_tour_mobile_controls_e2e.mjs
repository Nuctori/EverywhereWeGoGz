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
  const page = await browser.newPage({ viewport: { width: 360, height: 844 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}/EverywhereWeGoGz/`);
  await page.locator('.tour-card h3').first().waitFor({ timeout: 60000 });
  for (const width of [360, 390, 430, 767]) {
    await page.setViewportSize({ width, height: 844 });
    const header = page.getByTestId('mobile-route-header');
    await header.waitFor();
    const box = await header.boundingBox();
    assert.ok(box.height <= 52, `compact title row ${width}: ${box.height}`);
    const section = page.getByTestId('tour-results');
    const gap = await section.evaluate(el => el.querySelector('.tour-card').getBoundingClientRect().top - el.getBoundingClientRect().top);
    assert.ok(gap <= 240, `controls before first card ${width}: ${gap}`);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'no page overflow');
  }
  await page.getByRole('button', { name: /^筛选(?: · \d+)?$/ }).click();
  const dialog = page.getByRole('dialog', { name: '更多筛选', exact: true });
  await dialog.waitFor();
  await dialog.getByRole('button', { name: '500元以下', exact: true }).click();
  await dialog.getByRole('button', { name: /^查看 .* 条线路$/ }).click();
  await dialog.waitFor({ state: 'hidden' });
  assert.ok(await page.getByRole('button', { name: /^筛选 · / }).isVisible(), 'active filters remain discoverable');
  await page.setViewportSize({ width: 1200, height: 900 });
  await page.getByText('按你的节奏选', { exact: true }).waitFor();
  assert.equal(await page.getByTestId('mobile-route-header').count(), 0);
  assert.deepEqual(errors, []);
  console.log('PASS compact mobile route controls at 360/390/430/767px, no overflow, filter action, desktop unchanged');
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
