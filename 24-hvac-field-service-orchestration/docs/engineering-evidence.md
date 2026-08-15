# Project 24 Engineering Evidence

## Business Problem

Field-service dispatch is a constrained decision: the nearest technician is not useful if they lack the required skill, parts, or capacity. The workflow converts an unstructured service request into a ranked, auditable dispatch recommendation and routes unsafe cases to a human dispatcher.

## Architecture

`Webhook -> AI extraction -> PostgreSQL technician query -> deterministic scoring -> success/fallback routing -> Calendar/SMS or Slack`

The LLM extracts structure; it does not select a technician. The final choice is made by deterministic code over operational data.

## Data Flow

1. The webhook accepts a request ID, customer details, coordinates, and issue text.
2. AI returns `device_type`, `required_parts`, `urgency`, and `issue_summary`.
3. PostgreSQL returns active technicians with coordinates, skills, load, and inventory.
4. The Code node filters by skill, calculates Haversine distance, checks parts, and ranks candidates.
5. A dispatch is automatic only when the selected technician has every required part; otherwise Slack receives a manual-review alert.

## Test Cases

Executable fixtures are listed in [`../tests/test-cases.json`](../tests/test-cases.json). The minimum set covers a valid dispatch, missing skill, missing parts, invalid coordinates, and duplicate request handling.

## Failure Scenarios

- Invalid coordinates stop scoring before an unsafe assignment is made.
- Invalid AI JSON becomes an explicit workflow error rather than silently using invented fields.
- No matching skill returns `MANUAL_REVIEW_REQUIRED`.
- Missing inventory blocks automatic booking even when a technician ranks highest.
- Calendar or SMS failures require retry with an idempotency key; they must not create duplicate bookings.

## Security Considerations

- Minimize customer PII sent to the LLM and redact PII from logs.
- Store credentials in n8n credentials or environment variables, never in exported JSON.
- Validate webhook authentication and rate-limit public endpoints.
- Treat AI output as untrusted input and validate its schema.
- Restrict database access to read-only technician lookup for this workflow.

## Trade-offs

- Haversine distance is cheap and deterministic but ignores roads and traffic.
- Fixed scoring weights are explainable but require backtesting before operational use.
- Requiring all parts lowers automation but protects first-time-fix quality.
- Synchronous booking is simple but increases coupling to Calendar and SMS providers.

## Production Readiness

Status: **tested reference architecture, not a production deployment**.

Before production: add webhook authentication, a request-id idempotency store, routing-time distance, inventory freshness checks, scoring backtests, provider retries, structured logs, and end-to-end test runs with real credentials in a staging environment.

## Sample Input and Output

- [`../examples/sample-input.json`](../examples/sample-input.json)
- [`../examples/sample-output.json`](../examples/sample-output.json)

## Interview Defense Notes

**60-second answer:** I separated probabilistic extraction from deterministic operational decision-making. AI structures the customer issue, while a transparent scoring model selects from active PostgreSQL technicians using skill, distance, parts, and load. Automatic booking is allowed only when the constraints pass; otherwise the workflow escalates to a dispatcher.

**Do not claim:** that the weights are optimized, traffic-aware, or proven in production. Explain that they are explicit starting assumptions to be calibrated against response time, first-time-fix rate, travel distance, and SLA breaches.
