import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const baseURL = process.env.UI_TEST_URL || 'http://127.0.0.1:5173';
const browser = await chromium.launch({ headless: true });
const results = [];
await mkdir('output/ui-refresh', { recursive: true });
try {
  for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }, { width: 320, height: 740 }]) {
    const page = await browser.newPage({ viewport, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(baseURL, { waitUntil: 'domcontentloaded' });
    await page.locator('.tour-card').first().waitFor();
    const search = page.getByRole('searchbox', { name: '目的地或旅行需求' });
    await assert.doesNotReject(() => search.waitFor());
    assert.equal(await page.getByRole('button', { name: 'AI 找团', exact: true }).isDisabled(), true);
    assert.equal(await page.getByText('来源平台', { exact: true }).isVisible(), false, 'advanced filters collapsed by default');
    const more = page.getByRole('button', { name: '更多筛选', exact: true });
    await more.click();
    await page.getByText('来源平台', { exact: true }).waitFor();
    if (viewport.width < 768) {
      await page.getByRole('button', { name: /查看 .* 条线路/ }).click();
      await page.getByRole('dialog').waitFor({ state: 'hidden' });
    } else {
      assert.equal(await more.getAttribute('aria-expanded'), 'true');
      await more.click();
      assert.equal(await more.getAttribute('aria-expanded'), 'false');
    }
    await search.fill('云南');
    await page.getByRole('button', { name: '清空搜索', exact: true }).click();
    await assert.doesNotReject(() => search.evaluate((el) => { if (document.activeElement !== el) throw new Error('clear should restore input focus'); }));
    await search.fill('广东');
    await search.press('Enter');
    await page.getByText('正在查找：', { exact: false }).waitFor();
    await page.getByRole('button', { name: '清除搜索', exact: true }).click();
    assert.equal(await search.inputValue(), '');
    await page.locator('.tour-card').first().waitFor();
    const favorite = page.locator('.tour-card').first().getByRole('button', { name: '收藏线路', exact: true });
    await favorite.click();
    const saved = page.locator('.tour-card').first().getByRole('button', { name: '取消收藏', exact: true });
    assert.equal(await saved.getAttribute('aria-pressed'), 'true');
    await saved.click();
    const title = page.locator('.tour-card h3 button').first();
    await title.focus();
    await page.keyboard.press('Enter');
    await page.getByRole('dialog').waitFor();
    await page.keyboard.press('Escape');
    await page.getByRole('dialog').waitFor({ state: 'hidden' });
    await search.fill('qzxvplm');
    await search.press('Enter');
    await page.getByRole('button', { name: '清除搜索，浏览全部' }).waitFor();
    await page.getByRole('button', { name: '清除搜索，浏览全部' }).click();
    await page.locator('.tour-card').first().waitFor();
    const dimensions = await page.evaluate(() => ({ client: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
    assert.ok(dimensions.scroll <= dimensions.client, `no horizontal overflow: ${JSON.stringify(dimensions)}`);
    assert.deepEqual(errors, [], 'no browser runtime errors');
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: `output/ui-refresh/home-${viewport.width}.png` });
    results.push({ viewport, passed: true, checks: ['collapsed filters', 'filter toggle/sheet', 'empty AI disabled', 'clear input focus', 'search and reset', 'favorite aria state', 'keyboard detail and escape', 'empty state recovery', 'no horizontal overflow', 'no runtime errors'] });
    await page.close();
  }
  await writeFile('output/ui-refresh/results.json', JSON.stringify({ baseURL, results }, null, 2));
  console.log(JSON.stringify({ passed: true, results }, null, 2));
} finally {
  await browser.close();
}
