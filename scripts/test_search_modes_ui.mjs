import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from 'playwright';

const repoRoot = process.cwd();
const require = createRequire(import.meta.url);
const viteBin = require.resolve('vite/package.json').replace(/package\.json$/, 'bin/vite.js');
const PORT_CANDIDATES = [4173, 4174, 4175, 4176, 4177, 4178];

function startServer(port) {
  const proc = spawn(
    process.execPath,
    [viteBin, '--host', '127.0.0.1', '--port', String(port), '--strictPort'],
    {
      cwd: repoRoot,
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    },
  );

  proc.stdout.on('data', (chunk) => process.stdout.write(chunk));
  proc.stderr.on('data', (chunk) => process.stderr.write(chunk));
  return proc;
}

async function fetchWithTimeout(url, timeoutMs = 2000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { cache: 'no-store', signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function waitForServer(url, timeoutMs = 120000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetchWithTimeout(url, 2000);
      if (response.ok) return;
    } catch {
      // keep polling
    }
    await delay(1000);
  }
  throw new Error(`Timed out waiting for ${url}`);
}

async function launchPreview() {
  let lastError = null;
  for (const port of PORT_CANDIDATES) {
    const url = `http://127.0.0.1:${port}`;

    try {
      const existing = await fetchWithTimeout(url, 2000);
      if (existing.ok) {
        return { proc: null, port, url };
      }
    } catch {
      // no responsive server on this port yet
    }

    const proc = startServer(port);
    try {
      await waitForServer(url, 30000);
      return { proc, port, url };
    } catch (error) {
      lastError = error;
      proc.kill('SIGTERM');
      await delay(1500);
    }
  }

  throw lastError || new Error('Unable to start a local preview server');
}

const server = await launchPreview();
try {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } });

  await page.goto(server.url, { waitUntil: 'domcontentloaded' });
  await page.getByPlaceholder('例如：帮我找同时带温泉和沙滩的团，预算800内').waitFor({ state: 'visible' });

  const input = page.getByPlaceholder('例如：帮我找同时带温泉和沙滩的团，预算800内');
  const plainSearchButton = page.getByRole('button', { name: '搜索', exact: true });
  const aiSearchButton = page.getByRole('button', { name: 'AI 找团', exact: true });
  const aiPanelTitle = page.getByText('AI 优先级助手');

  await input.fill('沙扒湾');
  await plainSearchButton.click();
  await page.waitForTimeout(1200);
  assert.equal(await aiPanelTitle.count(), 0, 'simple destination search should not open AI panel');

  await input.fill('帮我找沙扒湾');
  await plainSearchButton.click();
  await page.waitForTimeout(1200);
  assert.equal(await aiPanelTitle.count(), 0, 'request phrase plus destination should stay in plain search');

  await input.fill('预算3000内');
  await plainSearchButton.click();
  await aiPanelTitle.waitFor({ state: 'visible', timeout: 30000 });
  assert.ok((await aiPanelTitle.count()) >= 1, 'structured budget-only query should open AI panel');

  await input.fill('帮我找沙扒湾');
  await plainSearchButton.click();
  await aiPanelTitle.waitFor({ state: 'hidden', timeout: 30000 });
  assert.equal(await aiPanelTitle.count(), 0, 'plain destination search should clear previous AI panel');

  await input.fill('帮我找同时带温泉和沙滩，预算800内，最好2天游');
  await plainSearchButton.click();
  await aiPanelTitle.waitFor({ state: 'visible', timeout: 30000 });
  assert.ok((await aiPanelTitle.count()) >= 1, 'complex query search should open AI panel');

  await input.fill('沙扒湾');
  await aiSearchButton.click();
  await aiPanelTitle.waitFor({ state: 'visible', timeout: 30000 });
  assert.ok((await aiPanelTitle.count()) >= 1, 'explicit AI button should open AI panel');

  await plainSearchButton.click();
  await aiPanelTitle.waitFor({ state: 'hidden', timeout: 30000 });
  assert.equal(await aiPanelTitle.count(), 0, 'plain search should clear AI panel');

  await browser.close();
  console.log(`search mode UI regression passed on ${server.port}`);
} finally {
  server.proc?.kill('SIGTERM');
}
