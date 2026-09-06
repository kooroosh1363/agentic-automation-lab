# Project 49 engineering evidence

## Business Problem

Reduce routine support workload without treating LLM confidence or fluent text as authority to perform customer-facing actions. The design prioritizes bounded automation, explicit abstention, exact-draft approval, durable state, and inspectable failure behavior.

## Architecture

The reference separates intake validation, model classification, deterministic policy, manual persistence, safe templates, signed approval, delivery, and audit into explicit workflow nodes. The workflow JSON is generated from version-controlled policy functions so executable policy and orchestration can be reviewed together.

## Data Flow

The authenticated webhook normalizes a bounded ticket contract and creates PII-minimized model fields. Strict classification produces one of three routes: `MANUAL_REVIEW`, `AUTO_TEMPLATE`, or `APPROVAL_REQUIRED`. Manual work is persisted before notification. Automatic delivery uses a fixed template and keeps the ticket open. Sensitive delivery requires an exact-draft approval receipt. Decision and delivery events are written to the append-only audit sink.

### Implemented controls

| Risk | Implementation evidence |
|---|---|
| Unauthenticated intake | `X-Triage-Secret` timing-safe validation |
| Malformed payload | Required fields, bounded sizes, email and identifier validation |
| Unnecessary model PII | Email, phone, and payment-number redaction before model calls |
| Prompt injection | Ticket explicitly marked as untrusted plus deterministic downstream policy |
| Invalid AI schema | All enums and confidence range must be valid; otherwise manual review |
| Arbitrary confidence | Configurable threshold and explicit non-calibration warning |
| Misclassified sensitive ticket | Independent category, keyword, priority, and sentiment rules |
| Provider failure | Both LLM error outputs connect to persisted manual review |
| Hallucinated auto response | Automatic path uses bounded templates, not generated factual text |
| Unreviewed sensitive response | Exact-draft hash, HMAC callback, reviewer, expiry, no-send branch |
| Infinite wait | Wait node has configurable bounded TTL |
| Duplicate delivery | Action-specific idempotency keys; local adapter tests replay/conflict behavior |
| Empty reply | Local adapter rejects empty replies; workflow templates/drafts validate body |
| Lost manual escalation | Ticket state is persisted before Slack notification |
| Weak error log | Authenticated append-only hash-chain sink; persistence before alert |
| Secret leakage in incidents | Common bearer tokens and email addresses are redacted and messages bounded |

## Failure Scenarios

1. Invalid intake cannot reach a model or customer-send node.
2. Invalid, malformed, low-confidence, or provider-failed classification enters the manual queue.
3. Deterministic sensitive policy overrides a low-risk model label.
4. Free-form LLM content is never used by the automatic low-risk branch.
5. A sensitive draft cannot reach delivery without a valid approval receipt for the exact hash.
6. Rejected and expired approval paths cannot reach either send node.
7. Decision audit persistence occurs before protected delivery.
8. A failed external call is not converted into a successful response.

These are checked by unit tests and workflow-graph assertions. They are architecture guarantees within the reference code, not claims about an unconfigured deployment.

## Test Cases

`tests/test-cases.json` maps 14 scenarios to executable unit or graph checks. The suite currently reports nine Node test cases plus deterministic workflow validation. It covers input authentication, PII minimization, schema failures, confidence fallback, deterministic risk override, safe templates, approval integrity, approval timeout, append-only audit linkage, ticket API authentication, empty replies, and idempotency conflicts.

The suite does not yet measure real-model classification quality. Before rollout, construct a versioned labeled corpus containing routine, ambiguous, financial, security, account, cancellation, legal, privacy, multilingual, adversarial, and out-of-distribution tickets. Report per-class precision/recall, escalation rate, unsafe-auto-action rate, latency, and cost.

## Security Considerations

The implemented controls cover shared-secret intake, bounded fields, common-pattern PII minimization, strict model-schema validation, deterministic risk overrides, signed approval callbacks, authenticated downstream APIs, idempotency keys, redacted incident records, and a hash-chained audit sink. The detailed attacker/asset analysis and remaining controls are documented in [`threat-model.md`](threat-model.md).

## Trade-offs

- Treating billing, account, cancellation, negative sentiment, and security as sensitive increases human workload but reduces unsafe automation.
- Templates provide less personalization than generated replies but materially reduce unsupported claims.
- Local append-only files are transparent and free for demonstration; production needs protected storage, backups, independent verification, and retention controls.
- HMAC protects callback integrity, but reviewer identity remains asserted until integrated with SSO or verified Slack actions.
- Retry improves transient reliability but cannot replace provider circuit breaking and operational monitoring.
- A threshold of `0.70` is an initial configuration, not scientific proof of correctness.

## Reproducibility

`scripts/build-workflows.mjs` generates both importable workflow JSON files from version-controlled policy functions. CI regenerates them, validates all nodes and connections, checks critical graph invariants, and fails on drift. The project has no third-party Node dependencies.

## Production Readiness

Status: **production-oriented reference implementation**.

The repository demonstrates enforceable trust boundaries and failure behavior. It still requires deployment-specific n8n import validation, verified human identity, a production ticketing database, organization-specific policies, evaluation data, DLP, tenant isolation, monitoring, and disaster recovery before handling live customer traffic.

## Sample Input and Output

- [`../examples/sample-input.json`](../examples/sample-input.json)
- [`../examples/sample-output.json`](../examples/sample-output.json)
- [`../tests/test-cases.json`](../tests/test-cases.json)

## Interview Defense Notes

**60-second explanation:** I did not authorize customer actions from model confidence alone. The model supplies a strict classification proposal. Invalid or uncertain output becomes persisted manual work, while deterministic rules override the model for sensitive categories and phrases. Low-risk automation uses controlled templates. Sensitive LLM drafts are hashed and bound to a signed, expiring approval callback; the decision is stored before delivery. External writes are authenticated, retried, time-bounded, and idempotent, and failures are recorded before alerts are sent.
