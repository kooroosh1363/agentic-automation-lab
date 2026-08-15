# Exercise 9: AI Recruitment Automation System

![Level](https://img.shields.io/badge/Level-Foundation-6C757D)


## Description

An advanced HR automation system that receives job applications via Webhook, uses OpenAI to analyze resumes and score candidates, and routes them through different hiring workflows based on their qualification level.


## Nodes Used

- Webhook (Application Trigger)

- OpenAI (AI Resume Analyzer)

- IF (Top Candidate Check)

- IF (Good Candidate Check)

- Google Calendar (Interview Scheduling)

- Slack (Hiring Team Notification)

- Send Email (Invite/Next Steps/Rejection)

- Google Sheets (HR Database)

- Respond to Webhook


## Workflow Diagram


![Workflow Diagram](screenshots/workflow-diagram.png)


## How It Works

1. Webhook receives a job application (name, email, position, resume text)

2. OpenAI analyzes the resume and returns:

   - Extracted skills, years of experience, education level

   - Technical score, Experience score, Culture fit score

   - Overall score (0-100) and recommendation

3. Based on overall score:

   - Top Candidate (≥85): Schedule interview on Google Calendar + Notify hiring team via Slack + Send interview invite email

   - Good Candidate (60-84): Send "under review" email

   - Not Suitable (<60): Send polite rejection email

4. All application data and AI analysis are saved to Google Sheets (HR Database)

5. Respond to Webhook with the scoring results


## How to Use

1. Import `workflow.json` file in n8n

2. Configure OpenAI, Google Calendar, Slack, Email, and Google Sheets credentials

3. Create a Google Sheet named "Applicants" with required columns

4. Activate the workflow

5. Test with POST request to the Webhook URL


## Credentials Required

- OpenAI API

- Google Calendar API

- Slack API

- SMTP (for sending emails)

- Google Sheets API
