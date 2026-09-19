#!/usr/bin/env node
/**
 * 渲染详情页并把可见文本写入 JSON，供 Python 解析上车点。
 *
 * Python 侧没有 playwright，渲染统一走 Node。
 *
 * 用法:
 *   node scripts/render_pages.mjs --in tmp/render_urls.json --out tmp/rendered.json
 *   node scripts/render_pages.mjs --discover-gdcts --out tmp/rendered.json
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122 Safari/537.36';
const GDCTS_AROUND = 'https://www.gdcts.com/product/line/index/id/62';

function arg(name, fallback = null) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--')
    ? process.argv[i + 1]
    : fallback;
}

/** 列出 gdcts 周边游全部产品（上车点只存在于这类短线）。 */
async function discoverGdcts(page) {
  const seen = new Map();
  for (let pageNo = 1; pageNo <= 8; pageNo++) {
    const url = pageNo === 1 ? GDCTS_AROUND : `${GDCTS_AROUND}/page/${pageNo}`;
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(2500);
      const rows = await page.evaluate(() =>
        [...document.querySelectorAll('a')]
          .filter((a) => /detail\/id\//.test(a.href))
          .map((a) => ({ url: a.href.split('?')[0], title: (a.innerText || '').trim() }))
      );
      let fresh = 0;
      for (const r of rows) {
        if (!r.url || seen.has(r.url)) continue;
        seen.set(r.url, r);
        fresh++;
      }
      process.stderr.write(`  [discover] page ${pageNo}: +${fresh} (total ${seen.size})\n`);
      if (fresh === 0) break;
    } catch (e) {
      process.stderr.write(`  [discover] page ${pageNo} failed: ${e.message.slice(0, 80)}\n`);
    }
  }
  return [...seen.values()];
}

/** 渲染一页，返回可见文本。部分源站的区块需要点击才渲染。 */
async function renderText(page, url) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(2200);
  // 各源站的展开标签不同：gdcts 用"产品介绍"，gzl 用"预订须知/费用&说明"
  for (const label of ['产品介绍', '行程介绍', '预订须知', '费用&说明', '费用说明']) {
    try {
      const clicked = await page.evaluate((l) => {
        const el = [...document.querySelectorAll('a,li,div,span,button')].find(
          (x) => x.innerText && x.innerText.trim() === l
        );
        if (el) { el.click(); return true; }
        return false;
      }, label);
      if (clicked) await page.waitForTimeout(500);
    } catch {
      /* 展开失败不影响文本抓取 */
    }
  }
  // 触发懒加载区块
  for (let i = 0; i < 4; i++) {
    await page.mouse.wheel(0, 4000);
    await page.waitForTimeout(300);
  }
  return page.evaluate(() => document.body.innerText);
}

/** 从 raw_*.json 读取目标 URL 列表。 */
function loadSourceUrls(source) {
  const map = {
    gdcts: 'raw_http_full.json',
    gzl: 'raw_gzl_api.json',
    outdoors: 'raw_outdoors_full.json',
    saihuitong: 'raw_saihuitong_full.json',
    jrt365: 'raw_jrt365_full.json',
  };
  const file = map[source];
  if (!file) return [];
  const p = path.join('src', 'data', file);
  if (!fs.existsSync(p)) return [];
  const data = JSON.parse(fs.readFileSync(p, 'utf8'));
  const items = Array.isArray(data) ? data : data.items || data.data || [];
  const seen = new Set();
  const out = [];
  for (const it of items) {
    const url = String(it.url || '').split('?')[0];
    if (!url || seen.has(url)) continue;
    seen.add(url);
    out.push({ url, title: String(it.title || '') });
  }
  return out;
}

async function main() {
  const out = arg('out', 'tmp/rendered.json');
  const inFile = arg('in');
  const source = arg('source');
  const limit = Number(arg('limit', '0')) || 0;
  const discover = process.argv.includes('--discover-gdcts');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ userAgent: UA });

  let targets = [];
  if (discover) {
    targets = await discoverGdcts(page);
  } else if (source) {
    targets = loadSourceUrls(source);
    process.stderr.write(`  [${source}] targets from raw: ${targets.length}\n`);
  } else if (inFile) {
    const parsed = JSON.parse(fs.readFileSync(inFile, 'utf8'));
    targets = Array.isArray(parsed)
      ? parsed.map((x) => (typeof x === 'string' ? { url: x } : x))
      : parsed.items || [];
  }
  if (limit) targets = targets.slice(0, limit);

  const results = [];
  for (let i = 0; i < targets.length; i++) {
    const t = targets[i];
    try {
      const text = await renderText(page, t.url);
      results.push({ url: t.url, title: t.title || '', text });
      if (i % 10 === 0 || i === targets.length - 1) {
        process.stderr.write(`  [render] ${i + 1}/${targets.length}\n`);
      }
    } catch (e) {
      results.push({ url: t.url, title: t.title || '', error: e.message.slice(0, 120) });
    }
  }

  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify(results, null, 1));
  await browser.close();
  process.stderr.write(`wrote ${results.length} pages -> ${out}\n`);
}

main();
