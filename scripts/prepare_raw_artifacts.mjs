import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const RAW_SOURCES = [
  { name: 'jrt365', artifact: 'raw-jrt365', file: 'raw_jrt365_full.json' },
  { name: 'saihuitong', artifact: 'raw-saihuitong', file: 'raw_saihuitong_full.json' },
  { name: 'pintu', artifact: 'raw-pintu', file: 'raw_pintu_full.json' },
  { name: 'kanghui', artifact: 'raw-kanghui', file: 'raw_kanghui.json' },
  { name: 'gdcts', artifact: 'raw-gdcts', file: 'raw_gdcts_full.json' },
  { name: 'gzl-api', artifact: 'raw-gzl-api', file: 'raw_gzl_api.json' },
  { name: 'outdoors', artifact: 'raw-outdoors', file: 'raw_outdoors_full.json' },
  { name: 'http-aggregate', artifact: 'raw-http', file: 'raw_http_full.json' },
];

function parseArgs(argv) {
  const args = {
    artifactRoot: 'artifacts',
    dataDir: path.join('src', 'data'),
    maxStaleDays: 7,
    report: path.join('audit', 'raw-source-update-report.json'),
    state: path.join('src', 'data', 'raw-source-state.json'),
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];
    if (arg === '--artifact-root') {
      args.artifactRoot = next;
      index += 1;
    } else if (arg === '--data-dir') {
      args.dataDir = next;
      index += 1;
    } else if (arg === '--max-stale-days') {
      args.maxStaleDays = Number(next);
      index += 1;
    } else if (arg === '--report') {
      args.report = next;
      index += 1;
    } else if (arg === '--state') {
      args.state = next;
      index += 1;
    }
  }

  return args;
}

function sha256(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function sha256Text(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function safeStat(filePath) {
  try {
    return fs.statSync(filePath);
  } catch {
    return null;
  }
}

function safeReadJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function hashIfExists(filePath) {
  const stat = safeStat(filePath);
  return stat ? sha256(filePath) : '';
}

export function computePipelineHash(root = process.cwd()) {
  const files = [
    path.join('scripts', 'merge_data.py'),
    path.join('scripts', 'validate_tour_availability.py'),
    path.join('scripts', 'detail_parsers.py'),
    path.join('scripts', 'tour_blacklist.py'),
    path.join('scripts', 'prepare_raw_artifacts.mjs'),
    path.join('.github', 'workflows', 'update-data.yml'),
    path.join('src', 'data', 'tour-availability-cache.json'),
    'package.json',
  ];
  const payload = files.map((relativePath) => {
    const absolutePath = path.join(root, relativePath);
    return `${relativePath}:${hashIfExists(absolutePath)}`;
  }).join('\n');
  return sha256Text(payload);
}

function lastGitCommitDate(filePath, cwd = process.cwd()) {
  try {
    const output = execFileSync('git', ['log', '-1', '--format=%cI', '--', filePath], {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    return output ? new Date(output) : null;
  } catch {
    return null;
  }
}

function ageDays(since, now) {
  return (now.getTime() - since.getTime()) / 86_400_000;
}

function writeGithubOutput(values, outputPath = process.env.GITHUB_OUTPUT) {
  if (!outputPath) {
    return;
  }
  const lines = Object.entries(values).map(([key, value]) => `${key}=${value}`);
  fs.appendFileSync(outputPath, `${lines.join('\n')}\n`, 'utf8');
}

export function prepareRawArtifacts(options = {}) {
  const artifactRoot = path.resolve(options.artifactRoot ?? 'artifacts');
  const dataDir = path.resolve(options.dataDir ?? path.join('src', 'data'));
  const maxStaleDays = Number(options.maxStaleDays ?? 7);
  const reportPath = path.resolve(options.report ?? path.join('audit', 'raw-source-update-report.json'));
  const statePath = path.resolve(options.state ?? path.join('src', 'data', 'raw-source-state.json'));
  const now = options.now ? new Date(options.now) : new Date();
  const sources = options.sources ?? RAW_SOURCES;
  const pipelineHash = options.pipelineHash ?? computePipelineHash();
  const previousState = safeReadJson(statePath);
  const rows = [];
  let changed = false;
  let staleFallbacks = 0;
  let failures = 0;

  fs.mkdirSync(dataDir, { recursive: true });

  for (const source of sources) {
    const artifactPath = path.join(artifactRoot, source.artifact, source.file);
    const targetPath = path.join(dataDir, source.file);
    const artifactStat = safeStat(artifactPath);
    const targetStat = safeStat(targetPath);

    if (artifactStat) {
      const newHash = sha256(artifactPath);
      const oldHash = targetStat ? sha256(targetPath) : '';
      const action = newHash === oldHash ? 'unchanged' : 'updated';
      if (action === 'updated') {
        fs.copyFileSync(artifactPath, targetPath);
        changed = true;
      }
      rows.push({
        source: source.name,
        file: source.file,
        action,
        hash: newHash,
        bytes: artifactStat.size,
      });
      continue;
    }

    if (!targetStat) {
      failures += 1;
      rows.push({
        source: source.name,
        file: source.file,
        action: 'missing',
        error: 'crawler artifact missing and no previous raw file exists',
      });
      continue;
    }

    const commitDate = lastGitCommitDate(path.relative(process.cwd(), targetPath));
    const fallbackAge = commitDate ? ageDays(commitDate, now) : 0;
    if (commitDate && Number.isFinite(maxStaleDays) && fallbackAge > maxStaleDays) {
      failures += 1;
      rows.push({
        source: source.name,
        file: source.file,
        action: 'stale',
        error: `previous raw file is ${fallbackAge.toFixed(1)} days old`,
        lastUpdatedAt: commitDate.toISOString(),
      });
      continue;
    }

    staleFallbacks += 1;
    rows.push({
      source: source.name,
      file: source.file,
      action: 'fallback',
      hash: sha256(targetPath),
      bytes: targetStat.size,
      lastUpdatedAt: commitDate ? commitDate.toISOString() : null,
    });
  }

  const previousPipelineHash = previousState?.pipelineHash ?? '';
  const pipelineChanged = previousPipelineHash !== pipelineHash;
  const rebuildRequired = changed || pipelineChanged;
  const report = {
    generatedAt: now.toISOString(),
    changed,
    pipelineChanged,
    rebuildRequired,
    staleFallbacks,
    failures,
    pipelineHash,
    previousPipelineHash,
    sources: rows,
  };
  const nextState = {
    generatedAt: now.toISOString(),
    pipelineHash,
    sources: rows
      .filter((row) => row.hash)
      .map((row) => ({
        source: row.source,
        file: row.file,
        hash: row.hash,
        action: row.action,
        bytes: row.bytes,
      })),
  };

  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  fs.mkdirSync(path.dirname(statePath), { recursive: true });
  fs.writeFileSync(statePath, `${JSON.stringify(nextState, null, 2)}\n`, 'utf8');
  writeGithubOutput({
    raw_changed: changed ? 'true' : 'false',
    pipeline_changed: pipelineChanged ? 'true' : 'false',
    rebuild_required: rebuildRequired ? 'true' : 'false',
    stale_fallbacks: String(staleFallbacks),
    failures: String(failures),
  }, options.githubOutput);

  if (failures > 0) {
    const details = rows.filter((row) => row.action === 'missing' || row.action === 'stale');
    throw new Error(`raw artifact preparation failed: ${JSON.stringify(details)}`);
  }

  return report;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const args = parseArgs(process.argv.slice(2));
  const report = prepareRawArtifacts(args);
  console.log(
    `[raw-artifacts] changed=${report.changed} pipelineChanged=${report.pipelineChanged} ` +
    `rebuildRequired=${report.rebuildRequired} staleFallbacks=${report.staleFallbacks}`,
  );
  for (const row of report.sources) {
    console.log(`[raw-artifacts] ${row.source}: ${row.action}`);
  }
}
