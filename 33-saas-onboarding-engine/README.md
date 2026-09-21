# 33 — Multi-Tenant SaaS Onboarding Engine & AI Orchestrator

![Level](https://img.shields.io/badge/Level-Advanced-6F42C1)
![Status](https://img.shields.io/badge/Status-Reference%20Implementation-0A7EA4)
![n8n](https://img.shields.io/badge/n8n-1.x%2B-EA4B71)
![AI](https://img.shields.io/badge/AI-GPT--4-orange)
![Database](https://img.shields.io/badge/Database-PostgreSQL-336791)

An n8n workflow that demonstrates an automated B2B SaaS onboarding pipeline: receive a signup webhook, normalize customer data, create a tenant record in PostgreSQL, generate a 30-day onboarding plan with GPT-4, create collaboration resources in Slack and Notion, and send either a client welcome email or an internal alert.

> **Scope:** this repository is an implementation reference for orchestration patterns. It is not yet a production-complete onboarding platform. The sections below separate what the workflow currently does from what should be hardened before business-critical use.

## Business Problem

Enterprise SaaS onboarding usually crosses several systems:

- customer and tenant data,
- customer-success operations,
- onboarding plans,
- collaboration channels,
- project documentation,
- welcome communication,
- failure recovery.

When these steps are performed manually, onboarding quality can vary between customers and operational handoffs can be missed.

This project models a single automated onboarding journey that coordinates those systems from one webhook-triggered workflow.

## Workflow Preview

![SaaS onboarding workflow](screenshots/workflow-view.png)

## High-Level Architecture

```text
┌──────────────────────┐
│ Webhook Trigger      │
│ POST signup payload  │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ Parse & Prepare Data │
│ normalize fields     │
│ generate tenant ID   │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ PostgreSQL           │
│ create tenant record │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ GPT-4                │
│ 30-day plan in JSON  │
└──────────┬───────────┘
           │
        ┌──┴───────────────┐
        │                  │
        ▼                  ▼
┌───────────────────┐  ┌───────────────────┐
│ Create Slack      │  │ Create Notion     │
│ private channel   │  │ onboarding page   │
└─────────┬─────────┘  └─────────┬─────────┘
          │                      │
          ▼                      │
┌───────────────────┐            │
│ Invite CSM        │            │
└─────────┬─────────┘            │
          └──────────┬───────────┘
                     ▼
           ┌────────────────────┐
           │ Check Slack Success│
           └─────────┬──────────┘
                 true│false
                     │
             ┌───────┴────────┐
             ▼                ▼
┌──────────────────────┐  ┌──────────────────────┐
│ Send Welcome Email   │  │ Send Error Alert     │
└──────────────────────┘  └──────────────────────┘
```

## Current Data Flow

| Stage | Input | Processing | Output |
|---|---|---|---|
| Webhook | signup JSON | receives POST request | raw customer payload |
| Parse | webhook body | normalizes snake_case/camelCase fields and generates tenant ID | canonical onboarding object |
| Database | canonical object | inserts tenant record | persisted onboarding start |
| AI | customer profile | asks GPT-4 for structured 30-day onboarding plan | JSON plan |
| Slack | tenant ID | creates a private channel and invites the configured CSM | collaboration channel |
| Notion | company + AI plan | creates an onboarding page | onboarding workspace |
| Routing | Slack creation result | checks `ok === true` | success or alert branch |
| Email | customer/admin data | formats HTML onboarding message | welcome email or internal alert |

## Incoming Webhook Contract

The workflow accepts either snake_case or selected camelCase field names.

Example:

```json
{
  "company_name": "Acme Corp",
  "industry": "FinTech",
  "admin_email": "ceo@acmecorp.com",
  "admin_name": "John Doe",
  "plan_type": "Enterprise",
  "employee_count": 150
}
```

The parsing node also supports:

- `companyName`
- `adminEmail`
- `adminName`
- `plan`
- `employeeCount`

Current defaults:

- `industry` → `General`
- `plan_type` / `plan` → `Pro`
- `employee_count` / `employeeCount` → `10`

## Tenant ID Behavior

The current workflow generates the tenant identifier by:

1. lowercasing the company name,
2. replacing spaces with hyphens,
3. appending the last four digits of the current timestamp.

Conceptually:

```text
acme-corp-1234
```

This is convenient for a demo, but it is not a strong uniqueness strategy for a production multi-tenant system. A database-generated UUID or another collision-resistant identifier is preferable.

## AI Output Contract

The OpenAI node requests a JSON object with this structure:

```json
{
  "welcome_message": "Personalized introduction",
  "week_1_goals": ["..."],
  "week_2_goals": ["..."],
  "week_3_goals": ["..."],
  "week_4_goals": ["..."],
  "recommended_resources": ["..."],
  "key_success_metrics": ["..."]
}
```

The model is configured for JSON output, but downstream expressions still assume the returned content is valid JSON. A malformed or schema-incompatible response can therefore break later nodes.

## Repository Layout

```text
33-saas-onboarding-engine/
├── .env.example
├── README.md
├── screenshots/
│   └── workflow-view.png
└── workflows/
    └── workflow.json
```

## Nodes Used

| Node | Purpose |
|---|---|
| `Webhook` | receives onboarding requests |
| `Code` | normalizes request data and generates tenant ID |
| `Postgres` | inserts the tenant record |
| `OpenAI` | generates the onboarding plan |
| `HTTP Request` | creates the Slack channel |
| `HTTP Request` | invites the CSM to Slack |
| `Notion` | creates the onboarding page |
| `IF` | checks Slack channel-creation success |
| `Email Send` | sends welcome or internal error email |

## Setup

### 1. Import the workflow

In n8n:

```text
Workflows → Import from File
```

Import:

```text
workflows/workflow.json
```

### 2. Configure environment values

Use `.env.example` as the reference:

```env
SLACK_BOT_TOKEN=xoxb-your-slack-bot-token
CUSTOMER_SUCCESS_MANAGER_SLACK_ID=U0123456789
INTERNAL_ALERT_EMAIL=devops@yourcompany.com

DB_HOST=localhost
DB_PORT=5432
DB_NAME=saas_tenants_db
DB_USER=postgres
DB_PASSWORD=your_password
```

The workflow itself uses an n8n PostgreSQL credential. The `DB_*` values in the example file are therefore optional unless your deployment uses them elsewhere.

### 3. Configure n8n credentials

Replace the placeholder credential references with real n8n credentials for:

- PostgreSQL
- OpenAI
- Notion
- SMTP

Slack is currently called through HTTP Request nodes using `SLACK_BOT_TOKEN`.

### 4. Create the tenant table

A schema compatible with the current workflow is:

```sql
CREATE TABLE tenants (
    id SERIAL PRIMARY KEY,
    tenant_id VARCHAR(100) UNIQUE NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    industry VARCHAR(100),
    admin_email VARCHAR(255) NOT NULL,
    admin_name VARCHAR(255),
    plan_type VARCHAR(50),
    employee_count INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'onboarding_started'
);
```

### 5. Configure Notion

Update the `Create Notion Page` node with a real Notion database ID.

The current workflow expects the target database to support at least properties compatible with:

- `Status`
- `Tenant ID`

### 6. Test the webhook

Use the n8n test webhook and send a POST request with the sample payload shown above.

Inspect every node output before enabling the production webhook.

## What Is Actually Implemented

The current workflow implements:

- webhook-triggered onboarding,
- basic field normalization,
- tenant creation in PostgreSQL,
- GPT-4 onboarding-plan generation,
- private Slack channel creation,
- CSM invitation request,
- Notion page creation,
- Slack creation-status check,
- HTML welcome email,
- internal SMTP alert branch.

## Important Current Limitations

The current implementation does **not** yet provide:

- authenticated webhook verification,
- payload schema validation,
- idempotency keys,
- duplicate-signup protection,
- transaction boundaries across external systems,
- rollback/compensation,
- durable retry queues,
- dead-letter handling,
- complete step-by-step audit history,
- tenant-ID collision protection beyond a short timestamp suffix,
- automated tests,
- full onboarding-plan rendering in Notion or email.

The generated AI contract includes weeks 1–4, resources, and success metrics, but the current Notion page renders only Week 1 and Week 2, and the welcome email also renders only Week 1 and Week 2.

## Reliability Review

### 1. Database write happens before external provisioning

The tenant is inserted before the AI, Slack, Notion, and email steps complete.

If a later step fails, the database can contain a tenant whose onboarding resources were only partially provisioned.

A production design should track provisioning state explicitly, for example:

```text
received
→ tenant_created
→ plan_generated
→ slack_created
→ notion_created
→ welcome_sent
→ completed
```

### 2. No idempotency protection

If the same webhook is delivered twice, the workflow can attempt to create duplicate onboarding resources.

Production systems should attach an immutable event ID or onboarding request ID and reject or reuse previously processed requests.

### 3. Slack success check is narrower than it appears

The `Check Slack Success` node evaluates:

```text
Create Slack Channel → ok
```

It does not independently verify that:

- the CSM invitation succeeded,
- the Notion page succeeded,
- the welcome email succeeded.

So the current success branch should not be interpreted as proof that the entire onboarding transaction completed.

### 4. Parallel branch convergence needs hardening

After AI generation, the workflow branches into Slack and Notion paths, and both paths connect to `Check Slack Success`.

This is not an explicit synchronization/aggregation barrier. In a production workflow, use a deliberate join/merge strategy so downstream communication runs exactly once and only after the required provisioning steps have reached a known state.

### 5. External API failure behavior is incomplete

The workflow contains an internal alert branch for a Slack API response where `ok` is false, but transport-level failures, credential failures, rate limits, or failures in other integrations can still stop execution before that branch is reached.

Production hardening should add controlled retries, failure routing, and persistent error state.

## Security Notes

- Never commit real API tokens, SMTP passwords, database passwords, or credential IDs.
- Verify webhook authenticity before provisioning a tenant.
- Validate and sanitize all incoming fields.
- Treat AI-generated text as untrusted content before inserting it into HTML or external systems.
- Apply least-privilege scopes to Slack and Notion integrations.
- Avoid exposing internal tenant IDs or sensitive customer metadata in logs unnecessarily.
- Store secrets in n8n credentials or an approved secret manager rather than hard-coding them in workflow JSON.

## Testing Checklist

Before using the workflow beyond a demo environment, test at least these cases:

- valid onboarding payload,
- missing `company_name`,
- missing or malformed `admin_email`,
- non-numeric `employee_count`,
- duplicate webhook delivery,
- PostgreSQL insert failure,
- malformed AI JSON,
- Slack channel already exists,
- Slack `ok: false` response,
- Slack invitation failure,
- Notion database/property mismatch,
- SMTP delivery failure,
- external API timeout or rate limit.

Also verify that the success email is emitted exactly once per onboarding request.

## Production Hardening Roadmap

A production-oriented next version should add:

1. request schema validation,
2. webhook signature verification,
3. UUID-based tenant IDs,
4. event-level idempotency,
5. onboarding-state persistence,
6. explicit branch synchronization,
7. per-step retry policies,
8. dead-letter/error workflow integration,
9. structured AI schema validation,
10. complete Week 1–4 plan rendering,
11. audit events for every provisioning step,
12. observability metrics for onboarding latency and failure rates,
13. automated integration tests,
14. human recovery tooling for partially provisioned tenants.

## Engineering Trade-offs

### Direct orchestration in one workflow

**Advantage:** easy to understand and demonstrate end to end.

**Trade-off:** as the number of integrations grows, recovery and retry behavior becomes harder to reason about.

A more mature design could split onboarding into smaller workflows or jobs with persisted state between steps.

### AI-generated onboarding plan

**Advantage:** creates a customized starting point from minimal customer metadata.

**Trade-off:** output quality is probabilistic and should not be treated as an authoritative customer-success plan without validation.

### HTTP-based Slack integration

**Advantage:** exposes the raw API contract and avoids dependency on a specialized node.

**Trade-off:** you must explicitly handle Slack's API-level success/failure semantics and authentication securely.

## Design Summary

This project demonstrates a useful SaaS automation pattern: one business event triggers coordinated changes across a database, AI layer, collaboration tools, documentation, and customer communication.

Its strongest portfolio value is the orchestration concept. The most important next engineering step is not adding more integrations—it is making the existing process idempotent, observable, retry-safe, and explicit about partial failure.

## License

This project is proprietary and intended for internal use or authorized clients. © 2026.
