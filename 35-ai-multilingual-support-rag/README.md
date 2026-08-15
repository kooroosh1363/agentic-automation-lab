# 🌐 35 - AI Multilingual Customer Support with RAG & Vector Database

![Level](https://img.shields.io/badge/Level-Advanced-6F42C1)

![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![n8n Version](https://img.shields.io/badge/n8n-v1.0+-blue)
![AI Models](https://img.shields.io/badge/AI-GPT--4%20%7C%20RAG-orange)

## 📖 Overview
An enterprise-oriented, AI-powered customer support automation engine utilizing Retrieval-Augmented Generation (RAG). This workflow intercepts incoming support tickets, automatically detects the language and sentiment, retrieves relevant context from a Vector Database (Pinecone), and generates a highly accurate, multilingual response. It includes a smart "Human-in-the-Loop" escalation system for frustrated customers and seamlessly syncs with HubSpot CRM.

## ✨ Key Features
- **Intelligent Triage:** Automatically detects the customer's language and sentiment (Positive, Neutral, Negative, Angry) using GPT-4.
- **RAG-Powered Accuracy:** Prevents AI hallucinations by grounding responses in your actual Knowledge Base via Vector Database semantic search.
- **Native Multilingual Support:** Responds to the customer in the exact language they used, without needing separate translation steps.
- **Smart Escalation (Human-in-the-Loop):** If the customer's sentiment is detected as "Angry", the workflow instantly alerts the support team on Slack for manual intervention.
- **CRM Synchronization:** Automatically logs the ticket, AI summary, and resolution status in HubSpot.

## 🏗 Workflow Architecture

```text
[Webhook Trigger (New Ticket)]
      │
      ▼
[Parse Ticket Data (Code)]
      │
      ▼
[Detect Language & Sentiment (OpenAI/GPT-4)]
      │
      ▼
[Query Vector Database (Pinecone HTTP)] ──> Retrieves Top 3 Relevant KB Articles
      │
      ▼
[Generate RAG Response (OpenAI/GPT-4)] ──> Grounded, multilingual reply
      │
      ▼
[Check Angry Sentiment (IF Node)]
      ├── (True: Angry) ──> [Alert Support Team on Slack] ──┐
      │                                                      │
      └── (False: Normal) ─> [Create Ticket in HubSpot] ─────┤
                                                             ▼
                                                  [Send Reply to Customer (SMTP)]
```

## 📦 Nodes Used
1. `Webhook` (Trigger)
2. `Code` (JavaScript Data Parsing)
3. `OpenAI` (LangChain / GPT-4 - Sentiment & Language Detection)
4. `HTTP Request` (Pinecone Vector DB Query)
5. `OpenAI` (LangChain / GPT-4 - RAG Response Generation)
6. `IF` (Conditional Escalation Logic)
7. `Slack` (Urgent Team Alert)
8. `HTTP Request` (HubSpot CRM Ticket Creation)
9. `Email Send` (SMTP - Customer Reply)

## ⚙️ Prerequisites & Setup

### 1. Environment Variables
Add these to your `.env` file or n8n environment settings:
```env
# Pinecone Vector Database
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX_NAME=your_index_name
PINECONE_PROJECT_ID=your_project_id
PINECONE_ENVIRONMENT=gcp-starter # e.g., gcp-starter, aws-us-east-1

# Slack Escalation
SLACK_SUPPORT_ESCALATION_CHANNEL=#urgent-support-tickets

# HubSpot CRM
HUBSPOT_PRIVATE_ACCESS_TOKEN=your_hubspot_private_app_token
HUBSPOT_SUPPORT_OWNER_ID=12345678 # Your support team owner ID in HubSpot
```

### 2. Required Credentials
- **OpenAI API:** Requires GPT-4 access.
- **Slack API:** Bot token with `chat:write` scope.
- **SMTP Account:** For sending the final reply to the customer.

### 3. Vector Database Preparation (Pre-requisite)
Before this workflow can retrieve answers, your Knowledge Base (PDFs, Notion docs, FAQs) must be chunked, embedded (using OpenAI `text-embedding-3-small`), and upserted into your Pinecone index.

## 🚀 Installation & Usage

1. **Import Workflow:** Go to n8n UI → Workflows → Import from File → Select `workflow.json`.
2. **Configure Credentials:** Replace all `REPLACE_WITH_YOUR_...` placeholders with your actual credential IDs.
3. **Update Environment Variables:** Ensure all Pinecone and HubSpot variables are set correctly.
4. **Test Webhook:** Send a POST request to the webhook URL using the sample payload below.
5. **Activate:** Enable the workflow for production use.

**Sample Webhook Payload:**
```json
{
  "ticket_id": "TKT-9982",
  "customer_email": "maria.garcia@example.com",
  "customer_name": "Maria Garcia",
  "content": "Hola, he estado intentando cancelar mi suscripción durante 20 minutos y el botón no funciona. ¡Esto es inaceptable!"
}
```
*(Note: The AI will detect this as Spanish and "Angry", triggering the Slack escalation and replying in Spanish).*

## 🛠 Troubleshooting
- **Pinecone Dimension Mismatch:** Ensure the embedding model used to populate your Pinecone index matches the dimensions expected by your query (e.g., 1536 for `text-embedding-3-small`).
- **AI Hallucinations:** If the AI invents answers, lower the `temperature` in the "Generate RAG Response" node to `0.1` or `0.2`, and ensure the system prompt strictly forbids answering outside the provided context.
- **HubSpot Property Errors:** Verify that the property names (`subject`, `content`, `hubspot_owner_id`) exactly match your HubSpot ticket object schema.

## 📄 License
This project is proprietary and intended for internal use or authorized clients. © 2026.
