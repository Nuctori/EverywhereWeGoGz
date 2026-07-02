import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const publicDir = path.join(root, 'public');
const imageCacheDir = path.join(publicDir, 'data', 'image-cache');
const dataDir = path.join(publicDir, 'data');
const sourcePath = path.join(dataDir, 'tours.json');
const listPath = path.join(dataDir, 'tours-list.json');
const detailDir = path.join(dataDir, 'tour-details');
const targetExtensions = new Set(['.jpg', '.jpeg', '.png']);
const skippedExtensions = new Set(['.svg', '.webp', '.gif']);
const quality = Number(process.env.IMAGE_CACHE_WEBP_QUALITY || 68);
const stats = {
  convertedCount: 0,
  reusedExistingWebpCount: 0,
  skippedCount: 0,
  removedOriginalCount: 0,
  removalDeferredCount: 0,
  failedConversionCount: 0,
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
      stats.skippedCount += 1;
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
  rewriteJsonFile(sourcePath, replacements);
  rewriteJsonFile(listPath, replacements);

  for (const detailFile of walkFiles(detailDir).filter((filePath) => filePath.endsWith('.json'))) {
    rewriteJsonFile(detailFile, replacements);
  }

  cleanupOriginals(deferredOriginals);

  const remainingLegacyImages = countRemainingLegacyImages();

  console.log(`webp converted: ${stats.convertedCount}`);
  console.log(`webp reused: ${stats.reusedExistingWebpCount}`);
  console.log(`files skipped: ${stats.skippedCount}`);
  console.log(`original files removed: ${stats.removedOriginalCount}`);
  console.log(`original cleanup deferred: ${stats.removalDeferredCount}`);
  console.log(`webp conversion failures: ${stats.failedConversionCount}`);
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
