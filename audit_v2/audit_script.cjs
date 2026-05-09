const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://nuctori.github.io/EverywhereWeGoGz/';
const OUT_DIR = path.resolve(__dirname);
const LOG_FILE = path.join(OUT_DIR, 'console_logs.json');

const VIEWPORTS = {
  desktop: { width: 1280, height: 800 },
  mobile: { width: 375, height: 812 },
};

const screenshots = [];
const consoleLogs = [];

function log(msg) {
  console.log(`[AUDIT] ${msg}`);
}

async function capture(page, name, fullPage = false) {
  const file = path.join(OUT_DIR, `${name}.png`);
  await page.screenshot({ path: file, fullPage });
  screenshots.push({ name, file: `${name}.png`, fullPage });
  log(`Screenshot: ${file}`);
}

async function auditDevice(browser, deviceName, viewport) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();

  page.on('console', (msg) => {
    const entry = {
      device: deviceName,
      type: msg.type(),
      text: msg.text(),
      location: msg.location(),
      time: new Date().toISOString(),
    };
    consoleLogs.push(entry);
    console.log(`[CONSOLE][${deviceName}][${msg.type()}] ${msg.text()}`);
  });

  page.on('pageerror', (err) => {
    const entry = {
      device: deviceName,
      type: 'pageerror',
      text: err.message,
      stack: err.stack,
      time: new Date().toISOString(),
    };
    consoleLogs.push(entry);
    console.log(`[PAGEERROR][${deviceName}] ${err.message}`);
  });

  log(`Opening ${BASE_URL} on ${deviceName}`);
  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(2000);

  // 1. Hero / first viewport
  await capture(page, `${deviceName}_01_hero`, false);

  // 2. Full page
  await capture(page, `${deviceName}_02_fullpage`, true);

  // 3. Scroll to product cards area and capture
  const hasCards = await page.locator('[class*="card"], .product-card, [class*="ProductCard"]').count() > 0;
  if (hasCards) {
    await page.locator('[class*="card"], .product-card, [class*="ProductCard"]').first().scrollIntoViewIfNeeded();
    await page.waitForTimeout(800);
    await capture(page, `${deviceName}_03_product_cards`, false);
  } else {
    // fallback scroll
    await page.evaluate(() => window.scrollBy(0, 600));
    await page.waitForTimeout(800);
    await capture(page, `${deviceName}_03_product_cards`, false);
  }

  // 4. Try to open filter panel
  const filterBtn = page.locator('button:has-text("筛选"), button:has-text("Filter"), [class*="filter"], [aria-label*="筛选"]').first();
  if (await filterBtn.isVisible().catch(() => false)) {
    await filterBtn.click();
    await page.waitForTimeout(1000);
    await capture(page, `${deviceName}_04_filter_panel`, false);
    // close filter via Escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  }

  // 5. Try to open product detail modal / navigate to detail
  const card = page.locator('[class*="card"], .product-card, [class*="ProductCard"]').first();
  if (await card.isVisible().catch(() => false)) {
    await card.click();
    await page.waitForTimeout(1500);
    await capture(page, `${deviceName}_05_product_detail`, false);
    // try close modal / go back
    // Close modal via Escape or overlay click
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    // If still open, click overlay
    const overlay = page.locator('[data-slot="dialog-overlay"]').first();
    if (await overlay.isVisible().catch(() => false)) {
      await overlay.click({ position: { x: 5, y: 5 } });
      await page.waitForTimeout(500);
    }
    // Fallback go back if navigation changed
    if (page.url() !== BASE_URL) {
      await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    }
    await page.waitForTimeout(1000);
  }

  // 6. Scroll loading test (scroll to bottom)
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 400;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;
        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 300);
    });
  });
  await page.waitForTimeout(1500);
  await capture(page, `${deviceName}_06_scroll_bottom`, true);

  await context.close();
}

(async () => {
  const browser = await chromium.launch({ headless: true });

  for (const [deviceName, viewport] of Object.entries(VIEWPORTS)) {
    await auditDevice(browser, deviceName, viewport);
  }

  await browser.close();

  fs.writeFileSync(LOG_FILE, JSON.stringify(consoleLogs, null, 2), 'utf-8');
  log(`Console logs saved to ${LOG_FILE}`);
  log(`Total screenshots: ${screenshots.length}`);
  log('Audit complete.');
})();
