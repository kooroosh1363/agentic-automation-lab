# 28 - BI ETL Pipeline & Automated KPI Dashboard Reporting

![Level](https://img.shields.io/badge/Level-Advanced-6F42C1)


## Description

This is an enterprise-oriented, multi-step n8n workflow designed to automate the entire Business Intelligence (BI) reporting lifecycle. It implements an Incremental ETL (Extract, Transform, Load) pattern using Watermarking to efficiently fetch only new or updated data from multiple sources (PostgreSQL and Stripe API). The workflow then performs advanced KPI calculations (MRR, CAC, LTV, Churn Rate), detects anomalies, generates a dynamic, beautifully formatted HTML report, and distributes it across multiple channels (Email for detailed HTML, Slack for executive summaries). Finally, it updates the sync watermark to ensure idempotency and efficiency in subsequent runs.


## Nodes Used

- **Schedule**: Triggers the workflow weekly (e.g., Monday at 8:00 AM) to generate the latest reports.

- **PostgreSQL: Get Watermark**: Retrieves the timestamp of the last successful sync to enable incremental data extraction.

- **PostgreSQL: Incremental Extract**: Fetches only the new user transactions and revenue data created since the last watermark.

- **HTTP Request: Stripe**: Pulls recent successful payment events from the Stripe API to complement internal database revenue.

- **Code: KPI Calculation**: Aggregates data from both sources and calculates complex business metrics (MRR, CAC, LTV, Churn Rate) while performing basic anomaly detection.

- **PostgreSQL: Load to BI**: Upserts the calculated KPIs into a dedicated `bi_kpi_summary` table for historical tracking and dashboarding.

- **Code: HTML Report Gen**: Dynamically generates a professional, responsive HTML email report, highlighting any KPI anomalies (e.g., high churn rate).

- **Gmail: Send Report**: Emails the full HTML report to the executive team.

- **Slack: Executive Summary**: Sends a concise, formatted summary with key metrics and a link to the live dashboard to the management channel.

- **PostgreSQL: Update Watermark**: Updates the `bi_sync_status` table with the current timestamp, completing the incremental cycle.


## Workflow Diagram

![Workflow Diagram](./screenshots/workflow-diagram.png)


## How It Works

1. **Trigger & Watermark Retrieval**: The Schedule node triggers the workflow. The system first queries the `bi_sync_status` table to get the `last_sync` timestamp (the watermark).

2. **Incremental Extraction**:

   - PostgreSQL fetches only the transactions created after the watermark.

   - Simultaneously, an HTTP Request fetches recent successful payment events from Stripe.

3. **Transformation & KPI Calculation**: The Code node merges these data streams, calculates total revenue, derives MRR, CAC, LTV, and Churn Rate, and flags any anomalies (e.g., churn > 5%).

4. **Loading (Load)**: The aggregated KPIs are upserted into the `bi_kpi_summary` table in PostgreSQL, creating a reliable source of truth for BI tools.

5. **Report Generation**: A second Code node dynamically builds a responsive HTML document, injecting the calculated KPIs and applying conditional styling (e.g., red text for high churn).

6. **Multi-Channel Distribution**:

   - The Gmail node sends the rich HTML report to the executive email list.

   - The Slack node posts a quick, readable summary with a link to the live dashboard.

7. **Watermark Update**: Upon successful distribution, the `bi_sync_status` table is updated with the current timestamp, preparing the system for the next incremental run.


## How to Use

1. Import the `workflow.json` file into your n8n instance.

2. Set up the PostgreSQL database with the required BI tables (`bi_kpi_summary` and `bi_sync_status`).

3. Configure all required credentials (PostgreSQL, Stripe, Gmail, Slack).

4. Test the workflow manually using "Execute Workflow" to verify data extraction, KPI calculation, and report generation.

5. Check the generated HTML and Slack messages to ensure formatting is correct.

6. Activate the workflow to run on the defined weekly schedule.


## Prerequisites

- A running instance of n8n (Cloud or Self-hosted).

- A PostgreSQL database for both source data and BI storage.

- A Stripe account with API access (for revenue data).

- A Gmail account with SMTP/OAuth2 access for sending reports.

- A Slack workspace with a dedicated executive reporting channel.


## Setup Steps

1. **PostgreSQL Setup**: Create the required BI tables:

   ```sql

   -- Table to store the sync watermark

   CREATE TABLE bi_sync_status (

       source VARCHAR(50) PRIMARY KEY,

       last_sync TIMESTAMP DEFAULT NOW()

   );

   INSERT INTO bi_sync_status (source, last_sync) VALUES ('main_db', '2020-01-01 00:00:00');


   -- Table to store historical KPI summaries

   CREATE TABLE bi_kpi_summary (

       report_date DATE PRIMARY KEY,

       new_users INT,

       total_revenue DECIMAL(12,2),

       mrr DECIMAL(12,2),

       cac DECIMAL(12,2),

       ltv DECIMAL(12,2),

       churn_rate DECIMAL(5,2)

   );


   -- Example source table (if not already existing)

   CREATE TABLE user_transactions (

       id SERIAL PRIMARY KEY,

       user_id INT,

       revenue DECIMAL(10,2),

       created_at TIMESTAMP DEFAULT NOW()

   );

   ```

2. **Credentials**: Add your PostgreSQL, Stripe (HTTP Header Auth), Gmail (OAuth2), and Slack credentials in n8n.

3. **Node Configuration**:

   - Update the `HTTP Request: Stripe` node with your actual Stripe API endpoint and authentication.

   - Update the `Gmail: Send Report` node with the actual executive email addresses.

   - Update the `Slack: Executive Summary` node with your actual channel ID and dashboard URL.

   - Adjust the KPI calculation logic in the `Code: KPI Calculation` node to match your exact business formulas.

4. **Activation**: Save and activate the workflow.


## Credentials Required

- **PostgreSQL API**: Host, Database, User, Password.

- **HTTP Header Auth**: For Stripe API Key (e.g., `Authorization: Bearer sk_test_...`).

- **Gmail OAuth2**: For sending automated HTML reports.

- **Slack API**: Bot User OAuth Token with `chat:write` permissions.


## Use Cases

- **SaaS Companies**: Automating weekly MRR, Churn, and CAC reporting for founders and investors.

- **E-commerce Businesses**: Aggregating sales data from multiple platforms (Shopify, Stripe, internal DB) into a single executive summary.

- **Marketing Agencies**: Calculating and reporting on client acquisition costs and lifetime value automatically.

- **Data Teams**: Providing a reliable, automated ETL pipeline that feeds both human-readable reports and downstream BI dashboards (e.g., Metabase, Tableau).


## Customization Ideas

- **Add More Data Sources**: Integrate Google Analytics API for traffic/conversion data or HubSpot/Salesforce for CRM metrics.

- **PDF Generation**: Use an HTML-to-PDF service (like PDFShift or Gotenberg) to attach a printable PDF version of the report to the email.

- **Advanced Anomaly Detection**: Replace the simple threshold check with a statistical model (e.g., Z-score) in the Code node to detect significant deviations from historical averages.

- **Dynamic Recipients**: Fetch the list of report recipients from a PostgreSQL table, allowing non-technical users to manage who receives the report.

- **Error Handling Branch**: Add an Error Trigger or Try/Catch logic to notify the data engineering team via Slack if the Stripe API or PostgreSQL connection fails.


## Notes

- **Incremental Efficiency**: The watermark pattern ensures that as your database grows, the workflow remains fast and cost-effective by only querying new data.

- **Idempotency**: The `ON CONFLICT ... DO UPDATE` (Upsert) in the `Load to BI` step ensures that re-running the workflow for the same date does not create duplicate records.

- **HTML Safety**: The dynamically generated HTML is self-contained with inline CSS, ensuring it renders correctly across all major email clients (Gmail, Outlook, Apple Mail).

- **Timezones**: Ensure that the `created_at` timestamps in your database and the n8n server are aligned to the same timezone to prevent data gaps or overlaps in the incremental extract.


## Troubleshooting

- **Watermark Not Updating**: If the workflow fails at the Gmail or Slack step, the final "Update Watermark" step won't execute. This is intentional, ensuring the next run will retry the failed data. Check n8n execution logs for the specific error.

- **Stripe API 401 Unauthorized**: Verify that your Stripe API key is correct, has the right permissions, and is properly formatted in the HTTP Header Auth credential (e.g., `Bearer YOUR_KEY`).

- **HTML Email Looks Broken**: Some email clients strip `<style>` tags. The provided HTML uses inline styles (`style="..."`) specifically to maximize compatibility, but always test with a real email client before deploying.

- **KPI Calculations Return NaN**: Ensure that the incoming data from PostgreSQL and Stripe contains valid numbers. Use `parseFloat()` or `parseInt()` with fallbacks (e.g., `|| 0`) as demonstrated in the Code node.

- **PostgreSQL Upsert Fails**: Verify that the `report_date` column in `bi_kpi_summary` is set as the PRIMARY KEY or has a UNIQUE constraint.


## License

This project is licensed under the MIT License
