import { chromium } from 'playwright';

const url = process.env.MAP_E2E_URL?.trim() || 'http://127.0.0.1:4173/';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
let failNextChunk = true;

const assert = (condition, message) => {
  if (!condition) throw new Error(`[map-place-chunks] ${message}`);
};

await page.route('**/data/tour-map-place-cards/**', async (route) => {
  if (failNextChunk && /\/1\.json(?:\?|$)/.test(route.request().url())) {
    failNextChunk = false;
    await route.abort();
    return;
  }
  await route.continue();
});

try {
  const geoPlacesResponse = await fetch(new URL('data/geo-places.json', url));
  assert(geoPlacesResponse.ok, `geo place baseline must be readable: ${geoPlacesResponse.status}`);
  const geoPlaces = await geoPlacesResponse.json();
  const guangzhou = geoPlaces.find((place) => place.name === '广州' && place.tourCount === 867);
  assert(guangzhou, 'the large Guangzhou destination baseline must remain indexed at 867 tours');

  await page.goto(url, { waitUntil: 'domcontentloaded' });
  const map = page.locator('[aria-label="旅行目的地地图"]');
  await map.waitFor({ state: 'visible' });
  await page.getByText(/已定位 \d+ 个地点/).waitFor({ state: 'visible' });

  const expandButton = page.getByRole('button', { name: '放大', exact: true });
  assert(await expandButton.count() === 1, 'homepage map must expose one expand action');
  await expandButton.click();

  const expandedMap = page.getByRole('dialog', { name: '点地点，直接看对应旅行团' });
  await expandedMap.waitFor({ state: 'visible' });
  await expandedMap.locator('.leaflet-tile-pane').waitFor({ state: 'attached', timeout: 15000 });
  await page.waitForTimeout(1200);
  let nearbyPanel;
  let GuangzhouChoice;
  const initialClusterCount = await expandedMap.locator('.destination-cluster-icon').count();
  assert(initialClusterCount > 0, 'the expanded map must expose aggregate markers');
  for (let clusterIndex = 0; clusterIndex < initialClusterCount; clusterIndex += 1) {
    const clusters = expandedMap.locator('.destination-cluster-icon');
    const currentClusterCount = await clusters.count();
    if (clusterIndex >= currentClusterCount) continue;
    await clusters.nth(clusterIndex).click();
    const candidatePanel = page.getByRole('complementary', { name: '相近地点' });
    await candidatePanel.waitFor({ state: 'visible' });
    const candidateChoice = candidatePanel.getByRole('button').filter({ hasText: '广州城市范围' });
    if (await candidateChoice.count() === 1) {
      nearbyPanel = candidatePanel;
      GuangzhouChoice = candidateChoice;
      break;
    }
    const closeButton = candidatePanel.getByRole('button', { name: '关闭相近地点', exact: true });
    assert(await closeButton.count() === 1, 'a non-matching cluster must expose a close action');
    await closeButton.click();
  }
  assert(nearbyPanel && GuangzhouChoice, 'the expanded map cluster chooser must expose Guangzhou as a concrete place');
  const firstChunkResponse = page.waitForResponse((response) => {
    const pathname = new URL(response.url()).pathname;
    return response.ok() && pathname.endsWith(`/data/tour-map-place-cards/${guangzhou.placeId}/0.json`);
  }, { timeout: 15000 });
  await GuangzhouChoice.click();
  assert((await firstChunkResponse).ok(), 'the first Guangzhou card chunk must load successfully');

  const panel = page.locator('aside[aria-label$="旅行团"]').filter({ hasText: '867 条线路' });
  await panel.waitFor({ state: 'visible' });
  const cards = panel.locator('button[aria-label^="查看线路："]');
  assert(await cards.count() === 24, 'the first large-place request must render exactly 24 cards');
  const firstCardBeforeFailure = await cards.nth(0).innerText();

  const loadMore = panel.getByRole('button').filter({ hasText: '加载更多线路' });
  assert(await loadMore.count() === 1, 'large-place panels must expose one load-more action');
  await loadMore.click();
  await panel.getByText('已显示前 24 条线路，剩余线路加载失败。', { exact: false }).waitFor({ state: 'visible' });
  assert(await cards.count() === 24, 'a failed next chunk must retain the already visible cards');
  assert((await cards.nth(0).innerText()) === firstCardBeforeFailure, 'a failed next chunk must not reorder existing cards');

  const retryButton = panel.getByRole('button', { name: '重试', exact: true });
  assert(await retryButton.count() === 1, 'a failed next chunk must expose a retry action');
  const secondChunkResponse = page.waitForResponse((response) => {
    const pathname = new URL(response.url()).pathname;
    return response.ok() && pathname.endsWith(`/data/tour-map-place-cards/${guangzhou.placeId}/1.json`);
  }, { timeout: 15000 });
  await retryButton.click();
  assert((await secondChunkResponse).ok(), 'retry must load the next Guangzhou card chunk');
  assert(await cards.count() === 48, 'retry must append the second chunk without dropping the first 24 cards');
  assert((await cards.nth(0).innerText()) === firstCardBeforeFailure, 'the first card must remain after retry');

  console.log(JSON.stringify({ checked: 'map-place-chunks-e2e', placeId: guangzhou.placeId, firstChunk: 24, afterRetry: 48 }));
} finally {
  await browser.close();
}
