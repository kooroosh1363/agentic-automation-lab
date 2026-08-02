39 - AI Meeting Intelligence & Action Item Tracker

![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![n8n Version](https://img.shields.io/badge/n8n-v1.0+-blue)
![AI Models](https://img.shields.io/badge/AI-GPT--4%20%7C%20NER-orange)

## 📖 Overview
An advanced AI-powered meeting intelligence engine that transforms raw meeting transcripts into structured, actionable outcomes. By leveraging GPT-4's advanced context understanding, this workflow automatically extracts executive summaries, key decisions, and specific action items (with assignees and deadlines). It then seamlessly integrates with project management tools (like Notion or Jira) to create tasks and instantly notifies the responsible team members via Slack, completely eliminating the need for manual meeting minutes and follow-up emails.

## ✨ Key Features
- **Automated Transcript Processing:** Accepts raw text transcripts via Webhook, cleans the data, and prepares it for AI analysis.
- **AI-Powered Extraction:** Uses GPT-4 to accurately identify action items, assignees, and deadlines from unstructured conversational text.
- **Dynamic Task Creation:** Automatically creates structured tasks in Notion (or Jira) for every extracted action item, complete with due dates and assignees.
- **Smart Routing & Filtering:** Intelligently skips task creation for unassigned items, logging them separately for manual review.
- **Instant Team Notifications:** Sends personalized Slack messages to each assignee, ensuring immediate visibility and accountability.
- **Scalable Looping:** Uses advanced JavaScript mapping to split multiple action items into individual workflow executions without needing complex batch nodes.

## ️ Workflow Architecture

```text
[Webhook Trigger (Transcript Upload)]
      │
      ▼
[Clean & Prepare Transcript (Code)]
      │
      ▼
[AI Extract Action Items (GPT-4)] ──> Returns JSON with summary, decisions, and action_items array
      │
      ▼
[Split Action Items (Code)] ──> Maps array to individual items for parallel processing
      │
      ▼
[IF Has Assignee?]
      ├── (Yes) ──> [Create Task in Notion] ──> [Notify Assignee on Slack]
      │
      └── (No) ──> [Log Unassigned Items]
```

## 📦 Nodes Used
1. `Webhook` (Trigger - accepts POST requests with transcript data)
2. `Code` (JavaScript - Text cleaning and preparation)
3. `OpenAI` (LangChain / GPT-4 - NER and Action Item Extraction)
4. `Code` (JavaScript - Array mapping and item splitting)
5. `IF` (Conditional Routing based on assignee presence)
6. `HTTP Request` (Notion API - Task Creation)
7. `Slack` (Personalized Team Notification)

## ⚙️ Prerequisites & Setup

### 1. Environment Variables
Add these to your `.env` file or n8n environment settings:
```env
# Notion Integration
NOTION_API_KEY=secret_XXXXXXXXXXXXXXXXXXXXXXXX
NOTION_DATABASE_ID=XXXXXXXXXXXXXXXXXXXXXXXX

# Slack Notifications
SLACK_TASKS_CHANNEL=#meeting-action-items
```

### 2. Required Credentials
- **OpenAI API:** Requires access to `gpt-4` for high-accuracy text analysis.
- **Slack API:** Bot token with `chat:write` scope.

### 3. Notion Database Schema Setup
Create a database in Notion and share it with your Notion Integration. The database must have the following properties:
- `Name` (Title)
- `Assignee` (Rich text or Person)
- `Deadline` (Date)
- `Meeting` (Rich text)

## 🚀 Installation & Usage

1. **Import Workflow:** Go to n8n UI → Workflows → Import from File → Select `workflow.json`.
2. **Configure Credentials:** Replace `REPLACE_WITH_YOUR_...` placeholders with actual credential IDs.
3. **Set Environment Variables:** Configure Notion and Slack variables.
4. **Test Webhook:** Use Postman or cURL to send a POST request with a sample transcript.
   ```bash
   curl -X POST https://your-n8n-instance.com/webhook/meeting-transcript \
        -H "Content-Type: application/json" \
        -d '{
          "title": "Sprint Planning",
          "date": "2026-08-03",
          "transcript": "John: We need to update the landing page by Friday. Sarah: I will handle the copy. Mike: I will do the design."
        }'
   ```
5. **Activate:** Enable the workflow for production use.

## 🛠 Troubleshooting
- **Token Limits:** GPT-4 has an 8k/32k token limit. For very long meetings (e.g., > 1 hour), consider chunking the transcript in the "Clean & Prepare Transcript" node and processing it in batches.
- **JSON Parsing Errors:** If the AI occasionally adds conversational filler outside the JSON block, add a regex step in the Code node to extract only the `{...}` block before parsing.
- **Notion API Permissions:** Ensure the Notion Integration has "Can edit" permissions for the specific database you are using, otherwise the HTTP Request will return a 403 Forbidden error.

## 📄 License
This project is proprietary and intended for internal use or authorized clients. © 2026.