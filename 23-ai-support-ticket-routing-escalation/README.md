# 23 - AI Support Ticket Routing & Escalation

![Level](https://img.shields.io/badge/Level-Advanced-6F42C1)


## Description

This enterprise-oriented n8n workflow automates the triage and routing of B2B SaaS or MSP support tickets. Upon receiving a ticket, it uses OpenAI to analyze the content and extract multi-dimensional data: Sentiment, Urgency, Category, and a Summary. It then enriches this data by querying a PostgreSQL database to determine the customer's tier (e.g., VIP or Standard). Based on a dynamic decision matrix (e.g., VIP + Critical Urgency), the workflow routes the ticket: sending an immediate Slack escalation alert to the on-call engineer and creating a high-priority issue in Jira. Standard tickets are routed directly to Jira with normal priority.


## Nodes Used

- **Webhook**: Receives incoming support ticket data (subject, message, customer email).

- **OpenAI**: Analyzes the ticket text using a structured JSON prompt to extract sentiment, urgency, category, and summary.

- **PostgreSQL**: Executes a query to fetch the `client_tier` based on the customer's email address.

- **Switch**: Evaluates complex, multi-condition routing logic (e.g., Urgency == 'critical' AND Tier == 'VIP').

- **Slack**: Sends an urgent, formatted alert with `@here` mention to the IT escalation channel for critical VIP issues.

- **Jira**: Dynamically creates a support issue, mapping the priority and labels based on the AI analysis and client tier.


## Workflow Diagram

![Workflow Diagram](./screenshots/workflow-diagram.png)


## How It Works

1. **Ingestion**: The workflow is triggered via a Webhook receiving a JSON payload with `subject`, `message`, and `email`.

2. **AI Triage**: The OpenAI node processes the text and returns a strict JSON object containing the extracted metadata.

3. **Data Enrichment**: The PostgreSQL node queries the `clients` table to append the `client_tier` to the workflow data.

4. **Dynamic Routing**: The Switch node evaluates the combined data. If the conditions for a "Critical VIP" are met, it triggers both the Slack alert and Jira creation (Output 0). Otherwise, it defaults to standard Jira creation (Output 1).

5. **Action**: The Jira node creates the ticket with dynamically assigned priority (`Highest` for VIP/Critical, `Medium` otherwise) and relevant labels.


## How to Use

1. Import the `workflow.json` file into your n8n instance.

2. Ensure your PostgreSQL database has the `clients` table with sample data.

3. Configure credentials for OpenAI, PostgreSQL, Slack, and Jira.

4. Test the workflow by sending a POST request to the Webhook URL with a mock ticket payload.

5. Activate the workflow for production use.


## Prerequisites

- A running instance of n8n (Cloud or Self-hosted).

- An active OpenAI API key.

- A PostgreSQL database with client data.

- A Jira Cloud or Server instance with a "Support" project.

- A Slack workspace with a dedicated escalation channel.


## Setup Steps

1. **PostgreSQL Setup**: Create a `clients` table and insert sample data:

   ```sql

   CREATE TABLE clients (

       email VARCHAR(255) PRIMARY KEY,

       client_tier VARCHAR(50)

   );

   INSERT INTO clients (email, client_tier) VALUES ('vip@example.com', 'VIP'), ('standard@example.com', 'Standard');

Credentials: Add your OpenAI, PostgreSQL, Slack, and Jira API credentials in n8n.

Node Configuration:

Update the Jira node with your actual Project Key (e.g., "SUP") and Issue Type.

Update the Slack node with your specific Escalation Channel ID.

Activation: Save and activate the workflow to generate the production Webhook URL.

Credentials Required

OpenAI API: For GPT-4o (or similar) text analysis.

PostgreSQL API: Host, Database, User, and Password.

Slack API: Bot User OAuth Token with chat:write permissions.

Jira API: Email/Username and API Token (or Basic Auth).

Use Cases

B2B SaaS Companies: Ensuring enterprise clients receive immediate attention for critical issues.

Managed Service Providers (MSPs): Automating IT helpdesk triage to reduce Mean Time to Resolution (MTTR).

E-commerce Platforms: Prioritizing high-value merchant support requests over standard user inquiries.

Customization Ideas

Auto-Responder: Add an SMTP/Gmail node to send an immediate, personalized acknowledgment email to the customer based on their tier and urgency.

CRM Integration: Replace the PostgreSQL lookup with a HubSpot or Salesforce node to fetch the client's lifetime value (LTV) for routing decisions.

Human-in-the-Loop: Add an approval node for edge cases where the AI confidence score is low or the sentiment is highly negative.

Zendesk/Intercom: Replace the Webhook trigger with native nodes for popular helpdesk software.

Notes

The OpenAI node is configured with responseFormat: json_object. Ensure the system prompt strictly enforces this to prevent parsing errors downstream.

The Switch node uses $node['Switch'].context.outputIndex in the Jira node to dynamically set the priority. This is a powerful pattern for complex branching.

Troubleshooting

JSON Parse Error: If the OpenAI node returns non-JSON text, the JSON.parse() expressions will fail. Ensure the model temperature is low (e.g., 0.1) and the system prompt is strict.

PostgreSQL Returns Empty: Verify that the email address in the Webhook payload exactly matches the format in the database (case-sensitive).

Jira Creation Fails: Check that the priority and labels fields are correctly configured and allowed in your Jira project's field configuration scheme.

License

This project is licensed under the MIT License.
