# Exercise 3: AI Support System - Smart Ticket Routing

![Level](https://img.shields.io/badge/Level-Foundation-6C757D)


## Description

An intelligent support system that uses OpenAI GPT-4 to automatically analyze customer tickets, categorize them, determine priority, and route them through different channels.


## Nodes Used

- Webhook (Trigger)

- OpenAI (GPT-4 for AI analysis)

- IF (Priority check)

- Slack (Urgent alerts)

- Send Email (Customer confirmation)

- Google Sheets (Database)

- Respond to Webhook


## Workflow Diagram


![Workflow Diagram](screenshots/workflow-diagram.png)


## How It Works

1. Webhook receives customer ticket

2. OpenAI analyzes the ticket (category + priority)

3. IF node checks priority level

4. Urgent tickets: Send Slack alert to support team

5. Normal tickets: Send email confirmation to customer

6. Save ticket to Google Sheets database

7. Respond to webhook with ticket details


## How to Use

1. Import `workflow.json` file in n8n

2. Configure OpenAI, Slack, Email, and Google Sheets credentials

3. Create a Google Sheet named "Tickets" with required columns

4. Activate the workflow

5. Test with POST request to the Webhook URL


## Credentials Required

- OpenAI API

- Slack API

- SMTP (for sending emails)

- Google Sheets API
