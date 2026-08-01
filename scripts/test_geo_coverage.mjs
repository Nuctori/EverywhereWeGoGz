import fs from "node:fs";

const reportPath = "audit/geo-coverage-report.json";
const toursPath = "public/data/tours.json";
const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
const tours = JSON.parse(fs.readFileSync(toursPath, "utf8"));

if (!Array.isArray(tours)) throw new Error("public/data/tours.json must be an array");

const hasCoordinate = (tour) => (
  Number.isFinite(tour.destinationLatitude)
  && Number.isFinite(tour.destinationLongitude)
);
const after = {
  tours: tours.length,
  withDestination: tours.filter(hasCoordinate).length,
};
after.unmapped = after.tours - after.withDestination;

const expectedAfter = report.after;
for (const key of ["tours", "withDestination", "unmapped"]) {
  if (after[key] !== expectedAfter[key]) {
    throw new Error(`geo coverage mismatch for ${key}: ${after[key]} !== ${expectedAfter[key]}`);
  }
}

const expectedDelta = {
  withDestination: expectedAfter.withDestination - report.before.withDestination,
  unmapped: expectedAfter.unmapped - report.before.unmapped,
};
for (const key of Object.keys(expectedDelta)) {
  if (expectedDelta[key] !== report.delta[key]) {
    throw new Error(`geo coverage delta mismatch for ${key}`);
  }
}

const coverage = after.withDestination / after.tours;
const beforeCoverage = report.before.withDestination / report.before.tours;
const improvementPp = (coverage - beforeCoverage) * 100;
if (Math.abs(improvementPp - report.coverageImprovementPp) > 0.001) {
  throw new Error("geo coverage percentage improvement mismatch");
}

console.log(JSON.stringify({
  before: report.before,
  after,
  delta: report.delta,
  coverage: Number((coverage * 100).toFixed(2)),
  coverageImprovementPp: Number(improvementPp.toFixed(2)),
}, null, 2));
