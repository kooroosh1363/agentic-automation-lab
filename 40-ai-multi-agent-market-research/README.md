🏆 40 - AI Multi-Agent Market Research & Report Generator

![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![n8n Version](https://img.shields.io/badge/n8n-v1.0+-blue)
![AI Models](https://img.shields.io/badge/AI-GPT--4%20%7C%20Multi--Agent-orange)

## 📖 Overview
The crown jewel of the automation portfolio. This enterprise-grade system simulates a full market research team using a Multi-Agent AI architecture. Triggered by a simple request, it deploys a "Search Agent" (Tavily) to scour the web, an "Analyst Agent" (GPT-4) to extract structured insights, and a "Writer Agent" (GPT-4) to draft a comprehensive professional report. Finally, it converts the report to a beautifully formatted PDF, uploads it to Google Drive, and emails the download link to the stakeholder.

## ✨ Key Features
- **Multi-Agent Orchestration:** Separates concerns into Search, Analysis, and Writing agents for maximum accuracy and depth.
- **Automated Web Intelligence:** Uses Tavily API to fetch real-time, high-quality search results without manual scraping.
- **Dynamic PDF Generation:** Converts AI-generated Markdown into a styled HTML document, then compiles it into a binary PDF file.
- **End-to-End Delivery:** Automatically handles cloud storage (Google Drive) and stakeholder notification (Gmail).
- **Zero-Touch Execution:** From a single Webhook trigger to a delivered PDF in the user's inbox.

## ️ Workflow Architecture

```text
[Research Request Webhook]
      │
      ▼
[Tavily Web Search Agent] ──> Fetches real-time data
      │
      ▼
[AI Analyst Agent (GPT-4)] ──> Extracts structured insights (JSON)
      │
      ▼
[AI Writer Agent (GPT-4)] ──> Drafts comprehensive Markdown report
      │
      ▼
[Format HTML for PDF (Code)] ──> Converts Markdown to styled HTML
      │
      ▼
[Generate PDF Report (API)] ─> Creates binary PDF file
      │
      ▼
[Upload to Google Drive] ──> Stores file and generates shareable link
      │
      ▼
[Send Report via Email (Gmail)] ─> Delivers PDF link to stakeholder
```

## 📦 Nodes Used
1. `Webhook` (Trigger - accepts research topic and email)
2. `HTTP Request` (Tavily API - Web Search)
3. `OpenAI` (LangChain / GPT-4 - Analyst Agent)
4. `OpenAI` (LangChain / GPT-4 - Writer Agent)
5. `Code` (JavaScript - Markdown to HTML conversion)
6. `HTTP Request` (PDF Generation API)
7. `Google Drive` (File Upload)
8. `Gmail` (Email Delivery)

## ⚙️ Prerequisites & Setup

### 1. Environment Variables
Add these to your `.env` file or n8n environment settings:
```env
# Tavily Search API
TAVILY_API_KEY=tvly-XXXXXXXXXXXXXXXXXXXXXXXX

# Google Drive
GOOGLE_DRIVE_FOLDER_ID=1XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

### 2. Required Credentials
- **OpenAI API:** Requires access to `gpt-4` for deep analysis and writing.
- **Google Drive API:** OAuth2 credentials with `drive.file` scope.
- **Gmail API:** OAuth2 credentials with `gmail.send` scope.

## 🚀 Installation & Usage

1. **Import Workflow:** Go to n8n UI → Workflows → Import from File → Select `workflow.json`.
2. **Configure Credentials:** Replace `REPLACE_WITH_YOUR_...` placeholders with actual credential IDs.
3. **Set Environment Variables:** Configure Tavily and Google Drive variables.
4. **Test Webhook:** Use Postman or cURL to send a research request.
   ```bash
   curl -X POST https://your-n8n-instance.com/webhook/market-research \
        -H "Content-Type: application/json" \
        -d '{
          "topic": "The future of solid-state batteries in EVs by 2030",
          "email": "stakeholder@company.com"
        }'
   ```
5. **Activate:** Enable the workflow for production use.

## 🛠 Troubleshooting
- **PDF API Limits:** The free tier of the PDF generation API might have limits. For enterprise scale, use a local headless browser (like Puppeteer via a Code node) or a paid API like DocRaptor.
- **Context Window Overflow:** If Tavily returns too much text, the Analyst Agent might hit the GPT-4 token limit. Solution: Truncate the search results in a Code node before passing them to the AI.
- **Gmail Sending Quotas:** Gmail API has daily sending limits (usually 500 for standard accounts). For high volume, switch to an SMTP node connected to SendGrid or AWS SES.

## 📄 License
This project is proprietary and intended for internal use or authorized clients. © 2026.