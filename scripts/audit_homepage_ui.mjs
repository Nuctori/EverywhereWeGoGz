import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const targetUrl = process.env.AUDIT_URL || 'http://127.0.0.1:3000/';
const outputDir = fileURLToPath(new URL('../output/playwright/', import.meta.url));
const screenshotPath = (name) => fileURLToPath(new URL(`../output/playwright/${name}`, import.meta.url));

const checks = [
  { role: 'heading', name: '先看班期和预算，再选适合的团。' },
  { role: 'button', name: '查看结果' },
  { role: 'button', name: 'AI 帮我选' },
  { text: '热门意图' },
  { text: 'AI 先排合适度' },
];

async function assertDesktop(page) {
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto(targetUrl, { waitUntil: 'networkidle' });

  for (const check of checks) {
    const locator = check.role
      ? page.getByRole(check.role, { name: check.name })
      : page.getByText(check.text, { exact: true });
    await locator.first().waitFor({ state: 'visible', timeout: 10_000 });
  }

  await page.getByPlaceholder('想去云南，5天，3000以内，爸妈同行').fill('云南 5天 3000以内 爸妈同行');
  await page.getByRole('button', { name: 'AI 帮我选' }).click();
  await page.getByText('AI 优先级助手').waitFor({ state: 'visible', timeout: 10_000 });
  await page.screenshot({ path: screenshotPath('homepage-desktop.png'), fullPage: true });
}

async function assertMobile(page) {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(targetUrl, { waitUntil: 'networkidle' });

  await page.getByRole('heading', { name: '先看班期和预算，再选适合的团。' }).waitFor({ state: 'visible' });
  await page.getByRole('button', { name: '查看结果' }).waitFor({ state: 'visible' });
  await page.getByRole('button', { name: 'AI 帮我选' }).waitFor({ state: 'visible' });

  const bodyBox = await page.locator('body').boundingBox();
  if (!bodyBox || bodyBox.width > 410) {
    throw new Error(`Unexpected mobile body width: ${bodyBox?.width ?? 'unknown'}`);
  }

  await page.screenshot({ path: screenshotPath('homepage-mobile.png'), fullPage: true });
}

await mkdir(outputDir, { recursive: true });

const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await assertDesktop(page);
  await assertMobile(page);
} finally {
  await browser.close();
}

console.log(`Homepage UI audit passed for ${targetUrl}`);
