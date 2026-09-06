import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const mainText = await readFile(resolve(root, 'workflows', 'ai-ticket-triage.json'), 'utf8');
const errorText = await readFile(resolve(root, 'workflows', 'triage-error-handler.json'), 'utf8');
const envText = await readFile(resolve(root, '.env.example'), 'utf8');
const main = JSON.parse(mainText);
const errorWorkflow = JSON.parse(errorText);
const errors = [];

function validateGraph(workflow, startName) {
  const names = workflow.nodes.map((node) => node.name);
  const ids = workflow.nodes.map((node) => node.id);
  const nameSet = new Set(names);
  if (names.length !== nameSet.size) errors.push(`${workflow.name}: node names must be unique`);
  if (ids.length !== new Set(ids).size) errors.push(`${workflow.name}: node IDs must be unique`);
  const adjacency = new Map(names.map((name) => [name, []]));
  for (const [source, outputs] of Object.entries(workflow.connections || {})) {
    if (!nameSet.has(source)) errors.push(`${workflow.name}: missing source ${source}`);
    for (const branch of outputs.main || []) {
      for (const edge of branch || []) {
        if (!nameSet.has(edge.node)) errors.push(`${workflow.name}: missing target ${edge.node}`);
        adjacency.get(source)?.push(edge.node);
      }
    }
  }
  const reachable = new Set();
  const queue = [startName];
  while (queue.length) {
    const current = queue.shift();
    if (reachable.has(current)) continue;
    reachable.add(current);
    queue.push(...(adjacency.get(current) || []));
  }
  for (const name of names) if (!reachable.has(name)) errors.push(`${workflow.name}: unreachable node ${name}`);
  for (const node of workflow.nodes.filter((item) => item.parameters?.jsCode)) {
    try { new Function(node.parameters.jsCode); } catch (syntaxError) { errors.push(`${workflow.name}: invalid code in ${node.name}: ${syntaxError.message}`); }
  }
  return { names: nameSet, adjacency, reachable };
}

const mainGraph = validateGraph(main, 'Ticket Webhook');
const errorGraph = validateGraph(errorWorkflow, 'Error Trigger');
if (main.nodes.length !== 32) errors.push(`Expected 32 main nodes, found ${main.nodes.length}`);
if (errorWorkflow.nodes.length !== 4) errors.push(`Expected 4 error nodes, found ${errorWorkflow.nodes.length}`);

const requiredMain = [
  'Validate Intake', 'AI Classify', 'Build Provider Failure', 'Normalize Manual Review', 'Persist Manual Queue',
  'Build Safe Template', 'Audit Auto Decision', 'Generate Sensitive Draft',
  'Prepare Approval Package', 'Request Human Approval', 'Wait for Approval',
  'Validate Approval', 'Audit Approval Receipt', 'Approval Granted?',
  'Send Approved Response', 'Persist No-Send State'
];
for (const name of requiredMain) if (!mainGraph.names.has(name)) errors.push(`Missing required node: ${name}`);

const classifierBranches = main.connections['AI Classify']?.main || [];
if (classifierBranches[0]?.[0]?.node !== 'Parse AI Output') errors.push('Classifier success output is not connected');
if (classifierBranches[1]?.[0]?.node !== 'Build Provider Failure') errors.push('Classifier error output is not connected to manual fallback');
const draftBranches = main.connections['Generate Sensitive Draft']?.main || [];
if (draftBranches[1]?.[0]?.node !== 'Build Provider Failure') errors.push('Draft provider error output is not connected to manual fallback');

const waitNode = main.nodes.find((node) => node.name === 'Wait for Approval');
if (!waitNode?.parameters?.limitWaitTime) errors.push('Approval wait must have a timeout');
if (!mainText.includes('callbackToken') || !mainText.includes('createHmac')) errors.push('Signed approval callback is missing');
if (!mainText.includes('draftHash') || !mainText.includes('timingSafeEqual')) errors.push('Exact-draft approval binding is missing');
if (!mainText.includes('deterministic_keyword_policy')) errors.push('Deterministic risk policy is missing');
if (!mainText.includes('invalid_ai_schema')) errors.push('Strict AI schema failure is missing');
if (mainText.includes('YOUR_ERROR_WORKFLOW_ID')) errors.push('Placeholder error workflow ID is forbidden');

const sendNames = new Set(['Send Safe Auto Reply', 'Send Approved Response']);
for (const node of main.nodes.filter((item) => sendNames.has(item.name))) {
  const headers = node.parameters?.headerParameters?.parameters || [];
  if (!headers.some((header) => header.name === 'Authorization' && String(header.value).startsWith('=Bearer '))) errors.push(`${node.name}: authenticated Ticket API call required`);
  if (!headers.some((header) => header.name === 'Idempotency-Key')) errors.push(`${node.name}: idempotency key required`);
  if (!node.retryOnFail || Number(node.parameters?.options?.timeout || 0) <= 0) errors.push(`${node.name}: retry and timeout required`);
}

function reachableFrom(start) {
  const reached = new Set();
  const queue = [start];
  while (queue.length) {
    const current = queue.shift();
    if (reached.has(current)) continue;
    reached.add(current);
    queue.push(...(mainGraph.adjacency.get(current) || []));
  }
  return reached;
}
const noSendReachable = reachableFrom('Persist No-Send State');
for (const send of sendNames) if (noSendReachable.has(send)) errors.push(`No-send branch can reach ${send}`);
const rejectedIntakeReachable = reachableFrom('Audit Rejected Intake');
for (const send of sendNames) if (rejectedIntakeReachable.has(send)) errors.push(`Rejected intake can reach ${send}`);

const errorPath = errorWorkflow.connections;
if (errorPath['Format Redacted Error']?.main?.[0]?.[0]?.node !== 'Persist Error Receipt') errors.push('Error receipt must be persisted before alerting');
if (errorPath['Persist Error Receipt']?.main?.[0]?.[0]?.node !== 'Alert Slack') errors.push('Slack alert must follow durable error persistence');

const referencedEnv = new Set([...`${mainText}\n${errorText}`.matchAll(/\$env\.([A-Z0-9_]+)/g)].map((match) => match[1]));
const declaredEnv = new Set([...envText.matchAll(/^([A-Z0-9_]+)=/gm)].map((match) => match[1]));
for (const variable of referencedEnv) if (!declaredEnv.has(variable)) errors.push(`Undeclared environment variable: ${variable}`);

if (errors.length) {
  console.error(errors.map((error) => `- ${error}`).join('\n'));
  process.exit(1);
}
console.log(`Workflow validation passed: ${mainGraph.reachable.size} main nodes and ${errorGraph.reachable.size} error nodes reachable.`);
