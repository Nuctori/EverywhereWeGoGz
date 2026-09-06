// 补下载 image-cache 缺失的远程图片。
//
// optimize_image_cache.mjs 只重写"已存在"的缓存文件，从不下载——爬虫阶段
// 拉取失败的远程图（尤其 http:// 外链）会以绝对 URL 留在发布数据里，
// 在 https 站点上被浏览器当混合内容拦截，表现为部分卡片图片永远加载不出。
//
// 本脚本扫描与 optimize 相同的 JSON 语料，把图片字段里缓存缺失的 http(s)
// URL 下载到 <sha1(url)[:16]>.<ext>；下载失败的 URL 写入清单
// image-cache/missing-images.manifest.json，由 optimize_image_cache.mjs
// 重写为占位图（构建时 consume，保证发布数据不残留外链图）。
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = process.cwd();
const publicDir = path.join(root, 'public');
const imageCacheDir = path.join(publicDir, 'data', 'image-cache');
const dataDir = path.join(publicDir, 'data');
const detailDir = path.join(dataDir, 'tour-details');
const manifestPath = path.join(imageCacheDir, 'missing-images.manifest.json');
const concurrency = Number(process.env.IMAGE_DOWNLOAD_CONCURRENCY || 10);
const timeoutMs = Number(process.env.IMAGE_DOWNLOAD_TIMEOUT_MS || 15000);
const retries = Number(process.env.IMAGE_DOWNLOAD_RETRIES || 1);

const remoteImageExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.svg']);
const contentTypeExt = new Map([
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
  ['image/webp', '.webp'],
  ['image/gif', '.gif'],
  ['image/bmp', '.bmp'],
  ['image/svg+xml', '.svg'],
]);

const stats = {
  scanned: 0,
  alreadyCached: 0,
  downloaded: 0,
  failed: 0,
  bytes: 0,
};

function walkStrings(value, key, result = []) {
  if (Array.isArray(value)) {
    for (const item of value) walkStrings(item, key, result);
    return result;
  }
  if (value && typeof value === 'object') {
    for (const [childKey, child] of Object.entries(value)) walkStrings(child, childKey, result);
    return result;
  }
  if (typeof value === 'string' && key && /image|logo|photo|gallery|pic|cover|thumb/i.test(key)) {
    result.push(value);
  }
  return result;
}

function collectJsonFiles() {
  const files = [];
  for (const name of ['tours.json', 'tours-list.json']) {
    const filePath = path.join(dataDir, name);
    if (fs.existsSync(filePath)) files.push(filePath);
  }
  for (const name of fs.readdirSync(dataDir)) {
    if (/^tours-page-\d+\.json$/.test(name)) files.push(path.join(dataDir, name));
  }
  if (fs.existsSync(detailDir)) {
    files.push(...fs.readdirSync(detailDir)
      .filter((name) => name.endsWith('.json'))
      .map((name) => path.join(detailDir, name)));
  }
  return files;
}

function cachePathsFor(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (!/^https?:$/.test(parsed.protocol)) return null;
  const hostDir = parsed.host.replace(/:/g, '_');
  const hash = crypto.createHash('sha1').update(url).digest('hex').slice(0, 16);
  return { hostDir, hash, dir: path.join(imageCacheDir, hostDir) };
}

function isCached(paths) {
  if (!paths) return true;
  if (fs.existsSync(path.join(paths.dir, `${paths.hash}.webp`))) return true;
  if (fs.existsSync(path.join(paths.dir, `${paths.hash}.jpg`))) return true;
  if (fs.existsSync(path.join(paths.dir, `${paths.hash}.jpeg`))) return true;
  if (fs.existsSync(path.join(paths.dir, `${paths.hash}.png`))) return true;
  return false;
}

async function downloadOne(url) {
  const paths = cachePathsFor(url);
  if (!paths) return 'failed';

  let lastError = null;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        redirect: 'follow',
        headers: { 'user-agent': 'Mozilla/5.0 (compatible; EverywhereWeGoGz-image-cache/1)' },
      });
      const contentType = (response.headers.get('content-type') || '').toLowerCase();
      if (!response.ok || !contentType.startsWith('image/')) {
        lastError = new Error(`HTTP ${response.status} ${contentType || 'unknown type'}`);
        continue;
      }
      const buffer = Buffer.from(await response.arrayBuffer());
      if (buffer.length === 0) {
        lastError = new Error('empty body');
        continue;
      }
      let ext = path.extname(new URL(response.url || url).pathname).toLowerCase();
      if (!remoteImageExtensions.has(ext)) {
        ext = contentTypeExt.get(contentType.split(';')[0].trim()) || '.jpg';
      }
      fs.mkdirSync(paths.dir, { recursive: true });
      fs.writeFileSync(path.join(paths.dir, `${paths.hash}${ext}`), buffer);
      stats.bytes += buffer.length;
      return 'downloaded';
    } catch (error) {
      lastError = error;
    } finally {
      clearTimeout(timer);
    }
  }
  console.warn(`download failed: ${url} (${lastError?.message || lastError})`);
  return 'failed';
}

async function main() {
  if (!fs.existsSync(imageCacheDir)) {
    console.log('image-cache directory not found, nothing to download');
    return;
  }

  const candidates = new Set();
  for (const filePath of collectJsonFiles()) {
    const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    for (const value of walkStrings(parsed, null)) {
      if (!/^https?:\/\//i.test(value)) continue;
      const paths = cachePathsFor(value);
      if (!paths) continue;
      stats.scanned += 1;
      if (isCached(paths)) {
        stats.alreadyCached += 1;
        continue;
      }
      candidates.add(value);
    }
  }
  console.log(`scanned ${stats.scanned} remote refs, ${stats.alreadyCached} cached, ${candidates.size} to download`);

  const queue = [...candidates];
  const failed = [];
  let cursor = 0;
  async function worker() {
    while (cursor < queue.length) {
      const url = queue[cursor];
      cursor += 1;
      const outcome = await downloadOne(url);
      if (outcome === 'downloaded') stats.downloaded += 1;
      else {
        stats.failed += 1;
        failed.push(url);
      }
      if ((stats.downloaded + stats.failed) % 100 === 0) {
        console.log(`progress: ${stats.downloaded + stats.failed}/${queue.length}`);
      }
    }
  }
  await Promise.all(Array.from({ length: concurrency }, () => worker()));

  // 失败清单供 optimize_image_cache.mjs 重写为占位图；已恢复缓存的 URL 从清单剔除
  const previous = fs.existsSync(manifestPath)
    ? JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
    : [];
  const stillMissing = [...new Set([...previous, ...failed])].filter((url) => {
    const paths = cachePathsFor(url);
    return !isCached(paths);
  });
  fs.mkdirSync(imageCacheDir, { recursive: true });
  fs.writeFileSync(manifestPath, `${JSON.stringify(stillMissing, null, 2)}\n`, 'utf8');

  console.log(`downloaded: ${stats.downloaded} (${(stats.bytes / 1048576).toFixed(1)} MB)`);
  console.log(`failed: ${stats.failed}, manifest entries: ${stillMissing.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
