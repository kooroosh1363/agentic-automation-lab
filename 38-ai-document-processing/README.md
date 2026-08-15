# 📄 38 - AI Intelligent Document Processing (IDP) Engine

![Level](https://img.shields.io/badge/Level-Advanced-6F42C1)

![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![n8n Version](https://img.shields.io/badge/n8n-v1.0+-blue)
![AI Models](https://img.shields.io/badge/AI-GPT--4o%20Vision-orange)

## 📖 Overview
An enterprise-oriented Intelligent Document Processing (IDP) engine that automates the extraction, validation, and routing of data from unstructured documents (PDFs, Invoices, Contracts, Resumes). By leveraging GPT-4o's advanced Vision capabilities, this workflow reads binary files directly, extracts structured JSON data, performs automated validation, and intelligently routes the results—saving approved documents to Airtable and instantly alerting managers via Slack if critical "Red Flags" are detected.

## ✨ Key Features
- **Native Binary Data Processing:** Seamlessly handles binary file uploads (PDFs, Images) via Webhook, converting them to Base64 for AI processing.
- **GPT-4o Vision Extraction:** Uses the latest multimodal AI to "see" and read documents, extracting highly accurate structured data without needing traditional, rigid OCR templates.
- **Automated Data Validation:** A custom Code node validates the AI's output (e.g., checking if amounts are numeric, dates are valid) before it enters the database.
- **Smart Red Flag Detection:** Automatically flags suspicious documents (e.g., invoices over $10,000, missing signatures, or incomplete fields) and triggers an urgent Slack alert.
- **Structured Database Sync:** Clean, validated data is automatically pushed to Airtable (or PostgreSQL) for accounting, HR, or legal teams.

## 🏗 Workflow Architecture

```text
[Webhook Trigger (File Upload)]
      │
      ▼
[Prepare Binary Data (Code)] ──> Converts Binary to Base64
      │
      ▼
[AI Extract Document Data (GPT-4o Vision)] ──> Returns structured JSON
      │
      ▼
[Validate & Check Red Flags (Code)] ──> Validates data & checks thresholds
      │
      ▼
[IF Red Flag Detected?]
      ├── (Yes) ──> [Alert Manager on Slack] ──> [Save to Airtable as "Flagged"]
      │
      └── (No) ──> [Save to Airtable as "Approved"]
```

##  Nodes Used
1. `Webhook` (Trigger - accepts multipart/form-data)
2. `Code` (JavaScript - Binary to Base64 conversion)
3. `OpenAI` (LangChain / GPT-4o Vision - Document Extraction)
4. `Code` (JavaScript - Data Validation & Red Flag Logic)
5. `IF` (Conditional Routing based on Red Flags)
6. `HTTP Request` (Airtable API - Save Record)
7. `Slack` (Urgent Manager Alert)

## ⚙️ Prerequisites & Setup

### 1. Environment Variables
Add these to your `.env` file or n8n environment settings:
```env
# Airtable Database
AIRTABLE_BASE_ID=appXXXXXXXXXXXXXX
AIRTABLE_TABLE_ID=tblXXXXXXXXXXXXXX
AIRTABLE_API_KEY=keyXXXXXXXXXXXXXX

# Slack Alerts
SLACK_ALERTS_CHANNEL=#document-alerts
```

### 2. Required Credentials
- **OpenAI API:** Requires access to `gpt-4o` (Vision model).
- **Slack API:** Bot token with `chat:write` scope.
- **Airtable API Key:** Personal access token or OAuth app.

### 3. Airtable Schema Setup
Create a table in Airtable with the following columns:
- `Document Type` (Single line text)
- `Vendor/Name` (Single line text)
- `Total Amount` (Number)
- `Currency` (Single line text)
- `Date` (Date)
- `Status` (Single select: "Approved", "Flagged")
- `Processed At` (Date/Time)

## 🚀 Installation & Usage

1. **Import Workflow:** Go to n8n UI → Workflows → Import from File → Select `workflow.json`.
2. **Configure Credentials:** Replace `REPLACE_WITH_YOUR_...` placeholders with actual credential IDs.
3. **Set Environment Variables:** Configure Airtable and Slack variables.
4. **Test Webhook:** Use Postman or cURL to send a POST request with a PDF file in the `data` field.
   ```bash
   curl -X POST https://your-n8n-instance.com/webhook/document-upload \
        -F "file=@invoice.pdf"
   ```
5. **Activate:** Enable the workflow for production use.

## 🛠 Troubleshooting
- **Base64 Size Limits:** GPT-4o has a token limit. For very large PDFs (e.g., >20 pages), consider adding a "PDF Split" node (using a library like `pdf-lib`) to process the document page-by-page.
- **JSON Parsing Errors:** If GPT-4o occasionally wraps the JSON in markdown blocks (```json ... ```), add a quick regex replacement in the Code node to strip these tags before `JSON.parse()`.
- **Binary Data Missing:** Ensure the Webhook node is configured to accept binary data, and the client is sending it as `multipart/form-data`, not raw JSON.

## 📄 License
This project is proprietary and intended for internal use or authorized clients. © 2026.
