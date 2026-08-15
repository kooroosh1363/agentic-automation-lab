# Exercise 6: E-commerce Order Processing with AI Fraud Detection

![Level](https://img.shields.io/badge/Level-Foundation-6C757D)


## Description

An advanced e-commerce automation system that receives orders via Webhook, validates them, checks inventory, uses OpenAI to detect potential fraud, processes payments, and handles multi-channel notifications based on the AI's risk assessment.


## Nodes Used

- Webhook (Order Trigger)

- IF (Order Validation)

- Google Sheets (Check & Update Inventory)

- OpenAI (AI Fraud Detection)

- IF (AI Result Check)

- HTTP Request (Payment Gateway)

- Send Email (Customer Confirmation)

- Telegram (Security Alert)

- Google Sheets (Save to Database)

- Respond to Webhook


## Workflow Diagram


![Workflow Diagram](screenshots/workflow-diagram.png)


## How It Works

1. Webhook receives a new order from the store

2. IF node validates order data (email, amount > 0)

3. Google Sheets checks product inventory

4. OpenAI analyzes the order for fraud (returns score and risk level)

5. IF node checks AI recommendation:

   - If Approved: Process payment, update inventory, send confirmation email

   - If Suspicious: Alert security team via Telegram for manual review

6. Order details and AI analysis are saved to the database (Google Sheets)

7. Respond to Webhook with the final status


## How to Use

1. Import `workflow.json` file in n8n

2. Configure OpenAI, Telegram, Email, Payment Gateway, and Google Sheets credentials

3. Create Google Sheets named "Inventory" and "Orders" with required columns

4. Activate the workflow

5. Test with POST request to the Webhook URL


## Credentials Required

- OpenAI API

- Telegram Bot API

- SMTP (for sending emails)

- Payment Gateway API

- Google Sheets API
