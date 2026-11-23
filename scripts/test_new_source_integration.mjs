#!/usr/bin/env node
/**
 * 新数据源接入契约（上品旅行 / 广州康辉）。
 *
 * 只读构建产物，验证三件事：
 * 1. merge 管线认识这两个 raw 文件与来源色板；
 * 2. 合并后的 tours.json 里两源都真的出货，且字段可用（价格/天数/预订链接）；
 * 3. 增量方向正确——广州出发省内短线（1-3 天）有实质补给，而不是只多了长线。
 */
import fs from 'node:fs';
import path from 'node:path';

const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const fail = [];
const check = (cond, message) => {
  if (!cond) fail.push(message);
};

const mergeSource = fs.readFileSync('scripts/merge_data.py', 'utf8');
const toursSource = fs.readFileSync('src/data/tours.ts', 'utf8');

check(mergeSource.includes('"raw_tootour_full.json": 10'), 'merge_data must register raw_tootour_full.json');
check(mergeSource.includes('"raw_thyoo_full.json": 10'), 'merge_data must register raw_thyoo_full.json');
check(mergeSource.includes("'上品旅行': '#E76F51'"), 'merge_data must declare 上品旅行 source color');
check(mergeSource.includes("'广州康辉': '#C1121F'"), 'merge_data must declare 广州康辉 source color');
check(toursSource.includes('"上品旅行"'), 'generated tours.ts must expose 上品旅行 source');
check(toursSource.includes('"广州康辉"'), 'generated tours.ts must expose 广州康辉 source');

const rawTootour = readJson('src/data/raw_tootour_full.json');
const rawThyoo = readJson('src/data/raw_thyoo_full.json');
check(rawTootour.length >= 100, `raw_tootour_full.json 应 >=100 条，实际 ${rawTootour.length}`);
check(rawThyoo.length >= 20, `raw_thyoo_full.json 应 >=20 条，实际 ${rawThyoo.length}`);
check(
  rawThyoo.every((item) => 1 <= Number(item.days || 0) <= 3),
  'raw_thyoo_full.json 只允许 1-3 天线路',
);
check(
  rawThyoo.every((item) => String(item.departureCity || '').startsWith('广州')),
  'raw_thyoo_full.json 只允许广州出发',
);

if (fs.existsSync('public/data/tours.json')) {
  const tours = readJson('public/data/tours.json');
  const bySource = (name) => tours.filter((tour) => tour.source === name);
  const tootour = bySource('上品旅行');
  const thyoo = bySource('广州康辉');

  check(tootour.length >= 100, `tours.json 里上品旅行应 >=100 条，实际 ${tootour.length}`);
  check(thyoo.length >= 20, `tours.json 里广州康辉应 >=20 条，实际 ${thyoo.length}`);

  for (const [name, list] of [
    ['上品旅行', tootour],
    ['广州康辉', thyoo],
  ]) {
    check(list.every((tour) => Number(tour.price) > 0), `${name} 全部条目必须有正价格`);
    check(list.every((tour) => Number(tour.duration) > 0), `${name} 全部条目必须有天数`);
    check(
      list.every((tour) => /^https?:\/\//.test(String(tour.bookingUrl || ''))),
      `${name} 全部条目必须有可跳转的预订链接`,
    );
  }

  const tootourShort = tootour.filter((tour) => tour.duration >= 1 && tour.duration <= 3);
  const thyooShort = thyoo.filter((tour) => tour.duration >= 1 && tour.duration <= 3);
  check(tootourShort.length >= 100, `上品旅行 1-3 天应 >=100 条，实际 ${tootourShort.length}`);
  check(thyooShort.length >= 20, `广州康辉 1-3 天应 >=20 条，实际 ${thyooShort.length}`);

  const previous = 740; // 2026-11 基线：全库「广东目的地 + 1-3 天」条数
  const gdKeywords = /广州|深圳|珠海|汕头|佛山|韶关|湛江|肇庆|江门|茂名|惠州|梅州|汕尾|河源|阳江|清远|东莞|中山|潮州|揭阳|云浮|从化|增城|海陵岛|双月湾|巽寮|闸坡/;
  const gdShort = tours.filter(
    (tour) =>
      tour.duration >= 1 &&
      tour.duration <= 3 &&
      gdKeywords.test(`${tour.destination || ''}${tour.title || ''}`),
  );
  check(
    gdShort.length > previous,
    `广东 1-3 天供给应超过基线 ${previous} 条，实际 ${gdShort.length}`,
  );

  console.log(
    JSON.stringify({
      checked: 'new-source-integration',
      ok: fail.length === 0,
      totalTours: tours.length,
      tootour: tootour.length,
      thyoo: thyoo.length,
      gdShort: gdShort.length,
      baselineGdShort: previous,
    }),
  );
} else {
  console.log(JSON.stringify({ checked: 'new-source-integration', ok: fail.length === 0, toursJson: 'missing' }));
}

if (fail.length) {
  for (const message of fail) console.error(`  ✗ ${message}`);
  process.exit(1);
}
