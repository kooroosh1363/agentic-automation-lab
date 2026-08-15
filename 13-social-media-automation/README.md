# Social Media Automation with AI

![Level](https://img.shields.io/badge/Level-Intermediate-0D6EFD)


## 📋 Description


An intelligent social media management and automation system that analyzes industry trends, generates platform-specific content using AI, manages an approval workflow, schedules posts, and provides automated performance analytics with actionable insights.


## 🔧 Nodes Used


- **Schedule Trigger** - Weekly content generation and daily analytics checks

- **HTTP Request** - Fetching industry trends and social media analytics

- **OpenAI GPT-4** - AI content generation and performance insights

- **Code Node** - Formatting posts and preparing data for publishing

- **Google Sheets** - Content calendar and post tracking

- **Email Send** - Approval requests and weekly performance reports

- **HTTP Request (Publish)** - Publishing posts to social media platforms


##  Workflow Diagram


![Workflow Diagram](screenshots/workflow-diagram.png)


## ⚙️ How It Works


### Content Generation Flow (Weekly):

1. **Trend Analysis**: Fetches the latest industry trends via API

2. **AI Content Creation**: Uses GPT-4 to generate 3 platform-specific posts (LinkedIn, Twitter/X, Instagram) based on trends

3. **Formatting**: Structures the posts with best posting times and image ideas

4. **Calendar Logging**: Saves all generated posts to the Google Sheets Content Calendar

5. **Human Approval**: Sends an email to the marketing manager for review and approval

6. **Publishing**: Once approved, posts are published to respective platforms via API at optimal times


### Analytics & Reporting Flow (Daily/Weekly):

1. **Data Collection**: Fetches performance metrics (likes, shares, reach) from social media APIs

2. **AI Insights**: Analyzes the data to identify top/lowest performing posts and calculates engagement rates

3. **Weekly Report**: Generates and emails a comprehensive performance report with key insights and recommendations


## 🚀 How to Use


### Prerequisites


- n8n instance (self-hosted or cloud)

- OpenAI API key

- Google Sheets account

- Email account (SMTP)

- API access tokens for target social media platforms (LinkedIn, Twitter/X, Instagram)


### Setup Steps


1. **Import Workflow**

   - Open n8n

   - Click "Import from File"

   - Select `workflow.json`


2. **Configure Triggers**

   - Weekly Content Schedule: Set to run every Monday at 9:00 AM

   - Daily Analytics Schedule: Set to run daily at 10:00 AM


3. **Configure HTTP Requests**

   - Update `Fetch Industry Trends` URL with your trend API (e.g., BuzzSumo, Google Trends)

   - Update `Fetch Social Analytics` URL with your social media analytics API

   - Update `Publish to Social Media` headers with your actual API tokens (`YOUR_SOCIAL_MEDIA_API_TOKEN`)


4. **Configure OpenAI**

   - Add your OpenAI API credentials

   - Model is set to GPT-4


5. **Configure Google Sheets**

   - Connect your Google Sheets account

   - Update `YOUR_GOOGLE_SHEET_ID` with your sheet ID

   - Create a sheet named "ContentCalendar" with columns:

     - platform

     - content

     - image_idea

     - best_time

     - status

     - created_at


6. **Configure Email Notifications**

   - Update email addresses:

     - marketing@yourcompany.com (sender)

     - marketing-manager@yourcompany.com (approvals)

     - marketing-team@yourcompany.com (reports)


7. **Activate Workflow**

   - Toggle the workflow to "Active"


## 🔐 Credentials Required


- **OpenAI API**: OpenAI API key

- **Google Sheets OAuth2**: Google Sheets API access

- **SMTP Email**: Email sending credentials

- **Social Media APIs**: Bearer tokens for LinkedIn, Twitter/X, and Instagram Graph API


## 💡 Use Cases


- **Digital Marketing Agencies**: Automate content creation and reporting for multiple clients

- **In-house Marketing Teams**: Streamline social media workflows and reduce manual posting

- **Content Creators**: Generate consistent, high-quality posts across platforms

- **Social Media Managers**: Get automated insights to improve engagement strategies


## 🔧 Customization Ideas


- Add image generation using DALL-E 3 or Midjourney API

- Implement a Webhook node to receive approval replies via email (IMAP parsing)

- Add A/B testing logic for post variations

- Integrate with Canva API for automated graphic design

- Add competitor analysis tracking

- Create a Slack notification channel for real-time approval requests


## 📝 Notes


- The quality of generated content depends on the trend data provided

- Ensure social media API tokens have the necessary posting permissions

- Adjust the `temperature` parameter in OpenAI nodes to control content creativity (0.7 for creative, 0.4 for analytical)

- Test API rate limits for social media publishing to avoid throttling


## 🐛 Troubleshooting


**Issue**: AI content generation failing

- **Solution**: Verify OpenAI API key and check if the trend data format is valid JSON


**Issue**: Publishing to social media returns 401 Unauthorized

- **Solution**: Check API tokens and ensure they haven't expired; verify required scopes/permissions


**Issue**: Google Sheets not updating

- **Solution**: Verify sheet name matches exactly ("ContentCalendar") and check column mappings


**Issue**: Approval email not received

- **Solution**: Check SMTP credentials and spam folder


## 📄 License


This workflow is provided as-is for educational and commercial use.


## 🤝 Contributing


Feel free to fork, modify, and improve this workflow for your specific needs.


\---


**Created for**: agentic-automation-lab

**Exercise**: 13 - Social Media Automation

**Author**: Koroosh

**Date**: 2026
