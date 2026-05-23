import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const dataDir = path.join(root, 'public', 'data');
const sourcePath = path.join(dataDir, 'tours.json');
const listPath = path.join(dataDir, 'tours-list.json');
const detailsDir = path.join(dataDir, 'tour-details');

const detailFields = new Set([
  'itinerary',
  'inclusions',
  'exclusions',
  'optionalExpenses',
  'importantNotes',
  'childPolicy',
  'cancellationPolicy',
  'refundPolicy',
]);

const tours = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));

fs.mkdirSync(detailsDir, { recursive: true });

const existingDetailFiles = new Set(
  fs.readdirSync(detailsDir).filter((file) => file.endsWith('.json')),
);

const listTours = tours.map((tour) => {
  const listTour = {};
  const detailTour = {};

  for (const [key, value] of Object.entries(tour)) {
    if (detailFields.has(key)) {
      detailTour[key] = value;
    } else {
      listTour[key] = value;
    }
  }

  const detailFile = `${tour.id}.json`;
  fs.writeFileSync(path.join(detailsDir, detailFile), JSON.stringify(detailTour), 'utf8');
  existingDetailFiles.delete(detailFile);
  return listTour;
});

for (const staleFile of existingDetailFiles) {
  fs.unlinkSync(path.join(detailsDir, staleFile));
}

fs.writeFileSync(listPath, JSON.stringify(listTours), 'utf8');

const sourceSize = fs.statSync(sourcePath).size;
const listSize = fs.statSync(listPath).size;

console.log(`Split ${tours.length} tours`);
console.log(`tours.json ${sourceSize}`);
console.log(`tours-list.json ${listSize}`);
