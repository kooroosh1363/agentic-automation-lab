 📈 032 - Dynamic Pricing Intelligence & AI Strategist

![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![n8n Version](https://img.shields.io/badge/n8n-v1.0+-blue)
![AI Model](https://img.shields.io/badge/AI-GPT--4-orange)

##  Overview
An enterprise-grade automated pricing engine that monitors competitor prices in real-time, analyzes market dynamics, and uses AI (GPT-4) to recommend optimal pricing strategies. This system ensures maximum profitability while maintaining competitive advantage, automatically alerting teams to urgent price adjustments.

##  Key Features
- **Multi-Source Competitor Monitoring:** Fetches pricing data from multiple competitor APIs simultaneously.
- **Advanced Statistical Analysis:** Calculates average, median, min/max prices, and standard deviation to understand market volatility.
- **AI-Powered Strategy:** GPT-4 analyzes market position, stock levels, and target margins to recommend aggressive, conservative, or neutral pricing.
- **Smart Alerting System:** Differentiates between routine updates and high-urgency situations, sending instant Slack/Email alerts when immediate action is required.
- **Comprehensive Logging:** Stores historical pricing decisions in PostgreSQL and maintains an executive dashboard in Google Sheets.

## ️ Workflow Architecture

```text
[Schedule Trigger (Every 6 Hours)]
      │
      ├──> [Fetch Competitor 1 Price (HTTP)]
      ├──> [Fetch Competitor 2 Price (HTTP)]
      └──> [Fetch Competitor 3 Price (HTTP)]
                  │
                  ▼
      [Calculate Price Statistics (Code)] ──> Math & Aggregation
                  │
                  ▼
      [AI Pricing Strategy (OpenAI/GPT-4)] ──> JSON Strategy Output
                  │
                  ▼
      [Process AI Recommendation (Code)] ─> Calculate % Change & Urgency
                  │
                  ▼
      [Check If Action Needed (IF Node)]
      ├── (True) ──> [Save to Database (PostgreSQL)]
      │                    │
      │                    ▼
      │              [Notify Team via Slack]
      │                    │
      │                    ▼
      │              [Check High Urgency (IF)]
      │              ├── (High) ──> [Send Urgent Email Alert]
      │              └── (Normal) ──> [Log to Google Sheets]
      └── (False) ─> [Log to Google Sheets]
```

## 📦 Nodes Used
1. `Schedule Trigger`
2. `HTTP Request` (x3)
3. `Code` (JavaScript) (x2)
4. `OpenAI` (LangChain)
5. `IF` (Conditional Logic) (x2)
6. `Postgres` (Database)
7. `Slack` (Notification)
8. `Email Send` (SMTP)
9. `Google Sheets` (Logging)

## ⚙️ Prerequisites & Setup

### 1. Environment Variables
Add these to your `.env` file or n8n environment settings:
```env
COMPETITOR1_API_KEY=your_api_key_1
COMPETITOR2_API_TOKEN=your_bearer_token_2
COMPETITOR3_API_KEY=your_api_key_3
SLACK_CHANNEL=#pricing-alerts
PRICE_ALERT_EMAIL=manager@yourcompany.com
```

### 2. Required Credentials
- **OpenAI API:** Requires GPT-4 access for strategic analysis.
- **PostgreSQL Account:** For historical pricing data.
- **Slack API:** For team notifications.
- **SMTP Account:** For urgent email alerts.
- **Google Sheets OAuth2:** For the pricing dashboard.

### 3. Database Schema (PostgreSQL)
```sql
CREATE TABLE pricing_history (
    id SERIAL PRIMARY KEY,
    product_id VARCHAR(50) NOT NULL,
    current_price DECIMAL(10, 2),
    recommended_price DECIMAL(10, 2),
    price_change_percent DECIMAL(5, 2),
    strategy VARCHAR(20),
    confidence INT,
    action VARCHAR(20),
    urgency VARCHAR(10),
    competitor_avg DECIMAL(10, 2),
    analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🚀 Installation & Usage

1. **Import Workflow:** Go to n8n UI → Workflows → Import from File → Select `workflow.json`.
2. **Configure Credentials:** Replace all `REPLACE_WITH_YOUR_...` placeholders with your actual credential IDs.
3. **Update Google Sheets:** Set your Sheet ID in the "Log to Google Sheets" node.
4. **Customize Trigger:** Adjust the Schedule Trigger interval based on your market volatility (default: 6 hours).
5. **Execute:** Run manually with test data or wait for the scheduled trigger.

## 🛠 Troubleshooting
- **API Rate Limits:** If competitor APIs throttle requests, add a "Wait" node between HTTP requests or increase the schedule interval.
- **AI JSON Parsing:** Ensure `responseFormat: json_object` is enabled in the OpenAI node. Add a Code node to strip markdown formatting if GPT-4 occasionally wraps JSON in ``` blocks.
- **Missing Data:** Ensure all competitor APIs return consistent JSON structures. Update the Code node mapping if field names differ.

## 📄 License
This project is proprietary and intended for internal use or authorized clients. © 2026