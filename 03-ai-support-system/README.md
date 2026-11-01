# Exercise 3: AI Support System — Smart Ticket Routing

![Level](https://img.shields.io/badge/Level-Foundation-6C757D)
![Platform](https://img.shields.io/badge/Platform-n8n-FF6D5A)
![Status](https://img.shields.io/badge/Status-Educational_Reference-6C757D)

> **Scope:** This repository contains an educational n8n workflow, **not** a verified production-ready ticketing service. Review its actual node output, credentials, data protection, and failure handling before connecting real customers.

## Overview

The [n8n workflow](workflow.json) receives a support-ticket POST request, submits the message to an OpenAI node configured with model ID `gpt-4`, and attempts to classify the ticket by category and urgency. It sends an urgent alert to Slack **or** a non-urgent confirmation email, appends the ticket to a Google Sheet, and returns a JSON webhook response.

**Routing detail:** Only the `urgent` branch goes to Slack. Both `normal` and `low` priority fall through the **non-urgent** email branch. Urgent tickets are **not** sent the customer-confirmation email by the current workflow.

## Workflow diagram

```text
POST /support-ticket
       |
       v
AI Ticket Analysis (OpenAI, model ID: gpt-4)
       |
       v
Check Priority (parsed priority == "urgent")
       | true                         | false
       v                              v
Slack Alert                    Send Email Response
       \                              /
        \                            /
         v                          v
          Save to Database (Google Sheets)
                       |
                       v
               Respond to Webhook
```

![Workflow diagram](screenshots/workflow-diagram.png)

### Node contract

| Node | Behavior in the exported JSON |
| --- | --- |
| `Webhook` | Accepts `POST` requests at path `support-ticket`; configured to use a response node. |
| `AI Ticket Analysis` | Asks for JSON containing `category` and `priority`; configured with model ID `gpt-4` and temperature `0.3`. |
| `Check Priority` | Evaluates `JSON.parse($json.message.content).priority` against `urgent`. |
| `Slack Alert` | True branch: sends an alert to `#urgent-support`. |
| `Send Email Response` | False branch: sends an acknowledgment to the ticket's `customer_email`. |
| `Save to Database` | Both branches converge on a Google Sheets insert into tab `Tickets`. |
| `Respond to Webhook` | Attempts to return a JSON success payload after the sheet insert. |

## Requirements and credentials

- A compatible n8n instance and working credentials for **OpenAI**, **Slack**, **SMTP email**, and **Google Sheets**.
- A Google spreadsheet with an accessible tab named exactly `Tickets`.
- A Slack channel for urgent alerts (the export uses `#urgent-support`).
- A configured, authorized sender email address (the export contains the placeholder `support@yourcompany.com`).
- A **private test environment** with synthetic ticket data. OpenAI node output and webhook request-body shapes can vary with n8n/node versions.

**Privacy:** Support messages can contain personal data. This workflow sends ticket content to an external AI provider, transmits urgent ticket details to Slack, and stores records in Google Sheets. Do not send real personal or sensitive information until access controls, retention, provider policies, and authorization have been reviewed.

## Test request and expected fields

The workflow's expressions refer to the following fields from the `Webhook` node:

| Field | Example (synthetic) | Used for |
| --- | --- | --- |
| `ticket_id` | `DEMO-0001` | Ticket identifier, sheet record, webhook response |
| `customer_name` | `Example Customer` | Slack alert or email greeting |
| `customer_email` | `test@example.com` | Slack alert or email recipient |
| `message` | `My demo order page returns an error.` | AI analysis, Slack alert, sheet record |

Example payload for a **controlled local test**:

```json
{
  "ticket_id": "DEMO-0001",
  "customer_name": "Example Customer",
  "customer_email": "test@example.com",
  "message": "My demo order page returns an error."
}
```

The exported expressions expect these fields directly on the Webhook node's JSON item. **This is an unverified assumption:** n8n Webhook versions commonly expose incoming request data under `body`. Inspect the Webhook node's execution output and adapt the field references or normalize the input if necessary. The example above is not a guarantee that the imported workflow will operate without adjustment.

For a manual request after starting the n8n test webhook, use the actual **Test URL copied from your n8n editor**:

```bash
curl --request POST "$N8N_TEST_WEBHOOK_URL" \
  --header "Content-Type: application/json" \
  --data '{"ticket_id":"DEMO-0001","customer_name":"Example Customer","customer_email":"test@example.com","message":"My demo order page returns an error."}'
```

Set `N8N_TEST_WEBHOOK_URL` in your shell first; never publish your live webhook URL or credentials.

## Google Sheets schema

Create a sheet tab named `Tickets` with these column headers, matching the insert mapping in [`workflow.json`](workflow.json):

| Column | Value written by workflow |
| --- | --- |
| `ticket_id` | Incoming ticket identifier |
| `customer_name` | Incoming customer name |
| `customer_email` | Incoming customer email |
| `message` | Incoming support message |
| `category` | Parsed AI category |
| `priority` | Parsed AI priority |
| `status` | Literal `Open` |
| `created_at` | n8n expression `$now.toISO()` |

The requested AI categories are `technical`, `billing`, and `general`. The requested priorities are `urgent`, `normal`, and `low`. These values are prompt instructions, **not enforced by an explicit output schema** in this export.

## Setup and manual verification

1. Import [`workflow.json`](workflow.json) into n8n and confirm that all seven nodes and both priority branches appear.
2. Attach the OpenAI credential, confirm the configured model and node version are available, and inspect the actual OpenAI output structure.
3. Configure the Slack credential and change `#urgent-support` if the intended team channel is different.
4. Configure an SMTP credential and replace the placeholder sender email with an authorized address. The email currently promises a response **within 24 hours**; change this wording unless your team can honor that commitment.
5. Replace `YOUR_GOOGLE_SHEET_ID`, configure the Google Sheets credential, create the `Tickets` headers, and verify the insert mapping.
6. Enable a test webhook (not a public production endpoint), submit synthetic data, and inspect the `Webhook` JSON fields. Correct any `body` versus top-level field mismatches before proceeding.
7. Check whether OpenAI returns parseable JSON in the exact location `$json.message.content` used by the downstream expressions. The workflow has no explicit JSON parser/schema validator.
8. Test an `urgent` classification and separately a `normal` or `low` classification; inspect which notification runs, whether exactly one row is added, and what webhook response is returned.
9. Only after successful negative/failure tests should you consider activating the workflow. No live execution results are claimed here.

### Manual acceptance checklist

- [ ] The webhook receives a synthetic ticket and the input fields resolve correctly.
- [ ] AI output contains valid JSON with one of the expected categories and priorities.
- [ ] An `urgent` item reaches Slack and **does not** traverse the email node.
- [ ] A non-urgent item reaches the email node and **does not** traverse Slack.
- [ ] Both branches attempt to insert one row with the expected eight columns.
- [ ] The webhook response contains the correct ticket ID, category, and priority.
- [ ] A malformed AI response is handled safely (the current export has **no** dedicated fallback).
- [ ] Invalid sender, Slack permission failure, Google Sheets failure, and duplicate `ticket_id` are evaluated before any real deployment.

These are testing instructions, not evidence of successful automated or live tests.

## Known limitations and operational risks

1. **Webhook input mismatch risk:** Expressions use top-level `Webhook` fields even though incoming POST data may appear under `body`. Confirm the actual n8n output.
2. **Fragile AI parsing:** `JSON.parse(...message.content)` assumes a particular response format and valid JSON. A different OpenAI output shape or malformed response may break routing and database expressions.
3. **No validated priority contract:** Prompting for `urgent/normal/low` is not equivalent to schema validation; unexpected values follow the non-urgent branch unless an expression fails.
4. **Different customer communications:** Urgent tickets send Slack alerts but no customer email in the current topology. Normal and low tickets send an email, but no Slack alert.
5. **Unverified service promise:** The non-urgent email states that support will respond within 24 hours. The workflow contains no SLA tracking or enforcement.
6. **No explicit authentication or abuse controls:** The exported Webhook node does not configure authentication, rate limits, spam filtering, or input validation. Protect the endpoint before any public exposure.
7. **No deduplication or explicit error route:** The workflow inserts records without a duplicate-ID check or dedicated recovery path. A failed downstream step can prevent the intended webhook success response.
8. **Potential data exposure:** Ticket contents and customer email addresses move across OpenAI, Slack, email, and Sheets. Secure credentials, permissions, logs, and retention.
9. **Potential response-format fragility:** The Respond to Webhook node builds a JSON response string using expressions; test escaping, unexpected values, and HTTP failure behavior rather than assuming a valid success response in every case.

## Suggested production-oriented next steps

Normalize and validate request fields; authenticate and rate-limit the webhook; configure schema-constrained AI output with safe parse/error handling; add deterministic fallback/human review for uncertain classifications; validate unique ticket IDs and implement idempotency; add explicit error responses and retry/alert paths; verify SLA language; and establish privacy, retention, and audit controls.

## Files

- [`workflow.json`](workflow.json) — existing n8n workflow definition (**not modified** by this documentation update).
- [`screenshots/workflow-diagram.png`](screenshots/workflow-diagram.png) — existing workflow illustration.

---

**Documentation boundary:** This README describes what the exported JSON configures, points out assumptions and risks, and provides reproducible *manual* checks. It does not assert that the workflow was deployed, executed, or accepted in production.
