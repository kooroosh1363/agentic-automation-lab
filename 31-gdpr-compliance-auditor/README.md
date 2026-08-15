# 🛡 31 - GDPR Compliance Auditor & AI Analyzer

![Level](https://img.shields.io/badge/Level-Advanced-6F42C1)

![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![n8n Version](https://img.shields.io/badge/n8n-v1.0+-blue)
![AI Model](https://img.shields.io/badge/AI-GPT--4-orange)

## 📖 Overview
An advanced, enterprise-oriented n8n workflow designed to automate GDPR and Data Privacy compliance auditing. This system scans target websites, bypasses basic anti-bot mechanisms, extracts privacy-related pages, and uses OpenAI (GPT-4) to perform a deep semantic analysis of the content. It automatically categorizes violations by severity, logs results to a database and Google Sheets, and sends instant critical alerts via email.

## ✨ Key Features
- **Smart Web Scraping:** Custom HTTP requests with rotating User-Agents and headers to bypass basic anti-bot protections.
- **AI-Powered Analysis:** Utilizes GPT-4 to semantically understand Privacy Policies and Cookie Banners, not just keyword matching.
- **Severity Classification:** Automatically categorizes violations into `CRITICAL`, `HIGH`, `MEDIUM`, and `LOW`.
- **Instant Alerting:** Triggers immediate SMTP email alerts for critical compliance failures.
- **Centralized Logging:** Saves structured audit data to PostgreSQL and appends summaries to Google Sheets for dashboarding.

## 🏗 Workflow Architecture

```text
[Manual Trigger]
      │
      ▼
[Scan Website (HTTP Request)] ──> Custom Headers & User-Agent
      │
      ▼
[Parse HTML & Extract Data (Code)] ──> Regex for Privacy/Cookie links
      │
      ▼
[Fetch Privacy Policy (HTTP Request)]
      │
      ▼
[AI GDPR Analysis (OpenAI/GPT-4)] ──> JSON structured output
      │
      ▼
[Process AI Response (Code)] ──> Categorize by severity
      │
      ▼
[Check Critical Violations (IF Node)]
      ├── (True) ──> [Send Critical Alert Email (SMTP)]
      │                    │
      └── (False/After) ──> [Save to Database (PostgreSQL)]
                                 │
                                 ▼
                           [Log to Google Sheets]
```

## 📦 Nodes Used
1. `Manual Trigger`
2. `HTTP Request` (x2)
3. `Code` (JavaScript) (x2)
4. `OpenAI` (LangChain)
5. `IF` (Conditional Logic)
6. `Email Send` (SMTP)
7. `Postgres` (Database)
8. `Google Sheets` (Logging)

## ⚙️ Prerequisites & Setup

### 1. Environment Variables
Create a `.env` file in your n8n root directory (or configure in n8n settings) with the following:
```env
CRITICAL_ALERT_EMAIL=security@yourcompany.com
```

### 2. Required Credentials
Ensure the following credentials are set up in your n8n instance:
- **OpenAI API:** Requires a valid API key with GPT-4 access.
- **SMTP Account:** For sending critical alert emails.
- **PostgreSQL Account:** For storing historical audit data.
- **Google Sheets OAuth2:** For the executive summary dashboard.

### 3. Database Schema (PostgreSQL)
Run this SQL script to create the required table:
```sql
CREATE TABLE gdpr_audit_results (
    id SERIAL PRIMARY KEY,
    website_url VARCHAR(255) NOT NULL,
    scanned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    compliance_score INT,
    critical_count INT DEFAULT 0,
    high_count INT DEFAULT 0,
    medium_count INT DEFAULT 0,
    low_count INT DEFAULT 0,
    has_critical BOOLEAN DEFAULT FALSE,
    violations_json JSONB
);
```

##  Installation & Usage

1. **Import Workflow:**
   - Go to n8n UI → Workflows → Import from File → Select `workflow.json`.
2. **Configure Credentials:**
   - Open the workflow and replace all placeholder credentials (`REPLACE_WITH_YOUR_...`) with your actual n8n credential IDs.
3. **Update Google Sheets ID:**
   - In the "Log to Google Sheets" node, replace `REPLACE_WITH_YOUR_SHEET_ID` with your actual Sheet ID.
4. **Execute:**
   - Click "Execute Workflow". The workflow expects a JSON input: `{"websiteUrl": "https://example.com"}`.

## 🛠 Troubleshooting
- **403 Forbidden / Anti-Bot Blocking:** If the target site blocks the scraper, consider integrating a proxy node or using a headless browser node (like Puppeteer) instead of the HTTP Request node.
- **OpenAI JSON Parse Error:** Ensure the OpenAI node has `responseFormat: json_object` enabled. If GPT-4 occasionally returns markdown wrappers, add a Code node to strip ````json` tags before parsing.

## 📄 License
This project is proprietary and intended for internal use or authorized clients. © 2026.
