#!/usr/bin/env node
/**
 * 康辉 cct.cn 适配爬虫 (高速 JSON API)
 *
 * 历史背景:
 * - 2026-08: gz.cctpage.com 原分销站彻底停服 (SSL 证书主机名不匹配，租户被撤).
 * - 2026-08-13: 编写首版 crawl_kanghui_cct.mjs, 当时误以为只能靠 Playwright
 *   在手机端模拟渲染, 慢速爬取且仅抓了 50 条.
 * - 2026-09-19 重新深度挖掘: 发现 m.cct.cn 底层提供完整且开放的高速分页
 *   API (get-products), 涵盖全量 ~3,280+ 条实时有效产品 (国内游、出境游、
 *   当地游、跟团游), 单批并发仅需 ~5 秒即可获取全量结构化基础数据!
 *
 * 输出: src/data/raw_kanghui_cct.json
 *
 * Usage:
 *   node scripts/crawl_kanghui_cct.mjs [maxProducts]
 */

import https from 'node:https';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const MAX_PRODUCTS = Number(process.argv[2] || process.env.MAX_KANGHUI_PRODUCTS || '5000') || 5000;
const BATCH_SIZE = 15;

const BASE_API =
  'https://m.cct.cn/product/api-search/get-products?tourType=0&lines=0&departureCity=0&destinationCountry=0&destinationProvince=0&destinationCity=0&productType=0&tourDays=0&departureTime=0&sort=0&urlLocation=&citySite=all&channel=guoneilvyou&needPage=true';

async function fetchJson(url) {
  return new Promise((resolve) => {
    const req = https.get(
      url,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          Referer: 'https://m.cct.cn/',
          Accept: 'application/json, text/plain, */*',
        },
        timeout: 12000,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch {
            resolve(null);
          }
        });
      },
    );
    req.on('error', () => resolve(null));
    req.on('timeout', () => {
      req.destroy();
      resolve(null);
    });
  });
}

async function main() {
  console.log('[cct.cn] 开始通过全量 API 探测康辉产品数据...');
  const start = Date.now();

  const firstPage = await fetchJson(`${BASE_API}&page=1`);
  const totalCount = firstPage?.data?.totalCount || 0;
  const pageCount = firstPage?.data?.pageCount || 0;

  if (!pageCount) {
    console.error('[cct.cn] 无法获取分页信息, 退出');
    process.exit(1);
  }

  console.log(`[cct.cn] 发现全量产品: ${totalCount} 条, 共 ${pageCount} 页`);

  const allRawItems = new Map();

  for (let i = 1; i <= pageCount; i += BATCH_SIZE) {
    const promises = [];
    for (let p = i; p < i + BATCH_SIZE && p <= pageCount; p++) {
      promises.push(fetchJson(`${BASE_API}&page=${p}`));
    }
    const results = await Promise.all(promises);
    for (const res of results) {
      for (const item of res?.data?.list || []) {
        if (item.product_id && !allRawItems.has(item.product_id)) {
          allRawItems.set(item.product_id, item);
        }
      }
    }
    if (allRawItems.size >= MAX_PRODUCTS) {
      break;
    }
  }

  console.log(`[cct.cn] 获取到 ${allRawItems.size} 条不重复原始产品, 耗时 ${Date.now() - start}ms`);

  const cleanedProducts = [];
  for (const item of allRawItems.values()) {
    if (cleanedProducts.length >= MAX_PRODUCTS) break;

    const title = (item.productName || '').trim();
    const price = Number(item.salePrice || 0);
    const daysMatch = (item.date || '').match(/(\d+)/);
    const days = daysMatch ? Number(daysMatch[1]) : 0;

    if (title.length <= 5 || price <= 0 || days <= 0) {
      continue;
    }

    let img = item.image ? String(item.image).trim() : '';
    if (img.startsWith('//')) {
      img = 'https:' + img;
    }

    cleanedProducts.push({
      sourceId: `cct:${item.product_id}`,
      source: '康辉',
      bookingUrl: `https://m.cct.cn/dujia/${item.product_id}.html`,
      url: `https://m.cct.cn/dujia/${item.product_id}.html`,
      title,
      price: String(price),
      duration: `${days}天`,
      days,
      departure: item.departureCity || '',
      destination: item.destinationCity || item.destinationSingleCity || '',
      img,
      tags: Array.isArray(item.tags) ? item.tags : [],
      groups: Array.isArray(item.groups) ? item.groups : [],
    });
  }

  console.log(`[cct.cn] 质检合格产品数: ${cleanedProducts.length}`);

  const outDir = path.join(ROOT, 'src', 'data');
  await fs.mkdir(outDir, { recursive: true });
  const outPath = path.join(outDir, 'raw_kanghui_cct.json');
  await fs.writeFile(outPath, JSON.stringify(cleanedProducts, null, 2), 'utf-8');
  console.log(`[cct.cn] 成功保存 ${cleanedProducts.length} 条产品 -> ${outPath}`);
}

main().catch((err) => {
  console.error('[cct.cn] 抓取失败:', err);
  process.exit(1);
});
