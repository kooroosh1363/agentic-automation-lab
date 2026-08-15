# Exercise 4: Price Monitoring - Competitor Tracking with AI

![Level](https://img.shields.io/badge/Level-Foundation-6C757D)


## Description

An automated system that scrapes competitor prices daily, compares them with historical data, uses OpenAI to analyze significant changes, and sends alerts via Telegram and Email if major price drops are detected.


## Nodes Used

- Schedule Trigger (Daily at 9 AM)

- HTTP Request (Web Scraping)

- Google Sheets (Read & Append)

- OpenAI (AI Analysis)

- IF (Check significant changes)

- Telegram (Alerts)

- Send Email (Alerts)


## Workflow Diagram


![Workflow Diagram](screenshots/workflow-diagram.png)


## How It Works

1. Schedule Trigger runs the workflow every day at 9 AM

2. HTTP Request scrapes current prices from the competitor's website

3. Google Sheets node reads the historical price data

4. OpenAI analyzes the differences and identifies significant changes (>10%)

5. IF node checks if there are any significant changes

6. If yes: Sends alerts via Telegram and Email

7. Finally: Saves the new prices and analysis to Google Sheets


## How to Use

1. Import `workflow.json` file in n8n

2. Configure OpenAI, Telegram, Email, and Google Sheets credentials

3. Create a Google Sheet named "PriceHistory" with columns: date, prices, analysis

4. Update the competitor URL in the HTTP Request node

5. Activate the workflow


## Credentials Required

- OpenAI API

- Telegram Bot API

- SMTP (for sending emails)

- Google Sheets API
