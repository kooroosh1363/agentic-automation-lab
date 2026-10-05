# 48 — Multi-Source ETL Pipeline for a Data Warehouse

![Level](https://img.shields.io/badge/Level-Advanced-6F42C1)
![Status](https://img.shields.io/badge/Status-Production--oriented%20Reference-0A7EA4)
![n8n](https://img.shields.io/badge/n8n-Workflow%20Orchestration-EA4B71)
![Database](https://img.shields.io/badge/PostgreSQL-Warehouse%20%2B%20DLQ-336791)

A production-oriented ETL reference built with n8n and PostgreSQL. The workflow demonstrates parallel extraction from heterogeneous sources, canonical schema normalization, record-level validation, idempotent warehouse upserts, dead-letter routing for rejected records, and a separate technical-error workflow.

> **Scope:** this project demonstrates ETL architecture and failure-separation patterns. It is not presented as a fully production-ready data platform. Several important implementation gaps are documented below so the repository stays aligned with the actual exported workflows.

## Business Problem

Operational data rarely arrives in one clean schema.

A typical analytics pipeline may need to reconcile:

- API records using one naming convention,
- application-database rows using another,
- file-based data using a third,
- malformed or incomplete records,
- repeated records from retries or replay,
- infrastructure failures that are different from data-quality failures.

A robust ETL process should not let one bad record block an entire load, and it should also avoid confusing **invalid data** with **pipeline failure**.

This project demonstrates that separation:

```text
data-quality failure  → Dead-Letter Queue
technical failure     → Error workflow / alerting
valid record          → Idempotent warehouse upsert
```

That distinction is the strongest engineering idea in the project.

---

## Architecture

```text
                         ┌──────────────────────┐
                         │ Nightly Schedule     │
                         │ 01:00                │
                         └──────────┬───────────┘
                                    │
                 ┌──────────────────┼──────────────────┐
                 │                  │                  │
                 ▼                  ▼                  ▼
        ┌────────────────┐ ┌────────────────┐ ┌────────────────┐
        │ External API   │ │ PostgreSQL Ops │ │ CSV Simulation │
        │ HTTP Request   │ │ SELECT         │ │ Code node      │
        └────────┬───────┘ └────────┬───────┘ └────────┬───────┘
                 │                  │                  │
                 └──────────┬───────┘                  │
                            ▼                          │
                    ┌────────────────┐                 │
                    │ Merge A        │                 │
                    └───────┬────────┘                 │
                            └────────────┬──────────────┘
                                         ▼
                                ┌──────────────────┐
                                │ Merge B          │
                                └────────┬─────────┘
                                         ▼
                                ┌──────────────────┐
                                │ Normalize +      │
                                │ Validate         │
                                └────────┬─────────┘
                                         ▼
                                  ┌─────────────┐
                                  │ Valid?      │
                                  └─────┬───┬───┘
                                      yes  no
                                       │    │
                                       ▼    ▼
                             ┌────────────┐ ┌──────────────┐
                             │ Batch Load │ │ PostgreSQL   │
                             │ size = 100 │ │ DLQ insert   │
                             └─────┬──────┘ └──────┬───────┘
                                   ▼               │
                             ┌────────────┐         │
                             │ Warehouse  │         │
                             │ UPSERT     │         │
                             └─────┬──────┘         │
                                   └───────┬─────────┘
                                           ▼
                                  ┌────────────────┐
                                  │ Merge Results  │
                                  └───────┬────────┘
                                          ▼
                                  ┌────────────────┐
                                  │ Final Report   │
                                  └────────────────┘
```

A second workflow contains:

```text
Error Trigger
  → Format Error
  → Slack Webhook
  → Console Log
```

---

## What the Project Demonstrates

The repository currently demonstrates:

- nightly scheduling,
- three-source fan-out,
- two-stage source merge,
- schema normalization,
- per-record validation,
- valid/invalid routing,
- batched warehouse loading,
- PostgreSQL upsert semantics,
- dead-letter persistence,
- a separate error-handler workflow,
- example inputs and outputs,
- documented failure scenarios and engineering trade-offs.

The implementation is particularly useful as a portfolio example of **resilient ETL design**, because rejected data and technical workflow failures are treated as separate operational concerns.

---

## Repository Structure

```text
48-etl-data-warehouse/
├── .env.example
├── README.md
├── docs/
│   └── engineering-evidence.md
├── examples/
│   ├── sample-input.json
│   └── sample-output.json
├── sql/
│   └── init.sql
├── tests/
│   └── test-cases.json
└── workflows/
    ├── main-etl-pipeline.json
    └── etl-error-handler.json
```

---

## Canonical Data Model

The normalization node maps heterogeneous field names into:

```json
{
  "id": "c-001",
  "name": "Example Customer",
  "email": "customer@example.com",
  "source": "postgres",
  "valid": true,
  "errorReason": null,
  "raw": {}
}
```

Supported source-field mappings include:

| Canonical field | Accepted source fields |
|---|---|
| `id` | `id`, `customer_id`, `userId` |
| `name` | `name`, `full_name`, `username` |
| `email` | `email`, `email_address` |
| `source` | existing `source`, otherwise `unknown` |

### Validation Rules

A record is rejected when:

- the canonical ID is missing,
- the name is missing,
- the email is missing or fails the configured email regex.

Multiple validation failures are preserved as a comma-separated `errorReason`.

---

## Data-Quality Failure vs. Technical Failure

These should not be treated as the same thing.

### Record-level data-quality failure

Example:

```json
{
  "userId": "c-102",
  "username": "Reza",
  "email": "bad-email"
}
```

This should continue through the pipeline and be inserted into:

```text
warehouse.dead_letter_queue
```

with the raw record and an error reason.

### Technical workflow failure

Examples:

- database unavailable,
- network timeout,
- invalid credential,
- warehouse query failure,
- Slack notification failure.

These belong to the separate Error Trigger workflow or another operational recovery path.

This separation is intentional and should remain explicit as the project evolves.

---

## Warehouse Schema

Run:

```bash
psql -U postgres -f sql/init.sql
```

The script creates:

### `warehouse.customers`

```sql
CREATE TABLE IF NOT EXISTS warehouse.customers (
    id         TEXT PRIMARY KEY,
    name       TEXT NOT NULL,
    email      TEXT NOT NULL,
    source     TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `warehouse.dead_letter_queue`

```sql
CREATE TABLE IF NOT EXISTS warehouse.dead_letter_queue (
    id           SERIAL PRIMARY KEY,
    raw_record   JSONB NOT NULL,
    error_reason TEXT,
    created_at   TIMESTAMPTZ DEFAULT NOW()
);
```

### `ops.customers`

A small operational-source table is also created for local testing.

---

## Idempotency Model

Valid records use:

```sql
INSERT INTO warehouse.customers (...)
VALUES (...)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  source = EXCLUDED.source,
  updated_at = NOW();
```

This provides **record-level idempotency by canonical ID**.

If the same customer ID is replayed, the warehouse row is updated rather than duplicated.

### What this does not guarantee

The project does **not** claim global exactly-once processing.

For example:

- a DLQ insert can still be duplicated on replay,
- side effects across multiple systems are not transactional,
- source extraction has no persisted checkpoint,
- overlapping executions are not coordinated with a distributed lock.

The appropriate claim is:

> **at-least-once-friendly processing with idempotent warehouse upsert**

not exactly-once ETL.

---

## Setup

### 1. Initialize PostgreSQL

Run:

```bash
psql -U postgres -f sql/init.sql
```

### 2. Import both n8n workflows

Import:

```text
workflows/main-etl-pipeline.json
workflows/etl-error-handler.json
```

### 3. Configure PostgreSQL credentials

The exported workflows contain placeholder credential IDs:

```text
YOUR_PG_CRED_ID
```

Replace them with valid n8n PostgreSQL credentials.

Use least-privilege database roles where possible.

### 4. Configure environment values

Use `.env.example`:

```env
SOURCE_API_URL=https://api.example.com/v1/customers
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/CHANGE_ME

PG_HOST=localhost
PG_PORT=5432
PG_USER=etl_user
PG_PASSWORD=CHANGE_ME_SECURE_PASSWORD
PG_DATABASE=data_warehouse
```

The workflow itself uses n8n database credentials; the `PG_*` variables are mainly useful for local tooling/scripts unless you wire them into the workflow.

### 5. Configure the error workflow

The main workflow currently contains:

```text
errorWorkflow = YOUR_ERROR_WORKFLOW_ID
```

Replace this with the actual imported Error Handler workflow ID.

---

## Important Implementation Reality Checks

The original architecture is directionally strong, but several details in the current workflow export need to be understood before calling it production-ready.

### 1. The “CSV (S3)” source is currently simulated

The node named:

```text
Extract CSV (S3)
```

is a Code node that returns three hard-coded records.

It does **not** currently connect to S3 or parse a real CSV file.

This is a useful fixture for demonstrating normalization and rejection behavior, but production S3 ingestion still needs to be implemented.

### 2. The external API endpoint is a placeholder

The API source uses:

```text
SOURCE_API_URL=https://api.example.com/v1/customers
```

The real response shape must be verified.

If the endpoint returns an array nested inside one JSON object rather than one n8n item per customer, an explicit split/flatten step will be required before normalization.

### 3. Source attribution is incomplete

The Postgres query returns:

```text
customer_id
full_name
email_address
```

but does not add a `source` field.

The normalization logic therefore records those rows as:

```text
source = "unknown"
```

unless source metadata is added upstream.

For lineage, every extractor should stamp its source explicitly.

### 4. The current final report should not be treated as authoritative

The Final Report counts fields such as:

```text
id
valid
errorReason
```

after the records have already passed through PostgreSQL insert/query nodes.

Database execution nodes do not necessarily preserve the original input object in their output.

Therefore the current result-merging path may not have the original validation metadata required for accurate loaded/DLQ counts.

A stronger implementation should calculate metrics before data is discarded, or attach counters/metadata explicitly through the load path.

### 5. The sample output is a target example, not guaranteed current runtime output

`examples/sample-output.json` contains:

```json
{
  "status": "COMPLETED_WITH_REJECTIONS",
  "totalProcessed": 3,
  "loadedToWarehouse": 1,
  "sentToDlq": 2
}
```

The current Final Report Code node, however, hard-codes:

```text
status = "COMPLETED"
```

These are not currently identical contracts.

The README therefore treats the example output as the **desired reporting shape**, not proof of the current runtime result.

### 6. Error continuation and error-workflow behavior need deliberate wiring

Several nodes use:

```text
onError = continueErrorOutput
```

but their error outputs are not connected to dedicated recovery branches in the exported graph.

This matters because “continue on error” and “fail the execution so the Error Trigger runs” are different policies.

For each source/load node, choose intentionally between:

- continue with degraded-source metadata,
- retry,
- route to a technical-failure branch,
- fail the workflow and invoke the global error workflow.

Do not assume the current setting provides all four behaviors.

---

## Failure Semantics

A production ETL pipeline should define the desired behavior for each failure type.

| Failure | Recommended behavior |
|---|---|
| Invalid email | DLQ record, continue batch |
| Missing ID | DLQ record, continue batch |
| Duplicate warehouse ID | upsert/update |
| One source timeout | retry, then explicit degraded/failure decision |
| Warehouse unavailable | do not claim record loaded |
| DLQ unavailable | fail or quarantine elsewhere; never silently drop |
| Schema drift | contract failure + alert |
| Error-alert failure | preserve primary failure independently |

The repository’s test file lists the intended scenarios, but these cases are primarily **test specifications**; they are not all implemented as automated executable tests yet.

---

## Testing

The repository includes:

```text
tests/test-cases.json
```

with scenarios for:

- valid multi-source records,
- invalid email,
- missing canonical ID,
- replayed ID,
- source timeout,
- warehouse outage.

### Manual verification

After running the workflow:

```sql
SELECT * FROM warehouse.customers ORDER BY id;
```

Then inspect DLQ records:

```sql
SELECT id, error_reason, created_at
FROM warehouse.dead_letter_queue
ORDER BY id DESC;
```

To check rejection rates:

```sql
SELECT error_reason, COUNT(*)
FROM warehouse.dead_letter_queue
GROUP BY error_reason
ORDER BY COUNT(*) DESC;
```

### Idempotency check

Run the same valid input twice.

Expected warehouse behavior:

```text
same canonical ID
→ existing row updated
→ no duplicate customer row
```

Also inspect whether DLQ records are duplicated on replay, because the current DLQ insert is not idempotent.

---

## Security

- Never commit live database passwords or webhook URLs.
- Use n8n credentials or an approved secrets manager.
- Apply least-privilege roles separately to source and warehouse databases.
- Treat DLQ payloads as potentially sensitive PII.
- Define retention rules for rejected raw records.
- Encrypt database traffic with TLS.
- Restrict access to operational and warehouse schemas independently.
- Avoid logging full raw customer records in production error logs.
- Parameterize database inputs; do not build SQL from untrusted fields.

---

## Observability

Useful production metrics include:

```text
records_extracted_total
records_loaded_total
records_rejected_total
dlq_rate
source_failure_rate
warehouse_failure_rate
etl_duration_seconds
source_freshness_lag
replay_success_rate
```

Add a stable execution ID / batch ID so records, logs, alerts, and replay actions can be correlated.

A final ETL report should be derived from explicit counters, not inferred from post-database node output.

---

## Production Hardening Roadmap

A stronger next version should add:

1. real S3/CSV ingestion,
2. explicit source metadata on every record,
3. schema contracts and versioning,
4. bounded retries with backoff,
5. explicit technical-error branches,
6. accurate pre/post-load metrics,
7. batch/execution correlation IDs,
8. source checkpointing or incremental extraction,
9. DLQ replay tooling,
10. DLQ deduplication/idempotency strategy,
11. data lineage metadata,
12. PII masking and retention controls,
13. concurrency/overlap protection,
14. load testing with measured throughput,
15. executable automated tests and recovery drills.

---

## Engineering Trade-offs

### Per-record validation

**Advantage:** one malformed record does not block valid records.

**Trade-off:** every rejected record creates operational follow-up work.

### Dead-Letter Queue

**Advantage:** preserves evidence for repair and replay.

**Trade-off:** a DLQ is useful only if ownership, replay tooling, retention, and monitoring exist.

### Idempotent upsert

**Advantage:** safe warehouse replay for the same canonical ID.

**Trade-off:** this does not make the whole distributed pipeline exactly-once.

### Batch loading

**Advantage:** controls database load and can improve throughput.

**Trade-off:** partial-batch recovery and metrics become more complex.

### n8n orchestration

**Advantage:** visible, inspectable workflow logic and quick integration.

**Trade-off:** high-volume ETL eventually needs careful benchmarking, state management, backpressure, and possibly specialized data-processing infrastructure.

---

## Engineering Evidence

Additional project material:

- [Engineering evidence](docs/engineering-evidence.md)
- [Sample input](examples/sample-input.json)
- [Sample output](examples/sample-output.json)
- [Test scenarios](tests/test-cases.json)
- [Database initialization](sql/init.sql)

The evidence pack documents the core design claim clearly: **record-level DLQ handling and technical workflow failure are different concerns**.

---

## Interview Defense

A concise explanation of the architecture:

> Three heterogeneous sources are normalized into one canonical customer schema. Invalid records are preserved in a DLQ rather than blocking the batch, while valid records use an idempotent PostgreSQL upsert. Technical workflow failures are handled separately from data-quality rejection. The design favors at-least-once processing with idempotent writes rather than claiming global exactly-once semantics.

The strongest follow-up discussion is around the remaining production gaps: lineage, checkpointing, retry policy, DLQ replay, metrics accuracy, concurrency, and recovery testing.

---

## License

This project is proprietary and intended for internal use or authorized clients. © 2026.
