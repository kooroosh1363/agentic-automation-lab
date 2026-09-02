import { appendFile, mkdir, readFile } from 'node:fs/promises';
import { createHash, timingSafeEqual } from 'node:crypto';
import { createServer } from 'node:http';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const MAX_BODY_BYTES = 1024 * 1024;

export function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function safeTokenEqual(actual, expected) {
  const left = Buffer.from(actual || '', 'utf8');
  const right = Buffer.from(expected || '', 'utf8');
  return left.length === right.length && left.length > 0 && timingSafeEqual(left, right);
}

async function readLastRecord(logPath) {
  try {
    const lines = (await readFile(logPath, 'utf8')).split('\n').filter(Boolean);
    return lines.length ? JSON.parse(lines.at(-1)) : null;
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

export async function createAuditServer({
  token,
  logPath,
  host = '127.0.0.1',
  port = 8787
}) {
  if (!token || token.length < 16) throw new Error('AUDIT_SINK_TOKEN must contain at least 16 characters');
  const target = resolve(logPath);
  await mkdir(dirname(target), { recursive: true });
  let last = await readLastRecord(target);
  let writeQueue = Promise.resolve();

  const server = createServer(async (request, response) => {
    const reply = (status, payload) => {
      response.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
      response.end(JSON.stringify(payload));
    };

    if (request.method === 'GET' && request.url === '/health') {
      return reply(200, { ok: true, sequence: last?.sequence || 0, lastHash: last?.hash || null });
    }

    const bearer = String(request.headers.authorization || '').replace(/^Bearer\s+/i, '');
    if (!safeTokenEqual(bearer, token)) return reply(401, { error: 'unauthorized' });
    if (request.method !== 'POST' || request.url !== '/events') return reply(404, { error: 'not_found' });

    let size = 0;
    const chunks = [];
    try {
      for await (const chunk of request) {
        size += chunk.length;
        if (size > MAX_BODY_BYTES) throw new Error('payload_too_large');
        chunks.push(chunk);
      }
      const payload = JSON.parse(Buffer.concat(chunks).toString('utf8'));
      if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw new Error('invalid_payload');
      if (typeof payload.eventType !== 'string' || typeof payload.ticketId !== 'string') throw new Error('missing_event_identity');

      let stored;
      writeQueue = writeQueue.then(async () => {
        const record = {
          sequence: (last?.sequence || 0) + 1,
          storedAt: new Date().toISOString(),
          previousHash: last?.hash || null,
          payload
        };
        record.hash = createHash('sha256')
          .update(`${record.previousHash || 'GENESIS'}:${stableStringify(record.payload)}:${record.storedAt}:${record.sequence}`)
          .digest('hex');
        await appendFile(target, `${JSON.stringify(record)}\n`, { encoding: 'utf8', flag: 'a', mode: 0o600 });
        last = record;
        stored = record;
      });
      await writeQueue;
      return reply(201, { sequence: stored.sequence, hash: stored.hash, previousHash: stored.previousHash });
    } catch (error) {
      const status = error.message === 'payload_too_large' ? 413 : 400;
      return reply(status, { error: error.message });
    }
  });

  await new Promise((resolveListen, reject) => {
    server.once('error', reject);
    server.listen(port, host, resolveListen);
  });
  return server;
}

const isMain = process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url;
if (isMain) {
  const server = await createAuditServer({
    token: process.env.AUDIT_SINK_TOKEN,
    logPath: process.env.AUDIT_LOG_PATH || resolve(dirname(fileURLToPath(import.meta.url)), '..', 'data', 'audit.ndjson'),
    host: process.env.AUDIT_SINK_HOST || '127.0.0.1',
    port: Number(process.env.AUDIT_SINK_PORT || 8787)
  });
  const address = server.address();
  console.log(`Audit sink listening on http://${address.address}:${address.port}`);
}
