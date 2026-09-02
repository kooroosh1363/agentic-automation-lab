import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { createAuditServer } from '../scripts/audit-server.mjs';

function evidencePolicy(matches, threshold = 0.72) {
  const usable = matches.filter((item) => item.id && item.text);
  const qualified = usable.filter((item) => item.score >= threshold);
  return qualified.length ? 'GROUNDED' : usable.length ? 'LOW_CONFIDENCE' : 'NO_EVIDENCE';
}

function approvalPolicy({ decision, reviewer, suppliedHash, expectedHash, expiresAt, now }) {
  if (now > new Date(expiresAt)) return 'EXPIRED';
  if (decision === 'approved' && reviewer && suppliedHash === expectedHash) return 'APPROVED';
  return 'REJECTED';
}

test('evidence gate refuses empty and low-score retrieval', () => {
  assert.equal(evidencePolicy([]), 'NO_EVIDENCE');
  assert.equal(evidencePolicy([{ id: 'kb-1', text: 'x', score: 0.4 }]), 'LOW_CONFIDENCE');
  assert.equal(evidencePolicy([{ id: 'kb-1', text: 'x', score: 0.91 }]), 'GROUNDED');
});

test('approval is bound to reviewer, hash, and expiry', () => {
  const base = { decision: 'approved', reviewer: 'reviewer-7', suppliedHash: 'abc', expectedHash: 'abc', expiresAt: '2030-01-02T00:00:00.000Z', now: new Date('2030-01-01T00:00:00.000Z') };
  assert.equal(approvalPolicy(base), 'APPROVED');
  assert.equal(approvalPolicy({ ...base, suppliedHash: 'changed' }), 'REJECTED');
  assert.equal(approvalPolicy({ ...base, reviewer: '' }), 'REJECTED');
  assert.equal(approvalPolicy({ ...base, now: new Date('2030-01-03T00:00:00.000Z') }), 'EXPIRED');
});

test('audit sink creates a verifiable append-only hash chain', async (context) => {
  const directory = await mkdtemp(join(tmpdir(), 'support-audit-'));
  const logPath = join(directory, 'audit.ndjson');
  const token = 'test-token-at-least-16-characters';
  const server = await createAuditServer({ token, logPath, port: 0 });
  context.after(async () => {
    await new Promise((resolve) => server.close(resolve));
    await rm(directory, { recursive: true, force: true });
  });
  const { port } = server.address();
  const post = (payload) => fetch(`http://127.0.0.1:${port}/events`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const first = await (await post({ eventType: 'retrieval_provenance', ticketId: 'T-1' })).json();
  const second = await (await post({ eventType: 'approval_decision', ticketId: 'T-1' })).json();
  assert.equal(second.previousHash, first.hash);
  const records = (await readFile(logPath, 'utf8')).trim().split('\n').map(JSON.parse);
  assert.equal(records.length, 2);
  assert.equal(records[1].previousHash, records[0].hash);
});
