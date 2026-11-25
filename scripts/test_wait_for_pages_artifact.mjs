import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { test } from 'node:test';

const action = new URL('../.github/actions/wait-for-pages-artifact/index.mjs', import.meta.url);
const name = 'github-pages-2';
const artifact = { name, id: 42 };

async function run(responses, { id = '42', timeoutMs = 50, ...overrides } = {}) {
  assert.ok(existsSync(action), 'expected a Pages artifact readiness implementation');
  const { waitForArtifact } = await import(action);
  let calls = 0;
  let time = 0;
  await waitForArtifact({
    name, id, timeoutMs,
    now: () => time,
    pause: async ms => { time += ms; },
    intervalMs: 10,
    listArtifacts: async () => {
      const result = responses[Math.min(calls++, responses.length - 1)];
      if (result instanceof Error) throw result;
      return result;
    },
    ...overrides,
  });
  return { calls, time };
}

test('returns immediately when the exact artifact is already visible', async () => {
  assert.deepEqual(await run([[artifact]]), { calls: 1, time: 0 });
});

test('waits through empty lists and ignores prior attempts', async () => {
  const old = { name: 'github-pages-1', id: 41 };
  assert.deepEqual(await run([[], [old], [old, artifact]]), { calls: 3, time: 20 });
});

test('fails closed on wrong IDs, duplicate names and invalid upload outputs', async () => {
  await assert.rejects(run([[{ name, id: 41 }]]), /expected upload ID 42/);
  await assert.rejects(run([[artifact, { name, id: 43 }]]), /multiple artifacts/i);
  await assert.rejects(run([[artifact]], { id: '' }), /invalid upload ID/i);
});

test('gives up when the artifact stays invisible or the service fails', async () => {
  await assert.rejects(run([[]]), /not visible within 50 ms/);
  await assert.rejects(run([new Error('API unavailable')]), /API unavailable/);
});

test('bounds a stalled list request', async () => {
  await assert.rejects(run([], {
    requestTimeoutMs: 20,
    listArtifacts: () => new Promise(() => {}),
  }), /listing timed out/i);
});
