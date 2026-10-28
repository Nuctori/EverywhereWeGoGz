// Offline, isolated mobile recovery regression. Build first, or set AI_RECOVERY_DIST.
import { chromium } from 'playwright';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = path.resolve(process.env.AI_RECOVERY_DIST || 'dist');
const reportPath = path.resolve(process.env.AI_RECOVERY_REPORT || 'tmp/ai-mobile-recovery-e2e-results.json');
const stateKey = 'travel-ai-chat-state-v2';
const progressKey = 'travel-ai-progress-v1';
const report = { dist: root, startedAt: new Date().toISOString(), scenarios: [], pageerrors: [] };
const server = http.createServer((req, res) => {
  try {
    let pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname).replace(/^\/EverywhereWeGoGz(?=\/|$)/, '');
    if (!pathname || pathname === '/') pathname = '/index.html';
    const file = path.resolve(root, '.' + pathname);
    if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
      res.writeHead(404); res.end(); return;
    }
    res.setHeader('Content-Type', ({ '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.webp': 'image/webp' })[path.extname(file)] || 'application/octet-stream');
    fs.createReadStream(file).on('error', () => res.destroy()).pipe(res);
  } catch { res.writeHead(400); res.end(); }
});
let browser;
let origin;

// All model calls terminate inside the page. The route guard denies every
// request outside this server, including CDN assets and accidental real APIs.
async function fixture(entry, mode = 'partial') {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  page.on('pageerror', error => {
    const detail = { message: error.message, stack: error.stack || String(error) };
    entry.pageerrors.push(detail);
    report.pageerrors.push({ scenario: entry.name, ...detail });
  });
  await context.route('**/*', route => {
    if (new URL(route.request().url()).origin === origin) return route.continue();
    entry.blockedExternal.push(route.request().url());
    return route.abort('blockedbyclient');
  });
  await context.addInitScript(({ initialMode }) => {
    window.__recoveryMode = sessionStorage.getItem('recovery-test-mode') || initialMode;
    window.__recoveryCalls = JSON.parse(sessionStorage.getItem('recovery-test-calls') || '[]');
    window.__setRecoveryMode = mode => {
      window.__recoveryMode = mode;
      sessionStorage.setItem('recovery-test-mode', mode);
    };
    window.__setVisibility = state => {
      Object.defineProperty(document, 'visibilityState', { configurable: true, value: state });
      Object.defineProperty(document, 'hidden', { configurable: true, value: state === 'hidden' });
      document.dispatchEvent(new Event('visibilitychange'));
    };
    window.__setOnline = online => {
      Object.defineProperty(navigator, 'onLine', { configurable: true, value: online });
      window.dispatchEvent(new Event(online ? 'online' : 'offline'));
    };
    const realFetch = window.fetch.bind(window);
    window.fetch = async (input, init) => {
      const url = typeof input === 'string' ? input : input.url || String(input);
      if (!url.includes('chat/completions')) return realFetch(input, init);
      const request = JSON.parse(init?.body || '{}');
      const prompt = JSON.stringify(request.messages);
      const ranking = prompt.includes('rank_5detailed_10brief');
      const call = { ranking, messages: request.messages, mode: window.__recoveryMode };
      window.__recoveryCalls.push(call);
      sessionStorage.setItem('recovery-test-calls', JSON.stringify(window.__recoveryCalls));
      if (window.__recoveryMode === 'offline') throw new TypeError('Failed to fetch (offline recovery fixture)');
      if (!ranking) return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({ queries: ['推荐线路'], demands: [], destinations: [] }) } }] }), { headers: { 'content-type': 'application/json' } });
      const index = await (await realFetch('/EverywhereWeGoGz/data/tours-index.json')).json();
      const ids = new Set([...prompt.matchAll(/tour_\d+/g)].map(match => match[0]));
      const tours = index.filter(tour => ids.has(tour.id) && tour.price > 0).slice(0, 2);
      if (tours.length !== 2) throw new Error('Recovery fixture requires two real ranking candidates');
      call.order = tours.map(tour => tour.id);
      sessionStorage.setItem('recovery-test-calls', JSON.stringify(window.__recoveryCalls));
      const items = tours.map(tour => ({ tourId: tour.id, score: 95, reason: '恢复回归专属推荐理由', matchedSignals: ['行程体验'] }));
      const encoder = new TextEncoder();
      const frame = text => encoder.encode('data: ' + JSON.stringify({ choices: [{ delta: { content: text } }] }) + '\n\n');
      let done = false;
      let emitted = false;
      return new Response(new ReadableStream({ start(controller) {
        window.__activeRecoveryRank = window.__recoveryCalls.filter(entry => entry.ranking).length;
        const abort = () => {
          if (done) return;
          done = true;
          controller.error(new DOMException('Recovery fixture aborted', 'AbortError'));
        };
        init?.signal?.addEventListener('abort', abort, { once: true });
        if (init?.signal?.aborted) { abort(); return; }
        window.__finishRecovery = () => {
          if (done) throw new Error('Cannot finish an aborted stream');
          done = true;
          const tail = emitted
            ? JSON.stringify(items[1]) + '],"summary":"恢复回归完成摘要"}'
            : JSON.stringify({ order: call.order, items, summary: '恢复回归完成摘要' });
          controller.enqueue(frame(tail));
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
          init?.signal?.removeEventListener('abort', abort);
        };
        if (window.__recoveryMode === 'complete') { window.__finishRecovery(); return; }
        if (window.__recoveryMode !== 'noPartial') {
          emitted = true;
          controller.enqueue(frame('{"order":' + JSON.stringify(call.order) + ',"items":[' + JSON.stringify(items[0]) + ','));
        }
      } }), { headers: { 'content-type': 'text/event-stream' } });
    };
  }, { initialMode: mode });
  try {
    await page.goto(origin + '/EverywhereWeGoGz/');
    await page.locator('.tour-card h3').first().waitFor({ timeout: 60000 });
    return { page, context };
  } catch (error) { await context.close(); throw error; }
}
async function snapshot(page) {
  return page.evaluate(({ stateKey, progressKey }) => ({
    state: JSON.parse(localStorage.getItem(stateKey) || '{}'),
    progress: JSON.parse(localStorage.getItem(progressKey) || 'null'),
    calls: window.__recoveryCalls,
    capsule: [...document.querySelectorAll('button[aria-label]')].map(el => el.getAttribute('aria-label')).filter(label => label.startsWith('打开 AI 面板')),
  }), { stateKey, progressKey });
}
async function waitState(page, predicate) {
  await page.waitForFunction(({ key, source }) => (0, eval)('(' + source + ')')(JSON.parse(localStorage.getItem(key) || '{}')), { key: stateKey, source: predicate.toString() });
  return (await snapshot(page)).state;
}
async function rankCount(page, count) {
  await page.waitForFunction(n => window.__recoveryCalls.filter(call => call.ranking).length === n && window.__activeRecoveryRank === n, count);
}
async function search(page, prompt = '帮我挑一些线路') {
  await page.locator('input').first().fill(prompt);
  await page.getByRole('button', { name: 'AI 帮我挑', exact: true }).first().click();
  await page.locator('input').first().blur();
}
async function openPanel(page) {
  const panel = page.getByRole('dialog', { name: 'AI 帮你挑', exact: true });
  if (!(await panel.isVisible())) await page.getByRole('button', { name: /^打开 AI 面板/ }).click();
  await panel.waitFor();
  return panel;
}
async function interrupt(page) {
  await page.evaluate(() => window.__setVisibility('hidden'));
  await page.waitForFunction(key => !localStorage.getItem(key), progressKey);
  return waitState(page, state => !!state.pendingContext && state.pendingContext.recoveryState === 'background');
}
function assertOneUser(state, prompt) {
  assert.equal(state.messages.filter(message => message.role === 'user' && message.content === prompt).length, 1, 'same turn must have exactly one user message');
  assert.equal(state.pendingContext.messages.filter(message => message.role === 'user' && message.content === prompt).length, 1, 'pending request must not duplicate user message');
}
function resumeText(call) { return JSON.stringify(call.messages); }
async function finish(page) {
  await page.evaluate(() => window.__finishRecovery());
  const state = await waitState(page, state => state.pendingPrompt === null && state.pendingContext === null && state.result?.status?.mode === 'ai');
  assert.equal(state.autoResumeRemaining, 0, 'successful completion resets retry budget');
  assert.ok(state.messages.some((message, index) => index > state.messages.findLastIndex(entry => entry.role === 'user') && message.role === 'assistant'), 'completion persists assistant receipt after the current user');
  assert.equal(state.result.source, 'ai-api', 'completion persists the model result rather than local fallback');
  assert.ok(state.result.items.some(item => item.reason.includes('恢复回归专属推荐理由')), 'completed model reasons persist');
  await page.locator('.tour-card').filter({ hasText: '恢复回归专属推荐理由' }).first().waitFor();
  return snapshot(page);
}
async function run(name, mode, test) {
  const entry = { name, status: 'running', pageerrors: [], blockedExternal: [], evidence: {} };
  report.scenarios.push(entry);
  let context;
  let page;
  console.log('START', name);
  try {
    ({ context, page } = await fixture(entry, mode));
    await test(page, entry.evidence);
  } catch (error) { entry.failure = error.stack || String(error); }
  finally {
    if (page && !page.isClosed()) {
      try { entry.final = await snapshot(page); } catch (error) { entry.snapshotFailure = String(error); }
    }
    if (context) {
      try { await context.close(); } catch (error) { entry.cleanupFailure = error.stack || String(error); }
    }
    entry.status = entry.failure || entry.cleanupFailure || entry.pageerrors.length ? 'failed' : 'passed';
    console.log(entry.status === 'passed' ? 'PASS' : 'FAIL', name, entry.failure || entry.pageerrors.map(error => error.stack).join('\n'));
  }
}
try {
  assert.ok(fs.existsSync(path.join(root, 'index.html')), 'Build output missing: ' + root);
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  origin = 'http://127.0.0.1:' + server.address().port;
  browser = await chromium.launch({ headless: true });
  await run('same-turn automatic/manual resume keeps user and checkpoint', 'partial', async (page, evidence) => {
    const prompt = '帮我挑一些线路';
    await search(page, prompt);
    const initial = await waitState(page, state => !!state.pendingContext?.checkpoint?.items?.length);
    const turnId = initial.pendingContext.turnId;
    const order = initial.pendingContext.checkpoint.items.map(item => item.tourId);
    assert.ok(turnId);
    evidence.initial = initial;
    for (let cycle = 0; cycle < 3; cycle++) {
      const paused = await interrupt(page);
      assertOneUser(paused, prompt);
      assert.equal(paused.pendingContext.turnId, turnId);
      assert.deepEqual(paused.pendingContext.checkpoint.items.map(item => item.tourId), order);
      if (cycle < 2) {
        await page.evaluate(() => window.__setVisibility('visible'));
        await rankCount(page, cycle + 2);
        await waitState(page, state => state.pendingContext?.recoveryState === 'running' && !!state.pendingContext.checkpoint?.items?.length);
      }
    }
    const paused = (await snapshot(page)).state;
    assert.equal(paused.autoResumeRemaining, 0);
    await page.evaluate(() => window.__setVisibility('visible'));
    await openPanel(page);
    await page.getByRole('button', { name: '继续本轮', exact: true }).click();
    await rankCount(page, 4);
    const resumed = await waitState(page, state => state.pendingContext?.recoveryState === 'running');
    assertOneUser(resumed, prompt);
    assert.equal(resumed.pendingContext.turnId, turnId);
    const ranking = (await snapshot(page)).calls.filter(call => call.ranking);
    for (const call of ranking.slice(1)) {
      assert.match(resumeText(call), /本轮中断后继续/, 'automatic and manual retries must both use continuation instruction');
      const instruction = call.messages.find(message => message.content.includes('本轮中断后继续'))?.content;
      const fixed = instruction?.match(/order 固定为 (\[[^\]]*\])/);
      assert.ok(fixed, 'resume instruction must explicitly pin checkpoint order');
      assert.deepEqual(JSON.parse(fixed[1]), order, 'automatic and manual resumes pin exactly this turn checkpoint');
    }
    evidence.ranking = ranking;
    evidence.completed = await finish(page);
  });
  await run('new turn without partial cannot inherit old checkpoint', 'partial', async (page, evidence) => {
    await search(page);
    const old = await waitState(page, state => !!state.pendingContext?.checkpoint?.items?.length);
    await interrupt(page);
    await page.evaluate(() => window.__setRecoveryMode('noPartial'));
    await search(page, '这次改去其他地方');
    await rankCount(page, 2);
    const fresh = await waitState(page, state => state.pendingContext?.prompt === '这次改去其他地方');
    assert.notEqual(fresh.pendingContext.turnId, old.pendingContext.turnId);
    assert.equal(fresh.pendingContext.checkpoint, null, 'new turn starts without a checkpoint');
    await page.evaluate(() => window.__setVisibility('visible'));
    await interrupt(page);
    await page.evaluate(() => window.__setVisibility('visible'));
    await rankCount(page, 3);
    const current = await snapshot(page);
    assert.equal(current.state.pendingContext.checkpoint, null);
    const call = current.calls.filter(call => call.ranking).at(-1);
    // Candidate lists naturally contain previous ids: gate the fixed-order instruction,
    // not mere occurrence of an id elsewhere in the ranking prompt.
    assert.doesNotMatch(resumeText(call), /本轮中断后继续/, 'no checkpoint means no fixed-order resume instruction');
    evidence.old = old;
    evidence.resumed = current;
    evidence.completed = await finish(page);
  });
  await run('offline to online restores pending turn', 'partial', async (page, evidence) => {
    await search(page);
    const initial = await waitState(page, state => !!state.pendingContext?.checkpoint?.items?.length);
    await page.evaluate(() => { window.__setRecoveryMode('offline'); window.__setOnline(false); });
    await waitState(page, state => state.pendingContext?.recoveryState === 'offline');
    evidence.offline = await snapshot(page);
    assertOneUser(evidence.offline.state, initial.pendingContext.prompt);
    await page.evaluate(() => { window.__setRecoveryMode('partial'); window.__setOnline(true); });
    await rankCount(page, 2);
    const resumed = await waitState(page, state => state.pendingContext?.recoveryState === 'running');
    assert.equal(resumed.pendingContext.turnId, initial.pendingContext.turnId);
    assertOneUser(resumed, initial.pendingContext.prompt);
    evidence.completed = await finish(page);
  });
  await run('old completion never marks interrupted current turn completed', 'complete', async (page, evidence) => {
    await search(page);
    await waitState(page, state => state.result?.status?.mode === 'ai' && state.pendingContext === null);
    await page.evaluate(() => window.__setRecoveryMode('noPartial'));
    await search(page, '再帮我挑一些线路');
    await rankCount(page, 2);
    await interrupt(page);
    const panel = await openPanel(page);
    evidence.panel = await panel.innerText();
    assert.equal(await panel.getByText('AI完成', { exact: true }).count(), 0, 'old result must not expose an unqualified current-completion badge');
    assert.match(evidence.panel, /继续本轮/);
    evidence.paused = await snapshot(page);
    assert.equal(evidence.paused.state.result.status.mode, 'ai', 'previous readable result is retained independently');
    assert.equal(evidence.paused.state.pendingContext.checkpoint, null);
  });
  await run('reload persists pending context then completion clears it', 'partial', async (page, evidence) => {
    await search(page);
    const initial = await waitState(page, state => !!state.pendingContext?.checkpoint?.items?.length);
    await interrupt(page);
    evidence.beforeReload = await snapshot(page);
    await page.reload();
    await page.locator('.tour-card h3').first().waitFor({ timeout: 60000 });
    const restored = await waitState(page, state => !!state.pendingContext);
    assert.equal(restored.pendingContext.turnId, initial.pendingContext.turnId);
    for (const field of ['prompt', 'activeFilters', 'searchQuery', 'messages', 'preferenceMemory', 'previousResult', 'checkpoint']) {
      assert.deepEqual(restored.pendingContext[field], initial.pendingContext[field], 'reload preserves ' + field);
    }
    assertOneUser(restored, initial.pendingContext.prompt);
    await page.waitForFunction(() => window.__recoveryCalls.filter(call => call.ranking).length >= 2 && typeof window.__finishRecovery === 'function' && window.__activeRecoveryRank >= 2);
    evidence.completed = await finish(page);
    await page.reload();
    const settled = await waitState(page, state => state.pendingContext === null && state.pendingPrompt === null && state.result?.status?.mode === 'ai');
    assert.equal(settled.autoResumeRemaining, 0);
    evidence.afterCompletedReload = await snapshot(page);
  });
} catch (error) { report.fatal = error.stack || String(error); }
finally {
  try { if (browser) await browser.close(); } catch (error) { report.browserCleanupFailure = String(error); }
  if (server.listening) await new Promise(resolve => server.close(resolve));
  report.finishedAt = new Date().toISOString();
  report.exitCode = report.fatal || report.browserCleanupFailure || report.pageerrors.length || report.scenarios.some(entry => entry.status !== 'passed') ? 1 : 0;
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  process.exitCode = report.exitCode;
  console.log('RECOVERY RESULT', JSON.stringify({ exitCode: report.exitCode, reportPath, scenarios: report.scenarios.map(({ name, status }) => ({ name, status })), fatal: report.fatal }));
}
