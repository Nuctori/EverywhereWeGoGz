import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { prepareRawArtifacts } from './prepare_raw_artifacts.mjs';

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'raw-artifacts-'));
const artifactRoot = path.join(root, 'artifacts');
const dataDir = path.join(root, 'src', 'data');
const report = path.join(root, 'audit', 'raw-source-update-report.json');
const output = path.join(root, 'github-output.txt');
const state = path.join(root, 'src', 'data', 'raw-source-state.json');
const sources = [
  { name: 'same', artifact: 'raw-same', file: 'same.json' },
  { name: 'changed', artifact: 'raw-changed', file: 'changed.json' },
  { name: 'fallback', artifact: 'raw-fallback', file: 'fallback.json' },
];

fs.mkdirSync(path.join(artifactRoot, 'raw-same'), { recursive: true });
fs.mkdirSync(path.join(artifactRoot, 'raw-changed'), { recursive: true });
fs.mkdirSync(dataDir, { recursive: true });

fs.writeFileSync(path.join(dataDir, 'same.json'), '[1]\n');
fs.writeFileSync(path.join(artifactRoot, 'raw-same', 'same.json'), '[1]\n');
fs.writeFileSync(path.join(dataDir, 'changed.json'), '[1]\n');
fs.writeFileSync(path.join(artifactRoot, 'raw-changed', 'changed.json'), '[2]\n');
fs.writeFileSync(path.join(dataDir, 'fallback.json'), '[3]\n');

const result = prepareRawArtifacts({
  artifactRoot,
  dataDir,
  report,
  state,
  githubOutput: output,
  sources,
  now: '2026-07-03T00:00:00.000Z',
  pipelineHash: 'pipeline-v1',
});

assert.equal(result.changed, true);
assert.equal(result.pipelineChanged, true);
assert.equal(result.rebuildRequired, true);
assert.equal(result.staleFallbacks, 1);
assert.equal(result.failures, 0);
assert.equal(fs.readFileSync(path.join(dataDir, 'changed.json'), 'utf8'), '[2]\n');
assert.equal(fs.readFileSync(path.join(dataDir, 'same.json'), 'utf8'), '[1]\n');
assert.equal(fs.readFileSync(path.join(dataDir, 'fallback.json'), 'utf8'), '[3]\n');
assert.match(fs.readFileSync(output, 'utf8'), /raw_changed=true/);
assert.match(fs.readFileSync(output, 'utf8'), /rebuild_required=true/);
assert.match(fs.readFileSync(report, 'utf8'), /"action": "fallback"/);

const unchangedOutput = path.join(root, 'github-output-unchanged.txt');
const unchanged = prepareRawArtifacts({
  artifactRoot,
  dataDir,
  report: path.join(root, 'audit', 'unchanged-report.json'),
  state,
  githubOutput: unchangedOutput,
  sources,
  now: '2026-07-03T00:00:00.000Z',
  pipelineHash: 'pipeline-v1',
});

assert.equal(unchanged.changed, false);
assert.equal(unchanged.pipelineChanged, false);
assert.equal(unchanged.rebuildRequired, false);
assert.match(fs.readFileSync(unchangedOutput, 'utf8'), /rebuild_required=false/);

const pipelineOutput = path.join(root, 'github-output-pipeline.txt');
const pipelineOnly = prepareRawArtifacts({
  artifactRoot,
  dataDir,
  report: path.join(root, 'audit', 'pipeline-report.json'),
  state,
  githubOutput: pipelineOutput,
  sources,
  now: '2026-07-03T00:00:00.000Z',
  pipelineHash: 'pipeline-v2',
});

assert.equal(pipelineOnly.changed, false);
assert.equal(pipelineOnly.pipelineChanged, true);
assert.equal(pipelineOnly.rebuildRequired, true);
assert.match(fs.readFileSync(pipelineOutput, 'utf8'), /raw_changed=false/);
assert.match(fs.readFileSync(pipelineOutput, 'utf8'), /pipeline_changed=true/);
assert.match(fs.readFileSync(pipelineOutput, 'utf8'), /rebuild_required=true/);

assert.throws(
  () => prepareRawArtifacts({
    artifactRoot,
    dataDir,
    report: path.join(root, 'audit', 'missing-report.json'),
    state: path.join(root, 'src', 'data', 'missing-state.json'),
    sources: [{ name: 'missing', artifact: 'raw-missing', file: 'missing.json' }],
  }),
  /crawler artifact missing/,
);

console.log('raw artifact preparation tests passed');
