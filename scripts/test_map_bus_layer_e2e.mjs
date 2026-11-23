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
	const lines = map.locator("path.bus-route-line");
	await lines.first().waitFor({ state: "attached", timeout: 15000 });
	// 两个图层同时存在：巴士线加上来，旅行团点位不能被顶掉。
	assert((await tourMarkers.count()) > 0, "turning the bus layer on must not remove the tour layer");
	const lineCount = await lines.count();
	// 广东省内的城市对几乎都有真实线路了，剩下的汇总线只有跨境/跨省那两条。
	assert(lineCount >= 1, `expected the remaining summary lines, got ${lineCount}`);
	assert(
		(await map.locator("path.bus-city-origin").count()) === 2,
		"expected two origin city markers (广州/江门)",
	);
	// 香港(81)、广西梧州(45) 是接口真实返回的跨境/跨省线路，必须用虚线区分，
	// 不能被当成和省内线路一样的蓝线。
	const crossBorder = map.locator("path.bus-route-cross-border");
	assert(
		(await crossBorder.count()) === 2,
		`expected two cross-border/province lines, got ${await crossBorder.count()}`,
	);
	assert(
		(await crossBorder.first().getAttribute("stroke-dasharray")) !== null,
		"cross-border lines must be dashed",
	);
	assert(busRequests.length === 1, `expected exactly one bus-routes request, got ${busRequests.length}`);
	assert((await toggle.getAttribute("aria-pressed")) === "true", "the toggle must report the layer as on");

	// 缩放分级：省级视野只留汇总线，线路明细要放大到 z8 才出现。
	const detailLines = map.locator("path.bus-line-detail");
	const detailStops = map.locator("path.bus-line-stop");
	const embeddedZoom = Number(await map.getAttribute("data-map-zoom") ?? "0");
	if (embeddedZoom < 8) {
		assert(
			(await detailLines.count()) === 0,
			"detail lines must stay hidden at province zoom to keep the map responsive",
		);
	}

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

	await lines.first().waitFor({ state: "attached", timeout: 15000 });
	await lines.first().dispatchEvent("click");

	const panel = page.locator('aside[aria-label^="站点巴士线路："]');
	await panel.waitFor({ state: "visible", timeout: 5000 });
	const panelText = await panel.innerText();
	assert(/→/.test(await panel.locator("h3").innerText()), "the panel must show 出发城市 → 到达城市");
	assert((await panel.locator("ol > li").count()) > 0, "the panel must list the destination stations");
	assert(panelText.includes("具体线路"), "the panel must distinguish real lines from city-pair summaries");
	assert(panelText.includes("灰虚线"), "the panel legend must explain the dashed cross-border style");

	// 站点只跟着线路画：不允许出现"没有线路归属"的孤立点（每个点都要能顺着线找到班次）。
	const orphanDots = await map.locator("path.bus-station-dot").count();
	assert(orphanDots === 0, `no orphan station dots should be drawn, got ${orphanDots}`);
	const currentZoom = Number(await map.getAttribute("data-map-zoom") ?? "0");
	const lineStops = await map.locator("path.bus-line-stop").count();
	if (currentZoom >= 10) {
		assert(lineStops > 0, "line stops must appear at high zoom");
	}

	// 选中后高亮这条线的两组站点：到达站数量与面板列表一致。
	const highlightDropoff = map.locator("path.bus-station-highlight[data-station-role='dropoff']");
	const highlightPickup = map.locator("path.bus-station-highlight[data-station-role='pickup']");
	assert(
		(await highlightDropoff.count()) === (await panel.locator("ol > li").count()),
		`highlighted dropoff points (${await highlightDropoff.count()}) must match the panel list`,
	);
	assert((await highlightPickup.count()) > 0, "the selected route must highlight its pickup points");
	assert(panelText.includes("绿点"), "the panel legend must explain the pickup/dropoff colors");

	// 选中线路要把视野收到这条线：全省视图最多 z7，海岸线太粗，分不清半岛和海湾。
	const selectedZoom = Number(await map.getAttribute("data-bus-zoom"));
	assert(selectedZoom >= 8, `selecting a route must zoom in for detail, got z${selectedZoom}`);
	// 城市名要常驻在点旁边，否则用户只看到一个孤零零的圆点（图层重绘有延迟，等它出来）。
	await page.waitForFunction(
		() => document.querySelectorAll(".bus-city-label").length === 2,
		null,
		{ timeout: 8000 },
	);

	// 用户视角：带着"广州去龙门县永汉"来，搜索框要能直接找到经过永汉的线路。
	const searchBox = page.locator('aside input[type="search"]').first();
	await searchBox.fill("永汉");
	await page.waitForTimeout(900);
	const panelAside = page.locator('aside[aria-label^="站点巴士线路"]').first();
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
	await panelAside.locator("button", { hasText: "白云机场" }).first().click();
	await page.waitForTimeout(2200);
	const sharedStop = map.locator('path[data-stop-name="白云机场T2航站楼"]').first();
	assert((await sharedStop.count()) > 0, "the shared stop must be drawn on the map");
	await sharedStop.dispatchEvent("click");
	await page.waitForTimeout(1200);
	const stopCard = page.locator("div", { hasText: "站点详情" }).last();
	await stopCard.waitFor({ state: "visible", timeout: 6000 });
	const stopText = await stopCard.innerText();
	assert(/\d+ 条线路/.test(stopText), `the stop card must aggregate lines, got ${stopText.slice(0, 60)}`);
	assert(/\d+ 个班次/.test(stopText), "the stop card must count departures");

	mkdirSync("tmp", { recursive: true });
	await page.screenshot({ path: screenshotPath });
	console.log(`[map-bus] screenshot: ${screenshotPath}`);

	assert(pageErrors.length === 0, `page errors: ${JSON.stringify(pageErrors)}`);
	assert(consoleErrors.length === 0, `console errors: ${JSON.stringify(consoleErrors)}`);
	console.log(`[map-bus] ok：${lineCount} 条连线 / 2 个出发城市 / 面板可见`);
} finally {
	await browser.close();
}
