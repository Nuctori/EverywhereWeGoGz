// 复现线上两个症状：1) 破图统计 2) 触底加载是否停不下来
const { chromium } = require('playwright');

const SITE = 'https://nuctori.github.io/EverywhereWeGoGz/';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  const pageFetches = [];
  const failedRequests = [];
  const consoleErrors = [];
  page.on('request', (req) => {
    const u = req.url();
    if (u.includes('tours-page-')) pageFetches.push({ url: u.slice(u.lastIndexOf('tours-page-'), u.lastIndexOf('tours-page-') + 30), t: Date.now() });
  });
  page.on('requestfailed', (req) => {
    failedRequests.push({ url: req.url().slice(0, 140), err: req.failure()?.errorText });
  });
  page.on('response', (res) => {
    if (res.status() >= 400) failedRequests.push({ url: res.url().slice(0, 140), err: `HTTP ${res.status()}` });
  });
  page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text().slice(0, 200)); });

  await page.goto(SITE, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(8000);

  const cardCount = () => page.locator('.grid img').count();
  const brokenImgs = () => page.evaluate(() => {
    const imgs = [...document.querySelectorAll('.grid img')];
    return {
      total: imgs.length,
      broken: imgs.filter((i) => i.complete && i.naturalWidth === 0).length,
      brokenSrcs: imgs.filter((i) => i.complete && i.naturalWidth === 0).slice(0, 12).map((i) => i.src.slice(0, 150)),
    };
  });

  console.log('== after load ==');
  console.log('cards:', await cardCount(), JSON.stringify(await brokenImgs()));

  // 连续滚到底 40 轮，观察加载是否终止
  let stagnantRounds = 0;
  let lastCards = -1;
  for (let round = 1; round <= 40; round++) {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(2500);
    const n = await cardCount();
    const loadMoreVisible = await page.locator('text=正在加载更多').count();
    const scrollHint = await page.locator('text=向下滚动加载更多').count();
    const allLoaded = await page.locator('text=已加载全部').count();
    if (round % 5 === 0 || n !== lastCards) {
      console.log(`round ${round}: cards=${n} loading=${loadMoreVisible > 0} hint=${scrollHint > 0} allLoaded=${allLoaded > 0} pageFetches=${pageFetches.length}`);
    }
    if (n === lastCards && allLoaded === 0 && loadMoreVisible === 0) stagnantRounds++;
    else stagnantRounds = 0;
    lastCards = n;
    if (allLoaded > 0) { console.log(`TERMINATED at round ${round}, cards=${n}`); break; }
    if (stagnantRounds >= 4) { console.log(`STAGNANT (no growth, no allLoaded marker) at round ${round}, cards=${n}`); break; }
  }

  console.log('== final ==');
  console.log('cards:', await cardCount());
  console.log('page fetches:', pageFetches.length);
  const uniqPages = [...new Set(pageFetches.map((f) => f.url))];
  console.log('unique page files requested:', uniqPages.length, uniqPages.slice(0, 8));
  console.log('failed requests:', failedRequests.length);
  failedRequests.slice(0, 20).forEach((f) => console.log('  FAIL', f.err, f.url));
  console.log('console errors:', consoleErrors.length);
  consoleErrors.slice(0, 10).forEach((e) => console.log('  ERR', e));

  const finalBroken = await brokenImgs();
  console.log('final broken imgs:', finalBroken.total ? `${finalBroken.broken}/${finalBroken.total}` : '0/0');
  finalBroken.brokenSrcs.forEach((s) => console.log('  BROKEN', s));

  await browser.close();
})().catch((e) => { console.error('SCRIPT FAIL', e); process.exit(1); });
