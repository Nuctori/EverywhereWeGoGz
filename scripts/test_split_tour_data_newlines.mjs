import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const files = [
  'public/data/tours.json',
  'public/data/tours-list.json',
  'public/data/tours-index.json',
  'public/data/tour-map-cards.json',
  'public/data/tours-page-0.json',
  'public/data/tours-meta.json',
  'public/data/tour-details/tour_1.json',
];

for (const file of files) {
  const filePath = path.join(root, file);
  const bytes = fs.readFileSync(filePath);
  assert.equal(bytes.at(-1), 0x0a, `${file} should end with a newline`);
}

console.log('split tour data newline test passed');
