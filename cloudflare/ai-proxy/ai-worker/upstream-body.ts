const MAX_PREFIX_BYTES = 1024 * 1024;

export async function readUpstreamError(response: Response, signal: AbortSignal): Promise<{ code?: string; message?: string }> {
  if (!response.body || signal.aborted) return {};
  const reader = response.body.getReader();
  const cancel = () => { void reader.cancel().catch(() => {}); };
  signal.addEventListener('abort', cancel, { once: true });
  try {
    const decoder = new TextDecoder();
    let bytes = 0, text = '';
    while (!signal.aborted) {
      const part = await reader.read();
      if (signal.aborted) return {};
      if (part.done) {
        const error = JSON.parse(text + decoder.decode())?.error;
        return { code: typeof error?.code === 'number' || typeof error?.code === 'string' ? String(error.code) : undefined,
          message: typeof error?.message === 'string' ? error.message : undefined };
      }
      bytes += part.value.byteLength;
      if (bytes > 4096) return {};
      text += decoder.decode(part.value, { stream: true });
    }
  } catch { /* Unrecognized error body. */ }
  finally { signal.removeEventListener('abort', cancel); cancel(); }
  return {};
}

function hasContent(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

function validJson(raw: string): boolean {
  try {
    const value = JSON.parse(raw);
    return !value?.error && hasContent(value?.choices?.[0]?.message?.content);
  } catch { return false; }
}

// Read only until we can accept the response. Replay original bytes, then let
// downstream backpressure and cancellation drive the same upstream reader.
export async function readUsableBody(response: Response, stream: boolean, signal: AbortSignal, onReasoning?: () => void): Promise<ReadableStream<Uint8Array> | null> {
  if (!response.body) return null;
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  const decoder = new TextDecoder();
  let size = 0, raw = '', lines = '', mode: 'sse' | 'json' | undefined;
  let keep = false;
  const cancel = () => { void reader.cancel().catch(() => {}); };
  signal.addEventListener('abort', cancel, { once: true });
  const replay = () => {
    keep = true;
    let index = 0;
    return new ReadableStream<Uint8Array>({
      async pull(controller) {
        if (index < chunks.length) { controller.enqueue(chunks[index++]); return; }
        const next = await reader.read();
        if (next.done) controller.close(); else controller.enqueue(next.value);
      },
      cancel(reason) { return reader.cancel(reason); },
    });
  };
  try {
    while (!signal.aborted) {
      const next = await reader.read();
      if (signal.aborted) return null;
      if (next.done) {
        if (mode === 'sse') return null;
        return validJson(raw + decoder.decode()) ? replay() : null;
      }
      size += next.value.byteLength;
      if (size > MAX_PREFIX_BYTES) return null;
      chunks.push(next.value);
      const text = decoder.decode(next.value, { stream: true });
      if (mode === 'sse') lines += text;
      else {
        raw += text;
        const start = raw.trimStart();
        if (start.startsWith('{')) mode = 'json';
        else if (stream && /^(?:data:|event:|id:|retry:|:)/.test(start)) {
          mode = 'sse'; lines = raw; raw = '';
        }
      }
      if (mode !== 'sse') continue;
      const frames = lines.split(/\r?\n\r?\n/);
      lines = frames.pop() ?? '';
      for (const frame of frames) {
        if (frame.split(/\r?\n/).includes('event: error')) return null;
        const data = frame.split(/\r?\n/).filter(line => line.startsWith('data:')).map(line => line.slice(5).trimStart()).join('\n');
        if (!data) continue;
        if (data.trim() === '[DONE]') return null;
        try {
          const value = JSON.parse(data);
          if (value?.error) return null;
          const delta = value?.choices?.[0]?.delta;
          if (hasContent(delta?.content)) return replay();
          if (hasContent(delta?.reasoning_content)) onReasoning?.();
        } catch { return null; }
      }
    }
    return null;
  } finally {
    signal.removeEventListener('abort', cancel);
    if (!keep) cancel();
  }
}
