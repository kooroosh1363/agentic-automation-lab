# 24 — HVAC Field Service Orchestration & Dynamic Dispatch

![Level](https://img.shields.io/badge/Level-Advanced-6F42C1)
![Platform](https://img.shields.io/badge/Platform-n8n%20%7C%20PostgreSQL-orange)
![Workflow](https://img.shields.io/badge/Workflow-Inactive-lightgrey)

An n8n reference workflow for HVAC and appliance-repair field service. It receives a service request, uses an LLM to structure the issue, retrieves active technicians from PostgreSQL, ranks eligible candidates with deterministic JavaScript, and routes the request either to calendar/SMS actions or to a human dispatcher.

> **Read before importing:** This repository contains a configurable portfolio/demo workflow, not a production-ready dispatch service. The workflow export includes placeholder credential references, sample destinations and a fixed next-day calendar slot. It is marked inactive. Do not activate it or send real customer data until the configuration, security controls and end-to-end behavior have been reviewed in a staging environment.

## What problem does it solve?

The nearest technician is not necessarily the right technician. A useful dispatch decision must consider skill fit, required parts, travel distance and current workload. This example separates probabilistic issue extraction from deterministic technician ranking:

- **AI extracts context:** device type, issue summary, required parts and urgency.
- **PostgreSQL supplies operational facts:** active technicians, skills, coordinates, workload and van inventory.
- **Code ranks candidates:** skill filtering, Haversine distance, parts availability and workload.
- **Routing preserves human oversight:** automatic booking is allowed only when a technician is selected and all required parts are available; otherwise the request is sent to the dispatch fallback.

## Architecture

![Workflow Diagram](./screenshots/workflow-diagram.png)

```text
Service request
    |
    v
Webhook --> OpenAI issue extraction
                    |
                    v
             PostgreSQL technicians
                    |
                    v
          Deterministic scoring (Code)
                    |
                    v
             Dispatch decision
               /          \
      eligible + parts    fallback
            |                |
       Google Calendar      Slack
            |
          Twilio
```

## Workflow components

| Node | Responsibility | Important configuration |
| --- | --- | --- |
| Webhook | Receives the service request via POST | Path: `hvac-service-request`; add authentication and input validation before exposure |
| OpenAI | Extracts structured issue information | Configure a valid n8n OpenAI credential and validate the returned JSON schema |
| PostgreSQL | Reads active technician records | Configure a least-privilege database credential |
| Code | Filters and scores technicians | Uses the technicians returned by PostgreSQL; see scoring details below |
| Switch | Routes based on technician assignment and parts availability | Verify both boolean and object conditions in your n8n version |
| Google Calendar | Creates a service event on the success path | Replace the primary calendar and fixed sample time logic |
| Twilio | Sends customer confirmation | Replace sample phone numbers and map a consented customer number |
| Slack | Alerts dispatch staff on fallback | Select your own workspace/channel and review PII in alert content |

## Dispatch and scoring logic

The Code node currently performs these steps:

1. Reads the original request from the Webhook node and validates that customer latitude and longitude are numeric.
2. Parses the OpenAI response as JSON.
3. Normalizes technician skills, required parts and van inventory for case-insensitive comparisons.
4. Filters technicians to those whose skills include the extracted `device_type`.
5. Calculates straight-line distance with the Haversine formula.
6. Scores each candidate using the following weighted model:

| Factor | Weight | Current calculation |
| --- | ---: | --- |
| Proximity | 40% | `max(0, 100 - distance_km × 5)` |
| Required parts | 40% | 100 if all required parts are present, otherwise 0 |
| Workload | 20% | `max(0, 100 - current_load × 15)` |

Candidates are sorted by descending score, then by distance and technician ID for deterministic tie-breaking. The top-ranked candidate is selected. If no candidate matches the skill, or the selected candidate lacks a required part, the dispatch status is `MANUAL_REVIEW_REQUIRED`; otherwise it is `AUTO_DISPATCH_READY`.

**Important distinction:** parts availability affects ranking, but missing parts also block automatic dispatch. A technician with missing parts can still be the highest-ranked candidate and will then be sent to manual review.

### Example price calculation

The current demo uses a simplified, hard-coded USD estimate:

- Base price: $150 for `critical` urgency; $100 for other urgency values.
- Travel fee: selected technician's straight-line distance × $1.50.
- Parts fee: number of required parts × $25.

`final_price_usd = base_price + travel_fee + parts_fee`

This is illustrative only. It is not connected to a real price book, tax rules, labor rates, supplier costs or customer-approved estimates. Do not present it as a binding quote.

## Repository contents

| Path | Purpose |
| --- | --- |
| [workflow.json](workflow.json) | n8n workflow export |
| [sql/init.sql](sql/init.sql) | PostgreSQL technician table and repeatable sample fixtures |
| [examples/sample-input.json](examples/sample-input.json) | Example incoming service request |
| [examples/sample-output.json](examples/sample-output.json) | Illustrative dispatch result |
| [tests/test-cases.json](tests/test-cases.json) | Scenario inventory and expected outcomes |
| [docs/engineering-evidence.md](docs/engineering-evidence.md) | Architecture rationale, security, trade-offs and interview notes |
| [screenshots/workflow-diagram.png](screenshots/workflow-diagram.png) | Workflow diagram |

The JSON test-case file is a **scenario/acceptance checklist**, not an automated test runner. The sample output is an example artifact, not proof that the workflow has passed an end-to-end run.

## Prerequisites

- n8n Cloud or self-hosted n8n with compatible Webhook, OpenAI, PostgreSQL, Code, Switch, Google Calendar, Twilio and Slack nodes.
- PostgreSQL database.
- OpenAI API access.
- Google Calendar OAuth2 access.
- Twilio account and an authorized sender number.
- Slack app/bot access to the dispatch channel.
- A staging environment and test destinations before any live activation.

## Setup

### 1. Import and keep inactive

Import `workflow.json` into n8n. Keep it inactive. Review node-version warnings and inspect every node before connecting credentials.

### 2. Create the technician table

Run the repository SQL fixture against a development database:

```bash
psql "$DATABASE_URL" -f sql/init.sql
```

The script creates `technicians` with:

- `id`: technician identifier (primary key)
- `name`: display name
- `lat`, `lon`: technician coordinates
- `skills`: PostgreSQL text array of supported device categories
- `current_load`: non-negative workload count
- `van_inventory`: PostgreSQL text array of available parts
- `status`: `active` or `inactive`
- `updated_at`: last fixture/update timestamp

The sample records are illustrative. Replace them with accurate, maintained operational data before evaluating dispatch quality.

### 3. Configure credentials

Create credentials inside n8n for OpenAI, PostgreSQL, Google Calendar, Twilio and Slack. Rebind the nodes to those credentials. The credential IDs/names embedded in an exported workflow are not portable secrets and should not be assumed to exist in another n8n instance.

Use a database account with only the permissions needed for technician lookup. Do not commit API keys, passwords, tokens or real customer records.

### 4. Replace demo destinations and scheduling

Before testing, inspect and replace all sample values in `workflow.json`, including:

- Twilio `fromNumber` and `toNumber` (the current export contains sample numbers).
- Slack channel selection/ID.
- Google Calendar attendee email.
- Calendar start/end expressions (currently fixed relative to execution time, approximately tomorrow).
- Any credential references that point to accounts from another n8n instance.

The current calendar expressions do **not** select a technician-specific availability slot or check for calendar conflicts. Implement availability lookup and collision handling before relying on bookings.

### 5. Send a test request

The sample payload is available at [examples/sample-input.json](examples/sample-input.json). With the workflow running in test mode, send a POST request to the test webhook URL:

```bash
curl -X POST "$N8N_WEBHOOK_TEST_URL" \
  -H "Content-Type: application/json" \
  -d @examples/sample-input.json
```

Use only fictional customer information and test phone/calendar/channel destinations. Inspect the output of each node, not just the final webhook response.

### 6. Validate the outcomes

Use [tests/test-cases.json](tests/test-cases.json) as a minimum manual acceptance checklist. Confirm that the actual workflow behavior matches each expected outcome. Do not infer that a scenario is implemented merely because it appears in the fixture list.

## Sample request

```json
{
  "request_id": "req-hvac-001",
  "customer_name": "Sample Customer",
  "customer_address": "Example Service Area",
  "customer_lat": 35.7005,
  "customer_lon": 51.4012,
  "issue_description": "The AC is running but not cooling; the thermostat appears normal."
}
```

The workflow expects coordinates as numeric values and an issue description. In production, validate required fields, coordinate ranges, request size and phone-number format at the webhook boundary.

## Known limitations and production gaps

The following items are not solved merely by importing the current workflow:

1. **Webhook security:** the exported Webhook node does not show an authentication mechanism. Add authentication, rate limiting, payload validation and abuse protection before public exposure.
2. **Idempotency:** `request_id` is passed through, but the workflow does not implement a durable duplicate-request check. The duplicate scenario in the test fixture is a target behavior, not an implemented guarantee.
3. **Calendar availability:** the success path creates an event using a fixed relative time. It does not query technician availability or prevent overlapping bookings.
4. **Technician-specific calendar:** the exported calendar configuration uses the primary calendar and a sample attendee; it is not dynamically mapped to the selected technician's actual calendar.
5. **SMS mapping and consent:** the exported Twilio node contains sample phone numbers. Add validated customer contact mapping, consent/opt-out handling and localized message templates.
6. **Inventory freshness:** van inventory is read from the technician table; no reservation, decrement or real-time stock reconciliation is implemented.
7. **Distance accuracy:** Haversine distance is straight-line distance, not road distance or estimated travel time. Use a routing provider if dispatch depends on real journey time.
8. **Scoring calibration:** the 40/40/20 weights and distance/load formulas are example assumptions. Backtest against real outcomes and monitor SLA, first-time-fix rate, travel time and technician utilization.
9. **Pricing:** the USD calculation is illustrative and not connected to an approved price book or local currency/tax rules.
10. **Resilience and observability:** implement provider retries, timeouts, dead-letter/manual recovery, structured logs, alerts and execution monitoring. Make external side effects idempotent.
11. **AI validation:** treat model output as untrusted. Validate allowed device categories, urgency values and part identifiers against controlled vocabularies before scoring.

The engineering rationale and recommended production work are documented in [Engineering Evidence](docs/engineering-evidence.md).

## Troubleshooting

| Symptom | Checks |
| --- | --- |
| AI JSON parse error | Inspect the actual OpenAI node output and ensure it matches the expected JSON structure |
| No technician selected | Check the active technician query, skill labels and normalized device type |
| Technician unexpectedly sent to fallback | Verify required-part names against `van_inventory` and inspect the selected candidate |
| Invalid coordinate error | Send numeric latitude/longitude within valid geographic ranges |
| PostgreSQL returns no rows | Verify connection, schema, table name, permissions and active sample records |
| Calendar event is wrong | Replace the fixed date expressions and sample calendar/attendee settings |
| SMS or Slack delivery fails | Verify credentials, sender permissions, destination format and channel access |

## Security and privacy

- Minimize customer personal data sent to the LLM; send only what is necessary for issue classification.
- Do not include sensitive customer details in Slack alerts or execution logs unless operationally necessary and access-controlled.
- Keep credentials in n8n's credential store or a managed secrets system.
- Authenticate and rate-limit the webhook.
- Restrict PostgreSQL access to the minimum required tables and operations.
- Define retention and deletion policies for customer requests, addresses and execution data.
- Obtain appropriate consent and comply with local rules for customer SMS notifications.

## Suggested next improvements

- Add a request-id idempotency table and unique constraint before any booking or notification.
- Add technician availability and calendar-conflict checks.
- Connect parts to a live inventory/reservation service.
- Replace straight-line distance with road travel time.
- Move pricing into a versioned service price book.
- Add schema validation and controlled vocabularies for AI extraction.
- Build automated tests for scoring, routing, duplicate requests and failure recovery.
- Add dispatch outcome metrics and periodically recalibrate the scoring model.

## License

This project is licensed under the MIT License. See the repository license file for the full terms.
