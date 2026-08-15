# Smart Customer Success & Churn Prevention

![Level](https://img.shields.io/badge/Level-Intermediate-0D6EFD)


## 📋 Description


An advanced, AI-driven Customer Success automation system designed for SaaS and subscription-based businesses. It proactively monitors customer health by analyzing usage data, support tickets, and NPS scores. Using AI, it calculates a dynamic Health Score, generates personalized retention offers, and triggers targeted interventions (from urgent Slack alerts to upsell emails) to prevent churn and maximize Customer Lifetime Value (LTV).


## 🔧 Nodes Used


- **Schedule Trigger** - Weekly health checks and monthly executive reporting

- **Google Sheets** - Acts as the CRM database for customer profiles and health score logs

- **OpenAI GPT-4** - Calculates AI Health Scores, analyzes churn probability, and generates monthly strategic reports

- **Code Node** - Generates unique, personalized retention discount codes

- **Switch Node** - Dynamically routes customers based on their Health Score (High Risk, Medium Risk, Healthy)

- **Slack** - Sends urgent internal alerts to the Customer Success team for high-risk accounts

- **Email Send** - Delivers personalized retention, check-in, and upsell emails to customers


## 🔄 Workflow Diagram


![Workflow Diagram](screenshots/workflow-diagram.png)


## ⚙️ How It Works


### Phase 1: Weekly Data Collection & AI Health Scoring

1. **Scheduled Trigger**: Runs every Monday morning to fetch active customer data from the "Customers" Google Sheet.

2. **AI Analysis**: GPT-4 evaluates multiple data points (monthly usage, login frequency, support tickets, NPS, payment history) to calculate a 0-100 Health Score, churn probability, and identifies top risk factors.


### Phase 2: Retention Code Generation

1. **Code Node**: Generates a unique, trackable discount code (e.g., `SAVE-ENT-4829`) and determines the discount percentage based on the customer's plan and risk level.


### Phase 3: Dynamic Routing & Intervention

1. **Switch Node**: Routes the customer into one of three buckets based on their Health Score:

   - **High Risk (< 40)**: Triggers an urgent Slack alert to the internal team AND sends a highly personalized "Retention Offer" email with the generated discount code.

   - **Medium Risk (40 - 70)**: Sends a friendly "Check-in" email with educational resources and an invitation to book a success call.

   - **Healthy (> 70)**: Sends a "Thank You" email, requests a testimonial, and presents an exclusive Upsell opportunity.


### Phase 4: CRM Logging

1. **Database Update**: All actions, scores, and generated codes are logged in the "HealthScoreLog" sheet for historical tracking and audit.


### Phase 5: Monthly Executive Reporting

1. **Monthly Trigger**: Runs on the 1st of every month to fetch the "HealthScoreLog".

2. **AI Report Generation**: GPT-4 analyzes the month's data to calculate predicted churn rates, estimated revenue saved by retention campaigns, and generates strategic recommendations for leadership.

3. **Email Delivery**: A comprehensive executive summary is emailed to the leadership team.


## 🚀 How to Use


### Prerequisites


- n8n instance (self-hosted or cloud)

- OpenAI API key

- Google Sheets account

- Email account (SMTP)

- Slack workspace


### Setup Steps


1. **Import Workflow**

   - Open n8n and import `workflow.json`.


2. **Configure Google Sheets**

   - Connect your Google Sheets OAuth2 account.

   - Update `YOUR_GOOGLE_SHEET_ID` in all Google Sheets nodes.

   - Create two sheets with the following columns:

     - **"Customers"**: customer_name, email, plan, monthly_usage_hours, login_frequency, support_tickets, nps_score, account_age_months, payment_history.

     - **"HealthScoreLog"**: customer_name, email, plan, health_score, risk_level, churn_probability, action_taken, retention_code, analyzed_at.


3. **Configure OpenAI**

   - Connect your OpenAI API credentials to both AI nodes ("AI Health Score Analysis" and "AI Monthly Report Generation").


4. **Configure Slack & Email**

   - Connect your Slack API and update the channel name (default: `#customer-success-alerts`).

   - Update `success@yourcompany.com` (sender) and `leadership@yourcompany.com` (monthly reports) with your actual email addresses.


5. **Activate Workflow**

   - Toggle the workflow to "Active".


## 🔐 Credentials Required


- **OpenAI API**: OpenAI API key

- **Google Sheets OAuth2**: Google Sheets API access

- **SMTP Email**: Email sending credentials

- **Slack API**: Slack Bot Token


## 💡 Use Cases


- **SaaS Companies**: Proactively identify and save at-risk subscriptions before they cancel.

- **B2B Service Providers**: Monitor client engagement and ensure high-touch clients receive timely attention.

- **Membership Platforms**: Reduce member churn by offering targeted incentives and resources.

- **Subscription Boxes**: Analyze customer feedback and usage to prevent subscription fatigue.


## 🔧 Customization Ideas


- **CRM Integration**: Replace Google Sheets with HTTP Request nodes to sync data directly with Salesforce, HubSpot, or Pipedrive.

- **Automated Calls**: Integrate Twilio to automatically schedule a phone call from a Customer Success Manager for "High Risk" accounts.

- **Product Telemetry**: Connect directly to analytics tools like Mixpanel or Amplitude via API to get real-time usage data instead of relying on static spreadsheet columns.

- **A/B Testing**: Create different email templates for the retention campaigns and use a randomizer in the Code Node to test which messaging works best.


## 📝 Notes


- **AI Prompt Tuning**: The AI Health Score prompt is highly sensitive to the data provided. Ensure your "Customers" sheet has clean, numeric data for usage and tickets to get accurate scoring.

- **Code Expiration**: The Code Node sets a 14-day validity for high-risk codes. Ensure your billing system (e.g., Stripe) is configured to accept and validate these codes.


## 🐛 Troubleshooting


**Issue**: AI Health Score returning errors

- **Solution**: Check the "Customers" sheet. Ensure `monthly_usage_hours`, `login_frequency`, and `nps_score` are formatted as numbers, not text.


**Issue**: Switch node routing everyone to "Healthy"

- **Solution**: Verify the expression in the Switch node. It parses the JSON string from the AI node. Ensure the AI node is successfully outputting the `health_score` key.


**Issue**: Slack alert not sending

- **Solution**: Verify the Slack Bot has been invited to the `#customer-success-alerts` channel and has the correct posting permissions.


## 📄 License


This workflow is provided as-is for educational and commercial use.


##  Contributing


Feel free to fork, modify, and improve this workflow to fit your specific Customer Success operations.


\---


**Created for**: agentic-automation-lab

**Exercise**: 20 - Smart Customer Success & Churn Prevention (Milestone)

**Author**: Koroosh

**Date**: 2026
