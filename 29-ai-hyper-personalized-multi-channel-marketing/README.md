# 29 - AI Hyper-Personalized Multi-Channel Marketing Campaign

![Level](https://img.shields.io/badge/Level-Advanced-6F42C1)


## Description

This enterprise-oriented n8n workflow implements an intelligent, multi-step drip marketing campaign with hyper-personalization powered by AI. It identifies inactive users who signed up but haven't engaged, generates fully personalized email content (subject line, body, tone) based on each user's behavioral data and demographics, executes a multi-channel outreach sequence (Email → SMS → Sales Handoff), and manages campaign state throughout the customer journey. The workflow includes smart delays, engagement tracking, and automatic escalation to the sales team for high-potential leads who don't respond to automated outreach.


## Nodes Used

- **Schedule**: Triggers daily at 9:00 AM to identify and process inactive new users.

- **PostgreSQL: Fetch Inactive Users**: Queries users who signed up in the last 7 days but haven't engaged (no email opens, clicks, or purchases).

- **OpenAI: Generate Personalized Content**: Creates hyper-personalized email subject lines and body content for each user based on their job title, interests, visited pages, and country. Dynamically adjusts tone (formal vs. friendly).

- **Code: Process AI Output**: Parses AI-generated content and prepares data for email sending and campaign tracking.

- **Gmail: Send Personalized Email**: Sends the AI-crafted personalized email to each user.

- **PostgreSQL: Update Campaign Status**: Updates the user's campaign status to "email_sent" and records the timestamp.

- **Wait 48 Hours**: Pauses the workflow for 48 hours to allow user engagement.

- **PostgreSQL: Check Engagement**: Queries whether the user opened or clicked the email after 48 hours.

- **IF: No Engagement**: Evaluates if the user has not engaged with the email.

- **Twilio: Send SMS Reminder**: Sends a follow-up SMS to users who didn't engage with the email.

- **PostgreSQL: Update to SMS Sent**: Updates campaign status to "sms_sent" after SMS delivery.

- **Wait 5 Days**: Pauses for 5 more days to allow SMS engagement.

- **PostgreSQL: Final Check**: Checks if the user has made a purchase after both email and SMS.

- **PostgreSQL: Mark as SQL**: Updates status to "sales_qualified" for users who haven't converted.

- **Slack: Alert Sales Team**: Notifies the sales team with full user context for manual outreach.


## Workflow Diagram

![Workflow Diagram](./screenshots/workflow-diagram.png)


## How It Works

1. **Daily Trigger & User Identification**: The Schedule node triggers daily. PostgreSQL fetches users who signed up in the last 7 days but show no engagement (no email opens, clicks, or purchases).

2. **AI-Powered Personalization**: For each user, OpenAI generates:

   - A compelling, curiosity-inducing subject line (max 50 characters)

   - A fully personalized email body (150-200 words) addressing their specific interests or pain points

   - Appropriate tone selection (formal for executives, friendly for students)

3. **Email Delivery**: The personalized email is sent via Gmail, and the user's campaign status is updated to "email_sent" with a timestamp.

4. **Smart Delay & Engagement Check**: The workflow waits 48 hours, then checks if the user opened or clicked the email.

5. **SMS Follow-up**: If no engagement, a follow-up SMS is sent via Twilio with a direct link, and status updates to "sms_sent".

6. **Final Evaluation**: After 5 more days, the system checks if the user has made a purchase.

7. **Sales Handoff**: Users who haven't converted after both automated channels are marked as "sales_qualified" (SQL), and the sales team receives a Slack alert with complete user context for personal outreach.


## How to Use

1. Import the `workflow.json` file into your n8n instance.

2. Set up the PostgreSQL database with the `users` table and appropriate tracking fields.

3. Configure all required credentials (PostgreSQL, OpenAI, Gmail, Twilio, Slack).

4. Ensure email tracking (opens/clicks) is properly integrated with your email provider or tracked via webhooks.

5. Test the workflow with a small batch of users to verify AI content generation and multi-channel delivery.

6. Monitor the `campaign_status` field to track user progression through the funnel.

7. Activate the workflow for daily automated execution.


## Prerequisites

- A running instance of n8n (Cloud or Self-hosted).

- PostgreSQL database with user data and campaign tracking fields.

- OpenAI API key (GPT-4o recommended for best personalization quality).

- Gmail account with OAuth2 credentials for sending personalized emails.

- Twilio account with an active phone number for SMS delivery.

- Slack workspace with a dedicated sales team channel.

- Email tracking mechanism (either via email provider API or custom webhook integration).


## Setup Steps

1. **PostgreSQL Setup**: Create the `users` table with campaign tracking fields:

   ```sql

   CREATE TABLE users (

       user_id VARCHAR(50) PRIMARY KEY,

       name VARCHAR(100),

       email VARCHAR(100),

       phone VARCHAR(20),

       country VARCHAR(50),

       job_title VARCHAR(100),

       pages_visited TEXT,

       interests TEXT,

       signup_date TIMESTAMP DEFAULT NOW(),

       last_engagement_date TIMESTAMP,

       campaign_status VARCHAR(50) DEFAULT 'new',

       email_sent_at TIMESTAMP,

       email_opened BOOLEAN DEFAULT false,

       email_clicked BOOLEAN DEFAULT false,

       sms_sent_at TIMESTAMP,

       sales_qualified_at TIMESTAMP,

       has_purchased BOOLEAN DEFAULT false

   );

   ```

2. **Credentials**: Add your PostgreSQL, OpenAI, Gmail (OAuth2), Twilio, and Slack credentials in n8n.

3. **Node Configuration**:

   - Update the PostgreSQL queries to match your actual schema and field names.

   - Customize the OpenAI system prompt to reflect your brand voice and product specifics.

   - Update the Gmail node with your actual sender information and signature.

   - Update the Twilio node with your verified phone number and SMS template.

   - Update the Slack node with your sales team channel ID.

4. **Email Tracking Integration**: Set up webhooks or API integrations to track email opens and clicks. Update the `email_opened` and `email_clicked` fields via a separate workflow or external service.

5. **Activation**: Save and activate the workflow.


## Credentials Required

- **PostgreSQL API**: Host, Database, User, Password.

- **OpenAI API**: API Key for GPT-4o access.

- **Gmail OAuth2**: For sending personalized emails.

- **Twilio API**: Account SID, Auth Token, and active phone number.

- **Slack API**: Bot User OAuth Token with `chat:write` permissions.


## Use Cases

- **SaaS Companies**: Re-engaging free trial users who haven't converted to paid plans.

- **E-learning Platforms**: Guiding new students through onboarding and encouraging course purchases.

- **E-commerce**: Recovering abandoned carts and encouraging first-time purchases.

- **B2B Services**: Nurturing leads who signed up for demos or whitepapers but haven't engaged further.

- **Mobile Apps**: Re-engaging users who downloaded but haven't completed key actions.


## Customization Ideas

- **A/B Testing**: Implement logic to test different AI prompts, subject line styles, or call-to-action approaches and measure conversion rates.

- **WhatsApp Integration**: Add WhatsApp Business API as an additional channel for higher engagement rates in certain markets.

- **Dynamic Discounts**: Generate unique discount codes for each user and include them in personalized messages.

- **Behavioral Triggers**: Add more sophisticated triggers based on specific user actions (e.g., visited pricing page but didn't purchase).

- **Multi-Language Support**: Detect user's country/language and generate content in their preferred language.

- **CRM Integration**: Replace PostgreSQL with HubSpot, Salesforce, or Pipedrive for more advanced lead management and reporting.

- **Predictive Scoring**: Add AI-based lead scoring to prioritize which users receive SMS vs. which go directly to sales.

- **Video Personalization**: Integrate with video generation APIs to create personalized video messages for high-value leads.


## Notes

- **Email Tracking**: The workflow assumes email opens and clicks are tracked externally and updated in the database. You'll need to integrate with your email provider's webhook system or use a service like SendGrid/Mailgun that provides tracking APIs.

- **Wait Node Limitations**: The Wait node pauses the workflow execution. For production use with thousands of users, consider using a state-based approach where a separate Schedule trigger checks campaign status and progresses users through the funnel.

- **AI Cost Management**: Generating personalized content for thousands of users daily can incur significant OpenAI API costs. Consider batching, caching, or using GPT-3.5 for initial content generation.

- **SMS Compliance**: Ensure SMS messages comply with local regulations (TCPA, GDPR, etc.) and include opt-out instructions.

- **Tone Consistency**: Test the AI's tone selection thoroughly to ensure it aligns with your brand voice across different user segments.


## Troubleshooting

- **OpenAI Returns Non-JSON**: Ensure the system prompt strictly enforces JSON output and set `responseFormat: json_object` in the OpenAI node. Lower the temperature to 0.7 for more consistent results.

- **Email Tracking Not Updating**: Verify that your email tracking webhooks are properly configured and updating the `email_opened` and `email_clicked` fields in the database.

- **SMS Not Sending**: Check that the phone numbers are in E.164 format (e.g., +1234567890) and that your Twilio account has sufficient balance.

- **Wait Node Timeout**: If n8n restarts during a Wait period, the workflow may not resume. For critical campaigns, consider using external scheduling (e.g., cron jobs that trigger separate workflows for each campaign stage).

- **Sales Alerts Too Frequent**: If too many users are reaching the sales handoff stage, consider adjusting the engagement thresholds or adding more nurturing steps before escalation.

- **AI Content Quality Issues**: If generated content doesn't match your brand voice, refine the system prompt with more specific examples and tone guidelines.


## License

This project is licensed under the MIT License
