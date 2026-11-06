# Exercise 4: Price Monitoring — Competitor Tracking with AI

![Level](https://img.shields.io/badge/Level-Foundation-6C757D)
![Platform](https://img.shields.io/badge/Platform-n8n-orange)
![Status](https://img.shields.io/badge/Status-Configuration%20Required-yellow)

An **n8n learning workflow** illustrating scheduled competitor-price collection, historical storage in Google Sheets, AI-assisted analysis, and notification through Telegram and email.

> **Important:** This is a configurable example, **not a production-ready or verified price scraper**. The exported workflow contains a placeholder competitor URL, credentials/IDs and expressions that require validation against a real site's response and your installed n8n node versions. Do not activate unattended until you have completed the checks below.

## Workflow at a glance

![Workflow Diagram](screenshots/workflow-diagram.png)

The included [workflow.json](workflow.json) defines these nodes:

| Stage | n8n node | Purpose |
| --- | --- | --- |
| 1 | Daily Schedule | Runs on a `0 9 * * *` cron schedule |
| 2 | Scrape Competitor Prices | HTTP request to the configured product URL |
| 3 | Get Price History | Reads rows from a Google Sheets tab |
| 4 | AI Price Analysis | Sends current/previous price context to OpenAI |
| 5 | Check Significant Changes | Routes potential alerts |
| 6 | Telegram Alert / Email Alert | Sends notifications |
| 7 | Save to History | Appends the price and analysis output |

**Scheduling:** `0 9 * * *` means 09:00 in the workflow's effective timezone, not necessarily your local timezone. Confirm the n8n instance/workflow timezone before enabling the schedule.

## Prerequisites

- A working n8n installation with compatible HTTP Request, Google Sheets, OpenAI, Telegram and Send Email nodes.
- Access to a permitted, stable competitor price source (ideally an official API or structured feed).
- Google Sheets access to a spreadsheet you own or are authorized to edit.
- Credentials for your chosen OpenAI model, Telegram bot and SMTP provider.
- An explicit understanding of rate limits, allowed scraping behavior and any data-protection requirements.

Keep all access tokens, passwords and API keys in **n8n credentials** or a secure secrets store. Never commit live credentials or customer information to this repository.

## Setup

1. **Import:** In n8n, import [workflow.json](workflow.json) and inspect any node migration warnings. Keep the workflow inactive during setup.
2. **Price source:** Replace `https://example-competitor.com/products` in **Scrape Competitor Prices** with a source you have permission to access. Check the actual response format in the node's test output.
3. **Normalize data:** Add or configure a parsing/normalization step *before* price comparison. The exported JSON does **not** contain a dedicated parser that converts arbitrary HTML into per-product prices. Aim for a predictable list of items with stable `product_id`, `currency`, `price` and `observed_at` fields.
4. **History sheet:** Create a Google spreadsheet with a tab called `PriceHistory` and these columns, matching the current append node:

   | date | prices | analysis |
   | --- | --- | --- |
   | ISO timestamp | JSON string of the captured price data | AI output or error/status notes |

   Replace `YOUR_GOOGLE_SHEET_ID` in **both** Google Sheets nodes with the real spreadsheet ID; authorize the appropriate Google credential.
5. **Historical comparison:** The existing **Get Price History** node fetches sheet rows, but the exported workflow does **not** explicitly join those rows to the latest scraped product identifiers or construct the `current_prices` and `previous_prices` fields referenced by the AI prompt. Add that matching/aggregation logic and test it before interpreting any change percentage.
6. **AI analysis:** Select an available model and bind the OpenAI credential. Require a predictable structured response, validate it before parsing, and handle missing, malformed or non-JSON responses.
7. **Alert channels:** Replace `YOUR_TELEGRAM_CHAT_ID`, `alerts@yourcompany.com` and `manager@yourcompany.com`; configure Telegram and SMTP credentials. Send test messages to your own destination first.
8. **Condition check:** Verify that **Check Significant Changes** actually evaluates a numeric count `> 0`. The exported IF node uses a string `isNotEmpty` condition on a length expression; this should not be relied upon as a correct numeric threshold without testing or correction.
9. **Activate only after testing:** Use manual executions with known sample prices, inspect each node output, then enable the schedule.

## Suggested comparison contract

Before asking an AI model for a narrative explanation, calculate price changes deterministically with validated numbers:

```json
{
  "product_id": "SKU-123",
  "currency": "USD",
  "previous_price": 100,
  "current_price": 88,
  "change_percent": -12,
  "is_significant": true
}
```

For nonzero previous prices:

```text
change_percent = ((current_price - previous_price) / previous_price) * 100
is_significant = abs(change_percent) > 10
```

A **12% decrease** is `-12`%; an increase is positive. The example's prose describes changes above 10%, but the implementation should decide explicitly whether alerts are for **drops only** or for **both increases and decreases**. Ignore or flag zero, missing, nonnumeric and mismatched-currency values instead of dividing or silently comparing incomparable prices.

Use AI for **interpretation and recommendations**, not as the sole source of numeric prices or arithmetic decisions. Keep the original observed values for auditing.

## Before production use: important limitations

The current exported workflow is a teaching artifact and has several known integration gaps:

- **HTTP response is not a price parser.** An HTTP response (especially an HTML page) does not automatically produce normalized `current_prices`.
- **The latest and previous prices are not explicitly paired.** The prompt refers to `current_prices` and `previous_prices`, but the exported nodes do not prepare those fields.
- **AI output shape is assumed.** Downstream expressions call `JSON.parse(...message.content)`; the actual output shape may differ by model/node version or contain invalid JSON.
- **The significance condition needs correction/testing.** The exported IF condition is not a clearly defined numeric comparison.
- **History writes may duplicate.** Both alert branches feed **Save to History**, while the false branch also feeds it; depending on execution semantics, multiple rows can be written for one run. Consolidate branches or implement an idempotent write strategy.
- **No comprehensive failure handling.** Timeouts, API rate limits, parsing errors, empty sheets, partial alert failures and retries need explicit handling.
- **No live execution guarantee.** This documentation review does not establish that imports, external integrations or alerts succeed in a real n8n instance.

For a production adaptation, add validated source parsing, deterministic matching/calculation, a single history-writing path, explicit error/retry handling, deduplication by product and observation time, and monitoring for failed runs.

## Verification checklist

- [ ] The source URL is authorized and returns usable data.
- [ ] Product IDs, currency and numeric price fields are normalized.
- [ ] Initial run with no history succeeds without a false alert.
- [ ] Unchanged price results in no alert.
- [ ] A change of exactly 10% follows the intended boundary rule.
- [ ] A decrease greater than 10% triggers the intended alert.
- [ ] A price increase is handled according to the documented policy.
- [ ] Zero/missing prices and currency mismatches are safely handled.
- [ ] Malformed AI responses do not crash notification expressions.
- [ ] Telegram and email tests reach only approved recipients.
- [ ] One scheduled observation creates at most one intended history entry.
- [ ] Retry behavior does not generate duplicate alerts.
- [ ] Workflow timezone and schedule are verified.

## Troubleshooting

| Symptom | What to check |
| --- | --- |
| HTTP node fails | URL validity, permission, authentication, rate limits and network access |
| No usable prices | Page format changed; add a parser or use a structured data feed |
| Empty/incorrect history | Spreadsheet ID, tab name, permissions, column mapping and product matching |
| AI parsing error | Node output shape, model selection, JSON validation and missing fields |
| False or missing alerts | Numeric IF condition, change-sign policy and threshold boundary |
| Duplicate sheet rows | Multiple incoming branches, retries and missing idempotency keys |
| No scheduled run | Workflow active state, timezone and n8n scheduler health |

## Files

- [workflow.json](workflow.json) — n8n export (requires configuration and validation).
- [screenshots/workflow-diagram.png](screenshots/workflow-diagram.png) — existing workflow illustration.

## Responsible use

Respect website terms, robots/access policies, rate limits and applicable law. Prefer authorized APIs or feeds; do not bypass access controls. Store only the minimum necessary data and avoid inserting secrets or personal information into AI prompts or notification logs.

---

**Documentation scope:** This README describes the workflow as found in the repository and distinguishes intended behavior from functionality that still requires implementation or testing. It does not modify the exported workflow.
