# 01 — Lead Capture: Webhook → Google Sheets → Telegram

![Level](https://img.shields.io/badge/Level-Foundation-6C757D)

A **foundation-level n8n example** that receives a lead over HTTP, writes to Google Sheets, sends a Telegram notification, and returns a JSON response. The checked-in workflow is a **reference template**, not a verified production deployment.

![Lead capture workflow diagram](screenshots/workflow-diagram.png)

## Architecture

```text
POST /webhook/lead-capture
       |
       v
Webhook (POST; response handled by last node)
       |
       v
Save to Google Sheets (appendOrUpdate)
       |
       v
Notify Telegram
       |
       v
Respond to Webhook (JSON)
```

The node names and order above match [the exported n8n workflow](workflow.json). The success response is reached only after the preceding nodes complete. There is **no validation, deduplication, authentication, retry policy, or dedicated error branch** in the exported graph.

## Input contract

Send a JSON object with these intended fields:

| Field | Example | Purpose |
| --- | --- | --- |
| `name` | `"Jane Example"` | Lead name |
| `email` | `"jane@example.com"` | Contact email |
| `phone` | `"+15550100100"` | Contact number |
| `message` | `"Please contact me about a quote."` | Inquiry |

The fields above describe the **intended** payload; the current workflow does not enforce presence, format, or length.

## Prerequisites and configuration

1. Set up an n8n instance that you control and import [`workflow.json`](workflow.json).
2. Create a Google Sheet with a tab named `Sheet1` and columns `name`, `email`, `phone`, and `message`. Replace `YOUR_GOOGLE_SHEET_ID` in **Save to Google Sheets**, grant the connected Google account access, and select the appropriate Google Sheets credential.
3. **Review the Sheets operation before enabling the workflow.** The exported node uses `appendOrUpdate` with `autoMapInputData`, but leaves `matchingColumns` empty. Configure an appropriate stable matching column if you need upsert behavior, or deliberately switch to append-only if every submission should create a new row. Confirm how your installed n8n node version maps and returns data.
4. Set up a Telegram bot, add it to the intended destination, configure its credential in **Notify Telegram**, and replace `YOUR_TELEGRAM_CHAT_ID`.
5. **Check the data shape between nodes.** n8n Webhook executions commonly expose submitted JSON under `$json.body`. This export has no normalization node; the Sheets auto-mapping expects compatible input fields, while the Telegram text refers to `$json.name`, `$json.email`, `$json.phone`, and `$json.message`. In the editor, inspect actual execution data and add an **Edit Fields** mapping or adjust the expressions as needed. Also verify which fields the Sheets node passes downstream.
6. Test using n8n's **Listen for test event** feature. Once the flow works end-to-end, activate the workflow and use its production webhook URL.

> **Important:** Steps 3 and 5 may require changes **inside n8n after import**. This README documents the export as it exists; it does not imply that the unmodified JSON is already end-to-end functional.

## Send a test lead

For a listening test webhook, use the test URL shown in n8n (commonly `/webhook-test/lead-capture`). For an **active** workflow, replace the host in this production-style example:

```bash
curl --fail-with-body --request POST \
  'https://your-n8n.example/webhook/lead-capture' \
  --header 'Content-Type: application/json' \
  --data '{
    "name": "Jane Example",
    "email": "jane@example.com",
    "phone": "+15550100100",
    "message": "Please contact me about a quote."
  }'
```

On a successful execution, the configured **Respond to Webhook** node aims to return a JSON body like:

```json
{
  "status": "success",
  "message": "Lead saved successfully",
  "timestamp": "<ISO-8601 timestamp>"
}
```

This is the configured success shape, **not an independently verified live response**. Do not treat it as proof of delivery until the Sheet row and Telegram message are confirmed.

## Verification checklist

- [ ] A valid sample POST reaches **Webhook** and the expected fields are visible at each node.
- [ ] A row is created or updated **as intentionally configured** in `Sheet1`, with correct field values.
- [ ] The correct Telegram chat receives a readable notification.
- [ ] The final HTTP response has the expected JSON fields and timestamp.
- [ ] A repeated request behaves as expected for your append/upsert choice; the export has **no built-in idempotency guarantee**.
- [ ] A deliberate Sheets or Telegram credential failure does **not** silently produce a success response.

## Known limitations and production hardening

| Area | Current export | Before public or production use |
| --- | --- | --- |
| Access | Webhook has no configured authentication | Add appropriate authentication and request-rate controls |
| Validation | No required-field, email, length, or payload-size checks | Validate and normalize inputs before storage/notification |
| Data mapping | No explicit extraction of `body` fields | Test and make mappings explicit across Webhook, Sheets, and Telegram |
| Duplicate leads | `appendOrUpdate` has no selected match columns | Define a unique lead key and intended insert/update behavior |
| Failures | Linear flow, no dedicated failure handling | Add retry strategy, error alerting, and a safe failure response |
| Privacy | Lead contact data goes to Sheets and Telegram | Limit access, define retention, and avoid real personal data in test runs |
| Telegram formatting | Markdown contains unescaped submitted text | Escape/sanitize user-provided text or use an appropriate plain-text format |

**Operational note:** Telegram or Google Sheets errors can prevent the final response from running; the exported workflow does not provide transactional guarantees across the two services. Do not expose the endpoint publicly with real lead data until you have addressed the controls above.

## Files

- [`workflow.json`](workflow.json) — importable n8n workflow definition
- [`screenshots/workflow-diagram.png`](screenshots/workflow-diagram.png) — workflow overview

**Scope:** Documentation improvement only. No workflow nodes, credentials, deployed services, or integrations are changed by this README.
