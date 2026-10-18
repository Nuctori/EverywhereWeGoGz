// AI 面板布局回归：守「卡片太巨大」「与下方提示冗余」「空框」这三个已修过的问题。
// 断言用户能观察到的东西：占用高度、步骤单行、同屏不重复、没有孤立空气泡。
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

// 从面板标题元素向上找到带 mb-4 的外层卡片，量它的高度；
// 文字节点可能被拆进多个 span，所以按 textContent 包含匹配而不是整串相等。
const PANEL_HEIGHT = () => {
  const title = [...document.querySelectorAll('div, span')]
    .filter((n) => (n.textContent || '').includes('AI 优先级助手'))
    .pop();
  if (!title) return null;
  let node = title;
  for (let depth = 0; depth < 10 && node; depth += 1) {
    if (String(node.className || '').includes('mb-4')) return Math.round(node.getBoundingClientRect().height);
    node = node.parentElement;
  }
  return null;
};

const browser = await chromium.launch({ headless: true });
try {
  for (const viewport of [{ width: 1280, height: 863, label: '桌面' }, { width: 390, height: 844, label: '手机' }]) {
    const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height } });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(`http://127.0.0.1:${server.address().port}/EverywhereWeGoGz/`);
    await page.locator('.tour-card h3').first().waitFor({ timeout: 60000 });
    await page.locator('input').first().fill('便宜的奔县游');
    await page.getByRole('button', { name: 'AI 帮我挑' }).first().click();
    await page.waitForTimeout(2500);

    const collapsed = await page.evaluate(PANEL_HEIGHT);
    assert.ok(collapsed !== null, `${viewport.label}: panel must render`);
    // 旧实现：标题卡 + 状态卡 + 自动展开的阶段拆解，桌面实测 500+，手机更高。
    assert.ok(collapsed <= 260, `${viewport.label}: collapsed panel must stay compact, got ${collapsed}px`);

    // 同屏不重复：AI 模式下面板已说明本轮需求，下面不该再出现「正在查找：xxx」条。
    const text = await page.evaluate(() => document.body.innerText);
    assert.equal((text.match(/正在查找/g) || []).length, 0, `${viewport.label}: search prompt must not be repeated below the panel`);

    // 没有孤立空气泡：请求进行中只有用户消息，不该渲染出对话框。
    const strayBubbles = await page.evaluate(() =>
      [...document.querySelectorAll('div')]
        .filter((n) => String(n.className || '').includes('max-h-56'))
        .filter((n) => (n.innerText || '').trim().length === 0).length,
    );
    assert.equal(strayBubbles, 0, `${viewport.label}: no empty chat box while the request runs`);

    await page.getByRole('button', { name: /AI 调节/ }).first().click();
    await page.waitForTimeout(700);
    const expanded = await page.evaluate(PANEL_HEIGHT);
    assert.ok(expanded !== null && expanded > collapsed, `${viewport.label}: details must expand`);
    assert.ok(expanded <= 380, `${viewport.label}: expanded panel must stay reasonable, got ${expanded}px`);

    // 5 个步骤必须落在同一行（横向可滑动），而不是各占一行把面板撑高。
    const rows = await page.evaluate(() => {
      const ys = [...document.querySelectorAll('span')]
        .filter((s) => /^[1-5]$/.test((s.textContent || '').trim()))
        .map((s) => Math.round(s.getBoundingClientRect().y));
      return new Set(ys).size;
    });
    assert.equal(rows, 1, `${viewport.label}: progress steps must stay on one row, got ${rows} rows`);

    assert.deepEqual(errors, [], `${viewport.label}: no runtime errors`);
    console.info(`PASS ${viewport.label}: 收起 ${collapsed}px → 展开 ${expanded}px，步骤单行，无重复与空框`);
    await page.close();
  }
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
