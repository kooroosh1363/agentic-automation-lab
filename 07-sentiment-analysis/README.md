# Exercise 7: Customer Sentiment Analysis with Multi-Source AI

![Level](https://img.shields.io/badge/Level-Foundation-6C757D)


## Description

An intelligent customer feedback system that collects opinions from multiple sources (Web Form, Email, Social Media), uses OpenAI to analyze sentiment, emotion, and urgency, and routes them based on the analysis results.


## Nodes Used

- Webhook (Web Form Feedback)

- Email Trigger (IMAP)

- Schedule Trigger (Social Media Polling)

- HTTP Request (Fetch Social Comments)

- OpenAI (Sentiment Analysis)

- IF (Check Negative Sentiment)

- IF (Check Positive Sentiment)

- Telegram (Manager Alert)

- Send Email (Thank You)

- Google Sheets (Dashboard)


## Workflow Diagram


![Workflow Diagram](screenshots/workflow-diagram.png)


## How It Works

1. Feedback is collected from three sources:

   - Web Form via Webhook

   - Incoming Emails via IMAP

   - Social Media comments (polled every 6 hours)

2. OpenAI analyzes each feedback and returns:

   - Sentiment score (0-100)

   - Emotion (happy, angry, disappointed, etc.)

   - Topic (product, support, pricing, etc.)

   - Urgency level

3. Based on the sentiment score:

   - Score < 30 (Negative): Alert manager via Telegram immediately

   - Score > 70 (Positive): Send thank you email to customer

   - Score 30-70 (Neutral): Just log to dashboard

4. All feedback and analysis are saved to Google Sheets dashboard


## How to Use

1. Import `workflow.json` file in n8n

2. Configure OpenAI, Telegram, Email, and Google Sheets credentials

3. Create a Google Sheet named "SentimentDashboard" with required columns

4. Activate the workflow

5. Test by sending feedback to the Webhook URL


## Credentials Required

- OpenAI API

- Telegram Bot API

- SMTP (for sending emails)

- IMAP (for reading emails)

- Twitter/Social Media API

- Google Sheets API
