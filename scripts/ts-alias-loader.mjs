// ? Node ???? TS ????????????? src ?? TypeScript ???
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const srcRoot = path.join(projectRoot, 'src');

function resolveAliasPath(specifier) {
  if (!specifier.startsWith('@/')) return null;

  const relativePath = specifier.slice(2);
  const basePath = path.join(srcRoot, relativePath);
  for (const candidate of [basePath, `${basePath}.ts`, `${basePath}.tsx`]) {
    if (existsSync(candidate)) return pathToFileURL(candidate).href;
  }

  return null;
}

export async function resolve(specifier, context, nextResolve) {
  const aliasUrl = resolveAliasPath(specifier);
  if (aliasUrl) {
    return {
      shortCircuit: true,
      url: aliasUrl,
    };
  }

  return nextResolve(specifier, context);
}
