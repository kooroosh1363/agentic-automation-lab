 36 - AI Personalized Sales Outreach & Data Enrichment Engine

![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![n8n Version](https://img.shields.io/badge/n8n-v1.0+-blue)
![AI Models](https://img.shields.io/badge/AI-GPT--4%20%7C%20Prompt%20Chaining-orange)

## 📖 Overview
An advanced B2B sales automation engine designed to revolutionize cold outreach. This workflow takes raw lead data, enriches it using external APIs (like Clearbit), and uses a sophisticated AI Prompt Chaining technique to extract a unique "hook" before writing a hyper-personalized email. It includes an automated Lead Scoring system to ensure only high-quality prospects receive immediate outreach, while all data is seamlessly synced to HubSpot CRM and the sales team is notified via Slack.

## ✨ Key Features
- **Automated Data Enrichment:** Automatically fetches company size, industry, and recent news using enrichment APIs.
- **AI Prompt Chaining:** Uses a two-step AI process. First, GPT-4 analyzes the enriched data to find a unique conversation starter (Hook). Second, it writes the email using that specific hook.
- **Hyper-Personalization at Scale:** Moves beyond "Hi [Name]" to write emails that reference specific company milestones, drastically improving reply rates.
- **Dynamic Lead Scoring:** A custom Code node calculates a score based on company size, prospect title, and data quality.
- **Smart Routing (Human-in-the-Loop):** High-scoring leads get an instant personalized email. Lower-scoring leads are simply logged in the CRM for manual review.
- **Full CRM & Team Sync:** Updates HubSpot contacts with enrichment data and scores, and alerts the sales team on Slack when a high-value email is sent.

## 🏗 Workflow Architecture

```text
[Webhook Trigger (New Lead)]
      │
      ▼
[Parse Lead Data (Code)]
      │
      ▼
[Enrich Company Data (HTTP Request - Clearbit/Apollo)]
      │
      ▼
[AI Extract Personalization Hook (OpenAI/GPT-4)] ──> Finds the "Hook"
      │
      ▼
[AI Write Hyper-Personalized Email (OpenAI/GPT-4)] ──> Writes the email using the Hook
      │
      ▼
[Calculate Lead Score (Code)] ──> Scores from 0 to 100
      │
      ▼
[Check Lead Score (IF Node)]
      ├── (Score >= 70) ──> [Send Personalized Email (SMTP)] ──┐
      │                                                         │
      └── (Score < 70) ──> [Skip Email] ────────────────────────┤
                                                                ▼
                                                   [Create/Update Contact in HubSpot]
                                                                │
                                                                ▼
                                                   [Notify Sales Team on Slack]
```

## 📦 Nodes Used
1. `Webhook` (Trigger)
2. `Code` (JavaScript Data Parsing & Lead Scoring)
3. `HTTP Request` (Data Enrichment API & HubSpot CRM)
4. `OpenAI` (LangChain / GPT-4 - Hook Extraction)
5. `OpenAI` (LangChain / GPT-4 - Email Copywriting)
6. `IF` (Conditional Routing based on Lead Score)
7. `Email Send` (SMTP - Personalized Outreach)
8. `Slack` (Team Notification)

## ⚙️ Prerequisites & Setup

### 1. Environment Variables
Add these to your `.env` file or n8n environment settings:
```env
# Data Enrichment
CLEARBIT_API_KEY=your_clearbit_api_key

# HubSpot CRM
HUBSPOT_PRIVATE_ACCESS_TOKEN=your_hubspot_private_app_token

# Slack Notifications
SLACK_SALES_TEAM_CHANNEL=#new-sales-outreach
```

### 2. Required Credentials
- **OpenAI API:** Requires GPT-4 access.
- **SMTP Account:** For sending the cold emails (ensure your domain has proper SPF/DKIM/DMARC records to avoid spam folders).
- **Slack API:** Bot token with `chat:write` scope.

### 3. HubSpot Custom Properties
For the CRM integration to work perfectly, create the following custom properties in your HubSpot Contact object:
- `lead_score` (Number)
- `personalization_hook` (Single-line text)

## 🚀 Installation & Usage

1. **Import Workflow:** Go to n8n UI → Workflows → Import from File → Select `workflow.json`.
2. **Configure Credentials:** Replace all `REPLACE_WITH_YOUR_...` placeholders with your actual credential IDs.
3. **Update Environment Variables:** Set your Clearbit, HubSpot, and Slack variables.
4. **Test Webhook:** Send a POST request to the webhook URL using the sample payload below.
5. **Activate:** Enable the workflow and connect it to your lead generation source (e.g., Typeform, LinkedIn Ads, or a scraping tool).

**Sample Webhook Payload:**
```json
{
  "lead_id": "LEAD-8821",
  "first_name": "Sarah",
  "last_name": "Jenkins",
  "email": "sarah.j@techstartup.com",
  "company": "TechStartup Inc",
  "domain": "techstartup.com",
  "title": "VP of Engineering"
}
```

## ️ Troubleshooting
- **Enrichment API Limits:** Clearbit and similar APIs have strict monthly limits. If you hit the limit, add an `IF` node before the enrichment step to check if the company is already enriched in your CRM.
- **AI JSON Parsing:** If GPT-4 occasionally wraps the JSON in markdown blocks, add a quick Code node to strip ` ```json ` tags before processing the next step.
- **Email Deliverability:** Cold emails sent via standard SMTP often land in spam. For production, consider routing the "Send Personalized Email" node through a dedicated cold email API like Instantly or Smartlead.

## 📄 License
This project is proprietary and intended for internal use or authorized clients. © 2026.