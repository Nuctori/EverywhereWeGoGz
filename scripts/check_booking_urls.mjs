#!/usr/bin/env node
/**
 * Booking-URL health gate: stratified sample of tour-map-cards bookingUrls.
 * Probes the RAW bookingUrl (source-site health), not the frontend fallback —
 * a source-site outage (like 康辉 gz.cctpage.com 2026-08) must surface in CI.
 * Known-broken sources (already routed to a frontend fallback) are excluded
 * from the gate but still reported, so a NEW outage still fails the run.
 *
 * Usage: node scripts/check_booking_urls.mjs [samplePerSource=10]
 * Exit 0 = gate passes, 1 = reachability below threshold, 2 = setup error.
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SAMPLE_ARG = (process.argv.find((a) => /^\d+$/.test(a)) ?? '');
const SAMPLE_PER_SOURCE = SAMPLE_ARG ? Number(SAMPLE_ARG) : 10;
const FAIL_BELOW_PCT = 90;
const TIMEOUT_MS = 12000;
const CONCURRENCY = 8;

// Sources whose bookingUrls are known-broken and already routed to a frontend
// fallback (source-detail-url.ts). Reported but excluded from the gate.
const KNOWN_BROKEN = new Set(['康辉']);

function normalizeUrl(url) {
  return url.startsWith('//') ? `https:${url}` : url;
}

async function probe(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(normalizeUrl(url), {
      signal: controller.signal,
      redirect: 'follow',
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
    });
    const body = await response.arrayBuffer();
    return { status: response.status, bytes: body.byteLength };
  } catch {
    return { status: 0, bytes: 0 };
  } finally {
    clearTimeout(timer);
  }
}

async function main() {
  const cardsPath = path.join(ROOT, 'public', 'data', 'tour-map-cards.json');
  let cards;
  try {
    cards = JSON.parse(await readFile(cardsPath, 'utf-8'));
  } catch (error) {
    console.error(`cannot read ${cardsPath}: ${error.message}`);
    process.exit(2);
  }

  const bySource = new Map();
  for (const card of cards) {
    const source = String(card.source || '?');
    const url = String(card.bookingUrl || '').trim();
    if (!/^https?:/.test(url)) continue;
    if (!bySource.has(source)) bySource.set(source, []);
    bySource.get(source).push({ id: card.id, url });
  }

  const sample = [];
  for (const [source, entries] of bySource) {
    for (const entry of entries.slice(0, SAMPLE_PER_SOURCE)) {
      sample.push({ source, ...entry });
    }
  }

  const results = [];
  const queue = [...sample];
  const workers = Array.from({ length: Math.min(CONCURRENCY, sample.length) }, () =>
    (async () => {
      while (queue.length) {
        const item = queue.shift();
        const probeResult = await probe(item.url);
        results.push({ ...item, ...probeResult });
      }
    })(),
  );
  await Promise.all(workers);

  const ok = results.filter((r) => r.status === 200 && r.bytes > 50);
  const gated = results.filter((r) => !KNOWN_BROKEN.has(r.source));
  const gatedOk = gated.filter((r) => r.status === 200 && r.bytes > 50);
  const gatedPct = gated.length ? (gatedOk.length / gated.length) * 100 : 100;
  const overallPct = results.length ? (ok.length / results.length) * 100 : 100;

  console.log(
    `URL health: ${ok.length}/${results.length} raw reachable (${overallPct.toFixed(1)}%), ` +
      `gated (excl. known-broken) ${gatedOk.length}/${gated.length} (${gatedPct.toFixed(1)}%)`,
  );
  const bySourceStats = new Map();
  for (const r of results) {
    const s = bySourceStats.get(r.source) || { ok: 0, total: 0 };
    s.total += 1;
    if (r.status === 200 && r.bytes > 50) s.ok += 1;
    bySourceStats.set(r.source, s);
  }
  for (const [source, s] of bySourceStats) {
    const tag = KNOWN_BROKEN.has(source) ? ' [known-broken, excluded]' : '';
    console.log(`  ${source}: ${s.ok}/${s.total}${tag}`);
  }
  const failures = results.filter((r) => !(r.status === 200 && r.bytes > 50)).slice(0, 8);
  if (failures.length) {
    console.log('failures:');
    for (const f of failures) {
      console.log(`  ${f.source} ${f.id} [${f.status}] ${f.url.slice(0, 90)}`);
    }
  }

  if (gatedPct < FAIL_BELOW_PCT) {
    console.error(`FAIL: gated reachability ${gatedPct.toFixed(1)}% < ${FAIL_BELOW_PCT}% threshold`);
    process.exit(1);
  }
  console.log(`PASS: gated reachability ${gatedPct.toFixed(1)}% >= ${FAIL_BELOW_PCT}%`);
}

main().catch((error) => {
  console.error(error);
  process.exit(2);
});
