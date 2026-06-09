import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const targetUrl = process.env.AUDIT_URL || 'http://127.0.0.1:3000/';
const outputDir = fileURLToPath(new URL('../output/playwright/', import.meta.url));
const screenshotPath = (name) => fileURLToPath(new URL(`../output/playwright/${name}`, import.meta.url));

const checks = [
  { role: 'heading', name: '说清楚想怎么玩，直接找合适的团。' },
  { role: 'button', name: '找合适的团' },
  { text: '热门意图' },
  { text: '输入后自动排序' },
];

async function waitForChecks(page) {
  for (const check of checks) {
    const locator = check.role
      ? page.getByRole(check.role, { name: check.name })
      : page.getByText(check.text, { exact: true });
    await locator.first().waitFor({ state: 'visible', timeout: 10_000 });
  }
}

async function assertDesktop(page) {
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto(targetUrl, { waitUntil: 'networkidle' });
  await waitForChecks(page);

  await page
    .getByPlaceholder('例如：帮我找同时带温泉和沙滩的团，预算600以内')
    .fill('云南 5天 3000以内 爸妈同行');
  await page.getByRole('button', { name: '找合适的团' }).click();
  await page.getByText('AI 优先级助手').waitFor({ state: 'visible', timeout: 10_000 });
  await page.screenshot({ path: screenshotPath('homepage-desktop.png'), fullPage: true });
}

async function assertMobile(page) {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(targetUrl, { waitUntil: 'networkidle' });

  await page.getByRole('heading', { name: '说清楚想怎么玩，直接找合适的团。' }).waitFor({ state: 'visible' });
  await page.getByRole('button', { name: '找合适的团' }).waitFor({ state: 'visible' });

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
