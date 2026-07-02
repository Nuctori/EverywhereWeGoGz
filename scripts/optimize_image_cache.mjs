import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';

const root = process.cwd();
const publicDir = path.join(root, 'public');
const imageCacheDir = path.join(publicDir, 'data', 'image-cache');
const dataDir = path.join(publicDir, 'data');
const sourcePath = path.join(dataDir, 'tours.json');
const listPath = path.join(dataDir, 'tours-list.json');
const detailDir = path.join(dataDir, 'tour-details');
const pageFilePattern = /^tours-page-\d+\.json$/;
const targetExtensions = new Set(['.jpg', '.jpeg', '.png']);
const skippedExtensions = new Set(['.svg', '.webp', '.gif']);
const remoteImageExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.svg']);
const quality = Number(process.env.IMAGE_CACHE_WEBP_QUALITY || 68);
const fallbackPlaceholderLabel = '老广精选线路';
const stats = {
  convertedCount: 0,
  reusedExistingWebpCount: 0,
  skippedCount: 0,
  removedOriginalCount: 0,
  removalDeferredCount: 0,
  failedConversionCount: 0,
  remoteRewriteCount: 0,
  remoteDownloadedCount: 0,
  remoteDownloadFailedCount: 0,
  localLegacyRewriteCount: 0,
  unsupportedRewriteCount: 0,
  originalBytes: 0,
  webpBytes: 0,
};

function walkFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkFiles(fullPath));
      continue;
    }
    if (entry.isFile()) {
      files.push(fullPath);
    }
  }
  return files;
}

function toPublicPath(filePath) {
  return `/${path.relative(publicDir, filePath).replace(/\\/g, '/')}`;
}

function ensureFallbackPlaceholder() {
  const placeholderDir = path.join(imageCacheDir, 'placeholders');
  fs.mkdirSync(placeholderDir, { recursive: true });
  const filePath = path.join(placeholderDir, 'fallback.svg');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#e2e8f0"/><stop offset="100%" stop-color="#cbd5e1"/></linearGradient></defs><rect width="800" height="600" fill="url(#g)"/><rect x="60" y="60" width="680" height="480" rx="32" fill="#f8fafc" opacity="0.88"/><text x="400" y="315" text-anchor="middle" font-size="42" fill="#475569" font-family="Arial, sans-serif">${fallbackPlaceholderLabel}</text></svg>`;
  fs.writeFileSync(filePath, svg, 'utf8');
  return toPublicPath(filePath);
}

function replaceImagePathsInObject(value, replacements) {
  if (typeof value === 'string') {
    return replacements.get(value) || value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => replaceImagePathsInObject(item, replacements));
  }
  if (value && typeof value === 'object') {
    const next = {};
    for (const [key, child] of Object.entries(value)) {
      next[key] = replaceImagePathsInObject(child, replacements);
    }
    return next;
  }
  return value;
}

function collectStrings(value, result = []) {
  if (typeof value === 'string') {
    result.push(value);
    return result;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectStrings(item, result);
    return result;
  }
  if (value && typeof value === 'object') {
    for (const child of Object.values(value)) collectStrings(child, result);
  }
  return result;
}

function cachedPublicPathForRemoteImage(url) {
  if (!/^https?:\/\//i.test(url)) return null;
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  const hostDir = parsed.host.replace(/:/g, '_');
  let ext = path.extname(parsed.pathname).toLowerCase();
  if (!remoteImageExtensions.has(ext)) ext = '.jpg';
  const hash = crypto.createHash('sha1').update(url).digest('hex').slice(0, 16);
  const cachedOriginalPath = path.join(imageCacheDir, hostDir, `${hash}${ext}`);
  const cachedWebpPath = path.join(imageCacheDir, hostDir, `${hash}.webp`);

  if (fs.existsSync(cachedWebpPath)) return toPublicPath(cachedWebpPath);
  if (fs.existsSync(cachedOriginalPath)) return toPublicPath(cachedOriginalPath);
  return null;
}

async function cacheRemoteImage(url) {
  if (process.env.IMAGE_CACHE_DOWNLOAD_REMOTE !== '1') {
    return null;
  }

  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  const hostDir = parsed.host.replace(/:/g, '_');
  const hostCacheDir = path.join(imageCacheDir, hostDir);
  fs.mkdirSync(hostCacheDir, { recursive: true });
  const hash = crypto.createHash('sha1').update(url).digest('hex').slice(0, 16);
  const webpPath = path.join(hostCacheDir, `${hash}.webp`);
  if (fs.existsSync(webpPath)) return toPublicPath(webpPath);

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
      signal: AbortSignal.timeout(Number(process.env.IMAGE_CACHE_REMOTE_TIMEOUT_MS || 15000)),
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const contentType = response.headers.get('content-type')?.toLowerCase() || '';
    if (contentType && !contentType.includes('image')) {
      throw new Error(`unexpected content-type: ${contentType}`);
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    await sharp(buffer)
      .rotate()
      .webp({
        quality,
        effort: 4,
      })
      .toFile(webpPath);
    stats.remoteDownloadedCount += 1;
    return toPublicPath(webpPath);
  } catch (error) {
    stats.remoteDownloadFailedCount += 1;
    console.warn(`remote image fallback: ${url} (${error.message})`);
    return ensureFallbackPlaceholder();
  }
}

function cachedPublicPathForLocalLegacyImage(value) {
  if (!value.startsWith('/data/image-cache/')) return null;
  const ext = path.extname(value).toLowerCase();
  if (!targetExtensions.has(ext)) return null;

  const originalPath = path.join(publicDir, value.slice(1));
  const webpPath = originalPath.replace(/\.(jpg|jpeg|png)$/i, '.webp');
  if (fs.existsSync(webpPath)) return toPublicPath(webpPath);
  if (!fs.existsSync(originalPath)) return ensureFallbackPlaceholder();
  return null;
}

function getJsonDataFiles() {
  const files = [sourcePath, listPath];
  for (const pageFile of fs.readdirSync(dataDir).filter((file) => pageFilePattern.test(file))) {
    files.push(path.join(dataDir, pageFile));
  }
  files.push(...walkFiles(detailDir).filter((filePath) => filePath.endsWith('.json')));
  return files;
}

async function collectRemoteImageReplacements(jsonFiles) {
  const replacements = new Map();
  const remoteUrls = new Set();

  for (const filePath of jsonFiles) {
    if (!fs.existsSync(filePath)) continue;
    const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    for (const value of collectStrings(parsed)) {
      if (/^https?:\/\//i.test(value)) {
        remoteUrls.add(value);
      }
    }
  }

  const remoteValues = [...remoteUrls];
  const concurrency = Math.max(1, Number(process.env.IMAGE_CACHE_REMOTE_CONCURRENCY || 12));
  let cursor = 0;
  async function worker() {
    while (cursor < remoteValues.length) {
      const value = remoteValues[cursor];
      cursor += 1;
      const cachedPath = cachedPublicPathForRemoteImage(value) || await cacheRemoteImage(value);
      if (cachedPath && cachedPath !== value) {
        replacements.set(value, cachedPath);
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, remoteValues.length) }, () => worker()));

  return replacements;
}

function collectLocalLegacyImageReplacements(jsonFiles) {
  const replacements = new Map();

  for (const filePath of jsonFiles) {
    if (!fs.existsSync(filePath)) continue;
    const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    for (const value of collectStrings(parsed)) {
      const cachedPath = cachedPublicPathForLocalLegacyImage(value);
      if (cachedPath && cachedPath !== value) {
        replacements.set(value, cachedPath);
      }
    }
  }

  return replacements;
}

function tryUnlink(filePath) {
  try {
    fs.unlinkSync(filePath);
    stats.removedOriginalCount += 1;
    return true;
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error) {
      const code = String(error.code || '');
      if (code === 'EBUSY' || code === 'EPERM' || code === 'EACCES') {
        stats.removalDeferredCount += 1;
        console.warn(`deferred original cleanup: ${path.relative(root, filePath)} (${code})`);
        return false;
      }
    }
    throw error;
  }
}

async function ensureWebp(filePath) {
  const webpPath = filePath.replace(/\.(jpg|jpeg|png)$/i, '.webp');
  const originalStat = fs.statSync(filePath);
  stats.originalBytes += originalStat.size;

  if (fs.existsSync(webpPath)) {
    stats.reusedExistingWebpCount += 1;
  } else {
    try {
      await sharp(filePath)
        .rotate()
        .webp({
          quality,
          effort: 4,
        })
        .toFile(webpPath);
    } catch (error) {
      stats.failedConversionCount += 1;
      console.warn(`skipped unsupported image: ${path.relative(root, filePath)} (${error.message})`);
      return null;
    }
    stats.convertedCount += 1;
  }

  const webpStat = fs.statSync(webpPath);
  stats.webpBytes += webpStat.size;

  return webpPath;
}

async function collectReplacementsFromCache() {
  const files = walkFiles(imageCacheDir);
  const replacements = new Map();
  const deferredOriginals = [];

  for (const filePath of files) {
    const ext = path.extname(filePath).toLowerCase();
    if (skippedExtensions.has(ext)) {
      stats.skippedCount += 1;
      continue;
    }
    if (!targetExtensions.has(ext)) {
      stats.skippedCount += 1;
      continue;
    }

    const webpPath = await ensureWebp(filePath);
    if (!webpPath) {
      replacements.set(toPublicPath(filePath), ensureFallbackPlaceholder());
      stats.unsupportedRewriteCount += 1;
      stats.skippedCount += 1;
      if (!tryUnlink(filePath)) {
        deferredOriginals.push(filePath);
      }
      continue;
    }
    replacements.set(toPublicPath(filePath), toPublicPath(webpPath));

    if (!tryUnlink(filePath)) {
      deferredOriginals.push(filePath);
    }
  }

  return { replacements, deferredOriginals };
}

function rewriteJsonFile(filePath, replacements) {
  if (!fs.existsSync(filePath) || replacements.size === 0) return;
  const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const rewritten = replaceImagePathsInObject(parsed, replacements);
  fs.writeFileSync(filePath, `${JSON.stringify(rewritten)}\n`, 'utf8');
}

function cleanupOriginals(files) {
  for (const filePath of files) {
    if (!fs.existsSync(filePath)) continue;
    tryUnlink(filePath);
  }
}

function countRemainingLegacyImages() {
  let remaining = 0;
  for (const filePath of walkFiles(imageCacheDir)) {
    const ext = path.extname(filePath).toLowerCase();
    if (targetExtensions.has(ext)) {
      remaining += 1;
    }
  }
  return remaining;
}

async function main() {
  if (!fs.existsSync(imageCacheDir)) {
    console.log('image-cache directory not found, skipping optimization');
    return;
  }

  const { replacements, deferredOriginals } = await collectReplacementsFromCache();
  const jsonFiles = getJsonDataFiles();
  const remoteReplacements = await collectRemoteImageReplacements(jsonFiles);
  for (const [remoteUrl, cachedPath] of remoteReplacements) {
    replacements.set(remoteUrl, cachedPath);
  }
  stats.remoteRewriteCount = remoteReplacements.size;
  const localLegacyReplacements = collectLocalLegacyImageReplacements(jsonFiles);
  for (const [legacyPath, cachedPath] of localLegacyReplacements) {
    replacements.set(legacyPath, cachedPath);
  }
  stats.localLegacyRewriteCount = localLegacyReplacements.size;

  for (const jsonFile of jsonFiles) {
    rewriteJsonFile(jsonFile, replacements);
  }

  cleanupOriginals(deferredOriginals);

  const remainingLegacyImages = countRemainingLegacyImages();

  console.log(`webp converted: ${stats.convertedCount}`);
  console.log(`webp reused: ${stats.reusedExistingWebpCount}`);
  console.log(`files skipped: ${stats.skippedCount}`);
  console.log(`original files removed: ${stats.removedOriginalCount}`);
  console.log(`original cleanup deferred: ${stats.removalDeferredCount}`);
  console.log(`webp conversion failures: ${stats.failedConversionCount}`);
  console.log(`external image URLs rewritten to cache: ${stats.remoteRewriteCount}`);
  console.log(`external image URLs downloaded to cache: ${stats.remoteDownloadedCount}`);
  console.log(`external image URL download fallbacks: ${stats.remoteDownloadFailedCount}`);
  console.log(`legacy local image URLs rewritten to cache: ${stats.localLegacyRewriteCount}`);
  console.log(`unsupported cached images rewritten to fallback: ${stats.unsupportedRewriteCount}`);
  console.log(`remaining legacy cache images: ${remainingLegacyImages}`);
  console.log(`original image-cache bytes: ${stats.originalBytes}`);
  console.log(`webp image-cache bytes: ${stats.webpBytes}`);
  if (stats.originalBytes > 0) {
    const ratio = (stats.webpBytes / stats.originalBytes).toFixed(3);
    console.log(`webp ratio: ${ratio}`);
  }

  if (remainingLegacyImages > 0 && process.env.IMAGE_CACHE_WEBP_STRICT === '1') {
    process.exitCode = 1;
    console.error(`image-cache still contains ${remainingLegacyImages} jpg/jpeg/png files`);
  } else if (remainingLegacyImages > 0) {
    console.warn(`image-cache still contains ${remainingLegacyImages} jpg/jpeg/png files`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
