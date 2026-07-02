import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tourListPath = path.join(root, 'src', 'sections', 'TourList.tsx');
const tourCardPath = path.join(root, 'src', 'sections', 'TourCard.tsx');

const tourList = fs.readFileSync(tourListPath, 'utf8');
const tourCard = fs.readFileSync(tourCardPath, 'utf8');

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
  tourList.includes('visibleDisplayCandidates') && tourList.includes('missingPages'),
  'Visible filtered results should load only the missing chunk pages they need.',
);

assert(
  /const hasMoreRemotePages =\s*hasPageChunks &&\s*catalogTours\.length === 0 &&\s*localTours\.length < total;/s.test(tourList),
  'Default unfiltered scrolling must keep loading remote page chunks after tours-index.json arrives.',
);

assert(
  tourList.includes('const recommendationsReady =') &&
    tourList.includes('indexTours.length > 0 || catalogTours.length > 0 || !hasPageChunks') &&
    tourList.includes('toursLoading={loading || !recommendationsReady}'),
  'AI recommendations must keep showing loading until the index or full catalog is ready.',
);

assert(
  !tourList.includes('const needsFullCatalog ='),
  'Search, filters, and AI should use tours-index.json instead of forcing tours-list.json.',
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

console.log('Initial data loading audit passed.');
