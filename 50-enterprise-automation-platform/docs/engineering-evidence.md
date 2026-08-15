# Project 50 Engineering Evidence

## Business Problem

Large automations become difficult to test and recover when ingestion, AI decisions, persistence, fulfillment, and error handling live in one workflow. This capstone separates those responsibilities into a parent orchestrator and bounded child workflows.

## Architecture

`Master Orchestrator -> Intake & AI Triage -> ETL & Warehouse -> Fulfillment`

Cross-cutting controls include confidence gating, DLQ routing, explicit approval/rejection, a global Error Trigger, PostgreSQL, Redis, Prometheus, and Grafana.

## Data Flow

The parent creates a `requestId` and stable request contract. Intake appends classification and confidence. ETL appends storage/DLQ status. Fulfillment appends automatic, approved, or rejected status. The `stages` array provides a lightweight execution history while `requestId` correlates child executions.

## Test Cases

See [`../tests/test-cases.json`](../tests/test-cases.json): full success, low-confidence stop, invalid-record DLQ, sensitive approval, rejection, child failure, and duplicate request.

## Failure Scenarios

- Low confidence stops downstream automation and produces controlled escalation.
- Invalid data enters DLQ rather than the warehouse.
- Rejection is a business outcome, not a technical error.
- Child failure must preserve completed-stage state and allow targeted retry.
- Duplicate requests require idempotent persistence and fulfillment.

## Security Considerations

- Authenticate the public webhook and propagate authorization context.
- Separate credentials by child workflow and use least privilege.
- Encrypt stored sensitive data and mask it in logs and metrics.
- Authenticate approval callbacks and maintain an immutable audit record.
- Apply network controls to PostgreSQL, Redis, Prometheus, and Grafana.

## Trade-offs

- Parent/child boundaries improve reuse and failure isolation but require contract and version management.
- Synchronous child execution is easy to reason about but couples latency and availability.
- A `stages` array is useful for a demo; production recovery needs a durable state store.
- Central error handling simplifies alerting but must retain child-specific context.

## Production Readiness

Status: **capstone reference architecture**. Workflow IDs and credentials remain deployment placeholders. Production requires contract versioning, durable state, idempotency, timeout/retry policy, compensation for partial failure, SLOs, load tests, backup/restore tests, secret rotation, and staged end-to-end evidence.

## Sample Input and Output

- [`../examples/sample-input.json`](../examples/sample-input.json)
- [`../examples/sample-output.json`](../examples/sample-output.json)

## Interview Defense Notes

**60-second answer:** The capstone demonstrates system boundaries. The parent owns correlation and stage ordering; child workflows own intake, ETL, and fulfillment. Business failures such as rejection or low confidence are explicit outcomes, while technical failures use error handling and retry. This reduces blast radius and makes each unit easier to test.

Be ready to explain partial failure, idempotency, state persistence, compensation, contract versioning, and why Grafana alone is not proof of observability.
