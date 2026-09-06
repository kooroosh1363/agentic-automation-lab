import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { createTicketServer } from '../scripts/ticket-server.mjs';

test('ticket adapter enforces authentication, idempotency, and non-empty replies', async (context) => {
  const directory = await mkdtemp(join(tmpdir(), 'ticket-adapter-'));
  const token = 'ticket-token-at-least-16-characters';
  const server = await createTicketServer({ token, logPath: join(directory, 'events.ndjson'), port: 0 });
  context.after(async () => {
    await new Promise((resolve) => server.close(resolve));
    await rm(directory, { recursive: true, force: true });
  });
  const base = `http://127.0.0.1:${server.address().port}/api/tickets/T-7`;
  const send = (path, payload, key = 'evt-7:action', auth = token) => fetch(`${base}/${path}`, {
    method: 'POST',
    headers: { authorization: `Bearer ${auth}`, 'content-type': 'application/json', 'idempotency-key': key },
    body: JSON.stringify(payload)
  });

  assert.equal((await send('state', { state: 'NEEDS_REVIEW' }, 'unauthorized', 'wrong-token')).status, 401);
  assert.equal((await send('reply', { reply: '' }, 'empty')).status, 400);
  const created = await send('state', { state: 'NEEDS_REVIEW' });
  assert.equal(created.status, 201);
  const replay = await send('state', { state: 'NEEDS_REVIEW' });
  assert.equal(replay.status, 200);
  assert.equal((await replay.json()).replayed, true);
  assert.equal((await send('state', { state: 'EXPIRED' })).status, 409);
});
