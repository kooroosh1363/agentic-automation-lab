# 27 - AI Invoice OCR & Anomaly Detection with Financial Audit Logging

![Level](https://img.shields.io/badge/Level-Advanced-6F42C1)


## Description

This enterprise-oriented n8n workflow automates the Accounts Payable (AP) process for B2B service companies. It uses AI Vision/OCR to extract structured data from unstructured invoice documents (PDF/images), performs intelligent anomaly detection (math mismatches, future dates, suspicious vendors), checks for duplicate invoices in PostgreSQL to prevent double payments, and routes approved invoices to the payment system while flagging suspicious ones for manual review. Every decision is logged in an audit table for financial compliance and fraud prevention.


## Nodes Used

- **Webhook**: Receives incoming invoice data (text or file references) from email parsers, WhatsApp integrations, or upload portals.

- **OpenAI: OCR & Anomaly Check**: Uses GPT-4o with vision capabilities to extract invoice fields (vendor, invoice number, PO number, amounts, line items) AND perform anomaly detection (sum verification, date validation, vendor name analysis).

- **PostgreSQL: Check Duplicate**: Queries the `processed_invoices` table to detect if this invoice number has already been registered or paid.

- **Code: Final Validation**: Executes the final decision logic combining AI anomaly results, database duplicate checks, and mathematical validation to determine if the invoice should be approved or flagged.

- **Switch: Routing**: Routes the workflow to either the "Approved" path or the "Flagged for Review" path based on validation results.

- **PostgreSQL: Insert Approved**: Records approved invoices in the `processed_invoices` table for payment processing.

- **Slack: Finance Alert**: Sends an immediate alert to the finance team with detailed reasons when an invoice is flagged for manual review.

- **PostgreSQL: Audit Log**: Logs all flagged invoices and rejection reasons in a dedicated `audit_log` table for compliance and fraud investigation.


## Workflow Diagram

![Workflow Diagram](./screenshots/workflow-diagram.png)


## How It Works

1. **Ingestion**: The workflow receives invoice data via Webhook (from email parsers, file uploaders, or messaging apps).

2. **AI Extraction & Anomaly Detection**: OpenAI processes the invoice text/image and returns structured JSON containing:

   - Extracted fields (vendor_name, invoice_number, po_number, total_amount)

   - Calculated items_sum (sum of all line items)

   - ai_anomaly_detected (boolean flag)

   - anomaly_reason (explanation if any issue found)

3. **Duplicate Prevention**: PostgreSQL checks if this invoice_number already exists in the processed_invoices table.

4. **Multi-Layer Validation**: The Code node applies a decision tree:

   - If duplicate detected → FLAGGED (reason: Duplicate invoice)

   - If AI anomaly detected → FLAGGED (reason: AI anomaly details)

   - If math mismatch (items_sum ≠ total_amount) → FLAGGED (reason: Math mismatch)

   - Otherwise → APPROVED

5. **Intelligent Routing**: The Switch node directs approved invoices to payment processing and flagged invoices to manual review.

6. **Payment Registration**: Approved invoices are inserted into `processed_invoices` with status "APPROVED".

7. **Alert & Audit**: Flagged invoices trigger a Slack alert to the finance team and are logged in the `audit_log` table with full context.

8. **Compliance Trail**: Every decision (approved or flagged) is recorded for financial audits and fraud investigations.


## How to Use

1. Import the `workflow.json` file into your n8n instance.

2. Set up PostgreSQL database with the required tables for invoice processing and audit logging.

3. Configure all credentials (OpenAI, PostgreSQL, Slack).

4. Connect your invoice source (email parser, WhatsApp Business API, or upload portal) to the Webhook.

5. Test with sample invoices (both valid and intentionally flawed) to verify detection logic.

6. Monitor the `audit_log` table to ensure all decisions are being tracked.

7. Activate the workflow for production use.


## Prerequisites

- A running instance of n8n (Cloud or Self-hosted).

- PostgreSQL database for invoice storage and audit logging.

- OpenAI API key (GPT-4o recommended for best OCR and reasoning capabilities).

- Slack workspace with a dedicated finance alerts channel.

- Invoice source integration (email parser, file uploader, or messaging app).


## Setup Steps

1. **PostgreSQL Setup**: Create the required tables:

   ```sql

   CREATE TABLE processed_invoices (

       id SERIAL PRIMARY KEY,

       vendor_name VARCHAR(200),

       invoice_number VARCHAR(100) UNIQUE,

       po_number VARCHAR(100),

       total_amount DECIMAL(12,2),

       status VARCHAR(50),

       processed_at TIMESTAMP DEFAULT NOW()

   );


   CREATE TABLE audit_log (

       id SERIAL PRIMARY KEY,

       invoice_number VARCHAR(100),

       action_taken VARCHAR(50),

       reason TEXT,

       timestamp TIMESTAMP DEFAULT NOW()

   );


   -- Optional: Table for approved vendors

   CREATE TABLE approved_vendors (

       vendor_name VARCHAR(200) PRIMARY KEY,

       is_active BOOLEAN DEFAULT true

   );

   ```

2. **Credentials**: Add your OpenAI, PostgreSQL, and Slack credentials in n8n.

3. **Node Configuration**:

   - Update the OpenAI system prompt if you need to extract additional fields (tax_id, bank_details, etc.).

   - Adjust the Slack channel ID to your finance team's alert channel.

   - Customize the audit_log INSERT query if you want to capture more metadata (e.g., who submitted the invoice).

4. **Webhook Integration**: Connect your invoice source to the Webhook URL. Common integrations:

   - Email parser (e.g., Mailparser, Parseur) forwarding parsed data

   - WhatsApp Business API receiving invoice photos

   - Custom upload portal on your company website

5. **Activation**: Save and activate the workflow.


## Credentials Required

- **OpenAI API**: For OCR extraction and anomaly detection reasoning.

- **PostgreSQL API**: Host, Database, User, Password for invoice storage and audit logging.

- **Slack API**: Bot User OAuth Token with `chat:write` permissions for finance alerts.


## Use Cases

- **B2B Service Companies**: Automating vendor invoice processing to reduce manual data entry and payment errors.

- **Accounting Departments**: Preventing duplicate payments and detecting fraudulent invoices before they're paid.

- **Financial Compliance**: Creating an immutable audit trail for all invoice processing decisions.

- **Small & Medium Enterprises**: Replacing expensive AP automation software with a custom, AI-powered solution.


## Customization Ideas

- **Vendor Validation**: Add a PostgreSQL query to check if the vendor exists in the `approved_vendors` table before processing.

- **PO Matching**: Implement 3-way matching (Invoice vs PO vs Goods Receipt) by adding another database lookup.

- **Multi-Currency Support**: Extend the AI prompt to extract currency codes and implement exchange rate conversion.

- **Approval Workflows**: Add n8n's approval nodes for invoices above a certain threshold (e.g., >$5000 requires manager approval).

- **Email Notifications**: Send confirmation emails to vendors when their invoices are approved and scheduled for payment.

- **Dashboard Integration**: Push approved invoice data to Google Sheets, Airtable, or a BI dashboard for real-time AP tracking.

- **Tax Validation**: Add logic to verify tax calculations (e.g., VAT/GST percentages) and flag discrepancies.


## Notes

- **AI Vision Limitations**: For scanned PDFs with poor quality, OCR accuracy may decrease. Consider preprocessing images (deskewing, noise reduction) before sending to OpenAI.

- **Duplicate Detection**: The current logic checks exact invoice_number matches. For vendors who reuse invoice numbers, consider adding vendor_name to the uniqueness constraint.

- **Cost Management**: Processing hundreds of invoices daily with GPT-4o can be expensive. Consider using GPT-3.5 for initial extraction and GPT-4o only for anomaly detection on flagged items.

- **Audit Compliance**: The `audit_log` table should be treated as immutable. Never UPDATE or DELETE records from this table to maintain a true audit trail.

- **Error Handling**: If OpenAI fails to parse an invoice (e.g., completely unreadable), the workflow should have a fallback path that routes to manual review with an "OCR Failed" reason.


## Troubleshooting

- **OpenAI Returns Non-JSON**: Ensure the system prompt strictly enforces JSON output and set `responseFormat: json_object` in the OpenAI node. Lower the temperature to 0.1 for more consistent results.

- **Duplicate Detection Fails**: Verify that the `invoice_number` column in `processed_invoices` has a UNIQUE constraint. Check for whitespace or case sensitivity issues in invoice numbers.

- **Math Mismatch False Positives**: Some invoices have rounding differences. Adjust the tolerance in the Code node (currently 0.01) if needed.

- **Slack Alerts Not Sending**: Ensure the Slack Bot is invited to the target channel and has the correct permissions. Check that the channel ID is correct (starts with 'C' for public channels).

- **PostgreSQL Insert Fails**: Verify that all column names and data types match your actual schema. Check for NULL values in required fields.

- **AI Anomaly Detection Too Strict**: If legitimate invoices are being flagged, refine the OpenAI system prompt to be more lenient or add a confidence score threshold in the Code node.


## License

This project is licensed under the MIT License
