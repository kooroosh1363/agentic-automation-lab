# 33 - Multi-Tenant SaaS Onboarding Engine & AI Orchestrator

![Level](https://img.shields.io/badge/Level-Advanced-6F42C1)

![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![n8n Version](https://img.shields.io/badge/n8n-v1.0+-blue)
![AI Model](https://img.shields.io/badge/AI-GPT--4-orange)

## 📖 Overview
An enterprise-oriented, automated onboarding engine for B2B SaaS companies. This workflow triggers via Webhook upon a new enterprise signup, provisions the tenant in a database, generates a highly personalized 30-day onboarding plan using GPT-4, provisions a private Slack channel and Notion workspace, and sends a beautifully formatted welcome email. It includes robust error handling to ensure no client falls through the cracks.

##  Key Features
- **Instant Provisioning:** Automatically creates tenant records in PostgreSQL the moment a webhook is received.
- **Hyper-Personalized AI Plans:** Uses GPT-4 to generate a custom 30-day roadmap based on the client's industry, plan, and team size.
- **Multi-Platform Orchestration:** Seamlessly integrates Slack (private channels), Notion (dedicated project boards), and Email.
- **Intelligent Error Handling:** Checks the success status of external API calls (like Slack channel creation) and triggers internal fallback alerts if a step fails.
- **White-Glove Experience:** Delivers an enterprise "concierge" feel at scale, drastically reducing Time-to-Value (TTV) for new clients.

## 🏗 Workflow Architecture

```text
[Webhook Trigger (Stripe/Typeform)]
      │
      ▼
[Parse & Prepare Data (Code)] ──> Generate Tenant ID & Normalize JSON
      │
      ▼
[Create Tenant in DB (PostgreSQL)]
      │
      ▼
[AI Generate Onboarding Plan (OpenAI/GPT-4)] ──> Custom 30-day JSON Plan
      │
      ├──> [Create Slack Channel (HTTP Request)] ──> [Invite CSM to Slack]
      │                                                        │
      ──> [Create Notion Page (Notion API)]                   │
                                                               ▼
                                                    [Check Slack Success (IF Node)]
                                                    ├── (True) ──> [Send Welcome Email (SMTP)]
                                                    └── (False) ─> [Send Error Alert (Internal SMTP)]
```

##  Nodes Used
1. `Webhook` (Trigger)
2. `Code` (JavaScript Data Parsing)
3. `Postgres` (Tenant Provisioning)
4. `OpenAI` (LangChain / GPT-4)
5. `HTTP Request` (x2 - Slack API)
6. `Notion` (Page Creation)
7. `IF` (Error Handling Logic)
8. `Email Send` (SMTP - Client & Internal)

## ⚙️ Prerequisites & Setup

### 1. Environment Variables
Add these to your `.env` file or n8n environment settings:
```env
SLACK_BOT_TOKEN=xoxb-your-slack-bot-token
CUSTOMER_SUCCESS_MANAGER_SLACK_ID=U0123456789
INTERNAL_ALERT_EMAIL=devops@yourcompany.com
```

### 2. Required Credentials
- **PostgreSQL Account:** For tenant database.
- **OpenAI API:** Requires GPT-4 access.
- **Notion API:** Requires integration with "Write" access to your onboarding database.
- **SMTP Account:** For sending client welcome emails and internal error alerts.

### 3. Database Schema (PostgreSQL)
Run this SQL script to create the required `tenants` table:
```sql
CREATE TABLE tenants (
    id SERIAL PRIMARY KEY,
    tenant_id VARCHAR(100) UNIQUE NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    industry VARCHAR(100),
    admin_email VARCHAR(255) NOT NULL,
    admin_name VARCHAR(255),
    plan_type VARCHAR(50),
    employee_count INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'onboarding_started'
);
```

## 🚀 Installation & Usage

1. **Import Workflow:** Go to n8n UI → Workflows → Import from File → Select `workflow.json`.
2. **Configure Credentials:** Replace all `REPLACE_WITH_YOUR_...` placeholders with your actual credential IDs.
3. **Update Notion DB ID:** Set your Notion Database ID in the "Create Notion Page" node.
4. **Activate Webhook:** Click "Listen for Test Event" in the Webhook node and send a POST request to the test URL with the sample payload below.
5. **Production:** Once tested, set the Webhook to "Production" and add the URL to your Stripe/Typeform webhook settings.

**Sample Webhook Payload:**
```json
{
  "company_name": "Acme Corp",
  "industry": "FinTech",
  "admin_email": "ceo@acmecorp.com",
  "admin_name": "John Doe",
  "plan_type": "Enterprise",
  "employee_count": 150
}
```

## 🛠 Troubleshooting
- **Slack API Errors:** Ensure your Slack Bot Token has `channels:manage` and `channels:invite` scopes.
- **Notion Integration:** Make sure the Notion Integration has been explicitly "Connected to" the specific database you are using in the workflow.
- **AI JSON Parsing:** If GPT-4 occasionally wraps the JSON in markdown blocks, add a quick Code node to strip ` ```json ` tags before processing.

##  License
This project is proprietary and intended for internal use or authorized clients. © 2026.
