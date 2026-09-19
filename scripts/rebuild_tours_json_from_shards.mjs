#!/usr/bin/env node
/**
 * tours.json 不入库（超 GitHub 100MB 单文件上限）后，按需从已提交的
 * tours-list + tour-details 分片重建等价目录。
 *
 * 已存在则幂等跳过。供 deploy/refresh-osm-poi/refresh-availability-cache
 * 等在 fresh checkout 上需要 tours.json 的构建或审计步骤前置调用。
 */
import fs from 'node:fs';
import path from 'node:path';

const dataDir = path.join(process.cwd(), 'public', 'data');
const sourcePath = path.join(dataDir, 'tours.json');

if (fs.existsSync(sourcePath)) {
  console.log(`tours.json exists (${(fs.statSync(sourcePath).size / 1e6).toFixed(1)} MB), skip rebuild`);
  process.exit(0);
}

const entries = JSON.parse(fs.readFileSync(path.join(dataDir, 'tours-list.json'), 'utf8'));
const detailsDir = path.join(dataDir, 'tour-details');
const tours = entries.map((entry) => {
  const item = { ...entry };
  delete item.page;
  const shardPath = path.join(detailsDir, `${entry.id}.json`);
  if (entry.id && fs.existsSync(shardPath)) {
    try {
      Object.assign(item, JSON.parse(fs.readFileSync(shardPath, 'utf8')), { id: entry.id });
    } catch {
      /* 分片缺失/损坏时保留列表字段 */
    }
  }
  return item;
});

fs.writeFileSync(sourcePath, `${JSON.stringify(tours)}\n`, 'utf8');
console.log(`rebuilt ${tours.length} tours -> ${path.relative(process.cwd(), sourcePath)}`);
