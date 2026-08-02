import { chromium } from 'playwright';

const url = process.env.MAP_E2E_URL?.trim() || 'http://127.0.0.1:4173/';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const consoleErrors = [];
page.on('console', (message) => {
  if (message.type() === 'error' || message.type() === 'warning') {
    consoleErrors.push(message.text());
  }
});
page.on('pageerror', (error) => consoleErrors.push(error.message));

const assert = (condition, message) => {
  if (!condition) throw new Error(`[map-runtime] ${message}`);
};

try {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  const map = page.locator('[aria-label="旅行目的地地图"]');
  await map.waitFor({ state: 'visible' });
  await page.getByText(/已定位 \d+ 个地点/).waitFor({ state: 'visible' });
  await map.locator('.leaflet-tile-pane').waitFor({ state: 'attached', timeout: 15000 });
  await page.waitForTimeout(2200);

  const initialTiles = await map.locator('.leaflet-tile').evaluateAll((tiles) =>
    tiles.filter((tile) => tile.complete && tile.naturalWidth > 0).length,
  );
  const initialMarkers = await map.locator('.leaflet-marker-icon').count();
  assert((await map.locator('.leaflet-tile-pane').count()) === 1, 'the initial map must initialize a Leaflet tile layer');
  assert(initialMarkers > 0, 'the initial map must render non-zero destination markers');
  assert(!(await page.getByText('地图数据暂时不可用？').count()), 'the initial map must not report unavailable data');

  const clusterMarkers = map.locator('.destination-cluster-icon');
  assert((await clusterMarkers.count()) > 0, 'the map must expose a numeric aggregate marker');
  await clusterMarkers.first().click();
  await page.getByRole('heading', { name: '选择具体地点' }).waitFor({ state: 'visible' });

  const placePanel = page.getByRole('complementary', { name: '相近地点' });
  const placeChoices = placePanel.getByRole('button').filter({ hasText: /\d+ 条线路/ });
  assert((await placeChoices.count()) > 0, 'the aggregate marker must expose concrete place choices');
  await placeChoices.first().click();
  await page.getByText('地点线路').waitFor({ state: 'visible' });

  const tourChoices = page.getByRole('button', { name: /^查看线路：/ });
  assert((await tourChoices.count()) > 0, 'the place panel must expose tour cards');
  await tourChoices.first().click();
  const tourDialog = page.getByRole('dialog');
  await tourDialog.waitFor({ state: 'visible' });
  assert((await tourDialog.getByText('详细信息').count()) > 0, 'a tour card must open the tour detail dialog');
  await tourDialog.getByRole('button', { name: 'Close' }).click();

  await page.getByRole('button', { name: '放大' }).click();
  const expandedMap = page.getByRole('dialog', { name: '点地点，直接看对应旅行团' });
  await expandedMap.waitFor({ state: 'visible' });
  const expandedMapCanvas = expandedMap.locator('[aria-label="旅行目的地地图"]');
  const expandedMarkersBeforeZoom = await expandedMapCanvas.locator('.leaflet-marker-icon').count();
  await expandedMapCanvas.hover();
  await page.mouse.wheel(0, -720);
  await page.waitForTimeout(2200);
  const expandedMarkersAfterZoom = await expandedMapCanvas.locator('.leaflet-marker-icon').count();
  const expandedTiles = await expandedMapCanvas.locator('.leaflet-tile').evaluateAll((tiles) =>
    tiles.filter((tile) => tile.complete && tile.naturalWidth > 0).length,
  );
  assert((await expandedMapCanvas.locator('.leaflet-tile-pane').count()) === 1, 'the expanded map must keep its Leaflet tile layer after wheel zoom');
  assert(expandedMarkersAfterZoom > 0, 'the expanded map must keep destination markers after wheel zoom');
  assert(expandedMarkersAfterZoom >= expandedMarkersBeforeZoom, 'wheel zoom must refine rather than hide destination markers');
  assert(consoleErrors.length === 0, `browser console must stay clean: ${consoleErrors.join(' | ')}`);

  console.log(JSON.stringify({
    checked: 'map-runtime',
    initialTiles,
    initialMarkers,
    expandedMarkersBeforeZoom,
    expandedMarkersAfterZoom,
    expandedTiles,
    consoleErrors,
  }));
} finally {
  await browser.close();
}
