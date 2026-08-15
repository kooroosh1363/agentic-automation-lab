# Exercise 10: Data Analytics Dashboard with AI Insights

![Level](https://img.shields.io/badge/Level-Foundation-6C757D)


## Description

An advanced business intelligence system that collects data from multiple sources (Sales, Marketing, External APIs), calculates KPIs automatically, uses OpenAI to analyze trends and detect anomalies, and distributes reports through multiple channels.


## Nodes Used

- Schedule Trigger (Weekly)

- Google Sheets (Fetch Sales & Marketing Data)

- HTTP Request (External Metrics API)

- Code (KPI Calculation & Data Processing)

- OpenAI (AI Data Analysis)

- IF (Risk Level Check)

- Telegram (High Risk Alert)

- Slack (Weekly Report)

- Send Email (Management Report)

- Google Sheets (Save to Dashboard)


## Workflow Diagram


![Workflow Diagram](screenshots/workflow-diagram.png)


## How It Works

1. Schedule Trigger runs the workflow every Monday at 8 AM

2. Three parallel nodes fetch data from:

   - Sales Data (Google Sheets)

   - Marketing Data (Google Sheets)

   - External Metrics (API)

3. Code node calculates KPIs:

   - Total Revenue, Total Orders, Avg Order Value

   - Conversion Rate, CAC, ROI

4. OpenAI analyzes the data and returns:

   - Trends, Anomalies, Insights, Recommendations

   - Next week forecast and risk level

5. Based on risk level:

   - High Risk: Send urgent Telegram alert to management

   - Normal: Send weekly report to Slack channel

6. Detailed email report is sent to management team

7. All metrics and AI insights are saved to Analytics Dashboard (Google Sheets)


## How to Use

1. Import `workflow.json` file in n8n

2. Configure OpenAI, Telegram, Slack, Email, and Google Sheets credentials

3. Create Google Sheets named "SalesData", "MarketingData", and "AnalyticsDashboard"

4. Update the external API URL with your actual analytics endpoint

5. Activate the workflow


## Credentials Required

- OpenAI API

- Telegram Bot API

- Slack API

- SMTP (for sending emails)

- Google Sheets API

- External Analytics API (optional)
