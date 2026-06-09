// ?????? AI ??????????????????
import { chromium } from '@playwright/test';

const baseUrl = process.env.APP_URL || 'http://127.0.0.1:4175/';
const query = '给我推荐同时具有海滩和温泉的旅行团';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

try {
  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  await page.locator('input[type="search"]').fill(query);
  await page.locator('form button').nth(1).click();
  await page.waitForTimeout(1200);

  const searchCheck = await page.evaluate(() => ({
    hasNoResult: document.body.innerText.includes('暂无结果'),
    resultCountVisible: document.body.innerText.includes('条结果') && document.body.innerText.includes('已显示'),
  }));

  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  await page.locator('input[type="search"]').fill(query);
  await page.locator('form button').nth(2).click();
  await page.waitForFunction(
    () => document.body.innerText.includes('AI推荐 TOP') || document.body.innerText.includes('AI 接口暂时不可用'),
    { timeout: 20000 },
  );
  await page.waitForTimeout(1200);

  const aiCheck = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('h3'))
      .map((heading) => {
        const card = heading.closest('[class*="cursor-pointer"]') || heading.parentElement?.parentElement;
        const text = card?.textContent || '';
        const aiLine = text.split('\n').find((line) => line.includes('AI推荐 TOP')) || '';
        if (!aiLine) return null;
        return {
          title: heading.textContent?.trim() || '',
          aiLine: aiLine.trim(),
        };
      })
      .filter(Boolean);

    return {
      bodyText: document.body.innerText,
      cards,
    };
  });

  const output = {
    baseUrl,
    query,
    searchCheck,
    aiStatus: {
      usedFallback: aiCheck.bodyText.includes('AI 接口暂时不可用'),
      rememberedPreference: aiCheck.bodyText.includes('已记住偏好'),
      usedBackupLabel: aiCheck.bodyText.includes('备用推荐'),
    },
    topCards: aiCheck.cards.slice(0, 10),
  };

  console.log(JSON.stringify(output, null, 2));
} finally {
  await browser.close();
}
