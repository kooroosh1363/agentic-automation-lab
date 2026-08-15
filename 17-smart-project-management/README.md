# Smart Project Management with AI

![Level](https://img.shields.io/badge/Level-Intermediate-0D6EFD)


## 📋 Description


An intelligent project management automation system that streamlines task creation, optimizes resource allocation, and provides proactive risk analysis. It uses AI to parse raw requests into structured tasks, assigns them to team members based on skills and current workload, and generates daily health reports to keep project managers informed of bottlenecks and progress.


##  Nodes Used


- **Webhook** - Receives raw task requests from various sources

- **OpenAI GPT-4** - Parses task details and analyzes project health/risks

- **Google Sheets** - Acts as the database for team members and active tasks

- **Code Node** - Implements smart resource allocation and workload balancing logic

- **Slack** - Notifies the team about new task assignments

- **Schedule Trigger** - Triggers daily project health reports

- **Email Send** - Delivers daily analytical reports to the project manager


## 🔄 Workflow Diagram


![Workflow Diagram](screenshots/workflow-diagram.png)


## ⚙️ How It Works


### Phase 1: Task Ingestion & AI Parsing

1. **Webhook Trigger**: Receives a raw, unstructured task request (e.g., from an email, form, or chat).

2. **AI Parsing**: GPT-4 analyzes the text and extracts structured data: Title, Description, Priority, Estimated Hours, Required Skills, and Task Type.


### Phase 2: Smart Resource Allocation

1. **Fetch Workload**: The system retrieves the current workload and skills of all team members from the "TeamMembers" Google Sheet.

2. **Allocation Logic**: The Code Node filters members by required skills and selects the one with the lowest current workload (in hours).

3. **Task Creation**: The task is saved to the "Tasks" sheet with an automatically calculated deadline based on priority.

4. **Team Notification**: A Slack message is sent to the project channel announcing the new assignment.


### Phase 3: Daily Health & Risk Analysis

1. **Scheduled Trigger**: Runs every weekday evening to review all active tasks.

2. **AI Analysis**: GPT-4 analyzes the task data to calculate team velocity, identify at-risk tasks (close to deadline), spot bottlenecks, and generate actionable items for the manager.

3. **Manager Report**: A comprehensive daily health report is emailed to the project manager.


## 🚀 How to Use


### Prerequisites


- n8n instance (self-hosted or cloud)

- OpenAI API key

- Google Sheets account

- Slack workspace

- Email account (SMTP)


### Setup Steps


1. **Import Workflow**

   - Open n8n and import `workflow.json`.


2. **Configure Webhook**

   - Copy the production URL for the `Task Request Webhook`.

   - Use this URL in your frontend forms, Zapier, or testing tools to send JSON payloads containing `request_text` and `requester`.


3. **Configure Google Sheets**

   - Connect your Google Sheets OAuth2 account.

   - Update `YOUR_GOOGLE_SHEET_ID` in all Google Sheets nodes.

   - Create two sheets with the following columns:

     - **"TeamMembers"**: name, email, slack_id, skills (comma-separated), current_hours (number).

     - **"Tasks"**: task_id, title, description, priority, estimated_hours, assigned_to, status, created_at, deadline.


4. **Configure OpenAI**

   - Connect your OpenAI API credentials to both AI nodes.


5. **Configure Slack & Email**

   - Connect your Slack API and update the channel name (default: `#project-updates`).

   - Update `pm-bot@yourcompany.com` and `project-manager@yourcompany.com` with your actual email addresses.


6. **Activate Workflow**

   - Toggle the workflow to "Active".


## 🔐 Credentials Required


- **OpenAI API**: OpenAI API key

- **Google Sheets OAuth2**: Google Sheets API access

- **Slack API**: Slack Bot Token

- **SMTP Email**: Email sending credentials


## 💡 Use Cases


- **Software Development Teams**: Automatically assign bugs and features to developers based on their tech stack and current sprint load.

- **Marketing Agencies**: Distribute content and design tasks to creatives based on their availability.

- **IT Support**: Route incoming support tickets to the right technician automatically.

- **Remote Teams**: Keep distributed teams aligned with automated daily health checks.


##  Customization Ideas


- **Jira/Asana Integration**: Replace Google Sheets with HTTP Request nodes to interact directly with Jira or Asana APIs.

- **Time Tracking**: Integrate with tools like Toggl or Harvest to automatically update the `current_hours` in the TeamMembers sheet.

- **Automated Stand-ups**: Add a morning trigger that asks team members via Slack for their daily updates and feeds them back into the task system.

- **Budget Tracking**: Add fields for hourly rates and calculate the financial burn rate of the project automatically.


##  Notes


- **Workload Balancing**: The current logic assigns tasks to the person with the lowest hours. You can modify the Code Node to implement round-robin or skill-weighted allocation.

- **AI Parsing**: The quality of task creation depends heavily on the clarity of the `request_text`. Encourage users to provide detailed descriptions.


## 🐛 Troubleshooting


**Issue**: Webhook not receiving data

- **Solution**: Ensure the workflow is "Active" and you are using the Production URL.


**Issue**: AI Task Parser failing

- **Solution**: Check the OpenAI API key and ensure the incoming `request_text` is not empty.


**Issue**: No eligible team member found

- **Solution**: Ensure the "TeamMembers" sheet has data and the `skills` column matches the keywords generated by the AI parser.


## 📄 License


This workflow is provided as-is for educational and commercial use.


## 🤝 Contributing


Feel free to fork, modify, and improve this workflow for your specific project management needs.


\---


**Created for**: agentic-automation-lab

**Exercise**: 17 - Smart Project Management with AI

**Author**: Koroosh

**Date**: 2026
