# 🎨 34 - AI Content Repurposing & Multi-Platform Distribution Engine

![Level](https://img.shields.io/badge/Level-Advanced-6F42C1)

![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![n8n Versio n](https://img.shields.io/badge/n8n-v1.0+-blue)
![AI Models](https://img.shields.io/badge/AI-GPT--4%20%7C%20DALL--E--3-orange)

## 📖 Overview
An enterprise-oriented, AI-powered content repurposing engine designed for content creators, podcasters, and marketing teams. This workflow automatically monitors a YouTube channel via RSS, extracts video transcripts, uses GPT-4 to generate platform-optimized content (Twitter, LinkedIn, Instagram, Newsletter, Blog), creates eye-catching thumbnails with DALL-E 3, publishes to WordPress, logs to a Notion content calendar, and notifies the team on Slack for final approval.

## ✨ Key Features
- **Automated Content Monitoring:** RSS trigger watches for new YouTube videos in real-time.
- **Multi-Format AI Generation:** GPT-4 transforms a single video into 5 distinct, platform-optimized content pieces.
- **AI Image Generation:** DALL-E 3 automatically creates professional thumbnails based on video context.
- **Multi-Platform Publishing:** Simultaneously publishes to WordPress, Notion, and prepares drafts for social platforms.
- **Human-in-the-Loop Approval:** Slack notification ensures a team member reviews content before final social publishing.
- **Content Calendar Integration:** Every piece of content is automatically logged in a Notion database for tracking and analytics.

## 🏗 Workflow Architecture

```text
[RSS Feed Trigger (YouTube Channel)]
      │
      ▼
[Extract Video Info (Code)] ──> Parse Video ID, Title, Thumbnail
      │
      ▼
[Fetch Video Transcript (HTTP Request)] ──> YouTube Data API
      │
      ▼
[AI Generate Multi-Platform Content (OpenAI/GPT-4)]
      │
      ├──> [Generate Thumbnail with DALL-E 3] ──> [Publish to WordPress]
      │                                                      │
      ├──> [Log to Notion Content Calendar]                  │
      │                                                      ▼
      └──────────────────────────────────────────> [Notify Content Team on Slack]
```

## 📦 Nodes Used
1. `RSS Feed Read` (Trigger)
2. `Code` (JavaScript - Video Info Extraction)
3. `HTTP Request` (YouTube Data API)
4. `OpenAI` (LangChain / GPT-4 - Content Generation)
5. `OpenAI` (LangChain / DALL-E 3 - Image Generation)
6. `WordPress` (Post Publishing)
7. `Notion` (Content Calendar Logging)
8. `Slack` (Team Notification)

## ⚙️ Prerequisites & Setup

### 1. Environment Variables
Add these to your `.env` file or n8n environment settings:
```env
YOUTUBE_CHANNEL_ID=UCxxxxxxxxxxxxxxxxxxxxxx
YOUTUBE_API_KEY=your_youtube_data_api_key
SLACK_CONTENT_TEAM_CHANNEL=#content-approvals
```

### 2. Required Credentials
- **OpenAI API:** Requires access to GPT-4 and DALL-E 3.
- **YouTube Data API v3:** Enable in Google Cloud Console for transcript fetching.
- **WordPress API:** Application password for your WordPress site.
- **Notion API:** Integration with "Write" access to your content calendar database.
- **Slack API:** Bot token with `chat:write` scope.

### 3. Notion Database Structure
Create a Notion database with the following properties:
- `Title` (Title)
- `Status` (Select: Draft, Published, Approved)
- `Platform` (Multi-select: Twitter, LinkedIn, Instagram, Blog, Newsletter)
- `Publish Date` (Date)

## 🚀 Installation & Usage

1. **Import Workflow:** Go to n8n UI → Workflows → Import from File → Select `workflow.json`.
2. **Configure Credentials:** Replace all `REPLACE_WITH_YOUR_...` placeholders with your actual credential IDs.
3. **Update Environment Variables:** Set YouTube Channel ID, API Key, and Slack channel.
4. **Test RSS Trigger:** Manually execute the workflow to ensure the RSS feed is parsed correctly.
5. **Activate:** Enable the workflow. It will now automatically process every new video from the specified YouTube channel.

## 🛠 Troubleshooting
- **YouTube API Quota:** The YouTube Data API has a daily quota. If you hit the limit, consider caching transcripts or reducing check frequency.
- **DALL-E Content Policy:** If DALL-E rejects the prompt, add a Code node to sanitize the `image_prompt` before sending it.
- **WordPress Media Upload:** Featured images via URL may not work on all WordPress setups. Use the "Upload Media" node before creating the post if needed.
- **AI JSON Parsing:** Ensure `responseFormat: json_object` is enabled. Add a Code node to strip markdown wrappers if GPT-4 occasionally returns ```json blocks.

## 📄 License
This project is proprietary and intended for internal use or authorized clients. © 2026.
