# Smart Event & Conference Management

![Level](https://img.shields.io/badge/Level-Intermediate-0D6EFD)


## 📋 Description


A comprehensive event and conference management system that automates the entire attendee journey. It handles smart registration, automated ticketing, scheduled reminders, event-day check-ins, and post-event feedback collection with AI-powered sentiment analysis to generate actionable insights for organizers.


## 🔧 Nodes Used


- **Webhook** - Handles registration, check-in, and feedback submissions

- **Code Node** - Generates ticket IDs and QR code payloads

- **Google Sheets** - Acts as the database for registrations and feedback logs

- **Email Send** - Sends tickets, reminders, and feedback requests

- **Wait Node** - Manages time-delayed pre-event reminders

- **Schedule Trigger** - Triggers post-event feedback emails

- **OpenAI GPT-4** - Analyzes feedback sentiment and extracts key themes


## 🔄 Workflow Diagram


![Workflow Diagram](screenshots/workflow-diagram.png)


## ⚙️ How It Works


### Phase 1: Registration & Ticketing

1. **Webhook Trigger**: Receives attendee data from the registration form.

2. **Ticket Generation**: Code node creates a unique Ticket ID and a check-in URL payload.

3. **Database Logging**: Saves attendee details to the "Registrations" Google Sheet.

4. **Ticket Email**: Sends a confirmation email with the Ticket ID and event details.


### Phase 2: Pre-Event Reminders

1. **7-Day Reminder**: Automatically sent one week before the event.

2. **1-Day Reminder**: Automatically sent the day before the event with final instructions.


### Phase 3: Event Day Check-in

1. **Check-in Webhook**: Triggered when the attendee's QR code/Ticket ID is scanned at the venue.

2. **Attendance Update**: Updates the "Registrations" sheet to mark the attendee as "attended" with a timestamp.


### Phase 4: Post-Event Feedback & AI Analysis

1. **Scheduled Trigger**: Runs after the event ends to fetch all registered attendees.

2. **Feedback Request**: Sends an email asking for feedback and a rating.

3. **Feedback Webhook**: Receives the submitted feedback.

4. **AI Analysis**: GPT-4 analyzes the text feedback to determine sentiment, key themes, and an overall score.

5. **Logging**: Saves the analyzed feedback to the "FeedbackLog" sheet.


## 🚀 How to Use


### Prerequisites


- n8n instance (self-hosted or cloud)

- Google Sheets account

- Email account (SMTP)

- OpenAI API key


### Setup Steps


1. **Import Workflow**

   - Open n8n and import `workflow.json`.


2. **Configure Webhooks**

   - Copy the production URLs for `Registration Webhook`, `Check-in Webhook`, and `Feedback Webhook`.

   - Integrate these URLs into your frontend forms or QR code scanners.


3. **Configure Google Sheets**

   - Connect your Google Sheets OAuth2 account.

   - Update `YOUR_GOOGLE_SHEET_ID` in all Google Sheets nodes.

   - Create two sheets with the following columns:

     - **"Registrations"**: ticket_id, full_name, email, phone, company, interests, registration_date, status, attended, feedback_submitted, check_in_time.

     - **"FeedbackLog"**: ticket_id, rating, feedback_text, sentiment, overall_score, submitted_at.


4. **Configure Email Notifications**

   - Update `events@yourcompany.com` with your actual sender email.

   - Replace placeholder text like `[Event Name]`, `[Event Date]`, `[Event Location]`, and `[Feedback Link]` with your actual event details.


5. **Configure OpenAI**

   - Connect your OpenAI API credentials to the "AI Analyze Feedback" node.


6. **Activate Workflow**

   - Toggle the workflow to "Active" to enable the Webhooks and Wait nodes.


## 🔐 Credentials Required


- **Google Sheets OAuth2**: Google Sheets API access

- **SMTP Email**: Email sending credentials

- **OpenAI API**: OpenAI API key


##  Use Cases


- **Corporate Conferences**: Manage large-scale professional events and track attendance.

- **Workshops & Seminars**: Automate ticketing and post-training feedback.

- **Webinars & Virtual Events**: Handle digital check-ins and gather participant insights.

- **Ticketed Meetups**: Streamline the registration and entry process.


## 🔧 Customization Ideas


- **PDF Ticket Generation**: Integrate an HTML-to-PDF API to attach a visual ticket with a scannable QR code to the confirmation email.

- **Smart Networking**: Use AI to match attendees with similar interests and send introduction emails before the event.

- **Payment Gateway**: Add an HTTP Request node to a payment provider (e.g., Stripe) to require payment before finalizing registration.

- **SMS Reminders**: Integrate Twilio or a local SMS gateway for higher open rates on reminders.

- **Certificate Generation**: Automatically generate and email a PDF certificate of attendance for those marked as "attended".


##  Notes


- **Wait Nodes**: Ensure your n8n instance is configured to handle long-running executions. For self-hosted n8n, ensure the `EXECUTIONS_MODE` is set to support waiting webhooks.

- **Placeholders**: Don't forget to replace all bracketed placeholders (e.g., `[Event Name]`) in the email nodes before activating the workflow.

- **Check-in Logic**: The check-in webhook expects a `ticket_id` in the JSON payload. Ensure your scanner or frontend app sends this correctly.


##  Troubleshooting


**Issue**: Wait nodes not resuming

- **Solution**: Ensure n8n is running in production mode with a valid webhook URL configured in the environment variables.


**Issue**: Google Sheets not updating

- **Solution**: Verify the sheet name matches exactly ("Registrations" or "FeedbackLog") and check the column mappings.


**Issue**: AI feedback analysis failing

- **Solution**: Check your OpenAI API key and ensure the feedback text is not empty.


##  License


This workflow is provided as-is for educational and commercial use.


## 🤝 Contributing


Feel free to fork, modify, and improve this workflow for your specific event management needs.


\---


**Created for**: agentic-automation-lab

**Exercise**: 15 - Smart Event & Conference Management

**Author**: Koroosh

**Date**: 2026
