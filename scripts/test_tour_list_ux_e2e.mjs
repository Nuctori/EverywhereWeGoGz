// Run against a Pages build: node scripts/test_tour_list_ux_e2e.mjs [dist-dir]
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { chromium, expect } from '@playwright/test';

const root = path.resolve(process.argv[2] || 'dist');
const base = '/EverywhereWeGoGz/';
const fixtureVersion = process.env.GITHUB_SHA || 'ux-e2e';
const mime = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.webp': 'image/webp' };
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const relative = url.pathname.startsWith(base) ? url.pathname.slice(base.length) : url.pathname.slice(1);
  const file = path.resolve(root, relative || 'index.html');
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    res.writeHead(404).end();
    return;
  }
  res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
  fs.createReadStream(file).on('error', () => res.destroy()).pipe(res);
});
let origin;
let browser;
before(async () => {
  assert.ok(fs.existsSync(path.join(root, 'index.html')), `Build the site first: ${root}`);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  origin = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch();
});
after(async () => {
  await browser?.close();
  if (server.listening) await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
});

async function fixture(t, width, fail = () => false, intercept = () => null, seed, query = '') {
  const context = await browser.newContext({ viewport: { width, height: 844 }, serviceWorkers: 'block' });
  t.after(() => context.close());
  if (seed) await context.addInitScript(state => {
    localStorage.setItem('travel-ai-chat-state-v2', JSON.stringify(state));
  }, seed);
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await context.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.origin !== origin) return route.abort();
    if (fail(url.pathname)) return route.fulfill({ status: 503, json: { error: 'temporarily unavailable' } });
    const response = await intercept(url.pathname);
    return response ? route.fulfill({ json: response }) : route.continue();
  });
  await page.goto(origin + base + query, { waitUntil: 'domcontentloaded' });
  return { page, list: page.locator('#tour-list'), errors };
}

test('手机首片由 HTML 预加载并复用，地图点击才下载', async t => {
  const requests = [];
  const { page, list } = await fixture(t, 390, pathname => { requests.push(pathname); return false; });
  const preload = page.locator('link[rel="preload"][as="fetch"][href*="tours-page-0.json"]');
  await expect(preload).toHaveCount(1);
  await expect(preload).toHaveAttribute('href', `${base}data/tours-page-0.json?v=${fixtureVersion}`);
  await expect(list.locator('.tour-card h3').first()).toBeVisible();
  assert.equal(requests.filter(url => url.endsWith('/tours-page-0.json')).length, 1);
  assert.ok(!requests.some(url => /\/MapView-/.test(url)));
  await page.getByRole('button', { name: '打开目的地地图' }).click();
  await expect(page.getByRole('button', { name: '关闭地图' })).toBeVisible();
  assert.ok(requests.some(url => /\/MapView-.*\.js$/.test(url)));
});

test('桌面进入视口后加载内嵌地图', async t => {
  const { page } = await fixture(t, 1440);
  await expect(page.getByRole('complementary', { name: '在地图上探索目的地' }).getByRole('button', { name: '放大', exact: true })).toBeVisible();
});

test('地图分包失败仍可浏览线路', async t => {
  const { page, list, errors } = await fixture(t, 390, pathname => /\/MapView-.*\.js$/.test(pathname));
  await expect(list.locator('.tour-card h3').first()).toBeVisible();
  await page.getByRole('button', { name: '打开目的地地图' }).click();
  await expect(page.getByText('地图暂时无法加载')).toBeVisible();
  await expect(list.locator('.tour-card h3').first()).toBeVisible();
  assert.deepEqual(errors, []);
});

test('冷启动首片优先且不请求 AI 分包，早搜等待完整目录', async t => {
  const requests = [];
  let release;
  const indexBlocked = new Promise(resolve => { release = resolve; });
  t.after(release);
  const { page, list } = await fixture(t, 390, pathname => {
    requests.push(pathname);
    return false;
  }, pathname => pathname.endsWith('/tours-index.json') ? indexBlocked : null);
  const search = page.getByRole('searchbox', { name: '目的地或旅行需求' });
  await expect(list.locator('.tour-card h3').first()).toBeVisible();
  assert.ok(!requests.some(p => /AiRecommendPanel|ai-recommendation/.test(p)));
  await expect.poll(() => requests.findIndex(p => p.endsWith('/tours-index.json'))).toBeGreaterThan(requests.findIndex(p => p.endsWith('/tours-page-0.json')));
  await search.fill('zzqvx');
  await page.getByRole('button', { name: '搜索线路', exact: true }).click();
  await expect(list.getByText('正在准备完整目录…')).toBeVisible();
  await expect(list.getByText('没有找到直接匹配的旅行团')).toHaveCount(0);
  release();
  await expect(list.getByText('没有找到直接匹配的旅行团')).toBeVisible({ timeout: 20000 });
});

test('AI 分包加载失败不影响普通浏览和搜索', async t => {
  const { page, list, errors } = await fixture(t, 390, pathname => /\/(AiRecommendPanel|ai-recommendation)-.*\.js$/.test(pathname));
  await expect(list.locator('.tour-card h3').first()).toBeVisible();
  const search = page.getByRole('searchbox', { name: '目的地或旅行需求' });
  await search.fill('zzqvx');
  await page.getByRole('button', { name: 'AI 帮我挑' }).click();
  await expect(list.getByText('AI 功能暂时无法加载，仍可普通找团。')).toBeVisible();
  await expect(list.locator('.tour-card h3').first()).toBeVisible();
  await page.getByRole('button', { name: '搜索线路', exact: true }).click();
  await expect(list.getByText('没有找到直接匹配的旅行团')).toBeVisible();
  assert.deepEqual(errors, []);
});

for (const withIndex of [true, false]) {
  test(`目录双源故障显示重试并在恢复后返回结果（索引${withIndex ? '成功' : '失败'}）`, async t => {
    let failed = true;
    const { list, errors } = await fixture(t, 390, pathname => failed && (
      /\/tours-(page-\d+|list)\.json$/.test(pathname) || (!withIndex && pathname.endsWith('/tours-index.json'))
    ));
    await expect(list.getByRole('alert').getByText('暂时无法加载旅行线路')).toBeVisible();
    await expect(list.getByText(/没有找到|^共\s/)).toHaveCount(0);
    const retry = list.getByRole('button', { name: '重试加载线路' });
    await retry.click();
    await expect(retry).toBeVisible();
    failed = false;
    await retry.click();
    await expect(list.locator('.tour-card h3').first()).toBeVisible({ timeout: 20000 });
    await expect(list.getByRole('alert')).toHaveCount(0);
    assert.deepEqual(errors, []);
  });
}

test('首片失败时保留全量目录兜底，以及真正的搜索空态', async t => {
  const { page, list, errors } = await fixture(t, 1440, pathname => pathname.endsWith('/tours-page-0.json'));
  await expect(list.locator('.tour-card h3').first()).toBeVisible({ timeout: 20000 });
  await expect(list.getByRole('alert')).toHaveCount(0);
  const search = page.getByRole('searchbox', { name: '目的地或旅行需求' });
  await search.fill('zzqvx');
  await page.getByRole('button', { name: '搜索线路', exact: true }).click();
  await expect(list.getByText('没有找到直接匹配的旅行团')).toBeVisible();
  await expect(list.getByRole('alert')).toHaveCount(0);
  assert.deepEqual(errors, []);
});

for (const fault of ['503', 'empty', 'truncated']) {
  test(`目录索引 ${fault} 不误报零结果并可恢复`, async t => {
    let broken = true;
    const isIndex = pathname => pathname.endsWith('/tours-index.json');
    const index = JSON.parse(fs.readFileSync(path.join(root, 'data/tours-index.json'), 'utf8'));
    const { page, list } = await fixture(t, 390,
      pathname => broken && fault === '503' && isIndex(pathname),
      pathname => broken && isIndex(pathname) ? (fault === 'empty' ? [] : index.slice(0, 1)) : null);
    await expect(list.locator('.tour-card h3').first()).toBeVisible();
    await page.getByRole('searchbox').fill('zzqvx');
    await page.getByRole('button', { name: '搜索线路', exact: true }).click();
    await expect(list.getByRole('alert')).toContainText('暂时无法加载完整目录');
    await expect(list.getByText('没有找到直接匹配的旅行团')).toHaveCount(0);
    broken = false;
    await list.getByRole('button', { name: '重试加载目录' }).click();
    await expect(list.getByText('没有找到直接匹配的旅行团')).toBeVisible();
  });
}

function stalePageFixture(root) {
  const page0 = JSON.parse(fs.readFileSync(path.join(root, 'data/tours-page-0.json'), 'utf8'));
  return (n, totalPages, available = false) => {
    const date = available ? '2099-12-20' : '2000-01-01';
    const items = page0.items.map((tour, i) => ({
      ...tour, title: '测试旅行团', id: `ux_${n}_${i}`, departureDate: date, departureDates: [date], hotDepartureDates: [date],
    }));
    return { meta: { page: n, pageSize: 24, total: totalPages * 24 }, items };
  };
}

test('前片无可用线路时优先下一片，不抢跑索引', async t => {
  const buildPage = stalePageFixture(root);
  let release;
  const delayedPage = new Promise(resolve => { release = () => resolve(buildPage(1, 2, true)); });
  t.after(release);
  let nextRequested = false;
  let indexRequested = false;
  const { list } = await fixture(t, 390, pathname => {
    if (pathname.endsWith('/tours-index.json')) indexRequested = true;
    return false;
  }, pathname => {
    if (pathname.endsWith('/tours-page-0.json')) return buildPage(0, 2);
    if (pathname.endsWith('/tours-page-1.json')) { nextRequested = true; return delayedPage; }
    return null;
  });
  await expect.poll(() => nextRequested).toBe(true);
  // Hold the next shard beyond the old 100 ms timer.
  await new Promise(resolve => setTimeout(resolve, 300));
  assert.equal(indexRequested, false);
  release();
  await expect(list.locator('.tour-card h3').first()).toBeVisible();
  await expect.poll(() => indexRequested).toBe(true);
});

for (const withAvailable of [true, false]) {
  test(`前两片全过期后${withAvailable ? '显示第三片可用线路' : '耗尽后显示真空态'}`, async t => {
    const requested = [];
    const buildPage = stalePageFixture(root);
    const { list, errors } = await fixture(t, 390, pathname => pathname.endsWith('/tours-index.json'), pathname => {
      const match = pathname.match(/\/tours-page-(\d+)\.json$/);
      if (!match) return null;
      const n = Number(match[1]);
      requested.push(n);
      return buildPage(n, 3, n === 2 && withAvailable);
    });
    if (withAvailable) {
      await expect(list.locator('.tour-card h3').first()).toHaveText('测试旅行团');
      await expect(list.getByText('没有找到符合条件的旅行团')).toHaveCount(0);
    } else {
      await expect.poll(() => requested).toEqual([0, 1, 2]);
      await expect(list.getByText('没有找到符合条件的旅行团')).toBeVisible();
    }
    assert.deepEqual(requested, [0, 1, 2]);
    assert.deepEqual(errors, []);
  });
}

test('自动检查有上限，后续分片失败时可重试', async t => {
  const requested = [];
  let laterPageFailed = true;
  const buildPage = stalePageFixture(root);
  const { list, errors } = await fixture(t, 390, pathname => {
    if (laterPageFailed && pathname.endsWith('/tours-page-4.json')) {
      requested.push(4);
      return true;
    }
    return false;
  }, pathname => {
    const match = pathname.match(/\/tours-page-(\d+)\.json$/);
    if (!match) return null;
    const n = Number(match[1]);
    requested.push(n);
    return buildPage(n, 5, n === 4);
  });
  const more = list.getByRole('button', { name: '继续查看线路' });
  await expect(more).toBeEnabled();
  assert.deepEqual(requested, [0, 1, 2, 3]);
  await more.click();
  await expect(list.getByText('后续线路暂时无法加载。')).toBeVisible();
  laterPageFailed = false;
  await list.getByRole('button', { name: '重试加载线路' }).click();
  await more.click();
  await expect(list.locator('.tour-card h3').first()).toHaveText('测试旅行团');
  assert.deepEqual(requested, [0, 1, 2, 3, 4, 0, 1, 2, 3, 4]);
  assert.deepEqual(errors, []);
});

test('慢索引的冲突深链不会打开首片里的旧 ID', async t => {
  const index = JSON.parse(fs.readFileSync(path.join(root, 'data/tours-index.json'), 'utf8'));
  const first = index.find(tour => tour.page === 0 && tour.sourceId);
  const target = index.find(tour => tour.page > 0 && tour.sourceId && tour.sourceId !== first.sourceId);
  assert.ok(first && target);
  let release;
  const held = new Promise(resolve => { release = () => resolve(index); });
  t.after(release);
  const query = new URLSearchParams({ tour: first.id, sourceId: target.sourceId });
  const { page, list } = await fixture(t, 1440, undefined,
    pathname => pathname.endsWith('/tours-index.json') ? held : null, undefined, `?${query}`);
  await expect(list.locator('.tour-card h3').first()).toBeVisible();
  await expect(page.getByRole('dialog', { name: first.title, exact: true })).toHaveCount(0);
  release();
  await expect(page.getByRole('dialog', { name: target.title, exact: true })).toBeVisible({ timeout: 20000 });
});

for (const width of [390, 1440]) {
  test(`${width}px 保留首片以外的详情分享链接`, async t => {
    const index = JSON.parse(fs.readFileSync(path.join(root, 'data/tours-index.json'), 'utf8'));
    const target = index.find(tour => tour.page > 0 && tour.sourceId && tour.title);
    assert.ok(target);
    const query = width === 390
      ? new URLSearchParams({ tour: target.id })
      : new URLSearchParams({ tour: index[0].id, sourceId: target.sourceId });
    const { page, errors } = await fixture(t, width, undefined, undefined, undefined, `?${query}`);
    const dialog = page.getByRole('dialog', { name: target.title, exact: true });
    await expect(dialog).toBeVisible({ timeout: 20000 });
    await expect(dialog.getByRole('button', { name: '分享线路' })).toBeVisible();
    assert.deepEqual(errors, []);
  });
}

for (const version of [fixtureVersion, 'obsolete-release', undefined]) {
  test(`普通搜索独立于已恢复的 AI 推荐（${version ?? '无版本'}）`, async t => {
    const page0 = JSON.parse(fs.readFileSync(path.join(root, 'data/tours-page-0.json'), 'utf8'));
    assert.ok(page0.items[0]?.id);
    const generatedAt = new Date().toISOString();
    const reason = '这条旧推荐不应该覆盖普通搜索';
    const { page, list, errors } = await fixture(t, 1440, undefined, undefined, {
      catalogVersion: version,
      input: '历史草稿',
      result: {
        conversationId: 'ux-prior-ai', summary: reason, generatedAt, source: 'ai-api',
        items: [{ tourId: page0.items[0].id, score: 95, reason, matchedSignals: [] }],
      },
    });
    await expect(list.locator('.tour-card h3').first()).toBeVisible({ timeout: 20000 });
    const recommendation = list.locator('.tour-card').getByText(reason, { exact: false });
    if (version === fixtureVersion) await expect(recommendation).toBeVisible();
    else {
      await expect(list.getByText(reason, { exact: false })).toHaveCount(0);
      await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('travel-ai-chat-state-v2')).input)).toBe('历史草稿');
    }
    const search = page.getByRole('searchbox', { name: '目的地或旅行需求' });
    await search.fill('zzqvx');
    await page.getByRole('button', { name: '搜索线路', exact: true }).click();
    await expect(list.getByText('没有找到直接匹配的旅行团')).toBeVisible();
    await expect(recommendation).toHaveCount(0);
    assert.deepEqual(errors, []);
  });
}

for (const width of [390, 1440]) {
  test(`${width}px 已选筛选可以用键盘移除并保留焦点`, async t => {
    const { page, list, errors } = await fixture(t, width);
    await expect(list.locator('.tour-card h3').first()).toBeVisible({ timeout: 20000 });
    if (width === 390) await list.getByRole('button', { name: '筛选', exact: true }).click();
    const filters = width === 390 ? page.getByRole('dialog', { name: '更多筛选' }) : list;
    const destination = filters.locator('button[aria-pressed]').first();
    await destination.click();
    await filters.getByRole('button', { name: '3天内', exact: true }).click();
    if (width === 390) await filters.getByRole('button', { name: /查看 .* 条线路/ }).click();
    const remove = list.getByRole('button', { name: /^移除目的地筛选：/ });
    const removeDate = list.getByRole('button', { name: /移除出发时间筛选/ });
    await expect(remove).toBeVisible();
    const box = await remove.boundingBox();
    assert.ok(box.width >= 44 && box.height >= 44, `touch target too small: ${JSON.stringify(box)}`);
    await remove.focus();
    await page.keyboard.press('Enter');
    await expect(remove).toHaveCount(0);
    await expect(removeDate).toBeFocused();
    await page.keyboard.press('Space');
    await expect(removeDate).toHaveCount(0);
    await expect(list.getByRole('combobox', { name: '线路排序' })).toBeFocused();
    assert.deepEqual(errors, []);
  });
}
