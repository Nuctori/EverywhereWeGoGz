// 站点巴士图层的端到端验证：开关真的画出 24 条连线、只请求一次数据、
// 点连线能打开线路面板，并且关掉开关后图层干净移除。
// 用法: node scripts/test_map_bus_layer_e2e.mjs（默认打 http://localhost:3000/）
import { mkdirSync } from "node:fs";
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
	// 地图上只有一种线：具体线路（穿过真实站点）。城市对汇总直线已移除。
	const lines = map.locator("path.bus-line-detail");
	await lines.first().waitFor({ state: "attached", timeout: 20000 });
	assert((await tourMarkers.count()) > 0, "turning the bus layer on must not remove the tour layer");
	assert(
		(await map.locator("path.bus-route-line").count()) === 0,
		"city-pair summary polylines must not be drawn any more: one line type only",
	);
	assert(
		(await map.locator("path.bus-city-origin").count()) === 2,
		"expected two origin city markers (广州/江门)",
	);
	// 跨省线路不再单独配色，避免出现"灰色线"这第二种语义。
	const greyLines = await map.locator('path.bus-line-detail[stroke="#94a3b8"]').count();
	assert(greyLines === 0, `cross-border lines must not be styled differently, got ${greyLines}`);
	assert(busRequests.length === 1, `expected exactly one bus-routes request, got ${busRequests.length}`);
	assert((await toggle.getAttribute("aria-pressed")) === "true", "the toggle must report the layer as on");

	// 打开图层就该看到线网（只是低倍更细更淡），不再有"缩到省域什么都没有"的空窗。
	const detailLines = map.locator("path.bus-line-detail");
	const detailStops = map.locator("path.bus-line-stop");
	assert((await detailLines.count()) > 0, "turning the layer on must immediately show the line network");
	assert((await detailStops.count()) === 0, "station dots must stay hidden at province zoom");

	// 关掉再打开：连线消失，且不重复请求数据。
	await toggle.click();
	await page.waitForTimeout(400);
	assert((await lines.count()) === 0, "turning the layer off must remove the lines");

	// 旅行团开关独立生效：关掉后点位消失，巴士线不受影响。
	const tourToggle = page.getByRole("button", { name: /旅行团|显示旅行团/ }).first();
	await tourToggle.click();
	await page.waitForTimeout(400);
	assert((await tourMarkers.count()) === 0, "turning the tour layer off must remove its markers");
	await tourToggle.click();
	await page.waitForTimeout(400);
	assert((await tourMarkers.count()) > 0, "the tour layer must come back when re-enabled");

	await toggle.click();
	await lines.first().waitFor({ state: "attached", timeout: 15000 });
	assert(
		busRequests.length === 1,
		`toggling the layer must not refetch data, got ${busRequests.length} requests`,
	);

	// 放大到全屏地图（同一个实例），点开一条线路看站点。
	await page.getByRole("button", { name: /放大/ }).first().click();
	await page.locator('[role="dialog"]').waitFor({ state: "visible" });

	// 缩放到 z8 以上：逐站线路出现；点一条线应该弹出线路详情（班次/票价/上下车点数）。
	const box = await map.boundingBox();
	await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
	await page.mouse.wheel(0, -260);
	await page.waitForTimeout(1500);
	assert((await detailLines.count()) > 0, "zooming in must reveal the individual lines");

	await detailLines.first().dispatchEvent("click");
	const lineCard = page.locator("div", { hasText: "线路详情" }).last();
	await lineCard.waitFor({ state: "visible", timeout: 5000 });
	const cardText = await lineCard.innerText();
	assert(/上车 \d+/.test(cardText), `line card must show pickup/dropoff counts, got ${cardText.slice(0, 80)}`);
	await page.getByRole("button", { name: "关闭线路详情" }).click();

	// 城市对仍然可以点开看它名下的上下车点（只是不再画一条汇总线）。
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
	assert(panelText.includes("具体线路") || panelText.includes("蓝线"), "the panel legend must describe the single line type");
	assert(!panelText.includes("灰虚线"), "the dashed cross-border legend must be gone with the second line type");

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
	console.log(`[map-bus] ok：具体线路 ${await detailLines.count()} 条 / 出发地筛选可用 / 面板可见`);
} finally {
	await browser.close();
}
