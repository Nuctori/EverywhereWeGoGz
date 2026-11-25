import { setTimeout as sleep } from 'node:timers/promises';

export async function waitForArtifact({
  name, id, listArtifacts,
  timeoutMs = 90_000, intervalMs = 3_000, requestTimeoutMs = 15_000,
  now = () => performance.now(), pause = sleep,
}) {
  if (!name) throw new Error('Missing Pages artifact name');
  if (!/^[1-9]\d*$/.test(id)) throw new Error('Invalid upload ID for Pages artifact');

  const deadline = now() + timeoutMs;
  while (now() < deadline) {
    let timer;
    let artifacts;
    try {
      const requestDeadline = new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error(`Pages artifact listing timed out for ${name}`)),
          Math.min(requestTimeoutMs, deadline - now()));
      });
      artifacts = await Promise.race([listArtifacts(), requestDeadline]);
    } finally {
      clearTimeout(timer);
    }

    const matches = artifacts.filter(artifact => artifact.name === name);
    if (matches.length > 1) throw new Error(`Multiple artifacts named ${name}`);
    if (matches.length === 1) {
      if (String(matches[0].id) !== id) {
        throw new Error(`Pages artifact ${name} has ID ${matches[0].id}; expected upload ID ${id}`);
      }
      if (now() < deadline) return;
      break;
    }
    const remaining = deadline - now();
    if (remaining > 0) await pause(Math.min(intervalMs, remaining));
  }
  throw new Error(`Pages artifact ${name} (ID ${id}) not visible within ${timeoutMs} ms`);
}

if (import.meta.main) {
  try {
    const { DefaultArtifactClient } = await import('@actions/artifact');
    const client = new DefaultArtifactClient();
    const name = process.env['INPUT_ARTIFACT-NAME'];
    const id = process.env['INPUT_ARTIFACT-ID'];
    // Same current-run Artifact Service listing as deploy-pages; REST visibility is not equivalent.
    await waitForArtifact({ name, id, listArtifacts: async () => (await client.listArtifacts()).artifacts });
    console.log(`Pages artifact ${name} (ID ${id}) is visible`);
  } catch (error) {
    // An SDK request may still be pending after our deadline. Don't wait for its socket or retries.
    process.stderr.write(`Pages artifact readiness failed: ${error.message}\n`, () => process.exit(1));
  }
}
