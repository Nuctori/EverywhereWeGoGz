// 端到端验证：城市概览 → 附近线路 → 聚焦线路，保留搜索和站点详情；
// 检查开关移除图层，且不重复请求城市数据。
// 用法: node scripts/test_map_bus_layer_e2e.mjs（默认打 http://localhost:3000/）
import { existsSync, mkdirSync } from "node:fs";
import { chromium } from "playwright";

const url = process.env.MAP_E2E_URL?.trim() || "http://localhost:3000/";
const screenshotPath = process.env.MAP_BUS_SCREENSHOT?.trim() || "tmp/bus-layer.png";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1360, height: 900 } });
// 冷启动的 dev server 要先做一次依赖预构建，首屏可能超过 Playwright 默认的 30s。
page.setDefaultNavigationTimeout(60000);
const pageErrors = [];
const consoleErrors = [];
const busRequests = [];
// Optional source is absent in this fixture; Vite's HTML fallback otherwise returns 200.
if (!existsSync(new URL('../public/data/bus-lines-zhd.json', import.meta.url))) {
	await page.route('**/data/bus-lines-zhd.json*', (route) => route.fulfill({ status: 404, body: '' }));
}

page.on("request", (request) => {
	if (request.url().includes("/data/bus-routes.json")) busRequests.push(request.url());
});
page.on("console", (message) => {
	// 瓦片源在离线环境里会整片失败，那是网络问题而不是本图层的缺陷。
	if (message.type() === "error" && !/tile|ERR_|Failed to load resource/i.test(message.text())) {
		consoleErrors.push(message.text());
	}
});
page.on("pageerror", (error) => pageErrors.push(error.message));

const assert = (condition, message) => {
	if (!condition) throw new Error(`[map-bus] ${message}`);
};

try {
	await page.addInitScript(() => sessionStorage.setItem('ewg:user-city', '广州'));
	await page.goto(url, { waitUntil: "domcontentloaded" });

	const map = page.locator('[aria-label="旅行目的地地图"]').first();
	await map.scrollIntoViewIfNeeded();
	await map.waitFor({ state: "visible" });
	await map.locator(".leaflet-tile-pane").waitFor({ state: "attached", timeout: 20000 });

	// 旅行团和站点巴士是同一张地图上的两个可选图层，先确认旅行团层默认在。
	const tourMarkers = map.locator(".destination-marker-icon, .destination-cluster-icon");
	assert((await tourMarkers.count()) > 0, "the tour layer must be on by default");
	assert((await map.locator("path.bus-route-line").count()) === 0, "the bus layer must start switched off");

	const toggle = page.getByRole("button", { name: /点亮巴士线路|站点巴士/ }).first();
	await toggle.waitFor({ state: "visible" });
	assert((await toggle.getAttribute("aria-pressed")) === "false", "the bus layer must start switched off");

	await toggle.click();
	const lines = map.locator("path.bus-route-line");
	const detailLines = map.locator("path.bus-line-detail");
	const detailStops = map.locator("path.bus-line-stop");
	await page.waitForFunction(() => document.querySelector('.bus-route-line, .bus-line-detail'));
	await page.screenshot({ path: 'tmp/bus-layer-overview.png' });
	const overviewCount = await detailLines.count();
	assert((await lines.count()) === 0 && overviewCount > 60, 'the Guangzhou filter must bypass the overview line budget');
	assert(await detailLines.evaluateAll((paths) => paths.length > 0 && paths.every((path) => {
		const pane = path.closest('[data-bus-overview-pane]');
		return pane && Number(getComputedStyle(pane).opacity) === 0.22
			&& path.getAttribute('stroke-opacity') === '1' && !path.hasAttribute('data-bus-group-size');
	})), 'province overview must cap composited opacity without bundling individual lines');
	assert(await detailLines.evaluateAll((paths) => paths.every((path) => path.dataset.busOrigin === '广州市')),
		'province overview must only draw routes departing Guangzhou');
	assert((await tourMarkers.count()) > 0, "turning the bus layer on must not remove the tour layer");
	assert(busRequests.length === 1, `expected exactly one bus-routes request, got ${busRequests.length}`);
	assert((await toggle.getAttribute("aria-pressed")) === "true", "the toggle must report the layer as on");

	// 省域概览不画具体站点。
	assert((await detailStops.count()) === 0, "station dots must stay hidden at province zoom");

	// 关掉再打开：连线消失，且不重复请求数据。
	await toggle.click();
	await page.waitForTimeout(400);
	assert((await map.locator('path.bus-route-line, path.bus-line-detail, path.bus-line-casing, path.bus-line-stop').count()) === 0,
		"turning the layer off must remove every bus path");

	// 旅行团开关独立生效：关掉后点位消失，巴士线不受影响。
	const tourToggle = page.getByRole("button", { name: /旅行团|显示旅行团/ }).first();
	await tourToggle.click();
	await page.waitForTimeout(400);
	assert((await tourMarkers.count()) === 0, "turning the tour layer off must remove its markers");
	await tourToggle.click();
	await page.waitForTimeout(400);
	assert((await tourMarkers.count()) > 0, "the tour layer must come back when re-enabled");

	await toggle.click();
	await detailLines.first().waitFor({ state: "attached", timeout: 15000 });
	assert(
		busRequests.length === 1,
		`toggling the layer must not refetch data, got ${busRequests.length} requests`,
	);

	// 放大到全屏地图（同一个实例），点开一条线路看站点。
	await page.getByRole("button", { name: /放大/ }).first().click();
	await page.locator('[role="dialog"]').waitFor({ state: "visible" });
	await page.locator('aside summary').filter({ hasText: '目的地' }).click();
	const destinationGroup = page.getByRole('group', { name: '目的地筛选' });
	await destinationGroup.getByRole('checkbox', { name: '目的地 东莞市', exact: true }).check();
	await destinationGroup.getByRole('checkbox', { name: '目的地 佛山市', exact: true }).check();
	const selectedCount = await detailLines.count();
	assert(selectedCount > 0 && selectedCount < overviewCount, 'destination multi-select must narrow Guangzhou routes');
	assert(await detailLines.evaluateAll((paths) => paths.every((path) => path.dataset.busOrigin === '广州市'
		&& ['东莞市', '佛山市'].includes(path.dataset.busDestination))), 'map must match both city filters');
	await page.getByRole('button', { name: '清除目的地筛选' }).click();
	assert((await destinationGroup.locator('input:checked').count()) === 0, 'clear must restore unrestricted destinations');
	await page.locator('aside summary').filter({ hasText: '目的地' }).click();

	// 放大到近景再验证局部预算，避免误用还未刷新的低倍线网。
	const readZoom = async () => Number(await map.getAttribute('data-map-zoom'));
	const zoomButton = map.locator('.leaflet-control-zoom-in');
	let zoom = await readZoom();
	assert(zoom > 0 && zoom < 11, 'expanded map must start below close zoom');
	while (zoom < 11) {
		await zoomButton.click();
		await page.waitForFunction((prior) => Number(document.querySelector('[role="dialog"] [aria-label="旅行目的地地图"]')?.getAttribute('data-map-zoom')) > prior, zoom);
		const nextZoom = await readZoom();
		assert(nextZoom > zoom, 'each zoom click must advance the actual map zoom');
		zoom = nextZoom;
		if (zoom === 9) {
			assert(await detailLines.evaluateAll((paths) => paths.length > 0 && paths.every((path) => {
				const pane = path.closest('[data-bus-overview-pane]');
				return pane && Number(getComputedStyle(pane).opacity) === 0.42;
			})), 'mid zoom must cap the opacity of the whole line network');
			await page.screenshot({ path: 'tmp/bus-layer-mid-zoom.png' });
		}
	}
	// Before focusing a line, station paths only exist after the close-zoom bus render.
	await detailStops.first().waitFor({ state: "attached" });
	assert(await readZoom() >= 11, 'route budget must be checked at close zoom');
	assert((await lines.count()) === 0, "city summaries must not overlap individual lines");
	const highZoomCount = await detailLines.count();
	assert(highZoomCount === overviewCount, 'close zoom must retain all filtered routes');
	const through = map.locator('[data-bus-through-pane]');
	assert(await through.locator('path.bus-line-detail').count() > 0, 'through lines must be rendered in their own pane');
	assert(Number(await through.evaluate((pane) => getComputedStyle(pane).opacity)) <= 0.25,
		'overlapping through lines must remain faint as a group');
	const routePanel = page.locator('aside[data-bus-panel]');
	const listedRoutes = routePanel.getByRole('button', { name: /看线路/ });
	const listedCount = await listedRoutes.count();
	assert(listedCount >= highZoomCount, 'high zoom must list every matched route, including routes without drawable geometry');
	assert((await routePanel.locator('h3').innerText()).includes(`${listedCount} 条`), 'high zoom heading must count the full route list');
	const routeNames = await listedRoutes.allTextContents();
	await routePanel.locator('summary').filter({ hasText: '目的地' }).click();
	await destinationGroup.getByRole('checkbox', { name: '目的地 东莞市', exact: true }).check();
	const filteredPaths = await detailLines.evaluateAll((paths) => paths.map((path) => path.dataset.busDestination));
	assert(filteredPaths.length > 0 && filteredPaths.length < highZoomCount && filteredPaths.every((city) => city === '东莞市'),
		'destination must still narrow the high-zoom map');
	assert(JSON.stringify(await listedRoutes.allTextContents()) === JSON.stringify(routeNames),
		'high-zoom list must keep all departure-city routes despite a destination filter');
	await routePanel.getByRole('button', { name: '清除目的地筛选' }).click();
	await routePanel.locator('summary').filter({ hasText: '目的地' }).click();
	assert(await detailLines.evaluateAll((paths) => paths.every((path) => path.dataset.busOrigin === '广州市')),
		'close zoom must honor the Guangzhou origin filter');
	assert((await detailStops.count()) <= 36, "local stop count must have a hard cap");
	const lineNames = (paths) => JSON.stringify([...paths].map((path) => path.dataset.busLine).sort());
	const beforePan = await detailLines.evaluateAll(lineNames);
	assert(beforePan !== '[]', 'the initial viewport must have routes to restore');
	await map.focus();
	const pan = async (key) => {
		const pane = map.locator('.leaflet-map-pane');
		const before = await pane.evaluate((element) => element.style.transform);
		await map.press(key);
		await pane.evaluate((element, previousTransform) => new Promise((resolve, reject) => {
			const deadline = performance.now() + 3000;
			const check = () => {
				if (element.style.transform !== previousTransform && !element.closest('.leaflet-pan-anim')) resolve();
				else if (performance.now() >= deadline) reject(new Error('map pan did not finish'));
				else requestAnimationFrame(check);
			};
			check();
		}), before);
	};
	for (let i = 0; i < 6; i++) await pan('ArrowRight');
	assert(await detailLines.evaluateAll(lineNames) === beforePan, 'panning must not remove routes selected by city');
	for (let i = 0; i < 6; i++) await pan('ArrowLeft');
	await page.waitForFunction((expected) => {
		const mapRoot = document.querySelector('[role="dialog"] [aria-label="旅行目的地地图"]');
		const names = [...(mapRoot?.querySelectorAll('path.bus-line-detail') ?? [])].map((path) => path.dataset.busLine).sort();
		return names.length > 0 && JSON.stringify(names) === expected;
	}, beforePan);

	await detailLines.locator('xpath=self::*[@d and @d != "M0 0"]').first().dispatchEvent("click");
	const lineCard = page.locator("div", { hasText: "线路详情" }).last();
	await lineCard.waitFor({ state: "visible", timeout: 5000 });
	const cardText = await lineCard.innerText();
	assert(/上车 \d+/.test(cardText), `line card must show pickup/dropoff counts, got ${cardText.slice(0, 80)}`);
	assert((await lines.count()) === 0 && (await detailLines.count()) === 1, "focus must hide every other line at any zoom");
	assert((await detailStops.count()) > 0, "focused stations must be drawn without waiting for high zoom");
	await page.getByRole("button", { name: "关闭线路详情" }).click();

	// 城市对仍然可以从面板点开看它名下的上下车点。
	// 出发地筛选：默认按 IP 城市勾选，全选后覆盖全部出发地。
	const originGroup = page.locator('[role="group"][aria-label="出发地筛选"]').first();
	await originGroup.waitFor({ state: "visible", timeout: 8000 });
	const originOptions = await originGroup.locator('input[type="checkbox"]').count();
	assert(originOptions >= 10, `expected all departure cities as filter options, got ${originOptions}`);
	const panelAside = page.locator('aside[aria-label^="站点巴士线路"]').first();
	const originHeader = await panelAside.locator("p", { hasText: "出发地" }).first().innerText();
	assert(/已选 \d+\/\d+|全部/.test(originHeader), `origin filter header must show the selection, got ${originHeader}`);
	await panelAside.getByRole("button", { name: "全选" }).click();
	await page.waitForTimeout(1500);
	const allHeader = await panelAside.locator("p", { hasText: "出发地" }).first().innerText();
	assert(allHeader.includes(`${originOptions}/${originOptions}`), `全选 must check every city, got ${allHeader}`);

	const panel = page.locator('aside[aria-label^="站点巴士线路："]');
	await panelAside.locator("button", { hasText: "梧州市" }).first().click();
	await panel.waitFor({ state: "visible", timeout: 8000 });
	const panelText = await panel.innerText();
	assert(/→/.test(await panel.locator("h3").innerText()), "the panel must show 出发城市 → 到达城市");
	assert((await panel.locator("ol > li").count()) > 0, "the panel must list the destination stations");
	assert(panelText.includes("线路分布") && panelText.includes("附近站点"), "the panel legend must describe both zoom levels");
	assert(!panelText.includes("灰虚线"), "the dashed cross-border legend must be gone with the second line type");
	assert(!panelText.includes("车辆轨迹。（"), "cross-border names must not follow the geometry disclaimer without context");

	// 站点只跟着线路画：不允许出现"没有线路归属"的孤立点（每个点都要能顺着线找到班次）。
	const orphanDots = await map.locator("path.bus-station-dot").count();
	assert(orphanDots === 0, `no orphan station dots should be drawn, got ${orphanDots}`);
	const currentZoom = Number(await map.getAttribute("data-map-zoom") ?? "0");
	const lineStops = await map.locator("path.bus-line-stop").count();
	if (currentZoom >= 10) {
		assert(lineStops > 0, "line stops must appear at high zoom");
	}

	// 用户视角：带着"广州去龙门县永汉"来，搜索框要能直接找到经过永汉的线路。
	const searchBox = page.locator('aside input[type="search"]').first();
	await searchBox.fill("永汉");
	await page.waitForTimeout(900);
	const searchText = await panelAside.innerText();
	assert(/具体线路 · \d+ 条/.test(searchText), `searching a county/town must list real lines, got ${searchText.slice(0, 60)}`);
	const lineHits = Number((searchText.match(/具体线路 · (\d+) 条/) ?? [])[1] ?? "0");
	assert(lineHits > 0, `searching 永汉 must find lines, got ${lineHits}`);
	await panelAside.locator("button", { hasText: "永汉" }).last().click();
	await page.waitForTimeout(1500);
	const searchedCard = page.locator("div", { hasText: "线路详情" }).last();
	await searchedCard.waitFor({ state: "visible", timeout: 6000 });
	assert((await searchedCard.innerText()).includes("永汉"), "the picked line card must name the searched stop");
	assert((await searchedCard.innerText()).includes("渠道"), "the line card must show which channel sells it");

	// 点一个被多条线路共用的站点：卡片要聚合"这个站有哪些车、几点走"。
	await searchBox.fill("白云机场T2");
	await page.waitForTimeout(900);
	await panelAside.getByRole("button", { name: /白云机场.*看线路/ }).first().click();
	await page.waitForTimeout(2200);
	const sharedStop = map.locator('path.bus-line-stop[data-stop-name="白云机场T2航站楼"]').first();
	assert((await sharedStop.count()) > 0, "the shared stop must be drawn on the map");
	await sharedStop.dispatchEvent("click");
	await page.waitForTimeout(1200);
	const stopCard = page.getByRole("region", { name: "站点详情", exact: true });
	await stopCard.waitFor({ state: "visible", timeout: 6000 });
	const stopText = await stopCard.innerText();
	assert(stopText.includes("7 条线路"), `the shared stop must list all seven associated lines, got ${stopText}`);
	assert((await stopCard.getByRole("button", { name: /可下车/ }).count()) === 7, "all seven associations must be selectable and marked for alighting");
	assert(/可上车|可下车/.test(stopText), "the stop card must identify each line's boarding or alighting role");
	assert(stopText.includes("不是本站班次"), "line departure times must not be presented as stop-specific times");

	// 稔山市场这类只有滴滴才有的站，必须能搜到、点开、并挂在真实线路上。
	await searchBox.fill("稔山市场");
	const stationResult = panelAside.getByRole("button", { name: /稔山市场/ });
	assert((await stationResult.count()) >= 1, "稔山市场 must be discoverable by exact station name");
	await stationResult.first().click();
	await stopCard.getByRole("heading", { name: "稔山市场", exact: true }).waitFor({ state: "visible" });
	// 抓包补全滴滴全量线路后，稔山市场应当挂着真实线路和班次，不再是"暂无可核验班次"。
	const renshanText = await stopCard.innerText();
	assert(/\d+ 条线路/.test(renshanText), `稔山市场 must list associated lines, got ${renshanText.slice(0, 80)}`);
	assert(/可上车|可下车/.test(renshanText), "稔山市场 lines must state boarding/alighting role");
	assert(!renshanText.includes("暂无可核验班次"), "稔山市场 now has verified shifts; the empty state is stale");
	assert(/\d{1,2}:\d{2}/.test(renshanText), "稔山市场 lines must show departure times");
	await map.locator('.bus-selected-stop[data-stop-name="稔山市场"]').waitFor({ state: "visible" });

	mkdirSync("tmp", { recursive: true });
	await page.screenshot({ path: screenshotPath });
	console.log(`[map-bus] screenshot: ${screenshotPath}`);

	assert(pageErrors.length === 0, `page errors: ${JSON.stringify(pageErrors)}`);
	assert(consoleErrors.length === 0, `console errors: ${JSON.stringify(consoleErrors)}`);
	console.log(`[map-bus] ok：省域 ${overviewCount} 条 / 高倍 ${highZoomCount} 条 / 筛选与面板可用`);
} finally {
	await browser.close();
}
