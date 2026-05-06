/**
 * 数据更新脚本示例
 *
 * 用途：从外部 API 或数据源获取旅行团数据，生成 src/data/tours.ts
 *
 * 使用方式：
 *   1. 复制此文件为 scripts/fetch-data.js
 *   2. 根据你的数据源修改 fetchData() 函数
 *   3. 在 CI 中调用：node scripts/fetch-data.js
 */

const fs = require('fs');
const path = require('path');

/**
 * 从外部获取数据（示例）
 * 替换为实际的 API 调用或爬虫逻辑
 */
async function fetchData() {
  // 示例：从远程 API 获取
  // const res = await fetch('https://your-api.com/tours');
  // const data = await res.json();
  // return data;

  // 示例：读取本地 JSON
  // const raw = fs.readFileSync(path.join(__dirname, '../data/external-tours.json'), 'utf-8');
  // return JSON.parse(raw);

  // 示例：运行爬虫命令
  // const { execSync } = require('child_process');
  // const output = execSync('python scripts/crawler.py', { encoding: 'utf-8' });
  // return JSON.parse(output);

  throw new Error('请实现 fetchData() 函数，或删除此脚本');
}

/**
 * 生成 tours.ts 文件内容
 */
function generateToursFile(tours) {
  const sources = [...new Set(tours.map(t => t.source))].map(name => ({
    name,
    logo: `/icons/${name.toLowerCase().replace(/\s+/g, '-')}.png`,
    color: getSourceColor(name),
  }));

  const destinations = [...new Set(tours.map(t => t.destination))];
  const themes = [...new Set(tours.map(t => t.theme).filter(Boolean))];

  return `import type { Tour } from '@/types/tour';

export const sources = ${JSON.stringify(sources, null, 2)};

export const destinations = ${JSON.stringify(destinations, null, 2)};

export const themes = ${JSON.stringify(themes, null, 2)};

export const tours: Tour[] = ${JSON.stringify(tours, null, 2)};
`;
}

function getSourceColor(name) {
  const colors = {
    '假日通': '#FF6B35',
    '广州去旅行': '#4ECDC4',
    '康辉': '#1A535C',
    '暴走村': '#B8860B',
    '广之旅': '#FF006E',
    '广东中旅': '#8338EC',
    '品途': '#3A86FF',
  };
  return colors[name] || '#666';
}

async function main() {
  try {
    console.log('Fetching tour data...');
    const tours = await fetchData();
    console.log(`Fetched ${tours.length} tours`);

    const content = generateToursFile(tours);
    const outputPath = path.join(__dirname, '../src/data/tours.ts');
    fs.writeFileSync(outputPath, content, 'utf-8');
    console.log(`Data written to ${outputPath}`);
  } catch (error) {
    console.error('Failed to update data:', error.message);
    process.exit(1);
  }
}

main();
