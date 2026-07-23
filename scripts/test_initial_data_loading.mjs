import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tourListPath = path.join(root, 'src', 'sections', 'TourList.tsx');
const tourCardPath = path.join(root, 'src', 'sections', 'TourCard.tsx');
const utilsPath = path.join(root, 'src', 'lib', 'utils.ts');
const imagePath = path.join(root, 'src', 'lib', 'image.ts');
const splitPath = path.join(root, 'scripts', 'split_tour_data.mjs');
const optimizePath = path.join(root, 'scripts', 'optimize_image_cache.mjs');
const mergePath = path.join(root, 'scripts', 'merge_data.py');

const tourList = fs.readFileSync(tourListPath, 'utf8');
const tourCard = fs.readFileSync(tourCardPath, 'utf8');
const utils = fs.readFileSync(utilsPath, 'utf8');
const image = fs.readFileSync(imagePath, 'utf8');
const split = fs.readFileSync(splitPath, 'utf8');
const optimize = fs.readFileSync(optimizePath, 'utf8');
const merge = fs.readFileSync(mergePath, 'utf8');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

assert(
  tourList.includes("fetch(getDataUrl('tours-index.json'))"),
  'Initial data load must fetch tours-index.json for filtering.',
);

assert(
  tourList.includes('findTourDeepLinkResolution') && tourList.includes('readTourDeepLink'),
  'TourList should resolve deeplinks from the index/page data path instead of the full catalog fallback.',
);

assert(
  tourList.includes('void indexPromise.then') && !tourList.includes('const indexData = await indexPromise;'),
  'TourList should publish index data as soon as it arrives instead of waiting for the first page chunk.',
);

assert(
  tourList.includes('visibleDisplayCandidates') && tourList.includes('missingPages'),
  'Visible filtered results should load only the missing chunk pages they need.',
);

assert(
  !tourList.includes('const needsFullCatalog ='),
  'Search, filters, and AI should use tours-index.json instead of forcing tours-list.json.',
);

assert(
  tourList.includes('const displayResultCount =') && !tourList.includes('indexTours.length === 0 &&'),
  'Default results should show the index-backed total count while sequential lazy page loading continues beyond the first page.',
);

assert(
  tourList.includes('pageData.meta.hasMore') &&
    tourList.includes('pageHasMoreRef') &&
    tourList.includes('lastContiguousPage'),
  'Infinite scroll should use per-page metadata and contiguous page progress so out-of-order loads cannot stop the sentinel early.',
);

assert(
  tourList.includes('loadingMoreLockRef') && tourList.includes('if (loaded)') && tourList.includes('return true;'),
  'Infinite scroll should synchronously deduplicate observer callbacks and only advance after a page actually loads.',
);

assert(
  tourList.includes('const aiCandidatesReady =') && tourList.includes('toursLoading={loading || !aiCandidatesReady}'),
  'AI recommendations should wait for tours-index.json or the full catalog instead of using only the first page.',
);

assert(
  /setTimeout\(\(\) => \{\s*void loadCatalog\(\);/s.test(tourList),
  'Full catalog should only be scheduled as delayed background enhancement.',
);

assert(
  tourCard.includes('loading="lazy"'),
  'Tour card images must keep native lazy loading enabled.',
);

assert(
  tourCard.includes('fetchPriority="low"'),
  'Tour card images should not compete with JSON data as high-priority fetches.',
);

assert(
  !utils.includes("`https://${path.slice('http://'.length)}`"),
  'Image URL normalization must not force http supplier images to https.',
);

assert(
  image.includes('老广精选线路') && !image.includes('图片暂不可用'),
  'Runtime image fallback should not show scary unavailable-image copy.',
);

assert(
  split.includes('refreshExistingPlaceholderLabels') && split.includes('老广精选线路') && !split.includes('>图片暂不可用<'),
  'Static placeholder SVG generation should refresh old unavailable-image copy.',
);

assert(
  split.includes("'sourceId'") && merge.includes('"sourceId": raw.get(\'sourceId\')'),
  'Data split and merge should preserve sourceId so deeplinks can use a stable share key.',
);

assert(
  optimize.includes('tours-page-') && optimize.includes('pageFilePattern') && optimize.includes('collectRemoteImageReplacements') && optimize.includes('collectLocalLegacyImageReplacements') && optimize.includes('unsupported cached images rewritten to fallback'),
  'Image cache optimization should rewrite tours-page chunks, cached remote image URLs, legacy local image URLs, and unsupported cached images.',
);

assert(
  merge.includes('老广精选线路') && !merge.includes('>图片暂不可用<'),
  'Merge workflow placeholder SVG generation should not reintroduce unavailable-image copy.',
);

console.log('Initial data loading audit passed.');
