# Project 48 Engineering Evidence

## Business Problem

Analytics becomes unreliable when source systems use different schemas and a single malformed record can stop a complete load. This pipeline normalizes three sources, loads valid records idempotently, and preserves invalid records for repair and replay.

## Architecture

`Schedule -> parallel extraction -> merge -> normalize/validate -> valid: batch upsert | invalid: DLQ -> report`

A separate Error Trigger handles technical workflow failures. The DLQ handles data-quality failures; these are intentionally different concerns.

## Data Flow

API, PostgreSQL, and CSV records are mapped to `id`, `name`, `email`, and `source`. Validation attaches `valid` and `errorReason`. Valid records use a warehouse upsert; invalid records retain their raw payload in the DLQ. The final report exposes processed, loaded, and rejected counts.

## Test Cases

See [`../tests/test-cases.json`](../tests/test-cases.json): valid multi-source load, invalid email, missing ID, replayed ID, source timeout, and warehouse outage.

## Failure Scenarios

- Record validation failure goes to DLQ without stopping the batch.
- Source timeout uses bounded retry and then raises a source-level failure.
- Warehouse failure must not report a record as loaded.
- Schema drift should fail contract validation and trigger an alert.
- DLQ replay must reuse the canonical ID to prevent duplicates.

## Security Considerations

- Use least-privilege source and warehouse database roles.
- Mask or encrypt PII in DLQ payloads and logs.
- Parameterize SQL and never compose queries from untrusted fields.
- Apply retention and access policies to raw and rejected data.
- Keep API keys and database passwords outside workflow exports.

## Trade-offs

- At-least-once delivery plus idempotent upsert is practical; global exactly-once delivery is not claimed.
- Per-record validation improves resilience but adds compute cost.
- A DLQ preserves evidence but creates an operational replay responsibility.
- Batch loading improves throughput but increases partial-batch recovery complexity.

## Production Readiness

Status: **production-oriented reference**. Required next steps include schema versioning, data lineage, checkpointing, bounded retries, alert ownership, DLQ replay tooling, retention rules, load testing, and recorded recovery drills.

## Sample Input and Output

- [`../examples/sample-input.json`](../examples/sample-input.json)
- [`../examples/sample-output.json`](../examples/sample-output.json)

## Interview Defense Notes

**60-second answer:** The core design separates data-quality errors from platform failures. Records from three sources are normalized to a canonical schema. Valid data is loaded through an idempotent upsert; invalid data is preserved in a DLQ with its error reason so it can be repaired and replayed without blocking the rest of the batch.

Measure `load_success_rate`, `dlq_rate`, `freshness_lag`, `throughput`, and replay success. Do not claim exactly-once processing or measured throughput without execution evidence.
