# Project 49 Engineering Evidence

## Business Problem

Support teams need faster triage without allowing an LLM to take unsafe customer-facing actions. This workflow automates low-risk, high-confidence cases and requires human control when confidence is low or impact is sensitive.

## Architecture

`Webhook -> normalize -> AI classify -> schema validation -> confidence gate -> sensitivity gate -> auto reply or draft/approval/rejection`

## Data Flow

The ticket is normalized to a stable contract. The model returns priority, category, sentiment, and confidence. Output is allowlisted and confidence is clamped to zero-to-one. Invalid JSON is assigned confidence zero, forcing escalation. High/critical tickets require approval; rejected drafts follow an explicit rejection path.

## Test Cases

See [`../tests/test-cases.json`](../tests/test-cases.json): confident low-risk response, low confidence, malformed model output, sensitive approval, sensitive rejection, and approval timeout.

## Failure Scenarios

- Invalid or incomplete AI output is treated as untrusted and escalated.
- Low confidence never reaches an automatic customer response.
- Sensitive actions require an auditable human decision.
- Approval timeout must escalate rather than wait forever.
- Provider timeout uses bounded retry and a safe manual fallback.

## Security Considerations

- Minimize and mask customer PII before model calls and logging.
- Treat ticket content as data, not instructions, to reduce prompt-injection risk.
- Allowlist output fields and validate response schema.
- Authenticate approval callbacks and record approver identity, reason, and time.
- Apply rate limits and abuse protection to the ticket webhook.

## Trade-offs

- A higher confidence threshold improves safety but raises human workload.
- Priority-based sensitivity is explainable but should become a policy engine for refunds, legal, security, and account deletion.
- HITL reduces unsafe actions but adds latency and operational ownership.
- Model confidence is not calibrated probability; evaluation data is required.

## Production Readiness

Status: **safe-AI reference architecture**. Before production add a labeled evaluation set, confidence calibration, approval SLA and timeout, authenticated callbacks, prompt-injection tests, PII policy, audit storage, provider fallback, and response-quality monitoring.

## Sample Input and Output

- [`../examples/sample-input.json`](../examples/sample-input.json)
- [`../examples/sample-output.json`](../examples/sample-output.json)

## Interview Defense Notes

**60-second answer:** I designed the workflow around risk, not only model capability. Malformed or low-confidence output is escalated. High-impact tickets produce a draft and require a recorded human decision. Only low-risk, sufficiently confident tickets receive an automatic response.

Do not describe `0.7` as scientifically optimal. It is an initial threshold to tune against precision, recall, escalation rate, unsafe-action rate, and the business cost of each error type.
