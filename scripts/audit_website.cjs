// ???????????????????????????????
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000/EverywhereWeGoGz/';
const AUDIT_DIR = path.join(__dirname, '..', 'audit');

async function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

async function captureScreenshot(page, name, viewport = null) {
  if (viewport) await page.setViewportSize(viewport);
  const filePath = path.join(AUDIT_DIR, `${name}.png`);
  await page.screenshot({ path: filePath, fullPage: true });
  console.log(`Screenshot saved: ${filePath}`);
  return filePath;
}

async function runAudit() {
  await ensureDir(AUDIT_DIR);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  // Collect console errors
  const consoleErrors = [];
  const consoleWarnings = [];
  page.on('console', msg => {
    const text = msg.text();
    if (msg.type() === 'error') consoleErrors.push(text);
    if (msg.type() === 'warning') consoleWarnings.push(text);
  });
  page.on('pageerror', err => consoleErrors.push(err.message));

  // 1. Desktop Home Page
  console.log('Loading desktop home page...');
  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);
  await captureScreenshot(page, '01_desktop_home');

  // 2. Scroll down to see product cards
  console.log('Scrolling to product cards...');
  await page.evaluate(() => window.scrollTo(0, 600));
  await page.waitForTimeout(1000);
  await captureScreenshot(page, '02_desktop_products');

  // 3. Scroll further to see more products
  console.log('Scrolling further...');
  await page.evaluate(() => window.scrollTo(0, 1200));
  await page.waitForTimeout(1000);
  await captureScreenshot(page, '03_desktop_products_more');

  // 4. Click on a product card to see detail modal
  console.log('Clicking product card...');
  const productCards = await page.locator('[class*="card"], [class*="product"], article, .group').all();
  let clicked = false;
  for (const card of productCards.slice(0, 5)) {
    try {
      await card.click({ timeout: 3000 });
      await page.waitForTimeout(2000);
      await captureScreenshot(page, '04_desktop_detail_modal');
      clicked = true;
      break;
    } catch (e) {
      // try next
    }
  }
  if (!clicked) {
    console.log('Could not click product card, trying other selectors...');
    const allClickable = await page.locator('button, a, [role="button"]').all();
    for (const el of allClickable.slice(0, 10)) {
      try {
        await el.click({ timeout: 2000 });
        await page.waitForTimeout(1500);
        await captureScreenshot(page, '04_desktop_detail_modal');
        clicked = true;
        break;
      } catch (e) {}
    }
  }

  // Close modal if possible
  try {
    const closeBtn = await page.locator('button:has-text("关闭"), button:has-text("Close"), [aria-label="close"], .close, button svg').first();
    await closeBtn.click({ timeout: 2000 });
    await page.waitForTimeout(500);
  } catch (e) {}

  // 5. Test filters
  console.log('Testing filters...');
  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1500);

  // Find and click filter buttons
  const filterButtons = await page.locator('button').all();
  for (const btn of filterButtons.slice(0, 8)) {
    const text = await btn.textContent().catch(() => '');
    if (text && (text.includes('全部') || text.includes('筛选') || text.includes('Filter') || text.includes('出发') || text.includes('天数'))) {
      try {
        await btn.click({ timeout: 2000 });
        await page.waitForTimeout(1000);
        await captureScreenshot(page, '05_desktop_filter_panel');
        break;
      } catch (e) {}
    }
  }

  // 6. Mobile viewport - Home
  console.log('Testing mobile viewport...');
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);
  await captureScreenshot(page, '06_mobile_home', { width: 375, height: 812 });

  // Mobile scroll
  await page.evaluate(() => window.scrollTo(0, 500));
  await page.waitForTimeout(1000);
  await captureScreenshot(page, '07_mobile_products', { width: 375, height: 812 });

  // Mobile scroll more
  await page.evaluate(() => window.scrollTo(0, 1000));
  await page.waitForTimeout(1000);
  await captureScreenshot(page, '08_mobile_products_more', { width: 375, height: 812 });

  // Mobile click product
  console.log('Clicking product on mobile...');
  const mobileCards = await page.locator('[class*="card"], [class*="product"], article, .group').all();
  for (const card of mobileCards.slice(0, 5)) {
    try {
      await card.click({ timeout: 3000 });
      await page.waitForTimeout(2000);
      await captureScreenshot(page, '09_mobile_detail', { width: 375, height: 812 });
      break;
    } catch (e) {}
  }

  // Close modal
  try {
    const closeBtn = await page.locator('button:has-text("关闭"), button:has-text("Close"), [aria-label="close"], .close').first();
    await closeBtn.click({ timeout: 2000 });
  } catch (e) {}

  // Mobile filter test
  console.log('Testing mobile filters...');
  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1500);
  const mobileFilterBtns = await page.locator('button').all();
  for (const btn of mobileFilterBtns.slice(0, 8)) {
    const text = await btn.textContent().catch(() => '');
    if (text && (text.includes('全部') || text.includes('筛选') || text.includes('Filter') || text.includes('出发') || text.includes('天数'))) {
      try {
        await btn.click({ timeout: 2000 });
        await page.waitForTimeout(1000);
        await captureScreenshot(page, '10_mobile_filter', { width: 375, height: 812 });
        break;
      } catch (e) {}
    }
  }

  // 7. Test scroll loading
  console.log('Testing infinite scroll...');
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1500);
  const initialCount = await page.locator('[class*="card"], [class*="product"], article').count();
  console.log(`Initial product count: ${initialCount}`);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(2500);
  const afterScrollCount = await page.locator('[class*="card"], [class*="product"], article').count();
  console.log(`After scroll product count: ${afterScrollCount}`);
  await captureScreenshot(page, '11_scroll_load');

  // 8. Extract data for accuracy check
  console.log('Extracting product data...');
  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1500);
  const products = await page.evaluate(() => {
    const cards = document.querySelectorAll('[class*="card"], [class*="product"], article');
    const data = [];
    cards.forEach((card, i) => {
      if (i >= 20) return;
      const title = card.querySelector('h3, h4, [class*="title"], [class*="name"]')?.textContent?.trim() || '';
      const price = card.querySelector('[class*="price"], .price')?.textContent?.trim() || '';
      const days = card.querySelector('[class*="day"], [class*="duration"]')?.textContent?.trim() || '';
      const date = card.querySelector('[class*="date"], [class*="depart"]')?.textContent?.trim() || '';
      const singleRoom = card.querySelector('[class*="single"], [class*="room"]')?.textContent?.trim() || '';
      data.push({ title, price, days, date, singleRoom });
    });
    return data;
  });

  fs.writeFileSync(path.join(AUDIT_DIR, 'product_data.json'), JSON.stringify(products, null, 2));
  console.log(`Extracted ${products.length} products`);

  // Save console errors
  fs.writeFileSync(path.join(AUDIT_DIR, 'console_errors.json'), JSON.stringify({ errors: consoleErrors, warnings: consoleWarnings }, null, 2));
  console.log(`Console errors: ${consoleErrors.length}, warnings: ${consoleWarnings.length}`);

  await browser.close();
  console.log('Audit complete!');
}

runAudit().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
