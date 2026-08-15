# Exercise 5: Content Automation - AI-Powered Multi-Channel Publishing

![Level](https://img.shields.io/badge/Level-Foundation-6C757D)


## Description

An automated content marketing system that scrapes daily tech news, uses OpenAI to generate a blog post, creates platform-specific versions (Twitter & LinkedIn), and publishes them across multiple channels.


## Nodes Used

- Schedule Trigger (Daily)

- HTTP Request (Web Scraping)

- OpenAI (Blog Post Generation)

- OpenAI (Twitter Summary)

- OpenAI (LinkedIn Post)

- WordPress (Publish Blog)

- Twitter (Post)

- LinkedIn (Post)

- Google Sheets (Content Log)

- Send Email (Report)


## Workflow Diagram


![Workflow Diagram](screenshots/workflow-diagram.png)


## How It Works

1. Schedule Trigger runs the workflow daily

2. HTTP Request scrapes trending tech news from Hacker News

3. OpenAI generates a 500-word blog post based on the news

4. Two parallel OpenAI nodes create:

   - A 280-character Twitter summary

   - A professional LinkedIn post

5. Content is published to WordPress, Twitter, and LinkedIn

6. All activities are logged in Google Sheets

7. A report email is sent to the manager


## How to Use

1. Import `workflow.json` file in n8n

2. Configure OpenAI, WordPress, Twitter, LinkedIn, Email, and Google Sheets credentials

3. Create a Google Sheet named "ContentLog" with columns: date, topic, blog_status, twitter_status, linkedin_status

4. Activate the workflow


## Credentials Required

- OpenAI API

- WordPress API

- Twitter API

- LinkedIn API

- SMTP (for sending emails)

- Google Sheets API
