# 37 - AI Competitive Intelligence & Market Trend Analyzer

![Level](https://img.shields.io/badge/Level-Advanced-6F42C1)

![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![n8n Version](https://img.shields.io/badge/n8n-v1.0+-blue)
![AI Models](https://img.shields.io/badge/AI-GPT--4%20%7C%20Change%20Detection-orange)

## 📖 Overview
An automated competitive intelligence system that monitors competitor websites daily, detects strategic changes (pricing, features, messaging), and uses AI to extract actionable business insights. This workflow eliminates the need for expensive CI tools (like Crayon or Klue) by combining web scraping, historical change detection using n8n's internal static data storage, and GPT-4 powered strategic analysis. The final report is delivered directly to the product team via Slack.

## ✨ Key Features
- **Automated Daily Monitoring:** Schedule trigger runs every 24 hours to scrape competitor pages (pricing, features, blog).
- **Smart Change Detection:** Compares today's scraped content with yesterday's version using n8n's built-in `getWorkflowStaticData()` - **no external database required for basic usage**.
- **AI-Powered Strategic Analysis:** GPT-4 doesn't just report changes - it interprets them. It identifies the "why" behind competitor moves and suggests strategic responses.
- **Actionable Intelligence Reports:** Outputs structured JSON with summary, key changes, strategic implications, and recommended actions.
- **Instant Team Alerts:** Only notifies the team when meaningful changes are detected, avoiding alert fatigue.
- **Zero External DB Dependency (Optional):** Uses n8n's internal static storage for change history, making it instantly deployable. Can be upgraded to PostgreSQL/Supabase for enterprise scale.

## 🏗 Workflow Architecture

```text
[Daily Schedule Trigger (Every 24h)]
      │
      ▼
[Scrape Competitor Website (HTTP Request)]
      │
      ▼
[Detect Changes (Code)] ─> Compares with yesterday's static data
      │
      ▼
[IF Changes Detected?]
      ├── (Yes) ──> [AI Analyze Competitor Strategy (GPT-4)] ──> [Notify Product Team on Slack]
      │
      ── (No) ──> [Log No Changes] ──> (Workflow ends silently)
```

## 📦 Nodes Used
1. `Schedule Trigger` (Cron - Daily execution)
2. `HTTP Request` (Web Scraping)
3. `Code` (JavaScript - Change Detection & Static Data Management)
4. `IF` (Conditional Routing)
5. `OpenAI` (LangChain / GPT-4 - Strategic Analysis)
6. `Slack` (Team Notification)

## ⚙️ Prerequisites & Setup

### 1. Environment Variables
Add these to your `.env` file or n8n environment settings:
```env
# Competitor Monitoring
COMPETITOR_URL=https://competitor.com/pricing

# Slack Notifications
SLACK_INTELLIGENCE_CHANNEL=#competitive-intelligence
```

### 2. Required Credentials
- **OpenAI API:** Requires GPT-4 access for strategic analysis.
- **Slack API:** Bot token with `chat:write` scope.

### 3. Choosing the Right Pages to Monitor
For maximum intelligence value, monitor these competitor pages:
- `/pricing` - Detects pricing strategy changes, new tiers, discounting.
- `/features` or `/product` - Detects new feature launches or positioning shifts.
- `/blog` - Detects content marketing pivots and thought leadership themes.
- `/careers` - (Advanced) Hiring patterns reveal strategic direction.

## 🚀 Installation & Usage

1. **Import Workflow:** Go to n8n UI → Workflows → Import from File → Select `workflow.json`.
2. **Configure Credentials:** Replace `REPLACE_WITH_YOUR_...` placeholders with actual credential IDs.
3. **Set Environment Variables:** Configure `COMPETITOR_URL` and Slack channel.
4. **Manual Test:** Execute the workflow manually once to seed the initial static data.
5. **Activate:** Enable the schedule trigger. The workflow will now run daily and only alert you when changes occur.

**Sample AI Output Structure:**
```json
{
  "summary": "Competitor X launched a new 'Enterprise' tier with AI features, signaling a push upmarket.",
  "key_changes": [
    "New $499/mo Enterprise tier added",
    "AI-powered analytics now highlighted on homepage",
    "Removed 'Starter' plan - minimum price increased to $49/mo"
  ],
  "strategic_implication": "They are abandoning SMB market to focus on high-ACV enterprise deals. This leaves a gap in the $20-50/mo segment.",
  "recommended_action": "Launch a targeted campaign for SMB customers highlighting our affordable pricing. Consider a 'Migration from Competitor X' landing page."
}
```

## 🛠 Troubleshooting
- **HTML Scraping Issues:** If the competitor uses heavy JavaScript rendering (React/SPA), the HTTP Request node won't capture dynamic content. Solution: Use a headless browser service like ScrapingBee or Browserless API instead.
- **False Positive Changes:** Minor HTML/CSS changes can trigger alerts. Solution: Increase the substring length in the Code node or add a similarity threshold (e.g., only alert if >5% of content changed).
- **Rate Limiting:** Aggressive scraping may get your IP blocked. Solution: Add random delays between requests and rotate user-agents.
- **AI Context Window:** For very long pages, the 5000 character limit may miss important changes. Solution: Use a summarization step before comparison, or split the page into sections.

##  Scaling to Enterprise
For a production deployment of competitive intelligence:
1. **Multiple Competitors:** Use a `Loop Over Items` node to iterate over a list of competitor URLs from a database.
2. **Historical Database:** Replace `getWorkflowStaticData()` with a PostgreSQL/Supabase node to store full change history and enable trend analysis over months.
3. **PDF Reports:** Add an HTML-to-PDF node to generate weekly executive summaries.
4. **Integration with Product Roadmap:** Automatically create Jira/Linear tickets when significant competitor features are detected.

## 📄 License
This project is proprietary and intended for internal use or authorized clients. © 2026.
