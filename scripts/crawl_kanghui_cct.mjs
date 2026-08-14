#!/usr/bin/env node
/**
 * 康辉 cct.cn 爬虫 (Playwright) — gz.cctpage.com 死站后 (2026-08), 康辉产品
 * 迁至 cct.cn (m.cct.cn, JS 渲染). 列表页模板由 JS 填充 (静态爬虫不可用),
 * 详情页 dujia/{id}.html 为服务端渲染 (结构化字段可抓).
 *
 * 抓取: 国内游列表 (广州出发 o12007) + 首页聚合 → dujia 产品 ID 去重 →
 * 逐个详情页抓 title/price/duration/departure/destination.
 * 输出: src/data/raw_kanghui_cct.json (sourceId=cct:{id}).
 *
 * 用量评估 (2026-08-13): cct.cn 全站 ~50 个产品 (国内为主, 北京出发居多),
 * 康辉广州旧产品 (SP prodcode) 未迁移 — 此爬虫恢复"康辉源有新数据"而非
 * 修复旧 URL.
 *
 * WIP (2026-08-14 audit): 输出 raw_kanghui_cct.json 尚无 merge 管线消费
 * (merge_data.py 无 cct: sourceId 映射, update-data.yml git add 清单不含此文件,
 * tours.json 0 条 cct.cn tour) — 数据抓取但未进产物. 接入管线前勿宣称已恢复.
 *
 * Usage: node scripts/crawl_kanghui_cct.mjs [maxProducts=50]
 */
import { chromium } from "playwright";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const MAX = Number(process.argv[2] || "50") || 50;
// cct.cn WAF throttles burst requests — serial + 3s delay + one retry.
const DELAY_MS = 3000;

const LIST_URLS = [
"https://m.cct.cn/bourne/guoneilvyou/all-a1-e1-o12007/",
"https://m.cct.cn/",
];

async function collectProductIds(page, url) {
try {
await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
await page.waitForTimeout(4000);
return await page.evaluate(() =>
Array.from(document.querySelectorAll('a[href*="dujia/"]'))
.map((a) => a.getAttribute("href").match(/dujia\/(\d+)\.html/)?.[1])
.filter(Boolean),
);
} catch (error) {
console.log(`[cct] list ${url} ERR: ${error.message.slice(0, 80)}`);
return [];
}
}

async function scrapeDetail(page, id) {
for (let attempt = 1; attempt <= 2; attempt += 1) {
try {
await page.goto(`https://m.cct.cn/dujia/${id}.html`, {
waitUntil: "domcontentloaded",
timeout: 30000,
});
await page.waitForTimeout(2500);
const data = await page.evaluate(() => {
const text = document.body.innerText;
const grab = (pattern) => {
const m = text.match(pattern);
return m ? m[1].trim() : "";
};
// 出发地/目的地 are label lines: "出发地 | 昆明 北京 广州 ..."
const labelLine = (label) => {
const m = text.match(
new RegExp(`${label}\\s*[|｜：:\\s]+([^\\n]{2,80})`),
);
return m ? m[1].trim() : "";
};
return {
title: (document.title || "")
.replace(/^【|】?-康辉旅游网$/g, "")
.replace("-康辉旅游网", "")
.trim(),
price: grab(/¥\s*(\d+)\s*起/),
duration: grab(/(\d+\s*[天日])/),
departure: labelLine("出发地"),
destination: labelLine("目的地"),
};
});
if (data.title && data.title !== "404 您访问的页面不存在") {
return {
sourceId: `cct:${id}`,
source: "康辉",
bookingUrl: `https://m.cct.cn/dujia/${id}.html`,
...data,
};
}
// 404 title — product gone; not worth retrying
return null;
} catch (error) {
if (attempt === 2) {
console.log(`[cct] detail ${id} ERR: ${error.message.slice(0, 80)}`);
} else {
await new Promise((r) => setTimeout(r, DELAY_MS));
}
}
}
return null;
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
viewport: { width: 390, height: 844 },
userAgent:
"Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
});

const seen = new Set();
for (const url of LIST_URLS) {
for (const id of await collectProductIds(page, url)) seen.add(id);
await new Promise((r) => setTimeout(r, DELAY_MS));
}
console.log(`[cct] unique products: ${seen.size}`);

const products = [];
for (const id of [...seen].slice(0, MAX)) {
const item = await scrapeDetail(page, id);
if (item && item.title && item.title !== "404 您访问的页面不存在") {
products.push(item);
console.log(
`[cct] ${id}: ${item.title.slice(0, 40)} ¥${item.price || "?"} ${item.departure.slice(0, 20)}`,
);
}
await new Promise((r) => setTimeout(r, DELAY_MS));
}
await browser.close();

const outDir = path.join(ROOT, "src", "data");
await mkdir(outDir, { recursive: true });
const outPath = path.join(outDir, "raw_kanghui_cct.json");
await writeFile(outPath, JSON.stringify(products, null, 2), "utf-8");
console.log(`[cct] saved ${products.length} products -> ${outPath}`);
