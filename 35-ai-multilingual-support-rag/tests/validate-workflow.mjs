import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const workflowText = await readFile(resolve(root, 'workflows', 'workflow.json'), 'utf8');
const workflow = JSON.parse(workflowText);
const envText = await readFile(resolve(root, '.env.example'), 'utf8');

const errors = [];
const names = workflow.nodes.map((node) => node.name);
const ids = workflow.nodes.map((node) => node.id);
const nameSet = new Set(names);
const requireNode = (name) => { if (!nameSet.has(name)) errors.push(`Missing node: ${name}`); };

if (names.length !== nameSet.size) errors.push('Node names must be unique');
if (ids.length !== new Set(ids).size) errors.push('Node IDs must be unique');

for (const [source, outputs] of Object.entries(workflow.connections)) {
  if (!nameSet.has(source)) errors.push(`Connection source does not exist: ${source}`);
  for (const branch of outputs.main || []) {
    for (const edge of branch || []) if (!nameSet.has(edge.node)) errors.push(`Connection target does not exist: ${edge.node}`);
  }
}

const adjacency = new Map(names.map((name) => [name, []]));
for (const [source, outputs] of Object.entries(workflow.connections)) {
  for (const branch of outputs.main || []) for (const edge of branch || []) adjacency.get(source)?.push(edge.node);
}
const reachable = new Set();
const queue = ['Webhook Trigger'];
while (queue.length) {
  const current = queue.shift();
  if (reachable.has(current)) continue;
  reachable.add(current);
  queue.push(...(adjacency.get(current) || []));
}
for (const name of names) if (!reachable.has(name)) errors.push(`Unreachable node: ${name}`);

[
  'Generate Query Embedding',
  'Query Pinecone with Real Embedding',
  'Evaluate Evidence',
  'Persist Retrieval Provenance',
  'Prepare Draft & Approval',
  'Wait for Approval',
  'Validate Approval',
  'Persist Approval Receipt',
  'Approval Granted?',
  'Send Approved Reply',
  'Persist Sent Receipt'
].forEach(requireNode);

if (workflowText.includes('[0,0,0]')) errors.push('Synthetic zero-vector fallback is forbidden');
if (!workflowText.includes('timingSafeEqual')) errors.push('Approval must bind to the exact draft hash');
if (!workflowText.includes('approvalExpiresAt')) errors.push('Approval expiry is missing');
if (!workflowText.includes('RETRIEVAL_SCORE_THRESHOLD')) errors.push('Evidence threshold is missing');
if (!workflowText.includes('contentHash')) errors.push('Evidence content hashes are not recorded');

const smtpNodes = workflow.nodes.filter((node) => node.type === 'n8n-nodes-base.emailSend');
if (smtpNodes.length !== 1 || smtpNodes[0].name !== 'Send Approved Reply') errors.push('Exactly one guarded SMTP node is required');
const gateBranches = workflow.connections['Approval Granted?']?.main || [];
if (gateBranches[0]?.[0]?.node !== 'Build Localized Email') errors.push('Approved branch must build the outbound email');
if (gateBranches[1]?.some((edge) => edge.node === 'Send Approved Reply')) errors.push('Rejected branch must never reach SMTP');

const referencedEnv = new Set([...workflowText.matchAll(/\$env\.([A-Z0-9_]+)/g)].map((match) => match[1]));
const declaredEnv = new Set([...envText.matchAll(/^([A-Z0-9_]+)=/gm)].map((match) => match[1]));
for (const variable of referencedEnv) if (!declaredEnv.has(variable)) errors.push(`Undeclared environment variable: ${variable}`);

if (errors.length) {
  console.error(errors.map((error) => `- ${error}`).join('\n'));
  process.exit(1);
}

console.log(`Workflow validation passed: ${workflow.nodes.length} nodes, ${reachable.size} reachable.`);
