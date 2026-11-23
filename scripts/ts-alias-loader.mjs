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

// TS/Vite 允许省略扩展名（import '../lib/foo'），Node 的 ESM 解析不允许。
// 只有 Node 本来就会失败时才兜底，不会改变已经能解析的模块。
function resolveRelativeTsPath(specifier, parentUrl) {
  if (!specifier.startsWith('.') || !parentUrl?.startsWith('file:')) return null;

  const candidatePath = path.resolve(path.dirname(fileURLToPath(parentUrl)), specifier);
  if (path.extname(candidatePath)) return null;

  for (const suffix of ['.ts', '.tsx', '/index.ts', '/index.tsx']) {
    if (existsSync(candidatePath + suffix)) return pathToFileURL(candidatePath + suffix).href;
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

  const relativeUrl = resolveRelativeTsPath(specifier, context.parentURL);
  if (relativeUrl) {
    return {
      shortCircuit: true,
      url: relativeUrl,
    };
  }

  return nextResolve(specifier, context);
}
