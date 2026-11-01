# Exercise 2: Email Automation — Daily Order Processing

![Level](https://img.shields.io/badge/Level-Foundation-6C757D)
![Platform](https://img.shields.io/badge/Platform-n8n-FF6D5A)

> **Project status:** Educational reference workflow. The imported workflow needs credentials, configuration, and end-to-end validation before use with real customers. It is **not** a verified production-ready order processor.

## Overview

This [n8n workflow](workflow.json) checks an `Orders` Google Sheet every **24 hours**, selects rows whose `status` equals `Pending`, sends an order-confirmation email, attempts to set the order status to `Sent`, and passes the result to a Telegram notification node.

**Important distinction:** The current JSON connects Telegram directly after each processed item. It does **not** implement a single, aggregated daily report. The Telegram message uses `$json.length`, which is not a reliable count of processed orders at that stage. See [Current limitations](#current-limitations).

## Workflow at a glance

```text
Schedule Trigger (every 24 hours)
          |
          v
Get Orders from Sheets (Orders tab)
          |
          v
Filter Pending Orders (status = "Pending")
          |
          v
Send Confirmation Email
          |
          v
Update Order Status (match by order_id; set status = "Sent")
          |
          v
Send Report to Telegram (executed downstream per item)
```

![Workflow diagram](screenshots/workflow-diagram.png)

### What each node does

| Node | Configured behavior |
| --- | --- |
| `Schedule Trigger` | Uses a 24-hour interval, not an explicit fixed local time. |
| `Get Orders from Sheets` | Reads rows from the `Orders` tab of the configured spreadsheet. |
| `Filter Pending Orders` | Keeps rows where `status` matches `Pending`. |
| `Send Confirmation Email` | Sends a plain-text message to `customer_email` using the row's order details. |
| `Update Order Status` | Configured to match on `order_id` and update `status` to `Sent`. Verify that the match column is actually mapped in your n8n version before activation. |
| `Send Report to Telegram` | Runs after the update for each item reaching the node; its configured count expression is not a true aggregate. |

## Requirements

- An n8n instance with the Google Sheets, Send Email, and Telegram nodes.
- A Google account and a spreadsheet accessible to the configured Google Sheets credentials.
- SMTP credentials for an email account authorized to send order confirmations.
- A Telegram bot token and the intended destination chat ID.
- Test data and a safe/test recipient address for initial validation.

**Do not commit credentials, API tokens, customer contact details, or live spreadsheet IDs to this repository.** Configure secrets in n8n's credential manager and use test records when sharing screenshots or logs.

## Google Sheet schema

Create a tab named exactly `Orders` with these column headers:

| Column | Expected value | Example |
| --- | --- | --- |
| `order_id` | Unique, non-empty order identifier | `DEMO-1001` |
| `customer_name` | Customer display name | `Test Customer` |
| `customer_email` | Recipient email address | `test@example.com` |
| `product` | Product name | `Demo Item` |
| `quantity` | Item count | `2` |
| `total` | Order total; the template email prefixes it with `$` | `49.00` |
| `status` | `Pending` or `Sent` | `Pending` |

For a controlled test, create **one** `Pending` row and **one** `Sent` row using distinct IDs. The filter should allow only the pending row to continue. The workflow does not itself validate addresses, quantities, totals, or duplicate IDs.

## Setup in n8n

1. Open n8n and import [`workflow.json`](workflow.json) into a new workflow.
2. In **Get Orders from Sheets** and **Update Order Status**, replace `YOUR_GOOGLE_SHEET_ID` with the same real spreadsheet ID, select the `Orders` tab, and attach the appropriate Google Sheets credential.
3. In **Send Confirmation Email**, attach an SMTP credential, change the example sender `your-email@gmail.com` to your authorized sender address, and confirm the recipient expression `{{ $json.customer_email }}` points to your sheet column.
4. In **Update Order Status**, inspect the row-matching configuration. The exported JSON declares `matchingColumns: ["order_id"]` but its explicit value mapping contains only `status: "Sent"`. Confirm the node can resolve the incoming `order_id`; if necessary, configure an explicit match-field mapping in the editor **before running with live data**.
5. In **Send Report to Telegram**, attach the Telegram bot credential and replace `YOUR_TELEGRAM_CHAT_ID` with the intended chat ID. Treat its order-count line as a **known limitation** until an aggregation step is implemented.
6. Review workflow timezone and scheduling expectations. The imported trigger specifies a 24-hour interval rather than a specific daily clock time.
7. Save, manually run a controlled test, inspect each node's output, and only then decide whether to activate the schedule.

**Safety:** This sample performs real email sends and spreadsheet writes when connected. Do not run it against a production orders sheet until recipient routing, update matching, and failure behavior have been tested.

## Validation checklist

- [ ] The imported workflow displays all six nodes connected in the sequence shown above.
- [ ] Both Google Sheets nodes use the intended spreadsheet and the exact `Orders` tab.
- [ ] The pending test row passes the filter; the `Sent` test row does not.
- [ ] A confirmation email reaches only the authorized test inbox and contains the expected `order_id`, product, quantity, and total.
- [ ] The status update matches **only** that test `order_id` and sets its status to `Sent`; no unrelated row changes.
- [ ] The Telegram node is observed separately: check actual notification frequency and **do not** interpret `$json.length` as a verified order count.
- [ ] A subsequent test run does not resend the already-`Sent` row after a successful update.
- [ ] Invalid recipient, SMTP failure, and status-update failure scenarios are assessed before enabling unattended execution.

These are **manual acceptance checks**, not claims that automated tests or a live deployment have passed.

## Current limitations

1. **No consolidated daily report.** Telegram is downstream of the row-processing path, so it can run once per successfully processed item. A proper daily summary requires aggregation and a separate reporting path.
2. **Unreliable order count in Telegram.** The expression `$json.length` operates on the current item, not the total number of orders processed in a run.
3. **Potential duplicate confirmations.** The email is sent **before** the row is marked `Sent`. If the sheet update fails after an email succeeds, the row can remain `Pending` and may be emailed again on a later run.
4. **Row-matching configuration needs verification.** The exported update node selects `order_id` as its matching column but does not include that field in its explicit mapped values. Validate the node's actual behavior for your installed n8n version.
5. **No explicit error or retry branches.** The JSON has no dedicated dead-letter path, alert-on-failure workflow, duplicate-ID guard, or confirmed idempotency mechanism.
6. **Schedule is interval-based.** A 24-hour trigger should not be described as a guarantee of execution at a specific local clock time.

## Suggested next improvements

For a production-oriented version, add an explicit `order_id` match configuration, input validation, a send ledger or idempotency key, error/retry handling, and a separate aggregation stage that sends **one** accurately counted report per completed run. Test failure and recovery paths before processing real customer orders.

## Files

- [`workflow.json`](workflow.json) — n8n workflow definition (unchanged by this documentation update).
- [`screenshots/workflow-diagram.png`](screenshots/workflow-diagram.png) — workflow diagram.

---

**Scope of this README:** Documents the current exported workflow, its required setup, and observable limitations. It does not claim that the workflow has been deployed or validated in a live environment.
