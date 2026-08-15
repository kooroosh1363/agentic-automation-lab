# 26 - AI Customer Churn Prediction & Multi-Channel Retention

![Level](https://img.shields.io/badge/Level-Advanced-6F42C1)


## Description

This is an enterprise-oriented, multi-step n8n workflow designed to explore **Customer Churn Prediction and Automated Retention**. Built as a reference scenario for a multi-branch beauty clinic chain, it analyzes customer behavioral data daily, uses AI to estimate churn probability, segments customers by risk level, and coordinates personalized retention campaigns across Email, SMS, and WhatsApp. The workflow includes 7-day escalation logic, feedback collection, and ROI-tracking fields. Any retention or revenue impact must be measured through a real pilot; this repository does not claim a predetermined percentage improvement.


## Nodes Used

- **Schedule**: Triggers the workflow daily at 8:00 AM to analyze all active customers.

- **PostgreSQL: Fetch Customers**: Extracts customer interaction data (visit history, spending patterns, complaints, survey scores) from the central database.

- **Code: Feature Engineering**: Calculates behavioral metrics (days since last visit, frequency, recency) and prepares AI-optimized prompts for each customer.

- **OpenAI: Churn Prediction**: Executes a predictive AI model to calculate churn probability (0-100%), determine risk level (High/Medium/Low), and generate personalized retention offers based on individual customer history.

- **Switch: Risk Routing**: Routes customers to different retention strategies based on their AI-assessed risk level.

- **Gmail: Retention Email**: Sends hyper-personalized email campaigns with exclusive offers to high and medium-risk customers.

- **Twilio: SMS Alert**: Sends follow-up SMS messages with booking links to reinforce the retention offer.

- **PostgreSQL: Log Prediction**: Records all predictions, offers sent, and channels used for ROI tracking and model improvement.

- **IF: 7-Day Response Check**: Evaluates whether the customer responded or booked within 7 days of the initial outreach.

- **Slack: Manager Escalation**: Alerts branch managers when high-risk customers fail to respond, triggering direct phone call interventions.


## Workflow Diagram

![Workflow Diagram](./screenshots/workflow-diagram.png)


## How It Works

1. **Daily Trigger**: The Schedule node initiates the workflow every morning at 8:00 AM.

2. **Data Extraction**: PostgreSQL fetches all active customers with their interaction history (last visit date, visit count, average spend, complaints, survey scores).

3. **Feature Engineering**: The Code node calculates key behavioral metrics and constructs personalized prompts for AI analysis.

4. **AI Prediction**: OpenAI analyzes each customer's data and outputs:

   - Churn probability (0-100%)

   - Risk level (High >70%, Medium 40-70%, Low <40%)

   - Personalized retention offer (e.g., "30% off your favorite facial treatment")

   - Reasoning (1-sentence explanation of the risk factors)

5. **Risk-Based Routing**: The Switch node directs customers to appropriate retention paths:

   - **High Risk**: Immediate multi-channel outreach (Email + SMS)

   - **Medium Risk**: Standard email campaign

   - **Low Risk**: Logged for monitoring only

6. **Multi-Channel Execution**: High and medium-risk customers receive personalized emails followed by SMS reminders with booking links.

7. **Prediction Logging**: All predictions and actions are logged in PostgreSQL for ROI calculation and model refinement.

8. **Escalation Logic**: After 7 days, the system checks if the customer responded or booked. If not, and the risk level is High, a Slack alert is sent to the branch manager for direct phone intervention.

9. **Feedback Loop**: Customer responses (booking, redemption, no response) are tracked to continuously improve the AI model's accuracy.


## How to Use

1. Import the `workflow.json` file into your n8n instance.

2. Set up the PostgreSQL database with customer interaction data and prediction logging tables.

3. Configure all required credentials (PostgreSQL, OpenAI, Gmail, Twilio, Slack).

4. Test the workflow with a small batch of customers to verify AI predictions and message delivery.

5. Monitor the `churn_predictions` table to ensure data is being logged correctly.

6. Adjust the risk thresholds in the Switch node based on your business needs.

7. Activate the workflow for daily automated execution.


## Prerequisites

- A running instance of n8n (Cloud or Self-hosted).

- PostgreSQL database with customer interaction data.

- OpenAI API key (GPT-4o recommended for best results).

- Gmail account with SMTP access or OAuth2 credentials.

- Twilio account with an active phone number for SMS.

- Slack workspace with a dedicated manager escalation channel.


## Setup Steps

1. **PostgreSQL Setup**: Create the required tables:

   ```sql

   CREATE TABLE customer_interactions (

       customer_id VARCHAR(50) PRIMARY KEY,

       name VARCHAR(100),

       email VARCHAR(100),

       phone VARCHAR(20),

       last_visit_date DATE,

       visit_count INT,

       avg_spend DECIMAL(10,2),

       complaint_count INT,

       survey_score INT,

       is_active BOOLEAN DEFAULT true

   );


   CREATE TABLE churn_predictions (

       customer_id VARCHAR(50),

       prediction_date DATE,

       churn_probability INT,

       risk_level VARCHAR(20),

       offer_sent TEXT,

       channels_used VARCHAR(100),

       PRIMARY KEY (customer_id, prediction_date)

   );
2. **Credentials**: Add your PostgreSQL, OpenAI, Gmail (OAuth2), Twilio, and Slack credentials in n8n.

3. **Node Configuration**:

   - Update the PostgreSQL queries to match your actual schema.

   - Customize the OpenAI system prompt to reflect your business context and offer types.

   - Update Gmail and Twilio nodes with your actual sender information and message templates.

   - Adjust the risk thresholds in the Switch node (currently: High >70%, Medium 40-70%).

4. **Escalation Timing**: The 7-day response check can be adjusted by modifying the IF node's timing logic or by implementing a separate Schedule trigger.

5. **Activation**: Save and activate the workflow for daily automated execution.


## Credentials Required

- **PostgreSQL API**: Host, Database, User, Password.

- **OpenAI API**: API Key for GPT-4o access.

- **Gmail OAuth2**: For sending personalized retention emails.

- **Twilio API**: Account SID, Auth Token, and active phone number.

- **Slack API**: Bot User OAuth Token with `chat:write` permissions.


## Use Cases

- **Beauty Clinics & Spas**: Predicting and preventing customer churn through personalized retention offers.

- **Fitness Centers & Gyms**: Re-engaging members who haven't visited in weeks.

- **Healthcare Practices**: Reminding patients to schedule follow-up appointments.

- **Subscription Services**: Reducing cancellation rates with targeted incentives.

- **Real Estate Agencies**: Re-engaging past clients for referrals or new transactions.


## Customization Ideas

- **WhatsApp Integration**: Add HTTP Request nodes to send WhatsApp messages via Twilio or Meta Business API for higher engagement rates.

- **Dynamic Offer Generation**: Use AI to generate unique discount codes for each customer and track redemption rates.

- **A/B Testing**: Implement logic to test different offer types (discount vs. free add-on vs. loyalty points) and measure effectiveness.

- **Predictive LTV**: Extend the AI model to predict Customer Lifetime Value (CLV) and prioritize retention efforts on high-value customers.

- **Automated Booking**: Integrate with calendar APIs (Google Calendar, Calendly) to allow customers to book directly from the SMS/Email link.

- **Sentiment Analysis**: Add sentiment analysis to survey responses to identify at-risk customers before they churn.


## Notes

- **AI Model Accuracy**: The churn prediction accuracy depends on the quality and quantity of historical data. Start with a 3-6 month data minimum for reliable predictions.

- **Cost Management**: Running AI predictions on thousands of customers daily can incur significant OpenAI API costs. Consider batching, caching, or using cheaper models (GPT-3.5) for initial screening.

- **Message Frequency**: Be cautious not to overwhelm customers with too many messages. The current workflow sends Email + SMS for high-risk customers, which is generally acceptable.

- **Opt-Out Compliance**: Ensure all SMS and Email messages include opt-out instructions to comply with GDPR, CAN-SPAM, and other regulations.

- **Escalation Timing**: The 7-day escalation window is configurable. For urgent industries (healthcare), consider reducing to 3-4 days.


## Troubleshooting

- **OpenAI JSON Parse Errors**: If the AI returns non-JSON output, ensure the system prompt strictly enforces JSON format and set `responseFormat: json_object` in the OpenAI node.

- **PostgreSQL Query Failures**: Verify that all column names in the queries match your actual database schema. Check data types (dates, decimals, booleans).

- **Email/SMS Not Sending**: Check that credentials are correctly configured and that sender phone numbers/emails are verified in Twilio/Gmail.

- **Escalation Not Triggering**: The 7-day check requires a separate mechanism (e.g., a second Schedule trigger that runs daily and queries the `churn_predictions` table for records older than 7 days with no response).

- **High API Costs**: If OpenAI costs are prohibitive, consider: (1) Running predictions weekly instead of daily, (2) Using GPT-3.5 for initial screening, (3) Implementing a rule-based pre-filter to only send high-potential churn candidates to AI.


## License

This project is licensed under the MIT License.
