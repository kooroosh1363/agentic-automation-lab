# Exercise 8: AI Lead Scoring & Qualification System

![Level](https://img.shields.io/badge/Level-Foundation-6C757D)


## Description

An advanced B2B lead qualification system that enriches lead data using external APIs, uses OpenAI to score leads based on fit, intent, and engagement, and routes them through different sales and marketing workflows based on their score.


## Nodes Used

- Webhook (Lead Trigger)

- HTTP Request (Lead Enrichment via Clearbit)

- OpenAI (AI Lead Scoring)

- IF (Check Hot Lead)

- IF (Check Warm Lead)

- Slack (Hot Lead Alert)

- Send Email (Personal/Nurture/Generic)

- Google Sheets (CRM Database)

- Respond to Webhook


## Workflow Diagram


![Workflow Diagram](screenshots/workflow-diagram.png)


## How It Works

1. Webhook receives a new lead from the website

2. HTTP Request enriches the lead data using Clearbit API (company size, industry, etc.)

3. OpenAI analyzes the lead and returns:

   - Fit score, Intent score, Engagement score

   - Overall score (0-100) and Lead grade (A/B/C/D)

   - Recommended action

4. Based on overall score:

   - Hot Lead (≥80): Slack alert to sales team + Personal email

   - Warm Lead (50-79): Nurture email sequence

   - Cold Lead (<50): Generic email

5. All lead data and scores are saved to Google Sheets (CRM)

6. Respond to Webhook with the scoring results


## How to Use

1. Import `workflow.json` file in n8n

2. Configure OpenAI, Slack, Email, Clearbit API, and Google Sheets credentials

3. Create a Google Sheet named "Leads" with required columns

4. Activate the workflow

5. Test with POST request to the Webhook URL


## Credentials Required

- OpenAI API

- Clearbit API (for lead enrichment)

- Slack API

- SMTP (for sending emails)

- Google Sheets API
