import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const SERVER_ROOT = path.join(ROOT, 'server');
const IMPORT_RE = /\bfrom\s*['"]([^'"]+)['"]|\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g;

const RULES = [
  {
    owner: 'Contracts',
    forbidden: ['Repositories', 'Services', 'app.ts', 'index.ts'],
  },
  {
    owner: 'Repositories',
    forbidden: ['Services', 'app.ts', 'index.ts'],
  },
  {
    owner: 'Services',
    forbidden: ['Repositories'],
  },
];

function detectLayer(filePath) {
  const normalized = filePath.replace(/\\/g, '/');
  if (normalized.includes('/server/Contracts/')) return 'Contracts';
  if (normalized.includes('/server/Repositories/')) return 'Repositories';
  if (normalized.includes('/server/Services/')) return 'Services';
  if (normalized.includes('/server/Configs/')) return 'Configs';
  if (normalized.includes('/server/Utils/')) return 'Utils';
  return 'Other';
}

async function collectTsFiles(directoryPath) {
  const entries = await fs.readdir(directoryPath, { withFileTypes: true });
  const nested = await Promise.all(
    entries
      .filter((entry) => entry.name !== 'node_modules' && entry.name !== 'dist')
      .map(async (entry) => {
        const fullPath = path.join(directoryPath, entry.name);
        if (entry.isDirectory()) {
          return collectTsFiles(fullPath);
        }
        if (entry.isFile() && entry.name.endsWith('.ts')) {
          return [fullPath];
        }
        return [];
      }),
  );
  return nested.flat();
}

function isForbidden(ownerLayer, dependencyPath) {
  const rule = RULES.find((item) => item.owner === ownerLayer);
  if (!rule) return false;
  return rule.forbidden.some((keyword) => dependencyPath.includes(keyword));
}

function normalizeDependency(ownerFile, specifier) {
  if (!specifier.startsWith('.')) {
    return null;
  }
  return path.resolve(path.dirname(ownerFile), specifier);
}

async function main() {
  const serverFiles = await collectTsFiles(SERVER_ROOT);
  const violations = [];

  for (const filePath of serverFiles) {
    const content = await fs.readFile(filePath, 'utf-8');
    const ownerLayer = detectLayer(filePath);

    let match;
    while ((match = IMPORT_RE.exec(content)) !== null) {
      const specifier = match[1] ?? match[2];
      const dependency = normalizeDependency(filePath, specifier);
      if (!dependency) continue;
      if (!dependency.startsWith(SERVER_ROOT)) continue;

      const relativeDependency = dependency
        .replace(ROOT, '')
        .replace(/\\/g, '/');

      if (isForbidden(ownerLayer, relativeDependency)) {
        const ownerRelative = filePath.replace(ROOT, '').replace(/\\/g, '/');
        violations.push(`${ownerRelative} -> ${relativeDependency}`);
      }
    }
  }

  if (violations.length > 0) {
    console.error('Architecture check failed. Forbidden dependencies:');
    for (const violation of violations) {
      console.error(`- ${violation}`);
    }
    process.exit(1);
  }

  console.log('Architecture check passed.');
}

main().catch((error) => {
  console.error('Architecture check crashed:', error);
  process.exit(1);
});
