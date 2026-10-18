// 首页搜索区的按钮高度回归。
// 曾经的问题：543px 这类宽度下按钮行变成 flex-col 竖排，
// 竖排时 flex-1 落在交叉轴上等于 auto，按钮高度塌回文字高度（实测 20px），
// 看起来像"按钮被压扁成一条"。这里直接量渲染出来的高度。
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
  // 覆盖竖排（<640）与横排（>=640）两段，543 是用户报障的宽度。
  for (const width of [390, 543, 640, 1024]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    await page.goto(`http://127.0.0.1:${server.address().port}/EverywhereWeGoGz/`);
    await page.getByRole('button', { name: /搜索线路|按需求找团/ }).first().waitFor({ timeout: 60000 });
    const measured = await page.evaluate(() =>
      [...document.querySelectorAll('form button')].map((button) => ({
        label: button.textContent.trim().slice(0, 8),
        height: Math.round(button.getBoundingClientRect().height),
        width: Math.round(button.getBoundingClientRect().width),
      })),
    );
    assert.equal(measured.length, 2, `${width}px: hero must keep both action buttons`);
    for (const button of measured) {
      assert.ok(button.height >= 44, `${width}px "${button.label}" collapsed to ${button.height}px (touch target must stay >=44px)`);
      assert.ok(button.width >= 240, `${width}px "${button.label}" is too narrow: ${button.width}px`);
    }
    console.info(`PASS ${width}px: ${measured.map((b) => `${b.label}=${b.height}px`).join(' / ')}`);
    await page.close();
  }
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
