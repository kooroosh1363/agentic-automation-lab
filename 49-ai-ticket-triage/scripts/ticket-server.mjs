import { appendFile, mkdir, readFile } from 'node:fs/promises';
import { createHash, timingSafeEqual } from 'node:crypto';
import { createServer } from 'node:http';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const MAX_BODY_BYTES = 256 * 1024;
const ALLOWED_STATES = new Set(['NEEDS_REVIEW', 'APPROVAL_REQUIRED', 'REJECTED', 'EXPIRED']);

function tokenEqual(actual, expected) {
  const left = Buffer.from(actual || '', 'utf8');
  const right = Buffer.from(expected || '', 'utf8');
  return left.length === right.length && left.length > 0 && timingSafeEqual(left, right);
}

function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
}

async function loadIdempotency(logPath) {
  const map = new Map();
  try {
    for (const line of (await readFile(logPath, 'utf8')).split('\n').filter(Boolean)) {
      const record = JSON.parse(line);
      map.set(record.idempotencyKey, record);
    }
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  return map;
}

export async function createTicketServer({ token, logPath, host = '127.0.0.1', port = 8789 }) {
  if (!token || token.length < 16) throw new Error('TICKET_API_TOKEN must contain at least 16 characters');
  const target = resolve(logPath);
  await mkdir(dirname(target), { recursive: true });
  const idempotency = await loadIdempotency(target);
  let writeQueue = Promise.resolve();

  const server = createServer(async (request, response) => {
    const reply = (status, payload) => {
      response.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
      response.end(JSON.stringify(payload));
    };
    if (request.method === 'GET' && request.url === '/health') return reply(200, { ok: true, storedEvents: idempotency.size });
    const bearer = String(request.headers.authorization || '').replace(/^Bearer\s+/i, '');
    if (!tokenEqual(bearer, token)) return reply(401, { error: 'unauthorized' });
    if (request.method !== 'POST') return reply(405, { error: 'method_not_allowed' });
    const match = request.url?.match(/^\/api\/tickets\/([A-Za-z0-9._:-]{1,80})\/(state|reply)$/);
    if (!match) return reply(404, { error: 'not_found' });
    const [, ticketId, action] = match;
    const idempotencyKey = String(request.headers['idempotency-key'] || '').slice(0, 240);
    if (!idempotencyKey) return reply(400, { error: 'missing_idempotency_key' });

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
      if (action === 'state' && !ALLOWED_STATES.has(payload.state)) throw new Error('invalid_state');
      if (action === 'reply' && (typeof payload.reply !== 'string' || !payload.reply.trim())) throw new Error('empty_reply');
      const requestHash = createHash('sha256').update(stableStringify({ ticketId, action, payload })).digest('hex');
      const previous = idempotency.get(idempotencyKey);
      if (previous) {
        if (previous.requestHash !== requestHash) return reply(409, { error: 'idempotency_conflict' });
        return reply(200, { eventId: previous.eventId, replayed: true });
      }
      let record;
      writeQueue = writeQueue.then(async () => {
        record = {
          eventId: createHash('sha256').update(`${idempotencyKey}:${requestHash}`).digest('hex').slice(0, 24),
          idempotencyKey,
          requestHash,
          ticketId,
          action,
          payload,
          storedAt: new Date().toISOString()
        };
        await appendFile(target, `${JSON.stringify(record)}\n`, { encoding: 'utf8', flag: 'a', mode: 0o600 });
        idempotency.set(idempotencyKey, record);
      });
      await writeQueue;
      return reply(201, { eventId: record.eventId, replayed: false });
    } catch (error) {
      return reply(error.message === 'payload_too_large' ? 413 : 400, { error: error.message });
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
  const server = await createTicketServer({
    token: process.env.TICKET_API_TOKEN,
    logPath: process.env.TICKET_EVENT_LOG_PATH || resolve(dirname(fileURLToPath(import.meta.url)), '..', 'data', 'ticket-events.ndjson'),
    host: process.env.TICKET_API_HOST || '127.0.0.1',
    port: Number(process.env.TICKET_API_PORT || 8789)
  });
  const address = server.address();
  console.log(`Ticket adapter listening on http://${address.address}:${address.port}/api`);
}
