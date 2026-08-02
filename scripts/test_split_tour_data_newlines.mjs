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
const placeCardDir = fs.readdirSync(path.join(root, 'public/data/tour-map-place-cards'), { withFileTypes: true }).find((entry) => entry.isDirectory());
const placeCardFile = placeCardDir && fs.readdirSync(path.join(root, 'public/data/tour-map-place-cards', placeCardDir.name)).find((file) => file.endsWith('.json'));
if (placeCardDir && placeCardFile) files.push(`public/data/tour-map-place-cards/${placeCardDir.name}/${placeCardFile}`);

for (const file of files) {
  const filePath = path.join(root, file);
  const bytes = fs.readFileSync(filePath);
  assert.equal(bytes.at(-1), 0x0a, `${file} should end with a newline`);
}

console.log('split tour data newline test passed');
